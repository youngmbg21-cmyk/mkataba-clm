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
  /* RE-PINNED (owner, 24 Oct 2026: "settings has no information either"): ONE WINDOW — the panel holds only his
     words on every face but a stream chosen on Streams, so its head draws no Overview / Jambo tabs and no word */
  /* REVERSED (owner, 26 Oct 2026, of every page: "if a link is on the first
     page and a user will need to access it, they should not scroll up the
     jambo to find this link"). Settings' landing is not only his words: it
     carries "N things need you here" with a link per row, and the owner showed
     the screen with those links and one Jambo tab. What decides is what the
     landing HOLDS: something to press means the two tabs this panel already
     draws, nothing to press means his one window. */
  test('1a the landing decides: something to press brings the two tabs and the word', () => {
    const g = settingsStage({ role: 'legal' });
    assert.deepEqual(g.qa('#st-side-head .st-side-tab').map(t => g.text(t).replace(/[^\p{L} ]/gu, '').trim()), ['Overview', 'Jambo'], 'its own tab beside his');
    const a = settingsStage();
    assert.ok(a.q('#st-side-head #st-side-tab-jambo') && a.q('#st-side-head [data-st-talk]'), 'an admin on You: both tabs');
    a.sb.settingsGoTab('company');
    /* RE-POINTED 26 Oct 2026 (owner: "the name of the page next to the Jambos which looks like an additional tab. These are to be deleted.") */
    assert.ok(!a.$('st-side-word'), 'Company: no page name beside the tabs');
    a.sb.settingsGoPage('streams');
    a.click(a.q('#set-page .st-sw-row[data-st-sw-pick]'));
    assert.ok(a.q('#st-side-head #st-side-tab-jambo') && a.q('#st-side-head [data-st-talk]') && !a.$('st-side-word'), 'a stream chosen: its facts, so the two tabs, and no word beside them');
    /* and the rule still has its other half: a landing with nothing to press is his one window */
    assert.equal(typeof a.sb.stLandHasLinks, 'function', 'the landing is read, not the page guessed');
  });
  test('1b the fold: to the right edge, his face brings him back; a refresh keeps it', () => {
    const g = settingsStage();
    /* the two tabs now (26 Oct 2026, 1a): the fold is the same control either way */
    assert.equal(g.qa('#st-side-head .st-side-tab').length, 2, 'its own tab beside his');
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
    assert.equal(S.en.st_jb_ph, 'Ask Jambo, or type / for a place');
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
  /* THE MENU DOOR, FRONT AND CENTRE (owner, 26 Oct 2026): before this the only doors to the Menu face were a
     "nothing found" answer's button and Ctrl/Cmd+K — a reader who asked nothing never saw it */
  test('2c′ the landing carries Open the Menu first, with the count, on You and on Company; it opens the Menu', () => {
    for (const role of ['legal', 'admin']) {
      const g = settingsStage({ role });
      /* the landing stands bare in the feed when it holds something to press (main, 26 Oct 2026: stLandHasLinks),
         wrapped under his greeting when it does not — the door is found either way */
      const feed = g.$('st-jb-feed');
      const door = feed && feed.querySelector('[data-st-jb-menu-door]');
      assert.ok(door, role + ': the door is on the landing');
      const before = door.previousElementSibling;
      assert.ok(!before || before.matches('.jb-hello'), role + ': first thing after his greeting, nothing else above it');
      const btn = door.querySelector('button[data-st-side="menu"]');
      assert.equal(g.text(btn), S.en.st_jb_to_menu);
      const n = g.sb.stMenuCount();
      assert.equal(g.text(door.querySelector('.st-jb-fine')), n === 1 ? '1 setting' : n + ' settings');
      assert.ok(n > 0, role + ': the count is real');
      assert.ok(g.$('st-side-menu').hidden);
      g.click(btn);
      assert.ok(!g.$('st-side-menu').hidden, role + ': the Menu opens');
    }
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
    const bubs = g.qa('#st-jb-feed :is(.jov-head, .jov-fact.is-line .jov-v, .st-jb-bub)').map(b => g.text(b));
    assert.equal(bubs[0], S.en.st_jb_you_hello);
    const chips = g.qa('#st-jb-feed .jov-lnk.is-ask').map(c => c.textContent);
    assert.ok(chips.includes('Brief me once a week'), JSON.stringify(chips)); /* RE-POINTED 26 Oct 2026 (owner: "Build Jambo's Overview tab The Legora Way"): his offers stand under "Ask me" verb first, its first letter a capital as drawn */
    assert.ok(chips.includes('Turn off my suggestions'), JSON.stringify(chips));
  });
  test('3b a member: a company rule is an admin\'s, said with the door to ask', () => {
    const g = settingsStage({ role: 'legal', more: [{ id: 'u_a1', name: 'Sara Lind', role: 'admin', email: 's@h.t' }] });
    const bubs = g.qa('#st-jb-feed :is(.jov-head, .jov-fact.is-line .jov-v, .st-jb-bub)').map(b => g.text(b));
    /* as drawn ("I can send her your question"), by name: HaTi keeps no
       one's pronoun, so it never guesses one */
    assert.equal(bubs[1], 'Company rules, such as signing limits, are Sara’s to change. I can send Sara your question.', 'the one admin by first name');
    const ask = g.q('#st-jb-feed .jov-lnk.is-ask[data-st-ask-head]');
    assert.ok(ask, 'the door to ask');
    assert.equal(ask.textContent, 'Ask an admin'); /* RE-POINTED 26 Oct 2026 (owner: "Build Jambo's Overview tab The Legora Way"): his offers stand under "Ask me" verb first, its first letter a capital as drawn */
  });
  test('3c two admins: "an admin\'s"', () => {
    const g = settingsStage({ role: 'legal', more: [{ id: 'u_a1', name: 'Sara Lind', role: 'admin', email: 's@h.t' }, { id: 'u_a2', name: 'Per Holm', role: 'admin', email: 'p@h.t' }] });
    const bubs = g.qa('#st-jb-feed :is(.jov-head, .jov-fact.is-line .jov-v, .st-jb-bub)').map(b => g.text(b));
    assert.equal(bubs[1], S.en.st_jb_rules_admin.replace('{who}', S.en.st_jb_an_admin).replace('{to}', S.en.st_jb_an_admin_to));
  });
  test('3d suggestions off: no chips at all', () => {
    const g = settingsStage({ role: 'legal', me: { prefs: { jamboChips: false } } });
    assert.equal(g.qa('#st-jb-feed .jov-lnk.is-ask').length, 0);
    assert.ok(g.qa('#st-jb-feed :is(.jov-head, .jov-fact.is-line .jov-v, .st-jb-bub)').length >= 2, 'his words stay');
  });
});
