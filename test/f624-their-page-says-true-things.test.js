/* ============================================================
   F624 — their page says true things (overnight run, 8 Oct 2026)
   ============================================================
   (F6) A Send that cannot reach HaTi said the browser's raw "Failed to
        fetch". It now says HaTi could not be reached, and — on a Send of
        answers — that the answers are kept on this page. A refusal the
        server wrote is still the server's sentence. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
const PORTAL = fs.readFileSync(path.join(__dirname, '..', 'js/views/portal.js'), 'utf8');
const portal = () => loadViews(['js/views/portal.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS, fval: () => '' });

describe('f624 (F6) — HaTi could not be reached', () => {
  test('a dropped connection is said in words, and a held answer is said kept', () => {
    const w = portal();
    const net = new TypeError('Failed to fetch');
    assert.match(w.portalErrText(net, 'x', true), /could not be reached — your answers are kept on this page/);
    assert.match(w.portalErrText(net), /could not be reached — nothing was sent/);
    assert.match(w.portalErrText(new TypeError('NetworkError when attempting to fetch resource.')), /could not be reached/);
    const gw = Object.assign(new Error('Request failed (503)'), { status: 503, data: null });
    assert.match(w.portalErrText(gw), /could not be reached/);
  });
  test('the server\'s own refusal is kept as written', () => {
    const w = portal();
    const e = Object.assign(new Error('This link has already been answered.'), { status: 409, data: { error: 'x' } });
    assert.equal(w.portalErrText(e), 'This link has already been answered.');
  });
  test('every catch on their Send, sign and code paths goes through it', () => {
    const code = PORTAL.replace(/\/\*[\s\S]*?\*\//g, ' ');
    const from = code.indexOf('async function portalRespond(');
    const slice = code.slice(from, from + 60000);
    assert.ok(!/toast\(e\.message/.test(slice), 'no raw e.message toast on their send paths');
    assert.ok(!/esc\(e\.message/.test(slice), 'and none painted into the page');
  });
});

/* (F8) Three promises of email were printed while email is off. Each now
   says what is true: keep this link, it comes alive / the copy is here. */
describe('f624 (F8) — no promise of email when email is off', () => {
  const rec = { name: 'Grace Njeri', title: 'Director', at: '2026-10-08T09:00:00.000Z', verified: false };
  const p = { sharedBy: 'Amina Otieno', org: 'Highland', contract: { counterparty: 'Nordbygg AB' } };
  test('the receipt promises the signed copy by email only where email goes', () => {
    const w = portal();
    w.PORTAL_OPTS = { emailConfigured: false, signingOrder: [{ step: 1, rows: [{ name: 'Elin', signed: false }] }] };
    const off = w.portalReceiptHtml(p, rec);
    assert.ok(!/by email/.test(off), off);
    assert.match(off, /Keep this link/);
    w.PORTAL_OPTS = { emailConfigured: true, signingOrder: [{ step: 1, rows: [{ name: 'Elin', signed: false }] }] };
    assert.match(w.portalReceiptHtml(p, rec), /by email/);
    w.PORTAL_OPTS = { emailConfigured: false, signingOrder: [] };
    assert.ok(!/by email/.test(w.portalReceiptHtml(p, rec)));
  });
  test('the hold and the code line choose their sentence by whether email goes', () => {
    assert.match(PORTAL, /PORTAL_OPTS\.emailConfigured===false\?'po_hold_wait_nomail':'po_hold_wait'/);
    assert.match(PORTAL, /opts\.emailConfigured===false\?'po_code_goes_here_nomail':'po_code_goes_here'/);
    const I18N = fs.readFileSync(path.join(__dirname, '..', 'js/i18n.js'), 'utf8');
    for (const k of ['po_hold_wait_nomail', 'po_code_goes_here_nomail', 'po_rc_next_told_nomail', 'po_rc_next_waiting_nomail'])
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
    assert.ok(!/email/i.test(I18N.match(/po_hold_wait_nomail: '([^']*)'/)[1]));
  });
});

/* (F9) The trail recorded the company as the person: the recipient field held
   "Juno Limited" and portalResponderName answered with it. A recipient that
   names a party (or our org) is no answer, so the existing ask at their first
   Send (portalEnsureResponderName) runs and the name they type is recorded. */
describe('f624 (F9) — a company is not a person', () => {
  const opts = name => ({ share: { recipientName: name },
    payload: { org: 'Highland Corporate Ltd', contract: { counterparty: 'Juno Limited',
      parties: [{ name: 'Nordfrakt AB', side: 'theirs' }] } } });
  test('the company in the recipient field is not taken as the reader\'s name', () => {
    const w = portal();
    for (const firm of ['Juno Limited', ' juno  limited ', 'Nordfrakt AB', 'Highland Corporate Ltd']){
      w.PORTAL_OPTS = opts(firm);
      assert.equal(w.portalResponderName(), '', firm);
    }
  });
  test('a person in the recipient field still answers, as it always did', () => {
    const w = portal();
    w.PORTAL_OPTS = opts('Lars Berg');
    assert.equal(w.portalResponderName(), 'Lars Berg');
  });
  test('with no person known, the Send asks once', () => {
    const f = PORTAL.slice(PORTAL.indexOf('async function portalEnsureResponderName'), PORTAL.indexOf('async function portalEnsureResponderName') + 600);
    assert.match(f, /const have=portalResponderName\(\);\s*if\(have\) return have;[\s\S]*promptDialog/);
  });
});
