/* ============================================================
   F95 — the symbols, the order of the work, and the quiet
   ============================================================
   Four changes from the owner's second review, and the rules underneath them.

   A MENU NEEDS SOMETHING TO AIM AT. Nine verbs at one weight in one colour is
   a grey block: the only way to find the row you want is to read all nine.
   Each row carries a symbol now and the symbol carries the accent, so the eye
   lands before the reader has to parse a word. The label stays black — colour
   on nine labels is nine shouts — and the destructive rows keep their red on
   BOTH mark and label, because that is the one distinction a menu must never
   blur, hover included.

   THE ORDER ON SCREEN IS THE ORDER OF THE WORK. Checks sat above the contract
   form, which put the reviewing before the writing: three Run buttons offering
   to review a document that read "0 of 26 required filled". Nothing they could
   have returned would have been true.

   AND A CONFIRMATION THAT REPEATS THE SCREEN IS NOISE. "#CHG-011 accepted"
   floated over a page where the clause had just turned green and the count had
   just gone down — three statements of one fact, one of them covering the
   document while it said so. Green goes. Red stays exactly as it was: a
   failure is the one case where the screen cannot show you the outcome.

   ONE OF THESE IS GUARDED AGAINST THE WAY IT WAS ALREADY BROKEN. The Focus
   mode row relabels itself on every render, and it did that with textContent —
   which deletes the icon and the hint, because they are child elements. The
   markup it is BUILT from was always right, so only a rendered page could show
   it. That test renders the page.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const vm = require('node:vm');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

const ROOT = path.join(__dirname, '..');
const src = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function contract(over = {}){
  return { id: 'MK-950', name: 'Raw Material Supply — Coast',
    counterparty: 'Naivas Supermarkets', template: 'RM', status: 'Under Review',
    folder: 'proc', value: 78000000, valueType: 'standard', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    compliance: { consent: false },
    redlineText: F.protoRich(), format: 'rich', ...over };
}
/* The room head, on a stage that has the workspace shell around it. */
function head(c, opts){
  const { win } = buildWorld({ contractView: true, negotiationView: true });
  /* The stage boots the negotiation modules, not the money half of the shell.
     wsNextAction reads it to decide the head's primary. Shell stubs only. */
  win.isMonetary = x => (x.valueType || 'estimated') !== 'none';
  win.fmtMoney = v => 'KES ' + Number(v || 0).toLocaleString('en-KE');
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'workspace' });
  win.getContract = id => (id === c.id ? c : null);
  return { win, html: win.roomHeadHtml(c, opts) };
}
/* The template form a library contract carries. */
function form(filled = {}){
  return { templateName: 'Kwetu - V2', versionNumber: 1, values: { ...filled },
    fields: [
      { fieldKey: 'biz', label: 'Registered Business Name', required: true, section: 'COMPANY INFORMATION' },
      { fieldKey: 'kra', label: 'KRA Pin', required: true, section: 'COMPANY INFORMATION' },
      { fieldKey: 'tel', label: 'Company Telephone Number(s)', required: true, section: 'COMPANY INFORMATION' },
      { fieldKey: 'note', label: 'Anything else', required: false, section: 'COMPANY INFORMATION' },
    ] };
}

describe('F95 — Draft new agreement is the filled green button', () => {
  test('it carries the primary fill, not an outline', () => {
    const btn = head(contract()).html.match(/<button[^>]*id="ws-new"[^>]*>/)[0];
    assert.match(btn, /ui-btn-primary/, 'solid, by the owner’s call');
    assert.match(btn, /data-page-new/, 'and the shell’s delegated handler still finds it');
  });

  test('the workbench does not offer it mid-round', () => {
    assert.doesNotMatch(head(contract(), { primary: false }).html, /id="ws-new"/,
      'Negotiate is a working surface — starting a different agreement there is noise');
  });
});

describe('F95 — every menu row has a symbol, and the symbols are solid dark green', () => {
  const css = src('index.html');
  /* Every declaration block whose selector list contains this exact selector.
     Read this way rather than by matching one long literal: the two menus share
     a rule, and a test that pinned the grouping would break the next time the
     selectors were tidied without the colours changing at all. */
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, ' ');   // comments hold no rules
  const rulesFor = sel => [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(m => m[1].split(',').some(s => s.trim().replace(/\s+/g, ' ') === sel))
    .map(m => m[2]);
  const decl = (sel, prop) => rulesFor(sel).map(b =>
    (b.match(new RegExp(prop + ':\\s*([^;]+)')) || [])[1]).filter(Boolean).pop();

  test('the room menu paints its icons dark green', () => {
    assert.equal(decl('.room-menu button svg', 'color'), 'var(--color-accent-800)');
    assert.equal(decl('.room-menu button:hover svg', 'color'), 'var(--color-accent-800)',
      'and hovering does not wash it out');
  });

  test('and fills them in, rather than leaving hairline outlines', () => {
    assert.equal(decl('.room-menu button svg', 'fill'), 'currentColor');
    assert.equal(decl('.reg-act svg', 'fill'), 'currentColor');
  });

  test('the register row menu is the same rule', () => {
    assert.equal(decl('.reg-act svg', 'color'), 'var(--color-accent-800)');
  });

  test('the destructive rows are red, hover included', () => {
    for (const sel of ['.room-menu .danger svg', '.room-menu .danger:hover svg', '.reg-act.danger svg'])
      assert.equal(decl(sel, 'color'), 'var(--st-ruby-fg)',
        `${sel} — hover must never turn Delete into a row that looks safe`);
  });

  test('the dark theme lifts them off the ground instead of sinking them', () => {
    assert.equal(decl('html.dark .room-menu button svg', 'color'), 'var(--color-accent-300)',
      'accent-800 is a near-black green on dark paper');
    assert.equal(decl('html.dark .reg-act svg', 'color'), 'var(--color-accent-300)');
  });

  test('every verb in the register menu names an icon', () => {
    /* Read from the source: the register page needs the whole application shell
       around it to render, and what is being asserted is that no row was added
       later without a mark. */
    const reg = src('js/views/register.js');
    const block = reg.slice(reg.indexOf('const REG_ROW_ACTIONS=['));
    const rows = block.slice(0, block.indexOf('];')).split('\n').filter(l => /\{k:/.test(l));
    assert.ok(rows.length >= 5, 'the menu still holds every verb it held');
    for (const r of rows) assert.match(r, /ic:'[a-zA-Z]+'/, `no symbol on: ${r.trim()}`);
    assert.match(reg, /class="reg-act\$\{a\.ruby\?' danger':''\}/,
      'and the destructive rows are marked so the red rule can find them');
  });

  test('every row of the room menu renders one', () => {
    const html = head(contract({ status: 'Draft' })).html;
    const menu = html.slice(html.indexOf('id="ws-more-menu"'));
    const rows = menu.split('<button').slice(1);
    assert.ok(rows.length >= 6, 'the whole menu is being read');
    for (const r of rows){
      const id = (r.match(/id="([^"]+)"/) || [, '(unnamed)'])[1];
      assert.match(r.slice(0, r.indexOf('</button>')), /<svg/, `${id} has no symbol`);
    }
  });

  /* THE ONE THAT WAS ACTUALLY BROKEN, and only a rendered page could say so. */
  test('Focus mode keeps its symbol after it relabels itself', () => {
    const c = contract();
    const h = head(c);
    h.win.document.body.innerHTML = h.html;
    h.win.applyWsFocus();
    const b = h.win.document.getElementById('ws-focus');
    assert.ok(b.querySelector('svg'), 'the icon survived the relabel');
    assert.ok(b.querySelector('.mnote'), 'and so did the hint');
    assert.match(b.textContent, /Focus mode/);
  });
});

describe('F95 — the contract is filled in before it is checked', () => {
  test('the form comes before Checks in the column', () => {
    /* The page template is one string in one file; the order in it IS the order
       on screen, and it is the thing that regressed. */
    const page = src('js/views/contract.js');
    const doc = page.slice(page.indexOf('id="doc-right"'));
    assert.ok(doc.indexOf('id="tplform-section"') < doc.indexOf('id="checks-card"'),
      'reviewing a document that has not been written yet is not a check');
  });

  test('Checks says how many fields are still empty', () => {
    const { win } = buildWorld({ contractView: true, negotiationView: true });
    const c = contract({ templateForm: form() });
    assert.equal(win.tplFormOpenCount(c), 3, 'the optional field is not counted');
    assert.match(win.checksNoteHtml(c), /Fill the contract form above first/);
    assert.match(win.checksNoteHtml(c), /3 required fields still empty/);
  });

  test('and stops saying it the moment the last one is filled', () => {
    const { win } = buildWorld({ contractView: true, negotiationView: true });
    const c = contract({ templateForm: form({ biz: 'Highland Ltd', kra: 'A1', tel: '+254' }) });
    assert.equal(win.tplFormOpenCount(c), 0);
    assert.match(win.checksNoteHtml(c), /Run before sending/);
  });

  test('one left is one field, not one fields', () => {
    const { win } = buildWorld({ contractView: true, negotiationView: true });
    const c = contract({ templateForm: form({ biz: 'Highland Ltd', kra: 'A1' }) });
    assert.match(win.checksNoteHtml(c), /1 required field still empty/);
  });

  test('a contract with no form says nothing about one', () => {
    const { win } = buildWorld({ contractView: true, negotiationView: true });
    assert.equal(win.tplFormOpenCount(contract()), 0,
      'the common case — a plain template, or an upload that arrived complete');
    assert.match(win.checksNoteHtml(contract()), /Run before sending/);
  });

  test('typing in the form repaints the Checks line', () => {
    /* The count changes under the reader's hands, so the notice cannot be
       written once at build time and left there. */
    const lib = src('js/views/templatelib.js');
    const commit = lib.slice(lib.indexOf('function tplFormCommit'));
    assert.match(commit.slice(0, commit.indexOf('\n}')), /renderChecksCard\(c\)/);
    const page = src('js/views/contract.js');
    const render = page.slice(page.indexOf('function renderChecksCard'));
    assert.match(render.slice(0, render.indexOf('\n}')), /data-checks-note/);
  });
});

describe('F95 — the round’s queue folds to a rail', () => {
  /* The three-column workbench, mounted the way the portal mounts it — the
     queue is a column of redlinePanesHtml, which both seats render. */
  function bench(side = 'owner'){
    const { win } = buildWorld({ negotiationView: true, contractView: true });
    /* lsGet/lsSet live in js/core.js, which this stage does not load — the
       preference store is the shell, so it is supplied here as one. */
    const store = new Map();
    win.lsGet = k => (store.has(k) ? store.get(k) : null);
    win.lsSet = (k, v) => store.set(k, v);
    const c = contract();
    win.negoInit(c);
    win.negoResetView();
    const host = win.document.createElement('div');
    host.id = 'bench';
    win.document.body.appendChild(host);
    win.redlineEmbed(host, c, { side, by: 'Amina Otieno', persist: false,
      selMenu(){}, noAi: true, rerender(){} });
    return { win, c, host,
      grid: () => host.querySelector('#rl-grid'),
      queue: () => host.querySelector('#rl-queue'),
      btn: () => host.querySelector('#rl-q-min'),
      press: el => el.dispatchEvent(new win.Event('click', { bubbles: true })) };
  }

  test('it opens open, and offers the fold', () => {
    const b = bench();
    assert.ok(b.queue(), 'the queue is there');
    assert.ok(b.btn(), 'and it can be folded');
    assert.equal(b.btn().getAttribute('aria-expanded'), 'true');
    assert.ok(!b.queue().classList.contains('is-min'),
      'a first-time reader sees it before they can decide they would rather not');
  });

  test('pressing it folds the column and the grid with it', () => {
    const b = bench();
    b.press(b.btn());
    assert.ok(b.queue().classList.contains('is-min'), 'the column folds');
    assert.ok(b.grid().classList.contains('q-min'), 'and the grid gives the width back');
    assert.equal(b.btn().getAttribute('aria-expanded'), 'false');
  });

  test('the rail still says how far through the round you are', () => {
    const b = bench();
    const mini = b.host.querySelector('.rl-q-mini');
    assert.ok(mini, 'a rail that went blank would make reopening it a guess');
    assert.match(mini.textContent.replace(/\s+/g, ''), /^\d+\/\d+$/);
    b.press(b.btn());
    assert.equal(mini.getAttribute('aria-hidden'), 'false', 'and it is read out once folded');
  });

  test('pressing it again brings it back', () => {
    const b = bench();
    b.press(b.btn()); b.press(b.btn());
    assert.ok(!b.queue().classList.contains('is-min'));
    assert.ok(!b.grid().classList.contains('q-min'));
    assert.equal(b.btn().getAttribute('aria-expanded'), 'true');
  });

  test('the choice is remembered, and it is remembered per person', () => {
    const b = bench();
    b.press(b.btn());
    assert.equal(b.win.rlQueueMin(), true);
    /* Repainting the bench must not quietly reopen it. */
    b.win.redlineEmbed(b.host, b.c, { side: 'owner', by: 'Amina Otieno', persist: false,
      selMenu(){}, noAi: true, rerender(){} });
    assert.ok(b.host.querySelector('#rl-queue').classList.contains('is-min'));
    assert.ok(b.host.querySelector('#rl-grid').classList.contains('q-min'));
    b.win.rlSetQueueMin(false);
  });

  test('the folded column has a width to fold to', () => {
    const nego = src('js/views/negotiation.js');
    assert.match(nego, /\.rl-grid\.has-queue\.q-min\{--rl-queue-w:\d+px\}/,
      'the resizer reads --rl-queue-w, so the fold has to move that number');
  });
});

describe('F95 — focus mode leaves no dead band at the foot', () => {
  test('entering focus re-measures the view height', () => {
    /* The band was never a padding value to halve: --view-h is the scroll
       container measured once, while the top strip was still on screen. */
    const nego = src('js/views/negotiation.js');
    const fn = nego.slice(nego.indexOf('function rlSetFocus('));
    const body = fn.slice(0, fn.indexOf('\n}'));
    assert.match(body, /syncViewHeight/, 'the stale measurement is retaken');
    assert.match(body, /requestAnimationFrame/,
      'after a frame — clientHeight means nothing until the new shell has laid out');
  });

  test('it is retaken on the way out too', () => {
    const { win } = buildWorld({ negotiationView: true });
    let calls = 0;
    win.syncViewHeight = () => { calls++; };
    win.requestAnimationFrame = fn => fn();
    win.rlSetFocus(true);
    win.rlSetFocus(false);
    assert.equal(calls, 2, 'leaving focus brings the strip back — same stale number, other way');
    win.rlResetFocus();
  });
});

describe('F95 — the negotiate objects are one set of objects', () => {
  const nego = src('js/views/negotiation.js');

  /* THIS BLOCK USED TO SAY "SQUARE". The workbench had been given a 0-3px
     radius everywhere, on the argument that a negotiation surface is a working
     surface rather than a gallery of cards. The 10 Aug 2026 design reverses
     it: the queue, the sheet and the change cards are 12-14px with a hairline
     lift, and the Document tab's rail cards match them, so switching tabs
     moves the work and not the furniture.

     WHAT SURVIVES UNCHANGED is the rule underneath both: ONE radius, used by
     everything on the page. A page where the paper is 14px, the cards are 6px
     and the queue is 2px is the drift this test exists to catch, whichever
     number is current. */
  test('the queue, the sheet and the change cards share one radius', () => {
    const radius = sel => {
      const rule = nego.slice(nego.indexOf(sel + '{'));
      const block = rule.slice(0, rule.indexOf('}'));
      return ((block.match(/border-radius:\s*([^;}]+)/) || [])[1] || '').trim();
    };
    const got = ['.redline-page .rl-col', '.redline-page .rl-doc',
      '.redline-page .rl-paper'].map(radius);
    assert.deepEqual([...new Set(got)], ['14px'],
      'the three big surfaces are one shape: ' + got.join(' / '));
    assert.equal(radius('.redline-page .rl-card'), '12px',
      'and a card inside them is one step tighter, never a different family');
  });

  test('the Document tab\'s own cards were brought with them', () => {
    /* Source-level, like the rest of this file's cross-file claims: the
       workspace screen is too heavy to boot here and what is pinned is one
       line of source. */
    const ct = src('js/views/contract.js');
    assert.match(ct, /const CARD='background:var\(--color-surface\)[^']*border-radius:12px'/,
      'the Doc page rail is the same card as the Negotiate column');
  });

  test('but the buttons and pills keep their own shape', () => {
    assert.match(nego, /--n-r-sm:6px/, 'squaring a round Accept button turns it into a box');
    const verbs = nego.slice(nego.indexOf('.redline-page .rl-card-verbs button{'));
    assert.match(verbs.slice(0, verbs.indexOf('}')), /border-radius:8px/,
      'the verbs are the design\'s soft rectangles, not pills');
    const badge = nego.slice(nego.indexOf('.redline-page .rl-badge{'));
    assert.match(badge.slice(0, badge.indexOf('}')), /border-radius:999px/,
      'and a status pill is still a pill');
  });
});

describe('F95 — green confirmations are gone, red warnings are not', () => {
  /* The real toast(), from js/core.js, into a real DOM. The scenario world
     stubs toast as a recorder — correctly, it is testing what the product
     SAYS — so the function itself is exercised on its own small stage. */
  function stage(){
    const dom = new JSDOM('<!doctype html><body><div id="toast-root"></div></body>');
    const win = dom.window;
    win.icon = () => '<svg></svg>';
    const core = src('js/core.js');
    const fn = core.slice(core.indexOf('function toast(msg,kind='));
    vm.runInContext(fn.slice(0, fn.indexOf('\n}') + 2), vm.createContext(win));
    return { win, root: win.document.getElementById('toast-root'),
      boxes: () => win.document.getElementById('toast-root').children.length };
  }

  test('an ok toast draws nothing at all', () => {
    const s = stage();
    s.win.toast('#CHG-011 accepted — merged into the clean text');
    assert.equal(s.boxes(), 0, 'the screen already said this three ways');
  });

  test('an error toast draws exactly as it always did', () => {
    const s = stage();
    s.win.toast('Could not read the document', 'err');
    assert.equal(s.boxes(), 1);
    assert.match(s.root.textContent, /Could not read the document/);
  });

  test('the callers are untouched — nothing has to know the rule', () => {
    const s = stage();
    for (let i = 0; i < 10; i++) s.win.toast('saved ' + i);
    s.win.toast('save failed', 'err');
    assert.equal(s.boxes(), 1, 'the silencing lives in one place, not in every call site');
  });
});
