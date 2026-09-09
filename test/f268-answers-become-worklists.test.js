/* f268 — an answer is a worklist
   ==============================
   Owner-asked (9 Sep 2026). A question about the book and a filtered list of
   the book are the same thing seen twice, and the second one was unreachable:
   the cards under a Copilot answer open ONE contract each, so "which of these
   ends inside sixty days and has nobody on it" left the reader opening eight
   contracts one at a time — or rebuilding the question by hand in the filter
   bar, where several of these answers cannot be rebuilt at all.

   WHAT THIS FILE IS REALLY GUARDING is not the button. It is the four
   promises around it, each of which is a way the door could quietly start
   lying:

   1. IT SPENDS NOTHING. The ids are already on the answer, so this is a
      reading of something that has arrived — never a second question and
      never a second call to the model.
   2. ONE DOOR. regShowOnly is the register's only way in and it carries its
      own two safety properties (the chip says what the set is, the way back
      is on the chip). Nothing here may narrow anything itself.
   3. NO COUNT. The register narrows FURTHER inside a named set — a stage
      filter the reader left on still applies — so a figure on this button
      could disagree with the list behind it, which is the one thing a door
      must never do.
   4. IT IS BUILT IN ONE PLACE. aiCards is the single builder every branch of
      the intent engine and the server answer alike reach the reader through,
      and the phone draws the same markup. Built anywhere else it would be
      eleven doors that drift. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');

/* The same stage as f88, f97, f98 and f135's loaders, deliberately — plus the
   two things this feature actually reads: a real esc (the published one, which
   escapes quotes BECAUSE these values land in attributes) and a regShowOnly
   that records rather than acts, so a press can be read back. */
function loadAi(opts = {}){
  const el = () => ({ addEventListener(){}, querySelectorAll(){ return []; },
    querySelector(){ return null; }, innerHTML: '', value: '', style: {},
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    focus(){}, setSelectionRange(){}, getBoundingClientRect(){ return { width: 430 }; } });
  const ESC_MAP = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
  const sandbox = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp,
    Set, Map, Error, isNaN, parseInt, parseFloat, setTimeout, Promise,
    document: { getElementById: () => el(), querySelector: () => null,
      querySelectorAll: () => [], addEventListener(){}, createElement: () => el(),
      body: { classList: { toggle(){} } } },
    state: { contracts: [], view: '' }, icon: () => '',
    esc: s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ESC_MAP[ch]),
    toast(){}, lsGet(){ return null; }, lsSet(){}, getContract(){ return null; },
    currentUser(){ return { name: 'You' }; }, API_MODE(){ return false; },
    innerWidth: 1400, addEventListener(){},
    isMonetary: () => true, fmtMoneyShort: n => String(n), cIcon: () => 'file',
    statusChip: () => '', contractStatusChip: () => '',
  };
  sandbox.window = sandbox;
  /* The one thing a stage can legitimately lack: the register. Where it is
     absent the door must not be drawn at all — a press that does nothing is
     worse than no press. */
  if (opts.register !== false){
    sandbox.regShown = [];
    sandbox.regShowOnly = (ids, label) => sandbox.regShown.push({ ids, label });
  }
  vm.createContext(sandbox);
  for (const f of ['i18n.js', 'jurisdiction.js', 'ai.js'])
    vm.runInContext(SRC(f), sandbox, { filename: f });
  return sandbox;
}

const book = n => Array.from({ length: n }, (_, i) => ({
  id: 'MK-' + (100 + i), name: 'Agreement ' + i, counterparty: 'Naivas', value: 1000,
  status: 'Signed' }));

/* A question on the record, which is what the label is read from. */
function asked(w, q){ w.ai.history.push({ role: 'user', text: q }); }

describe('f268 (1) the door is drawn where it can work and nowhere else', () => {
  test('two contracts or more draw it', () => {
    const w = loadAi();
    assert.match(w.aiWorklistHtml(book(2)), /data-ai-worklist=/);
    assert.match(w.aiWorklistHtml(book(9)), /data-ai-worklist=/);
  });

  /* A worklist of ONE contract IS that contract, and its card is already the
     door. Drawing a second one beside it is the duplicate this codebase opens
     by warning about. */
  test('one contract draws nothing — its card is already the door', () => {
    assert.equal(loadAi().aiWorklistHtml(book(1)), '');
  });

  test('an empty list draws nothing', () => {
    const w = loadAi();
    assert.equal(w.aiWorklistHtml([]), '');
    assert.equal(w.aiWorklistHtml(null), '');
  });

  /* THE DEAD-PRESS RULE. A stage without the register — and there are real
     ones — must not be offered a button whose only outcome is nothing. */
  test('no register on the page, no door', () => {
    const w = loadAi({ register: false });
    assert.equal(w.aiWorklistHtml(book(4)), '');
  });

  /* A list of records that carry no id cannot narrow anything, so it must not
     claim it can. */
  test('records with no id draw nothing', () => {
    const w = loadAi();
    assert.equal(w.aiWorklistHtml([{ name: 'a' }, { name: 'b' }]), '');
  });

  test('the floor is a named constant, not a literal in the branch', () => {
    const w = loadAi();
    assert.equal(w.AI_WORKLIST_MIN, 2);
  });
});

describe('f268 (2) the set travels, exactly', () => {
  test('every id the answer named is on the button, in order', () => {
    const w = loadAi();
    const html = w.aiWorklistHtml(book(4));
    const got = /data-ai-worklist="([^"]*)"/.exec(html);
    assert.ok(got, 'the ids attribute is missing');
    assert.deepEqual(got[1].split(' '), ['MK-100', 'MK-101', 'MK-102', 'MK-103']);
  });

  /* A contract id is minted MK-<n> and carries no space — which is what lets
     the whole set travel in one attribute. If ids ever gain one, this fails
     here rather than by silently splitting a set in half at the press. */
  test('an id carrying a space cannot be smuggled into the set', () => {
    const w = loadAi();
    const html = w.aiWorklistHtml([{ id: 'MK-1' }, { id: 'MK 2' }]);
    const got = /data-ai-worklist="([^"]*)"/.exec(html)[1].split(' ');
    assert.notEqual(got.length, 2,
      'a spaced id read back as two ids and nothing noticed');
  });
});

describe('f268 (3) NO COUNT — the door may not disagree with the list', () => {
  /* The register applies the reader's other filters INSIDE a named set, so a
     figure here could promise seven and land on three. The expander directly
     above already prints how many the answer holds, so the count is not lost —
     it is simply not printed twice, in the one place it could be wrong. */
  test('the button carries no number at all', () => {
    const w = loadAi();
    for (const n of [2, 3, 8, 40]){
      const label = />([^<]*)<\/button>/.exec(w.aiWorklistHtml(book(n)));
      assert.ok(label, 'no button label');
      assert.equal(/\d/.test(label[1]), false,
        `the button printed a figure for a list of ${n}: ${label[1]}`);
    }
  });
});

describe('f268 (4) the label is the reader’s own question', () => {
  test('it is the question being answered, not the newest one', () => {
    const w = loadAi();
    asked(w, 'which contracts expire in the next 60 days');
    const html = w.aiWorklistHtml(book(3));
    assert.match(html, /data-ai-worklist-label="which contracts expire in the next 60 days"/);
  });

  /* The chip this lands in sits on a filter bar the owner has twice ruled must
     fit one line, and that chip sets no width of its own — so the trimming is
     this builder's job. */
  test('a long question is trimmed to the bound', () => {
    const w = loadAi();
    asked(w, 'x'.repeat(400));
    const got = /data-ai-worklist-label="([^"]*)"/.exec(w.aiWorklistHtml(book(3)))[1];
    assert.ok(got.length <= w.AI_WORKLIST_LABEL_MAX,
      `label ran to ${got.length} characters`);
    assert.match(got, /…$/, 'a trimmed label must say it was trimmed');
  });

  test('a short question is left exactly as asked', () => {
    const w = loadAi();
    asked(w, 'which are with Naivas');
    assert.match(w.aiWorklistHtml(book(3)),
      /data-ai-worklist-label="which are with Naivas"/);
  });

  /* An empty label is passed through on purpose: the register's chip has its
     own fallback sentence for exactly that, and inventing one here would be a
     second answer to a question that is already answered. */
  test('with nothing asked, the label is empty rather than invented', () => {
    const w = loadAi();
    assert.match(w.aiWorklistHtml(book(3)), /data-ai-worklist-label=""/);
  });

  /* THE ATTRIBUTE WALL. A question is free text typed by a person, and it
     lands inside a double-quoted attribute — so a quote in it must not be able
     to close that attribute and open a new one. */
  test('a quote in the question cannot break out of the attribute', () => {
    const w = loadAi();
    asked(w, 'which say "force majeure" <b>and</b> expire');
    const html = w.aiWorklistHtml(book(3));
    assert.equal(/data-ai-worklist-label="[^"]*"[^>]*onerror/.test(html), false);
    assert.match(html, /&quot;force majeure&quot;/);
    assert.equal(html.includes('<b>'), false, 'markup survived into the button');
  });
});

describe('f268 (5) ONE DOOR, and it spends nothing', () => {
  const src = SRC('ai.js');

  /* regShowOnly is the register's only way in. This feature may press it and
     may never grow a narrowing of its own — two ways to narrow the register
     do not fail, they drift, and then two screens disagree about what the
     reader is looking at. */
  test('the only narrowing in ai.js is regShowOnly', () => {
    assert.equal((src.match(/regShowOnly\(/g) || []).length >= 1, true);
    assert.equal(/R\.only\s*=/.test(src), false,
      'ai.js writes the register’s narrowing directly instead of pressing its door');
    assert.equal(/regSetScope\(/.test(src), false,
      'ai.js reaches past regShowOnly into the register’s scope');
  });

  /* A reading of an answer that has already arrived. If this ever starts
     asking the model something, it stops being free and starts being a second
     question the reader did not ask. */
  test('the builder calls no model and no route', () => {
    const body = /function aiWorklistHtml\(list\)\{[\s\S]*?\n\}/.exec(src);
    assert.ok(body, 'aiWorklistHtml not found');
    for (const forbidden of ['copilotAsk', 'api(', 'fetch(', 'aiSubmit', 'ai/'])
      assert.equal(body[0].includes(forbidden), false,
        `the worklist door reaches for ${forbidden}`);
  });

  /* BUILT IN ONE PLACE. Eleven branches of the intent engine and the server
     answer all reach the reader through aiCards, and the phone draws the same
     markup — so the door is built there and nowhere else, or it is eleven
     doors that drift apart. */
  test('the door is built inside aiCards and nowhere else', () => {
    const calls = (src.match(/aiWorklistHtml\(/g) || []).length;
    assert.equal(calls, 2,
      `expected the definition and the one aiCards call — found ${calls}`);
    const cards = /const aiCards = list => \{[\s\S]*?\n\};/.exec(src);
    assert.ok(cards, 'aiCards not found');
    assert.match(cards[0], /aiWorklistHtml\(list\)/);
  });

  /* Published, or every guarded read of it elsewhere is silence — this
     codebase's most repeated defect. */
  test('the builder and its floor leave the module by name', () => {
    for (const n of ['aiWorklistHtml', 'AI_WORKLIST_MIN', 'AI_WORKLIST_LABEL_MAX'])
      assert.match(src, new RegExp('Object\\.assign\\(window[\\s\\S]*\\b' + n + '\\b'),
        `${n} is never published`);
  });

  /* Both shapes of the card list — the short one and the one behind the
     expander — must carry it, or a broad answer is the one that cannot be
     worked through. */
  test('both card-list shapes carry the door', () => {
    const w = loadAi();
    asked(w, 'which expire soon');
    assert.match(w.aiCards(book(3)), /data-ai-worklist=/);
    const wide = w.aiCards(book(9));
    assert.match(wide, /data-ai-worklist=/);
    assert.match(wide, /<details/, 'the expander went missing');
    /* It is the act on the whole list, so it reads after the list. */
    assert.ok(wide.indexOf('data-ai-worklist=') > wide.indexOf('</details>'),
      'the door was drawn inside the list rather than under it');
  });

  test('a single-card answer still draws no door', () => {
    const w = loadAi();
    assert.equal(/data-ai-worklist=/.test(w.aiCards(book(1))), false);
  });
});

describe('f268 (6) the words, in both languages', () => {
  /* Read off the dictionaries the way f148 does, rather than by switching a
     sandbox's language: what is being asserted is that both books carry the
     words, which is a fact about the file. */
  const { STRINGS } = require('../js/i18n.js');

  test('both keys answer in English and in Swedish', () => {
    for (const lang of ['en', 'sv'])
      for (const k of ['ai_worklist', 'ai_worklist_title']){
        const v = STRINGS[lang][k];
        assert.ok(v && String(v).trim(), `${k} is missing in ${lang}`);
      }
  });

  test('the two books say different things — neither is a forgotten copy', () => {
    assert.notEqual(STRINGS.en.ai_worklist, STRINGS.sv.ai_worklist);
    assert.notEqual(STRINGS.en.ai_worklist_title, STRINGS.sv.ai_worklist_title);
  });

  /* The rename that went with this build: the control promised a feature that
     has never existed — nothing in HaTi saves a view — so the reader went
     hunting for a delete button that could not be there. */
  test('the quick-filter control no longer promises a saved view', () => {
    for (const lang of ['en', 'sv']){
      const v = STRINGS[lang].reg_quick_filters;
      assert.ok(v && String(v).trim(), `reg_quick_filters missing in ${lang}`);
      assert.equal(/saved|sparade|\bvyer\b|\bviews\b/i.test(v), false,
        `the label still says it saves a view: ${v}`);
      assert.ok(STRINGS[lang].reg_quick_filters_title, `title missing in ${lang}`);
    }
  });

  test('the retired key is gone rather than shadowed', () => {
    for (const lang of ['en', 'sv']){
      assert.equal(STRINGS[lang].reg_saved_views, undefined,
        `reg_saved_views still answers in ${lang}`);
      assert.equal(STRINGS[lang].reg_saved_views_title, undefined,
        `reg_saved_views_title still answers in ${lang}`);
    }
  });

  /* And nothing reads the retired key — a rename that leaves a caller behind
     draws the key's own name on screen. */
  test('nothing in the product still asks for the retired key', () => {
    const reg = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'register.js'), 'utf8');
    assert.equal(reg.includes('reg_saved_views'), false);
    assert.match(reg, /i18t\('reg_quick_filters'\)/);
    assert.match(reg, /i18t\('reg_quick_filters_title'\)/);
  });
});
