/* f732 — JAMBO FOLLOWS THE ASK (owner, 18 Oct 2026: "why is it when i ask
   jambo questions regarding the calendar it schedules appointments not
   following my command?" … "fix both together")

   Four claims, each asked where it lives:
     1 · the main box is steered by the whole request, never one word: only a
         REQUEST for a starting point reaches the template adviser; a request to
         book or find time is the Calendar's; a question that merely mentions a
         template, a schedule or a meeting goes on as any question
     2 · the routing in intelAsk and the Counter asks them in that order (the
         booking first, the template before the map's word reader), and the
         whole-book red-flag sweep runs only when no contract is named
     3 · the Calendar's Jambo answers a question in words and adds nothing;
         he is told today, the weekdays and a horizon of 120 days, and the
         governance rule rides his instruction
     4 · a block he proposes keeps a named day and time as asked; every block
         left out comes back with its reason

   Run: node --test test/f732-jambo-follows-the-ask.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const IG = fs.readFileSync(path.join(ROOT, 'js', 'views', 'intelligence.js'), 'utf8');
const CN = fs.readFileSync(path.join(ROOT, 'js', 'views', 'counter.js'), 'utf8');
const CAL = fs.readFileSync(path.join(ROOT, 'js', 'views', 'calendar.js'), 'utf8');
const SRV = fs.readFileSync(path.join(ROOT, 'server', 'server.js'), 'utf8');
const regionOf = (src, head) => { const i = src.indexOf(head); assert.ok(i > -1, 'no ' + head); return src.slice(i, src.indexOf('\n}\n', i)); };

/* the routing words, run as the page runs them */
/* read once, asked by each claim, so a missing piece is reported where it is missed */
const words = (() => {
  const a = IG.indexOf('const IG_TEMPLATE_RE='), z = IG.indexOf('const IG_COMPLIANCE_RE=');
  try { return new Function(IG.slice(a, z) + '\nreturn { IG_TEMPLATE_RE, IG_BOOK_RE, IG_BOOK_NOT_RE, igBookAsk };')(); }
  catch (_) { return { IG_TEMPLATE_RE: /(?!)/, igBookAsk: () => { assert.fail('no igBookAsk'); } }; }
})();

describe('f732 (1) the whole request decides, never one word', () => {
  test('a request to book or find time is the Calendar\'s', () => {
    for (const q of ['book a meeting with Naivas on Tuesday at 2pm', 'Schedule a call with Acme next Thursday',
      'find time for MK-12 before its notice date', 'block out an hour on Friday to read the Nordkust draft',
      'put the board meeting in my calendar', 'set up a 30 min catch-up with legal', 'plan my week',
      'add a reminder to chase the signature', 'make time for the renewal decision', 'schedule a call to discuss the termination clause',
      'boka ett möte med Naivas på tisdag kl 14', 'hitta tid för MK-12', 'lägg in styrelsemötet i min kalender', 'planera min vecka'])
      assert.ok(words.igBookAsk(q), 'the Calendar\'s: ' + q);
  });
  test('a question about dates or wording, or a word that only looks like booking, is not', () => {
    for (const q of ['what is due next week?', 'when does MK-3\'s meeting duty start?', 'what does schedule 2 say about the call-off?',
      'schedule 3 of MK-9', 'make a call on whether to renew', 'add a clause about time for payment', 'find the meeting minutes in MK-3',
      'book value of our supplier contracts', 'which meetings are in the Naivas contract?', 'vad händer nästa vecka?'])
      assert.ok(!words.igBookAsk(q), 'not the Calendar\'s: ' + q);
  });
  test('only a REQUEST for a starting point reaches the template adviser', () => {
    for (const q of ['Which template should I start from for a supplier deal?', 'recommend a template for a new NDA',
      'suggest a starting point for the Acme lease', 'which contract should I use as a base for the Naivas renewal?',
      'vilken mall ska jag använda för ett leverantörsavtal?'])
      assert.ok(words.IG_TEMPLATE_RE.test(q), 'the adviser\'s: ' + q);
    for (const q of ['What does our NDA template say about the notice period?', 'start from where we left off on the Nordkust deal',
      'show me our templates', 'how many contracts used the supplier template?'])
      assert.ok(!words.IG_TEMPLATE_RE.test(q), 'answered as any question: ' + q);
  });
});

describe('f732 (2) the order the box asks them in', () => {
  const ask = regionOf(IG, 'async function intelAsk(');
  test('the booking first, before any free reader takes the words', () => {
    const book = ask.indexOf('igBookAsk(q)'), act = ask.indexOf('caActOf(q)');
    assert.ok(book > -1 && act > -1 && book < act, 'igBookAsk before caActOf');
    assert.ok(/igBookAsk\(q\)&&typeof window\.calHandOff==='function'&&calHandOff\(q\)/.test(ask), 'through the Calendar\'s one door');
  });
  test('a template request skips the Board\'s reader and the map\'s word reader', () => {
    assert.ok(/!onPaperSide && !tplAsk && typeof window\.hbAsk/.test(ask), 'the Board\'s reader stands aside');
    assert.ok(/\(igPaperUp\(\)\|\|boardUp\|\|tplAsk\)\?null:await intelMapLocal\(q\)/.test(ask), 'the map\'s word reader stands aside');
    assert.ok(/else if\(tplAsk&&!igPaperUp\(\)\)\s+await intelTemplateAsk\(q\)/.test(ask), 'and the adviser takes it');
    assert.equal((ask.match(/intelTemplateAsk\(/g) || []).length, 1, 'one way to the adviser');
  });
  test('the red-flag sweep reads the whole book only when no contract is named', () => {
    assert.ok(/IG_COMPLIANCE_RE\.test\(q\)&&!idHits\)\s+await intelComplianceScan\(q\)/.test(ask));
  });
  /* RE-POINTED 18 Oct 2026 (#339, Jambo the same on every page): the place
     words are read inside the one reader every box uses, caAskAnywhere */
  test('the Counter hands a booking over before it reads a place', () => {
    const cn = regionOf(CN, 'function counterAsk(');
    const book = cn.indexOf('igBookAsk(t)'), place = cn.indexOf('caAskAnywhere(');
    assert.ok(book > -1 && place > -1 && book < place);
    assert.ok(/calHandOff\(t\)\) return true/.test(cn));
  });
  test('the hand-off opens the Calendar and asks its own Jambo the same words, never on the phone', () => {
    const h = regionOf(CAL, 'function calHandOff(');
    assert.ok(h.includes('hbOpenCalendar()') && h.includes('calPlanAsk(t)') && /mPhone\(\)\) return false/.test(h));
  });
});

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });

const plan = (body) => W.admin.json('/api/ai/plan', { method: 'POST', body: Object.assign({
  from: '2026-10-19', to: '2026-11-01', today: '2026-10-19', dayStart: 8, dayEnd: 17,
  dates: [{ date: '2026-12-15', title: 'Notice deadline' }],
  events: [{ date: '2026-10-20', start: '13:00', end: '14:30', title: 'Board pack' }] }, body) });

describe('f732 (3) a question is answered in words, and nothing is added', () => {
  test('the answer comes back as an answer, with no blocks', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'tu_a', name: 'answer', input: { say: 'One deadline is coming: the notice on 15 December.', points: ['Tue 2026-12-15: Notice deadline'] } }]);
    const r = await plan({ ask: 'what is due before Christmas?', until: '2026-12-31' });
    assert.equal(r.kind, 'answer');
    assert.match(r.say, /notice on 15 December/);
    assert.deepEqual(r.points, ['Tue 2026-12-15: Notice deadline']);
    assert.deepEqual(r.blocks, []);
  });
  test('he is told today and its weekday, sees past two weeks, may answer or plan, and carries the rule', async () => {
    const body = ai.calls[0].body;
    const prompt = JSON.stringify(body.messages);
    assert.match(prompt, /Today is Monday 2026-10-19/);
    assert.match(prompt, /Tue 2026-12-15: Notice deadline/, 'a date two months out is seen');
    assert.match(prompt, /up to 2026-12-31/);
    assert.ok(prompt.includes('GONE THROUGH, NEVER AROUND'), 'the governance rule');
    assert.deepEqual(body.tools.map(t => t.name).sort(), ['answer', 'propose_blocks']);
    assert.equal(body.tool_choice.type, 'any', 'he chooses: an answer or a plan');
  });
  test('the horizon is 120 days, never further', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'tu_a', name: 'answer', input: { say: 'Nothing that far.' } }]);
    await plan({ ask: 'anything next year?', until: '2027-12-31' });
    assert.match(JSON.stringify(ai.calls[0].body.messages), /up to 2027-02-16/);
  });
});

describe('f732 (4) a plan keeps the named time and says why anything is left out', () => {
  test('Saturday at 10 was asked for: kept; an unasked block over the board pack: left, with its reason', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'tu_p', name: 'propose_blocks', input: { say: 'Booked as you asked.', blocks: [
      { date: '2026-10-24', start: '10:00', end: '11:00', title: 'Meeting with Naivas', asked: true },
      { date: '2026-10-20', start: '14:00', end: '15:00', title: 'Read the Nordkust draft' },
    ] } }]);
    const r = await plan({ ask: 'book a meeting with Naivas on Saturday at 10', until: '2026-12-31' });
    assert.equal(r.kind, 'plan');
    assert.deepEqual(r.blocks.map(b => [b.date, b.start, b.title, !!b.asked]), [['2026-10-24', '10:00', 'Meeting with Naivas', true]]);
    assert.equal(r.dropped, 1);
    assert.deepEqual(r.left, [{ title: 'Read the Nordkust draft', why: 'clash' }]);
  });
  test('the page says each reason in both books', () => {
    const I18N = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
    for (const why of ['clash', 'hours', 'weekend', 'busy', 'window', 'bad', 'cap'])
      assert.equal((I18N.match(new RegExp('\\bcal_plan_why_' + why + ':', 'g')) || []).length, 2, why + ' in both books');
    assert.ok(/function calPlanLeftHtml\(/.test(CAL) && /'cal_plan_why_'\+/.test(CAL));
  });
});
