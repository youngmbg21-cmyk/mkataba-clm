'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f830 — THE SLIDER ON EVERY JAMBO PANEL (owner, 19 Oct 2026: "all the new
   jambo panels do not have a slider like in the redline page. They should
   all have one.")

   The drag divider between a page and Jambo's panel — the Redlines page's and
   Home's — is ONE builder and ONE wiring (js/components.js: splitHtml ·
   splitFit · splitWire · splitClamp), and every Jambo side panel is its
   client: Home on every face (igFitSplit), the panel beside the lists and
   Import (jlFrame, jlLayout) and Settings (stSideHtml, stSplitFit).
   This file pins the READINGS and the WALLS:
     (1) one builder, three clients, one dress — never a second look
     (2) the grip: a separator, named in both books, reachable by keyboard,
         hidden while its panel is folded
     (3) the wiring: the pointer's POSITION with the grab offset; pointerup
         AND pointercancel let go; ArrowLeft widens and ArrowRight narrows by
         max(8px, 2%); Home, Enter and a double-click put the rest back and
         forget the choice; a floor is marked; folded or stacked, no grip
     (4) the list panel: its width is ONE value (--jl-w) the panel, the page
         head, the page's scroller and insFits all read; floors 340 and the
         list's own — at least INS_MIN_W − 340, and a list drawn as a fixed
         table keeps its fixed columns + 170 for the column that takes the
         rest (MEASURED: past that, People's names and Approvals' parties
         fell to nothing); one key for every list page and Import
     (5) Settings: the track is --st-side-w, resting at the stylesheet's own
         380 / 344; floors 340 and the measured board 780; its own key
   The pixels — a real drag at the owner's three screens, the page following,
   the scrollbar beside the seam still pressable, a refresh keeping the
   width — are for a browser check (not added in this round, owner's
   instruction 19 Oct 2026; GitHub's checks run the existing ones).
   AT THE PARENT (4221f12) every test here fails: there is no builder, no grip
   on the list panel or Settings, and the widths are 380px literals.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const CMP = read('js/components.js');
const IG = read('js/views/intelligence.js');
const INS = read('js/views/inspector.js');
const SET = read('js/views/settings.js');
const MIG = read('js/views/migration.js');
const HTML = read('index.html');
const I18N = read('js/i18n.js');
const fnOf = (src, name) => { const i = src.search(new RegExp('(?:^|\\n)function ' + name + '\\(')); if (i < 0) return ''; const j = src.indexOf('function ' + name + '(', i); return src.slice(j, src.indexOf('\n}', j) + 2); };
const objOf = (src, name) => { const i = src.indexOf('const ' + name + ' = {'); const k = i < 0 ? src.indexOf('const ' + name + '={') : i; return k < 0 ? '' : src.slice(k, src.indexOf('\n};', k) + 3); };

/* the builder alone, on a bare page: a grip, a host whose geometry is stated */
function stage(over = {}){
  const dom = new JSDOM('<!doctype html><html><body><div id="row"><div id="grip-host"></div></div></body></html>', { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  win.i18t = k => ({ int_drag_width: 'Drag to set how wide the panel is · double-click to reset' }[k] || k);
  win.eval(CMP);
  const log = { applied: [], settled: 0, dragging: [] };
  const geo = { avail: 1440, edge: 1440, folded: false, off: false };
  const h = Object.assign({ key: 'hati.v1.testW', w0: 380, min: 340, restMin: 700, foldedW: 46,
    folded: () => geo.folded, off: () => geo.off, avail: () => geo.avail, edge: () => geo.edge,
    apply: w => log.applied.push(w), settle: () => { log.settled++; }, dragging: on => log.dragging.push(on) }, over);
  const host = win.document.getElementById('grip-host');
  host.innerHTML = win.splitHtml({ id: 'test-resizer', min: 340 });
  const rez = win.document.getElementById('test-resizer');
  /* the strip's left edge is where the panel's width says the seam is */
  rez.getBoundingClientRect = () => { const w = log.applied.length ? log.applied[log.applied.length - 1] : 380; const l = geo.edge - w; return { left: l, right: l + 14, top: 0, bottom: 700, width: 14, height: 700 }; };
  win.splitWire(rez, h);
  const ev = (type, x, extra) => { const e = new win.Event(type, { bubbles: true, cancelable: true }); e.clientX = x; Object.assign(e, extra || {}); return e; };
  const key = k => rez.dispatchEvent(new win.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  const stored = () => win.localStorage.getItem(h.key);
  return { win, rez, h, geo, log, ev, key, stored, now: () => log.applied[log.applied.length - 1] };
}

describe('f830 (1) one builder, three clients, one dress', () => {
  test('1a the builder is components.js\'s and publishes its parts', () => {
    for (const n of ['splitHtml', 'splitPref', 'splitSave', 'splitClamp', 'splitWidth', 'splitFit', 'splitWire'])
      assert.match(CMP, new RegExp('\\nfunction ' + n + '\\('), n + ' is defined once, in the builder');
    assert.match(CMP, /Object\.assign\(window,\{SPLIT_GRIP,splitHtml,splitPref,splitSave,splitClamp,splitWidth,splitFit,splitWire\}\);/);
  });
  test('1b Home, the panel beside the lists (and Import) and Settings are its clients', () => {
    assert.match(code(fnOf(IG, 'igFitSplit')), /splitFit\(rez, IG_SPLIT\)/, 'Home\'s one pass is the builder\'s');
    assert.match(code(fnOf(IG, 'igWireSplit')), /splitWire\(rez, IG_SPLIT\)/, 'Home\'s wiring is the builder\'s');
    assert.match(code(fnOf(INS, 'jlFrame')), /splitHtml\(\{ id: 'jl-resizer', min: JL_MIN, hidden: jlFolded\(\) \}\)/, 'the list panel\'s frame draws the grip');
    assert.match(code(fnOf(INS, 'jlLayout')), /splitWire\(rez, JL_SPLIT\)/, 'and its layout pass wires and fits it');
    assert.match(code(fnOf(MIG, 'migSidePaint')), /jlFrame\(host,/, 'Import wears the same frame');
    assert.match(code(fnOf(SET, 'stSideHtml')), /splitHtml\(\{ id:'st-resizer', min:ST_SIDE_MIN, hidden:_stSideFold \}\)/, 'Settings\' panel draws the grip');
    assert.match(code(fnOf(SET, 'stSplitFit')), /splitWire\(rez, ST_SPLIT\)/, 'and wires it');
    assert.match(code(fnOf(SET, 'stPagePaint')), /stSplitFit\(\);\s*stSideFitWire\(\); stSideFit\(\);/, 'the width is set before the panel\'s height is measured');
  });
  test('1c one look: no file draws a resizer class of its own for these panels; the grips start on the seam', () => {
    assert.doesNotMatch(code(INS) + code(SET) + code(MIG), /class="[^"]*resizer|role="separator"/, 'the list panel, Import and Settings draw no grip of their own');
    assert.doesNotMatch(code(fnOf(IG, 'renderIntel')), /role="separator"/, 'Home draws none of its own either');
    assert.match(HTML, /#content \.ins-panel\.is-jambo > \.ig-resizer\{left:-1px;\}/);
    assert.match(HTML, /\.st-cr \.st-side > \.ig-resizer\{ left:-1px; \}/);
  });
});

describe('f830 (2) the grip', () => {
  test('2a a separator, vertical, reachable by keyboard, named in both books, hidden when asked', () => {
    const s = stage();
    const r = s.rez;
    assert.equal(r.getAttribute('role'), 'separator');
    assert.equal(r.getAttribute('aria-orientation'), 'vertical');
    assert.equal(r.getAttribute('tabindex'), '0');
    assert.equal(r.getAttribute('aria-valuemin'), '340');
    assert.equal(r.getAttribute('aria-label'), 'Drag to set how wide the panel is · double-click to reset');
    assert.equal(r.getAttribute('title'), r.getAttribute('aria-label'));
    assert.ok(r.classList.contains('ig-resizer'), 'Home\'s dress');
    assert.ok(r.querySelector('span'), 'the grip inside the strip');
    assert.equal((I18N.match(/^\s*int_drag_width:/mg) || []).length, 2, 'its words in both books');
    s.win.document.getElementById('grip-host').innerHTML = s.win.splitHtml({ id: 'x', min: 340, hidden: true });
    assert.equal(s.win.document.getElementById('x').hidden, true);
  });
});

describe('f830 (3) the wiring', () => {
  test('3a at rest: the resting width, written by the host, the width said to a reader of the page', () => {
    const s = stage();
    assert.equal(s.now(), 380);
    assert.equal(s.rez.hidden, false);
    assert.equal(s.rez.getAttribute('aria-valuenow'), '380');
    assert.equal(s.rez.hasAttribute('data-at-limit'), false);
    assert.equal(s.stored(), null, 'nothing is stored until the reader chooses');
  });
  test('3b a drag follows the pointer\'s POSITION with the grab offset, and is remembered', () => {
    const s = stage();
    /* grabbed 5px inside the strip, whose left edge is the seam at 1060 */
    s.rez.dispatchEvent(s.ev('pointerdown', 1065));
    assert.deepEqual(s.log.dragging, [true], 'the host turns its transition off');
    s.win.dispatchEvent(s.ev('pointermove', 965));
    assert.equal(s.now(), 480, '100px left is 100px wider — the handle does not jump under the finger');
    assert.equal(s.stored(), '480');
    s.win.dispatchEvent(s.ev('pointerup', 965));
    assert.deepEqual(s.log.dragging, [true, false]);
    assert.equal(s.log.settled, 1, 'the page re-measures once the width settles');
    s.win.dispatchEvent(s.ev('pointermove', 600));
    assert.equal(s.now(), 480, 'let go, it no longer follows');
  });
  test('3c a cancelled drag lets go like a lift (iPad)', () => {
    const s = stage();
    s.rez.dispatchEvent(s.ev('pointerdown', 1060));
    s.win.dispatchEvent(s.ev('pointermove', 1000));
    s.win.dispatchEvent(s.ev('pointercancel', 1000));
    s.win.dispatchEvent(s.ev('pointermove', 800));
    assert.equal(s.now(), 440);
    assert.equal(s.rez.dataset.drag, undefined);
  });
  test('3d the floors win and the grip says so: the panel\'s, then the page\'s', () => {
    const s = stage();
    s.rez.dispatchEvent(s.ev('pointerdown', 1060));
    s.win.dispatchEvent(s.ev('pointermove', 1400));
    assert.equal(s.now(), 340, 'the panel keeps its floor');
    assert.equal(s.rez.getAttribute('data-at-limit'), 'min');
    s.win.dispatchEvent(s.ev('pointermove', 100));
    assert.equal(s.now(), 1440 - 700, 'the page beside keeps its floor');
    assert.equal(s.rez.getAttribute('data-at-limit'), 'max');
    s.win.dispatchEvent(s.ev('pointerup', 100));
  });
  test('3e the keys: ArrowLeft widens, ArrowRight narrows, by max(8px, 2%); Home and Enter put it back', () => {
    const s = stage();
    s.key('ArrowLeft');
    assert.equal(s.now(), 380 + Math.round(1440 * 0.02));
    s.key('ArrowRight'); s.key('ArrowRight');
    assert.equal(s.now(), 380 - Math.round(1440 * 0.02));
    s.key('Home');
    assert.equal(s.now(), 380); assert.equal(s.stored(), null, 'Home forgets the choice');
    s.key('ArrowLeft'); s.key('Enter');
    assert.equal(s.now(), 380); assert.equal(s.stored(), null, 'Enter forgets the choice');
    const n = stage(); n.geo.avail = 300;   /* a narrow room: the step is never under 8px */
    assert.equal(Math.max(8, Math.round(300 * 0.02)), 8);
  });
  test('3f a double-click puts the resting width back and clears the store', () => {
    const s = stage();
    s.key('ArrowLeft'); s.key('ArrowLeft');
    assert.ok(s.stored());
    s.rez.dispatchEvent(new s.win.MouseEvent('dblclick', { bubbles: true }));
    assert.equal(s.now(), 380); assert.equal(s.stored(), null);
  });
  test('3g folded, stacked or not drawn, the divider stands down; the folded width is the strip\'s', () => {
    const s = stage();
    s.geo.folded = true; s.win.splitFit(s.rez, s.h);
    assert.equal(s.rez.hidden, true); assert.equal(s.now(), 46);
    s.geo.folded = false; s.win.splitFit(s.rez, s.h);
    assert.equal(s.rez.hidden, false);
    s.geo.off = true; s.win.splitFit(s.rez, s.h);
    assert.equal(s.rez.hidden, true, 'stacked: no grip');
    s.geo.off = false; s.geo.avail = 0; s.win.splitFit(s.rez, s.h);
    assert.equal(s.rez.hidden, true, 'no room measured: no grip');
  });
  test('3h a stored width is re-fitted to a smaller window (re-fit on resize)', () => {
    const s = stage();
    s.win.localStorage.setItem('hati.v1.testW', '700');
    s.geo.avail = 1366; s.win.splitFit(s.rez, s.h);
    assert.equal(s.now(), 1366 - 700, 'the page keeps its floor on the smaller screen');
    assert.equal(s.stored(), '700', 'the reader\'s choice is kept for a wider one');
  });
  test('3i bound once per grip element', () => {
    const s = stage();
    s.win.splitWire(s.rez, s.h); s.win.splitWire(s.rez, s.h);
    s.key('ArrowLeft');
    assert.equal(s.now(), 380 + Math.round(1440 * 0.02), 'one step per press, not three');
  });
});

describe('f830 (4) the panel beside the lists, and Import', () => {
  const fixture = (id, over = {}) => ({ id, name: 'Agreement ' + id, counterparty: 'Kabras Sugar', template: 'RM', status: 'Under Review', folder: 'proc',
    fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [], value: 1200000, lastAction: '01 Jul 2026', ...over });
  function listWorld(){
    const w = buildWorld({ registerView: true });
    const { win } = w;
    const list = [fixture('MK-1'), fixture('MK-2')];
    win.state = Object.assign({}, win.state, { contracts: list, activeId: null, view: 'register' });
    win.getContract = id => list.find(c => c.id === id) || null;
    if (typeof win.contractOwnerName !== 'function') win.contractOwnerName = c => (c && c.owner && c.owner.name) || '';
    win.selectContract = () => {}; win.openWorkspace = () => {}; win.openRedlineWorkbench = () => {};
    win.eval(CMP);   /* the builder, as the browser loads it */
    if (typeof win.insForce === 'function') win.insForce(true);
    win.renderRegister();
    return win;
  }
  test('4a the frame draws the grip in the panel, on its side of the seam, once', () => {
    const win = listWorld();
    const p = win.document.getElementById('ins-panel');
    assert.ok(p && p.classList.contains('is-jambo'));
    const g = p.querySelectorAll(':scope > #jl-resizer.ig-resizer[role="separator"]');
    assert.equal(g.length, 1, 'one grip, a child of the panel');
    win.renderRegister();
    assert.equal(win.document.querySelectorAll('#jl-resizer').length, 1, 'a repaint draws no second grip');
  });
  test('4b the floors: the panel 340, the list INS_MIN_W − 340, so the inspector\'s line never flips while dragging', () => {
    const win = listWorld();
    assert.equal(win.JL_MIN, 340);
    assert.equal(win.JL_LIST_MIN, win.INS_MIN_W - 340);
    assert.equal(win.JL_SPLIT.w0, 380, 'Home\'s panel\'s rest');
    assert.equal(win.splitClamp(null, 1440, win.JL_SPLIT), 380);
    assert.equal(win.splitClamp(100, 1440, win.JL_SPLIT), 340);
    assert.equal(win.splitClamp(2000, 1440, win.JL_SPLIT), 1440 - win.JL_LIST_MIN);
    assert.equal(win.JL_SPLIT.key, 'hati.v1.jlW', 'one key for every list page and Import');
  });
  test('4c the width is ONE value: the divider writes --jl-w on the shell; insFits measures with it', () => {
    const win = listWorld();
    const p = win.document.getElementById('ins-panel');
    win.JL_SPLIT.apply(520);
    const shell = win.document.getElementById('app-shell') || win.document.documentElement;
    assert.equal(shell.style.getPropertyValue('--jl-w'), '520px', 'on the shell, which holds the panel, the page head and the scroller');
    assert.equal(win.jlWidthNow(), 520);
    assert.equal(win.jlReserved(), 520, 'the column the panel takes is the width it was given');
    p.classList.add('is-folded');
    assert.equal(win.jlReserved(), win.JL_FOLDED, 'folded, the strip');
    win.JL_SPLIT.apply(600);
    assert.equal(win.jlWidthNow(), 520, 'folded, the open width is kept, not overwritten');
    p.classList.remove('is-folded');
    assert.match(code(fnOf(INS, 'insFits')), /const w = el \? el\.clientWidth \+ jlReserved\(\) : 0;/);
  });
  test('4d folded, the grip stands down; opened, it is back', () => {
    const win = listWorld();
    const p = win.document.getElementById('ins-panel');
    /* jsdom lays nothing out: the room is stated */
    p.getBoundingClientRect = () => ({ left: 1060, right: 1440, width: 380, top: 48, bottom: 780, height: 732 });
    win.document.getElementById('content-scroll') || win.document.body.insertAdjacentHTML('beforeend', '<main id="content-scroll"></main>');
    win.document.getElementById('content-scroll').getBoundingClientRect = () => ({ left: 0, right: 1060, width: 1060, top: 48, bottom: 780, height: 732 });
    win.jlLayout();
    const g = win.document.getElementById('jl-resizer');
    assert.equal(g.hidden, false, 'open: the grip at the seam');
    assert.equal(g.getAttribute('aria-valuenow'), '380');
    win.jlFoldSet(true);
    assert.equal(g.hidden, true, 'folded: no grip');
    win.jlFoldSet(false);
    assert.equal(g.hidden, false, 'opened again');
    try { win.localStorage.removeItem('hati.v1.jlFold'); } catch (_) {}
  });
  test('4f a list drawn as a fixed table keeps its own floor: its fixed columns, 170 for the column that takes the rest, its padding', () => {
    const win = listWorld();
    const d = win.document;
    const content = d.getElementById('content');
    let cs = d.getElementById('content-scroll');
    if (!cs){ cs = d.createElement('main'); cs.id = 'content-scroll'; d.body.appendChild(cs); }
    cs.getBoundingClientRect = () => ({ left: 0, right: 986, width: 986, top: 48, bottom: 780, height: 732 });
    const box = d.createElement('div');
    /* People's own columns at 1366 (MEASURED): the name takes the rest */
    box.innerHTML = '<table class="t-people" style="table-layout:fixed"><colgroup><col><col style="width:66px"><col style="width:160px"><col style="width:144px"><col style="width:114px"><col style="width:92px"><col style="width:168px"></colgroup><thead><tr><th>Name</th></tr></thead></table>'
      + '<table class="t-auto"><colgroup><col style="width:2000px"></colgroup></table>'
      + '<div hidden><table class="t-hidden" style="table-layout:fixed"><colgroup><col style="width:3000px"></colgroup></table></div>';
    content.appendChild(box);
    d.querySelectorAll('table').forEach(t => { t.getBoundingClientRect = () => ({ left: 17, right: 969, width: t.classList.contains('t-hidden') ? 0 : 952, top: 0, bottom: 0, height: 0 }); });
    assert.equal(win.jlListMin(), 66 + 160 + 144 + 114 + 92 + 168 + 170 + (986 - 952), 'People keeps its fixed columns, 170 for the name, and its padding');
    assert.equal(win.JL_SPLIT.restMin, win.jlListMin(), 'the host\'s floor is the list\'s, read live');
    assert.equal(win.splitClamp(700, 1366, win.JL_SPLIT), 1366 - 948, 'the reader\'s wish is given only the room the list leaves');
    box.remove();
    assert.equal(win.jlListMin(), win.JL_LIST_MIN, 'a list with no fixed table keeps the inspector\'s own floor');
  });
  test('4e the 380 literals are one variable: the panel, the page head and the page\'s scroller read --jl-w', () => {
    assert.match(HTML, /#content \.ins-panel\.is-jambo\{position:fixed;right:0;top:var\(--jl-top,88px\);bottom:0;width:var\(--jl-w,380px\);/);
    assert.match(HTML, /#app-shell:has\(#content \.ins-panel\.is-jambo\):not\(:has\(#content \[hidden\] \.ins-panel\.is-jambo\)\) #page-head,\n\s*#app-shell:has\(#content \.ins-panel\.is-jambo\):not\(:has\(#content \[hidden\] \.ins-panel\.is-jambo\)\) #content-scroll\{margin-right:var\(--jl-w,380px\);\}/);
    assert.doesNotMatch(HTML, /\.ins-panel\.is-jambo[^{]*\{[^}]*width:380px/, 'no 380px literal left on the panel');
    assert.match(HTML, /#content \.ins-panel\.is-jambo\.is-folded\{width:46px;\}/, 'the folded strip keeps its 46');
  });
});

describe('f830 (5) Settings', () => {
  const { settingsStage } = require('./settingsworld');
  const stage5 = opts => settingsStage(Object.assign({}, opts, { before: sb => {
    const vm = require('node:vm');
    const keep = { esc: sb.esc, icon: sb.icon, landOn: sb.landOn };
    vm.runInContext(CMP, sb, { filename: 'js/components.js' });
    Object.assign(sb, keep);   /* the stage's own stand-ins stay */
  } }));
  test('5a the panel holds the grip; folded, it stands down', () => {
    const g = stage5({ role: 'legal' });
    const r = g.$('st-resizer');
    assert.ok(r && r.parentElement && r.parentElement.id === 'st-side', 'the grip is in Jambo\'s panel, on its side of the seam');
    assert.equal(g.q('#set-page .st-cr-cols > #st-side') && g.qa('#st-resizer').length, 1);
    g.run('stSideFoldSet(true)');
    assert.equal(g.$('st-resizer').hidden, true, 'folded: no grip');
    g.run('stSideFoldSet(false)');
  });
  test('5b the floors: the panel 340, the board the measured 780; the rest the stylesheet\'s own', () => {
    const g = stage5({ role: 'admin' });
    const S = g.sb.ST_SPLIT;
    assert.equal(g.sb.ST_SIDE_MIN, 340);
    assert.equal(g.sb.ST_BOARD_MIN, 780);
    assert.equal(S.key, 'hati.v1.stSideW', 'its own key');
    assert.match(code(objOf(SET, 'ST_SPLIT')), /w0:\(\)=>\(\(typeof matchMedia==='function'\)&&matchMedia\('\(min-width:1401px\)'\)\.matches\)\?380:344/, 'resting at the track\'s own width');
    assert.equal(g.sb.splitClamp(null, 1382, Object.assign({}, S, { w0: 380 })), 380);
    assert.equal(g.sb.splitClamp(2000, 1382, S), 1382 - 780, 'the board keeps its floor');
    assert.equal(g.sb.splitClamp(100, 1382, S), 340);
  });
  test('5c the track is --st-side-w, written on the page by the one pass, and stacked below 981px', () => {
    const g = stage5({ role: 'admin' });
    const cols = g.q('#set-page .st-cr-cols');
    cols.getBoundingClientRect = () => ({ left: 16, right: 1414, width: 1398, top: 0, bottom: 700, height: 700 });
    g.sb.localStorage.setItem('hati.v1.stSideW', '560');
    g.run('stSplitFit()');
    assert.equal(g.$('set-page').style.getPropertyValue('--st-side-w'), '560px');
    assert.equal(g.$('st-resizer').hidden, false);
    g.sb.localStorage.removeItem('hati.v1.stSideW');
    assert.match(HTML, /@media \(min-width:981px\)\{[\s\S]*?\.st-cr \.st-cr-cols\{ grid-template-columns:minmax\(0,1fr\) var\(--st-side-w,380px\); column-gap:var\(--s-4\); \}/);
    assert.match(HTML, /@media \(min-width:981px\) and \(max-width:1400px\)\{ \.st-cr \.st-cr-cols\{ grid-template-columns:minmax\(0,1fr\) var\(--st-side-w,344px\); \} \}/);
    assert.match(code(objOf(SET, 'ST_SPLIT')), /off:\(\)=>!stWide\(\)/, 'stacked, the divider stands down');
  });
});
