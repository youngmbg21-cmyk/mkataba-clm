'use strict';
/* f1182 — "I'M NEW": JAMBO THE INSTRUCTOR, ROUND 1 (owner, 23 Nov 2026: "someone should simply say I am new and that
   how jambo knows"; "Both, build it now"; the plan: docs/PLAN-jambo-instructor.md)

   (1) THE WHOLE SENTENCE IS READ: "I'm new", "teach me", "show me around", "jag är ny" turn teaching on; "I know my way
       now" turns it off; a sentence with work in it ("I'm new to this NDA with Volvo", "new agreement") is not his.
   (2) THE TURN IS FREE AND FITS THE PERSON: HaTi's own words, then first steps as chips that open Handbook chapters
       that exist; a Viewer is offered reading, an admin also the team; the words in both books.
   (3) THE SERVER KEEPS THE ANSWER: PUT /api/me/prefs takes teach 'on' | 'off' | null, refuses anything else, and the
       answer comes back with the person on the next sign-in, never on a colleague's row.
   (4) EVERY BOX READS IT FIRST: Home's box, the shared door, the conversation, a list's panel and the Calendar ask
       teachRead before the readers that could take "new" for a draft; a chip opens its chapter (navGo 'chapter').
   (5) THE HINT: a person's first TEACH_HINT_DAYS days, until they say either, the box's own example words; the welcome
       email ends with the same sentence.
   At the parent every part fails (the file, the key, the words and the email line are new). */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHatiWithMail, seedWorkspace } = require('./helpers');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const T = require('../js/teach.js');

describe('f1182 (1) the whole sentence is read', () => {
  test('on, in both languages, with greetings and courtesy set aside', () => {
    for (const q of ["I'm new", 'I am new here', 'Hi Jambo, I’m new!', 'im new to hati', 'teach me', 'Show me around please',
      'where do I start?', 'How do I get started', 'jag är ny', 'Hej Jambo, jag är ny här', 'visa mig runt'])
      assert.equal(T.teachRead(q), 'on', q);
  });
  test('off, in both languages', () => {
    for (const q of ['I know my way now', "I'm not new anymore", 'stop teaching me', 'jag hittar nu', 'jag är inte ny längre'])
      assert.equal(T.teachRead(q), 'off', q);
  });
  test('a sentence with work in it is not his', () => {
    for (const q of ["I'm new to this NDA with Volvo", 'new agreement', 'new contract with Volvo', 'teach me about the liability cap in MK-3',
      'show me the board', 'how do I upload a contract', 'where do I start the signing for MK-4', ''])
      assert.equal(T.teachRead(q), null, q);
  });
});

describe('f1182 (2) the turn is free and fits the person', () => {
  const H = require('../js/handbook.js');
  const chapters = new Set((H.HANDBOOK_CHAPTERS || []).map(c => c.k));
  test('every first step opens a chapter that exists, one lead each', () => {
    for (const [seat, steps] of Object.entries(T.TEACH_STEPS)){
      assert.ok(steps.length >= 3 && steps.length <= 4, seat + ': three or four steps');
      for (const [, ch] of steps) assert.ok(chapters.has(ch), `${seat}: chapter ${ch} is in the Handbook`);
    }
  });
  test('a Viewer is offered reading, an admin the team, an editor upload and draft', () => {
    const seat = u => T.teachChoices(u).map(c => c.nav.chapter);
    assert.deepEqual(seat({ role: 'viewer' }), T.TEACH_STEPS.viewer.map(s => s[1]));
    assert.deepEqual(seat({ role: 'admin' }), T.TEACH_STEPS.admin.map(s => s[1]));
    assert.deepEqual(seat({ role: 'legal' }), T.TEACH_STEPS.editor.map(s => s[1]));
    assert.ok(!T.TEACH_STEPS.viewer.some(s => ['2.1', '2.2'].includes(s[1])), 'a Viewer is never offered to upload or draft');
    assert.equal(T.teachChoices({ role: 'legal' }).filter(c => c.lead).length, 1);
  });
  test('the turn: on carries the chips, off carries none, a stranger sentence none at all', () => {
    const on = T.teachTurn("I'm new", { role: 'legal' });
    assert.equal(on.ask, 'on'); assert.ok(on.choices.length >= 3); assert.ok(/teach_hello|Welcome/.test(on.html));
    const off = T.teachTurn('I know my way now', { role: 'legal' });
    assert.equal(off.ask, 'off'); assert.ok(!off.choices);
    assert.equal(T.teachTurn('which contracts end this year?'), null);
  });
  test('no model is asked: the file calls no AI route', () => {
    const src = strip(R('js/teach.js'));
    assert.ok(!/api\(|fetch\(|aiAsk|\/api\/ai/.test(src), 'teach.js reads and writes its preference only');
  });
  test('the words, in both books', () => {
    const I = R('js/i18n.js');
    for (const k of ['teach_hint_ph', 'teach_hello', 'teach_what', 'teach_what_viewer', 'teach_pick', 'teach_how_off', 'teach_off',
      'teach_c_upload', 'teach_c_new', 'teach_c_find', 'teach_c_board', 'teach_c_read', 'teach_c_team', 'brn_p_teach', 'brn_pd_teach'])
      assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k + ' in English and Swedish');
  });
});

describe('f1182 (3) the server keeps the answer', () => {
  let h, W;
  before(async () => { h = await startHatiWithMail(); W = await seedWorkspace(h); });
  after(async () => { try { await h.stop(); } catch (_){} });

  test('on, off and forgotten; anything else refused in words', async () => {
    let r = await W.admin.json('/api/me/prefs', { method: 'PUT', body: { teach: 'on' } });
    assert.equal(r.prefs.teach, 'on');
    let b = await W.admin.json('/api/bootstrap');
    assert.equal(b.me.prefs.teach, 'on', 'read back with the person');
    const bad = await W.admin.raw('/api/me/prefs', { method: 'PUT', body: { teach: 'maybe' } });
    assert.equal(bad.status, 400);
    b = await W.admin.json('/api/bootstrap');
    assert.equal(b.me.prefs.teach, 'on', 'a refused value changes nothing');
    r = await W.admin.json('/api/me/prefs', { method: 'PUT', body: { teach: 'off' } });
    assert.equal(r.prefs.teach, 'off');
    r = await W.admin.json('/api/me/prefs', { method: 'PUT', body: { teach: null } });
    assert.ok(!('teach' in r.prefs));
  });
  test('only theirs: a colleague never sees it', async () => {
    await W.restricted.json('/api/me/prefs', { method: 'PUT', body: { teach: 'on' } });
    const a = await W.admin.json('/api/bootstrap');
    const row = (a.users || []).find(u => u.email === 'restricted@example.co.ke');
    assert.ok(row && !(row.prefs || {}).teach, 'an admin\'s list does not carry it');
  });
  test('(5) the welcome email tells them how to ask', async () => {
    h.mail.sent.length = 0;
    await W.admin.json('/api/users', { method: 'POST', body: { name: 'Wanjiru Newcomer', email: 'wanjiru.new@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
    const m = h.mail.sent.find(x => /wanjiru\.new@/.test(String(x.to)));
    assert.ok(m, 'the welcome was sent');
    assert.ok(/tell Jambo "I'm new"/.test(String(m.text || m.html || '')), 'the welcome ends with how to ask');
  });
});

describe('f1182 (4) every box reads it first', () => {
  const region = (src, start, len) => { const i = src.indexOf(start); assert.ok(i >= 0, start); return strip(src.slice(i, i + len)); };
  test("Home's box: before the brain and before the one reader", () => {
    const r = region(R('js/views/intelligence.js'), 'async function intelAsk(', 12000);
    assert.ok(r.indexOf('teachSay(') > 0 && r.indexOf('teachSay(') < r.indexOf('igBoardTalkFirst()'), 'before the brain');
    assert.ok(r.indexOf('teachSay(') > 0 && r.indexOf('caUnderstand(') > r.indexOf('teachSay('), 'before the one reader');
  });
  test('the conversation: before anything is echoed or asked', () => {
    const r = region(R('js/ai.js'), 'async function aiAskWords(', 3000);
    assert.ok(r.indexOf('teachSay(') > 0 && r.indexOf('teachSay(') < r.indexOf('ai.busy=true'));
  });
  test('the shared door, a list panel and the Calendar hand it on before their readers', () => {
    const ca = region(R('js/copilotacts.js'), 'function caAskAnywhere(', 4000);
    assert.ok(ca.indexOf('teachRead(') > 0 && ca.indexOf('teachRead(') < ca.indexOf('caUnderstand('));
    const jl = region(R('js/views/inspector.js'), 'function jlAsk(', 1500);
    assert.ok(jl.indexOf('teachRead(') > 0 && jl.indexOf('teachRead(') < jl.indexOf('jamboPageGo('));
    const cal = region(R('js/views/calendar.js'), 'function calBoxAsk(', 1200);
    assert.ok(cal.indexOf('teachRead(') > 0 && cal.indexOf('teachRead(') < cal.indexOf('calPlanAsk('));
  });
  test("a chip opens its chapter through the one mover", () => {
    const nv = region(R('js/navmap.js'), 'function navGo(a)', 3000);
    assert.ok(/n\.k === 'chapter'[\s\S]{0,240}hbkOpen\(n\.chapter\)/.test(nv), 'the Handbook door Jambo\'s answers already use');
  });
  test('the file is loaded by the app and named on the Brain map', () => {
    assert.ok(/import '\.\/teach\.js'/.test(R('js/app.js')));
    const B = require('../js/brainmap.js');
    assert.ok(B.BRAIN_PARTS.some(p => p.id === 'teach' || (Array.isArray(p) && p[0] === 'teach')));
  });
});

describe('f1182 (5) the hint', () => {
  const day = 86400000;
  test('first days, until they say either', () => {
    const fresh = { createdAt: new Date(Date.now() - 2 * day).toISOString(), prefs: {} };
    assert.equal(T.teachHintOn(fresh), true);
    assert.equal(T.teachHintOn({ ...fresh, prefs: { teach: 'on' } }), false, 'said "I\'m new": the hint has done its job');
    assert.equal(T.teachHintOn({ ...fresh, prefs: { teach: 'off' } }), false);
    assert.equal(T.teachHintOn({ createdAt: new Date(Date.now() - (T.TEACH_HINT_DAYS + 1) * day).toISOString(), prefs: {} }), false, 'past the first days');
    assert.equal(T.teachHintOn({ prefs: {} }), false, 'no join day: no guess');
  });
  test("the boxes' example words read it", () => {
    assert.ok(/teachHintOn\(\)\) return i18t\('teach_hint_ph'\)/.test(strip(R('js/views/intelligence.js'))), "Home's box");
    assert.ok(/teachHintOn\(\)\) return i18t\('teach_hint_ph'\)/.test(strip(R('js/views/inspector.js'))), "a page's panel");
    assert.ok(/teachPh\(i18t\('jl_ph_any'\)\)/.test(strip(R('js/app.js'))), "the side panel's box");
  });
});
