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

  test('a draft arrives with nothing popped out, and a door to open', async () => {
    const p = await page();
    const card = p.$('#rl-changes .rl-card');
    assert.equal(card.getAttribute('data-rl-popped'), '0',
      'a panel is open only because somebody opened it');
    assert.ok(card.querySelector('[data-rl-pop]'),
      'and a real button says the reason and the notes are behind it');
    assert.ok(card.querySelector('.rl-card-body'),
      'the reading matter is on the card, ready for the panel to borrow');
  });

  test('the reading matter is on the card and never shown there', async () => {
    /* It stays in the card so the engine wires it with everything else — the
       reply box is bound by element id, scoped to this mount. The panel MOVES
       this node rather than rendering a second copy, which would be a composer
       with no handlers at all. */
    const p = await page();
    const css = p.win.document.getElementById('redline-layout-css').textContent;
    assert.match(css, /\.redline-page \.rl-card \.rl-card-body\{display:none\}/,
      'hidden on the card');
    assert.match(css, /\.rl-pop-body \.rl-card-body\{display:block\}/,
      'and shown once the panel has it');
  });

  test('pressing its head takes you to the change and leaves the card alone', async () => {
    const p = await page();
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    p.$('#rl-changes .rl-card .rl-card-head')
      .dispatchEvent(new p.win.Event('click', { bubbles: true }));
    assert.equal(p.win.rlPopId(), null, 'no panel opened');
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-popped'), '0',
      'and the column holds still');
  });

  test('the button opens the panel, and the body MOVES into it', async () => {
    /* The move is the whole design. A rendered copy looks identical and its
       reply box never sends. */
    const p = await page();
    const card = () => p.$('#rl-changes .rl-card');
    const bodyBefore = card().querySelector('.rl-card-body');
    assert.ok(bodyBefore, 'the body starts on the card');
    p.$('#rl-changes .rl-card [data-rl-pop]').click();
    const pop = p.$('#rl-pop');
    assert.ok(pop, 'the panel is drawn');
    assert.equal(card().querySelector('.rl-card-body'), null, 'the card lent it out');
    assert.equal(pop.querySelector('.rl-card-body'), bodyBefore,
      'and it is the very same node, listeners and all');
    assert.equal(p.$$('.rl-card-body').length, 1, 'never two copies in the document');
  });

  test('and closing it gives the body back to its card', async () => {
    const p = await page();
    const btn = () => p.$('#rl-changes .rl-card [data-rl-pop]');
    btn().click();
    btn().click();
    assert.equal(p.$('#rl-pop'), null, 'the panel is gone');
    const card = p.$('#rl-changes .rl-card');
    assert.ok(card.querySelector('.rl-card-body'), 'and the body is home');
    assert.ok(card.querySelector('.rl-card-body').nextElementSibling.classList.contains('rl-card-actions'),
      'in its own place, above the action bar');
  });

  test('the panel carries the wording in full, which the card only clamps', async () => {
    const p = await page();
    p.$('#rl-changes .rl-card [data-rl-pop]').click();
    const pop = p.$('#rl-pop');
    assert.ok(pop.querySelector('.rl-pop-word'), 'the wording, unclamped');
    assert.ok(pop.querySelector('[data-rl-pop-close]'), 'and a way to shut it');
  });

  test('an open panel survives the card changing state underneath it', async () => {
    const p = await page();
    p.$('#rl-changes .rl-card [data-rl-pop]').click();
    const id = p.win.rlPopId();
    assert.ok(id);
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    assert.equal(p.win.rlPopId(), id, 'still open on the same change');
    assert.ok(p.$('#rl-pop .rl-card-body'),
      'and it took the rebuilt card\'s body — the one it held went with the repaint');
    assert.equal(p.$$('.rl-card-body').length, 1, 'still exactly one');
  });

  test('and it closes when its change leaves the list', async () => {
    const p = await page();
    p.$('#rl-changes .rl-card [data-rl-pop]').click();
    p.win.rlPopSet('CHG-DOES-NOT-EXIST');
    p.again();
    assert.equal(p.win.rlPopId(), null);
    assert.equal(p.$('#rl-pop'), null);
  });

  test('the rule is read off the verbs, not off a list of statuses', () => {
    /* Two copies of "is there anything to do here" would disagree the first
       time either moved — and the card that lost would hide a live control. */
    const w = buildWorld({ negotiationView: true });
    assert.equal(w.win.rlCardNeedsYou(['<button data-rl-send="X">Send</button>']), true);
    assert.equal(w.win.rlCardNeedsYou(['<button data-nego-undo="X">Undo</button>']), true);
    /* THE FIXTURE FOLLOWS THE MARKUP, and it has followed it twice. The spent
       Send lost the word "Sent" on 12 Aug 2026 and became a tick and a
       caption; on 13 Aug 2026 the owner asked for the marker to come off the
       card altogether, so nothing emits data-rl-sent and the attribute has
       left RL_CARD_INERT with it. A fixture quoting a button nothing draws any
       more is a fixture that has stopped being evidence.

       THE OUTCOME IS THE SAME AND THAT IS THE POINT: a sent ask of ours now
       leaves exactly one verb on the card, Edit, which is inert for its own
       reason. Proved from the rendered card in F100f rather than assumed. */
    assert.equal(w.win.rlCardNeedsYou([
      '<button data-rl-edit="X">Edit</button>']), false,
      'Edit navigates — it is not a move waiting on you');
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
describe('F100e — the card pops out; it does not grow', () => {
  /* ---- WHAT THIS BLOCK USED TO PIN, AND WHY IT DOES NOT ----
     Three rules once decided a card's state for the reader — a card carrying a
     verb opened itself, hovering peeked one open, and opening one shut the rest
     — and all three were replaced by a plain in-place toggle in Aug 2026.

     The toggle went too (owner, 12 Aug 2026). Unfolding in place put the
     reason, the reviewer's note and the whole thread into the narrowest column
     on the screen, and moved every card below down the page while somebody was
     reading one of them. It pops out into a floating panel instead.

     WHAT SURVIVES, and matters more than the layout: pressing a card takes you
     to its clause and now does only that; the verbs are on the card whatever is
     open; and nothing but a press opens or closes the panel. */

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

  const popBtn = p => p.$('#rl-changes .rl-card [data-rl-pop]');

  test('every card arrives with nothing popped out', async () => {
    const p = await page();
    assert.equal(p.win.rlPopId(), null);
    assert.equal(p.$('#rl-pop'), null, 'no panel until somebody opens one');
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-popped'), '0');
  });

  test('one press opens it, the same press closes it', async () => {
    const p = await page();
    const id = p.$('#rl-changes .rl-card').getAttribute('data-nego-card');
    popBtn(p).click();
    assert.equal(p.win.rlPopId(), id);
    assert.ok(p.$('#rl-pop'));
    popBtn(p).click();
    assert.equal(p.win.rlPopId(), null);
    assert.equal(p.$('#rl-pop'), null, 'gone, not merely hidden');
  });

  test('THE ONE THAT WOULD HURT: the panel is inside the mount, outside the column', async () => {
    /* Outside the mount, the engine's own wiring — which is scoped to it — does
       not reach the reply box, and the composer accepts typing and never sends.
       Inside the COLUMN, the scroller clips it. It has to be both. */
    const p = await page();
    popBtn(p).click();
    const pop = p.$('#rl-pop');
    assert.ok(pop, 'the panel exists');
    assert.equal(pop.closest('#rl-changes'), null, 'not in the scroller');
    assert.ok(pop.closest('.redline-page'), 'but inside the page the engine wires');
  });

  test('the conversation moves WITH the node, never as a second copy', async () => {
    /* The claim that matters. The engine binds the reply box by element id and
       scopes every lookup to its own mount, so a rendered copy is a composer
       with no handlers — it accepts typing and never sends. Proving the node
       MOVED, and that there is only ever one of it, is proving that cannot
       happen. */
    const p = await page();
    const notesBefore = p.$('#rl-changes .rl-card .rl-cnotes');
    assert.ok(notesBefore, 'the thread starts on the card');
    popBtn(p).click();
    const pop = p.$('#rl-pop');
    assert.equal(pop.querySelector('.rl-cnotes'), notesBefore, 'the same node, moved');
    assert.equal(p.doc.querySelectorAll('.rl-cnotes').length, 1,
      'and only ever one in the document');
  });

  test('pressing a card takes you to its clause and pops nothing out', async () => {
    const p = await page();
    p.$('#rl-changes .rl-card .rl-card-head')
      .dispatchEvent(new p.win.Event('click', { bubbles: true }));
    assert.equal(p.win.rlPopId(), null);
  });

  test('hovering does nothing at all', async () => {
    const p = await page();
    const card = p.$('#rl-changes .rl-card');
    card.dispatchEvent(new p.win.Event('mouseenter'));
    card.dispatchEvent(new p.win.Event('mouseover'));
    assert.equal(p.win.rlPopId(), null, 'the column does not move under a passing pointer');
  });

  test('an open panel survives a repaint', async () => {
    const p = await page();
    popBtn(p).click();
    const id = p.win.rlPopId();
    p.again();
    assert.equal(p.win.rlPopId(), id);
    assert.ok(p.$('#rl-pop'));
  });

  test('and it does not travel to another contract', async () => {
    const p = await page();
    popBtn(p).click();
    assert.ok(p.win.rlPopId());
    p.win.rlCardForgetPins('SOME-OTHER-CONTRACT');
    assert.equal(p.win.rlPopId(), null);
  });

  test('the choice is not persisted anywhere', async () => {
    const p = await page();
    popBtn(p).click();
    assert.ok(!/rlPop|rl-pop/i.test(JSON.stringify(p.win.localStorage)),
      'a working preference is not a setting');
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

  test('WO-1 · once it has gone it reads Sent, and carries EXACTLY Edit', async () => {
    /* The item the work order left open. It is the same reading as the owner's
       badge — one set, one answer — but it had not been read back from this
       chair since the send-vs-turn fix, and this seat is where the fault was
       reported from. */
    const p = await page();
    const card = seat(p).querySelector('[data-rl-origin="us"]');
    assert.equal(card.querySelector('.rl-badge').textContent.trim(), 'Sent');
    /* ---- CLAIM REVERSED, 13 Aug 2026, OWNER-ASKED ----
       On 12 Aug the spent Send kept its SLOT and lost the word, so the card
       stopped printing "Sent" twice a centimetre apart. The owner has now
       asked for the marker to come off the card entirely — the status corner
       above says Sent, in colour, from the same reading. So the list is one
       verb, not two.

       AND THIS IS WHERE THE "STILL INERT" CLAIM IS PROVED. It used to hold
       because data-rl-sent was in RL_CARD_INERT; it holds now because Edit is
       the only verb left and Edit navigates. Asserted from the rendered card
       — this seat is the narrowest in the product and the one the fault was
       reported from. */
    assert.deepEqual(verbsOf(card), ['Edit'],
      'one verb, and no marker: Retract is not honest once it has gone');
    assert.equal(card.querySelector('[data-rl-sent]'), null,
      'nothing at all where the Send was');
    assert.equal(p.win.rlCardNeedsYou([...card.querySelectorAll('.rl-card-verbs button')]
      .map(b => b.outerHTML)), false,
      'and with the marker gone the card STILL reads as needing nothing');
    assert.equal((card.textContent.match(/Sent/g) || []).length, 1,
      'and the word appears exactly once on the whole card');
    assert.equal(card.querySelector('[data-rl-send]'), null,
      'the fault as reported: a Sent badge beside a live Send');
    assert.equal(card.querySelector('[data-rl-retract]'), null);
  });

  test('WO-2 · every card arrives shut on this seat too', async () => {
    /* Their page mounts the same renderer, so the toggle arrives by
       construction — but "by construction" is the claim, not the proof. */
    const p = await page();
    const done = seat(p).querySelector('[data-rl-origin="us"]');
    assert.equal(done.getAttribute('data-rl-popped'), '0');
    const live = seat(p, { unsentIds: [p.c.changes[0].id] }).querySelector('[data-rl-origin="us"]');
    assert.equal(live.getAttribute('data-rl-popped'), '0',
      'a card with something to press is not an exception any more — nothing is');
    assert.ok(live.querySelector('.rl-card-head'), 'its head takes them to the clause');
    assert.ok(live.querySelector('[data-rl-pop]'),
      'and the door to its reasoning is beside it — this seat has the least room of anybody');
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
    assert.equal(card.getAttribute('data-rl-popped'), '0', 'folded, like every card');
  });

  test('a REJECTION that has been sent folds the same way', async () => {
    /* Accept and reject are the same act as far as the column is concerned:
       answered, gone, nobody waiting. Asserted separately because the badge
       and the verb list are built from the status, so "accepted works" is not
       evidence about the other half of the decision. */
    const p = await page();
    const { card } = await decided(p, 'rejected', 'sent');
    assert.match(card.querySelector('.rl-badge').textContent, /Rejected/);
    assert.equal(card.getAttribute('data-rl-popped'), '0');
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
    /* Send FIRST, Undo beside it (asked for 11 Aug 2026: "the send should be
       a button in the card"). The decision was made on this card, so the act
       that makes it real lives here too — a proxy onto the page's one
       postbox, same as the owner's per-card Send. f180 pins its visibility
       and that pressing it posts the batch. */
    assert.deepEqual(verbsOf(card), ['Send', 'Undo']);
    /* IT FOLDS LIKE EVERYTHING ELSE. Undo used to hold the card open — the one
       state that looks finished and is not, and the second after a click, when
       a mis-press is likeliest. It is one press away now, and the alternative
       was worse: a card that opened itself could not be closed. */
    assert.equal(card.getAttribute('data-rl-popped'), '0');
  });

  test('the verbs are on the card, and there is no fold left to hide them in', async () => {
    /* This has moved twice and the direction is the point. It first insisted
       those states stayed OPEN; then, when the automatic opening went, it
       settled for "rendered, one press away". Asked for on 11 Aug 2026: a shut
       card is the header block AND the action bar, and the fold hides only
       "Why they asked" and the notes. So the verbs are out of .rl-card-body
       altogether — the thing display:none is applied to — and sit in a sibling
       .rl-card-actions that no rule folds. A card that arrives shut can still
       be sent from. */
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
      assert.equal(card.getAttribute('data-rl-popped'), '0', `${what} arrives with nothing popped out`);
      assert.ok(card.querySelector('.rl-card-head'), `${what} has a head to press`);
      assert.ok(card.querySelector('.rl-card-actions .rl-card-verbs button'),
        `${what} carries its verbs on the action bar`);
      const hidden = card.querySelector('.rl-card-body');
      assert.ok(!hidden || !hidden.querySelector('.rl-card-verbs'),
        `${what}: no verb may sit in the part that moves into the panel`);
    }
  });

  test('and what the fold hides is reading matter, not a move waiting on anybody', async () => {
    const p = await page();
    const theirs = (await ownerAsk(p)).id;
    const card = seat(p, {}).querySelector(`[data-nego-card="${theirs}"]`);
    const body = card.querySelector('.rl-card-body');
    assert.ok(body, 'the body is rendered, and hidden by CSS rather than dropped');
    assert.equal(body.querySelectorAll('button').length -
      body.querySelectorAll('.rl-cnote-add, .nego-vis, [data-rl-note-more], [data-nego-vis]').length <= 0,
      true, 'nothing in the fold is a verb on the change itself');
    /* And the action bar is a SIBLING of the head, never a child — that is what
       keeps a press on Send from folding the card underneath the hand. */
    assert.ok(!card.querySelector('.rl-card-head .rl-card-actions'),
      'the action bar must not be inside the toggle');
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
    assert.equal(card().getAttribute('data-rl-popped'), '0');
    card().querySelector('[data-rl-pop]').click();
    assert.equal(card().getAttribute('data-rl-popped'), '1', 'it opens on this seat too');
    assert.ok(host.querySelector('#rl-pop'), 'and the panel is inside THIS mount');
    card().querySelector('[data-rl-pop]').click();
    assert.equal(card().getAttribute('data-rl-popped'), '0', 'and closes here too');
    assert.ok(p.doc.getElementById('owner-mount-untouched'),
      'and the owner\'s workbench was not painted from inside their portal');
  });

  test('WO-2 · an open panel does not survive the mount being handed another contract', async () => {
    /* The owner's page forgets what was open when the reader moves on
       (renderRedline); a mount is not exempt from the rule, or a card arrives
       open on a change this reader has never seen. */
    const p = await page();
    const host = mountPortal(p);
    host.querySelector('#rl-changes .rl-card [data-rl-pop]').click();
    assert.equal(host.querySelector('#rl-changes .rl-card').getAttribute('data-rl-popped'), '1');
    p.win.redlineEmbed(host, Object.assign({}, p.c, { id: 'MK-OTHER' }), seatOpts());
    assert.equal(p.win.rlPopId(), null, 'the panel let go with the contract');
  });
});
