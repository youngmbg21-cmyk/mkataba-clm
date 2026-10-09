// HaTi — contract families: a master agreement and its amendments.
//
// Globals are window-attached on purpose (single global scope; see core.js).
//
// A real portfolio is one master agreement plus six addenda. Treated as seven
// standalone contracts, HaTi counts seven agreements and pulls the expiry from
// whichever document happened to be filed rather than from the amendment that
// actually changed the term — so both the portfolio count and the renewal
// reminders come out wrong.
//
// Data model, deliberately flat:
//   c.parentId      the agreement this document amends (null for a parent)
//   c.relation      amendment | addendum | variation | renewal | sow | annex | side-letter
//   c.relationNote  free text — what the link is, in a human's words
//
// Maximum depth is ONE. Children cannot have children, and cycles are rejected.
// This is a deliberate simplification: a tree would be more general and much
// harder to reason about in the register, the reminders and the KPIs.

const CONTRACT_RELATIONS = [
  { k:'amendment',   get label(){ return i18t('fa_amendment'); },   get blurb(){ return i18t('fa_amendment_desc'); } },
  { k:'addendum',    get label(){ return i18t('fa_addendum'); },    get blurb(){ return i18t('fa_addendum_desc'); } },
  { k:'variation',   get label(){ return i18t('fa_variation'); },   get blurb(){ return i18t('fa_variation_desc'); } },
  { k:'renewal',     get label(){ return i18t('fa_renewal'); },     get blurb(){ return i18t('fa_renewal_desc'); } },
  { k:'sow',         get label(){ return i18t('fa_sow'); }, get blurb(){ return i18t('fa_sow_desc'); } },
  { k:'annex',       get label(){ return i18t('fa_annex'); },  get blurb(){ return i18t('fa_annex_desc'); } },
  { k:'side-letter', get label(){ return i18t('fa_side_letter'); }, get blurb(){ return i18t('fa_side_letter_desc'); } },
];
/* READ LIVE, NEVER FROZEN AT LOAD. Object.fromEntries INVOKES each getter, so
   this was a snapshot of whatever language was current when the module was
   imported — the getter trap this codebase has met three times, and the reason
   builtinTemplateFields stopped caching. A reader who switched language
   mid-session kept the old word in the family panel and the register until they
   reloaded. Per-key getters keep the RELATION_LABEL[k] shape every caller
   already uses, and answer at the moment they are read. */
const RELATION_LABEL = CONTRACT_RELATIONS.reduce((m,r)=>{
  Object.defineProperty(m, r.k, { enumerable:true, get(){ return r.label; } });
  return m;
}, {});
const isRelation = r => CONTRACT_RELATIONS.some(x=>x.k===r);
/* "a addendum" / "a annex" — the audit line below reads the relation's own
   label, and four of the seven begin with a vowel. A record is read by people. */
const _famAn = w => (/^[aeiou]/i.test(String(w||'').trim()) ? 'an' : 'a');
/* Relations that can move the end of the term. A parent's effective expiry is
   taken from the most recent of these that actually states one. */
const TERM_CHANGING = new Set(['amendment','variation','renewal','addendum']);

const isChild  = c => !!(c && c.parentId);
const isParent = c => !!(c && !c.parentId && familyChildren(c.id).length);

/* ============================================================
   THE PARENT-TO-CHILDREN INDEX (21 Sep 2026, the performance audit's
   one finding)

   familyChildren searched the WHOLE BOOK on every call, and
   effectiveExpiry asks it about twelve times per contract for one
   paint — so a page of N contracts cost N x N x 12 comparisons.
   MEASURED on a real browser at 3,000 contracts: 108 MILLION list
   touches to draw Home once, 99.5% of them here, and one pass of
   "find every contract's children" at 124 ms against 1 ms answered
   from a map.

   THE CHECK HAS TO BE O(1), AND THE FIRST BUILD OF THIS GOT IT
   WRONG: it verified the index with a checksum over every
   contract's parentId, which is itself a full pass, so each call
   cost MORE than the scan it replaced. Measured, that build took
   Home at 3,000 from 1,035 ms to 3,442. A guard that walks the
   book is not a guard, it is the bug again.

   So the guard is three O(1) facts — the same array object, the
   same length, and a STAMP — and the stamp is what makes it
   honest. `familyIndexDirty()` is the one way to raise it, and it
   is called wherever a parentId is written or a contract object is
   swapped in place. f357 greps for a writer that forgot.

   familyChildren returns the index's OWN array, so no caller may
   mutate what it hands back; the one caller that sorts already
   takes a .slice() first (checked, all nine sites). */
let _famIdx = null, _famSrc = null, _famLen = -1, _famStamp = 0;
let _famDirty = 1;
/* Raise the stamp: the index is rebuilt on the next reading. */
function familyIndexDirty(){ _famDirty = (_famDirty + 1) | 0; return _famDirty; }
function familyIndex(){
  const cs = (typeof state!=='undefined' && state && Array.isArray(state.contracts)) ? state.contracts : [];
  if(_famIdx && cs === _famSrc && cs.length === _famLen && _famDirty === _famStamp) return _famIdx;
  const m = new Map();
  for(let i=0;i<cs.length;i++){
    const c = cs[i];
    if(!c || !c.parentId) continue;
    const k = String(c.parentId);
    const a = m.get(k);
    if(a) a.push(c); else m.set(k,[c]);
  }
  _famIdx = m; _famSrc = cs; _famLen = cs.length; _famStamp = _famDirty;
  return m;
}
/* One frozen empty array for every childless contract — the common case, and
   the one that used to cost a full scan. Frozen because it is shared. */
const FAM_NONE = Object.freeze([]);
const familyChildren = id => familyIndex().get(String(id)) || FAM_NONE;
const familyParent = c => (c && c.parentId) ? getContract(c.parentId) : null;
/* The whole family, parent first. A standalone contract is a family of one. */
function familyOf(c){
  if(!c) return [];
  const head = c.parentId ? (getContract(c.parentId)||c) : c;
  return [head, ...familyChildren(head.id)];
}

/* ---------- linking rules ----------
   Returns an error string, or null when the link is allowed. */
function linkError(child, parentId){
  if(!child) return 'No contract to link.';
  if(!parentId) return 'Choose a parent agreement.';
  if(parentId===child.id) return 'A contract cannot be its own parent.';
  const parent=getContract(parentId);
  if(!parent) return 'That parent agreement no longer exists.';
  if(parent.parentId) return `${(window.contractRef?contractRef(parent):parent.id)} is itself an amendment of ${(window.contractRef?contractRef(getContract(parent.parentId)||{id:parent.parentId}):parent.parentId)}. Link to the master agreement instead — HaTi keeps families one level deep on purpose.`;
  if(familyChildren(child.id).length) return `${(window.contractRef?contractRef(child):child.id)} already has ${familyChildren(child.id).length} amendment(s) of its own, so it is a master agreement. Move those first if it should become an amendment.`;
  return null;
}
/* Apply the link to a contract object (does NOT persist — callers do, so this
   works both on a contract being built during import and on a saved one). */
function applyParentLink(c, parentId, relation, note, actor){
  c.parentId = parentId;
  familyIndexDirty();
  c.relation = isRelation(relation) ? relation : 'amendment';
  if(note!=null) c.relationNote = String(note);
  const who = (actor && actor.name) || currentUser()?.name || 'System';
  c.audit = c.audit || [];
  /* THE RECORD KEEPS ENGLISH (launch audit, 21 Aug 2026). This read
     RELATION_LABEL — the SCREEN's word, which follows the reader — so a member
     working in Swedish wrote "Filed as a ändringsavtal of MK-P1" into the audit
     trail: a permanent record in two languages, with the English a/an article
     computed over a Swedish noun, sitting next to the "Created" line from the
     same act which correctly stayed English. The audit trail is shown
     identically to every reader whatever language they read the app in, which is
     exactly why the rulebook's rule is that a label which is also a RECORD keeps
     English. RELATION_DOC_WORD is that word, and its own comment three hundred
     lines down already said this line should have been using it. */
  const word=(RELATION_DOC_WORD[c.relation]||'Amendment').toLowerCase();
  c.audit.push({ at:nowISO(), user:who, action:'Linked',
    detail:`Filed as ${_famAn(word)} ${word} of ${parentId}${note?` — ${note}`:''}` });
  return c;
}
/* Undo a link. */
function clearParentLink(c, actor){
  const was=c.parentId;
  delete c.parentId; delete c.relation; delete c.relationNote;
  familyIndexDirty();
  c.audit=c.audit||[];
  c.audit.push({ at:nowISO(), user:(actor&&actor.name)||currentUser()?.name||'System', action:'Unlinked',
    detail:`No longer filed as an amendment of ${was} — recorded as a standalone agreement` });
  return c;
}

/* ---------- family-aware term resolution ----------
   THE point of the whole task. A master agreement's real end date is whatever
   the most recent amendment that changed the term says it is — not whatever was
   typed on the master. Every consumer of an expiry date must go through here:
   the renewal reminders, contractRisk, the Home attention snapshot, the
   Register, the Calendar and Reports. A partial rollout leaves the reminders
   wrong, which is the defect this exists to fix. */
/* NORMALISED HERE, because here is where everything reads it.

   The header above says every consumer must come through this funnel, and they
   do — and the funnel was handing out whatever was typed. A migration that
   filed "30 September 2026" therefore reached the Register as `new Date(…)`
   Invalid, and the expiry column on an otherwise ordinary row printed the words
   "Invalid Date". Everywhere the value met `daysUntil` it became NaN instead,
   and NaN compares false against everything: the contract fell out of Home's
   expiring-in-30/60/90 buckets, out of the twelve-month renewal pipeline in
   Reports, and sorted behind contracts with no expiry at all.

   dateOnly() is the same normaliser the renewal decision and the calendar grid
   already use, so all of them are now working on one value. Null — "we do not
   know when this ends" — is a real answer that every caller here handles. */
const ownExpiry = c => (window.dateOnly
  ? dateOnly(c && ((c.metadata&&c.metadata.expiryDate) || c.expiry))
  : ((c && ((c.metadata&&c.metadata.expiryDate) || c.expiry)) || null));
/* When an amendment took effect — used to order them. Falls back through the
   dates a migrated document actually tends to carry. */
const amendmentDate = c => (c&&((c.metadata&&c.metadata.effectiveDate) || (c.fields&&c.fields.effDate) ||
  (typeof window.contractSignedAt==='function'&&contractSignedAt(c)) || (c.migration&&c.migration.importedAt&&String(c.migration.importedAt).slice(0,10)))) || '';
/* ---- ONLY A SIGNED AMENDMENT MOVES THE LIVE DATE (owner-ruled 14 Aug 2026) ----
   This counted any non-Declined child, so typing a new end date into a DRAFT
   amendment moved the master agreement's live expiry — and its renewal
   reminder — before anybody had signed anything. The behaviour was deliberate
   and documented; the audit put it to the owner as legal risk and the owner
   ruled against it.

   THE REASON IS THAT AN UNSIGNED AMENDMENT HAS NO EFFECT. Somebody reading
   that date and deciding not to serve a renewal notice has taken a costly
   decision on a term that does not yet exist. A renewal reminder is exactly
   the kind of thing acted on without re-checking why it says what it says.

   AND THE OLD BEHAVIOUR IS NOT SIMPLY DELETED — the reason for it was real.
   proposedExpiry below is the other half: the draft's proposal is still known,
   still shown, and stated BESIDE the live date rather than replacing it, so
   "ends 30 June 2027 · a draft amendment proposes 31 December 2029" is what a
   reader sees while the term is being negotiated. Nothing acts on the
   proposal; everything acts on the live date.

   EXECUTED, NOT MERELY 'Signed'. A document carrying a seal or an execution
   stamp is executed whatever its status field says — the same three signals
   negoExecuted and the server's isExecutedRow read, and reducing this to the
   status alone is the narrowing both of those exist to prevent. */
const amendmentExecuted = k => !!(k && (k.status==='Signed' || k.hash || (k.execution && k.execution.at)));
const _termKids = c => familyChildren(c.id)
  .filter(k=>k.status!=='Declined' && TERM_CHANGING.has(k.relation) && ownExpiry(k));
/* most recent amendment that actually states a term wins */
const _latestTerm = kids => { if(!kids.length) return null;
  const s=kids.slice().sort((a,b)=> String(amendmentDate(a)).localeCompare(String(amendmentDate(b))) ||
                    String(ownExpiry(a)).localeCompare(String(ownExpiry(b))));
  return s[s.length-1]; };
function effectiveExpiry(c){
  if(!c) return null;
  if(c.parentId) return ownExpiry(c);          // a child speaks only for itself
  const signed=_termKids(c).filter(amendmentExecuted);
  const win=_latestTerm(signed);
  const base = win ? ownExpiry(win) : ownExpiry(c);
  /* …and an automatic renewal the server recorded with its new end date (B15) */
  const ar=(Array.isArray(c.autoRenewed)?c.autoRenewed:[]).filter(x=>x&&x.to).map(x=>String(x.to).slice(0,10)).sort().pop();
  return (ar && (!base || ar > base)) ? ar : base;
}
/* WHICH SIGNED AMENDMENT SET THE LIVE END DATE (B13, 8 Oct 2026) — the same
   reading as effectiveExpiry, with its document, so the Overview's own expiry
   cell can say "as amended by <ref>" instead of printing the stored date
   beside a family card that says otherwise. Null where the agreement's own
   date stands. */
function effectiveExpiryFrom(c){
  if(!c || c.parentId) return null;
  let win = null;
  try{ win = _latestTerm(_termKids(c).filter(amendmentExecuted)); }catch(_){ win = null; }
  if(!win) return null;
  const date = ownExpiry(win);
  return (date && date !== ownExpiry(c)) ? { date, from:win } : null;
}
/* What a DRAFT amendment is asking the term to become, and which document is
   asking. Null where nothing unsigned proposes a different date — so a screen
   can draw the sentence only when there is one, and an always-on line never
   becomes furniture. Never contradicts effectiveExpiry: it is the proposal,
   said as a proposal. */
function proposedExpiry(c){
  if(!c || c.parentId) return null;
  const unsigned=_termKids(c).filter(k=>!amendmentExecuted(k));
  const win=_latestTerm(unsigned);
  if(!win) return null;
  const date=ownExpiry(win);
  if(!date || date===effectiveExpiry(c)) return null;   // proposing what already stands is not a proposal
  return { date, from:win, id:win.id };
}
/* ---- THE DEAL AS AMENDED: VALUE, PAYMENT TERMS, NOTICE (7 Oct 2026, O-16) ----
   effectiveExpiry's rule, for three more facts: the latest EXECUTED child that
   states the fact wins, otherwise the agreement's own. A READING ONLY: the
   parent's stored value is never rewritten, so the original figure stays in
   its history and the moment an amendment is unsigned or declined the reading
   goes back by itself. Returns { v, from } where `from` is the child that set
   it (null when the agreement's own figure stands). */
const EFFECTIVE_TERMS = {
  value:   x => (Number(x && x.value) > 0 ? Number(x.value) : null),
  payment: x => (String((x && x.metadata && x.metadata.paymentTerms) || '').trim() || null),
  notice:  x => { const n = Number(x && x.metadata && x.metadata.noticePeriodDays); return isFinite(n) && n > 0 ? n : null; },
};
/* ---- A VALUE THE AMENDMENT DID NOT CHANGE IS NOT ITS VALUE (B12, 8 Oct
   2026) ----
   A term-only amendment was held for "no value" and the figure typed to get
   past it became the deal's value. A child's value is the deal's only where
   the amendment SAYS it moves the money: Copilot read a value off what the
   person asked for (amendFacts), or a person set it on the amendment itself
   (valueSetHere, stamped by the Overview's value box). */
function amendSetsValue(k){
  return Number(k && k.value) > 0 && !!(k.valueSetHere || (k.amendFacts && Number(k.amendFacts.value) > 0));
}
function effectiveTerm(c, key){
  const read = EFFECTIVE_TERMS[key];
  if(!c || !read) return { v:null, from:null };
  if(c.parentId) return { v:read(c), from:null };
  let kids = [];
  try{ kids = familyChildren(c.id).filter(k => k.status !== 'Declined' && amendmentExecuted(k) && read(k) != null
    && (key !== 'value' || amendSetsValue(k))); }catch(_){ kids = []; }
  if(!kids.length) return { v:read(c), from:null };
  const win = kids.slice().sort((a, b) => String(amendmentDate(a)).localeCompare(String(amendmentDate(b))))[kids.length - 1];
  const v = read(win);
  return (v != null && v !== read(c)) ? { v, from:win } : { v:read(c), from:null };
}
/* The same contract wearing its effective value, for a printer that reads
   c.value (fmtMoneyOf, fmtMoneyShortOf): a copy, never the record. */
function effectiveValueView(c){
  const e = effectiveTerm(c, 'value');
  return (e.from && e.v != null) ? { ...c, value:e.v } : c;
}
/* ---- READ THE AGREEMENT AS AMENDED (7 Oct 2026, O-17) ----
   The original's clauses with every SIGNED amendment's items applied, each
   change marked (struck and inserted words) and labelled with the amendment it
   came from. A reading copy only: it writes nothing and says plainly that the
   signed originals are what bind. Where an item cannot be placed (its clause
   changed shape since), it is drawn after the clause rather than guessed into
   it. Null when there is nothing signed to apply. */
function asAmendedItems(c){
  if(!c || c.parentId) return [];
  let kids = [];
  try{ kids = familyChildren(c.id).filter(k => k.status !== 'Declined' && amendmentExecuted(k) && Array.isArray(k.amends) && k.amends.length); }catch(_){ kids = []; }
  kids.sort((a, b) => String(amendmentDate(a)).localeCompare(String(amendmentDate(b))));
  const out = [];
  kids.forEach(k => k.amends.forEach(it => out.push({ ...it, from:k })));
  return out;
}
function asAmendedHtml(c){
  const items = asAmendedItems(c);
  if(!items.length) return null;
  const cls = amendParentClauses(c);
  const esc = _famEsc;
  const diff = (a, b) => (window.wordDiff ? wordDiff(a, b) : [{ t:'del', text:a }, { t:'add', text:b }]).map(p =>
    p.t === 'eq' ? esc(p.text) : p.t === 'add' ? `<ins class="am-ins">${esc(p.text)}</ins>` : `<del class="am-del">${esc(p.text)}</del>`).join('');
  const tag = k => `<span class="am-tag">${esc(k.name || (window.contractRef ? contractRef(k) : k.id))}</span>`;
  const used = new Set();
  const matchOf = cl => items.filter((it, i) => !used.has(i) && it.op !== 'insert' && (
    (it.clauseId && cl.id && it.clauseId === cl.id) || (it.clauseNumber && cl.num && String(it.clauseNumber) === String(cl.num))
    || (!it.clauseId && !it.clauseNumber && it.clauseLabel && it.clauseLabel === cl.label)));
  const body = cls.map(cl => {
    const hits = matchOf(cl);
    hits.forEach(h => used.add(items.indexOf(h)));
    let text = esc(cl.text);
    let tags = '';
    hits.forEach(h => {
      if(h.op === 'delete'){ text = `<del class="am-del">${esc(cl.text)}</del>`; }
      else text = diff(cl.text, h.amended || cl.text);
      tags += tag(h.from);
    });
    return `<h4 class="am-h">${esc(cl.label)}</h4><p class="am-p">${text}${tags}</p>`;
  }).join('');
  const rest = items.filter((it, i) => !used.has(i)).map(it =>
    `<h4 class="am-h">${esc(it.clauseLabel || i18t('fa_new_clause'))}</h4><p class="am-p"><ins class="am-ins">${esc(it.amended || '')}</ins>${tag(it.from)}</p>`).join('');
  return `<div class="am-read">${body}${rest}<p class="am-foot">${esc(i18t('fa_as_amended_foot'))}</p></div>`;
}
/* Which contract supplied the effective expiry — so the UI can say "expiry from
   MK-123 (Amendment No. 2)" instead of quietly showing a different date. */
/* ============================================================
   DOES THIS DOCUMENT AGREE WITH THE ONE ABOVE IT? (S12,
   owner-approved 16 Sep 2026)

   A family is only worth drawing if it answers the question a
   reader actually has about it: does the amendment change the deal,
   and if so what. That is ARITHMETIC ON THE RECORD, not a reading of
   the wording — both documents carry metadata, so a term the child
   states differently from its parent is a fact HaTi already holds.

   IT NEVER GUESSES. A term the child says nothing about is not a
   disagreement; a term neither of them records is not an agreement
   either, and `checked` says how many were actually comparable. The
   sentence a screen prints is `familyAgreeLine`, and where nothing
   could be compared it says so rather than printing "Agrees".

   WHAT IS DELIBERATELY NOT HERE: a reading of the two WORDINGS for
   contradictions the record cannot see. That needs a model, a route
   and a cache, and it is the owner's to rule on. This is the half
   that costs nothing and is right every time.
   ============================================================ */
const FAMILY_TERMS = [
  { k:'value',      get label(){ return i18t('fa_t_value'); },   read:c=>(Number(c&&c.value)>0?String(Number(c.value)):'') },
  { k:'expiry',     get label(){ return i18t('fa_t_expiry'); },  read:c=>String((c&&c.expiry)||(c&&c.metadata&&c.metadata.expiryDate)||'') },
  { k:'payment',    get label(){ return i18t('fa_t_payment'); }, read:c=>String((c&&c.metadata&&c.metadata.paymentTerms)||'').trim() },
  { k:'notice',     get label(){ return i18t('fa_t_notice'); },  read:c=>{ const n=Number(c&&c.metadata&&c.metadata.noticePeriodDays); return isFinite(n)&&n>0?String(n):''; } },
  { k:'liability',  get label(){ return i18t('fa_t_liability'); },read:c=>String((c&&c.metadata&&c.metadata.liabilityCapped)||'').trim() },
  { k:'rebate',     get label(){ return i18t('fa_t_rebate'); },  read:c=>String((c&&c.metadata&&c.metadata.volumeRebate)||'').trim() },
];
function familyAgreement(parent, child){
  const moved=[], checked=[];
  if(!parent||!child) return { moved, checked, comparable:0 };
  for(const t of FAMILY_TERMS){
    const a=t.read(parent), b=t.read(child);
    if(!b) continue;                       // the child says nothing: not a move
    checked.push(t.k);
    if(!a) continue;                       // the parent says nothing: nothing to disagree with
    if(String(a)!==String(b)) moved.push(t);
  }
  return { moved, checked, comparable:checked.length };
}
/* What a row prints: the terms this document moves, or that it moves none, or
   that there was nothing on either record to compare. */
function familyAgreeLine(parent, child){
  const a=familyAgreement(parent, child);
  if(!a.comparable) return i18t('fa_agree_unknown');
  if(!a.moved.length) return i18t('fa_agree_yes');
  return i18t('fa_agree_moves', { terms:a.moved.map(t=>String(t.label).toLowerCase()).join(', ') });
}
/* ---- WHICH DOCUMENT WINS WHERE THEY DISAGREE (S12) ----
   The artifact asks Related agreements for "parent, amendments, order forms,
   and which document wins where they disagree". That order is not a judgement
   and nothing here invents one: a signed amendment displaces the parent for
   the terms it moves, and where two amendments move the same term the later
   one stands. So the order is the parent, then the EXECUTED children oldest
   first -- and an unsigned child is on the list saying it changes nothing yet,
   because a draft amendment beats nothing at all.
   IT SPENDS NOTHING AND WRITES NOTHING. `contractSignedAt` is the product's
   one reading of when a document was executed, asked through window. */
function familyOrder(c){
  const head=(c&&c.parentId)?familyParent(c):c;
  if(!head) return [];
  const when=x=>{ try{ return (window.contractSignedAt&&contractSignedAt(x))||''; }catch(_){ return ''; } };
  const kids=familyChildren(head.id).slice().sort((a,b)=>{
    const A=when(a), B=when(b);
    if(A&&B) return A<B?-1:A>B?1:0;
    if(A) return -1; if(B) return 1;
    return String(a.id)<String(b.id)?-1:1;
  });
  return [{ doc:head, role:'parent', signed:when(head) }]
    .concat(kids.map(k=>({ doc:k, role:'amendment', signed:when(k) })));
}
/* THE WHOLE FAMILY IN ONE READING: every child measured against the parent by
   familyAgreement -- the SAME reading each row already prints, so the button
   and the rows can never disagree -- plus which document each moved term ends
   up governed by, which is simply the last one on the order that moved it. */
function familyCheck(c){
  const order=familyOrder(c);
  if(order.length<2) return { order, rows:[], moved:[], unsigned:[], comparable:0 };
  const parent=order[0].doc;
  const rows=order.slice(1).map(e=>{
    const a=familyAgreement(parent, e.doc);
    return { id:e.doc.id, ref:(window.contractRef?contractRef(e.doc):e.doc.id), name:e.doc.name, signed:e.signed,
      moved:a.moved.map(t=>({ k:t.k, label:t.label })), comparable:a.comparable };
  });
  /* WHO GOVERNS EACH MOVED TERM: walked in order, so the last document to
     move a term is the one that holds it. An unsigned document is named but
     does not take the term -- it has not displaced anything yet. */
  const holder=new Map();
  rows.forEach(r=>{ if(!r.signed) return; r.moved.forEach(m=>holder.set(m.k,{ label:m.label, id:r.id, ref:r.ref })); });
  return { order, rows,
    moved:[...holder.entries()].map(([k,v])=>({ k, label:v.label, id:v.id, ref:v.ref })),
    unsigned:rows.filter(r=>!r.signed).map(r=>r.id),
    comparable:rows.reduce((n,r)=>n+r.comparable,0) };
}
function expirySource(c){
  if(!c || c.parentId) return null;
  const eff=effectiveExpiry(c);
  if(!eff || eff===ownExpiry(c)) return null;
  return familyChildren(c.id).find(k=>ownExpiry(k)===eff) || null;
}

/* ---------- family-aware counting ----------
   KPIs count AGREEMENTS (parents + standalones), not files. Both numbers are
   shown, because "312 agreements · 418 documents" is the honest statement and
   either number alone is misleading. */
const isAgreement = c => !c.parentId;
const agreementsIn = list => (list||state.contracts).filter(isAgreement);
function familyCounts(list){
  const cs=list||state.contracts;
  const documents=cs.length;
  const agreements=cs.filter(isAgreement).length;
  return { agreements, documents, amendments: documents-agreements };
}
const familyCountLabel = list => { const k=familyCounts(list);
  return k.amendments
    ? `${k.agreements.toLocaleString(jxLocale())} agreement${k.agreements===1?'':'s'} · ${k.documents.toLocaleString(jxLocale())} documents`
    : `${k.documents.toLocaleString(jxLocale())} contract${k.documents===1?'':'s'}`; };

/* ---------- suggest, never auto-link ----------
   At import we PROPOSE a parent when the filename or the opening text reads
   like an amendment AND the normalised counterparty matches an existing
   contract. A human confirms on the review screen; the suggestion and the
   decision are logged separately, so the audit trail never claims a person
   confirmed something the machine guessed. */
const AMENDMENT_RE = /amendment|addendum|variation|annex|schedule \d|side letter|renewal of|supplemental/i;
function looksLikeAmendment(fileName, text){
  const head=String(text||'').slice(0,4000);
  return AMENDMENT_RE.test(String(fileName||'')) || AMENDMENT_RE.test(head);
}
/* Which relation the wording suggests. Defaults to 'amendment'. */
function guessRelation(fileName, text){
  const s=(String(fileName||'')+' '+String(text||'').slice(0,2000)).toLowerCase();
  if(/side letter/.test(s)) return 'side-letter';
  if(/statement of work|\bsow\b/.test(s)) return 'sow';
  if(/renewal of|renewal agreement/.test(s)) return 'renewal';
  if(/variation/.test(s)) return 'variation';
  if(/annex|schedule \d/.test(s)) return 'annex';
  if(/addendum|supplemental/.test(s)) return 'addendum';
  return 'amendment';
}
/* Rank candidate parents. Signals, in order of weight:
     - the opening recitals name the parent's agreement name or a date it carries
     - SimHash similarity to the candidate parent (reuses Task 5's signal)
     - the parent is the more established record (earlier, executed)
   Returns [{ id, score, why }], best first, or [] when nothing matches. */
function suggestParents(cand, opts={}){
  const cp=normParty(cand.counterparty);
  if(!cp) return [];
  const head=String(cand.text||'').slice(0,4000).toLowerCase();
  const out=[];
  for(const c of state.contracts){
    if(c.id===cand.excludeId) continue;
    if(c.parentId) continue;                       // depth one — never a child
    if(normParty(c.counterparty)!==cp) continue;
    let score=0; const why=[];
    const d=hamming64(cand.simhash, (c.upload&&c.upload.simhash)||null);
    if(d<=SIMHASH_RELATED){ score += (SIMHASH_RELATED-d)*4; why.push(`closely related text (distance ${d})`); }
    const nm=String(c.name||'').toLowerCase().replace(/\s*\(draft\)\s*$/,'').trim();
    if(nm.length>8 && head.includes(nm)){ score+=40; why.push('the recitals name this agreement'); }
    for(const dt of [c.expiry, (c.metadata&&c.metadata.effectiveDate), (c.fields&&c.fields.effDate)]){
      if(dt && head.includes(String(dt))){ score+=25; why.push(`the recitals cite ${dt}`); break; }
    }
    if(c.status==='Signed'){ score+=6; why.push('executed'); }
    if(!score) score=1, why.push('same counterparty');
    out.push({ id:c.id, name:c.name, score, why:why.join(' · ') });
  }
  out.sort((a,b)=>b.score-a.score);
  return out.slice(0, opts.max||4);
}
/* Record that the machine proposed a link — separately from a human accepting
   or rejecting it. */
function logLinkSuggestion(c, suggestions){
  if(!suggestions||!suggestions.length) return;
  c.audit=c.audit||[];
  c.audit.push({ at:nowISO(), user:'System', action:'Link suggested',
    detail:`Reads like an amendment; proposed parent${suggestions.length===1?'':'s'}: `+
      suggestions.map(s=>`${s.id} (${s.why})`).join('; ')+'. Not linked — awaiting a human decision.' });
  c.linkSuggestions=suggestions.map(s=>({ id:s.id, why:s.why }));
}
function logLinkDecision(c, accepted, parentId){
  c.audit=c.audit||[];
  c.audit.push({ at:nowISO(), user:currentUser()?.name||'System', action:'Link decision',
    detail: accepted ? `Confirmed as an amendment of ${parentId}` : 'Confirmed as a standalone agreement — the suggested link was rejected' });
  c.linkConfirmed=true;
  if(!accepted) c.linkSuggestions=null;
}

/* ---------- manual linking ----------
   "Link to a parent agreement" from any contract workspace, and the reverse
   ("Add an amendment") from a parent. One modal serves both directions. */
const _famEsc = s => String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
const _famAttr = s => String(s==null?'':s).replace(/"/g,'&quot;');
function openLinkModal(c, onDone, opts={}){
  if(!canEdit()){ toast(i18t('fa_viewers_no_change'),'err'); return; }
  // `mode` is 'child' (pick a parent for c) or 'parent' (pick a child to attach to c)
  const mode = opts.mode || (c.parentId ? 'child' : 'child');
  const suggested = (c.linkSuggestions||[]).map(s=>({ ...s, c:getContract(s.id) })).filter(x=>x.c);
  const relSel = `<select id="lk-rel" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)">
      ${CONTRACT_RELATIONS.map(r=>`<option value="${r.k}" ${(c.relationGuess||c.relation||'amendment')===r.k?'selected':''}>${r.label} — ${r.blurb}</option>`).join('')}</select>`;
  const candidates = state.contracts.filter(x=>x.id!==c.id && (mode==='child' ? !x.parentId : (!x.parentId||x.parentId===c.id)));
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:6px"><span style="color:var(--color-accent)">${icon('link','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-page);margin:0">${mode==='child'?i18t('fa_link_parent'):i18t('fa_link_existing')}</h3></div>
      <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 var(--s-3);line-height:1.55">${mode==='child'
        ? i18t('fa_link_parent_sub')
        : `Attach an existing document to <b>${_famEsc(window.contractRef?contractRef(c):c.id)}</b> as an amendment. Families are one level deep: an amendment cannot itself have amendments.`}</p>
      ${suggested.length?`<div style="border:1px solid var(--color-divider);background:var(--st-steel-bg);border-radius:var(--radius);padding:9px 11px;margin-bottom:var(--s-3)">
        <div style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--accent-ink);margin-bottom:5px">${i18t('fa_hati_suggests')}</div>
        ${suggested.map(x=>`<label style="display:flex;align-items:flex-start;gap:var(--s-2);font-size:var(--t-meta);padding:3px 0;cursor:pointer">
          <input type="radio" name="lk-sug" value="${_famAttr(x.id)}" style="margin-top:3px;accent-color:var(--color-accent)"/>
          <span><b class="hati-ref">${_famEsc(window.contractRef?contractRef(x.c):x.id)}</b> ${_famEsc(x.c.name)}
          <span style="display:block;color:var(--color-neutral-600)">${_famEsc(x.why||'')}</span></span></label>`).join('')}
      </div>`:''}
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${mode==='child'?'Parent agreement':'Document to attach'}</span>
        <input id="lk-search" placeholder="${i18t('fa_search_register')}" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);font:inherit;outline:none;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)"/>
        <div id="lk-results" class="scroll-thin" style="max-height:180px;overflow-y:auto;border:1px solid var(--color-divider);border-top:0;border-radius:var(--radius)"></div></label>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('fa_relationship')}</span>${relSel}</label>
      <label style="display:block;margin-bottom:14px"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('fa_note_optional')}</span>
        <input id="lk-note" placeholder="${_famEsc(i18t('fa_ph_link_note'))}" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);font:inherit;outline:none;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)"/></label>
      <div id="lk-err" style="font-size:var(--t-label);color:var(--st-ruby-fg);min-height:15px;margin-bottom:var(--s-2)"></div>
      <div style="display:flex;justify-content:flex-end;gap:var(--s-2)">
        ${(mode==='child'&&suggested.length)?`<button id="lk-standalone" class="ui-btn">${i18t('fa_standalone')}</button>`:''}
        <button id="lk-cancel" class="ui-btn">${i18t('act_cancel')}</button>
        <button id="lk-save" class="ui-btn ui-btn-primary">${mode==='child'?'Link':'Attach'}</button>
      </div>
    </div>`, {maxWidth:'560px'});

  let picked=null;
  const results=document.getElementById('lk-results');
  const draw=(q)=>{
    const t=String(q||'').toLowerCase();
    const list=candidates.filter(x=>!t || (x.name+' '+(x.counterparty||'')+' '+x.id+' '+(x.contractNo||'')).toLowerCase().includes(t)).slice(0,40);
    results.innerHTML=list.length?list.map(x=>`<button type="button" data-lk-pick="${_famAttr(x.id)}" style="display:flex;width:100%;gap:var(--s-2);align-items:baseline;text-align:left;border:0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent);background:${picked===x.id?'var(--color-accent-100)':'none'};padding:6px 9px;cursor:pointer;font:inherit;font-size:var(--t-meta)">
        <b class="hati-ref" style="flex:none">${_famEsc(window.contractRef?contractRef(x):x.id)}</b>
        <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_famEsc(x.name)}</span>
        <span style="flex:none;color:var(--color-neutral-600)">${_famEsc(x.counterparty||'')}</span></button>`).join('')
      :`<div style="padding:var(--s-2) 9px;font-size:var(--t-meta);color:var(--color-neutral-600)">${i18t('fa_no_matching')}</div>`;
    results.querySelectorAll('[data-lk-pick]').forEach(b=>b.addEventListener('click',()=>{ picked=b.getAttribute('data-lk-pick'); draw(document.getElementById('lk-search').value); }));
  };
  draw('');
  document.getElementById('lk-search').addEventListener('input',e=>draw(e.target.value));
  document.querySelectorAll('input[name="lk-sug"]').forEach(r=>r.addEventListener('change',()=>{ picked=r.value; draw(document.getElementById('lk-search').value); }));
  document.getElementById('lk-cancel').addEventListener('click',closeModal);
  document.getElementById('lk-standalone')?.addEventListener('click',()=>{
    logLinkDecision(c, false); persist(c); closeModal();
    toast(`${(window.contractRef?contractRef(c):c.id)} confirmed as a standalone agreement`); if(onDone) onDone();
  });
  document.getElementById('lk-save').addEventListener('click',()=>{
    const err=document.getElementById('lk-err');
    if(!picked){ err.textContent='Pick a contract first.'; return; }
    const child = mode==='child' ? c : getContract(picked);
    const parentId = mode==='child' ? picked : c.id;
    const problem=linkError(child, parentId);
    if(problem){ err.textContent=problem; return; }
    applyParentLink(child, parentId, document.getElementById('lk-rel').value, document.getElementById('lk-note').value.trim());
    logLinkDecision(child, true, parentId);
    persist(child);
    const parent=getContract(parentId); if(parent) persist(parent);
    closeModal();
    const w=RELATION_LABEL[child.relation].toLowerCase();
    toast(`${(window.contractRef?contractRef(child):child.id)} filed as ${_famAn(w)} ${w} of ${(window.contractRef&&parent?contractRef(parent):parentId)}`);
    if(onDone) onDone(); else if(typeof setView==='function') setView(state.view||'workspace');
  });
}
/* ---------- the family panel on a contract workspace ----------
   Shows where this document sits, which amendment set the live term, and both
   directions of the manual link. */
/* `opts.bare` drops the card's own head row, for the Overview's Related
   agreements section, which already carries the name (16 Sep 2026). The acts
   and every row are untouched; a caller that passes nothing gets exactly the
   card this function has always drawn. */
/* WHICH DOCUMENT WINS, said in one line above the list. It states the RULE and
   names the documents in force; it does not restate each row's own moves,
   which the rows print themselves. Nothing here is drawn on a lone agreement:
   a precedence order over one document is a sentence about nothing. */
function familyPrecedenceLineHtml(c){
  let k; try{ k=familyCheck(c); }catch(_){ return ''; }
  if(!k||k.order.length<2) return '';
  const names=k.moved.map(m=>`<b>${_famEsc(m.ref||m.id)}</b> ${_famEsc(String(m.label).toLowerCase())}`);
  const rule=i18t('fa_prec_rule');
  const holds=names.length?` ${i18t('fa_prec_holds')} ${names.join(', ')}.`:` ${i18t('fa_prec_none')}`;
  return `<p class="fam-prec" style="font-size:var(--t-meta);color:var(--color-neutral-700);margin:0 0 var(--s-2);line-height:1.55">${rule}${holds}</p>`;
}
/* THE REPORT. Deterministic, off the record, no model and no route: it is the
   rows' own reading gathered in one place, which is what makes it safe to call
   a check. A term nobody moved is not mentioned — the answer to "does this
   family agree" is a list of disagreements, and an empty list is the good
   answer said in words. */
function familyCheckReport(c){
  const k=familyCheck(c);
  if(!k||k.order.length<2) return i18t('fa_check_alone');
  const out=[];
  k.rows.forEach(r=>{
    const when=r.signed?'':` (${i18t('fa_check_unsigned')})`;
    out.push(r.moved.length
      ? `${r.ref||r.id}${when} — ${i18t('fa_agree_moves',{ terms:r.moved.map(m=>String(m.label).toLowerCase()).join(', ') })}`
      : `${r.ref||r.id}${when} — ${r.comparable?i18t('fa_agree_yes'):i18t('fa_agree_unknown')}`);
  });
  if(k.moved.length) out.push('', i18t('fa_check_inforce') + ' ' +
    k.moved.map(m=>`${String(m.label).toLowerCase()} → ${m.ref||m.id}`).join(', '));
  return out.join('\n');
}
function renderFamilySection(c,opts){
  const bare=!!(opts&&opts.bare);
  const host=document.getElementById('family-section'); if(!host) return;
  if(!c){ host.innerHTML=''; return; }
  const kids=familyChildren(c.id), parent=familyParent(c);
  const suggested=(c.linkSuggestions||[]).filter(s=>getContract(s.id));
  const eff=effectiveExpiry(c), from=expirySource(c), prop=proposedExpiry(c);
  const btn='font:inherit;font-size:var(--t-meta);font-weight:var(--w-strong);border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:5px 11px;cursor:pointer';
  /* ---- WHEN IT WAS SIGNED, AND WHETHER IT AGREES (S12) ----
     The row carried the document's name and its kind. It says two more things
     now, both off the record: the day it was signed (the product's own one
     reading, `contractSignedLabel`, asked through window because this module
     runs on stages that do not carry core.js) and what it MOVES against the
     document above it. A parent row is not compared with itself. */
  const signed=x=>{ try{ return (window.contractSignedLabel&&contractSignedLabel(x))||''; }catch(_){ return ''; } };
  const row=(x,note,against)=>`<button type="button" data-fam-open="${_famAttr(x.id)}" style="display:flex;width:100%;gap:var(--s-2);align-items:baseline;text-align:left;border:0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 7%,transparent);background:none;padding:6px 0;cursor:pointer;font:inherit;font-size:var(--t-meta);color:inherit">
      <b class="hati-ref" style="font-size:var(--t-label);color:var(--accent-ink-700);flex:none">${_famEsc(window.contractRef?contractRef(x):x.id)}</b>
      <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_famEsc(x.name)}</span>
      ${signed(x)?`<span style="flex:none;font-size:var(--t-label);color:var(--color-neutral-600)">${_famEsc(signed(x))}</span>`:''}
      ${against?`<span style="flex:none;font-size:var(--t-label);color:${familyAgreement(against,x).moved.length?'var(--st-amber-fg)':'var(--color-neutral-600)'};max-width:46%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${_famAttr(familyAgreeLine(against,x))}">${_famEsc(familyAgreeLine(against,x))}</span>`:''}
      <span style="flex:none;font-size:var(--t-label);color:var(--color-neutral-600)">${_famEsc(note||'')}</span></button>`;
  /* ---- THE BUTTONS ARE A ROW OF THEIR OWN, UNDER THE HEAD ----
     They were in the head beside the title, which was room enough for two. A
     standalone agreement now offers three acts — write one, attach one, file
     this under a master — and the primary among them has to be able to say
     "Create an amendment" without being folded to a stub.

     WHICH THREE, AND WHY THE SET DIFFERS. Create and Link-an-existing are
     offered wherever a document can HAVE children: a parent or a standalone.
     "Link to a parent agreement" is offered on a STANDALONE only — linkError
     already refuses it for a master ("it already has N amendments of its own"),
     and a control whose only outcome is a refusal is furniture. A child gets
     neither: families are one level deep, so the only act on it is Unlink. */
  /* ---- THE DOOR, ONLY ON A SIGNED AGREEMENT (7 Oct 2026, O-9) ----
     An amendment changes a SIGNED agreement; a draft is simply edited. On a
     draft the button stays where it is, greyed, with the reason and the way
     forward beside it — a dead button never wears a live one's clothes. The
     act that goes the OTHER way (this agreement is itself somebody's
     amendment) is a small question set apart, not a third equal button. */
  const acts=[];
  let reverse='';
  if(canEdit() && !parent){
    const signedHere=amendmentExecuted(c);
    acts.push(signedHere
      ? `<button id="fam-create" class="ui-btn ui-btn-sm ui-btn-primary">${icon('filenew','w-3 h-3')} ${i18t('fa_create_amendment')}</button>`
      : `<button id="fam-create" class="ui-btn ui-btn-sm ui-btn-primary" disabled title="${_famAttr(i18t('fa_draft_no_amend'))}">${icon('filenew','w-3 h-3')} ${i18t('fa_create_amendment')}</button>`);
    acts.push(`<button id="fam-add" style="${btn}">${i18t('fa_link_existing')}</button>`);
    if(!signedHere) acts.push(`<span class="fam-why" style="font-size:var(--t-label);color:var(--color-neutral-600);align-self:center">${i18t('fa_draft_no_amend')} <button type="button" id="fam-edit" class="ui-link">${i18t('fa_edit_draft')}</button></span>`);
    if(!kids.length) reverse=`<p class="fam-rev" style="font-size:var(--t-label);color:var(--color-neutral-600);margin:var(--s-2) 0 0">${i18t('fa_is_itself')} <button type="button" id="fam-link" class="ui-link">${i18t('fa_link_parent')}</button></p>`;
  }
  /* ---- CHECK THE FAMILY (S12), the third act the artifact names ----
     Drawn only where there is a family to check: on a lone agreement the press
     could only ever report "nothing to compare", which is a dead door. It is
     offered on a CHILD too — reading how your amendment sits against its
     parent is the same question from the other chair — and it is not gated on
     canEdit, because it writes nothing and spends nothing. */
  if(kids.length||parent)
    acts.push(`<button id="fam-check" style="${btn}">${i18t('fa_check_family')}</button>`);
  host.innerHTML=`
    <div style="padding:var(--s-4) 18px">
      <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:var(--s-1)${bare&&!(canEdit()&&parent)?';display:none':''}">
        ${bare?'':`<span style="color:var(--color-accent)">${icon('link','w-4 h-4')}</span>
        <h4 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-card);margin:0">${i18t('fa_agreement_family')}</h4>`}
        <span style="flex:1"></span>
        ${(canEdit()&&parent)
          ? `<button id="fam-unlink" style="${btn};border-color:var(--st-ruby-line);color:var(--st-ruby-fg)">${i18t('fa_unlink')}</button>`:''}
      </div>
      ${acts.length?`<div class="fam-acts">${acts.join('')}</div>`:''}
      ${familyPrecedenceLineHtml(c)}
      ${amendChangesHtml(c)}
      ${parent
        /* The label is NOT lowercased here any more, and the sentence lost its
           indefinite article with it: English wants a/an by the following word
           ("a addendum", "a annex") and Swedish en/ett by the noun's own
           gender, and the seven relations split both ways. Read as a filing
           designation — "filed as Addendum of MK-1042" — neither needs one. */
        ? `<p style="font-size:var(--t-meta);color:var(--color-neutral-700);margin:0 0 var(--s-2);line-height:1.55">${i18t('fa_filed_as')} <b>${_famEsc(RELATION_LABEL[c.relation]||'Amendment')}</b> of <b>${_famEsc(window.contractRef?contractRef(parent):parent.id)}</b>${c.relationNote?` — ${_famEsc(c.relationNote)}`:''}. It does not count as a separate agreement in the KPIs, and its renewal reminder fires on the parent.</p>
           <div class="fam-list">${row(parent,'parent agreement')}</div>`
        : kids.length
        ? `<p style="font-size:var(--t-meta);color:var(--color-neutral-700);margin:0 0 var(--s-2);line-height:1.55">${i18t('fa_this_is_a')} ${i18tn('fa_master_with',kids.length,{n:kids.length})} The family counts as <b>one agreement · ${kids.length+1} documents</b>.${from?` The live expiry <b>${_famEsc(eff)}</b> comes from <b>${_famEsc(window.contractRef?contractRef(from):from.id)}</b>, not from this document's own date${ownExpiry(c)?` of ${_famEsc(ownExpiry(c))}`:''}.`:''}</p>
           ${prop?`<p style="font-size:var(--t-meta);color:var(--st-amber-fg);margin:0 0 var(--s-2);line-height:1.55">${i18t('fa_proposed_term',{date:_famEsc(prop.date),id:_famEsc(window.contractRef?contractRef(prop.from):prop.id)})}</p>`:''}
           <div class="fam-list">${kids.map(k=>row(k, `${RELATION_LABEL[k.relation]||'Amendment'}${ownExpiry(k)?' · term to '+ownExpiry(k):''}`, c)).join('')}</div>`
        : `<p style="font-size:var(--t-meta);color:var(--color-neutral-700);margin:0 0 var(--s-2);line-height:1.55">${i18t('fa_standalone_desc')}</p>`}
      ${reverse}
      ${(suggested.length&&!c.parentId&&!c.linkConfirmed)?`
        <div style="margin-top:10px;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-radius:var(--radius);padding:9px 11px">
          <div style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--st-amber-fg);margin-bottom:3px">${i18t('fa_reads_like_amendment')}</div>
          <div style="font-size:var(--t-meta);color:var(--st-amber-fg);line-height:1.5">${i18t('fa_hati_proposed',{ids:suggested.map(s=>`<b>${_famEsc(window.contractRef?contractRef(getContract(s.id)):s.id)}</b>`).join(', ')})} <b>${i18t('fa_nothing_linked')}</b>${i18t('fa_confirm_or_standalone')}</div>
          ${canEdit()?`<div style="display:flex;gap:6px;margin-top:var(--s-2)"><button id="fam-confirm" style="${btn};border-color:var(--color-accent);color:var(--accent-ink)">${i18t('fa_review_suggestion')}</button>
            <button id="fam-standalone" style="${btn}">${i18t('fa_its_standalone')}</button></div>`:''}
        </div>`:''}
    </div>`;
  const again=()=>{ renderFamilySection(getContract(c.id)); if(typeof renderAuditSection==='function') renderAuditSection(getContract(c.id)); };
  host.querySelectorAll('[data-fam-open]').forEach(b=>b.addEventListener('click',()=>openWorkspace(b.getAttribute('data-fam-open'))));
  document.getElementById('fam-link')?.addEventListener('click',()=>openLinkModal(c, again, {mode:'child'}));
  document.getElementById('fam-confirm')?.addEventListener('click',()=>openLinkModal(c, again, {mode:'child'}));
  document.getElementById('fam-add')?.addEventListener('click',()=>openLinkModal(c, again, {mode:'parent'}));
  document.getElementById('fam-create')?.addEventListener('click',()=>{ if(amendmentExecuted(c)) openCreateAmendmentModal(c); });
  document.getElementById('fam-edit')?.addEventListener('click',()=>{ if(window.roomGoTab) roomGoTab(c,'docs'); });
  amendChangesWire(c, again);
  /* CHECK THE FAMILY (S12). One press, one reading, nothing written and
     nothing spent — so it answers in a plain dialog rather than filing a
     finding anywhere. confirmDialog is the product's own window; there is no
     second act to take, so it is shown with one way out. */
  document.getElementById('fam-check')?.addEventListener('click',()=>{
    let body=''; try{ body=familyCheckReport(c); }catch(_){ body=''; }
    if(!body) return;
    if(window.confirmDialog) confirmDialog({
      title:i18t('fa_check_family'), message:body, multiline:true,
      confirmLabel:i18t('ct_close')||'Close', cancelLabel:'' });
    else if(window.toast) toast(body,'ok');
  });
  document.getElementById('fam-unlink')?.addEventListener('click',()=>unlinkContract(c, again));
  document.getElementById('fam-standalone')?.addEventListener('click',()=>{
    logLinkDecision(c,false); persist(c); toast(`${(window.contractRef?contractRef(c):c.id)} confirmed as a standalone agreement`); again();
    if(typeof updateSidebarCounts==='function') updateSidebarCounts();
  });
}

/* ---- WHAT THIS AMENDMENT CHANGES, AND WHAT IS STILL TO FILL (7 Oct 2026, O-11, O-15) ----
   Drawn on an amendment that was written here with items. Each item names the
   clause of the signed agreement it changes, with "See in <ref>" showing that
   clause's signed wording. Under it, the facts signing will ask for, each with
   a suggestion taken from the parent or from what the person asked for —
   applied only when a person presses Confirm, never silently. */
function amendSuggestions(c){
  const parent = c && c.parentId ? getContract(c.parentId) : null;
  if(!parent) return [];
  const F = c.amendFacts || {};
  const out = [];
  const plan = (c.signerPlan || []).length ? null : (parent.signerPlan || []).filter(r => r && r.name);
  if(plan && plan.length) out.push({ k:'signers', label:i18t('fa_sf_signers'), say:plan.map(r=>r.name).join(', '), rows:plan });
  if(F.effectiveDate && !((c.metadata||{}).effectiveDate)) out.push({ k:'effective', label:i18t('fa_mv_effective'), say:F.effectiveDate, v:F.effectiveDate });
  if(F.value && !(Number(c.value) > 0)) out.push({ k:'value', label:i18t('fa_mv_value'), say:(window.fmtMoneyOf?fmtMoneyOf({...c,value:F.value}):String(F.value)), v:F.value });
  if(F.expiry && !c.expiry) out.push({ k:'expiry', label:i18t('fa_mv_end'), say:F.expiry, v:F.expiry });
  return out;
}
function amendChangesHtml(c){
  const items = (c && Array.isArray(c.amends)) ? c.amends : [];
  const parent = c && c.parentId ? getContract(c.parentId) : null;
  if(!items.length || !parent) return '';
  const pref = _famEsc(window.contractRef ? contractRef(parent) : parent.id);
  const sug = amendSuggestions(c);
  return `<div class="fam-changes" style="margin:var(--s-2) 0 var(--s-3);border:1px solid var(--color-divider);border-radius:var(--radius-lg,8px);padding:10px 12px">
    <div style="font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:6px">${i18t('fa_what_changes')}</div>
    ${items.map((it,i)=>`<div style="display:flex;justify-content:space-between;gap:10px;font-size:var(--t-meta);padding:4px 0;border-top:${i?'1px dashed var(--color-divider)':'0'}">
      <span>${_famEsc(it.clauseLabel || i18t('fa_new_clause'))} <span style="color:var(--color-neutral-600)">· ${_famEsc(i18t('fa_op_'+(it.op||'replace')))}</span></span>
      ${it.op==='insert'?'':`<button type="button" class="ui-link" data-fam-see="${i}">${i18t('fa_see_in',{ref:pref})}</button>`}</div>`).join('')}
    ${sug.length?`<div style="font-size:var(--t-label);font-weight:var(--w-strong);margin:10px 0 6px">${i18t('fa_still_to_fill')}</div>
      ${sug.map(x=>`<div style="display:flex;justify-content:space-between;gap:10px;font-size:var(--t-meta);padding:3px 0"><span>${_famEsc(x.label)}</span><span style="color:var(--color-neutral-600);text-align:right">${_famEsc(x.say)}</span></div>`).join('')}
      ${canEdit()?`<button type="button" id="fam-confirm-fill" class="ui-btn ui-btn-sm" style="margin-top:6px">${i18t('fa_confirm_these')}</button>`:''}`:''}
  </div>`;
}
function amendChangesWire(c, again){
  const parent = c && c.parentId ? getContract(c.parentId) : null;
  document.querySelectorAll('[data-fam-see]').forEach(b=>b.addEventListener('click',()=>{
    const it = (c.amends||[])[Number(b.getAttribute('data-fam-see'))]; if(!it||!parent) return;
    const body = it.signed || ((amendParentClauses(parent).find(x=>x.id&&x.id===it.clauseId)||{}).text) || '';
    if(window.confirmDialog) confirmDialog({ title:`${window.contractRef?contractRef(parent):parent.id} · ${it.clauseLabel||''}`,
      message:body||i18t('fa_pick_none'), multiline:true, confirmLabel:i18t('ct_close')||'Close', cancelLabel:'' });
  }));
  document.getElementById('fam-confirm-fill')?.addEventListener('click',()=>{
    const sug = amendSuggestions(c);
    sug.forEach(x=>{
      if(x.k==='signers' && window.saveSignerPlan) saveSignerPlan(c, x.rows.map(r=>({ party:r.party, name:r.name, role:r.role, email:r.email,
        memberId:r.memberId, step:r.step, partyId:r.partyId })));
      if(x.k==='effective') c.metadata = { ...(c.metadata||{}), effectiveDate:x.v };
      if(x.k==='value') c.value = Number(x.v);
      if(x.k==='expiry') c.expiry = x.v;
    });
    if(window.logAudit) logAudit(c,'Edited',`Confirmed from the amendment's proposal: ${sug.map(x=>x.label+' '+x.say).join(' · ')}`);
    persist(c);
    toast(i18t('fa_confirmed_these'),'ok');
    if(again) again();
  });
}
/* ============================================================
   WRITING AN AMENDMENT FROM BLANK PAPER
   ============================================================
   Until now the only way to get an amendment into HaTi was to write it
   somewhere else and attach the file. "Link an existing document" is that act
   and it is unchanged. This is the other half: a NEW draft, on our letterhead,
   filed against its parent from the moment it exists, negotiated and signed
   like any other contract.

   THE POINT OF THE WHOLE THING IS THAT NOTHING AFTER THIS IS NEW. A document
   made entirely of inserted clauses is a document the negotiation page has
   always known how to write. So this function's job ends the moment a valid
   draft is on the record — no second editor, no amendment mode, no special
   round. What it must get right is the START: the link, the parties, the
   letterhead, and a body the rest of the product can read.

   AND IT DOES NOT REGISTER roomOpenOnTerms. That rule exists because a new
   draft's document is a template full of blanks fed from the terms, so landing
   on the document shows somebody the output of a form they have not filled in.
   Neither half is true here: every term this document inherits is already
   filled in from the parent, and the document is the empty thing the reader
   pressed the button to go and write. See wsTabDefaults, and f170, which names
   this file as the one creation site that lands on the document and asserts it
   rather than leaving the exception to be discovered. */

/* The word the DOCUMENT uses for each relation, in English. Deliberately not
   RELATION_LABEL: that is the SCREEN's word, it is built from getters at load
   time, and it follows the reader's language. This one is stamped into the
   contract's name, which is a record — it goes on the paper, into the register
   and into every list, and a record keeps English (the rulebook's own rule,
   the same one ROLE_LABEL follows). */
const RELATION_DOC_WORD = { amendment:'Amendment', addendum:'Addendum', variation:'Variation',
  renewal:'Renewal', sow:'Statement of Work', annex:'Annex', 'side-letter':'Side Letter' };
/* Which number this one is: how many of the SAME kind already hang off this
   parent, plus one. Counted per relation rather than across the family, because
   "Amendment No. 2" is wrong on a document that follows one amendment and three
   annexes. Declined documents still count — No. 2 was issued even if it died,
   and reusing its number is how two documents come to share a name. */
function amendmentOrdinal(parent, relation){
  const rel = isRelation(relation) ? relation : 'amendment';
  return familyChildren(parent.id).filter(k=>(k.relation||'amendment')===rel).length + 1;
}
function amendmentDefaultName(parent, relation){
  const rel = isRelation(relation) ? relation : 'amendment';
  const word = RELATION_DOC_WORD[rel] || 'Amendment';
  const base = String((parent&&parent.name)||'').replace(/\s*\(draft\)\s*$/i,'').trim();
  return `${word} No. ${amendmentOrdinal(parent, rel)}${base?` to ${base}`:''}`;
}
/* A body of one empty line. NOT an empty string and NOT '<p></p>': the first
   sends docBody down the built-in-template branch (which drafts a whole NDA and
   then reads a `kind` off a template that is not there), and the second is
   dropped by the sanitiser, which lands back on the first. One <br> survives
   sanitising, renders as blank paper, and gives the negotiation a body to
   stamp clause ids into. */
const FAMILY_BLANK_BODY = '<p><br></p>';
/* The four lines an amendment conventionally opens and closes with.

   IN ENGLISH, ALWAYS, and that is not an oversight: all twelve built-in
   templates draft their paper in English whatever language the reader has
   chosen (docBody's BUILD), and the document's own title is built from
   RELATION_DOC_WORD above for the same reason. A skeleton that followed the
   reader would put a Swedish body under an English title on a page the
   counterparty reads. Every word is editable the moment it is drawn.

   THEY ARE NOT DECORATION. The opening recitals are how a reader on the other
   side knows which agreement is being changed, and they are what HaTi itself
   reads later — see looksLikeAmendment and suggestParents, which match on
   exactly this shape when the same document comes back through an import. */
function amendmentSkeletonBody(parent, opts={}){
  const rel = isRelation(opts.relation) ? opts.relation : 'amendment';
  const word = RELATION_DOC_WORD[rel] || 'Amendment';
  const ord = opts.ordinal || 1;
  /* Our own entity ON THIS PAPER, which is contractParty's answer written out
     rather than borrowed: the child copies parent.party, so both documents in
     the family name the same signatory, and this reads it from the same place
     with no dependency on a module that may not be on the floor. */
  const us = _famEsc(String((parent&&parent.party) || window.FIRST_PARTY || '').trim());
  const them = _famEsc(String((parent&&parent.counterparty)||'').trim());
  const pname = _famEsc(String((parent&&parent.name)||'').replace(/\s*\(draft\)\s*$/i,'').trim());
  const eff = (parent&&((parent.metadata&&parent.metadata.effectiveDate)||(parent.fields&&parent.fields.effDate)
    ||(typeof window.contractSignedAt==='function'?contractSignedAt(parent):null)))||'';
  /* Written the way the paper writes a date — "31 July 2026", never the date
     input's 2026-07-31. fmtDocDate is the one formatter for this and it reads
     a fixed month list, so the recital does not change wording with the
     reader's language. Null when it is not a date we can print, in which case
     the sentence simply names the agreement and no date. */
  const effDoc = eff && window.fmtDocDate ? fmtDocDate(String(eff).slice(0,10)) : null;
  const dated = effDoc ? ` dated ${_famEsc(effDoc)}` : '';
  const between = (us&&them) ? ` between <strong>${us}</strong> and <strong>${them}</strong>` : '';
  /* ---- THE VERB FITS THE DOCUMENT (audit finding 9, 14 Aug 2026) ----
     Every kind opened with amendment language: a Statement of Work said the
     agreement was "amended as follows", a Renewal said the parties "wish to
     amend it". An SoW does not amend a master agreement — it is ordered under
     one — and a renewal extends rather than amends. The title was already
     right per kind (RELATION_DOC_WORD); only the body was not, and the body is
     what the counterparty reads.

     FOUR SHAPES COVER THE SEVEN. Changing (amendment, variation) · adding
     without changing (addendum, annex) · ordering work under it (sow) ·
     extending it (renewal). A side letter sits with the changing group: it is a
     separate letter that modifies the agreement, which is what its own
     description says. */
  const SHAPE = { amendment:'change', variation:'change', 'side-letter':'change',
    addendum:'add', annex:'add', sow:'order', renewal:'extend' };
  const W = {
    change: { wish:'now wish to amend it',
      lead:'The parties agree that the Agreement is amended as follows:',
      close:'Except as amended above, all other terms of the Agreement remain in full force and effect.' },
    add:    { wish:'now wish to add to it',
      lead:'The parties agree that the following is added to the Agreement:',
      close:'All other terms of the Agreement remain unchanged and in full force and effect.' },
    order:  { wish:'now wish to record work ordered under it',
      lead:'The parties agree that the following work is ordered under the Agreement:',
      close:'This document is governed by the Agreement, whose terms apply to the work described above and remain in full force and effect.' },
    extend: { wish:'now wish to extend it',
      lead:'The parties agree that the Agreement is extended as follows:',
      close:'Except as extended above, all other terms of the Agreement remain in full force and effect.' },
  }[SHAPE[rel] || 'change'];
  /* ---- `opts.says` IS ADDITIVE, AND IT IS THE COHORT ACT'S WHOLE POINT ----
     The skeleton's third paragraph says "the Agreement is amended as follows:"
     and then stops, because on a single amendment the drafter writes the next
     paragraph themselves. A campaign is one wording written once and carried
     onto fourteen drafts, so it lands exactly where that drafter would have
     put it: between the lead and the closing paragraph, as ONE paragraph, in
     the person's own words. A caller that passes nothing is byte-identical to
     before, which every test of this skeleton rests on. Escaped: it is typed
     text going onto paper, never markup. */
  const says = String(opts.says||'').trim();
  /* ---- ONE NUMBERED ITEM PER CHANGE (7 Oct 2026, O-11) ----
     Where the person said what changes (Copilot's proposal or their own
     picks), each change is written as the item a lawyer would write — "1.
     Term. Clause 3.1 is deleted and replaced with: "…"" — between the lead
     and the close. Each is an ordinary paragraph on the record, so the
     pencil, the clause editor, Send and signing all work on it unchanged. */
  const items = (Array.isArray(opts.items) ? opts.items : []).filter(Boolean);
  return [
    `<p>This ${word} No. ${ord} is made on ____________${between}.</p>`,
    `<p>The parties entered into the ${pname?`<strong>${pname}</strong>`:'agreement'}${dated} (the &ldquo;Agreement&rdquo;). The parties ${W.wish}.</p>`,
    `<p>${W.lead}</p>`,
    says ? `<p>${_famEsc(says)}</p>` : '',
    ...items.map((it, i) => amendmentItemHtml(it, i + 1)),
    `<p>${W.close}</p>`,
  ].filter(Boolean).join('');
}

/* The wording of one item, in English like the rest of the skeleton (a
   record keeps English). The clause is named by its number and heading as the
   signed agreement prints them. */
function amendmentItemHtml(it, n){
  const label = String((it && it.clauseLabel) || '').replace(/\s+/g,' ').trim();
  const m = /^((?:\d+(?:\.\d+)*\.?)|(?:[A-Z]\.)|(?:[IVXLC]+\.))\s*(.*)$/.exec(label);
  const num = String((it && it.clauseNumber) || (m ? m[1] : '')).replace(/\.$/, '');
  const heading = (m ? m[2] : label).replace(/[.:]\s*$/, '') || 'Change';
  const q = t => `&ldquo;${_famEsc(String(t || '').trim() || '____________')}&rdquo;`;
  const where = num ? `Clause ${_famEsc(num)}` : (label ? `The clause headed &ldquo;${_famEsc(label)}&rdquo;` : 'A clause');
  const op = (it && it.op) || 'replace';
  const say = op === 'insert' ? `A new clause${num ? ' ' + _famEsc(num) : ''} is added: ${q(it.amended)}`
    : op === 'delete' ? `${where} is deleted.`
    : `${where} is deleted and replaced with: ${q(it.amended)}`;
  return `<p><strong>${n}. ${_famEsc(heading)}.</strong> ${say}</p>`;
}
/* Mint the draft. No UI, no navigation — returns the contract so the dialog can
   open it and a test can read it. Throws nothing: a refusal comes back as a
   string on `.error` rather than as an exception, because both callers want to
   print it rather than crash. */
function createAmendment(parent, opts={}){
  if(!parent) return { error:'No parent agreement.' };
  if(parent.parentId) return { error:i18t('fa_child_cannot_amend') };
  const rel = isRelation(opts.relation) ? opts.relation : 'amendment';
  const ord = amendmentOrdinal(parent, rel);
  const name = String(opts.name||'').trim() || amendmentDefaultName(parent, rel);
  const u = (typeof currentUser==='function' && currentUser()) || null;
  const who = u?.name || 'System';
  const c = {
    id: nextId(), name,
    /* CARRIED OVER — the facts that are the same agreement's facts. The other
       side and the address we have for them, our own legal entity on this
       paper (contractParty, not the workspace), the value stream it is filed
       under, and the letterhead. The MARKET is not copied because it is not on
       the record: law, currency and the statute checks are the workspace's own
       setting, so a new document is already in the right one. */
    counterparty: (parent.counterparty||''),
    party: parent.party || undefined,
    folder: parent.folder,
    branding: parent.branding || undefined,
    /* LEFT BLANK, DELIBERATELY. The wording, because blank paper is the point.
       The money, because an amendment either restates the figure or changes it
       and a copied one would be a guess wearing a fact's clothes — but WHETHER
       money passes is inherited, since an amendment to an NDA is no more likely
       to carry a figure than the NDA was (see isMonetary: the record wins, and
       this is the record saying something). The effective date, because this
       document starts when it starts. The obligations, because they belong to
       the document that created them. And who signs, because a signature is
       given to one arrangement and last year's signatory may have left. */
    /* EMPTY, NOT NOUGHT (the process review, 4 Oct 2026): a 0 read as "this
       amendment is worth nothing" and the readiness check took it as answered.
       Absent is the honest answer, so signing asks for it. A non-monetary
       family stays 0, which is what isMonetary reads for 'none'. */
    value: (parent.valueType === 'none') ? 0 : null, valueType: parent.valueType || 'estimated',
    status: 'Draft', template: null, source: 'amendment',
    lastAction: (typeof todayStr==='function'?todayStr():''), hash: null, signedAt: null,
    signatory: who, compliance: {},
    expiry: opts.expiry || null,
    fields: {}, scan: null, comments: [], signatures: [],
    format: 'rich',
    audit: [{ at:nowISO(), user:who, action:'Created',
      detail:`New ${(RELATION_DOC_WORD[rel]||'Amendment').toLowerCase()} written from blank paper against ${parent.id}`
        + (opts.expiry?` — states a term to ${opts.expiry}`:'')
        + (opts.skeleton===false?' — blank page':'') }],
  };
  /* The other side's main contact comes with it, through the address book's
     one writer (js/participants.js), read off the parent's book. */
  const cpMail = (typeof window.contactEmail==='function') ? window.contactEmail(parent) : String(parent.counterpartyEmail||'');
  if(cpMail){
    if(typeof window.contactSet==='function'){
      const m = window.contactMain ? window.contactMain(parent) : null;
      window.contactSet(c, { main:true, email:cpMail, ...(m && m.name ? { name:m.name } : {}) });
    } else c.counterpartyEmail = cpMail;
  }
  const items = (Array.isArray(opts.items) ? opts.items : []).filter(Boolean);
  c.redlineText = (opts.skeleton===false && !items.length)
    ? FAMILY_BLANK_BODY
    : amendmentSkeletonBody(parent, { relation:rel, ordinal:ord, says:opts.says, items });
  /* WHAT THIS AMENDMENT CHANGES, remembered per item (O-11): the clause of
     the signed agreement it changes, the op, the signed wording it replaces and
     the wording it proposes. Read by the panel ("See in the original"), by the
     facts reading once it is signed (O-16) and by the As amended view (O-17).
     A record of ours: it never travels. */
  if(items.length) c.amends = items.map(it => ({ clauseId:it.clauseId||'', clauseLabel:String(it.clauseLabel||'').slice(0,200),
    clauseNumber:String(it.clauseNumber||'').slice(0,20), op:['replace','insert','delete'].includes(it.op)?it.op:'replace',
    signed:String(it.signed||'').slice(0,4000), amended:String(it.amended||'').slice(0,4000) }));
  /* THE FACTS IT PROPOSES (O-15): suggestions for a person to confirm, never
     written onto the record by themselves. */
  if(opts.facts && typeof opts.facts === 'object'){
    const f = opts.facts, out = {};
    if(f.expiry && /^\d{4}-\d{2}-\d{2}$/.test(String(f.expiry))) out.expiry = String(f.expiry);
    if(f.effectiveDate && /^\d{4}-\d{2}-\d{2}$/.test(String(f.effectiveDate))) out.effectiveDate = String(f.effectiveDate);
    if(Number(f.value) > 0) out.value = Number(f.value);
    if(Object.keys(out).length) c.amendFacts = out;
  }
  if(opts.byCopilot && c.audit && c.audit[0]) c.audit[0].detail += ` — ${items.length} item${items.length===1?'':'s'} drafted by Copilot from: “${String(opts.note||'').slice(0,300)}”`;
  else if(items.length && c.audit && c.audit[0]) c.audit[0].detail += ` — ${items.length} clause${items.length===1?'':'s'} picked to change`;
  /* FILED AGAINST THE PARENT IN THE SAME BREATH — there is no second step and
     no window in which this exists as a loose contract. applyParentLink writes
     its own audit line under the Created one above. */
  applyParentLink(c, parent.id, rel, opts.note||'', u);
  /* A person just made this on purpose, so there is nothing for HaTi to
     propose and nothing for anyone to confirm — the amber "this reads like an
     amendment" band is for documents that arrived, not for one written here. */
  c.linkConfirmed = true;
  c._loaded=true; c._light=false; c._v=0;
  /* WHO RAISED IT. The eighth creation site, and it owes this the same as the
     other seven — an amendment with no owner falls out of the dashboard's
     Decisions-due card and both of Reports' timing figures, which is the exact
     hole c.owner was added to close. See contractOwnerStamp (js/core.js): it
     stamps once and never overwrites. */
  if(window.contractOwnerStamp) contractOwnerStamp(c);
  state.contracts.unshift(c);
  persist(c);
  const p=getContract(parent.id); if(p) persist(p);
  /* ---- AND COPILOT READS IT ON ARRIVAL, like every other creation site
     (the process review, 4 Oct 2026) ----
     contractArrived claims who was named, puts the address in the book and
     starts the reading. It does NOT register roomOpenOnTerms — this one still
     lands on its Document tab (see the note above), which is the owner's
     ruled exemption. Saved first, then read: the reading flushes the save. */
  if(window.contractArrived) contractArrived(c);
  return { contract:c };
}

/* The form. Everything answered already except the one question that cannot be
   guessed — whether this document moves the end of the term. */
/* `opts.relation` preselects the kind (W2-4: the renewal adviser's "Start the
   renewal" opens THIS dialog with Renewal chosen rather than growing a second
   creation path — one door, one set of rules, one audit line). Everything
   about the dialog is otherwise unchanged, and a caller that passes nothing
   still opens on Amendment. `opts.note` prefills the note box (4 Oct 2026:
   the renewal card carries its recorded reason here), editable like any. */
function openCreateAmendmentModal(parent, onDone, opts){
  if(!canEdit()){ toast(i18t('fa_viewers_no_change'),'err'); return; }
  if(!parent) return;
  if(parent.parentId){ toast(i18t('fa_child_cannot_amend'),'err'); return; }
  /* ---- ONE QUESTION FIRST: WHAT DO YOU WANT TO CHANGE? (7 Oct 2026, O-10) ----
     The form used to ask for paperwork — which of seven kinds, a name, an end
     date, a note, a tick box — and never for the change itself, then opened
     a page that said "amended as follows:" and stopped. It asks for the change
     now, in the person's own words, and offers two ways on: Copilot reads the
     signed agreement and proposes the clause-by-clause wording for them to
     check (O-12), or they pick the clauses themselves (O-14). Either way the
     draft opens already written, one numbered item per change (O-11).
     The kind and the name are filled in from what they wrote and are one
     press away to change. ONE DOOR: the renewal adviser opens this same
     dialog (`opts.relation`, `opts.note`). */
  const relOpen = (opts && isRelation(opts.relation)) ? opts.relation : 'amendment';
  const ref = window.contractRef ? contractRef(parent) : parent.id;
  const FLD = window.HATI_FLD, LBL = window.HATI_LBL;
  const S = { rel: relOpen, name: amendmentDefaultName(parent, relOpen), nameTouched: false,
    note: String((opts && opts.note) || '').slice(0, 600), expiry: '', items: [], picks: new Set(), addNew: false,
    skeleton: true, facts: null, mentions: [], aiNotice: '' };
  const aiOn = !!(window.API_MODE && API_MODE() && window.state && state.aiConfigured && window.api);
  const CHIPS = ['fa_chip_extend', 'fa_chip_price', 'fa_chip_pay', 'fa_chip_add', 'fa_chip_notice', 'fa_chip_else'];
  const relSel = () => `<select id="am-rel" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:3px 6px;font:inherit;font-size:var(--t-label)">${
    CONTRACT_RELATIONS.map(r=>`<option value="${r.k}" ${r.k===S.rel?'selected':''} title="${_famAttr(r.blurb)}">${_famEsc(r.label)}</option>`).join('')}</select>`;
  const head = (t, sub) => `<div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:6px"><span style="color:var(--color-accent)">${icon('filenew','w-4 h-4')}</span>
      <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-page);margin:0">${t}</h3></div>
    ${sub?`<p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 var(--s-3);line-height:1.55">${sub}</p>`:''}`;
  const endField = () => `<label style="display:block;margin:var(--s-3) 0 0"><span style="${LBL}">${i18t('fa_end_q')}</span>
      <input id="am-expiry" type="date" value="${_famAttr(S.expiry)}" style="${FLD};max-width:220px"/>
      <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);margin-top:var(--s-1)">${i18t(TERM_CHANGING.has(S.rel)?'fa_end_hint':'fa_end_hint_kept')}</span></label>`;
  const foot = inner => `<div id="am-err" style="font-size:var(--t-label);color:var(--st-ruby-fg);min-height:15px;margin:var(--s-2) 0"></div>
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:var(--s-2);flex-wrap:wrap">${inner}</div>`;
  function askPane(){
    return `${head(i18t('fa_amend_title',{ref:`${_famEsc(ref)} ${_famEsc(parent.name||'')}`}), i18t(aiOn?'fa_amend_sub_ai':'fa_amend_sub'))}
      <div class="am-chips" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:var(--s-2)">${CHIPS.map(k=>
        `<button type="button" data-am-chip="${k}" class="ui-btn ui-btn-sm" style="border-radius:999px">${_famEsc(i18t(k))}</button>`).join('')}</div>
      <textarea id="am-note" rows="4" placeholder="${_famAttr(i18t('fa_amend_ph'))}" style="${FLD};width:100%;resize:vertical;line-height:1.5">${_famEsc(S.note)}</textarea>
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;margin-top:var(--s-2);font-size:var(--t-label);color:var(--color-neutral-600)">
        <label style="display:inline-flex;align-items:center;gap:6px">${i18t('fa_type')} ${relSel()}</label>
        <label style="display:inline-flex;align-items:center;gap:6px;flex:1;min-width:220px">${i18t('fa_name')}
          <input id="am-name" value="${_famAttr(S.name)}" style="${FLD};padding:3px 6px;font-size:var(--t-label)"/></label>
        <span>${i18t('fa_same_parties',{ref:_famEsc(ref)})}</span></div>
      ${foot(`<button id="am-blank" type="button" class="ui-link" style="margin-right:auto">${i18t('fa_start_blank')}</button>
        <button id="am-cancel" class="ui-btn">${i18t('act_cancel')}</button>
        ${aiOn?`<span style="font-size:var(--t-label);color:var(--color-neutral-600)">✦ ${i18t('fa_ai_reads',{ref:_famEsc(ref)})}</span>`:''}
        <button id="am-ai" class="ui-btn ui-btn-primary"${aiOn?'':' disabled'} title="${_famAttr(aiOn?'':i18t('fa_ai_off'))}">${i18t('fa_draft_with_copilot')}</button>`)}
      ${aiOn?'':`<p style="font-size:var(--t-label);color:var(--color-neutral-600);margin:6px 0 0;text-align:right">${i18t('fa_ai_off')}</p>`}`;
  }
  function itemRowHtml(it, i){
    const del = it.op === 'insert' ? '' : _famEsc(it.signed || '');
    return `<div style="border:1px solid var(--color-divider);border-radius:var(--radius);overflow:hidden">
      <label style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--color-bg);font-size:var(--t-label);font-weight:var(--w-strong);cursor:pointer">
        <input type="checkbox" data-am-item="${i}" ${it.on!==false?'checked':''} style="accent-color:var(--color-accent)"/>${_famEsc(it.clauseLabel||i18t('fa_new_clause'))}
        <span style="font-weight:var(--w-body);color:var(--color-neutral-600)">· ${_famEsc(i18t('fa_op_'+(it.op||'replace')))}</span></label>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
        ${it.op==='insert'?'':`<div style="padding:8px 10px;font-family:var(--font-doc);font-size:var(--t-meta);line-height:1.5;min-width:0"><span style="display:block;font-family:var(--font-body);font-size:var(--t-micro,10px);color:var(--color-neutral-600)">${i18t('fa_signed_wording')}</span><del style="color:var(--st-ruby-fg)">${del}</del></div>`}
        ${it.op==='delete'?'':`<div style="padding:8px 10px;font-family:var(--font-doc);font-size:var(--t-meta);line-height:1.5;min-width:0;border-left:1px solid var(--color-divider)"><span style="display:block;font-family:var(--font-body);font-size:var(--t-micro,10px);color:var(--color-neutral-600)">${i18t('fa_amended_wording')}</span><ins style="color:var(--accent-ink);text-decoration-color:var(--color-accent)">${_famEsc(it.amended||'')}</ins></div>`}
      </div></div>`;
  }
  function reviewPane(){
    const F = S.facts || {};
    const moves = [];
    if(F.expiry && F.expiry !== ownExpiry(parent)) moves.push([i18t('fa_mv_end'), `${_famEsc(ownExpiry(parent)||'—')} → <b>${_famEsc(F.expiry)}</b>`]);
    if(F.value && Number(F.value) !== Number(parent.value||0)) moves.push([i18t('fa_mv_value'), `${_famEsc(window.fmtMoneyOf?fmtMoneyOf(parent):String(parent.value||'—'))} → <b>${_famEsc(window.fmtMoneyOf?fmtMoneyOf({...parent,value:Number(F.value)}):String(F.value))}</b>`]);
    if(F.effectiveDate) moves.push([i18t('fa_mv_effective'), `<b>${_famEsc(F.effectiveDate)}</b>`]);
    (S.mentions||[]).forEach(m=>moves.push([i18t('fa_mv_mentions'), `${_famEsc(m.clause||'')} · <span style="color:var(--st-amber-fg)">${_famEsc(m.why||i18t('fa_check_it'))}</span>`]));
    return `${head(i18tn('fa_found_n',S.items.length,{n:S.items.length}), i18t('fa_found_sub'))}
      <div style="display:grid;gap:10px;max-height:46vh;overflow:auto;padding-right:2px" class="scroll-thin">${S.items.map(itemRowHtml).join('')}</div>
      ${moves.length?`<div style="display:grid;gap:4px;margin-top:var(--s-3);font-size:var(--t-label)">${moves.map(([k,v])=>`<div style="display:flex;justify-content:space-between;gap:10px;border-bottom:1px dashed var(--color-divider);padding-bottom:4px"><span>${_famEsc(k)}</span><span style="text-align:right">${v}</span></div>`).join('')}</div>`:''}
      ${S.aiNotice?`<p style="font-size:var(--t-label);color:var(--st-amber-fg);margin:var(--s-2) 0 0">${_famEsc(S.aiNotice)}</p>`:''}
      ${endField()}
      ${foot(`<span style="font-size:var(--t-label);color:var(--color-neutral-600);margin-right:auto">✦ ${i18t('fa_check_before')}</span>
        <button id="am-back" class="ui-btn">${i18t('fa_back')}</button>
        <button id="am-go" class="ui-btn ui-btn-primary">${i18t('fa_create_amendment_go')}</button>`)}`;
  }
  function pickPane(){
    const cls = amendParentClauses(parent);
    return `${head(i18t('fa_pick_title'), i18t('fa_pick_sub'))}
      <div style="display:grid;gap:2px;max-height:40vh;overflow:auto" class="scroll-thin">
        ${cls.length?cls.map((x,i)=>`<label style="display:flex;gap:8px;align-items:flex-start;padding:6px 4px;border-bottom:1px dashed var(--color-divider);cursor:pointer;font-size:var(--t-meta)">
          <input type="checkbox" data-am-pick="${i}" ${S.picks.has(i)?'checked':''} style="margin-top:3px;accent-color:var(--color-accent)"/>
          <span style="min-width:0"><b style="font-weight:var(--w-strong)">${_famEsc(x.label||i18t('fa_clause_n',{n:i+1}))}</b>
          <span style="display:block;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_famEsc((x.text||'').slice(0,140))}</span></span></label>`).join('')
          :`<p style="font-size:var(--t-meta);color:var(--color-neutral-600)">${i18t('fa_pick_none')}</p>`}
        <label style="display:flex;gap:8px;align-items:center;padding:6px 4px;cursor:pointer;font-size:var(--t-meta)"><input type="checkbox" id="am-pick-new" ${S.addNew?'checked':''} style="accent-color:var(--color-accent)"/>${i18t('fa_add_new_clause')}</label>
      </div>
      ${aiOn?'':`<p style="font-size:var(--t-label);color:var(--st-amber-fg);margin:var(--s-2) 0 0">${i18t('fa_ai_off_manual')}</p>`}
      <label style="display:flex;align-items:flex-start;gap:var(--s-2);border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);padding:9px 11px;margin-top:var(--s-3);cursor:pointer">
        <input type="checkbox" id="am-skeleton" ${S.skeleton?'checked':''} style="margin-top:2px;flex:none;accent-color:var(--color-accent)"/>
        <span style="font-size:var(--t-meta)"><b>${i18t('fa_skeleton')}</b>
          <span style="display:block;color:var(--color-neutral-600);line-height:1.5;margin-top:2px">${i18t('fa_skeleton_hint')}</span></span></label>
      ${endField()}
      ${foot(`<button id="am-back" class="ui-btn">${i18t('fa_back')}</button>
        <button id="am-go" class="ui-btn ui-btn-primary">${i18t('fa_create_amendment_go')}</button>`)}`;
  }
  openModal(`<div style="padding:20px 22px" id="am-dlg"></div>`, {maxWidth:'680px'});
  const $ = id => document.getElementById(id);
  const err = t => { const e=$('am-err'); if(e) e.textContent=t||''; };
  function keep(){
    const n=$('am-note'); if(n) S.note=n.value;
    const r=$('am-rel'); if(r) S.rel=r.value;
    const nm=$('am-name'); if(nm) S.name=nm.value;
    const x=$('am-expiry'); if(x) S.expiry=x.value;
    const sk=$('am-skeleton'); if(sk) S.skeleton=!!sk.checked;
    document.querySelectorAll('[data-am-item]').forEach(cb=>{ const it=S.items[Number(cb.getAttribute('data-am-item'))]; if(it) it.on=cb.checked; });
    if(document.querySelector('[data-am-pick]')||$('am-pick-new')){
      S.picks=new Set([...document.querySelectorAll('[data-am-pick]')].filter(cb=>cb.checked).map(cb=>Number(cb.getAttribute('data-am-pick'))));
      S.addNew=!!($('am-pick-new')&&$('am-pick-new').checked);
    }
  }
  function show(step){
    const host=$('am-dlg'); if(!host) return;
    host.innerHTML = step==='review' ? reviewPane() : step==='pick' ? pickPane() : askPane();
    host.dataset.step = step;
    wire(step);
  }
  function wire(step){
    $('am-cancel')?.addEventListener('click',closeModal);
    $('am-back')?.addEventListener('click',()=>{ keep(); show('ask'); });
    $('am-name')?.addEventListener('input',()=>{ S.nameTouched=true; });
    $('am-rel')?.addEventListener('change',()=>{ S.rel=$('am-rel').value; if(!S.nameTouched){ S.name=amendmentDefaultName(parent,S.rel); const nm=$('am-name'); if(nm) nm.value=S.name; } });
    document.querySelectorAll('[data-am-chip]').forEach(b=>b.addEventListener('click',()=>{
      const t=$('am-note'); if(!t) return;
      const add=i18t(b.getAttribute('data-am-chip')+'_say');
      t.value=(t.value.trim()?t.value.trim()+' ':'')+add; t.focus();
      /* "Extend the term" makes this a renewal unless the reader chose otherwise. */
      if(b.getAttribute('data-am-chip')==='fa_chip_extend' && S.rel==='amendment' && !S.nameTouched){ /* stays an amendment: an extension IS an amendment of the term */ }
    }));
    $('am-blank')?.addEventListener('click',()=>{ keep(); show('pick'); });
    $('am-ai')?.addEventListener('click',async()=>{
      keep();
      if(!String(S.note||'').trim()){ err(i18t('fa_say_first')); return; }
      const b=$('am-ai'); b.disabled=true; b.textContent=i18t('fa_reading');
      try{
        const text=amendParentText(parent);
        const r=await api('ai/amend','POST',{ text, ask:S.note, ref, facts:{ expiry:ownExpiry(parent)||'', value:Number(parent.value)||0,
          currency:(window.contractCurrency?contractCurrency(parent):'') } });
        const items=(r&&Array.isArray(r.items)?r.items:[]).map(x=>({ ...x, on:true }));
        if(!items.length){ err((r&&r.error)||i18t('fa_ai_nothing')); b.disabled=false; b.textContent=i18t('fa_draft_with_copilot'); return; }
        const cls=amendParentClauses(parent);
        items.forEach(it=>{ const hit=cls.find(x=>x.num&&it.clauseNumber&&String(x.num)===String(it.clauseNumber)); if(hit){ it.clauseId=hit.id; if(!it.clauseLabel) it.clauseLabel=hit.label; } });
        S.items=items; S.facts=r.facts||null; S.mentions=Array.isArray(r.mentions)?r.mentions:[];
        S.aiNotice=(r.dropped?i18tn('fa_dropped_n',r.dropped,{n:r.dropped}):'')+(r.truncated?' '+i18t('fa_cut_short'):'');
        if(S.facts&&S.facts.expiry&&!S.expiry) S.expiry=S.facts.expiry;
        if(r.kind&&isRelation(r.kind)&&!S.nameTouched){ S.rel=r.kind; S.name=amendmentDefaultName(parent,S.rel); }
        show('review');
      }catch(e){
        /* EVERY FAILURE IS SAID WHERE THE READER LOOKS, with the manual way
           on the same screen (no key, a refusal, the cap, a dropped line). */
        err((e&&e.message)||i18t('fa_ai_failed')); b.disabled=false; b.textContent=i18t('fa_draft_with_copilot');
        const bl=$('am-blank'); if(bl) bl.style.fontWeight='600';
      }
    });
    $('am-go')?.addEventListener('click',()=>{
      keep();
      const name=String(S.name||'').trim();
      if(!name){ err(i18t('fa_needs_name')); return; }
      const expiry=String(S.expiry||'').trim();
      if(expiry && !(window.dateOnly?dateOnly(expiry):/^\d{4}-\d{2}-\d{2}$/.test(expiry))){ err(i18t('fa_bad_date')); return; }
      let items=[];
      if(step==='review') items=S.items.filter(it=>it.on!==false);
      else {
        const cls=amendParentClauses(parent);
        items=[...S.picks].sort((a,b)=>a-b).map(i=>cls[i]).filter(Boolean).map(x=>({ clauseId:x.id, clauseLabel:x.label, clauseNumber:x.num,
          op:'replace', signed:x.text, amended:x.text, manual:true }));
        if(S.addNew) items.push({ clauseLabel:'', op:'insert', amended:'', manual:true });
      }
      const made=createAmendment(parent,{ relation:S.rel, name, expiry:expiry||null, note:String(S.note||'').trim(),
        skeleton:S.skeleton!==false || items.length>0, items, facts:step==='review'?S.facts:null,
        byCopilot:step==='review' });
      if(made.error){ err(made.error); return; }
      closeModal();
      toast(i18t('fa_created',{ id:(window.contractRef?contractRef(made.contract):made.contract.id), pid:ref,
        rel:(RELATION_LABEL[made.contract.relation]||'Amendment').toLowerCase() }),'ok');
      if(typeof updateSidebarCounts==='function') updateSidebarCounts();
      if(onDone) onDone(made.contract);
      else if(typeof openWorkspace==='function') openWorkspace(made.contract.id);
    });
  }
  show('ask');
}
/* THE SIGNED AGREEMENT'S CLAUSES, for the picker and for matching Copilot's
   items to clause ids. Read off the wording the parent is drawn from; READS,
   never writes (no negotiation is initialised). */
function amendParentHtml(parent){
  if(!parent) return '';
  try{
    if(parent.redlineText && window.isRich && isRich(parent.format)) return String(parent.redlineText);
    if(window.isUpload && isUpload(parent)){
      const t=String((parent.upload&&parent.upload.extractedText)||parent.redlineText||'');
      return t.split(/\n+/).filter(Boolean).map(l=>`<p>${_famEsc(l)}</p>`).join('');
    }
    if(parent.redlineText) return String(parent.redlineText).split(/\n+/).filter(Boolean).map(l=>`<p>${_famEsc(l)}</p>`).join('');
    if(window.docBody) return String(docBody(parent)||'');
  }catch(_){}
  return '';
}
function amendParentClauses(parent){
  const html=amendParentHtml(parent);
  if(!html||!window.clauseSegment) return [];
  let cl=[]; try{ cl=clauseSegment(html)||[]; }catch(_){ cl=[]; }
  return cl.map(x=>({ id:x.clauseId||'', num:String(x.num||''), title:x.title||'',
    label:String(x.headingText||'').replace(/\s+/g,' ').trim(), text:String(x.text||'').replace(/\s+/g,' ').trim() }))
    .filter(x=>x.label||x.text);
}
function amendParentText(parent){
  const html=amendParentHtml(parent);
  try{ return window.richToText?richToText(html):html.replace(/<[^>]+>/g,' '); }catch(_){ return ''; }
}

async function unlinkContract(c, onDone){
  if(!canEdit()){ toast(i18t('fa_viewers_no_change'),'err'); return; }
  if(!c.parentId) return;
  if(!await confirmDialog({ title:`Unlink ${(window.contractRef?contractRef(c):c.id)}?`,
    message:`It becomes a standalone agreement again. ${(window.contractRef?contractRef(getContract(c.parentId)||{id:c.parentId}):c.parentId)}'s renewal date will go back to its own expiry.`,
    confirmLabel:'Unlink', danger:true })) return;
  const was=c.parentId;
  clearParentLink(c); persist(c);
  const p=getContract(was); if(p) persist(p);
  toast(`${(window.contractRef?contractRef(c):c.id)} unlinked`);
  if(onDone) onDone(); else if(typeof setView==='function') setView(state.view||'workspace');
}

Object.assign(window,{familyOrder,familyCheck,amendSetsValue,effectiveExpiryFrom,asAmendedItems,asAmendedHtml,effectiveTerm,effectiveValueView,EFFECTIVE_TERMS,amendSuggestions,amendChangesHtml,amendmentItemHtml,amendParentClauses,amendParentText,amendParentHtml,FAMILY_TERMS,familyAgreement,familyAgreeLine,
  openLinkModal,unlinkContract,renderFamilySection,
  openCreateAmendmentModal,createAmendment,amendmentDefaultName,amendmentOrdinal,
  amendmentSkeletonBody,RELATION_DOC_WORD,FAMILY_BLANK_BODY,
  CONTRACT_RELATIONS,RELATION_LABEL,TERM_CHANGING,isRelation,
  isChild,isParent,familyChildren,familyIndex,familyIndexDirty,familyParent,familyOf,linkError,applyParentLink,clearParentLink,
  ownExpiry,amendmentDate,effectiveExpiry,proposedExpiry,amendmentExecuted,expirySource,isAgreement,agreementsIn,familyCounts,familyCountLabel,
  AMENDMENT_RE,looksLikeAmendment,guessRelation,suggestParents,logLinkSuggestion,logLinkDecision});
