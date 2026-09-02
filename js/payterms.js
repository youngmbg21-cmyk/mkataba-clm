/* HaTi — PAYMENT TERMS, COUNTED (owner-asked 2 Sep 2026)
   ══════════════════════════════════════════════════════════════════════════
   Payment terms were captured in five places and countable in none of them.
   The record holds a SENTENCE — "30 days from invoice", "Net 45", "within
   sixty (60) days of delivery" — and nothing can average a sentence. This is
   the reading that turns it into a number of days, or into an honest
   "don't know".

   IT ADDS NO STORE, NO ROUTE AND NO FIELD. Every figure is counted in the
   browser off `state.contracts` — the caller's own already-scoped bootstrap —
   exactly as the portfolio panels and the obligations report are, so it is
   live on every draw and there is nothing to schedule or invalidate. There
   must never be a route: how long a company waits to be paid is that
   workspace's business. f267 sweeps this file for every network verb.

   COUNTING IS NOT DRAWING (the Insights panels' own rule): this file returns
   plain data and draws nothing. The drawing is intelPayTermsHtml, beside the
   other tab bodies.

   ---- IT LIVES IN ITS OWN FILE, AND THAT IS LOAD-BEARING ----
   Two surfaces ask it: the Home tile and the Insights tab. Written inside
   either view, the other would read it through `window` on a stage that does
   not carry that view and get `undefined` — the tile would then count zero,
   silently, which is this codebase's most repeated defect (see the
   rlPaperFootHtml family). Its own file, loaded before both, cannot fail that
   way. Same shelf as js/precedent.js: a deterministic reading with no view.

   ---- IT READS THE RECORD, NOT THE WORDING ----
   `c.metadata.paymentTerms` is already the product's reading of the document:
   Copilot extracts it, the upload screen prints it back with the exact phrase
   it came from for a person to confirm, and Key terms lets it be overtyped.
   Re-parsing the whole agreement here would be slow on every dashboard paint
   AND could disagree with what the reader was shown and confirmed.

   SO "NOT RECORDED" MEANS SOMETHING: nobody has read this contract's payment
   terms yet. That is the actionable fact, and it is why the count is printed
   rather than folded away.

   ---- THREE OTHER PARSERS EXIST AND ARE DELIBERATELY UNTOUCHED ----
   js/playbook.js reads days out of the full CONTRACT TEXT for its per-contract
   standards check; js/precedent.js reads them out of a CHANGE's wording. Those
   are different questions on different inputs, so they are not copies of this
   one and re-pointing them would change what two other features report. Noted
   in BUGLOG rather than swept.                                              */

/* THE DEFAULT STANDARD, AND IT IS NOT A SECOND OPINION. 45 is
   DEFAULT_PLAYBOOK's own paymentDays value; this literal is the answer for a
   stage that does not load js/playbook.js at all. f267 pins the two together,
   so moving the playbook's number fails there rather than leaving this one
   quietly stale. */
const PAY_STD_FALLBACK = 45;

/* Buckets are DIGITS, so they read the same in both languages and need no
   dictionary key — the register's dotted-date reasoning. `max` is inclusive. */
const PAY_BUCKETS = [
  { k:'0–30',  max:30 },
  { k:'31–45', max:45 },
  { k:'46–60', max:60 },
  { k:'61–90', max:90 },
  { k:'90+',   max:Infinity },
];

/* Only these two categories are a SIDE. A lease, a licence, an employment
   contract or a partnership has payment terms and no direction that "we wait"
   or "we pay" describes honestly, so they are counted out and named rather
   than pushed into whichever pile looks tidier. */
const PAY_SIDES = { customer:'customer', supplier:'supplier' };

/* ---- THE ONE PARSER ----
   Everything the metadata field can honestly hold. Written to understand more
   than the extraction writes, because a person may overtype the field by hand
   on Key terms and will not write it the way the model did. */
function payParseDays(text){
  const t = String(text == null ? '' : text).trim();
  if(!t) return null;
  /* Legal drafting writes the number twice — "sixty (60) days" — and the
     bracketed figure is the one to take, exactly as precedentFigure does.
     Asked FIRST, or the bare-number rule below reads the spelled-out word's
     neighbours instead. */
  const paren = t.match(/\((\d{1,3})\)\s*(?:calendar\s+|working\s+|business\s+)?(?:day|månad|month)/i);
  if(paren) return payClampDays(Number(paren[1]), /month|månad/i.test(paren[0]));
  /* "Net 30" and "netto 30" — the trade shorthand, which the extraction does
     not write but a person types constantly. */
  const net = t.match(/\b(?:net|netto)\s*[:\-]?\s*(\d{1,3})\b/i);
  if(net) return payClampDays(Number(net[1]), false);
  /* "30 days", "30 dagar", "2 months", "2 månader" — a figure with a unit. */
  const unit = t.match(/\b(\d{1,3})\s*(?:calendar\s+|working\s+|business\s+)?(day|dag|månad|month)/i);
  if(unit) return payClampDays(Number(unit[1]), /month|månad/i.test(unit[2]));
  /* A bare number typed into the field. It is a field labelled "Payment
     terms", so a lone figure means days — and NOTHING ELSE in the string, or
     "invoice 12345" would read as twelve days. */
  const bare = t.match(/^(\d{1,3})$/);
  if(bare) return payClampDays(Number(bare[1]), false);
  return null;
}
/* A month is thirty days, which is what metadata.js already does with a notice
   period stated in months. Nothing outside a plausible range is returned: a
   contract does not pay in 0 days and a five-year credit term is a misread. */
function payClampDays(n, isMonths){
  if(!Number.isFinite(n)) return null;
  const d = isMonths ? n * 30 : n;
  return (d >= 1 && d <= 365) ? d : null;
}

/* ---- ONE READING PER CONTRACT ---- */
const payDays = c => payParseDays(c && c.metadata && c.metadata.paymentTerms);
const paySide = c => PAY_SIDES[(c && c.metadata && c.metadata.category) || ''] || null;

/* WHERE MONEY DOES NOT PASS, PAYMENT TERMS ARE NOT A FACT ABOUT THE CONTRACT.
   isMonetary is the product's ONE answer to that and every money surface asks
   it, so an NDA is never counted here and never reported as "not recorded". */
const payInScope = c => (typeof isMonetary !== 'function') || isMonetary(c);

/* The live book, the portfolio's own definition: everything except Declined
   and archived. Read RAW — nothing here touches c.changes, so counting a
   contract cannot start a negotiation on it. */
function payLiveBook(){
  return ((typeof state === 'object' && state && state.contracts) || [])
    .filter(c => c && c.status !== 'Declined' && !c.archived && payInScope(c));
}

/* THE STANDARD IS THE PLAYBOOK'S, PER CONTRACT KIND. No new setting: the
   number an admin already sets in Settings is the number this measures
   against, and because the playbook is per contract type, supply paper can
   carry a different limit from services with nothing more to configure. */
function payStandardFor(c){
  try{
    if(typeof resolvePlaybook !== 'function' || typeof playbookKeyFor !== 'function') return PAY_STD_FALLBACK;
    const pb = resolvePlaybook(playbookKeyFor(c));
    const r = ((pb && pb.ranges) || []).find(x => x && x.key === 'paymentDays');
    const v = r && Number(r.value);
    return Number.isFinite(v) && v > 0 ? v : PAY_STD_FALLBACK;
  }catch(e){ return PAY_STD_FALLBACK; }
}

/* OVER STANDARD IS ASKED OF THE CONTRACT'S OWN STANDARD, never of a bucket —
   the buckets are a picture and the count has to be exact. It reads the same
   way on both sides deliberately: on the customer side a longer term is cash
   arriving late, on the supplier side it is a term we negotiated past our own
   policy, which is a governance fact rather than a good one. Both are
   departures from the rule the workspace set; the screens name which half is
   which rather than leaving one number to be misread. */
const payOver = c => { const d = payDays(c); return d != null && d > payStandardFor(c); };

const payWeight = c => {
  if(typeof canViewValues === 'function' && !canViewValues()) return 1;
  const v = window.fxHomeValue ? fxHomeValue(c) : Number((c && c.value) || 0);
  return Number.isFinite(v) && v > 0 ? v : 0;
};
const payBucketOf = d => (PAY_BUCKETS.find(b => d <= b.max) || PAY_BUCKETS[PAY_BUCKETS.length - 1]).k;

/* WHICH BUCKET THE STANDARD'S RULE IS DRAWN AFTER. The last bucket that sits
   wholly inside the standard, so the shaded region never under-claims: with a
   standard of 50 the 46–60 bucket really does hold contracts over it, and
   shading it is the safe direction. The COUNTS never come from this — they are
   payOver, per contract, exact. */
function payStandardSplit(std){
  let i = -1;
  PAY_BUCKETS.forEach((b, n) => { if(b.max <= std) i = n; });
  return i;   // -1 means every bucket is over the standard
}

/* ---- THE WHOLE READING ---- */
function payTermsData(){
  const book = payLiveBook();
  const moneyOk = (typeof canViewValues !== 'function') || canViewValues();

  const noTerms = [], noSide = [];
  const side = {
    customer: { key:'customer', rows:[], n:0, value:0, over:[], overValue:0 },
    supplier: { key:'supplier', rows:[], n:0, value:0, over:[], overValue:0 },
  };

  book.forEach(c => {
    const d = payDays(c);
    if(d == null){ noTerms.push(c); return; }
    const s = paySide(c);
    if(!s){ noSide.push(c); return; }
    const std = payStandardFor(c);
    const w = payWeight(c);
    const row = { id:c.id, name:(c.name || c.id || ''), counterparty:(c.counterparty || ''),
                  side:s, days:d, standard:std, over:d > std, value:w, bucket:payBucketOf(d) };
    const S = side[s];
    S.rows.push(row); S.n++; S.value += w;
    if(row.over){ S.over.push(row); S.overValue += w; }
  });

  /* THE AVERAGE IS WEIGHTED BY VALUE, and says so — a plain mean over
     contracts lets twelve small agreements outvote the one that carries the
     book. Where money is hidden from this reader, or where nothing carries a
     value, it falls back to a straight mean and the basis changes with it, so
     the figure never claims a weighting it did not use. */
  const avg = S => {
    if(!S.rows.length) return { days:null, basis:null };
    const tw = S.rows.reduce((a, r) => a + r.value, 0);
    if(moneyOk && tw > 0){
      return { days: Math.round(S.rows.reduce((a, r) => a + r.days * r.value, 0) / tw), basis:'value' };
    }
    return { days: Math.round(S.rows.reduce((a, r) => a + r.days, 0) / S.rows.length), basis:'count' };
  };

  const buckets = S => PAY_BUCKETS.map(b => {
    const rows = S.rows.filter(r => r.bucket === b.k);
    return { k:b.k, n:rows.length, value:rows.reduce((a, r) => a + r.value, 0) };
  });

  ['customer','supplier'].forEach(k => {
    const S = side[k];
    const a = avg(S);
    S.avgDays = a.days; S.basis = a.basis;
    S.buckets = buckets(S);
    S.overN = S.over.length;
  });

  /* THE GAP is the whole point of this page, and it only means anything when
     BOTH sides can answer. With one side empty it is null rather than a
     number worked out against nothing. */
  const gap = (side.customer.avgDays != null && side.supplier.avgDays != null)
    ? side.customer.avgDays - side.supplier.avgDays
    : null;

  /* One standard is printed where every contract shares it, which is the
     ordinary case. Where the playbook gives different kinds different limits,
     the page says so instead of picking one and implying it governs all. */
  const stds = [...new Set([].concat(side.customer.rows, side.supplier.rows).map(r => r.standard))];

  /* THE EXCEPTIONS, BOTH SIDES, WORST FIRST — B's list folded into A's page
     (owner-ruled 2 Sep 2026). Ranked by VALUE rather than by days, because
     what a reader acts on first is the biggest contract on bad terms, not the
     longest term on a small one. Days break a tie. */
  const exceptions = [].concat(side.customer.over, side.supplier.over)
    .sort((a, b) => (b.value - a.value) || (b.days - a.days) || String(a.id).localeCompare(String(b.id)));

  const named = cs => cs.map(c => ({ id:c.id, name:(c.name || c.id || ''), counterparty:(c.counterparty || '') }));

  return {
    panel:'payment_terms',
    counted: side.customer.n + side.supplier.n,
    standard: stds.length === 1 ? stds[0] : PAY_STD_FALLBACK,
    standardVaries: stds.length > 1,
    standardSplitAfter: payStandardSplit(stds.length === 1 ? stds[0] : PAY_STD_FALLBACK),
    bucketKeys: PAY_BUCKETS.map(b => b.k),
    customer: side.customer,
    supplier: side.supplier,
    gap,
    exceptions,
    overN: side.customer.overN + side.supplier.overN,
    /* A CAP OR AN OMISSION IS A FACT, NEVER A SILENT TRIM — the standing rule
       every money figure in this product already follows. Both are NAMED, so
       a rate is never quietly worked out over half the book. */
    noTerms: { n:noTerms.length, rows:named(noTerms) },
    noSide:  { n:noSide.length,  rows:named(noSide) },
    bookN: book.length,
    money: { visible:moneyOk, currency:(typeof jxCurrency === 'function' ? jxCurrency() : '') },
    /* What could not be converted into one currency, in the same shape every
       other converted figure here reports it. */
    missingFx: (window.fxMissing ? fxMissing(side.customer.rows.concat(side.supplier.rows)
      .map(r => ({ id:r.id }))) : {}),
  };
}

/* WHAT THE HOME TILE COUNTS. Borrowed by the tile rather than counted there,
   so the tile and the tab can never disagree about what "over standard"
   means — this product's own standing rule about one reading and many
   surfaces. */
function payOverStandard(){
  const d = payTermsData();
  return { n:d.overN, customer:d.customer.overN, supplier:d.supplier.overN,
           counted:d.counted, value:d.customer.overValue + d.supplier.overValue };
}

Object.assign(window, {
  PAY_STD_FALLBACK, PAY_BUCKETS, PAY_SIDES,
  payParseDays, payClampDays, payDays, paySide, payInScope, payLiveBook,
  payStandardFor, payOver, payWeight, payBucketOf, payStandardSplit,
  payTermsData, payOverStandard,
});
