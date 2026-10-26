/* f938 — JAMBO READS THE HANDBOOK, ON EVERY PAGE (owner, 26 Oct 2026)

   Asked "what is the handbook about?" on the Handbook page, Jambo summarised the contracts: the brain had never
   read the book. The owner: "the goal is to have jambo be the cure to all question related to the platform but
   it is not closing the gap" … "we are looking to address the issue across HaTi not just the handbook".
     1 · the book in plain words, read by both hosts through ONE reader (js/handbook.js)
     2 · the ONE search holds it (kind guide), every reader may read it, a hit carries its steps and its door
     3 · THE EXAM: questions about HaTi in a person's own words, from every part of the app, find their chapter
     4 · every page Jambo can be on names the chapters that cover it (the gap report), and says so to the model
     5 · one rule on both hosts, word for word; a chapter is a button under the answer, never a move
   AT THE PARENT every test here fails: the readers, the kind, the rule and the door are not there (the exam
   scores 0 of 63 — no chapter can be found).

   Run: node --test test/f938-jambo-reads-the-handbook.test.js        (the exam alone: node test/handbook-exam.js) */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const HBK = require('../js/handbook.js');
const { STRINGS } = require('../js/i18n.js');
const { HBK_EXAM } = require('./handbook-exam.js');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const SRV = R('server/server.js'), AIJS = R('js/ai.js'), NAV = R('js/navmap.js'), HS = R('js/hatisearch.js');
const fnBody = (src, name) => { const i = src.indexOf(`function ${name}(`); assert.ok(i >= 0, name + ' is defined');
  let d = 0, j = src.indexOf('{', src.indexOf(')', i)); for (; j < src.length; j++){ if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) break; }
  return src.slice(i, j + 1) + '\n'; };
const word = (kind, key, lang) => { const k = kind === 'door' ? 'hbk_d_' + key : key; const b = STRINGS[lang] || STRINGS.en; const v = b[k] != null ? b[k] : STRINGS.en[k]; return typeof v === 'string' ? v : ''; };

/* THE FLOOR: measured 62 of 63 on 26 Oct 2026 with the person's own words alone (the chat adds the app's words
   too). The known miss, kept honest rather than tuned away: "how do I ask jambo something". The floor only rises. */
const HBK_EXAM_FLOOR = 0.95;

let h, W, ai;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' });
  W = await seedWorkspace(h);
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });
const find = (client, q, kinds) => client.json('/api/hati-search?limit=3&q=' + encodeURIComponent(q) + (kinds ? '&kinds=' + kinds : ''));

describe('f938 (1) the book in plain words, one reader for both hosts', () => {
  const docs = HBK.hbkSearchDocs(word);
  test('every chapter and the book itself, both languages, no marker left', () => {
    assert.equal(docs.length, HBK.HANDBOOK_CHAPTERS.length + 1);
    assert.equal(docs[0].k, 'about');
    for (const d of docs) assert.ok(!/\{(ui|door):/.test(d.body + d.title), d.k + ' carries no raw marker');
    const sign = docs.find(d => d.k === '4.2');
    assert.match(sign.body, /How: 1\. /); assert.match(sign.body, /Hur: 1\. /);
  });
  test('the book itself says what it is, in the reader\'s language', () => {
    assert.match(HBK.hbkPlainFor('about', 'en', word), /^The Handbook is HaTi's own instruction book: \d+ chapters in \d+ parts/);
    assert.match(HBK.hbkPlainFor('about', 'sv', word), /^Handboken är HaTis egen instruktionsbok/);
    assert.match(HBK.hbkPlainFor('7.4', 'en', word), /^7\.4 Money: currencies and rates\n/);
  });
  test('both hosts read it through these readers', () => {
    assert.ok(SRV.includes("const HBK = require('../js/handbook.js');"));
    assert.ok(SRV.includes('for (const d of HBK.hbkSearchDocs(srvHbkWord)) hsPut(\'guide\''));
    assert.ok(fnBody(AIJS, '_localHatiSearch').includes('hbkSearchDocs(aiHbkWord)'), 'the browser\'s own search too');
    assert.ok(HS.includes("'standard', 'guide'];"), 'guide is one of the search\'s kinds');
  });
});

describe('f938 (2) the one search holds the book', () => {
  test('a guide hit carries its chapter and its steps; the owner\'s question finds the book itself first', async () => {
    const r = await find(W.admin, 'what is the handbook about?', 'guide');
    assert.equal(r.hits[0] && r.hits[0].chapter, 'about', JSON.stringify(r.hits.map(x => x.chapter)));
    assert.match(r.hits[0].steps, /The Handbook is HaTi's own instruction book/);
  });
  test('every reader may read it: a viewer finds the chapter too', async () => {
    const r = await find(W.viewer || W.restricted, 'how do I add an exchange rate', 'guide');
    assert.ok(r.hits.some(x => x.chapter === '7.4'), JSON.stringify(r.hits.map(x => x.chapter)));
  });
  test('a guide hit is a door onto its chapter', () => {
    assert.match(fnBody(SRV, 'hsDoorOf'), /if \(h\.kind === 'guide'\) return \{ kind: 'chapter', chapter: h\.ref \};/);
    assert.match(fnBody(SRV, 'aiDoorOf'), /if \(k === 'chapter'\) \{ const ch = txt\(d\.chapter, 8\); return ch === HBK\.HBK_ABOUT \|\| HBK\.hbkChapterOf\(ch\) \? \{ kind: k, chapter: ch \} : null; \}/);
  });
});

describe('f938 (3) THE EXAM: questions about HaTi find their chapter', () => {
  test(`at least ${HBK_EXAM_FLOOR * 100}% of ${HBK_EXAM.length} questions, from every part of the app`, async () => {
    let ok = 0; const miss = [];
    for (const [q, want] of HBK_EXAM){
      const r = await find(W.admin, q, 'guide');
      const got = (r.hits || []).map(x => x.chapter);
      if (got.some(k => want.includes(k))) ok++; else miss.push(`${q} → ${got.join(', ')}`);
    }
    assert.ok(ok / HBK_EXAM.length >= HBK_EXAM_FLOOR, `${ok} of ${HBK_EXAM.length}; missed:\n${miss.join('\n')}`);
  });
  test('the exam covers every part of the book', () => {
    const parts = new Set(HBK_EXAM.flatMap(([, w]) => w).map(k => (HBK.hbkChapterOf(k) || {}).part).filter(Boolean));
    for (const p of HBK.HANDBOOK_PARTS) assert.ok(parts.has(p.k), p.k);
  });
});

describe('f938 (4) every page names the chapters that cover it (the gap report)', () => {
  const views = [...AIJS.match(/const AI_PAGE_NAMES = \{([\s\S]*?)\};/)[1].matchAll(/(\w+):\s*['"]/g)].map(m => m[1]);
  test('no page Jambo can be on is without a chapter', () => {
    const gaps = views.filter(v => !HBK.hbkChaptersForPage(v).length);
    assert.deepEqual(gaps, [], 'pages the Handbook owes a chapter: ' + gaps.join(', '));
    for (const f of Object.keys(HBK.HBK_FACE_DOORS)) assert.ok(HBK.hbkChaptersForPage('dashboard', f).length, 'Home · ' + f);
  });
  test('the chapter that owns a page leads it', () => {
    const lead = (v, f) => (HBK.hbkChaptersForPage(v, f)[0] || {}).k;
    assert.equal(lead('redline'), '3.1'); assert.equal(lead('obligations'), '5.1'); assert.equal(lead('approvals'), '4.1');
    assert.equal(lead('register'), '0.6'); assert.equal(lead('dashboard', 'explorer'), '6.2'); assert.equal(lead('team'), '7.1');
  });
  test('the page sentence names them, the same on both hosts', () => {
    const run = (src, name) => { const ctx = {}; vm.createContext(ctx); vm.runInContext(fnBody(src, name) + `this.f = ${name};`, ctx); return ctx.f; };
    const srv = run(SRV, 'pageSays'), web = run(AIJS, 'aiPageSays');
    const P = { view: 'handbook', name: 'Handbook', chapter: '7.4 Money: currencies and rates', chapters: ['0.5 The right-hand panel'] };
    assert.equal(srv(P), web(P));
    assert.match(srv(P), /They are reading the Handbook chapter "7\.4 Money: currencies and rates"; "this" and "this chapter" mean it\. The Handbook chapters that cover this page: 0\.5 The right-hand panel\./);
    const page = fnBody(AIJS, 'aiPageContext');
    assert.ok(page.includes('const chs = hbkChaptersForPage(view, page.face || \'\');') && page.includes('if (c) page.chapter = t(c);'), 'every page sends its chapters; the Handbook its open one');
  });
});

describe('f938 (5) one rule, and a chapter is a button', () => {
  test('the rule, word for word on both hosts, in both system prompts', () => {
    const srv = SRV.match(/\nconst AI_HANDBOOK_RULE = (".*?");\n/)[1], web = AIJS.match(/\nconst AI_HANDBOOK_RULE=(".*?");\n/)[1];
    assert.equal(srv, web);
    assert.match(srv, /never from the contracts: call search_hati with kinds \[\\"guide\\"\]/);
    assert.match(srv, /\\"your book\\" and \\"the book\\" mean the contracts/);
    assert.ok(fnBody(SRV, 'buildCopilotSystem').includes('- ${AI_HANDBOOK_RULE}`;'));
    assert.ok(AIJS.includes('${AI_CALENDAR_RULE} ${AI_HANDBOOK_RULE}\n'));
  });
  test('through the chat: the rule and the page reach the model, and the chapter comes back as a button', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'tu_s', name: 'search_hati', input: { words: 'handbook instructions', kinds: ['guide'] } }]);
    ai.script([{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input: { answer: 'The Handbook is HaTi\'s instruction book: 43 chapters in 8 parts.', citations: [],
      goto: { task: 'needs', door: { kind: 'chapter', chapter: 'about' } } } }]);
    const res = await W.admin.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'what is the handbook about?' }],
      context: { page: { view: 'handbook', name: 'Handbook', chapters: ['0.5 The right-hand panel'] } } } });
    const first = JSON.stringify(ai.calls[0].body);
    assert.match(first, /HaTi ITSELF IS ANSWERED FROM THE HANDBOOK/);
    assert.match(first, /The Handbook chapters that cover this page: 0\.5 The right-hand panel/);
    const toolResult = JSON.stringify(ai.calls[1].body.messages);
    assert.match(toolResult, /The Handbook is HaTi's own instruction book/, 'the search handed the model the book\'s own words');
    assert.ok(!res.goto, 'no move away from where the question was asked');
    assert.deepEqual(res.choices, [{ label: 'Handbook › The Handbook', door: { kind: 'chapter', chapter: 'about' } }]);
  });
  test('a chapter\'s button lands through the one mover', () => {
    const ctx = { navBook: () => [], hbkChapterOf: HBK.hbkChapterOf, HANDBOOK_PARTS: HBK.HANDBOOK_PARTS, langId: () => 'en', _nvT: k => k, opened: null, part: null };
    ctx.hbkOpen = (k, o) => { ctx.opened = k; ctx.part = o && o.part; return true; };
    vm.createContext(ctx);
    vm.runInContext(fnBody(NAV, 'navDoorOf') + fnBody(NAV, 'navGo').replace(/navGoStage2\(n\) \|\| navGoStage3\(n\)/, 'false') + 'this.door = navDoorOf; this.go = navGo;', ctx);
    const a = ctx.door({ kind: 'chapter', chapter: '4.2' });
    assert.equal(a.kind, 'go'); assert.deepEqual(JSON.parse(JSON.stringify(a.nav)), { k: 'chapter', chapter: '4.2' });
    ctx.go(a); assert.equal(ctx.opened, '4.2');
    ctx.go(ctx.door({ kind: 'chapter', chapter: 'about' })); assert.equal(ctx.opened, null, 'the book\'s front page'); assert.equal(ctx.part, 'around', 'its first part');
    assert.equal(ctx.door({ kind: 'chapter', chapter: '9.9' }), null, 'no such chapter is no door');
  });
  test('the local-mode chat makes the same button', () => {
    const ctx = { hbkChapterOf: HBK.hbkChapterOf, langId: () => 'sv' }; vm.createContext(ctx);
    vm.runInContext(fnBody(AIJS, 'aiLocalChapterButton') + 'this.f = aiLocalChapterButton;', ctx);
    const final = { answer: 'x', goto: { door: { kind: 'chapter', chapter: '4.2' } } };
    ctx.f(final);
    assert.equal(final.goto, null);
    assert.match(final.choices[0].label, /^Handboken › 4\.2 /);
  });
});
