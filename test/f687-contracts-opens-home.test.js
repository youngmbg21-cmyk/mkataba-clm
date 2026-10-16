'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f687 — CONTRACTS OPENS HOME (WALL | LIST); THE RAIL'S FOLD KEEPS
   NEGOTIATIONS AND PARTIES (the overnight work order, step 7; owner's "Go",
   14 Oct 2026; docs/WORKORDER-one-page-finish.md and version 4 of the
   picture, docs/WORKORDER-one-page-finish-strip.html: contractsHead,
   wallHtml, listHtml).

   The browser census (test/chromium/every-door-lands-on-home-verify.js)
   presses every door onto the place; this file pins what draws it and what
   routes to it, run where it can be run:
   (1) EVERY DOOR ONTO THE CONTRACTS PAGE LANDS ON HOME: setView('register')
       hands over to hbOpenContracts before anything is drawn (the phone keeps
       its own screen); hbOpenContracts puts the paper down and turns Home to
       its Document face, mounted or not. The rail's Home door is not the
       place: from it Home is the Board (the drawing). Jambo reads the place
       as the Contracts list.
   (2) ONE HEAD, ONE SET OF TABS AND FILTERS, TWO VIEWS: renderRegister on
       Home draws the name, the facts line, the filter boxes (Stream · Quick
       filters · Category · Adapt filters), the six stage tabs and Wall | List;
       the Wall is #ig-wall of the very rows the List holds; the List is the
       same table with no inspector, its six columns the drawing's (Ref ·
       Counterparty and agreement · Stage · Owner · Ends · Value) and the row's
       own ⋯ after them, a row's one press opening the paper; a host that is
       gone draws nothing, never a list over another page.
   (3) THE RAIL: the fold holds Negotiations and Parties, the Contracts item
       and its count are gone, the opener keeps its name and is the Contracts
       door (it lights on the place, folder and room alike).
   (4) WORDS IN BOTH BOOKS: Wall · List · Show as; the stage tabs say the
       stage's own word in the reader's language; the paper's way back names
       the place (‹ Contracts).
   AT THE PARENT (3f546b9) every test here fails: hbOpenContracts, the home
   host, REG_COL_KEYS_HOME and the ct_ words do not exist, and the fold holds
   a Contracts item with a count.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildWorld } = require('./world');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const J = x => JSON.parse(JSON.stringify(x));
const APP = strip(R('js/app.js'));
const HB = strip(R('js/views/homeboard.js'));
const IG = strip(R('js/views/intelligence.js'));
const HTML = R('index.html');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? undefined : j); };

describe('f687 (1) every door onto the Contracts page lands on Home\'s Contracts place', () => {
  test('1a setView(\'register\') hands over to hbOpenContracts before anything is drawn; the phone keeps its screen', () => {
    const sv = fnBody(APP, 'setView');
    const at = sv.indexOf("if(view==='register' && typeof window!=='undefined' && typeof window.hbOpenContracts==='function'");
    assert.ok(at > 0, 'the hand-over');
    assert.match(sv.slice(at, at + 300), /&& !\(typeof window\.mPhone==='function' && window\.mPhone\(\)\)\)\{\s*if\(!viewLayersClosed\(view\)\) return;\s*window\.hbOpenContracts\(\);\s*return;\s*\}/,
      'a layer over the page (the clause editor) is asked first, as on any page change');
    assert.ok(at < sv.indexOf('if(!viewLayersClosed(view)) return;') && at < sv.indexOf('state.view=view;'), 'before the layers are asked and the view is written');
  });
  const stage = ({ view = 'dashboard', mounted = true, face = 'board', paper = 'MK-1' } = {}) => {
    const calls = []; const hb = { face };
    const ctx = { window: {}, state: { view }, intel: { paper: paper ? { id: paper } : null, walk: 1 },
      hbS: () => hb, hbSave: () => calls.push(['save', hb.face]), hbPage: () => mounted ? {} : null, hbMount: () => calls.push(['mount']),
      hbSetFace: f => { calls.push(['face', f]); hb.face = f; },
      igPickAgain: () => { calls.push(['pick']); ctx.intel.paper = null; },
      setView: v => calls.push(['view', v]) };
    ctx.window = ctx;
    vm.createContext(ctx); vm.runInContext(fnBody(HB, 'hbOpenContracts') + '\nthis.go=hbOpenContracts;', ctx);
    return { ctx, calls, hb };
  };
  test('1b on Home: the Document face, the paper put down (the strip\'s own way back)', () => {
    let s = stage(); s.ctx.go();
    assert.deepEqual(J(s.calls), [['face', 'paper'], ['pick']]);
    s = stage({ face: 'paper' }); s.ctx.go();
    assert.deepEqual(J(s.calls), [['pick']], 'already on the Document face: only the paper goes down');
  });
  test('1c off Home: the paper put down first, the Document face kept, then Home', () => {
    const s = stage({ view: 'approvals' }); s.ctx.go();
    assert.equal(s.ctx.intel.paper, null); assert.equal(s.ctx.intel.walk, null);
    assert.deepEqual(J(s.calls), [['save', 'paper'], ['view', 'dashboard']]);
  });
  test('1e the rail\'s Home door is not the place: from it (or with it remembered) Home is the Board, as the drawing has it', () => {
    const home = ({ view = 'dashboard', mounted = true, face = 'paper', paper = null } = {}) => {
      const calls = []; const hb = { face };
      const ctx = { window: {}, state: { view }, intel: { paper: paper ? { id: paper } : null },
        hbS: () => hb, hbSave: () => calls.push(['save', hb.face]), hbPage: () => mounted ? {} : null, hbMount: () => calls.push(['mount']),
        hbSetFace: f => { calls.push(['face', f]); hb.face = f; }, setView: v => calls.push(['view', v]) };
      ctx.window = ctx;
      vm.createContext(ctx); vm.runInContext(fnBody(HB, 'hbOpenHome') + '\nthis.go=hbOpenHome;', ctx);
      ctx.go(); return J(calls);
    };
    assert.deepEqual(home(), [['face', 'board']], 'on the place: the Board, in place');
    assert.deepEqual(home({ view: 'obligations' }), [['save', 'board'], ['view', 'dashboard']], 'the place remembered: the Board, then Home');
    assert.deepEqual(home({ paper: 'MK-1' }), [['view', 'dashboard']], 'a paper up: Home as it was left');
    assert.deepEqual(home({ view: 'approvals', face: 'calendar' }), [['view', 'dashboard']], 'another face: Home as it was left');
    assert.match(APP, /else if\(v==='dashboard'&&window\.hbOpenHome&&!\(window\.mPhone&&mPhone\(\)\)\) hbOpenHome\(\);/, 'the rail\'s Home press goes through it');
  });
  test('1f Jambo reads the place as the Contracts list, not as Home', () => {
    const AI = strip(R('js/ai.js'));
    assert.match(fnBody(AI, 'aiPageContext'), /if \(view === 'dashboard' && typeof regPlaceUp === 'function' && regPlaceUp\(\)\) view = 'register';[\s\S]*if \(view === 'register' \|\| view === 'folder'\)/);
  });
  test('1d the doors that named the page name it still, and so land on the place', () => {
    const REG = strip(R('js/views/register.js'));
    assert.match(fnBody(REG, 'regGoFiltered'), /setView\('register'\)/, 'regGoFiltered, under regShowOnly and the Board\'s numbers');
    assert.match(strip(R('js/views/contract.js')), /deleteContract\(c\.id\)\.then\(ok=>\{ if\(ok\) setView\('register'\); \}\)/, 'Delete');
    assert.match(fnBody(strip(R('js/views/customers.js')), 'cuOpenCustomer'), /regShowOnly\(cuIdsOf\(v\)/, 'Open party');
    /* the top bar's search narrows the place where it stands */
    assert.match(APP, /const here=state\.view==='register'\|\|!!\(window\.regPlaceUp&&regPlaceUp\(\)\);/);
  });
});

describe('f687 (2) one head, one set of tabs and filters, Wall | List', () => {
  const BOOK = [
    { id: 'MK-1', name: 'Supply', counterparty: 'Naivas', status: 'Signed', folder: 'sales', lastAction: '2026-10-02', metadata: {}, owner: { name: 'Amina Otieno' }, expiry: '2027-06-30', value: 1000 },
    { id: 'MK-2', name: 'Listing', counterparty: 'Juno', status: 'Draft', folder: 'proc', lastAction: '2026-10-03', metadata: {} },
    { id: 'MK-3', name: 'Services', counterparty: 'Acme', status: 'Under Review', folder: 'sales', lastAction: '2026-10-04', metadata: {} },
  ];
  const world = (show = 'wall') => {
    const win = buildWorld({ registerView: true }).win;
    win.state = Object.assign({}, win.state || {}, { view: 'dashboard', contracts: BOOK.map(c => ({ ...c })) });
    win.contractOwnerName = c => (c.owner && c.owner.name) || '';
    win.__open = []; win.pdOpenOnHome = (id, tab) => { win.__open.push([id, tab]); return true; };
    win.insForce(true);   // a wide screen: the place still draws no inspector
    const host = win.document.createElement('div'); host.id = 'ct-place'; win.document.body.appendChild(host);
    win.regPlaceSet({ show });
    win.renderRegister({ home: true, hostId: 'ct-place', nav: 'register' });
    return { win, doc: win.document, host };
  };
  /* RE-POINTED 16 Oct 2026 (owner: "bring the highlighted filters above to the
     level below just above the bigger card. Then, take the status choices and
     put them in a dropdown as well", quick filters last): the name and Wall |
     List on the first row; Stage · Stream · Category · Quick filters and Adapt
     filters on the row under it; no stage tabs. */
  test('2a the head: the name, the facts line and Wall | List; the four filter boxes and Adapt filters under them', () => {
    const { doc } = world();
    const head = doc.querySelector('[data-reg-home] .ct-head');
    assert.ok(head, 'the one head');
    assert.equal(head.querySelector('.ct-h').textContent, 'Contracts');
    assert.ok(head.querySelector('#reg-head-facts'), 'the facts line\'s slot');
    const top = head.querySelector('.ct-top'), row = head.querySelector('.ct-filters');
    assert.equal(top.querySelectorAll('select').length, 0, 'no filter box on the first row');
    assert.deepEqual([...top.querySelectorAll('[data-ct-show]')].map(b => b.getAttribute('data-ct-show')), ['wall', 'list']);
    assert.deepEqual([...row.querySelectorAll('.reg-fb select')].map(x => x.id), ['reg-stage-sel', 'reg-type-sel', 'reg-category', 'reg-view-sel'],
      'Stage · Stream · Category · Quick filters, in that order');
    assert.equal(doc.querySelectorAll('[data-reg-home] [data-reg-stage]').length, 0, 'no stage tabs');
    assert.ok(row.querySelector('.ct-adapt #reg-adapt'), 'Adapt filters at the filter row\'s end');
    assert.equal(doc.querySelectorAll('#reg-type-sel').length, 1, 'one set of filters');
  });
  test('2b the Wall: the very rows the List holds, under the same head; no table', () => {
    const { win, doc } = world('wall');
    const page = doc.querySelector('[data-reg-home]');
    assert.equal(page.getAttribute('data-ct-show'), 'wall');
    assert.ok(doc.getElementById('ig-wall'), 'the wall');
    assert.ok(!doc.getElementById('reg-tbody'), 'no table on the Wall');
    assert.equal(win.regFiltered().length, 3);
  });
  test('2c the List: the same builder, no inspector, the drawing\'s six columns and the row\'s ⋯, a row\'s one press opens the paper', () => {
    const { win, doc } = world('list');
    assert.ok(!doc.getElementById('ins-panel') && !doc.querySelector('[data-ins-page]'), 'no inspector, nothing for its width watcher');
    assert.equal(win.regInspecting(), false, 'even where the inspector would fit');
    assert.deepEqual(J(win.regColKeys()), ['mk', 'counterparty', 'stage', 'owner', 'expiry', 'value', 'acts']);
    assert.equal(win.REG_COL_W_HOME.reduce((a, b) => a + b, 0), 100, 'the widths sum to 100');
    const heads = [...doc.querySelectorAll('[data-reg-home] .reg-table thead th')].map(th => th.textContent.trim().replace(/[▲▼]/g, '').trim());
    assert.deepEqual(heads, ['Ref', 'Counterparty and agreement', 'Stage', 'Owner', 'Ends', 'Value', ''], 'the drawing\'s six, the ⋯ unheaded');
    assert.equal(doc.querySelectorAll('#reg-tbody [data-row] [data-menu]').length, 3, 'every row keeps its ⋯');
    assert.ok(!doc.getElementById('ig-wall'), 'no wall on the List');
    /* the same builder: its Display cog is the page's, Table · Board, density and the amendment fold (f387 4g) */
    for (const sel of ['button[data-reg-mode="board"]', 'button[data-reg-density="comfortable"]', '#reg-flat'])
      assert.ok(doc.querySelector('#reg-display-pop ' + sel), sel + ' in the List\'s Display');
    const row = doc.querySelector('#reg-tbody [data-row="MK-1"]');
    assert.ok(row.textContent.includes('Amina Otieno'), 'the owner written out');
    row.click();
    /* 'open' is the reader's own "A contract opens on" (pdOpenTabOf, the
       Control Room built in full, 16 Oct 2026): Jambo unless they chose otherwise */
    assert.deepEqual(J(win.__open), [['MK-1', 'open']], 'one press: the contract on Home\'s paper, on the face the reader chose');
  });
  test('2d Wall | List switches the view and keeps the tab and filters', () => {
    const { win, doc } = world('wall');
    win.state.reg.stage = 'Draft'; win.regRepaint();
    doc.querySelector('[data-ct-show="list"]').click();
    assert.equal(win.state.reg.show, 'list'); assert.equal(win.state.reg.stage, 'Draft');
    assert.equal(doc.querySelector('[data-reg-home]').getAttribute('data-ct-show'), 'list');
    assert.deepEqual([...doc.querySelectorAll('#reg-tbody [data-row]')].map(r => r.getAttribute('data-row')), ['MK-2']);
  });
  test('2e a host that is gone draws nothing — never a list over another page', () => {
    const { win, doc } = world('list');
    doc.getElementById('ct-place').remove();
    const content = doc.getElementById('content') || doc.body.appendChild(Object.assign(doc.createElement('div'), { id: 'content' }));
    content.innerHTML = '<p id="other-page">Approvals</p>';
    win.regRepaint();
    assert.ok(doc.getElementById('other-page'), 'the page standing is untouched');
    assert.equal(doc.querySelectorAll('[data-reg-home]').length, 0);
  });
  test('2g a narrow place (an 820 tablet, a 1024 window) draws the List\'s four loudest columns, with no floor', () => {
    const { win, doc, host } = world('list');
    const at = w => { Object.defineProperty(host, 'clientWidth', { configurable: true, get: () => w }); win.regRepaint(); return doc.querySelector('[data-reg-home] .reg-table'); };
    let t = at(win.REG_HOME_NARROW_W - 1);
    assert.deepEqual(J(win.regColKeys()), ['mk', 'counterparty', 'stage', 'acts']);
    assert.equal(win.REG_COL_W_HOME_NARROW.reduce((a, b) => a + b, 0), 100, 'the widths sum to 100');
    assert.equal(t.querySelectorAll('thead th').length, 4);
    assert.ok(t.classList.contains('is-home') && t.classList.contains('is-hnarrow'), 'no floor, and marked narrow for the width watch');
    t = at(win.REG_HOME_NARROW_W + 300);
    assert.deepEqual(J(win.regColKeys()), J(win.REG_COL_KEYS_HOME), 'wide again: the drawing\'s six and the ⋯');
    assert.ok(t.classList.contains('is-home') && !t.classList.contains('is-hnarrow'));
    assert.match(HTML, /#reg-scroll>table\.reg-table\.is-home\{min-width:0;\}/, 'the window\'s floor never applies to the place');
  });
  test('2f the Negotiations seat is untouched: its own tabs, its inspector, its columns', () => {
    const { win } = world('list');
    win.renderRegister({ scope: 'negotiations', nav: 'redline' });
    assert.equal(win.regHome(), false);
    assert.equal(win.regScope(), 'negotiations');
    assert.notDeepEqual(J(win.regColKeys()), J(win.REG_COL_KEYS_HOME), 'not the place\'s columns');
  });
});

describe('f687 (3) the rail: the fold keeps Negotiations and Parties; the opener is the Contracts door', () => {
  const fold = (() => { const a = HTML.indexOf('<div class="nav-fold" data-nav-fold="register">'); const b = HTML.indexOf('<!-- APPROVALS & SIGNING', a);
    assert.ok(a > 0 && b > a, 'the fold'); return HTML.slice(a, b).replace(/<!--[\s\S]*?-->/g, ''); })();
  test('3a two items in the fold, in this order; no Contracts item and no Contracts count anywhere', () => {
    assert.deepEqual([...fold.matchAll(/<button data-view="([a-z]+)" class="nav-item" role="menuitem"/g)].map(m => m[1]), ['redline', 'customers']);
    assert.doesNotMatch(HTML.replace(/<!--[\s\S]*?-->/g, ''), /data-view="register"|data-count="register"/);
    assert.match(fold, /data-nav-fold-open="register"[^>]*data-i18n-title="nav_contracts_group_title"/);
    assert.match(fold, /data-i18n="nav_contracts">Contracts<\/span>/, 'the opener keeps its name');
    assert.doesNotMatch(APP, /NAV_COUNT_TONE=\{register:/, 'the count went with its item');
  });
  /* RE-POINTED 15 Oct 2026 (the checkers of step 7): a fly-out left open by a
     mouse press covered the place's own head, so a pointer that can hover
     gets the place alone (navFoldRest, until it leaves the row); the keyboard
     and a touch screen still get the fly-out from the press */
  test('3b a press on the opener opens the place; the fly-out too for the keyboard, or a tap ON the place on a screen with no hover; pressed again on the place, the fly-out shuts', () => {
    /* RE-POINTED 15 Oct 2026 (owner: "go with your suggestions"): a TOUCH from
       anywhere else opens the place alone; a touch ON the place brings the
       fly-out (nav-fold-verify 7a–7c press it); the keyboard keeps both */
    assert.match(APP, /const k=opener\.getAttribute\('data-nav-fold-open'\);\s*const here=k==='register' && !!\(window\.regPlaceUp&&regPlaceUp\(\)\);\s*if\(f\.classList\.contains\('is-open'\) && \(k!=='register' \|\| here\)\) navFoldCloseAll\(\);\s*else if\(k!=='register'\) navFoldOpen\(f, e\.detail===0\);\s*else \{ setView\('register'\);\s*if\(!navFoldPressFlies\(e\)\) navFoldRest\(f\);\s*else if\(e\.detail===0 \|\| here\) navFoldOpen\(f, e\.detail===0\);\s*else navFoldCloseAll\(\); \}/);
    const src = APP.slice(APP.indexOf('function navFoldPressFlies('), APP.indexOf('function wireNavFolds('));
    const flies = hover => { const ctx = { matchMedia: () => ({ matches: hover }) }; vm.createContext(ctx);
      vm.runInContext(src.replace(/function navFoldRest[\s\S]*$/, '') + '\nthis.f=navFoldPressFlies;', ctx); return ctx.f; };
    assert.equal(flies(true)({ detail: 1, pointerType: 'mouse' }), false, 'a mouse that can hover: the place alone');
    assert.equal(flies(true)({ detail: 0 }), true, 'the keyboard: the fly-out too');
    assert.equal(flies(true)({ detail: 1, pointerType: 'touch' }), true, 'a finger: the fly-out too');
    assert.equal(flies(false)({ detail: 1 }), true, 'a screen with no hover: the fly-out too');
    /* the hover steps aside after the press until the pointer has left */
    assert.match(APP, /f\.addEventListener\('mouseenter',\(\)=>\{ if\(f\._navFoldRest\) return;/);
    assert.match(APP, /f\.addEventListener\('mouseleave',\(\)=>\{ f\._navFoldRest=false;/);
  });
  test('3c the opener lights on the place, and on the folder and the room as before', () => {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(`<nav id="nav">${fold}</nav><button class="nav-item" data-view="dashboard"></button>`);
    const ctx = { document: dom.window.document, openNavSection: () => {} };
    vm.createContext(ctx);
    vm.runInContext(APP.slice(APP.indexOf('const NAV_HOME_FOR='), APP.indexOf('const NAV_FOLD_GRACE_MS')) + '\nthis.lit=setActiveNav;', ctx);
    const head = dom.window.document.querySelector('.nav-fold-head');
    for (const [v, on] of [['register', true], ['workspace', true], ['folder', true], ['redline', true], ['customers', true], ['dashboard', false], ['approvals', false]]){
      ctx.lit(v); assert.equal(head.classList.contains('is-current'), on, v); }
    ctx.lit('register'); assert.equal(head.getAttribute('aria-current'), 'page', 'said to a screen reader too');
  });
  test('3d Home lights the opener while the place shows, and Home again once a paper is up', () => {
    assert.match(HB, /setActiveNav\(\(typeof window\.regPlaceUp === 'function' && regPlaceUp\(\)\) \? 'register' : 'dashboard'\)/);
    assert.match(IG, /function igPlaceNav\(on\)\{[^\n]*setActiveNav\(on\?'register':'dashboard'\); \}/);
    assert.match(fnBody(IG, 'igPaintPaper'), /if\(homePaper!==null\) igPlaceNav\(false\);/);
  });
});

describe('f687 (4) the words, in both books', () => {
  const I18N = R('js/i18n.js');
  const both = k => (I18N.match(new RegExp('^\\s+' + k + ': \'', 'gm')) || []).length === 2;
  test('4a Wall · List · Show as, and the brain\'s part, in English and Swedish', () => {
    for (const k of ['ct_show_as', 'ct_wall', 'ct_list', 'ca_go_list', 'ca_go_contracts', 'brn_p_contractsplace', 'brn_pd_contractsplace']) assert.ok(both(k), k);
    assert.ok(I18N.includes("ct_wall: 'Vägg'") && I18N.includes("ct_list: 'Lista'"));
  });
  test('4b a stage says the stage\'s own word in the reader\'s language, in the tabs and the Stage box alike', () => {
    const REG = strip(R('js/views/register.js'));
    assert.match(fnBody(REG, 'regStageWord'), /if\(k!=='awaiting'&&typeof statusLabel==='function'&&typeof STATUS_META!=='undefined'&&STATUS_META\[k\]\) return statusLabel\(k\);/);
    assert.match(fnBody(REG, 'regStageTabsHtml'), /esc\(regStageWord\(k\)\)/);
    assert.match(fnBody(REG, 'regStageOptsHtml'), /esc\(regStageWord\(k\)\+\(n\?` \(\$\{n\}\)`:''\)\)/);
  });
  test('4c the paper\'s way back names the place: ‹ Contracts', () => {
    assert.match(IG, /data-ig-pick-again>\$\{icon\('chevL','w-3\.5 h-3\.5'\)\}\$\{igEsc\(i18t\('nav_contracts'\)\)\}<\/button>/);
  });
});
