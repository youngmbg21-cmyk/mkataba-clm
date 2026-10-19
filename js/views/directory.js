/* ============================================================
   THE DIRECTORY — FACES (owner picked it 13 Oct 2026, off the "Directory
   Three Ways" artifact: "Go with faces, build it and merge")
   ============================================================
   Everyone HaTi deals with, inside and outside, as a wall of contact cards
   with an A to Z edge, under the band every list page wears (the tabs, the
   filters beside them), with the inspector's panel showing the chosen
   person's contracts and the doors onto them.

   A READING, NOTHING FILED. Three places HaTi already keeps are read and
   joined by email address, at paint time, in the browser:
     · the roster the browser already holds (getUsers() — the staff
       directory this page was from 14 Aug to 13 Oct 2026; the phone still
       draws that list, off dirPeople below, so the two shells cannot
       disagree about who works here);
     · every contract's own people list — the one address book for the
       other side (contactsOf), our own rows on it (participantsOf), the
       owner stamp, and the people who worked on it (participantsAuto);
     · the admin's imported list (orgDirectory): a person it names whom no
       contract names yet is "Not on a contract".
   ONE PERSON IS ONE ADDRESS across contracts: the same signer on four
   contracts is one card with four contracts behind it. Nothing here writes.
   A name or an address is corrected on the contract, through the one
   writer, and this page follows. Being listed here grants nothing.

   THE STREAM WALL STANDS because the list is state.contracts, which the
   server has already filtered to the streams this reader may open; the
   counts are of the contracts loaded and the card's foot says so when the
   book is longer (the Parties page's own rule). HaTi has no person record of
   its own and this page adds none — one fact, one home.

   WHAT IS NOT ON IT, STILL. The admin-only facts about a colleague are not
   in a non-admin's browser and this page asks for none of them (f202 pins
   the absence against the renderer's source and against a real restricted
   member's bootstrap). Adding people stays where it is: a colleague in
   Settings → People, an outside person on a contract, a list in Settings →
   Signer directory.
   ============================================================ */

/* Per sitting: the tab, the find box and the three filters. A refresh puts
   them back through PLACE_PARTS (dirPlace / dirPlacePut). */
/* PEOPLE AS A TABLE (round 19, "The SAP way", the People scene; the owner's
   "build all the gaps", 18 Oct 2026, reverses the 13 Oct face cards): the
   side is a labelled box now, not tabs (`tab` keeps its name and values);
   `hati` is the Role in HaTi box; `shown` how many rows the table draws
   (DIR_PAGE at a time, "12 of 46 shown · Show more"). */
const _dir = { tab: 'all', q: '', party: 'all', hati: 'all', stream: 'all', shown: 0 };
const DIR_TABS = ['all', 'ours', 'theirs', 'none'];
const DIR_PAGE = 12;
const DIR_SEAT = 'directory';
/* A colleague's panel lists this many of their contracts; the rest are one
   press away on the Contracts page. */
const DIR_NAMED_MAX = 6;
/* The roles in the order a card says them: ours first, then theirs. */
const DIR_ROLE_ORDER = ['owner', 'sign', 'approve', 'review', 'contribute', 'read', 'cpsign', 'negotiate', 'advise', 'cpread'];

const _dE = s => (typeof esc === 'function') ? esc(s)
  : String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const _dStr = v => String(v == null ? '' : v).trim();
const _dFold = v => _dStr(v).toLowerCase();
function _dCall(n, ...a){
  try { const f = (typeof window !== 'undefined') ? window[n] : undefined; return typeof f === 'function' ? f(...a) : null; }
  catch (_) { return null; }
}
function _dLoc(){ return (typeof langLocale === 'function') ? langLocale() : undefined; }

/* ---- THE ROSTER, IN THE ORDER THE PHONE AND THE "OUR PEOPLE" TAB SHARE ----
   Admins first (knowing who to ask is the main reason to look), then
   everybody else by name. NOT by role generally — 'Editor' above 'Viewer'
   would be a hierarchy this product does not otherwise draw. */
function dirPeople(){
  const users=((typeof getUsers==='function'?getUsers():[])||[]).slice();
  const key=u=>String(u.name||u.email||'').toLocaleLowerCase();
  return users.sort((a,b)=>{
    const aa=a.role==='admin'?0:1, bb=b.role==='admin'?0:1;
    if(aa!==bb) return aa-bb;
    return key(a)<key(b)?-1:key(a)>key(b)?1:0;
  });
}

/* ---- SMALL READINGS ---- */
function dirRoleName(role){ return (typeof roleName === 'function') ? (roleName(role) || '') : _dStr(role); }
function dirRoleWord(k){ return (typeof participantRoleLabel === 'function') ? participantRoleLabel(k) : _dStr(k); }
/* a colleague's role said short, as the person's Named on list draws it
   ("approver", "owner"); a role without a short word keeps its long one */
const DIR_ROLE_NOUN = { owner: 'jl_role_owner', sign: 'jl_role_sign', approve: 'jl_role_approve', review: 'jl_role_review', contribute: 'jl_role_contribute', read: 'jl_role_read' };
function dirRoleNoun(k){ return DIR_ROLE_NOUN[k] ? i18t(DIR_ROLE_NOUN[k]) : dirRoleWord(k); }
function dirRoleWords(p){
  const roles = Array.isArray(p && p.roles) ? p.roles : [];
  return DIR_ROLE_ORDER.filter(k => roles.includes(k)).concat(roles.filter(k => !DIR_ROLE_ORDER.includes(k))).map(dirRoleWord).join(' · ');
}
function dirContracts(){
  const all = (typeof state !== 'undefined' && state && Array.isArray(state.contracts)) ? state.contracts : [];
  return all.filter(c => c && !c.archived);
}
/* One party per name, whatever its case or spacing — the Parties page's own
   key, so "Open party" from here lands on the same shelf. */
function dirPartyKey(name){ return (typeof cuKeyOf === 'function') ? cuKeyOf(name) : _dFold(name).replace(/\s+/g, ' '); }
function dirExpired(c){
  if (typeof cuBucket === 'function') return cuBucket(c) === 'expired';
  return (typeof contractExpired === 'function') ? !!contractExpired(c) : false;
}
function dirStreamName(id){
  const F = (typeof window !== 'undefined' && window.FOLDERS && typeof window.FOLDERS === 'object') ? window.FOLDERS : null;
  return (F && F[id] && F[id].name) || '';
}
function dirInitials(name){
  return _dStr(name).split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toLocaleUpperCase() || '—';
}
function dirAvHtml(p){
  const who = (p && (p.name || p.email)) || '—';
  return (typeof window !== 'undefined' && typeof window.regAvatarHtml === 'function') ? window.regAvatarHtml(who)
    : `<span class="reg-av av-4" aria-hidden="true">${_dE(dirInitials(who))}</span>`;
}
/* The party an outside row belongs to: its own party where the record names
   several, else the counterparty — the first outside party, always. */
function dirPartyNameOf(c, partyId){
  const theirs = _dCall('partiesTheirs', c);
  const list = Array.isArray(theirs) ? theirs : [];
  const hit = partyId ? list.find(p => p && String(p.id) === String(partyId)) : null;
  if (hit && _dStr(hit.name)) return _dStr(hit.name);
  if (_dStr(c && c.counterparty)) return _dStr(c.counterparty);
  return list.length && _dStr(list[0].name) ? _dStr(list[0].name) : '';
}

/* The colleagues a contract names by the rules and the route, RAW: rule
   steps naming a member (approvalState's chain — a member, never a role),
   open questions to a person by name (asksOf: an approval → approve, a
   review or a look → review), and our own rows on the signing route
   (signerPlan). Reads only; nothing is initialised or written. */
function dirNamedRoles(c){
  const out = [];
  if (!c) return out;
  const live = c.status !== 'Signed' && c.status !== 'Declined' && !c._codeNamed;
  if (live){
    let st = null; try { st = (typeof approvalState === 'function') ? approvalState(c) : null; } catch (_){ st = null; }
    ((st && st.chain) || []).forEach(x => { const a = x && x.approver;
      if (x && x.status !== 'approved' && a && a.kind === 'member' && a.id != null) out.push({ memberId: _dStr(a.id), name: _dStr(a.name), role: 'approve', asked: x.status === 'pending' }); });
    let asks = []; try { asks = (typeof asksOf === 'function') ? (asksOf(c) || []) : []; } catch (_){ asks = []; }
    asks.forEach(a => { if (a && a.state === 'open' && a.to && !a.to.role && (a.to.id || a.to.name))
      out.push({ memberId: _dStr(a.to.id), name: _dStr(a.to.name), role: a.kind === 'review' || a.kind === 'look' ? 'review' : 'approve', asked: true }); });
  }
  let plan = []; try { plan = (typeof signerPlan === 'function') ? (signerPlan(c) || []) : (Array.isArray(c.signerPlan) ? c.signerPlan : []); } catch (_){ plan = []; }
  plan.forEach(r => { if (r && r.party !== 'counterparty' && (r.memberId != null || r.email || r.name))
    out.push({ memberId: _dStr(r.memberId), email: _dStr(r.email), name: _dStr(r.name), role: 'sign' }); });
  return out;
}

/* ---- THE BOOK: every person once, with their party, roles and contracts ----
   Read RAW off the loaded list — no reading here creates a negotiation or
   touches a record. Fresh objects every time; nothing is cached across
   paints because the list under it changes. */
function dirBook(){
  const users = ((typeof getUsers === 'function' ? getUsers() : []) || []).filter(Boolean);
  const me = _dCall('currentUser') || {};
  const book = new Map(), byMail = new Map();
  const person = (key, seed) => {
    let p = book.get(key);
    if (!p){
      p = Object.assign({ key, side: 'none', id: '', name: '', email: '', title: '', role: '', hati: '', you: false,
        partyName: '', partyKey: '', roles: new Set(), on: new Map(), asked: new Map() }, seed || {});
      book.set(key, p);
    }
    return p;
  };
  const named = (p, c, role) => {
    if (!p || !c || !c.id) return;
    let set = p.on.get(c.id);
    if (!set){ set = new Set(); p.on.set(c.id, set); }
    const r = _dStr(role);
    if (r){ set.add(r); p.roles.add(r); }
  };
  /* 1. THE ROSTER. A colleague's key is their id, so a row can be found by
     the person rather than by whatever they typed as a name. */
  users.forEach(u => {
    const key = _dStr(u.id) || ('e:' + _dFold(u.email));
    const p = person(key, { side: 'ours', id: _dStr(u.id), name: _dStr(u.name), email: _dStr(u.email), title: _dStr(u.title),
      role: _dStr(u.role), hati: dirRoleName(u.role), you: !!(u.id != null && me && String(u.id) === String(me.id)) });
    if (p.email) byMail.set(_dFold(p.email), p);
  });
  const colleague = (email, memberId, name) => {
    const k = _dFold(email);
    if (k && byMail.has(k)) return byMail.get(k);
    const mid = _dStr(memberId);
    if (mid){ const u = users.find(x => String(x.id) === mid); if (u) return book.get(_dStr(u.id)) || null; }
    const nm = _dFold(name);
    if (nm){ const u = users.find(x => _dFold(x.name) === nm); if (u) return book.get(_dStr(u.id)) || null; }
    return null;
  };
  /* 2. THE CONTRACTS: the other side through the one address book, our side
     through the rows on the contract, its owner and who worked on it. */
  dirContracts().forEach(c => {
    const theirs = _dCall('contactsOf', c);
    (Array.isArray(theirs) ? theirs : []).forEach(r => {
      if (!r) return;
      const email = _dStr(r.email), name = _dStr(r.name);
      if (!email && !name) return;
      /* a colleague's own address on the other side is a slip on that
         contract, not a second person */
      if (email && byMail.has(_dFold(email))) return;
      const pName = dirPartyNameOf(c, r.partyId), pKey = dirPartyKey(pName);
      const key = email ? 'e:' + _dFold(email) : 'n:' + _dFold(name) + '@' + pKey;
      const p = person(key, { side: 'theirs', name, email });
      p.side = 'theirs';   /* an imported contact a contract now names */
      if (!p.name && name) p.name = name;
      if (!p.email && email) p.email = email;
      if (!p.partyName && pName){ p.partyName = pName; p.partyKey = pKey; }
      named(p, c, _dStr(r.role) || 'cpread');
    });
    const rows = _dCall('participantsOf', c);
    (Array.isArray(rows) ? rows : []).forEach(r => {
      if (!r) return;
      const side = (typeof participantSideOf === 'function') ? participantSideOf(r.role) : 'ours';
      if (side !== 'ours') return;
      named(colleague(r.email, r.memberId, r.name), c, _dStr(r.role) || 'read');
    });
    const auto = _dCall('participantsAuto', c);
    (Array.isArray(auto) ? auto : []).forEach(r => {
      if (!r) return;
      const p = colleague(r.email, r.memberId, r.name);
      if (!p) return;
      (Array.isArray(r.roles) && r.roles.length ? r.roles : ['contribute']).forEach(role => named(p, c, role));
    });
    const owner = _dCall('contractOwnerName', c);
    if (owner) named(colleague('', c.owner && c.owner.id, owner), c, 'owner');
    /* NAMED ON IT IN ANY ROLE, THE APPROVER AND THE SIGNER TOO (round 19's
       People scene as drawn: "Named on 12 contracts · 7 live", "MK-0391 ·
       Helio Energy AB · approver"): the rule steps that name a colleague, the
       questions put to them by name (the one ask list), and our signers on
       the route — the same readings "Waiting on" reads (dirWaitingOn), so a
       person waited on is never "named on" nothing. Live work only for the
       chain; a yes already given is participantsAuto's 'approve'. */
    dirNamedRoles(c).forEach(x => { const p = colleague(x.email, x.memberId, x.name); named(p, c, x.role);
      /* what is ASKED of them on it now (round 19: "Approval asked" on the row) */
      if (p && x.asked && !p.asked.has(c.id)) p.asked.set(c.id, x.role === 'review' ? 'review' : 'approval'); });
  });
  /* 3. THE IMPORTED LIST: a title for somebody already here, or a person
     nobody has named on a contract yet. */
  const imported = _dCall('orgDirectory');
  (Array.isArray(imported) ? imported : []).forEach(d => {
    if (!d) return;
    const k = _dFold(d.email);
    if (!k) return;
    const hit = byMail.get(k) || book.get('e:' + k);
    if (hit){
      if (!hit.title && _dStr(d.title)) hit.title = _dStr(d.title);
      if (!hit.name && _dStr(d.name)) hit.name = _dStr(d.name);
      return;
    }
    person('e:' + k, { side: 'none', name: _dStr(d.name), email: _dStr(d.email), title: _dStr(d.title) });
  });
  /* FINISH: the counts a card and a panel say. */
  const byId = new Map(dirContracts().map(c => [c.id, c]));
  return [...book.values()].map(p => {
    const ids = [...p.on.keys()].filter(id => byId.has(id));
    const cts = ids.map(id => byId.get(id));
    const on = p.on;
    return Object.assign(p, {
      roles: [...p.roles],
      contracts: ids,
      active: cts.filter(c => !dirExpired(c)).length,
      streams: [...new Set(cts.map(c => c.folder).filter(Boolean))],
      partyNames: [...new Set(cts.map(c => _dStr(c.counterparty)).filter(Boolean))],
      roleOn: id => [...(on.get(id) || [])],
      askedOn: id => (p.asked && p.asked.get(id)) || null,
    });
  });
}

/* ---- WHAT THE TABS AND FILTERS LEAVE ---- */
function dirMatches(p, o){
  const f = o || _dir;
  if (f.party && f.party !== 'all' && p.partyKey !== f.party) return false;
  if (f.role && f.role !== 'all' && !(p.roles || []).includes(f.role)) return false;
  /* Role in HaTi: a colleague's own role here (Admin · Editor · Viewer) */
  if (f.hati && f.hati !== 'all' && !(p.side === 'ours' && p.role === f.hati)) return false;
  if (f.stream && f.stream !== 'all' && !(p.streams || []).includes(f.stream)) return false;
  const q = _dFold(f.q);
  if (q){
    const hay = [p.name, p.email, p.partyName, p.title, p.side === 'ours' ? i18t('dir_our_side') : ''];
    if (!hay.some(s => _dFold(s).includes(q))) return false;
  }
  return true;
}
function dirOnTab(p, tab){ return tab === 'all' || !tab || p.side === tab; }
/* "OURS FIRST, THEN THEIRS, BY NAME" (round 19's list head): our people —
   the reader first — then the other side's, then anyone not on a contract;
   each by name */
const DIR_SIDE_RANK = { ours: 0, theirs: 1, none: 2 };
function dirSort(list, tab){
  const loc = _dLoc();
  const key = p => _dFold(p.name || p.email);
  const cmp = (a, b) => key(a).localeCompare(key(b), loc, { sensitivity: 'base' });
  const side = p => (p.side in DIR_SIDE_RANK) ? DIR_SIDE_RANK[p.side] : 3;
  return list.slice().sort((a, b) => (side(a) - side(b)) || ((a.you ? 0 : 1) - (b.you ? 0 : 1)) || cmp(a, b));
}
function dirRows(book, tab, o){
  const t = tab || _dir.tab;
  return dirSort((book || []).filter(p => dirOnTab(p, t) && dirMatches(p, o || _dir)), t);
}
/* The number on a tab is the rows behind it, with the other filters on. */
function dirTabCount(book, tab, o){ return (book || []).filter(p => dirOnTab(p, tab) && dirMatches(p, o || _dir)).length; }
function dirPeopleOfParty(key){ return dirBook().filter(p => p.partyKey === key); }

/* ---- THE PLACE A REFRESH PUTS BACK ---- */
function dirPlace(){ return { tab: _dir.tab, q: _dir.q, party: _dir.party, hati: _dir.hati, stream: _dir.stream }; }
function dirPlacePut(p){
  if (!p || typeof p !== 'object') return;
  _dir.tab = DIR_TABS.includes(p.tab) ? p.tab : 'all';
  _dir.q = p.q ? String(p.q) : '';
  _dir.party = p.party ? String(p.party) : 'all';
  _dir.hati = ['admin', 'legal', 'viewer'].includes(p.hati) ? p.hati : 'all';
  _dir.shown = 0;
  _dir.stream = p.stream ? String(p.stream) : 'all';
}

/* ---- THE DOORS ---- */
/* From the Parties panel: this party's people, already narrowed to it. The
   number on that door is the rows this lands on (dirPeopleOfParty). */
function dirOpenParty(key){
  _dir.tab = 'all'; _dir.q = ''; _dir.hati = 'all'; _dir.stream = 'all'; _dir.shown = 0;
  _dir.party = key ? String(key) : 'all';
  if (typeof setView === 'function') setView('directory'); else renderDirectory();
  _dCall('placeSave');
}
/* ONE PERSON FROM ELSEWHERE (the Parties panel's "People at …"): the table
   with nothing narrowing it away, that person chosen, and LAND ON IT — their
   row, scrolled into view and lit */
function dirOpenPerson(key){
  if (!key) return;
  _dir.tab = 'all'; _dir.q = ''; _dir.party = 'all'; _dir.hati = 'all'; _dir.stream = 'all';
  const rows = dirRows(dirBook(), 'all');
  const at = rows.findIndex(p => p.key === key);
  _dir.shown = at >= 0 ? Math.max(DIR_PAGE, at + 1) : 0;
  if (typeof insSelect === 'function') insSelect(DIR_SEAT, key);
  if (typeof state !== 'undefined' && state.view !== 'directory' && typeof setView === 'function') setView('directory'); else renderDirectory();
  _dCall('placeSave');
  const q = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(String(key)) : String(key).replace(/"/g, '\\"');
  if (typeof landOn === 'function') landOn(`#dir-tbody [data-dir-row="${q}"]`, { focus: false });
}
/* A colleague's contracts = the Contracts page narrowed to them, through
   its own "only" chip; amendments ride with their agreement (cuIdsOf). */
function dirShowContracts(p){
  if (!p || !p.contracts.length || typeof regShowOnly !== 'function') return;
  const ids = (typeof cuIdsOf === 'function') ? cuIdsOf({ items: p.contracts.map(id => ({ id })) }) : p.contracts.slice();
  regShowOnly(ids, `${p.name || p.email} · ${p.contracts.length}`);
  if (typeof jlLand === 'function') jlLand('list');
}
function dirPartyLoaded(p){
  const v = (p && p.partyKey && typeof cuCustomerOf === 'function') ? cuCustomerOf(p.partyKey) : null;
  return !!(v && Array.isArray(v.items) && v.items.length);
}
/* A contract in the panel opens Home's Document on it, as every list panel's
   Document door does. */
function dirOpenContract(id){
  if (!id) return;
  if (!(typeof pdOpenOnHome === 'function' && pdOpenOnHome(id, 'open'))) { _dCall('openWorkspace', id); return; }
  if (typeof jlLand === 'function') jlLand('paper');
}
/* The second press (Enter, a double-click, the narrow window's one press). */
function dirOpenLead(p){
  if (!p) return;
  if (p.side === 'theirs'){ if (dirPartyLoaded(p) && typeof cuOpenCustomer === 'function') cuOpenCustomer(p.partyKey); return; }
  if (p.side === 'ours') dirShowContracts(p);
}

/* ---- PIECES ---- */
function dirLetterOf(p){
  const ch = _dStr(p && (p.name || p.email)).charAt(0);
  return ch ? ch.toLocaleUpperCase() : '#';
}
/* the name cell as drawn: round initials, the name, "(you)" in grey, and an
   away colleague's amber "Away until Fri" (their own rule, jlAwayOf) */
function dirAwayPillHtml(p){
  if (!p || p.side !== 'ours' || !p.id || typeof jlAwayOf !== 'function') return '';
  const aw = jlAwayOf(p.id);
  const today = (typeof todayISO === 'function') ? todayISO() : '';
  if (!(aw && aw.to && (!today || aw.to >= today))) return '';
  const ic = (typeof icon === 'function') ? icon('clock', 'ap-for-ic') : '';
  return ` <span class="dir-away">${ic}${_dE(i18t('jl_away_until', { day: (typeof jlDayWord === 'function') ? jlDayWord(aw.to, true) : aw.to }))}</span>`;
}
/* the table's columns after the name, in the drawing's order */
function dirColDefs(){
  return [
    { k: 'side', label: i18t('dir_col_side'), w: 66 },
    { k: 'party', label: i18t('dir_col_party'), w: 160 },
    { k: 'title', label: i18t('dir_col_title'), w: 144 },
    { k: 'hati', label: i18t('dir_col_hati'), w: 114 },
    { k: 'contracts', label: i18t('dir_col_contracts'), r: 1, w: 92 },
    { k: 'email', label: i18t('dir_col_email'), w: 168 },
  ];
}
function dirOurParty(){
  const f = (typeof window !== 'undefined') ? (window.FIRST_PARTY || '') : '';
  return _dStr(typeof f === 'function' ? f() : f);
}
/* an absence is a grey dash as drawn, and still SAYS what is missing — on the
   hover and to a screen reader (f202: "a missing job title and a missing
   address each say so") */
function dirNone(word){ return word ? `<span class="dir-none" title="${_dE(word)}" aria-label="${_dE(word)}">—</span>` : `<span class="dir-none">—</span>`; }
function dirCellHtml(k, p){
  if (k === 'side') return `<td class="dir-td-cut dir-td-wrap"><span class="dir-clamp">${_dE(p.side === 'ours' ? i18t('dir_side_ours') : p.side === 'theirs' ? i18t('dir_side_theirs') : i18t('dir_tab_none'))}</span></td>`;
  if (k === 'party'){ const v = p.side === 'ours' ? dirOurParty() : p.side === 'theirs' ? p.partyName : ''; return `<td class="dir-td-cut dir-td-wrap"${v ? ` title="${_dE(v)}"` : ''}>${v ? `<span class="dir-clamp">${_dE(v)}</span>` : dirNone(p.side === 'none' ? i18t('dir_imported') : '')}</td>`; }
  if (k === 'title') return `<td class="dir-td-cut dir-td-wrap"${p.title ? ` title="${_dE(p.title)}"` : ''}>${p.title ? `<span class="dir-clamp">${_dE(p.title)}</span>` : dirNone(i18t('dir_no_title'))}</td>`;
  /* the role, said where a colleague has one here (D-2: who is an admin is stated) */
  if (k === 'hati') return `<td class="dir-role dir-td-cut dir-td-wrap">${p.side === 'ours' && p.hati ? `<span class="dir-clamp">${_dE(p.hati)}</span>` : dirNone('')}</td>`;
  if (k === 'contracts') return `<td class="n">${p.contracts.length ? p.contracts.length : dirNone(i18t('dir_no_contracts'))}</td>`;
  if (k === 'email') return `<td class="dir-td-cut dir-td-wrap dir-mail">${p.email ? `<a class="dir-clamp" href="mailto:${_dE(p.email)}" title="${_dE(p.email)}">${_dE(p.email).replace('@', '@<wbr>')}</a>` : dirNone(i18t('dir_no_email'))}</td>`;
  return '<td></td>';
}
/* ONE PERSON, ONE ROW. The hooks the phone and the tests share are kept:
   [data-dir-row] is the person, .dir-name the name, .dir-you the reader's own
   mark, .dir-mail the one link, .dir-none an absence. */
function dirRowHtml(p, keys){
  const ini = _dE(dirInitials(p.name || p.email));
  const you = p.you ? ` <span class="dir-you">${_dE(i18t('dir_you_paren'))}</span>` : '';
  return `<tr data-dir-row="${_dE(p.key)}" data-dir-letter="${_dE(dirLetterOf(p))}" tabindex="-1">
    <td><span class="dir-nm"><span class="dir-tav" aria-hidden="true">${ini}</span><span class="dir-nm-w" title="${_dE(p.name || p.email || '')}"><span class="dir-name">${_dE(p.name || p.email || '—')}</span>${you}</span>${dirAwayPillHtml(p)}</span></td>
    ${keys.map(k => dirCellHtml(k, p)).join('')}
  </tr>`;
}
function dirPartNote(){
  const api = (typeof API_MODE === 'function') && API_MODE();
  if (!api || typeof state === 'undefined' || !state.serverStats || state.serverStats.total == null) return '';
  const total = Number(state.serverStats.total), have = state.contracts.length;
  return total <= have ? '' : i18t('cu_part_book', { have, total });
}
/* THE BAND'S FILTERS AS DRAWN (round 19's People scene): each box's word
   above it — Name, email or party · Side · Party · Role in HaTi · Stream — the
   Parties page's own boxes (cuChip, cuFindHtml). A box lists only choices
   that hold somebody. */
function dirFilterBarHtml(book){
  const chip = o => (typeof cuChip === 'function') ? cuChip(o) : '';
  const loc = _dLoc();
  const partyOpts = [...new Map(book.filter(p => p.partyKey).map(p => [p.partyKey, p.partyName])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], loc, { sensitivity: 'base' }));
  const sideOpts = DIR_TABS.filter(k => k === 'all' || k === _dir.tab || book.some(p => p.side === k)).map(k => [k, i18t('dir_tab_' + k)]);
  const hatiOpts = ['admin', 'legal', 'viewer'].filter(k => k === _dir.hati || book.some(p => p.side === 'ours' && p.role === k)).map(k => [k, dirRoleName(k)]);
  const streamOpts = [...new Set(book.flatMap(p => p.streams))].map(f => [f, dirStreamName(f)]).filter(x => x[1])
    .sort((a, b) => a[1].localeCompare(b[1], loc, { sensitivity: 'base' }));
  const find = (typeof cuFindHtml === 'function') ? cuFindHtml({ id: 'dir-q', label: i18t('dir_find_ph'), ph: i18t('dir_find_type'), q: _dir.q })
    : `<label class="dir-find"><input id="dir-q" type="search" autocomplete="off" placeholder="${_dE(i18t('dir_find_ph'))}" value="${_dE(_dir.q)}"></label>`;
  return `<div class="reg-filterbar reg-fb cu-fb">
    ${find}
    ${chip({ label: i18t('dir_f_side'), attr: 'data-dir-f', key: 'tab', cur: _dir.tab, def: 'all', opts: sideOpts })}
    ${chip({ label: i18t('dir_f_party'), attr: 'data-dir-f', key: 'party', cur: _dir.party, def: 'all', opts: [['all', i18t('dir_all_parties')], ...partyOpts] })}
    ${chip({ label: i18t('dir_f_hati'), attr: 'data-dir-f', key: 'hati', cur: _dir.hati, def: 'all', opts: [['all', i18t('dir_any_role')], ...hatiOpts] })}
    ${chip({ label: i18t('reg_chip_stream'), title: i18t('reg_value_stream'), attr: 'data-dir-f', key: 'stream', cur: _dir.stream, def: 'all', opts: [['all', i18t('cu_all_streams')], ...streamOpts] })}
  </div>`;
}
/* The band: the page's name and its count, "9 of ours · 37 at 31 parties",
   then the filters under a hairline — the Parties page's own head */
function dirBandHtml(book){
  const ours = book.filter(p => p.side === 'ours').length, theirs = book.filter(p => p.side === 'theirs').length;
  const parties = new Set(book.map(p => p.partyKey).filter(Boolean)).size;
  const loc = (typeof jxLocale === 'function') ? jxLocale() : undefined;
  const sub = [i18t('dir_n_ours', { n: ours }), theirs ? i18tn('dir_head_theirs', parties, { n: theirs, p: parties }) : ''].filter(Boolean).join(' · ');
  return `<div class="sap-band ph-card">
    <div class="cu-head dir-head"><div class="cu-hl"><h1 class="cu-t dir-t">${_dE(i18t('nav_directory'))}<span class="cu-tn">${_dE(Number(book.length).toLocaleString(loc))}</span></h1><span class="cu-hs page-facts">${_dE(sub)}</span></div></div>
    ${dirFilterBarHtml(book)}
  </div>`;
}
function dirCardHtml(rows, book){
  const admin = _dCall('isAdmin') === true;
  const ic = n => (typeof icon === 'function') ? icon(n, 'w-3.5 h-3.5') : '';
  /* "There is nothing here" wears the product's one shape (emptyStateHtml,
     f238); nobody matching a search is the same shape with the search's
     own sentence. */
  const emptyWords = book.length ? i18t('dir_none_match') : i18t('dir_empty');
  const empty = (typeof window !== 'undefined' && typeof window.emptyStateHtml === 'function')
    ? `<div class="dir-empty">${window.emptyStateHtml({ icon: 'users', title: emptyWords })}</div>`
    : `<div class="ap-empty dir-empty">${_dE(emptyWords)}</div>`;
  /* ONE PAGE AT A TIME, the cap said ("12 of 46 shown · Show more"); the
     person in the panel is always among the rows drawn */
  const sel = (typeof insSelected === 'function') ? insSelected(DIR_SEAT) : null;
  const at = sel ? rows.findIndex(p => p.key === sel) : -1;
  const shown = Math.min(rows.length, Math.max(_dir.shown || DIR_PAGE, at + 1));
  const cols = dirColDefs(), byK = Object.fromEntries(cols.map(c => [c.k, c]));
  const keys = (typeof lcShown === 'function') ? lcShown(DIR_SEAT, cols.map(c => c.k)) : cols.map(c => c.k);
  const head = [{ t: i18t('dir_col_name') }, ...keys.map(k => Object.assign({ t: byK[k].label }, byK[k]))];
  const table = rows.length
    ? `<table class="ap-table ap-ins dir-table"><colgroup>${head.map(h => `<col${h.w ? ` style="width:${h.w}px"` : ''}>`).join('')}</colgroup><thead><tr>${
      head.map(h => `<th${h.r ? ' class="n"' : ''}${h.k ? ` data-dir-col="${_dE(h.k)}"` : ''}>${_dE(h.t)}</th>`).join('')}</tr></thead><tbody id="dir-tbody">${rows.slice(0, shown).map(p => dirRowHtml(p, keys)).join('')}</tbody></table>`
    : empty;
  const foot = [rows.length && typeof lcFootHtml === 'function' ? lcFootHtml(DIR_SEAT, shown, rows.length) : '', dirPartNote() ? `<span>${_dE(dirPartNote())}</span>` : ''].filter(Boolean).join(' ');
  const loc = (typeof jxLocale === 'function') ? jxLocale() : undefined;
  return `<section class="ap-card cu-card dir-card">
    <div class="ap-card-h cu-card-h"><h2 class="ap-card-t">${_dE(i18t('nav_directory'))} <span class="ap-card-n is-pill">${_dE(Number(rows.length).toLocaleString(loc))}</span> <span class="ap-card-m">${_dE(i18t('dir_list_sort'))}</span></h2><span class="ap-card-sp"></span>
      ${admin ? `<button type="button" id="dir-manage" class="ui-link">${_dE(i18t('dir_manage_settings'))}${ic('chevR')}</button>` : ''}${typeof lcBtnHtml === 'function' ? lcBtnHtml(DIR_SEAT) : ''}</div>
    <div class="cu-scroll dir-scroll" id="dir-scroll" data-lc-scroll="${DIR_SEAT}">${table}</div>
    ${foot ? `<div class="ap-foot cu-foot dir-cardfoot">${foot}</div>` : ''}
  </section>`;
}
/* Columns and Show more, the Parties page's own builder (LC_PAGES): the page
   says once what it draws and how it draws again */
function dirLcReg(){
  const L = (typeof window !== 'undefined') ? window.LC_PAGES : null;
  if (!L || L[DIR_SEAT]) return;
  L[DIR_SEAT] = { cols: () => dirColDefs().map(c => ({ k: c.k, label: c.label })), repaint: () => dirRepaint(),
    more: () => { _dir.shown = Math.max(_dir.shown || DIR_PAGE, DIR_PAGE) + DIR_PAGE; dirRepaint(); } };
}

/* ---- WHAT WAITS ON A PERSON (round 19, the People scene as drawn: "Waiting
   on Jonas · Power purchase agreement · Approval · Helio Energy AB · SEK 8.1 M
   · you may answer for him · Open approval") ----
   A colleague: the questions on the one ask list put to them by name (a rule
   step that names them, a named approval, an internal review), the chain's
   next step where it names them and no question was recorded, and their own
   turn to sign. Someone on the other side: the negotiations whose move is
   theirs. Read RAW off the loaded list; nothing is written. */
const DIR_WAIT_MAX = 4;
function dirWaitingOn(p){
  if (!p) return [];
  const out = [], seen = new Set();
  const add = (c, kind) => { const k = c.id + ':' + kind; if (seen.has(k)) return; seen.add(k); out.push({ c, kind }); };
  const live = dirContracts().filter(c => c && !c.archived && !c._codeNamed && c.status !== 'Signed' && c.status !== 'Declined');
  if (p.side === 'ours' && p.id){
    const u = { id: p.id, name: p.name };
    live.forEach(c => {
      let asks = []; try { asks = (typeof asksOf === 'function') ? asksOf(c) : []; } catch (_){ asks = []; }
      asks.filter(a => a && a.state === 'open' && a.to && !a.to.role && typeof askSamePerson === 'function' && askSamePerson(a.to, u))
        .forEach(a => add(c, a.kind === 'review' ? 'review' : a.kind === 'look' ? 'look' : 'approval'));
      let st = null; try { st = (typeof approvalState === 'function') ? approvalState(c) : null; } catch (_){ st = null; }
      const nx = st && st.next;
      if (nx && !nx.sa && nx.approver && nx.approver.kind === 'member' && String(nx.approver.id) === String(p.id)) add(c, 'approval');
      let ns = null; try { ns = (typeof nextSigner === 'function') ? nextSigner(c) : null; } catch (_){ ns = null; }
      if (ns && ns.party !== 'counterparty' && !ns.signed && ns.memberId != null && String(ns.memberId) === String(p.id)) add(c, 'sign');
    });
  } else if (p.side === 'theirs'){
    live.filter(c => p.contracts.includes(c.id)).forEach(c => {
      let m = null; try { m = (typeof negWhoseMove === 'function') ? negWhoseMove(c) : null; } catch (_){ m = null; }
      if (m && m.k === 'them') add(c, 'move');
    });
  }
  return out;
}
const DIR_WAIT_KIND = { approval: 'ap_wl_kind_appr', review: 'jl_kind_review', look: 'jl_kind_look', sign: 'ap_wl_kind_sig', move: 'jl_kind_move' };
const DIR_WAIT_OPEN = { approval: 'jl_open_approval', review: 'jl_open_review', look: 'jl_open_review', sign: 'jl_open_signing', move: 'jl_open_negotiation' };
function dirWaitGo(kind, id){
  const c = (typeof getContract === 'function') ? getContract(id) : null; if (!c) return;
  /* LAND ON IT: each door arrives on its one thing, lit (jlLand) */
  const land = (k, a) => { if (typeof jlLand === 'function') jlLand(k, a); };
  if (kind === 'approval'){ if (typeof insSelect === 'function') insSelect('approvals', c.id); if (typeof setView === 'function') setView('approvals'); land('row', c.id); return; }
  if (kind === 'sign'){ if (typeof apOpenSigning === 'function') apOpenSigning(c.id, 'road'); return; }
  if (typeof openRedlineWorkbench === 'function'){ openRedlineWorkbench(c.id, { face: true }); land('redlines'); } else dirOpenContract(c.id);
}
/* THE PAGE IN JAMBO'S WORDS (nothing chosen): the directory's own counts,
   who the reader stands in for; chips are its own tabs */
function dirSay(){
  const book = dirBook();
  const ours = book.filter(p => p.side === 'ours').length, theirs = book.filter(p => p.side === 'theirs').length;
  const n = book.length;
  if (!n) return { lines: [_dE(i18t('dir_empty'))] };
  const lines = [`<b>${_dE(i18tn('jl_dir_say', n, { n }))}</b>${_dE(': ' + i18t('jl_dir_split', { ours, theirs }))}.`];
  const cov = (typeof state !== 'undefined' && state && state.away && Array.isArray(state.away.covering)) ? state.away.covering : [];
  cov.forEach(x => { if (x && x.userName) lines.push(_dE(i18t('jl_dir_cover', { who: String(x.userName).split(/\s+/)[0], day: (typeof jlDayWord === 'function') ? jlDayWord(x.to) : x.to }))); });
  const chips = [];
  if (ours && _dir.tab !== 'ours') chips.push({ label: i18t('jl_dir_chip_ours'), run: () => { _dir.tab = 'ours'; renderDirectory(); _dCall('placeSave'); } });
  if (theirs && _dir.tab !== 'theirs') chips.push({ label: i18t('jl_dir_chip_theirs'), run: () => { _dir.tab = 'theirs'; renderDirectory(); _dCall('placeSave'); } });
  return { lines, chips };
}
/* ---- THE PANEL: the chosen person, their contracts and the doors ---- */
const DIR_JL = { jlHome: () => i18t('nav_directory'), jlPh: () => i18t('jl_ph_any') };
function dirPaintPanel(p, book){
  if (typeof insPaintPanel !== 'function') return;
  if (!p){ insPaintPanel({ seat: DIR_SEAT, c: null, item: null, empty: i18t('dir_panel_none'), jlHome: DIR_JL.jlHome(), jlPh: DIR_JL.jlPh(), jlSay: dirSay }); return; }
  const kv = facts => (typeof insKvHtml === 'function') ? insKvHtml(facts) : '';
  const sec = (t, n, body) => (typeof insSecHtml === 'function') ? insSecHtml(t, n, body) : '';
  const ic = nm => (typeof icon === 'function') ? icon(nm, 'w-3.5 h-3.5') : '';
  const byId = new Map(dirContracts().map(c => [c.id, c]));
  const n = p.contracts.length;
  const streams = _dE(p.streams.map(dirStreamName).filter(Boolean).join(' · '));
  const mail = p.email ? `<a href="mailto:${_dE(p.email)}">${_dE(p.email)}</a>` : `<span class="dir-none">${_dE(i18t('dir_no_email'))}</span>`;
  let head, body;
  /* JAMBO'S PANEL, THE PERSON AS DRAWN (round 19, the People scene): their
     initials, name and "Commercial lead · our side"; Show their contracts ·
     Email; the facts as rows — Email · In HaTi · Streams · Named on · Away;
     what waits on them, each with its own door; the contracts they are named
     on with their stage, and "All N on Contracts ›" */
  const rowsOf = list => (typeof insRowsHtml === 'function') ? insRowsHtml(list) : kv(list);
  const first = String(p.name || p.email || '').split(/\s+/)[0];
  const av = `<span class="jl-av" aria-hidden="true">${_dE(dirInitials(p.name || p.email))}</span>`;
  const mailBtn = p.email ? [{ k: 'email', label: i18t('jl_email'), title: p.email, run: () => { try { window.location.href = 'mailto:' + p.email; } catch (_){} } }] : [];
  const waits = dirWaitingOn(p);
  const me = _dCall('currentUser') || {};
  const covers = p.side === 'ours' && p.id && typeof awayCovers === 'function' && awayCovers(me, p.id);
  const waitSec = (p.side === 'ours' || p.side === 'theirs') && waits.length ? sec(i18t('jl_waiting_on', { who: first }), waits.length,
    `<div class="jl-need is-wait">${waits.slice(0, DIR_WAIT_MAX).map(w => {
      const money = !(typeof canViewValues === 'function' && !canViewValues()) && w.c.value && !(typeof isMonetary === 'function' && !isMonetary(w.c));
      const sub = [i18t(DIR_WAIT_KIND[w.kind] || 'ap_wl_kind_appr'), _dStr(w.c.counterparty), money && typeof fmtMoneyShortOf === 'function' ? fmtMoneyShortOf(w.c) : '',
        covers && (w.kind === 'approval' || w.kind === 'review') ? i18t('jl_may_answer') : ''].filter(Boolean).join(' \u00b7 ');
      return `<div class="jl-need-r is-amber"><div class="jl-need-b"><div class="jl-need-t" title="${_dE(w.c.name || '')}">${_dE(w.c.name || w.c.id)}</div><div class="jl-need-s" title="${_dE(sub)}">${_dE(sub)}</div></div><button type="button" class="ui-btn ui-btn-sm jl-need-go" data-dir-wait="${_dE(w.kind)}" data-dir-wait-id="${_dE(w.c.id)}">${_dE(i18t(DIR_WAIT_OPEN[w.kind] || 'jl_open_approval'))}</button></div>`;
    }).join('')}</div>${waits.length > DIR_WAIT_MAX ? `<p class="ins-note">${_dE(i18tn('ins_more_asks', waits.length - DIR_WAIT_MAX, { n: waits.length - DIR_WAIT_MAX }))}</p>` : ''}`) : '';
  const namedJl = max => {
    /* what is asked of them now comes first (round 19 draws it at the top) */
    const askOf = id => (typeof p.askedOn === 'function' && p.askedOn(id)) ? 1 : 0;
    const ids = p.contracts.slice().sort((a, b) => askOf(b) - askOf(a)).slice(0, max);
    return `<div class="jl-ct-list">${ids.map(id => {
      const c = byId.get(id); if (!c) return '';
      const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
      /* what is asked of them on it now wears its own amber pill ("Approval
         asked", round 19); otherwise the stage, as everywhere */
      const ask = p.side === 'ours' && typeof p.askedOn === 'function' ? p.askedOn(id) : null;
      const st = ask ? `<span class="reg-stg jl-asked" style="color:var(--st-amber-fg);background:var(--st-amber-bg)"><i style="background:var(--st-amber-dot)"></i>${_dE(i18t(ask === 'review' ? 'jl_review_asked' : 'jl_approval_asked'))}</span>`
        : (typeof contractStatusDotHtml === 'function') ? contractStatusDotHtml(c) : _dE(c.status || '');
      const roles = p.roleOn(id).map(p.side === 'ours' ? dirRoleNoun : dirRoleWord).join(' · ');
      const sub = [ref, p.side === 'ours' ? _dStr(c.counterparty) : '', roles].filter(Boolean).join(' · ');
      return `<button type="button" class="dir-ct jl-ct" data-dir-ct="${_dE(c.id)}" title="${_dE(i18t('ins_door_doc'))}"><span class="dir-ct-n">${_dE(c.name || c.counterparty || '')}</span><span class="dir-ct-st">${st}</span>${sub ? `<span class="dir-ct-sub">${_dE(sub)}</span>` : ''}</button>`;
    }).join('')}</div>${p.contracts.length > ids.length || p.contracts.length ? `<button type="button" class="ui-link jl-all" data-dir-all>${_dE(i18t('jl_all_on_contracts', { n: p.contracts.length }))}${ic('chevR')}</button>` : ''}`;
  };
  if (p.side === 'ours'){
    const aw = (typeof jlAwayOf === 'function') ? jlAwayOf(p.id) : null;
    const today = (typeof todayISO === 'function') ? todayISO() : '';
    const away = aw && aw.to && (!today || aw.to >= today) ? `<span class="ap-for jl-away">${ic('clock')}${_dE(i18t('jl_away_until', { day: (typeof jlDayWord === 'function') ? jlDayWord(aw.to, true) : aw.to }))}</span><span class="sub">${_dE(i18t('jl_away_line', {
      span: (typeof jlDayRange === 'function') ? jlDayRange(aw.from, aw.to) : `${aw.from}–${aw.to}`, who: aw.deputyName || me.name || '' }))}</span>` : '';
    head = { av, title: p.name || p.email, sub: _dE([p.title, i18t('jl_side_ours')].filter(Boolean).join(' · ')),
      acts: [{ k: 'contracts', kind: 'accent', label: i18t('dir_show_contracts'), disabled: !n,
        title: n ? '' : i18t('dir_show_contracts_none'), run: () => dirShowContracts(p) }].concat(mailBtn) };
    /* ONLY THE DOORS (round 19's People scene as drawn, owner's "build all
       the gaps", 18 Oct 2026): Show his contracts · Email, no ⋯ — a person's
       rights are changed on Settings → People, the one place they live */
    body = rowsOf([{ k: 'email', label: i18t('jl_f_email'), v: mail }, { k: 'hati', label: i18t('dir_f_in_hati'), v: _dE(p.hati) },
      { k: 'streams', label: i18t('cu_panel_streams'), v: streams }, { k: 'contracts', label: i18t('dir_named_on'), v: n ? _dE(i18tn('jl_named_n', n, { n, live: p.active })) : '' },
      ...(away ? [{ k: 'away', label: i18t('jl_f_away'), v: away }] : [])])
      + waitSec
      + sec(i18t('dir_named_on'), n, n ? namedJl(3) : `<p class="ins-note">${_dE(i18t('dir_no_contracts'))}</p>`);
  } else if (p.side === 'none'){
    /* SOMEBODY ON NO CONTRACT YET: the same shape as every person (round 19)
       — initials, name, "title · not on a contract"; Email; the rows; where
       they would be named, a sentence saying they are not yet */
    head = { av, title: p.name || p.email, sub: _dE([p.title, i18t('dir_tab_none')].filter(Boolean).join(' · ')), acts: mailBtn };
    body = rowsOf([{ k: 'email', label: i18t('jl_f_email'), v: mail }, { k: 'phone', label: i18t('dir_f_phone'), v: dirNone(i18t('dir_no_phone')) },
      { k: 'party', label: i18t('dir_f_party'), v: dirNone(i18t('dir_imported')) }, { k: 'contracts', label: i18t('dir_named_on'), v: dirNone(i18t('dir_no_contracts')) }])
      + sec(i18t('dir_on_these'), 0, `<p class="ins-note">${_dE(i18t('dir_not_named_long'))}</p>`);
  } else {
    /* SOMEONE ON THEIR SIDE, AS DRAWN (round 19's People scene, Henrik Dahl):
       "Head of procurement · Nordvik Logistik AB"; Show their contracts ·
       Email; Email · Phone · Party (a door onto the party, chosen on Parties)
       · Named on; then "On these contracts" — each row what they do for their
       party on it ("negotiates for Nordvik", "signed for Nordvik") */
    const loaded = dirPartyLoaded(p);
    const short = (typeof cuShortName === 'function') ? cuShortName(p.partyName) : p.partyName;
    head = { av, title: p.name || p.email, sub: _dE([p.title, p.partyName].filter(Boolean).join(' · ')),
      acts: [{ k: 'contracts', kind: 'accent', label: i18t('dir_show_contracts'), disabled: !n,
        title: n ? '' : i18t('dir_show_contracts_none'), run: () => dirShowContracts(p) }].concat(mailBtn) };
    const ph = dirPhoneOf(p);
    const phone = ph ? `<a href="tel:${_dE(ph.replace(/[^+\d]/g, ''))}">${_dE(ph)}</a>` : dirNone(i18t('dir_no_phone'));
    const party = !p.partyName ? dirNone('') : loaded
      ? `<button type="button" class="ui-link dir-party-go" data-dir-party="${_dE(p.partyKey)}">${_dE(p.partyName)}${ic('chevR')}</button>` : _dE(p.partyName);
    const theirsList = () => {
      const ids = p.contracts.slice(0, DIR_NAMED_MAX);
      return `<div class="jl-ct-list">${ids.map(id => {
        const c = byId.get(id); if (!c) return '';
        const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
        const st = (typeof contractStatusDotHtml === 'function') ? contractStatusDotHtml(c) : _dE(c.status || '');
        const sub = [ref, dirDoesFor(p.roleOn(id), c, short)].filter(Boolean).join(' · ');
        return `<button type="button" class="dir-ct jl-ct" data-dir-ct="${_dE(c.id)}" title="${_dE(i18t('ins_door_doc'))}"><span class="dir-ct-n">${_dE(c.name || c.counterparty || '')}</span><span class="dir-ct-st">${st}</span><span class="dir-ct-sub">${_dE(sub)}</span></button>`;
      }).join('')}</div>`;
    };
    body = rowsOf([{ k: 'email', label: i18t('jl_f_email'), v: mail }, { k: 'phone', label: i18t('dir_f_phone'), v: phone },
      { k: 'party', label: i18t('dir_f_party'), v: party }, { k: 'contracts', label: i18t('dir_named_on'), v: n ? _dE(i18tn('dir_n_contracts', n, { n })) : '' }])
      + waitSec
      + sec(i18t('dir_on_these'), n, n ? theirsList() : `<p class="ins-note">${_dE(i18t('dir_no_contracts'))}</p>`);
    dirPhoneAsk(p);
  }
  insPaintPanel({ seat: DIR_SEAT, item: { id: p.key }, head, body,
    jlWord: i18t('jl_w_person'), jlHome: DIR_JL.jlHome(), jlPh: DIR_JL.jlPh(), jlSay: dirSay });
  dirPanelWire();
}
/* WHAT SOMEONE ON THEIR SIDE DOES FOR THEIR PARTY ON A CONTRACT (round 19:
   "negotiates for Nordvik", "signed for Nordvik") — the strongest role named */
const DIR_DOES = { cpsign: ['dir_does_signs', 'dir_does_signed'], negotiate: ['dir_does_negotiates', 'dir_does_negotiated'],
  advise: ['dir_does_advises', 'dir_does_advised'], cpread: ['dir_does_reads', 'dir_does_read'] };
function dirDoesFor(roles, c, party){
  const k = ['cpsign', 'negotiate', 'advise', 'cpread'].find(x => (roles || []).includes(x));
  if (!k) return '';
  const done = !!(c && c.status === 'Signed');
  return i18t(DIR_DOES[k][done ? 1 : 0], { party: party || '' });
}
/* A PHONE NUMBER IS READ, NEVER GUESSED: the newest link this workspace sent
   to them (by their address, or by their name on a link with no address)
   that carried a number — the send screen's own record (shares, one cache,
   cachedShares). Nothing is stored; null where no link carried one. */
function dirPhoneOf(p){
  if (!p || typeof cachedShares !== 'function') return null;
  const mail = _dFold(p.email), nm = _dFold(p.name);
  const all = [];
  (p.contracts || []).forEach(id => { const c = (typeof getContract === 'function') ? getContract(id) : { id };
    (cachedShares(c) || []).forEach(sh => { if (sh && _dStr(sh.recipientPhone)) all.push(sh); }); });
  const hit = all.filter(sh => mail ? _dFold(sh.recipientEmail) === mail : (!_dStr(sh.recipientEmail) && nm && _dFold(sh.recipientName) === nm))
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))[0];
  return hit ? _dStr(hit.recipientPhone) : null;
}
/* the links on their contracts, asked once each; the panel is drawn again
   when an answer lands and they are still the one chosen */
function dirPhoneAsk(p){
  if (!p || typeof ensureSharesCached !== 'function' || typeof sharesKnown !== 'function') return;
  const want = (p.contracts || []).slice(0, DIR_NAMED_MAX).map(id => (typeof getContract === 'function') ? getContract(id) : null)
    .filter(c => c && !sharesKnown(c));
  if (!want.length) return;
  Promise.all(want.map(c => ensureSharesCached(c))).then(() => {
    const sel = (typeof insSelected === 'function') ? insSelected(DIR_SEAT) : null;
    if (sel !== p.key || typeof state === 'undefined' || state.view !== 'directory' || !dirPhoneOf(p)) return;
    const q = dirBook().find(x => x.key === p.key); if (q) dirPaintPanel(q, dirBook());
  }).catch(() => {});
}
/* The panel's own rows: a contract opens, a person is chosen. Bound once per
   panel element; it reads the live wall at press time. */
function dirPanelWire(){
  const host = (typeof document !== 'undefined') ? document.getElementById('ins-panel') : null;
  if (!host || host.dataset.dirBound) return;
  host.dataset.dirBound = '1';
  host.addEventListener('click', e => {
    const wt = e.target.closest && e.target.closest('[data-dir-wait]');
    if (wt){ dirWaitGo(wt.getAttribute('data-dir-wait'), wt.getAttribute('data-dir-wait-id')); return; }
    const all = e.target.closest && e.target.closest('[data-dir-all]');
    if (all){ const cur = host._ins || {}; const key = cur.item && cur.item.id; const p = key ? dirBook().find(x => x.key === key) : null; if (p) dirShowContracts(p); return; }
    const ct = e.target.closest && e.target.closest('[data-dir-ct]');
    if (ct){ dirOpenContract(ct.getAttribute('data-dir-ct')); return; }
    const pg = e.target.closest && e.target.closest('[data-dir-party]');
    if (pg){ if (typeof cuSelectParty === 'function') cuSelectParty(pg.getAttribute('data-dir-party')); return; }
    const pk = e.target.closest && e.target.closest('[data-dir-pick]');
    if (pk) dirSelect(pk.getAttribute('data-dir-pick'));
  });
}
/* Choose a person from the panel (somebody else at the same party): the
   wall's own selection, and the card scrolled into view. */
function dirSelect(key){
  let tb = document.getElementById('dir-tbody');
  let row = tb && [...tb.querySelectorAll('[data-dir-row]')].find(f => f.getAttribute('data-dir-row') === key);
  /* a person past the rows drawn: draw down to them first */
  if (tb && !row){
    if (typeof insSelect === 'function') insSelect(DIR_SEAT, key);
    renderDirectory();
    tb = document.getElementById('dir-tbody');
    row = tb && [...tb.querySelectorAll('[data-dir-row]')].find(f => f.getAttribute('data-dir-row') === key);
  }
  const L = tb && tb._insList;
  if (!tb || !L || !row) return;
  L.onSelect(key, row);
  try { row.scrollIntoView({ block: 'nearest' }); } catch (_) {}
}

/* ---- THE PAGE ---- */
function renderDirectory(){
  const host = document.getElementById('content'); if (!host) return;
  const INS = (typeof insFits === 'function') && insFits() && typeof insPaintPanel === 'function';
  const keep = (() => { const sc = document.getElementById('dir-scroll'); return sc ? sc.scrollTop : 0; })();
  const typing = document.activeElement && document.activeElement.id === 'dir-q';
  const book = dirBook();
  const rows = dirRows(book, _dir.tab);
  const card = dirCardHtml(rows, book);
  dirLcReg();
  host.innerHTML = `<style>${(typeof window !== 'undefined' && window.LC_CSS) || ''}${DIR_CSS}</style>
  <div id="dir-page" class="view-enter sap-page ap-page dir-page${INS ? ' is-ins' : ''}" data-ins-page="directory" data-ins="${INS ? '1' : '0'}">
    ${dirBandHtml(book)}
    ${INS ? `<div class="ap-body is-ins dir-body">${card}<aside id="ins-panel" class="ins-panel" aria-label="${_dE(i18t('dir_panel_label'))}"></aside></div>`
      : `<div class="dir-body">${card}</div>`}
  </div>`;
  const sc = document.getElementById('dir-scroll'); if (sc && keep) sc.scrollTop = keep;
  dirWire(host, INS, book, rows);
  if (typing){ const q = document.getElementById('dir-q'); if (q){ q.focus(); const len = q.value.length; try { q.setSelectionRange(len, len); } catch (_) {} } }
  if (typeof lcPlace === 'function') lcPlace(DIR_SEAT);
  if (INS && typeof insWatchWidth === 'function') insWatchWidth();
  if (typeof setActiveNav === 'function') setActiveNav('directory');
}
function dirRepaint(){ if (typeof state !== 'undefined' && state.view === 'directory') renderDirectory(); }
function dirWire(host, INS, book, rows){
  const manage = host.querySelector('#dir-manage');
  if (manage) manage.addEventListener('click', () => { if (typeof openSettingsAt === 'function') openSettingsAt('people'); });
  host.querySelectorAll('select[data-dir-f]').forEach(s => s.addEventListener('change', () => {
    const k = s.getAttribute('data-dir-f'); if (!['tab', 'party', 'hati', 'stream'].includes(k)) return;
    _dir[k] = (k === 'tab' && !DIR_TABS.includes(s.value)) ? 'all' : (s.value || 'all'); _dir.shown = 0;
    renderDirectory(); _dCall('placeSave');
  }));
  const q = host.querySelector('#dir-q');
  if (q) q.addEventListener('input', () => { _dir.q = q.value; _dir.shown = 0; renderDirectory(); });
  if (typeof lcScrollWire === 'function') lcScrollWire(host, DIR_SEAT);
  const tb = host.querySelector('#dir-tbody');
  if (!tb){ if (INS) dirPaintPanel(null, book); return; }
  const idOf = el => el.getAttribute('data-dir-row');
  const find = key => book.find(p => p.key === key) || null;
  if (INS && typeof insListWire === 'function'){
    const keys = [...tb.querySelectorAll('[data-dir-row]')].map(idOf);
    const sel = (typeof insPick === 'function') ? insPick(DIR_SEAT, keys) : keys[0];
    if (typeof insMarkRow === 'function') insMarkRow(tb, '[data-dir-row]', idOf, sel);
    dirPaintPanel(find(sel), book);
    insListWire(tb, { rowSel: '[data-dir-row]', idOf,
      onSelect: key => { if (typeof insSelect === 'function') insSelect(DIR_SEAT, key); if (typeof insMarkRow === 'function') insMarkRow(tb, '[data-dir-row]', idOf, key); dirPaintPanel(find(key), book); },
      onOpen: key => dirOpenLead(find(key)) });
    return;
  }
  /* Narrow window: no panel, so a press opens. */
  tb.addEventListener('click', e => {
    const row = e.target.closest && e.target.closest('[data-dir-row]');
    if (!row || (e.target.closest && e.target.closest('a'))) return;
    dirOpenLead(find(idOf(row)));
  });
}

/* ---- THE STYLE: the Parties page's band and card, plus the wall's own ----
   Tokens only; the one grey an absence wears is .dir-none, defined once in
   index.html for both shells. */
const DIR_CSS = `
  .dir-page{height:var(--view-h);box-sizing:border-box;}
  .dir-page .sap-band{padding-top:var(--page-pad-t);display:flex;flex-direction:column;gap:0;}
  .dir-body{flex:1;min-height:0;}
  .dir-card{display:flex;flex-direction:column;min-height:0;}
  .dir-page.is-ins .dir-card{overflow:hidden;}
  .dir-page:not(.is-ins) .dir-card{max-height:100%;}
  /* the table as drawn: round initials, the name, "(you)" in grey, an
     away colleague's amber pill; long cells end in an ellipsis, whole on hover */
  .dir-table tbody tr[data-dir-row]{cursor:pointer;}
  .dir-table tbody tr[data-dir-row]:focus{outline:none;}
  .dir-table tbody tr.is-sel td{background:color-mix(in srgb,var(--color-accent) 8%,transparent);}
  .dir-table tbody tr.is-sel td:first-child{box-shadow:inset 2px 0 0 var(--accent-solid);}
  .dir-table td.n,.dir-table th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;}
  .dir-table td.dir-td-cut{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0;}
  /* a party's or a job's name is read whole: a long one takes a second line
     rather than being cut (round 19 draws them whole) */
  .dir-table td.dir-td-cut.dir-td-wrap{white-space:normal;text-overflow:clip;}
  .dir-clamp{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;line-height:1.3;overflow-wrap:break-word;}
  .dir-mail .dir-clamp{overflow-wrap:anywhere;}
  .ap-table.dir-table :is(td,th){padding-left:12px;padding-right:12px;}
  .dir-nm{display:flex;align-items:center;gap:4px 8px;min-width:0;flex-wrap:wrap;}
  .dir-nm-w{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .dir-tav{flex:none;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:var(--w-strong);background:var(--color-accent-50);color:var(--accent-ink);border:1px solid var(--color-divider);}
  .dir-table .dir-name{font-weight:var(--w-label);color:var(--color-text);}
  .dir-table .dir-mail a{color:var(--color-neutral-600);text-decoration:none;font-size:var(--t-meta);}
  .dir-table .dir-mail a:hover{color:var(--accent-ink);text-decoration:underline;}
  .dir-you{font-size:var(--t-body);color:var(--color-neutral-500);margin-left:2px;font-weight:var(--w-body);}
  .dir-away{flex:none;display:inline-flex;align-items:center;gap:3px;margin-left:2px;padding:1px 7px;border-radius:999px;background:var(--st-amber-bg);color:var(--st-amber-fg);
    font-size:var(--t-micro);font-weight:var(--w-label);vertical-align:1px;white-space:nowrap;}
  .dir-away .ap-for-ic{width:11px;height:11px;flex:none;}
  .dir-empty{padding:28px 14px;}
  .ins-panel .dir-ct{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 10px;width:100%;padding:7px 0;border:0;border-top:1px solid var(--surface-2);
    background:none;font:inherit;font-size:var(--t-body);color:var(--color-text);text-align:left;cursor:pointer;}
  .ins-panel .dir-ct:first-child{border-top:0;padding-top:0;}
  .ins-panel .dir-ct:hover .dir-ct-n{color:var(--accent-ink);}
  .dir-ct-n{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .dir-ct-ref{font-size:var(--t-meta);color:var(--color-neutral-600);margin-right:6px;}
  .dir-ct-st{white-space:nowrap;}
  .dir-ct-sub{grid-column:1 / -1;font-size:var(--t-meta);color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  /* NAMED ON, AS DRAWN (round 19's People scene): the rows sit in a bordered
     white card, the name bold over its line, the stage on the right across
     both lines */
  .ins-panel .jl-ct-list{border:1px solid var(--color-divider);border-radius:var(--radius-lg);background:var(--color-surface);overflow:hidden;}
  .ins-panel .jl-ct-list .dir-ct{padding:9px 12px;border-top:1px solid var(--color-divider);}
  .ins-panel .jl-ct-list .dir-ct:first-child{border-top:0;padding-top:9px;}
  .ins-panel .jl-ct-list .dir-ct-n{font-weight:var(--w-strong);}
  .ins-panel .jl-ct-list .dir-ct-st{grid-column:2;grid-row:1 / span 2;align-self:center;}
  .ins-panel .jl-ct-list .dir-ct-sub{grid-column:1;}
  .ins-panel .jl-ct-list + .jl-all{margin-top:8px;}
  /* WAITING ON <NAME>, AS DRAWN: the work in a card without dots, its line on
     one line (the whole of it on the hover) */
  .ins-panel .jl-need.is-wait .jl-need-r{grid-template-columns:minmax(0,1fr) auto;}
  .ins-panel .jl-need.is-wait .jl-need-s{display:block;white-space:nowrap;text-overflow:ellipsis;}
  .ins-panel .dir-pp{display:flex;align-items:center;gap:var(--s-2);width:100%;padding:6px 0;border:0;border-top:1px solid var(--surface-2);
    background:none;font:inherit;font-size:var(--t-body);color:var(--color-text);text-align:left;cursor:pointer;}
  .ins-panel .dir-pp:first-child{border-top:0;padding-top:0;}
  .ins-panel .dir-pp:hover .dir-pp-n{color:var(--accent-ink);}
  .dir-pp .reg-av{width:24px;height:24px;font-size:10px;}
  .dir-pp-n{font-weight:var(--w-label);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .dir-pp-r{margin-left:auto;font-size:var(--t-meta);color:var(--color-neutral-600);white-space:nowrap;}
  .dir-chips{display:flex;flex-wrap:wrap;gap:6px;}
  .dir-chips span{font-size:var(--t-meta);padding:2px 8px;border:1px solid var(--color-divider);border-radius:999px;}
  .dir-more{padding-top:8px;font-size:var(--t-meta);color:var(--color-neutral-600);}
`;

Object.assign(window, { renderDirectory, dirRepaint, dirPeople, dirBook, dirRows, dirMatches, dirTabCount, dirPeopleOfParty, dirRoleWords,
  dirRowHtml, dirColDefs, dirCellHtml, dirAwayPillHtml, DIR_PAGE, dirOpenPerson, dirPlace, dirPlacePut, dirOpenParty, dirShowContracts, dirOpenContract, dirPaintPanel, dirSelect, DIR_TABS,
  dirWaitingOn, dirPhoneOf, dirDoesFor, DIR_DOES, DIR_WAIT_MAX, DIR_WAIT_KIND, DIR_WAIT_OPEN, dirWaitGo, dirSay, dirNamedRoles, DIR_ROLE_NOUN, dirRoleNoun });
