// HaTi — the redline engine: what changed, as storable ops.
//
// Globals are window-attached like every module (see components.js).
//
// WHY THIS MODULE EXISTS AT ALL
//
// js/versioning.js carries wordDiff(): an LCS over whitespace tokens with a
// full O(n·m) dynamic-programming table. It is correct, it is the diff the
// version-compare modal has always shown, and it is deliberately left alone —
// changing it would change what every historical comparison looks like.
//
// It is the wrong engine for a negotiation, for two measured reasons:
//
//   · COST. A 2,000-word clause — a delivery schedule, an insurance annex, the
//     kind of thing real contracts carry — is ~4,000 whitespace tokens each
//     side. The table is 4,000 × 4,000 Uint32 cells: 61 MiB of allocation and
//     ~200ms of fill, for one clause, on one render. A document with six such
//     schedules cannot be diffed on a phone.
//
//   · READABILITY. LCS latches onto whatever stray words two versions share —
//     "the", "of", "value" — so a substantially rewritten clause comes back
//     interleaved word by word and cannot be read. js/negotiation.js already
//     had to bolt a detector onto the output (_negoShredded) and swap in a
//     prefix/suffix diff after the fact. That detector was a patch over the
//     engine; here the rule is the engine.
//
// WHAT THIS PRODUCES, AND WHY THAT SHAPE
//
// An OPS ARRAY: [{op:'keep'|'del'|'ins', text}, …], merged into maximal runs.
//
// That is not a shape invented here — it is OOXML tracked changes, which this
// repo already reads (js/docx.js) and writes (js/docxwrite.js): a run of text
// is plain, or wrapped in w:ins, or wrapped in w:del with its w:delText kept.
// Deleted wording is RETAINED until someone accepts the deletion, exactly as
// Word retains it, which is the whole reason a redline can be reviewed.
//
// Two reconstruction invariants hold over every ops array this module returns,
// and they are what make it safe to STORE the ops and never diff again:
//
//     keep + del, concatenated in order  ===  the old text, byte for byte
//     keep + ins, concatenated in order  ===  the new text, byte for byte
//
// Nothing is normalised, trimmed or collapsed on the way through. A redline
// that could not reproduce both sides exactly would be a picture of a change
// rather than the change itself.

/* ---------- tokens ----------
   Words with their punctuation attached, and whitespace runs as tokens of
   their own. Splitting on the whitespace rather than around it is what makes
   reconstruction exact: every byte of the input lands in exactly one token, so
   a leading space, a double space and a trailing newline are all diffable
   content rather than something the tokeniser quietly ate.

   Punctuation stays welded to its word ("Net-30." is one token) because that
   is the unit a reader sees move. Splitting it off would report the full stop
   at the end of a replaced sentence as an independent surviving fragment. */
function redlineTokens(s){
  return String(s == null ? '' : s).split(/(\s+)/).filter(x => x !== '');
}
const _rlWs = t => !/\S/.test(t);

/* ---------- Myers, with a budget ----------
   An O(ND) greedy forward search (Myers 1986). D is the edit distance, so a
   normal negotiating edit — a date, a cap, a notice period — costs almost
   nothing to find no matter how long the clause is. That is the exact inverse
   of the LCS table, whose cost depends only on length.

   The budget is not a performance hack bolted on the side; it IS the
   readability rule. Past a certain edit distance the two texts are no longer
   one text with changes in it, and any token-level alignment of them is the
   interleaved garbage described above. So when D exceeds the budget the search
   stops and says so, and the caller renders the passage as one deletion
   followed by one insertion — which is what the prototype does, and what a
   human marking up paper does.

   Returning null (rather than a worse answer) keeps the two decisions apart:
   this function either aligned the texts or it did not. */
const REDLINE_MAX_D = 600;

function _myers(a, b, maxD){
  const n = a.length, m = b.length;
  const cap = Math.min(n + m, maxD);
  const offset = cap + 1;
  const size = 2 * cap + 3;
  let v = new Int32Array(size);
  const trace = [];
  for (let d = 0; d <= cap; d++){
    trace.push(v.slice());              // v as it stood BEFORE this d's moves
    for (let k = -d; k <= d; k += 2){
      let x;
      if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) x = v[offset + k + 1];
      else x = v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]){ x++; y++; }
      if (x > n || y > m) continue;
      v[offset + k] = x;
      if (x >= n && y >= m) return _backtrack(trace, d, n, m, offset);
    }
  }
  return null;                          // over budget: not one text with edits in it
}
/* Walk the recorded search back to the path it found. At step d the move came
   from step d-1, whose frontier is trace[d] — so the snapshot taken before d
   is exactly the one the reverse step needs. */
function _backtrack(trace, D, n, m, offset){
  const rev = [];
  let x = n, y = m;
  for (let d = D; d > 0; d--){
    const v = trace[d];
    const k = x - y;
    const prevK = (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) ? k + 1 : k - 1;
    const prevX = v[offset + prevK];
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY){ x--; y--; rev.push({ t: 'keep', a: x, b: y }); }
    if (x === prevX){ y--; rev.push({ t: 'ins', b: y }); }
    else { x--; rev.push({ t: 'del', a: x }); }
  }
  while (x > 0 && y > 0){ x--; y--; rev.push({ t: 'keep', a: x, b: y }); }
  rev.reverse();
  return rev;
}

/* ---------- is this alignment worth reading? ----------
   A diff can be perfectly correct and completely unreadable. This is the same
   judgement js/negotiation.js made in _negoShredded, kept because it was right,
   moved here because it belongs to the engine rather than to a renderer:

     the full replacement value of the affected goods
       → EUR 250,000 in the aggregate per contract year

   aligns on "the", "value", "of" and comes back as "the EUR full 250,000
   replacement in value the of aggregate the per affected contract goods year."
   Every token is in the correct box; the sentence is gone.

   Counting RUNS rather than contiguous groups is the point. A rewrite's runs
   are separated by single spaces, so anything treating whitespace as a group
   boundary sees one enormous group and never fires. */
function _shredded(raw, a, b){
  let runs = 0, changed = 0, total = 0, last = null;
  for (const r of raw){
    if (r.t === 'keep'){ if (!_rlWs(a[r.a])) total++; last = 'keep'; continue; }
    if (r.t !== last) runs++;
    if (!_rlWs(r.t === 'del' ? a[r.a] : b[r.b])){ changed++; total++; }
    last = r.t;
  }
  if (!total) return false;
  return runs >= 6 && (changed / total) > 0.45;
}

/* ---------- runs ----------
   Token-level moves become maximal runs, with one rule beyond "merge what is
   adjacent": a KEEP that is nothing but whitespace, sitting between two changed
   regions, is absorbed into both of them.

   That rule is load-bearing and js/versioning.js worked it out first, in
   _diffSegments. Word-level diffing splits

       thirty (30) days  →  forty-five (45) days

   into two changes, because the space between "thirty" and "(30)" is unchanged.
   Rendered as two independent decisions a reviewer could take "forty-five" and
   refuse "(45)" and produce "forty-five (30) days" — wording neither party ever
   proposed. The shared space is unchanged text and belongs to both sides of the
   merged run, so reconstruction stays exact either way.

   Deletion is emitted before insertion within a region, always. Word does the
   same, and a fixed order is what makes the ops — and therefore the hash over
   them — deterministic. */
function _runs(raw, a, b){
  const ops = [];
  const push = (op, text) => {
    if (!text) return;
    const p = ops[ops.length - 1];
    if (p && p.op === op) p.text += text; else ops.push({ op, text });
  };
  let del = '', ins = '', ws = '';
  const flush = () => {
    if (del || ins){ push('del', del); push('ins', ins); del = ''; ins = ''; }
  };
  for (const r of raw){
    if (r.t === 'keep'){
      const t = a[r.a];
      if ((del || ins) && _rlWs(t)){ ws += t; continue; }   // may bridge two regions
      flush();
      if (ws){ push('keep', ws); ws = ''; }
      push('keep', t);
      continue;
    }
    if (ws){ del += ws; ins += ws; ws = ''; }               // the bridge joins both sides
    if (r.t === 'del') del += a[r.a]; else ins += b[r.b];
  }
  flush();
  if (ws) push('keep', ws);
  return ops;
}

/* ---------- the one entry point ----------
   Old text and new text in; a storable ops array out. Deterministic: the same
   pair of strings always produces the identical array, which it has to be,
   because a change's hash is taken over content these ops describe and a hash
   that moved on a re-render would verify nothing.

   The common prefix and suffix are stripped before the search. This is worth
   doing on its own terms — most edits touch a few words in the middle of a
   long clause, and trimming turns a 4,000-token problem into a 40-token one —
   but it also bounds the fallback: when the search gives up, the single
   deletion and single insertion cover only the passage that actually diverged,
   not the whole clause. */
function redlineOps(oldText, newText){
  const a = redlineTokens(oldText), b = redlineTokens(newText);
  const ops = [];
  const push = (op, text) => {
    if (!text) return;
    const p = ops[ops.length - 1];
    if (p && p.op === op) p.text += text; else ops.push({ op, text });
  };

  let p = 0;
  const maxP = Math.min(a.length, b.length);
  while (p < maxP && a[p] === b[p]) p++;
  let sa = a.length, sb = b.length;
  while (sa > p && sb > p && a[sa - 1] === b[sb - 1]){ sa--; sb--; }

  if (p) push('keep', a.slice(0, p).join(''));
  const midA = a.slice(p, sa), midB = b.slice(p, sb);

  if (midA.length || midB.length){
    const raw = _myers(midA, midB, REDLINE_MAX_D);
    if (raw && !_shredded(raw, midA, midB)){
      for (const op of _runs(raw, midA, midB)) push(op.op, op.text);
    } else {
      /* Over budget, or aligned into confetti. One deletion, one insertion —
         the passage read as replaced rather than as edited. */
      push('del', midA.join(''));
      push('ins', midB.join(''));
    }
  }
  if (sa < a.length) push('keep', a.slice(sa).join(''));
  return ops;
}

/* ---------- reading an ops array back ----------
   The two invariants at the top of this file, as functions. Every test that
   trusts stored ops trusts these. */
const redlineOldText = ops => (ops || []).filter(o => o.op !== 'ins').map(o => o.text).join('');
const redlineNewText = ops => (ops || []).filter(o => o.op !== 'del').map(o => o.text).join('');
const redlineIsNoop = ops => !(ops || []).some(o => o.op !== 'keep');
function redlineStats(ops){
  let ins = 0, del = 0;
  for (const o of (ops || [])){
    const w = o.text.trim() ? o.text.trim().split(/\s+/).length : 0;
    if (o.op === 'ins') ins += w; else if (o.op === 'del') del += w;
  }
  return { ins, del };
}

/* ---------- the ops, as HTML ----------
   Rendered FROM STORAGE. This is the whole point of storing ops: what a
   reviewer sees is a picture of the record, not the output of whatever diff
   implementation happens to be loaded on the day they look. Classed spans, so
   the colours come from HaTi's tokens in one place. */
function redlineOpsHtml(ops, opts = {}){
  const e = window.esc || (s => String(s == null ? '' : s).replace(/[&<>]/g,
    ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])));
  const insCls = opts.insClass || 'nego-ins';
  const delCls = opts.delClass || 'nego-del';
  return (ops || []).map(o =>
    o.op === 'keep' ? e(o.text)
    : o.op === 'ins' ? `<span class="${insCls}">${e(o.text)}</span>`
    : `<span class="${delCls}">${e(o.text)}</span>`).join('');
}

if (typeof window !== 'undefined') Object.assign(window, {
  redlineTokens, redlineOps, redlineOpsHtml,
  redlineOldText, redlineNewText, redlineIsNoop, redlineStats, REDLINE_MAX_D,
});
if (typeof module !== 'undefined' && module.exports) module.exports = {
  redlineTokens, redlineOps, redlineOldText, redlineNewText, redlineIsNoop, redlineStats,
};
