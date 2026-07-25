// HaTi — near-duplicate detection for imports.
//
// Globals are window-attached on purpose (single global scope; see core.js).
//
// Deduplication used to be sha256(dataUrl) — exact bytes only. Real migrations
// are full of near-duplicates: the same agreement scanned twice, a PDF next to a
// Word-exported copy of the same text, a re-executed version. Every one of those
// imported as a separate contract, and the register overstated the portfolio.
//
// Four signals, cheapest first:
//   1. fileHash        exact bytes            — certain, auto-skippable
//   2. textFingerprint same text, any format  — certain
//   3. simhash         fuzzy text similarity  — ≤3 near-certain, 4–6 related
//                       (and 4–6 only counts with non-boilerplate corroboration)
//   4. metadata        same party + date + ~value, even when the text differs
//
// Signals 1–3 are computed once at import and stored on the contract, so
// comparison never needs to load a document body: the index is built from the
// light register rows the client already holds.

/* ---------- normalisation ----------
   Aggressive on purpose: the point is that the same agreement in two formats,
   or scanned twice, collapses to the same string. */
function dedupeNormalize(text){
  return String(text||'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,' ')   // strip punctuation, case, layout, OCR noise
    .replace(/\s+/g,' ')
    .trim();
}
/* SHA-256 of the normalised text. Catches the same document arriving in a
   different file format — a PDF and a Word-exported copy of the same words. */
async function textFingerprint(text){
  const n=dedupeNormalize(text);
  if(n.length<80) return null;      // too little text to be a meaningful identity
  return await sha256(n);
}

/* ---------- SimHash over word 5-grams ----------
   64 bits, stored as 16 hex characters. JS bitwise operators are 32-bit, so the
   hash is kept as a hi/lo pair rather than a BigInt — the comparison runs over
   every contract in the register, so it has to stay cheap. */
const SIMHASH_GRAM = 5;
// Two independent 32-bit FNV-1a passes → 64 bits. Not cryptographic; it only
// has to distribute evenly.
function _hash64(s){
  let hi=0x811c9dc5|0, lo=0x01000193|0;
  for(let i=0;i<s.length;i++){
    const ch=s.charCodeAt(i);
    hi ^= ch; hi = Math.imul(hi, 0x01000193);
    lo = Math.imul(lo ^ (ch + i), 0x85ebca6b);
  }
  return [hi>>>0, lo>>>0];
}
function simhash64(text){
  const words=dedupeNormalize(text).split(' ').filter(Boolean);
  if(words.length<SIMHASH_GRAM) return null;
  const v=new Int32Array(64);
  for(let i=0;i+SIMHASH_GRAM<=words.length;i++){
    const [hi,lo]=_hash64(words.slice(i,i+SIMHASH_GRAM).join(' '));
    for(let b=0;b<32;b++){
      v[b]      += (lo>>>b)&1 ? 1 : -1;
      v[32+b]   += (hi>>>b)&1 ? 1 : -1;
    }
  }
  // pack into 16 hex chars, most-significant nibble first
  let out='';
  for(let nib=15;nib>=0;nib--){
    let x=0;
    for(let b=3;b>=0;b--) x=(x<<1)|(v[nib*4+b]>0?1:0);
    out+=x.toString(16);
  }
  return out;
}
const _POP=[0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4];
/* Hamming distance between two 16-hex-char SimHashes. Returns 64 (maximum
   distance) when either side is missing, so a missing hash never looks similar. */
function hamming64(a,b){
  if(!a||!b||a.length!==16||b.length!==16) return 64;
  let d=0;
  for(let i=0;i<16;i++) d+=_POP[(parseInt(a[i],16)^parseInt(b[i],16))&15];
  return d;
}
/* Two documents with Hamming distance ≤3 are near-certain duplicates.
   The "related" band was ≤12, which is far too wide: a 64-bit SimHash over
   5-grams puts ANY two documents drawn from the same house template inside 12
   bits of each other, because the boilerplate — definitions, confidentiality,
   liability, termination, governing law, signature blocks — is most of the
   token mass. A corporate portfolio is, definitionally, a pile of documents
   from a handful of house templates, so the band meant to catch "an amendment
   of this agreement" was catching "another contract from the same law firm":
   measured, five of ten unrelated agreements were flagged at distance 11-12,
   and each offered "link as an amendment of…" as its default action.

   Distance alone cannot carry the judgement at these widths, so the band is
   tightened AND anything inside it now has to be corroborated by something
   that is not boilerplate — the counterparty, the value or the term. */
const SIMHASH_DUPLICATE = 3, SIMHASH_RELATED = 6;

/* ---------- metadata signal ----------
   Catches a re-typed or differently-scanned copy whose text no longer matches:
   same normalised counterparty AND same effective date AND value within 2%. */
const normParty = s => String(s||'').toLowerCase()
  .replace(/\b(limited|ltd|plc|llp|inc|incorporated|company|co|kenya|k)\b/g,' ')
  .replace(/[^a-z0-9]+/g,'').trim();
const effDateOf = c => (c.metadata&&c.metadata.effectiveDate) || (c.fields&&c.fields.effDate) || c.signedAt && String(c.signedAt).slice(0,10) || null;
function valueWithin(a,b,pct){
  const x=Number(a||0), y=Number(b||0);
  if(!(x>0)&&!(y>0)) return true;          // both non-monetary
  if(!(x>0)||!(y>0)) return false;
  return Math.abs(x-y)/Math.max(x,y) <= pct;
}
function metadataMatch(cand, c){
  const p=normParty(cand.counterparty);
  if(!p || p!==normParty(c.counterparty)) return false;
  // `c` may be an index row (effectiveDate already resolved) or a full contract
  const d1=cand.effectiveDate, d2=c.effectiveDate||effDateOf(c);
  if(!d1 || !d2 || d1!==d2) return false;
  return valueWithin(cand.value, c.value, 0.02);
}

/* ---------- the comparison index ----------
   Built from the light register rows the client already holds — no document
   bodies are loaded. Rebuilt per batch; a batch also adds its own imports to it
   so two copies inside one drop are caught against each other. */
function buildDupIndex(contracts){
  const rows=[];
  for(const c of (contracts||state.contracts)){
    const u=c.upload||{};
    rows.push({ id:c.id, name:c.name, counterparty:c.counterparty, value:c.value,
      fileHash:u.fileHash||null, textFingerprint:u.textFingerprint||null,
      simhash:u.simhash||null, effectiveDate:effDateOf(c), expiry:c.expiry||null });
  }
  return rows;
}
/* Compare one candidate against the index. Returns matches best-first:
     kind 'exact'      identical bytes
     kind 'text'       identical text after normalisation
     kind 'near'       SimHash distance ≤ 3
     kind 'related'    SimHash distance 4–6 AND a corroborating signal
     kind 'metadata'   same party + effective date + value within 2%       */
/* A portfolio built on one standard template (200 distributor agreements on the
   same paper) can legitimately produce a long tail of "related" text matches, so
   the result is capped — the top handful is all a human can act on, and a
   50-item list would just be noise. */
const DUP_MAX_HITS = 6;
function findDuplicates(cand, index, opts={}){
  const out=[];
  for(const r of (index||[])){
    if(cand.excludeId && r.id===cand.excludeId) continue;
    if(cand.fileHash && r.fileHash && cand.fileHash===r.fileHash){ out.push({ ...r, kind:'exact', distance:0 }); continue; }
    if(cand.textFingerprint && r.textFingerprint && cand.textFingerprint===r.textFingerprint){ out.push({ ...r, kind:'text', distance:0 }); continue; }
    const d=hamming64(cand.simhash, r.simhash);
    if(d<=SIMHASH_DUPLICATE){ out.push({ ...r, kind:'near', distance:d }); continue; }
    if(d<=SIMHASH_RELATED && relatedCorroborated(cand, r)){ out.push({ ...r, kind:'related', distance:d }); continue; }
    if(metadataMatch(cand, r)) out.push({ ...r, kind:'metadata', distance:null });
  }
  const rank={ exact:0, text:1, near:2, related:3, metadata:4 };
  out.sort((a,b)=> rank[a.kind]-rank[b.kind] || (a.distance??99)-(b.distance??99));
  const capped=out.slice(0, opts.max||DUP_MAX_HITS);
  capped.totalMatches=out.length;
  return capped;
}
const DUP_LABEL={
  exact:'identical file',
  text:'identical text in a different file',
  near:'near-identical text',
  related:'closely related text — often an amendment or a re-executed version',
  metadata:'same counterparty, effective date and value',
};
/* A fuzzy text match in the 4–SIMHASH_RELATED band is only reported when
   something outside the boilerplate agrees. Any ONE of these is enough, and
   none of them is satisfied by two unrelated contracts sharing a template:
     - the same counterparty (normalised)
     - a value within 2%
     - the same effective date
     - the same title stem (the name minus the counterparty suffix)
   A pair at distance 5 with a different counterparty AND a different value AND
   a different date is not a duplicate under any reading. */
const titleStem = s => String(s||'').toLowerCase().split(/[—–-]/)[0]
  .replace(/\b(agreement|contract|deed|terms|letter|of|the|and|for)\b/g,' ')
  .replace(/[^a-z0-9]+/g,'').trim();
function relatedCorroborated(a, b){
  const pa=normParty(a.counterparty), pb=normParty(b.counterparty);
  if(pa && pb && pa===pb) return true;
  if(valueWithin(a.value, b.value, 0.02)) return true;
  const da=effDateOf(a), dbb=effDateOf(b);
  if(da && dbb && da===dbb) return true;
  const ta=titleStem(a.name), tb=titleStem(b.name);
  if(ta && tb && ta.length>5 && ta===tb) return true;
  return false;
}

/* Compute and attach the three stored signals. Called once, at import. */
async function attachDupSignals(upload, text){
  upload.textFingerprint = await textFingerprint(text);
  upload.simhash = simhash64(text);
  return upload;
}

Object.assign(window,{DUP_MAX_HITS,dedupeNormalize,textFingerprint,simhash64,hamming64,
  SIMHASH_DUPLICATE,SIMHASH_RELATED,normParty,metadataMatch,valueWithin,
  buildDupIndex,findDuplicates,relatedCorroborated,titleStem,DUP_LABEL,attachDupSignals,effDateOf});
