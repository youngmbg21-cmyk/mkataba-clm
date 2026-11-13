/* f1026 — THE CLAUSE EDITOR'S AUDIT (owner, 13 Nov 2026: "the redlines bullet points have been indented which is
   how a contract should be but ... the paper is not respecting the design or form from the editor page"; "the old
   jambo panel that is a card as opposed to being a panel that is separated by a thin line from top to bottom";
   "the page tells me that I have not filed the redline for clause 3 when ... I had already done that"; and "review
   the entire page ... for process and workflow bugs")
   ============================================================================
   The browser half is test/chromium/editor-audit-verify.js (GitHub). This pins, in a world and off the source:

     (1) HOME'S PAPER HANGS ITS LIMBS — the gutter and the steps are stated for .ig-redpaper with the editor's own
         measures, the step one class heavier than the body rhythm that would cancel it;
     (2) A BOX NOBODY TOUCHED IS NOT A DRAFT — across the shapes a clause takes (lettered limbs, numbers, bullets,
         lists, a table, stated steps) and whoever's change is on it, the editor opens clean: nothing reads as
         typed, Save is grey, and the way out asks nothing. A step the stored wording stated itself is kept;
     (3) THE PAGE SAYS WHAT IS FILED — our own change opened and not touched reads "Filed as CHG-…"; their change
         reads as theirs; a draft says "Not filed yet"; and "Draft saved" is said nowhere;
     (4) THE WARNING QUOTES THE WORDS AT RISK, not the clause's first sentence;
     (5) UNDO BACK TO WHAT STANDS IS NOT A DRAFT over our own filed change, and still is an answer over theirs;
     (6) REDO NEVER DRAWS OVER TYPED WORDS;
     (7) A CLAUSE A COLLEAGUE HOLDS IS REFUSED WHERE YOU ARE;
     (8) ESCAPE CLOSES ONE LAYER — the side panel first;
     (9) THE SAVE HOVER NAMES WHAT SAVE DOES over their change;
     (10) IN THE NEW LOOK JAMBO'S PANEL IS A PANEL — square, flush, one hairline.

   AT THE PARENT (26c4b19): (1) (2) (3) (4) (5) (6) (7) (8) (9) (10) all fail.
   Run: node --test test/f1026-the-editor-audit.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const CE = strip(read('js/views/clauseeditor.js'));
const CSS = strip(read('js/views/negotiation-css.js'));
const I18N = read('js/i18n.js');

const PAPER = body => '<h1>SERVICES</h1><h2>1. Services</h2><p>AIT shall provide services.</p>'
  + '<h2>2. Pricing and Payment</h2>' + body
  + '<h2>3. Governing Law</h2><p>This Agreement is governed by the laws of Norway. Disputes go to the courts of Oslo.</p>'
  + '<h2>4. Notices</h2><p>Notices are sent by post.</p>';
const LIMBS = '<p>The Customer shall pay all rates and charges.</p><p>AIT may adjust pricing, provided that:</p>'
  + '<p>(a) AIT gives the Customer reasonable evidence;</p><p>(b) any adjustment shall not exceed ten (10) per cent.</p>'
  + '<p>Payment shall be due within thirty (30) days.</p>';

function stage(body = LIMBS){
  const w = buildWorld({ negotiationView: true, contractView: true, playbook: true });
  const { win } = w;
  const doc = win.document;
  win.promptDialog = async () => 'because';
  const asks = [];
  let answer = false;
  win.confirmDialog = async o => { asks.push(String(o.message || o.title || '')); return answer; };
  const toasts = [];
  win.toast = (m, k) => { toasts.push(String(k) + ':' + String(m)); };
  win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
  win.copilotAvailable = () => true;
  win.copilotPropose = async () => ({ proposedText: '', advice: '' });
  const c = supplyContract({ redlineText: PAPER(body) });
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  Object.defineProperty(win, 'innerWidth', { value: 1440, configurable: true });
  const by = re => win.negoClauseList(c).find(x => re.test(String(x.heading || x.headingText || '') + ' ' + String(x.text || '')));
  const box = () => doc.querySelector('#ce-clausebody');
  const save = () => doc.querySelector('#clause-editor [data-ce-act="save"]');
  const foot = () => String((doc.querySelector('#ce-draft') || {}).textContent || '').trim();
  const type = txt => { box().lastElementChild.appendChild(doc.createTextNode(txt)); box().dispatchEvent(new win.Event('input', { bubbles: true })); };
  const blur = () => box().dispatchEvent(new win.FocusEvent('blur'));
  const press = async () => { save().click(); await new Promise(r => setTimeout(r, 350)); };
  const bar = k => doc.querySelector('#ce-bar [data-rb="' + k + '"]');
  const barPress = k => bar(k).dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  const guardAsks = () => { const n = asks.length; let went = false; win.ceLeaveGuard(() => { went = true; }); return { asked: asks.length > n, went }; };
  return { w, win, doc, c, by, box, save, foot, type, blur, press, bar, barPress, guardAsks, asks, toasts, yes: v => { answer = !!v; } };
}

describe('f1026 (1) Home\'s paper hangs its limbs as the editor does', () => {
  const rule = sel => { const m = CSS.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}')); return m ? m[1].replace(/\s+/g, '') : null; };
  test('the gutter: the same hang and the same marker measure as the editor\'s paper', () => {
    assert.ok(rule('.redline-page .rl-doc .rl-hang'), 'the editor\'s own rule is still there to compare with');
    assert.equal(rule('.ig-redpaper .rl-hang'), rule('.redline-page .rl-doc .rl-hang'));
    assert.match(rule('.ig-redpaper .rl-hang .rl-marker') || '', /display:inline-block;min-width:2\.6em;text-indent:0/);
  });
  test('the steps: one gutter a level, written heavier than the body rhythm that would cancel them', () => {
    for (const n of [1, 2, 3]){
      const home = rule('.ig-redpaper.nego-onpaper .hati-lv-' + n);
      const ed = (CSS.match(new RegExp('\\.redline-page \\.rl-doc \\.hati-lv-' + n + '[^{]*\\{([^}]*)\\}')) || [])[1];
      assert.ok(home && ed, 'level ' + n + ' is stated for both papers');
      assert.equal(home.replace(/;$/, ''), ed.replace(/\s+/g, '').replace(/;$/, ''), 'level ' + n + ' is the same step on both');
    }
    assert.match(CSS, /\.nego-clause \.nego-body>\*[^{]*\{margin:0 0 9px\}/, 'the rhythm the step has to outweigh: a margin shorthand, two classes');
  });
  test('Home\'s paper is the element the rules name', () => {
    assert.match(read('js/views/intelligence.js'), /class="ig-redpaper nego-onpaper\$\{clean\?' is-clean':''\}"/);
  });
});

describe('f1026 (2) a box nobody touched is not a draft', () => {
  const SHAPES = {
    limbs: LIMBS,
    decimals: '<p>2.1 The Supplier shall deliver.</p><p>2.2 The Buyer shall pay.</p><p>(i) in full; and</p><p>(ii) on time.</p>',
    boldnum: '<p><strong>2.1</strong> The Supplier shall deliver.</p><p><strong>2.2 Payment.</strong> The Buyer shall pay.</p>',
    bullets: '<p>\u2022 one</p><p>\u25e6 two</p><p>\u25aa three</p>',
    lists: '<ul><li>one</li><li>two</li></ul><ol><li>first</li><li>second</li></ol>',
    stated: '<p class="hati-lv-1">(a) stated one</p><p class="hati-lv-2">(i) stated two</p><p class="hati-lv-2">plain stepped</p><p class="hati-tight">Label</p><p>Value</p>',
    table: '<p>Rates:</p><table><tbody><tr><td>A</td><td>1</td></tr><tr><td>B</td><td>2</td></tr></tbody></table><p>End.</p>',
    mixed: '<p>(a) limb with <strong>bold</strong>;</p><p>(1) bracket number</p><p>(A) capital</p><p>iv) roman</p>',
  };
  for (const [name, body] of Object.entries(SHAPES)){
    for (const mode of ['untouched', 'ours', 'theirs']){
      test(name + ' · ' + mode + ': opens clean, Save grey, the way out asks nothing', async () => {
        const p = stage(body);
        const cl = p.by(/Pricing and Payment/);
        let chId = null;
        if (mode !== 'untouched'){
          const ch = await p.win.negoEditClause(p.c, cl.clauseId, body + '<p>(z) one more limb, added.</p>',
            { side: mode === 'ours' ? 'owner' : 'counterparty', author: 'X' });
          assert.ok(ch && ch.id, 'the stage filed its change');
          chId = ch.id;
        }
        assert.equal(p.win.rlOpenClauseEditor(p.c, cl.clauseId, { typing: true, ...(chId ? { changeId: chId, fromRow: true } : {}) }), true);
        assert.equal(p.box().getAttribute('contenteditable'), 'true', 'the clause is being typed in');
        assert.equal(p.win.ceBoxDirty(), false, 'the box reads back as the wording it was drawn from');
        assert.equal(p.save().disabled, true, 'Save is grey: there is nothing to file');
        const g = p.guardAsks();
        assert.deepEqual(g, { asked: false, went: true }, 'leaving asks nothing');
        p.blur();
        assert.equal(p.win.clauseEditorDirty(), false, 'and a blur makes no step out of nothing');
        p.win.rlCloseClauseEditor();
      });
    }
  }
  test('the gutter walk still steps the limb in the box (the paint is taken off the copy, never the screen)', () => {
    const p = stage();
    p.win.rlOpenClauseEditor(p.c, p.by(/Pricing and Payment/).clauseId, { typing: true });
    const a = [...p.box().querySelectorAll('p')].find(x => /^\(a\)/.test(x.textContent));
    assert.ok(a.classList.contains('rl-hang') && a.classList.contains('hati-lv-1'), 'the limb hangs one step in while typed');
    assert.equal(a.hasAttribute('data-ce-lvown'), false, 'and is not marked as a step the wording stated');
    assert.doesNotMatch(p.win.ceBoxHtml(p.box()), /hati-lv-|rl-hang|rl-marker|data-ce-lvown/, 'none of it is read back');
  });
  test('a step the stored wording STATED is the wording\'s: marked, kept, and read back exactly', () => {
    const body = '<p>Lead in:</p><p class="hati-lv-1">(a) stated;</p><p>(b) read off the marker.</p>';
    const p = stage(body);
    p.win.rlOpenClauseEditor(p.c, p.by(/Pricing and Payment/).clauseId, { typing: true });
    const ps = [...p.box().querySelectorAll('p')];
    assert.equal(ps[1].getAttribute('data-ce-lvown'), '1');
    assert.equal(ps[2].hasAttribute('data-ce-lvown'), false);
    assert.equal(p.win.sanitizeRich(p.win.ceBoxHtml(p.box())), body);
  });
  test('a step the reader moved with the indent tool is theirs and stays', () => {
    const p = stage();
    p.win.rlOpenClauseEditor(p.c, p.by(/Pricing and Payment/).clauseId, { typing: true });
    const a = [...p.box().querySelectorAll('p')].find(x => /^\(a\)/.test(x.textContent));
    a.classList.remove('hati-lv-1'); a.classList.add('hati-lv-2');
    assert.match(p.win.ceBoxHtml(p.box()), /<p class="hati-lv-2">\(a\) /);
    assert.equal(p.win.ceBoxDirty(), true);
  });
  test('a typed limb files as plain wording, and the saved clause reopens clean', async () => {
    const p = stage();
    const cl = p.by(/Pricing and Payment/);
    p.win.rlOpenClauseEditor(p.c, cl.clauseId, { typing: true });
    const limb = p.doc.createElement('p'); limb.className = 'rl-hang hati-lv-1'; limb.textContent = '(c) AIT gives thirty (30) days notice.';
    p.box().insertBefore(limb, p.box().lastElementChild);
    p.box().dispatchEvent(new p.win.Event('input', { bubbles: true }));
    assert.equal(p.save().disabled, false, 'Save wakes as the words go in');
    await p.press();
    assert.equal(p.c.changes.length, 1);
    assert.doesNotMatch(p.c.changes[0].bodyHtml, /hati-lv-|rl-hang/, 'the record states no step the reader never set');
    assert.match(p.c.changes[0].bodyHtml, /<p>\(c\) AIT gives thirty \(30\) days notice\.<\/p>/);
    p.win.rlCloseClauseEditor();
    p.win.rlOpenClauseEditor(p.c, cl.clauseId, { typing: true, fromRow: true, changeId: p.c.changes[0].id });
    p.blur();
    assert.equal(p.win.clauseEditorDirty(), false);
    assert.deepEqual(p.guardAsks(), { asked: false, went: true }, 'the owner\'s report: filed, reopened, and the way out asks nothing');
  });
});

describe('f1026 (3) the page says what is filed', () => {
  test('our own change, opened and not touched: filed, with its number, under the head and in the foot', async () => {
    const p = stage();
    const cl = p.by(/Notices/);
    const ch = await p.win.negoEditClause(p.c, cl.clauseId, '<p>Notices are sent by post or email.</p>', { side: 'owner', author: 'Me' });
    p.win.rlOpenClauseEditor(p.c, cl.clauseId, { typing: true, fromRow: true, changeId: ch.id });
    assert.equal(p.foot(), 'Filed as ' + ch.id + ' \u00b7 no changes since');
    assert.equal(p.doc.querySelector('#clause-editor .ce-row-is').textContent, 'Your draft, filed as ' + ch.id + ' \u00b7 new typing is filed when you save');
    p.type(' Or by courier.');
    assert.match(p.foot(), /^Not filed yet \u00b7 changed at \d\d:\d\d$/, 'typing says so as the words go in, before any blur');
    await p.press();
    assert.equal(p.foot(), 'Filed as ' + ch.id + ' \u00b7 no changes since', 'and Save puts it back');
    assert.equal(p.c.changes.length, 1, 'into the same change');
  });
  test('their change, opened and not touched, is theirs; our counter then is ours', async () => {
    const p = stage();
    const cl = p.by(/Governing Law/);
    const their = await p.win.negoEditClause(p.c, cl.clauseId, '<p>' + cl.text.replace('Norway', 'Kenya') + '</p>', { side: 'counterparty', author: 'Erik' });
    p.win.rlOpenClauseEditor(p.c, cl.clauseId, { typing: true, fromRow: true, changeId: their.id });
    assert.equal(p.foot(), 'Their change ' + their.id + ' \u00b7 nothing of yours is filed until you save');
    assert.equal(p.doc.querySelector('#clause-editor .ce-row-is').textContent, 'Your counter \u00b7 nothing is filed until you save');
    p.type(' Mediation first.');
    await p.press();
    const mine = p.c.changes.find(x => x.authorSide === 'owner');
    assert.ok(mine && mine.id !== their.id);
    assert.equal(p.foot(), 'Filed as ' + mine.id + ' \u00b7 no changes since');
  });
  test('a clause nobody changed says "No changes yet"; a new clause we filed says it is filed', async () => {
    const p = stage();
    p.win.rlOpenClauseEditor(p.c, p.by(/Notices/).clauseId, { typing: true });
    assert.equal(p.foot(), 'No changes yet');
    p.win.rlCloseClauseEditor();
    assert.equal(p.win.rlOpenClauseEditor(p.c, null, { newClause: { afterClauseId: p.by(/Notices/).clauseId, heading: 'Audit rights' }, typing: true }), true);
    p.box().innerHTML = '<p>The Customer may audit once a year.</p>';
    p.box().dispatchEvent(new p.win.Event('input', { bubbles: true }));
    await p.press();
    const ch = p.c.changes[p.c.changes.length - 1];
    assert.equal(p.foot(), 'Filed as ' + ch.id + ' \u00b7 no changes since');
  });
  test('"Draft saved" is said nowhere: nothing here is saved until Save files it', () => {
    assert.doesNotMatch(CE, /_cet\('ce_draft_saved'/);
    for (const k of ['ce_draft_unfiled', 'ce_filed_same', 'ce_theirs_open', 'ce_back_to_stands', 'ce_filed_same_t', 'ce_theirs_open_t',
      'ce_back_to_stands_t', 'ce_row_is_filed', 'ce_save_counter_long'])
      assert.equal((I18N.match(new RegExp('\\n    ' + k + ': \'', 'g')) || []).length, 2, k + ' is in both books');
  });
});

describe('f1026 (4) the warning quotes the words at risk', () => {
  test('a change in the last paragraph is quoted from where it starts, not from the clause\'s first words', () => {
    const p = stage();
    p.win.rlOpenClauseEditor(p.c, p.by(/Pricing and Payment/).clauseId, { typing: true });
    p.type(' And interest runs after that.');
    const g = p.guardAsks();
    assert.equal(g.asked, true);
    const said = p.asks[p.asks.length - 1];
    assert.match(said, /You are on 2\. Pricing and Payment\./);
    assert.match(said, /What is not filed reads \u201c\u2026days\. And interest runs after that\u201d\./, 'from the word the draft parts in');
    assert.doesNotMatch(said, /The Customer shall pay all rates/, 'the standing first sentence is not what is at risk');
  });
});

describe('f1026 (5) Undo back to what stands', () => {
  test('over our own filed change: not a draft, Save grey, and the foot says where taking it back is done', async () => {
    const p = stage();
    const cl = p.by(/Notices/);
    const ch = await p.win.negoEditClause(p.c, cl.clauseId, '<p>Notices are sent by post or email.</p>', { side: 'owner', author: 'Me' });
    p.win.rlOpenClauseEditor(p.c, cl.clauseId, { typing: true, fromRow: true, changeId: ch.id });
    p.win.ceUndo();
    assert.equal(p.win.clauseEditorDirty(), false);
    assert.equal(p.save().disabled, true);
    assert.equal(p.foot(), 'The wording that stands \u00b7 to take ' + ch.id + ' back, use Discard last on its row');
    assert.deepEqual(p.guardAsks(), { asked: false, went: true }, 'nothing Save could keep, so nothing leaving could lose');
  });
  test('over THEIR pending change the same box is an answer, and leaving still asks', async () => {
    const p = stage();
    const cl = p.by(/Governing Law/);
    const their = await p.win.negoEditClause(p.c, cl.clauseId, '<p>' + cl.text.replace('Norway', 'Kenya') + '</p>', { side: 'counterparty', author: 'Erik' });
    p.win.rlOpenClauseEditor(p.c, cl.clauseId, { typing: true, fromRow: true, changeId: their.id });
    p.win.ceUndo();
    assert.equal(p.win.clauseEditorDirty(), true);
    assert.equal(p.save().disabled, false, 'Save rejects their change (ceKeepsStanding)');
    assert.equal(p.guardAsks().asked, true);
  });
});

describe('f1026 (6) Redo never draws over typed words', () => {
  test('step back, type, press Redo: the typed words stay and Redo has nothing ahead of it', () => {
    const p = stage();
    p.win.rlOpenClauseEditor(p.c, p.by(/Notices/).clauseId, { typing: true });
    p.type(' FIRST'); p.blur();
    p.barPress('undo');
    assert.equal(p.bar('redo').disabled, false);
    p.type(' SECOND');
    assert.equal(p.bar('redo').disabled, true, 'the bar\'s Redo greys while there are words the stack has not seen');
    p.bar('redo').disabled = false;
    p.barPress('redo');
    assert.match(p.box().textContent, /SECOND/);
    assert.doesNotMatch(p.box().textContent, /FIRST/);
  });
});

describe('f1026 (7) a clause a colleague holds is refused where you are', () => {
  test('the move stays on this clause and says who holds the other', () => {
    const p = stage();
    const here = p.by(/Notices/), there = p.by(/Governing Law/);
    p.win.rlOpenClauseEditor(p.c, here.clauseId, { typing: true });
    const real = p.win.clauseLockHeldByOther;
    p.win.clauseLockHeldByOther = (c, id) => (String(id) === String(there.clauseId) ? { by: { id: 'u2', name: 'Wanjiru' } } : null);
    try{
      p.toasts.length = 0;
      p.win.ceGoClause(there.clauseId, { typing: true });
      assert.equal(p.win.clauseEditorOpen(), true, 'the editor is still open');
      assert.equal(String(p.win.clauseEditorClauseId()), String(here.clauseId), 'on the clause the reader was in');
      assert.ok(p.toasts.some(t => /^warn:/.test(t) && /Wanjiru/.test(t)), 'and the refusal names the holder: ' + p.toasts.join(' | '));
    } finally { p.win.clauseLockHeldByOther = real; }
  });
  test('asked before the page is closed', () => {
    const fn = CE.match(/function ceGoClause\(clauseId, extra\)\{[\s\S]*?\n\}/)[0];
    assert.ok(fn.indexOf('clauseLockHeldByOther') > 0 && fn.indexOf('clauseLockHeldByOther') < fn.indexOf('rlCloseClauseEditor()'));
  });
});

describe('f1026 (8) Escape closes one layer: the side panel first', () => {
  const esc = p => p.doc.body.dispatchEvent(new p.win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  test('with the Notes panel open over the editor, Escape leaves the editor alone', async () => {
    const p = stage();
    p.win.rlOpenClauseEditor(p.c, p.by(/Notices/).clauseId, { typing: true });
    let panel = p.doc.getElementById('context-panel');
    const made = !panel;
    if (made){ panel = p.doc.createElement('aside'); panel.id = 'context-panel'; p.doc.body.appendChild(panel); }
    panel.classList.add('open');
    esc(p);
    await new Promise(r => setTimeout(r, 120));
    assert.equal(p.win.clauseEditorOpen(), true, 'the key was the panel\'s');
    panel.classList.remove('open');
    esc(p);
    await new Promise(r => setTimeout(r, 120));
    assert.equal(p.win.clauseEditorOpen(), false, 'and with no panel up it is the page\'s again');
    if (made) panel.remove();
  });
  test('read in the capture phase, so it holds whichever listener was registered first', () => {
    assert.match(CE, /if \(ev\.key === 'Escape'\) _cePanelUp = !!document\.querySelector\('#context-panel\.open'\);\s*\}, true\);/);
    assert.match(CE, /if \(_cePanelUp\)\{ _cePanelUp = false; return; \}/);
  });
});

describe('f1026 (9) the Save hover names what Save does', () => {
  test('over their change it files our counter; over our own it saves into it', async () => {
    const p = stage();
    const cl = p.by(/Governing Law/);
    const their = await p.win.negoEditClause(p.c, cl.clauseId, '<p>' + cl.text.replace('Norway', 'Kenya') + '</p>', { side: 'counterparty', author: 'Erik' });
    p.win.rlOpenClauseEditor(p.c, cl.clauseId, { typing: true, fromRow: true, changeId: their.id });
    assert.match(p.save().title, new RegExp('^Files your counter to ' + their.id + ' \u2014 '));
    p.type(' Mediation first.');
    await p.press();
    const mine = p.c.changes.find(x => x.authorSide === 'owner');
    assert.match(p.save().title, new RegExp('^Saves into ' + mine.id + ' \u2014 '));
  });
});

describe('f1026 (10) in the new look Jambo\'s panel is a panel, not a card', () => {
  test('square, flush, no lift, one hairline on its left; the card stays where the new look is off', () => {
    const m = CE.match(/html\.lg-new #clause-editor:not\(\.is-theirs\) \.ce-grid > \.ce-rail\{([^}]*)\}/);
    assert.ok(m, 'the new look names the editor\'s panel');
    const d = m[1].replace(/\s+/g, '');
    assert.match(d, /margin:0;/);
    assert.match(d, /border-left:1pxsolidvar\(--color-divider\)/);
    assert.match(d, /border-radius:0/);
    assert.match(d, /box-shadow:none/);
    assert.match(CE, /#clause-editor:not\(\.is-theirs\) \.ce-grid > \.ce-rail\{margin:8px 8px 8px 0; border-radius:var\(--radius-lg\); box-shadow:var\(--shadow-sm\); overflow:hidden\}/,
      'the 28 Oct card is untouched outside it');
  });
});
