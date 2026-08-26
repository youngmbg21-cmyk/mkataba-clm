// HaTi — what a clause IS.
//
// Globals are window-attached like every module (see components.js).
//
// THE DEFECT THIS MODULE REPLACES
//
// js/negotiation.js used to find clauses by flattening the rich document to
// text with richToText(), splitting on newlines, and re-inferring which lines
// were headings with an all-caps heuristic. Run the prototype's own six-clause
// contract through it and it returns FOURTEEN clauses: every heading becomes a
// nameless clause of its own, every title field is empty, every number is
// empty, and every id is `clause:#N` — a line index.
//
// Three separate failures, each fatal on its own:
//
//   · "Clause 4 · Payment Terms" contains lowercase letters, so the all-caps
//     heading test rejects it and it is filed as a clause BODY. The document's
//     labels become negotiable terms.
//   · A line-index id cannot survive an insert. Add a clause above clause 4 and
//     every change filed against clause 4 now points at clause 5's wording.
//   · The rich document already carried <h2> elements saying exactly where each
//     clause began. That structure was thrown away by the flattening, and then
//     guessed at from the wreckage.
//
// WHAT REPLACES IT
//
// A clause is read from the DOM the document actually is:
//
//     a heading element (H1–H4) plus every following block
//     until the next heading of the same or higher rank.
//
// No guessing. A heading is a heading because it is an <h2>, not because it
// shouted. A multi-paragraph clause is ONE clause with one body, one badge and
// one decision — the brief's "Clause 5" has two sentences and the prototype
// draws it as one block, because that is what it is.
//
// IDENTITY IS ASSIGNED, NEVER DERIVED
//
// Each clause carries an opaque `data-clause-id` written onto its heading at
// intake and never changed. `num` and `title` are PARSED FROM the heading for
// display and recomputed on every render — they are presentation. Renumbering
// a contract from 1,4,5,6,9,12 to 1,2,3,4,5,6 moves no id and re-points no
// change, which is the entire reason the id exists.

/* ---------- inert parsing ----------
   Same discipline as js/richdoc.js: never assign document content to a live
   element. An inert document runs no scripts, fires no handlers, fetches
   nothing. */
let _clDoc = null;
function _clInert(){
  if (!_clDoc) _clDoc = document.implementation.createHTMLDocument('hati-clauses');
  return _clDoc;
}
function _clParse(html){
  const holder = _clInert().createElement('div');
  holder.innerHTML = String(html == null ? '' : html);
  return holder;
}
const CLAUSE_HEADINGS = new Set(['H1', 'H2', 'H3', 'H4']);
const _clRank = el => CLAUSE_HEADINGS.has(el.tagName) ? Number(el.tagName[1]) : 0;

/* ---------- issuing an id ----------
   Short, opaque, and meaningless on purpose. An id that encoded the number or
   the position would be one more thing that has to be kept true when the
   document moves; this one has nothing to keep true. Collisions are checked
   against the document being stamped rather than assumed away. */
function clauseNewId(taken){
  const used = taken instanceof Set ? taken : new Set(taken || []);
  for (let i = 0; i < 1000; i++){
    const id = 'cl_' + Math.random().toString(36).slice(2, 8).padEnd(6, '0');
    if (!used.has(id) && /^cl_[a-z0-9]{4,24}$/.test(id)){ used.add(id); return id; }
  }
  throw new Error('clauseNewId: exhausted');
}

/* ============================================================================
   WHAT A CLAUSE IS FOR — CLAUSE KINDS (owner-asked 26 Aug 2026)
   ----------------------------------------------------------------------------
   Built after the playbook scan offered to replace a lease-charges clause with
   a data-protection clause. Two fixes had already landed: the rail refuses to
   put a rule on a clause it did not locate, and the matcher refuses when it is
   not sure. This is the third and it is the one that stops the reading being
   statistical: a payment rule may only ever touch a payment clause.

   ONE TABLE, AND IT ALREADY EXISTED. js/precedent.js has carried this exact
   vocabulary since W3-2 — key, the playbook CATEGORY it answers to, and the
   cue pattern — to decide which standard a settled argument was about. A
   second copy here is precisely the duplication this codebase opens by warning
   about, so PRECEDENT_TOPICS is built FROM this list and keeps its own numeric
   columns (num/unit/dir) joined by key. Change a cue here and both move.

   THEY ASK DIFFERENT WORDS OF IT, DELIBERATELY, and that is not two readings.
   precedentTopicOf reads a CHANGE, which has no heading of its own, so it asks
   the label and then the wording. clauseKind reads a CLAUSE, which does have
   one — and asks THE HEADING AND NOTHING ELSE.

   WHY THE HEADING ALONE, since the body is right there. A heading is the
   clause's own statement of what it is for, which is a FACT; the body is full
   of cross-references to other topics, which is a trap. A termination clause
   routinely says "shall not affect accrued rights to payment", and a body
   reading types it as a payment clause — the mis-type then hides a real
   termination finding, which is the mirror of the reported bug and the one way
   this feature could do harm. Heading-only cannot make that mistake: it is
   right on headed paper, and BLANK on an unheaded wall of paragraphs, which is
   the safe answer rather than a guess.

   A HEADING SAYS IT IN DIFFERENT WORDS FROM A BODY, and that is what `head`
   is for. MEASURED before it existed, on HaTi's own twelve built-in templates:
   the body cue alone typed 31% of their clauses and missed *"Lease Charges"* —
   the very clause from the report that started all this — along with *"Price &
   Contract Value"*, *"Service Charge"* and *"Tolling Fee"*. A payment clause's
   BODY says "invoice" and "payable"; its HEADING says "Charges" or "Price",
   and neither vocabulary contains the other. So each topic carries both, and
   `clauseKind` matches on EITHER — it can only ever add coverage, never lose
   what the body cue already caught. **`re` IS UNTOUCHED**, which is what keeps
   precedent byte-identical; f222 is the proof.

   NULL IS A REAL ANSWER AND IT IS THE SAFE ONE. No heading, a heading matching
   nothing, a category this workspace invented — all answer null, and a null on
   either side means the match behaves exactly as it did before kinds existed.
   ========================================================================== */
const CLAUSE_KINDS = [
  { key:'payment',   category:'Payment terms',
    re:/\b(payment\w*|invoic\w*|net\s*\d|days? of receipt|payable)\b/i,
    head:/\b(payment\w*|invoic\w*|charge\w*|fees?|price|pricing|consideration|remuneration|tolling|rent)\b/i },
  { key:'liability', category:'Liability cap',
    re:/\b(liabilit\w*|indemnif\w*|indemnit\w*|cap(?:ped)? at|aggregate liability)\b/i,
    head:/\b(liabilit\w*|indemnif\w*|indemnit\w*)\b/i },
  { key:'law',       category:'Governing law',
    re:/\b(govern(?:ed|ing)\s+law|jurisdiction|forum|arbitrat\w*)\b/i,
    head:/\b(govern(?:ed|ing)\s+law|jurisdiction|forum|arbitrat\w*|dispute\w*|applicable law)\b/i },
  { key:'conf',      category:'Confidentiality',
    re:/\b(confidential\w*|non-disclosure|secret\w*)\b/i,
    head:/\b(confidential\w*|non-disclosure|secrecy|secret\w*)\b/i },
  { key:'dp',        category:'Data protection',
    re:/\b(data protection|personal data|odpc|gdpr)\b/i,
    head:/\b(data protection|personal data|data privacy|privacy|odpc|gdpr)\b/i },
  { key:'term',      category:'Termination',
    re:/\b(terminat\w*|notice period|cure period|material breach)\b/i,
    head:/\b(terminat\w*|duration|notice period|renewal)\b/i },
];
const clauseKindByKey = k => CLAUSE_KINDS.find(t => t.key === k) || null;

/* The clause's own heading, and nothing else. First match wins, so the order
   above is the order of specificity — a heading reading "Payment and
   Termination" is a payment clause, which is what its own first word says. */
function clauseKind(cl){
  if (!cl) return null;
  const head = String(cl.title || '').trim();
  if (!head) return null;
  for (const t of CLAUSE_KINDS) if ((t.head && t.head.test(head)) || t.re.test(head)) return t.key;
  return null;
}

/* Which kind a playbook position governs. Its CATEGORY is its own name, so
   there is nothing to configure and nothing for an admin to keep in step — the
   whole reason this could be built invisibly. The exact category is asked
   first; a workspace that named its own ("Payment schedule") falls to the cue,
   and anything else answers null, which turns the filter off for that rule. */
function ruleKind(category){
  const cat = String(category == null ? '' : category).trim();
  if (!cat) return null;
  const lower = cat.toLowerCase();
  for (const t of CLAUSE_KINDS) if (t.category.toLowerCase() === lower) return t.key;
  for (const t of CLAUSE_KINDS) if (t.re.test(cat)) return t.key;
  return null;
}

/* ---------- reading a heading ----------
   Both of these are the same clause 4:

       "Clause 4 · Payment Terms"     (the prototype's own house style)
       "4. PAYMENT TERMS"             (how an uploaded Word contract reads)

   and both yield num "4", title "Payment Terms" / "PAYMENT TERMS". The number
   is stripped out of the title rather than left in it, so a renumbering shows
   up in `num` — which nothing tracks — and never in `title`, which is compared.

   A heading with no number keeps its whole text as the title; a heading that is
   only a number keeps the number. Nothing is invented: a clause with neither
   reads as its own opening words, which is what a lawyer calls it anyway. */
const _CL_LABELLED = /^(?:clause|article|section|art\.?|sec\.?|§)\s*(\d+(?:\.\d+)*)\s*[·:.)\-–—]?\s*(.*)$/i;
const _CL_NUMBERED = /^(\d+(?:\.\d+)*)\s*[.)·:\-–—]?\s+(.*)$/;
const _CL_BARE_NUM = /^(\d+(?:\.\d+)*)[.)]?$/;
function clauseParseHeading(raw){
  const t = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim();
  if (!t) return { num: '', title: '' };
  let m = t.match(_CL_LABELLED);
  if (m) return { num: m[1], title: m[2].trim() };
  m = t.match(_CL_BARE_NUM);
  if (m) return { num: m[1], title: '' };
  m = t.match(_CL_NUMBERED);
  if (m) return { num: m[1], title: m[2].trim() };
  return { num: '', title: t };
}
/* The display heading, the way the prototype labels it. Recomputed on render,
   every time — never stored, never compared, never part of a hash. */
function clauseLabel(cl){
  if (!cl) return '';
  const num = String(cl.num || '').replace(/[.)]$/, '');
  const title = String(cl.title || '').trim();
  if (num && title) return `Clause ${num} · ${title}`;
  if (num) return `Clause ${num}`;
  if (title) return title;
  const t = String(cl.text || '').replace(/\s+/g, ' ').trim();
  return t.length > 60 ? t.slice(0, 57) + '…' : t;
}

/* ---------- HOW THIS DOCUMENT WRITES A HEADING ----------
   (owner-asked 26 Aug 2026, two items off one list. A standard clause added
   from the library arrived as "LIABILITY CAP" in a contract whose own headings
   read "4. Liability & Governing Law"; and the analytics report printed the
   contract's own shouted headings straight back, so one chart carried
   "SPECIFICATIONS, QUALITY & INSPECT..." beside "Delivery Information".)

   TWO JOBS, ONE READING BETWEEN THEM. A clause going INTO the paper has to
   match the paper. A clause name printed in a REPORT has to match the report,
   which has one house style whatever the contracts under it do. Both need the
   same two questions answered — what case is this written in, and how do I
   write it in another — so they are answered once here rather than twice at
   two call sites that would drift.

   NEITHER JOB REWRITES A CONTRACT. The insert only ever chooses the case of a
   heading it is about to write for the FIRST time; the report only ever
   changes what it PRINTS. No stored wording moves, no fingerprint moves, and a
   heading somebody typed is left exactly as they typed it.

   ACRONYMS ARE THE ONE THING A SHOUTED HEADING CANNOT TELL US. In "IP RIGHTS"
   every letter is a capital, so nothing in the text says whether "IP" is a word
   or an initialism — the information is simply not in the string. Two answers,
   in order, and the first is the honest one:

     - where the source is NOT itself all capitals, a token that is all capitals
       is an acronym somebody typed, and it is kept exactly as it stands;
     - where the source is all capitals, the list below is all there is.

   So that list is short, holds the initialisms this product actually meets, and
   deliberately leaves out "IT" and "US" — both are ordinary words as often as
   they are initialisms, and "As IT Stands" is a worse error than "Hr". It will
   be wrong now and then on a heading nobody here has seen, and the cost of that
   is a word on a chart rather than a word in anybody's agreement. */
const _CL_SMALL = new Set(['a','an','and','as','at','but','by','for','from','in',
  'nor','of','on','or','per','the','to','via','vs','with']);
const _CL_ACRONYM = new Set(['ip','nda','vat','gdpr','sla','kpi','eu','uk','hr',
  'qa','ppe','hse','fob','cif','exw','odpc','tupe','saas','poc','vip']);
/* The first LETTER, not the first character: a token can open with a bracket or
   a quotation mark and "(a)" must not become "(A)"-by-accident somewhere else. */
const _clCap = w => w.toLowerCase().replace(/[a-z]/, ch => ch.toUpperCase());
/* Does this string shout? One lowercase letter anywhere is the string telling
   us something about its own case; none at all is it telling us nothing, which
   is exactly what turns the acronym question from a reading into a guess. */
const _clShouts = t => /[A-Za-z]/.test(t) && !/[a-z]/.test(t);
function _clWord(w, first, last, shouts){
  const bare = w.replace(/[^A-Za-z]/g, '');
  if (!bare) return w;                                   /* "&", a dash, a number */
  if (!shouts && w === w.toUpperCase() && bare.length > 1) return w;   /* typed acronym */
  const low = bare.toLowerCase();
  if (_CL_ACRONYM.has(low)) return w.replace(bare, bare.toUpperCase());
  if (!first && !last && _CL_SMALL.has(low)) return w.toLowerCase();
  return _clCap(w);
}
/* Title Case, the convention every style guide shares: small words stay small
   unless they open or close the heading. "&" is not a word and is left alone —
   contract headings lean on it constantly. */
function clauseTitleCase(text){
  const t = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const shouts = _clShouts(t);
  const words = t.split(' ');
  return words.map((w, i) => {
    const first = i === 0, last = i === words.length - 1;
    /* A hyphen or a slash joins words INSIDE one token and each part follows the
       same rule, so "ROUTE-TO-MARKET" comes back as "Route-to-Market". */
    const parts = w.split(/([-\/])/);
    return parts.map((p, j) => (p === '-' || p === '/') ? p
      : _clWord(p, first && j === 0, last && j === parts.length - 1, shouts)).join('');
  }).join(' ');
}
/* Sentence case: the opening word and nothing else, acronyms excepted. */
function clauseSentenceCase(text){
  const t = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const shouts = _clShouts(t);
  return t.split(' ').map((w, i) => {
    const bare = w.replace(/[^A-Za-z]/g, '');
    if (!bare) return w;
    if (!shouts && w === w.toUpperCase() && bare.length > 1) return w;
    if (_CL_ACRONYM.has(bare.toLowerCase())) return w.replace(bare, bare.toUpperCase());
    return i === 0 ? _clCap(w) : w.toLowerCase();
  }).join(' ');
}
/* Write a heading in a named case. An unknown style — including the null
   clauseHeadingCase answers when a document has nothing to read — returns the
   text UNTOUCHED, because "I could not tell" must never become "so I changed
   it anyway". */
function clauseCaseTo(text, style){
  const t = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (style === 'upper') return t.toUpperCase();
  if (style === 'title') return clauseTitleCase(t);
  if (style === 'sentence') return clauseSentenceCase(t);
  return t;
}
/* ---------- THE DOCUMENT'S OWN HABIT ----------
   Read off the headings the paper already carries, so a clause added to it can
   be written the way its neighbours are.

   THE TITLE ALONE, NEVER THE NUMBER. "4." says nothing about case, and a
   contract is not shouting because it numbers its clauses.

   MAJORITY, NEVER THE FIRST ONE. Contracts routinely shout the agreement's own
   title and then set every clause under it in ordinary case, so reading one
   heading — or the first — gets the wrong answer on one of the commonest
   shapes there is.

   TITLE AND SENTENCE ARE TOLD APART ON THE LATER WORDS, and only headings that
   HAVE later words get a vote: "Confidentiality" is evidence about shouting and
   no evidence at all about what this document does with a second word. With no
   such heading anywhere the answer is 'title', which is the commoner convention
   in commercial drafting and the one the built-in templates use.

   NULL IS A REAL ANSWER and it means "leave it as typed" — an unheaded wall of
   paragraphs has no habit, and inventing one for it is a guess. */
function clauseHeadingCase(clauses){
  const list = Array.isArray(clauses) ? clauses : [];
  let upper = 0, plain = 0, title = 0, sentence = 0;
  for (const cl of list){
    const t = String((cl && cl.title) || '').replace(/\s+/g, ' ').trim();
    if (!/[A-Za-z]/.test(t)) continue;
    if (_clShouts(t)){ upper++; continue; }
    plain++;
    /* The words after the first, minus the small ones a title leaves small
       either way — those carry no evidence and counting them would read every
       title-cased heading with an "and" in it as sentence case. */
    const rest = t.split(' ').slice(1)
      .filter(w => { const b = w.replace(/[^A-Za-z]/g, '');
        return b && !_CL_SMALL.has(b.toLowerCase()); });
    if (!rest.length) continue;
    const caps = rest.filter(w => /^[^a-zA-Z]*[A-Z]/.test(w)).length;
    if (caps * 2 >= rest.length) title++; else sentence++;
  }
  if (!upper && !plain) return null;
  if (upper > plain) return 'upper';
  return sentence > title ? 'sentence' : 'title';
}

/* The heading a clause ABOUT TO BE ADDED to this document should carry: the
   name somebody typed, written the way this paper writes its headings. The one
   call the three insert sites share — the playbook's position, and the clause
   library from each of its two doors — because three copies of "read the habit,
   then apply it" is three places for them to come to disagree. */
function clauseHeadingFor(text, clauses){
  return clauseCaseTo(text, clauseHeadingCase(clauses));
}

/* ---------- WHERE A NUMBER IS MISSING ----------
   Asked of ONE number against the numbers a document carries, and deliberately
   not of the whole run at once.

   THE TRAP THIS AVOIDS. "Report every number the document skips" is the obvious
   reading and it is useless here. The prototype's own contract is numbered
   1, 4, 5, 6, 9, 12 — an extract of a longer agreement, which is how a great
   many uploaded contracts arrive — and clausefixtures.js keeps it that way on
   purpose so that nothing can quietly treat a number as an index. A scan for
   skipped numbers fires on that document six times over and is wrong every
   time: nobody deleted clauses 2 and 3, they were never in the file. A gap is
   only news when we know an act created it, and this module cannot know that.
   So it answers the narrow question and leaves the attribution to the caller
   that holds the change record (negoNumberingGaps).

   SIBLINGS, NOT NEIGHBOURS. "8.2" is missing from a document containing 8.1 and
   8.3, and is not missing from one containing only 8 and 9 — a sub-clause is
   compared against the sub-clauses of its own parent and against nothing else.
   Depth and parent prefix both have to match, so 12 never answers for 1.2.

   Returns { present, before, after }: whether the number is there at all, and
   the nearest sibling on each side, '' where there is none. before/after are
   what lets a notice say "8 is followed by 10" rather than making the reader
   scroll to find out. */
const _clNumParts = s => String(s == null ? '' : s).split('.')
  .map(p => p.trim()).filter(Boolean).map(p => parseInt(p, 10));
const _clNumOk = parts => parts.length > 0 && parts.every(n => Number.isFinite(n));

function clauseNumberGap(nums, num){
  const want = _clNumParts(num);
  if (!_clNumOk(want)) return { present: false, before: '', after: '' };
  const depth = want.length;
  const parent = want.slice(0, -1).join('.');
  const last = want[depth - 1];
  let present = false, before = null, after = null;
  for (const raw of (Array.isArray(nums) ? nums : [])){
    const parts = _clNumParts(raw);
    if (!_clNumOk(parts) || parts.length !== depth) continue;
    if (parts.slice(0, -1).join('.') !== parent) continue;
    const n = parts[depth - 1];
    if (n === last){ present = true; continue; }
    if (n < last && (before == null || n > before)) before = n;
    if (n > last && (after == null || n < after)) after = n;
  }
  const fmt = n => n == null ? '' : (parent ? parent + '.' + n : String(n));
  return { present, before: fmt(before), after: fmt(after) };
}

/* ---------- WHICH HEADING IS THE DOCUMENT'S OWN TITLE ----------
   Asked in one place because three functions have to give the same answer:
   the segmentation (which skips it), clauseFrontMatter (which prints it) and
   clauseStampIds (which must not put a clause id on it).

   TWO SHAPES OF TITLE, and the second one is the defect this exists to close.

   The first is the familiar one: a leading <h1> followed anywhere by a heading
   of lower rank. The lower-rank headings are the clauses, so the h1 above them
   is chrome.

   The second is a document whose ONLY heading is that <h1> — which is what a
   Word contract becomes when its clauses are written as "1. Services. Carrier
   shall…" inside ordinary paragraphs, with nothing but the agreement's name
   set as a heading. That is a very common way for a standard contract to be
   typed, and it used to read as ONE clause whose body was the entire
   agreement: every screen that draws a window per clause drew a single window
   holding the whole document, with one Direct Edit button at the foot of it.

   A lone heading cannot be marking clause boundaries — there is nothing for it
   to mark them against — so it is the title, and the blocks under it fall to
   the per-block reading a genuinely headingless document already gets.

   Returns the index of the title block, or -1 where the document has none. */
function _clTitleIndex(blocks, headings){
  if (!blocks.length || !headings.length) return -1;
  const first = blocks.findIndex(el => CLAUSE_HEADINGS.has(el.tagName));
  if (first < 0 || _clRank(blocks[first]) !== 1) return -1;
  if (headings.length === 1) return first;                       // nothing else is a heading
  return headings.some(h => _clRank(h) > 1) ? first : -1;
}
/* Do this document's headings mark where its clauses begin? False for a wall
   of paragraphs, and false for a wall of paragraphs under a title. */
const _clHeadingsMarkClauses = (blocks, headings) =>
  headings.length > (_clTitleIndex(blocks, headings) >= 0 ? 1 : 0);

/* ---------- the segmentation ----------
   Walk the document's top-level blocks once. A heading opens a clause; it
   closes at the next heading of the same or higher rank, so an <h3>
   sub-heading inside an <h2> clause is part of that clause's BODY rather than
   a clause of its own — which is right, because a sub-heading is a label on a
   term, not a second term.

   THE DOCUMENT TITLE IS NOT A CLAUSE — see _clTitleIndex. Where every heading
   sits at the same rank there is no title to detect and they are all clauses:
   the honest reading, since nothing in the markup distinguishes them. */
function clauseSegment(html){
  const root = _clParse(window.sanitizeRich ? sanitizeRich(html) : html);
  const blocks = Array.from(root.children);
  const headings = blocks.filter(el => CLAUSE_HEADINGS.has(el.tagName));
  const titleAt = _clTitleIndex(blocks, headings);

  /* chrome: the title, and the run of blocks between it and the first clause */
  let start = 0;
  if (titleAt >= 0 && _clHeadingsMarkClauses(blocks, headings)){
    let i = titleAt + 1;
    while (i < blocks.length && !CLAUSE_HEADINGS.has(blocks[i].tagName)) i++;
    start = i;
  }

  const out = [];
  let cur = null;
  const close = () => {
    if (!cur) return;
    cur.bodyHtml = cur._body.map(el => el.outerHTML).join('');
    cur.text = window.richToText ? richToText(cur.bodyHtml) : '';
    delete cur._body;
    out.push(cur);
    cur = null;
  };
  for (let i = start; i < blocks.length; i++){
    const el = blocks[i];
    const rank = _clRank(el);
    if (rank && (!cur || rank <= cur.rank)){
      close();
      const headText = (el.textContent || '').replace(/\s+/g, ' ').trim();
      const parsed = clauseParseHeading(headText);
      cur = { clauseId: el.getAttribute(window.RICH_CLAUSE_ATTR || 'data-clause-id') || null,
        rank, num: parsed.num, title: parsed.title, headingText: headText,
        headingHtml: el.outerHTML, bodyHtml: '', text: '', _body: [] };
      continue;
    }
    if (!cur) continue;                       // stray content before any heading
    cur._body.push(el);
  }
  close();

  /* A document whose headings do not mark its clauses must not degrade to one
     clause holding everything — nor to zero. Each top-level block under the
     title stands as its own clause, which is what the old line-splitting model
     did for EVERY document and is right for this one.

     Reached by two kinds of document: the wall of paragraphs with no heading at
     all, and the wall of paragraphs under a title (see _clTitleIndex). The
     title is dropped from the fallback rather than filed as clause one — it is
     the document's name, and nobody negotiates it. */
  if (!_clHeadingsMarkClauses(blocks, headings) && blocks.length)
    return _clauseFallback(blocks.slice(titleAt >= 0 ? titleAt + 1 : 0), html);
  if (!out.length && blocks.length) return _clauseFallback(blocks, html);
  return out;
}
/* ---------- the chrome, on request ----------
   clauseSegment deliberately skips the document's own front matter — the
   kicker line, the title <h1> and the recital / party paragraph between the
   title and the first clause heading. Right for the CHANGE MODEL (nobody
   negotiates the title), wrong to lose from a PAGE that claims to show the
   document: the Doc page prints all of it, so a workbench that starts at
   "1." reads as a different contract. This returns exactly what the
   segmentation skips, detected by the same rule so the two can never
   disagree about where the clauses start. */
function clauseFrontMatter(html){
  const none = { titleText: '', titleHtml: '', leadHtml: '', bodyHtml: '' };
  const root = _clParse(window.sanitizeRich ? sanitizeRich(html) : html);
  const blocks = Array.from(root.children);
  const headings = blocks.filter(el => CLAUSE_HEADINGS.has(el.tagName));
  const first = _clTitleIndex(blocks, headings);
  if (first < 0) return none;
  /* THE RECITAL IS ONLY A RECITAL WHERE HEADINGS MARK THE CLAUSES. In a
     document whose only heading is its title, the run under it is not front
     matter — it is the contract, read one clause per block. Claiming it here
     would print the whole agreement as an unnegotiable recital and leave the
     clause column empty. */
  const body = [];
  if (_clHeadingsMarkClauses(blocks, headings))
    for (let i = first + 1; i < blocks.length && !CLAUSE_HEADINGS.has(blocks[i].tagName); i++)
      body.push(blocks[i].outerHTML);
  return {
    titleText: (blocks[first].textContent || '').replace(/\s+/g, ' ').trim(),
    titleHtml: blocks[first].outerHTML,
    leadHtml: blocks.slice(0, first).map(el => el.outerHTML).join(''),
    bodyHtml: body.join(''),
  };
}

function _clauseFallback(blocks, html){
  const out = [];
  for (const el of blocks){
    const text = window.richToText ? richToText(el.outerHTML) : (el.textContent || '');
    if (!text.trim()) continue;
    const parsed = clauseParseHeading(text);
    out.push({ clauseId: el.getAttribute(window.RICH_CLAUSE_ATTR || 'data-clause-id') || null,
      rank: 0, num: parsed.num, title: '', headingText: '', headingHtml: '',
      bodyHtml: el.outerHTML, text, headingless: true });
  }
  return out;
}

/* ---------- stamping ----------
   Assign an id to every clause that has none, and return the document with the
   ids written into it. Called once per document at intake — all three paths —
   and again on first open of anything that predates this model, which is what
   makes the migration a no-op for documents that already carry ids.

   Idempotent by construction: a clause that already has an id keeps it. Running
   this twice cannot renumber anything, which matters because it runs on open. */
function clauseStampIds(html){
  const attr = window.RICH_CLAUSE_ATTR || 'data-clause-id';
  const clean = window.sanitizeRich ? sanitizeRich(html) : String(html == null ? '' : html);
  const root = _clParse(clean);
  const blocks = Array.from(root.children);
  const headings = blocks.filter(el => CLAUSE_HEADINGS.has(el.tagName));

  const taken = new Set();
  for (const el of blocks){
    const id = el.getAttribute(attr);
    if (id) taken.add(id);
  }
  /* A document whose headings do not mark its clauses still HAS clauses — the
     fallback reads one per block — and they still have to be addressable, so
     they are stamped on the block that opens them. Leaving them unstamped would
     mean a whole class of uploaded contract could be read but never negotiated.

     Same rule as clauseSegment, and the title is skipped for the same reason it
     is skipped there: it is not one of the clauses being stamped. */
  const titleAt = _clTitleIndex(blocks, headings);
  if (!_clHeadingsMarkClauses(blocks, headings)){
    let n = 0;
    for (const el of blocks.slice(titleAt >= 0 ? titleAt + 1 : 0)){
      if (!(el.textContent || '').trim()) continue;
      if (el.getAttribute(attr)) continue;
      el.setAttribute(attr, clauseNewId(taken)); n++;
    }
    return { html: root.innerHTML, stamped: n, headingless: true };
  }
  /* Which headings are clauses is decided by the SAME segmentation the rest of
     the module uses, so a heading can never be a clause for one function and
     chrome for another. */
  const wanted = new Set(clauseSegment(clean).map(cl => cl.headingHtml).filter(Boolean));
  let stamped = 0;
  for (const el of headings){
    if (!wanted.has(el.outerHTML)) continue;         // the document title: chrome
    if (el.getAttribute(attr)) continue;
    el.setAttribute(attr, clauseNewId(taken));
    stamped++;
  }
  return { html: root.innerHTML, stamped, headingless: false };
}
/* ---------- KEEPING THE ID WHEN THE DOCUMENT IS READ AGAIN ----------

   clauseStampIds is idempotent only where the ids are STORED. A contract built
   from a template keeps no body of its own — c.redlineText is empty and the
   wording is regenerated from the template on demand — so negoStampContract has
   nowhere to write the stamp back to, and every fresh read mints brand new
   random ids for the same clauses.

   That is not cosmetic. A change is anchored on a clause id, the counterparty's
   copy is anchored on the ids we sent them, and negoFreshenBaseline re-reads the
   baseline on EVERY paint of the workbench while nothing is on the table. So on
   a template contract the ids moved under both parties continuously: the
   counterparty proposed wording against clause `cl_a1b2`, and by the time their
   answer came home our clause was called something else. applyNegoProposals
   could not find it, dropped it without a word, and the poller retried the same
   impossible response for ever. The whole reported fault — "they cannot redline
   until I have sent a redline first" — is this: our own first change freezes the
   baseline (negoFreshenBaseline refuses to move once anything is filed), and the
   ids stop wandering from that moment on.

   This carries the ids from the previous reading onto the new one, so a re-read
   of an unchanged document produces the SAME document, byte for byte, and
   negoFreshenBaseline has nothing to replace.

   HOW A CLAUSE IS RECOGNISED ACROSS THE TWO READINGS: by its heading text where
   headings mark the clauses (a heading survives a key term being filled in three
   paragraphs below it), and by position where they do not — in a headingless
   document every block's text can move, and its place in the document is the
   only thing that does not. Both readings are taken with the same two helpers
   clauseSegment and clauseStampIds use, so a clause can never be one thing here
   and another there. */
function clauseCarryIds(prevHtml, nextHtml){
  const attr = (typeof window !== 'undefined' && window.RICH_CLAUSE_ATTR) || 'data-clause-id';
  const nextRoot = _clParse(nextHtml);
  if (!prevHtml) return nextRoot.innerHTML;
  const prevRoot = _clParse(prevHtml);
  const slotsOf = root => {
    const blocks = Array.from(root.children);
    const headings = blocks.filter(el => CLAUSE_HEADINGS.has(el.tagName));
    const titleAt = _clTitleIndex(blocks, headings);
    if (!_clHeadingsMarkClauses(blocks, headings))
      return { byHeading: false, els: blocks.slice(titleAt >= 0 ? titleAt + 1 : 0)
        .filter(el => (el.textContent || '').trim()) };
    const title = titleAt >= 0 ? blocks[titleAt] : null;
    return { byHeading: true, els: headings.filter(el => el !== title) };
  };
  const was = slotsOf(prevRoot), now = slotsOf(nextRoot);
  /* A document that has changed SHAPE — headings appeared, or the whole thing
     was replaced — is not the same document read again, and guessing which
     clause is which would re-point live changes. It keeps its fresh stamp. */
  if (!was.els.length || !now.els.length || was.byHeading !== now.byHeading)
    return nextRoot.innerHTML;
  const used = new Set();
  const take = id => { if (!id || used.has(id)) return false; used.add(id); return true; };
  const key = el => (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const unmatched = [];
  if (was.byHeading){
    const pool = new Map();
    for (const el of was.els){
      const id = el.getAttribute(attr); if (!id) continue;
      const k = key(el);
      if (!pool.has(k)) pool.set(k, []);
      pool.get(k).push(id);
    }
    now.els.forEach((el, i) => {
      const list = pool.get(key(el));
      const id = list && list.length ? list.shift() : null;
      if (id && take(id)) el.setAttribute(attr, id); else unmatched.push(i);
    });
  } else now.els.forEach((_, i) => unmatched.push(i));
  for (const i of unmatched){
    const src = was.els[i];
    const id = src ? src.getAttribute(attr) : null;
    if (id && take(id)) now.els[i].setAttribute(attr, id);
  }
  /* A carried id landing beside a freshly minted one that happens to match is
     vanishingly unlikely and catastrophic — two clauses answering to one id —
     so it is checked rather than assumed away, exactly as clauseStampIds does. */
  const seen = new Set();
  for (const el of now.els){
    const id = el.getAttribute(attr); if (!id) continue;
    if (seen.has(id)) el.setAttribute(attr, clauseNewId(seen)); else seen.add(id);
  }
  return nextRoot.innerHTML;
}

/* The clauses of a contract's working body, with ids guaranteed present.
   Reading and stamping are separate on purpose — this is the read. */
function clauseList(html){ return clauseSegment(html); }
/* clauseFindById, not clauseById: js/playbook.js already exports a clauseById
   that takes a LIBRARY id and returns a library entry. Both land on window, and
   whichever module app.js imports last silently wins the name. Nothing called
   the loser today, which is exactly why it would have been found the hard way. */
const clauseFindById = (html, id) => clauseSegment(html).find(cl => cl.clauseId === id) || null;

/* ---------- editing the document, by id ----------
   The operations accept/reject need, all of them anchored on the clause id and
   all of them working on the DOM. Nothing here round-trips through plain text,
   which is what retires the B-004 formatting-loss failure class rather than
   guarding against it: there is no lossy step left to guard.

   Each returns the new document HTML, or null when the clause is not there —
   a caller that cannot find its clause must be able to say so rather than
   silently write the document back unchanged. */
function _clFindHeading(root, id){
  const attr = window.RICH_CLAUSE_ATTR || 'data-clause-id';
  for (const el of Array.from(root.children))
    if (CLAUSE_HEADINGS.has(el.tagName) && el.getAttribute(attr) === id) return el;
  return null;
}
function _clBodyOf(root, head){
  const rank = _clRank(head);
  const body = [];
  let el = head.nextElementSibling;
  while (el && !(CLAUSE_HEADINGS.has(el.tagName) && _clRank(el) <= rank)){
    body.push(el); el = el.nextElementSibling;
  }
  return body;
}
/* Replace a clause's BODY blocks in place. The heading — and therefore the id —
   is untouched, so a clause keeps its identity across every rewording it ever
   receives. */
function clauseReplaceBody(html, id, bodyHtml){
  const root = _clParse(window.sanitizeRich ? sanitizeRich(html) : html);
  const head = _clFindHeading(root, id);
  if (!head) return null;
  const body = _clBodyOf(root, head);
  const frag = _clParse(window.sanitizeRich ? sanitizeRich(bodyHtml) : bodyHtml);
  const incoming = Array.from(frag.children);
  for (const el of incoming) root.insertBefore(el, body.length ? body[0] : head.nextSibling);
  for (const el of body) el.remove();
  return root.innerHTML;
}
/* Replace a clause's heading text, keeping its id and its rank. Used when a
   title edit is accepted; the number is written by whoever renders, so what is
   stored is the label the editor actually typed. */
function clauseReplaceHeading(html, id, headingText){
  const root = _clParse(window.sanitizeRich ? sanitizeRich(html) : html);
  const head = _clFindHeading(root, id);
  if (!head) return null;
  head.textContent = String(headingText == null ? '' : headingText);
  return root.innerHTML;
}
/* Remove a clause — heading and body together. The id goes with it and is
   never reissued: clauseNewId only ever draws ids nothing in the document is
   using, and a retired clause's changes keep pointing at an id that will never
   name anything else. */
function clauseRemove(html, id){
  const root = _clParse(window.sanitizeRich ? sanitizeRich(html) : html);
  const head = _clFindHeading(root, id);
  if (!head) return null;
  for (const el of _clBodyOf(root, head)) el.remove();
  head.remove();
  return root.innerHTML;
}
/* Insert a new clause AFTER a named one — or at the top when `afterId` is null.
   Where it was proposed is where it lands. Appending it to the end instead
   would be inventing document structure neither party wrote, which is exactly
   what the old model did because a line index gave it nowhere else to go. */
function clauseInsert(html, afterId, clause){
  const attr = window.RICH_CLAUSE_ATTR || 'data-clause-id';
  const root = _clParse(window.sanitizeRich ? sanitizeRich(html) : html);
  const taken = new Set(clauseSegment(root.innerHTML).map(cl => cl.clauseId).filter(Boolean));
  const id = (clause && clause.clauseId && !taken.has(clause.clauseId))
    ? clause.clauseId : clauseNewId(taken);

  const after = afterId ? _clFindHeading(root, afterId) : null;
  if (afterId && !after) return null;
  /* The new clause sits at the rank of the one it follows, so it reads as its
     peer rather than as a sub-clause of it. With nothing to follow, it takes
     the rank of the document's first clause — or <h2>, the prototype's own
     clause level, in a document that has none yet. */
  const first = clauseSegment(root.innerHTML)[0];
  const rank = after ? _clRank(after) : ((first && first.rank) || 2);
  const head = _clInert().createElement('H' + rank);
  head.setAttribute(attr, id);
  head.textContent = String((clause && clause.headingText) || '');
  const frag = _clParse(window.sanitizeRich ? sanitizeRich((clause && clause.bodyHtml) || '') : ((clause && clause.bodyHtml) || ''));
  const bodyEls = Array.from(frag.children);

  const anchor = after ? (_clBodyOf(root, after).slice(-1)[0] || after) : null;
  const mark = anchor ? anchor.nextSibling : root.firstChild;
  root.insertBefore(head, mark);
  let at = head.nextSibling;
  for (const el of bodyEls) root.insertBefore(el, at);
  return { html: root.innerHTML, clauseId: id };
}

/* ============================================================
   CROSS-REFERENCES — finding them, and working out what they point at
   ============================================================
   A contract talks about itself constantly: "subject to Clause 9", "the limits
   in Section 4", "as defined in 8.2(a)". Today every one of those is plain
   text, and nothing in the product knows they are references at all.

   WHY THIS EXISTS BEFORE ANYTHING THAT MOVES A NUMBER. While numbers never
   move, a reference to a deleted clause points at NOTHING — ugly, but a reader
   who follows it finds an absence and knows something is wrong. The moment
   numbers can be renumbered, that same reference points at the WRONG CLAUSE:
   plausible, readable, and lying. The renumbering feature converts today's
   honest gaps into silent misstatements of what the contract means, so the net
   goes up before the tightrope.

   THE SAME NUMBER GRAMMAR THE HEADINGS USE, deliberately. A document that
   writes its headings as `8.2(a)` writes its references the same way, and a
   second grammar invented here would disagree with clauseParseHeading on
   exactly the documents where it matters most.

   A READ, AND NOTHING ELSE. No DOM mutation, no storage, no rewriting of
   anybody's wording. What this module produces is an opinion; every decision
   about what to do with one belongs to a human (see guardrail 5 in
   WORKORDER-clause-numbering.md — warnings advise, they never auto-edit).

   NAMES, AND WHAT THEY DO NOT COVER. "Clause", "Section", "Article", "Art.",
   "Sec.", "§", "para"/"paragraph", and the bare form inside a range
   ("Clauses 4 to 6" — the 6 carries no word of its own). Deliberately NOT
   matched: a bare number with no word in front of it. "See 9 below" is a
   reference and "within 30 days" is not, and nothing in the text distinguishes
   them; guessing would fill every payment clause in the portfolio with false
   warnings. A reference the product cannot see is a missed warning. A false one
   is a warning nobody reads. */
const _CLREF_WORD = '(?:clauses?|sections?|articles?|art\\.?|sec\\.?|paragraphs?|paras?\\.?|§§?)';
const _CLREF_NUM = '\\d+(?:\\.\\d+)*(?:\\s*\\([a-z0-9]+\\))*';
/* Ranges: "Clauses 4 to 6", "Clauses 4–6", "Clauses 4-6". Captured as two
   endpoints, because a range that loses a clause in the middle is still broken
   at whichever end went. */
const _CLREF_RANGE = new RegExp(
  `(${_CLREF_WORD})\\s*(${_CLREF_NUM})\\s*(?:to|through|–|—|-)\\s*(${_CLREF_NUM})`, 'gi');
const _CLREF_ONE = new RegExp(`(${_CLREF_WORD})\\s*(${_CLREF_NUM})`, 'gi');

/* Normalise a reference number to the form clauseParseHeading produces:
   trailing punctuation off, whitespace out of sub-paragraph brackets. */
function clauseRefNorm(n){
  let s = String(n == null ? '' : n).replace(/\s+/g, '');
  /* Trailing punctuation off — but a closing bracket is only punctuation when
     nothing opened it. Stripping it unconditionally turned 8.2(a) into 8.2(a,
     which then matched no heading and reported every sub-paragraph reference in
     the portfolio as dangling. */
  s = s.replace(/\.+$/, '');
  while (s.endsWith(')') && (s.split('(').length - 1) < (s.split(')').length - 1))
    s = s.slice(0, -1);
  return s.replace(/\.+$/, '');
}

/* Every reference in one piece of text.
   Returns [{ text, num, start, end, kind }] where kind is 'single' or 'range'
   and start/end are character offsets into the text as given — so a caller can
   highlight the exact words without searching for them again. */
function clauseRefsInText(text){
  const s = String(text == null ? '' : text);
  if (!s) return [];
  const out = [];
  const taken = [];
  const overlaps = (a, b) => taken.some(([x, y]) => a < y && b > x);

  /* Ranges first. "Clauses 4 to 6" contains "Clauses 4", and letting the
     single-reference pass see it first would report the range as one reference
     and leave the 6 invisible. */
  let m;
  _CLREF_RANGE.lastIndex = 0;
  while ((m = _CLREF_RANGE.exec(s))){
    const whole = m[0], at = m.index;
    taken.push([at, at + whole.length]);
    const a = clauseRefNorm(m[2]), b = clauseRefNorm(m[3]);
    if (a) out.push({ text: whole, num: a, start: at, end: at + whole.length, kind: 'range' });
    if (b) out.push({ text: whole, num: b, start: at, end: at + whole.length, kind: 'range' });
  }
  _CLREF_ONE.lastIndex = 0;
  while ((m = _CLREF_ONE.exec(s))){
    const at = m.index;
    if (overlaps(at, at + m[0].length)) continue;
    const num = clauseRefNorm(m[2]);
    if (num) out.push({ text: m[0], num, start: at, end: at + m[0].length, kind: 'single' });
  }
  return out.sort((a, b) => a.start - b.start);
}

/* ---------- WHAT DOES IT POINT AT ----------
   Resolve each reference against the numbers this document's own clauses
   carry. Three answers, and the third is the one that keeps the feature quiet
   enough to be worth having:

     resolved — a clause in this document carries that number
     self     — the clause is citing itself. Legal, ordinary drafting
                ("nothing in this Clause 8 limits…"), never a fault, never
                reported.
     dangling — no clause here carries it. NOT automatically an error: an
                extract of a longer agreement legitimately cites clause 2 of
                the parent, which is not in the file and never was. Whether a
                dangling reference is news is a question about the change
                record, and it is answered by negoBrokenRefs, not here.

   Sibling rules come from clauseNumberGap by way of exact matching: 12 never
   answers for 1.2, because the numbers are compared as written. */
function clauseResolveRefs(clauses, opts = {}){
  const list = Array.isArray(clauses) ? clauses : [];
  const byNum = new Map();
  for (const cl of list){
    const n = clauseRefNorm(cl && cl.num);
    if (n && !byNum.has(n)) byNum.set(n, cl);
  }
  const out = [];
  for (const cl of list){
    const hay = String((cl && cl.text) || '');
    for (const r of clauseRefsInText(hay)){
      const target = byNum.get(r.num) || null;
      const own = clauseRefNorm(cl && cl.num);
      const state = (own && own === r.num) ? 'self' : target ? 'resolved' : 'dangling';
      out.push({ ...r, fromClauseId: (cl && cl.clauseId) || null,
        fromNum: own || '', state,
        toClauseId: state === 'resolved' ? (target.clauseId || null) : null });
    }
  }
  return out;
}

/* ============================================================
   RENUMBERING — the computation, and nothing but the computation (N2)
   ============================================================
   Everything here is a PLAN: given the clauses a document carries, what would
   each heading say and where would each cross-reference point if the gaps
   were closed. No function in this section writes anything. The write is a
   separate, deliberate act (negoRenumberApply, js/negotiation.js) behind a
   preview and a confirmation, because renumbering an instrument that is cited
   by its numbers is exactly the kind of act that must never happen as a side
   effect.

   FORMAT PRESERVATION IS A HARD REQUIREMENT, not a nicety. `8.2(a)` renumbered
   must produce `8.1(a)` — never `8.1. (a)` or `8.1 (a)`. The product has been
   burned by rebuilt headings inventing punctuation (B-004's whole failure
   class), so nothing here ever rebuilds a string around a number: the numeric
   token is rewritten IN PLACE and every character around it is kept verbatim.

   THE RUN KEEPS ITS OWN ORIGIN. 1, 4, 5, 12 compacts to 1, 2, 3, 4 — but
   4, 5, 6 proposes NOTHING, and 2, 4, 5 compacts to 2, 3, 4. An extract of a
   longer agreement legitimately starts at the number its parent gave it;
   dragging it back to 1 would be inventing a fact about a document we did not
   write. Gaps BETWEEN clauses close; the first number stays where it was. */

/* Rewrite the numeric token inside a heading, using the same three grammars
   clauseParseHeading reads with — so a heading this cannot rewrite is a
   heading that was never parsed as numbered in the first place. Returns the
   new heading string, or null when no numeric token is found. */
function clauseHeadingRenumber(headingText, newNum){
  const t = String(headingText == null ? '' : headingText);
  let m = t.match(/^((?:clause|article|section|art\.?|sec\.?|§)\s*)(\d+(?:\.\d+)*)([\s\S]*)$/i);
  if (m) return m[1] + newNum + m[3];
  m = t.match(/^(\d+(?:\.\d+)*)([\s\S]*)$/);       // "4. PAYMENT TERMS", "4)" and bare "4"
  if (m) return newNum + m[2];
  return null;
}

/* Rewrite the reference numbers in ONE piece of text, per a mapping of clause
   numbers. `mapBase` answers with the new number for a normalised base, or
   null to leave it alone.

   THE BASE MOVES, THE SUFFIX STAYS. A reference "8.2(a)" names sub-paragraph
   (a) of clause 8.2; when clause 8.2 becomes 8.1, only the "8.2" is rewritten
   and the "(a)" — including any space the author put before it — is kept as
   written. A dotted reference deeper than any clause here ("4.3" when only
   clause 4 exists) maps to nothing and is left alone: what it points at is
   not in this document, and guessing is how a reference comes to lie.

   ONE PASS, SIMULTANEOUS. With a mapping of {4→3, 5→4}, "Clause 4" becomes
   "Clause 3" and "Clause 5" becomes "Clause 4" — a sequential find-and-replace
   would map the 4 twice and corrupt the document it was tidying. Every edit is
   located first, against the original string, then applied together. */
function clauseRenumberText(text, mapBase){
  const s = String(text == null ? '' : text);
  if (!s || !/\d/.test(s)) return { text: s, edits: [] };
  const edits = [];
  const spans = [];
  const overlaps = (a, b) => spans.some(([x, y]) => a < y && b > x);
  const renum = raw => {
    const m = /^(\d+(?:\.\d+)*)([\s\S]*)$/.exec(raw);
    if (!m) return null;
    const to = mapBase(clauseRefNorm(m[1]));
    if (!to || to === m[1]) return null;
    return { from: m[1], to, out: to + m[2] };
  };
  /* Ranges first, exactly as clauseRefsInText orders it: "Clauses 4 to 6"
     contains "Clauses 4", and the single pass must not see it twice. */
  const range = new RegExp(`(${_CLREF_WORD})\\s*(${_CLREF_NUM})\\s*(?:to|through|–|—|-)\\s*(${_CLREF_NUM})`, 'gi');
  let m;
  while ((m = range.exec(s))){
    const at = m.index, whole = m[0];
    spans.push([at, at + whole.length]);
    const afterWord = whole.slice(m[1].length);
    const p2 = at + m[1].length + (afterWord.length - afterWord.replace(/^\s+/, '').length);
    const p3 = at + whole.length - m[3].length;   // the regex ends at the second number
    for (const [raw, pos] of [[m[2], p2], [m[3], p3]]){
      const r = renum(raw);
      if (r) edits.push({ start: pos, end: pos + raw.length, out: r.out,
        refText: whole, from: r.from, to: r.to });
    }
  }
  const one = new RegExp(`(${_CLREF_WORD})\\s*(${_CLREF_NUM})`, 'gi');
  while ((m = one.exec(s))){
    const at = m.index;
    if (overlaps(at, at + m[0].length)) continue;
    const raw = m[2], pos = at + m[0].length - raw.length;
    const r = renum(raw);
    if (r) edits.push({ start: pos, end: pos + raw.length, out: r.out,
      refText: m[0], from: r.from, to: r.to });
  }
  if (!edits.length) return { text: s, edits: [] };
  let out = s;
  for (const e of edits.slice().sort((a, b) => b.start - a.start))
    out = out.slice(0, e.start) + e.out + out.slice(e.end);
  return { text: out, edits };
}

/* The same rewrite over a clause BODY's HTML, text node by text node — the
   markup is never flattened and never touched, which is what keeps this out
   of the B-004 failure class by construction. A reference split across
   formatting ("Clause <b>9</b>") is invisible at this level; the planner
   reports it as unreachable rather than half-rewriting it. */
function clauseRenumberBodyHtml(bodyHtml, mapBase){
  const root = _clParse(window.sanitizeRich ? sanitizeRich(bodyHtml) : bodyHtml);
  const edits = [];
  const walk = el => {
    for (const node of Array.from(el.childNodes)){
      if (node.nodeType === 3){
        const r = clauseRenumberText(node.nodeValue, mapBase);
        if (r.edits.length){ node.nodeValue = r.text; edits.push(...r.edits); }
      } else if (node.nodeType === 1) walk(node);
    }
  };
  walk(root);
  return { html: root.innerHTML, edits };
}

/* The whole plan: new headings, repointed references, and everything that
   will NOT be touched, each with its reason — so the preview can show 100% of
   what would move before anything is written.

   HIERARCHY-AWARE. Families renumber independently: closing a gap among
   clause 1's sub-clauses proposes nothing for clause 2, and a renumbered
   parent carries its children with it (4 → 2 makes 4.1 → 2.1) with the
   children's own run compacted against their own siblings. */
function clauseRenumberPlan(clauses){
  const list = (Array.isArray(clauses) ? clauses : []).filter(cl => cl && cl.clauseId);
  const numbered = list.filter(cl => _clNumOk(_clNumParts(cl.num)));
  const byDepth = new Map();
  for (const cl of numbered){
    const d = _clNumParts(cl.num).length;
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d).push(cl);                      // document order, preserved
  }
  const map = new Map();                          // old num → new num, changed only
  const headings = [];
  for (const d of Array.from(byDepth.keys()).sort((a, b) => a - b)){
    const fams = new Map();
    for (const cl of byDepth.get(d)){
      const parent = _clNumParts(cl.num).slice(0, -1).join('.');
      if (!fams.has(parent)) fams.set(parent, []);
      fams.get(parent).push(cl);
    }
    for (const [parent, members] of fams){
      const newParent = map.get(parent) || parent;
      const anchor = _clNumParts(members[0].num).pop();   // the run keeps its own origin
      members.forEach((cl, i) => {
        const to = newParent ? `${newParent}.${anchor + i}` : String(anchor + i);
        const from = clauseRefNorm(cl.num);
        if (to === from) return;
        map.set(from, to);
        const newHeading = clauseHeadingRenumber(cl.headingText, to);
        if (newHeading == null || newHeading === cl.headingText) return;
        headings.push({ clauseId: cl.clauseId, oldNum: from, newNum: to,
          oldHeading: cl.headingText, newHeading });
      });
    }
  }
  const mapBase = n => map.get(n) || null;
  const refs = [], untouched = [], bodies = {};
  const seenDangling = new Set();
  for (const cl of list){
    const r = clauseRenumberBodyHtml(cl.bodyHtml || '', mapBase);
    if (r.edits.length){
      bodies[cl.clauseId] = r.html;
      for (const e of r.edits)
        refs.push({ clauseId: cl.clauseId, fromNum: cl.num || '', refText: e.refText,
          from: e.from, to: e.to });
    }
    /* Anything the flat text can see that the node walk could not reach is a
       reference split across formatting — reported, never half-rewritten. */
    const flat = clauseRefsInText(String(cl.text || ''));
    const expected = flat.filter(x => {
      const base = (/^(\d+(?:\.\d+)*)/.exec(x.num) || [])[1] || '';
      return base && map.has(clauseRefNorm(base));
    }).length;
    if (expected > r.edits.length)
      untouched.push({ clauseId: cl.clauseId, refText: '', num: '',
        reason: 'formatting', count: expected - r.edits.length });
  }
  /* Dangling references, listed so the preview can say "unresolvable — will
     not be touched" instead of leaving the reader to wonder. */
  for (const r of clauseResolveRefs(list)){
    if (r.state !== 'dangling') continue;
    const base = (/^(\d+(?:\.\d+)*)/.exec(r.num) || [])[1] || '';
    if (base && map.has(clauseRefNorm(base))) continue;    // its base moves — it is in `refs`
    const key = r.fromClauseId + '→' + r.num;
    if (seenDangling.has(key)) continue;
    seenDangling.add(key);
    untouched.push({ clauseId: r.fromClauseId, refText: r.text, num: r.num, reason: 'dangling' });
  }
  return { headings, refs, untouched, bodies,
    map: Object.fromEntries(map), changed: headings.length > 0 };
}

if (typeof window !== 'undefined') Object.assign(window, {
  CLAUSE_HEADINGS, clauseNewId, clauseParseHeading, clauseLabel, clauseNumberGap,
  CLAUSE_KINDS, clauseKindByKey, clauseKind, ruleKind,
  clauseTitleCase, clauseSentenceCase, clauseCaseTo, clauseHeadingCase, clauseHeadingFor,
  clauseSegment, clauseFrontMatter, clauseStampIds, clauseCarryIds, clauseList, clauseFindById,
  clauseReplaceBody, clauseReplaceHeading, clauseRemove, clauseInsert,
  clauseRefsInText, clauseResolveRefs, clauseRefNorm,
  clauseHeadingRenumber, clauseRenumberText, clauseRenumberBodyHtml, clauseRenumberPlan,
});
