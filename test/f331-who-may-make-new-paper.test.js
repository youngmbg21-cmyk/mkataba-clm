/* f331 — WHO MAY MAKE NEW PAPER
   ============================================================
   Young ruled it 18 September 2026, over a render of the person drawer with a
   fifth row on it: **May create new paper — No**, and under it the sentence
   that is now `st_paper_note` word for word.

   WHAT THE RULE IS. "New paper" is paper with no approved wording behind it:
   writing a company-standard template. Drafting an NDA off a template your own
   team approved is NOT building from scratch — it is the everyday act, and it
   stays open to anyone who can edit. So the grant gates the builder, and it
   gates nothing else.

   WHY IT IS A TICK AND NOT A ROLE. HaTi has three roles and "Legal" is what
   the screen calls Editor, so a role-shaped rule would currently change
   nothing: Legal and Admin between them are already everyone who can edit. The
   tick sits beside the four per-person grants that already work this way.

   THE ONE PLACE THIS DIFFERS FROM ITS FOUR NEIGHBOURS is the default. The
   owner's own word on the row is "Off by default", so an Editor who could open
   the builder yesterday asks for the grant today. That is the point of the
   rule rather than a cost of it — and it is why every refusal here has to
   carry the door that already exists rather than stopping at "no".

   WHAT IS MEASURED IN A BROWSER INSTEAD: that the greyed button is actually
   greyed on a painted page, and that the drawer's row draws. jsdom resolves no
   layout and settings-tabs-verify owns that half. */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const read = f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (_) { return ''; } };
/* Comments are not code: a rule quoted in a note above the thing it governs
   would otherwise pass for the thing itself. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const CORE = read('js/core.js');
const SRV = read('server/server.js');
const SET = read('js/views/settings.js');
const TPLLIB = read('js/views/templatelib.js');
const LIB = read('js/views/library.js');
const I18N = read('js/i18n.js');

describe('f331 (1) — one reading, and it is off by default', () => {
  test('mayMakeNewPaper is declared in core and published', () => {
    assert.match(CORE, /const mayMakeNewPaper\s*=/, 'the reading exists');
    assert.match(CORE, /,mayMakeNewPaper,/, 'published — an unpublished name is unreachable (f232)');
  });

  test('an absent answer is a NO, and an admin is always a yes', () => {
    const body = strip(CORE).match(/const mayMakeNewPaper\s*=[\s\S]*?\n\n/);
    assert.ok(body, 'the reading has a body');
    const b = body[0];
    /* Three answers in one expression, and the SHAPE is the claim: a viewer
       never, an admin always, and everybody else only on an explicit true. */
    assert.match(b, /role!=='viewer'/, 'a viewer may not, because a viewer may not edit at all');
    assert.match(b, /role==='admin'/, 'an admin holds it by rank');
    assert.match(b, /newPaper===true/, 'STRICTLY true — absent, null and undefined are all "no"');
  });

  test('the reading takes a person, so a drawer can ask it about somebody else', () => {
    assert.match(CORE, /const mayMakeNewPaper\s*=\s*\(u\)/, 'it takes an argument');
    assert.match(CORE, /u===undefined\)\?currentUser\(\)/, 'and falls back to the reader');
  });
});

describe('f331 (2) — the server is the wall', () => {
  test('the column exists and defaults to OFF', () => {
    assert.match(SRV, /addColumnIfMissing\('users', 'new_paper', 'INTEGER NOT NULL DEFAULT 0'\)/,
      "default 0 — the owner's own word on the row is Off by default");
  });

  test('the raw fact travels, never the resolved one', () => {
    assert.match(SRV, /newPaper: !!u\.new_paper/,
      'the stored answer; one predicate answers for admins, on both hosts');
  });

  test('it never reaches a colleague', () => {
    const line = SRV.match(/const ADMIN_ONLY_USER_FIELDS = \[[^\]]*\]/);
    assert.ok(line, 'the list exists');
    assert.match(line[0], /'newPaper'/, 'a new per-person grant joins this list the day it is added');
  });

  test('paperMaker narrows templateManager rather than replacing it', () => {
    const b = strip(SRV).match(/const paperMaker = \(req, res, next\) => \{[\s\S]*?\n\};/);
    assert.ok(b, 'the middleware exists');
    assert.match(b[0], /role !== 'admin' && req\.user\.role !== 'legal'/,
      'you still have to be Admin or Editor');
    assert.match(b[0], /mayMakeNewPaperRow\(req\.user\)/, 'and then you have to hold the grant');
    assert.match(b[0], /403/, 'it refuses rather than falling through');
  });

  test('the refusal names the door that exists', () => {
    const b = SRV.match(/const paperMaker = \(req, res, next\) => \{[\s\S]*?\n\};/)[0];
    assert.match(b, /request to the contracts team/i,
      'a refusal carries its way forward — this codebase has no dead ends');
  });

  test('the five routes that MINT or WRITE a company standard ask it', () => {
    for (const r of [
      "app.post('/api/templates', auth, paperMaker,",
      "app.post('/api/templates/upload', auth, paperMaker,",
      "app.post('/api/templates/:id/versions', auth, paperMaker,",
      "app.put('/api/templates/:id/versions/:vid', auth, paperMaker,",
      "app.post('/api/templates/:id/versions/:vid/publish', auth, paperMaker,",
    ]) assert.ok(SRV.includes(r), r + ' is gated');
  });

  test('and the housekeeping routes are DELIBERATELY not gated', () => {
    /* A WALL, not an omission. Renaming, re-filing, archiving and deleting a
       template are not writing paper; drafting a contract from one is the
       everyday act the rule exists to protect. Gating these would take away
       the thing the owner's own note promises stays open. */
    for (const r of [
      "app.patch('/api/templates/:id', auth, templateManager,",
      "app.delete('/api/templates/:id', auth, templateManager,",
      "app.post('/api/templates/:id/contracts', auth, editor,",
    ]) assert.ok(SRV.includes(r), r + ' stays open');
  });

  test('saving a counterparty’s own template is importing, not writing', () => {
    /* customTemplates rides /api/settings/templates, which keeps its role
       gate. Their wording is theirs; the rule names writing ours. */
    assert.ok(SRV.includes("app.put('/api/settings/templates', auth, templateManager,"),
      'the counterparty-paper path is not gated by the new-paper grant');
  });
});

describe('f331 (3) — only an admin grants it', () => {
  test('PATCH takes newPaper, and a non-admin may not send it', () => {
    const b = strip(SRV).match(/app\.patch\('\/api\/users\/:id'[\s\S]{0,3000}/)[0];
    assert.match(b, /const hasPaper = b\.newPaper !== undefined/, 'the route reads it');
    assert.match(b, /!hasClear2 && !hasPaper\)\s*\n\s*return res\.status\(400\)/,
      '"nothing to change" counts it');
    assert.match(b, /!hasClear2 && !hasPaper\)\)\s*\n\s*return res\.status\(403\)/,
      'and the self-service door refuses it — somebody who could tick their own box is not governed');
  });

  test('an admin cannot be stored as a NO, and a viewer cannot be stored as a YES', () => {
    const b = strip(SRV).match(/if \(hasPaper\) \{[\s\S]*?\n  \}/)[0];
    assert.match(b, /role === 'admin' && !b\.newPaper/, 'refuses a stored no on an admin');
    assert.match(b, /role === 'viewer' && b\.newPaper/, 'refuses a stored yes on a viewer');
    assert.match(b, /UPDATE users SET new_paper=\?/, 'and writes the column');
  });
});

describe('f331 (4) — the drawer draws it', () => {
  test('the row is a checkbox in the "what they may do" section', () => {
    assert.match(SET, /id="tm-paper" type="checkbox"/, 'the tick exists');
    assert.match(SET, /st_paper_on'\):i18t\('st_paper_off'/, 'and it says which way it is set');
  });

  test('it is drawn under the same four conditions as the values tick', () => {
    const at = SET.indexOf('id="tm-paper"');
    /* A NEGATIVE INDEX SLICES THE WHOLE FILE, which contains every condition
       below and would report a clean sweep on a build that has no row at all.
       The anchor is asserted before it is used — the same lesson f329's own
       realBody() helper is written for. */
    assert.ok(at > 0, 'the row is drawn');
    const before = SET.slice(Math.max(0, at - 700), at);
    for (const cond of ['!isNew', 'isAdmin()', '!isMe', 'API_MODE()'])
      assert.ok(before.includes(cond), 'guarded on ' + cond);
    assert.ok(before.includes("u.role!=='viewer'"),
      'and never offered to a viewer — the server refuses it too');
  });

  test('an admin gets the sentence, not a tick that cannot be untied', () => {
    const at = SET.indexOf('id="tm-paper"');
    assert.ok(at > 0, 'the row is drawn');
    const before = SET.slice(Math.max(0, at - 500), at);
    assert.ok(before.includes("u.role==='admin'") && before.includes('st_paper_admin'),
      'an admin holds it by rank and the row says so');
  });

  test('the drawer reads the product’s own reading', () => {
    assert.match(SET, /const stNewPaperOn=u=>\(typeof mayMakeNewPaper==='function'\)/,
      'one reading, so the drawer and the doors cannot disagree');
  });

  test('the save carries it, and a null answer changes nothing', () => {
    assert.match(SET, /const paperBox=document\.getElementById\('tm-paper'\)/, 'read');
    assert.match(SET, /const paperTo = paperBox \? !!paperBox\.checked : null/,
      'absent box means the row was not drawn');
    assert.match(SET, /paperTo!==null && paperTo!==stNewPaperOn\(target\)/, 'changed?');
    assert.match(SET, /if\(paperChanged\) patch\.newPaper=paperTo/, 'into the patch');
    assert.match(SET, /if\(patch\.newPaper!==undefined\) body\.newPaper=patch\.newPaper/, 'onto the wire');
  });
});

describe('f331 (5) — every door refuses the same way', () => {
  test('one refusal, one sentence, one way forward', () => {
    assert.match(TPLLIB, /function newPaperBlocked\(\)/, 'the predicate');
    assert.match(TPLLIB, /function newPaperBlockLine\(\)/, 'the sentence');
    assert.match(TPLLIB, /function newPaperBlock\(\)/, 'the funnel');
    assert.match(TPLLIB, /\{ newPaperBlocked, newPaperBlockLine, newPaperBlock,/,
      'all three published — library.js reads them through window');
  });

  test('the funnel toasts a WARN, which is the kind that carries an action', () => {
    const b = strip(TPLLIB).match(/function newPaperBlock\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(b, /toast\(newPaperBlockLine\(\),'warn'/,
      "a bare toast prints nothing, and 'err' carries no action");
    assert.match(b, /action:\s*\{ label:i18t\('np_ask_team'\)/, 'the door is on the toast');
    assert.match(b, /setView\('intake'\)/,
      'and it is the door that already exists — Requests, not a second one');
    assert.match(b, /return true/, 'the caller stops');
  });

  test('every door into the builder asks it', () => {
    const s = strip(TPLLIB);
    assert.ok((s.match(/if\(newPaperBlock\(\)\) return/g) || []).length >= 4,
      'the three named doors plus the create modal');
    assert.match(s, /function tplLibCreateModal\(\) \{\s*\n?\s*if\(newPaperBlock\(\)\) return;/,
      'minting a template asks first');
  });

  test('the drawn doors GREY with the reason, never hide', () => {
    assert.match(TPLLIB, /newPaperBlocked\(\)\?` disabled title="\$\{esc\(newPaperBlockLine\(\)\)\}"`/,
      'the Templates page button');
    assert.match(LIB, /newPaperBlocked\(\)\)\?` disabled title="\$\{esc\(i18t\('np_refused'\)\)/,
      'the Templates table button');
    assert.match(LIB, /cursor:not-allowed/, 'and the refused tile says so');
    assert.match(LIB, /cursor:pointer;'\}display:flex/, 'while a live tile still looks pressable');
  });

  test('the counterparty tile is NOT refused', () => {
    /* A WALL. The rule names writing our own paper; saving theirs is
       importing. If this ever starts refusing, the owner's own note on the
       row — "uploads received paper" — has stopped being true. */
    const at = LIB.indexOf("opt('tn-cp'");
    assert.ok(at > 0, 'the tile is drawn');
    const call = LIB.slice(at, LIB.indexOf('\n', at));
    assert.ok(!/_npBlocked/.test(call), 'and it carries no refusal');
  });
});

describe('f331 (6) — the words are in both books', () => {
  test('every key is written twice', () => {
    for (const k of ['st_paper_on', 'st_paper_off', 'st_paper_note', 'st_paper_admin',
      'np_refused', 'np_refused_ask', 'np_ask_team'])
      assert.strictEqual((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2,
        k + ' is in English and Swedish — a key in one book leaves a screen half-English');
  });

  test('the note says what is STILL open, and names the team', () => {
    const en = I18N.match(/st_paper_note: '([^']*)'/)[1];
    for (const w of ['approved template', 'uploads received paper', 'negotiates', 'contracts team'])
      assert.ok(en.includes(w), 'the note keeps "' + w + '"');
    assert.ok(en.startsWith('Off by default'), "and it opens on the owner's own words");
  });
});

/* ============================================================
   UPGRADE 3 — THE BUILDER HELPS WITH WORDING THAT IS ALREADY THERE
   ============================================================
   The build plan's third upgrade, and MEASURED first rather than built from
   the plan's own description: most of it was already here by 18 September.
   copilotPropose is shown the section's own wording as `passage`, the answer
   card draws it against what is there through redlineOps, and the four
   refinement chips are drawn only where a section is written.

   WHAT WAS ACTUALLY MISSING was one guard and one sentence:
     - `if (lib && !txt)` — your own standard wording was offered ONLY to an
       empty section, which is the less useful half and the rarer one;
     - `tb_greet`, which asks what a section SHOULD say, was put to sections
       that already said something.

   NOT BUILT, and named so nobody assumes otherwise: the plan drew a "Show me
   the difference" control. The card already draws the difference by default,
   so that control would be a second door onto something already on the
   screen — the cheapest channel that carries the fact is the one already
   carrying it. */
const TB = read('js/views/templatebuilder.js');

describe('f331 (7) — your own wording, over wording that exists', () => {
  test('the chip is no longer guarded on an empty section', () => {
    const chips = strip(TB).match(/function tbChipsRowHtml\(\)[\s\S]*?\n\}/)[0];
    assert.ok(!/if \(lib && !txt\)/.test(chips),
      'the `!txt` guard WAS the gap — its absence is the claim');
    assert.match(chips, /if \(lib && tbLibraryOffers\(sec, lib\)\)/,
      'and what replaced it is a reading about the library, not about emptiness');
  });

  test('the label stays one word for one act; the hover carries the difference', () => {
    const chips = strip(TB).match(/function tbChipsRowHtml\(\)[\s\S]*?\n\}/)[0];
    assert.match(chips, /i18t\(txt \? 'tb_pb_lib_over' : 'tb_pb_no_read'\)/,
      'the title changes with the section');
    assert.match(chips, /i18t\('tb_pb_use_ours', \{ name: esc\(lib\.name\) \}\)/,
      'and the label does not — one act, one word');
  });

  test('a verb that cannot work is not drawn, and the act refuses too', () => {
    assert.match(TB, /function tbLibraryOffers\(sec, lib\)/, 'one reading');
    const b = strip(TB).match(/function tbLibraryOffers\(sec, lib\) \{[\s\S]*?\n\}/)[0];
    assert.match(b, /replace\(\/\\s\+\/g, ' '\).*toLowerCase\(\)/,
      'compared on words — a trailing space is not a proposal');
    assert.match(b, /w !== fold\(tbSectionText\(sec\)\)/, 'identical wording offers nothing');
    const use = strip(TB).match(/function tbUseLibrary\(k\) \{[\s\S]*?\n\}/)[0];
    assert.match(use, /if \(!tbLibraryOffers\(sec, lib\)\)/,
      'the press asks the same reading — the sign and the wall cannot disagree');
    assert.match(use, /toast\(i18t\('tb_pb_lib_same'\), 'warn'\)/, 'and speaks rather than doing nothing');
  });

  test('it still arrives as a card, and Apply is still the only writer', () => {
    const use = strip(TB).match(/function tbUseLibrary\(k\) \{[\s\S]*?\n\}/)[0];
    assert.match(use, /before: tbSectionText\(sec\)/,
      'the section’s own words ride along, so the card is a change rather than a paste');
    assert.ok(!/tbAccept|_tb\.blocks\[/.test(use),
      'and nothing here writes — swapping over somebody’s drafting is never one press');
  });

  test('a written section is told what can be done TO it', () => {
    assert.match(TB, /i18t\(tbSectionText\(sec\) \? 'tb_greet_written' : 'tb_greet'/,
      'three openings: the walk question, the written greeting, the empty one');
  });

  test('the new words are in both books', () => {
    for (const k of ['tb_pb_lib_over', 'tb_pb_lib_same', 'tb_greet_written'])
      assert.strictEqual((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });

  test('the reading is published', () => {
    assert.match(TB, /tbLibraryFor, tbLibraryOffers,/, 'f232: an unpublished name is unreachable');
  });
});

/* ============================================================
   UPGRADE 1 — A REAL CONTRACT, NOT AN OUTLINE
   ============================================================
   MEASURED before a line moved: every one of HaTi's twelve built-in templates
   produced EXACTLY FOUR CLAUSES. A supply agreement worth thirty-six million
   shillings said what was supplied, what it cost, when it could be rejected
   and which law governed it, and then it stopped.

   THE ONE THING THAT COULD HAVE GONE WRONG QUIETLY is the renumber. About
   thirty hand-written risk findings point at `c1`…`c4`, and those WERE the
   printed clause numbers — insert nine clauses in the middle and every finding
   lands on a different paragraph, as slightly odd advice rather than as an
   error. The fix is that a clause's ADDRESS is no longer its POSITION, so not
   one finding had to be re-pointed.

   WHAT IS MEASURED IN A BROWSER INSTEAD: nothing here needs pixels. Every
   claim below is about what the renderer produces, and the renderer is a
   string builder — so this file renders all twelve and reads them. */
const vmx = require('node:vm');
const { JSDOM } = require('jsdom');
const CONTRACT = read('js/views/contract.js');
const KINDS = ['RM','PK','CM','EQ','WH','FF','DA','RL','MK','ND','LE','PS'];

function paperStage(market) {
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window; win.window = win;
  Object.assign(win, {
    FIRST_PARTY: 'Test Company Ltd', PORTAL_MODE: false, canEdit: () => true,
    isUpload: () => false, openFindings: () => [], SEV_RANK: { high: 3, med: 2, low: 1 },
    /* A REAL STORE, because jxSet WRITES the chosen market and jx() reads it
       back: with no-op accessors the pack switch reports true and the paper
       goes on naming the default market. Found by this very claim. */
    lsGet: k => { try { return JSON.parse(win.localStorage.getItem(k)); } catch (_) { return null; } },
    lsSet: (k, v) => { try { win.localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
    icon: () => '',
    esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    TEMPLATES: KINDS.reduce((a, k) => (a[k] = { kind: k + ' agreement', name: k, folder: 'proc', valueType: 'standard' }, a), {}),
    state: { settings: {} }, fmtDocDate: s => s || '', fmtDocAmount: n => String(n),
    fieldDisplayValue: v => v, isMonetary: () => true,
  });
  const ctx = dom.getInternalVMContext();
  for (const rel of ['js/i18n.js', 'js/jurisdiction.js', 'js/playbook.js', 'js/views/contract.js']) {
    try { vmx.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); } catch (_) {}
  }
  if (market) assert.equal(win.jxSet(market), true, 'the ' + market + ' pack exists');
  return win;
}
const paperOf = (win, tid) => win.docBody({
  id: 'MK-X', name: 'X', template: tid, status: 'Draft',
  fields: { effDate: '2025-07-01' }, expiry: '2027-06-30',
  counterparty: 'Nandi Dairy', value: 36000000, valueType: 'fixed',
  metadata: {}, audit: [], signatures: [],
});
const clausesOf = html => [...html.matchAll(/font-size:1\.05em">(\d+)\. ([^<]*)</g)].map(m => [Number(m[1]), m[2]]);
const anchorsOf = html => [...html.matchAll(/data-anchor="([^"]+)"/g)].map(m => m[1]).filter(a => /^(c\d|s-)/.test(a));

describe('f331 (8) — an anchor is an identity, not a position', () => {
  test('the renderer takes a key, and the flag sweep reads it', () => {
    assert.match(CONTRACT, /const clause=\(n,title,body,key\)=>\{\s*\n\s*const a=key\|\|\('c'\+n\);/,
      'the key defaults to the number, so nothing that passes three arguments changed');
    assert.match(CONTRACT, /const p=flags\[a\]\?FLAGPAL\[flags\[a\]\.sev\]:null;/,
      'flags are keyed on the ADDRESS');
    assert.match(CONTRACT, /data-anchor="\$\{a\}"/, 'and so is the element');
  });

  test('the flag sweep keeps every anchor a clause can carry', () => {
    assert.match(CONTRACT, /\^\(c\\d\+\|s-\[a-z\]\+\)\$/,
      'the template’s own four and the nine shared; a recital flag is still not a clause flag');
  });

  test('the twelve builders return descriptors, never rendered html', () => {
    const at = CONTRACT.indexOf('const BUILD = {');
    const end = CONTRACT.indexOf('const built=(BUILD[c.template]||BUILD.ND)();');
    assert.ok(at > 0 && end > at, 'the region reads');
    const region = CONTRACT.slice(at, end);
    assert.strictEqual((region.match(/\{key:'c[1-4]', title:/g) || []).length, 48,
      'twelve templates, four own clauses each');
    assert.ok(!/clause\(\d,/.test(region),
      'and not one of them still numbers itself — the assembler does that');
  });
});

describe('f331 (9) — every template is a contract now', () => {
  const win = paperStage();

  test('all twelve render, numbered 1..n with no gaps and no repeats', () => {
    for (const tid of KINDS) {
      const html = paperOf(win, tid);
      const cl = clausesOf(html);
      assert.ok(cl.length >= 11, tid + ' draws at least eleven clauses (was four)');
      assert.deepStrictEqual(cl.map(x => x[0]), cl.map((_, i) => i + 1), tid + ' numbers run 1..n');
    }
  });

  test('every clause has its own address, and c1..c4 survive the renumber', () => {
    for (const tid of KINDS) {
      const a = anchorsOf(paperOf(win, tid));
      assert.strictEqual(new Set(a).size, a.length, tid + ' has no two clauses at one address');
      for (const k of ['c1', 'c2', 'c3', 'c4'])
        assert.ok(a.includes(k), tid + ' keeps ' + k + ' — the findings point at it');
    }
  });

  test("the template's own last clause is still last", () => {
    for (const tid of KINDS) {
      const a = anchorsOf(paperOf(win, tid));
      assert.strictEqual(a[a.length - 1], 'c4',
        tid + ': governing law at the end, never Governing Law at 4 and Termination at 8');
      assert.deepStrictEqual(a.slice(0, 3), ['c1', 'c2', 'c3'], tid + ': the lead three do not move');
    }
  });

  test('nothing is said twice', () => {
    /* The skip sets are the claim: a template whose own clauses allocate
       liability does not also draw the shared cap, and so on. */
    const shared = {
      CM: 's-liab', WH: 's-liab', FF: 's-liab', PS: 's-liab',
      MK: 's-conf', ND: 's-conf', DA: 's-end',
      EQ: 's-term', LE: 's-term',
    };
    for (const [tid, key] of Object.entries(shared))
      assert.ok(!anchorsOf(paperOf(win, tid)).includes(key),
        tid + " already governs " + key + " in its own clauses");
    assert.ok(anchorsOf(paperOf(win, 'RM')).includes('s-liab'), 'and RM, which does not, draws it');
  });

  test('the term is stated once, in a clause, on every template', () => {
    for (const tid of KINDS) {
      const txt = paperOf(win, tid).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      assert.ok((txt.match(/The term /g) || []).length <= 1,
        tid + ': the recital no longer repeats what a clause says');
    }
    assert.ok(anchorsOf(paperOf(win, 'RM')).includes('s-term'), 'RM gains a term clause');
    assert.match(CONTRACT, /const recital=built\.recital;/, 'and the recital appends nothing');
  });

  test('the term skip is read off DOC_TERM_IN_CLAUSE, not written twice', () => {
    assert.match(CONTRACT, /const docSharedSkip = tk => new Set\(\[\.\.\.\(DOC_SHARED_SKIP\[tk\]\|\|\[\]\),\s*\n?\s*\.\.\.\(DOC_TERM_IN_CLAUSE\[tk\] \? \['s-term'\] : \[\]\)\]\)/,
      'one statement of which templates carry their own term');
    const skip = CONTRACT.match(/const DOC_SHARED_SKIP = \{[\s\S]*?\n\};/)[0];
    assert.ok(!/s-term/.test(skip), 'so the hand-written list carries none');
  });
});

describe('f331 (10) — four of the nine are the workspace’s own', () => {
  test('they are READ from the clause library, not written again', () => {
    for (const [key, id] of [['s-end', 'cl-term'], ['s-liab', 'cl-liab'], ['s-conf', 'cl-conf'], ['s-dp', 'cl-dp']]) {
      const at = CONTRACT.indexOf(`'${key}':`);
      assert.ok(at > 0, key + ' is worded');
      assert.ok(CONTRACT.slice(at, at + 200).includes(`docLibWording('${id}'`),
        key + " comes from the library's " + id);
    }
  });

  test('and each carries its own fallback, because the library is not on every stage', () => {
    const b = strip(CONTRACT).match(/function docLibWording\(id, fallback\)\{[\s\S]*?\n\}/)[0];
    assert.match(b, /typeof clauseLibrary==='function'/, 'guarded');
    assert.match(b, /return fallback;/,
      'a placeholder that draws for a year is this codebase’s own most expensive silent failure');
  });

  test('a workspace that edits its own wording sees it in tomorrow’s paper', () => {
    const win = paperStage();
    win.state.settings.clauseLibrary = [{ id: 'cl-conf', category: 'Confidentiality',
      preferred: 'BESPOKE CONFIDENTIALITY WORDING FOR THIS WORKSPACE.' }];
    assert.ok(paperOf(win, 'RM').includes('BESPOKE CONFIDENTIALITY WORDING'),
      'the library is the source, so the playbook pass on a fresh draft comes back aligned by construction');
  });
});

describe('f331 (11) — and a Swedish workspace gets Swedish law', () => {
  test('the data-protection clause reads the market pack', () => {
    const sv = paperStage('sweden');
    const txt = paperOf(sv, 'RM').replace(/<[^>]+>/g, ' ');
    assert.ok(/GDPR/.test(txt), 'a Swedish contract cites the GDPR');
    assert.ok(!/Data Protection Act|ODPC/.test(txt),
      'and not a Kenyan statute — upgrade 1 PRINTS this wording, where it used to be guidance a lawyer read');
    const ke = paperStage('kenya');
    assert.ok(/Data Protection Act/.test(paperOf(ke, 'RM').replace(/<[^>]+>/g, ' ')),
      'and a Kenyan one still cites the Act');
  });

  test('cl-dp is a getter now, like cl-law beside it', () => {
    const PB = read('js/playbook.js');
    const at = PB.indexOf("{ id:'cl-dp'");
    const row = PB.slice(at, PB.indexOf("{ id:'cl-term'"));
    assert.match(row, /get preferred\(\)/, 'an object literal freezes load-time language');
    assert.match(row, /get fallback\(\)/);
    assert.match(row, /get guidance\(\)/);
    assert.ok(!/Data Protection Act, 2019|ODPC/.test(row), 'and names no market of its own');
  });

  test('no shared clause names a market except through the pack', () => {
    const at = CONTRACT.indexOf('const SHARED_BODY = {');
    const body = CONTRACT.slice(at, CONTRACT.indexOf('const built=(BUILD', at));
    assert.ok(!/Kenya|Nairobi|KEBS|\bKRA\b|\bKES\b/.test(body),
      'the market speaks through ${MKT} and the library, never through the drafting');
  });
});

/* ============================================================
   UPGRADE 2 — THE PAPER BESIDE THE QUESTIONS
   ============================================================
   Both routes into a contract ended on a two-column grid of boxes and a Create
   button, and only after the press did the agreement appear.

   IT IS A SMALL BUILD BECAUSE THE PARTS EXIST AND ARE ALREADY PURE:
   applyTemplateValues fills a built-in template's blanks onto a record and
   fillTemplateBody fills a saved template's placeholders. Each create path
   calls one of them and then does its side effects. The preview calls the SAME
   function and stops before them, so what is drawn is what the press would
   make — never a second renderer's opinion of it, which is the
   two-screens-disagreeing fault this codebase pays for most.

   WHAT IS MEASURED IN A BROWSER INSTEAD: that the two columns really sit side
   by side and the contract is readable in the right one. jsdom resolves no
   layout, so this file proves the CONTRACT, not the pixels. */
const TF = read('js/templatefields.js');
const WIZ = read('js/wizard.js');
const CT = read('js/views/contract.js');

describe('f331 (12) — one preview builder, two doors', () => {
  test('it is built from the same two functions the create path uses', () => {
    const b = strip(TF).match(/function fillPreviewContract\(kind, o\)\{[\s\S]*?\n\}/)[0];
    assert.match(b, /fillTemplateBody\(templateBody\(t\), o\.values \|\| \{\}, fmt\)/,
      'the saved-template half');
    assert.match(b, /applyTemplateValues\(base, o\.vars \|\| \[\], o\.values \|\| \{\}\)/,
      'the built-in half');
  });

  test('the paper goes through the product’s ONE document renderer', () => {
    const b = strip(TF).match(/function fillPreviewHtml\(kind, o\)\{[\s\S]*?\n\}/)[0];
    assert.match(b, /docBody\(c\)/, 'docBody, the same function that draws it after Create');
    assert.match(b, /typeof docBody === 'function'/, 'guarded — not every stage loads contract.js');
  });

  test('the throwaway contract never reaches anything', () => {
    const b = strip(TF).match(/function fillPreviewContract\(kind, o\)\{[\s\S]*?\n\}/)[0];
    for (const bad of ['nextId(', 'persist(', 'state.contracts', 'contractOwnerStamp', 'contractArrived', 'roomOpenOnTerms'])
      assert.ok(!b.includes(bad), 'the preview never calls ' + bad);
    assert.match(b, /_preview:true/, 'and it says what it is');
  });

  test('a real contract comes out of it', () => {
    /* Its own stage, with js/templatefields.js on it beside contract.js —
       the preview is only honest if the renderer under it is the real one. */
    const dom = new JSDOM('<!doctype html><html><body><div id="tf-preview"></div></body></html>',
      { runScripts: 'outside-only', url: 'https://hati.test/' });
    const w = dom.window; w.window = w;
    Object.assign(w, {
      FIRST_PARTY: 'Test Company Ltd', PORTAL_MODE: false, canEdit: () => true,
      isUpload: () => false, openFindings: () => [], SEV_RANK: { high: 3, med: 2, low: 1 },
      lsGet: () => null, lsSet: () => {}, icon: () => '', FIELD_LIB: {}, FOLDERS: { proc: { name: 'P' } },
      esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
      TEMPLATES: { RM: { kind: 'Raw material supply', name: 'Raw Material Supply', folder: 'proc', valueType: 'standard' } },
      state: { settings: {} }, fmtDocDate: s => s || '', fmtDocAmount: n => String(n),
      fieldDisplayValue: v => v, isMonetary: () => true,
    });
    const ctx = dom.getInternalVMContext();
    for (const rel of ['js/i18n.js', 'js/jurisdiction.js', 'js/playbook.js', 'js/views/contract.js', 'js/templatefields.js'])
      try { vmx.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); } catch (_) {}
    const vars = [{ key: 'counterparty', label: 'Counterparty', maps: 'counterparty' },
      { key: 'material', label: 'Material supplied' }];
    const html = w.fillPreviewHtml('builtin', { tid: 'RM', vars, values: { counterparty: 'Nandi Dairy', material: 'raw milk' } });
    assert.ok(html.includes('Nandi Dairy'), 'it names the counterparty as you type it');
    assert.ok(clausesOf(html).length >= 11, 'and draws the whole agreement, not an extract');
    assert.ok(/data-field="|data-sync="/.test(html), 'carrying the paper’s own blanks, so the link can find them');
    const c = w.fillPreviewContract('builtin', { tid: 'RM', vars, values: {} });
    assert.strictEqual(c.id, '', 'the throwaway has no id');
  });
});

describe('f331 (13) — the link, and the room to draw it', () => {
  test('a cursor in a box lights the word, and never takes the caret', () => {
    const b = strip(TF).match(/function fillPreviewLight\(key\)\{[\s\S]*?\n\}/)[0];
    assert.match(b, /classList\.add\('is-fieldlit'\)/,
      "the product's own class, so the dialog and the Document tab cannot drift");
    assert.ok(!/\.focus\(/.test(b), 'the reader is typing — the paper never steals the caret');
    assert.match(b, /block:'nearest'/, 'a word already on screen does not move the page');
    const w = strip(TF).match(/function fillPreviewWire\(root, kind, read\)\{[\s\S]*?\n\}/)[0];
    assert.match(w, /addEventListener\('focusin'/, 'bound on the dialog, once');
    assert.match(w, /addEventListener\('input'/, 'and it redraws as you type');
  });

  test('the repaint is coalesced and keeps the lit word', () => {
    const b = strip(TF).match(/function fillPreviewPaint\(kind, read\)\{[\s\S]*?\n\}/)[0];
    assert.match(b, /clearTimeout\(_fillPaintTimer\)/, 'one paint per frame, not twelve');
    assert.match(b, /if\(lit\) fillPreviewLight\(lit\)/,
      'the paper is rebuilt, so the lit word is a new element every time');
  });

  /* ---- THE PAPER IS READ, NOT FILLED IN, AND NOTHING COVERS IT (Young ruled
     it 18 Sep 2026: "the page on the right needs to scroll") ----
     The blanks in this column answer nothing — the contract has no id and
     nothing persists it — so they were first covered with `inert` and
     pointer-events:none. That also stopped the reader scrolling the column: a
     subtree the browser will not hit-test takes no wheel and no scrollbar drag
     either. MEASURED at the parent, 1,758px of agreement in a 320px box and a
     real wheel moving it 0px.
     It is answered where the box is DRAWN instead — and with `readonly` rather
     than `disabled`, which is the whole screen: .field:disabled deliberately
     dresses a locked blank as plain settled text (solid rule, body ink, no
     wash), which is right on the counterparty's copy and wrong here, where the
     blanks ARE what the reader is answering and the one under their caret is
     lit. MEASURED both ways: readonly leaves the blank rgb(17,94,89) on
     rgb(204,251,241) with a dashed rule, byte for byte what it was. */
  test('the preview\'s blanks are readonly and out of the tab order, never disabled', () => {
    /* THE REGION, NEVER A BYTE COUNT — this file has paid for that twice
       already. `const dis=` appears exactly once in the file and is the end of
       the reading; anchoring on the two statements means a longer note between
       them costs no test edit. */
    assert.equal((CT.match(/const dis=/g) || []).length, 1, 'one place decides it');
    const fn = /const locked=c\.status==='Signed'[\s\S]*?const dis=[^\n]*\n/.exec(CT);
    assert.ok(fn, 'docBody still decides once whether a blank is live');
    assert.match(fn[0], /c\._preview===true\?'readonly tabindex="-1"'/,
      'a preview\'s blanks are readonly and unreachable by Tab');
    assert.ok(!/_preview[^\n]*\|\|/.test(fn[0]) && !/\|\|c\._preview/.test(fn[0]),
      'and NOT folded into `locked` — that would dress them as settled text');
    /* The flag is set in exactly one place and read in exactly one place, so
       there is no chance of a live screen inheriting a preview's answer. */
    assert.equal((TF.match(/_preview\s*:\s*true/g) || []).length, 1,
      'fillPreviewContract is the only thing that sets it');
    assert.equal((strip(CT).match(/\bc\._preview\b/g) || []).length, 1,
      'docBody is the only thing that reads it');
  });

  test('nothing covers the preview column any more', () => {
    const pane = /function fillPreviewPaneHtml\(n\)\{[\s\S]*?\n\}/.exec(TF);
    assert.ok(pane, 'the pane is still one builder for both doors');
    const markup = pane[0].replace(/\$\{''\/\*[\s\S]*?\*\/\}/g, '');
    assert.ok(!/\binert\b/.test(markup), 'no inert attribute on the column');
    assert.ok(!/pointer-events\s*:\s*none/.test(markup), 'and no pointer-events:none');
    assert.match(markup, /overflow:auto/, 'it is still a scroller');
    assert.match(markup, /user-select:text/, 'and its wording can still be selected and copied');
  });

  test('under the width it is byte-identical to what it was', () => {
    assert.match(TF, /const FILL_PREVIEW_MIN_W = 1000;/, 'one number');
    assert.match(TF, /window\.innerWidth\|\|0\) >= FILL_PREVIEW_MIN_W/, 'measured, not guessed');
    for (const [name, src] of [['the saved-template fill', LIB], ['the wizard', WIZ]]) {
      assert.match(src, /const _pv = \(typeof fillPreviewFits==='function'\) && fillPreviewFits\(\);/,
        name + ' asks it');
      assert.ok(/_pv\?fillPreviewPaneHtml\(/.test(src), name + ' draws the pane only where it fits');
      assert.ok(/maxWidth:_pv\?'1040px':'620px'|_pv\?\{maxWidth:'1040px'\}:undefined/.test(src),
        name + ' widens the frame only where it fits');
    }
  });

  test('the questions did not change', () => {
    /* THE POINT OF THE UPGRADE. Every box, its order, its required star and
       all three acts are what they were; only the layout around them moved. */
    for (const id of ['tf-party', 'tf-cpemail', 'tf-folder', 'tf-cancel', 'tf-skip', 'tf-create'])
      assert.ok(LIB.includes(id), 'the saved-template screen keeps ' + id);
    for (const id of ['wz-cpemail', 'wz-back', 'wz-cancel', 'wz-skip', 'wz-create'])
      assert.ok(WIZ.includes(id), 'the wizard keeps ' + id);
  });

  test('the caption says what it is and counts what is open', () => {
    assert.match(TF, /i18t\('tf_preview_cap'\)/, 'a caption, not a band');
    assert.match(TF, /i18tn\('tf_preview_left', n, \{ n \}\)/, 'and the one fact a half-filled paper wants');
    for (const k of ['tf_preview_cap', 'tf_preview_left_one', 'tf_preview_left_other'])
      assert.strictEqual((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k + ' is in both books');
  });

  test('every preview name is published', () => {
    assert.match(TF, /Object\.assign\(window,\{FILL_PREVIEW_MIN_W,fillPreviewFits,fillPreviewContract,fillPreviewHtml,/,
      'f232: an unpublished name is unreachable from another module');
  });
});
