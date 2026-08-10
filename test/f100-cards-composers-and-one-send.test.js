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

  /* ---- AND THE COPY CAME BACK, CLAMPED ----
     The wording was taken off the card because the document beside it already
     showed the change. True, and what was left read as a filing reference: an
     id, a clause number and four buttons, nothing about the thing being
     decided. It is back on the design's call (10 Aug 2026) as two clamped
     lines — a summary you skim down the column, not a place to read a clause.
     The document is still where the wording is read in its surroundings, and
     it is still one click away. */
  test('the card says what is being asked for, in two clamped lines', async () => {
    const p = await page();
    assert.ok(p.$$('#rl-changes .rl-card').length, 'there is a card to look at');
    const diff = p.$('#rl-changes .rl-card-diff');
    assert.ok(diff, 'the card carries the delta');
    assert.ok(diff.textContent.includes('forty-five'), 'and it is the real proposal');
    const css = p.win.document.getElementById('redline-layout-css').textContent;
    assert.match(css, /\.rl-card-diff\{[^}]*-webkit-line-clamp:2/,
      'two lines — a summary, never a second copy of the clause');
  });

  test('the document still carries it in full', async () => {
    const p = await page();
    assert.ok(p.$$('#rl-doc ins, #rl-doc del').length,
      'the clause reads with its marks, in its own surroundings');
  });

  test('a draft arrives shut, like every other card', async () => {
    const p = await page();
    const card = p.$('#rl-changes .rl-card');
    assert.equal(card.getAttribute('data-rl-open'), '0',
      'a card is open only because somebody opened it');
    assert.ok(card.querySelector('[data-rl-caret]'), 'and the caret says there is more under it');
  });

  test('once sent it still reads as sent, on the part that never folds', async () => {
    const p = await page();
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    const card = p.$('#rl-changes .rl-card');
    assert.equal(card.getAttribute('data-rl-open'), '0');
    assert.ok(card.classList.contains('rl-card-shut'), 'the body is folded away');
    assert.match(card.querySelector('.rl-badge').textContent.trim(), /^Sent$/,
      'the fact lives on the part that never folds');
    assert.ok(card.querySelector('.rl-card-meta'), 'and so does the clause it is on');
  });

  test('pressing its head opens it AND takes you to the change', async () => {
    const p = await page();
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    p.$('#rl-changes .rl-card .rl-card-head').click();
    p.again();
    const card = p.$('#rl-changes .rl-card');
    assert.equal(card.getAttribute('data-rl-open'), '1', 'one press, not two');
    assert.ok(card.querySelector('button.rl-sent'), 'the amber Sent is back where the Send was');
  });

  test('pressing it again folds it, and the caret does the same', async () => {
    const p = await page();
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    const head = () => p.$('#rl-changes .rl-card .rl-card-head');
    head().click(); p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '1');
    head().click(); p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0',
      'the same press closes it — that is the whole rule');
    /* The caret is the affordance for the same act, and it does NOT drag the
       document: a reader tidying a column is not asking to be taken anywhere. */
    p.$('#rl-changes [data-rl-caret]').click(); p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '1');
    p.$('#rl-changes [data-rl-caret]').click(); p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0');
  });

  test('a hand-closed card stays closed through a repaint', async () => {
    const p = await page();
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    const head = () => p.$('#rl-changes .rl-card .rl-card-head');
    head().click(); p.again();
    head().click();
    p.again(); p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0',
      'a preference the next paint forgets is not a preference');
  });

  /* ---------- the follow-up defect, reported from a live session ----------
     "After send the cards are not collapsing." They were. What had happened is
     that the reader pressed the sent card to check it had gone — the most
     natural move there is — and the open/shut choice was remembered against the
     ID, forever. So that card never folded again through every later state
     change, and the feature read as broken.

     The answer at the time was to key the choice on the card's VERBS, so a
     choice lapsed when the card became a different kind of card. That whole
     mechanism is gone (10 Aug 2026). It existed to stop an automatic default
     being overridden by a stale choice — and there is no automatic default any
     more. A card is shut until a reader opens it, and pressing it again shuts
     it, so "the cards are not collapsing" cannot happen: the press that opened
     one is the press that closes it.

     The dangerous half of the old behaviour is gone with it. Accept and Reject
     can no longer be hidden behind a preference expressed about a different
     card state, because a preference is never carried across a state — it is
     simply what the reader last did to this card. */
  test('a choice is the reader\'s last press, whatever the card became', () => {
    const w = buildWorld({ negotiationView: true });
    const { rlCardIsOpen, rlCardSetOpen, rlCardStateKey } = w.win;
    const SENT = ['<button data-rl-edit="c1">Edit</button>',
      '<button data-rl-sent="CHG-1" disabled>Sent</button>'];
    const DRAFT = ['<button data-rl-edit="c1">Edit</button>',
      '<button data-rl-retract="CHG-1">Retract</button>',
      '<button data-rl-send="CHG-1">Send</button>'];
    const ch = { id: 'CHG-1' };

    assert.equal(rlCardIsOpen(ch, SENT), false, 'shut until somebody opens it');
    rlCardSetOpen('CHG-1', true, rlCardStateKey(SENT));
    assert.equal(rlCardIsOpen(ch, SENT), true, 'opened');
    /* AND IT DOES NOT LAPSE UNDERNEATH THE READER. The card changing state —
       a draft becoming a sent ask, an ask coming back answered — must not fold
       a card the reader is working in. */
    assert.equal(rlCardIsOpen(ch, DRAFT), true,
      'the card changing shape is not the reader closing it');
    rlCardSetOpen('CHG-1', false, rlCardStateKey(DRAFT));
    assert.equal(rlCardIsOpen(ch, SENT), false, 'and shutting it shuts it, in every state');
  });

  test('nothing re-opens a card the reader has closed', () => {
    /* The old rule did: a shut card carrying Accept and Reject was forced open
       again, so that a live control could not hide behind a stale preference.
       It is not needed now — a reader who closes a card closed the card they
       could see, verbs and all — and it is the behaviour that was reported as
       wrong ("you click again and they disappear"). */
    const w = buildWorld({ negotiationView: true });
    const { rlCardIsOpen, rlCardSetOpen, rlCardStateKey } = w.win;
    const MINE = ['<button data-rl-send="CHG-9">Send</button>'];
    const THEIRS = ['<button data-nego-accept="CHG-9">Accept</button>',
      '<button data-nego-reject="CHG-9">Reject</button>'];
    const ch = { id: 'CHG-9' };
    rlCardSetOpen('CHG-9', false, rlCardStateKey(MINE));
    assert.equal(rlCardIsOpen(ch, MINE), false, 'shut, as asked');
    assert.equal(rlCardIsOpen(ch, THEIRS), false, 'and it stays shut, as asked');
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
    /* send → shut → press → open → press → shut. The original report was "after
       send the cards are not collapsing", and the answer then was to make a
       remembered choice lapse when the card changed state. The answer now is
       simpler and is what was asked for on 10 Aug 2026: the press that opened
       a card is the press that closes it, so there is no state to be stuck in. */
    const p = await page();
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    const head = () => p.$('#rl-changes .rl-card .rl-card-head');
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0', 'shut on send');

    head().click(); p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '1', 'a press opens it');

    head().click(); p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0',
      'and the same press puts it back');

    /* And the caret, which is the same act with an affordance on it. */
    p.$('#rl-changes [data-rl-caret]').click(); p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '1');
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
      /* the placeholder is a dictionary key now — the reader sees it in their
         own language; what this test is about is that it is a TEXTAREA */
      ['js/views/negotiation.js', /<textarea class="chat-field"[^>]*id="nego-ti-\$\{_ne\(ch\.id\)\}"[^>]*placeholder="\$\{i18t\('ng_reply_on_change'\)\}/, 'reply on a change'],
      /* Was the Discussion column's starter composer. That column is gone (10
         Aug 2026) and the conversation is a block on the change's own card —
         same requirement, new home. */
      ['js/views/negotiation.js', /<textarea class="chat-field rl-cnote-in"[^>]*id="nego-ti-/, 'a note on the change\'s card'],
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

/* ============================================================ */
describe('F100d — a second batch of asks can still be sent', () => {
  /* Reported from Counterparty View: two drafts on the table, Send pressed,
     and "It is already their turn" — with nothing sent, and no way to send
     them for the rest of the negotiation unless the owner happened to move
     first.

     The turn and the send were one fact. `turn` is whose move it is; `turnAt`
     is when work last left the desk, and it is the only thing negoUnsentAsks
     measures against. Refusing to act because the turn was already theirs left
     the drafts unsent AND said nothing about them. */
  const world = () => buildWorld({ negotiationView: true });

  const withAsks = async (win, side, n) => {
    const c = supplyContract();
    win.negoInit(c);
    for (let i = 0; i < n; i++)
      await win.negoFileProposal(c, win.negoResolvedText(c) + `\nUndertaking number ${i + 1}.`,
        { side, author: side === 'owner' ? 'Young' : 'Erik' });
    return c;
  };
  /* The counterparty only ever has asks after a round has reached them: a
     change of theirs is on our record because it was sent to us. So their side
     of this starts where it really starts — the owner has handed over once. */
  const afterFirstRound = async (win) => {
    const c = await withAsks(win, 'owner', 1);
    win.negoHandOver(c, { to: 'counterparty', by: 'Young' });
    return c;
  };

  test('THE FIX: the counterparty can send again after handing back', async () => {
    const win = world().win;
    const c = await afterFirstRound(win);
    /* Round one: they raise an ask of their own and hand back. */
    await win.negoFileProposal(c, win.negoResolvedText(c) + '\nA counter on the cap.',
      { side: 'counterparty', author: 'Erik' });
    assert.ok(win.negoHandOver(c, { to: 'owner', by: 'Erik' }));
    assert.equal(win.negoTurn(c), 'owner');
    assert.equal(win.negoUnsentAsks(c, 'counterparty').length, 0, 'that batch has gone');

    /* Then they think of another one, while it is still the owner's turn. */
    await win.negoFileProposal(c, win.negoResolvedText(c) + '\nAnd one more on insurance.',
      { side: 'counterparty', author: 'Erik' });
    assert.equal(win.negoUnsentAsks(c, 'counterparty').length, 1, 'unsent, and waiting');

    const out = win.negoHandOver(c, { to: 'owner', by: 'Erik' });
    assert.ok(out, 'THE FIX: the send happens rather than being refused');
    assert.equal(out.moved, false, 'and it is honest that the table did not change hands');
    assert.equal(win.negoUnsentAsks(c, 'counterparty').length, 0, 'the ask has left');
  });

  test('the owner has the same road back', async () => {
    /* The mirror, through the share path: core.js hands over after publishing,
       and hit the identical refusal when the turn was already theirs. */
    const win = world().win;
    const c = await withAsks(win, 'owner', 1);
    win.negoHandOver(c, { to: 'counterparty', by: 'Young' });
    await win.negoFileProposal(c, win.negoResolvedText(c) + '\nA late addition.',
      { side: 'owner', author: 'Young' });
    assert.equal(win.negoUnsentAsks(c, 'owner').length, 1);
    const out = win.negoHandOver(c, { to: 'counterparty', by: 'Young' });
    assert.ok(out && out.moved === false);
    assert.equal(win.negoUnsentAsks(c, 'owner').length, 0);
  });

  test('and with nothing waiting it is still a no-op', async () => {
    /* The idempotency the share path depends on: two callers may both hand
       over after one send, and the second must not stamp again. */
    const win = world().win;
    const c = await withAsks(win, 'owner', 1);
    assert.ok(win.negoHandOver(c, { to: 'counterparty', by: 'Young' }));
    const at = c.negotiation.turnAt;
    assert.equal(win.negoHandOver(c, { to: 'counterparty', by: 'Young' }), null,
      'nothing left to send, so nothing happens');
    assert.equal(c.negotiation.turnAt, at, 'and the send stamp is untouched');
  });

  test('a real hand-over still moves the turn and says so', async () => {
    const win = world().win;
    const c = await withAsks(win, 'owner', 1);
    const out = win.negoHandOver(c, { to: 'counterparty', by: 'Young' });
    assert.equal(out.moved, true);
    assert.equal(win.negoTurn(c), 'counterparty');
  });

  test('the audit says which of the two happened', async () => {
    const win = world().win;
    const c = await afterFirstRound(win);
    await win.negoFileProposal(c, win.negoResolvedText(c) + '\nA counter on the cap.',
      { side: 'counterparty', author: 'Erik' });
    win.negoHandOver(c, { to: 'owner', by: 'Erik' });
    await win.negoFileProposal(c, win.negoResolvedText(c) + '\nOne more.',
      { side: 'counterparty', author: 'Erik' });
    win.negoHandOver(c, { to: 'owner', by: 'Erik' });
    const lines = (c.audit || []).map(e => String(e.detail || ''));
    assert.ok(lines.some(l => /Turn handed to owner/.test(l)), 'the first was a hand-over');
    assert.ok(lines.some(l => /Further changes sent/.test(l) && /already their turn/.test(l)),
      'the second was a send, and the record must not claim the table moved');
  });
});

/* ============================================================ */
describe('F100e — a card is open only because somebody opened it', () => {
  /* ---- WHAT THIS BLOCK USED TO PIN, AND WHY IT DOES NOT ----
     Three rules decided a card's state for the reader: a card carrying a verb
     opened itself, hovering peeked one open, and opening one shut the rest.
     They were built to solve a real problem — working through a round left a
     column of open cards to close one at a time — and they solved it by taking
     the decision away, which produced three faults of their own: a busy round
     arrived as a wall of open cards, the column moved under a pointer merely
     crossing it, and two changes could not be compared side by side.

     Replaced with a plain toggle (Young, 10 Aug 2026): "the cards you only
     open when you click on them and you click again and they disappear."

     THE OLD SAFETY ARGUMENT IS NOW STRUCTURAL. The exemption existed so a
     button could not vanish while the reader's hand was travelling toward it.
     Nothing automatic moves a card any more, and only the HEAD toggles — so
     the body cannot fold the body away. That is what the last test here
     checks, and it is the one that would hurt if it broke. */

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
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
    win.getContract = id => (id === c.id ? c : null);
    win.renderRedline();
    const $ = s => win.document.querySelector(s);
    return { w, win, c, $, doc: win.document, again: () => win.renderRedline() };
  }
  const sent = async () => { const p = await page();
    p.win.negoHandOver(p.c, { to: 'counterparty' }); p.again(); return p; };
  const fire = (el, type, init) => el.dispatchEvent(
    new el.ownerDocument.defaultView.Event(type, Object.assign({ bubbles: false }, init)));
  const head = p => p.$('#rl-changes .rl-card .rl-card-head');

  test('every card arrives shut, whatever is on it', async () => {
    /* A draft carries Edit, Retract and Send — the set that used to force the
       card open. It arrives shut like everything else. */
    const p = await page();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0');
    const q = await sent();
    assert.equal(q.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0');
  });

  test('one press opens it, the next shuts it', async () => {
    const p = await page();
    head(p).click(); p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '1',
      'a press is the whole of the rule');
    head(p).click(); p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0',
      'and the same press again closes it');
  });

  test('the caret is the same toggle, said out loud', async () => {
    /* It is the affordance — the one thing on a shut card saying there is more
       under it. It used to be inert on a card that could not fold, which is a
       control that does nothing on the cards a reader meets most. */
    const p = await page();
    p.$('#rl-changes [data-rl-caret]').click(); p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '1');
    p.$('#rl-changes [data-rl-caret]').click(); p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0');
  });

  test('hovering does nothing at all', async () => {
    const p = await sent();
    const card = p.$('#rl-changes .rl-card');
    fire(card, 'mouseenter');
    fire(card, 'focusin', { bubbles: true });
    assert.equal(card.getAttribute('data-rl-open'), '0', 'a look is not a press');
    assert.ok(!card.classList.contains('is-peek'), 'and there is no peek state left to enter');
    assert.equal(p.doc.querySelector('#rl-doc .is-linked'), null,
      'nor does the document move for one');
  });

  test('an open card stays open through the repaints', async () => {
    const p = await page();
    head(p).click();
    p.again(); p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '1');
  });

  test('pressing outside the column leaves it alone', async () => {
    /* It used to close every open card, on the reasoning that a press outside
       was the reader moving on. Clicking into the document to read a clause is
       not a request to lose your place in the column. */
    const p = await page();
    head(p).click(); p.again();
    p.doc.body.click();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '1',
      'only the reader closes what the reader opened');
  });

  test('two cards can be open at once', async () => {
    const { rlCardSetOpen, rlCardIsOpen } = buildWorld({ negotiationView: true }).win;
    rlCardSetOpen('CHG-1', true, 'k');
    rlCardSetOpen('CHG-2', true, 'k');
    assert.equal(rlCardIsOpen({ id: 'CHG-1' }, []), true,
      'comparing two changes is the ordinary thing to want');
    assert.equal(rlCardIsOpen({ id: 'CHG-2' }, []), true);
  });

  test('the choice does not turn on which verbs the card happens to carry', async () => {
    /* It used to be keyed on the verbs, so a card whose buttons changed fell
       back to the default. Harmless when the default was "open" and wrong now:
       answering a change would have folded the card you were working in. */
    const { rlCardSetOpen, rlCardIsOpen } = buildWorld({ negotiationView: true }).win;
    rlCardSetOpen('CHG-1', true, 'data-rl-send');
    assert.equal(rlCardIsOpen({ id: 'CHG-1' }, ['<b data-nego-accept=1>']), true);
  });

  test('open cards do not travel to another contract', async () => {
    const w = buildWorld({ negotiationView: true });
    const { rlCardSetOpen, rlCardIsOpen, rlCardForgetPins } = w.win;
    rlCardSetOpen('CHG-1', true, 'k');
    rlCardForgetPins('MK-OTHER');
    assert.equal(rlCardIsOpen({ id: 'CHG-1' }, []), false,
      'a card cannot arrive open on a change the reader has never seen');
  });

  test('and the choice is not persisted anywhere', async () => {
    /* A working preference is not a setting. */
    const src = read('js/views/negotiation.js');
    const block = src.slice(src.indexOf('const _rlCardChoice'), src.indexOf('function rlLinkFocus'));
    assert.doesNotMatch(block, /localStorage|lsSet|persist\(/,
      'an open card must not outlive the visit');
  });

  test('THE ONE THAT WOULD HURT: only the head toggles, never the body', async () => {
    /* The body holds the verbs and the note composer. A press on Accept, on
       Send, or into the note box must not fold the card up underneath the hand
       doing it — which is the whole of what the old exemption was protecting,
       kept as a fact about the markup rather than as a rule about states. */
    const p = await page();
    head(p).click(); p.again();
    const card = p.$('#rl-changes .rl-card');
    assert.equal(card.getAttribute('data-rl-open'), '1');
    const body = card.querySelector('.rl-card-body');
    assert.ok(body, 'an open card has a body');
    assert.ok(!body.closest('.rl-card-head'),
      'the body must not be inside the toggle at any depth');
    /* And the head carries only labels — nothing pressable that acts. */
    const acting = card.querySelectorAll('.rl-card-head [data-nego-accept], .rl-card-head [data-nego-reject],'
      + '.rl-card-head [data-rl-send], .rl-card-head [data-rl-retract], .rl-card-head textarea');
    assert.equal(acting.length, 0, 'the head is labels; the controls are below it');
  });
});

describe('F100f — and all of it from the counterparty\'s own chair', () => {
  /* The work order left two items open on this seat, and they are the same
     seat: the counterparty's page mounts the SAME renderer with
     side:'counterparty', so Draft/Sent and peek/pin arrive there by
     construction — but "by construction" is the claim, not the proof, and
     neither had been read back since the send-vs-turn fix.

     One of them was not fine. The unpin repainted with renderRedline — the
     OWNER's page — from inside a mount that is not the owner's, so on the
     counterparty's page the pin was released in the record and the card stayed
     open on screen, because the page that had to redraw it was never asked. */

  async function page(){
    const w = buildWorld({ negotiationView: true });
    const { win } = w;
    win.promptDialog = async () => '';
    win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
    win.copilotAvailable = () => false;
    win.openShareModal = () => {};
    win.counterpartyContact = () => null;
    win.cachedShares = () => [];
    const c = supplyContract();
    win.negoInit(c);
    /* Filed from THEIR side: on this seat it is the reader's own ask, which is
       the card the Draft/Sent rule is about. */
    await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
      { side: 'counterparty', author: 'Amina Wanjiru' });
    win.rlSetCardFilter('all');
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
    win.getContract = id => (id === c.id ? c : null);
    return { w, win, c, doc: win.document };
  }

  /* The opts the portal passes (js/views/portal.js), cut to what the column
     reads. unsentIds is the portal's PORTAL_NEGO_PROPOSED — the asks it is
     still holding — so [] is "the postbox has been pressed". */
  const seatOpts = (over = {}) => ({ side: 'counterparty', org: 'Wanjiru Catering Ltd',
    hiddenIds: [], holdsDecisions: true, heldDecisionIds: [], sentDecisionIds: [],
    unsentIds: [], ...over });
  const seat = (p, over = {}) => {
    const box = p.doc.createElement('div');
    box.innerHTML = p.win.redlineChangeCardsHtml(p.c, seatOpts(over));
    return box;
  };
  const verbsOf = card => [...card.querySelectorAll('.rl-card-verbs button')]
    .map(b => b.textContent.trim());

  test('WO-1 · held on their page, it is a Draft with Retract and Send', async () => {
    const p = await page();
    const card = seat(p, { unsentIds: [p.c.changes[0].id] }).querySelector('[data-rl-origin="us"]');
    assert.match(card.querySelector('.rl-badge').textContent, /Draft/,
      'nothing has left their page yet');
    assert.deepEqual(verbsOf(card), ['Edit', 'Retract', 'Send']);
  });

  test('WO-1 · once it has gone it reads Sent, and carries EXACTLY Edit and Sent', async () => {
    /* The item the work order left open. It is the same reading as the owner's
       badge — one set, one answer — but it had not been read back from this
       chair since the send-vs-turn fix, and this seat is where the fault was
       reported from. */
    const p = await page();
    const card = seat(p).querySelector('[data-rl-origin="us"]');
    assert.equal(card.querySelector('.rl-badge').textContent.trim(), 'Sent');
    assert.deepEqual(verbsOf(card), ['Edit', 'Sent'],
      'two buttons, and no third: Retract is not honest once it has gone');
    assert.equal(card.querySelector('[data-rl-sent]').disabled, true,
      'a state, not a control — the next move is theirs');
    assert.equal(card.querySelector('[data-rl-send]'), null,
      'the fault as reported: a Sent badge beside a live Send');
    assert.equal(card.querySelector('[data-rl-retract]'), null);
  });

  test('WO-2 · every card arrives shut on this seat too', async () => {
    /* Their page mounts the same renderer, so the toggle arrives by
       construction — but "by construction" is the claim, not the proof. */
    const p = await page();
    const done = seat(p).querySelector('[data-rl-origin="us"]');
    assert.equal(done.getAttribute('data-rl-open'), '0');
    const live = seat(p, { unsentIds: [p.c.changes[0].id] }).querySelector('[data-rl-origin="us"]');
    assert.equal(live.getAttribute('data-rl-open'), '0',
      'a card with something to press is not an exception any more — nothing is');
    assert.ok(live.querySelector('.rl-card-head'), 'and its head is the toggle');
  });

  /* ---- A DECISION THAT HAS GONE IS FINISHED BUSINESS ----
     Reported from the field (Young, 02 Aug 2026): the counterparty answers a
     dozen changes, sends them, and is left with a dozen full-height cards each
     still offering a button, on a column where nothing is outstanding. The
     owner's page goes quiet at the same moment — their settled changes leave
     the column, and their own sent asks collapse because "Sent" is inert — so
     the same component read as two different products.

     The cause was one classification, not a second design: rlCardNeedsYou
     counted "Change decision" as a move waiting on the reader, and a card with
     a move on it is exempt from folding. It is not a move. It has gone, the
     other side is holding it, and Change decision is an escape hatch — which is
     what the peek is for.

     UNDO IS NOT IN THE SAME BOX, and these tests pin that too, because the
     obvious "collapse anything answered" is the version that bites: Undo sits
     on an answer that has NOT been sent — the one state on this screen that
     looks finished and is not — and the second after a click is exactly when a
     mis-click needs its way back visible. It folds on its own once the round
     goes. */
  /* A DECISION IS ALWAYS ABOUT THE OTHER SIDE'S ASK — nobody rules on their
     own — so this describe's own counterparty ask is the wrong card for these.
     An owner ask is filed for them, which from this seat is the one the reader
     answers. */
  const ownerAsk = async p => {
    const before = new Set(p.c.changes.map(x => x.id));
    await p.win.negoFileProposal(p.c, p.win.negoResolvedText(p.c) + '\nA cap on liability.',
      { side: 'owner', author: 'Young Mbagaya' });
    return p.c.changes.find(x => !before.has(x.id));
  };
  const decided = async (p, status, over) => {
    const ch = await ownerAsk(p);
    ch.status = status;
    const key = over === 'sent' ? 'sentDecisionIds' : 'heldDecisionIds';
    return { ch, card: seat(p, { [key]: [ch.id] }).querySelector(`[data-nego-card="${ch.id}"]`) };
  };

  test('a decision that has been SENT folds to a line', async () => {
    const p = await page();
    const { card } = await decided(p, 'accepted', 'sent');
    assert.match(card.querySelector('.rl-badge').textContent, /sent/,
      'the state under test is answered AND gone');
    assert.ok(verbsOf(card).includes('Change decision'),
      'the escape hatch is still on the card — hidden, not removed');
    assert.equal(card.getAttribute('data-rl-open'), '0', 'folded, like every card');
  });

  test('a REJECTION that has been sent folds the same way', async () => {
    /* Accept and reject are the same act as far as the column is concerned:
       answered, gone, nobody waiting. Asserted separately because the badge
       and the verb list are built from the status, so "accepted works" is not
       evidence about the other half of the decision. */
    const p = await page();
    const { card } = await decided(p, 'rejected', 'sent');
    assert.match(card.querySelector('.rl-badge').textContent, /Rejected/);
    assert.equal(card.getAttribute('data-rl-open'), '0');
    assert.ok(card.querySelector('.rl-card-head'), 'and one press away, like every card');
  });

  test('but the badge stays readable while it is folded', async () => {
    /* The whole safety argument for folding this card: what it folds away is a
       button nobody is waiting on, never the answer itself. The head — id,
       origin, status — is outside .rl-card-body and survives. */
    const p = await page();
    const { card } = await decided(p, 'accepted', 'sent');
    const body = card.querySelector('.rl-card-body');
    assert.ok(body, 'the body is rendered, and hidden by CSS rather than dropped');
    assert.ok(!body.contains(card.querySelector('.rl-badge')),
      'the status badge is in the head, so folding cannot take it away');
    assert.ok(!body.contains(card.querySelector('.rl-card-meta')),
      'nor the clause it belongs to');
  });

  test('an answer that has NOT been sent stays open, with its Undo showing', async () => {
    const p = await page();
    const { card } = await decided(p, 'accepted', 'held');
    assert.match(card.querySelector('.rl-badge').textContent, /held/,
      'answered here, and nothing has left the page');
    assert.deepEqual(verbsOf(card), ['Undo']);
    /* IT FOLDS LIKE EVERYTHING ELSE. Undo used to hold the card open — the one
       state that looks finished and is not, and the second after a click, when
       a mis-press is likeliest. It is one press away now, and the alternative
       was worse: a card that opened itself could not be closed. */
    assert.equal(card.getAttribute('data-rl-open'), '0');
  });

  test('the verbs are one press away, on every state that carries one', async () => {
    /* This used to insist those states stayed OPEN, and the exemption that made
       that safe is gone with the automatic opening it protected. What replaces
       it: whatever state a card is in, its controls are rendered and its head
       is the one press that reveals them. A verb that was not in the DOM at all
       would be the real fault, and that is what this now reads. */
    const p = await page();
    const mine = p.c.changes[0].id;
    const theirs = (await ownerAsk(p)).id;
    const cases = [
      ['our own unsent draft (Retract / Send)', { unsentIds: [mine] }, mine],
      ['their pending ask (Accept / Reject)', {}, theirs],
    ];
    for (const [what, over, id] of cases){
      const card = seat(p, over).querySelector(`[data-nego-card="${id}"]`);
      assert.ok(card, `${what} is on the column`);
      assert.equal(card.getAttribute('data-rl-open'), '0', `${what} arrives shut`);
      assert.ok(card.querySelector('.rl-card-head'), `${what} has a head to press`);
      assert.ok(card.querySelector('.rl-card-body .rl-card-verbs button'),
        `${what} carries its verbs, one press away`);
    }
  });

  /* ---- THE MOUNT REPAINTS ITSELF, OR THE PIN NEVER LETS GO ---- */
  const mountPortal = p => {
    const host = p.doc.getElementById('share-root');
    const o = seatOpts();
    o.rerender = () => p.win.redlineEmbed(host, p.c, o);
    p.win.redlineEmbed(host, p.c, o);
    return host;
  };

  test('WO-2 · the toggle repaints THIS mount, never the owner\'s workbench', async () => {
    const p = await page();
    /* A marker in the owner's mount. If the toggle's repaint reaches for
       renderRedline it paints the workbench over it, and the counterparty is
       looking at a page that was never theirs. This was a real fault on the
       unpin that used to live here, and the repaint it guarded is the same one
       the toggle uses. */
    p.doc.getElementById('content').innerHTML = '<b id="owner-mount-untouched"></b>';
    const host = mountPortal(p);
    const card = () => host.querySelector('#rl-changes .rl-card');
    assert.equal(card().getAttribute('data-rl-open'), '0');
    card().querySelector('.rl-card-head').click();
    assert.equal(card().getAttribute('data-rl-open'), '1', 'a press opens it here too');
    card().querySelector('.rl-card-head').click();
    assert.equal(card().getAttribute('data-rl-open'), '0', 'and closes it here too');
    assert.ok(p.doc.getElementById('owner-mount-untouched'),
      'and the owner\'s workbench was not painted from inside their portal');
  });

  test('WO-2 · an open card does not survive the mount being handed another contract', async () => {
    /* The owner's page forgets what was open when the reader moves on
       (renderRedline); a mount is not exempt from the rule, or a card arrives
       open on a change this reader has never seen. */
    const p = await page();
    const host = mountPortal(p);
    host.querySelector('#rl-changes .rl-card .rl-card-head').click();
    assert.equal(host.querySelector('#rl-changes .rl-card').getAttribute('data-rl-open'), '1');
    p.win.redlineEmbed(host, Object.assign({}, p.c, { id: 'MK-OTHER' }), seatOpts());
    assert.equal(host.querySelector('#rl-changes .rl-card').getAttribute('data-rl-open'), '0');
  });
});
