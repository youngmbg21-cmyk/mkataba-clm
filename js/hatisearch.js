/* ---- ONE SEARCH OVER HaTi (owner, 22 Oct 2026; docs/PLAN-jambo-copilot.md, stage 1) ----
   "If they are allowed to see it, Jambo finds it." The server keeps one
   permission-aware index (hatiSearch in server/server.js); this file is the
   part BOTH hosts read the same way: which words of an ask are searched, how a
   misspelt word finds the word the book holds, and how a contract's wording is
   cut into passages a hit can point at.

   BY MEANING IS JAMBO'S JOB (the owner's answer (a)): the model turns the
   person's words into likely search words ("get out of the deal" → termination,
   cancel, exit) and hands them all here. Nothing here guesses a meaning.

   A PASSAGE IS NOT A CLAUSE. What counts as a clause is clauseSegment's alone
   (js/clausemodel.js, the browser, the paper's own DOM). A passage is only
   where a hit sits; it carries its first words, and the browser finds the
   clause those words are in.

   Like js/graphwhere.js: globals in the browser, a require on the server. */

/* every kind of thing the one search finds. Settings are found by stFind, the
   ONE settings finder (js/views/settings.js) — never a second copy here. */
/* 'guide' is the Handbook (js/handbook.js): HaTi's own instruction book, read by Jambo (26 Oct 2026) */
const HS_KINDS = ['contract', 'clause', 'obligation', 'note', 'request', 'person', 'party', 'history', 'template', 'standard', 'guide'];
const HS_MAX = 40;          // hits handed back at most; past it the total is said
const HS_TERMS_MAX = 16;    // words searched at most from one ask
const HS_PASSAGE_MAX = 1200;

/* words that carry no meaning in either language: dropped, never searched */
const HS_STOP = new Set(('a an the and or of to for in on at by is are am be was were do does did can could might must should would will '
  + 'i me my mine we our us you your it its this that these those there here what which when where why how who whom whose about with from into '
  + 'please show find open see tell give get want need look let me any all some bit part thing stuff say says said '
  + 'och eller i på av för till med om att det den de en ett är var som jag vi du ni min mitt vår vårt vad var hur när vem visa hitta öppna').split(/\s+/)
  .map(w => w.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')));

/* letters only, accents folded (å→a, é→e), lower case */
const hsFold = s => String(s == null ? '' : s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* The words an ask searches: folded, meaningless words dropped, each once.
   A reference with a digit in it ("MK-A1") stays whole, as the index holds it
   as its parts side by side. */
function hsTerms(q){
  const out = [];
  for (const raw of String(q == null ? '' : q).split(/\s+/)){
    const w = hsFold(raw).replace(/^[^\w]+|[^\w]+$/g, '');
    if (!w) continue;
    const parts = w.split(/[^\w]+/).filter(Boolean);
    if (parts.length > 1 && /\d/.test(w)){ if (!out.includes(parts.join(' '))) out.push(parts.join(' ')); continue; }
    for (const p of parts){
      if (p.length < 2 || HS_STOP.has(p) || out.includes(p)) continue;
      out.push(p);
    }
  }
  return out.slice(0, HS_TERMS_MAX);
}

/* edit distance, stopped as soon as it passes `max` (then max + 1) */
function hsEdit(a, b, max){
  a = String(a); b = String(b);
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let back = null, prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++){
    const cur = [i];
    let low = i;
    for (let j = 1; j <= b.length; j++){
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      /* two letters swapped is one slip, not two */
      if (back && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, back[j - 2] + 1);
      cur.push(v);
      if (v < low) low = v;
    }
    if (low > max) return max + 1;
    back = prev; prev = cur;
  }
  return prev[b.length];
}
/* A WORD'S ROOT: its everyday endings taken off, so "terminating",
   "terminated" and "termination" all find "terminat…" and "liabilities"
   finds "liability". Searched as a beginning of a word, never a whole one.
   Never shorter than three letters; a reference stays as it is. */
const HS_ENDINGS = ['ations', 'ation', 'ments', 'ment', 'ings', 'ing', 'ities', 'ity', 'ies', 'ied', 'ions', 'ion', 'ers', 'er', 'ed', 'es', 's', 'y'];
function hsRoot(w){
  w = String(w || '');
  if (/\d|\s/.test(w) || w.length < 5) return w;
  for (const e of HS_ENDINGS) if (w.endsWith(e) && w.length - e.length >= 4) return w.slice(0, -e.length);
  return w;
}
/* how far a misspelt word may be from the word meant: none under four letters */
const hsSlack = w => (w.length < 4 ? 0 : w.length < 8 ? 1 : 2);

/* A WORD THE BOOK DOES NOT HOLD finds the words it does that are one slip
   away (two for a long word), nearest and commonest first. `vocab` is a list
   of [word, howOften]. Nothing is near → [] (the word is searched as typed). */
function hsNearest(word, vocab, n){
  const w = hsFold(word), max = hsSlack(w);
  if (!max) return [];
  const hits = [];
  for (const [v, often] of vocab || []){
    if (!v || v === w || v[0] !== w[0] && v[1] !== w[1]) continue;
    const d = hsEdit(w, v, max);
    if (d <= max) hits.push([v, d, Number(often) || 0]);
  }
  hits.sort((x, y) => x[1] - y[1] || y[2] - x[2]);
  return hits.slice(0, n || 3).map(h => h[0]);
}

/* A CONTRACT'S WORDING CUT INTO PASSAGES: a line that reads as a heading
   (short, numbered or all capitals) starts one, and a passage is closed at
   HS_PASSAGE_MAX characters. Each is { at, head, text }: `at` its order. */
function hsPassages(text){
  const lines = String(text == null ? '' : text).replace(/\r/g, '').split(/\n+/).map(l => l.trim()).filter(Boolean);
  const out = [];
  let cur = null;
  /* "3. Payment", "iv) Term", "Article 3 Payment", "Clause 7 — Liability", "§ 4 Avgifter", "PAYMENT TERMS" */
  const isHead = l => l.length <= 90 && !/[.;:,]$/.test(l) && (/^(\d+(\.\d+)*|[ivxlc]+|[a-z])[.)]?\s+\S/i.test(l)
    || /^(article|clause|section|schedule|annex|artikel|klausul|punkt|bilaga|avsnitt|§)\s*[\divxlc]+[.):]?(\s|$)/i.test(l)
    || (/[A-Z]/.test(l) && l === l.toUpperCase() && /[A-Z]{3}/.test(l)));
  const close = () => { if (cur && cur.text.trim()) out.push({ at: out.length, head: cur.head, text: cur.text.trim() }); cur = null; };
  for (const l of lines){
    if (isHead(l)){ close(); cur = { head: l.slice(0, 120), text: l }; continue; }
    if (!cur) cur = { head: '', text: '' };
    if (cur.text.length + l.length > HS_PASSAGE_MAX){ const head = cur.head; close(); cur = { head, text: '' }; }
    cur.text += (cur.text ? '\n' : '') + l;
  }
  close();
  return out;
}

const HS_API = { HS_KINDS, HS_MAX, hsFold, hsTerms, hsRoot, hsEdit, hsNearest, hsPassages };
if (typeof window !== 'undefined') Object.assign(window, HS_API);
if (typeof module !== 'undefined' && module.exports) module.exports = HS_API;
