/* f677 — THE SIGNING SCREEN READS IN SVENSKA (the owner, 14 Oct 2026: "fix the
   Swedish signing screen English text").
   Before you sign drew English into a Swedish screen from code that wrote its
   sentences out: the signing order's rows, badges and buttons ("1st · their
   turn now — not told yet", "SIGNING NOW", "Tell them it is their turn"), the
   line under Sign, the list's own rows (the turn, the approval, the
   negotiation), the toasts while signing, the signatures so far on the signing
   copy ("partially signed"), the receipt's copies panel ("Held: only …") and
   the signed card on the paper, and the pad's "Save my signature". Each now
   reads a key both books carry; the English reads word for word as before.
   KEPT, AND SAID: the market's law line (jurisdiction.js) and the contract's
   own wording; the server's own refusals and its sealed copy are the server's.
   The browser half: test/chromium/signing-screen-svenska-verify.js. */
const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const I18N = R('js/i18n.js');
const books = (() => { const i = I18N.indexOf('\n  sv: {'); return [I18N.slice(0, i), I18N.slice(i)]; })();
const val = (book, k) => { const m = book.match(new RegExp('\\n    ' + k + ": ('(?:[^'\\\\]|\\\\.)*')")); return m ? m[1] : null; };
/* a function's body, comments stripped (PIN THE REGION) */
const region = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' not found');
  const j = src.indexOf('\nfunction ', i + 10); const k = src.indexOf('\nasync function ', i + 10);
  const end = [j, k].filter(x => x > 0).sort((a, b) => a - b)[0] || src.length;
  return src.slice(i, end).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''); };

describe('f677 (1) the words live in both books', () => {
  const keys = [...new Set((books[0].match(/\n    (sgx_[a-z0-9_]+|ord_[a-z]+): /g) || []).map(s => s.trim().replace(/:$/, '')))];
  test('1a every signing-screen word is in both books', () => {
    assert.ok(keys.length >= 100, keys.length + ' keys');
    keys.forEach(k => books.forEach((b, n) => assert.ok(val(b, k) != null, k + (n ? ' (sv)' : ' (en)'))));
  });
  test('1b and the Swedish is Swedish, not the English copied over', () => {
    const same = keys.filter(k => k !== 'sgx_n_outbox' && val(books[0], k) === val(books[1], k));
    assert.deepEqual(same, []);
  });
});

describe('f677 (2) the order words follow the language', () => {
  const I = require('../js/i18n.js');
  test('2 "1st · 2nd · 3rd · 11th · 21st" in English, "1:a · 2:a · 3:e · 11:e · 21:a" in Svenska', () => {
    const was = global.currentUser;
    try {
      global.currentUser = () => ({ lang: 'en' });
      assert.deepEqual([1, 2, 3, 11, 21].map(n => I.i18ord(n)), ['1st', '2nd', '3rd', '11th', '21st']);
      global.currentUser = () => ({ lang: 'sv' });
      assert.deepEqual([1, 2, 3, 11, 21].map(n => I.i18ord(n)), ['1:a', '2:a', '3:e', '11:e', '21:a']);
    } finally { global.currentUser = was; }
  });
});

describe('f677 (3) the screen\'s builders read the books, not their own English', () => {
  const AP = R('js/approvals.js'), CT = R('js/views/contract.js'), NG = R('js/negotiation.js'), CO = R('js/core.js'), SG = R('js/signature.js');
  const gone = (src, name, phrases) => { const r = region(src, name); phrases.forEach(p => assert.ok(!r.includes(p), `${name} still writes "${p}"`)); };
  test('3a the signing order', () => gone(AP, 'signerRouteHtml', ["their turn now —", "'SIGNING NOW'", "'Tell them it is their turn'", '>edit route<', "s.signature.form+' signature'", "['th','st','nd','rd']"]));
  test('3b the line under Sign, the list before a signature, the toasts while signing', () => {
    gone(CT, 'renderSignButton', ['Freezes the exact text']);
    gone(CT, 'signBlockers', ['The next signature is', 'Internal approval is', 'approvals outstanding', 'Settle the negotiation first', 'attention first']);
    gone(CT, 'signDocument', ['Next signer is', 'Internal signing complete', 'signer(s) remaining', 'reserved for']);
    gone(CT, 'sealOnServer', ['Sealed with your signature', 'Signed & sealed']);
    gone(NG, 'negoSigningBlockers', ['proposed edit', 'not been answered', 'refused ask']);
    gone(CO, 'contractReadiness', ['No counterparty is set', 'No contract value is set', 'unfilled placeholder']);
  });
  test('3c the signatures so far, the signed cards, the copies panel, the pad', () => {
    gone(CT, 'signatureBlock', ['partially signed', 'The marks below', "'Counterparty'", "'Not recorded'", 'Signer identity is verified', "s.form?esc(s.form)+' signature'", "s.form?s.form+' signature'"]);
    gone(CT, 'externalExecutionBlock', ['Filed into HaTi by', 'ORIGINAL FILE FINGERPRINT', 'For a migrated contract']);
    gone(CT, 'distributionPanelHtml', ['Held: only', 'Send signed copies', 'Send a progress notice', "'Delivered'", ' Send again<']);
    assert.ok(!SG.includes('Save my signature for next time'), 'the pad still writes its save line');
  });
  test('3d one reading for how a signature was made, published', () => {
    assert.match(SG, /function sigFormWord\(form\)/);
    assert.match(SG, /Object\.assign\(window,\{[^}]*sigFormWord/);
    assert.match(I18N, /i18t, i18tn, i18ord, srvMsg/);
  });
  test('3e kept: the market\'s own law line is the market\'s, not the language\'s', () => {
    assert.match(R('js/jurisdiction.js'), /esignatureShort: 'Electronic signatures under the Business Laws \(Amendment\) Act 2020 \(Kenya\)\.'/);
  });
});
