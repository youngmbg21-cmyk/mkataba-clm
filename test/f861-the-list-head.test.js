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
