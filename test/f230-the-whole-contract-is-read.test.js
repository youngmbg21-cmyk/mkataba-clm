/* ============================================================
   F230 — the whole contract is read, and a quote is one passage
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

describe('F230 — the whole contract is read', () => {

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
    assert.match(SERVER_CODE, /verbatim clause snippet this came from, under \d+ characters\.' \+ AI_QUOTE_RULE/,
      'the obligations quote');
    assert.match(SERVER_CODE, /Short verbatim snippet it comes from\.' \+ AI_QUOTE_RULE/,
      'the brief quote');
    assert.match(SERVER_CODE, /never two passages joined with "\.\.\."/,
      'the playbook prompt says it in its own words');
  });

  /* ---------- 6. and it says so when it finds nothing ---------- */

  /* ---- 7. an answer cut short is not an empty answer ---- */

  test('a tool call stopped at max_tokens is recorded as a fact', () => {
    /* NOTHING in this file read stop_reason. A tool call stopped at the token
       ceiling returns a tool_use block whose input is partial or absent, and
       every route's "Array.isArray(block.input?.x) ? ... : []" turned "I ran
       out of room" into "there is nothing here". The input-truncation lesson
       on the OUTPUT side, and the same rule: a cap is a FACT. */
    assert.match(SERVER_CODE, /truncated: data && data\.stop_reason === 'max_tokens'/,
      'anthropicMessages must record it — one place, every route');
  });

  test('and it becomes a sentence for every route at once', () => {
    /* aiNotice is already folded into all eleven routes and js/api.js already
       toasts `notice`, so one line here reaches every one of them. */
    const fn = SERVER_CODE.match(/const aiNotice = \(req, out\) => \{[\s\S]*?\n\};/)[0];
    assert.match(fn, /out\.truncated/);
    assert.match(fn, /cut short/);
  });

  test('the obligations reader has room for the answer its schema allows', () => {
    /* maxItems is 12 and each item carries a description AND a verbatim
       quote — roughly 100 tokens apiece before the JSON around them, so 1500
       left about two obligations of headroom. Asking for one CONTINUOUS
       passage makes each quote longer than the spliced fragment it replaced,
       which is how a fix in one place can cost an answer in another. */
    const m = SERVER_CODE.match(/max_tokens: (\d+), tools: \[tool\], tool_choice: \{ type: 'tool', name: 'list_obligations'/);
    assert.ok(m, 'could not read the obligations token ceiling');
    /* The number is derived, not picked. maxItems items, each a description
       plus a WHOLE clause quoted continuously — a real clause runs 400-600
       characters, so ~150 tokens — plus due, recurring and the JSON around
       them: call it 200 tokens an item, and leave the wrapper room on top.
       Measured on the fourth scorecard run, 4,000 was exactly not enough:
       the two contracts that answered returned 20 and 18, and five came back
       cut off. */
    const items = Number(SERVER_CODE.match(/obligations: \{ type: 'array', maxItems: (\d+)/)[1]);
    assert.ok(Number(m[1]) >= items * 200,
      `${items} quoted obligations do not fit in ${m[1]} tokens`);
  });

  test('"none" and "cut off before it could say" are different answers', () => {
    const at = SERVER_CODE.indexOf("app.post('/api/ai/obligations'");
    const body = SERVER_CODE.slice(at, at + 4000);
    assert.match(body, /if \(!list\.length && resp\.truncated\)/,
      'an empty list from a cut-off call is reported as a fact about the contract');
    /* The screen prints an empty list as "No obligations found in this
       contract", which is a claim about the customer's paper. */
    assert.match(body, /ran out of room/);
  });

  /* ---- 8. the reader went silent on long agreements ---- */

  test('the obligations prompt names what a business actually has to track', () => {
    /* Third run, with the whole contract reaching it and room to answer: the
       three contracts that returned obligations were 14k-26k characters, the
       seven that returned NOTHING were 22k-52k. No truncation, no refusal —
       the model was asked and answered "nothing" about master supply
       agreements full of duties, because the prompt was one sentence naming
       five kinds. The two CUAD categories scoring ZERO were the two it never
       mentioned; the one it did name scored. */
    const at = SERVER_CODE.indexOf("app.post('/api/ai/obligations'");
    const body = SERVER_CODE.slice(at, at + 5000);
    for (const kind of ['audit and inspection rights', 'minimum volume or spend commitments',
                        'SURVIVE termination', 'exclusivity']) {
      assert.ok(body.includes(kind), `the prompt no longer asks for ${kind}`);
    }
    /* A restraint with no counterweight makes the empty list the cheapest
       safe answer on a long document. */
    assert.match(body, /Work through to the end/);
    assert.match(body, /rare in a commercial agreement/);
    /* And the restraint itself stays — widening the ask must not licence
       inventing one. */
    assert.match(body, /never invent one/);
  });

  test('the list may be as long as the contract really is', () => {
    /* The model already ignored maxItems 12 and returned 18 on a distributor
       agreement. A cap the model does not honour only misleads the reader of
       this schema. */
    const m = SERVER_CODE.match(/obligations: \{ type: 'array', maxItems: (\d+)/);
    assert.ok(Number(m[1]) >= 18, `a 50k master supply agreement carries more than ${m[1]} duties`);
  });

  test('the quote has a length, because two instructions were pulling apart', () => {
    /* "Short snippet" carried no number while AI_QUOTE_RULE asks for one
       CONTINUOUS passage — and an unbounded quote times twenty is what spent
       the token ceiling. The extract route's span has said "under 140
       characters" all along; this one had nothing. */
    const q = SERVER_CODE.match(/quote: \{ type: 'string', description: '([^']*)'/)[1];
    assert.match(q, /under \d+ characters/);
  });

  test('an absence is not a quotation', () => {
    /* Third run: the SPLICING was entirely gone (0 of 16 not-verbatim spans
       carried an ellipsis) and what replaced it was the model writing a
       sentence ABOUT the absence into a field that holds a quotation — "No
       retention provision in the contract". The old rule said "omit if the
       field is empty" and lost the argument to the sentence in front of it. */
    assert.match(SERVER_CODE, /never a sentence describing what is absent/);
    const d = SERVER_CODE.match(/const span = \{ type: 'string', description: ([\s\S]*?) \};/)[1];
    assert.match(d, /LEAVE THIS EMPTY/);
    assert.match(d, /is not a quotation/);
  });

  /* ---- 9. the two fields the owner asked about ---- */

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
    assert.match(OBLIG, /toast\(i18t\('ob_none_found'\),'warn'/);
    /* 'warn' and not 'err': nothing refused, nothing failed. */
    assert.ok(!/i18t\('ob_none_found'\),'err'/.test(OBLIG));
    for (const lang of ['ob_none_found:', 'ob_try_again:'])
      assert.equal((I18N.match(new RegExp(lang, 'g')) || []).length, 2,
        `${lang} must exist in BOTH dictionaries`);
  });

  test('and it offers the second press, because the second press often works', () => {
    /* Measured across five scorecard runs rather than hoped: the same
       contract returned 12, 20, 0, 0 and 0 obligations, and one that answered
       nothing on a fifty-contract run answered 24 on the next. Silence here
       is INCONSISTENCY, not blindness — on all fifty contracts the silent
       ones average 36,518 characters against 37,813 for the answering ones,
       which is nothing, and both sides carry maintenance, distribution,
       outsourcing and transport agreements alike. */
    assert.match(OBLIG, /action:\s*\{\s*label:i18t\('ob_try_again'\)/,
      'a refusal needs its way forward on the same screen');
    assert.match(OBLIG, /onClick:\(\)=>runFindObligations\(c\)/,
      'and the way forward must be the same act, not a second path');
    /* The words must not claim the contract is empty — that is the one thing
       this scan has repeatedly been wrong about. */
    const en = I18N.match(/ob_none_found: '([^']*)'/)[1];
    assert.match(en, /not always consistent/);
  });
});
