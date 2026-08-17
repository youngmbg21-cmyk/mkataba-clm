/* ============================================================
   F211 — HIGHLIGHT ON THE DOCUMENT TAB → SIMPLIFY / ASK COPILOT
   ============================================================
   (owner-asked 17 Aug 2026, confirmed before building.) The Document tab's
   paper takes a highlight and offers TWO actions in the negotiation page's own
   selection menu: Simplify (the panel answers with a plain-language version)
   and Ask Copilot (the panel quotes the passage and asks for the inquiry).

   THE LOAD-BEARING CLAIMS, in order of what they protect:

     1  READING AIDS, NOT EDITS. Nothing on this path may write to the
        contract — no negoFileChange, no negoEditClause, no changes.push.
        The negotiation page files proposals from its menu; this one must
        never grow that ability quietly.
     2  ONE MENU BUILDER. rlSelMenu gained ctx.actions + ctx.onPick so a host
        can bring its own actions WITHOUT a second copy of the markup, the
        anchoring or the kill logic — and without them the builder still routes
        every row to rlAiPropose exactly as before (the negotiation surfaces
        are untouched).
     3  THE FULL PASSAGE REACHES THE MODEL. The display bubble clamps the
        quote visually (max-height, not slice), because aiChatMessages() reads
        this bubble's text into the next request — a truncated display string
        would hand the model a truncated passage.
     4  NEVER THE COUNTERPARTY, and refusals speak in the panel. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8');

function stage(){
  const w = buildWorld({ negotiationView: true, contractView: true });
  const { win } = w;
  const c = { id: 'MK-1', name: 'Agreement MK-1', counterparty: 'Kabras Sugar',
    template: 'RM', status: 'Under Review', folder: 'proc', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    redlineText: 'SUPPLY AGREEMENT\n1. SUPPLY\nThe Supplier shall supply goods.',
    format: 'text', lastAction: '01 Jul 2026' };
  /* The Copilot panel, stubbed as capture points — ai.js is deliberately not
     on this stage, so every call docAiRead makes is observable. */
  const log = { opened: 0, pushes: [], fed: 0, asked: [] };
  win.openAI = () => { log.opened++; };
  win.aiPush = (role, payload) => log.pushes.push({ role, text: String((payload && payload.text) || '') });
  win.renderAIFeed = () => { log.fed++; };
  win.updateAIBadge = () => {};
  win.ai = { busy: false, open: true, unread: false };
  win.aiChatMessages = () => [{ role: 'user', content: 'display bubble' }];
  win.aiChatContext = () => ({ ctx: true });
  win.aiRenderServerAnswer = res => ({ text: String((res && res.text) || '') });
  win.copilotAvailable = () => true;
  win.copilotAsk = async (messages, context) => { log.asked.push({ messages, context });
    return { text: 'In plain terms: the supplier delivers.' }; };
  /* The one thing this path must never do. */
  log.filed = 0;
  const guard = () => { log.filed++; throw new Error('the Document tab filed a change'); };
  win.negoFileChange = guard; win.negoEditClause = guard;
  const inp = win.document.createElement('textarea'); inp.id = 'ai-input';
  win.document.body.appendChild(inp);
  return { w, win, c, log, $: s => win.document.querySelector(s),
    $$: s => [...win.document.querySelectorAll(s)] };
}

describe('F211 — one menu builder, hosts bring their own actions', () => {
  test('rlSelMenu with ctx.actions draws those actions and onPick routes the press', async () => {
    const p = stage();
    let picked = null;
    const menu = p.win.rlSelMenu({ text: 'some highlighted words',
      rect: { left: 40, top: 40, right: 240, bottom: 60, width: 200, height: 20 },
      actions: [{ id: 'simplify', label: '✂️ Simplify' }, { id: 'ask', label: '✨ Ask Copilot' }],
      onPick: a => { picked = a.id; } });
    assert.ok(menu, 'the menu is built');
    const btns = p.$$('.nego-selmenu [data-nego-ai]');
    assert.deepEqual(btns.map(b => b.getAttribute('data-nego-ai')), ['simplify', 'ask'],
      'exactly the host\'s two actions, in order');
    btns[1].dispatchEvent(new p.win.Event('mousedown', { bubbles: true, cancelable: true }));
    assert.equal(picked, 'ask', 'the press reached the host\'s own handler');
    assert.equal(p.$('.nego-selmenu'), null, 'and the menu is gone after the press');
  });

  test('without ctx.actions the negotiation menu is untouched — three actions, same ids', async () => {
    const p = stage();
    p.win.rlSelMenu({ text: 'words', c: p.c, opts: {},
      rect: { left: 40, top: 40, right: 240, bottom: 60, width: 200, height: 20 } });
    const ids = p.$$('.nego-selmenu [data-nego-ai]').map(b => b.getAttribute('data-nego-ai'));
    assert.deepEqual(ids, ['edit', 'shorten', 'standard'],
      'the negotiation surfaces still get the whole standing list');
  });
});

describe('F211 — the two actions only talk; nothing writes', () => {
  test('Simplify sends the FULL passage with a no-edits brief, and answers in the panel', async () => {
    const p = stage();
    /* Long on purpose: longer than any display clamp, so a slice would show. */
    const passage = 'The Supplier shall indemnify the Buyer against all claims, '
      + 'losses and expenses arising from defective goods, including reasonable '
      + 'legal costs, save where the defect arises from the Buyer\'s own storage '
      + 'or handling after delivery, and this clause survives termination of the '
      + 'Agreement for a period of twenty-four months.';
    await p.win.docAiRead(p.c, { id: 'simplify', label: '✂️ Simplify' }, passage);
    assert.equal(p.log.opened, 1, 'the panel opened first');
    assert.equal(p.log.asked.length, 1, 'one turn asked');
    const last = p.log.asked[0].messages[p.log.asked[0].messages.length - 1];
    assert.ok(last.content.includes(passage), 'the model got the WHOLE passage');
    assert.match(last.content, /Do not propose new wording/,
      'and a brief that forbids edits — this is a reading aid');
    const userBubble = p.log.pushes.find(x => x.role === 'user');
    assert.ok(userBubble && userBubble.text.includes(passage),
      'the display bubble carries the full passage too (clamped by CSS, not sliced)');
    assert.ok(p.log.pushes.some(x => x.role === 'assistant' && /plain terms/.test(x.text)),
      'the answer landed in the panel');
    assert.equal(p.win.ai.busy, false, 'and the composer is free again');
    assert.equal(p.log.filed, 0, 'NOTHING was filed');
    assert.equal(p.c.changes.length, 0, 'and the record is untouched');
  });

  test('Ask Copilot quotes the passage and asks for the inquiry — no model call yet', async () => {
    const p = stage();
    await p.win.docAiRead(p.c, { id: 'ask', label: '✨ Ask Copilot' }, 'Payment within 30 days.');
    assert.equal(p.log.asked.length, 0, 'no turn is spent before the reader has asked anything');
    const kinds = p.log.pushes.map(x => x.role);
    assert.deepEqual(kinds, ['user', 'assistant'], 'the quote, then the greeting');
    assert.ok(p.log.pushes[0].text.includes('Payment within 30 days.'),
      'the passage is on the record for the next question to ride with');
    assert.match(p.log.pushes[1].text, /What would you like to know/,
      'and the panel asks for the inquiry');
    assert.equal(p.log.filed, 0, 'nothing filed here either');
  });

  test('no Copilot key: the refusal speaks in the panel, and no model is called', async () => {
    const p = stage();
    p.win.copilotAvailable = () => false;
    await p.win.docAiRead(p.c, { id: 'simplify', label: '✂️ Simplify' }, 'Some wording.');
    assert.equal(p.log.asked.length, 0);
    assert.ok(p.log.pushes.some(x => /not connected/.test(x.text)),
      'the panel says the Copilot is not connected');
  });
});

describe('F211 — the wiring, and what it must never reach', () => {
  test('the room render wires the selection, and the wiring refuses PORTAL_MODE', () => {
    assert.match(SRC, /wireDocCopilotSel\(c\);/, 'the Document tab arms it on every paint');
    const fn = SRC.slice(SRC.indexOf('function wireDocCopilotSel'),
      SRC.indexOf('function wireDocCopilotSel') + 900);
    assert.match(fn, /if\(window\.PORTAL_MODE\) return;/,
      'the counterparty\'s page never gets the menu (owner-ruled)');
    assert.match(fn, /negoEnsureStyle\(\)/,
      'and the menu\'s own stylesheet is ensured — the doc tab does not load it by chance');
  });

  test('the whole feature\'s source carries no way to write', () => {
    /* From the first declaration, not the banner comment above it — the banner
       is prose that names the forbidden calls in order to forbid them. */
    const start = SRC.indexOf('const DOC_SEL_ACTIONS');
    const end = SRC.indexOf('/* -------- doc field sync --------');
    assert.ok(start > -1 && end > start, 'the feature block is findable');
    /* Comments stripped: the block's own prose NAMES the forbidden calls to
       say they are forbidden, and a grep that reads prose would flag the rule
       for stating itself. The claim is about CODE. */
    const block = SRC.slice(start, end).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const bad of ['negoFileChange', 'negoEditClause', 'negoInsertClause', 'changes.push',
      'copilotPropose'])
      assert.ok(!block.includes(bad), `the reading-aid path must never mention ${bad}`);
  });

  test('two actions, and the pair the owner asked for', () => {
    const p = stage();
    const acts = p.win.DOC_SEL_ACTIONS;
    assert.equal(acts.length, 2, 'exactly two');
    /* joined, not deepEqual: the array lives in the jsdom realm and a
       cross-realm Array never reference-matches this one's prototype. */
    assert.equal(acts.map(a => a.id).join(','), 'simplify,ask');
    assert.match(acts[0].label, /Simplify/);
    assert.match(acts[1].label, /Ask Copilot/);
  });
});
