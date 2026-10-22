/* ============================================================
   f495 — ADVICE IS A KIND OF REQUEST (the process review, gap F,
   4 Oct 2026)
   ============================================================
   Two queues of one shape had two rail doors: Requests (a colleague asks
   for a contract) and the Advice Desk (a customer asks for advice, a review
   or a draft). One door now, and the kind is the Requests page's first tab
   row: Contracts · Advice. A DOOR MERGE, NOT A DATA MERGE — the Advice tab
   is the Advice desk board under its own view id, so its records, routes,
   rates, the public portal and the tracking page are untouched, and every
   link to it still lands.

   WHAT THIS FILE PINS
     (1) the rail has no Advice door; Requests is the one door
     (2) the page draws the kind tabs on both of its shapes and on the board,
         and a press on the other kind is a page change
     (3) the old view id still routes, still restores on a refresh, lights
         Requests and wears the page's name
     (4) THE RELATION, not a number: the door is the sum of the two tabs, each
         tab is its own book's count, a zero prints nothing, and the tabs move
         on the door's own beat
     (5) the tab row does not move between the tabs: the Advice tab's frame and
         head follow the Requests page's width line
     (6) the advice records, routes and portal are what they were
     (7) every new word is in both books
   The driven half — a real Chromium against a real server — is
   test/chromium/advice-is-a-request-verify.js.

   Run: node --test test/f495-advice-is-a-kind-of-request.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const read = p => { try{ return fs.readFileSync(path.join(__dirname, '..', p), 'utf8'); } catch(_){ return ''; } };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
const fnBody = (src, name) => {
  const m = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(src);
  if (!m) return '';
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0){ const ch = src[i]; if (ch === '{') depth++; else if (ch === '}') depth--; i++; }
  return src.slice(m.index, i);
};
const HTML = strip(read('index.html'));
const RAIL = HTML.slice(HTML.indexOf('<nav'), HTML.indexOf('</nav>'));
const IK = read('js/views/intake.js');
const ADV = read('js/views/advice.js');
const APP = read('js/app.js');
const CORE = read('js/core.js');
const INS = read('js/views/inspector.js');
const SRV = read('server/server.js');
const EN = read('js/i18n.js');

function rqWorld(intake, advice){
  const w = buildWorld({ intakeView: true });
  const win = w.win;
  win.state = Object.assign(win.state || {}, { contracts: [], settings: (win.state && win.state.settings) || {} });
  win.currentUser = () => ({ id: 'u1', name: 'Young Mbagaya', role: 'admin' });
  win.canEdit = () => true;
  win._intakeState.list = intake || [];
  /* js/advice.js is not on this stage; its one reading is stood in for, so
     what is measured is the page's ARITHMETIC over the two books. */
  win.adviceActiveCount = () => (advice || []).filter(r => ['Submitted', 'Scoping', 'In Progress'].includes(r.status)).length;
  /* RE-POINTED 19 Oct 2026 (lane A3's second pass): the team's Advice tab is
     a cut of the list and counts the list's own rows (ikBase), so the advice
     book itself is on the stage too, not only the door's count */
  win.state.advice = (advice || []).map(a => ({ name: 'Faith Njeri', submittedAt: new Date().toISOString(), ...a }));
  return win;
}
const REQ = (id, status) => ({ id, title: 'NDA ' + id, need: 'x', status: status || 'open', by: { id: 'u9', name: 'Faith Njeri' },
  createdAt: new Date().toISOString() });
const AR = (id, status) => ({ id, status });

describe('f495 (1) one door for both kinds of request', () => {
  test('1a the rail carries no Advice desk door, and no Advice count', () => {
    assert.ok(RAIL.length > 1000, 'the rail was found');
    assert.ok(!/data-view="advice"/.test(RAIL), 'the second door is gone');
    assert.ok(!/data-count="advice"/.test(RAIL), 'and its count with it');
  });
  test('1b Requests is still the door, carrying its count', () => {
    assert.match(RAIL, /data-view="intake"[^>]*data-i18n-title="nav_intake_title"/);
    assert.match(RAIL, /data-count="intake"/);
  });
});

describe('f495 (2) the kind is the page\'s first tab row', () => {
  test('2a one list, Contracts then Advice, each naming its view', () => {
    const win = rqWorld();
    assert.deepEqual(Array.from(win.RQ_KINDS), ['contracts', 'advice']);
    assert.equal(win.RQ_KIND_VIEW.contracts, 'intake');
    assert.equal(win.RQ_KIND_VIEW.advice, 'advice');
  });
  /* RE-POINTED IN PLACE 9 Oct 2026 (SAP benchmark, batch 2 — the owner's
     "go"; the drawing is the target): the kind row and the views row under
     it became ONE row — Open · Mine · Advice · Finished this month · All.
     Advice is still its own view (a door merge, not a data merge); the other
     four are views of the contracts queue.
     RE-POINTED 21 Oct 2026 (Part 8, the Legora way: a tab with no rows is
     left out unless it is lit or All, on every list): the book holds a row in
     every view, so all five stand; a view with none is not drawn. */
  test('2b ONE row, the views and Advice third, lit where asked; a view with no rows left out', () => {
    const now = new Date().toISOString();
    const win = rqWorld([REQ('R1'), { ...REQ('R2'), by: { id: 'u1', name: 'Young Mbagaya' } }, { ...REQ('R3', 'done'), decidedAt: now }], [AR('A1', 'Submitted')]);
    const host = win.document.createElement('div');
    host.innerHTML = win.rqKindTabsHtml('advice');
    const row = host.querySelector('.rq-kinds[role="tablist"]');
    assert.ok(row, 'the one tab row');
    const tabs = [...row.querySelectorAll('[role="tab"][data-rq-kind]')];
    /* the team's Advice tab is a cut of the one list since the owner's "build
       them the SAP way" (9 Oct 2026): every tab is a view of the list */
    assert.deepEqual(tabs.map(b => b.getAttribute('data-rq-kind')), ['contracts', 'contracts', 'contracts', 'contracts', 'contracts']);
    assert.deepEqual(tabs.map(b => b.getAttribute('data-ik-view')), ['open', 'mine', 'advice', 'fin', 'all']);
    assert.deepEqual(tabs.map(b => b.classList.contains('on')), [false, false, true, false, false]);
    assert.deepEqual(tabs.map(b => b.getAttribute('aria-selected')), ['false', 'false', 'true', 'false', 'false']);
    assert.match(tabs[0].textContent, /^Open/);
    assert.match(tabs[1].textContent, /^Mine/);
    assert.match(tabs[2].textContent, /^Advice/);
    const lit = win.document.createElement('div');
    lit.innerHTML = win.rqKindTabsHtml('contracts');
    assert.equal(lit.querySelector('.on').getAttribute('data-ik-view'), 'open', 'on Requests, the view the reader is on');
    const thin = rqWorld([REQ('R1')], []);
    const t = thin.document.createElement('div');
    t.innerHTML = thin.rqKindTabsHtml('contracts');
    assert.deepEqual([...t.querySelectorAll('[role="tab"]')].map(b => b.getAttribute('data-ik-view')), ['open', 'all'], 'Mine, Advice and Finished hold nothing: left out');
  });
  /* RE-POINTED 21 Oct 2026 (Part 8, the Legora way): the wide page's band is
     REVERSED — the list head stands under the page's head (the box, the tabs
     from the same one reading, ikTabViews, then the chips) and its presses
     are the head's own, delegated (no tab is bound one by one there); the
     narrow page still draws this row first and wires it */
  test('2c both shapes of the Requests page draw the tab row first (the wide one in its list head), and wire it', () => {
    const narrow = strip(fnBody(IK, 'renderIntake'));
    assert.match(narrow, /data-ins-page="intake" data-ins="0">\s*\$\{rqKindTabsHtml\('contracts'\)\}/, 'renderIntake draws the row first');
    assert.match(narrow, /rqKindTabsWire\(host\)/, 'renderIntake wires it');
    const wide = strip(fnBody(IK, 'renderIntakeInspector'));
    assert.match(wide, /data-ins-page="intake" data-ins="1">\s*\$\{typeof lhHtml==='function'\?lhHtml\(IK_SEAT,\{ frame:'foot' \}\):''\}/, 'the wide page: its list head first');
    assert.match(strip(fnBody(IK, 'ikLhRegister')), /tabAttr:'data-ik-view'[\s\S]*tabs:\(\)=>ikTabViews\(asker\)/, 'its tabs: the same one reading, the same attribute');
    for (const name of ['renderIntakeInspector', 'ikPaintRows'])
      assert.doesNotMatch(strip(fnBody(IK, name)), /\[data-ik-view\]'\)\.forEach|\[data-ik-f\]|rqKindTabsWire/, name + ' binds no tab or box of its own: the head\'s presses are delegated');
  });
  test('2d the Advice desk board draws it lit on Advice, before the board, and wires it', () => {
    const fn = strip(fnBody(ADV, 'renderAdviceDesk'));
    assert.match(fn, /rqKindTabsHtml\('advice'\)/);
    assert.ok(fn.indexOf("rqKindTabsHtml('advice')") < fn.indexOf('board-cols'), 'above the board');
    assert.match(fn, /rqKindTabsWire\(/);
  });
  /* RE-POINTED 9 Oct 2026 (the owner: build it the SAP way): for the team the
     Advice tab is a cut of the Requests list, so from the advice board it
     lands on Requests with the Advice cut chosen; on Requests itself every
     tab is the page's own business.
     RE-POINTED 21 Oct 2026 (Part 8): the book holds an open advice request,
     so the Advice tab stands (a tab with no rows is left out) */
  test('2e on Requests a tab is the page\'s own; from the advice board, Advice lands on the Advice cut', () => {
    const win = rqWorld([], [AR('A1', 'Submitted')]);
    const went = [];
    win.setView = v => went.push(v);
    const host = win.document.createElement('div');
    host.innerHTML = win.rqKindTabsHtml('contracts');
    win.state.view = 'intake';
    win.rqKindTabsWire(host);
    host.querySelector('[data-rq-kind="contracts"]').click();
    assert.deepEqual(went, [], 'a queue tab on the queue\'s own page is the page\'s own business');
    host.querySelector('[data-ik-view="advice"]').click();
    assert.deepEqual(went, [], 'and so is Advice');
    win.state.view = 'advice';
    host.querySelector('[data-ik-view="advice"]').click();
    assert.deepEqual(went, ['intake'], 'from the board, it goes to Requests');
    assert.equal(win.ikFilters().view, 'advice', 'with the Advice cut chosen');
    win.rqKindTabsWire(host);
    host.querySelector('[data-ik-view="advice"]').click();
    assert.deepEqual(went, ['intake', 'intake'], 'wired twice, a press still goes once');
  });
});

describe('f495 (3) the old view id still lands, on the Advice tab of Requests', () => {
  test('3a it still routes, and a refresh still restores it', () => {
    assert.match(APP, /else if\(view==='advice'\) renderAdviceDesk\(\)/);
    const restore = /setView\(\[([^\]]*)\]\.includes\(state\.view\)/.exec(CORE);
    assert.ok(restore && /'advice'/.test(restore[1]), 'the view a refresh comes back to');
    assert.match(CORE, /if\(state\.view==='advice'\) renderAdviceDesk\(\)/, 'and the list landing repaints it');
  });
  test('3b it lights the Requests door — in the table setView asks after the paint', () => {
    const line = APP.slice(APP.indexOf('const NAV_HOME_FOR='), APP.indexOf('function setActiveNav'));
    assert.match(line, /advice:'intake'/);
    const fn = strip(fnBody(ADV, 'renderAdviceDesk'));
    assert.match(fn, /setActiveNav\('intake'\)/);
    assert.ok(!/setActiveNav\('advice'\)/.test(fn));
  });
  test('3c its head wears the page\'s name', () => {
    assert.match(APP, /case 'advice':\s+return \[i18t\('nav_intake'\)/);
  });
});

describe('f495 (4) the door is the sum of the tabs it opens', () => {
  const intake = [REQ('R1'), REQ('R2'), REQ('R3', 'declined')];
  const advice = [AR('A1', 'Submitted'), AR('A2', 'In Progress'), AR('A3', 'Scoping'), AR('A4', 'Delivered'), AR('A5', 'Closed')];
  test('4a each tab is its own book\'s count, and the door adds them', () => {
    const win = rqWorld(intake, advice);
    const n = win.rqKindCounts();
    assert.equal(n.contracts, win.intakeCount(), 'Contracts is the number the Requests door always carried');
    assert.equal(n.advice, win.adviceActiveCount(), 'Advice is the number the Advice door carried');
    assert.equal(win.requestsDoorCount(), n.contracts + n.advice);
    assert.equal(n.contracts, 2, '[control] a declined request is not waiting');
    assert.equal(n.advice, 3, '[control] delivered and closed advice is not open');
  });
  /* RE-POINTED 21 Oct 2026 (Part 8, the Legora way): a zero tab is no
     longer drawn with its number hidden — it is left out (unless lit or All) */
  test('4b the tabs print those numbers, and a zero tab is left out', () => {
    const win = rqWorld([], advice);
    const host = win.document.createElement('div');
    host.innerHTML = win.rqKindTabsHtml('contracts');
    /* each queue tab counts the list it opens (re-pointed 9 Oct 2026: one row) */
    const c = host.querySelector('[data-ik-view="open"] .n'), a = host.querySelector('[data-rq-n="advice"]');
    /* RE-POINTED 19 Oct 2026 (lane A3's second pass): the Open list holds the
       open advice requests too, so its tab counts them — the number is the
       list it opens; Mine (no request of the reader's) prints nothing */
    assert.equal(c.textContent, '3', 'the Open list\'s own count');
    assert.equal(host.querySelector('[data-ik-view="mine"]'), null, 'no queue of mine, no tab');
    assert.equal(a.hidden, false);
    assert.equal(a.textContent, '3');
  });
  /* RE-POINTED 21 Oct 2026 (Part 8): the Advice tab is left out while it
     holds nothing, so the beat draws the row again when the advice lands */
  test('4c the tabs move on the door\'s own beat, in place', () => {
    const win = rqWorld([REQ('R1')], []);
    /* Re-pointed 9 Oct 2026 (one row): the advice count is the one that moves
       on the door's beat with no page paint (the advice list lands after the
       first paint); the queue's counts are repainted with the queue. */
    win.document.body.insertAdjacentHTML('beforeend', `<div id="band">${win.rqKindTabsHtml('contracts')}</div>`);
    const a = () => win.document.querySelector('[data-rq-n="advice"]');
    assert.equal(a(), null, 'no advice yet: no Advice tab');
    win.adviceActiveCount = () => 2;
    /* re-pointed 19 Oct 2026: the advice book lands, the tab counts it */
    win.state.advice = [{ id: 'A1', status: 'Submitted' }, { id: 'A2', status: 'Scoping' }];
    win.rqPaintKindCounts();
    assert.equal(a().textContent, '2', 'repainted without a page paint');
    assert.equal(a().hidden, false);
    assert.equal(win.document.querySelectorAll('#band .rq-kinds').length, 1, 'the row is drawn again in its place, once');
    const fn = strip(fnBody(APP, 'updateSidebarCounts'));
    assert.match(fn, /intake: \(typeof requestsDoorCount==='function'\)\?requestsDoorCount\(\)/, 'the door asks the one sum');
    assert.match(fn, /rqPaintKindCounts\(\)/, 'and the same paint writes the tabs');
    assert.ok(!/\badvice:/.test(fn), 'no count is kept for a door that is gone');
  });
});

describe('f495 (5) the tab row holds still between the tabs', () => {
  test('5a the board\'s frame follows the Requests page\'s width line', () => {
    const fn = strip(fnBody(ADV, 'renderAdviceDesk'));
    assert.match(fn, /insFits\(\)/);
    assert.match(fn, /data-ins-page="advice" data-ins="\$\{fits\?'1':'0'\}"/);
    assert.match(fn, /padding:\$\{fits\?'0':'var\(--page-pad-t\)'\}/, 'flush where the inspector page is, padded where the plain page is');
    assert.match(INS, /advice: 'renderAdviceDesk'/, 'and a resize across the line repaints it');
  });
  test('5b the head holds no facts line, as the Requests tab draws none', () => {
    assert.match(APP, /PAGE_HEAD_PAINT = \{[^}]*advice:'adviceHeadPaint'/);
    const fn = strip(fnBody(ADV, 'adviceHeadPaint'));
    assert.match(fn, /textContent=''/, 'it says nothing there');
    /* re-pointed 9 Oct 2026 (SAP benchmark, batch 2): Requests prints no
       facts line under its name now, so Advice holds none either */
    assert.match(fn, /classList\.remove\('is-held'\)/);
    assert.match(HTML, /\.page-facts\.is-held:empty\{display:block;min-height:1\.4em;\}/);
  });
});

describe('f495 (6) the advice records, routes and portal are what they were', () => {
  test('6a the five routes stand', () => {
    for (const r of [/app\.get\('\/api\/advice\/rates'/, /app\.post\('\/api\/advice\/requests', rlAdvice/,
      /app\.get\('\/api\/advice\/track\/:token'/, /app\.get\('\/api\/advice\/requests', auth, templateManager/,
      /app\.put\('\/api\/advice\/requests\/:id', auth, editor/])
      assert.match(SRV, r);
  });
  test('6b the portal still answers its links, and the board still draws its five stages', () => {
    assert.match(APP, /const adv=location\.hash\.match\(\/\^#advice/);
    assert.match(strip(fnBody(ADV, 'renderAdviceDesk')), /ADVICE_STAGES\.map/);
  });
});

describe('f495 (7) both books', () => {
  for (const k of ['rq_kinds_label', 'rq_kind_contracts', 'rq_kind_advice', 'nav_intake_title'])
    test(k + ' is in English and Swedish', () =>
      assert.equal((EN.match(new RegExp('\\n    ' + k + ':', 'g')) || []).length, 2));
  test('the Swedish tabs are Swedish (the second book\'s line, read off the source)', () => {
    const second = k => { const all = [...EN.matchAll(new RegExp('\\n    ' + k + ': "([^"]*)"', 'g'))]; return all[1] ? all[1][1] : null; };
    assert.equal(second('rq_kind_contracts'), 'Avtal');
    assert.equal(second('rq_kind_advice'), 'Rådgivning');
    assert.equal(second('rq_kinds_label'), 'Typ av förfrågan');
  });
});
