/* ═══ CUSTOMER FOLDERS — SHELVES, DRAWN THE SAP WAY (owner, 10 Oct 2026:
   "implement the filter besides tabs and the custom folders SAP way"; the
   design he picked is "Customer folders" in the Customer Folders and Filters
   artifact) ══════════════════════════════════════════════════════════════

   A Customers page in the rail, right after Home: one row per customer, its
   active and expired contracts counted. THE CUSTOMER'S OWN PAGE IS GONE (owner,
   10 Oct 2026: "when you click on open customer, it takes you to the contracts
   page and only contracts for that customer will be listed there. When you
   click on explorer it will then take you to the explorer page with just those
   customers but grouped by active vs expired"): Open customer is the Contracts
   page's own "show only these" door (regShowOnly), Open on Explorer is
   Explorer's own lens with a two-group grouping — no second door onto either.

   FOLDERS ARE A READING, NOT A FILING CABINET. Nothing is moved into a
   folder and nothing is stored: HaTi already knows the customer (the
   counterparty on the contract, c.counterparty — the first outside party,
   always), whether the term has ended (contractExpired, the product's one
   rule) and the stream it is filed in (c.folder). These pages draw those
   three facts. Re-file a contract on its Overview and it is on the right
   shelf at once. One fact, one home.

   ACTIVE AND EXPIRED, EVERY CONTRACT IN EXACTLY ONE: Expired is an executed
   contract whose term has run out (contractExpired) plus Closed (Declined);
   everything else is Active, drafts and negotiations included, each still
   wearing its stage. So a customer's number is always the list under it.

   THE STREAM WALL STANDS: the list is state.contracts, which the server has
   already filtered to the streams this reader may open (folderScopeFor) —
   a stream the reader cannot open is never named, not even as a count.

   ONE NUMBER EVERYWHERE: with a Stream or Owner filter on, the row, its
   sub-line, the side panel and the Contracts page it opens all count the same
   filtered contracts (cuView). Amendments ride with their agreement (only
   agreements are counted, as the Contracts head counts them; the Contracts
   page draws them under it). Draft new agreement is the existing form with
   the counterparty filled in.

   NOTHING HERE WRITES. Read RAW — no reading here creates a negotiation. */

/* Per sitting: the list's own find and filters. A refresh puts them back
   through PLACE_PARTS (cuPlace / cuPlacePut). */
const _cu = { stream: 'all', owner: 'all', nda: 'all', status: 'all', q: '' };

function cuNameOf(c){ return String((c && c.counterparty) || '').trim(); }
/* One shelf per name, whatever its case or spacing: "Naivas Ltd" and "naivas
   ltd" are one customer; "Naivas Supermarkets" and "Naivas Ltd" are two until
   the contract is renamed — HaTi has no customer record of its own, and this
   is not a second place for a fact that lives on the contract. */
function cuKeyOf(name){ return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase(); }
/* The book these pages read: live agreements with a counterparty. Archived
   contracts are off every default list (contractSetArchived); an amendment
   is counted with its agreement. */
function cuBook(){
  const all = (typeof state !== 'undefined' && Array.isArray(state.contracts)) ? state.contracts : [];
  /* A DEAL KEPT TO ITS LIST IS NOT ON PARTIES (round 19, owner: "Leave it
     off", 17 Oct 2026): its stand-in names no party, and is left out on
     purpose, not by accident */
  return all.filter(c => c && !c.archived && !c.parentId && !c._codeNamed && cuNameOf(c));
}
function cuBucket(c){
  if (c && c.status === 'Declined') return 'expired';
  return (typeof contractExpired === 'function' && contractExpired(c)) ? 'expired' : 'active';
}
function cuWaitingOnYou(c){
  try { const m = (typeof regMoveWord === 'function') ? regMoveWord(c) : null; return !!(m && m.k === 'you'); } catch (_) { return false; }
}
function cuEnds(c){
  const raw = (typeof effectiveExpiry === 'function' ? effectiveExpiry(c) : null) || (c && c.metadata && c.metadata.expiryDate) || (c && c.expiry);
  return raw ? ((typeof dateOnly === 'function') ? dateOnly(raw) : String(raw).slice(0, 10)) : null;
}
/* The next executed contract to end, among those not ended yet. */
function cuNextEnd(items){
  const days = (items || []).filter(c => c.status === 'Signed' && cuBucket(c) === 'active').map(cuEnds).filter(Boolean).sort();
  return days[0] || null;
}
function cuStreamName(id){ return (typeof FOLDERS !== 'undefined' && FOLDERS[id] && FOLDERS[id].name) || ''; }
function cuMoney(){ return !(typeof canViewValues === 'function' && !canViewValues()); }
function cuSum(items){
  return (typeof regAggregate === 'function') ? regAggregate(items)
    : (items || []).reduce((s, c) => s + Number((c && c.value) || 0), 0);
}
function cuMoneyWords(items){
  const priced = (items || []).filter(c => c.status !== 'Declined' && (typeof isMonetary !== 'function' || isMonetary(c)));
  if (!priced.length) return '';
  const v = cuSum(priced);
  if (!(v > 0)) return '';
  return (typeof fmtMoneyShort === 'function') ? fmtMoneyShort(v) : String(v);
}
function cuDay(iso){
  if (!iso) return '';
  try { return (typeof regDotDate === 'function') ? regDotDate(iso) : iso; } catch (_) { return iso; }
}
/* A PART OF THE BOOK IS NEVER COUNTED AS THE WHOLE (regViewCount's own rule):
   in server mode with a book longer than the list holds, every figure here is
   about the contracts loaded, and the card's foot says so. */
function cuWhole(){
  const api = (typeof API_MODE === 'function') && API_MODE();
  if (!api || !state.serverStats || state.serverStats.total == null) return { whole: true };
  const total = Number(state.serverStats.total), have = state.contracts.length;
  return total <= have ? { whole: true } : { whole: false, have, total };
}

/* ---- THE ONE READING: customers, each with its contracts ---- */
function cuCustomers(book){
  const map = new Map();
  for (const c of (book || cuBook())){
    const name = cuNameOf(c), key = cuKeyOf(name);
    let r = map.get(key);
    if (!r){ r = { key, name, items: [], spell: {} }; map.set(key, r); }
    r.items.push(c);
    r.spell[name] = (r.spell[name] || 0) + 1;
  }
  return [...map.values()].map(r => {
    /* The shelf wears the spelling most of its contracts use; on a tie the
       one written with capitals ("Naivas Supermarkets" over "naivas
       supermarkets"), then the first in the alphabet — never the order the
       list happened to arrive in. */
    r.name = Object.keys(r.spell).sort((a, b) => (r.spell[b] - r.spell[a])
      || ((b !== b.toLowerCase()) - (a !== a.toLowerCase())) || a.localeCompare(b))[0];
    delete r.spell;
    const active = r.items.filter(c => cuBucket(c) === 'active');
    const expired = r.items.filter(c => cuBucket(c) === 'expired');
    const streams = [...new Set(r.items.map(c => c.folder).filter(f => f && cuStreamName(f)))];
    return Object.assign(r, { active, expired, streams, next: cuNextEnd(r.items), waiting: r.items.filter(cuWaitingOnYou).length });
  }).sort((a, b) => a.name.localeCompare(b.name, (typeof langLocale === 'function') ? langLocale() : undefined, { sensitivity: 'base' }));
}
function cuCustomerOf(key){ return cuCustomers().find(r => r.key === key) || null; }
/* The rail's number: how many customers. */
function cuDoorCount(){ return cuCustomers().length; }

/* ---- WHAT THE FILTERS LEAVE ---- */
function cuFilterItems(items){
  return (items || []).filter(c =>
    (_cu.status === 'all' || cuBucket(c) === (_cu.status === 'live' ? 'active' : 'expired'))
    && (_cu.stream === 'all' || String(c.folder) === String(_cu.stream))
    && (_cu.owner === 'all' || ((typeof contractOwnerName === 'function' && contractOwnerName(c)) || '') === _cu.owner));
}
function cuFiltersOn(){ return _cu.stream !== 'all' || _cu.owner !== 'all' || _cu.status !== 'all'; }
/* ONE CUSTOMER AS THE PAGE SHOWS IT, filters applied — the row, its sub-line,
   the side panel and the doors read this, so they never disagree (owner's
   screenshot, 10 Oct 2026: Owner on, the row said 3 and its sub-line 21). */
function cuView(r){
  if (!r) return null;
  const items = cuFiltersOn() ? cuFilterItems(r.items) : r.items;
  const active = items.filter(c => cuBucket(c) === 'active'), expired = items.filter(c => cuBucket(c) === 'expired');
  const streams = [...new Set(items.map(c => c.folder).filter(f => f && cuStreamName(f)))];
  return { key: r.key, name: r.name, items, active, expired, streams, next: cuNextEnd(items), waiting: items.filter(cuWaitingOnYou).length, needs: cuNeedsOf(items) };
}
/* ---- WHAT WAITS ON YOU AT THIS PARTY, IN WORDS (round 19, owner picked
   "The SAP way", 17 Oct 2026) ----
   The checklist's own items (needsYouOf, said by insNeedWords — the panel
   beside every list reads the same) over the party's contracts, then any
   negotiation whose move is ours that the checklist does not already name.
   Urgent first. The column says the first and how many more; the panel lists
   them, each with its own door (needsYouGo). */
function cuNeedsOf(items){
  const out = [];
  (items || []).forEach(c => {
    let xs = [];
    try { xs = (typeof needsYouOf === 'function') ? (needsYouOf(c) || []) : []; } catch (_) { xs = []; }
    const verb = (typeof INS_NEED_VERB !== 'undefined') ? INS_NEED_VERB : null;
    xs.filter(it => it && (!verb || verb[it.kind])).forEach(it => out.push({ c, it }));
    if (cuWaitingOnYou(c) && !xs.some(it => it && (it.kind === 'quiet' || it.kind === 'review'))) out.push({ c, it: { kind: 'move' } });
  });
  return out.sort((a, b) => (b.it.urgent ? 1 : 0) - (a.it.urgent ? 1 : 0));
}
function cuNeedTitle(x){
  if (!x) return '';
  if (x.it.kind === 'move') return i18t('cu_need_move');
  try { return (typeof insNeedWords === 'function') ? String(insNeedWords(x.c, x.it).title || '') : ''; } catch (_) { return ''; }
}
function cuNeedsSay(list){
  if (!list || !list.length) return '';
  const t = cuNeedTitle(list[0]);
  return list.length > 1 ? i18t('cu_need_more', { t, n: list.length - 1 }) : t;
}
function cuNeedGo(kind, id){
  if (kind === 'move'){ if (typeof openRedlineWorkbench === 'function') openRedlineWorkbench(id); return; }
  if (typeof needsYouGo === 'function') needsYouGo(kind, id);
}
/* The ids a door carries: the customer's agreements as counted, and every
   amendment under them, so the Contracts page draws each under its agreement. */
function cuIdsOf(v){
  const ids = new Set((v && v.items || []).map(c => c.id));
  const all = (typeof state !== 'undefined' && Array.isArray(state.contracts)) ? state.contracts : [];
  all.forEach(c => { if (c && c.parentId && ids.has(c.parentId)) ids.add(c.id); });
  return [...ids];
}

/* ---- DO WE HAVE AN NDA WITH THEM? (owner picked "NDA column — the SAP
   way", 17 Oct 2026; piece 4b of the sensitive contracts plan) ----
   ONE READING PER PARTY, off the two facts a person confirmed on each NDA
   (c.nda, piece 4 — ndaClean) and whether it is signed. The wording's own
   reading (ndaOf's read) is never used here: an NDA nobody confirmed says
   "Not confirmed", never a guess. Every NDA of the party counts whatever the
   Stream and Owner filters hold (it is the company's cover, not this view's)
   and an archived one too (a shelved NDA still binds); only NDAs the reader
   may open are in the list at all (the server's stream wall — a private
   stream's NDA is not even hinted at). The best cover wins: in force (for
   good, else the latest day), then signed but not confirmed, then not
   signed yet, then ended (the latest), then none. Nothing here writes. */
const CU_NDA_RANK = { inforce: 5, unconfirmed: 4, draft: 3, ended: 2, none: 1 };
const CU_NDA_TONE = { inforce: 'green', unconfirmed: 'amber', draft: '', ended: '' };
function cuNdaOne(c, today){
  const n = (typeof ndaClean === 'function') ? ndaClean(c && c.nda) : null;
  const base = { c, dir: (n && n.dir) || '', ends: (n && n.ends) || '', forGood: !!(n && n.forGood) };
  if (!c || c.status !== 'Signed') return Object.assign(base, { state: 'draft' });
  if (!n || (!n.forGood && !n.ends)) return Object.assign(base, { state: 'unconfirmed' });
  if (n.forGood || n.ends >= today) return Object.assign(base, { state: 'inforce' });
  return Object.assign(base, { state: 'ended' });
}
function cuNdaBetter(a, b){
  if (!b) return true;
  if (CU_NDA_RANK[a.state] !== CU_NDA_RANK[b.state]) return CU_NDA_RANK[a.state] > CU_NDA_RANK[b.state];
  if (a.forGood !== b.forGood) return a.forGood;
  return String(a.ends) > String(b.ends);
}
/* key → { state, c, dir, ends, forGood, n } — the book walked once per paint */
function cuNdaMap(){
  const all = (typeof state !== 'undefined' && Array.isArray(state.contracts)) ? state.contracts : [];
  const today = (typeof todayISO === 'function') ? todayISO() : new Date().toISOString().slice(0, 10);
  const map = new Map();
  if (typeof ndaIs !== 'function') return map;
  for (const c of all){
    if (!c || c.parentId || !cuNameOf(c) || !ndaIs(c)) continue;
    const key = cuKeyOf(cuNameOf(c)), one = cuNdaOne(c, today), was = map.get(key);
    const n = (was ? was.n : 0) + 1;
    map.set(key, Object.assign(cuNdaBetter(one, was) ? one : was, { n }));
  }
  return map;
}
function cuNdaOf(key, map){ return (map || cuNdaMap()).get(key) || { state: 'none', n: 0 }; }
/* what the filter keeps: "None in force" is every party with no cover today */
function cuNdaWants(st, want){
  if (want === 'all') return true;
  if (want === 'none') return st === 'none' || st === 'ended' || st === 'draft';
  return st === want;
}
function cuNdaMonth(iso){
  try { return new Date(iso + 'T00:00:00Z').toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (_){ return iso; }
}
/* the column's words: "Mutual · to Jul 2030", "Not confirmed", "Ended Mar 2026" */
function cuNdaShort(x){
  if (!x || x.state === 'none') return i18t('cu_nda_none');
  if (x.state === 'inforce'){
    const way = x.dir === 'mutual' ? i18t('cu_nda_mutual') : (x.dir ? i18t('cu_nda_oneway') : i18t('cu_nda_word'));
    return way + ' · ' + (x.forGood ? i18t('nda_for_good_lc') : i18t('cu_nda_to', { d: cuNdaMonth(x.ends) }));
  }
  if (x.state === 'ended') return i18t('cu_nda_ended', { d: cuNdaMonth(x.ends) });
  return i18t(x.state === 'unconfirmed' ? 'cu_nda_unconfirmed' : 'cu_nda_draft');
}
/* drawn in two lines like the party beside it (the pill, then until when), so
   the column costs the row no height and the party's name keeps its room */
function cuNdaCellHtml(x){
  if (!x || x.state === 'none') return `<span class="cu-nda-none">${_cuE(cuNdaShort(x))}</span>`;
  const tone = CU_NDA_TONE[x.state];
  const word = x.state === 'inforce' ? (x.dir === 'mutual' ? i18t('cu_nda_mutual') : (x.dir ? i18t('cu_nda_oneway') : i18t('cu_nda_word')))
    : i18t(x.state === 'ended' ? 'cu_nda_ended_w' : x.state === 'unconfirmed' ? 'cu_nda_unconfirmed' : 'cu_nda_draft');
  const sub = x.state === 'inforce' ? (x.forGood ? i18t('nda_for_good_lc') : i18t('cu_nda_to', { d: cuNdaMonth(x.ends) }))
    : x.state === 'ended' ? cuNdaMonth(x.ends) : '';
  return `<span class="reg-stg ins-pill cu-nda${tone ? ' is-' + tone : ''}" data-cu-nda-st="${_cuE(x.state)}" title="${_cuE(cuNdaShort(x))}"><i aria-hidden="true"></i>${_cuE(word)}</span>${
    sub ? `<span class="cu-nda-sub">${_cuE(sub)}</span>` : ''}`;
}
/* the panel's line: the whole sentence, and the door to the NDA itself */
function cuNdaLong(x){
  if (!x || x.state === 'none') return i18t('cu_nda_none');
  const day = iso => (typeof regDotDate === 'function') ? regDotDate(iso) : iso;
  if (x.state === 'inforce'){
    const until = x.forGood ? i18t('nda_for_good_lc') : i18t('nda_until', { d: day(x.ends) });
    const way = x.dir && typeof ndaDirWords === 'function' ? ndaDirWords(x.dir) : '';
    return way ? i18t('cu_nda_long', { way, until }) : i18t('cu_nda_long_nodir', { until });
  }
  if (x.state === 'ended') return i18t('cu_nda_ended', { d: day(x.ends) });
  return i18t(x.state === 'unconfirmed' ? 'cu_nda_unconfirmed_long' : 'cu_nda_draft_long');
}
function cuNdaFactHtml(x){
  if (!x || x.state === 'none') return _cuE(i18t('cu_nda_none'));
  const more = x.n > 1 ? ` <span class="sub">· ${_cuE(i18t('cu_nda_n', { n: x.n }))}</span>` : '';
  const go = x.c ? ` <button type="button" class="cu-nda-go" data-cu-nda="${_cuE(x.c.id)}">${_cuE(i18t('cu_nda_open'))} ›</button>` : '';
  return `<span${x.state === 'unconfirmed' ? ' class="sub is-amber"' : ''}>${_cuE(cuNdaLong(x))}</span>${more}${go}`;
}
/* the door: the NDA's own life line on the Board, where its Secret until
   tile is confirmed (hbStripBring, the strip's one door); where the strip
   cannot come up, the contract opens as every list opens one */
function cuOpenNda(id){
  if (!id) return;
  if (typeof hbStripBring === 'function' && hbStripBring(id)) return;
  if (typeof regOpenContract === 'function') regOpenContract(id);
}
if (typeof document !== 'undefined') document.addEventListener('click', e => {
  const b = e.target && e.target.closest && e.target.closest('[data-cu-nda]');
  if (b) cuOpenNda(b.getAttribute('data-cu-nda'));
});

/* ---- THE PLACE A REFRESH PUTS BACK ---- the list's own find and filters; a
   customer kept by an older refresh ("cust") is ignored and lands on the list. */
function cuPlace(){ return { stream: _cu.stream, owner: _cu.owner, nda: _cu.nda, status: _cu.status, q: _cu.q }; }
function cuPlacePut(p){
  if (!p || typeof p !== 'object') return;
  _cu.stream = p.stream ? String(p.stream) : 'all';
  _cu.owner = p.owner ? String(p.owner) : 'all';
  _cu.nda = ['inforce', 'unconfirmed', 'none'].includes(p.nda) ? p.nda : 'all';
  _cu.status = ['live', 'ended'].includes(p.status) ? p.status : 'all';
  _cu.q = p.q ? String(p.q) : '';
}

/* ---- THE DOORS ---- */
/* OPEN PARTY = HOME'S CONTRACTS PLACE, NARROWED TO THIS PARTY (the overnight
   work order, steps 2 and 7; owner's "Go", 14 Oct 2026): the ids this row
   counted (cuIdsOf: its filters held, amendments with their agreement, a
   closed one kept), through the register's one door (regShowOnly), which
   lands on Home's Document face with no paper chosen — the place's own set
   chip names the party and is the way out, on the Wall and the List alike.
   The phone keeps its Contracts screen, its chip saying the count. */
function cuOpenCustomer(key){
  const v = cuView(cuCustomerOf(key));
  if (!v || !v.items.length) return;
  const phone = typeof window !== 'undefined' && ((window.mPhone && mPhone()) || (window.innerWidth && window.innerWidth < 768));
  if (typeof regShowOnly === 'function') regShowOnly(cuIdsOf(v), phone ? `${v.name} · ${v.items.length}` : v.name, { party: true });
}
function cuDraftFor(name){
  if (typeof openNewAgreement === 'function') openNewAgreement({ prefill: { counterparty: name } });
  else if (typeof openNewDoors === 'function') openNewDoors();
}
/* OPEN ON EXPLORER = Home's map narrowed to this customer (Explorer's own
   lens) in two groups, Active and Expired (its own custom grouping, filled
   from cuBucket — the one reading). The recipe before is kept, so the map's
   Undo brings it back; a group with nothing in it is simply not drawn.
   Nothing is asked of Copilot and nothing is written. */
function cuOpenExplorer(key){
  const v = cuView(cuCustomerOf(key));
  if (!v || !v.items.length || !window.intel || typeof addLens !== 'function') return;
  const ids = cuIdsOf(v), groups = {};
  ids.forEach(id => {
    const c = (typeof getContract === 'function') ? getContract(id) : null;
    const lead = c && c.parentId && (typeof getContract === 'function') ? (getContract(c.parentId) || c) : c;
    groups[id] = i18t(cuBucket(lead) === 'expired' ? 'cu_tab_expired' : 'cu_tab_active');
  });
  try { if (typeof igRecipePush === 'function') igRecipePush(); } catch (_) {}
  intel.lenses = (intel.lenses || []).filter(l => l.action !== 'filter' || l.hb);
  addLens({ label: v.name, ids, action: 'filter' });
  /* the grouping says what it is — not "Jambo grouping": no model was asked */
  Object.defineProperty(groups, '_name', { value: i18t('cu_group_word'), enumerable: false });
  intel.groupBy = 'custom'; intel.groups = groups;
  if (typeof hbOpenExplorer === 'function') hbOpenExplorer(); else if (typeof setView === 'function') setView('dashboard');
}

/* ---- PIECES ---- */
const _cuE = s => (typeof esc === 'function') ? esc(s) : String(s == null ? '' : s);
function cuAvHtml(name){ return (typeof window.regAvatarHtml === 'function') ? window.regAvatarHtml(name || '—') : ''; }
function cuStripeHtml(id){
  const col = (typeof folderColor === 'function') ? folderColor(id) : 'var(--color-divider)';
  return `<span class="cu-stripe" style="background:${col}" aria-hidden="true"></span>`;
}
/* One filter box in the register's own markup (its selFilter): the word, the
   value it holds, and an invisible <select> across it — so the band's clothes
   ("Stream: All streams") and HaTi's own list (selectMenuSweep) dress it. */
function cuChip(o){
  const on = String(o.cur) !== String(o.def);
  const pick = ((o.opts || []).find(x => String(x[0]) === String(o.cur)) || [])[1] || '';
  return `<label class="reg-f reg-chip${on ? ' on' : ''}" title="${_cuE(o.title || o.label)}"><span class="reg-f-l">${_cuE(o.label)}</span><span class="reg-f-v">${_cuE(pick)}</span><select class="reg-chip-sel" ${o.attr}="${_cuE(o.key)}" title="${_cuE(o.title || o.label)}">${
    (o.opts || []).map(([v, l]) => `<option value="${_cuE(v)}"${String(v) === String(o.cur) ? ' selected' : ''}>${_cuE(l)}</option>`).join('')}</select></label>`;
}
function cuFilterBarHtml(items, ndaCounts){
  const streams = [...new Set((items || []).map(c => c.folder).filter(f => f && cuStreamName(f)))]
    .sort((a, b) => cuStreamName(a).localeCompare(cuStreamName(b)));
  const owners = [...new Set((items || []).map(c => (typeof contractOwnerName === 'function' && contractOwnerName(c)) || '').filter(Boolean))].sort();
  return `<div class="reg-filterbar reg-fb">
    <label class="cu-find"><span class="sr-only">${_cuE(i18t('cu_find'))}</span><input id="cu-q" type="search" autocomplete="off" placeholder="${_cuE(i18t('cu_find_ph'))}" value="${_cuE(_cu.q)}"></label>
    ${cuChip({ label: i18t('cu_status'), attr: 'data-cu-f', key: 'status', cur: _cu.status, def: 'all',
      opts: [['all', i18t('cu_status_all')], ...['live', 'ended'].filter(k => (items || []).some(c => cuBucket(c) === (k === 'live' ? 'active' : 'expired')) || _cu.status === k).map(k => [k, i18t('cu_status_' + k)])] })}
    ${cuChip({ label: i18t('reg_chip_stream'), title: i18t('reg_value_stream'), attr: 'data-cu-f', key: 'stream', cur: _cu.stream, def: 'all',
      opts: [['all', i18t('cu_all_streams')], ...streams.map(f => [f, cuStreamName(f)])] })}
    ${cuChip({ label: i18t('cu_owner'), attr: 'data-cu-f', key: 'owner', cur: _cu.owner, def: 'all',
      opts: [['all', i18t('cu_anyone')], ...owners.map(o => [o, o])] })}
    ${ndaCounts ? cuChip({ label: i18t('cu_col_nda'), title: i18t('cu_nda_filter_title'), attr: 'data-cu-f', key: 'nda', cur: _cu.nda, def: 'all',
      opts: [['all', i18t('cu_nda_any')], ...['inforce', 'unconfirmed', 'none'].filter(k => ndaCounts[k] || _cu.nda === k).map(k => [k, i18t('cu_nda_f_' + k)])] }) : ''}
  </div>`;
}
function cuCardHtml(title, n, table, foot){
  const nn = Number(n || 0).toLocaleString((typeof jxLocale === 'function') ? jxLocale() : undefined);
  return `<section class="ap-card cu-card">
    <div class="ap-card-h"><h2 class="ap-card-t">${_cuE(title)} <span class="ap-card-n">(${nn})</span></h2></div>
    <div class="cu-scroll">${table}</div>
    ${foot ? `<div class="ap-foot cu-foot">${foot}</div>` : ''}
  </section>`;
}
function cuPartFoot(){
  const w = cuWhole();
  return w.whole ? '' : `<span>${_cuE(i18t('cu_part_book', { have: w.have, total: w.total }))}</span>`;
}

/* ---- THE STYLE: the Approvals page's card and table (one look for every
   inspector list), plus the shelf's own few rules ---- */
const CU_CSS = `
  .cu-page{height:var(--view-h);box-sizing:border-box;}
  .cu-page .sap-band{padding-top:var(--page-pad-t);display:flex;flex-direction:column;gap:var(--s-2);}
  .cu-head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--s-3);flex-wrap:wrap;}
  .cu-t{margin:0;font-family:var(--font-heading);font-size:20px;font-weight:var(--w-title);letter-spacing:-.01em;line-height:1.2;color:var(--color-text);}
  .cu-acts{display:flex;align-items:center;gap:var(--s-2);flex:none;min-height:var(--ctl-h);}
  .cu-page .reg-tabbar.cu-notabs > .reg-fb{margin-left:0;}
  .cu-find input{height:var(--ctl-h);min-width:200px;padding:0 var(--s-2);border:1px solid var(--btn-edge);border-radius:var(--radius);
    background:var(--color-surface);color:var(--color-text);font:inherit;font-size:var(--t-body);}
  .cu-find input:focus{outline:0;border-color:var(--color-accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--color-accent) 25%,transparent);}
  .cu-body{flex:1;min-height:0;}
  .cu-card{display:flex;flex-direction:column;min-height:0;}
  .cu-page.is-ins .cu-card{overflow:hidden;}
  .cu-scroll{flex:1;min-height:0;overflow:auto;}
  .cu-table td.n,.cu-table th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;}
  .cu-table td.quiet{color:var(--color-neutral-500);}
  .cu-table td.amber{color:var(--st-amber-fg);font-weight:var(--w-strong);}
  .cu-table tbody tr[data-cu-cust]:focus{outline:none;}
  .cu-table tbody tr.is-sel td{background:color-mix(in srgb,var(--color-accent) 8%,transparent);}
  .cu-table tbody tr.is-sel td:first-child{box-shadow:inset 2px 0 0 var(--accent-solid);}
  .cu-stripe{display:inline-block;width:4px;height:12px;border-radius:2px;vertical-align:-1px;margin-right:7px;}
  .cu-panel-streams{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 12px;font-size:var(--t-body);}
  .cu-panel-streams .n{font-variant-numeric:tabular-nums;color:var(--color-neutral-600);}
  /* the inspector table's own rule (.ap-table.ap-ins :is(td,th)) keeps every
     cell on one line; on this list the heads may wrap, and the cells sit 2px
     closer — the same scope, later in the source, so no !important */
  .ap-table.cu-table th{white-space:normal;text-overflow:clip;vertical-align:bottom;line-height:1.3;}
  .ap-table.cu-table :is(td,th){padding-left:12px;padding-right:12px;}
  .cu-table td.cu-nda-td{white-space:nowrap;overflow:hidden;}
  .cu-nda-sub{display:block;margin-top:2px;font-size:var(--t-meta);color:var(--color-neutral-500);overflow:hidden;text-overflow:ellipsis;}
  .cu-table .cu-nda{font-weight:var(--w-label);}
  .cu-nda-none{color:var(--color-neutral-500);}
  .cu-nda-go{border:0;background:none;padding:0 0 0 4px;font:inherit;font-weight:var(--w-label);color:var(--color-accent);cursor:pointer;white-space:nowrap;}
  .cu-nda-go:hover{text-decoration:underline;}
  .cu-table td.cu-wait{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cu-table td.ruby{color:var(--st-ruby-fg);font-weight:var(--w-strong);}
  .cu-list{display:flex;flex-direction:column;gap:6px;}
  .cu-li{display:flex;align-items:center;gap:var(--s-2);padding:8px 10px;border:1px solid var(--color-divider);border-radius:var(--radius-lg);background:var(--color-surface);text-align:left;font:inherit;color:inherit;width:100%;box-sizing:border-box;}
  button.cu-li{cursor:pointer;} button.cu-li:hover{border-color:var(--btn-edge);background:var(--surface-2);}
  .cu-li-b{display:flex;flex-direction:column;min-width:0;flex:1;}
  .cu-li-b b{font-weight:var(--w-strong);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cu-li-b span{font-size:var(--t-meta);color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cu-li.is-late .cu-li-b b{color:var(--st-ruby-fg);}
  .cu-ag-st{flex:none;font-size:var(--t-meta);color:var(--color-neutral-600);}
`;

/* ---- THE CUSTOMERS PAGE ---- */
function cuListHtml(INS){
  const book = cuBook();
  const all = cuCustomers(book);
  const q = cuKeyOf(_cu.q);
  const ndas = cuNdaMap();
  const ndaCounts = { inforce: 0, unconfirmed: 0, none: 0 };
  all.forEach(r => { const st = cuNdaOf(r.key, ndas).state; ['inforce', 'unconfirmed', 'none'].forEach(k => { if (cuNdaWants(st, k)) ndaCounts[k]++; }); });
  const rows = all.filter(r => !q || r.key.includes(q))
    .filter(r => !cuFiltersOn() || cuFilterItems(r.items).length)
    .filter(r => cuNdaWants(cuNdaOf(r.key, ndas).state, _cu.nda));
  const money = cuMoney();
  const activeAll = book.filter(c => cuBucket(c) === 'active');
  const facts = [i18tn('cu_n_customers', all.length, { n: all.length })];
  if (money){ const v = cuMoneyWords(activeAll); if (v) facts.push(i18t('cu_active_on_paper', { v })); }
  /* THE NDA COLUMN TAKES ITS ROOM FROM THE HEADS, NOT THE NAMES: the long
     heads wrap onto two lines (as a worklist's do) and the columns fit their
     values, so the party's name keeps the width it had before the column came */
  const head = [{ t: i18t('cu_col_customer') }, { t: i18t('cu_col_active'), r: 1, w: 62 }, { t: i18t('cu_col_expired'), r: 1, w: 78 },
    ...(money ? [{ t: i18t('cu_col_on_paper'), r: 1, w: 92 }] : []), { t: i18t('cu_col_next_end'), w: 104 }, { t: i18t('cu_col_waiting'), w: 168 }, { t: i18t('cu_col_nda'), w: 124 }];
  const body = rows.map(r => {
    const v = cuView(r), act = v.active, exp = v.expired, next = v.next;
    const ws = cuNeedsSay(v.needs), wAll = v.needs.map(cuNeedTitle).join(' · '), wLate = v.needs.some(x => x.it.urgent);
    const ov = money ? cuMoneyWords(act) : '';
    return `<tr data-cu-cust="${_cuE(r.key)}" tabindex="-1">
      <td><div class="ap-id">${cuAvHtml(r.name)}<div><span class="ap-name">${_cuE(r.name)}</span><span class="ap-sub">${
        _cuE(i18tn('cu_n_contracts', v.items.length, { n: v.items.length }))} · ${_cuE(i18tn('cu_n_streams', v.streams.length, { n: v.streams.length }))}</span></div></div></td>
      <td class="n">${act.length}</td>
      <td class="n${exp.length ? '' : ' quiet'}">${exp.length || '—'}</td>
      ${money ? `<td class="n${ov ? '' : ' quiet'}">${_cuE(ov || '—')}</td>` : ''}
      <td class="${next ? '' : 'quiet'}">${_cuE(next ? cuDay(next) : '—')}</td>
      <td class="cu-wait${ws ? (wLate ? ' ruby' : ' amber') : ' quiet'}"${ws ? ` title="${_cuE(wAll)}"` : ''}>${_cuE(ws || '—')}</td>
      <td class="cu-nda-td">${cuNdaCellHtml(cuNdaOf(r.key, ndas))}</td>
    </tr>`;
  }).join('');
  const table = rows.length
    ? `<table class="ap-table ap-ins cu-table"><colgroup>${head.map(h => `<col${h.w ? ` style="width:${h.w}px"` : ''}>`).join('')}</colgroup><thead><tr>${
      head.map(h => `<th${h.r ? ' class="n"' : ''}>${_cuE(h.t)}</th>`).join('')}</tr></thead><tbody id="cu-tbody">${body}</tbody></table>`
    : `<div class="ap-empty">${_cuE(all.length ? i18t('cu_none_match') : i18t('cu_none_yet'))}</div>`;
  const foot = [`<span>${_cuE(i18t('cu_shown_of', { n: rows.length, total: all.length }))}</span>`, cuPartFoot()].filter(Boolean).join('');
  return `<div class="sap-band">
      <div class="cu-head">
        <div style="min-width:0"><h1 class="cu-t">${_cuE(i18t('nav_customers'))}</h1><div class="page-facts">${facts.map(_cuE).join(' · ')}</div></div>
        <div class="cu-acts"><button type="button" class="hm-primary" data-cu-draft="">${(typeof icon === 'function') ? icon('plus', 'w-3.5 h-3.5', 2) : ''} ${_cuE(i18t('home_draft_new'))}</button></div>
      </div>
      <div class="reg-tabbar cu-notabs">${cuFilterBarHtml(book, ndaCounts)}</div>
    </div>
    ${INS ? `<div class="ap-body is-ins cu-body">${cuCardHtml(i18t('nav_customers'), rows.length, table, foot)}<aside id="ins-panel" class="ins-panel" aria-label="${_cuE(i18t('ins_panel_label'))}"></aside></div>`
      : `<div class="cu-body">${cuCardHtml(i18t('nav_customers'), rows.length, table, foot)}</div>`}`;
}

/* ---- THE PANELS ---- */
function cuPaintCustomerPanel(tb){
  const seat = 'customers';
  const idOf = r => r.getAttribute('data-cu-cust');
  const id = insPick(seat, [...tb.querySelectorAll('[data-cu-cust]')].map(idOf));
  insMarkRow(tb, '[data-cu-cust]', idOf, id);
  const money = cuMoney();
  const paint = key => {
    const r = key ? cuView(cuCustomerOf(key)) : null;
    if (!r){ insPaintPanel({ seat, c: null, item: null, empty: i18t('cu_panel_none'), jlHome: i18t('nav_customers'), jlPh: i18t('jl_ph_any') }); return; }
    const count = list => { const v = money ? cuMoneyWords(list) : ''; return list.length ? `${list.length}${v ? ' · ' + v : ''}` : '0'; };
    const facts = [
      { k: 'active', label: i18t('cu_tab_active'), v: _cuE(count(r.active)) },
      { k: 'expired', label: i18t('cu_tab_expired'), v: _cuE(count(r.expired)) },
      { k: 'next', label: i18t('cu_col_next_end'), v: r.next ? _cuE(cuDay(r.next)) : '' },
      /* across the panel and allowed to wrap: a 380px panel cut "Your
         approval is asked f…" (round 19 draws it whole) */
      { k: 'waiting', label: i18t('cu_col_waiting'), v: _cuE(cuNeedsSay(r.needs)), wide: true },
      { k: 'nda', label: i18t('cu_col_nda'), v: cuNdaFactHtml(cuNdaOf(key)), wide: true },
    ];
    const streams = r.streams.map(f => `<span>${cuStripeHtml(f)}${_cuE(cuStreamName(f))}</span><span class="n">${r.items.filter(c => c.folder === f).length}</span>`).join('');
    /* Jambo's panel (round 19): it holds a party */
    insPaintPanel({ seat, jlWord: i18t('jl_w_party'), jlHome: i18t('nav_customers'), jlPh: i18t('jl_ph_any'), item: { id: r.key }, head: {
        eyebrow: _cuE(i18tn('cu_n_contracts', r.items.length, { n: r.items.length })) + ' · ' + _cuE(i18tn('cu_n_streams', r.streams.length, { n: r.streams.length })),
        title: r.name,
        acts: [{ k: 'open', kind: 'accent', label: i18t('cu_open_customer'), iconEnd: 'chevR', run: x => cuOpenCustomer(x.id) },
          { k: 'explorer', label: i18t('cu_open_explorer'), run: x => cuOpenExplorer(x.id) },
          /* THE PEOPLE AT THIS PARTY are the Directory's (13 Oct 2026): one
             door onto it, already narrowed to the party, and the number on
             the door is the rows it lands on. Not drawn when nobody is named. */
          ...((() => { const n = (typeof dirPeopleOfParty === 'function') ? dirPeopleOfParty(r.key).length : 0;
            return n ? [{ k: 'people', label: i18t('cu_people_door', { n }), run: x => { if (typeof dirOpenParty === 'function') dirOpenParty(x.id); } }] : []; })())] },
      body: (typeof insKvHtml === 'function' ? insKvHtml(facts) : '')
        + (r.needs.length && typeof insSecHtml === 'function' ? insSecHtml(i18t('cu_col_waiting'), r.needs.length, cuPanelNeedsHtml(r.needs), 'cu-needs') : '')
        + (r.items.length && typeof insSecHtml === 'function' ? insSecHtml(i18t('cu_panel_agreements'), r.items.length, cuPanelAgreementsHtml(r.items), 'cu-ags') : '')
        + (streams && typeof insSecHtml === 'function' ? insSecHtml(i18t('cu_panel_streams'), r.streams.length, `<div class="cu-panel-streams">${streams}</div>`) : '') });
  };
  paint(id);
  insListWire(tb, { rowSel: '[data-cu-cust]', idOf,
    onSelect: key => { insSelect(seat, key); insMarkRow(tb, '[data-cu-cust]', idOf, key); paint(key); },
    onOpen: key => cuOpenCustomer(key) });
}

/* THE PANEL'S TWO LISTS (round 19): what waits on you here, each with its
   own door; and the party's agreements, each a door onto its paper */
/* A ROW READS WHOLE IN JAMBO'S PANEL (round 19 as drawn: "Answer 2 redlines
   · Master services agreement · waiting 4 days · Open redlines"): the button
   is a short door word — the page it opens — and the long sentence of where
   it lands rides its hover; the line under the title is the agreement and the
   need's own line (its wait), so a 380px panel cuts neither the title nor
   the button. */
const CU_NEED_DOOR = { quiet: 'cu_need_go_move', review: 'cu_need_go_move', suggest: 'cu_need_go_move', join: 'cu_need_go_move', move: 'cu_need_go_move',
  approval: 'jl_open_approval', refused: 'jl_open_signing', sign: 'jl_open_signing', look: 'jl_open_review', details: 'det_need_verb', note: 'cu_need_go_note', renewal: 'home_verb_decide' };
const CU_NEED_LINE = new Set(['quiet', 'look', 'review', 'note', 'renewal', 'refused', 'join']);
function cuPanelNeedsHtml(list){
  return `<div class="cu-list">${list.map(x => {
    const t = cuNeedTitle(x), ref = (typeof contractRef === 'function') ? contractRef(x.c) : x.c.id;
    const go = x.it.kind === 'move' ? i18t('cu_need_go_move') : i18t((typeof INS_NEED_GO !== 'undefined' && INS_NEED_GO[x.it.kind]) || 'ins_need_go_nego');
    /* the line says when, where the need has a when: its wait, a due day, the
       note it quotes; a need without one ("approval", "details") says only
       its agreement — never the landing sentence, which is the hover's */
    let line = '';
    try {
      if (x.it.kind === 'move'){ const w = (typeof regNegoCols === 'function') ? regNegoCols(x.c).waiting : ''; if (w && w !== '\u2014') line = i18t('ins_need_waiting', { days: w }); }
      else if (CU_NEED_LINE.has(x.it.kind) && typeof insNeedWords === 'function') line = String(insNeedWords(x.c, x.it).plain || '');
    } catch (_){ line = ''; }
    const sub = [x.c.name || ref, line].filter(Boolean).join(' · ');
    return `<div class="cu-li${x.it.urgent ? ' is-late' : ''}"><div class="cu-li-b"><b title="${_cuE(t)}">${_cuE(t)}</b><span title="${_cuE([sub, ref].join(' · '))}">${_cuE(sub)}</span></div>
      <button type="button" class="ui-btn ui-btn-sm" data-cu-need="${_cuE(x.it.kind)}" data-cu-id="${_cuE(x.c.id)}" title="${_cuE(go)}">${_cuE(i18t(CU_NEED_DOOR[x.it.kind] || 'cu_need_go_move'))}</button></div>`; }).join('')}</div>`;
}
function cuPanelAgreementsHtml(items){
  return `<div class="cu-list">${items.slice().sort((a, b) => String(cuEnds(b) || '').localeCompare(String(cuEnds(a) || ''))).map(c => {
    const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
    const stage = (typeof statusLabel === 'function' && c.status) ? statusLabel(c.status) : (c.status || '');
    return `<button type="button" class="cu-li cu-ag" data-cu-ag="${_cuE(c.id)}"><span class="cu-li-b"><b>${_cuE(c.name || ref)}</b><span>${_cuE([ref, cuBucket(c) === 'expired' ? i18t('cu_status_ended') : ''].filter(Boolean).join(' · '))}</span></span><span class="cu-ag-st">${_cuE(stage)}</span></button>`; }).join('')}</div>`;
}
/* the panel's rows are delegated once, on the document */
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('click', e => {
  const t = e.target && e.target.closest ? e.target : null; if (!t) return;
  const n = t.closest('[data-cu-need]'); if (n){ cuNeedGo(n.getAttribute('data-cu-need'), n.getAttribute('data-cu-id')); return; }
  const a = t.closest('[data-cu-ag]'); if (a && typeof regOpenContract === 'function') regOpenContract(a.getAttribute('data-cu-ag'));
});

/* ---- THE PAGE ---- */
function renderCustomers(){
  const host = document.getElementById('content'); if (!host) return;
  const INS = (typeof insFits === 'function') && insFits() && typeof insPaintPanel === 'function';
  const keep = (() => { const sc = document.querySelector('.cu-scroll'); return sc ? sc.scrollTop : 0; })();
  const typing = document.activeElement && document.activeElement.id === 'cu-q';
  host.innerHTML = `<style>${CU_CSS}</style>
  <div class="view-enter sap-page ap-page cu-page${INS ? ' is-ins' : ''}" data-ins-page="customers" data-ins="${INS ? '1' : '0'}" data-cu-screen="list">
    ${cuListHtml(INS)}
  </div>`;
  const sc = host.querySelector('.cu-scroll'); if (sc && keep) sc.scrollTop = keep;
  cuWire(host, INS);
  if (typing){ const q = document.getElementById('cu-q'); if (q){ q.focus(); const n = q.value.length; try { q.setSelectionRange(n, n); } catch (_) {} } }
  if (INS && typeof insWatchWidth === 'function') insWatchWidth();
  if (typeof setActiveNav === 'function') setActiveNav('customers');
}
function cuRepaint(){ if (typeof state !== 'undefined' && state.view === 'customers') renderCustomers(); }
function cuWire(host, INS){
  host.querySelector('[data-cu-draft]')?.addEventListener('click', e => cuDraftFor(e.currentTarget.getAttribute('data-cu-draft') || ''));
  host.querySelectorAll('select[data-cu-f]').forEach(s => s.addEventListener('change', () => {
    const k = s.getAttribute('data-cu-f'); if (!['stream', 'owner', 'nda', 'status'].includes(k)) return;
    _cu[k] = s.value || 'all'; renderCustomers(); if (typeof placeSave === 'function') placeSave(); }));
  const q = host.querySelector('#cu-q');
  if (q) q.addEventListener('input', () => { _cu.q = q.value; renderCustomers(); });
  const tb = host.querySelector('#cu-tbody');
  if (!tb) return;
  if (INS){ cuPaintCustomerPanel(tb); return; }
  /* Narrow window: no panel, so a press opens. */
  tb.addEventListener('click', e => {
    const row = e.target.closest && e.target.closest('[data-cu-cust]');
    if (row) cuOpenCustomer(row.getAttribute('data-cu-cust'));
  });
}

Object.assign(window, { cuNeedsOf, cuNeedTitle, cuNeedsSay, cuNeedGo, cuPanelNeedsHtml, CU_NEED_DOOR, CU_NEED_LINE, cuPanelAgreementsHtml, cuNameOf, cuKeyOf, cuBook, cuBucket, cuCustomers, cuCustomerOf, cuDoorCount, cuNextEnd, cuFilterItems, cuView, cuIdsOf,
  cuNdaMap, cuNdaOf, cuNdaWants, cuNdaShort, cuOpenNda,
  cuPlace, cuPlacePut, cuOpenCustomer, cuOpenExplorer, cuDraftFor, renderCustomers, cuRepaint,
  /* the one filter-box builder the band's clothes dress; the Directory draws its boxes with it too (13 Oct 2026) */
  cuChip });
