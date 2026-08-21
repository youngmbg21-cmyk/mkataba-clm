#!/usr/bin/env node
/* Read the dump from a live run and answer the questions the score table
   cannot. Costs nothing — it only reads the file --dump already wrote.

     node test/cuad/inspect.js
     node test/cuad/inspect.js path/to/last-run.json

   Three questions, each of which came out of a real result:

   1. DID THE OBLIGATIONS READER RETURN ANYTHING AT ALL? The first live run
      scored 0% on all four categories. The table cannot tell "found other
      clauses" from "found nothing", and the raw answers can.

   2. HOW OFTEN IS A SPAN NOT VERBATIM? Nine times across ten contracts HaTi
      paraphrased instead of copying. That damages the FOUND score AND is a
      product defect on its own — those spans are printed to customers as
      quotations from their contract.

   3. IS THE HALF-OVERLAP THRESHOLD DOING REAL WORK? SCORING.md called it a
      judgement rather than a discovery and asked for it to be re-checked
      against real spans before the full run. This is that check: if almost
      nothing sits near the line, the threshold is not what decides the score
      and can be left alone. */

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const S = require('./score.js');

const HERE = __dirname;
const file = process.argv[2] || path.join(HERE, 'last-run.json');
if (!fs.existsSync(file)) {
  console.error(`No dump found at ${file}.\nRun the scorecard with --dump first.`);
  process.exit(2);
}
const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
const corpus = JSON.parse(fs.readFileSync(path.join(HERE, 'contracts.json'), 'utf8')).data;
const docOf = new Map(corpus.map(c => [c.title, c.paragraphs[0].context]));

const line = '-'.repeat(74);
console.log(`\nInspecting ${rows.length} contracts from ${file}`);

/* ---- 1. the obligations reader ---- */
console.log('\n' + line + '\n1. WHAT THE OBLIGATIONS READER RETURNED\n' + line);
let empty = 0, withQuote = 0, totalOb = 0;
for (const r of rows) {
  const obs = Array.isArray(r.obligations) ? r.obligations : [];
  totalOb += obs.length;
  if (!obs.length) empty++;
  withQuote += obs.filter(o => String(o.quote || '').trim()).length;
  const name = r.title.slice(0, 46).padEnd(48);
  console.log(`${name}${String(obs.length).padStart(2)} obligation(s)` +
    (obs.length ? `  e.g. "${String(obs[0].desc || '').slice(0, 40)}"` : ''));
}
console.log(`\n  ${empty} of ${rows.length} contracts returned NO obligations at all.`);
console.log(`  ${totalOb} obligations in total, ${withQuote} of them carrying a quote.`);
if (empty === rows.length) {
  console.log('\n  Every one empty. That is not a reading failure to pin on the model —');
  console.log('  /api/ai/obligations truncates the contract to the first 20,000');
  console.log('  characters, and audit rights, insurance and post-termination duties');
  console.log('  are drafted at the BACK of an agreement.');
} else if (totalOb && !withQuote) {
  console.log('\n  Obligations found but none quoted — they cannot be traced to the');
  console.log('  wording. `quote` is optional in the tool schema (required is [desc]).');
}

/* ---- 2. spans that are not verbatim ---- */
console.log('\n' + line + '\n2. SPANS HaTi DID NOT COPY VERBATIM\n' + line);
let spans = 0, notVerbatim = 0;
const byField = {};
for (const r of rows) {
  const doc = docOf.get(r.title);
  if (!doc) continue;
  for (const [field, q] of Object.entries(r.sourceSpans || {})) {
    if (!q || typeof q !== 'string') continue;
    spans++;
    if (!S.locate(doc, q).length) {
      notVerbatim++;
      byField[field] = (byField[field] || 0) + 1;
      if (notVerbatim <= 6) console.log(`  ${field}: "${q.slice(0, 60)}"`);
    }
  }
}
console.log(`\n  ${notVerbatim} of ${spans} spans could not be found in the contract` +
  (spans ? ` (${Math.round(notVerbatim / spans * 100)}%).` : '.'));
for (const [f, n] of Object.entries(byField).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(2)} x ${f}`);
}

/* ---- 3. is the threshold deciding anything? ---- */
console.log('\n' + line + '\n3. IS THE HALF-OVERLAP THRESHOLD DOING REAL WORK?\n' + line);
const CAT = { counterparty: 'Parties', contractType: 'Document Name',
  effectiveDate: 'Effective Date', expiryDate: 'Expiration Date',
  noticePeriodDays: 'Notice Period To Terminate Renewal', governingLaw: 'Governing Law',
  warrantyMonths: 'Warranty Duration', liabilityCapped: 'Cap On Liability',
  renewalType: 'Renewal Term' };
const byTitle = new Map(corpus.map(c => [c.title, c]));
const ratios = [];
for (const r of rows) {
  const c = byTitle.get(r.title); if (!c) continue;
  const doc = c.paragraphs[0].context;
  for (const [field, cat] of Object.entries(CAT)) {
    const q = (r.sourceSpans || {})[field];
    if (!q || typeof q !== 'string') continue;
    const qa = c.paragraphs[0].qas.find(x => x.question.split('"')[1] === cat);
    const key = (qa && qa.answers) || []; if (!key.length) continue;
    const at = S.locate(doc, q); if (!at.length) continue;
    let best = 0;
    for (const h of at) for (const k of key) {
      const kr = [k.answer_start, k.answer_start + k.text.length];
      const hit = Math.min(h[1], kr[1]) - Math.max(h[0], kr[0]);
      if (hit <= 0) continue;
      best = Math.max(best, hit / Math.min(h[1] - h[0], kr[1] - kr[0]));
    }
    ratios.push(best);
  }
}
const near = ratios.filter(x => x > 0.2 && x < 0.8).length;
const clear = ratios.filter(x => x >= 0.8).length;
const none = ratios.filter(x => x <= 0.2).length;
console.log(`  ${ratios.length} comparisons made.`);
console.log(`    ${clear} overlapped 80% or more   — clearly the same passage`);
console.log(`    ${none} overlapped 20% or less   — clearly a different passage`);
console.log(`    ${near} landed in between        — these are what the threshold decides`);
console.log(near <= Math.max(2, ratios.length * 0.1)
  ? '\n  The threshold is NOT what decides the score. Leave it at half.'
  : '\n  The threshold IS deciding a real share of the result. Worth revisiting\n  before any figure is published.');
console.log('');
