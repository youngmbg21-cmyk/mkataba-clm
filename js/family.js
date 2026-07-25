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
  { k:'amendment',   label:'Amendment',   blurb:'changes the terms of the parent agreement' },
  { k:'addendum',    label:'Addendum',    blurb:'adds terms without changing the existing ones' },
  { k:'variation',   label:'Variation',   blurb:'varies scope, price or schedule' },
  { k:'renewal',     label:'Renewal',     blurb:'extends the parent agreement for a further term' },
  { k:'sow',         label:'Statement of work', blurb:'work ordered under a master agreement' },
  { k:'annex',       label:'Annex / schedule',  blurb:'a schedule or annex to the parent' },
  { k:'side-letter', label:'Side letter', blurb:'a separate letter modifying the agreement' },
];
const RELATION_LABEL = Object.fromEntries(CONTRACT_RELATIONS.map(r=>[r.k,r.label]));
const isRelation = r => CONTRACT_RELATIONS.some(x=>x.k===r);
/* Relations that can move the end of the term. A parent's effective expiry is
   taken from the most recent of these that actually states one. */
const TERM_CHANGING = new Set(['amendment','variation','renewal','addendum']);

const isChild  = c => !!(c && c.parentId);
const isParent = c => !!(c && !c.parentId && familyChildren(c.id).length);
const familyChildren = id => state.contracts.filter(c=>c.parentId===id);
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
  c.relation = isRelation(relation) ? relation : 'amendment';
  if(note!=null) c.relationNote = String(note);
  const who = (actor && actor.name) || currentUser()?.name || 'System';
  c.audit = c.audit || [];
  c.audit.push({ at:nowISO(), user:who, action:'Linked',
    detail:`Filed as a ${RELATION_LABEL[c.relation].toLowerCase()} of ${parentId}${note?` — ${note}`:''}` });
  return c;
}
/* Undo a link. */
function clearParentLink(c, actor){
  const was=c.parentId;
  delete c.parentId; delete c.relation; delete c.relationNote;
  c.audit=c.audit||[];
  c.audit.push({ at:nowISO(), user:(actor&&actor.name)||currentUser()?.name||'System', action:'Unlinked',
    detail:`No longer filed as an amendment of ${was} — recorded as a standalone agreement` });
  return c;
}

Object.assign(window,{CONTRACT_RELATIONS,RELATION_LABEL,TERM_CHANGING,isRelation,
  isChild,isParent,familyChildren,familyParent,familyOf,linkError,applyParentLink,clearParentLink});
