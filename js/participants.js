/* ============================================================
   WHO IS ON THIS CONTRACT (Young ruled 21 September 2026)
   ============================================================
   *"when you draft a new agreement, before you create the draft you should
   have the option to add the other participants to the contract, roles and
   their access levels. Should you choose to skip this, there should be
   another door in the contract page."*

   WHAT THIS IS, AND WHAT IT IS NOT. It is a RECORD of the people on one
   agreement and the job each of them has. It is NOT a second permissions
   system: HaTi already decides who may open a contract (the value stream and
   the person's own access), and naming somebody here cannot widen that by a
   single field. The owner ruled it himself — *"narrow only"*.

   EVERY ROLE IS A JOB THE PRODUCT ALREADY KEEPS A LIST FOR: the signing
   order, the approval chain, the standing reviewer, a seat at the desk, and
   the three kinds of link. So a role here is an ANSWER TO A QUESTION THE
   PRODUCT ALREADY ASKS, written down early, where the question is usually
   asked late and by somebody who has to remember it. `participantFills` is
   the one statement of which list each role belongs to, and it is printed on
   screen: a reader should never have to guess what naming somebody did.

   WHAT IT DOES NOT DO, SAID OUT LOUD SO NOBODY ASSUMES OTHERWISE:
     · it emails nobody. An invitation goes with the first send, which is the
       one door that has always carried a link, and the send screen reads this
       list rather than asking for the same address again.
     · it does not write the signing order. saveSignerPlan is the ONE
       authority on naming signers and stays so; what this adds is the ANSWER
       ALREADY IN THE BOX when that editor opens on an empty plan.
     · it grants nothing. See participantReach.

   NO ROUTE, NO SERVER FIELD OF ITS OWN: `c.participants` is an ordinary
   field on the contract, absent on every record on file, and it does NOT
   travel — it is not on the share payload's allow-list, because who is on our
   side of an agreement is not the counterparty's business. */

const PARTY_SIDES = ['ours', 'theirs'];
/* THE ORDER IS THE MENU'S ORDER, and ours leads because the commonest thing
   somebody does here is name a colleague. `fills` names the list the role
   belongs to — the sentence printed beside it — and `list` is the machine
   key a screen can act on. */
const PARTY_ROLES = [
  { k: 'owner',     side: 'ours',   list: 'owner',    get label(){ return i18t('ppl_r_owner'); },     get fills(){ return i18t('ppl_f_owner'); } },
  { k: 'sign',      side: 'ours',   list: 'signers',  get label(){ return i18t('ppl_r_sign'); },      get fills(){ return i18t('ppl_f_sign'); } },
  { k: 'approve',   side: 'ours',   list: 'approval', get label(){ return i18t('ppl_r_approve'); },   get fills(){ return i18t('ppl_f_approve'); } },
  { k: 'review',    side: 'ours',   list: 'review',   get label(){ return i18t('ppl_r_review'); },    get fills(){ return i18t('ppl_f_review'); } },
  { k: 'contribute',side: 'ours',   list: 'desk',     get label(){ return i18t('ppl_r_contribute'); },get fills(){ return i18t('ppl_f_contribute'); } },
  { k: 'read',      side: 'ours',   list: 'view',     get label(){ return i18t('ppl_r_read'); },      get fills(){ return i18t('ppl_f_read'); } },
  { k: 'cpsign',    side: 'theirs', list: 'signers',  get label(){ return i18t('ppl_r_cpsign'); },    get fills(){ return i18t('ppl_f_cpsign'); } },
  { k: 'negotiate', side: 'theirs', list: 'negotiate',get label(){ return i18t('ppl_r_negotiate'); }, get fills(){ return i18t('ppl_f_negotiate'); } },
  { k: 'advise',    side: 'theirs', list: 'advise',   get label(){ return i18t('ppl_r_advise'); },    get fills(){ return i18t('ppl_f_advise'); } },
  { k: 'cpread',    side: 'theirs', list: 'view',     get label(){ return i18t('ppl_r_cpread'); },    get fills(){ return i18t('ppl_f_cpread'); } },
];
const PARTY_ROLE_OF = Object.fromEntries(PARTY_ROLES.map(r => [r.k, r]));
/* ---- ACCESS NARROWS; IT NEVER GRANTS (the owner's ruling, 21 Sep 2026) ----
   Four rungs, widest first, and every one of them is a way of showing LESS
   than the role would otherwise show. There is deliberately no rung above
   `all`: a person who cannot reach this contract is not given it by being
   named on it, and a role is never a way round the workspace's own rules. */
const PARTY_ACCESS = [
  { k: 'all',      get label(){ return i18t('ppl_a_all'); },      get sub(){ return i18t('ppl_a_all_s'); } },
  { k: 'nomoney',  get label(){ return i18t('ppl_a_nomoney'); },  get sub(){ return i18t('ppl_a_nomoney_s'); } },
  { k: 'clauses',  get label(){ return i18t('ppl_a_clauses'); },  get sub(){ return i18t('ppl_a_clauses_s'); } },
  { k: 'readonly', get label(){ return i18t('ppl_a_readonly'); }, get sub(){ return i18t('ppl_a_readonly_s'); } },
];
const PARTY_ACCESS_OF = Object.fromEntries(PARTY_ACCESS.map(a => [a.k, a]));
const PARTY_ACCESS_DEFAULT = 'all';

const _ptW = n => { try{ return window[n]; }catch(_){ return undefined; } };
const _ptCall = (n, ...a) => { const f = _ptW(n); try{ return typeof f === 'function' ? f(...a) : null; }catch(_){ return null; } };
const _ptStr = v => String(v == null ? '' : v).trim();
const _ptFold = v => _ptStr(v).toLowerCase();

/* READING MUST NOT WRITE: the list is read RAW and a contract that has never
   named anybody stays without the field. */
function participantsOf(c){
  const list = c && Array.isArray(c.participants) ? c.participants : [];
  /* EVERY ROW THE READER CAN SEE, including one they have only just added and
     not yet typed into. Filtering the blank ones out here was the obvious
     defensive thing to do and it made `Add someone` do nothing at all: the row
     was minted and then hidden by the reading that drew the list. A row with
     nothing in it is a row somebody started; the ✕ beside it is how it goes. */
  return list.filter(Boolean);
}
function participantSideOf(role){ const r = PARTY_ROLE_OF[_ptStr(role)]; return r ? r.side : 'ours'; }
function participantRoleLabel(role){ const r = PARTY_ROLE_OF[_ptStr(role)]; return r ? r.label : _ptStr(role); }
function participantFills(role){ const r = PARTY_ROLE_OF[_ptStr(role)]; return r ? r.fills : ''; }
function participantAccessLabel(k){ const a = PARTY_ACCESS_OF[_ptStr(k) || PARTY_ACCESS_DEFAULT]; return a ? a.label : ''; }
function participantsBySide(c, side){
  return participantsOf(c).filter(p => participantSideOf(p.role) === side);
}

/* ---- THE THREE ACTS, AND THEY ARE THE ONLY WRITERS ---- */
const PARTY_ID = () => 'pt_' + Math.random().toString(36).slice(2, 8);
/* ONE PERSON, ONE ROW PER ROLE. The same colleague can sign AND review, which
   is two rows; the same colleague twice in one role is a mistake, and it is
   refused rather than de-duplicated silently. */
function participantDuplicate(c, p){
  const mail = _ptFold(p && p.email), role = _ptStr(p && p.role);
  if (!mail) return null;
  return participantsOf(c).find(x => x.id !== (p && p.id)
    && _ptFold(x.email) === mail && _ptStr(x.role) === role) || null;
}
function participantAdd(c, p){
  if (!c || !p) return null;
  const name = _ptStr(p.name), email = _ptStr(p.email);
  const role = PARTY_ROLE_OF[_ptStr(p.role)] ? _ptStr(p.role) : 'read';
  const access = PARTY_ACCESS_OF[_ptStr(p.access)] ? _ptStr(p.access) : PARTY_ACCESS_DEFAULT;
  const row = { id: PARTY_ID(), name, email, role, access,
    memberId: _ptStr(p.memberId) || '', at: new Date().toISOString(),
    by: (_ptCall('currentUser') || {}).name || '' };
  if (participantDuplicate(c, row)) return null;
  c.participants = Array.isArray(c.participants) ? c.participants : [];
  c.participants.push(row);
  return row;
}
const PARTY_PATCH_KEYS = ['name', 'email', 'role', 'access', 'memberId'];
function participantSet(c, id, patch){
  const row = participantsOf(c).find(p => p.id === id);
  if (!row || !patch) return null;
  const before = _ptStr(row.email);
  PARTY_PATCH_KEYS.forEach(k => {
    if (!(k in patch)) return;
    if (k === 'role' && !PARTY_ROLE_OF[_ptStr(patch.role)]) return;
    if (k === 'access' && !PARTY_ACCESS_OF[_ptStr(patch.access)]) return;
    row[k] = _ptStr(patch[k]);
  });
  /* AN OUTSIDE PERSON'S ADDRESS IS THE ADDRESS BOOK'S — the record, the
     signing route and the parties follow it in the same breath. */
  if (participantSideOf(row.role) === 'theirs') contactFollow(c, before, row.email);
  return row;
}
function participantRemove(c, id){
  const list = Array.isArray(c && c.participants) ? c.participants : null;
  if (!list) return false;
  const i = list.findIndex(p => p && p.id === id);
  if (i < 0) return false;
  const gone = list[i];
  list.splice(i, 1);
  /* TAKING OFF THE CONTACT TAKES OFF ITS ADDRESS. The record's copy of it is a
     mirror; left behind, the reading below would bring the person straight
     back as the record's contact. */
  if (gone && gone.main && participantSideOf(gone.role) === 'theirs') contactUnmirror(c, gone);
  return true;
}

/* ============================================================
   ONE ADDRESS BOOK (the process review, 4 Oct 2026)
   ============================================================
   The other side's people could be typed in ten boxes — the three creation
   forms, the upload, the Overview's "Their email", this list, the parties
   editor, the signing route, the send screen and the handover — and each kept
   its own copy. THIS LIST IS NOW THE ONE STORE for an outside person's name
   and address. `contactSet` is the ONE writer every box writes through and
   `contactsOf` / `contactEmail` the ONE reading every box reads through.

   THE OLD FIELDS ARE MIRRORS, kept in step by the writer, because hundreds of
   readings (and the server) read them: `c.counterpartyEmail` and
   `c.counterpartyName` are the first outside party's MAIN contact, a stored
   party's `email` is that party's main contact, and a signer on the route
   carries the address of the person they are. A record on file that has never
   been written through here is READ as if it had (`contactsOf` derives the
   rows from the mirrors) — reading never writes.

   AN ADDRESS BELONGS TO A PERSON. Changing it in any box moves it everywhere
   that person appears — their other roles, the route, the record — so the
   same person never carries two addresses. Two DIFFERENT people (the finance
   director signs, the commercial lead argues) have two addresses and neither
   is touched. The route follows only while it may still change: never a row
   that has signed, never once anybody has. */
const CONTACT_ROLE_OF_PURPOSE = { sign: 'cpsign', negotiate: 'negotiate', view: 'cpread', advise: 'advise', history: 'cpread' };
const CONTACT_MAIN_ROLE = 'negotiate';
function _ctTheirs(c){ const t = _ptCall('partiesTheirs', c); return Array.isArray(t) ? t : []; }
function _ctFirstPartyId(c){ const t = _ctTheirs(c); return t.length ? _ptStr(t[0].id) : ''; }
/* ABSENT MEANS THE FIRST OUTSIDE PARTY — the share's and the signer's own
   rule (partyOfShare, partyOfSigner), so a row on file needs no migration. */
function contactPartyOf(c, row){ return _ptStr(row && row.partyId) || _ctFirstPartyId(c); }
function _ctOutside(p){ return !!p && participantSideOf(p.role) === 'theirs'; }
function _ctStoredMain(c, partyId){
  const want = _ptStr(partyId) || _ctFirstPartyId(c);
  return participantsOf(c).find(p => _ctOutside(p) && p.main && contactPartyOf(c, p) === want) || null;
}
/* THE READING: every outside person this contract knows, stored rows first,
   then the ones only a mirror still names (a record on file, a route saved
   before this existed). Fresh objects — nothing here writes. */
function contactsOf(c){
  if (!c) return [];
  const out = participantsOf(c).filter(_ctOutside)
    .map(p => Object.assign({}, p, { partyId: contactPartyOf(c, p), main: !!p.main }));
  const theirs = _ctTheirs(c);
  const mainFor = pid => out.some(r => r.main && r.partyId === pid);
  if (theirs.length){
    theirs.forEach((py, i) => {
      const pid = _ptStr(py.id);
      if (mainFor(pid)) return;
      const em = i === 0 ? (_ptStr(c.counterpartyEmail) || _ptStr(py.email)) : _ptStr(py.email);
      if (!em) return;
      out.push({ id: '', derived: true, main: true, partyId: pid, role: CONTACT_MAIN_ROLE,
        access: PARTY_ACCESS_DEFAULT, name: i === 0 ? _ptStr(c.counterpartyName) : '', email: em });
    });
  } else if (_ptStr(c.counterpartyEmail) && !mainFor('')){
    out.push({ id: '', derived: true, main: true, partyId: '', role: CONTACT_MAIN_ROLE,
      access: PARTY_ACCESS_DEFAULT, name: _ptStr(c.counterpartyName), email: _ptStr(c.counterpartyEmail) });
  }
  (Array.isArray(c.signerPlan) ? c.signerPlan : []).forEach(s => {
    if (!s || s.party !== 'counterparty' || !_ptStr(s.email)) return;
    const k = _ptFold(s.email);
    if (out.some(r => r.role === 'cpsign' && _ptFold(r.email) === k)) return;
    out.push({ id: '', derived: true, main: false, partyId: _ptStr(s.partyId) || _ctFirstPartyId(c),
      role: 'cpsign', access: PARTY_ACCESS_DEFAULT, name: _ptStr(s.name), email: _ptStr(s.email) });
  });
  return out;
}
/* The party's main contact — who "Their email" means — or null. */
function contactMain(c, partyId){
  const want = _ptStr(partyId) || _ctFirstPartyId(c);
  return contactsOf(c).find(r => r.main && r.partyId === want) || null;
}
function contactEmail(c, partyId){ const m = contactMain(c, partyId); return m ? _ptStr(m.email) : ''; }

/* THE ONE WRITER.
   p: { id?, partyId?, name?, email?, role?, main?, was? }
     · `main` writes the party's main contact ("Their email" on every form)
     · `was` is the address this person had before — a box that edits a
       signer passes the old one so the same person is found and moved
     · `name` absent leaves the stored name alone
   Returns the stored row, or null where there was nothing to keep. */
function contactSet(c, p){
  if (!c || !p) return null;
  const firstId = _ctFirstPartyId(c);
  const partyId = _ptStr(p.partyId) || firstId;
  const r0 = PARTY_ROLE_OF[_ptStr(p.role)];
  const role = p.main ? CONTACT_MAIN_ROLE : (r0 && r0.side === 'theirs' ? r0.k : CONTACT_MAIN_ROLE);
  const has = k => Object.prototype.hasOwnProperty.call(p, k) && p[k] !== undefined;
  const email = has('email') ? _ptStr(p.email) : undefined;
  const name = has('name') ? _ptStr(p.name) : undefined;
  const list = participantsOf(c);
  const samePerson = (x, mail) => _ctOutside(x) && mail && _ptFold(x.email) === _ptFold(mail)
    && contactPartyOf(c, x) === partyId;
  let row = null;
  if (p.id) row = list.find(x => x.id === p.id) || null;
  if (!row && p.main) row = _ctStoredMain(c, partyId);
  if (!row && p.main && email) row = list.find(x => samePerson(x, email) && _ptStr(x.role) === role) || null;
  if (!row && p.was) row = list.find(x => samePerson(x, p.was) && _ptStr(x.role) === role) || null;
  if (!row && email) row = list.find(x => samePerson(x, email) && _ptStr(x.role) === role) || null;
  const derived = p.main ? contactMain(c, partyId) : null;
  const before = row ? _ptStr(row.email) : (derived ? _ptStr(derived.email) : _ptStr(p.was));
  if (!row){
    if (!email && !name){
      /* Emptying a contact that only a mirror held empties the mirror. */
      if (p.main && derived) contactUnmirror(c, derived);
      return null;
    }
    row = participantAdd(c, { name: name != null ? name : (derived ? derived.name : ''),
      email: email || '', role, access: PARTY_ACCESS_DEFAULT });
    if (!row) return null;
    if (partyId) row.partyId = partyId;
  } else {
    if (email !== undefined) row.email = email;
    if (name !== undefined) row.name = name;
  }
  if (p.main) row.main = true;
  /* A CONTACT WITH NEITHER NAME NOR ADDRESS IS NOBODY — it goes, and the
     mirrors go with it, so the record does not keep what the book dropped. */
  if (!_ptStr(row.email) && !_ptStr(row.name)){
    participantRemove(c, row.id);
    if (row.main) contactUnmirror(c, row);
    return null;
  }
  contactFollow(c, before, row.email);
  return row;
}

/* THE SAME PERSON, EVERYWHERE THEY APPEAR: the other rows that carry the old
   address, the route while it may change, and then the mirrors. */
function contactFollow(c, before, after){
  if (!c) return;
  const was = _ptFold(before), now = _ptStr(after);
  if (was && was !== _ptFold(now)){
    participantsOf(c).forEach(x => { if (_ctOutside(x) && _ptFold(x.email) === was) x.email = now; });
    const locked = _ptCall('signingLocked', c) === true;
    if (!locked && Array.isArray(c.signerPlan)){
      c.signerPlan.forEach(s => {
        if (s && s.party === 'counterparty' && !s.signed && _ptFold(s.email) === was) s.email = now;
      });
    }
    /* AND A MIRROR NOBODY HAS WRITTEN THROUGH HERE YET carries the same
       person's address — a record on file whose contact is this person. */
    if (!_ctStoredMain(c, _ctFirstPartyId(c)) && _ptFold(c.counterpartyEmail) === was){
      if (now) c.counterpartyEmail = now; else delete c.counterpartyEmail;
    }
    if (Array.isArray(c.parties)){
      c.parties.forEach(py => {
        if (py && py.side !== 'ours' && !_ctStoredMain(c, _ptStr(py.id)) && _ptFold(py.email) === was) py.email = now;
      });
    }
  }
  contactMirror(c);
}
/* THE MIRRORS, written from the book — only where the book holds a stored
   main contact; a record nobody has written through here keeps its own copy,
   which is exactly what contactsOf reads it as. */
function contactMirror(c){
  if (!c) return;
  const m = _ctStoredMain(c, _ctFirstPartyId(c));
  if (m){
    if (_ptStr(m.email)) c.counterpartyEmail = _ptStr(m.email); else delete c.counterpartyEmail;
    if (_ptStr(m.name)) c.counterpartyName = _ptStr(m.name); else delete c.counterpartyName;
  }
  if (Array.isArray(c.parties)){
    c.parties.forEach(py => {
      if (!py || py.side === 'ours') return;
      const pm = _ctStoredMain(c, _ptStr(py.id));
      if (pm) py.email = _ptStr(pm.email);
    });
  }
}
function contactUnmirror(c, row){
  if (!c || !row) return;
  const pid = contactPartyOf(c, row);
  const mail = _ptFold(row.email);
  if (pid === _ctFirstPartyId(c)){
    if (!mail || _ptFold(c.counterpartyEmail) === mail) delete c.counterpartyEmail;
    if (_ptStr(row.name) && _ptFold(c.counterpartyName) === _ptFold(row.name)) delete c.counterpartyName;
  }
  if (Array.isArray(c.parties)){
    c.parties.forEach(py => { if (py && py.side !== 'ours' && _ptStr(py.id) === pid
      && (!mail || _ptFold(py.email) === mail)) py.email = ''; });
  }
}
/* A RECORD THAT ARRIVED CARRYING AN ADDRESS (a creation form, the server's
   own template route, an import) puts it in the book at arrival — the one
   moment a write is the point. Idempotent. */
function contactAdopt(c){
  if (!c) return false;
  if (!_ptStr(c.counterpartyEmail) || _ctStoredMain(c, _ctFirstPartyId(c))) return false;
  return !!contactSet(c, { main: true, email: c.counterpartyEmail,
    name: _ptStr(c.counterpartyName) || undefined });
}
/* WHAT A PICKER OFFERS: every outside address once, the main contact first. */
function contactChoices(c, partyId){
  const want = _ptStr(partyId);
  const seen = new Set(), out = [];
  contactsOf(c).filter(r => _ptStr(r.email) && (!want || r.partyId === want))
    .sort((a, b) => (b.main ? 1 : 0) - (a.main ? 1 : 0))
    .forEach(r => { const k = _ptFold(r.email); if (seen.has(k)) return; seen.add(k);
      out.push({ email: _ptStr(r.email), name: _ptStr(r.name), role: r.role, main: !!r.main }); });
  return out;
}
/* The send screen's own memory: whoever a link went to is now in the book. */
function contactRoleOfPurpose(purpose){ return CONTACT_ROLE_OF_PURPOSE[_ptStr(purpose)] || 'cpread'; }

/* ---- WHAT THIS PERSON CAN ACTUALLY REACH ----
   THE WALL IS THE WORKSPACE'S, NOT THIS LIST'S. For a colleague the question
   is the one the product already answers — can they open a contract filed in
   this value stream — and being named here does not change the answer. It is
   asked so the SCREEN CAN SAY SO: a row that quietly adds somebody who will
   see nothing is worse than no row.
   For the other side there is nothing to check: they reach the contract
   through a link, which is minted when somebody sends one. */
function participantReach(c, p){
  if (!c || !p) return { ok: true, why: '' };
  if (participantSideOf(p.role) === 'theirs') return { ok: true, why: '' };
  const users = _ptCall('getUsers') || [];
  const mail = _ptFold(p.email), mid = _ptStr(p.memberId);
  const u = users.find(x => x && (( mid && String(x.id) === mid) || (mail && _ptFold(x.email) === mail))) || null;
  /* NOT A COLLEAGUE YET is not a refusal — it is a fact, and the way forward
     is an admin adding them. The row says which. */
  if (!u) return { ok: false, why: 'notamember' };
  const can = _ptCall('canAccessFolder', c.folder, u);
  if (can === false) return { ok: false, why: 'nostream' };
  return { ok: true, why: '' };
}

/* ---- THE PEOPLE WHO WORKED ON IT ARE NAMED WITHOUT BEING TYPED (Young
   ruled 23 Sep 2026: "keep it but automate who else is this by adding the
   internal people who edited the contract and approved it") ----
   A READING, NOT A WRITER. The contract already records who filed each change
   (`ch.author` on our side, this round and every closed one) and who approved
   each step (`c.approvalChain`, and the older single `c.approval`), and the
   trail records who edited the wording. Reading those at draw time means an
   older contract fills in too, nothing new is stored when somebody edits, and
   no door onto editing or approving had to learn about this list.

   ONLY A COLLEAGUE: a name is kept only where it resolves to a MEMBER — the
   other side's authors are not members, and "System" is nobody. ONE ROW PER
   PERSON with every role they earned, and a role a hand-named row already
   carries is not said twice. Being listed here grants nothing: it records who
   worked on it, and access stays what the workspace says.

   TAKING ONE OFF is a remembered choice (`c.participantsAutoOff`, member ids,
   absent on every record on file) — the one write, and only on a press. */
const PT_AUTO_EDIT_ACTIONS = ['Edited', 'Document', 'Corrected'];
function participantsAuto(c){
  if (!c) return [];
  const users = _ptCall('getUsers') || [];
  if (!users.length) return [];
  const byName = n => { const k = _ptFold(n); return k ? users.find(u => u && _ptFold(u.name) === k) || null : null; };
  const byId = id => (id == null || id === '') ? null : users.find(u => u && String(u.id) === String(id)) || null;
  const found = new Map();
  const note = (u, role) => {
    if (!u) return;
    const key = String(u.id);
    const row = found.get(key) || { key, memberId: key, name: _ptStr(u.name), email: _ptStr(u.email), roles: [] };
    if (row.roles.indexOf(role) < 0) row.roles.push(role);
    found.set(key, row);
  };
  const changes = [].concat(Array.isArray(c.changes) ? c.changes : []);
  const rounds = c.negotiation && Array.isArray(c.negotiation.rounds) ? c.negotiation.rounds : [];
  rounds.forEach(r => { if (r && Array.isArray(r.changes)) changes.push(...r.changes); });
  changes.forEach(ch => {
    if (!ch || (ch.authorSide && ch.authorSide !== 'owner')) return;
    note(byId(ch.authorId) || byName(ch.author), 'contribute');
  });
  (Array.isArray(c.audit) ? c.audit : []).forEach(a => {
    if (a && PT_AUTO_EDIT_ACTIONS.indexOf(a.action) >= 0) note(byName(a.user), 'contribute');
  });
  (Array.isArray(c.approvalChain) ? c.approvalChain : []).forEach(st => {
    if (st && st.status === 'approved') note(byName(st.by), 'approve');
  });
  if (c.approval && c.approval.by) note(byId(c.approval.byId) || byName(c.approval.by), 'approve');
  const off = Array.isArray(c.participantsAutoOff) ? c.participantsAutoOff.map(String) : [];
  const named = participantsOf(c);
  const out = [];
  found.forEach(row => {
    if (off.indexOf(row.key) >= 0) return;
    const mine = named.filter(p => (p.memberId && String(p.memberId) === row.key)
      || (row.email && _ptFold(p.email) === _ptFold(row.email))
      || (!p.email && row.name && _ptFold(p.name) === _ptFold(row.name)));
    row.roles = row.roles.filter(r => !mine.some(p => _ptStr(p.role) === r));
    if (row.roles.length) out.push(row);
  });
  return out;
}
function participantAutoOff(c, key){
  if (!c || !key) return false;
  const list = Array.isArray(c.participantsAutoOff) ? c.participantsAutoOff : [];
  if (list.map(String).indexOf(String(key)) >= 0) return false;
  c.participantsAutoOff = list.concat([String(key)]);
  return true;
}
function participantAutoRowHtml(carrier, a, opts){
  const o = opts || {};
  const ed = o.editable !== false;
  const roles = a.roles.map(r => participantRoleLabel(r)).join(' · ');
  const cell = (inner) => `<div class="pt-c">${inner}</div>`;
  return `<div class="pt-row is-auto" data-pt-auto="${_ptEsc(a.key)}">
    ${cell(`<b>${_ptEsc(a.name)}</b> <span class="pt-auto" title="${_ptEsc(i18t('ppl_auto_title'))}">${_ptEsc(i18t('ppl_auto'))}</span>`)}
    ${cell(_ptEsc(a.email))}
    ${cell(_ptEsc(roles))}
    ${cell(_ptEsc(participantAccessLabel(PARTY_ACCESS_DEFAULT)))}
    ${o.reached ? `<div class="pt-c pt-reached"></div>` : ''}
    <div class="pt-c pt-x">${ed ? `<button type="button" data-pt-auto-remove="${_ptEsc(a.key)}"
      title="${_ptEsc(i18t('ppl_remove'))}" aria-label="${_ptEsc(i18t('ppl_remove'))}">&#215;</button>` : ''}</div>
    <div class="pt-says">${_ptEsc(a.roles.map(r => participantFills(r)).filter(Boolean).join(' '))}</div>
  </div>`;
}

/* ---- WHAT HAS ACTUALLY REACHED THEM ----
   Borrowed, never computed: the signer plan is the product's own list and the
   share cache is the product's own answer about links. `unknown` is honest —
   a page that has not fetched the links yet does not know, and saying "not
   sent" there would be a claim nobody checked. */
function participantReached(c, p){
  if (!c || !p) return { kind: 'none' };
  const mail = _ptFold(p.email);
  const plan = (_ptCall('signerPlan', c) || []);
  const sg = mail ? plan.find(s => s && _ptFold(s.email) === mail) : null;
  if (sg && sg.signed) return { kind: 'signed', at: sg.at || '' };
  const known = _ptCall('sharesKnown', c);
  if (known === false) return { kind: sg ? 'signing' : 'unknown' };
  const shares = _ptCall('cachedShares', c) || [];
  const mine = mail ? shares.filter(s => s && _ptFold(s.email) === mail) : [];
  if (mine.length){
    const live = mine.find(s => _ptCall('shareIsStanding', s)) || mine[0];
    return { kind: 'sent', purpose: _ptStr(live && live.purpose) || 'view', at: _ptStr(live && live.createdAt) };
  }
  return { kind: sg ? 'signing' : 'none' };
}

/* ---- THE ANSWER ALREADY IN THE BOX, NEVER A SECOND WRITER ----
   saveSignerPlan is the ONE authority on naming signers and it stays so. What
   this gives is the rows the editor OPENS with when the plan is empty — a
   fill, exactly as a template's own filing prefills the stream picker. An
   existing plan is never touched: somebody arranged it. */
function participantSignerRows(c){
  const rows = [];
  participantsOf(c).forEach(p => {
    const r = PARTY_ROLE_OF[_ptStr(p.role)];
    if (!r || r.list !== 'signers') return;
    rows.push({ id: '', party: r.side === 'theirs' ? 'counterparty' : 'internal',
      name: _ptStr(p.name), email: _ptStr(p.email),
      memberId: r.side === 'theirs' ? '' : _ptStr(p.memberId), role: '' });
  });
  /* OURS FIRST, which is the order the editor's own new rows take. */
  return rows.sort((a, b) => (a.party === 'counterparty' ? 1 : 0) - (b.party === 'counterparty' ? 1 : 0));
}

/* WHAT THE SEND SCREEN OFFERS. The people on the other side, in the menu's own
   order, each carrying the purpose their role means — so a round goes to the
   people this contract has always been with, rather than to an address typed
   again. `access` rides with them; narrowing what a link carries is the send's
   own job and this only says what was asked for. */
const PARTY_PURPOSE_OF = { cpsign: 'sign', negotiate: 'negotiate', advise: 'advise', cpread: 'view' };
function participantSendRows(c){
  const order = PARTY_ROLES.map(r => r.k);
  return participantsBySide(c, 'theirs')
    .filter(p => _ptStr(p.email))
    .sort((a, b) => order.indexOf(_ptStr(a.role)) - order.indexOf(_ptStr(b.role)))
    .map(p => ({ id: p.id, name: _ptStr(p.name), email: _ptStr(p.email),
      role: _ptStr(p.role), access: _ptStr(p.access) || PARTY_ACCESS_DEFAULT,
      purpose: PARTY_PURPOSE_OF[_ptStr(p.role)] || 'view' }));
}

/* ============================================================
   EVERY ADDRESS THIS CONTRACT HOLDS, IN THE ORDER A ROUND USES THEM
   (21 Sep 2026, the process review's first item)

   The same counterparty address can be typed in FOUR places — the Overview's
   general contact, the signing order, the send screen, and the people list —
   and until now no screen showed all four at once. HaTi already knew this was
   a problem: it draws an amber cell when the first two disagree, which patches
   the symptom. A reader could not tell which address a round would actually go
   to without opening the send screen and looking.

   ADDR_SOURCES IS THE ORDER shareModalPrefill ALREADY RESOLVES IN, written
   down once. That is the whole point: the list is not a new opinion about
   which address wins, it is the existing answer made visible, so the card and
   the send screen cannot disagree about what will happen.

   TWO OF THE FOUR MAY DIFFER ON PURPOSE — the finance director signs and the
   commercial lead argues — so this NAMES them rather than refusing them. What
   it refuses is silence. */
const ADDR_SOURCES = ['route', 'people', 'record', 'last'];
function contractAddressBook(c, shares){
  const seen = new Map();          /* folded address -> row */
  const add = (email, name, where) => {
    const e = _ptStr(email); if(!e) return;
    const k = e.toLowerCase();
    const row = seen.get(k);
    if(row){ if(!row.where.includes(where)) row.where.push(where); if(!row.name && name) row.name = _ptStr(name); return; }
    seen.set(k, { email: e, name: _ptStr(name), where: [where] });
  };
  /* ONE BOOK, FOUR WORDS (4 Oct 2026). Every row is a person in the address
     book (contactsOf) — nothing is admitted from anywhere else. The four
     words say what each address IS to a round, in the order a round asks. */
  const book = contactsOf(c).filter(r => _ptStr(r.email));
  const inBook = e => book.some(r => _ptFold(r.email) === _ptFold(e));
  /* 1 — the signer whose turn it is. What a round goes to first. */
  const route = _ptCall('shareRouteRecipient', c);
  if(route && inBook(route.email)) add(route.email, route.name, 'route');
  /* 2 — the people named on it, in the roles' own order */
  participantSendRows(c).forEach(p => add(p.email, p.name, 'people'));
  /* 3 — the main contact (what "Their email" says) */
  book.filter(r => r.main).forEach(r => add(r.email, r.name || (c && c.counterparty), 'record'));
  /* 4 — the last link actually sent, where that person is in the book */
  const last = _ptCall('lastShareRecipient', shares || []);
  if(last && inBook(last.email)) add(last.email, last.name, 'last');
  /* and anybody else in the book */
  book.forEach(r => add(r.email, r.name, 'people'));

  const rows = Array.from(seen.values()).map(r => Object.assign({}, r, {
    /* the earliest source this address appears under decides where it sits */
    rank: Math.min.apply(null, r.where.map(w => { const i = ADDR_SOURCES.indexOf(w); return i < 0 ? 99 : i; })),
  })).sort((a, b) => a.rank - b.rank);
  rows.forEach((r, i) => { r.willUse = i === 0; });
  return { rows, used: rows[0] || null, extra: Math.max(0, rows.length - 1), agree: rows.length <= 1 };
}
/* Where an address came from, said in the reader's own words. One map, so the
   card and the send screen's own prefill note name the same four places. */
const ADDR_WHERE_KEY = { route:'ppl_addr_route', people:'ppl_addr_people', record:'ppl_addr_record', last:'ppl_addr_last' };
function addressWhereWords(where){
  const t = _ptW('i18t');
  return (where || []).map(w => (typeof t === 'function' ? t(ADDR_WHERE_KEY[w] || w) : w)).join(' \u00b7 ');
}

/* ---- NAMED BEFORE THE RECORD EXISTS (the owner's own order: "before you
   create the draft") ----
   The drafting screen collects people while the paper is still being chosen,
   so there is no contract to write them onto yet. They are HELD here, in
   memory and never persisted, and claimed by the one funnel every creation
   site already registers with — contractArrived. A pop-up that is cancelled
   drops them; a bulk import never claims them, because nobody stood at that
   screen naming anybody. */
let _ptHeld = null;
function participantsHold(list){
  _ptHeld = (Array.isArray(list) && list.length) ? list.slice() : null;
  return _ptHeld ? _ptHeld.length : 0;
}
function participantsHeld(){ return _ptHeld ? _ptHeld.slice() : []; }
function participantsDrop(){ _ptHeld = null; }
function participantsClaim(c){
  if (!c || !_ptHeld || !_ptHeld.length) return 0;
  c.participants = Array.isArray(c.participants) ? c.participants : [];
  let n = 0;
  _ptHeld.forEach(p => { if (!participantDuplicate(c, p)){ c.participants.push(p); n++; } });
  _ptHeld = null;
  return n;
}

/* ============================================================
   THE LIST, DRAWN — ONE BUILDER, TWO DOORS
   ============================================================
   The drafting screen and the Overview draw the SAME rows with the SAME
   handlers, because two builders for one list is how the two screens come to
   disagree about what a role means. The caller supplies the carrier (a
   contract, or the scratch object the drafting screen holds until the record
   exists) and the repaint, exactly as the section grammar does.

   IT DRAWS NO BAND. The one fact about the machinery — that access narrows
   and never grants — rides the Access column's own hover, and a person who
   cannot reach the contract is said on THEIR row, where the act is. */
const _ptEsc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PT_IN = 'min-width:0;width:100%;box-sizing:border-box;border:1px solid var(--color-neutral-300,#CBD3D0);background:var(--color-surface,#fff);border-radius:var(--radius);padding:4px 7px;font:inherit;font-size:var(--t-meta);outline:none';
function participantRoleOptions(sel){
  let out = '', side = '';
  PARTY_ROLES.forEach(r => {
    if (r.side !== side){ if (side) out += '</optgroup>';
      out += `<optgroup label="${_ptEsc(i18t(r.side === 'ours' ? 'ppl_side_ours' : 'ppl_side_theirs'))}">`;
      side = r.side; }
    out += `<option value="${_ptEsc(r.k)}"${_ptStr(sel) === r.k ? ' selected' : ''}>${_ptEsc(r.label)}</option>`;
  });
  return out + (side ? '</optgroup>' : '');
}
function participantAccessOptions(sel){
  const s = _ptStr(sel) || PARTY_ACCESS_DEFAULT;
  return PARTY_ACCESS.map(a => `<option value="${_ptEsc(a.k)}"${s === a.k ? ' selected' : ''
    } title="${_ptEsc(a.sub)}">${_ptEsc(a.label)}</option>`).join('');
}
/* WHAT HAS REACHED THIS PERSON, AS A WORD. Drawn only where the caller asks
   for it — the drafting screen has no contract yet and nothing has reached
   anybody, so a column of "Not sent" there would be noise. */
function participantReachedWord(c, p){
  const r = participantReached(c, p);
  return i18t('ppl_reached_' + (r && r.kind ? r.kind : 'none'));
}
function participantRowHtml(carrier, p, opts){
  const o = opts || {};
  const ed = o.editable !== false;
  const reach = o.reach === false ? { ok: true } : participantReach(carrier, p);
  const say = reach.ok ? '' : i18t(reach.why === 'nostream' ? 'ppl_no_stream' : 'ppl_no_member');
  const cell = (inner) => `<div class="pt-c">${inner}</div>`;
  /* A PERSON ONLY A MIRROR STILL NAMES (a record on file, a route saved
     before the book) is drawn like any other row and becomes a stored one the
     moment somebody types in it — see participantsWire. */
  const d = o.derived ? ` data-pt-dmail="${_ptEsc(p.email)}" data-pt-drole="${_ptEsc(p.role)}" data-pt-dparty="${
    _ptEsc(p.partyId || '')}" data-pt-dmain="${p.main ? '1' : '0'}"` : '';
  const mayRemove = ed && !(o.derived && !p.main);
  return `<div class="pt-row${reach.ok ? '' : ' is-blocked'}" data-pt-row="${_ptEsc(p.id)}"${d}>
    ${cell(ed ? `<input data-pt-f="name" type="text" value="${_ptEsc(p.name)}" placeholder="${
      _ptEsc(i18t('ppl_name'))}" style="${PT_IN}"/>` : `<b>${_ptEsc(p.name)}</b>`)}
    ${cell(ed ? `<input data-pt-f="email" type="email" value="${_ptEsc(p.email)}" placeholder="${
      _ptEsc(i18t('ppl_email'))}" style="${PT_IN}"/>` : _ptEsc(p.email))}
    ${cell(ed ? `<select data-pt-f="role" style="${PT_IN}">${participantRoleOptions(p.role)}</select>`
      : _ptEsc(participantRoleLabel(p.role)))}
    ${cell(ed ? `<select data-pt-f="access" style="${PT_IN}">${participantAccessOptions(p.access)}</select>`
      : _ptEsc(participantAccessLabel(p.access)))}
    ${o.reached ? `<div class="pt-c pt-reached">${_ptEsc(participantReachedWord(carrier, p))}</div>` : ''}
    <div class="pt-c pt-x">${mayRemove ? `<button type="button" data-pt-remove="${_ptEsc(p.id)}"
      title="${_ptEsc(i18t('ppl_remove'))}" aria-label="${_ptEsc(i18t('ppl_remove'))}">&#215;</button>` : ''}</div>
    <div class="pt-says">${_ptEsc(participantFills(p.role))}${
      say ? ` <span class="pt-warn">${_ptEsc(say)}</span>` : ''}</div>
  </div>`;
}
function participantsPanelHtml(carrier, opts){
  const o = opts || {};
  const list = participantsOf(carrier);
  const ed = o.editable !== false;
  const head = `<div class="pt-row pt-head">
    <div class="pt-c">${_ptEsc(i18t('ppl_name'))}</div>
    <div class="pt-c">${_ptEsc(i18t('ppl_email'))}</div>
    <div class="pt-c">${_ptEsc(i18t('ppl_role'))}</div>
    <div class="pt-c" title="${_ptEsc(i18t('ppl_narrows'))}">${_ptEsc(i18t('ppl_access'))}</div>
    ${o.reached ? `<div class="pt-c">${_ptEsc(i18t('ppl_reached_head'))}</div>` : ''}
    <div class="pt-c"></div><div class="pt-says"></div>
  </div>`;
  /* THE AUTOMATIC ROWS SIT UNDER THE HAND-NAMED ONES, only where the caller
     asks (a contract that exists; the drafting screen has nobody who worked
     on it yet). */
  const auto = o.auto ? participantsAuto(carrier) : [];
  /* THE ADDRESS BOOK'S OTHER ROWS (4 Oct 2026): where the caller asks, the
     outside people only a mirror still names are drawn too, so this list and
     every box that reads the book show the same people. */
  const derived = o.book ? contactsOf(carrier).filter(r => r.derived) : [];
  const rows = list.map(p => participantRowHtml(carrier, p, o)).join('')
    + derived.map(r => participantRowHtml(carrier, r, Object.assign({}, o, { derived: true }))).join('')
    + auto.map(a => participantAutoRowHtml(carrier, a, o)).join('');
  return `<div class="pt-list${o.reached ? ' has-reached' : ''}">
    ${(list.length || auto.length || derived.length) ? head + rows : `<p class="pt-none">${_ptEsc(i18t('ppl_none'))}</p>`}
    ${ed ? `<div class="pt-acts"><button type="button" class="ui-btn" data-pt-add="1">${
      (typeof window!=='undefined'&&window.plusLed) ? window.plusLed(_ptEsc(i18t('ppl_add'))) : _ptEsc(i18t('ppl_add'))}</button></div>` : ''}
  </div>`;
}
/* ONE LISTENER PER MOUNT, bound once per element — the section grammar's own
   idiom, and needed for the same reason: both hosts repaint themselves. The
   caller passes the repaint, because only it knows what to redraw. */
function participantsWire(root, carrier, opts){
  const host = root; if (!host || !carrier) return;
  if (host.dataset && host.dataset.ptBound) return;
  if (host.dataset) host.dataset.ptBound = '1';
  const o = opts || {};
  const again = () => { if (typeof o.repaint === 'function') o.repaint(); };
  const changed = () => { if (typeof o.onChange === 'function') o.onChange(carrier); };
  host.addEventListener('click', ev => {
    const add = ev.target.closest && ev.target.closest('[data-pt-add]');
    if (add && host.contains(add)){
      participantAdd(carrier, { name: '', email: '', role: o.role || 'read',
        access: PARTY_ACCESS_DEFAULT });
      changed(); again(); return;
    }
    const off = ev.target.closest && ev.target.closest('[data-pt-auto-remove]');
    if (off && host.contains(off)){
      const key = off.getAttribute('data-pt-auto-remove');
      const row = participantsAuto(carrier).find(a => a.key === key);
      if (participantAutoOff(carrier, key)){
        if (typeof o.onRemove === 'function' && row) o.onRemove(row);
        changed(); again();
      }
      return;
    }
    const rm = ev.target.closest && ev.target.closest('[data-pt-remove]');
    if (rm && host.contains(rm)){
      const el = rm.closest('[data-pt-row]');
      if (el && !el.getAttribute('data-pt-row') && el.getAttribute('data-pt-dmain') === '1'){
        /* the record's own contact, never stored: emptying it is the writer's */
        contactSet(carrier, { main: true, partyId: el.getAttribute('data-pt-dparty') || '', email: '', name: '' });
        changed(); again(); return;
      }
      const row = participantsOf(carrier).find(p => p.id === rm.getAttribute('data-pt-remove'));
      participantRemove(carrier, rm.getAttribute('data-pt-remove'));
      if (typeof o.onRemove === 'function' && row) o.onRemove(row);
      changed(); again();
    }
  });
  /* TEXT WRITES ON `input` AND A LIST ON `change`, which is the panel's own
     rule one screen over: nothing here repaints, so the caret stays where the
     reader put it. A ROLE IS THE ONE EXCEPTION — the sentence under the row
     says what that role fills in, so it has to be redrawn to stay true. */
  /* A ROW ONLY A MIRROR NAMED BECOMES A STORED ONE ON ITS FIRST EDIT,
     through the one writer, and keeps its place on the screen. */
  const idOf = row => {
    const id = row.getAttribute('data-pt-row');
    if (id || !row.hasAttribute('data-pt-dmail')) return id;
    const made = contactSet(carrier, { main: row.getAttribute('data-pt-dmain') === '1',
      role: row.getAttribute('data-pt-drole') || '', partyId: row.getAttribute('data-pt-dparty') || '',
      email: row.getAttribute('data-pt-dmail') || '',
      was: row.getAttribute('data-pt-dmail') || '' });
    if (!made) return '';
    row.setAttribute('data-pt-row', made.id);
    ['data-pt-dmail', 'data-pt-drole', 'data-pt-dparty', 'data-pt-dmain'].forEach(a => row.removeAttribute(a));
    const x = row.querySelector('[data-pt-remove]'); if (x) x.setAttribute('data-pt-remove', made.id);
    return made.id;
  };
  host.addEventListener('input', ev => {
    const f = ev.target.getAttribute && ev.target.getAttribute('data-pt-f');
    if (!f || f === 'role' || f === 'access') return;
    const row = ev.target.closest('[data-pt-row]'); if (!row) return;
    const id = idOf(row); if (!id) return;
    participantSet(carrier, id, { [f]: ev.target.value });
    changed();
  });
  host.addEventListener('change', ev => {
    const f = ev.target.getAttribute && ev.target.getAttribute('data-pt-f');
    if (f !== 'role' && f !== 'access') return;
    const row = ev.target.closest('[data-pt-row]'); if (!row) return;
    const id = idOf(row); if (!id) return;
    participantSet(carrier, id, { [f]: ev.target.value });
    changed(); if (f === 'role') again();
  });
}

/* ---- EVERYONE ELSE WHO SHOULD GET THIS ROUND (Young ruled 21 Sep 2026) ----
   *"in Door B, you should be able to add multiple people to send the document
   to."* The list is the contract's OWN people — participantSendRows, the other
   side's, in the role menu's order — so a round goes to the people this
   agreement has always been with rather than to an address typed again.

   THE PRIMARY RECIPIENT IS NOT ON IT: the box above already names them, and a
   tick beside their own address would be the same person twice. Matched by
   ADDRESS, folded, because that is what a link is bound to.

   ONE PURPOSE FOR THE WHOLE SEND. Which purpose each person's role would
   prefer is on the row as a word, so a signer ticked on a negotiate round can
   be seen to be getting a negotiate link — but the send has one purpose,
   chosen once, above. A purpose per row is a different feature and the owner
   has not ruled on it. */
function shareMoreRowsHtml(c, purposeSel, primaryEmail){
  if(purposeSel==='history') return '';
  let rows=[]; try{ rows=(window.participantSendRows?participantSendRows(c):[])||[]; }catch(_){ rows=[]; }
  const mine=String(primaryEmail||'').trim().toLowerCase();
  rows=rows.filter(r=>r.email && r.email.toLowerCase()!==mine);
  if(!rows.length) return '';
  const LBL2='font-size:var(--t-label);color:var(--color-neutral-600)';
  const list=rows.map(r=>`<label class="sh-more-r">
      <input type="checkbox" data-sh-more="${_ptEsc(r.email)}" data-sh-more-name="${_ptEsc(r.name)}"/>
      <span class="sh-more-n">${_ptEsc(r.name||r.email)}</span>
      <span class="sh-more-e">${_ptEsc(r.email)}</span>
      <span class="sh-more-w">${_ptEsc(participantRoleLabel(r.role))}</span>
    </label>`).join('');
  return `<div class="sh-more-box">
    <div style="${LBL2};margin-bottom:6px">${_ptEsc(i18t('co_more_head'))}</div>
    ${list}
    <div style="${LBL2};margin-top:6px">${_ptEsc(i18t('co_more_note'))}</div>
  </div>`;
}
/* Who was ticked, read at the PRESS — a listener bound once must not close
   over the rows this paint happened to draw. */
function shareMoreChosen(){
  return [...document.querySelectorAll('[data-sh-more]:checked')].map(b=>({
    email: b.getAttribute('data-sh-more')||'', name: b.getAttribute('data-sh-more-name')||'' }))
    .filter(x=>/.+@.+\..+/.test(x.email));
}

if (typeof window !== 'undefined') Object.assign(window, {
  shareMoreRowsHtml, shareMoreChosen,
  participantsPanelHtml, participantRowHtml, participantsWire, participantsAuto, participantAutoOff,
  participantAutoRowHtml, PT_AUTO_EDIT_ACTIONS, participantRoleOptions,
  participantAccessOptions, participantReachedWord, PT_IN,
  PARTY_SIDES, PARTY_ROLES, PARTY_ROLE_OF, PARTY_ACCESS, PARTY_ACCESS_OF, PARTY_ACCESS_DEFAULT,
  PARTY_PATCH_KEYS, PARTY_PURPOSE_OF,
  participantsOf, participantsBySide, participantSideOf, participantRoleLabel, participantFills,
  participantAccessLabel, participantAdd, participantSet, participantRemove, participantDuplicate,
  participantReach, participantReached, participantSignerRows, participantSendRows,
  participantsHold, participantsHeld, participantsDrop, participantsClaim,
  contractAddressBook, addressWhereWords, ADDR_SOURCES, ADDR_WHERE_KEY,
  CONTACT_ROLE_OF_PURPOSE, CONTACT_MAIN_ROLE, contactsOf, contactMain, contactEmail, contactSet,
  contactFollow, contactMirror, contactUnmirror, contactAdopt, contactChoices, contactPartyOf,
  contactRoleOfPurpose,
});
