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

/* ---------- THE DOOR ONTO THE CLAUSE PANEL, 25 Aug 2026 ----------
   It used to be a button on the card's face; the owner's own drawing of this
   column puts it in the card's ⋯ menu, because the face carries the verbs and
   a fourth control competing with them on a 460px row is what the menu exists
   to stop. This presses the ⋯ FIRST and then the row, so every check that
   reaches for the door walks the journey a reader walks rather than reaching
   into markup a person cannot see. */
const cpDoor = p => {
  const more = p.$('#rl-changes .rl-card .rl-more-btn');
  if (more) more.dispatchEvent(new p.win.Event('click', { bubbles: true }));
  return p.$('#rl-changes .rl-card .rl-more-menu [data-rl-cp-open]');
};

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
  /* ---- WHICH SEAT'S DOOR THE PANEL IS (30 Aug 2026) ----
     The owner shut our seat's two doors onto the clause panel: at a usable
     width, with the edit page loaded, a clause is edited THERE and the panel is
     not drawn in front of us at all. The panel itself is untouched and is still
     the ONLY way the counterparty's page proposes wording — and the only way at
     a window too narrow for two columns.
     So the claims below, which are about the PANEL rather than about which seat
     reaches it, stage the world where it is still the door. `noEditor` is what
     ceTakesIt asks about by name. */
  async function page(o = {}){
    const w = buildWorld({ negotiationView: true });
    const { win } = w;
    if (o.noEditor){ win.rlOpenClauseEditor = undefined; win.clauseEditorFits = undefined; }
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

  /* ---- CLAIMS REVERSED IN PLACE, 16 Aug 2026 — THE CARD IS A ROUTING ROW ----
     The clamped two-line copy came back on 10 Aug because the card that was
     left read as a filing reference. What has changed since is that the CLAUSE
     PANEL exists and says everything the fat card said — the full wording, the
     author, the reason, the history, the reply box — on the clause the ask is
     about. So the card is now a short row: id and state, the clause name, the
     author's reason, and an Open that raises that panel. The pop-out
     (rlPop*, data-rl-pop, .rl-card-body) is retired with it. */
  test('the card says what is being asked for, in one bold line', async () => {
    /* REVERSED IN PLACE, 25 Aug 2026 (the owner's own drawing of this column).
       The claim is the one it has always made — A CARD MUST SAY WHAT IS BEING
       DECIDED — and what carries the sentence has moved: from a two-line
       greyed preview of the marked wording to the change's own SUMMARY, in
       bold, on its own line. It is still the real proposal in words, and the
       marks are on the paper twelve pixels away. .rl-card-diff is STALE. */
    const p = await page();
    assert.ok(p.$$('#rl-changes .rl-card').length, 'there is a card to look at');
    const sum = p.$('#rl-changes .rl-card .rl-card-sum');
    assert.ok(sum, 'the working card says what it is for');
    assert.ok(sum.textContent.includes('forty-five'), 'and it is the real proposal');
    assert.equal(p.$('#rl-changes .rl-card .rl-card-diff'), null,
      'and not as a second copy of the paper');
    const meta = p.$('#rl-changes .rl-card .rl-card-meta');
    assert.ok(meta && meta.textContent.trim(), 'and still names its clause');
  });

  test('the document still carries it in full', async () => {
    const p = await page();
    assert.ok(p.$$('#rl-doc ins, #rl-doc del').length,
      'the clause reads with its marks, in its own surroundings');
  });

  test('a draft arrives with nothing popped out, and a door to open', async () => {
    /* REVERSED: the door is Open — data-rl-cp-open, the clause panel's own
       delegated control — and there is no hidden body waiting to be borrowed:
       the reading matter lives in the panel from the start. */
    const p = await page({ noEditor: true });
    const card = p.$('#rl-changes .rl-card');
    assert.equal(p.win.rlCpOpenId(), null,
      'a panel is open only because somebody opened it');
    /* REVERSED IN PLACE, 25 Aug 2026: the door is a row in the card's ⋯ menu
       now (the owner's drawing), not a button on the face — the face carries
       the verbs, and a fourth control competing with them on a 460px row is
       what the menu exists to stop. The claim is unchanged: this card carries
       a real, worded door onto the clause panel, and it names the clause. */
    const open = card.querySelector('.rl-more-menu [data-rl-cp-open]');
    assert.ok(open, 'a real row, wearing a word, opens the clause panel');
    assert.ok(open.textContent.trim(), 'in words, not a glyph');
    assert.equal(open.getAttribute('data-rl-cp-open'), p.c.changes[0].clauseId,
      'and it names the clause the change sits in');
    assert.ok(card.querySelector('.rl-more-btn'), 'behind a ⋯ that is on the face');
    assert.equal(card.querySelector('[data-rl-pop]'), null, 'the pop-out door is gone');
    assert.equal(card.querySelector('.rl-card-body'), null,
      'and so is the hidden body it existed to show');
  });

  test('the reading matter is in the Notes panel, and rendered exactly once', async () => {
    /* REVERSED IN PLACE (27 Aug 2026): the composer moved from the clause panel
       to the Notes panel's two rooms. THE RULE IS UNCHANGED and is what this
       test has always been for — the pop-out BORROWED the card's body because a
       second copy of the composer posts nothing, and one copy per change is
       still the whole of it. Only the address moved. */
    const p = await page();
    const ch = p.c.changes[0];
    assert.equal(p.$$(`textarea#nego-ti-${ch.id}`).length, 0,
      'the mounted page carries none — the box is not on this surface any more');
    assert.equal(p.$('#rl-changes .rl-cnotes'), null,
      'the card renders no thread of its own');
    assert.equal(p.$('#rl-cp-body .rl-cnotes'), null,
      'and neither does the clause panel');
    const host = p.win.document.createElement('div');
    p.win.document.body.appendChild(host);
    p.win.rlNotesPanelPaint(host, p.c, ch, { side: 'owner' });
    assert.equal(p.win.document.querySelectorAll(`textarea#nego-ti-${ch.id}`).length, 1,
      'EXACTLY ONE in the whole document, once the panel is up');
  });

  test('pressing its head takes you to the change and leaves the panel shut', async () => {
    const p = await page();
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    p.$('#rl-changes .rl-card .rl-card-head')
      .dispatchEvent(new p.win.Event('click', { bubbles: true }));
    assert.equal(p.win.rlCpOpenId(), null, 'no panel opened — the head only navigates');
  });

  test('Open raises the clause panel on the change\'s own clause', async () => {
    const p = await page({ noEditor: true });
    const clauseId = p.c.changes[0].clauseId;
    cpDoor(p).click();
    assert.equal(p.win.rlCpOpenId(), clauseId, 'the panel opened on the right clause');
    const panel = p.$('#rl-cp');
    assert.ok(panel && panel.classList.contains('is-open'), 'and it is the page\'s ONE panel');
    const body = p.$(`#rl-cp-body .rl-cp-src[data-rl-cp-for="${clauseId}"]`);
    assert.ok(body && body.classList.contains('is-on'), 'showing this clause\'s body');
    assert.ok(body.querySelector(`[data-rl-cp-change="${p.c.changes[0].id}"]`),
      'which names the change the row routed from');
  });

  test('and the same press closes it', async () => {
    const p = await page({ noEditor: true });
    cpDoor(p).click();
    assert.ok(p.win.rlCpOpenId());
    cpDoor(p).click();
    assert.equal(p.win.rlCpOpenId(), null, 'the door is a toggle, like the pill');
  });

  test('the panel carries the wording in full, which the row does not carry at all', async () => {
    const p = await page({ noEditor: true });
    cpDoor(p).click();
    const body = p.$('#rl-cp-body .rl-cp-src.is-on');
    assert.ok(body.querySelector('.rl-cp-wd'), 'the ask\'s wording, unclamped');
    assert.ok(p.$('#rl-cp [data-rl-cp-close]'), 'and a way to shut it');
  });

  test('an open panel survives the column changing state underneath it', async () => {
    const p = await page({ noEditor: true });
    cpDoor(p).click();
    const id = p.win.rlCpOpenId();
    assert.ok(id);
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    assert.equal(p.win.rlCpOpenId(), id, 'still open on the same clause');
    assert.ok(p.$('#rl-cp-body .rl-cp-src.is-on'),
      'and rlCpPaint re-flipped the fresh markup after the repaint');
  });

  test('and it shuts when its clause leaves the paper', async () => {
    const p = await page({ noEditor: true });
    cpDoor(p).click();
    p.win.rlCpSetOpen('CL-DOES-NOT-EXIST');
    p.again();
    assert.equal(p.win.rlCpOpenId(), null,
      'a panel over wording no longer on the paper is the one thing this page may not do');
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
      /* Was the card's note box, then the clause panel's. It is the Notes
         panel's now — one per room — and the requirement is the same one this
         roll call has always made: it is a TEXTAREA, not a one-line input. */
      ['js/views/negotiation.js', /<textarea class="chat-field rl-np-in"[^>]*id="nego-ti-/, 'a note in the Notes panel'],
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
    /* THE NEGOTIATION PAGE'S SHEET MOVED on 21 Aug 2026 into its own file — the
       rule this walks for is in negotiation-css.js now, unchanged. The list is
       "every file that declares one of these boxes", so the new file joins it. */
    for (const f of ['index.html', 'js/views/negotiation-css.js']){
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
describe('F100e — the pop-out is retired; Open raises the clause panel', () => {
  /* ---- WHAT THIS BLOCK USED TO PIN, AND WHY IT DOES NOT ----
     Auto-open, hover-peek, the in-place toggle and then the floating pop-out
     each had a turn deciding how a card's reading matter was reached, and each
     was replaced. The pop-out went on 16 Aug 2026 (owner-asked): the clause
     panel says everything it said, on the clause, and the card is a routing
     row whose Open raises THAT panel.

     WHAT SURVIVES, and matters more than the layout: pressing a card takes you
     to its clause and does only that; the verbs are on the row whatever is
     open; and nothing but a press opens or closes the panel. */

  async function page(o = {}){
    const w = buildWorld({ negotiationView: true });
    const { win } = w;
    if (o.noEditor){ win.rlOpenClauseEditor = undefined; win.clauseEditorFits = undefined; }
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
  /* RE-POINTED 25 Aug 2026: the door onto the panel is a row in the card's ⋯
     menu. Pressed through the ⋯ rather than reached straight out of the DOM,
     so this walks the journey a reader walks. */
  const openBtn = p => cpDoor(p);

  test('every card arrives with nothing popped out', async () => {
    /* REVERSED IN PLACE: "popped out" is the clause panel now, and the row
       carries none of the pop-out's markup. */
    const p = await page();
    assert.equal(p.win.rlCpOpenId(), null);
    assert.equal(p.$('#rl-pop'), null, 'the pop-out is never drawn');
    assert.equal(p.$('#rl-changes [data-rl-pop]'), null, 'its door is gone from every row');
    assert.equal(p.$('#rl-changes .rl-card-body'), null, 'and so is the hidden body');
    assert.equal(typeof p.win.rlPopId, 'undefined', 'the machinery itself is retired');
  });

  test('one press opens it, the same press closes it', async () => {
    const p = await page({ noEditor: true });
    const clauseId = p.c.changes[0].clauseId;
    openBtn(p).click();
    assert.equal(p.win.rlCpOpenId(), clauseId);
    assert.ok(p.$('#rl-cp.is-open'));
    openBtn(p).click();
    assert.equal(p.win.rlCpOpenId(), null);
    assert.equal(p.$('#rl-cp.is-open'), null, 'shut, and says so');
  });

  test('THE ONE THAT WOULD HURT: the box carries its own wiring, wherever it is drawn', async () => {
    /* This asked that the box sit INSIDE the engine's mount, because the
       engine's send was scoped to that mount and a box outside it accepted
       typing and never sent. THE PANEL IS OUTSIDE THAT MOUNT — it is the
       shell's drawer — so the rule is met the other way: the panel wires its
       OWN send at paint, and a panel painted anywhere is a panel that sends. */
    const p = await page();
    const ch = p.c.changes[0];
    const host = p.doc.createElement('div');
    p.doc.body.appendChild(host);
    p.win.rlNotesPanelPaint(host, p.c, ch, { side: 'owner' });
    const box = host.querySelector(`textarea#nego-ti-${ch.id}`);
    assert.ok(box, 'the reply box exists, in the panel');
    assert.equal(box.closest('#rl-changes'), null, 'not in the column\'s scroller');
    assert.ok(host.querySelector('[data-rl-np-send]'), 'and its send is beside it');
    const before = (ch.thread || []).length;
    box.value = 'Thirty days is our fallback.';
    host.querySelector('[data-rl-np-send]').dispatchEvent(
      new p.win.Event('click', { bubbles: true }));
    return new Promise(r => setImmediate(() => {
      assert.equal((ch.thread || []).length, before + 1,
        'A PRESS REALLY FILES: the box is wired, not merely drawn');
      r();
    }));
  });

  test('the conversation renders once, in the Notes panel, never as a second copy', async () => {
    /* The claim that matters, carried unchanged through three homes: a second
       copy of a change's conversation is a composer with no handlers. It used
       to be the card's, then the clause panel's; it is the Notes panel's now,
       and the count is still one. */
    const p = await page();
    const ch = p.c.changes[0];
    assert.equal(p.doc.querySelectorAll('.rl-cnotes').length, 0,
      'the retired block is drawn nowhere at all');
    const host = p.doc.createElement('div');
    p.doc.body.appendChild(host);
    p.win.rlNotesPanelPaint(host, p.c, ch, { side: 'owner' });
    assert.equal(p.doc.querySelectorAll('.rl-np-list').length, 1,
      'exactly one conversation in the document');
    assert.equal(p.doc.querySelectorAll('[data-rl-np-send]').length, 1,
      'and exactly one send');
  });

  test('pressing a card takes you to its clause and pops nothing out', async () => {
    const p = await page();
    p.$('#rl-changes .rl-card .rl-card-head')
      .dispatchEvent(new p.win.Event('click', { bubbles: true }));
    assert.equal(p.win.rlCpOpenId(), null);
  });

  test('hovering does nothing at all', async () => {
    const p = await page();
    const card = p.$('#rl-changes .rl-card');
    card.dispatchEvent(new p.win.Event('mouseenter'));
    card.dispatchEvent(new p.win.Event('mouseover'));
    assert.equal(p.win.rlCpOpenId(), null, 'the column does not move under a passing pointer');
  });

  test('an open panel survives a repaint', async () => {
    const p = await page({ noEditor: true });
    openBtn(p).click();
    const id = p.win.rlCpOpenId();
    p.again();
    assert.equal(p.win.rlCpOpenId(), id);
    assert.ok(p.$('#rl-cp.is-open'), 'rlCpPaint re-flipped the fresh markup');
  });

  test('and it does not travel to another contract', async () => {
    const p = await page({ noEditor: true });
    openBtn(p).click();
    assert.ok(p.win.rlCpOpenId());
    p.win.rlCardForgetPins('SOME-OTHER-CONTRACT');
    assert.equal(p.win.rlCpOpenId(), null);
  });

  test('the choice is not persisted anywhere', async () => {
    const p = await page({ noEditor: true });
    openBtn(p).click();
    assert.ok(!/rlCp|rl-cp|rlPop|rl-pop/i.test(JSON.stringify(p.win.localStorage)),
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

  async function page(o = {}){
    const w = buildWorld({ negotiationView: true });
    const { win } = w;
    if (o.noEditor){ win.rlOpenClauseEditor = undefined; win.clauseEditorFits = undefined; }
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

  test('WO-2 · every card is a routing row on this seat too', async () => {
    /* Their page mounts the same renderer, so the row arrives by construction
       — but "by construction" is the claim, not the proof. REVERSED IN PLACE
       (16 Aug 2026): no pop markup on either state, and the Open door is drawn
       only where the mount carries the panel — this bare harness does not, and
       a door with no room behind it must not be drawn (the panes mount below,
       in the WO-2 mount tests, has both). */
    const p = await page();
    const done = seat(p).querySelector('[data-rl-origin="us"]');
    assert.equal(done.querySelector('[data-rl-pop]'), null, 'the pop-out door is gone');
    assert.equal(done.querySelector('.rl-card-body'), null, 'and its hidden body with it');
    const live = seat(p, { unsentIds: [p.c.changes[0].id] }).querySelector('[data-rl-origin="us"]');
    assert.ok(live.querySelector('.rl-card-head'), 'its head takes them to the clause');
    assert.equal(live.querySelector('.rl-open-btn'), null,
      'no panel on this mount, so no door promising one');
    const withPanel = seat(p, { unsentIds: [p.c.changes[0].id], cpPanel: true })
      .querySelector('[data-rl-origin="us"]');
    assert.ok(withPanel.querySelector('.rl-open-btn[data-rl-cp-open]'),
      'where the mount has the panel, the row has its Open');
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
    /* CLAIM UPDATED, 13 Aug 2026: the status words were trimmed. "Accepted ·
       sent" is now just "Accepted" — a decision on the card is only ever shown
       there once it has gone, and the one that has NOT gone says "· held", so
       the word "sent" was carrying nothing the other branch did not. The
       hover text says it whole. */
    assert.equal(card.querySelector('.rl-badge').textContent.trim(), 'Accepted',
      'the state under test is answered AND gone');
    assert.match(card.querySelector('.rl-badge').getAttribute('title'), /gone to the other side/,
      'and the sentence the word gave up is in the hover text');
    /* And "Change decision" is "Reopen" — same button, same escape hatch. */
    assert.ok(verbsOf(card).includes('Reopen'),
      'the escape hatch is still on the card');
  });

  test('a REJECTION that has been sent folds the same way', async () => {
    /* Accept and reject are the same act as far as the column is concerned:
       answered, gone, nobody waiting. Asserted separately because the badge
       and the verb list are built from the status, so "accepted works" is not
       evidence about the other half of the decision. */
    const p = await page();
    const { card } = await decided(p, 'rejected', 'sent');
    assert.match(card.querySelector('.rl-badge').textContent, /Rejected/);
    assert.ok(card.querySelector('.rl-card-head'), 'and one press away, like every card');
  });

  test('but the badge stays readable while it is folded', async () => {
    /* CLAIM REVERSED IN PLACE (16 Aug 2026): there is no fold and no hidden
       body left — the row IS the head plus its verbs, so the answer and the
       clause it belongs to are visible by construction. Asserted rather than
       assumed, because "nothing can hide it" is exactly the kind of claim
       that quietly stops being true. */
    const p = await page();
    const { card } = await decided(p, 'accepted', 'sent');
    assert.equal(card.querySelector('.rl-card-body'), null, 'no hidden body at all');
    assert.ok(card.querySelector('.rl-card-head .rl-badge'),
      'the status badge is in the head, on screen');
    assert.ok(card.querySelector('.rl-card-head .rl-card-meta'),
      'and so is the clause it belongs to');
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
  });

  test('the verbs are on the card, and there is no fold left to hide them in', async () => {
    /* This has moved three times and the direction is the point: open-by-rule,
       then rendered-one-press-away, then out of the foldable body, and now (16
       Aug 2026) there is NO fold and no hidden body at all — the row is its
       head, its visible strips and its action bar, so nothing pressable can be
       out of sight by construction. Asserted rather than assumed. */
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
      assert.ok(card.querySelector('.rl-card-head'), `${what} has a head to press`);
      assert.ok(card.querySelector('.rl-card-actions .rl-card-verbs button'),
        `${what} carries its verbs on the action bar`);
      assert.equal(card.querySelector('.rl-card-body'), null,
        `${what}: no hidden body for a verb to be lost in`);
    }
  });

  test('and what the fold hides is reading matter, not a move waiting on anybody', async () => {
    /* CLAIM REVERSED IN PLACE (16 Aug 2026): the fold is gone. What stays
       visible on the row (.rl-card-info — the reason, the on-behalf and
       revised-by stamps, the reviewer's note) is reading matter carrying no
       verb on the change; the verbs live in .rl-card-actions, a SIBLING of the
       head, so a press on Send can never navigate or fold anything. */
    const p = await page();
    const theirs = (await ownerAsk(p)).id;
    const card = seat(p, {}).querySelector(`[data-nego-card="${theirs}"]`);
    const info = card.querySelector('.rl-card-info');
    assert.ok(!info || !info.querySelector('[data-nego-accept],[data-nego-reject],[data-rl-send],[data-rl-retract],[data-nego-undo]'),
      'nothing in the info strips is a verb on the change itself');
    assert.ok(!card.querySelector('.rl-card-head .rl-card-actions'),
      'the action bar must not be inside the press-through');
  });

  /* ---- THE MOUNT REPAINTS ITSELF, OR THE PIN NEVER LETS GO ---- */
  const mountPortal = p => {
    const host = p.doc.getElementById('share-root');
    const o = seatOpts();
    o.rerender = () => p.win.redlineEmbed(host, p.c, o);
    p.win.redlineEmbed(host, p.c, o);
    return host;
  };

  test('WO-2 · Open works inside THIS mount, never the owner\'s workbench', async () => {
    const p = await page();
    /* A marker in the owner's mount. The clause panel's door is delegated on
       document; the panel it opens must be the one inside THIS mount, and
       nothing may repaint the owner's page from inside their portal. */
    p.doc.getElementById('content').innerHTML = '<b id="owner-mount-untouched"></b>';
    const host = mountPortal(p);
    const card = () => host.querySelector('#rl-changes .rl-card');
    assert.ok(card().querySelector('.rl-open-btn'), 'the row has its Open on this seat too');
    card().querySelector('.rl-open-btn').click();
    assert.ok(p.win.rlCpOpenId(), 'it opens on this seat too');
    assert.ok(host.querySelector('#rl-cp.is-open'), 'and the panel is inside THIS mount');
    card().querySelector('.rl-open-btn').click();
    assert.equal(p.win.rlCpOpenId(), null, 'and closes here too');
    assert.ok(p.doc.getElementById('owner-mount-untouched'),
      'and the owner\'s workbench was not painted from inside their portal');
  });

  test('WO-2 · an open panel does not survive the mount being handed another contract', async () => {
    /* The owner's page forgets what was open when the reader moves on
       (renderRedline); a mount is not exempt from the rule, or a panel arrives
       open on a clause this reader has never seen. */
    const p = await page();
    const host = mountPortal(p);
    host.querySelector('#rl-changes .rl-card .rl-open-btn').click();
    assert.ok(p.win.rlCpOpenId());
    p.win.redlineEmbed(host, Object.assign({}, p.c, { id: 'MK-OTHER' }), seatOpts());
    assert.equal(p.win.rlCpOpenId(), null, 'the panel let go with the contract');
  });
});

/* ============================================================ */
describe('F100g — a card\'s Send sends that card, and only that card', () => {
  /* Owner-reported 16 Aug 2026, in exactly these words: "when I have multiple
     edits that need to be sent, there is a bug where if I click on one card to
     send, it sends all the cards." It was not a bug until the owner ruled it
     one — the 11 Aug decision was "one send, batch semantics" — but the ruling
     stands and REVERSES it: a card's Send now marks itself a SOLO send, and
     onSendDirect holds every OTHER unsent draft back (negoHoldOthers) so the
     round that leaves carries exactly the chosen change. The batch doors —
     the "Send all N" band and Publish Round — release the hold on their way
     through, because a batch door means "send everything".

     THE HOLD IS ITS OWN RECORD (negotiation.holdIds), because `turnAt` cannot
     say "this draft went and that one did not": it is one timestamp for the
     whole desk, and the moment a solo send moved it, every older draft would
     have silently flipped to Sent without ever leaving. */
  async function page(o = {}){
    const w = buildWorld({ negotiationView: true, contractView: true });
    const { win } = w;
    if (o.noEditor){ win.rlOpenClauseEditor = undefined; win.clauseEditorFits = undefined; }
    win.promptDialog = async () => '';
    win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
    win.copilotAvailable = () => false;
    const post = { reshared: 0, modals: 0 };
    win.openShareModal = () => { post.modals++; };
    win.counterpartyContact = () => ({ name: 'Erik', email: 'erik@kabras.co.ke', channel: 'email' });
    win.reshareToLastRecipient = async () => { post.reshared++; return { delivered: true }; };
    win.cachedShares = () => [];
    const c = supplyContract();
    win.negoInit(c);
    /* TWO drafts of our own, the reported state. */
    await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'forty-five (45) days'),
      { side: 'owner', author: 'Young Mbagaya' });
    await win.negoFileProposal(c, win.negoResolvedText(c) + '\nA cap on liability of 100% of fees.',
      { side: 'owner', author: 'Young Mbagaya' });
    win.rlSetCardFilter('all');
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
    win.getContract = id => (id === c.id ? c : null);
    win.renderRedline();
    const $ = s => win.document.querySelector(s);
    const $$ = s => [...win.document.querySelectorAll(s)];
    const settle = async () => { for (let i = 0; i < 4; i++) await new Promise(r => setImmediate(r)); };
    return { w, win, c, post, $, $$, settle, again: () => win.renderRedline() };
  }
  /* WHERE THE COLUMN SAYS ONE CHANGE STANDS. RE-POINTED 26 Aug 2026: this
     read the row's own status word and fell back to the heading only where the
     row drew none. Our seat's row draws none at all now — every settled and
     every review state has a heading of its own, so a word at the end of the
     row would only repeat the one above it — and the heading is the whole
     answer. It reads the band's KEY rather than its label: the key is what the
     renderer files a change under, the label is a translated string, and a
     test pinning the string breaks the day somebody rewords a heading. */
  const standsAt = (p, id) => {
    let n = p.$(`[data-nego-card="${id}"]`);
    n = n && n.previousElementSibling;
    while (n && !n.classList.contains('rl-band')) n = n.previousElementSibling;
    return n ? n.getAttribute('data-rl-band') : '';
  };

  test('THE FIX: one card\'s Send publishes that change and holds the other back', async () => {
    const p = await page();
    const [a, b] = p.c.changes.map(x => x.id);
    assert.equal(p.win.negoUnsentAsks(p.c, 'owner').length, 2, 'both start unsent');
    p.$(`[data-nego-card="${a}"] [data-rl-send]`).click();
    await p.settle();
    p.again();
    assert.equal(p.post.reshared, 1, 'one round went');
    assert.equal(p.post.modals, 0, 'and no dialog');
    assert.equal(standsAt(p, a), 'with', 'the chosen change has gone');
    assert.equal(standsAt(p, b), 'drafts', 'the other is still a draft on the desk');
    /* Joined, not deep-compared: the page realm's Array prototype is not this
       realm's — the f60 trap this file already documents. */
    assert.equal(p.win.negoUnsentAsks(p.c, 'owner').map(x => x.id).join(','), b,
      'the arithmetic agrees: one unsent draft remains');
    assert.equal([...p.win.negoHeldBackIds(p.c)].join(','), b,
      'held by its own record, not by the turn stamp');
    assert.ok(p.$(`[data-nego-card="${b}"] [data-rl-send]`),
      'and its own Send is still on its card');
    /* CLAIM REVERSED IN PLACE, 26 Aug 2026: the strip went, the act moved into
       the column's head, and the count went with the act. */
    assert.match(p.$('.rl-unsent-go').textContent, /1/, 'and the head counts what is left');
  });

  test('a sent ask carries no verbs; the draft keeps its Send', async () => {
    /* ---- REVERSED IN PLACE, 25 Aug 2026 — the owner's own drawing ----
       Option 4 (owner-asked 16 Aug 2026) answered "the cards look empty" by
       making the card's SIZE follow what it needs from the reader: a change
       that needs nothing shrank to one line, a change that needs a decision
       kept a full card. The new drawing answers the same question a different
       way: every card on our seat is ONE SHAPE, and the four BANDS say which
       pile a change is in — so a reader skips "with them" by skipping a
       heading rather than by reading a shorter row. .rl-receipt is the
       COUNTERPARTY's shape now and is asserted there (F100f).

       WHAT IT COSTS, said out loud: three sent asks used to cost less height
       than one working card and now cost three cards. What it buys is that
       every card reads the same way and states its own summary.

       THE CLAIM IS THE ONE THIS ALWAYS MADE and is unchanged: after the solo
       send, change A has nothing left to press — it cannot be sent again and
       there is nothing to decide on our own ask — while change B is still work
       and still carries its own Send. Edit stays on a sent ask deliberately:
       revising one is what the funnel's revision fold is for. */
    const p = await page();
    const [a, b] = p.c.changes.map(x => x.id);
    p.$(`[data-nego-card="${a}"] [data-rl-send]`).click();
    await p.settle();
    p.again();
    const sent = p.$(`[data-nego-card="${a}"]`);
    assert.equal(sent.querySelector('[data-rl-send]'), null, 'the sent ask cannot be sent twice');
    assert.equal(sent.querySelector('[data-nego-accept],[data-nego-reject]'), null,
      'and there is nothing to decide on our own ask');
    assert.equal(sent.querySelector('.rl-card-diff'), null, 'and carries no second copy of the paper');
    /* RE-POINTED 30 Aug 2026. The claim is what it always was — A SENT ASK
       STILL HAS A WAY INTO ITS OWN WORDING — and only which door that is has
       moved: on our seat, with the edit page loaded, the ⋯ opens THAT rather
       than the clause panel, because the owner shut the panel's doors on this
       seat. Written as the question rather than as one answer, so it holds on
       either stage and fails on a card with no way in at all. */
    assert.ok(sent.querySelector('[data-rl-cp-editor-row], [data-rl-cp-open]'),
      'the card carries its door into the wording — on the face where there is '
      + 'room for it, in the ⋯ where there is not');
    assert.ok(sent.querySelector('.rl-card-head'), 'and the body still presses through');
    assert.equal(sent.querySelector('.rl-badge'), null,
      'and says nothing itself — the heading two lines up is where it stands');
    const draft = p.$(`[data-nego-card="${b}"]`);
    assert.ok(draft.querySelector('.rl-card-sum'), 'work says what it is about');
    assert.ok(draft.querySelector('[data-rl-send]'), 'and carries its Send');
    /* THE BANDS ARE WHAT TELL THE TWO PILES APART NOW. */
    const bands = [...p.$$('#rl-changes .rl-band')].map(x => x.getAttribute('data-rl-band'));
    assert.ok(bands.includes('with') && bands.includes('drafts'),
      'one is with them, one is still on the desk, and the column says so');
  });

  test('the payload subtracts the held draft the way it subtracts a reviewer\'s holds', () => {
    /* Source-level, like F100a's one-rule check: buildSharePayload lives in
       js/core.js, which this stage does not load. The claim is that the
       held-back set folds negoHeldBackIds UNCONDITIONALLY — the round send
       passes no options, and a flag-gated filter would push a held draft down
       the ordinary path. */
    const src = read('js/core.js');
    assert.match(src, /if \(window\.negoHeldBackIds\)\{/,
      'the payload asks the engine for the solo send\'s holds');
    assert.match(src, /for \(const id of negoHeldBackIds\(c\)\) heldBack\.add\(id\);/,
      'and folds them into the one held-back set, unconditionally');
  });

  test('the batch door releases the hold, and the held draft finally travels', async () => {
    const p = await page();
    const [a, b] = p.c.changes.map(x => x.id);
    p.$(`[data-nego-card="${a}"] [data-rl-send]`).click();
    await p.settle();
    p.again();
    /* The band's "Send all N" is a [data-redline-proxy] door — a batch door —
       so pressing it must clear the hold and send what was kept back. */
    p.$('.rl-unsent-go').dispatchEvent(new p.win.Event('click', { bubbles: true }));
    await p.settle();
    p.again();
    assert.equal(p.post.reshared, 2, 'a second round went');
    assert.equal(p.win.negoHeldBackIds(p.c).length, 0, 'nothing is held any more');
    assert.equal(p.win.negoUnsentAsks(p.c, 'owner').length, 0, 'nothing reads unsent');
    assert.equal(standsAt(p, b), 'with', 'the once-held draft has gone');
  });

  test('the hold is self-cleaning: a decided change falls out on its own', async () => {
    const p = await page();
    const [a, b] = p.c.changes.map(x => x.id);
    p.win.negoHoldOthers(p.c, a);
    assert.equal([...p.win.negoHeldBackIds(p.c)].join(','), b);
    p.c.changes.find(x => x.id === b).status = 'withdrawn';
    assert.equal(p.win.negoHeldBackIds(p.c).length, 0,
      'a change that left the table cannot be "held back" from anything');
  });

  test('the counterparty\'s card Send is untouched — their answers travel as one envelope', async () => {
    /* Their seat holds decisions AND proposals until one Send, by design; the
       card's title says so and F100f pins the verbs. What this asserts is that
       the SOLO machinery is the owner's: their press targets the decisions
       postbox and never writes a hold on the contract. */
    const p = await page();
    /* A held DECISION is an answered change still on their page — the badge
       and verbs branch on status !== 'pending'. */
    p.c.changes[0].status = 'accepted';
    const box = p.win.document.createElement('div');
    box.innerHTML = p.win.redlineChangeCardsHtml(p.c, { side: 'counterparty',
      org: 'Wanjiru Catering Ltd', hiddenIds: [], holdsDecisions: true,
      heldDecisionIds: [p.c.changes[0].id], unsentIds: [] });
    const send = box.querySelector('[data-rl-send]');
    assert.ok(send, 'their held answer carries its Send');
    assert.match(send.getAttribute('title') || '', /everything else held/i,
      'and its title still promises the batch');
  });
});
