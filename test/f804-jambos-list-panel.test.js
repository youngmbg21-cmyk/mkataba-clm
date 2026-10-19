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
  test('1a a head with his tab, a word for what it holds, ‹ Jambo while it holds a row, and the fold', () => {
    const b = world(list());
    b.win.renderRegister();
    const p = b.$('#ins-panel');
    assert.ok(p && p.classList.contains('is-jambo'), 'the panel wears Jambo\'s dress');
    assert.ok(p.querySelector('.jl-head [data-jl-home] .pd-tab-g'), 'his face\'s place on his tab');
    assert.equal(p.querySelector('.jl-head [data-jl-home] .pd-tab-w').textContent, 'Jambo');
    assert.equal(p.querySelector('[data-jl-word]').textContent, 'Contract', 'the word says what it holds');
    assert.equal(p.querySelector('[data-jl-back]').hidden, false, '‹ Jambo while a row is held');
    assert.ok(p.querySelector('[data-jl-fold]'), 'the fold to the edge');
    assert.ok(p.querySelector('.jl-body .ins-h'), 'the chosen row\'s panel is in the body');
    assert.ok(p.querySelector('.jl-foot #jl-q') && p.querySelector('.jl-foot [data-jl-send]'), 'the ask box and its Ask at the foot');
    assert.match(fnOf(INS, 'jlAskHtml'), /jamboHintHtml\(\)/, 'and the one hint line under it (the builder is components.js\'s, f805)');
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
  test('2a ‹ Jambo lets the row go: his words from the list\'s own count, "no Jambo call", no row lit', () => {
    const b = world(list());
    b.win.renderRegister();
    b.$('[data-jl-back]').dispatchEvent(evt(b.win, 'click'));
    const p = b.$('#ins-panel');
    assert.equal(p.getAttribute('data-ins-id'), null, 'nothing is held');
    assert.ok(p.querySelector('[data-jl-words] .jl-say .jl-bub'), 'he speaks');
    assert.match(p.querySelector('[data-jl-words]').textContent, /3 on this list/);
    assert.match(p.querySelector('.jl-src').textContent, /no Jambo call/);
    assert.equal(p.querySelector('[data-jl-back]').hidden, true, 'no ‹ Jambo in his own words');
    assert.equal(b.$$('#reg-tbody tr.is-sel').length, 0, 'the row is let go');
    assert.ok(p.querySelector('#jl-feed'), 'his conversation has its place under his words');
  });
  test('2b let go stays let go through a repaint, until a row is pressed', () => {
    const b = world(list());
    b.win.renderRegister();
    b.$('[data-jl-back]').dispatchEvent(evt(b.win, 'click'));
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
       caAskAnywhere and hands what the Board reads free to the Board, as the
       Counter's box does — the order is pinned, each step is driven in (8) */
    const f = code(fnOf(INS, 'jlAsk'));
    const at = s => f.indexOf(s);
    assert.ok(at('caReadPlace(t)') > 0 && at('caAskAnywhere(t)') > at('caReadPlace(t)') && at('jmRead(t)') > at('caAskAnywhere(t)')
      && at('jlBoardReads(t)') > at('jmRead(t)') && at('aiAskWords(t)') > at('jlBoardReads(t)'), 'held row, the one reader, the map, the Board, then the question');
    assert.match(f, /if \(a && a\.kind === 'go' && a\.missing\)\{\s*const held = jlHeldContract\(\);\s*if \(held\)\{\s*a\.cid = held\.id; a\.missing = false;/, 'the held row is the open contract');
    assert.match(f, /if \(m && m\.kind === 'map'\)\{ jlMapCard\(t, m\); return 'card'; \}/, '"which did you mean?" is said in the panel');
    assert.match(f, /jlToWords\(\);\s*if \(typeof aiAskWords === 'function'\)\{ aiAskWords\(t\); return 'model'; \}/, 'a question turns the panel to his words, then asks');
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
    assert.match(HTML, /#content \.ins-panel\.is-jambo\{position:fixed;right:0;top:var\(--jl-top,88px\);bottom:0;width:380px;/);
    assert.match(HTML, /#app-shell:has\(#content \.ins-panel\.is-jambo\):not\(:has\(#content \[hidden\] \.ins-panel\.is-jambo\)\) #content-scroll\{margin-right:380px;\}/);
    assert.match(HTML, /#content :has\(> #ins-panel\.is-jambo\)\{grid-template-columns:minmax\(0,1fr\);column-gap:0;\}/);
    assert.match(read('js/views/intelligence.js'), /const IG_DOCK_W0 = 380,/, 'the same width as Home\'s panel');
    assert.match(code(INS), /const JL_W = 380, JL_FOLDED = 46;/);
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
       free (a party's name, "contracts ending in 90 days") handed to the
       Board as the Counter hands it (caHandHome) — never a Jambo call; only
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
    const b = world([fixture('MK-1')]);
    b.win.renderRegister();
    const got = [];
    b.win.caReadPlace = over.caReadPlace || (() => null);
    b.win.caAskAnywhere = over.caAskAnywhere || (() => false);
    b.win.jmRead = over.jmRead || (() => null);
    b.win.hbAskReadingOf = over.hbAskReadingOf || ((t, face) => ({ road: 'copilot', face }));
    b.win.caHandHome = (t, a) => { got.push(['home', t, a]); return true; };
    b.win.aiAskWords = t => { got.push(['model', t]); };
    b.win.caGo = a => { got.push(['go', a.place, a.cid]); return true; };
    const r = b.win.jlAsk(q);
    return { r, got };
  };
  test('8a a draft from a sentence goes to the one reader (the One sheet form), never a call', () => {
    const { r, got } = drive('draft an NDA with Kabras Sugar', { caAskAnywhere: t => /^draft /.test(t) });
    assert.equal(r, 'go');
    assert.ok(!got.some(g => g[0] === 'model'), JSON.stringify(got));
  });
  test('8b what the Board reads free goes to the Board, as the Counter\'s box hands it', () => {
    const seen = [];
    for (const q of ['Nandi Dairy', 'contracts ending in 90 days']){
      const { r, got } = drive(q, { hbAskReadingOf: (t, face) => { seen.push(face); return { road: 'free', kind: 'card' }; } });
      assert.equal(r, 'board', q);
      assert.deepEqual(got, [['home', q, null]], q);
    }
    assert.ok(seen.every(f => f === 'board'), 'read as on the Board\'s face, whatever Home last showed');
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
    /* 19 Oct 2026: div:last-child, never a bare :last-child under body:has()
       (that made a Board to Workspace turn on Home recalculate every
       element's style; home-speed-verify 1) */
    assert.match(HTML, /body:has\(#content \.ap-page\) #page-head > div:last-child\{padding-bottom:var\(--s-3\);\}/);
    assert.match(HTML, /#content \.sap-page\.ap-page\{padding-top:var\(--s-3\);\}/);
  });
});
