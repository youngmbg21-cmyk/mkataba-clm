/* f662 — THE OVERNIGHT BOOK READING READS THE COPY OF RECORD (BUGLOG 10 Oct
   2026, fixed 12 Oct). A contract filed on a signed copy whose words DIFFER
   from the agreed ones keeps that copy's text (`signedCopy.text`); the duties
   already read it (obligationsText, f654). The server's overnight key-terms
   reading (runBookReading) read the AGREED wording, so Insights' payment-terms
   figure could say thirty days where the copy of record says sixty.

   (1) copilotRecordWording answers the signed copy's text first, else the
       contract's own wording (copilotContractWording), whitespace-only ignored
   (2) runBookReading reads and hashes through it                              */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRV = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
const fnSrc = name => { const a = SRV.indexOf('function ' + name + '('); assert.ok(a >= 0, name + ' exists');
  let i = SRV.indexOf('{', a), depth = 0;
  for (; i < SRV.length; i++){ if (SRV[i] === '{') depth++; else if (SRV[i] === '}' && --depth === 0) break; }
  return SRV.slice(a, i + 1); };

describe('f662 (1) — the words of record', () => {
  const ctx = { richBodyToSearchText: s => String(s).replace(/<[^>]+>/g, ' ') };
  vm.createContext(ctx);
  vm.runInContext(fnSrc('copilotContractWording') + '\n' + fnSrc('copilotRecordWording'), ctx);
  test('a differing signed copy is read first', () => {
    const c = { redlineText: 'Payment within thirty (30) days.', signedCopy: { text: 'Payment within sixty (60) days.' } };
    assert.equal(ctx.copilotRecordWording(c), 'Payment within sixty (60) days.');
  });
  test('with no signed copy text, the contract\'s own wording', () => {
    assert.equal(ctx.copilotRecordWording({ redlineText: 'Payment within thirty (30) days.' }), 'Payment within thirty (30) days.');
    assert.equal(ctx.copilotRecordWording({ redlineText: 'Thirty.', signedCopy: { text: '   ' } }), 'Thirty.');
    assert.equal(ctx.copilotRecordWording({ upload: { extractedText: 'Uploaded words.' } }), 'Uploaded words.');
  });
});

describe('f662 (2) — runBookReading reads through it', () => {
  test('the wording it reads and hashes is the copy of record', () => {
    const body = fnSrc('runBookReading');
    assert.match(body, /const wording = copilotRecordWording\(c\);\s*const hash = sha\(wording\);/);
    assert.doesNotMatch(body, /copilotContractWording\(c\)/);
  });
});
