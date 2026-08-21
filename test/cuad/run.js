#!/usr/bin/env node
/* CUAD scorecard — the runner.

   Stage 4. Starts a THROWAWAY HaTi on a temporary database, feeds it the 50
   selected contracts, scores the answers with score.js, and prints the
   report. It never touches a live server and never writes to the product.

   THE PRODUCT IS NOT MODIFIED. The three limits this needs are passed as
   environment settings to the test server only — startHati already takes
   them, which is why no HaTi code changes for any of this:

     AI_MAX_CHARS   60,000 by default and 6 of the 50 are larger. Left alone,
                    HaTi would read a TRIMMED contract and the scorecard would
                    be measuring the trimming (SCORING.md rule 1).
     AI_RATE_DEEP   15 per window. A 50-contract run stalls on it.
     AI_RATE_LIGHT  40 per window. Same.

   USAGE
     node test/cuad/run.js                 dry run against the built-in stub:
                                           proves the plumbing, spends nothing,
                                           and every score will be zero
     node test/cuad/run.js --live          the real thing. Needs a real key in
                                           ANTHROPIC_API_KEY and SPENDS MONEY
     node test/cuad/run.js --live --n 10   the ten-contract calibration pass
                                           SCORING.md asks for before the first
                                           full run

   WHAT IT MUST NOT DO (SCORING.md): re-extract contracts from PDFs, run on
   save, grow a second duration reader, report a CORRECT figure against a
   FOUND denominator, or count an unmarked obligation as a false positive. */

'use strict';
const fs = require('node:fs');
const readline = require('node:readline');
const path = require('node:path');
const S = require('./score.js');
const { startHati } = require('../helpers.js');

const HERE = __dirname;
const ARGS = process.argv.slice(2);
const has = f => ARGS.includes(f);
const val = (f, d) => { const i = ARGS.indexOf(f); return i >= 0 ? ARGS[i + 1] : d; };

const LIVE = has('--live');
const LIMIT = Number(val('--n', 0)) || 0;
/* --dump writes every raw answer to a file, so a surprising number can be
   DIAGNOSED rather than guessed at. The first live run reported the
   obligations reader at 0% across all four categories, and there was no way
   to tell a real failure from a scorer bug without seeing what came back.
   Costs nothing extra — the calls were made anyway. */
const DUMP = has('--dump') ? (val('--dump', '') && !val('--dump', '').startsWith('--')
  ? val('--dump', '') : 'test/cuad/last-run.json') : '';

/* --resume: pick up a run that died, reading answers already in the dump
   rather than paying for them twice. Fifty contracts is a hundred large
   calls and about half an hour; losing it at contract forty to a rate limit
   and starting again is the expensive failure this exists to prevent. */
const RESUME = has('--resume');

/* THE 50 ARE COMMITTED; THE OTHER 460 ARE NOT.

   contracts.json holds only the selected 50, and only the 14 categories the
   scorecard actually scores — 2.2 MB against the full corpus's 39 MB. That is
   not a tidiness decision: this is meant to run on a 512 MB Render instance
   that is also serving the live site, and parsing 39 MB there could push the
   real service into an out-of-memory restart. It also removes the download
   step entirely, so the run works on a box with no route to GitHub.

   CC BY 4.0 permits the redistribution; the attribution rides inside the file
   and in README.md. --corpus still accepts the full CUADv1.json for anyone
   re-running the selection. */
const CORPUS = val('--corpus', process.env.CUAD_JSON || '');

function loadCorpus() {
  const tries = [CORPUS, path.join(HERE, 'contracts.json'),
                 path.join(HERE, 'CUADv1.json'),
                 '/tmp/cuad/CUADv1.json'].filter(Boolean);
  for (const p of tries) { if (p && fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')).data; }
  console.error(
`Cannot find CUADv1.json. It is deliberately not committed — 510 third-party
contracts, reproducible in seconds:

    git clone --depth 1 https://github.com/TheAtticusProject/cuad /tmp/cuad-repo
    unzip /tmp/cuad-repo/data.zip -d /tmp/cuad

then re-run, or pass --corpus <path to CUADv1.json>.`);
  process.exit(2);
}

/* ---------- what is scored, and how ---------- */
const CAT = {
  counterparty:     'Parties',
  contractType:     'Document Name',
  effectiveDate:    'Effective Date',
  expiryDate:       'Expiration Date',
  noticePeriodDays: 'Notice Period To Terminate Renewal',
  governingLaw:     'Governing Law',
  warrantyMonths:   'Warranty Duration',
  liabilityCapped:  'Cap On Liability',
  renewalType:      'Renewal Term',
};
/* FOUND-only, each for its own reason (MAPPING.md): renewalType because CUAD
   gives the term's wording and HaTi answers with a type — different questions;
   contractType because HaTi answers in its own vocabulary of twelve and CUAD
   gives the document's title, which no rule settles cleanly. */
const FOUND_ONLY = new Set(['renewalType', 'contractType']);

const OBLIGATION_CATS = ['Post-Termination Services', 'Audit Rights',
                         'Minimum Commitment', 'Insurance'];

const spansOf = (c, cat) => {
  for (const q of c.paragraphs[0].qas) {
    if (q.question.split('"')[1] === cat) return q.answers || [];
  }
  return [];
};

/* Truth is read out of CUAD's own span, and where it cannot be read the
   contract leaves the CORRECT denominator and stays in the FOUND one — the
   owner's ruling 3, extended by its own logic. */
function truthFor(field, c) {
  const sp = spansOf(c, CAT[field]);
  if (field === 'liabilityCapped') {
    return S.liabilityTruth(sp, spansOf(c, 'Uncapped Liability'));
  }
  if (!sp.length) return null;
  const texts = sp.map(s => s.text);
  switch (field) {
    case 'effectiveDate': {
      for (const t of texts) { const d = S.parseDate(t); if (d) return d; }
      return null;
    }
    /* Mostly not written as a date at all — see expiryTruth. Computed from a
       STATED anchor where there is one, never from an assumed one. */
    case 'expiryDate': return S.expiryTruth(sp, spansOf(c, 'Effective Date'));
    /* noticeDuration, never parseDuration. A renewal clause states the renewal
       TERM before the notice ("successive one-year terms unless ... sixty (60)
       days notice"), so the first duration in the span is usually the wrong
       one — 18 of 34 truths for this field were the term. See score.js. */
    case 'noticePeriodDays': {
      for (const t of texts) { const r = S.durationToDays(S.noticeDuration(t)); if (r) return r; }
      return null;
    }
    case 'warrantyMonths': {
      for (const t of texts) { const r = S.durationToMonths(S.parseDuration(t)); if (r) return r; }
      return null;
    }
    case 'governingLaw': {
      for (const t of texts) { const j = S.jurisdiction(t); if (j) return j; }
      return null;
    }
    case 'counterparty': return sp;          // the verdict function applies ruling 2
    default: return null;
  }
}

function compareFor(field) {
  switch (field) {
    case 'effectiveDate':    return (t, a) => !!a && S.parseDate(String(a)) === t;
    case 'expiryDate':       return (t, a) => S.expiryMatches(t, a);
    case 'noticePeriodDays':
    case 'warrantyMonths':   return (t, a) => Number.isFinite(Number(a)) &&
                                              Number(a) >= t.lo && Number(a) <= t.hi;
    case 'governingLaw':     return (t, a) => S.jurisdiction(String(a || '')) === t;
    case 'liabilityCapped':  return (t, a) => String(a || '').toLowerCase() === t;
    case 'counterparty':     return (t, a) => S.counterpartyVerdict(a, t) === true;
    default:                 return () => false;
  }
}


/* Read a secret without echoing it. The prompt is written first, then output
   is muted, so the key never appears on screen, in scrollback, or in shell
   history — and cannot be captured by a screenshot of the terminal. */
function askHidden(promptText) {
  return new Promise((resolve) => {
    process.stdout.write(promptText);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = () => {};
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(String(answer || '').trim());
    });
  });
}

/* ---------- the run ---------- */
/* ---- A FIFTY-CONTRACT RUN IS WORTH PROTECTING ----

   Ten contracts is two minutes and pennies, so a failure halfway through
   costs nothing but a re-run. Fifty is a hundred large calls, about half an
   hour and real money — and the likeliest way to lose it is a provider rate
   limit at contract thirty-five, which throws away everything before it.

   Three cheap protections, in the order they matter:

   1. RETRY WHAT IS WORTH RETRYING, AND NOTHING ELSE. A 429 or an overloaded
      provider is a wait; "Copilot ran out of room" is an ANSWER (it is this
      project's own refusal, added the day the obligations reader was fixed)
      and retrying it four times would spend four times the money to be told
      the same thing. The test is what the message SAYS, not the status.

   2. THE DUMP IS WRITTEN AS IT GOES. It used to be written once at the end,
      so a run that died at contract 49 kept nothing at all.

   3. --resume PICKS UP WHERE IT STOPPED, reading the dump for titles already
      answered. It re-scores those from the dump rather than re-asking, so a
      resumed run costs only what is left. */
const RETRY_WAIT_MS = [2000, 6000, 18000, 45000];
const retryable = (e) => {
  const st = e && e.status || 0;
  const msg = String((e && e.message) || '');
  if (/ran out of room/i.test(msg)) return false;      // our own refusal, not a wait
  if (st === 429 || st === 529 || st === 503) return true;
  // HaTi wraps a provider refusal in a 502; only the provider's own
  // rate-limit and overload wording is worth waiting on.
  return st === 502 && /rate.?limit|overloaded|too many requests|\b429\b|\b529\b/i.test(msg);
};
async function withRetry(label, fn) {
  for (let i = 0; ; i++) {
    try { return await fn(); }
    catch (e) {
      if (!retryable(e) || i >= RETRY_WAIT_MS.length) throw e;
      const wait = RETRY_WAIT_MS[i];
      process.stdout.write(`\n  ${label}: ${e.status || '?'} — waiting ${wait / 1000}s, then retry ${i + 1} of ${RETRY_WAIT_MS.length}\n`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

async function main() {
  const corpus = loadCorpus();
  const sel = JSON.parse(fs.readFileSync(path.join(HERE, 'selection.json'), 'utf8'));
  const byTitle = new Map(corpus.map(c => [c.title, c]));
  const missing = sel.filter(r => !byTitle.has(r.title)).length;
  let rows = sel.filter(r => byTitle.has(r.title));

  /* The round-robin lives in score.js so f226 can prove it without a run. */
  rows = S.spreadAcrossGroups(rows, LIMIT);
  const chosen = rows.map(r => byTitle.get(r.title));

  /* THE KEY IS NEVER TYPED ON A COMMAND LINE.

     It was, and an owner's key ended up in a chat transcript inside a
     SCREENSHOT of their terminal — a route no warning about pasting keys
     covers. A command line is echoed, scrolled back, saved to shell history
     and photographed; asking for the key here means it is none of those.

     Also fixes the Windows half of the same failure: `VAR=value command` is
     bash syntax and PowerShell rejects it outright, so the documented command
     could not work on Windows at all. Prompting works identically on both. */
  if (LIVE && !process.env.ANTHROPIC_API_KEY) {
    if (!process.stdin.isTTY) {
      console.error('--live needs a key. Run this in a terminal so it can be asked for,');
      console.error('or set ANTHROPIC_API_KEY in the environment first.');
      process.exit(2);
    }
    process.env.ANTHROPIC_API_KEY = await askHidden('Anthropic API key (not shown as you type): ');
    if (!process.env.ANTHROPIC_API_KEY) { console.error('\nNo key given.'); process.exit(2); }
  }

  console.log(`\nCUAD scorecard — ${LIVE ? 'LIVE (this spends money)' : 'DRY RUN (stub AI, every score will be zero)'}`);
  /* The spread is PRINTED, not left to be trusted: a short run's coverage is
     the first thing that makes its numbers readable or misleading. */
  const spreadNote = (() => {
    const c = {};
    for (const r of rows) c[r.group] = (c[r.group] || 0) + 1;
    return Object.entries(c).map(([g, k]) => `${k} ${g.toLowerCase()}`).join(' · ');
  })();
  console.log(`${chosen.length} contracts` + (missing ? `  (${missing} in the manifest were not found in the corpus)` : ''));
  console.log(`  ${spreadNote}`);
  /* WHAT IT WILL COST, BEFORE IT SPENDS IT. Ten contracts is pennies and
     fifty is several dollars, and the difference is not obvious from the
     command. Read off the real text being sent, at the deep tier's published
     rates ($3/M in, $15/M out), and deliberately rounded UP — a run that
     costs less than its estimate is a good surprise. */
  if (LIVE) {
    const chars = chosen.reduce((t, c) => t + c.paragraphs[0].context.length, 0);
    const inTok = chars / 4;                       // ~4 characters a token
    const est = (inTok * 2 * 3 + chosen.length * 5000 * 15) / 1e6;   // read twice, then written
    console.log(`  about US$${est.toFixed(2)} and ${Math.max(1, Math.round(chosen.length * 0.6))}-${Math.round(chosen.length * 0.9)} minutes` +
      (RESUME && DUMP ? ' (less whatever --resume already holds)' : ''));
  }
  console.log('');

  /* Settings raised for the TEST SERVER ONLY. The live workspace is untouched. */
  const env = { AI_MAX_CHARS: '200000', AI_RATE_DEEP: '100000', AI_RATE_LIGHT: '100000' };
  if (LIVE) { delete env.ANTHROPIC_BASE_URL; env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY; }
  const h = await startHati(LIVE ? { ...env, ANTHROPIC_BASE_URL: 'https://api.anthropic.com' } : env);

  const dump = [];
  /* Answers already held, keyed by title. A resumed run re-SCORES these from
     the dump — never re-asks — so it costs only what is left. */
  const held = new Map();
  if (RESUME && DUMP && fs.existsSync(DUMP)) {
    try {
      for (const row of JSON.parse(fs.readFileSync(DUMP, 'utf8'))) held.set(row.title, row);
      console.log(`Resuming: ${held.size} contract(s) already answered in ${DUMP}.`);
    } catch (e) { console.log(`Could not read ${DUMP} to resume (${e.message}) — starting fresh.`); }
  }
  const tallies = {}; for (const f of Object.keys(CAT)) tallies[f] = S.newTally();
  const oblig = {}; for (const c of OBLIGATION_CATS) oblig[c] = S.newTally();
  const obWhy = {};
  const errors = [];

  try {
    const admin = h.client('admin');
    await admin.json('/api/setup', { method: 'POST', body: {
      org: 'Scorecard', name: 'Scorecard Runner', email: 'scorecard@example.com',
      password: 'scorecardpassword1', data: { uid: 1, contracts: [], settings: {} },
    } });

    let n = 0;
    for (const c of chosen) {
      n++;
      const doc = c.paragraphs[0].context;
      process.stdout.write(`  [${String(n).padStart(2)}/${chosen.length}] ${c.title.slice(0, 58)}\r`);

      /* RULE 1: the exact text CUAD annotated. Never a PDF, never a
         re-extraction — CUAD's offsets index this string. */
      let ex = null, ob = null, obErr = null;
      const prev = held.get(c.title);
      if (prev) {
        ex = { metadata: prev.metadata, sourceSpans: prev.sourceSpans };
        ob = prev.obligations ? { obligations: prev.obligations, notice: prev.obligationsNotice } : null;
        obErr = prev.obligationsError || null;
      }
      if (!prev) try { ex = await withRetry('extract', () => admin.json('/api/ai/extract', { method: 'POST', body: { text: doc } })); }
      catch (e) { errors.push(`extract ${c.title.slice(0, 40)}: ${e.message.slice(0, 90)}`); }
      /* THE REASON TRAVELS WITH THE RESULT. The first two runs could not tell
         "the reader found nothing" from "the reader was cut off before it
         could answer" — the route reported both as an empty list. It reports
         the second as a refusal now, so a caught error here IS that answer
         and must be kept rather than merely counted. */
      if (!prev) try { ob = await withRetry('obligations', () => admin.json('/api/ai/obligations', { method: 'POST', body: { text: doc } })); }
      catch (e) {
        obErr = e.message.slice(0, 120);
        errors.push(`obligations ${c.title.slice(0, 40)}: ${obErr.slice(0, 90)}`);
      }

      const md = (ex && ex.metadata) || {};
      const spans = (ex && ex.sourceSpans) || {};
      dump.push({ title: c.title, metadata: md, sourceSpans: spans,
                  obligations: (ob && ob.obligations) || null,
                  obligationsNotice: (ob && ob.notice) || null, obligationsError: obErr || null });
      /* Written after EVERY contract, not once at the end: a run that dies at
         contract 49 used to keep nothing at all. */
      if (DUMP) { try { fs.writeFileSync(DUMP, JSON.stringify(dump, null, 1)); } catch (_) {} }

      for (const field of Object.keys(CAT)) {
        const key = spansOf(c, CAT[field]);
        const foundV = S.foundVerdict(doc, spans[field], key);
        const truth = FOUND_ONLY.has(field) ? null : truthFor(field, c);
        S.record(tallies[field], {
          foundV, truth, answer: md[field], compare: compareFor(field),
        });
      }

      /* The obligations reader is scored on LOCATION alone, per category.
         Obligations CUAD never marked are NOT counted against it — this
         measures what was missed, not what was invented. */
      /* A FAILED CALL IS NOT AN EMPTY ANSWER.

         The first diagnostic run reported "14 x the reader returned nothing
         at all" for every measurable case — and `ob` is null when the REQUEST
         threw, which collapsed into the same bucket as a reader that genuinely
         found no obligations. Those want opposite responses: one is a broken
         call, the other is a finding about HaTi. */
      const obFailed = !ob;
      const items = (ob && ob.obligations) || [];
      for (const cat of OBLIGATION_CATS) {
        const v = obFailed ? 'call-failed' : S.obligationMatch(doc, items, spansOf(c, cat));
        if (v === 'excluded') { oblig[cat].excludedNotMarked++; continue; }
        oblig[cat].foundOf++;
        if (v === 'found') oblig[cat].found++;
        else obWhy[v] = (obWhy[v] || 0) + 1;      // WHY the zero, not just that it is one
      }
    }
    process.stdout.write(' '.repeat(90) + '\r');
  } finally {
    await h.stop();
  }

  if (DUMP) {
    fs.writeFileSync(DUMP, JSON.stringify(dump, null, 1));
    console.log(`\nRaw answers written to ${DUMP} — ${dump.length} contracts.`);
    console.log('It holds only what HaTi answered about public SEC filings: no key, no customer data.');
  }

  report(tallies, oblig, errors, chosen.length, obWhy);
}

/* ---------- the report ----------
   Every percentage carries its denominator; exclusions are named and counted;
   the unscoreable fields say WHY rather than printing blank or zero; and
   there is no single blended accuracy number. */
function report(tallies, oblig, errors, n, obWhy = {}) {
  const line = '-'.repeat(78);
  console.log(line);
  console.log('FIELD EXTRACTION'.padEnd(24) + 'FOUND'.padEnd(18) + 'CORRECT'.padEnd(18) + 'EXCLUDED');
  console.log(line);
  for (const [f, t] of Object.entries(tallies)) {
    const corr = FOUND_ONLY.has(f) ? 'not comparable' : S.pct(t.correct, t.correctOf);
    const exc = `${t.excludedNotMarked} unmarked, ${t.excludedNotDerivable} underivable`;
    console.log(f.padEnd(24) + S.pct(t.found, t.foundOf).padEnd(18) + String(corr).padEnd(18) + exc);
    if (t.notVerbatim) console.log(`${''.padEnd(24)}  ^ ${t.notVerbatim} not verbatim — HaTi paraphrased instead of quoting`);
  }
  console.log('\n' + line);
  console.log('OBLIGATIONS READER'.padEnd(34) + 'FOUND'.padEnd(18) + 'EXCLUDED');
  console.log(line);
  for (const [c, t] of Object.entries(oblig)) {
    console.log(c.padEnd(34) + S.pct(t.found, t.foundOf).padEnd(18) + `${t.excludedNotMarked} unmarked`);
  }
  /* A zero on its own says nothing. These three causes want three different
     responses, so they are named rather than averaged into a percentage. */
  const WHY = {
    'elsewhere': 'the reader found real obligations, but about OTHER clauses — a scope difference, not a failure',
    'no-quotes': 'obligations returned with NO quote — they cannot be traced back to the wording (a product defect)',
    'none-returned': 'the reader ran and found NO obligations in the contract',
    'call-failed': 'the request to HaTi failed — not a reading failure, see the errors below',
  };
  const missed = Object.entries(obWhy).filter(([, k]) => k);
  if (missed.length) {
    console.log('\n  why the misses:');
    for (const [k, count] of missed) console.log(`    ${String(count).padStart(3)} x  ${WHY[k] || k}`);
  }
  console.log('\n' + line);
  console.log('NOT MEASURED');
  console.log(line);
  for (const [f, why] of Object.entries(S.NOT_MEASURED)) console.log(`${f.padEnd(24)}${why}`);

  console.log('\n' + line);
  console.log(`Headline: ${S.headline(tallies)}`);
  console.log(`Contracts: ${n}`);
  /* THE CLAIM NAMES WHAT ACTUALLY RAN.

     This line used to read "measured at N% against 510 professionally reviewed
     contracts" — hardcoded, and wrong in the one direction that matters. 510 is
     the size of the whole public CUAD dataset; this scorecard uses a chosen 50,
     and `--n 10` measures ten. The tool was handing the reader a claim backed by
     ten contracts dressed as five hundred and ten, which is the exact
     overstatement the whole scorecard exists to prevent.

     So the sentence is built from `n`. 510 may still be MENTIONED as where the
     50 were drawn from — that is true and worth saying — but it can never be
     the number claimed. f226-9 pins this. */
  console.log(`Claim as "measured on ${n} contract${n === 1 ? '' : 's'} drawn from CUAD, a set of 510`);
  console.log('marked up by commercial lawyers" — never "N% accurate", and never cite 510');
  console.log('as the number measured. Credit CUAD (CC BY 4.0) wherever a figure is published.');
  console.log(line);

  if (errors.length) {
    console.log(`\n${errors.length} request error(s) — these are NOT scored as wrong answers:`);
    for (const e of errors.slice(0, 12)) console.log('  ' + e);
    if (errors.length > 12) console.log(`  ...and ${errors.length - 12} more`);
  }
}

main().catch(e => { console.error('\nscorecard failed:', e); process.exit(1); });
