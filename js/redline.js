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
// repo already reads (js/docx.js): a run of text
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
/* INS AND DEL ARE ELEMENTS, not styled spans. `<ins>` and `<del>` are what HTML
   has for exactly this, and the difference is not cosmetic: a screen reader
   announces them as inserted and deleted wording, and a copy of the document
   pasted into Word arrives as markup rather than as coloured text. A contract
   redline read aloud as unmarked prose is a redline that lied.

   The class list carries BOTH a hook of our own and the utility names the
   workspace spec asks for. `hati-ins` is what our stylesheet targets, so the
   colours hold whether or not a utility framework is on the page; the utility
   names ride along so a host that has one styles them natively. Relying on the
   utility names alone would put the legibility of every redline behind a
   stylesheet this app loads from a CDN. */
/* nego-ins/nego-del ride along with the rest. The room's stylesheet and a good
   deal of the suite address a redline by those names, and an element carrying
   one more class is a strictly smaller change than a renamed hook: the new
   semantics arrive without breaking the contract everything else was written
   against. */
const REDLINE_INS_CLASS = 'hati-ins nego-ins bg-green-100 text-green-800 underline';
const REDLINE_DEL_CLASS = 'hati-del nego-del bg-red-100 text-red-800 line-through';
function redlineOpsHtml(ops, opts = {}){
  /* Guarded, because this module is also required directly by node tests and a
     bare `window` there is a ReferenceError rather than a falsy value. */
  const e = (typeof window !== 'undefined' && window.esc)
    || (s => String(s == null ? '' : s).replace(/[&<>]/g,
      ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])));
  const insCls = opts.insClass || REDLINE_INS_CLASS;
  const delCls = opts.delClass || REDLINE_DEL_CLASS;
  const tagIns = opts.spans ? 'span' : 'ins';
  const tagDel = opts.spans ? 'span' : 'del';
  /* ---- WHO LAST TOUCHED THIS EDIT, ON HOVER ----
     `opts.title` names the hand behind the marked wording, and the caller
     supplies it because only the caller knows whose change these ops belong to
     — this renderer is given an array of ops and nothing else.

     Escaped for an ATTRIBUTE, not for text. The text escaper on this page is
     the app's `esc`, which handles & < > and leaves a double quote alone; a
     name carrying one would close the attribute early and everything after it
     would be parsed as markup. A person's own name is not a trusted string. */
  const attr = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const t = String(opts.title == null ? '' : opts.title).trim();
  const tip = t ? ` title="${attr(t)}"` : '';
  /* OI-5 note: a del op directly followed by its ins renders </del><ins>
     with nothing between — deliberately. Any character injected here leaks
     into every text projection of the rendered node (richToText, exports,
     copy) and f36 pins that. The visible seam is opened by CSS instead:
     `del[class]+ins[class]{margin-inline-start}` in index.html and in the
     standalone history export — a gap the eye gets and the text never has. */
  return (ops || []).map(o =>
    o.op === 'keep' ? e(o.text)
    : o.op === 'ins' ? `<${tagIns} class="${insCls}"${tip}>${e(o.text)}</${tagIns}>`
    : `<${tagDel} class="${delCls}"${tip}>${e(o.text)}</${tagDel}>`).join('');
}

/* ============================================================
   BLOCK-AWARE REDLINE — structure survives the diff
   ============================================================
   A clause is not a paragraph. It is a heading, then numbered sub-clauses, then
   lettered sub-paragraphs, each on its own line with its own indent, and that
   shape is how a reader finds 7.1(b) and how a citation refers to it.

   Diffing a clause as one string and printing the result inside a single <p>
   loses all of it: the sub-list arrives as "(a) … (b) … (c) …" run together in
   one block, and the reader can no longer see where one sub-paragraph ends and
   the next begins — in the one view where they most need to.

   So the diff runs at two levels. LINES are aligned first, by their own LCS, so
   an untouched sub-paragraph stays untouched and a new one is a new block
   rather than a smear across its neighbours. Then each aligned pair is diffed
   at WORD level by redlineOps, which is where "thirty (30)" → "sixty (60)"
   becomes two marked words instead of two rewritten paragraphs.

   Nothing is invented and nothing is dropped: every line of both texts comes
   out the other side, in order. */

const _rlLineKey = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
/* Longest common subsequence over LINES, compared on squeezed text so a line
   that only had its spacing changed is still the same line. */
function _rlLineLcs(a, b){
  const n = a.length, m = b.length;
  /* Guard rail, same shape as REDLINE_MAX_D on the word diff: an O(n·m) table
     over a pathological pair is how a browser tab dies. Past the cap the caller
     falls back to whole-block replacement, which is honest — it says "this
     changed" without pretending to know exactly where. */
  if (n * m > 250000) return null;
  const t = [];
  for (let i = 0; i <= n; i++) t.push(new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      t[i][j] = _rlLineKey(a[i]) === _rlLineKey(b[j])
        ? t[i + 1][j + 1] + 1
        : Math.max(t[i + 1][j], t[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m){
    if (_rlLineKey(a[i]) === _rlLineKey(b[j])){ out.push([i, j]); i++; j++; }
    else if (t[i + 1][j] >= t[i][j + 1]) i++;
    else j++;
  }
  return out;
}
/* How close two lines are, 0..1, on shared words. Decides whether a deleted
   line and an inserted line are really ONE line reworded — the difference
   between a readable in-place redline and a wall of "all of this went, all of
   this arrived". */
function _rlKinship(a, b){
  const wa = _rlLineKey(a).toLowerCase().split(/\s+/).filter(Boolean);
  const wb = _rlLineKey(b).toLowerCase().split(/\s+/).filter(Boolean);
  if (!wa.length || !wb.length) return 0;
  const bag = new Map();
  for (const w of wa) bag.set(w, (bag.get(w) || 0) + 1);
  let hit = 0;
  for (const w of wb){ const n = bag.get(w) || 0; if (n){ hit++; bag.set(w, n - 1); } }
  return (2 * hit) / (wa.length + wb.length);
}
const RL_KINSHIP_MIN = 0.34;

/* The block plan for a clause. Each entry is one LINE of the result:
     { kind:'same', text }                 unchanged
     { kind:'edit', text, before, ops }    same line, wording moved
     { kind:'ins',  text }                 a line that arrived
     { kind:'del',  text }                 a line that went
   Callers render each entry in its own element, which is the whole point. */
function redlineBlocks(oldText, newText){
  /* An EMPTY text is no lines, not one empty line. ''.split('\n') returns [''],
     and that phantom line then paired off against real wording — so proposing
     a clause where there had been nothing reported the first new line as an
     edit of emptiness, with a stray deletion wedged between the insertions. */
  const lines = s => { const t = String(s == null ? '' : s); return t === '' ? [] : t.split('\n'); };
  const a = lines(oldText);
  const b = lines(newText);
  const pairs = _rlLineLcs(a, b);
  if (!pairs) return null;                        // too large: caller falls back
  const anchored = new Map(pairs);                // old index → new index
  const out = [];
  let i = 0, j = 0;
  const flush = (dels, inses, di, ii) => {
    /* Pair off what went with what arrived, in order, wherever the two lines
       are recognisably the same line reworded. What is left over on either side
       is a genuine insertion or deletion. */
    let x = 0, y = 0;
    while (x < dels.length && y < inses.length){
      if (_rlKinship(dels[x], inses[y]) >= RL_KINSHIP_MIN){
        out.push({ kind: 'edit', text: inses[y], before: dels[x],
          oi: di[x], ni: ii[y], ops: redlineOps(dels[x], inses[y]) });
        x++; y++;
      /* On a tie the DELETION goes first. A reader compares what was there
         against what is proposed, and printing the replacement above the thing
         it replaces reverses that reading. */
      } else if (dels.length - x >= inses.length - y){ out.push({ kind: 'del', text: dels[x], oi: di[x] }); x++; }
      else { out.push({ kind: 'ins', text: inses[y], ni: ii[y] }); y++; }
    }
    while (x < dels.length){ out.push({ kind: 'del', text: dels[x], oi: di[x] }); x++; }
    while (y < inses.length){ out.push({ kind: 'ins', text: inses[y], ni: ii[y] }); y++; }
  };
  while (i < a.length || j < b.length){
    if (anchored.has(i) && anchored.get(i) === j){
      out.push({ kind: 'same', text: b[j], oi: i, ni: j }); i++; j++; continue;
    }
    /* Collect up to the NEXT ANCHOR, whatever line it pairs with — not up to an
       anchor that happens to pair with the line j is sitting on. Stopping only
       on the exact match swallowed every anchored line between here and there,
       so a sub-paragraph nobody had touched was reported as edited. */
    const dels = [], inses = [], di = [], ii = [];
    while (i < a.length && !anchored.has(i)){ di.push(i); dels.push(a[i++]); }
    const stop = anchored.has(i) ? anchored.get(i) : b.length;
    while (j < stop){ ii.push(j); inses.push(b[j++]); }
    flush(dels, inses, di, ii);
  }
  return out;
}

/* What kind of line this is, so it can be drawn as what it is. Reads the
   classifier in js/docx.js where that module is present — one definition of
   "this is a heading" for the whole product — and falls back to the same two
   patterns where it is not (node tests, the portal's lighter stage). */
function redlineLineKind(line){
  if (typeof window !== 'undefined' && window.docLineKind) return window.docLineKind(line);
  const t = String(line == null ? '' : line).trim();
  if (!t) return 'blank';
  const letters = t.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 3 && t.length <= 80 && !/[a-z]/.test(t)
      && letters.length >= t.replace(/\s/g, '').length * 0.5) return 'heading';
  if (/^\d+(?:\.\d+)*[.)]?\s+\S/.test(t)) return 'clause';
  return 'text';
}
/* The marker a line opens with — "7.1", "(b)", "•" — and the wording after it.
   Split so the marker can sit in the hanging indent's gutter and the wording
   can wrap under itself, which is how a contract is set on paper. */
const RL_MARKER = /^(\s*)((?:\d{1,3}(?:\.\d+)*[.)]?)|(?:\([a-zA-Z]\))|(?:\([ivxlcdm]+\))|[•●▪◦‣·])\s+/;
/* ---- HOW DEEP A BULLET IS, READ OFF ITS OWN GLYPH ----
   richToText projects a nested bullet list as • then ◦ then ▪ (see _listMark in
   js/richdoc.js, which is the one place that ladder is decided). Everything
   else — a number, a letter, a dash — is depth 0: a decimal sub-list carries
   its depth in the number itself ("2.1"), so indenting it as well would say the
   same thing twice. Past the third level the glyph repeats, and so does the
   indent; a marker a reader cannot name is worse than one that is reused. */
const RL_BULLET_DEPTH = { '\u2022': 0, '\u25e6': 1, '\u25aa': 2 };
function redlineMarkerDepth(marker){
  return RL_BULLET_DEPTH[String(marker || '').trim()] || 0;
}
function redlineSplitMarker(line){
  const s = String(line == null ? '' : line);
  const m = s.match(RL_MARKER);
  if (!m) return { indent: '', marker: '', rest: s };
  return { indent: m[1] || '', marker: m[2], rest: s.slice(m[0].length) };
}

/* Render a block plan. Every line becomes its own element, carrying its own
   kind and its own marker, so headings stay headings, numbered clauses keep
   their numbers in the gutter, and a wrapped sub-paragraph hangs under its own
   first word instead of under the margin. */
function redlineBlocksHtml(blocks, opts = {}){
  const e = (typeof window !== 'undefined' && window.esc) || (s => String(s == null ? '' : s)
    .replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])));
  const insCls = opts.insClass || REDLINE_INS_CLASS;
  const delCls = opts.delClass || REDLINE_DEL_CLASS;
  const pre = opts.classPrefix || 'rl';
  return (blocks || []).map(b => {
    const kind = redlineLineKind(b.text);
    if (kind === 'blank') return '';
    const { marker, rest } = redlineSplitMarker(b.text);
    const tag = kind === 'heading' ? 'h4' : 'p';
    const cls = [`${pre}-line`, `${pre}-${kind}`, marker ? `${pre}-hang` : '',
      b.kind === 'ins' ? `${pre}-line-ins` : b.kind === 'del' ? `${pre}-line-del` : '']
      .filter(Boolean).join(' ');
    const gutter = marker ? `<span class="${pre}-marker">${e(marker)}</span>` : '';
    let inner;
    if (b.kind === 'edit'){
      /* The marker is not part of the argument. Diffing it would report "7.1"
         as deleted and "7.1" as inserted whenever the wording after it moved. */
      const bm = redlineSplitMarker(b.before);
      inner = gutter + redlineOpsHtml(redlineOps(bm.rest, rest),
        { insClass: insCls, delClass: delCls, spans: opts.spans });
    } else if (b.kind === 'ins'){
      inner = gutter + `<${opts.spans ? 'span' : 'ins'} class="${insCls}">${e(rest)}</${opts.spans ? 'span' : 'ins'}>`;
    } else if (b.kind === 'del'){
      inner = gutter + `<${opts.spans ? 'span' : 'del'} class="${delCls}">${e(rest)}</${opts.spans ? 'span' : 'del'}>`;
    } else {
      inner = gutter + e(rest);
    }
    return `<${tag} class="${cls}">${inner}</${tag}>`;
  }).join('');
}
/* ---- LINE-AWARE OPS, for the record rather than for the screen ----

   redlineOps aligns WORDS across the whole clause at once, and on a multi-line
   clause that is the wrong unit. Given a six-line clause where only line two
   moved, Myers is free to match the word "(a)" in the old text against the
   "(a)" three lines further down the new one — every token lands in a correct
   box, the reconstruction invariants hold, and the result is unreadable: two
   sub-paragraphs nobody touched come out struck through and re-inserted, and
   the replacement wording appears nowhere near the line it replaces.

   Rendering could not fix that, because the record was already wrong: the ops
   are stored when the change is FILED and every later render is a faithful
   read of them. So the alignment is fixed here, at the point of filing.

   Lines are matched first, then words within a matched pair — the same two-level
   walk redlineBlocks does. What comes out is an ordinary ops array: same shape,
   same guarantees, same renderer, merely aligned on the boundaries a contract
   actually has.

   THE INVARIANTS ARE THE HARD PART, and they are about newlines. A separator
   belongs to the side whose line it ends: if the old text has a further line
   after this one and the new text does not, the newline between them is part of
   the DELETION, not shared context. Getting that wrong reconstructs a text with
   a stray blank line at the end — which would be a redline that cannot
   reproduce the wording it claims to describe. */
function redlineOpsStructured(oldText, newText){
  const blocks = redlineBlocks(oldText, newText);
  if (!blocks) return redlineOps(oldText, newText);   // too large to align by line
  const a = String(oldText == null ? '' : oldText);
  const b = String(newText == null ? '' : newText);
  const lastO = (a === '' ? -1 : a.split('\n').length - 1);
  const lastN = (b === '' ? -1 : b.split('\n').length - 1);
  const out = [];
  const push = (op, text) => {
    if (!text) return;
    const last = out[out.length - 1];
    if (last && last.op === op) last.text += text;
    else out.push({ op, text });
  };
  for (const blk of blocks){
    if (blk.kind === 'same') push('keep', blk.text);
    else if (blk.kind === 'edit') for (const o of blk.ops) push(o.op, o.text);
    else if (blk.kind === 'ins') push('ins', blk.text);
    else push('del', blk.text);
    /* The separator after this line, attributed to whichever sides still have
       a line coming. A line present on both sides with more to follow on both
       shares its newline; anything else owns it alone. */
    const moreO = blk.oi != null && blk.oi < lastO;
    const moreN = blk.ni != null && blk.ni < lastN;
    if (blk.kind === 'same' || blk.kind === 'edit'){
      if (moreO && moreN) push('keep', '\n');
      else if (moreO) push('del', '\n');
      else if (moreN) push('ins', '\n');
    }
    else if (blk.kind === 'del'){ if (moreO) push('del', '\n'); }
    else if (moreN) push('ins', '\n');
  }
  return out;
}

/* ---- the same structure, from STORED ops ----
   The negotiation renders a redline from the ops recorded when the change was
   filed, never from a diff run at display time: two renders of one record are
   then identical by construction, which is what makes "what was reviewed is
   what was decided on" a property rather than a hope.

   So structure cannot come from re-diffing. It comes from regrouping — a
   newline inside an op's text is a line boundary, and splitting there yields
   one op list per line without touching a single recorded op. */
function redlineOpsBlocks(ops){
  const out = [[]];
  for (const o of (ops || [])){
    const parts = String(o.text == null ? '' : o.text).split('\n');
    for (let k = 0; k < parts.length; k++){
      if (k) out.push([]);
      if (parts[k] !== '') out[out.length - 1].push({ op: o.op, text: parts[k] });
    }
  }
  return out;
}
/* Render those groups, one block per line.

   The marker IS split out here now — for RENDERING, never for the record
   (16 Aug 2026, owner-reported off a screenshot: "specifications and provided
   needs to start at the same line as manufacture"). This function used to
   leave the marker inside its op and do the hang in CSS alone — negative
   text-indent against matching padding — and that geometry aligns the first
   line with its wraps ONLY if the marker plus its gap is exactly the hanging
   measure. A bullet is a third of it, so the wording after "•" started well
   left of its own wrapped lines and the wraps read as over-indented.

   WHAT IS AND IS NOT TOUCHED. The recorded ops are inside the fingerprint and
   are not rewritten: the marker's characters are rendered through the SAME
   op renderer, wearing the SAME ins/del element and therefore the same
   colour and strike — they are merely grouped inside a presentational
   `<span class="rl-marker">` so the CSS can make the marker a fixed-width
   gutter (see the rl-hang rules) and start the wording at the tab stop on
   every line, first and wrapped alike. textContent is character-identical to
   what was rendered before. The split only happens when the whole marker
   sits inside the line's FIRST op — a marker torn across two ops is left
   alone rather than half-boxed. */
/* ---- WHAT A BLOCK SHOWS, AND WHICH BLOCKS ARE REALLY DRAWN ----
   The renderer below has always worked both out inline and dropped a block
   that comes back empty. They are named here because a SECOND reader needs the
   same answers — "how many blocks does this change touch, and how many does it
   leave alone" — and two functions deciding for themselves what counts as a
   drawn block is how they come to disagree about a count printed beside the
   thing it counts. */
function redlineBlockShown(group){
  const newText = group.filter(o => o.op !== 'del').map(o => o.text).join('');
  const oldText = group.filter(o => o.op !== 'ins').map(o => o.text).join('');
  return newText.trim() ? newText : oldText;
}
const redlineBlockTouched = group => group.some(o => o.op !== 'keep');
function redlineDrawnBlocks(ops){
  return redlineOpsBlocks(ops).filter(g => g.length && redlineBlockShown(g).trim());
}
/* HOW MUCH OF A CLAUSE THIS CHANGE ACTUALLY TOUCHES. Counted off the blocks
   that would really be drawn, so a caller printing "N not shown" is printing
   the same arithmetic the renderer is about to perform. */
function redlineBlockStats(ops){
  const g = redlineDrawnBlocks(ops);
  const changed = g.filter(redlineBlockTouched).length;
  return { total: g.length, changed, unchanged: g.length - changed };
}
function redlineOpsBlocksHtml(ops, opts = {}){
  const pre = opts.classPrefix || 'rl';
  /* ---- ONLY WHAT CHANGED, WHERE THE CALLER ASKS FOR IT (owner-asked 2 Sep
     2026, of the open card: "lets only have the sentences or bullet points
     that have been redlined show up") ----
     OFF BY DEFAULT, so the paper, the clause panel and every export are
     byte-identical: this is a decision about ONE surface, and a clause read on
     the contract must still read as the clause.
     A CHANGE THAT TOUCHES NOTHING FALLS BACK TO THE WHOLE THING rather than
     drawing an empty box — a formatting-only change files all-keep ops, and
     showing nothing at all would be worse than showing everything. */
  let blocks = redlineDrawnBlocks(ops);
  if (opts.changedOnly){
    const only = blocks.filter(redlineBlockTouched);
    if (only.length) blocks = only;
  }
  return blocks.map(group => {
    const shown = redlineBlockShown(group);
    const kind = redlineLineKind(shown);
    const allDel = group.every(o => o.op === 'del');
    const allIns = group.every(o => o.op === 'ins');
    const tag = kind === 'heading' ? 'h4' : 'p';
    const shownMark = redlineSplitMarker(shown).marker;
    const hang = shownMark ? `${pre}-hang` : '';
    /* ---- A SUB-BULLET IS DRAWN AS A SUB-BULLET (owner-reported 2 Sep 2026) ----
       The depth reaches this renderer as the MARKER ITSELF — • ◦ ▪, the ladder
       richToText projects and RL_MARKER already reads — so it is read off the
       glyph rather than carried in a second field nobody would keep in step.
       Presentation only: nothing here changes what the line SAYS, which is why
       it is safe to do at the draw and would not be safe in the ops. */
    const depth = hang ? redlineMarkerDepth(shownMark) : 0;
    const cls = [`${pre}-line`, `${pre}-${kind}`, hang,
      depth ? `${pre}-hang-${depth + 1}` : '',
      allDel ? `${pre}-line-del` : allIns ? `${pre}-line-ins` : '']
      .filter(Boolean).join(' ');
    /* Attribution rides INSIDE the block renderer rather than replacing it.
       Rendering attributed ops through the flat renderer instead would answer
       "who wrote this" at the cost of the clause's numbering and indents —
       trading one thing a reader needs for another. */
    const draw = g => opts.attributed
      ? redlineAttributedHtml(g, opts)
      : redlineOpsHtml(g, opts);
    let inner;
    const fm = hang ? redlineSplitMarker(String(group[0].text)) : { marker: '' };
    if (fm.marker){
      const head = String(group[0].text);
      const markerOp = { ...group[0], text: head.slice(0, head.length - fm.rest.length) };
      const rest = [{ ...group[0], text: fm.rest }, ...group.slice(1)]
        .filter(o => o.text !== '');
      inner = `<span class="${pre}-marker">${draw([markerOp])}</span>${draw(rest)}`;
    } else {
      inner = draw(group);
    }
    return `<${tag} class="${cls}">${inner}</${tag}>`;
  }).join('');
}

/* ============================================================
   WHERE DELETED WORDING USED TO SIT
   ============================================================
   Struck-through text is on the screen and is not in the new text. That is the
   whole point of a redline, and it is also why a passage marked for deletion
   cannot be located the way ordinary wording is: searching the proposed text
   for it fails by construction.

   What a caller needs, to offer "replace this rather than just delete it", is
   the POINT IN THE NEW TEXT where the deleted run was taken out. Every ops
   array already carries it. The two reconstruction invariants at the top of
   this file — keep+del rebuilds the old text, keep+ins rebuilds the new — mean
   a position can be tracked through both sides at once, advancing the old
   cursor on keep and del and the new cursor on keep and ins. Where a del run
   sits, the new cursor IS the seam it left behind.

   An entire deleted run collapses to ONE point in the new text. That is not a
   loss of precision to apologise for: once the wording is gone there is no
   finer position to have, so a caller replacing part of a struck run puts its
   wording at the seam, which is the only well-defined answer there is. */
function redlineDeletedSpans(before, after){
  const ops = redlineOpsStructured(before, after);
  const spans = [];
  let bPos = 0, aPos = 0;
  for (let i = 0; i < ops.length; i++){
    const o = ops[i];
    const n = o.text.length;
    if (o.op === 'keep'){ bPos += n; aPos += n; continue; }
    if (o.op === 'ins'){ aPos += n; continue; }
    /* The raw seam is where the run was taken out. That is the right anchor for
       a plain deletion and the WRONG one where the deletion was part of a
       replacement — a del followed by an ins is one edit, and its new wording
       runs from the seam. Splicing at the seam would land in the middle of it:

           "…thirty (30) [del: days and shall provide accounts.][ins: days.]"

       anchored at the seam puts the new wording between "(30) " and "days.",
       which is not a sentence. So the anchor walks past the replacement to the
       end of the changed region, where wording taking the deletion's place
       actually belongs. */
    let at = aPos;
    for (let j = i + 1; j < ops.length && ops[j].op !== 'keep'; j++)
      if (ops[j].op === 'ins') at += ops[j].text.length;
    spans.push({ text: o.text, beforeStart: bPos, beforeEnd: bPos + n, at, seam: aPos });
    bPos += n;
  }
  return spans;
}

/* The deleted run that WHOLLY contains a passage, or null.

   Wholly is the load-bearing word. A selection that starts inside a deletion
   and ends outside it spans the seam of the redline: it exists in neither
   version of the clause, and there is nowhere honest to put an answer back.
   Returning null there rather than the nearest run is what keeps a caller's
   refusal correct in the one case that still deserves refusing.

   `hint` disambiguates the same wording struck out in two places, on the same
   nearest-match reasoning the ordinary occurrence lookup uses. */
function redlineDeletionCovering(before, after, text, hint){
  const needle = String(text == null ? '' : text).trim();
  if (!needle) return null;
  const want = (typeof hint === 'number' && isFinite(hint)) ? hint : 0;
  let best = null, bestGap = Infinity;
  for (const s of redlineDeletedSpans(before, after)){
    if (s.text.indexOf(needle) === -1) continue;
    const gap = Math.abs(s.at - want);
    if (gap < bestGap){ bestGap = gap; best = s; }
  }
  return best;
}

/* ============================================================
   WHOSE WORDS ARE THESE — attribution across a stack of edits
   ============================================================
   Three colleagues pass a clause between them and it arrives at the counterparty
   as one diff, which is right: they have to answer what it says now, not watch
   us argue. At HOME the opposite is true. An approver signing the round off
   needs to know that the indemnity carve-out came from Legal and the payment
   term from Commercial, because those are two different conversations to have
   before it goes out — and a single flat redline cannot tell them apart.

   So: given the settled baseline and the ordered steps that were stacked on it,
   mark each insertion in the final diff with the step that introduced it.

   WHAT THIS DELIBERATELY WILL NOT DO IS GUESS. An insertion is attributed only
   when exactly one step can account for it — the first step whose wording
   contains it where the step before did not. Short fragments are left
   unattributed on purpose: a two-character run appears in everybody's text, and
   an attribution that is right most of the time is worse than none, because a
   reader cannot tell which case they are looking at. Unattributed insertions
   render exactly as they do today. */
const REDLINE_ATTRIB_MIN = 3;
function redlineAttributeOps(base, steps){
  const b = String(base == null ? '' : base);
  const list = (steps || []).filter(s => s && typeof s.text === 'string');
  if (!list.length) return redlineOpsStructured(b, b);
  const final = list[list.length - 1].text;
  const ops = redlineOpsStructured(b, final);
  return ops.map(o => {
    if (o.op !== 'ins') return o;
    const frag = o.text.trim();
    /* Too short to identify. Everything contains "of". */
    if (frag.length < REDLINE_ATTRIB_MIN) return o;
    let owner = null, hits = 0;
    for (let i = 0; i < list.length; i++){
      const prev = i === 0 ? b : list[i - 1].text;
      if (list[i].text.includes(frag) && !prev.includes(frag)){
        if (hits === 0) owner = list[i].author || null;
        hits++;
      }
    }
    /* Introduced, removed and reintroduced by a different hand — the history is
       real but the authorship is genuinely ambiguous, so it is left blank
       rather than resolved by picking one. */
    return hits === 1 && owner ? Object.assign({}, o, { author: owner }) : o;
  });
}

/* The attributed ops as HTML: the same redline, with each identified insertion
   carrying the initials of whoever wrote it. Insertions nobody can be sure
   about are drawn exactly as an ordinary redline draws them. */
function redlineAttributedHtml(ops, opts = {}){
  const e = (typeof window !== 'undefined' && window.esc)
    || (s => String(s == null ? '' : s).replace(/[&<>"]/g,
      ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])));
  const insCls = opts.insClass || REDLINE_INS_CLASS;
  const delCls = opts.delClass || REDLINE_DEL_CLASS;
  const initials = opts.initials || (name => {
    const p = String(name || '').trim().split(/\s+/).filter(Boolean);
    return !p.length ? '' : p.length === 1 ? p[0].slice(0, 2).toUpperCase()
      : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  });
  return (ops || []).map(o => {
    if (o.op === 'keep') return e(o.text);
    if (o.op === 'del') return `<del class="${delCls}">${e(o.text)}</del>`;
    const who = o.author && (o.author.name || o.author);
    if (!who) return `<ins class="${insCls}">${e(o.text)}</ins>`;
    return `<ins class="${insCls}" data-author="${e(who)}" title="Added by ${e(who)}">${e(o.text)}`
      + `<span class="rl-authormark">${e(initials(who))}</span></ins>`;
  }).join('');
}

/* The whole job in one call: two texts in, structure-preserving redline out.
   Returns null when the pair is too large to align, so a caller can fall back
   to whole-block replacement rather than print a wrong picture confidently. */
function redlineStructuredHtml(oldText, newText, opts){
  const blocks = redlineBlocks(oldText, newText);
  return blocks ? redlineBlocksHtml(blocks, opts) : null;
}

/* ============================================================
   STACKED REDLINES — an offset that survives the edit before it
   ============================================================
   A character offset is only meaningful against the exact string it was
   measured on. The lab resolves "which occurrence of this phrase did you point
   at" once, as an index into the clause's working text — and until the proposal
   became a side-panel conversation, that index was consumed milliseconds later
   and the two strings could not have differed.

   They can now. The panel stays open while its author reads the clause, files a
   different change, accepts a colleague's ask, or takes a second pass over the
   same wording. Every one of those rebuilds labWorkingText(), and an offset
   carried across it points at the wrong words — earlier by the length of an
   insertion above it, later by the length of a deletion. A splice at a drifted
   offset does not fail loudly; it files a redline that cuts a clause mid-word.

   So an offset is REBASED before it is used: walked through the ops between the
   string it was measured on and the string it is about to be spliced into. Keep
   runs carry it along, insertions above it push it down, deletions above it
   pull it up, and an offset that lands inside a deleted run collapses to the
   seam that run left — the only well-defined answer once the wording is gone. */
function redlineRebaseOffset(oldText, newText, offset){
  const from = String(oldText == null ? '' : oldText);
  const to   = String(newText == null ? '' : newText);
  const at = Math.max(0, Math.min(Number(offset) || 0, from.length));
  if (from === to) return at;
  const ops = redlineOpsStructured(from, to);
  let oPos = 0, nPos = 0;
  for (const o of ops){
    const n = o.text.length;
    if (o.op === 'ins'){ nPos += n; continue; }
    if (o.op === 'keep'){
      if (at <= oPos + n) return nPos + (at - oPos);
      oPos += n; nPos += n; continue;
    }
    /* A del run: the whole run collapses to one point in the new text, so an
       offset anywhere inside it answers with that seam rather than pretending
       to a precision the deletion destroyed. */
    if (at <= oPos + n) return nPos;
    oPos += n;
  }
  return nPos;
}

/* ============================================================
   DISCARDING A DRAFT — Redline.removeChange()
   ============================================================
   Retracting an unsent draft has to be as ordinary as writing one. Until now
   the only ways off a clause were to accept it, reject it or overwrite it, and
   none of those is what somebody means by "I have thought better of this" about
   wording that has never left the building.

   TWO THINGS THIS REFUSES, both because the alternative rewrites history the
   other side is relying on:

     · A change that has been SENT. The counterparty has read it and may be
       part-way through answering it. That is withdrawn or superseded openly,
       not deleted from under them.
     · A change that has been DECIDED. Accepted wording is in the working text
       and rejected wording is a recorded answer; deleting either would make the
       record disagree with the document.

   AND ONE THING IT REPAIRS. A discarded draft may have a colleague's pass
   stacked on top of it. Removing the record without relinking would leave that
   pass pointing at an id that no longer exists — labChainOf would return a
   chain of one and the internal drafting history would silently lose a step.
   So its children are re-parented onto what the removed change was itself
   stacked on, and their depth comes down with them. */
const REDLINE_DRAFT_STAGE = 'internal_draft';
function redlineChangesOf(store){
  if (Array.isArray(store)) return store;
  if (store && Array.isArray(store.changes)) return store.changes;
  return null;
}
function redlineRemoveChange(store, id, opts = {}){
  const changes = redlineChangesOf(store);
  if (!changes) return { ok: false, reason: 'no-store', message: 'There is nothing to discard from.' };
  const i = changes.findIndex(x => x && x.id === id);
  if (i < 0) return { ok: false, reason: 'not-found', message: `${id} is not on this document.` };
  const ch = changes[i];
  if (ch.sent === true) return { ok: false, reason: 'sent',
    message: `${ch.id} has already gone to the other side. Withdraw or supersede it openly rather than discarding it.` };
  if (ch.status && ch.status !== 'pending') return { ok: false, reason: 'decided',
    message: `${ch.id} has been ${ch.status}. A decided change is part of the record and cannot be discarded.` };
  /* The stage is the second lock, checked independently of `sent` for the same
     reason the wall checks both: a record with one field wrong must still be
     refused by the other. `opts.anyStage` is for callers with their own rule. */
  if (!opts.anyStage && ch.stage && ch.stage !== REDLINE_DRAFT_STAGE)
    return { ok: false, reason: 'stage',
      message: `${ch.id} is not an internal draft (${ch.stage}), so discarding it is not the way to take it back.` };
  changes.splice(i, 1);
  const reparented = [];
  for (const x of changes){
    if (!x || x.parentChangeId !== ch.id) continue;
    x.parentChangeId = ch.parentChangeId || null;
    x.depth = Math.max(0, (Number(x.depth) || 0) - 1);
    reparented.push(x.id);
  }
  return { ok: true, removed: ch, reparented };
}

/* Take the discarded draft's markup off the canvas straight away.

   A repaint follows and would do this anyway — but not on the same frame, and
   the gap is long enough to see. Leaving struck-through wording on screen after
   pressing Discard reads as "that did not work", which is the one thing a
   destructive-looking button must never imply when it has in fact worked.

   Scoped, and the scope matters: the badge for THIS change goes unconditionally,
   and a clause's ins/del markup is unwound only once no badge is left on it. A
   clause carrying a second, stacked draft keeps its markup, because that markup
   is still true. */
function redlineClearMarkup(id, root){
  const doc = (root && root.querySelectorAll) ? root
    : (typeof document !== 'undefined' ? document : null);
  if (!doc) return 0;
  let n = 0;
  const sel = String(id == null ? '' : id).replace(/["\\]/g, '\\$&');
  const badges = [
    ...doc.querySelectorAll(`.change-tag-badge[data-change-id="${sel}"]`),
    ...doc.querySelectorAll(`[id="${sel}"]`)
  ];
  const clauses = new Set();
  for (const b of badges){
    const frame = b.closest && b.closest('[data-lab-clause], .clause-frame');
    if (frame) clauses.add(frame);
    b.remove(); n++;
  }
  for (const frame of clauses){
    if (frame.querySelector('.change-tag-badge')) continue;   // another draft still stands
    for (const del of [...frame.querySelectorAll('del, .lab-del')]){ del.remove(); n++; }
    for (const ins of [...frame.querySelectorAll('ins, .lab-ins')]){
      /* Unwrapped, not removed: an insertion's words are the clause's words the
         moment the markup around them stops being a proposal. */
      const mark = ins.querySelector && ins.querySelector('.rl-authormark');
      if (mark) mark.remove();
      const text = (typeof doc.createTextNode === 'function' ? doc : document)
        .createTextNode(ins.textContent || '');
      ins.replaceWith(text); n++;
    }
  }
  return n;
}

/* The namespace the callers name. Everything on it is the module's own
   function — this is one object to reach for, not a second implementation. */
const Redline = {
  DRAFT_STAGE: REDLINE_DRAFT_STAGE,
  removeChange: redlineRemoveChange,
  clearMarkup: redlineClearMarkup,
  rebaseOffset: redlineRebaseOffset,
  ops: redlineOps,
  opsStructured: redlineOpsStructured,
  html: redlineOpsHtml,
  deletedSpans: redlineDeletedSpans,
  deletionCovering: redlineDeletionCovering,
};

if (typeof window !== 'undefined') Object.assign(window, {
  Redline, redlineRemoveChange, redlineClearMarkup, redlineChangesOf,
  redlineRebaseOffset, REDLINE_DRAFT_STAGE,
  redlineTokens, redlineOps, redlineOpsHtml,
  redlineOldText, redlineNewText, redlineIsNoop, redlineStats, REDLINE_MAX_D,
  REDLINE_INS_CLASS, REDLINE_DEL_CLASS,
  redlineBlocks, redlineBlocksHtml, redlineStructuredHtml,
  redlineOpsBlocks, redlineOpsBlocksHtml, redlineOpsStructured,
  redlineBlockShown, redlineBlockTouched, redlineDrawnBlocks, redlineBlockStats,
  redlineAttributeOps, redlineAttributedHtml, REDLINE_ATTRIB_MIN,
  redlineDeletedSpans, redlineDeletionCovering,
  redlineLineKind, redlineSplitMarker, redlineMarkerDepth,
});
if (typeof module !== 'undefined' && module.exports) module.exports = {
  redlineTokens, redlineOps, redlineOldText, redlineNewText, redlineIsNoop, redlineStats,
  redlineBlocks, redlineBlocksHtml, redlineStructuredHtml,
  redlineOpsBlocks, redlineOpsBlocksHtml, redlineOpsStructured,
  redlineBlockShown, redlineBlockTouched, redlineDrawnBlocks, redlineBlockStats,
  redlineAttributeOps, redlineAttributedHtml, REDLINE_ATTRIB_MIN,
  redlineDeletedSpans, redlineDeletionCovering,
  redlineLineKind, redlineSplitMarker, redlineMarkerDepth, REDLINE_INS_CLASS, REDLINE_DEL_CLASS,
  Redline, redlineRemoveChange, redlineClearMarkup, redlineChangesOf,
  redlineRebaseOffset, REDLINE_DRAFT_STAGE,
};
