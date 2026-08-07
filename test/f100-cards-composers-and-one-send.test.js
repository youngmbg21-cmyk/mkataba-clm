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
    assert.ok(card.classList.contains('rl-card-shut'), 'the body is folded away');
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
       change". A reader tidying a column must not be scrolled somewhere for it.
       Driven on a SENT card: a card with something to press is exempt from
       folding altogether — see the exemption tests below. */
    const p = await page();
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    p.$('#rl-changes .rl-card').click();          // pin it open
    p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '1');
    p.$('#rl-changes [data-rl-caret]').click();
    p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0');
  });

  test('a hand-closed card stays closed through a repaint', async () => {
    const p = await page();
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    p.$('#rl-changes .rl-card').click();
    p.again();
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
      /* the placeholder is a dictionary key now — the reader sees it in their
         own language; what this test is about is that it is a TEXTAREA */
      ['js/views/negotiation.js', /<textarea class="chat-field"[^>]*id="nego-ti-\$\{_ne\(ch\.id\)\}"[^>]*placeholder="\$\{i18t\('ng_reply_on_change'\)\}/, 'reply on a change'],
      ['js/views/negotiation.js', /<textarea class="chat-field"[^>]*placeholder="\$\{_nea\(i18t\('ng_ph_start_thread'/, 'start a thread'],
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
describe('F100e — looking at a card is not deciding anything', () => {
  /* Working through a round left a column of cards the reader had opened and
     then had to close one at a time. So a card you have merely LOOKED at closes
     itself, and a card you have committed to stays.

     The exemption is the whole safety argument, and it is why this file leans
     on it three times below: a card with Accept, Reject, Send or Undo on it
     never peeks and never folds. Without that, this feature would take a button
     off the screen while the reader's mouse was travelling toward it — the same
     wound as the stale open/shut choice (F100b), in a worse form. */
  const RICH = null;

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
    return { w, win, c, $, doc: win.document, again: () => win.renderRedline() };
  }
  const sent = async () => { const p = await page();
    p.win.negoHandOver(p.c, { to: 'counterparty' }); p.again(); return p; };
  /* test/world.js runs setTimeout synchronously so deferred UI work lands
     inside a test. That is right for everything else here and wrong for a
     GRACE PERIOD, whose whole behaviour is the delay — with the stub in place
     the card would close on the same tick as the mouseleave and the test would
     pass while proving nothing. Restored per test, after the page is built. */
  const realTimers = p => {
    p.win.setTimeout = (fn, ms) => setTimeout(fn, ms);
    /* Both halves, or the cancel is a no-op: a Node timer id handed to jsdom's
       clearTimeout clears nothing, and the "coming back cancels it" case would
       fail for a reason that has nothing to do with the code under test. */
    p.win.clearTimeout = id => clearTimeout(id);
  };
  const fire = (el, type, init) => el.dispatchEvent(
    new el.ownerDocument.defaultView.Event(type, Object.assign({ bubbles: false }, init)));

  test('THE EXEMPTION: a card with something to press cannot peek or fold', async () => {
    const p = await page();                       // a draft: Edit / Retract / Send
    const card = p.$('#rl-changes .rl-card');
    assert.equal(card.getAttribute('data-rl-open'), '1');
    assert.equal(card.hasAttribute('data-rl-peek'), false,
      'it is not in the peek set at all — Send must not vanish under a moving mouse');
    /* And its caret is inert, so it cannot be folded by hand either. */
    p.$('#rl-changes [data-rl-caret]').click();
    p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '1',
      'a live control is not something the reader can hide by accident');
  });

  test('a finished card is the one that peeks', async () => {
    const p = await sent();
    const card = p.$('#rl-changes .rl-card');
    assert.equal(card.getAttribute('data-rl-open'), '0');
    assert.equal(card.hasAttribute('data-rl-peek'), true);
  });

  test('hovering opens it, and no repaint happens for a look', async () => {
    const p = await sent();
    const card = p.$('#rl-changes .rl-card');
    fire(card, 'mouseenter');
    assert.ok(card.classList.contains('is-peek'), 'the body is on screen');
    assert.equal(card.getAttribute('data-rl-open'), '0',
      'and the record still says shut — a look is not a decision');
    assert.equal(p.doc.querySelector('#rl-changes .rl-card'), card,
      'the same node: a peek must not rebuild the column under the pointer');
  });

  test('leaving collapses it again, after a grace so it does not slam shut', async () => {
    const p = await sent();
    realTimers(p);
    const card = p.$('#rl-changes .rl-card');
    fire(card, 'mouseenter');
    fire(card, 'mouseleave');
    assert.ok(card.classList.contains('is-peek'),
      'still open for a moment — crossing the gap to the buttons leaves the element');
    await new Promise(r => setTimeout(r, p.win.RL_CARD_PEEK_MS + 60));
    assert.ok(!card.classList.contains('is-peek'), 'and then it closes');
  });

  test('coming back inside the grace cancels the close', async () => {
    const p = await sent();
    realTimers(p);
    const card = p.$('#rl-changes .rl-card');
    fire(card, 'mouseenter');
    fire(card, 'mouseleave');
    fire(card, 'mouseenter');
    await new Promise(r => setTimeout(r, p.win.RL_CARD_PEEK_MS + 60));
    assert.ok(card.classList.contains('is-peek'), 'the reader never left');
  });

  test('the keyboard gets the same affordance', async () => {
    /* There is no hover on a tab key, and the cards are focusable. */
    const p = await sent();
    const card = p.$('#rl-changes .rl-card');
    fire(card, 'focusin', { bubbles: true });
    assert.ok(card.classList.contains('is-peek'));
  });

  test('a click pins it, and a pin survives the repaints a peek must not cause', async () => {
    const p = await sent();
    p.$('#rl-changes .rl-card').click();
    p.again(); p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '1',
      'a click is a commitment where a hover was not');
  });

  test('pressing anywhere outside the column lets the pin go', async () => {
    const p = await sent();
    p.$('#rl-changes .rl-card').click();
    p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '1');
    p.doc.body.click();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0',
      'the reader has plainly moved on');
  });

  test('only one card is pinned at a time', async () => {
    const { rlCardSetOpen, rlCardIsOpen } = buildWorld({ negotiationView: true }).win;
    const K = 'data-rl-edit|data-rl-sent';
    rlCardSetOpen('CHG-1', true, K);
    rlCardSetOpen('CHG-2', true, K);
    assert.equal(rlCardIsOpen({ id: 'CHG-2' }, ['<b data-rl-edit=1>', '<b data-rl-sent=1>']), true);
    assert.equal(rlCardIsOpen({ id: 'CHG-1' }, ['<b data-rl-edit=1>', '<b data-rl-sent=1>']), false,
      'a column of pins is the pile this behaviour exists to stop');
  });

  test('pins do not travel to another contract', async () => {
    /* They are a working preference on THIS column. Carried across, a pin would
       open a card the reader has never seen. */
    const w = buildWorld({ negotiationView: true });
    const { rlCardSetOpen, rlCardIsOpen, rlCardForgetPins } = w.win;
    rlCardSetOpen('CHG-1', true, 'k');
    rlCardForgetPins('MK-OTHER');
    assert.equal(rlCardIsOpen({ id: 'CHG-1' }, []), false);
  });

  test('and they are not persisted anywhere', async () => {
    /* Answered explicitly by the raiser: a working preference is not a setting.
       Nothing writes a pin to storage. */
    const src = read('js/views/negotiation.js');
    const block = src.slice(src.indexOf('const _rlCardChoice'), src.indexOf('function rlLinkFocus'));
    assert.doesNotMatch(block, /localStorage|lsSet|persist\(/,
      'a pin must not outlive the visit');
  });

  test('and a peek never moves the document', async () => {
    /* Answered explicitly by the raiser: hovering must not scroll the contract,
       or the page slides about as the mouse crosses the column. Clicking still
       navigates — that is the card press, tested in F100b. */
    const p = await sent();
    const card = p.$('#rl-changes .rl-card');
    fire(card, 'mouseenter');
    assert.equal(p.doc.querySelector('#rl-doc .is-linked'), null,
      'nothing in the document lit up for a look');
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

  test('WO-2 · and a sent card is the one that peeks there too', async () => {
    const p = await page();
    const box = seat(p);
    const done = box.querySelector('[data-rl-origin="us"]');
    assert.equal(done.getAttribute('data-rl-open'), '0');
    assert.equal(done.hasAttribute('data-rl-peek'), true);
    /* And the exemption holds on this seat: while it is still theirs to send,
       Send must not vanish under a moving mouse. */
    const live = seat(p, { unsentIds: [p.c.changes[0].id] }).querySelector('[data-rl-origin="us"]');
    assert.equal(live.hasAttribute('data-rl-peek'), false);
    assert.equal(live.getAttribute('data-rl-open'), '1');
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
    assert.equal(card.getAttribute('data-rl-open'), '0', 'folded');
    assert.equal(card.hasAttribute('data-rl-peek'), true, 'and it peeks on hover');
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
    assert.equal(card.hasAttribute('data-rl-peek'), true);
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
    assert.equal(card.getAttribute('data-rl-open'), '1',
      'the state that looks finished and is not must not fold');
    assert.equal(card.hasAttribute('data-rl-peek'), false,
      'and Undo must not vanish under a moving mouse right after a click');
  });

  test('the exemption still holds for every verb somebody IS waiting on', async () => {
    /* The guard against the obvious over-correction. Folding is decided by
       reading the verbs, so this walks the states that carry a live one and
       insists none of them folds. */
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
      assert.equal(card.getAttribute('data-rl-open'), '1', `${what} must stay open`);
      assert.equal(card.hasAttribute('data-rl-peek'), false, `${what} must not peek`);
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

  test('WO-2 · pressing outside the column lets the pin go ON THIS PAGE', async () => {
    const p = await page();
    /* A marker in the owner's mount. If the unpin reaches for renderRedline it
       paints the workbench over it, and the counterparty is looking at a page
       that was never theirs. */
    p.doc.getElementById('content').innerHTML = '<b id="owner-mount-untouched"></b>';
    const host = mountPortal(p);
    const card = () => host.querySelector('#rl-changes .rl-card');
    assert.equal(card().getAttribute('data-rl-open'), '0');
    card().click();
    assert.equal(card().getAttribute('data-rl-open'), '1', 'a click pins it here too');
    p.doc.body.click();
    assert.equal(card().getAttribute('data-rl-open'), '0',
      'the card the reader is looking at is the card that closes');
    assert.ok(p.doc.getElementById('owner-mount-untouched'),
      'and the owner\'s workbench was not painted from inside their portal');
  });

  test('WO-2 · a pin does not survive the mount being handed another contract', async () => {
    /* The owner's page drops pins when the reader moves on (renderRedline);
       a mount is not exempt from the rule, or a pin arrives on a card this
       reader has never seen. */
    const p = await page();
    const host = mountPortal(p);
    host.querySelector('#rl-changes .rl-card').click();
    assert.equal(host.querySelector('#rl-changes .rl-card').getAttribute('data-rl-open'), '1');
    p.win.redlineEmbed(host, Object.assign({}, p.c, { id: 'MK-OTHER' }), seatOpts());
    assert.equal(host.querySelector('#rl-changes .rl-card').getAttribute('data-rl-open'), '0');
  });
});
