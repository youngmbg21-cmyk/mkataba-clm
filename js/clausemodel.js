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

/* ---------- the segmentation ----------
   Walk the document's top-level blocks once. A heading opens a clause; it
   closes at the next heading of the same or higher rank, so an <h3>
   sub-heading inside an <h2> clause is part of that clause's BODY rather than
   a clause of its own — which is right, because a sub-heading is a label on a
   term, not a second term.

   THE DOCUMENT TITLE IS NOT A CLAUSE. A leading <h1> followed anywhere by a
   heading of lower rank is the document's own title, and it and the blocks
   under it (the party/meta line the prototype draws under the title) are
   chrome. Where every heading sits at the same rank there is no title to
   detect and they are all clauses — the honest reading, since nothing in the
   markup distinguishes them. */
function clauseSegment(html){
  const root = _clParse(window.sanitizeRich ? sanitizeRich(html) : html);
  const blocks = Array.from(root.children);
  const headings = blocks.filter(el => CLAUSE_HEADINGS.has(el.tagName));

  /* chrome: a leading h1 that outranks something later in the document */
  let start = 0;
  if (headings.length > 1 && blocks.length){
    const first = blocks.findIndex(el => CLAUSE_HEADINGS.has(el.tagName));
    if (first >= 0 && _clRank(blocks[first]) === 1
        && headings.some(h => _clRank(h) > 1)){
      let i = first + 1;
      while (i < blocks.length && !CLAUSE_HEADINGS.has(blocks[i].tagName)) i++;
      start = i;
    }
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

  /* A genuinely headingless document — an uploaded contract that arrived as a
     wall of paragraphs — must not degrade to zero clauses. Each top-level block
     stands as its own clause, which is what the old line-splitting model did
     for EVERY document and is right for this one. */
  if (!out.length && blocks.length) return _clauseFallback(blocks, html);
  return out;
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
  /* A headingless document still has clauses — the fallback reads one per
     block — and they still have to be addressable, so they are stamped on the
     block that opens them. Leaving them unstamped would mean a whole class of
     uploaded contract could be read but never negotiated. */
  if (!headings.length){
    let n = 0;
    for (const el of blocks){
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

if (typeof window !== 'undefined') Object.assign(window, {
  CLAUSE_HEADINGS, clauseNewId, clauseParseHeading, clauseLabel,
  clauseSegment, clauseStampIds, clauseList, clauseFindById,
  clauseReplaceBody, clauseReplaceHeading, clauseRemove, clauseInsert,
});
