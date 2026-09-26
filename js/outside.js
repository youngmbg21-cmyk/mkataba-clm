/* ============================================================
   REDLINE HERE, SIGN THERE — the one reading, for both hosts
   (Young's go on "Redline Here, Sign There", 26 Sep 2026)
   ============================================================
   You upload the other side's contract and negotiate it in HaTi with every
   tool it already has. HaTi's job is to get both sides to the SAME WORDS.
   Once they agree, it hands those words over as a Word file and from there
   the document is theirs: they put it into their own contract design and
   sign it their way. When the signed copy comes back it is uploaded, HaTi
   checks that the words are still the ones agreed, and it becomes a contract
   with its own number.

   THIS FILE IS THE READING, loaded by the BROWSER and the SERVER alike (the
   js/signapproval.js pattern): the screen and the wall ask the same questions
   of the same record. It spends nothing, writes nothing and calls no route.

   WHAT IT CARRIES
     · the working reference (RL-012) and the contract number printer
       — contractRef is the ONE thing a screen prints where it used to print
       c.id. The id stays the key everywhere; the number is what people read.
     · where a working file is listed, and whether a handover is live
     · the handover's clock: the reminders and the "still live?" question
     · THE WORD CHECK — the signed copy compared with the agreed wording by
       its words, in any order, ignoring their design, their numbering, a
       cover page and a signature block.

   EVERY FIELD IT READS IS ABSENT ON EVERY RECORD ON FILE, so a contract that
   never took this route answers exactly as it did before this file existed. */

const WORKING_PREFIX = 'RL-';
/* The lead is reminded after this many WORKING days — the standard HaTi
   already uses for a reply that is late (the desk's staleDays) — and then
   once a week. */
const HANDOVER_REMIND_WORKDAYS = 5;
const HANDOVER_REMIND_EVERY_DAYS = 7;
/* After this many days with nothing back HaTi asks whether the deal is still
   live. Long enough for any signing route, short enough that a dead deal does
   not sit on the Negotiations page for a season. */
const HANDOVER_LIVE_DAYS = 60;
/* How the other side signed it. A fact the person confirms at filing; HaTi
   reads a hint off the copy (a DocuSign envelope id) and never decides it. */
const SIGNED_VIA = ['docusign', 'esign', 'own', 'paper', 'other'];
/* The wording, the negotiation and the money are frozen while the agreed
   words are out with them. The words are what they will sign; the value is
   what the approver said yes to. A subset of EXECUTED_IMMUTABLE on the
   server, so a record that goes on to be filed only gains protection. */
const HANDOVER_FROZEN = ['body', 'redlineText', 'format', 'upload', 'changes', 'negotiation', 'value', 'valueType'];

/* ---- THE WORKING REFERENCE, AND THE NUMBER PEOPLE READ ----
   A working file is keyed RL-012 for life: links, notes, history, the search
   and Copilot all find a file by its key, and about fifty places print it, so
   the key cannot change halfway through. What changes at filing is what
   people READ: the record gains `contractNo` (MK-241), assigned by the server
   in the save that files it, and contractRef prints that from then on. */
function isWorkingId(id){ return /^RL-\d+$/i.test(String(id == null ? '' : id)); }
function workingIdOf(n){
  const k = Math.max(1, Math.floor(Number(n) || 0));
  return WORKING_PREFIX + String(k).padStart(3, '0');
}
function contractRef(c){ return c ? String(c.contractNo || c.id || '') : ''; }
/* A working file is one that has not taken its contract number yet. A
   contract that was numbered from the day it was made (every MK record) is
   never a working file, whichever route it is signed by. */
function contractIsWorkingFile(c){ return !!c && isWorkingId(c.id) && !c.contractNo; }
/* Does this id answer to this text? A person may type or paste either the
   working reference or the contract number, and both find the one file. */
function contractRefMatches(c, q){
  const s = String(q == null ? '' : q).trim().toUpperCase();
  if (!c || !s) return false;
  return String(c.id || '').toUpperCase() === s || String(c.contractNo || '').toUpperCase() === s;
}

/* ---- WHO RUNS THE SIGNING ----
   ABSENT READS "WE SIGN IN HaTi", which is what every contract on file does.
   'outside' is the one other answer. */
function signRouteOf(c){ return c && c.signRoute === 'outside' ? 'outside' : 'inside'; }
function _ohExecuted(c){ return !!(c && ((c.execution && c.execution.at) || c.hash || c.status === 'Signed')); }
/* The handover that stands, or null. A cancelled one (a reopen) is history. */
function handoverOf(c){
  const h = c && c.handover;
  return (h && h.at && !h.cancelledAt) ? h : null;
}
/* Out with them for signature: handed over and not yet filed. */
function handoverActive(c){ return !!handoverOf(c) && !_ohExecuted(c); }
/* Where it is listed before it is a contract. A working file is on the
   Negotiations page from the moment it is uploaded until it is filed —
   including the weeks it is out for signature, when today a file would have
   dropped off that page once its round was closed. A numbered contract on
   this route is listed there while it is out with them. */
function outsideListed(c){
  if (!c || c.archived || c.status === 'Declined' || _ohExecuted(c)) return false;
  return contractIsWorkingFile(c) || handoverActive(c);
}

/* ---- WORKING DAYS, the way an office counts waiting ----
   Monday to Friday, counted from the day after. The same arithmetic as
   saWorkdays (js/signapproval.js) — f381 pins the two equal — kept here so
   this file stands on its own on either host. Public holidays are not known
   and are not guessed. */
function ohWorkdays(fromIso, toMs){
  const from = Date.parse(fromIso || '');
  const to = Number.isFinite(toMs) ? toMs : Date.now();
  if (!Number.isFinite(from) || to <= from) return 0;
  const d = new Date(from); d.setHours(0, 0, 0, 0);
  const end = new Date(to); end.setHours(0, 0, 0, 0);
  let n = 0, guard = 0;
  while (d < end && guard++ < 4000){
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    if (w !== 0 && w !== 6) n++;
  }
  return n;
}
/* The inverse: the day `n` working days after `fromIso`, at local midnight. */
function ohAddWorkdays(fromIso, n){
  const from = Date.parse(fromIso || '');
  if (!Number.isFinite(from)) return NaN;
  const d = new Date(from); d.setHours(0, 0, 0, 0);
  let k = 0, guard = 0;
  while (k < n && guard++ < 4000){
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    if (w !== 0 && w !== 6) k++;
  }
  return d.getTime();
}
const OH_DAY = 86400000;
function handoverDays(c, nowMs){
  const h = handoverOf(c); if (!h) return 0;
  const at = Date.parse(h.at); const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  if (!Number.isFinite(at) || now <= at) return 0;
  const a = new Date(at); a.setHours(0, 0, 0, 0);
  const b = new Date(now); b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((b - a) / OH_DAY));
}
/* ---- THE REMINDERS: after five working days, then weekly ----
   Keyed so a sweep that runs twice a day sends each one once: 'r1' is the
   first, 'w1', 'w2'… the weekly ones after it. Null while nothing is due. A
   copy they have signed and we have not is its own situation and its own
   words, so it does not stop the clock — the lead is still owed a nudge. */
function handoverFirstReminderAt(c){
  const h = handoverOf(c); if (!h) return NaN;
  return ohAddWorkdays(h.at, HANDOVER_REMIND_WORKDAYS);
}
function handoverReminderKey(c, nowMs){
  if (!handoverActive(c)) return null;
  const first = handoverFirstReminderAt(c);
  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  if (!Number.isFinite(first) || now < first) return null;
  const k = Math.floor((now - first) / (HANDOVER_REMIND_EVERY_DAYS * OH_DAY));
  return k <= 0 ? 'r1' : 'w' + k;
}
function handoverNextReminderAt(c, nowMs){
  if (!handoverActive(c)) return NaN;
  const first = handoverFirstReminderAt(c);
  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  if (!Number.isFinite(first)) return NaN;
  if (now < first) return first;
  const k = Math.floor((now - first) / (HANDOVER_REMIND_EVERY_DAYS * OH_DAY));
  return first + (k + 1) * HANDOVER_REMIND_EVERY_DAYS * OH_DAY;
}
/* ---- IS THE DEAL STILL LIVE? ----
   Asked after HANDOVER_LIVE_DAYS with nothing back, counted from the handover
   or from the last time somebody answered "keep waiting". A copy they have
   signed is something back: the deal is plainly live. */
function handoverLiveFrom(c){
  const h = handoverOf(c); if (!h) return '';
  return (h.live && h.live.keptAt) || h.at;
}
function handoverStillLiveDue(c, nowMs){
  const h = handoverOf(c);
  if (!h || !handoverActive(c) || (h.partial && h.partial.at)) return false;
  const from = Date.parse(handoverLiveFrom(c));
  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  return Number.isFinite(from) && now - from >= HANDOVER_LIVE_DAYS * OH_DAY;
}
/* The one word for where a handed-over file stands: 'partial' (they have
   signed and we have not), 'stale' (the still-live question is due), 'with'
   (out with them). Null when nothing is out. */
function handoverStage(c, nowMs){
  const h = handoverOf(c);
  if (!h || !handoverActive(c)) return null;
  if (h.partial && h.partial.at) return 'partial';
  if (handoverStillLiveDue(c, nowMs)) return 'stale';
  return 'with';
}
/* ---- WHO SIGNS FOR US, OFF THE SIGNING ORDER ----
   Two rules read it — the approval rule for a marked person, and the signing
   limit — and our signatory is told to expect the document. The first row of
   ours on the order; null where nobody is named. Nothing about it goes to
   them: who signs on their side is theirs to decide. */
function outsideSignatory(c){
  const plan = Array.isArray(c && c.signerPlan) ? c.signerPlan : [];
  return plan.find(s => s && s.party === 'internal' && String(s.name || '').trim()) || null;
}
/* ---- EVERY FILE THIS ROUTE KEEPS ON A CONTRACT ----
   The agreed Word file, a copy they signed first, a copy held while a
   difference is raised, the signed copy of record and its certificate — on
   the live handover, on every reopened one, and on the execution record. The
   server asks this beside upload.fileId and documents[] wherever it decides
   which files a contract owns: whom a file may be read by, what a delete
   takes with it, and what the orphan sweep may never remove. */
function outsideFileIds(c){
  const out = [];
  const add = id => { if (id && !out.includes(String(id))) out.push(String(id)); };
  const hoIds = h => { if (!h) return; add(h.file && h.file.fileId); add(h.partial && h.partial.fileId); add(h.held && h.held.fileId); };
  if (!c) return out;
  hoIds(c.handover);
  (Array.isArray(c.handoverHistory) ? c.handoverHistory : []).forEach(hoIds);
  add(c.execution && c.execution.fileId);
  add(c.signedCopy && c.signedCopy.file && c.signedCopy.file.fileId);
  add(c.signedCopy && c.signedCopy.certificate && c.signedCopy.certificate.fileId);
  return out;
}
/* Was the copy checked before our signatory signed it? The last check, or
   null. Offered to the signatory by name and recorded — never a gate, since
   the signing happens where HaTi cannot stop it. */
function handoverLastCheck(c){
  const h = handoverOf(c);
  const list = h && Array.isArray(h.checks) ? h.checks : [];
  return list.length ? list[list.length - 1] : null;
}

/* ============================================================
   THE WORD CHECK
   ============================================================
   Compares the signed copy with the agreed wording BY THEIR WORDS:
     · their design is ignored — letterhead, fonts, layout, page breaks, the
       signing service's stamp, a running header or footer;
     · their numbering is ignored — HaTi's 14.2 may be their 14 (b);
     · clauses are matched by their words, IN ANY ORDER, because their design
       may order them differently;
     · a renamed defined term ("Supplier" becoming "Vendor") is a changed
       word, and every clause it touches is flagged;
     · anything around the agreement — a cover page, their own signature
       block, a certificate — is shown APART from the clauses, and does not
       fail the check; text added BETWEEN clauses does.
   Letter case and punctuation belong to the design: a heading set in
   capitals is the same heading. A changed number is a changed word.

   IT DECIDES NOTHING. It reports; a person confirms, and a copy whose words
   differ is decided by the approver or an admin, with a reason. */
const OH_ROMAN = '(?:i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii|xiii|xiv|xv)';
/* A marker at the start of a line: "14.", "14.2", "(b)", "b)", "(iv)", "iv.",
   "14 (b)", "Clause 14". A BARE number followed by a space is not a marker —
   "30 days after delivery" keeps its 30, so a changed figure at the start of
   a paragraph is still a changed word. */
const OH_MARKER_RE = new RegExp(
  '^\\s*(?:(?:clause|section|article|paragraph)\\s+)?(?:'
  + '\\d+(?:\\.\\d+)+\\.?'                   // 14.2  14.2.3  14.2.
  + '|\\d+[.)]'                              // 14.  14)
  + '|\\d+\\s*\\(\\s*[a-z0-9]{1,4}\\s*\\)'  // 14 (b)
  + '|\\(\\s*[a-z]{1,2}\\s*\\)'              // (b)
  + '|[a-z]\\)'                              // b)
  + '|\\(\\s*' + OH_ROMAN + '\\s*\\)'        // (iv)
  + '|' + OH_ROMAN + '[.)]'                  // iv.
  + '|\\(\\s*\\d+\\s*\\)'                    // (3)
  + ')(?=\\s|$)', 'i');
function ohStripMarker(line){
  let s = String(line || ''), marker = '';
  for (let i = 0; i < 3; i++){
    const m = s.match(OH_MARKER_RE);
    if (!m) break;
    marker = (marker ? marker + ' ' : '') + m[0].trim();
    s = s.slice(m[0].length);
  }
  return { rest: s, marker };
}
/* Quotes, dashes, spaces and ligatures to one shape, and lower case. */
function ohNorm(s){
  let t = String(s == null ? '' : s);
  try { t = t.normalize('NFKC'); } catch (_) {}
  return t.replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/[    ]/g, ' ')
    .replace(/­/g, '')
    .toLowerCase();
}
const OH_WORD_SPLIT = /[^\p{L}\p{N}']+/u;
/* A line as display chunks (what a person reads, punctuation and all) and
   the words compared inside them. */
function ohChunks(text){
  const out = { chunks: [], words: [] };
  String(text || '').split(/\s+/).filter(Boolean).forEach(raw => {
    const ci = out.chunks.length;
    out.chunks.push(raw);
    ohNorm(raw).split(OH_WORD_SPLIT).map(w => w.replace(/^'+|'+$/g, '')).filter(Boolean)
      .forEach(w => out.words.push({ n: w, c: ci }));
  });
  return out;
}
/* ---- WHAT IS PAGE FURNITURE, NOT WORDING ----
   A page number, a DocuSign envelope stamp, a line of underscores, and any
   line that comes back three times or more with its digits masked — a
   running header or footer ("KIJANI FOODS LTD · Distribution Agreement ·
   page 9 of 11") recurs on every page, and no clause says the same sentence
   three times. */
const OH_FURNITURE_RE = [
  /^\s*[-–—(]?\s*(?:page\s*)?\d+\s*(?:(?:of|\/)\s*\d+)?\s*[-–—)]?\s*$/i,
  /\bpage\s+\d+\s*(?:of|\/)\s*\d+\b/i,
  /docusign\s+envelope\s+id/i,
  /^\s*[_.\-–—·•\s]+\s*$/,
];
function ohFurniture(lines){
  const count = new Map();
  const key = l => ohNorm(l).replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
  lines.forEach(l => { const k = key(l); if (k.length >= 6) count.set(k, (count.get(k) || 0) + 1); });
  return l => OH_FURNITURE_RE.some(re => re.test(l)) || (count.get(key(l)) || 0) >= 3;
}
/* The agreed wording as paragraphs. A string splits on its lines; an array
   is taken as the caller's own paragraphs, each able to name the clause it
   belongs to (`group`) and how a person reads it (`label`). */
function ohAgreedParas(agreed){
  const rows = Array.isArray(agreed)
    ? agreed.map(x => (typeof x === 'string' ? { text: x } : (x || {})))
    : String(agreed || '').split(/\r?\n/).map(t => ({ text: t }));
  const out = [];
  rows.forEach(r => {
    const st = ohStripMarker(String(r.text || '').trim());
    const ch = ohChunks(st.rest);
    if (!ch.words.length) return;
    /* A very long paragraph is compared in pieces, so one changed word in a
       wall of text reports the piece it is in rather than the whole wall —
       and so the alignment below stays cheap. */
    const PIECE = 400;
    if (ch.words.length <= PIECE * 2){
      out.push({ text: st.rest, marker: st.marker, group: r.group != null ? String(r.group) : '', label: r.label || '',
        title: !!r.title && !out.length, ...ch });
      return;
    }
    for (let s = 0; s < ch.words.length; s += PIECE){
      const w = ch.words.slice(s, s + PIECE);
      const c0 = w[0].c, c1 = w[w.length - 1].c;
      const chunks = ch.chunks.slice(c0, c1 + 1);
      out.push({ text: chunks.join(' '), marker: s ? '' : st.marker, group: r.group != null ? String(r.group) : '',
        label: r.label || '', chunks, words: w.map(x => ({ n: x.n, c: x.c - c0 })) });
    }
  });
  return out;
}
/* The signed copy as ONE stream of words, with the line each came from, so
   paragraphs can be found in any order and anything left over can be said. */
function ohSignedStream(signed){
  const lines = String(signed || '').split(/\r?\n/);
  const isFurniture = ohFurniture(lines);
  const words = [], chunks = [], lineMarker = [];
  lines.forEach((l, li) => {
    if (!l.trim() || isFurniture(l)) { lineMarker.push(''); return; }
    const st = ohStripMarker(l.trim());
    lineMarker.push(st.marker);
    const ch = ohChunks(st.rest);
    const base = chunks.length;
    ch.chunks.forEach(x => chunks.push({ s: x, line: li }));
    ch.words.forEach(w => words.push({ n: w.n, c: base + w.c, line: li }));
  });
  return { words, chunks, lineMarker, lines };
}
/* Longest common subsequence over two word arrays, as keep/delete/insert
   ops. Bounded by the callers: a paragraph is at most 800 words and the
   window it is looked for in a small multiple of that. */
function ohLcsOps(a, b){
  const n = a.length, m = b.length;
  const W = m + 1;
  const dp = new Uint16Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i * W + j] = a[i] === b[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
  const ops = []; let i = 0, j = 0;
  while (i < n && j < m){
    if (a[i] === b[j]){ ops.push({ t: 'k', i, j }); i++; j++; }
    else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]){ ops.push({ t: 'd', i }); i++; }
    else { ops.push({ t: 'i', j }); j++; }
  }
  while (i < n) ops.push({ t: 'd', i: i++ });
  while (j < m) ops.push({ t: 'i', j: j++ });
  return { ops, lcs: dp[0] };
}
/* Numbering that one side carries and the other does not is design: a PURE
   insertion or deletion of marker-like words at the START of a paragraph is
   dropped. A substitution there ("30" → "60") is a changed word and stays. */
const OH_MARKERISH = new RegExp('^(?:\\d+|[a-z]|' + OH_ROMAN + '|clause|section|article|paragraph)$', 'i');
/* A word the PDF split across a line ("agree- ment") or a hyphenated word
   joined ("non-exclusive" / "nonexclusive") is the same word. */
function ohMendOps(ops, a, b){
  const out = ops.slice();
  // leading pure numbering
  let k = 0;
  while (k < out.length && out[k].t !== 'k'){
    const run = []; let z = k;
    while (z < out.length && out[z].t !== 'k') run.push(out[z++]);
    const dels = run.filter(o => o.t === 'd'), ins = run.filter(o => o.t === 'i');
    const pure = !(dels.length && ins.length);
    const markerish = run.every(o => OH_MARKERISH.test(o.t === 'd' ? a[o.i] : b[o.j]));
    if (pure && markerish && run.length <= 3) run.forEach(o => { o.drop = true; });
    break;
  }
  // split / joined words inside a changed run
  for (let s = 0; s < out.length; s++){
    if (out[s].t === 'k' || out[s].drop) continue;
    let e = s; while (e < out.length && out[e].t !== 'k') e++;
    const run = out.slice(s, e);
    const da = run.filter(o => o.t === 'd').map(o => a[o.i]).join('');
    const ib = run.filter(o => o.t === 'i').map(o => b[o.j]).join('');
    if (da && ib && da === ib) run.forEach(o => { o.drop = true; });
    s = e;
  }
  return out.filter(o => !o.drop);
}
/* Where in the signed stream a paragraph most probably sits, by the votes
   of its four-word shingles. Returns candidate start positions, best first. */
/* Four-word shingles first; where none of them lands (a short line whose
   one changed word breaks every four-word run), shorter ones, down to single
   words — a rare word still points at the right place. */
function ohCandidates(p, index, T){
  const m = p.words.length;
  const votes = new Map();
  for (const K of [4, 3, 2, 1]){
    if (K > m) continue;
    const key = (arr, i) => arr.slice(i, i + K).map(x => x.n).join(' ');
    const step = K === 1 ? 1 : Math.max(1, Math.floor((m - K) / 12));
    for (let off = 0; off + K <= m; off += step){
      const hits = index.get(key(p.words, off)) || [];
      hits.forEach(pos => { const s = pos - off; votes.set(s, (votes.get(s) || 0) + 1); });
    }
    if (votes.size) break;
  }
  return [...votes.entries()].sort((x, y) => y[1] - x[1] || x[0] - y[0]).slice(0, 4).map(x => x[0])
    .filter(s => s > -m && s < T.length);
}
function outsideCompare(agreed, signed, opts){
  const o = opts || {};
  const paras = ohAgreedParas(agreed);
  const S = ohSignedStream(signed);
  const T = S.words;
  const Tn = T.map(x => x.n);
  /* The shingle index. Four words for a paragraph of four or more; a short
     heading is found by its whole run. Capped per key so a phrase that
     recurs everywhere ("the parties shall") cannot make this quadratic. */
  const index = new Map();
  const addKey = (k, pos) => { const a = index.get(k); if (!a) index.set(k, [pos]); else if (a.length < 64) a.push(pos); };
  for (let i = 0; i < T.length; i++){
    for (const K of [4, 3, 2, 1]){
      if (i + K <= T.length) addKey(Tn.slice(i, i + K).join(' '), i);
    }
  }
  const claimed = new Uint8Array(T.length);
  const claim = (s, e) => { for (let i = Math.max(0, s); i < Math.min(T.length, e); i++) claimed[i] = 1; };
  const free = (s, e) => { for (let i = Math.max(0, s); i < Math.min(T.length, e); i++) if (claimed[i]) return false; return true; };
  const pn = paras.map(p => p.words.map(w => w.n));
  const state = paras.map(() => null);
  let agreedWords = 0;
  pn.forEach(a => { agreedWords += a.length; });
  /* LONGEST FIRST, in both passes. A two-word heading ("Notices") may also
     occur in the middle of a sentence; taken first it would claim those two
     words and break the exact match of the paragraph they belong to. The long
     paragraphs claim their own words, and a short line then finds a free run
     of its own — one that stands on a line of its own where there is one. */
  const order = paras.map((p, i) => i).sort((x, y) => pn[y].length - pn[x].length || x - y);
  const exactAt = (a, s) => { if (s < 0 || s + a.length > T.length || !free(s, s + a.length)) return false;
    for (let k = 0; k < a.length; k++) if (Tn[s + k] !== a[k]) return false; return true; };
  const ownLine = (s, m) => (s === 0 || T[s - 1].line !== T[s].line)
    && (s + m >= T.length || T[s + m].line !== T[s + m - 1].line);
  /* PASS 1 — exact, in any order. A paragraph whose words appear, unbroken,
     somewhere in their copy is the same paragraph wherever it sits. */
  order.forEach(i => {
    const p = paras[i], a = pn[i], m = a.length;
    if (m <= 6){
      /* a short line (a heading) may repeat: its own line first, then any
         free run of it */
      /* the index holds runs of up to four words, so a line of five or six
         is looked up by its first four and then matched whole */
      const hits = (index.get(a.slice(0, Math.min(4, m)).join(' ')) || []).filter(s => exactAt(a, s));
      const s = hits.find(x => ownLine(x, m));
      const pick = s != null ? s : hits[0];
      if (pick != null){ state[i] = { kind: 'same', s: pick, e: pick + m }; claim(pick, pick + m); }
      return;
    }
    for (const s of ohCandidates(p, index, T)){
      if (exactAt(a, s)){ state[i] = { kind: 'same', s, e: s + m }; claim(s, s + m); return; }
    }
  });
  /* PASS 2 — changed. The best window near where the paragraph's shingles
     point, aligned word by word; half the words or more in common reads as
     the same paragraph with changes, anything less as a paragraph their copy
     does not carry. */
  order.forEach(i => {
    const p = paras[i];
    if (state[i]) return;
    const a = pn[i], m = a.length;
    let best = null;
    for (const s0 of ohCandidates(p, index, T)){
      const ws = Math.max(0, s0 - Math.ceil(m / 2)), we = Math.min(T.length, s0 + Math.ceil(m * 1.5) + 4);
      if (we <= ws) continue;
      /* only the free part of the window may be taken */
      const idx = []; for (let k = ws; k < we; k++) if (!claimed[k]) idx.push(k);
      if (!idx.length) continue;
      const b = idx.map(k => Tn[k]);
      const r = ohLcsOps(a, b);
      if (!best || r.lcs > best.lcs) best = { ...r, idx };
    }
    if (!best || best.lcs / m < 0.5){ state[i] = { kind: 'missing' }; return; }
    /* trim the window to the aligned span, so words beyond the paragraph's
       ends are not blamed on it — but to the LINES the span starts and ends
       on, or a changed first or last word would fall outside it and the
       change would read as a deletion alone. A paragraph starts a line. */
    const js = best.ops.filter(x => x.t === 'k').map(x => x.j);
    const j0 = Math.min(...js), j1 = Math.max(...js);
    const kS = best.idx[j0], kE = best.idx[j1];
    const lS = T[kS].line, lE = T[kE].line;
    const spanIdx = best.idx.filter(k => (k >= kS || T[k].line === lS) && (k <= kE || T[k].line === lE));
    const b = spanIdx.map(k => Tn[k]);
    let ops = ohLcsOps(a, b).ops;
    ops = ohMendOps(ops, a, b);
    spanIdx.forEach(k => { claimed[k] = 1; });
    if (ops.every(x => x.t === 'k')){ state[i] = { kind: 'same', idx: spanIdx }; return; }
    state[i] = { kind: 'changed', idx: spanIdx, ops };
  });
  /* ---- WORDS ADDED ON THE SAME LINE AS A CLAUSE ARE PART OF IT ----
     An exact match proves the agreed words are there; it does not prove
     nothing was added to them. "…ninety (90) days' written notice, unless
     otherwise agreed" matches the agreed sentence and leaves three words
     over on its own line. Those words are the clause's, whatever their
     length, so the clause is re-read with them and reads as changed. */
  order.forEach(i => {
    const st = state[i];
    if (!st || st.kind !== 'same' || st.s == null) return;
    const left = [], right = [];
    for (let k = st.s - 1; k >= 0 && !claimed[k] && T[k].line === T[st.s].line; k--) left.unshift(k);
    for (let k = st.e; k < T.length && !claimed[k] && T[k].line === T[st.e - 1].line; k++) right.push(k);
    if (!left.length && !right.length) return;
    /* THE DOCUMENT'S NAME MAY WEAR THEIR COMPANY. The title line is design,
       not a term: "NORDKUST INDUSTRI AB — SOFTWARE AS A SERVICE AGREEMENT"
       carries every agreed word of the title, and what their template put
       beside it is theirs. Left unclaimed, those words are read below as
       around the agreement — shown apart, never a difference. Only ADDED
       words: a title missing an agreed word is still a changed title. */
    if (paras[i].title) return;
    const idx = left.concat(Array.from({ length: st.e - st.s }, (_, j) => st.s + j), right);
    const a = pn[i], b = idx.map(k => Tn[k]);
    const ops = ohMendOps(ohLcsOps(a, b).ops, a, b);
    idx.forEach(k => { claimed[k] = 1; });
    state[i] = ops.every(x => x.t === 'k') ? { kind: 'same', idx } : { kind: 'changed', idx, ops };
  });
  /* WHAT IS LEFT OVER in their copy. Inside the agreement — between the
     first and the last paragraph found — it is text they added, and it fails
     the check. Before and after it is a cover page, a signature block or a
     certificate, shown apart and left to a person. */
  const covered = []; for (let k = 0; k < T.length; k++) if (claimed[k]) covered.push(k);
  const lo = covered.length ? covered[0] : T.length, hi = covered.length ? covered[covered.length - 1] : -1;
  const runs = []; let cur = null;
  for (let k = 0; k < T.length; k++){
    if (claimed[k]){ if (cur){ runs.push(cur); cur = null; } continue; }
    if (!cur) cur = { s: k, e: k + 1 }; else cur.e = k + 1;
  }
  if (cur) runs.push(cur);
  const runText = r => {
    const cs = []; for (let k = r.s; k < r.e; k++){ const ci = T[k].c; if (cs[cs.length - 1] !== ci) cs.push(ci); }
    return cs.map(ci => S.chunks[ci].s).join(' ');
  };
  /* What is left over is now whole lines only. Inside the agreement, a
     line of three words or more is text they added; one or two words on a
     line of their own ("Initials", "Confidential") are their page. */
  const inserted = [], around = [];
  const INSERT_MIN = 3;
  runs.forEach(r => {
    const words = r.e - r.s;
    const text = runText(r).slice(0, 1200);
    if (r.s > lo && r.e <= hi){ if (words >= INSERT_MIN) inserted.push({ text, words }); }
    else around.push({ text, words });
  });
  /* The paragraphs, as a person reads them. */
  const theirNo = idx => {
    const line = idx && idx.length ? T[idx[0]].line : -1;
    return line >= 0 ? (S.lineMarker[line] || '') : '';
  };
  const chunkRow = (chunks, words, keepSet, mark) => chunks.map((s, ci) => {
    const ws = words.filter(w => w.c === ci);
    const hit = ws.some((w, k) => !keepSet.has(w));
    return { t: ws.length && hit ? mark : 'k', s };
  });
  const changed = [], missing = [];
  paras.forEach((p, i) => {
    const st = state[i];
    if (st.kind === 'missing'){ missing.push({ i, group: p.group, label: p.label, marker: p.marker, agreed: p.text.slice(0, 2000) }); return; }
    if (st.kind !== 'changed') return;
    const keptA = new Set(), keptB = new Set();
    st.ops.forEach(op => { if (op.t === 'k'){ keptA.add(op.i); keptB.add(op.j); } });
    const aWords = p.words.map((w, k) => ({ ...w, k }));
    const aRow = chunkRow(p.chunks, aWords, new Set(aWords.filter(w => keptA.has(w.k))), 'd');
    /* their side: the chunks the span covers, marked where a word is new */
    const bChunkIdx = []; st.idx.forEach(k => { const ci = T[k].c; if (bChunkIdx[bChunkIdx.length - 1] !== ci) bChunkIdx.push(ci); });
    const bWords = st.idx.map((k, j) => ({ n: T[k].n, c: bChunkIdx.indexOf(T[k].c), j }));
    const bRow = chunkRow(bChunkIdx.map(ci => S.chunks[ci].s), bWords, new Set(bWords.filter(w => keptB.has(w.j))), 'i');
    changed.push({ i, group: p.group, label: p.label, marker: p.marker, theirNo: theirNo(st.idx),
      a: aRow.slice(0, 600), b: bRow.slice(0, 600) });
  });
  /* ---- A RENAMED DEFINED TERM ----
     One word swapped for one word, the same pair in two or more places, is a
     term their template renamed. Said once, so a reader sees one cause rather
     than forty clauses. */
  const pairs = new Map();
  paras.forEach((p, i) => {
    const st = state[i]; if (!st || st.kind !== 'changed') return;
    const a = pn[i]; const b = st.idx.map(k => Tn[k]);
    const ops = st.ops;
    const seen = new Set();
    for (let s = 0; s < ops.length; s++){
      if (ops[s].t === 'k') continue;
      let e = s; while (e < ops.length && ops[e].t !== 'k') e++;
      const run = ops.slice(s, e);
      const d = run.filter(x => x.t === 'd'), n = run.filter(x => x.t === 'i');
      if (d.length === 1 && n.length === 1){
        const key = a[d[0].i] + '\u0000' + b[n[0].j];
        if (!seen.has(key)){ seen.add(key); pairs.set(key, (pairs.get(key) || 0) + 1); }
      }
      s = e;
    }
  });
  const renamed = [...pairs.entries()].filter(([, n]) => n >= 2)
    .map(([k, n]) => { const [from, to] = k.split('\u0000'); return { from, to, n }; })
    .sort((x, y) => y.n - x.n).slice(0, 8);
  const sameParas = state.filter(s => s && s.kind === 'same').length;
  const matchedWords = paras.reduce((n, p, i) => n + (state[i] && state[i].kind !== 'missing' ? pn[i].length : 0), 0);
  const coverage = agreedWords ? matchedWords / agreedWords : 0;
  const groups = new Set(paras.map((p, i) => p.group || ('#' + i)));
  const groupsChanged = new Set();
  paras.forEach((p, i) => { if (state[i] && state[i].kind !== 'same') groupsChanged.add(p.group || ('#' + i)); });
  return {
    same: !changed.length && !missing.length && !inserted.length && paras.length > 0,
    /* almost nothing in common: this is not the agreement's signed copy */
    unrelated: paras.length > 0 && coverage < 0.2,
    ocr: !!o.ocr,
    total: paras.length, sameParas,
    clauses: groups.size, clausesChanged: groupsChanged.size,
    coverage: Math.round(coverage * 1000) / 1000,
    changed: changed.slice(0, 60), changedCount: changed.length,
    missing: missing.slice(0, 60), missingCount: missing.length,
    inserted: inserted.slice(0, 20), around: around.slice(0, 20),
    aroundWords: around.reduce((n, r) => n + r.words, 0),
    renamed,
    words: { agreed: agreedWords, signed: T.length },
  };
}
/* One line of what the check found, for a trail line or a tile. English: it
   is a RECORD (the rulebook's "a label that is also a record keeps English"). */
function outsideCompareLine(r){
  if (!r) return '';
  if (r.unrelated) return 'The copy has almost nothing in common with the agreed wording.';
  if (r.same) return `Same wording as agreed — ${r.clauses} part${r.clauses === 1 ? '' : 's'} match.`;
  const bits = [];
  if (r.changedCount) bits.push(`${r.changedCount} changed`);
  if (r.missingCount) bits.push(`${r.missingCount} missing`);
  if (r.inserted.length) bits.push(`${r.inserted.length} added between clauses`);
  return `The wording differs from what was agreed: ${bits.join(', ')}.`;
}

/* ============================================================
   WHAT THE COPY SAYS ABOUT ITSELF — who signed, when, and how
   ============================================================
   A reading, never a claim: HaTi does not verify a handwritten signature or
   a signing service's own seal. It looks for the names it expects (our
   signatory, their contact) and the nearest date after each, and for the
   stamp of a signing service. Every answer lands in a box a person confirms,
   and anything unsure says so. */
const OH_MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  januari: 1, februari: 2, mars: 3, april: 4, maj: 5, juni: 6, juli: 7, augusti: 8, september: 9, oktober: 10, december: 12 };
const OH_DATE_RE = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b|\b(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})\b|\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:day\s+of\s+)?([A-Za-zåäö]{3,9})\.?,?\s+(\d{4})\b|\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/g;
function _ohIso(y, m, d){
  y = Number(y); m = Number(m); d = Number(d);
  if (!(y > 1900 && y < 2200 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return '';
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return '';
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function ohDates(text){
  const out = [];
  const s = String(text || '');
  OH_DATE_RE.lastIndex = 0;
  let m;
  while ((m = OH_DATE_RE.exec(s))){
    let iso = '', unsure = false;
    if (m[1]) iso = _ohIso(m[1], m[2], m[3]);
    else if (m[4]){
      const a = Number(m[4]), b = Number(m[5]);
      /* 22/09/2026 is day first; 9/22/2026 is month first (a US certificate);
         where both read as a month nobody can tell, and it says so. */
      if (a > 12) iso = _ohIso(m[6], b, a);
      else if (b > 12){ iso = _ohIso(m[6], a, b); }
      else { iso = _ohIso(m[6], b, a); unsure = a !== b; }
    }
    else if (m[7]){ const mo = OH_MONTHS[String(m[8]).toLowerCase()]; if (mo) iso = _ohIso(m[9], mo, m[7]); }
    else if (m[10]){ const mo = OH_MONTHS[String(m[10]).toLowerCase()]; if (mo) iso = _ohIso(m[12], mo, m[11]); }
    if (iso) out.push({ iso, at: m.index, unsure, raw: m[0] });
  }
  return out;
}
function outsideReadCopy(text, expect){
  const s = String(text || '');
  const via = /docusign/i.test(s) ? 'docusign'
    : /adobe\s*(acrobat\s*)?sign|echosign|signnow|hellosign|dropbox\s*sign|pandadoc|signeasy|scrive|visma\s*sign|zoho\s*sign/i.test(s) ? 'esign'
    : null;
  const env = (s.match(/envelope\s*id\s*:?\s*([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})/i) || [])[1] || '';
  const dates = ohDates(s);
  const signers = [];
  (Array.isArray(expect) ? expect : []).forEach(e => {
    const name = String(e && e.name || '').trim();
    if (!name) return;
    /* A PARTY, NOT A PERSON: where nobody on their side is named on the file,
       their company's name beside a signature word ("Signed for Nordkust
       Industri AB", "For and on behalf of…") is the reading — weaker, and it
       says so, because a company cannot sign and a person has to confirm. */
    if (e.party){
      const esc = name.split(/\s+/).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
      const rx = new RegExp(esc, 'ig');
      const CUE = /\b(?:sign(?:ed|ature|atory)?|for\s+and\s+on\s+behalf\s+of|on\s+behalf\s+of|executed|by\s*:|duly\s+authori[sz]ed)\b/i;
      let hit = null, m;
      while ((m = rx.exec(s))){
        const near = s.slice(Math.max(0, m.index - 80), m.index + name.length + 80);
        if (!CUE.test(near)) continue;
        const after = dates.find(d => d.at > m.index && d.at - m.index < 240);
        hit = { at: m.index, date: after || null };
        if (after) break;
      }
      signers.push({ name, side: e.side || '', party: true, found: !!hit, on: hit && hit.date ? hit.date.iso : '', unsure: true });
      return;
    }
    const re = new RegExp(name.split(/\s+/).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+'), 'ig');
    let found = null, m, loose = false;
    const look = rx => { while ((m = rx.exec(s))){
      const after = dates.find(d => d.at > m.index && d.at - m.index < 600);
      found = { at: m.index, date: after || null };
      if (after) break;
    } };
    look(re);
    /* "P. Rotich" for Peter Rotich: the surname alone, which is a weaker
       reading and says so. */
    if (!found){
      const last = name.split(/\s+/).pop();
      if (last && last.length >= 4){ loose = true;
        look(new RegExp('\\b' + last.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'ig')); }
    }
    signers.push({ name, side: e.side || '', found: !!found, on: found && found.date ? found.date.iso : '',
      unsure: !found || loose || !found.date || !!(found.date && found.date.unsure) });
  });
  /* The day it was signed is the LAST signature: an agreement is signed when
     the last party signs. Only dates tied to a name found on the copy count;
     a date merely printed somewhere in the text is not a signature. */
  const onDays = signers.filter(x => x.on).map(x => x.on).sort();
  return { via, envelope: env, signers, signedOn: onDays.length ? onDays[onDays.length - 1] : '',
    dates: dates.slice(0, 40).map(d => ({ iso: d.iso, unsure: d.unsure })) };
}
/* Does the agreement start on the last signature? Then the start date is the
   signing date, and HaTi can fill it rather than asking. */
function outsideStartsOnSignature(text){
  return /\b(?:date\s+of\s+(?:the\s+)?(?:last|final)\s+signature|last\s+date\s+of\s+signature|date\s+on\s+which\s+(?:it|this\s+agreement)\s+is\s+(?:last\s+)?signed|date\s+of\s+(?:its\s+)?execution|date\s+of\s+signature)\b/i
    .test(String(text || ''));
}

/* ============================================================
   A BLANK STILL IN THE AGREED WORDS
   ============================================================
   "[amount]" handed over is "[amount]" agreed, so a blank holds the handover
   — on the browser's one list, and on the server, which reads the very Word
   file it is handed and refuses one that still carries a blank. One reading,
   two hosts.
   Bracketed and braced blanks only, never a ruled line: their paper's own
   signature page is lines to be signed on, and a check that stopped every
   handover of their paper for its signature block would be a check nobody
   could pass. A bracket that says what it is ("[Reserved]", "[Signature]",
   "[Schedule 2]") is not a blank. */
const OH_BLANK_RES = [/\[\s*(?:insert|enter|add|specify|state|fill in|to be (?:agreed|confirmed))[^\]\n]{0,58}\]/gi,
  /\[[A-Z][A-Z0-9 ,.'&\/-]{2,60}\]/g, /\{\{\s*[\w .-]{1,40}\s*\}\}/g];
const OH_NOT_BLANK = /^[\[{]+\s*(reserved|intentionally|deleted|omitted|not used|redacted|signature|signed|sign here|initials?|seal|stamp|witness|date of signature|confidential|draft|page|end of|remainder|schedule|annex|appendix|exhibit|attachment|execution|counterparts?)/i;
const OH_BLANKS_MAX = 12;
function outsideBlanksIn(text){
  const s = String(text || '');
  const seen = new Set();
  OH_BLANK_RES.forEach(re => { re.lastIndex = 0; let m;
    while ((m = re.exec(s))){ const raw = m[0].trim(); if (!OH_NOT_BLANK.test(raw)) seen.add(raw); } });
  return [...seen].slice(0, OH_BLANKS_MAX);
}

const OUTSIDE_API = { WORKING_PREFIX, HANDOVER_REMIND_WORKDAYS, HANDOVER_REMIND_EVERY_DAYS, HANDOVER_LIVE_DAYS,
  SIGNED_VIA, HANDOVER_FROZEN, isWorkingId, workingIdOf, contractRef, contractIsWorkingFile, contractRefMatches,
  signRouteOf, handoverOf, handoverActive, outsideListed, ohWorkdays, ohAddWorkdays, handoverDays,
  handoverFirstReminderAt, handoverReminderKey, handoverNextReminderAt, handoverLiveFrom, handoverStillLiveDue,
  handoverStage, handoverLastCheck, outsideSignatory, outsideFileIds, ohStripMarker, ohNorm, ohChunks, ohAgreedParas, ohSignedStream, ohLcsOps,
  outsideCompare, outsideCompareLine, ohDates, outsideReadCopy, outsideStartsOnSignature, outsideBlanksIn };
if (typeof window !== 'undefined') Object.assign(window, OUTSIDE_API);
if (typeof module !== 'undefined' && module.exports) module.exports = OUTSIDE_API;
