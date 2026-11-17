/* ============================================================
   THE LADDER — A STANDARD'S RULES, READ AND CHANGED ONE WAY
   (owner picked "The Ladder" by name, 17 Nov 2026; answers: holds / departs
   only, Must have follows the existing signing check, a change waits for any
   admin but its editor, the Our standards tab is removed)
   ============================================================
   A standard is a clause-library entry (its words, its reason) plus the
   playbook positions that name it (how firm, which contract types). This file
   READS both into one ladder — what we ask for, the fallbacks in order with who
   may give each, what we never accept — and APPLIES an approved change back
   into them. It is loaded by the BROWSER and the SERVER alike (the
   js/sharemail.js pattern), so the page shows and the server writes the same
   thing. It reads no state, calls no route and keeps nothing.

   ONE FACT, ONE HOME: how firm a standard is lives on the playbook entry that
   names it (`firm`, with the older `pos` + `escalate` written from it so every
   existing reader keeps working); its words, fallbacks, owner and review live
   on the clause entry. `fallback` (one string, read by the check and Jambo) is
   written from the ladder's first fallback, never typed on its own. */
const STD_FIRMS = ['must', 'push', 'nice', 'never'];
/* who may give a step of the ladder */
const STD_WHO = ['anyone', 'team', 'legal', 'admin'];
const STD_FALLBACKS_MAX = 4;
const STD_TEXT_MAX = 2000;
const STD_WHY_MAX = 600;
const STD_REVIEW_MONTHS = [3, 6, 12, 24];
const STD_CHANGES_KEEP = 200;
const STD_CHANGE_WHY_MAX = 400;
/* the order a person reads the firmness in, and the one used to pick the
   strictest where a standard sits in several books */
const STD_FIRM_RANK = { must: 4, never: 3, push: 2, nice: 1 };

function _stdStr(v, max){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max || STD_TEXT_MAX); }

/* how firm a playbook entry is: its own `firm`, else read off the older pos/escalate */
function stdFirmOfEntry(p){
  if (!p || typeof p !== 'object') return null;
  if (STD_FIRMS.includes(p.firm)) return p.firm;
  if (p.pos === 'forbidden') return 'never';
  if (p.pos === 'required') return 'must';
  if (p.op) return p.escalate ? 'push' : 'nice';
  return p.escalate ? 'push' : 'nice';
}
/* and back: what the older readers (the check, the review, Jambo) need */
function stdPosOfFirm(firm){
  if (firm === 'must') return { pos: 'required', escalate: true };
  if (firm === 'never') return { pos: 'forbidden', escalate: true };
  if (firm === 'push') return { pos: 'preferred', escalate: true };
  return { pos: 'preferred', escalate: false };
}
/* the book entries that are this standard: a position naming its clause, or
   naming its category; a numeric limit (range) whose label is its category */
function _stdEntryHits(cl, p){
  if (!cl || !p) return false;
  if (p.clause && String(p.clause) === String(cl.id)) return true;
  const cat = String(cl.category || '').toLowerCase();
  return !!cat && (String(p.category || '').toLowerCase() === cat || String(p.label || '').toLowerCase() === cat) && !p.clause;
}
/* where it applies and how firm: { books:[key…], firm, mixed } — strictest wins, `mixed` says the books differ */
function stdPlaceOf(cl, pb){
  const books = [], firms = new Set();
  for (const [k, b] of Object.entries(pb || {})){
    if (!b || typeof b !== 'object') continue;
    const own = [...(Array.isArray(b.positions) ? b.positions : []), ...(Array.isArray(b.ranges) ? b.ranges : [])].filter(p => _stdEntryHits(cl, p));
    if (!own.length) continue;
    books.push(k);
    own.forEach(p => { const f = stdFirmOfEntry(p); if (f) firms.add(f); });
  }
  const firm = [...firms].sort((a, b) => STD_FIRM_RANK[b] - STD_FIRM_RANK[a])[0] || null;
  return { books, firm, mixed: firms.size > 1 };
}
/* the ladder itself, best first */
function stdLadderOf(cl){
  cl = cl || {};
  let fallbacks = Array.isArray(cl.fallbacks) ? cl.fallbacks.filter(f => f && _stdStr(f.text)) : null;
  if (!fallbacks) fallbacks = _stdStr(cl.fallback) ? [{ text: _stdStr(cl.fallback), who: 'team' }] : [];
  return {
    ask: _stdStr(cl.preferred),
    fallbacks: fallbacks.map(f => ({ text: _stdStr(f.text), who: STD_WHO.includes(f.who) ? f.who : 'team' })),
    never: _stdStr(cl.never),
    why: _stdStr(cl.guidance, STD_WHY_MAX),
  };
}
/* who looks after it: owner, version, when it was approved and when it is read again */
function stdGovOf(cl){
  cl = cl || {};
  const months = STD_REVIEW_MONTHS.includes(Number(cl.reviewMonths)) ? Number(cl.reviewMonths) : 12;
  return { ownerId: cl.ownerId != null ? String(cl.ownerId) : '', owner: _stdStr(cl.owner, 120), ver: Number(cl.ver) > 0 ? Number(cl.ver) : 0,
    approvedAt: _stdStr(cl.approvedAt, 40), approvedBy: _stdStr(cl.approvedBy, 120), reviewMonths: months, reviewNext: _stdStr(cl.reviewNext, 10) };
}
/* an ISO day `months` after `iso` (UTC), for the next review */
function stdAddMonths(iso, months){
  const d = new Date(String(iso || '').slice(0, 10) + 'T00:00:00Z');
  if (isNaN(d.getTime())) return '';
  d.setUTCMonth(d.getUTCMonth() + (Number(months) || 12));
  return d.toISOString().slice(0, 10);
}
/* a proposed standard, made safe: everything a person typed, trimmed and capped; null if it has no words to ask */
function stdDraftClean(d, bookKeys){
  d = d || {};
  const ask = _stdStr(d.ask);
  const name = _stdStr(d.name, 120);
  const category = _stdStr(d.category, 80) || name;
  if (!ask || !name) return null;
  const firm = STD_FIRMS.includes(d.firm) ? d.firm : 'push';
  const fallbacks = (Array.isArray(d.fallbacks) ? d.fallbacks : []).map(f => ({ text: _stdStr(f && f.text), who: STD_WHO.includes(f && f.who) ? f.who : 'team' }))
    .filter(f => f.text).slice(0, STD_FALLBACKS_MAX);
  const keys = Array.isArray(bookKeys) ? bookKeys : null;
  let books = (Array.isArray(d.books) ? d.books : []).map(k => String(k)).filter((k, i, a) => a.indexOf(k) === i && (!keys || keys.includes(k)));
  if (!books.length) books = ['_default'];
  return { name, category, ask, fallbacks, never: _stdStr(d.never), why: _stdStr(d.why, STD_WHY_MAX), firm, books,
    ownerId: d.ownerId != null && d.ownerId !== '' ? String(d.ownerId) : '', owner: _stdStr(d.owner, 120),
    reviewMonths: STD_REVIEW_MONTHS.includes(Number(d.reviewMonths)) ? Number(d.reviewMonths) : 12 };
}
/* a fresh clause id for a new standard, never one the library holds */
function stdNewId(lib, name){
  const base = 'cl-' + (_stdStr(name, 40).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'std');
  const have = new Set((lib || []).map(c => String(c && c.id)));
  let id = base, n = 2; while (have.has(id)) id = base + '-' + (n++);
  return id;
}
/* THE ONE APPLIER: an approved change written into copies of the library and the playbook.
   `by` is who said yes, `at` an ISO time. Returns { lib, pb, id } and never touches its arguments. */
function stdChangeApply(lib, pb, change, by, at){
  const L = JSON.parse(JSON.stringify(Array.isArray(lib) ? lib : []));
  const P = JSON.parse(JSON.stringify(pb && typeof pb === 'object' ? pb : {}));
  const d = change && change.draft; if (!d) return { lib: L, pb: P, id: null };
  let i = change.clauseId ? L.findIndex(c => c && String(c.id) === String(change.clauseId)) : -1;
  const was = i >= 0 ? L[i] : null;
  const id = was ? String(was.id) : stdNewId(L, d.name);
  const day = String(at || '').slice(0, 10);
  const cl = Object.assign({}, was || {}, {
    id, name: d.name, category: d.category, preferred: d.ask, guidance: d.why, never: d.never,
    fallbacks: d.fallbacks, fallback: d.fallbacks.length ? d.fallbacks[0].text : '',
    ownerId: d.ownerId, owner: d.owner, reviewMonths: d.reviewMonths,
    ver: (was && Number(was.ver) > 0 ? Number(was.ver) : 1) + 1,
    approvedAt: String(at || ''), approvedBy: _stdStr(by, 120), reviewNext: stdAddMonths(day, d.reviewMonths) });
  if (!was && cl.ver === 2) cl.ver = 1;
  if (i >= 0) L[i] = cl; else L.push(cl);
  /* the books: this standard's entry where it applies, gone where it no longer does */
  const pos = stdPosOfFirm(d.firm);
  for (const [k, b] of Object.entries(P)){
    if (!b || typeof b !== 'object') continue;
    const on = d.books.includes(k);
    let found = false;
    if (Array.isArray(b.ranges)) b.ranges = b.ranges.map(r => {
      if (!_stdEntryHits(cl, r) && !(was && _stdEntryHits(was, r))) return r;
      found = true; return on ? Object.assign({}, r, { firm: d.firm, escalate: pos.escalate }) : null;
    }).filter(Boolean);
    if (!Array.isArray(b.positions)) b.positions = [];
    b.positions = b.positions.map(p => {
      if (!_stdEntryHits(cl, p) && !(was && _stdEntryHits(was, p))) return p;
      found = true; return on ? Object.assign({}, p, { category: d.category, clause: id, firm: d.firm, pos: pos.pos, escalate: pos.escalate }) : null;
    }).filter(Boolean);
    if (on && !found) b.positions.push({ category: d.category, clause: id, firm: d.firm, pos: pos.pos, escalate: pos.escalate });
  }
  return { lib: L, pb: P, id };
}
/* the books' keys a draft may name (the playbook's own) */
function stdBookKeys(pb){ return Object.keys(pb && typeof pb === 'object' ? pb : {}); }
/* standards are GOVERNED once one carries an approved version: from then on only their own route writes them */
function stdGoverned(lib){ return (Array.isArray(lib) ? lib : []).some(c => c && Number(c.ver) > 0 && c.approvedAt); }

const STD_LADDER_API = { STD_FIRMS, STD_WHO, STD_FALLBACKS_MAX, STD_TEXT_MAX, STD_WHY_MAX, STD_REVIEW_MONTHS, STD_CHANGES_KEEP, STD_CHANGE_WHY_MAX, STD_FIRM_RANK,
  stdFirmOfEntry, stdPosOfFirm, stdPlaceOf, stdLadderOf, stdGovOf, stdAddMonths, stdDraftClean, stdNewId, stdChangeApply, stdBookKeys, stdGoverned };
if (typeof window !== 'undefined') Object.assign(window, STD_LADDER_API);
if (typeof module !== 'undefined' && module.exports) Object.assign(module.exports, STD_LADDER_API);
