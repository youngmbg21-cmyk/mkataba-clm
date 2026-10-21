'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f861 — THE LIST HEAD, THE LEGORA WAY (the owner's pick, 21 Oct 2026, Part 8
   "every list page the Legora way"; js/views/listhead.js, and the one tab
   builder insViewTabsHtml in js/views/inspector.js)

   The builder ALONE, in a jsdom sandbox, before any page draws it:
     (1) THE TABS: a view with no rows is left out unless it is lit or kept
         ("All"); the saved views stand in the same tablist
     (2) THE CHIPS: a choice that leaves no rows is not offered unless it is
         the one chosen; every choice is offered when the page cannot count
         (n null); a filter's rest is never a choice
     (3) "+ FILTER": only the filters not applied, only values that give rows,
         never the rest; not drawn when nothing is left to add; HaTi's own
         grouped list (data-sm-groups) and its placeholder hidden
     (4) THE PRESSES: × applies the filter's rest; a tab press writes the
         page's own tab; Show more is the seat's own, pressed once
     (5) THE FOOT: "1–40 of 189 · Show 40 more", a live region (role=status)
     (6) THE BOX: its value is escaped; a question narrows nothing and Enter
         hands it to the page's Jambo, emptying the box; plain words narrow
         and Enter spends nothing; a busy Jambo is SAID and the words stay;
         the tab and chip rows repaint without touching the box (the caret)
     (7) lhIsQuestion, the strict test: "which ones end soon" yes, "Visa" no
     (8) both books carry every lh_ word, once each
     (9) the listeners are bound once; no window name is published twice
         (f48, f232-6); Columns lives here and nowhere else
    (10) THE PAGE'S OWN PARTS STAND: a recount (lhHeadSync) keeps the
         controls a page drew in lead / right / tabsAfter — the same nodes, so
         a listener the page bound on one still fires and its focus stays; a
         part whose html changed is drawn afresh and the page's wire(head,
         parts) is called
    (11) THE BOX SHOWS THE PAGE'S QUERY: a question typed stands only while
         the page's query is empty; a query written by another door wins on
         the next repaint and through lhBoxSet (the top bar's search calls
         it); a page left and come back to starts from its own query
    (12) a list left open on a control the recount took off the page is
         closed; one open on a page's own control that stands stays, and its
         pick is heard
    (13) one recount per pause in the typing, not one per letter
    (14) the foot is written in place (lhFootPut); a column standing aside
         is greyed with its reason; a tab's number is grouped like the foot's
   RED AT THE PARENT (db763d0a): js/views/listhead.js does not exist, and
   insViewTabsHtml draws an empty view quietly instead of leaving it out.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const has = f => fs.existsSync(path.join(ROOT, f));
const LH_FILE = 'js/views/listhead.js';
const LH = has(LH_FILE) ? read(LH_FILE) : '';
const BOOKS = require('../js/i18n.js').STRINGS;
const EN = BOOKS.en;
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v && v[k] != null ? v[k] : m));
const i18t = (k, v) => fill(EN[k] != null ? EN[k] : k, v);
const i18tn = (k, n, v) => i18t(k + (n === 1 ? '_one' : '_other'), v);
const fnBody = (src, name) => { const at = src.search(new RegExp('^(?:async )?function ' + name + '\\b', 'm')); if (at < 0) return ''; return src.slice(at, src.indexOf('\n}\n', at) + 2); };
/* the codebase's own escaper (js/components.js), not a stand-in */
const COMP = read('js/components.js');
const ESC_SRC = /const ESC_MAP = [^\n]*\n/.exec(COMP)[0] + fnBody(COMP, 'esc');
const TABS_SRC = fnBody(read('js/views/inspector.js'), 'insViewTabsHtml');
/* HaTi's own dropdown list (js/core.js), from where it is declared to where it arms the document */
const CORE = read('js/core.js');
const MENU_SRC = CORE.slice(CORE.indexOf('let _selMenuEl'), CORE.indexOf('function _selMenuArmDoc(')).replace(/^let /m, 'var ');

function stage(o = {}){
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="content"></div></body></html>', { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  const toasts = [];
  const adds = [];
  const doc = win.document;
  const realAdd = doc.addEventListener.bind(doc);
  doc.addEventListener = (type, fn, opt) => { adds.push(type); return realAdd(type, fn, opt); };
  const sb = {
    console, document: doc, localStorage: win.localStorage, Event: win.Event,
    i18t, i18tn, icon: n => `<svg data-i="${n}"></svg>`, toast: (m, k) => toasts.push([m, k]),
  };
  sb.window = sb; sb.self = sb;
  vm.createContext(sb);
  vm.runInContext(ESC_SRC + '\n' + TABS_SRC, sb, { filename: 'parts.js' });
  if (o.menu) vm.runInContext(MENU_SRC, sb, { filename: 'core-menu.js' });
  if (LH) vm.runInContext(LH, sb, { filename: LH_FILE });
  if (o.twice && LH) vm.runInContext('{' + LH + '\n}', sb, { filename: LH_FILE + '#again' });
  return { sb, doc, win, toasts, adds };
}
const need = () => assert.ok(LH, 'js/views/listhead.js exists');
const txt = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
/* a chip's face: its words, not its hidden select's options */
const face = chip => [...chip.querySelector('label').childNodes].filter(n => n.nodeName !== 'SELECT').map(n => n.textContent).join('').replace(/\s+/g, ' ').trim();

/* a page as a builder sees it: its own reading and its own state */
function page(sb, over = {}){
  const S = Object.assign({ q: '', view: 'all', stream: 'all', stage: 'all', more: 0, asked: [], queries: [], applied: [] }, over.state || {});
  const spec = Object.assign({
    noun: 'contracts',
    total: () => 189,
    q: () => S.q,
    setQuery: w => { S.queries.push(w); S.q = w; },
    tabAttr: 'data-reg-view',
    tabs: () => [{ k: 'all', label: 'All', n: 189, keep: true }, { k: 'needs', label: 'Needs you', n: 12, title: 'What Home\'s Needs you names' }, { k: 'drafts', label: 'Drafts', n: 0 }],
    tab: k => { S.view = k; },
    tabNow: () => S.view,
    filters: () => [
      { k: 'stream', label: 'Stream', cur: S.stream, def: 'all', opts: [['all', 'All streams', 189], ['proc', 'Procurement & Raw Materials', 40], ['sales', 'Sales', 0], ['hr', 'HR', 3]] },
      { k: 'stage', label: 'Stage', cur: S.stage, def: 'all', opts: [['all', 'Every stage', 189], ['drafting', 'Drafting', 41], ['signed', 'Signed', 0]] },
    ],
    apply: p => { S.applied.push(p); Object.assign(S, p); },
    more: () => { S.more++; },
    ask: t => { S.asked.push(t); return over.busy ? false : true; },
  }, over.spec || {});
  sb.lhRegister('contracts', spec);
  return { S, spec };
}
function paint(x, frame = 'card'){
  x.doc.getElementById('content').innerHTML = x.sb.lhHtml('contracts', { frame, title: '<h1>Contracts</h1>' }) + x.sb.lhFootHtml('contracts', 40, 189, 40, { id: 'reg-showing' });
  return x.doc.querySelector('[data-lh-seat="contracts"]');
}
const press = (x, el) => el.dispatchEvent(new x.win.MouseEvent('click', { bubbles: true }));

describe('f861 (1) the tabs: an empty view is left out unless lit or kept', () => {
  test('insViewTabsHtml leaves out a zero view; keeps the lit one and "All"', () => {
    const { sb, doc } = stage();
    doc.body.innerHTML = sb.insViewTabsHtml({ attr: 'data-t', cur: 'lit', views: [
      { k: 'all', label: 'All', n: 0, keep: true }, { k: 'empty', label: 'Empty', n: 0 }, { k: 'lit', label: 'Lit', n: 0 }, { k: 'some', label: 'Some', n: 3 }] });
    assert.deepEqual([...doc.querySelectorAll('[data-t]')].map(b => b.getAttribute('data-t')), ['all', 'lit', 'some']);
    assert.equal(doc.querySelector('[data-t="some"] .n').textContent, '3');
  });
  test('o.after stands inside the same tablist; a view\'s title is its hover', () => {
    const { sb, doc } = stage();
    doc.body.innerHTML = sb.insViewTabsHtml({ attr: 'data-t', cur: 'a', views: [{ k: 'a', label: 'A', n: 2, title: 'Why A' }], after: '<span id="aft"></span>' });
    assert.ok(doc.querySelector('[role="tablist"] > #aft'));
    assert.equal(doc.querySelector('[data-t="a"]').getAttribute('title'), 'Why A');
  });
  test('the head draws the page\'s own tab attribute, the zero view left out', () => {
    need(); const x = stage(); page(x.sb); const head = paint(x);
    assert.deepEqual([...head.querySelectorAll('[data-reg-view]')].map(b => b.getAttribute('data-reg-view')), ['all', 'needs']);
    assert.equal(head.querySelector('[data-reg-view="needs"]').getAttribute('title'), 'What Home\'s Needs you names');
  });
  test('saved views and "+ Save this view" stand in the tab row', () => {
    need(); const x = stage();
    const saved = [];
    page(x.sb, { spec: { saved: () => [{ id: 'mine', label: 'Mine', on: false }], useSaved: id => saved.push(['use', id]), unsave: id => saved.push(['x', id]), save: () => saved.push(['save']) } });
    const head = paint(x);
    const row = head.querySelector('.reg-views');
    assert.ok(row.querySelector('.reg-vtab-saved [data-lh-saved="mine"]'));
    assert.equal(txt(row.querySelector('[data-lh-save]')), 'Save this view');
    /* the saved view's own × and the view are read before the tab row's press */
    press(x, row.querySelector('[data-lh-saved-x="mine"]'));
    press(x, row.querySelector('[data-lh-saved="mine"]'));
    press(x, row.querySelector('[data-lh-save]'));
    assert.deepEqual(saved, [['x', 'mine'], ['use', 'mine'], ['save']]);
  });
});

describe('f861 (2) the chips', () => {
  test('a zero choice is left out unless it is the one chosen; the rest is never a choice', () => {
    need(); const { sb, doc } = stage();
    doc.body.innerHTML = sb.lhChipHtml({ k: 'stream', label: 'Stream', cur: 'proc', def: 'all', opts: [['all', 'All', 9], ['proc', 'Proc', 4], ['sales', 'Sales', 0], ['hr', 'HR', 2]] });
    assert.deepEqual([...doc.querySelectorAll('select[data-lh-f="stream"] option')].map(o => o.value), ['proc', 'hr']);
    assert.equal(face(doc.querySelector('.lh-chip')), 'Stream Proc');
    doc.body.innerHTML = sb.lhChipHtml({ k: 'stream', label: 'Stream', cur: 'sales', def: 'all', opts: [['all', 'All', 9], ['proc', 'Proc', 4], ['sales', 'Sales', 0]] });
    assert.deepEqual([...doc.querySelectorAll('select option')].map(o => o.value), ['proc', 'sales'], 'the chosen one stays though it gives none');
  });
  test('every choice is offered when the page cannot count (n null)', () => {
    need(); const { sb, doc } = stage();
    doc.body.innerHTML = sb.lhChipHtml({ k: 'f', label: 'F', cur: 'a', def: 'all', opts: [['all', 'All', null], ['a', 'A', null], ['b', 'B', null]] });
    assert.deepEqual([...doc.querySelectorAll('select option')].map(o => o.value), ['a', 'b']);
  });
  test('only APPLIED filters are chips; the chip row carries "+ Filter" and the page\'s right end', () => {
    need(); const x = stage(); page(x.sb, { state: { stream: 'proc' }, spec: { right: () => '<button id="rt">Sort</button>' } });
    const head = paint(x);
    assert.deepEqual([...head.querySelectorAll('.lh-chip')].map(c => c.getAttribute('data-lh-chip')), ['stream']);
    assert.equal(face(head.querySelector('.lh-chip')), 'Stream Procurement & Raw Materials');
    const kids = [...head.querySelector('.lh-chips').children].map(el => el.id || el.className.split(' ')[0]);
    assert.deepEqual(kids, ['lh-chip', 'lh-add', 'lh-sp', 'rt']);
  });
});

describe('f861 (3) "+ Filter"', () => {
  test('only the filters not applied, values that give rows, never the rest', () => {
    need(); const x = stage(); page(x.sb, { state: { stream: 'proc' } }); const head = paint(x);
    const sel = head.querySelector('select[data-lh-add]');
    assert.ok(sel.hasAttribute('data-sm-groups'), 'HaTi\'s own list, its groups drawn as headings');
    assert.deepEqual([...sel.querySelectorAll('optgroup')].map(g => g.label), ['Stage'], 'Stream is applied: it is a chip, not offered again');
    assert.deepEqual([...sel.querySelectorAll('optgroup option')].map(o => o.textContent), ['Drafting (41)'], '"Every stage" (the rest) and "Signed" (none) are not offered');
    const ph = sel.options[0];
    assert.ok(ph.hidden && ph.disabled && ph.selected && ph.value === '', 'the resting placeholder is hidden, as in the system\'s own list');
  });
  test('choosing one applies it', () => {
    need(); const x = stage(); const P = page(x.sb); const head = paint(x);
    const sel = head.querySelector('select[data-lh-add]');
    const opt = [...sel.options].find(o => o.textContent === 'HR (3)');
    sel.value = opt.value; sel.dispatchEvent(new x.win.Event('change', { bubbles: true }));
    assert.deepEqual(JSON.parse(JSON.stringify(P.S.applied)), [{ stream: 'hr' }]);
  });
  test('absent when nothing is left to add', () => {
    need(); const x = stage(); page(x.sb, { state: { stream: 'proc', stage: 'drafting' } }); const head = paint(x);
    assert.equal(head.querySelector('[data-lh-add]'), null);
    assert.equal(x.sb.lhAddHtml('contracts'), '');
    const y = stage(); page(y.sb, { spec: { filters: () => [{ k: 'z', label: 'Z', cur: 'all', def: 'all', opts: [['all', 'All', 5], ['n', 'None', 0]] }] } });
    assert.equal(y.sb.lhAddHtml('contracts'), '', 'a filter whose only values give no rows offers nothing');
  });
});

describe('f861 (4) the presses', () => {
  test('× applies the filter\'s rest, and the box takes the focus back', () => {
    need(); const x = stage(); const P = page(x.sb, { state: { stream: 'proc' } }); paint(x);
    press(x, x.doc.querySelector('[data-lh-x="stream"]'));
    assert.deepEqual(JSON.parse(JSON.stringify(P.S.applied)), [{ stream: 'all' }]);
    assert.equal(x.doc.activeElement && x.doc.activeElement.getAttribute('data-lh-q'), '', 'the box (an input), never a select');
    assert.equal(x.doc.querySelector('[data-lh-x="stream"]').getAttribute('aria-label'), 'Remove Stream');
  });
  test('a chip\'s own select re-chooses', () => {
    need(); const x = stage(); const P = page(x.sb, { state: { stream: 'proc' } }); paint(x);
    const sel = x.doc.querySelector('select[data-lh-f="stream"]');
    sel.value = 'hr'; sel.dispatchEvent(new x.win.Event('change', { bubbles: true }));
    assert.deepEqual(JSON.parse(JSON.stringify(P.S.applied)), [{ stream: 'hr' }]);
  });
  test('a tab press writes the page\'s own tab', () => {
    need(); const x = stage(); const P = page(x.sb); paint(x);
    press(x, x.doc.querySelector('[data-reg-view="needs"]'));
    assert.equal(P.S.view, 'needs');
  });
});

describe('f861 (5) the foot', () => {
  test('"1–40 of 189 · Show 40 more", a live region with the page\'s own id', () => {
    need(); const x = stage(); const P = page(x.sb); paint(x);
    const foot = x.doc.querySelector('[data-lh-foot="contracts"]');
    assert.equal(txt(foot), '1–40 of 189 · Show 40 more');
    assert.equal(foot.getAttribute('role'), 'status');
    assert.equal(foot.getAttribute('aria-live'), 'polite');
    assert.equal(foot.id, 'reg-showing');
    press(x, foot.querySelector('[data-lh-more="contracts"]'));
    assert.equal(P.S.more, 1, 'Show more is the seat\'s own, pressed once');
  });
  test('the last page offers what is left; a list drawn whole offers nothing', () => {
    need(); const { sb, doc } = stage();
    doc.body.innerHTML = sb.lhFootHtml('s', 180, 189, 40);
    assert.equal(txt(doc.body), '1–180 of 189 · Show 9 more');
    doc.body.innerHTML = sb.lhFootHtml('s', 7, 7, 40);
    assert.equal(txt(doc.body), '1–7 of 7');
    assert.equal(doc.querySelector('[data-lh-more]'), null);
  });
});

describe('f861 (6) the box', () => {
  test('the words in it are escaped, never markup; the placeholder counts the book', () => {
    need(); const x = stage(); const evil = '"><img src=x onerror="window.hit=1">';
    page(x.sb, { state: { q: evil } }); const head = paint(x);
    const inp = head.querySelector('input[data-lh-q]');
    assert.equal(inp.value, evil);
    assert.equal(head.querySelector('img'), null);
    assert.equal(inp.getAttribute('placeholder'), 'Search, or ask across 189 contracts');
    assert.equal(inp.getAttribute('type'), 'search');
  });
  test('plain words narrow through the page\'s own query; Enter spends nothing', () => {
    need(); const x = stage(); const P = page(x.sb); paint(x);
    const inp = x.doc.querySelector('input[data-lh-q]');
    inp.value = 'Nordkap'; inp.dispatchEvent(new x.win.Event('input', { bubbles: true }));
    assert.deepEqual(P.S.queries, ['Nordkap']);
    inp.dispatchEvent(new x.win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    assert.deepEqual(P.S.asked, [], 'a search never reaches Jambo');
    assert.equal(inp.value, 'Nordkap');
  });
  test('a question narrows nothing; Enter hands it to the page\'s Jambo and empties the box', () => {
    need(); const x = stage(); const P = page(x.sb, { state: { q: 'which ones' } }); paint(x);
    const inp = x.doc.querySelector('input[data-lh-q]');
    inp.value = 'which ones end soon'; inp.dispatchEvent(new x.win.Event('input', { bubbles: true }));
    assert.deepEqual(P.S.queries, [''], 'the list stands whole while a question is typed');
    inp.dispatchEvent(new x.win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    assert.deepEqual(P.S.asked, ['which ones end soon']);
    assert.equal(inp.value, '');
  });
  test('a Jambo still answering takes nothing: it is said, and the words stay', () => {
    need(); const x = stage(); const P = page(x.sb, { busy: true }); paint(x);
    const inp = x.doc.querySelector('input[data-lh-q]');
    inp.value = 'is it signed?'; inp.dispatchEvent(new x.win.Event('input', { bubbles: true }));
    inp.dispatchEvent(new x.win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    assert.deepEqual(P.S.asked, ['is it signed?']);
    assert.equal(inp.value, 'is it signed?');
    assert.deepEqual(x.toasts, [[EN.lh_busy, 'warn']]);
  });
  test('the tab and chip rows repaint while the box — and its caret — stay', () => {
    need(); const x = stage(); const P = page(x.sb); paint(x);
    const inp = x.doc.querySelector('input[data-lh-q]');
    inp.value = 'Nord'; inp.focus(); inp.setSelectionRange(2, 2);
    P.spec.tabs = () => [{ k: 'all', label: 'All', n: 7, keep: true }, { k: 'drafts', label: 'Drafts', n: 2 }];
    assert.equal(x.sb.lhHeadSync('contracts'), 1);
    assert.equal(x.doc.querySelector('input[data-lh-q]'), inp, 'the same box, untouched');
    assert.equal(x.doc.activeElement, inp);
    assert.equal(inp.selectionStart, 2);
    assert.deepEqual([...x.doc.querySelectorAll('[data-reg-view]')].map(b => txt(b)), ['All7', 'Drafts2'], 'the numbers moved');
  });
});

describe('f861 (7) the strict test: what reads as a question', () => {
  test('questions and searches, in both languages', () => {
    need(); const { sb } = stage();
    const Q = w => sb.lhIsQuestion(w);
    assert.equal(Q('which ones end soon'), true);
    assert.equal(Q('is it signed?'), true);
    assert.equal(Q('vilka löper ut'), true);
    assert.equal(Q('Visa'), false);
    assert.equal(Q('Nordkap'), false);
    assert.equal(Q('which ones'), false, 'two words narrow until the third');
    assert.equal(Q('show me drafts'), true);
    assert.equal(Q('?'), false);
    assert.equal(Q(''), false);
  });
});

describe('f861 (8) both books carry every lh_ word', () => {
  const NOUNS = ['contracts', 'negotiations', 'approvals', 'obligations', 'requests', 'notes', 'parties', 'people', 'templates', 'standards', 'book', 'files'];
  const KEYS = NOUNS.flatMap(n => ['lh_ph_' + n + '_one', 'lh_ph_' + n + '_other'])
    .concat(['lh_add', 'lh_add_title', 'lh_remove', 'lh_range', 'lh_more', 'lh_save', 'lh_save_title', 'lh_box_label', 'lh_box_title', 'lh_busy',
      'brn_p_listhead', 'brn_pd_listhead', 'brn_p_listfoot', 'brn_pd_listfoot']);
  test('in en and sv, once each', () => {
    const src = read('js/i18n.js');
    for (const k of KEYS){
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], `${k} in ${lang}`);
      assert.equal((src.match(new RegExp(`\\n    ${k}:`, 'g')) || []).length, 2, `${k} once in each book`);
    }
    for (const n of NOUNS) assert.match(EN['lh_ph_' + n + '_other'], /\{n\}/, n + ' counts its book');
    assert.equal(EN.lh_range, '{a}–{b} of {n}');
    assert.equal(EN.lh_more, 'Show {n} more');
    assert.ok(!/⌘K|—/.test(EN.lh_ph_contracts_other), 'no example after a dash, no ⌘K hint');
  });
});

describe('f861 (9) bound once, published once', () => {
  test('the listeners are bound once, on the document, at load', () => {
    need(); const x = stage(); const P = page(x.sb); paint(x);
    assert.equal(x.sb._lhWired, true);
    assert.equal(x.adds.filter(t => t === 'click').length, 2, 'one for Columns, one for the head');
    press(x, x.doc.querySelector('[data-lh-more="contracts"]'));
    assert.equal(P.S.more, 1, 'one press, one page more');
  });
  test('and not again if the file runs a second time on the same window', () => {
    need(); const one = stage(), two = stage({ twice: true });
    assert.ok(one.adds.length > 0);
    assert.deepEqual(two.adds, one.adds);
  });
  test('no window name is published twice; nothing else declares one; Columns left customers.js', () => {
    need();
    const pubOf = s => {
      const out = new Set();
      for (const m of s.matchAll(/Object\.assign\(\s*window\s*,\s*\{/g)){
        let i = m.index + m[0].length, d = 1; const st = i;
        while (i < s.length && d > 0){ if (s[i] === '{') d++; else if (s[i] === '}') d--; i++; }
        s.slice(st, i - 1).replace(/\/\*[\s\S]*?\*\//g, ' ').split(',').forEach(x => { const n = /^\s*([A-Za-z_$][\w$]*)\s*(?::|$)/.exec(x); if (n) out.add(n[1]); });
      }
      for (const m of s.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) out.add(m[1]);
      return out;
    };
    const mine = pubOf(LH);
    for (const n of ['LH_PAGES', 'lhRegister', 'lhHtml', 'lhRowsHtml', 'lhBoxHtml', 'lhChipsHtml', 'lhChipHtml', 'lhAddHtml', 'lhFootHtml', 'lhHeadSync', 'lhIsQuestion', 'lhAsk',
      'LC_PAGES', 'lcKey', 'lcState', 'lcSave', 'lcShown', 'lcBtnHtml', 'lcPopHtml', 'lcPlace', 'lcRepaint', 'lcScrollWire']) assert.ok(mine.has(n), n + ' is published');
    const files = [];
    const walk = d => { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })){ const r = d + '/' + e.name; if (e.isDirectory()) walk(r); else if (e.name.endsWith('.js') && r !== LH_FILE) files.push(r); } };
    walk('js');
    const clash = [];
    for (const f of files){
      const s = read(f);
      const decl = new Set([...s.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm), ...s.matchAll(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]));
      const pub = pubOf(s);
      for (const n of mine) if (pub.has(n) || decl.has(n)) clash.push(`${n} — ${f}`);
    }
    assert.deepEqual(clash, [], 'a name the list head publishes is published or declared in another module too');
    assert.ok(!/\bfunction lcFootHtml\b/.test(read('js/views/customers.js')), 'the old foot is gone');
    assert.ok(/import '\.\/views\/listhead\.js';[^\n]*\n(?:[^\n]*\n)*?import '\.\/views\/customers\.js'/.test(read('js/app.js')), 'imported before the pages that draw it');
  });
});

describe('f861 (10) the page\'s own parts stand across a recount', () => {
  const SORT = '<select id="reg-sort"><option value="end">Ends</option><option value="value">Value</option></select>';
  const ONLY = '<span id="reg-only-chip">Only these 4 <button type="button" id="reg-only-clear">Show all</button></span>';
  test('a listener a page bound on its own control in right() and lead() still fires after lhHeadSync', () => {
    need(); const x = stage(); const P = page(x.sb, { state: { stream: 'proc' }, spec: { right: () => SORT, lead: () => ONLY } }); paint(x);
    const sort = x.doc.getElementById('reg-sort'), clear = x.doc.getElementById('reg-only-clear');
    const heard = { sort: 0, clear: 0 };
    sort.addEventListener('change', () => { heard.sort++; });
    clear.addEventListener('click', () => { heard.clear++; });
    clear.focus();
    P.spec.tabs = () => [{ k: 'all', label: 'All', n: 7, keep: true }, { k: 'drafts', label: 'Drafts', n: 2 }];
    assert.equal(x.sb.lhHeadSync('contracts'), 1);
    assert.deepEqual([...x.doc.querySelectorAll('[data-reg-view]')].map(b => txt(b)), ['All7', 'Drafts2'], 'the recount ran');
    assert.equal(x.doc.getElementById('reg-sort'), sort, 'the same Sort, never redrawn');
    assert.equal(x.doc.getElementById('reg-only-clear'), clear, 'the same chip a door handed in');
    assert.equal(x.doc.activeElement, clear, 'its focus stays');
    sort.value = 'value'; sort.dispatchEvent(new x.win.Event('change', { bubbles: true }));
    press(x, clear);
    assert.deepEqual(heard, { sort: 1, clear: 1 }, 'neither is a dead button');
    const kids = [...x.doc.querySelector('.lh-chips').children].map(el => el.id || el.className.split(' ')[0]);
    assert.deepEqual(kids, ['reg-only-chip', 'lh-chip', 'lh-add', 'lh-sp', 'reg-sort'], 'every part in its place');
  });
  test('typed words recount the head and the page\'s own controls stay alive', () => {
    need(); const x = stage(); page(x.sb, { spec: { right: () => SORT } }); paint(x);
    const sort = x.doc.getElementById('reg-sort'); let heard = 0;
    sort.addEventListener('change', () => { heard++; });
    const inp = x.doc.querySelector('input[data-lh-q]');
    inp.value = 'N'; inp.dispatchEvent(new x.win.Event('input', { bubbles: true }));
    inp.value = 'Nordkap'; inp.dispatchEvent(new x.win.Event('input', { bubbles: true }));
    sort.dispatchEvent(new x.win.Event('change', { bubbles: true }));
    assert.equal(x.doc.getElementById('reg-sort'), sort);
    assert.equal(heard, 1, 'one change, heard once');
  });
  test('tabsAfter stands in the tab row', () => {
    need(); const x = stage(); const P = page(x.sb, { spec: { tabsAfter: () => '<button type="button" id="seg">The book</button>' } }); paint(x);
    const seg = x.doc.getElementById('seg'); let heard = 0;
    seg.addEventListener('click', () => { heard++; });
    P.spec.tabs = () => [{ k: 'all', label: 'All', n: 3, keep: true }];
    x.sb.lhHeadSync('contracts');
    assert.equal(x.doc.getElementById('seg'), seg);
    assert.ok(x.doc.querySelector('[role="tablist"] > #seg'), 'still inside the tablist');
    assert.deepEqual([...x.doc.querySelectorAll('[data-reg-view]')].map(b => txt(b)), ['All3']);
    press(x, seg);
    assert.equal(heard, 1);
  });
  test('a part whose html changed is drawn afresh and the page\'s wire(head, parts) is called; unchanged, it is not', () => {
    need(); const x = stage(); const wired = [];
    const P = page(x.sb, { state: { n: 12 }, spec: { right: () => `<button type="button" id="act">Do this to these ${P.S.n}</button>`, wire: (head, parts) => wired.push([head.getAttribute('data-lh-seat'), parts]) } });
    paint(x);
    x.sb.lhHeadSync('contracts');
    assert.deepEqual(wired, [], 'nothing of the page\'s was redrawn');
    P.S.n = 3;
    x.sb.lhHeadSync('contracts');
    assert.equal(txt(x.doc.getElementById('act')), 'Do this to these 3');
    assert.deepEqual(JSON.parse(JSON.stringify(wired)), [['contracts', ['right']]]);
  });
});

describe('f861 (11) the box shows the page\'s query', () => {
  const ask = (x, w) => { const inp = x.doc.querySelector('input[data-lh-q]'); inp.value = w; inp.dispatchEvent(new x.win.Event('input', { bubbles: true })); return inp; };
  test('a question typed, then the page\'s query written elsewhere: the repaint shows the page\'s query', () => {
    need(); const x = stage(); const P = page(x.sb); paint(x);
    ask(x, 'which ones end soon');
    assert.equal(P.S.q, '', 'a question narrows nothing');
    paint(x);
    assert.equal(x.doc.querySelector('input[data-lh-q]').value, 'which ones end soon', 'a repaint draws the question back');
    P.S.q = 'Nordkap';
    paint(x);
    assert.equal(x.doc.querySelector('input[data-lh-q]').value, 'Nordkap', 'the page\'s query wins');
  });
  test('lhBoxSet: the one writer of what a box shows when another door writes the query', () => {
    need(); const x = stage(); const P = page(x.sb); paint(x);
    const inp = ask(x, 'which ones end soon');
    P.S.q = 'Nordkap';
    assert.equal(x.sb.lhBoxSet('contracts'), 1);
    assert.equal(inp.value, 'Nordkap', 'the question goes; the page\'s query shows');
    assert.equal(x.sb.lhBoxSet('contracts'), 0, 'a box already showing the words is not touched');
    x.sb.lhBoxSet('contracts', 'Volvo');
    assert.equal(inp.value, 'Volvo');
    P.S.q = 'Kaffe';
    assert.equal(x.sb.lhBoxSet(), 1, 'with no seat (the top bar), every head shows its own page\'s query');
    assert.equal(inp.value, 'Kaffe');
    P.S.q = '';
    ask(x, 'which ones end soon');
    assert.equal(x.sb.lhBoxSet(), 0, 'a question stands where its page\'s query is empty');
    assert.equal(inp.value, 'which ones end soon');
  });
  test('the top bar\'s search tells the list head\'s box what it wrote', () => {
    const app = read('js/app.js').replace(/\/\*[\s\S]*?\*\//g, ' ');
    const at = app.indexOf("const search=document.getElementById('cmd-search');");
    assert.ok(at > 0, 'the bar\'s search is wired in app.js');
    const input = app.slice(at, app.indexOf("search.addEventListener('keydown'", at));
    assert.match(input, /R\.query=q;[\s\S]*if\(window\.lhBoxSet\) lhBoxSet\(\);/);
  });
  test('a page left and come back to starts from its own query', () => {
    need(); const x = stage(); page(x.sb); paint(x);
    ask(x, 'which ones end soon');
    x.doc.getElementById('content').innerHTML = '<p>another page</p>';
    paint(x);
    assert.equal(x.doc.querySelector('input[data-lh-q]').value, '');
  });
});

describe('f861 (12) a list open on a control the recount takes away', () => {
  test('"+ Filter"\'s list is closed when lhHeadSync redraws it', () => {
    need(); const x = stage({ menu: true }); page(x.sb); paint(x);
    const sel = x.doc.querySelector('select[data-lh-add]');
    assert.equal(x.sb.selectMenuOpen(sel), true);
    assert.equal(x.sb.selectMenuFor(), sel);
    x.sb.lhHeadSync('contracts');
    assert.equal(sel.isConnected, false, 'the old "+ Filter" left the page');
    assert.equal(x.sb.selectMenuShowing(), false, 'and its list with it');
    assert.equal(x.doc.querySelector('.hati-selmenu'), null);
    assert.ok(x.doc.querySelector('select[data-lh-add]'), 'the fresh "+ Filter" stands');
  });
  test('a list open on a page\'s own control that stands stays open, and its pick is heard', () => {
    need(); const x = stage({ menu: true });
    page(x.sb, { spec: { right: () => '<label><select id="reg-sort"><option value="end">Ends</option><option value="value">Value</option></select></label>' } }); paint(x);
    const sort = x.doc.getElementById('reg-sort'); const heard = [];
    sort.addEventListener('change', () => heard.push(sort.value));
    x.sb.selectMenuOpen(sort);
    x.sb.lhHeadSync('contracts');
    assert.equal(sort.isConnected, true, 'the page\'s own Sort never left the page');
    assert.equal(x.sb.selectMenuShowing(), true);
    x.doc.querySelector('.hati-selmenu [data-sm="1"]').dispatchEvent(new x.win.MouseEvent('click', { bubbles: true }));
    assert.deepEqual(heard, ['value']);
  });
});

describe('f861 (13) one recount per pause in the typing', () => {
  test('three letters narrow the rows three times and count the head once', () => {
    need(); const x = stage(); const P = page(x.sb); paint(x);
    const timers = [];
    x.sb.setTimeout = (fn, ms) => { timers.push({ fn, ms }); return timers.length; };
    x.sb.clearTimeout = id => { if (timers[id - 1]) timers[id - 1].fn = null; };
    const flush = () => timers.forEach(t => { const f = t.fn; t.fn = null; if (f) f(); });
    const tabs = P.spec.tabs; let counted = 0;
    P.spec.tabs = () => { counted++; return tabs(); };
    const inp = x.doc.querySelector('input[data-lh-q]');
    for (const w of ['N', 'No', 'Nor']){ inp.value = w; inp.dispatchEvent(new x.win.Event('input', { bubbles: true })); }
    assert.deepEqual(P.S.queries, ['N', 'No', 'Nor'], 'every letter narrows the rows');
    assert.equal(counted, 0, 'nothing counted while typing');
    assert.equal(timers.filter(t => t.fn).length, 1, 'one recount waiting');
    assert.equal(timers[0].ms, x.sb.LH_SYNC_QUIET_MS);
    flush();
    assert.equal(counted, 1, 'counted once, after the pause');
    inp.value = 'Nord'; inp.dispatchEvent(new x.win.Event('input', { bubbles: true }));
    x.sb.lhHeadSync('contracts');
    assert.equal(counted, 2);
    flush();
    assert.equal(counted, 2, 'a direct recount takes the one waiting');
  });
});

/* (14) THE REVIEW'S FIXES (21 Oct 2026, Part 8's finish): the foot is written
   IN PLACE (lhFootPut) — the same node, so its live region is heard when the
   count moves, and Show N more keeps the keyboard; a column standing aside
   for now (LC_PAGES[seat].off) is greyed with its reason, never a live tick
   that draws nothing; a tab's number is grouped the way the foot's is. */
describe('f861 (14) the foot in place, a column aside, the numbers grouped', () => {
  test('lhFootPut writes the new count into the foot already on the page, attributes and all', () => {
    need(); const { sb, doc } = stage();
    doc.body.innerHTML = `<div id="card">${sb.lhFootHtml('s', 40, 189, 40, { id: 'reg-showing' })}</div>`;
    const el = doc.querySelector('[data-lh-foot="s"]');
    el.querySelector('[data-lh-more]').focus();
    assert.equal(sb.lhFootPut(el, sb.lhFootHtml('s', 4, 4, 40, { id: 'reg-showing', cls: 'x' })), true);
    const now = doc.querySelector('[data-lh-foot="s"]');
    assert.equal(now, el, 'the same node: a live region is heard when it changes, not when it is inserted');
    assert.equal(txt(now), '1–4 of 4');
    assert.equal(now.getAttribute('role'), 'status');
    assert.equal(now.getAttribute('aria-live'), 'polite');
    assert.ok(now.classList.contains('x'), 'its attributes follow the new foot');
    el.innerHTML = '';
    doc.body.innerHTML = `<div>${sb.lhFootHtml('s', 40, 189, 40)}</div>`;
    const f2 = doc.querySelector('[data-lh-foot="s"]');
    f2.querySelector('[data-lh-more]').focus();
    sb.lhFootPut(f2, sb.lhFootHtml('s', 80, 189, 40));
    assert.equal(txt(f2), '1–80 of 189 · Show 40 more');
    assert.ok(doc.activeElement && doc.activeElement.matches('[data-lh-more]'), 'Show N more keeps the keyboard');
    assert.equal(sb.lhFootPut(f2, ''), true); assert.equal(doc.querySelector('[data-lh-foot]'), null, 'an empty foot takes it away');
    assert.equal(sb.lhFootPut(null, sb.lhFootHtml('s', 1, 1, 0)), false, 'no foot to write into: the page inserts it');
  });
  test('a column standing aside is greyed with its reason; the others stay live', () => {
    need(); const { sb, doc } = stage();
    sb.LC_PAGES.t = { cols: () => [{ k: 'stage', label: 'Stage' }, { k: 'owner', label: 'Owner' }], repaint: () => {}, hide: ['owner'], off: () => ({ owner: 'Steps aside' }) };
    doc.body.innerHTML = sb.lcPopHtml('t');
    const o = doc.querySelector('[data-lc-k="owner"]'), st = doc.querySelector('[data-lc-k="stage"]');
    assert.equal(o.disabled, true, 'Owner cannot be ticked while it stands aside');
    assert.equal(o.closest('label').getAttribute('title'), 'Steps aside', 'its reason on the hover');
    assert.ok(o.closest('label').classList.contains('is-off'));
    assert.equal(st.disabled, false);
    sb.LC_PAGES.t.off = () => ({});
    doc.body.innerHTML = sb.lcPopHtml('t');
    assert.equal(doc.querySelector('[data-lc-k="owner"]').disabled, false, 'back, it is live again');
    const REG = read('js/views/register.js');
    assert.match(REG, /off:\(\)=>regOnCt\(\(\)=>regCtAskKeys\(\)\.length\?\{ owner:i18t\('reg_col_owner_aside'\) \}:\{\}\)/, 'Contracts names Owner aside while answer columns stand');
    assert.ok(EN.reg_col_owner_aside && BOOKS.sv.reg_col_owner_aside, 'its reason in both books');
  });
  test('a tab\'s number is grouped the way the foot\'s is', () => {
    need(); const { sb, doc } = stage();
    doc.body.innerHTML = sb.insViewTabsHtml({ attr: 'data-t', cur: 'all', views: [{ k: 'all', label: 'All', n: 3000, keep: true }] });
    assert.equal(doc.querySelector('.n').textContent, (3000).toLocaleString(), 'grouped, never "3000"');
  });
});
