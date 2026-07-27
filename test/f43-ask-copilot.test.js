/* f43 — Ask Copilot, scoped to the negotiation on the screen
   ============================================================
   One box, two capabilities, and the split is the point:

     SEARCH always works. It reads the clauses and change records already in
     memory — no key, no network — so "where does it say ninety days" is
     answerable on a contract, in a browser, offline. That is most of what
     people actually want from a box like this.

     ANSWERS come from copilotAsk() in js/ai.js, the same engine the rest of the
     app uses, reused rather than reimplemented. It needs an Anthropic key.
     Without one the dock says so plainly rather than appearing broken.

   And the rule that outranks both: Copilot READS this contract, it never edits
   it. A machine quietly altering a legal instrument is the failure the whole
   change model exists to prevent, and a chat box is not a way around it. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

const own = xs => Array.from(xs);

function contract(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
async function negotiated(win){
  const c = contract();
  win.negoInit(c);
  for (const n of ['5', '6']){
    const cl = win.negoClauseList(c).find(x => x.num === n);
    await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[n].text}</p>`,
      { side: 'counterparty', author: 'Erik Lindqvist', summary: F.PROTO_ASKS[n].summary });
  }
  return c;
}

describe('search reads the contract, with no key and no network', () => {
  test('it finds wording and names the clause it is in', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    const hits = win.negoSearch(c, 'one hundred and twenty');
    assert.equal(hits.length, 1);
    assert.equal(hits[0].where, 'clause');
    assert.equal(hits[0].label, 'Clause 5 · Storage Conditions and Duration');
    assert.match(hits[0].snippet, /one hundred and twenty \(120\) days/);
    assert.ok(hits[0].clauseId, 'and carries the clause id, so the result can jump there');
  });

  test('a clause is ONE result however many times the word occurs in it', () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    const hits = win.negoSearch(c, 'goods');
    assert.equal(new Set(hits.map(h => h.clauseId)).size, hits.length,
      'no clause may appear twice — four rows pointing at one paragraph buries the rest');
    const five = hits.find(h => /Clause 5/.test(h.label));
    assert.ok(five.more >= 1, 'the extra occurrences are counted, not repeated');
  });

  test('it matches a heading on its own — "the liability clause"', () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    const hits = win.negoSearch(c, 'Termination Notice');
    assert.equal(hits.length, 1);
    assert.equal(hits[0].where, 'heading', 'the words are in the label, not the wording under it');
    assert.equal(hits[0].label, 'Clause 9 · Termination Notice');
  });

  test('it searches the proposed wording, not only the current wording', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const hits = win.negoSearch(c, 'EUR 250,000');
    const onChange = hits.find(h => h.where === 'change');
    assert.ok(onChange, 'wording that only exists as a PROPOSAL must still be findable');
    assert.equal(onChange.side, 'proposed', 'and be reported as proposed, not as the contract');
    assert.match(onChange.label, /^#CHG-\d+ · Clause 6/);
    assert.ok(onChange.changeId, 'carrying the change id, so the result jumps to the card');
  });

  test('it is case-insensitive, and ignores a query too short to mean anything', () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    assert.ok(win.negoSearch(c, 'KENYA').length, 'case must not matter');
    assert.ok(win.negoSearch(c, 'kenya').length);
    assert.equal(win.negoSearch(c, 'a').length, 0, 'one letter is not a search');
    assert.equal(win.negoSearch(c, '   ').length, 0);
    assert.equal(win.negoSearch(c, '').length, 0);
  });

  test('nothing matching is nothing found, not an error', () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    assert.deepEqual(own(win.negoSearch(c, 'zanzibar')), []);
  });
});

describe('the context Copilot is given is this negotiation', () => {
  test('it carries the clauses, the changes and whose turn it is', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const ctx = win.negoCopilotContext(c);

    assert.equal(ctx.surface, 'negotiation-room');
    assert.equal(ctx.contractId, 'MK-191');
    assert.equal(ctx.counterparty, 'Nordfrakt Logistik AB');
    assert.equal(ctx.round, 1);
    assert.equal(ctx.turn, 'owner');
    assert.equal(ctx.clauses.length, 6);
    assert.deepEqual(own(ctx.clauses.map(x => x.label)).slice(0, 2),
      ['Clause 1 · Scope of Services', 'Clause 4 · Payment Terms']);
    assert.equal(ctx.changes.length, 2);
    assert.equal(ctx.changes[0].status, 'pending');
    assert.equal(ctx.changes[0].author, 'Erik Lindqvist');
    assert.ok(ctx.changes[1].proposedWording.includes('EUR 250,000'),
      'both the current and the proposed wording travel, or an answer about a change is guesswork');
    assert.ok(ctx.changes[1].currentWording.includes('full replacement value'));
  });

  test('a very long contract is capped rather than sent whole', () => {
    const { win } = buildWorld();
    const long = '<h1>T</h1><h2>Clause 1 · Schedule</h2><p>'
      + 'word '.repeat(40000) + '</p>';
    const c = contract({ redlineText: long });
    win.negoInit(c);
    const ctx = win.negoCopilotContext(c);
    assert.ok(ctx.workingText.length <= win.NEGO_CTX_CHARS + 32,
      `the context must be bounded, got ${ctx.workingText.length}`);
    assert.match(ctx.workingText, /\[truncated\]$/, 'and must say that it was cut, not pretend to be whole');
  });
});

describe('the dock, in the room', () => {
  function room(c, over = {}){
    const win = buildWorld({ negotiationView: true }).win;
    return { win };
  }
  async function mounted(){
    const w = buildWorld({ negotiationView: true });
    const win = w.win;
    const c = await negotiated(win);
    win.renderNegotiationTab(c, { hostId: 'nego-tab', side: 'owner', by: 'Wanjiru Kamau' });
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const root = win.document.body;
    return { win, c, $: sel => root.querySelector(sel), $$: sel => Array.from(root.querySelectorAll(sel)) };
  }

  test('the room carries an Ask Copilot button and a closed dock', async () => {
    const m = await mounted();
    assert.ok(m.$('#nego-copilot'), 'the button must be in the top bar');
    assert.match(m.$('#nego-copilot').textContent, /Ask Copilot/);
    const dock = m.$('#nego-copilot-dock');
    assert.ok(dock, 'the dock must be in the room, not in the shell behind it');
    assert.ok(!dock.className.includes('open'), 'and it starts closed');
  });

  test('the button opens it and the close button shuts it', async () => {
    const m = await mounted();
    m.$('#nego-copilot').click();
    assert.ok(m.$('#nego-copilot-dock').className.includes('open'));
    m.$('#nego-cop-close').click();
    assert.ok(!m.$('#nego-copilot-dock').className.includes('open'));
  });

  test('with no key it says so, and still searches', async () => {
    const m = await mounted();
    m.win.copilotAvailable = () => false;
    m.win.copilotBrainInfo = () => ({ live: false, label: 'Basic mode', hint: 'no key' });
    m.win.renderNegotiationTab(m.c, { hostId: 'nego-tab', side: 'owner', by: 'Wanjiru Kamau' });
    m.win.openNegotiationRoom(m.c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });

    m.$('#nego-copilot').click();
    assert.match(m.$('.nego-cop-brain').textContent, /Search only/,
      'the dock must say which mode it is in rather than look broken');

    m.$('#nego-cop-input').value = 'ninety';
    m.$('#nego-cop-form').dispatchEvent(new m.win.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    const feed = m.$('#nego-cop-feed').textContent;
    assert.match(feed, /Found/, 'search must run with no key at all');
    assert.match(feed, /Clause 5/, 'and name the clause');
    assert.match(feed, /need a Copilot key/, 'and say plainly why there is no prose answer');
  });

  test('a search result is a button that jumps to the clause', async () => {
    const m = await mounted();
    m.$('#nego-copilot').click();
    m.$('#nego-cop-input').value = 'Governing Law';
    m.$('#nego-cop-form').dispatchEvent(new m.win.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    const hits = m.$$('.nego-cop-hit');
    assert.ok(hits.length, 'a result that cannot be clicked has done half a job');
    hits[0].click();
    assert.ok(!m.$('#nego-copilot-dock').className.includes('open'),
      'jumping closes the dock so the clause is not behind it');
  });

  test('with a key it asks the app’s own Copilot, given this negotiation', async () => {
    const m = await mounted();
    let seen = null;
    m.win.copilotAvailable = () => true;
    m.win.copilotBrainInfo = () => ({ live: true, label: 'Claude Copilot', hint: '' });
    m.win.copilotAsk = async (messages, context) => { seen = { messages, context };
      return { answer: 'Clause 5 now proposes ninety days.' }; };
    m.win.renderNegotiationTab(m.c, { hostId: 'nego-tab', side: 'owner', by: 'Wanjiru Kamau' });
    m.win.openNegotiationRoom(m.c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });

    m.$('#nego-copilot').click();
    m.$('#nego-cop-input').value = 'how long can goods be stored?';
    m.$('#nego-cop-form').dispatchEvent(new m.win.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    assert.ok(seen, 'the existing Copilot engine must be the one asked');
    assert.equal(seen.messages[0].content, 'how long can goods be stored?');
    assert.equal(seen.context.surface, 'negotiation-room', 'scoped to this page');
    assert.equal(seen.context.contractId, 'MK-191');
    assert.equal(seen.context.changes.length, 2, 'and told what is on the table');
    assert.match(m.$('#nego-cop-feed').textContent, /Clause 5 now proposes ninety days/);
  });

  test('it says once that it reads the contract and never edits it', async () => {
    const m = await mounted();
    m.win.copilotAvailable = () => true;
    m.win.copilotBrainInfo = () => ({ live: true, label: 'Claude Copilot', hint: '' });
    m.win.copilotAsk = async () => ({ answer: 'Net-45 reads correctly.' });
    m.win.renderNegotiationTab(m.c, { hostId: 'nego-tab', side: 'owner', by: 'Wanjiru Kamau' });
    m.win.openNegotiationRoom(m.c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });

    m.$('#nego-copilot').click();
    m.$('#nego-cop-input').value = 'check the spelling of clause 4';
    m.$('#nego-cop-form').dispatchEvent(new m.win.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    assert.match(m.$('#nego-cop-feed').textContent, /never edits it/);
  });

  /* THE rule. Asked in the least convenient way: a Copilot that returns
     something shaped like an instruction must still change nothing. */
  test('asking Copilot changes no wording and files no fingerprint', async () => {
    const m = await mounted();
    const textBefore = m.win.docPlainText(m.c);
    const changesBefore = m.win.negoChanges(m.c).length;
    const versionsBefore = (m.c.versions || []).length;

    m.win.copilotAvailable = () => true;
    m.win.copilotBrainInfo = () => ({ live: true, label: 'Claude Copilot', hint: '' });
    m.win.copilotAsk = async () => ({ answer: 'I have updated clause 4 to Net-60 for you.' });
    m.win.renderNegotiationTab(m.c, { hostId: 'nego-tab', side: 'owner', by: 'Wanjiru Kamau' });
    m.win.openNegotiationRoom(m.c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });

    m.$('#nego-copilot').click();
    m.$('#nego-cop-input').value = 'change clause 4 to Net-60';
    m.$('#nego-cop-form').dispatchEvent(new m.win.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    assert.equal(m.win.docPlainText(m.c), textBefore, 'the wording is untouched');
    assert.equal(m.win.negoChanges(m.c).length, changesBefore, 'no fingerprint was filed');
    assert.equal((m.c.versions || []).length, versionsBefore, 'no version was captured');
    assert.ok(!m.win.docPlainText(m.c).includes('Net-60'),
      'however the answer is phrased, the document does not move');
  });

  test('a Copilot failure is reported, not swallowed', async () => {
    const m = await mounted();
    m.win.copilotAvailable = () => true;
    m.win.copilotBrainInfo = () => ({ live: true, label: 'Claude Copilot', hint: '' });
    m.win.copilotAsk = async () => { throw new Error('rate limited'); };
    m.win.renderNegotiationTab(m.c, { hostId: 'nego-tab', side: 'owner', by: 'Wanjiru Kamau' });
    m.win.openNegotiationRoom(m.c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });

    m.$('#nego-copilot').click();
    m.$('#nego-cop-input').value = 'summarise this round';
    m.$('#nego-cop-form').dispatchEvent(new m.win.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    assert.match(m.$('#nego-cop-feed').textContent, /rate limited/,
      'a silent failure teaches people the box is broken');
  });

  test('a question is shown as text, never as markup', async () => {
    const m = await mounted();
    m.$('#nego-copilot').click();
    m.$('#nego-cop-input').value = '<img src=x onerror=alert(1)> ninety';
    m.$('#nego-cop-form').dispatchEvent(new m.win.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));
    const feed = m.$('#nego-cop-feed');
    assert.equal(feed.querySelector('img'), null, 'nothing typed into the box becomes an element');
    assert.match(feed.textContent, /onerror=alert\(1\)/);
  });

  test('the counterparty gets the same button on their side of the room', async () => {
    const w = buildWorld({ negotiationView: true });
    const win = w.win;
    const c = await negotiated(win);
    win.openNegotiationRoom(c, { side: 'counterparty', by: 'Erik Lindqvist', persist: false });
    assert.ok(win.document.querySelector('#nego-copilot'),
      'both sides read the same screen — that includes being able to ask about it');
    assert.ok(win.document.querySelector('#nego-copilot-dock'));
  });
});
