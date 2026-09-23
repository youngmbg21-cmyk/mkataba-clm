/* ============================================================================
   WHO THE AGREEMENT IS BETWEEN  (Young ruled it 22 Sep 2026)

   A contract has always had exactly two sides in this product: us, and "the
   counterparty" — one name in `c.counterparty` and one address beside it.
   That is right for the great majority of paper and wrong for the rest: a
   guarantee, a three-way data agreement, a tripartite assignment, any deed
   where a parent company stands behind its subsidiary.

   THIS FILE IS THE ONE READING OF WHO THE PARTIES ARE. Every screen that has
   to name them asks it; nothing works the list out for itself.

   ---- THE STORED SHAPE, AND WHY `c.counterparty` DOES NOT MOVE ----

   `c.parties` is an ordinary field and is ABSENT on every record on file.
   MEASURED before a line was written: `.counterparty` is read 432 times
   across 40 files — the register, the graph, payment terms, precedent,
   friction, the share dialog, the reminders, the phone, the server. Rewriting
   those is not a migration, it is a rebuild of the product, and every one of
   them would be a place the two readings could drift.

   So the rule is: **`c.counterparty` IS THE FIRST OUTSIDE PARTY'S NAME, and
   `c.counterpartyEmail` IS ITS ADDRESS, always.** `partiesSet` is the ONE
   writer and keeps them in step in the same breath. A contract with two
   parties therefore stores exactly what it stored yesterday, and all 432
   readings keep answering what they answered yesterday. A contract with three
   parties answers the first one to a reader that only knows how to ask for
   one — which is the honest answer to that question, not a guess.

   ---- PEOPLE ARE NOT PARTIES ----

   js/participants.js (21 Sep 2026) names PEOPLE — colleagues and the people
   at the other end — and gives each a role and an access level. THIS file
   names LEGAL ENTITIES on the agreement. One contract can have three parties
   and eleven people, or two parties and two people. Naming Kari Hansen as
   "Signs for them" does not make her company a second party; adding the
   Guarantor as a party does not name anybody at it.

   The two are joined at exactly one point and in one direction: a signer row
   and a share may carry a `partyId` saying which party that person acts for.
   Nothing here reads participants, and participants read nothing here.

   No route, no server field, no mail (f356 greps). The list TRAVELS, because
   who the agreement is between is on the face of the paper and the other side
   is one of them — but only as the parties, never with our own people on it.
   ========================================================================= */

/* The three answers to "what may this party do here", widest first. A party
   that only signs never gets a negotiation link (D8); a party that does
   neither is on the paper and in the record and nowhere else (a landlord's
   consent recorded for completeness, say). */
const PARTY_INVOLVEMENT = ['negotiate', 'sign', 'none'];
const PARTY_INVOLVEMENT_DEFAULT = 'negotiate';

/* OUR SIDE IS A SIDE, NOT AN INVOLVEMENT. Exactly one party is `ours`, it is
   always first, and it is not removable: a contract we are not a party to is
   not a contract in this workspace. */
const PARTY_SIDE_OURS = 'ours';
const PARTY_SIDE_THEIRS = 'theirs';

const PARTY_NAME_MAX = 160;
const PARTY_ROLE_MAX = 60;
const PARTY_ADDR_MAX = 200;
/* A ceiling, never a product limit: a contract with more parties than this is
   a signing sheet, and the refusal says so rather than truncating in silence. */
const PARTY_MAX = 12;

const _pyStr = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max || 200);
const _pyFold = v => _pyStr(v, 300).toLowerCase();

/* ---------------------------------------------------------------------------
   THE READING

   `contractParties(c)` answers for EVERY contract, including every one on
   file, and it never writes. A record with no stored list is read as the two
   parties it has always had — so a screen built on this reading draws today's
   contracts exactly as they are drawn today, which is what makes it safe to
   put behind every surface at once.
   --------------------------------------------------------------------------- */
function partyOurName(c){
  /* OUR ENTITY ON THIS AGREEMENT, never the workspace — contractParty's own
     rule (js/core.js): what the DOCUMENT says, falling back to what the
     PLATFORM says. Read through window because this file loads on stages that
     have no core. */
  try{
    if(typeof window !== 'undefined' && typeof window.contractParty === 'function'){
      const v = _pyStr(window.contractParty(c), PARTY_NAME_MAX);
      if(v) return v;
    }
  }catch(_){}
  const own = _pyStr(c && c.party, PARTY_NAME_MAX);
  if(own) return own;
  try{ return _pyStr((typeof window !== 'undefined' && window.FIRST_PARTY) || '', PARTY_NAME_MAX); }catch(_){ return ''; }
}

function _pyRow(p, i){
  const side = p.side === PARTY_SIDE_OURS ? PARTY_SIDE_OURS : PARTY_SIDE_THEIRS;
  const inv = PARTY_INVOLVEMENT.indexOf(p.involvement) >= 0 ? p.involvement : PARTY_INVOLVEMENT_DEFAULT;
  return {
    id: _pyStr(p.id, 40) || ('py_' + i),
    name: _pyStr(p.name, PARTY_NAME_MAX),
    role: _pyStr(p.role, PARTY_ROLE_MAX),
    address: _pyStr(p.address, PARTY_ADDR_MAX),
    email: _pyStr(p.email, 200),
    side,
    /* OUR OWN SIDE ALWAYS NEGOTIATES AND SIGNS. The control is not drawn for
       it and a stored value is ignored, so a record edited by hand cannot
       arrive saying we are a party that may not sign its own agreement. */
    involvement: side === PARTY_SIDE_OURS ? 'negotiate' : inv,
  };
}

function contractParties(c){
  if(!c) return [];
  const stored = Array.isArray(c.parties) ? c.parties.filter(p => p && typeof p === 'object') : null;
  if(stored && stored.length){
    const rows = stored.map(_pyRow);
    /* OURS LEADS, whatever order the record happens to hold, because every
       surface that draws this list draws us first. */
    const ours = rows.filter(r => r.side === PARTY_SIDE_OURS);
    const theirs = rows.filter(r => r.side !== PARTY_SIDE_OURS);
    if(ours.length){
      const us = ours[0];
      if(!us.email) us.email = partyOurEmail(c);
      return [us].concat(theirs);
    }
    return [_pyDerivedOurs(c)].concat(theirs);
  }
  /* ---- NOTHING STORED: the two parties this contract has always had ----
     A contract with no counterparty named yet answers with our row alone,
     which is true and is what the Overview draws a single row for. */
  const out = [_pyDerivedOurs(c)];
  const them = _pyStr(c.counterparty, PARTY_NAME_MAX);
  if(them) out.push(_pyRow({ id: 'py_them', name: them, side: PARTY_SIDE_THEIRS,
    email: _pyStr(c.counterpartyEmail, 200), involvement: 'negotiate' }, 1));
  return out;
}

function _pyDerivedOurs(c){
  return _pyRow({ id: 'py_us', name: partyOurName(c), email: partyOurEmail(c), side: PARTY_SIDE_OURS, involvement: 'negotiate' }, 0);
}

/* ---- OUR SIDE HAS AN ADDRESS TOO (Young reported it 23 Sep 2026: "there is
   no email for US") ----
   The other side's row always printed an address and ours printed none, so
   the one fact the reader most often needs from our row — who at our end the
   other side writes to — was missing. The answer is the contract's OWNER, the
   colleague who raised it and whose name the head already prints: their
   address is looked up off the member list, never typed a second time and
   never stored on the contract. A row that already carries one keeps it. No
   owner, or an owner the member list does not know, is an honest blank. */
function partyOurEmail(c){
  try{
    const o = c && c.owner;
    const users = (typeof window !== 'undefined' && typeof window.getUsers === 'function') ? (window.getUsers() || []) : [];
    if(!o || !users.length) return '';
    const u = (o.id != null && users.find(x => String(x.id) === String(o.id)))
      || (o.name && users.find(x => x.name === o.name)) || null;
    return _pyStr(u && u.email, 200);
  }catch(_){ return ''; }
}

/* Everybody who is not us. THE LIST EVERY "which party" CONTROL OFFERS. */
function partiesTheirs(c){ return contractParties(c).filter(p => p.side !== PARTY_SIDE_OURS); }
/* Us. Always exactly one. */
function partyOurs(c){ return contractParties(c).find(p => p.side === PARTY_SIDE_OURS) || _pyDerivedOurs(c); }

/* Is this contract actually a multi-party one? Asked wherever a control is
   drawn ONLY where there is more than one outside party — the share dialog's
   party box, the register's count, the fact row's count. On an ordinary
   two-party contract every one of those stands down and the screen is exactly
   what it was. */
function partiesMulti(c){ return partiesTheirs(c).length > 1; }

/* WHO NEGOTIATES. A signs-only party never gets a negotiation link (D8), so
   this is the population a round is sent to and the population a change has
   to be answered by. */
function partiesNegotiating(c){ return partiesTheirs(c).filter(p => p.involvement === 'negotiate'); }
/* WHO SIGNS. Both involvements sign; only `none` does not. */
function partiesSigning(c){ return partiesTheirs(c).filter(p => p.involvement !== 'none'); }

function partyById(c, id){
  const key = _pyStr(id, 40);
  if(!key) return null;
  return contractParties(c).find(p => p.id === key) || null;
}

/* The name to print for a party id, and never an empty string where the id
   named something the record has since dropped — an absence is stated. */
function partyName(c, id){
  const p = partyById(c, id);
  return p ? p.name : '';
}

/* THE WORD THE PAPER CALLS THEM ("the Provider"), which is a fact about this
   agreement and not a label this product chose. Where none is recorded the
   paper says nothing rather than inventing one. */
function partyRoleWord(p){ return p && p.role ? p.role : ''; }

/* ---- AND IT IS A CHOICE, NOT A BLANK PAGE (Young ruled it 22 Sep 2026:
   "contract type should be a drop down of choices", over the Edit party
   window) ----
   MEASURED first, and the report is right for a reason the words do not say:
   that box was LABELLED with `ov_f_type` — "Contract type" — which is the
   Overview's own label for `metadata.contractType`, the kind of agreement.
   This field is not that. It is the word THIS paper uses for THIS party, and
   its own placeholder said so all along. So the box gets its choices, and it
   gets the label it should have had.

   THE WORDS ARE KEYS, NOT LITERALS, because the list is a SUGGESTION made to
   a reader in their own language — a Swedish workspace describing a Swedish
   agreement is offered Swedish words. WHAT IS STORED IS THE PAPER'S OWN WORD
   AND IS NEVER TRANSLATED: partiesSet keeps whatever was in the box and
   partyRoleWord reads it back raw. That is the RECORD-versus-LABEL rule this
   codebase has paid for before.

   IT OFFERS AND NEVER REFUSES, which is the value-stream picker's own
   mechanism rather than a second idea of one: a stored word that is not on
   the list stays on the list (or reopening a record would silently re-word
   it), and the last option is the sentinel that opens one name box. */
const PARTY_ROLE_WORDS = Object.freeze(['supplier','customer','provider','client',
  'seller','buyer','distributor','principal','licensor','licensee','lessor','lessee',
  'contractor','consultant','discloser','recipient','guarantor','agent']);
const PARTY_ROLE_OTHER = '__other__';
/* {v,l} pairs, the shape fieldOpt and every picker in this product reads. */
function partyRoleOptions(current){
  const say = k => (typeof i18t === 'function') ? i18t('py_rw_' + k) : k;
  const out = PARTY_ROLE_WORDS.map(k => ({ v: say(k), l: say(k) }));
  const cur = String(current || '').trim();
  if(cur && !out.some(o => o.v.toLowerCase() === cur.toLowerCase())) out.unshift({ v: cur, l: cur });
  return out;
}

/* One line for a screen that has room for a name and a role and no more. */
function partyLine(p){
  if(!p) return '';
  return p.role ? p.name + ' · ' + p.role : p.name;
}

/* ---------------------------------------------------------------------------
   THE SEARCH, AND THE COUNT

   `partiesMatch` is what makes a contract findable by the name of the company
   that GUARANTEES it, not only by the one that signs it. The register's own
   search, the palette and the phone all ask it.
   --------------------------------------------------------------------------- */
function partiesMatch(c, q){
  const needle = _pyFold(q);
  if(!needle) return false;
  return contractParties(c).some(p => _pyFold(p.name).indexOf(needle) >= 0);
}

/* "AIT Worldwide Logistics Norway AS +1" — the lead name and how many more.
   Returns `{name, more, all}`; `more` is 0 on every ordinary contract, so a
   caller drawing the count draws nothing there. */
function partiesLead(c){
  const theirs = partiesTheirs(c);
  return {
    name: theirs.length ? theirs[0].name : '',
    more: Math.max(0, theirs.length - 1),
    all: theirs.map(p => p.name).filter(Boolean),
  };
}

/* ---------------------------------------------------------------------------
   THE ONE WRITER

   Nothing else writes `c.parties`. It keeps `c.counterparty` and
   `c.counterpartyEmail` in step in the same breath, which is the whole reason
   432 readings did not have to change — and it returns a REFUSAL SENTENCE
   rather than a boolean, so every door says the same thing for the same
   reason.
   --------------------------------------------------------------------------- */
function _pyT(key, vars){
  try{ if(typeof i18t === 'function') return i18t(key, vars); }catch(_){}
  return key;
}

function partiesRefusal(list){
  const rows = (list || []).map(_pyRow);
  const theirs = rows.filter(r => r.side !== PARTY_SIDE_OURS);
  if(rows.length > PARTY_MAX) return _pyT('py_too_many', { n: PARTY_MAX });
  if(theirs.some(r => !r.name)) return _pyT('py_need_name');
  /* TWO PARTIES WITH ONE NAME is a record nobody can act on: a link binds to
     a party, a decision is recorded against a party, and a signing step names
     one. Folded, because "AIT Worldwide Logistics AS" twice with different
     capitals is the same company. */
  const seen = new Set();
  for(const r of theirs){
    const k = _pyFold(r.name);
    if(seen.has(k)) return _pyT('py_same_name', { name: r.name });
    seen.add(k);
  }
  return null;
}

function partiesSet(c, list){
  if(!c) return _pyT('py_need_name');
  const why = partiesRefusal(list);
  if(why) return why;

  const rows = (list || []).map(_pyRow);
  const ours = rows.filter(r => r.side === PARTY_SIDE_OURS).slice(0, 1);
  const theirs = rows.filter(r => r.side !== PARTY_SIDE_OURS);
  const out = (ours.length ? ours : [_pyDerivedOurs(c)]).concat(theirs);

  c.parties = out;
  /* ---- THE STORED COUNTERPARTY IS THE FIRST OUTSIDE PARTY, ALWAYS ----
     This single pair of lines is what keeps four hundred readings honest.
     Never remove it without moving all of them. */
  c.counterparty = theirs.length ? theirs[0].name : '';
  if(theirs.length && theirs[0].email) c.counterpartyEmail = theirs[0].email;
  else if(!theirs.length) delete c.counterpartyEmail;
  return null;
}

/* A fresh id for a row somebody is adding. Its own prefix, so it can never be
   mistaken for a clause id, a signer id or a share token. */
function partyNewId(){ return 'py_' + Math.random().toString(36).slice(2, 8); }

/* ---------------------------------------------------------------------------
   WHICH PARTY A PERSON ACTS FOR

   A signer row and a share both carry an optional `partyId`. ABSENT MEANS THE
   OLD READING — ours if the row is internal, the first outside party if it is
   not — so every row on file answers the party it has always answered.
   --------------------------------------------------------------------------- */
function partyOfSigner(c, s){
  if(!s) return null;
  const named = partyById(c, s.partyId);
  if(named) return named;
  if(s.party === 'counterparty'){
    const theirs = partiesTheirs(c);
    return theirs.length ? theirs[0] : null;
  }
  return partyOurs(c);
}

function partyOfShare(c, sh){
  if(!sh) return null;
  const named = partyById(c, sh.partyId);
  if(named) return named;
  /* A link with no party on it is the first outside party's, which is what
     every link on file is. Matching by ADDRESS is deliberately NOT done here:
     two people at two parties can share a domain, and guessing which company
     a link belongs to is exactly the thing this build exists to stop. */
  const theirs = partiesTheirs(c);
  return theirs.length ? theirs[0] : null;
}

/* ---------------------------------------------------------------------------
   WHAT TRAVELS

   The other side is one of the parties, so the list is on the face of the
   paper they read and refusing to send it would mean their copy said
   something different from ours. What does NOT travel is anything about who
   at that party we deal with, or what we recorded about the others beyond
   their name and their role on the paper.
   --------------------------------------------------------------------------- */
function partiesForPayload(c){
  return contractParties(c).map(p => ({
    id: p.id, name: p.name, role: p.role, address: p.address,
    side: p.side, involvement: p.involvement,
  }));
}

if(typeof window !== 'undefined'){
  Object.assign(window, {
    PARTY_INVOLVEMENT, PARTY_INVOLVEMENT_DEFAULT, PARTY_SIDE_OURS, PARTY_SIDE_THEIRS,
    PARTY_MAX, PARTY_NAME_MAX, PARTY_ROLE_MAX, PARTY_ADDR_MAX,
    contractParties, partiesTheirs, partyOurs, partyOurName, partyOurEmail, partiesMulti,
    partiesNegotiating, partiesSigning, partyById, partyName, partyRoleWord, partyLine,
    partiesMatch, partiesLead, partiesRefusal, partiesSet, partyNewId,
    partyOfSigner, partyOfShare, partiesForPayload,
    PARTY_ROLE_WORDS, PARTY_ROLE_OTHER, partyRoleOptions,
  });
}
if(typeof module !== 'undefined' && module.exports){
  module.exports = {
    PARTY_INVOLVEMENT, PARTY_INVOLVEMENT_DEFAULT, PARTY_SIDE_OURS, PARTY_SIDE_THEIRS,
    PARTY_MAX, contractParties, partiesTheirs, partyOurs, partyOurName, partyOurEmail, partiesMulti,
    partiesNegotiating, partiesSigning, partyById, partyName, partyRoleWord, partyLine,
    partiesMatch, partiesLead, partiesRefusal, partiesSet, partyNewId,
    partyOfSigner, partyOfShare, partiesForPayload,
    PARTY_ROLE_WORDS, PARTY_ROLE_OTHER, partyRoleOptions,
  };
}
