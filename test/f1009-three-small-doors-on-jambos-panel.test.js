/* f1009 — THREE SMALL DOORS ON JAMBO'S PANEL (owner, 11 Nov 2026; drawn first, then "build all three")
     1 · Jambo's grey card that says what he did has a × top right (ONE builder jamboSayCardHtml, `close`); pressed
         (caGoPress 'echoshut') the card goes and nothing else is pressed
     2 · a group of notes beside the paper that stands open says "Show less" (pd2GroupHtml, data-pd2-fold); a group the
         reader folded stays folded whatever its drift (_pd2Shut, data-pd2-shut), and "+ N more here" opens it again
     3 · with the panel folded to its strip, Ask Jambo over selected words presses the strip's own opener first
   At the parent all three fail. The browser's side: notes-match-clauses-verify 5b, 9, 10 (GitHub).
   Run: node --test test/f1009-three-small-doors-on-jambos-panel.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const noComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fn = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' found'); const j = src.indexOf('\nfunction ', i + 10), k = src.indexOf('\nasync function ', i + 10); const ends = [j, k].filter(x => x > 0); return noComments(src.slice(i, ends.length ? Math.min(...ends) : i + 6000)); };
const CMP = read('js/components.js'), CA = read('js/copilotacts.js'), PD = read('js/paperdesk.js'), I18 = read('js/i18n.js'), HTML = read('index.html');

describe('f1009 (1) the × on Jambo\'s grey card', () => {
  /* the builder itself, run: it needs nothing of the page */
  const build = new Function('esc', 'i18t', fn(CMP, 'jamboSayCardHtml') + '; return jamboSayCardHtml;')(s => String(s == null ? '' : s).replace(/"/g, '&quot;'), k => k);
  test('the one builder draws a × only where a caller gives it a press', () => {
    const plain = build({ text: 'hello' });
    assert.doesNotMatch(plain, /jb-say-x/);
    const shut = build({ text: 'hello', close: 'data-ca-act="echoshut" data-ca-turn="3"' });
    assert.match(shut, /<button type="button" class="jb-say-x" data-ca-act="echoshut" data-ca-turn="3"/);
    assert.match(shut, /aria-label="jb_say_close"/);
    assert.match(shut, /<svg/, 'a drawn icon, never a typed x');
    assert.ok(shut.indexOf('jb-say-x') < shut.indexOf('jb-say-b'), 'in the head, above the words');
  });
  test('the card that says what he did asks for it, and the press only removes the card', () => {
    assert.match(fn(CA, 'caEchoHtml'), /close: `data-ca-act="echoshut" data-ca-turn="\$\{i\}"`/);
    const press = fn(CA, 'caGoPress');
    const m = press.match(/if \(act === 'echoshut'\)\{([^}]*)\}/);
    assert.ok(m, 'caGoPress answers echoshut');
    assert.match(m[1], /a\.said = ''/);
    assert.match(m[1], /\.ca-echo-top/);
    assert.doesNotMatch(m[1], /caPlaceGo|caGo\(|setView/, 'it goes nowhere');
    assert.ok(press.indexOf("'echoshut'") < press.indexOf("'goback'"), 'answered before any move');
  });
  test('its label in both books, its clothes in the sheet', () => {
    assert.equal((I18.match(/\n {4}jb_say_close: /g) || []).length, 2);
    assert.match(HTML, /\.jb-say-x\{[^}]*margin-left:auto[^}]*\}/);
  });
});

describe('f1009 (2) Show less', () => {
  const g = fn(PD, 'pd2GroupHtml');
  test('a group of two or more carries the link beside "+ N more here"', () => {
    assert.match(g, /g\.items\.length > 1 \? `<button type="button" class="ui-link pd2-mg-less" data-pd2-fold>\$\{E\(_pdT\('pd2_g_less'\)\)\}<\/button>` : ''/);
    assert.match(g, /\$\{more\}\$\{less\}\$\{open\}/);
    assert.match(g, /_pd2Shut\.has\(String\(g\.cid\) \+ '\|' \+ g\.at\) \? ' data-pd2-shut="1"' : ''/);
  });
  test('a group the reader folded stays folded whatever its drift', () => {
    assert.match(fn(PD, 'pd2GroupsPlace'), /!el\.hasAttribute\('data-pd2-open'\) && g\.items\.length > 1 && \(el\.hasAttribute\('data-pd2-shut'\) \|\| at - want > PD2_FOLD_DRIFT\)/);
  });
  test('the two presses undo each other, and each lays the notes out again', () => {
    const src = noComments(PD);
    const fold = src.slice(src.indexOf("closest('#pd2-notes [data-pd2-fold]')")); const foldEnd = fold.slice(0, fold.indexOf('});'));
    assert.match(foldEnd, /removeAttribute\('data-pd2-open'\)/); assert.match(foldEnd, /_pd2Unfolded\.delete\(key\); _pd2Shut\.add\(key\)/); assert.match(foldEnd, /pd2NotesPaint\(/);
    const un = src.slice(src.indexOf("closest('#pd2-notes [data-pd2-unfold]')")); const unEnd = un.slice(0, un.indexOf('});'));
    assert.match(unEnd, /removeAttribute\('data-pd2-shut'\)/); assert.match(unEnd, /_pd2Unfolded\.add\(key\); _pd2Shut\.delete\(key\)/);
  });
  test('shown on an open group, gone on a folded one; the label in both books', () => {
    assert.match(HTML, /#pd2-notes \.pd2-mg \.pd2-mg-less\{display:inline/);
    assert.match(HTML, /#pd2-notes \.pd2-mg\.is-folded \.pd2-mg-less\{display:none\}/);
    assert.equal((I18.match(/\n {4}pd2_g_less: /g) || []).length, 2);
  });
});

describe('f1009 (3) Ask Jambo with the panel folded', () => {
  test('the strip\'s own opener is pressed before the box is looked for', () => {
    const pick = fn(CA, 'caSelPick');
    const ask = pick.slice(pick.indexOf("act.id === 'ask'"), pick.indexOf("act.id === 'oblig'"));
    const open = ask.indexOf("!intel.dockOpen"), door = ask.indexOf("getElementById('igd-expand')"), box = ask.indexOf('igAskBox()');
    assert.ok(open >= 0 && door > open && box > door, 'folded → igd-expand → the box');
    assert.match(ask, /door\.click\(\)/);
    assert.match(ask, /ca_sel_ask_fill/, 'then the words go in as they always did');
  });
});
