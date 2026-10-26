'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f804 — JAMBO'S PANEL BESIDE THE LISTS (owner's yes, 18 Oct 2026: "build all
   the gaps"; rounds 14, 15, 16, 19 and 20 of the redesign draw it beside every
   list; js/views/inspector.js jlFrame)

   (1) THE CLOTHES FOLLOW THE BUILDER: the page's list panel (#ins-panel) is
       dressed as Jambo's — a head with his face, his count and a word for
       what it holds, "‹ Jambo" while it holds a row, "›" to fold it — while
       the room's own panels (the contract's Obligations tab, Our standards')
       are not. The frame is built once: the words typed in the box survive a
       row press.
   (2) NOTHING CHOSEN, JAMBO'S OWN WORDS: "‹ Jambo" lets the row go; the page
       is said in words from the page's own counts with "no Jambo call" under
       it and the page's own doors as chips; a page may arrive with nothing
       chosen (insPick {none}).
   (3) THE ASK: one reading, the Counter's — a place word opens its page, a
       word that needs one contract takes the row the panel holds, the map's
       "which did you mean?" is said in the panel, anything else is a question
       for Jambo said in the panel (aiAskWords); the cost rides the hover.
   (4) WHAT JAMBO READ as drawn: the four readings in the drawing's order,
       a full dot where read, the words only where they say something.
   (5) WHERE IT STANDS: the window's right edge, Home's panel's width (380),
       the page beside it narrowed by it; a panel in a hidden tab takes no
       room; the width the inspector measures is the page plus the panel.
   (6) The words in both books; the Brain names the ask.

   AT THE PARENT (8dc306a) every claim here FAILS: there is no jlFrame, no
   ask box, no words state, no jl_* key.
   The browser half: test/chromium/jambos-list-panel-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const INS = read('js/views/inspector.js');
const HTML = read('index.html');
const I18N = read('js/i18n.js');
const BRAIN = read('js/brainmap.js');
const fnOf = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };

function fixture(id, over = {}){
  return { id, name: `Agreement ${id}`, counterparty: 'Kabras Sugar', template: 'RM', status: 'Under Review', folder: 'proc',
    fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [], value: 1200000, lastAction: '01 Jul 2026', ...over };
}
function world(list){
  const w = buildWorld({ registerView: true });
  const { win } = w;
  win.state = Object.assign({}, win.state, { contracts: list, activeId: null, view: 'register' });
  win.getContract = id => list.find(c => c.id === id) || null;
  if (typeof win.contractOwnerName !== 'function') win.contractOwnerName = c => (c && c.owner && c.owner.name) || '';
  const calls = [];
  win.selectContract = id => calls.push(['open', id]);
  win.openWorkspace = id => calls.push(['open', id]);
  win.openRedlineWorkbench = id => calls.push(['nego', id]);
  if (typeof win.insForce === 'function') win.insForce(true);
  return { win, calls, $: s => win.document.querySelector(s), $$: s => [...win.document.querySelectorAll(s)] };
}
const evt = (win, type) => new win.Event(type, { bubbles: true, cancelable: true });

describe('f804 (1) the list panel is dressed as Jambo\'s, once, by the one builder', () => {
  const list = () => [fixture('MK-1', { name: 'Supply & Delivery', counterparty: 'Aleph Group' }), fixture('MK-2', { counterparty: 'Wasoko' })];
  test('1a a head with his tab, a word for what it holds, no duplicate back button, the fold, and no hint line', () => {
    const b = world(list());
    b.win.renderRegister();
    const p = b.$('#ins-panel');
    assert.ok(p && p.classList.contains('is-jambo'), 'the panel wears Jambo\'s dress');
    assert.ok(p.querySelector('.jl-head [data-jl-home] .pd-tab-g'), 'his face\'s place on his tab');
    /* RE-POINTED 19 Oct 2026 — JAMBO AS A TAB YOU FLIP TO (owner: "the panel is
       the PAGE's; Jambo is a flip"): the tab is the landing, "Overview" */
    assert.equal(p.querySelector('.jl-head [data-jl-home] .pd-tab-w').textContent, 'Overview');
    /* RE-POINTED 26 Oct 2026 (owner: "the name of the page next to the Jambos which looks like an additional tab. These are to be deleted.") */
    assert.equal(p.querySelector('[data-jl-word]'), null, 'no word beside the tabs');
    /* RE-POINTED 24 Oct 2026 (Round 2, owner's yes): no "‹ Overview" beside the Overview tab; the tab is the way back */
    assert.equal(p.querySelector('[data-jl-back]'), null, 'no duplicate back button');
    assert.ok(p.querySelector('[data-jl-fold]'), 'the fold to the edge');
    assert.ok(p.querySelector('.jl-body .ins-h'), 'the chosen row\'s panel is in the body');
    assert.ok(p.querySelector('.jl-foot #jl-q') && p.querySelector('.jl-foot [data-jl-send]'), 'the ask box and its Ask at the foot');
    /* RE-POINTED 20 Oct 2026 (Chambers: no hint line under any Jambo box, f805) */
    assert.doesNotMatch(fnOf(INS, 'jlAskHtml'), /jamboHintHtml|jb-hint/, 'and no hint line under it');
    assert.equal(p.querySelector('.jl-foot .jb-hint'), null, 'none drawn either');
  });
  test('1b the frame is built once: a row press keeps the words typed in the box', () => {
    const b = world(list());
    b.win.renderRegister();
    const q = b.$('#jl-q'); q.value = 'half typed';
    b.$('#reg-tbody tr[data-row="MK-2"]').dispatchEvent(evt(b.win, 'click'));
    assert.equal(b.$('#ins-panel').getAttribute('data-ins-id'), 'MK-2');
    assert.equal(b.$('#jl-q'), q, 'the same box');
    assert.equal(b.$('#jl-q').value, 'half typed');
  });
  test('1c the room\'s own panels keep the plain inspector (a host other than #ins-panel)', () => {
    const f = code(fnOf(INS, 'insPaintPanel'));
    assert.match(f, /const jl = host\.id === 'ins-panel' && !opt\.plain;/);
    assert.match(f, /const body = jl \? jlFrame\(host, opt\) : host;/);
  });
});

describe('f804 (2) nothing chosen: the page in Jambo\'s words', () => {
  const list = () => [fixture('MK-1', { counterparty: 'Aleph Group' }), fixture('MK-2'), fixture('MK-3')];
  test('2a the Overview tab lets the row go: his words from the list\'s own count, "no Jambo call", no row lit', () => {
    const b = world(list());
    b.win.renderRegister();
    b.$('[data-jl-home]').dispatchEvent(evt(b.win, 'click'));
    const p = b.$('#ins-panel');
    assert.equal(p.getAttribute('data-ins-id'), null, 'nothing is held');
    assert.ok(p.querySelector('[data-jl-words] .jl-say .jl-bub'), 'he speaks');
    assert.match(p.querySelector('[data-jl-words]').textContent, /3 on this list/);
    assert.match(p.querySelector('.jl-src').textContent, /no Jambo call/);
    assert.equal(p.querySelector('[data-jl-back]'), null, 'no back button at all');
    assert.equal(b.$$('#reg-tbody tr.is-sel').length, 0, 'the row is let go');
    /* RE-PINNED (owner, 24 Oct 2026, ONE WINDOW): nothing chosen, his words are the conversation's first message —
       one window, no tabs to flip between */
    assert.ok(p.querySelector('.jl-talk[data-jt-talk] [data-jl-greet] [data-jl-words]'), 'his words lead the conversation');
    assert.equal(p.querySelector('.jl-talk').hidden, false, 'the conversation is the panel');
    assert.ok(p.classList.contains('is-solo'), 'one window');
  });
  test('2b let go stays let go through a repaint, until a row is pressed', () => {
    const b = world(list());
    b.win.renderRegister();
    b.$('[data-jl-home]').dispatchEvent(evt(b.win, 'click'));
    b.win.regRepaint();
    assert.equal(b.$('#ins-panel').getAttribute('data-ins-id'), null);
    b.$('#reg-tbody tr[data-row="MK-3"]').dispatchEvent(evt(b.win, 'click'));
    assert.equal(b.$('#ins-panel').getAttribute('data-ins-id'), 'MK-3');
  });
  test('2c a page may arrive with nothing chosen (round 16\'s "Your week"), and a row it lost lets it go', () => {
    const { win } = world(list());
    assert.equal(win.insPick('wk', ['a', 'b'], { none: true }), null, 'nothing on arrival');
    win.insSelect('wk', 'b');
    assert.equal(win.insPick('wk', ['a', 'b'], { none: true }), 'b');
    assert.equal(win.insPick('wk', ['a'], { none: true }), null, 'its row left the list: nothing again');
    assert.equal(win.insPick('plain', ['x', 'y']), 'x', 'every other page still arrives on its first row');
  });
  test('2d a page\'s own words and its own doors as chips — a press runs the door', () => {
    const b = world(list());
    let ran = 0;
    b.win.renderRegister();
    b.win.insPaintPanel(Object.assign({}, b.$('#ins-panel')._ins, { c: null, item: null,
      jlSay: () => ({ lines: ['<b>Seven</b> live.'], chips: [{ label: 'our move', run: () => { ran++; } }] }) }));
    const p = b.$('#ins-panel');
    assert.match(p.querySelector('.jl-bub').innerHTML, /<b>Seven<\/b> live\./);
    p.querySelector('[data-jl-chip="0"]').dispatchEvent(evt(b.win, 'click'));
    assert.equal(ran, 1);
  });
});

describe('f804 (3) the ask: the Counter\'s one reading, said in the panel', () => {
  test('3a a word for one contract takes the held row; then the one reader every box asks first; the map; the Board\'s free reading; then a question', () => {
    /* re-pointed (pass 4, check A1 #2): the ask now reads through main's
       caAskAnywhere; what the Board reads free is SAID IN THE PANEL since
       22 Oct 2026 (Part 8's question 3 = A) — the order is pinned, each step
       is driven in (8) */
    const f = code(fnOf(INS, 'jlAsk'));
    const at = s => f.indexOf(s);
    assert.ok(at('caReadPlace(t)') > 0 && at('caAskAnywhere(t)') > at('caReadPlace(t)') && at('jmRead(t)') > at('caAskAnywhere(t)')
      && at('jlBoardReads(t)') > at('jmRead(t)') && at('aiAskWords(t)') > at('jlBoardReads(t)'), 'held row, the one reader, the map, the Board, then the question');
    assert.match(f, /if \(a && a\.kind === 'go' && a\.missing\)\{\s*const held = jlHeldContract\(\);\s*if \(held\)\{\s*a\.cid = held\.id; a\.missing = false;/, 'the held row is the open contract');
    /* a sentence's close match gives way to Jambo where he can answer (AI first, stage 3); a bare word keeps the card */
    assert.match(f, /if \(m && m\.kind === 'map'[^{]*\)\)\{ jlMapCard\(t, m\); return 'card'; \}/, '"which did you mean?" is said in the panel');
    /* RE-POINTED 19 Oct 2026 (JAMBO AS A TAB YOU FLIP TO): the row the panel
       holds stays held; the panel turns to the conversation, then asks */
    assert.match(f, /jlTalkOpen\(\);\s*if \(typeof aiAskWords === 'function'\)\{ aiAskWords\(t\); return 'model'; \}/, 'a question turns the panel to the conversation, then asks');
    assert.doesNotMatch(code(f), /jlToWords\(\)/, 'the row held is not let go');
  });
  test('3b the cost is said before the press, on the box and its button', () => {
    const f = fnOf(INS, 'jlAskHtml');
    assert.match(f, /title="\$\{esc\(cost\)\}"/);
    assert.match(I18N, /jl_ask_cost: 'A place or a task I know opens at once and costs nothing; anything else is a question for Jambo — one Jambo call\.'/);
  });
  test('3c the bar\'s Jambo door beside a list goes to the panel\'s box, not a window over it', () => {
    const AI = read('js/ai.js');
    /* re-pointed (pass 4, check A1 #2): only a box the reader can SEE is the
       panel's (jlOnScreen) — driven in (9) */
    assert.match(AI, /if\(typeof window\.jlOnScreen === 'function' && window\.jlOnScreen\(\)\) return 'list';/);
    assert.match(AI, /if\(here === 'list' && typeof window\.jlFocus === 'function'\) return !!window\.jlFocus\(prefill\);/);
  });
  test('3d "/" lists the places in the box, the Counter\'s list', () => {
    assert.match(code(fnOf(INS, 'jlPopRead')), /caSlashRows\(m\[1\]\.toLowerCase\(\), \{ max: 99 \}\)/);
  });
});

describe('f804 (4) What Jambo read, as drawn', () => {
  test('4a the drawing\'s order and words: The brief · Playbook pass · 1 departure · Risk scan · 2 risks · Obligations · not read yet', () => {
    const { win } = world([]);
    win.ktReadingsRows = () => [
      { k: 'brief', name: 'The brief', said: 'Written', state: 'yes' },
      { k: 'playbook', name: 'Playbook pass', said: '1 departure', state: 'look' },
      { k: 'oblig', name: 'Obligations', said: 'Not read yet', state: 'no' },
      { k: 'scan', name: 'Risk scan', said: '2 still open', state: 'yes' },
      { k: 'plain', name: 'Plain View', said: 'Ready', state: 'yes' }];
    win.openFindings = () => [{}, {}];
    const host = win.document.createElement('div'); host.innerHTML = win.jlReadsHtml({ id: 'X' });
    const rows = [...host.querySelectorAll('[data-jl-read]')];
    assert.deepEqual(rows.map(r => r.getAttribute('data-jl-read')), ['brief', 'playbook', 'scan', 'oblig'], 'four, in the drawing\'s order; Plain View is not drawn');
    assert.deepEqual(rows.map(r => r.textContent.trim()), ['The brief', 'Playbook pass · 1 departure', 'Risk scan · 2 risks', 'Obligations · not read yet']);
    assert.ok(rows[0].querySelector('.jl-dot.is-green') && rows[3].querySelector('.jl-dot:not(.is-green):not(.is-amber)'), 'a full dot where read, a ring where not');
  });
});

describe('f804 (5) where it stands', () => {
  test('5a the right edge, Home\'s panel\'s width, the page beside it narrowed — a hidden tab\'s panel takes nothing', () => {
    /* RE-POINTED 19 Oct 2026 (owner: "all the new jambo panels do not have a
       slider like in the redline page. They should all have one."): the
       panel's width and the page's margin are ONE value the divider writes,
       --jl-w — 384 since The Brief (21 Oct 2026), Home's panel's, where nobody has chosen. */
    assert.match(HTML, /#content \.ins-panel\.is-jambo\{position:fixed;right:0;top:var\(--jl-top,88px\);bottom:0;width:var\(--jl-w,384px\);/);
    assert.match(HTML, /#app-shell:has\(#content \.ins-panel\.is-jambo\):not\(:has\(#content \[hidden\] \.ins-panel\.is-jambo\)\) #content-scroll\{margin-right:var\(--jl-room,var\(--jl-w,384px\)\);\}/);
    assert.match(HTML, /#content :has\(> #ins-panel\.is-jambo\)\{grid-template-columns:minmax\(0,1fr\);column-gap:0;\}/);
    assert.match(read('js/views/intelligence.js'), /const IG_DOCK_W0 = 384,/, 'the same width as Home\'s panel');
    assert.match(code(INS), /const JL_W = 384, JL_FOLDED = 46;/);
  });
  test('5b the width the list measures is the page and the panel together, so the panel never takes itself away', () => {
    assert.match(code(fnOf(INS, 'insFits')), /const w = el \? el\.clientWidth \+ jlReserved\(\) : 0;/);
    assert.match(code(fnOf(INS, 'jlReserved')), /if \(typeof h\.closest === 'function' && h\.closest\('\[hidden\]'\)\) return 0;/);
  });
  test('5c folded: a strip with his face; the fold is the reader\'s, kept in this browser, read in a try', () => {
    assert.match(code(INS), /const JL_FOLD_KEY = 'hati\.v1\.jlFold';/);
    assert.match(code(fnOf(INS, 'jlFolded')), /try \{ _jlFold = localStorage\.getItem\(JL_FOLD_KEY\) === '1'; \} catch \(_\)\{ _jlFold = false; \}/);
    assert.match(HTML, /#content \.ins-panel\.is-jambo\.is-folded > :not\(\.jl-door\)\{display:none;\}/);
  });
});

describe('f804 (6) the words and the Brain', () => {
  test('6a every jl_ word is in both books', () => {
    const en = I18N.slice(I18N.indexOf('  en: {'), I18N.indexOf('  sv: {'));
    const sv = I18N.slice(I18N.indexOf('  sv: {'));
    const keys = [...new Set([...INS.matchAll(/i18tn?\('(jl_[a-z_]+)'/g)].map(m => m[1]))];
    assert.ok(keys.length > 5);
    const plural = new Set([...INS.matchAll(/i18tn\('(jl_[a-z_]+)'/g)].map(m => m[1]));
    for (const k of keys) for (const [n, book] of [['en', en], ['sv', sv]]){
      const ok = plural.has(k) ? book.includes('    ' + k + '_one:') && book.includes('    ' + k + '_other:') : book.includes('    ' + k + ':');
      assert.ok(ok, `${k} in ${n}`);
    }
  });
  test('6b the Brain names the panel\'s ask and walks it with the other asks', () => {
    assert.match(BRAIN, /\['listask', 'jlAsk', 'ai', 0\]/);
    assert.match(BRAIN, /\{ id: 'ask', steps: \[\['copilotask', 'jambomap', 'listask'/);
    assert.match(I18N, /brn_p_listask: 'Jambo\\'s panel beside the lists'/);
    assert.match(I18N, /brn_p_listask: 'Jambos panel bredvid listorna'/);
  });
});

/* ═══ PASS 3 (18 Oct 2026), the checker against round 19's Parties scene ═══
   (7) A ROW READS WHOLE IN THE 380px PANEL: what waits on you at a party says
       "Answer 2 redlines · Master services agreement · waiting 4 days · Open
       redlines" — the button a short door word (where it opens), the long
       sentence of where it lands on its hover; the "Waiting on you" fact runs
       across the panel and may wrap. Before this pass the long sentences
       ("Open it in Workspace, with the approval pack") squeezed the titles to
       "Your …" at every one of the owner's screens.
   AT THE PARENT (8dc306a) and before this pass (14b2f8a) these FAIL. */
describe('f804 (7) a party\'s rows read whole in Jambo\'s panel', () => {
  const vm = require('node:vm');
  const CU = read('js/views/customers.js');
  const BOOK = (() => { const en = {}; for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)) if (!(m[1] in en)) en[m[1]] = m[2]; return en; })();
  const stage = () => {
    const m = /const CU_NEED_DOOR = \{[\s\S]*?\};\nconst CU_NEED_LINE = new Set\(\[[^\]]*\]\);/.exec(CU);
    const ctx = { i18t: (k, v) => String(BOOK[k] || k).replace(/\{(\w+)\}/g, (_, n) => (v && v[n] != null ? v[n] : '')), _cuE: s => String(s), contractRef: c => c.id,
      INS_NEED_GO: { quiet: 'ins_need_go_nego', approval: 'ins_need_go_approval' },
      insNeedWords: (c, it) => ({ title: it.kind === 'approval' ? 'Your approval is asked for' : 'Answer 2 redlines', plain: it.kind === 'quiet' ? 'waiting 4 days' : '' }),
      cuNeedTitle: x => x.it.kind === 'approval' ? 'Your approval is asked for' : 'Answer 2 redlines' };
    ctx.regNegoCols = () => ({ waiting: '4 days' });
    vm.createContext(ctx); vm.runInContext((m ? m[0].replace(/const /g, 'var ') : '') + '\n' + fnOf(CU, 'cuPanelNeedsHtml'), ctx); return ctx;
  };
  test('7a a short door word on the button, the long landing on its hover; the agreement and its wait under the title', () => {
    const html = stage().cuPanelNeedsHtml([{ c: { id: 'MK-0382', name: 'Master services agreement' }, it: { kind: 'quiet' } },
      { c: { id: 'MK-0391', name: 'Power purchase agreement' }, it: { kind: 'approval' } }]);
    assert.match(html, /<b title="Answer 2 redlines">Answer 2 redlines<\/b><span title="[^"]*">Master services agreement · waiting 4 days<\/span>/);
    assert.match(html, /title="Opens the negotiation">Open redlines<\/button>/);
    assert.match(html, /title="Open it in Workspace, with the approval pack">Open approval<\/button>/);
    assert.match(html, /<span title="[^"]*">Power purchase agreement<\/span>/, 'a need with no when says only its agreement');
  });
  /* RE-POINTED 19 Oct 2026 (lane A2, check #1): "waiting 4 days" in lower
     case, as round 19 draws it after the agreement's name */
  test('7a2 our move in a negotiation says its wait, as the list does: "waiting 4 days"', () => {
    const html = stage().cuPanelNeedsHtml([{ c: { id: 'MK-0382', name: 'Master services agreement' }, it: { kind: 'move' } }]);
    assert.match(html, />Master services agreement · waiting 4 days<\/span>/);
    assert.match(html, />Open redlines<\/button>/);
  });
  test('7b every door word is short and in both books', () => {
    const m = /const CU_NEED_DOOR = \{([\s\S]*?)\};/.exec(CU);
    assert.ok(m, 'CU_NEED_DOOR');
    for (const k of new Set(Array.from(m[1].matchAll(/'([a-z_]+)'/g), x => x[1]).filter(x => /_/.test(x)))){
      assert.ok(BOOK[k] && BOOK[k].length <= 16, `${k}: "${BOOK[k]}" is a short word`);
      assert.ok(I18N.split(`${k}:`).length >= 3, `${k} in both books`);
    }
  });
  /* RE-POINTED 19 Oct 2026 (lane A2, round 19 as drawn): the party's facts are
     the drawing's five rows, the label on the left, a value that may wrap
     (insRowsHtml) — what waits on you is its own section, not a fact */
  test('7c the party\'s facts are rows that may wrap; what waits is its own section', () => {
    const p = fnOf(CU, 'cuPaintCustomerPanel');
    assert.match(p, /insRowsHtml\(\[/);
    assert.doesNotMatch(p, /k: 'waiting'/);
    assert.match(HTML, /\.jl-rows dd\{[^}]*overflow-wrap:anywhere;/);
  });
});

/* ═══ PASS 4 (18 Oct 2026, evening), the checker's second pass ═════════════
   (8) THE ASK READS THE WAY THE COUNTER'S DOES: main's one reader first
       (caAskAnywhere — a page word, a draft from a sentence, a send, a job, a
       booking), then the map's card, then what the Board's own reader answers
       free (a party's name, "contracts ending in 90 days") — SAID IN THE
       PANEL from that same reading since 22 Oct 2026 (Part 8's question 3 =
       A; was: handed to the Board, caHandHome) — never a Jambo call; only
       the rest is a question said in the panel.
   (9) THE BAR'S JAMBO DOOR NEVER LANDS IN A BOX NOBODY CAN SEE: a panel in a
       hidden tab (Our paper's Templates) is not on screen (jlOnScreen), so the
       window opens; a folded panel still is (its strip is his door).
   (10) THE HEAD SAYS WHAT IT HOLDS on every page: Obligations "Your week" /
       "Obligation", Requests "Request"; nothing chosen, the bar's own page name
       (deskPageName), never "Jambo · Jambo"; "Counted from the list" only
       under a count.
   (11) EVERY DOOR THE PANEL ADDED LANDS ON ITS ONE TARGET (main's LAND ON IT):
       one table, JL_LAND, through the one lander.
   AT THE PARENT (8dc306a) every claim FAILS: no caAskAnywhere call in jlAsk,
   no jlOnScreen, no jl_w_week / jl_w_request, no JL_LAND.
   ═══════════════════════════════════════════════════════════════════════════ */
describe('f804 (8) the ask reads the way the Counter\'s does', () => {
  const drive = (q, over = {}) => {
    const b = over.pre || world([fixture('MK-1')]);
    b.win.renderRegister();
    const got = [];
    b.win.caReadPlace = over.caReadPlace || (() => null);
    b.win.caAskAnywhere = over.caAskAnywhere || (() => false);
    b.win.jmRead = over.jmRead || (() => null);
    b.win.hbAskReadingOf = over.hbAskReadingOf || ((t, face) => ({ road: 'copilot', face }));
    b.win.caHandHome = (t, a) => { got.push(['home', t, a]); return true; };
    b.win.aiAskWords = t => { got.push(['model', t]); };
    b.win.caGo = a => { got.push(['go', a.place, a.cid]); return true; };
    b.win.caUnderstand = over.caUnderstand || (() => null);
    /* the one reader's own line (js/copilotacts.js caUnderstandSay is not on this stage) */
    if (typeof b.win.caUnderstandSay !== 'function') b.win.caUnderstandSay = u => b.win.i18t(u.kind === 'cpick' ? 'ca_cpick_title' : 'hb_no_ref', { ref: u.ref });
    b.win.hbAskFound = over.hbAskFound || (() => null);
    b.win.ai = { busy: !!over.busy, history: [] };
    b.win.aiPush = (role, m) => { got.push(['said', role, String(m.raw || m.text || '').replace(/<[^>]+>/g, '')]); b.win.ai.history.push(Object.assign({ role }, m)); };
    b.win.renderAIFeed = () => {};
    const toasts = []; b.win.toast = (msg, kind) => { toasts.push({ msg: String(msg), kind }); };
    const r = b.win.jlAsk(q);
    return { r, got, b, toasts };
  };
  test('8a a draft from a sentence goes to the one reader (the One sheet form), never a call', () => {
    const { r, got } = drive('draft an NDA with Kabras Sugar', { caAskAnywhere: t => /^draft /.test(t) });
    assert.equal(r, 'go');
    assert.ok(!got.some(g => g[0] === 'model'), JSON.stringify(got));
  });
  /* RE-POINTED 22 Oct 2026 (the owner's answer to Part 8's question 3: "A —
     Answer beside the list: Jambo answers in the panel on the right. You stay
     on Approvals … Jambo's own box beside the list works the same way").
     8b pinned the ruling this reverses: "what the Board reads free goes to
     the Board, as the Counter's box hands it" (caHandHome, the reader moved
     to Home). Now what that same reading finds is SAID IN THE PANEL — free,
     no model, no move — and the Board is a door only a press opens. */
  test('8b what the Board reads free is said in the panel from that same reading: no move, no call', () => {
    const seen = [];
    for (const q of ['Nandi Dairy', 'contracts ending in 90 days', 'which ones are waiting on us?']){
      const { r, got, b } = drive(q, { hbAskReadingOf: (t, face) => { seen.push(face); return { road: 'free', kind: 'dig', r: { act: 'dig', key: 'f:us' } }; },
        hbAskFound: A => (A && A.road === 'free' ? { ids: ['MK-1'], say: '1 negotiation is waiting for our reply.' } : null) });
      assert.equal(r, 'said', q);
      assert.deepEqual(got.map(g => g.slice(0, 2)), [['said', 'user'], ['said', 'assistant']], q);
      assert.equal(got[0][2], q, 'the question is the turn before');
      assert.equal(got[1][2], '1 negotiation is waiting for our reply.', 'the answer says what the reading found');
      const turn = b.win.ai.history[1];
      assert.match(String(turn.read && turn.read.text), /no Jambo call/, 'it says it read the book, free');
      assert.ok(!got.some(g => g[0] === 'home' || g[0] === 'model' || g[0] === 'go'), 'never handed to the Board, never a call');
    }
    assert.ok(seen.every(f => f === 'board'), 'read as on the Board\'s face, whatever Home last showed');
  });
  test('8b2 a question only the Board draws is said in the panel with its door; a Board act that is no question still goes there', () => {
    const pack = { hbAskReadingOf: () => ({ road: 'free', kind: 'pack', pack: 'risks', q: 'x' }) };
    const Q = drive('what are our biggest risks?', pack);
    assert.equal(Q.r, 'said');
    assert.ok(!Q.got.some(g => g[0] === 'home' || g[0] === 'model'), JSON.stringify(Q.got));
    assert.match(String(Q.b.win.ai.history[1].cards), /data-jl-board="what are our biggest risks\?"/, 'the door onto the Board, pressed by the reader');
    const A = drive('present', pack);
    assert.equal(A.r, 'board', 'a Board act is a door, as before');
    assert.deepEqual(A.got, [['home', 'present', null]]);
  });
  test('8b3 contracts asked to see with no place named are said in the panel, never a move to Contracts', () => {
    const { r, got } = drive('which Kabras Sugar contracts do we have?', {
      caUnderstand: () => ({ kind: 'go', place: 'contracts', narrow: { rest: 'x', what: 'Kabras Sugar', ids: ['MK-1'], n: 1, party: true }, here: true, state: 'ready' }),
      caAskAnywhere: () => { throw new Error('the one reader\'s move must not run'); } });
    assert.equal(r, 'said');
    assert.match(got[1][2], /^Contracts with Kabras Sugar: /);
    assert.ok(!got.some(g => g[0] === 'go' || g[0] === 'home' || g[0] === 'model'), JSON.stringify(got));
    /* a question naming a contract by a name two share: "which did you mean?" asked here */
    const P = drive('what about the Kabras deal?', { caUnderstand: () => ({ kind: 'cpick', picks: ['MK-1'], then: 'document', state: 'ready' }),
      caAskAnywhere: () => { throw new Error('the one reader\'s hand-off must not run'); } });
    assert.equal(P.r, 'said');
    assert.equal(P.got[1][2], 'Which contract did you mean?');
    assert.ok(!P.got.some(g => g[0] === 'go' || g[0] === 'home' || g[0] === 'model'), JSON.stringify(P.got));
  });
  /* RE-POINTED 22 Oct 2026 (owner: "fix the bug where Jambo drops questions
     while busy"; was "a Jambo still answering takes nothing: it says so"): the
     question waits its turn (jamboAskLater) and is asked here again once he is free */
  test('8b4 a Jambo still answering takes the question for later, asked here again', () => {
    const later = [];
    const hold = b => { b.win.jamboAskLater = (q, busy, run) => { later.push({ q, busy, run }); return true; }; };
    const one = (q, over) => { const b0 = world([fixture('MK-1')]); hold(b0); return drive(q, Object.assign({ pre: b0 }, over)); };
    const { r, got } = one('which ones are waiting on us?', { busy: true,
      hbAskReadingOf: () => ({ road: 'free', kind: 'dig', r: { act: 'dig', key: 'f:us' } }), hbAskFound: () => ({ ids: [], say: 'x' }) });
    assert.equal(r, 'later', 'the box lets the words go: they wait');
    assert.ok(!got.length, JSON.stringify(got));
    assert.equal(later.length, 1); assert.equal(later[0].q, 'which ones are waiting on us?');
    assert.equal(later[0].busy(), true, 'it waits on the same Jambo');
    const m = one('which clause worries you most?', { busy: true });
    assert.equal(m.r, 'later', 'a question for the model, too');
    assert.ok(!m.got.some(g => g[0] === 'model'));
    m.b.win.ai.busy = false; later[1].run(later[1].q);
    assert.ok(m.got.some(g => g[0] === 'model' && g[1] === 'which clause worries you most?'), 'free again, it is asked: ' + JSON.stringify(m.got));
  });
  test('8c a question nothing reads free is said in the panel: one call, the cost on the hover', () => {
    const { r, got } = drive('which clause worries you most?');
    assert.equal(r, 'model');
    assert.deepEqual(got, [['model', 'which clause worries you most?']]);
  });
  test('8d a booking the one reader sends to the Calendar says so', () => {
    const { r } = drive('book an hour with Sara on Friday', { caAskAnywhere: () => 'cal' });
    assert.equal(r, 'cal');
  });
  test('8e the Board\'s reader takes the face it reads on (hbAskReadingOf(q, onFace))', () => {
    const HB = read('js/views/homeboard.js');
    const f = code(fnOf(HB, 'hbAskReadingOf'));
    assert.match(f, /^function hbAskReadingOf\(qRaw, onFace\)\{/);
    assert.match(f, /const face = onFace \|\| s\.face;/);
    assert.doesNotMatch(f.replace('const face = onFace || s.face;', ''), /s\.face/, 'every face test reads the one face');
  });
});
describe('f804 (9) the bar\'s Jambo door never lands in a box nobody can see', () => {
  test('9a a panel in a hidden tab is not on screen; a shown one is; a folded one is', () => {
    const b = world([fixture('MK-1')]);
    b.win.renderRegister();
    const p = b.$('#ins-panel');
    /* jsdom draws no boxes: the test gives the panel its rects */
    p.getClientRects = () => [{}];
    assert.equal(b.win.jlOnScreen(), p, 'shown');
    p.classList.add('is-folded');
    assert.equal(b.win.jlOnScreen(), p, 'folded: his strip is still the door');
    p.classList.remove('is-folded');
    const hide = b.win.document.createElement('div'); hide.hidden = true;
    p.parentNode.insertBefore(hide, p); hide.appendChild(p);
    assert.equal(b.win.jlOnScreen(), null, 'inside a hidden tab: not on screen');
    hide.hidden = false; p.getClientRects = () => [];
    assert.equal(b.win.jlOnScreen(), null, 'no box drawn: not on screen');
  });
  test('9b the bar\'s door and every openAI(prefill) ask jlOnScreen; jlFocus focuses the shown box only', () => {
    const AI = code(read('js/ai.js'));
    assert.match(AI, /if\(typeof window\.jlOnScreen === 'function' && window\.jlOnScreen\(\)\) return 'list';/);
    const f = code(fnOf(INS, 'jlFocus'));
    assert.match(f, /const host = jlOnScreen\(\);/);
    assert.match(f, /const inp = host\.querySelector\('#jl-q'\)/);
  });
});
describe('f804 (10) the head says what it holds on every page', () => {
  const OB = read('js/obligations.js'), IK = read('js/views/intake.js');
  test('10a Obligations: "Your week" with nothing chosen, "Obligation" with a row chosen', () => {
    const f = code(fnOf(OB, 'obPaintPanel'));
    /* RE-POINTED 18 Oct 2026 (lane A4, round 16 as drawn): the page's panel
       options are one reading, obPanelJl — "Your week" with his own words
       (obYourWeekSay) and the week's ask box — and a row still says "Obligation" */
    assert.match(f, /const jl = ctx === 'page' \? Object\.assign\(\{ jlWord: i18t\('jl_w_obligation'\) \}, obPanelJl\(\)\) : \{\};/);
    assert.match(code(fnOf(OB, 'obPanelJl')), /jlHome: i18t\('jl_w_week'\), jlSay: obYourWeekSay, jlPh: i18t\('jl_ph_week'\)/);
    assert.match(f, /insPaintPanel\(Object\.assign\(\{ host: hostId, empty: emptyMsg \}, jl\)\)/);
    assert.match(f, /insPaintPanel\(Object\.assign\(\{ host: hostId \}, jl, opts\)\)/);
  });
  test('10b Requests: "Request"', () => {
    /* RE-POINTED 19 Oct 2026 (lane A3, round 20 as drawn): the panel also
       names its seat and Jambo's words with nothing chosen */
    assert.match(code(IK), /insPaintPanel\(Object\.assign\(\{ seat, jlWord:i18t\('jl_w_request'\), jlSay:ikJlSay\(openAll, asker, go\) \}, r\._adv\?ikAdvicePanelOpts\(r\):ikPanelOpts\(r, asker\)\)\)/);
  });
  test('10c the words, both books', () => {
    const books = I18N.split(/\n  sv: \{/);
    for (const [k, en, sv] of [['jl_w_week', 'Your week', 'Din vecka'], ['jl_w_obligation', 'Obligation', 'Åtagande'], ['jl_w_request', 'Request', 'Förfrågan']]){
      assert.ok(books[0].includes(`${k}: '${en}',`), k + ' en');
      assert.ok(books[1].includes(`${k}: '${sv}',`), k + ' sv');
    }
  });
  test('10d nothing chosen and no word of its own: the bar\'s page name, never his own twice', () => {
    const b = world([fixture('MK-1')]);
    b.win.deskPageName = () => 'Requests';
    assert.equal(b.win.jlPageWord(), 'Requests');
    assert.match(code(fnOf(INS, 'jlPageWord')), /deskPageName\(\)/);
  });
  test('10e "Counted from the list" only under a count', () => {
    const b = world([]);
    b.win.renderRegister();
    const host = b.win.document.createElement('div');
    host.innerHTML = b.win.jlWordsHtml({ empty: 'Choose an obligation to read it here.' });
    assert.equal(host.querySelector('.jl-bub').textContent, 'Choose an obligation to read it here.');
    assert.equal(host.querySelector('.jl-src'), null, 'nothing was counted, so nothing says it was');
  });
});
describe('f804 (11) every door the panel added lands on its one target', () => {
  test('11a one table, the one lander', () => {
    const f = code(fnOf(INS, 'jlLand'));
    assert.match(f, /landOn\(/);
    for (const k of ['row', 'first', 'redlines', 'sign', 'road', 'paper', 'list']) assert.match(code(INS), new RegExp(`\\b${k}: `), 'JL_LAND.' + k);
  });
  test('11b the doors call it: Negotiations\' Answer and chip, Approvals\' chip and Open Before you sign, People\'s rows and Show their contracts', () => {
    const REG = code(read('js/views/register.js')), AP = code(read('js/views/approvalsview.js')), DIR = code(read('js/views/directory.js'));
    assert.match(REG, /openRedlineWorkbench\(c\.id,\{ face:true \}\); if\(typeof jlLand==='function'\) jlLand\('redlines'\);/);
    assert.match(REG, /regRepaint\(\); if\(typeof jlLand==='function'\) jlLand\('first'\);/);
    assert.match(AP, /jlLand\('row', first\.c\.id\)/);
    assert.match(fnOf(AP, 'apOpenSigning'), /jlLand\(land==='road'\?'road':'sign'\)/);
    assert.match(fnOf(DIR, 'dirWaitGo'), /land\('redlines'\)/);
    assert.match(fnOf(DIR, 'dirShowContracts'), /jlLand\('list'\)/);
    assert.match(fnOf(DIR, 'dirOpenContract'), /jlLand\('paper'\)/);
  });
});
/* (12) THE FRAME AS DRAWN (rounds 14 and 15): the pill right after the party's
   name; the list's card ends after its last row, its foot right under the
   rows; on Approvals the white head, then the grey ground, then the card.
   Measured in a browser by jambos-list-panel-verify 10. */
describe('f804 (12) the frame as drawn', () => {
  test('12a the pill beside the name, not at the panel\'s far edge', () => {
    assert.match(HTML, /\.jl-h \.ins-cp \.jl-st-side\{margin-left:0;\}/);
  });
  test('12b beside Jambo\'s panel the list\'s card ends after its rows; a long list still scrolls inside it', () => {
    assert.match(HTML, /#content \.reg-body\.is-ins:has\(> #ins-panel\.is-jambo\),\s*#content \.ap-body\.is-ins:has\(> #ins-panel\.is-jambo\)\{align-items:start;\}/);
    assert.match(HTML, /#content \.reg-body\.is-ins:has\(> #ins-panel\.is-jambo\) > \.reg-card\{flex:none;max-height:100%;\}/);
    assert.match(HTML, /#content \.ap-body\.is-ins:has\(> #ins-panel\.is-jambo\) > \.ap-card\{max-height:100%;\}/);
    assert.match(HTML, /#content \.ap-body\.is-ins:has\(> #ins-panel\.is-jambo\) \.ap-foot\{margin-top:0;\}/);
  });
  test('12c Approvals: the white head, the ground, the card', () => {
    /* RE-POINTED 19 Oct 2026 (the picked drawings' head card, rounds 14-26):
       the white head is the shared card (.ph-card, drawn by renderPageHeader)
       with its own padding under the title line, so no page rule pads the
       head's last child; the ground and the card below it stay the page's.
       No bare :last-child under body:has() either way (home-speed-verify 1). */
    assert.match(fnOf(read('js/app.js'), 'renderPageHeader'), /host\.innerHTML=`<div class="ph-card">/);
    assert.match(HTML, /\.ph-card\{border-radius:var\(--radius-lg\);padding:14px 16px;\}/);
    assert.doesNotMatch(HTML, /body:has\(#content \.ap-page\) #page-head > div:last-child/);
    /* RE-POINTED 21 Oct 2026 (Part 8, the list head the Legora way): the
       list head is the head card's lower half (.ph-foot), flush under it, so
       the page starts at its top; the ground is the page's gap above the
       list's card */
    assert.match(HTML, /#content \.sap-page\.ap-page\{padding-top:0;\}/);
    assert.match(read('js/views/approvalsview.js'), /lhHtml\('approvals',\{ frame:'foot' \}\)/);
  });
});
