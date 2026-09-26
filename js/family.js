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
  if(parent.parentId) return `${parent.id} is itself an amendment of ${parent.parentId}. Link to the master agreement instead — HaTi keeps families one level deep on purpose.`;
  if(familyChildren(child.id).length) return `${child.id} already has ${familyChildren(child.id).length} amendment(s) of its own, so it is a master agreement. Move those first if it should become an amendment.`;
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
  return win ? ownExpiry(win) : ownExpiry(c);
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
    return { id:e.doc.id, name:e.doc.name, signed:e.signed,
      moved:a.moved.map(t=>({ k:t.k, label:t.label })), comparable:a.comparable };
  });
  /* WHO GOVERNS EACH MOVED TERM: walked in order, so the last document to
     move a term is the one that holds it. An unsigned document is named but
     does not take the term -- it has not displaced anything yet. */
  const holder=new Map();
  rows.forEach(r=>{ if(!r.signed) return; r.moved.forEach(m=>holder.set(m.k,{ label:m.label, id:r.id })); });
  return { order, rows,
    moved:[...holder.entries()].map(([k,v])=>({ k, label:v.label, id:v.id })),
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
        : `Attach an existing document to <b>${_famEsc(c.id)}</b> as an amendment. Families are one level deep: an amendment cannot itself have amendments.`}</p>
      ${suggested.length?`<div style="border:1px solid var(--color-divider);background:var(--st-steel-bg);border-radius:var(--radius);padding:9px 11px;margin-bottom:var(--s-3)">
        <div style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--accent-ink);margin-bottom:5px">${i18t('fa_hati_suggests')}</div>
        ${suggested.map(x=>`<label style="display:flex;align-items:flex-start;gap:var(--s-2);font-size:var(--t-meta);padding:3px 0;cursor:pointer">
          <input type="radio" name="lk-sug" value="${_famAttr(x.id)}" style="margin-top:3px;accent-color:var(--color-accent)"/>
          <span><b style="font-family:var(--font-mono)">${_famEsc(x.id)}</b> ${_famEsc(x.c.name)}
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
    const list=candidates.filter(x=>!t || (x.name+' '+(x.counterparty||'')+' '+x.id).toLowerCase().includes(t)).slice(0,40);
    results.innerHTML=list.length?list.map(x=>`<button type="button" data-lk-pick="${_famAttr(x.id)}" style="display:flex;width:100%;gap:var(--s-2);align-items:baseline;text-align:left;border:0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent);background:${picked===x.id?'var(--color-accent-100)':'none'};padding:6px 9px;cursor:pointer;font:inherit;font-size:var(--t-meta)">
        <b style="font-family:var(--font-mono);flex:none">${_famEsc(x.id)}</b>
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
    toast(`${c.id} confirmed as a standalone agreement`); if(onDone) onDone();
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
    toast(`${child.id} filed as ${_famAn(w)} ${w} of ${parentId}`);
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
  const names=k.moved.map(m=>`<b>${_famEsc(m.id)}</b> ${_famEsc(String(m.label).toLowerCase())}`);
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
      ? `${r.id}${when} — ${i18t('fa_agree_moves',{ terms:r.moved.map(m=>String(m.label).toLowerCase()).join(', ') })}`
      : `${r.id}${when} — ${r.comparable?i18t('fa_agree_yes'):i18t('fa_agree_unknown')}`);
  });
  if(k.moved.length) out.push('', i18t('fa_check_inforce') + ' ' +
    k.moved.map(m=>`${String(m.label).toLowerCase()} → ${m.id}`).join(', '));
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
      <b style="font-family:var(--font-mono);font-size:var(--t-label);color:var(--accent-ink-700);flex:none">${_famEsc(x.id)}</b>
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
  const acts=[];
  if(canEdit() && !parent){
    acts.push(`<button id="fam-create" class="ui-btn ui-btn-sm ui-btn-primary">${icon('filenew','w-3 h-3')} ${i18t('fa_create_amendment')}</button>`);
    acts.push(`<button id="fam-add" style="${btn}">${i18t('fa_link_existing')}</button>`);
    if(!kids.length) acts.push(`<button id="fam-link" style="${btn}">${i18t('fa_link_parent')}</button>`);
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
      ${parent
        /* The label is NOT lowercased here any more, and the sentence lost its
           indefinite article with it: English wants a/an by the following word
           ("a addendum", "a annex") and Swedish en/ett by the noun's own
           gender, and the seven relations split both ways. Read as a filing
           designation — "filed as Addendum of MK-1042" — neither needs one. */
        ? `<p style="font-size:var(--t-meta);color:var(--color-neutral-700);margin:0 0 var(--s-2);line-height:1.55">${i18t('fa_filed_as')} <b>${_famEsc(RELATION_LABEL[c.relation]||'Amendment')}</b> of <b>${_famEsc(parent.id)}</b>${c.relationNote?` — ${_famEsc(c.relationNote)}`:''}. It does not count as a separate agreement in the KPIs, and its renewal reminder fires on the parent.</p>
           <div class="fam-list">${row(parent,'parent agreement')}</div>`
        : kids.length
        ? `<p style="font-size:var(--t-meta);color:var(--color-neutral-700);margin:0 0 var(--s-2);line-height:1.55">${i18t('fa_this_is_a')} ${i18tn('fa_master_with',kids.length,{n:kids.length})} The family counts as <b>one agreement · ${kids.length+1} documents</b>.${from?` The live expiry <b>${_famEsc(eff)}</b> comes from <b>${_famEsc(from.id)}</b>, not from this document's own date${ownExpiry(c)?` of ${_famEsc(ownExpiry(c))}`:''}.`:''}</p>
           ${prop?`<p style="font-size:var(--t-meta);color:var(--st-amber-fg);margin:0 0 var(--s-2);line-height:1.55">${i18t('fa_proposed_term',{date:_famEsc(prop.date),id:_famEsc(prop.id)})}</p>`:''}
           <div class="fam-list">${kids.map(k=>row(k, `${RELATION_LABEL[k.relation]||'Amendment'}${ownExpiry(k)?' · term to '+ownExpiry(k):''}`, c)).join('')}</div>`
        : `<p style="font-size:var(--t-meta);color:var(--color-neutral-700);margin:0 0 var(--s-2);line-height:1.55">${i18t('fa_standalone_desc')}</p>`}
      ${(suggested.length&&!c.parentId&&!c.linkConfirmed)?`
        <div style="margin-top:10px;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-radius:var(--radius);padding:9px 11px">
          <div style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--st-amber-fg);margin-bottom:3px">${i18t('fa_reads_like_amendment')}</div>
          <div style="font-size:var(--t-meta);color:var(--st-amber-fg);line-height:1.5">${i18t('fa_hati_proposed',{ids:suggested.map(s=>`<b>${_famEsc(s.id)}</b>`).join(', ')})} <b>${i18t('fa_nothing_linked')}</b>${i18t('fa_confirm_or_standalone')}</div>
          ${canEdit()?`<div style="display:flex;gap:6px;margin-top:var(--s-2)"><button id="fam-confirm" style="${btn};border-color:var(--color-accent);color:var(--accent-ink)">${i18t('fa_review_suggestion')}</button>
            <button id="fam-standalone" style="${btn}">${i18t('fa_its_standalone')}</button></div>`:''}
        </div>`:''}
    </div>`;
  const again=()=>{ renderFamilySection(getContract(c.id)); if(typeof renderAuditSection==='function') renderAuditSection(getContract(c.id)); };
  host.querySelectorAll('[data-fam-open]').forEach(b=>b.addEventListener('click',()=>openWorkspace(b.getAttribute('data-fam-open'))));
  document.getElementById('fam-link')?.addEventListener('click',()=>openLinkModal(c, again, {mode:'child'}));
  document.getElementById('fam-confirm')?.addEventListener('click',()=>openLinkModal(c, again, {mode:'child'}));
  document.getElementById('fam-add')?.addEventListener('click',()=>openLinkModal(c, again, {mode:'parent'}));
  document.getElementById('fam-create')?.addEventListener('click',()=>openCreateAmendmentModal(c));
  /* CHECK THE FAMILY (S12). One press, one reading, nothing written and
     nothing spent — so it answers in a plain dialog rather than filing a
     finding anywhere. confirmDialog is the product's own window; there is no
     second act to take, so it is shown with one way out. */
  document.getElementById('fam-check')?.addEventListener('click',()=>{
    let body=''; try{ body=familyCheckReport(c); }catch(_){ body=''; }
    if(!body) return;
    if(window.confirmDialog) confirmDialog({
      title:i18t('fa_check_family'), message:body, multiline:true,
      confirmText:i18t('ct_close')||'Close', cancelText:'' });
    else if(window.toast) toast(body,'ok');
  });
  document.getElementById('fam-unlink')?.addEventListener('click',()=>unlinkContract(c, again));
  document.getElementById('fam-standalone')?.addEventListener('click',()=>{
    logLinkDecision(c,false); persist(c); toast(`${c.id} confirmed as a standalone agreement`); again();
    if(typeof updateSidebarCounts==='function') updateSidebarCounts();
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
  return [
    `<p>This ${word} No. ${ord} is made on ____________${between}.</p>`,
    `<p>The parties entered into the ${pname?`<strong>${pname}</strong>`:'agreement'}${dated} (the &ldquo;Agreement&rdquo;). The parties ${W.wish}.</p>`,
    `<p>${W.lead}</p>`,
    says ? `<p>${_famEsc(says)}</p>` : '',
    `<p>${W.close}</p>`,
  ].filter(Boolean).join('');
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
    value: 0, valueType: parent.valueType || 'estimated',
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
  if(parent.counterpartyEmail) c.counterpartyEmail = parent.counterpartyEmail;
  c.redlineText = (opts.skeleton===false)
    ? FAMILY_BLANK_BODY
    : amendmentSkeletonBody(parent, { relation:rel, ordinal:ord, says:opts.says });
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
  return { contract:c };
}

/* The form. Everything answered already except the one question that cannot be
   guessed — whether this document moves the end of the term. */
/* `opts.relation` preselects the kind (W2-4: the renewal adviser's "Start the
   renewal" opens THIS dialog with Renewal chosen rather than growing a second
   creation path — one door, one set of rules, one audit line). Everything
   about the dialog is otherwise unchanged, and a caller that passes nothing
   still opens on Amendment. */
function openCreateAmendmentModal(parent, onDone, opts){
  if(!canEdit()){ toast(i18t('fa_viewers_no_change'),'err'); return; }
  if(!parent) return;
  if(parent.parentId){ toast(i18t('fa_child_cannot_amend'),'err'); return; }
  const relOpen = (opts && isRelation(opts.relation)) ? opts.relation : 'amendment';
  /* READS THE ONE PAIR (25 Aug 2026). It was a local copy on its own
     padding and type; seven such copies in three flavours is how a form ends
     up two pixels off the form beside it. Through window because this is a
     module and a bare cross-module read throws. */
  const FLD=window.HATI_FLD;
  const SEL='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px var(--s-2);font:inherit;font-size:var(--t-body)';
  const LBL=window.HATI_LBL;
  const HINT='display:block;font-size:var(--t-label);font-weight:var(--w-body);color:var(--color-neutral-600);margin-top:var(--s-1);line-height:1.45';
  const kids=familyChildren(parent.id).length;
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:6px"><span style="color:var(--color-accent)">${icon('filenew','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-page);margin:0">${i18t('fa_create_amendment')}</h3></div>
      <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 var(--s-3);line-height:1.55">${i18t('fa_create_sub',{ref:`<b>${_famEsc(parent.id)} ${_famEsc(parent.name||'')}</b>`})}</p>

      <label style="display:block;margin-bottom:10px"><span style="${LBL}">${i18t('fa_kind_q')}</span>
        <select id="am-rel" style="${SEL}">${CONTRACT_RELATIONS.map(r=>
          `<option value="${r.k}" ${r.k===relOpen?'selected':''}>${r.label} — ${r.blurb}</option>`).join('')}</select></label>

      <label style="display:block;margin-bottom:10px"><span style="${LBL}">${i18t('fa_name')}</span>
        <input id="am-name" value="${_famAttr(amendmentDefaultName(parent,relOpen))}" style="${FLD}"/>
        ${kids?`<span style="${HINT}" id="am-name-hint">${i18tn('fa_name_hint',kids,{n:kids})}</span>`:''}</label>

      ${''/* ---- AND THE HINT TELLS THE TRUTH FOR THIS KIND (audit finding 10) ----
             The field promised that a date typed here becomes the family's live
             expiry and moves the renewal reminder. That is only true for the
             four relations in TERM_CHANGING; on an annex, a statement of work or
             a side letter the date is stored and never read, so somebody set it,
             was told the reminder would move, and it did not. The field stays —
             recording when a schedule runs out is a reasonable thing to want —
             and the sentence under it changes with the kind. Repainted by the
             same handler that renames the document. */}
      <label style="display:block;margin-bottom:10px"><span style="${LBL}">${i18t('fa_end_q')}</span>
        <input id="am-expiry" type="date" placeholder="${_famAttr(i18t('fa_end_unchanged'))}" style="${FLD}"/>
        <span style="${HINT}" id="am-end-hint">${i18t(TERM_CHANGING.has('amendment')?'fa_end_hint':'fa_end_hint_kept')}</span></label>

      <label style="display:block;margin-bottom:10px"><span style="${LBL}">${i18t('fa_note_optional')}</span>
        <input id="am-note" placeholder="${_famAttr(i18t('fa_note_ph'))}" style="${FLD}"/></label>

      ${''/* THE ONE DECISION THAT WAS LEFT OPEN, PUT ON THE FORM RATHER THAN
             BAKED IN. Blank paper was asked for; the four-line skeleton is what
             a real amendment opens with and what HaTi reads to recognise one.
             Both are one press, the skeleton leads because it is the safer
             default, and unticking gives exactly the blank page. */}
      <label style="display:flex;align-items:flex-start;gap:var(--s-2);border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);padding:9px 11px;margin-bottom:14px;cursor:pointer">
        <input type="checkbox" id="am-skeleton" checked style="margin-top:2px;flex:none;accent-color:var(--color-accent)"/>
        <span style="font-size:var(--t-meta)"><b>${i18t('fa_skeleton')}</b>
          <span style="display:block;color:var(--color-neutral-600);line-height:1.5;margin-top:2px">${i18t('fa_skeleton_hint')}</span></span>
      </label>

      <div id="am-err" style="font-size:var(--t-label);color:var(--st-ruby-fg);min-height:15px;margin-bottom:var(--s-2)"></div>
      <div style="display:flex;justify-content:flex-end;gap:var(--s-2)">
        <button id="am-cancel" class="ui-btn">${i18t('act_cancel')}</button>
        <button id="am-go" class="ui-btn ui-btn-primary">${i18t('fa_create_open')}</button>
      </div>
    </div>`, {maxWidth:'520px'});

  const $=id=>document.getElementById(id);
  /* The name follows the kind until somebody types over it — an "Annex No. 1"
     called "Amendment No. 3" is a worse default than no default. Once the field
     has been edited by hand it is theirs and the kind stops rewriting it. */
  let nameTouched=false;
  $('am-name')?.addEventListener('input',()=>{ nameTouched=true; });
  const paintEndHint=()=>{
    const h=$('am-end-hint'); if(!h) return;
    const moves = TERM_CHANGING.has($('am-rel').value);
    h.textContent = i18t(moves?'fa_end_hint':'fa_end_hint_kept');
  };
  paintEndHint();
  $('am-rel')?.addEventListener('change',()=>{
    paintEndHint();
    if(nameTouched) return;
    $('am-name').value = amendmentDefaultName(parent, $('am-rel').value);
  });
  $('am-cancel')?.addEventListener('click',closeModal);
  $('am-go')?.addEventListener('click',()=>{
    const err=$('am-err');
    const name=String($('am-name').value||'').trim();
    if(!name){ err.textContent=i18t('fa_needs_name'); return; }
    const expiry=String($('am-expiry').value||'').trim();
    if(expiry && !(window.dateOnly?dateOnly(expiry):/^\d{4}-\d{2}-\d{2}$/.test(expiry))){
      err.textContent=i18t('fa_bad_date'); return; }
    const made=createAmendment(parent,{
      relation:$('am-rel').value, name, expiry:expiry||null,
      note:String($('am-note').value||'').trim(),
      skeleton: !!$('am-skeleton').checked });
    if(made.error){ err.textContent=made.error; return; }
    closeModal();
    toast(i18t('fa_created',{ id:made.contract.id, pid:parent.id,
      rel:(RELATION_LABEL[made.contract.relation]||'Amendment').toLowerCase() }));
    if(typeof updateSidebarCounts==='function') updateSidebarCounts();
    if(onDone) onDone(made.contract);
    else if(typeof openWorkspace==='function') openWorkspace(made.contract.id);
  });
}

async function unlinkContract(c, onDone){
  if(!canEdit()){ toast(i18t('fa_viewers_no_change'),'err'); return; }
  if(!c.parentId) return;
  if(!await confirmDialog({ title:`Unlink ${c.id}?`,
    message:`It becomes a standalone agreement again. ${c.parentId}'s renewal date will go back to its own expiry.`,
    confirmLabel:'Unlink', danger:true })) return;
  const was=c.parentId;
  clearParentLink(c); persist(c);
  const p=getContract(was); if(p) persist(p);
  toast(`${c.id} unlinked`);
  if(onDone) onDone(); else if(typeof setView==='function') setView(state.view||'workspace');
}

Object.assign(window,{familyOrder,familyCheck,FAMILY_TERMS,familyAgreement,familyAgreeLine,
  openLinkModal,unlinkContract,renderFamilySection,
  openCreateAmendmentModal,createAmendment,amendmentDefaultName,amendmentOrdinal,
  amendmentSkeletonBody,RELATION_DOC_WORD,FAMILY_BLANK_BODY,
  CONTRACT_RELATIONS,RELATION_LABEL,TERM_CHANGING,isRelation,
  isChild,isParent,familyChildren,familyIndex,familyIndexDirty,familyParent,familyOf,linkError,applyParentLink,clearParentLink,
  ownExpiry,amendmentDate,effectiveExpiry,proposedExpiry,amendmentExecuted,expirySource,isAgreement,agreementsIn,familyCounts,familyCountLabel,
  AMENDMENT_RE,looksLikeAmendment,guessRelation,suggestParents,logLinkSuggestion,logLinkDecision});
