/* f694 — JAMBO GUIDES THROUGH THE RULES, NEVER AROUND THEM (owner, 17 Oct
   2026: "Jambo has to be able to support user on how to navigate to execute
   the governance but not how to get around it"; piece 0 of the sensitive
   contracts and governance plan, built first)

   Four claims, each asked where it lives:
     1 · ONE rule, word for word on both hosts (server AI_GOVERNANCE_RULE, its
         browser twin in js/ai.js), naming the ways around it Jambo never
         suggests AND the open hand-over that IS the proper route
     2 · every instruction that answers a person's own words or acts for them
         carries it: the chat (both hosts), the Board's analyst, drafting from
         a sentence, the amendment draft, the round-answers agent, and the
         "why" answers in Settings — the chat and the why answers asked for
         real, through the scripted provider
     3 · the door through a rule rides the answer and is checked like a
         citation: only HaTi's own three doors, a rule an admin decides, a
         contract the asker can open — anything else is never drawn
     4 · the why answer gives a member the tracked Ask an admin for the rule
         it turns on, and an admin the rule itself

   Run: node --test test/f694-jambo-guides-never-around.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const SRV = fs.readFileSync(path.join(ROOT, 'server', 'server.js'), 'utf8');
const AIJS = fs.readFileSync(path.join(ROOT, 'js', 'ai.js'), 'utf8');
const SET = fs.readFileSync(path.join(ROOT, 'js', 'views', 'settings.js'), 'utf8');
const MARK = 'GONE THROUGH, NEVER AROUND';
const ruleOf = (src, re) => { const m = src.match(re); return m ? m[1] : null; };
const deliver = input => [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input }];
/* the region of one prompt template: from its opening words to the closing backtick */
const promptRegion = opening => { const i = SRV.indexOf(opening); return i < 0 ? '' : SRV.slice(i, SRV.indexOf('`;', i)); };

describe('f694 (1) one rule, word for word, on both hosts', () => {
  const srv = ruleOf(SRV, /\nconst AI_GOVERNANCE_RULE = (".*?");\n/);
  const web = ruleOf(AIJS, /\nconst AI_GOVERNANCE_RULE=(".*?");\n/);
  test('the browser twin says exactly what the server says', () => {
    assert.ok(srv && web, 'both hosts define it');
    assert.equal(web, srv);
    assert.ok(srv.includes(MARK));
  });
  test('it names the ways around a rule it never suggests', () => {
    for (const w of ['splitting a contract', 'lowering, rewording or hiding a value', 'moving a contract to another stream',
      'outside HaTi', "someone else's account", 'switched off'])
      assert.ok(srv.includes(w), 'names: ' + w);
  });
  test('and the open hand-over that IS the proper route, so the right help is not refused', () => {
    assert.ok(srv.includes("the approver's named backup") && srv.includes('IS the proper route'));
    assert.ok(srv.includes('cannot help with that, then give the proper route'));
  });
  test('and it never gives away what a wall keeps, not even as a hint or a total', () => {
    assert.ok(/Never reveal what a rule walls off/.test(srv) && /a hint, a total or a comparison/.test(srv));
  });
});

describe('f694 (2) every instruction that answers a person carries it', () => {
  test('the Board analyst, drafting, the amendment draft and the round-answers agent', () => {
    for (const [name, opening] of [
      ['the Board analyst', "const prompt = `You are HaTi's analyst on the Home BOARD"],
      ['drafting from a sentence', 'const prompt = `You help somebody start a contract in their own contract system.'],
      ['the amendment draft', 'const prompt = `A signed agreement needs an amendment.'],
      ['the round-answers agent', 'const prompt = `You negotiate for ${party'],
      ['the why answers in Settings', "const prompt = `You explain a contract-management workspace's settings"],
      ['the Calendar\'s Jambo', "const prompt = `You are Jambo, beside ${req.user.name || 'a lawyer'}'s calendar"],
    ]) {
      const region = promptRegion(opening);
      assert.ok(region, name + ' found');
      assert.ok(region.includes('${AI_GOVERNANCE_RULE}'), name + ' carries the rule');
    }
  });
  test('the chat rulebook on both hosts, with the word for its door', () => {
    const i = SRV.indexOf('function buildCopilotSystem(');
    const book = SRV.slice(i, SRV.indexOf('\n}\n', i));
    assert.ok(book.includes('${AI_GOVERNANCE_RULE}') && book.includes('ruleDoor'), 'server chat');
    const j = AIJS.indexOf('SCOPE & SAFETY:');
    assert.ok(AIJS.slice(j, AIJS.indexOf('\n', j)).includes('${AI_GOVERNANCE_RULE}'), 'browser chat');
  });
});

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });

const chat = (client, q) => client.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: q }] } });

describe('f694 (2b) asked for real: what the provider is sent', () => {
  test('the chat sends the rule', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'Your signing limit stops this one.' }));
    await chat(W.unrestricted, 'How do I sign above my limit?');
    assert.ok(ai.calls.length >= 1);
    assert.ok(JSON.stringify(ai.calls[0].body.system || '').includes(MARK), 'in the system rulebook');
  });
  test('the why answer in Settings sends the rule, for a member and an admin', async () => {
    for (const who of ['unrestricted', 'admin']) {
      ai.reset();
      ai.script([{ type: 'tool_use', id: 'tu_w', name: 'answer', input: { say: 'A rule stops it.' } }]);
      await W[who].json('/api/ai/settings-why', { method: 'POST', body: { q: 'Why can\'t I sign MK-A2?' } });
      assert.ok(JSON.stringify(ai.calls[0].body.messages).includes(MARK), who);
    }
  });
});

describe('f694 (3) the door through a rule is checked like a citation', () => {
  const door = async (client, ruleDoor) => {
    ai.reset();
    ai.script(deliver({ answer: 'A rule is in the way.', ruleDoor }));
    return (await chat(client, 'Can I skip this?')).ruleDoor;
  };
  test('Ask an admin, for a rule an admin decides', async () => {
    assert.deepEqual(await door(W.unrestricted, { kind: 'ask_admin', rule: 'signcap' }), { kind: 'ask_admin', rule: 'signcap' });
    assert.equal(await door(W.unrestricted, { kind: 'ask_admin', rule: 'engine' }), null, 'not a rule a member may ask about');
    assert.equal(await door(W.unrestricted, { kind: 'ask_admin' }), null, 'a rule must be named');
  });
  test('review and approval, only on a contract the asker can open', async () => {
    assert.deepEqual(await door(W.restricted, { kind: 'ask_review', contractId: 'MK-A2' }), { kind: 'ask_review', contractId: 'MK-A2' });
    assert.deepEqual(await door(W.restricted, { kind: 'send_for_approval', contractId: 'MK-A2' }), { kind: 'send_for_approval', contractId: 'MK-A2' });
    assert.equal(await door(W.restricted, { kind: 'ask_review', contractId: 'MK-B1' }), null, 'a contract behind their wall is never named back');
    assert.equal(await door(W.restricted, { kind: 'send_for_approval' }), null, 'no contract, no door');
  });
  test('a door the model invents is never drawn', async () => {
    assert.equal(await door(W.admin, { kind: 'skip_review', contractId: 'MK-A2' }), null);
    assert.equal(await door(W.admin, 'ask_admin'), null);
  });
  test('the streamed answer carries it the same way', () => {
    assert.equal((SRV.match(/wholeBook: !!final\.wholeBook, cards, ruleDoor: final\.ruleDoor \|\| null/g) || []).length, 2, 'chat and chat/stream');
  });
  test('the browser draws it in the page\'s own words and presses nothing', () => {
    const i = AIJS.indexOf('function aiRuleDoorHtml(');
    const draw = AIJS.slice(i, AIJS.indexOf('\n}\n', i));
    for (const k of ["'sc_ask_admin'", "'st_ask_dr_open'", "'rv_ask_btn'", "'sa_ask_btn'"]) assert.ok(draw.includes(k), k);
    const j = AIJS.indexOf('function aiRuleDoorGo(');
    const go = AIJS.slice(j, AIJS.indexOf('\n}\n', j));
    assert.ok(go.includes('stAskFrom(rule') && go.includes("openSettingsAt('company', rule)"), 'ask: the tracked ask, or the rule for an admin');
    assert.ok(go.includes('openRedlineWorkbench(id)') && go.includes('pdSignOpen(id)'), 'review and approval open where the asker acts');
    assert.ok(!/stAskSend|saAsk|reviewAsk\(/.test(go), 'it opens the door; the person presses it');
    assert.ok(/ruleDoor:aiRuleDoorOf\(inp\.ruleDoor\)/.test(AIJS), 'local mode checks it too');
  });
});

describe('f694 (4) the why answer: a member gets the tracked ask, an admin the rule', () => {
  const why = async client => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'tu_w', name: 'answer', input: { say: 'Your signing limit stops it.', doors: [{ panel: 'signcap' }, { panel: 'review' }] } }]);
    return (await client.json('/api/ai/settings-why', { method: 'POST', body: { q: 'Why can\'t I sign MK-A2?' } })).doors;
  };
  test('a member: one Ask an admin, for the rule the answer turns on', async () => {
    assert.deepEqual(await why(W.unrestricted), [{ ask: 'signcap' }]);
  });
  test('an admin: the rules themselves', async () => {
    assert.deepEqual(await why(W.admin), [{ panel: 'signcap' }, { panel: 'review' }]);
  });
  test('the Settings card draws the ask with the question in it', () => {
    assert.ok(/d\.ask&&SET_PANELS\[d\.ask\]\?btn\(`data-st-jb-askfor="\$\{d\.ask\}" data-st-jb-q-id="\$\{id\}"`, i18t\('sc_ask_admin'\)/.test(SET));
    assert.ok(/closest\('\[data-st-jb-askfor\]'\)[\s\S]{0,300}stAskFrom\(askf\.getAttribute\('data-st-jb-askfor'\), qt\?qt\.q:''\)/.test(SET));
  });
});
