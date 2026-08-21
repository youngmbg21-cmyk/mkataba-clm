/* ============================================================
   F227 — the whole contract is read, and a quote is one passage
   ============================================================
   Written after the first live measurement of HaTi's Copilot against
   contracts it did not write (test/cuad — 50 real agreements marked up by
   commercial lawyers). Two product defects came out of it, and both are
   pinned here because both were INVISIBLE: nothing failed, nothing was
   logged, and the wrong answer arrived wearing the right answer's clothes.

   1. FOUR SILENT SLICES. Three routes carried a hard slice(0, 20000) and one
      a slice(0, 12000) — and the BROWSER sliced to 20,000 a second time
      before posting, so fixing the server alone would have fixed nothing.
      None of the four was recorded in the rulebook, in MAP-HISTORY or in any
      work order; they arrived inside commits about other subjects. Measured:
      41 of 50 real contracts are longer than 20,000 characters, the median
      is 37,970, and the obligations reader returned NOTHING AT ALL on every
      truncated one. A feature that degrades to silence is worse than one
      that degrades to partial, because silence reads as "this contract has
      no obligations".

      They also broke a promise the code makes in writing. capAiInput's own
      comment says "defaults sit above what the client sends, so genuine use
      is never trimmed" — and these ran afterwards, trimming exactly that.

   2. SPLICED QUOTES. 34 of 125 returned spans (27%) could not be found in
      the contract. inspect.js split each at its ellipsis and checked every
      fragment: all were genuinely in the wording and the JOIN was invented.
      Not hallucination and not a reading fault — a missing instruction. It
      matters because those spans are printed to the customer AS QUOTATIONS
      from their own contract.

   3. AND THE "NONE FOUND" MESSAGE WAS SILENT. runFindObligations called
      toast() with no kind, which by this product's own rule prints nothing —
      so a scan that found nothing was indistinguishable from a dead button.

   The rules pinned here:
   - ONE CEILING FOR ONE CONTRACT (aiDocChars), set ABOVE any real contract
     rather than below most of them, configurable like every other cap.
   - THE BULK BUDGET IS A DIFFERENT QUESTION and is left alone — aiMaxChars
     still bounds a portfolio call and divides across its contract list,
     which is where a cap genuinely earns its place.
   - A CAP IS A FACT, NEVER A SILENT TRIM. It marks the text and sets
     req.aiInputCapped, which aiNotice already turns into a sentence.
   - THE BRIEF HASHES EXACTLY WHAT IT SENDS, or a change past the cut never
     refreshes the cached memo.
   - A QUOTE IS ONE CONTINUOUS PASSAGE, said once and reaching every tool
     that returns one, so the four cannot drift apart.

   These are SOURCE claims on purpose. Every one of these faults was a line
   of code that ran perfectly and produced a wrong answer, so the thing worth
   guarding is the line, not the behaviour — a jsdom or fixture test would
   have passed against all four. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const SERVER = read('server/server.js');
const OBLIG = read('js/obligations.js');
const AI = read('js/ai.js');
const PLAYBOOK = read('js/playbook.js');
const I18N = read('js/i18n.js');

/* Comments describe the fault and must not be mistaken for the fault. */
const stripComments = s => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const SERVER_CODE = stripComments(SERVER);

describe('F227 — the whole contract is read', () => {

  /* ---------- 1. the four slices are gone, and stay gone ---------- */

  test('no hardcoded document truncation survives on the server', () => {
    /* The two that remain are the Copilot BRIEF and SNAPSHOT — the rulebook
       and the live figures handed to the model, not a customer's wording. */
    const hits = SERVER_CODE.split('\n')
      .map((l, i) => [i + 1, l])
      .filter(([, l]) => /slice\(0,\s*(20000|12000)\)/.test(l))
      .filter(([, l]) => !/guideRules|guideLive/.test(l));
    assert.deepEqual(hits, [], 'a hardcoded contract truncation is back: ' + JSON.stringify(hits));
  });

  test('no hardcoded document truncation survives in the browser', () => {
    /* Named routes only. family.js reads a document HEAD to guess a parent —
       a heuristic on the front matter, deliberately, and not an AI read. */
    for (const [name, src] of [['obligations', OBLIG], ['ai', AI], ['playbook', PLAYBOOK]]) {
      const bad = stripComments(src).split('\n')
        .filter(l => /api\(\s*'ai\//.test(l) && /slice\(\s*0\s*,\s*\d{4,}/.test(l));
      assert.deepEqual(bad, [], `${name}.js truncates before posting: ` + JSON.stringify(bad));
    }
  });

  test('all four AI document reads post the whole wording', () => {
    assert.match(OBLIG, /api\('ai\/obligations','POST',\{ text \}\)/);
    assert.match(AI, /api\('ai\/brief','POST',\{ id:c\.id, text:String\(text\|\|''\), force/);
    assert.match(PLAYBOOK, /api\('ai\/playbook','POST',\{ text, playbook:pb/);
    /* renewal is server-built and never had a browser half. */
    assert.match(SERVER_CODE, /DOCUMENT:\\n\$\{aiDocText\(req, contractFullBody\(full\)\)\}/);
  });

  /* ---------- 2. the one ceiling ---------- */

  test('aiDocChars is one configurable ceiling, above any real contract', () => {
    assert.match(SERVER_CODE, /const aiDocChars = \(\) => intSetting\('aiDocChars', 'AI_DOC_CHARS', 200000\)/);
    /* Above the longest of 510 professionally-drafted contracts (73,685
       characters, measured off test/cuad/contracts.json) with room to spare,
       and far below the runaway case it exists for. */
    const DEFAULT = 200000, LONGEST_REAL = 73685;
    assert.ok(DEFAULT > LONGEST_REAL * 2,
      'the ceiling must sit clear of real contracts, not just above them');
  });

  test('it is readable and settable like every other cap', () => {
    assert.match(SERVER_CODE, /aiDocChars: aiDocChars\(\)/, 'not on /api/pulse');
    assert.match(SERVER_CODE, /docChars: aiDocChars\(\)/, 'not on /api/ai/config');
    assert.match(SERVER_CODE, /setNum\('aiDocChars', docChars, 1000\)/, 'not settable');
    assert.match(SERVER_CODE, /dailyLimit, maxChars, docChars, maxContracts/,
      'settable but never read off the request body');
  });

  test('the bulk budget is a different question and is left alone', () => {
    /* aiMaxChars still bounds a portfolio call and divides across its list.
       Riding the document ceiling would have multiplied a ten-contract
       Copilot question more than threefold. */
    assert.match(SERVER_CODE, /intSetting\('aiMaxChars', 'AI_MAX_CHARS', 60000\)/);
    assert.match(SERVER_CODE, /const per = Math\.max\(2000, Math\.floor\(\(maxC \* 3\) \/ b\[f\]\.length\)\)/);
  });

  test('b.text takes the document ceiling — it is one document on every route', () => {
    assert.match(SERVER_CODE, /const maxDoc = aiDocChars\(\);/);
    assert.match(SERVER_CODE,
      /b\.text\.length > maxDoc.*b\.text\.slice\(0, maxDoc\) \+ AI_TRUNC_MARK; capped = true;/);
  });

  /* ---------- 3. a cap is a fact, never a silent trim ---------- */

  test('a clipped document is marked, and the reader is told', () => {
    const fn = SERVER_CODE.match(/function aiDocText\(req, s\)[\s\S]*?\n\}/)[0];
    assert.match(fn, /req\.aiInputCapped = true/, 'clips without telling anyone');
    assert.match(fn, /\+ AI_TRUNC_MARK/, 'clips without marking the text for the model');
    assert.match(fn, /if \(t\.length <= max\) return t/, 'must not mark an untruncated document');
  });

  test('every route that reads a document folds the notice into its answer', () => {
    for (const route of ['obligations', 'brief', 'renewal', 'playbook']) {
      const at = SERVER_CODE.indexOf(`app.post('/api/ai/${route}'`);
      assert.ok(at > 0, `route ${route} not found`);
      const body = SERVER_CODE.slice(at, at + 6000);
      assert.match(body, /aiNotice\(req,/, `${route} never surfaces aiInputCapped`);
    }
  });

  /* ---------- 4. the brief hashes what it sends ---------- */

  test('the brief caches on exactly the text it read', () => {
    assert.match(SERVER_CODE, /const sent = aiDocText\(req, body\);\s*\n\s*const inputHash = sha\(sent\);/);
    assert.match(SERVER_CODE, /DOCUMENT:\\n\$\{sent\}/);
    /* Both halves, or a contract edited past the cut keeps a stale memo. */
    assert.ok(!/sha\(String\(body\)\.slice/.test(SERVER_CODE),
      'the cache key is a slice again, and no longer matches what was sent');
  });

  /* ---------- 5. a quote is one continuous passage ---------- */

  test('the quoting rule is stated once', () => {
    const decls = SERVER_CODE.match(/const AI_QUOTE_RULE = /g) || [];
    assert.equal(decls.length, 1, 'two copies of one rule will drift apart');
    const rule = SERVER_CODE.match(/const AI_QUOTE_RULE = '([^']*)'/)[1];
    assert.match(rule, /ONE continuous run of text/);
    assert.match(rule, /never join two separate passages/);
    assert.match(rule, /ellipsis/);
    /* A refusal needs its way forward: what to do when no single passage
       carries the answer, which is the case that caused the splicing. */
    assert.match(rule, /If no single passage carries the whole answer/);
  });

  test('it reaches every tool that hands a quote to a customer', () => {
    const uses = (SERVER_CODE.match(/AI_QUOTE_RULE/g) || []).length;
    assert.ok(uses >= 4, `the rule reaches ${uses - 1} tools; expected at least 3 plus its declaration`);
    /* Named, so a tool that quietly stops asking for it fails here. */
    assert.match(SERVER_CODE, /const span = \{ type: 'string'[^}]*AI_QUOTE_RULE/,
      'the extract sourceSpans — the ones printed on the upload confirm screen');
    assert.match(SERVER_CODE, /Short verbatim clause snippet this came from\.' \+ AI_QUOTE_RULE/,
      'the obligations quote');
    assert.match(SERVER_CODE, /Short verbatim snippet it comes from\.' \+ AI_QUOTE_RULE/,
      'the brief quote');
    assert.match(SERVER_CODE, /never two passages joined with "\.\.\."/,
      'the playbook prompt says it in its own words');
  });

  /* ---------- 6. and it says so when it finds nothing ---------- */

  /* ---- 7. the two fields the owner asked about ---- */

  test('noticePeriodDays names WHICH notice period, and ranks them', () => {
    /* It read "Notice period in days for termination/non-renewal" — two
       different clauses in one slot with no rule for which wins — while
       renewalDecisionDate subtracts it from the expiry to get the renewal
       deadline, the renewal card quotes its span as that deadline's source,
       and the reminder emails fire off it. */
    const d = SERVER_CODE.match(/noticePeriodDays: \{ type: 'number', description: '([^']*)'/)[1];
    assert.ok(!/termination\/non-renewal/.test(d), 'the unranked slash is back');
    assert.match(d, /return THIS one/, 'it must say which of the two wins');
    assert.match(d, /a week is 7, a month 30, a year 365/,
      'without a conversion rule "six months" can come back as 180, 182 or 6');
    /* The trap that caught this project's own scorer, named in the prompt so
       the model does not fall into it: the renewal clause states the renewal
       TERM before the notice. */
    assert.match(d, /successive one-year terms unless sixty \(60\) days notice/);
  });

  test('expiryDate refuses to estimate a date the document does not support', () => {
    /* Of 49 contracts whose expiry a lawyer marked, only 9 STATE a date and
       15 more can be derived. Asking for a date on the other 25 is asking for
       an invention — and silent arithmetic is what this product refuses
       everywhere else. */
    const d = SERVER_CODE.match(/expiryDate: \{ type: 'string', description: '([^']*)'/)[1];
    assert.match(d, /leave this EMPTY/);
    assert.match(d, /never estimate one/);
    assert.match(d, /a start date the document also states/,
      'a term alone is not enough — the anchor has to be stated too');
  });

  test('an empty obligations scan is visible, and speaks both languages', () => {
    assert.ok(!/toast\('No obligations detected'\)/.test(OBLIG),
      'the bare call is back — by this product\'s own rule it prints NOTHING');
    assert.match(OBLIG, /toast\(i18t\('ob_none_found'\),'warn'\)/);
    /* 'warn' and not 'err': nothing refused, nothing failed. */
    assert.ok(!/i18t\('ob_none_found'\),'err'/.test(OBLIG));
    for (const lang of ['ob_none_found:'])
      assert.equal((I18N.match(new RegExp(lang, 'g')) || []).length, 2,
        'the key must exist in BOTH dictionaries');
  });
});
