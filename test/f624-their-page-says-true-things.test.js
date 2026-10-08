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
const portal = () => loadViews(['js/views/portal.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });

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
