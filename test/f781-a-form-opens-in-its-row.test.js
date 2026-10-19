'use strict';
/* f781 — A FORM OPENS IN ITS ROW (round 24 "One sheet" as drawn, the gaps of
   18 Oct 2026: "Two-step sign-in and When you're away open inside their
   row"; every Change on the sheet "Opens in place")

   ONE FORM, TWO HOSTS: the descriptor the drawer paints (stMeDrawer) is
   painted under the row that asked for it, and the writers are untouched —
   their stDrawerRefuse / stDrawerClose reach the row while it is open.
     (1) the door opens the form under its row, Save first and Cancel last;
         the same door again closes it; Cancel closes it; Esc in it closes it
     (2) away's Save is grey with its reason until a colleague is chosen
     (3) a refusal lands in the row's own foot; a save closes the row
     (4) one form at a time: a drawer closes the row; another row's door
         moves it; Jambo's "show me" opens the row on the sheet
     (5) your name and job title, your email with your password — the
         routes they write through
   AT THE PARENT (8dc306a) every test here fails.
   Run: node --test test/f781-a-form-opens-in-its-row.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { settingsStage, S } = require('./settingsworld.js');

const open = (g, k) => g.click(g.q(`#set-page [data-st-rform="${k}"]`));

describe('f781 (1) the door opens the form under its row', () => {
  test('1a away: under its row, Save then Cancel; the door says it is open', () => {
    const g = settingsStage();
    open(g, 'me:away');
    const f = g.$('st-rform');
    assert.ok(f, 'the form is drawn');
    assert.equal(f.previousElementSibling.getAttribute('data-st-row'), 'me:away', 'right under its row');
    assert.ok(f.querySelector('#st-aw-who') && f.querySelector('#st-aw-from'), 'its boxes');
    const acts = [...f.querySelectorAll('.st-rform-acts .ui-btn')].map(b => b.textContent);
    assert.deepEqual(acts, [S.en.act_save, S.en.act_cancel], 'Save first, Cancel last');
    assert.equal(g.q('#set-page [data-st-rform="me:away"]').getAttribute('aria-expanded'), 'true');
    assert.ok(!g.q('#st-drawer.open'), 'no drawer');
  });
  test('1b the same door again closes it (PRESS IT AGAIN AND IT CLOSES); Cancel closes it', () => {
    const g = settingsStage();
    open(g, 'me:away'); open(g, 'me:away');
    assert.equal(g.$('st-rform'), null);
    open(g, 'me:away'); g.click(g.q('#st-rform [data-st-rform-close]'));
    assert.equal(g.$('st-rform'), null);
  });
  test('1c Esc with the hand in the form closes it', () => {
    const g = settingsStage();
    open(g, 'me:password');
    g.key(g.$('pw-cur'), 'Escape');
    assert.equal(g.$('st-rform'), null);
  });
});

describe('f781 (2) a Save that cannot act is grey, with its reason', () => {
  test('2a away\'s Save waits for a colleague, and says so', () => {
    const g = settingsStage();
    open(g, 'me:away');
    const save = g.$('st-rform-save');
    assert.equal(save.disabled, true);
    assert.equal(g.text(g.q('#st-rform .st-rform-why')), S.en.st_aw_need_who);
    const who = g.$('st-aw-who'); who.value = 'u_two';
    who.dispatchEvent(new g.win.Event('change', { bubbles: true }));
    assert.equal(save.disabled, false, 'a colleague chosen: Save is live');
    assert.equal(g.text(g.q('#st-rform .st-rform-why')), '');
  });
});

describe('f781 (3) the writers reach the row', () => {
  test('3a a refusal lands in the row\'s foot; nothing goes to the drawer', async () => {
    const g = settingsStage();
    open(g, 'me:password');
    g.$('pw-cur').value = 'old-password-1'; g.$('pw-new').value = 'short'; g.$('pw-again').value = 'short';
    g.click(g.$('st-rform-save')); await g.flush();
    const r = g.$('st-rform-refusal');
    assert.ok(r && !r.hasAttribute('hidden') && r.textContent.length > 3, 'said in the row');
  });
  test('3b a save closes the row and the section says the new fact', async () => {
    const g = settingsStage({ reply: (r, m) => r === 'password/change' ? { ok: true } : null });
    open(g, 'me:password');
    g.$('pw-cur').value = 'old-password-1'; g.$('pw-new').value = 'a-new-password-9'; g.$('pw-again').value = 'a-new-password-9';
    g.click(g.$('st-rform-save')); await g.flush();
    assert.equal(g.$('st-rform'), null, 'the row closed');
    assert.ok(g.log.api.some(a => a.route === 'password/change'), 'the one route');
    assert.match(g.text(g.q('[data-st-you-card="safety"] [data-st-row="me:password"] .st-sv')), /^Changed /);
  });
});

describe('f781 (4) one form at a time', () => {
  test('4a another row\'s door moves the form; a drawer opening closes it', () => {
    const g = settingsStage();
    open(g, 'me:away'); open(g, 'me:name');
    assert.equal(g.qa('#st-rform').length, 1);
    assert.equal(g.$('st-rform').getAttribute('data-st-rform-of'), 'me:name');
    g.sb.stDrawerOpen('limits');
    assert.equal(g.$('st-rform'), null, 'the drawer took over');
  });
  test('4b Jambo\'s "show me" opens the row on the sheet', () => {
    const g = settingsStage();
    g.sb.stYouGo('away');
    assert.ok(g.$('st-rform') && g.$('st-rform').getAttribute('data-st-rform-of') === 'me:away');
  });
  test('4c a repaint of the section carries the open form across, what was typed kept', () => {
    const g = settingsStage();
    open(g, 'me:name');
    g.$('st-me-title').value = 'typed but not saved';
    g.sb.stYouCardRepaint('who');
    assert.equal(g.$('st-me-title').value, 'typed but not saved');
  });
});

describe('f781 (5) your name, your email', () => {
  test('5a your name and job title: the one route, your own record', async () => {
    const g = settingsStage({ role: 'legal', reply: (r, m, b) => r === 'users/u_me' && m === 'PATCH' ? { ok: true, user: { id: 'u_me', name: b.name || 'Young Mbagaya', title: b.title, role: 'legal', email: 'me@hati.test' } } : null });
    open(g, 'me:name');
    g.$('st-me-name').value = 'Young M. Mbagaya';
    g.click(g.$('st-rform-save')); await g.flush();
    const p = g.log.api.find(a => a.route === 'users/u_me');
    assert.ok(p && p.method === 'PATCH' && p.body.name === 'Young M. Mbagaya' && !('title' in p.body), 'only what moved');
    assert.equal(g.me.name, 'Young M. Mbagaya');
    assert.equal(g.$('st-rform'), null);
  });
  test('5b an empty name is refused in the row', async () => {
    const g = settingsStage();
    open(g, 'me:name'); g.$('st-me-name').value = '  ';
    g.click(g.$('st-rform-save')); await g.flush();
    assert.equal(g.text(g.$('st-rform-refusal')), S.en.st_you_name_need);
    assert.ok(!g.log.api.some(a => a.route.startsWith('users/')));
  });
  test('5c your email: with your current password, through POST me/email', async () => {
    const g = settingsStage({ reply: (r, m) => r === 'me/email' ? { ok: true, user: { id: 'u_me', email: 'young@hati.test', name: 'Young Mbagaya', role: 'admin' } } : null });
    open(g, 'me:email');
    g.$('st-me-email').value = 'Young@Hati.test';
    g.click(g.$('st-rform-save')); await g.flush();
    assert.equal(g.text(g.$('st-rform-refusal')), S.en.st_you_email_need_pw, 'the password is asked first');
    g.$('st-me-email-pw').value = 'the-current-one';
    g.click(g.$('st-rform-save')); await g.flush();
    const p = g.log.api.find(a => a.route === 'me/email');
    assert.equal(JSON.stringify(p && p.body), JSON.stringify({ email: 'young@hati.test', current: 'the-current-one' }));
    assert.equal(g.me.email, 'young@hati.test');
  });
  test('5d a server refusal is said in the row (an address in use)', async () => {
    const g = settingsStage({ reply: r => r === 'me/email' ? new Error('Another member already uses that email') : null });
    open(g, 'me:email');
    g.$('st-me-email').value = 'asha@hati.test'; g.$('st-me-email-pw').value = 'x';
    g.click(g.$('st-rform-save')); await g.flush();
    assert.equal(g.text(g.$('st-rform-refusal')), 'Another member already uses that email');
  });
});
