/* f735 — THE JAMBO WINDOW FOLLOWS THE ASK (owner, 18 Oct 2026: "are there any
   other jambos with limitations?" … "yes, fix all four")

   The window behind the top bar's Jambo door — the phone's Jambo too — had
   four faults. Each claim is asked where it lives:
     1 · the chat is told today and its weekday (the reader's own day, or the
         server's when a caller sent none), in the same words on both hosts
     2 · the health report opens only when it is asked for by name, never for
         a question about it or a report on one contract
     3 · a booking, or a question about one's own calendar, is handed to the
         Calendar's Jambo from every box (caAskAnywhere → 'cal'); the
         Calendar's own box plans it itself; and the chat says plainly it
         cannot book or see a calendar, on both hosts
     4 · a question typed while a rewrite card is open is answered as a
         question, with the card's words beside it; an instruction still
         revises the card

   Run: node --test test/f735-the-jambo-window-follows-the-ask.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const SRV = fs.readFileSync(path.join(ROOT, 'server', 'server.js'), 'utf8');
const AIJS = fs.readFileSync(path.join(ROOT, 'js', 'ai.js'), 'utf8');
const CA = fs.readFileSync(path.join(ROOT, 'js', 'copilotacts.js'), 'utf8');
const CAL = fs.readFileSync(path.join(ROOT, 'js', 'views', 'calendar.js'), 'utf8');
const IG = fs.readFileSync(path.join(ROOT, 'js', 'views', 'intelligence.js'), 'utf8');
/* a whole top-level function, by its brace walk */
const fnOf = (src, head) => { const at = src.indexOf(head); if (at < 0) return ''; const open = src.indexOf('{', src.indexOf(')', at)); let d = 0;
  for (let i = open; i < src.length; i++){ if (src[i] === '{') d++; else if (src[i] === '}' && !--d) return src.slice(at, i + 1); } return ''; };
const lineOf = (src, re) => { const m = src.match(re); return m ? m[0] : ''; };
/* each part is read once and asked by each claim, so a missing piece reports where it is missed */
const run = (code, out) => { try { const ctx = { todayISO: () => '2026-10-18' }; vm.createContext(ctx); vm.runInContext(code + '\n' + out, ctx); return ctx; } catch (_) { return {}; } };

const srvParts = run([lineOf(SRV, /\nconst CHAT_WEEKDAYS = [^\n]*/), fnOf(SRV, 'function chatTodayLine('), lineOf(SRV, /\nconst AI_CALENDAR_RULE = [^\n]*/), fnOf(SRV, 'function openCardSays(')].join('\n'),
  'this.today = chatTodayLine; this.rule = AI_CALENDAR_RULE; this.card = openCardSays;');
const webParts = run([lineOf(AIJS, /\nconst AI_CALENDAR_RULE=[^\n]*/), lineOf(AIJS, /\nconst CHAT_WEEKDAYS=[^\n]*/), fnOf(AIJS, 'function chatTodayLine('), fnOf(AIJS, 'function aiOpenCardSays(')].join('\n'),
  'this.today = chatTodayLine; this.rule = AI_CALENDAR_RULE; this.card = aiOpenCardSays;');
const report = run([lineOf(AIJS, /\nconst AI_REPORT_NAME_RE=[^\n]*/), lineOf(AIJS, /\nconst AI_REPORT_ASKS_RE=[^\n]*/), lineOf(AIJS, /\nconst AI_REPORT_ONE_RE=[^\n]*/), fnOf(AIJS, 'function aiWantsHealthReport(')].join('\n'),
  'this.wants = aiWantsHealthReport;');
const book = (() => { const a = IG.indexOf('const IG_BOOK_RE='), z = IG.indexOf('const IG_COMPLIANCE_RE=');
  return run(a > -1 && z > a ? IG.slice(a, z) : '', 'this.book = igBookAsk;'); })();
const past = run([lineOf(AIJS, /\nconst AI_EDIT_ASK_RE = [^\n]*/), lineOf(AIJS, /\nconst AI_QUESTION_RE = [^\n]*/), fnOf(AIJS, 'function aiAsksPastCard(')].join('\n'), 'this.past = aiAsksPastCard;');

describe('f735 (1) the chat is told today', () => {
  test('the day and its weekday, in the same words on both hosts', () => {
    assert.ok(srvParts.today && webParts.today, 'both hosts have chatTodayLine');
    for (const d of ['2026-10-18', '2026-10-20', '2026-12-25']) assert.equal(srvParts.today(d), webParts.today(d), d);
    assert.match(srvParts.today('2026-10-18'), /^TODAY: Sunday 2026-10-18\. /);
    assert.match(srvParts.today('2026-12-25'), /^TODAY: Friday 2026-12-25\. /);
    assert.match(srvParts.today('not a day'), /^TODAY: \w+day \d{4}-\d{2}-\d{2}\. /, 'a missing day is the host\'s own, never nothing');
  });
  test('the page sends the reader\'s own day, and every chat call carries it', () => {
    assert.match(fnOf(AIJS, 'function aiChatContext('), /today: \(typeof todayISO==='function'\)\?todayISO\(\)/, 'todayISO, not the UTC day');
    assert.match(fnOf(AIJS, 'async function copilotAsk('), /if\(!\(context&&context\.today\)&&typeof todayISO==='function'\) context=Object\.assign\(\{\},context\|\|\{\},\{ today:todayISO\(\) \}\);/);
    assert.match(fnOf(AIJS, 'function _localSystem('), /\$\{chatTodayLine\(ctx\.today\)\}/, 'the local-mode rulebook too');
  });
});

describe('f735 (2) the health report opens only when it is asked for', () => {
  test('a request for it by name opens it', () => {
    assert.ok(report.wants, 'aiWantsHealthReport is read');
    for (const q of ['portfolio health report', 'Build me a portfolio health report', 'Can you give me a portfolio report?', 'Show me the health report',
      'I want a report on the whole portfolio', 'Ge mig en hälsorapport', 'Visa rapporten om hela portföljen'])
      assert.ok(report.wants(q), 'opens: ' + q);
  });
  test('a question about it, or a report on one contract, is answered', () => {
    for (const q of ['What does the portfolio report say about late obligations?', 'Give me an overview report of MK-12',
      'Can you report on the health of the Naivas contract?', 'Should I report the overview of MK-12 to the board?',
      'summarize the MK-103 inspection report', 'health report for the Naivas agreement', 'Vad säger portföljrapporten om förfallna åtaganden?'])
      assert.ok(!report.wants(q), 'answered: ' + q);
  });
});

describe('f735 (3) a booking goes to the Calendar\'s Jambo from every box', () => {
  test('the own-calendar questions join the bookings', () => {
    assert.ok(book.book, 'igBookAsk is read');
    for (const q of ['am I free on Tuesday afternoon?', 'what\'s on my calendar tomorrow?', 'do I have any meetings on Friday?', 'är jag ledig på fredag?',
      'vad har jag i min kalender i morgon?', 'book a meeting with Naivas on Tuesday at 2pm'])
      assert.ok(book.book(q), 'the Calendar\'s: ' + q);
    for (const q of ['what is due next week?', 'which meetings are in the Naivas contract?', 'is the notice window open?', 'how many contracts are free of risk?',
      'when is the meeting obligation in MK-3 due?'])
      assert.ok(!book.book(q), 'not the Calendar\'s: ' + q);
  });
  test('the shared reader hands it over first and says so; the Calendar\'s own box keeps it', () => {
    const ask = fnOf(CA, 'function caAskAnywhere(');
    const at = ask.indexOf('igBookAsk(t)'), home = ask.indexOf("getElementById('igd-input')");
    assert.ok(at > -1 && home > -1 && at < home, 'before anything else reads the words');
    assert.match(ask, /if \(!opts\.cal && typeof igBookAsk === 'function' && typeof calHandOff === 'function'\)/);
    assert.match(ask, /if \(b && calHandOff\(t\)\) return 'cal';/);
    assert.match(CAL, /caAskAnywhere\(v,\{cal:true\}\)/, 'the Calendar\'s box plans it itself');
    assert.match(fnOf(AIJS, 'async function aiSubmit('), /const say=took==='cal'\?i18t\('ig_cal_handoff'\)/, 'the window says where it went');
  });
  test('the chat says plainly it cannot book or see a calendar, in the same words on both hosts', () => {
    assert.ok(srvParts.rule && srvParts.rule === webParts.rule, 'one sentence, word for word');
    assert.match(srvParts.rule, /cannot see the person's own calendar/);
    assert.match(fnOf(SRV, 'function buildCopilotSystem('), /- \$\{AI_CALENDAR_RULE\}\n- \$\{AI_HANDBOOK_RULE\}`;/);
    assert.match(fnOf(AIJS, 'function _localSystem('), /\$\{AI_CALENDAR_RULE\}/);
  });
});

describe('f735 (4) a question goes past an open rewrite card', () => {
  test('a question is answered; an instruction still revises the card', () => {
    assert.ok(past.past, 'aiAsksPastCard is read');
    for (const q of ['how many contracts expire this month?', 'what does clause 9 say about liability?', 'is this enforceable?', 'vad säger klausul 9?',
      'list the open obligations for MK-12'])
      assert.ok(past.past(q), 'a question: ' + q);
    for (const q of ['make it shorter', 'can you make it shorter?', 'Could you add a 30-day cure period?', 'add a carve-out for gross negligence?',
      'keep the cap at 12 months', 'kan du korta den?'])
      assert.ok(!past.past(q), 'an instruction: ' + q);
  });
  test('the window gives the card only what asks for a change', () => {
    /* re-pointed (lane A1, 18 Oct 2026): the window's turn is shared with
       Jambo's panel beside the lists — aiSubmit takes the box's words and
       hands them to aiAskWords, which reads the card the same way */
    const sub = fnOf(AIJS, 'async function aiSubmit(') + fnOf(AIJS, 'async function aiAskWords(');
    assert.match(sub, /const cardOwns=!!\(aiActiveProposal\(\)\|\|aiActiveRephrase\(\)\) && !aiAsksPastCard\(q\);/);
    assert.match(sub, /const live=cardOwns\?aiActiveProposal\(\):null;/);
    assert.match(sub, /const session=cardOwns && !live && aiActiveRephrase\(\);/);
  });
  test('the card\'s words ride the question, the same on both hosts', () => {
    const card = { clause: 'Limitation of liability', replacing: 'Liability is capped at fees paid.', proposed: 'Liability is capped at twice the fees paid in the prior 12 months.' };
    assert.ok(srvParts.card && webParts.card);
    assert.equal(srvParts.card(card), webParts.card(card));
    assert.match(srvParts.card(card), /A rewrite card is open in their Jambo window for "Limitation of liability"\. The passage it would replace: "Liability is capped at fees paid\."/);
    assert.equal(srvParts.card(null), '');
    assert.match(fnOf(AIJS, 'function aiChatContext('), /if\(card\) ctx\.openCard=\{ clause:/);
  });
});

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });

const deliver = [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input: { answer: 'ok' } }];
const chat = (context) => { ai.reset(); ai.script(deliver);
  return W.admin.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'what expires this month?' }], context } }); };

describe('f735 (5) asked for real: what the provider is sent', () => {
  test('the reader\'s day and its weekday, and the calendar rule', async () => {
    await chat({ view: 'obligations', today: '2026-10-20' });
    const sys = JSON.stringify(ai.calls[0].body.system || '');
    assert.ok(sys.includes('TODAY: Tuesday 2026-10-20.'), 'the day sent by the page');
    assert.ok(sys.includes("You cannot see the person's own calendar"), 'the calendar rule');
  });
  test('a caller that sent no day still gets one', async () => {
    await chat({ view: 'obligations' });
    assert.match(JSON.stringify(ai.calls[0].body.system || ''), /TODAY: \w+day \d{4}-\d{2}-\d{2}\./);
  });
  test('an open card travels as facts', async () => {
    await chat({ view: 'obligations', openCard: { clause: 'Payment', replacing: 'Net 60.', proposed: 'Net 30.' } });
    assert.ok(JSON.stringify(ai.calls[0].body.system || '').includes('The wording it proposes: \\"Net 30.\\"'));
  });
});
