'use strict';
/* f788 — JAMBO BESIDE THE SETTINGS, AS DRAWN (rounds 24, 25 and 26, the gaps
   of 18 Oct 2026)
     (1) the panel's head: Jambo's face and name, a word for what it holds
         ("Your settings", "Company settings", "<stream> · stream", "Data &
         backup"), and a fold to the right edge; his face brings him back; a
         refresh keeps it folded
     (2) the Menu is no tab of its own: "/" in his box opens it (as the
         box's placeholder says), its head carries "‹ Jambo" back; his answer
         that finds nothing still offers it
     (3) on Your settings: his words ("nobody else sees them"), his chips
         as drawn; for a member, the second message — a company rule is an
         admin's, said with the door to ask; suggestions off, no chips
   AT THE PARENT (8dc306a) every test here fails but 2b and 2c: typing never
   acted, and an answer that found nothing already offered the Menu.
   Run: node --test test/f788-jambo-beside-the-settings.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { settingsStage, S } = require('./settingsworld.js');

const input = (g, el, v) => { el.value = v; el.dispatchEvent(new g.win.Event('input', { bubbles: true })); };

describe('f788 (1) the panel\'s head', () => {
  test('1a Jambo, and the word for what the panel holds, on every face', () => {
    const g = settingsStage({ role: 'legal' });
    assert.ok(g.q('#st-side-head #st-side-tab-jambo'), 'Jambo\'s tab in the head');
    /* RE-POINTED 19 Oct 2026 — JAMBO AS A TAB YOU FLIP TO (owner): the panel
       is the page's, its tab the landing, "Overview"; "Jambo" is the conversation */
    assert.equal(g.text(g.q('#st-side-tab-jambo')), S.en.pd_tab_overview);
    assert.equal(g.text(g.$('st-side-word')), S.en.st_side_you);
    const a = settingsStage();
    assert.equal(g.text(a.$('st-side-word')), S.en.st_side_you, 'an admin on You');
    a.sb.settingsGoTab('company');
    assert.equal(a.text(a.$('st-side-word')), S.en.st_side_company);
    a.sb.settingsGoPage('streams');
    assert.equal(a.text(a.$('st-side-word')), S.en.st_sw_title);
    a.sb.stDrawerOpen('trail');
    assert.equal(a.text(a.$('st-side-word')), S.en.st_p_backup);
  });
  test('1b the fold: to the right edge, his face brings him back; a refresh keeps it', () => {
    const g = settingsStage();
    assert.equal(g.qa('#st-side-head .st-side-tab').length, 1, 'one tab: Jambo, no Menu tab');
    g.click(g.q('#st-side-head [data-st-side-fold]'));
    assert.ok(g.$('set-page').classList.contains('is-side-folded') && g.$('st-side').classList.contains('is-folded'));
    assert.equal(g.sb.settingsPlace().fold, true, 'kept for a refresh');
    const h = settingsStage({ before: sb => sb.settingsPlacePut({ tab: 'you', side: 'jambo', fold: true }) });
    assert.ok(h.$('st-side').classList.contains('is-folded'), 'a refresh comes back folded');
    h.click(h.q('#st-side .st-side-unfold'));
    assert.ok(!h.$('st-side').classList.contains('is-folded') && !h.$('set-page').classList.contains('is-side-folded'));
  });
});

describe('f788 (2) the Menu, and "/"', () => {
  /* RE-POINTED 19 Oct 2026 (the gaps' third pass; JAMBO, THE SAME ON EVERY
     PAGE — main's rule): "/" in his box is every box's "/" (data-ca-slash,
     the places, js/copilotacts.js); the page keeps no "/" of its own. The
     Menu is still one press away where he finds nothing, with ‹ Jambo back */
  test('2a the box says it and carries every box\'s "/"; the Menu has ‹ Jambo', () => {
    const g = settingsStage();
    const box = g.$('st-jb-q');
    assert.equal(box.getAttribute('placeholder'), S.en.st_jb_ph);
    assert.equal(S.en.st_jb_ph, 'Ask for anything, or type /');
    assert.ok(box.hasAttribute('data-ca-slash'), 'the one "/" reader');
    input(g, box, '/');
    assert.equal(box.value, '/', 'the page keeps no "/" of its own');
    assert.ok(g.$('st-side-menu').hidden, 'the Menu does not jump in front');
    g.sb.stSideSet('menu');
    const back = g.q('#st-side-head .st-side-back[data-st-side="jambo"]');
    assert.ok(back, '‹ Overview');
    /* RE-POINTED 19 Oct 2026 (JAMBO AS A TAB YOU FLIP TO): back to the landing, "Overview" */
    assert.equal(g.text(back), '‹ ' + S.en.pd_tab_overview);
    g.click(back);
    assert.ok(g.$('st-side-menu').hidden && !g.$('st-side-jambo').hidden);
  });
  test('2b other words do not open it; typing never acts', () => {
    const g = settingsStage();
    input(g, g.$('st-jb-q'), '/x');
    assert.ok(g.$('st-side-menu').hidden);
    input(g, g.$('st-jb-q'), 'sign');
    assert.ok(g.$('st-side-menu').hidden);
    assert.equal(g.log.api.filter(a => /^ai\//.test(a.route)).length, 0);
  });
  test('2c his answer that finds nothing still offers the Menu', () => {
    const g = settingsStage();
    g.sb.stJbAsk('qwertyuiop zxcv');
    const door = g.q('#st-jb-feed [data-st-side="menu"]');
    assert.ok(door, 'Open the Menu');
    g.click(door);
    assert.ok(!g.$('st-side-menu').hidden);
  });
});

describe('f788 (3) on Your settings', () => {
  test('3a his words and chips, as drawn', () => {
    const g = settingsStage({ role: 'legal' });
    const bubs = g.qa('#st-jb-feed .st-jb-bub').map(b => g.text(b));
    assert.equal(bubs[0], S.en.st_jb_you_hello);
    const chips = g.qa('#st-jb-feed .st-jb-chip').map(c => c.textContent);
    assert.ok(chips.includes('brief me once a week'), JSON.stringify(chips));
    assert.ok(chips.includes('turn off my suggestions'), JSON.stringify(chips));
  });
  test('3b a member: a company rule is an admin\'s, said with the door to ask', () => {
    const g = settingsStage({ role: 'legal', more: [{ id: 'u_a1', name: 'Sara Lind', role: 'admin', email: 's@h.t' }] });
    const bubs = g.qa('#st-jb-feed .st-jb-bub').map(b => g.text(b));
    /* as drawn ("I can send her your question"), by name: HaTi keeps no
       one's pronoun, so it never guesses one */
    assert.equal(bubs[1], 'Company rules, such as signing limits, are Sara’s to change. I can send Sara your question.', 'the one admin by first name');
    const ask = g.q('#st-jb-feed .st-jb-chip[data-st-ask-head]');
    assert.ok(ask, 'the door to ask');
    assert.equal(ask.textContent, 'ask an admin');
  });
  test('3c two admins: "an admin\'s"', () => {
    const g = settingsStage({ role: 'legal', more: [{ id: 'u_a1', name: 'Sara Lind', role: 'admin', email: 's@h.t' }, { id: 'u_a2', name: 'Per Holm', role: 'admin', email: 'p@h.t' }] });
    const bubs = g.qa('#st-jb-feed .st-jb-bub').map(b => g.text(b));
    assert.equal(bubs[1], S.en.st_jb_rules_admin.replace('{who}', S.en.st_jb_an_admin).replace('{to}', S.en.st_jb_an_admin_to));
  });
  test('3d suggestions off: no chips at all', () => {
    const g = settingsStage({ role: 'legal', me: { prefs: { jamboChips: false } } });
    assert.equal(g.qa('#st-jb-feed .st-jb-chip').length, 0);
    assert.ok(g.qa('#st-jb-feed .st-jb-bub').length >= 2, 'his words stay');
  });
});
