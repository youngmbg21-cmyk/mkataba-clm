/* f585 — THE CONFIRMATIONS AFTER A SIGNATURE PRINT (B7, 8 Oct 2026).
   ============================================================
   A bare toast(msg) prints nothing (TOAST_KINDS): "Recorded — N signer(s)
   remaining", "Internal signing complete", "Signed & sealed" and "Sealed with
   your signature — X still has to sign" all said nothing after the act that
   most needs saying. Every toast in the signing functions now names a kind.
   The browser half (it is PAINTED) is seal-on-the-server-verify 1c.
   Run: node --test test/f585-the-signing-confirmations-print.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');

/* every toast( call in a source slice, with how many arguments it was given */
function toastCalls(s){
  const out = [];
  let i = 0;
  while ((i = s.indexOf('toast(', i)) >= 0){
    if (/[A-Za-z0-9_.$]/.test(s[i - 1] || '')){ i += 6; continue; }
    let d = 0, j = i + 5, q = null, args = 1;
    for (; j < s.length; j++){
      const ch = s[j];
      if (q){ if (ch === '\\'){ j++; continue; }
        if (ch === q) q = null;
        else if (q === '`' && ch === '$' && s[j + 1] === '{'){ let dd = 0; for (j += 2; j < s.length; j++){ if (s[j] === '{') dd++; else if (s[j] === '}'){ if (!dd) break; dd--; } } }
        continue; }
      if (ch === '"' || ch === "'" || ch === '`'){ q = ch; continue; }
      if ('([{'.includes(ch)) d++;
      else if (')]}'.includes(ch)){ d--; if (!d) break; }
      else if (ch === ',' && d === 1) args++;
    }
    out.push({ args, text: s.slice(i, Math.min(j + 1, i + 90)) });
    i = j;
  }
  return out;
}
const fnBody = (src, head) => { const a = src.indexOf(head); assert.ok(a >= 0, head); const b = src.indexOf('\n}\n', a); return src.slice(a, b); };
const CV = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8');
const AP = fs.readFileSync(path.join(__dirname, '..', 'js', 'approvals.js'), 'utf8');

for (const [src, head] of [[CV, 'async function signDocument(c){'], [CV, 'async function sealOnServer(c){'],
  [CV, 'async function finalizeExecution(c, opts={}){'], [CV, 'async function issueSigningAct(c){'],
  [CV, 'async function attachPaperSignature(c, file, opts={}){'], [AP, 'function wireApprovalPanel(']])
  test(`every confirmation in ${head.replace(/\(.*/, '')} names a kind`, () => {
    const calls = toastCalls(fnBody(src, head));
    assert.ok(calls.length, '[control] the function says something');
    const bare = calls.filter(c => c.args < 2);
    assert.deepEqual(bare.map(c => c.text), [], 'a bare toast prints nothing');
  });
