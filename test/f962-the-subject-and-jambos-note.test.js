/* f962 — THE SUBJECT IS YOURS TO CHANGE, JAMBO WRITES ONLY THE NOTE, AND A RANGE IS NAMED BY ITS LABEL
   (owner, 29 Oct 2026, on MK-382's send screen: Jambo wrote a second whole email in the chat with its own
   subject, a [placeholder] and a change that was not in the round; the subject could not be changed; the
   email listed a clause as "Liabilitymonths")

   (1) the email's subject: a typed one replaces HaTi's on the letter and the Word file's mail, one line, capped;
       empty means HaTi's; the routes pass it on
   (2) the send screen, said to Jambo: the same sentence on both hosts, and one rule, word for word on both,
       in both system prompts; the answer tool carries a `note`, kept only where the send screen was open
   (3) a standards check names a range by its label: a verdict whose category came back as the range's code
       key ("liabilityMonths") is read as its label ("Liability cap")
   The browser half: test/chromium/subject-and-jambo-note-verify.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const SM = require('../js/sharemail.js');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const SRV = R('server/server.js'), AIJS = R('js/ai.js'), CORE = R('js/core.js');
const fnBody = (src, name) => { const i = src.indexOf(`function ${name}(`); assert.ok(i >= 0, name + ' is defined');
  let d = 0, j = src.indexOf('{', src.indexOf(')', i)); for (; j < src.length; j++){ if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) break; }
  return src.slice(i, j + 1) + '\n'; };

describe('f962 (1) the subject the sender typed is the subject mailed', () => {
  const base = { channel: 'email', purpose: 'negotiate', sender: 'Young Mbagaya', org: 'Young', cName: 'Warehousing agreement', recName: 'Anna Holm', round: 2 };
  test('typed, it replaces HaTi\'s; empty or blank, HaTi\'s stands', () => {
    assert.equal(SM.shareMailOf(base).subject, 'Round 2 of the Warehousing agreement, from Young');
    assert.equal(SM.shareMailOf({ ...base, subject: 'Our redlines' }).subject, 'Our redlines');
    assert.equal(SM.shareMailOf({ ...base, subject: '   ' }).subject, 'Round 2 of the Warehousing agreement, from Young');
    assert.equal(SM.shareMailOf({ ...base, channel: 'word', subject: 'Marked up for you' }).subject, 'Marked up for you');
  });
  test('one line, no header break, capped at what the box holds', () => {
    assert.equal(SM.shareSubjectClean('Line one\r\nBcc: x@y.z'), 'Line one Bcc: x@y.z');
    assert.equal(SM.shareSubjectClean('a'.repeat(500)).length, SM.SHARE_SUBJECT_MAX);
    assert.match(CORE, /maxlength="\$\{\(typeof SHARE_SUBJECT_MAX==='number'\)\?SHARE_SUBJECT_MAX:200\}"/);
  });
  test('the routes pass it on: a new link (email and Word) and a link they already hold', () => {
    assert.match(SRV, /const \{ payload, recipient, channel, message, expiryDays, durable, purpose, subject \} = req\.body \|\| \{\};/);
    assert.match(SRV, /org: payload\.org, cName, recName: rec\.name, message, subject, \.\.\.srvMailCodeOf\(shareId\) \}\);/);
    assert.match(SRV, /cName, recName: rec\.name, message, subject, link, expires,/);
    assert.match(SRV, /message: note, subject: letter\.subject, link,/);
    assert.match(CORE, /letter:\{ message:msg, recName:name, \.\.\.\(shareSubjectTyped\(\)\?\{ subject:shareSubjectTyped\(\) \}:\{\}\) \}/);
  });
});

describe('f962 (2) Jambo is told what the send screen holds, and writes only the note', () => {
  const run = (src, name) => { const ctx = {}; vm.createContext(ctx); vm.runInContext(fnBody(src, name) + `this.f = ${name};`, ctx); return ctx.f; };
  const P = { view: 'dashboard', name: 'Home (the paper side)', sending: { contract: 'MK-382', name: 'Warehousing agreement', to: 'Anna Holm', by: 'email',
    subject: 'Round 2 of the Warehousing agreement, from Young', goes: ['Young has answered your redline:', 'Clause 2 · Term and Termination: they accept your change.'], note: '' } };
  test('the same sentence on both hosts', () => {
    const srv = run(SRV, 'pageSays'), web = run(AIJS, 'aiPageSays');
    assert.equal(srv(P), web(P));
    assert.match(srv(P), /The send screen is open for MK-382 \(Warehousing agreement\)\. HaTi writes the email to Anna Holm by email itself, under the subject "Round 2 of the Warehousing agreement, from Young": the greeting, what this send carries, the link and the sign-off\. What this send carries, as the email lists it: Young has answered your redline: Clause 2 · Term and Termination: they accept your change\. The note box is empty\./);
    assert.doesNotMatch(srv({ view: 'dashboard', name: 'Home' }), /send screen/);
  });
  test('one rule, word for word on both hosts, in both system prompts', () => {
    const srv = SRV.match(/\nconst AI_SEND_NOTE_RULE = ('.*?');\n/)[1], web = AIJS.match(/\nconst AI_SEND_NOTE_RULE='(.*?)';\n/)[1];
    assert.equal(srv.slice(1, -1), web);
    assert.match(web, /Write ONLY the note the person would type in their note box/);
    assert.match(web, /never promise one that is not on that list/);
    assert.ok(fnBody(SRV, 'buildCopilotSystem').includes('- ${AI_SEND_NOTE_RULE}\n'));
    assert.ok(AIJS.includes('${AI_CLARIFY_RULE} ${AI_SEND_NOTE_RULE} ${AI_CALENDAR_RULE}'));
  });
  test('the answer tool carries the note; the server returns it only where the send screen was open', () => {
    assert.match(SRV, /\n {6}note: \{ type: 'string', description: 'OPTIONAL — only when the CURRENT VIEW says the send screen is open/);
    assert.match(AIJS, /\n {4}note:\{type:'string',description:'OPTIONAL — only when the CURRENT VIEW says the send screen is open/);
    assert.equal((SRV.match(/\.\.\.\(final\.note && context && context\.page && context\.page\.sending \? \{ note: final\.note \} : \{\}\)/g) || []).length, 2, 'the answer and the stream');
    assert.ok(fnBody(SRV, 'normalizeDeliver').includes('...(note ? { note } : {})'));
  });
  test('the press fills the box and sends nothing; it asks the screen open now', () => {
    const fill = fnBody(CORE, 'shareNoteFill');
    assert.ok(fill.includes("ta.dispatchEvent(new Event('input', { bubbles:true }))"));
    assert.doesNotMatch(fill, /api\(|doSend|share-send/);
    assert.ok(fill.includes('String(now.c.id)!==String(id)') && fill.includes('words.length>max'));
  });
});

describe('f962 (3) a standards check names a range by its label', () => {
  test('a verdict that came back as the range\'s key reads as its label', async () => {
    const verdicts = [{ category: 'liabilityMonths', status: 'missing' }, { category: 'Payment terms', status: 'aligned' }, { category: 'LIABILITYMONTHS ', status: 'deviation' }];
    const ctx = { orgJx: () => ({ adjective: 'Kenyan' }), AI_REDLINE_RULE: () => '', sendBackPrompt: () => '', aiDocText: (_, t) => t, pbReviewTokens: () => 100,
      anthropicMessages: async () => ({ ok: true, data: { content: [{ type: 'tool_use', input: { verdicts } }] } }), JSON };
    vm.createContext(ctx);
    const src = fnBody(SRV, 'aiPlaybookVerdicts');
    vm.runInContext('async ' + src + 'this.f = aiPlaybookVerdicts;', ctx);
    const playbook = { positions: [{ category: 'Payment terms' }], ranges: [{ key: 'liabilityMonths', label: 'Liability cap', op: '>=', value: 12 }] };
    const r = await ctx.f('k', { text: 'doc', playbook, kind: 'services' }, {});
    assert.deepEqual(r.verdicts.map(v => v.category), ['Liability cap', 'Payment terms', 'Liability cap']);
  });
});
