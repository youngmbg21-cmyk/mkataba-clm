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
/* THE LIST OPENS ON LIVE PARTIES (round 19 as drawn: "Status · Live", "Parties
   27 · live · sorted by name"): the head still counts every party. `shown` is
   how many rows the list draws (CU_PAGE at a time, "Show more"); `edit` the
   party whose own facts are being typed in the panel. */
const _cu = { stream: 'all', owner: 'all', nda: 'all', status: 'live', q: '', shown: 0, edit: null };
const CU_PAGE = 10;

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
/* Stream and Owner narrow the CONTRACTS a party is counted by (one number
   everywhere: the row, its sub-line, the panel and the doors). Status is the
   PARTY's standing, not a narrowing of its contracts (round 19 as drawn: a
   live party still shows what has ended with it): Live — something still runs
   with them; Ended — everything with them has ended (cuStanding). */
function cuFilterItems(items){
  return (items || []).filter(c =>
    (_cu.stream === 'all' || String(c.folder) === String(_cu.stream))
    && (_cu.owner === 'all' || ((typeof contractOwnerName === 'function' && contractOwnerName(c)) || '') === _cu.owner));
}
function cuFiltersOn(){ return _cu.stream !== 'all' || _cu.owner !== 'all'; }
/* read off the party's contracts alone (the filters held), never its needs:
   the list asks it of every party on every paint */
function cuStanding(r){
  const items = r ? (cuFiltersOn() ? cuFilterItems(r.items) : (r.items || [])) : [];
  return items.some(c => cuBucket(c) === 'active') ? 'live' : 'ended';
}
function cuStatusWants(r){ return _cu.status === 'all' || cuStanding(r) === _cu.status; }
/* ONE CUSTOMER AS THE PAGE SHOWS IT, filters applied — the row, its sub-line,
   the side panel and the doors read this, so they never disagree (owner's
   screenshot, 10 Oct 2026: Owner on, the row said 3 and its sub-line 21). */
function cuView(r){
  if (!r) return null;
  const items = cuFiltersOn() ? cuFilterItems(r.items) : r.items;
  const active = items.filter(c => cuBucket(c) === 'active'), expired = items.filter(c => cuBucket(c) === 'expired');
  const streams = [...new Set(items.map(c => c.folder).filter(f => f && cuStreamName(f)))];
  return { key: r.key, name: r.name, items, active, expired, streams, next: cuNextEnd(items), waiting: items.filter(cuWaitingOnYou).length,
    needs: cuNeedsOf(items).concat(cuRequestsOf(r.key)) };
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
/* A COLLEAGUE'S REQUEST ABOUT THIS PARTY WAITS ON YOU TOO (round 19 as drawn:
   "Sara asked for an NDA" in the column, "Open request" in the panel): the
   Requests page's own list (intakeQueue, already walled to the reader's
   streams by GET /api/intake), the ones that name this party and wait on
   this reader — nobody has picked them up and they did not raise them, or
   they hold them. Only a reader who may draft (the bell's own rule,
   intakeAlertRows). Read, never written. */
function cuRequestsOf(key){
  if (!key || typeof intakeQueue !== 'function' || !(typeof canEdit === 'function' && canEdit())) return [];
  const me = (typeof currentUser === 'function') ? currentUser() : null;
  let L = []; try { L = intakeQueue() || []; } catch (_){ L = []; }
  return L.filter(r => r && cuKeyOf(r.counterparty) === key && (
      (r.assignee && r.assignee.id) ? !!(me && String(r.assignee.id) === String(me.id))
        : (r.status === 'open' && !(me && r.by && String(r.by.id) === String(me.id)))))
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
    .map(r => ({ c: null, r, it: { kind: 'request' } }));
}
/* the requests list is loaded once per sitting, then the page draws again */
let _cuIkAsked = false;
function cuRequestsLoad(){
  if (_cuIkAsked || typeof loadIntake !== 'function' || !(typeof canEdit === 'function' && canEdit())) return;
  const st = (typeof window !== 'undefined') ? window._intakeState : null;
  if (st && st.loaded) return;
  _cuIkAsked = true;
  Promise.resolve().then(loadIntake).then(() => cuRepaint()).catch(() => {});
}
function cuNeedTitle(x){
  if (!x) return '';
  if (x.it.kind === 'request'){
    const who = String((x.r.by && x.r.by.name) || '').trim().split(/\s+/)[0] || i18t('cu_req_someone');
    return i18t('cu_need_request', { who, t: String(x.r.title || '').trim() });
  }
  if (x.it.kind === 'move') return i18t('cu_need_move');
  try { return (typeof insNeedWords === 'function') ? String(insNeedWords(x.c, x.it).title || '') : ''; } catch (_) { return ''; }
}
/* THE COLUMN'S SHORT WORDS (round 19 as drawn: "2 redlines · 4 days", "3
   details to fill", "an approval", "Sara asked for an NDA"): the row already
   names the party, so the column says the work and how long it has waited;
   the panel's rows keep the whole title (cuNeedTitle) */
function cuNeedShort(x){
  if (!x) return '';
  const k = x.it.kind;
  const daysSince = iso => { const d = String(iso || '').slice(0, 10), t = (typeof todayISO === 'function') ? todayISO() : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !t) return ''; const n = Math.max(0, Math.round((Date.parse(t) - Date.parse(d)) / 864e5));
    return n === 0 ? i18t('ins_days_today') : i18tn('ins_days', n, { n }); };
  if (k === 'quiet'){ const w = daysSince(x.it.since); const t = i18tn('cu_need_redlines', x.it.n || 1, { n: x.it.n || 1 }); return w ? `${t} · ${w}` : t; }
  if (k === 'move'){ let w = ''; try { w = (typeof regNegoCols === 'function') ? regNegoCols(x.c).waiting : ''; } catch (_){ w = ''; } return w && w !== '\u2014' ? `${i18t('cu_need_move')} · ${w}` : i18t('cu_need_move'); }
  /* "an approval, for Jonas" where the reader answers for an away colleague
     (When you're away: Approvals' own reading, apForWho) */
  if (k === 'approval'){
    let fw = null; try { fw = (typeof apForWho === 'function') ? apForWho({ type: 'approval', mine: true, done: false, c: x.c }) : null; } catch (_){ fw = null; }
    const who = fw && String(fw.name || '').trim().split(/\s+/)[0];
    return who ? i18t('cu_need_approval_for', { who }) : i18t('cu_need_approval_short');
  }
  return cuNeedTitle(x);
}
function cuNeedsSay(list){
  if (!list || !list.length) return '';
  const t = cuNeedShort(list[0]);
  return list.length > 1 ? i18t('cu_need_more', { t, n: list.length - 1 }) : t;
}
function cuNeedGo(kind, id){
  /* LAND ON IT: the request's own row on Requests, chosen and lit */
  if (kind === 'request'){ if (typeof intakeGoTo === 'function') intakeGoTo(id); if (typeof jlLand === 'function') jlLand('row', id); return; }
  if (kind === 'move'){ if (typeof openRedlineWorkbench === 'function'){ openRedlineWorkbench(id, { face: true }); if (typeof jlLand === 'function') jlLand('redlines'); } return; }
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
  /* round 19 as drawn: "Not signed yet / draft" — the second line says where it stands */
  const sub = x.state === 'inforce' ? (x.forGood ? i18t('nda_for_good_lc') : i18t('cu_nda_to', { d: cuNdaMonth(x.ends) }))
    : x.state === 'ended' ? cuNdaMonth(x.ends) : x.state === 'draft' ? i18t('cu_nda_draft_sub') : '';
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
/* THE PANEL'S NDA ROW AS DRAWN (round 19): "**Both sides (mutual)** · secret
   until 29 Feb 2028 · confirmed by you  Open the NDA ›", and with none, "**None**
   — no NDA with Kettle & Co, signed or in draft". Who confirmed is the NDA's
   own stored fact (c.nda.who, written by the one writer ndaSet). */
function cuNdaFactHtml(x, party){
  if (!x || x.state === 'none') return `<b>${_cuE(i18t('cu_nda_none'))}</b>${party ? ` — ${_cuE(i18t('cu_nda_none_long', { party }))}` : ''}`;
  const more = x.n > 1 ? ` <span class="sub">· ${_cuE(i18t('cu_nda_n', { n: x.n }))}</span>` : '';
  const go = x.c ? ` <button type="button" class="cu-nda-go" data-cu-nda="${_cuE(x.c.id)}">${_cuE(i18t('cu_nda_open'))} ›</button>` : '';
  if (x.state === 'inforce'){
    const day = iso => (typeof regDotDate === 'function') ? regDotDate(iso) : iso;
    const until = x.forGood ? i18t('nda_for_good_lc') : i18t('nda_until', { d: day(x.ends) });
    const way = x.dir && typeof ndaDirWords === 'function' ? ndaDirWords(x.dir) : '';
    const who = String((x.c && x.c.nda && x.c.nda.who) || '').trim();
    const me = (typeof currentUser === 'function') ? currentUser() : null;
    const by = who ? (me && String(me.name || '').trim() === who ? i18t('cu_nda_by_you') : i18t('cu_nda_by', { who })) : '';
    const tail = [i18t(way ? 'cu_nda_secret' : 'cu_nda_secret_cap', { until }), by].filter(Boolean).join(' · ');
    return `${way ? `<b>${_cuE(way)}</b> · ` : ''}${_cuE(tail)}${more}${go}`;
  }
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
  /* a refresh that kept no status lands on the list as it opens: Live */
  _cu.status = ['live', 'ended', 'all'].includes(p.status) ? p.status : 'live';
  _cu.q = p.q ? String(p.q) : '';
  _cu.shown = 0;
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

/* ---- A PARTY'S OWN FACTS: ITS CITY AND ITS ORGANISATION NUMBER (round 19
   as drawn: the City column, "Gothenburg · with us since March 2024",
   "Organisation no.") ----
   ONE HOME: the server's party_records, keyed by the party's name as this
   page keys it (cuKeyOf), handed to this browser in the bootstrap for the
   parties the reader may know of (prRecordsFor — the server is the wall).
   ONE WRITER, partyRecordSet → PUT /api/party-records; ONE DOOR,
   partyRecordOpen, which turns the panel's top into two boxes. A person types
   them. What a contract's parties clause says is OFFERED under the box
   (partyCitySuggest, "Use Kisumu") and fills the box only on that press —
   nothing is saved until Save. On a workspace with no server the facts stay
   in this browser. */
const CU_PR_LS = 'hati.v1.partyRecords';
function cuRecords(){
  if (typeof state === 'undefined' || !state) return {};
  if (!state.partyRecords || typeof state.partyRecords !== 'object'){
    let r = null;
    if (!((typeof API_MODE === 'function') && API_MODE())){ try { r = JSON.parse(localStorage.getItem(CU_PR_LS) || 'null'); } catch (_){ r = null; } }
    state.partyRecords = (r && typeof r === 'object') ? r : {};
  }
  return state.partyRecords;
}
function partyRecordOf(key){ const r = cuRecords()[String(key || '')]; return r && typeof r === 'object' ? r : null; }
function partyCityOf(key){ const r = partyRecordOf(key); return r ? String(r.city || '') : ''; }
function partyOrgNoOf(key){ const r = partyRecordOf(key); return r ? String(r.orgNo || '') : ''; }
function partyRecordMay(){ return !(typeof canEdit === 'function' && !canEdit()); }
async function partyRecordSet(name, facts){
  const key = cuKeyOf(name), f = facts || {};
  const city = String(f.city == null ? '' : f.city).replace(/\s+/g, ' ').trim().slice(0, 80);
  const orgNo = String(f.orgNo == null ? '' : f.orgNo).replace(/\s+/g, ' ').trim().slice(0, 40);
  if (!key || !partyRecordMay()) return null;
  const book = cuRecords();
  let rec = null;
  if ((typeof API_MODE === 'function') && API_MODE()){
    const r = await api('party-records', 'PUT', { name, city, orgNo });
    rec = (r && r.record) || null;
  } else {
    const me = (typeof currentUser === 'function') ? currentUser() : null;
    rec = (city || orgNo) ? { name, city, orgNo, by: (me && me.name) || '', at: new Date().toISOString() } : null;
  }
  if (rec) book[key] = rec; else delete book[key];
  if (!((typeof API_MODE === 'function') && API_MODE())){ try { localStorage.setItem(CU_PR_LS, JSON.stringify(book)); } catch (_){} }
  return rec;
}
/* WHAT A CONTRACT'S PARTIES CLAUSE SAYS OF WHERE THEY ARE — a suggestion,
   never a fact. The address their own parties row carries on a contract, else
   the sentence of the wording that names them ("…Kabras Sugar Ltd of P.O. Box
   30, Kisumu, Kenya…"). The city offered is the address's last part that is a
   place's name: never a number, a box, a postcode or a country (the
   browser's own list of countries, Intl.DisplayNames). Where no part is a
   place, the address is still said and nothing is offered to use. */
let _cuCountries = null;
function cuCountryNames(){
  if (_cuCountries) return _cuCountries;
  const out = new Set(['usa', 'uk', 'u.s.a.', 'u.k.', 'united states of america', 'great britain', 'england', 'scotland', 'wales']);
  try {
    const langs = ['en', 'sv'];
    for (const lg of langs){
      const dn = new Intl.DisplayNames([lg], { type: 'region' });
      for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++){
        const code = String.fromCharCode(a) + String.fromCharCode(b);
        let n = ''; try { n = dn.of(code) || ''; } catch (_){ n = ''; }
        if (n && n !== code) out.add(n.toLowerCase());
      }
    }
  } catch (_){}
  _cuCountries = out;
  return out;
}
function cuCityFromAddress(addr){
  const parts = String(addr || '').split(/[,\n]/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const C = cuCountryNames();
  for (let i = parts.length - 1; i >= 0; i--){
    let p = parts[i].replace(/[.;:]+$/, '').trim();
    /* "Nairobi 00100" → "Nairobi": a postcode beside a town is not the town */
    p = p.replace(/\s+\d[\d\s-]*$/, '').replace(/^\d[\d\s-]*\s+/, '').trim();
    if (!p || /\d/.test(p) || /^(p\.?\s*o\.?|box|po box|private bag)\b/i.test(p)) continue;
    if (C.has(p.toLowerCase())) continue;
    if (!/^[\p{L}][\p{L}\s.'’-]{1,40}$/u.test(p) || p.split(/\s+/).length > 3) continue;
    return p;
  }
  return '';
}
/* the address a sentence gives right after the party's name: "…Kabras Sugar
   Ltd of P.O. Box 30, Kisumu (the "Supplier")…" — up to its first bracket,
   semicolon, quote, line, "and", "hereinafter" or the sentence's end */
const CU_ADDR_LEAD = /^[\s,]*(?:(?:(?!\.\s)[^;()\n"“]){0,80}?[\s,])?(?:of|at|located at|situated at|based in|whose (?:registered )?(?:office|address|place of business) is(?: at)?|having its (?:registered )?(?:office|address|place of business) (?:at|in)|(?:registered|principal) (?:office|address)(?: is)?(?: at)?)\s+/i;
function cuAddrAfterName(after){
  const m = CU_ADDR_LEAD.exec(String(after || ''));
  if (!m) return '';
  const rest = String(after).slice(m[0].length);
  const stop = rest.search(/\(|;|"|“|\n|\bhereinafter\b|\s(?:and|AND)\s|\.\s+(?!Box\b)(?=[A-Z][a-z]{2,})/);
  return (stop >= 0 ? rest.slice(0, stop) : rest.slice(0, 160)).replace(/[\s,.]+$/, '').replace(/\s+/g, ' ').trim();
}
function partyCitySuggest(key){
  const v = cuCustomerOf(key); if (!v) return null;
  const name = v.name, items = v.items || [];
  const ref = c => (typeof contractRef === 'function') ? contractRef(c) : c.id;
  for (const c of items){
    const rows = (typeof contractParties === 'function') ? (contractParties(c) || []) : [];
    const row = rows.find(p => p && p.side !== 'ours' && cuKeyOf(p.name) === key && String(p.address || '').trim());
    if (row) return { ref: ref(c), id: c.id, addr: String(row.address).trim(), city: cuCityFromAddress(row.address) };
  }
  const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nameRe = new RegExp(esc(name).replace(/\s+/g, '\\s+'), 'i');
  for (const c of items){
    let text = ''; try { text = (typeof contractPlainText === 'function') ? contractPlainText(c) : ''; } catch (_){ text = ''; }
    text = String(text || '').slice(0, 6000);
    const m = nameRe.exec(text); if (!m) continue;
    const addr = cuAddrAfterName(text.slice(m.index + m[0].length, m.index + m[0].length + 260));
    if (addr.length < 3) continue;
    return { ref: ref(c), id: c.id, addr, city: cuCityFromAddress(addr) };
  }
  return null;
}
/* THE ONE DOOR: the panel's top becomes the two boxes */
function partyRecordOpen(key){
  if (!key || !partyRecordMay()) return;
  _cu.edit = String(key);
  if (typeof insSelect === 'function') insSelect('customers', _cu.edit);
  if (typeof state !== 'undefined' && state.view !== 'customers' && typeof setView === 'function') setView('customers');
  else cuRepaint();
  const f = document.getElementById('cu-pr-city');
  if (f){ try { f.focus({ preventScroll: true }); } catch (_){} if (typeof landOn === 'function') landOn('#cu-pr-form', { focus: false }); }
}
function cuPrFormHtml(v){
  const rec = partyRecordOf(v.key) || {};
  const sug = partyCitySuggest(v.key);
  const said = sug ? `<p class="cu-pr-sug" data-cu-pr-sug>${_cuE(i18t('cu_pr_from', { ref: sug.ref, addr: sug.addr }))}${
    sug.city ? ` <button type="button" class="ui-link" data-cu-pr-use="${_cuE(sug.city)}">${_cuE(i18t('cu_pr_use', { city: sug.city }))}</button>` : ''}</p>` : '';
  return `<form class="cu-pr-form" id="cu-pr-form" data-cu-pr-key="${_cuE(v.key)}" novalidate>
    <label class="cu-pr-f"><span>${_cuE(i18t('cu_col_city'))}</span><input id="cu-pr-city" type="text" autocomplete="off" maxlength="80" value="${_cuE(rec.city || '')}"></label>
    ${said}
    <label class="cu-pr-f"><span>${_cuE(i18t('cu_f_org'))}</span><input id="cu-pr-org" type="text" autocomplete="off" maxlength="40" value="${_cuE(rec.orgNo || '')}"></label>
    <div class="cu-pr-acts"><button type="submit" class="ui-btn ui-btn-sm ui-btn-primary" data-cu-pr-save>${_cuE(i18t('cu_pr_save'))}</button><button type="button" class="ui-btn ui-btn-sm" data-cu-pr-cancel>${_cuE(i18t('cu_pr_cancel'))}</button></div>
  </form>`;
}
async function cuPrSave(form){
  const key = form.getAttribute('data-cu-pr-key');
  const v = cuView(cuCustomerOf(key)); if (!v) return;
  const btn = form.querySelector('[data-cu-pr-save]');
  if (btn){ btn.disabled = true; if (typeof busySet === 'function') busySet(btn, true); }
  try {
    await partyRecordSet(v.name, { city: (form.querySelector('#cu-pr-city') || {}).value, orgNo: (form.querySelector('#cu-pr-org') || {}).value });
    _cu.edit = null;
    if (typeof toast === 'function') toast(i18t('cu_pr_saved', { party: v.name }), 'ok');
    cuRepaint();
    if (typeof dirRepaint === 'function') dirRepaint();
  } catch (e){
    if (btn){ btn.disabled = false; if (typeof busySet === 'function') busySet(btn, false); }
    if (typeof toast === 'function') toast(i18t('cu_pr_err', { msg: (e && e.message) || '' }), 'err');
  }
}
if (typeof document !== 'undefined' && document.addEventListener){
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const ed = t.closest('[data-cu-pr-edit]'); if (ed){ e.preventDefault(); partyRecordOpen(ed.getAttribute('data-cu-pr-edit')); return; }
    const use = t.closest('[data-cu-pr-use]'); if (use){ const f = document.getElementById('cu-pr-city'); if (f){ f.value = use.getAttribute('data-cu-pr-use'); try { f.focus({ preventScroll: true }); } catch (_){} } return; }
    if (t.closest('[data-cu-pr-cancel]')){ _cu.edit = null; cuRepaint(); }
  });
  document.addEventListener('submit', e => {
    const form = e.target && e.target.closest ? e.target.closest('#cu-pr-form') : null;
    if (!form) return;
    e.preventDefault(); cuPrSave(form);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && _cu.edit && e.target && e.target.closest && e.target.closest('#cu-pr-form')){ e.stopPropagation(); _cu.edit = null; cuRepaint(); }
  });
}
/* "with us since March 2024": the earliest start among the party's
   agreements (its effective day on file, else its signature, else the day it
   was raised here) */
function cuSinceOf(items){
  const days = (items || []).map(c => {
    let d = (c.fields && c.fields.effDate) || (c.metadata && c.metadata.effectiveDate) || '';
    if (!d){ try { d = (typeof contractSignedAt === 'function') ? contractSignedAt(c) : ''; } catch (_){ d = ''; } }
    if (!d) d = c._raisedAt || (Array.isArray(c.audit) && c.audit[0] && c.audit[0].at) || c.createdAt || '';
    const s = String(d || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
  }).filter(Boolean).sort();
  return days[0] || '';
}
function cuMonthYear(iso){
  try { return new Date(iso + 'T00:00:00Z').toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (_){ return iso; }
}
/* the party's name as a sentence says it: "People at Nordvik", "Draft an
   agreement with Kabras Sugar" — its legal form left off, never anything else */
const CU_LEGAL_TAIL = /[\s,]+(?:ab|ltd\.?|limited|plc|llc|inc\.?|oy|oyj|as|asa|a\/s|aps|gmbh|bv|nv|sa|sarl|srl|spa|pty|pte|co\.?\s*ltd\.?|company limited|corp\.?|corporation)$/i;
function cuShortName(name){
  const n = String(name || '').trim();
  const s = n.replace(CU_LEGAL_TAIL, '').trim();
  return s.length >= 2 ? s : n;
}
/* the party's owner, as the panel says it: whoever owns most of its
   agreements, "(you)" where that is the reader, and how many others own one */
function cuOwnerSay(items){
  const count = new Map();
  (items || []).forEach(c => { const o = (typeof contractOwnerName === 'function') ? (contractOwnerName(c) || '') : ''; if (o) count.set(o, (count.get(o) || 0) + 1); });
  if (!count.size) return '';
  const names = [...count.keys()].sort((a, b) => (count.get(b) - count.get(a)) || a.localeCompare(b));
  const me = (typeof currentUser === 'function') ? currentUser() : null;
  const one = n => (me && String(me.name || '').trim() === n) ? i18t('cu_owner_you', { name: n }) : n;
  return names.length > 1 ? i18t('cu_owner_more', { name: one(names[0]), n: names.length - 1 }) : one(names[0]);
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
/* THE BAND'S FILTERS AS DRAWN (round 19, "The SAP way"; the owner's "build
   all the gaps", 18 Oct 2026, reverses the 10 Oct label inside the box for
   this band): each box's word ABOVE it — Party name · Status · Stream · Owner
   · NDA — under a hairline, the find box first with its glass. The boxes are
   the register's own (cuChip); outside .reg-tabbar the band's own rule
   (.sap-page .reg-fb .reg-chip) draws the word over the box. */
function cuFindHtml(o){
  const ic = (typeof icon === 'function') ? icon('search', 'w-3.5 h-3.5') : '';
  return `<label class="cu-find"><span class="cu-find-l">${_cuE(o.label)}</span><span class="cu-find-box">${ic}<input id="${_cuE(o.id)}" type="search" autocomplete="off" placeholder="${_cuE(o.ph)}" value="${_cuE(o.q)}" aria-label="${_cuE(o.label)}"></span></label>`;
}
function cuFilterBarHtml(items, ndaCounts, standing){
  const streams = [...new Set((items || []).map(c => c.folder).filter(f => f && cuStreamName(f)))]
    .sort((a, b) => cuStreamName(a).localeCompare(cuStreamName(b)));
  const owners = [...new Set((items || []).map(c => (typeof contractOwnerName === 'function' && contractOwnerName(c)) || '').filter(Boolean))].sort();
  const st = standing || { live: 1, ended: 1 };
  return `<div class="reg-filterbar reg-fb cu-fb">
    ${cuFindHtml({ id: 'cu-q', label: i18t('cu_find_ph'), ph: i18t('cu_find_city'), q: _cu.q })}
    ${cuChip({ label: i18t('cu_status'), attr: 'data-cu-f', key: 'status', cur: _cu.status, def: 'live',
      opts: [...['live', 'ended'].filter(k => st[k] || _cu.status === k).map(k => [k, i18t('cu_status_' + k)]), ['all', i18t('cu_status_all')]] })}
    ${cuChip({ label: i18t('reg_chip_stream'), title: i18t('reg_value_stream'), attr: 'data-cu-f', key: 'stream', cur: _cu.stream, def: 'all',
      opts: [['all', i18t('cu_all_streams')], ...streams.map(f => [f, cuStreamName(f)])] })}
    ${cuChip({ label: i18t('cu_owner'), attr: 'data-cu-f', key: 'owner', cur: _cu.owner, def: 'all',
      opts: [['all', i18t('cu_anyone')], ...owners.map(o => [o, o])] })}
    ${ndaCounts ? cuChip({ label: i18t('cu_col_nda'), title: i18t('cu_nda_filter_title'), attr: 'data-cu-f', key: 'nda', cur: _cu.nda, def: 'all',
      opts: [['all', i18t('cu_nda_any')], ...['inforce', 'unconfirmed', 'none'].filter(k => ndaCounts[k] || _cu.nda === k).map(k => [k, i18t('cu_nda_f_' + k)])] }) : ''}
  </div>`;
}
/* THE LIST'S CARD AS DRAWN: its name, the count in a pill, what it holds and
   how it is sorted, and Columns at the right; the foot says how many of how
   many are shown, and Show more */
function cuCardHtml(o){
  const loc = (typeof jxLocale === 'function') ? jxLocale() : undefined;
  const nn = Number(o.n || 0).toLocaleString(loc);
  return `<section class="ap-card cu-card">
    <div class="ap-card-h cu-card-h"><h2 class="ap-card-t">${_cuE(o.title)} <span class="ap-card-n is-pill">${nn}</span>${o.meta ? ` <span class="ap-card-m">${_cuE(o.meta)}</span>` : ''}</h2><span class="ap-card-sp"></span>${o.right || ''}</div>
    <div class="cu-scroll" data-lc-scroll="${_cuE(o.seat || '')}">${o.table}</div>
    ${o.foot ? `<div class="ap-foot cu-foot">${o.foot}</div>` : ''}
  </section>`;
}
function cuPartFoot(){
  const w = cuWhole();
  return w.whole ? '' : `<span>${_cuE(i18t('cu_part_book', { have: w.have, total: w.total }))}</span>`;
}
/* "10 of 27 shown · Show more" — the list draws a page at a time and says the
   cap; Show more (or reaching the list's end) draws the next page. One
   builder for Parties and People. */
function lcFootHtml(seat, shown, total){
  const loc = (typeof jxLocale === 'function') ? jxLocale() : undefined;
  const more = shown < total;
  return `<span class="lc-shown" data-lc-shown="${_cuE(seat)}">${_cuE(i18t('cu_shown_n', { n: Number(shown).toLocaleString(loc), total: Number(total).toLocaleString(loc) }))}${more ? ' · ' : ''}</span>${
    more ? `<button type="button" class="ui-link lc-more" data-lc-more="${_cuE(seat)}">${_cuE(i18t('cu_show_more'))}</button>` : ''}`;
}

/* ---- COLUMNS: CHOOSE AND ORDER (round 19 as drawn: "Columns" on the list's
   head; "you choose and order the columns here") ----
   A reader's own convenience, kept in this browser per page (never the
   record, never shared). The first column — who it is — is always there.
   One builder for every list that draws it (Parties, People): the page names
   its columns and how it draws again (LC_PAGES). The pop-up follows PRESS IT
   AGAIN AND IT CLOSES; Esc and a press outside close it too. */
const LC_PAGES = {};
let _lcOpen = null;
const lcKey = seat => 'hati.v1.cols.' + seat;
function lcState(seat, keys){
  let v = null; try { v = JSON.parse(localStorage.getItem(lcKey(seat)) || 'null'); } catch (_){ v = null; }
  const order = (v && Array.isArray(v.order) ? v.order.filter(k => keys.includes(k)) : []);
  keys.forEach(k => { if (!order.includes(k)) order.push(k); });
  const hidden = (v && Array.isArray(v.hidden) ? v.hidden.filter(k => keys.includes(k)) : []);
  return { order, hidden };
}
function lcSave(seat, st){ try { if (st) localStorage.setItem(lcKey(seat), JSON.stringify(st)); else localStorage.removeItem(lcKey(seat)); } catch (_){} }
function lcShown(seat, keys){ const st = lcState(seat, keys); return st.order.filter(k => !st.hidden.includes(k)); }
function lcBtnHtml(seat){
  const open = _lcOpen === seat;
  return `<span class="lc-wrap"><button type="button" class="ui-btn ui-btn-sm lc-btn" data-lc-btn="${_cuE(seat)}" aria-haspopup="true" aria-expanded="${open ? 'true' : 'false'}" title="${_cuE(i18t('cu_cols_title'))}">${_cuE(i18t('cu_cols'))}</button>${open ? lcPopHtml(seat) : ''}</span>`;
}
function lcPopHtml(seat){
  const pg = LC_PAGES[seat]; if (!pg) return '';
  const cols = pg.cols(), keys = cols.map(c => c.k), st = lcState(seat, keys);
  const label = k => (cols.find(c => c.k === k) || {}).label || k;
  const ic = n => (typeof icon === 'function') ? icon(n, 'w-3.5 h-3.5') : '';
  return `<div class="lc-pop" role="group" aria-label="${_cuE(i18t('cu_cols_title'))}" data-lc-pop="${_cuE(seat)}">
    <p class="lc-h">${_cuE(i18t('cu_cols_title'))}</p>
    ${st.order.map((k, i) => `<div class="lc-row"><label class="lc-l"><input type="checkbox" data-lc-k="${_cuE(k)}"${st.hidden.includes(k) ? '' : ' checked'}><span>${_cuE(label(k))}</span></label>
      <button type="button" class="lc-mv" data-lc-up="${_cuE(k)}" aria-label="${_cuE(i18t('cu_cols_up', { c: label(k) }))}" title="${_cuE(i18t('cu_cols_up', { c: label(k) }))}"${i === 0 ? ' disabled' : ''}>${ic('chevU')}</button>
      <button type="button" class="lc-mv" data-lc-down="${_cuE(k)}" aria-label="${_cuE(i18t('cu_cols_down', { c: label(k) }))}" title="${_cuE(i18t('cu_cols_down', { c: label(k) }))}"${i === st.order.length - 1 ? ' disabled' : ''}>${ic('chevD')}</button></div>`).join('')}
    <div class="lc-foot"><button type="button" class="ui-link" data-lc-reset="${_cuE(seat)}">${_cuE(i18t('cu_cols_reset'))}</button></div>
  </div>`;
}
/* the list hangs under its button, over the page — never cut by the card a
   short list ends early (the card clips what overflows it) */
function lcPlace(seat){
  const b = document.querySelector(`[data-lc-btn="${seat}"]`), pop = document.querySelector(`[data-lc-pop="${seat}"]`);
  if (!b || !pop) return;
  const r = b.getBoundingClientRect();
  pop.style.position = 'fixed';
  pop.style.top = Math.round(r.bottom + 6) + 'px';
  pop.style.right = Math.max(8, Math.round(window.innerWidth - r.right)) + 'px';
  pop.style.left = 'auto';
  pop.style.maxHeight = Math.max(160, window.innerHeight - r.bottom - 16) + 'px';
  pop.style.overflow = 'auto';
}
function lcRepaint(seat, focusSel){
  const pg = LC_PAGES[seat]; if (!pg) return;
  pg.repaint();
  if (_lcOpen === seat) lcPlace(seat);
  if (focusSel){ const el = document.querySelector(focusSel); if (el) try { el.focus({ preventScroll: true }); } catch (_){} }
}
if (typeof document !== 'undefined' && document.addEventListener){
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const b = t.closest('[data-lc-btn]');
    if (b){ const seat = b.getAttribute('data-lc-btn'); _lcOpen = _lcOpen === seat ? null : seat; lcRepaint(seat, `[data-lc-btn="${seat}"]`); return; }
    const pop = t.closest('[data-lc-pop]');
    if (pop){
      const seat = pop.getAttribute('data-lc-pop'), pg = LC_PAGES[seat]; if (!pg) return;
      const keys = pg.cols().map(c => c.k), st = lcState(seat, keys);
      const mv = (k, d) => { const i = st.order.indexOf(k), j = i + d; if (i < 0 || j < 0 || j >= st.order.length) return false; st.order.splice(j, 0, st.order.splice(i, 1)[0]); return true; };
      const up = t.closest('[data-lc-up]'), dn = t.closest('[data-lc-down]');
      if (up && mv(up.getAttribute('data-lc-up'), -1)){ lcSave(seat, st); lcRepaint(seat, `[data-lc-up="${up.getAttribute('data-lc-up')}"]`); return; }
      if (dn && mv(dn.getAttribute('data-lc-down'), 1)){ lcSave(seat, st); lcRepaint(seat, `[data-lc-down="${dn.getAttribute('data-lc-down')}"]`); return; }
      if (t.closest('[data-lc-reset]')){ lcSave(seat, null); lcRepaint(seat, `[data-lc-btn="${seat}"]`); }
      return;
    }
    const more = t.closest('[data-lc-more]');
    if (more){ const seat = more.getAttribute('data-lc-more'), pg = LC_PAGES[seat]; if (pg && pg.more) pg.more(); return; }
    if (_lcOpen){ const seat = _lcOpen; _lcOpen = null; lcRepaint(seat); }
  });
  document.addEventListener('change', e => {
    const cb = e.target && e.target.closest ? e.target.closest('[data-lc-k]') : null; if (!cb) return;
    const pop = cb.closest('[data-lc-pop]'); if (!pop) return;
    const seat = pop.getAttribute('data-lc-pop'), pg = LC_PAGES[seat]; if (!pg) return;
    const keys = pg.cols().map(c => c.k), st = lcState(seat, keys), k = cb.getAttribute('data-lc-k');
    st.hidden = cb.checked ? st.hidden.filter(x => x !== k) : st.hidden.concat(k);
    lcSave(seat, st); lcRepaint(seat, `[data-lc-k="${k}"]`);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !_lcOpen) return;
    const seat = _lcOpen; _lcOpen = null; e.stopPropagation(); lcRepaint(seat, `[data-lc-btn="${seat}"]`);
  }, true);
}
/* THE LIST CARRIES ON AS YOU SCROLL (the drawing's note on Show more): the
   scroller's end draws the next page, as the button does */
function lcScrollWire(host, seat){
  const sc = host && host.querySelector(`[data-lc-scroll="${seat}"]`);
  if (!sc || sc.dataset.lcBound) return;
  sc.dataset.lcBound = '1';
  sc.addEventListener('scroll', () => {
    if (sc.scrollTop + sc.clientHeight < sc.scrollHeight - 24) return;
    const b = host.querySelector(`[data-lc-more="${seat}"]`), pg = LC_PAGES[seat];
    if (b && pg && pg.more) pg.more();
  }, { passive: true });
}

/* ---- THE STYLE: the Approvals page's card and table (one look for every
   inspector list), plus the page's own few rules ---- */
/* THE CLOTHES THE TWO "WHO" LISTS SHARE (round 19: Parties and People drawn
   alike): the head row, the filters under a hairline with each word above its
   box, the find box, the card and its scroller, Columns and the paged foot.
   One string, put on both pages. */
const LC_CSS = `
  .sap-band > .cu-head{display:flex;align-items:center;justify-content:space-between;gap:var(--s-3);flex-wrap:wrap;padding-bottom:var(--s-3);}
  .cu-hl{display:flex;align-items:baseline;gap:var(--s-3);min-width:0;flex:1 1 auto;}
  .cu-t{margin:0;font-family:var(--font-heading);font-size:20px;font-weight:var(--w-title);letter-spacing:-.01em;line-height:1.2;color:var(--color-text);white-space:nowrap;}
  .cu-t .cu-tn{margin-left:6px;font-size:var(--t-card);font-weight:var(--w-body);color:var(--color-neutral-600);font-variant-numeric:tabular-nums;}
  .cu-hs{font-size:var(--t-meta);color:var(--color-neutral-700);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .cu-acts{display:flex;align-items:center;gap:var(--s-2);flex:none;min-height:var(--ctl-h);}
  /* the filters under a hairline, each word above its box */
  .sap-band > .cu-fb{border-top:1px solid var(--color-divider);padding:var(--s-3) 0;gap:var(--s-2) var(--s-3);}
  .cu-find{display:flex;flex-direction:column;gap:4px;min-width:0;}
  .cu-find-l{font-size:var(--t-meta);color:var(--color-neutral-600);}
  .cu-find-box{display:flex;align-items:center;gap:6px;height:var(--ctl-h);min-width:200px;padding:0 var(--s-2);border:1px solid var(--chip-edge,var(--btn-edge));border-radius:var(--radius);background:var(--color-surface);color:var(--color-neutral-500);box-sizing:border-box;}
  .cu-find-box:focus-within{border-color:var(--color-accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--color-accent) 25%,transparent);}
  .cu-find-box input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:var(--color-text);font:inherit;font-size:var(--t-body);padding:0;}
  .cu-find-box input:focus-visible{outline:none;box-shadow:none;}
  .cu-body{flex:1;min-height:0;}
  .cu-card{display:flex;flex-direction:column;min-height:0;}
  .is-ins .cu-card{overflow:hidden;}
  .cu-scroll{flex:1;min-height:0;overflow:auto;}
  .cu-card-h{position:relative;}
  /* Columns: the button at the card head's end, its list under it */
  .lc-wrap{position:relative;display:inline-flex;}
  .lc-pop{position:absolute;right:0;top:calc(100% + 6px);z-index:30;min-width:240px;padding:8px;border:1px solid var(--color-divider);border-radius:var(--radius-lg);background:var(--color-surface);box-shadow:var(--shadow-md);}
  .lc-h{margin:2px 4px 6px;font-size:var(--t-meta);color:var(--color-neutral-600);}
  .lc-row{display:flex;align-items:center;gap:4px;padding:2px 4px;border-radius:var(--radius);}
  .lc-row:hover{background:var(--surface-2);}
  .lc-l{flex:1;display:flex;align-items:center;gap:8px;min-width:0;font-size:var(--t-body);color:var(--color-text);cursor:pointer;}
  .lc-mv{flex:none;width:24px;height:24px;display:grid;place-items:center;border:0;border-radius:var(--radius);background:none;color:var(--color-neutral-600);cursor:pointer;}
  .lc-mv:hover:not(:disabled){background:var(--color-surface);color:var(--accent-ink);}
  .lc-mv:disabled{opacity:.35;cursor:default;}
  .lc-foot{border-top:1px solid var(--color-divider);margin-top:6px;padding:6px 4px 2px;}
  .lc-more{font-size:inherit;}
  /* "10 of 27 shown · Show more" reads as one line at the foot's start */
  .ap-foot.cu-foot{justify-content:flex-start;gap:4px;flex-wrap:wrap;}
  .ap-foot.cu-foot .lc-shown{white-space:nowrap;}
`;
const CU_CSS = `
  .cu-page{height:var(--view-h);box-sizing:border-box;}
  .cu-page .sap-band{padding-top:var(--page-pad-t);display:flex;flex-direction:column;gap:0;}
  .cu-table td.n,.cu-table th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;}
  .cu-table td.quiet{color:var(--color-neutral-500);}
  .cu-table td.amber{color:var(--st-amber-fg);font-weight:var(--w-strong);}
  .cu-table tbody tr[data-cu-cust]:focus{outline:none;}
  .cu-table tbody tr.is-sel td{background:color-mix(in srgb,var(--color-accent) 8%,transparent);}
  .cu-table tbody tr.is-sel td:first-child{box-shadow:inset 2px 0 0 var(--accent-solid);}
  .cu-table .cu-pn{display:block;font-weight:var(--w-label);color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cu-table .cu-ps{display:block;font-size:var(--t-micro);color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cu-table td.cu-city{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cu-stripe{display:inline-block;width:4px;height:12px;border-radius:2px;vertical-align:-1px;margin-right:7px;}
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
  .cu-list{border:1px solid var(--color-divider);border-radius:var(--radius-lg);overflow:hidden;}
  .cu-li{display:flex;align-items:center;gap:var(--s-2);padding:8px 12px;border:0;border-top:1px solid var(--color-divider);background:var(--color-surface);text-align:left;font:inherit;color:inherit;width:100%;box-sizing:border-box;}
  .cu-li:first-child{border-top:0;}
  button.cu-li{cursor:pointer;} button.cu-li:hover{background:var(--surface-2);}
  .cu-li-b{display:flex;flex-direction:column;min-width:0;flex:1;}
  .cu-li-b b{font-weight:var(--w-label);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cu-li-b span{font-size:var(--t-micro);color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cu-li.is-late .cu-li-b b{color:var(--st-ruby-fg);}
  .cu-li-b span .late{color:var(--st-ruby-fg);}
  .cu-ag-st{flex:none;font-size:var(--t-meta);}
  .cu-pp-av{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:var(--w-strong);background:var(--color-accent-50);color:var(--accent-ink);border:1px solid var(--color-divider);}
  .cu-draft-with{padding:4px 16px 16px;}
  .cu-sub-act{border:0;background:none;padding:0;font:inherit;color:var(--accent-ink);font-weight:var(--w-label);cursor:pointer;}
  .cu-sub-act:hover{text-decoration:underline;}
  .cu-sub-act.is-quiet{color:inherit;font-weight:inherit;text-decoration:underline dotted;text-underline-offset:3px;}
  .cu-org-go{margin-left:6px;}
  /* the party's own facts, typed in the panel */
  .cu-pr-form{display:flex;flex-direction:column;gap:8px;padding:12px 16px;border-bottom:1px solid var(--color-divider);}
  .cu-pr-f{display:flex;flex-direction:column;gap:4px;font-size:var(--t-meta);color:var(--color-neutral-600);}
  .cu-pr-f input{height:var(--ctl-h);padding:0 var(--s-2);border:1px solid var(--btn-edge);border-radius:var(--radius);background:var(--color-surface);color:var(--color-text);font:inherit;font-size:var(--t-body);}
  .cu-pr-f input:focus{outline:0;border-color:var(--color-accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--color-accent) 25%,transparent);}
  .cu-pr-sug{margin:-2px 0 2px;font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.45;}
  .cu-pr-acts{display:flex;gap:var(--s-2);}
`;

/* ---- THE PARTIES PAGE ---- */
/* the columns after the party's own, in the drawing's order; On paper only
   for a reader who may see values */
function cuColDefs(){
  const money = cuMoney();
  return [
    { k: 'city', label: i18t('cu_col_city'), w: 108 },
    { k: 'live', label: i18t('cu_col_live'), r: 1, w: 66 },
    { k: 'ended', label: i18t('cu_col_ended'), r: 1, w: 86 },
    ...(money ? [{ k: 'paper', label: i18t('cu_col_paper'), r: 1, w: 92 }] : []),
    { k: 'next', label: i18t('cu_col_next_end'), w: 102 },
    { k: 'waiting', label: i18t('cu_col_waiting'), w: 168 },
    { k: 'nda', label: i18t('cu_col_nda'), w: 128 },
  ];
}
/* the party's sub-line: "2 agreements · Procurement" — its streams by name */
function cuStreamsSay(v){
  const names = v.streams.map(cuStreamName).filter(Boolean);
  return names.length > 2 ? `${names.slice(0, 2).join(' · ')} · +${names.length - 2}` : names.join(' · ');
}
function cuCityMatch(r, q){ const city = cuKeyOf(partyCityOf(r.key)); return !!(city && city.includes(q)); }
function cuRowsOf(all, ndas){
  const q = cuKeyOf(_cu.q);
  return all.filter(r => !q || r.key.includes(q) || cuCityMatch(r, q))
    .filter(r => !cuFiltersOn() || cuFilterItems(r.items).length)
    .filter(r => cuStatusWants(r))
    .filter(r => cuNdaWants(cuNdaOf(r.key, ndas).state, _cu.nda));
}
function cuCellHtml(k, r, v, ndas){
  if (k === 'city'){ const city = partyCityOf(r.key); return `<td class="cu-city${city ? '' : ' quiet'}"${city ? ` title="${_cuE(city)}"` : ''}>${_cuE(city || '—')}</td>`; }
  if (k === 'live') return `<td class="n${v.active.length ? '' : ' quiet'}">${v.active.length || '—'}</td>`;
  if (k === 'ended') return `<td class="n${v.expired.length ? '' : ' quiet'}">${v.expired.length || '—'}</td>`;
  if (k === 'paper'){ const ov = cuMoneyWords(v.active); return `<td class="n${ov ? '' : ' quiet'}">${_cuE(ov || '—')}</td>`; }
  if (k === 'next') return `<td class="${v.next ? '' : 'quiet'}">${_cuE(v.next ? cuDay(v.next) : '—')}</td>`;
  if (k === 'waiting'){
    const ws = cuNeedsSay(v.needs), wAll = v.needs.map(cuNeedTitle).join(' · '), wLate = v.needs.some(x => x.it.urgent);
    return `<td class="cu-wait${ws ? (wLate ? ' ruby' : ' amber') : ' quiet'}"${ws ? ` title="${_cuE(wAll)}"` : ''}>${_cuE(ws || '—')}</td>`;
  }
  if (k === 'nda') return `<td class="cu-nda-td">${cuNdaCellHtml(cuNdaOf(r.key, ndas))}</td>`;
  return '<td></td>';
}
function cuListHtml(INS){
  const book = cuBook();
  const all = cuCustomers(book);
  const ndas = cuNdaMap();
  const ndaCounts = { inforce: 0, unconfirmed: 0, none: 0 };
  const standing = { live: 0, ended: 0 };
  all.forEach(r => { const st = cuNdaOf(r.key, ndas).state; ['inforce', 'unconfirmed', 'none'].forEach(k => { if (cuNdaWants(st, k)) ndaCounts[k]++; });
    standing[cuStanding(r)]++; });
  /* a status that holds nobody is not offered; the list then shows them all */
  if (_cu.status !== 'all' && !standing[_cu.status]) _cu.status = 'all';
  const rows = cuRowsOf(all, ndas);
  const money = cuMoney();
  const activeAll = book.filter(c => cuBucket(c) === 'active');
  const loc = (typeof jxLocale === 'function') ? jxLocale() : undefined;
  const headSub = money ? (v => v ? i18t('cu_head_on_paper', { v }) : '')(cuMoneyWords(activeAll)) : '';
  /* ONE PAGE AT A TIME, the cap said (round 19: "10 of 27 shown · Show
     more"); the party in the panel is always among the rows drawn */
  const sel = (typeof insSelected === 'function') ? insSelected('customers') : null;
  const at = sel ? rows.findIndex(r => r.key === sel) : -1;
  const shown = Math.min(rows.length, Math.max(_cu.shown || CU_PAGE, at + 1));
  const cols = cuColDefs(), keys = lcShown('customers', cols.map(c => c.k)), byK = Object.fromEntries(cols.map(c => [c.k, c]));
  const head = [{ t: i18t('cu_col_customer') }, ...keys.map(k => ({ t: byK[k].label, r: byK[k].r, w: byK[k].w, k }))];
  const body = rows.slice(0, shown).map(r => {
    const v = cuView(r);
    const sub = [i18tn('cu_n_agreements', v.items.length, { n: v.items.length }), cuStreamsSay(v)].filter(Boolean).join(' · ');
    return `<tr data-cu-cust="${_cuE(r.key)}" tabindex="-1">
      <td><span class="ap-name cu-pn" title="${_cuE(r.name)}">${_cuE(r.name)}</span><span class="ap-sub cu-ps" title="${_cuE(sub)}">${_cuE(sub)}</span></td>
      ${keys.map(k => cuCellHtml(k, r, v, ndas)).join('')}
    </tr>`;
  }).join('');
  const table = rows.length
    ? `<table class="ap-table ap-ins cu-table"><colgroup>${head.map(h => `<col${h.w ? ` style="width:${h.w}px"` : ''}>`).join('')}</colgroup><thead><tr>${
      head.map(h => `<th${h.r ? ' class="n"' : ''}${h.k ? ` data-cu-col="${_cuE(h.k)}"` : ''}>${_cuE(h.t)}</th>`).join('')}</tr></thead><tbody id="cu-tbody">${body}</tbody></table>`
    : `<div class="ap-empty">${_cuE(all.length ? i18t('cu_none_match') : i18t('cu_none_yet'))}</div>`;
  const foot = rows.length ? [lcFootHtml('customers', shown, rows.length), cuPartFoot()].filter(Boolean).join('') : cuPartFoot();
  const meta = i18t(_cu.status === 'live' ? 'cu_list_live' : _cu.status === 'ended' ? 'cu_list_ended' : 'cu_list_sort');
  const card = cuCardHtml({ seat: 'customers', title: i18t('nav_customers'), n: rows.length, meta, right: lcBtnHtml('customers'), table, foot });
  return `<div class="sap-band">
      <div class="cu-head">
        <div class="cu-hl"><h1 class="cu-t">${_cuE(i18t('nav_customers'))}<span class="cu-tn">${_cuE(Number(all.length).toLocaleString(loc))}</span></h1>${headSub ? `<span class="cu-hs page-facts">${_cuE(headSub)}</span>` : ''}</div>
        <div class="cu-acts"><button type="button" class="hm-primary" data-cu-draft="">${(typeof icon === 'function') ? icon('plus', 'w-3.5 h-3.5', 2) : ''} ${_cuE(i18t('home_draft_new'))}</button></div>
      </div>
      ${cuFilterBarHtml(book, ndaCounts, standing)}
    </div>
    ${INS ? `<div class="ap-body is-ins cu-body">${card}<aside id="ins-panel" class="ins-panel" aria-label="${_cuE(i18t('ins_panel_label'))}"></aside></div>`
      : `<div class="cu-body">${card}</div>`}`;
}
if (typeof window !== 'undefined'){
  LC_PAGES.customers = { cols: () => cuColDefs().map(c => ({ k: c.k, label: c.label })), repaint: () => cuRepaint(),
    more: () => { _cu.shown = Math.max(_cu.shown || CU_PAGE, CU_PAGE) + CU_PAGE; cuRepaint(); } };
}

/* ---- THE PANEL: THE PARTY AS DRAWN (round 19, on Jambo's panel) ----
   Its name; "Gothenburg · with us since March 2024"; Open party · Open on
   Explorer; the facts as rows — Organisation no. · Owner · Live agreements ·
   Next to end · NDA; what waits on you, each with its door; its agreements
   with their stage; the people at the party; and "Draft an agreement with …". */
function cuPanelSubHtml(v){
  const city = partyCityOf(v.key), may = partyRecordMay();
  const since = cuSinceOf(v.items);
  const cityHtml = city ? (may ? `<button type="button" class="cu-sub-act is-quiet" data-cu-pr-edit="${_cuE(v.key)}" title="${_cuE(i18t('cu_city_change_title'))}">${_cuE(city)}</button>` : _cuE(city))
    : (may ? `<button type="button" class="cu-sub-act" data-cu-pr-edit="${_cuE(v.key)}">${_cuE(i18t('cu_city_add'))}</button>` : '');
  const rest = v.active.length ? (since ? i18t('cu_since', { d: cuMonthYear(since) }) : '')
    : i18tn('cu_all_ended', v.items.length, { n: v.items.length });
  return [cityHtml, _cuE(rest)].filter(Boolean).join(' · ');
}
function cuLiveSay(v){
  if (v.active.length){ const m = cuMoney() ? cuMoneyWords(v.active) : ''; return m ? i18t('cu_live_n', { n: v.active.length, v: m }) : String(v.active.length); }
  const one = v.expired.length === 1 ? v.expired[0] : null;
  const y = one ? String(cuEnds(one) || '').slice(0, 4) : '';
  return one && y ? i18t('cu_live_none_one', { name: one.name || cuDay(cuEnds(one)), y }) : i18t('cu_live_none', { n: v.expired.length });
}
function cuNextSay(v){
  if (!v.next) return '';
  const c = v.items.find(x => x.status === 'Signed' && cuBucket(x) === 'active' && cuEnds(x) === v.next);
  return [cuDay(v.next), c && c.name].filter(Boolean).join(' · ');
}
function cuPaintCustomerPanel(tb){
  const seat = 'customers';
  const idOf = r => r.getAttribute('data-cu-cust');
  const id = insPick(seat, [...tb.querySelectorAll('[data-cu-cust]')].map(idOf));
  insMarkRow(tb, '[data-cu-cust]', idOf, id);
  const paint = key => {
    const r = key ? cuView(cuCustomerOf(key)) : null;
    if (!r){ _cu.edit = null; insPaintPanel({ seat, c: null, item: null, empty: i18t('cu_panel_none'), jlHome: i18t('nav_customers'), jlPh: i18t('jl_ph_any') }); return; }
    if (_cu.edit && _cu.edit !== r.key) _cu.edit = null;
    const may = partyRecordMay();
    const org = partyOrgNoOf(r.key);
    const orgHtml = org ? `${_cuE(org)}${may ? ` <button type="button" class="ui-link cu-org-go" data-cu-pr-edit="${_cuE(r.key)}">${_cuE(i18t('cu_pr_change'))}</button>` : ''}`
      : `<span class="cu-none">${_cuE(i18t('cu_org_none'))}</span>${may ? ` <button type="button" class="ui-link cu-org-go" data-cu-pr-edit="${_cuE(r.key)}">${_cuE(i18t('cu_pr_add'))}</button>` : ''}`;
    const rows = (typeof insRowsHtml === 'function') ? insRowsHtml([
      { k: 'org', label: i18t('cu_f_org'), v: orgHtml },
      { k: 'owner', label: i18t('cu_owner'), v: _cuE(cuOwnerSay(r.items)) },
      { k: 'live', label: i18t('cu_f_live'), v: _cuE(cuLiveSay(r)) },
      { k: 'next', label: i18t('cu_col_next_end'), v: _cuE(cuNextSay(r)) },
      { k: 'nda', label: i18t('cu_col_nda'), v: cuNdaFactHtml(cuNdaOf(key), r.name) },
    ]) : '';
    const people = (typeof dirPeopleOfParty === 'function') ? dirPeopleOfParty(r.key) : [];
    const short = cuShortName(r.name);
    const sec = (t, n, b, cls) => (typeof insSecHtml === 'function' ? insSecHtml(t, n, b, cls) : '');
    /* Jambo's panel (round 19): it holds a party */
    insPaintPanel({ seat, jlWord: i18t('jl_w_party'), jlHome: i18t('nav_customers'), jlPh: i18t('jl_ph_any'), item: { id: r.key }, head: {
        title: r.name, sub: cuPanelSubHtml(r),
        acts: [{ k: 'open', kind: 'accent', label: i18t('cu_open_customer'), run: x => cuOpenCustomer(x.id) },
          { k: 'explorer', label: i18t('cu_open_explorer'), run: x => cuOpenExplorer(x.id) }] },
      body: (_cu.edit === r.key ? cuPrFormHtml(r) : '') + rows
        + (r.needs.length ? sec(i18t('cu_col_waiting'), r.needs.length, cuPanelNeedsHtml(r.needs), 'cu-needs') : '')
        + (r.items.length ? sec(i18t('cu_panel_agreements'), r.items.length, cuPanelAgreementsHtml(r.items), 'cu-ags') : '')
        + (people.length ? sec(i18t('cu_people_at', { party: short }), people.length, cuPanelPeopleHtml(people, r), 'cu-people') : '')
        + `<div class="cu-draft-with"><button type="button" class="ui-btn" data-cu-draft-with="${_cuE(r.key)}">${_cuE(i18t('cu_draft_with', { party: short }))}</button></div>` });
  };
  paint(id);
  insListWire(tb, { rowSel: '[data-cu-cust]', idOf,
    onSelect: key => { insSelect(seat, key); insMarkRow(tb, '[data-cu-cust]', idOf, key); paint(key); },
    onOpen: key => cuOpenCustomer(key) });
}

/* THE PANEL'S LISTS (round 19): what waits on you here, each with its own
   door; the party's agreements, each a door onto its paper; its people */
/* A ROW READS WHOLE IN JAMBO'S PANEL (round 19 as drawn: "Answer 2 redlines
   · Master services agreement · waiting 4 days · Open redlines"): the button
   is a short door word — the page it opens — and the long sentence of where
   it lands rides its hover; the line under the title is the agreement and the
   need's own line (its wait), so a 380px panel cuts neither the title nor
   the button. */
const CU_NEED_DOOR = { quiet: 'cu_need_go_move', review: 'cu_need_go_move', suggest: 'cu_need_go_move', join: 'cu_need_go_move', move: 'cu_need_go_move',
  approval: 'jl_open_approval', refused: 'jl_open_signing', sign: 'jl_open_signing', look: 'jl_open_review', details: 'det_need_verb', note: 'cu_need_go_note', renewal: 'home_verb_decide',
  request: 'cu_need_go_request' };
const CU_NEED_LINE = new Set(['quiet', 'look', 'review', 'note', 'renewal', 'refused', 'join']);
function cuReqAge(r){
  const d = String((r && r.createdAt) || '').slice(0, 10);
  const today = (typeof todayISO === 'function') ? todayISO() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !today) return '';
  const n = Math.max(0, Math.round((Date.parse(today) - Date.parse(d)) / 864e5));
  return n === 0 ? i18t('ins_days_today') : i18tn('cu_days_ago', n, { n });
}
function cuPanelNeedsHtml(list){
  return `<div class="cu-list">${list.map(x => {
    const t = cuNeedTitle(x);
    if (x.it.kind === 'request'){
      const sub = [i18t('cu_req_word'), cuStreamName(x.r.folder), cuReqAge(x.r)].filter(Boolean).join(' · ');
      return `<div class="cu-li"><div class="cu-li-b"><b title="${_cuE(t)}">${_cuE(t)}</b><span title="${_cuE(sub)}">${_cuE(sub)}</span></div>
        <button type="button" class="ui-btn ui-btn-sm" data-cu-need="request" data-cu-id="${_cuE(x.r.id)}">${_cuE(i18t('cu_need_go_request'))}</button></div>`;
    }
    const ref = (typeof contractRef === 'function') ? contractRef(x.c) : x.c.id;
    const go = x.it.kind === 'move' ? i18t('cu_need_go_move') : i18t((typeof INS_NEED_GO !== 'undefined' && INS_NEED_GO[x.it.kind]) || 'ins_need_go_nego');
    /* the line says when, where the need has a when: its wait, a due day, the
       note it quotes; a need without one ("approval", "details") says only
       its agreement — never the landing sentence, which is the hover's */
    let line = '', late = false;
    try {
      if (x.it.kind === 'move'){ const w = (typeof regNegoCols === 'function') ? regNegoCols(x.c).waiting : ''; if (w && w !== '—'){ line = i18t('ins_need_waiting', { days: w }); late = !!x.it.urgent; } }
      else if (CU_NEED_LINE.has(x.it.kind) && typeof insNeedWords === 'function'){ line = String(insNeedWords(x.c, x.it).plain || ''); late = !!x.it.urgent; }
    } catch (_){ line = ''; }
    const name = x.c.name || ref;
    const subHtml = [_cuE(name), line ? (late ? `<span class="late">${_cuE(line)}</span>` : _cuE(line)) : ''].filter(Boolean).join(' · ');
    return `<div class="cu-li${x.it.urgent ? ' is-late' : ''}"><div class="cu-li-b"><b title="${_cuE(t)}">${_cuE(t)}</b><span title="${_cuE([name, line, ref].filter(Boolean).join(' · '))}">${subHtml}</span></div>
      <button type="button" class="ui-btn ui-btn-sm" data-cu-need="${_cuE(x.it.kind)}" data-cu-id="${_cuE(x.c.id)}" title="${_cuE(go)}">${_cuE(i18t(CU_NEED_DOOR[x.it.kind] || 'cu_need_go_move'))}</button></div>`; }).join('')}</div>`;
}
/* an agreement's line as drawn: "MK-0382 · round 2 · SEK 4.2 M", "MK-0360 ·
   SEK 2.4 M · ends 31 Mar 2027", "MK-0310 · secret until 29 Feb 2028" — read
   RAW (the round never initialises a negotiation) */
function cuAgreementSub(c){
  const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
  const parts = [ref];
  const round = (typeof igLineRound === 'function') ? igLineRound(c) : 0;
  if (round) parts.push(i18t('ig_line_round', { n: round }));
  const nda = (typeof ndaIs === 'function' && ndaIs(c) && typeof ndaClean === 'function') ? ndaClean(c.nda) : null;
  const money = cuMoney() && Number(c.value) > 0 && !(typeof isMonetary === 'function' && !isMonetary(c))
    ? ((typeof fmtMoneyShortOf === 'function') ? fmtMoneyShortOf(c) : '') : '';
  if (money && !nda) parts.push(money);
  if (nda && (nda.forGood || nda.ends)) parts.push(nda.forGood ? i18t('cu_ag_secret_good') : i18t('cu_ag_secret', { d: cuDay(nda.ends) }));
  else if (c.status === 'Signed'){ const e = cuEnds(c); if (e) parts.push(i18t(cuBucket(c) === 'expired' ? 'cu_ag_ended' : 'cu_ag_ends', { d: cuDay(e) })); }
  else if (cuBucket(c) === 'expired') parts.push(i18t('cu_status_ended'));
  return parts.filter(Boolean).join(' · ');
}
function cuPanelAgreementsHtml(items){
  /* live work first, then what runs (soonest end first), then what has ended */
  const rank = c => c.status !== 'Signed' && cuBucket(c) === 'active' ? 0 : cuBucket(c) === 'active' ? 1 : 2;
  const L = items.slice().sort((a, b) => (rank(a) - rank(b)) || String(cuEnds(a) || '9').localeCompare(String(cuEnds(b) || '9')));
  return `<div class="cu-list">${L.map(c => {
    const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
    const pill = (typeof contractStatusDotHtml === 'function') ? contractStatusDotHtml(c) : _cuE((typeof statusLabel === 'function' && c.status) ? statusLabel(c.status) : (c.status || ''));
    const sub = cuAgreementSub(c);
    return `<button type="button" class="cu-li cu-ag" data-cu-ag="${_cuE(c.id)}"><span class="cu-li-b"><b title="${_cuE(c.name || ref)}">${_cuE(c.name || ref)}</b><span title="${_cuE(sub)}">${_cuE(sub)}</span></span><span class="cu-ag-st">${pill}</span></button>`; }).join('')}</div>`;
}
/* the people at the party (the People page's own book, dirPeopleOfParty): each
   one's initials, name, and "Head of procurement · negotiates MK-0382" — their
   job title where one is on file, and what they do on which contract */
const CU_PP_ROLE = { negotiate: 'cu_pp_negotiates', cpsign: 'cu_pp_signs', advise: 'cu_pp_advises', cpread: 'cu_pp_reads' };
function cuPersonDoes(p, v){
  const ids = (p.contracts || []).filter(id => v.items.some(c => c.id === id));
  const id = ids[0]; if (!id) return i18t('cu_pp_none');
  const c = v.items.find(x => x.id === id);
  const ref = c ? ((typeof contractRef === 'function') ? contractRef(c) : c.id) : id;
  const roles = (typeof p.roleOn === 'function') ? p.roleOn(id) : [];
  const k = ['cpsign', 'negotiate', 'advise', 'cpread'].find(x => roles.includes(x)) || 'cpread';
  const said = i18t(CU_PP_ROLE[k], { ref, party: cuShortName(v.name) });
  return ids.length > 1 ? `${said} · ${i18t('cu_pp_more', { n: ids.length - 1 })}` : said;
}
function cuPanelPeopleHtml(list, v){
  const ini = n => String(n || '').trim().split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toLocaleUpperCase() || '—';
  return `<div class="cu-list">${list.map(p => {
    const sub = [p.title, cuPersonDoes(p, v)].filter(Boolean).join(' · ');
    return `<button type="button" class="cu-li cu-pp" data-cu-pp="${_cuE(p.key)}"><span class="cu-pp-av" aria-hidden="true">${_cuE(ini(p.name || p.email))}</span><span class="cu-li-b"><b>${_cuE(p.name || p.email)}</b><span title="${_cuE(sub)}">${_cuE(sub)}</span></span></button>`; }).join('')}</div>`;
}
/* the panel's rows are delegated once, on the document */
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('click', e => {
  const t = e.target && e.target.closest ? e.target : null; if (!t) return;
  const n = t.closest('[data-cu-need]'); if (n){ cuNeedGo(n.getAttribute('data-cu-need'), n.getAttribute('data-cu-id')); return; }
  const a = t.closest('[data-cu-ag]'); if (a && typeof regOpenContract === 'function'){ regOpenContract(a.getAttribute('data-cu-ag')); return; }
  /* a person at the party: the People page, that person chosen and lit */
  const pp = t.closest('[data-cu-pp]'); if (pp){ if (typeof dirOpenPerson === 'function') dirOpenPerson(pp.getAttribute('data-cu-pp')); return; }
  const dw = t.closest('[data-cu-draft-with]'); if (dw){ const v = cuCustomerOf(dw.getAttribute('data-cu-draft-with')); if (v) cuDraftFor(v.name); }
});

/* ---- THE PAGE ---- */
function renderCustomers(){
  const host = document.getElementById('content'); if (!host) return;
  const INS = (typeof insFits === 'function') && insFits() && typeof insPaintPanel === 'function';
  const keep = (() => { const sc = document.querySelector('.cu-scroll'); return sc ? sc.scrollTop : 0; })();
  const typing = document.activeElement && document.activeElement.id === 'cu-q';
  const editing = document.activeElement && document.activeElement.closest && document.activeElement.closest('#cu-pr-form') ? document.activeElement.id : '';
  host.innerHTML = `<style>${LC_CSS}${CU_CSS}</style>
  <div class="view-enter sap-page ap-page cu-page${INS ? ' is-ins' : ''}" data-ins-page="customers" data-ins="${INS ? '1' : '0'}" data-cu-screen="list">
    ${cuListHtml(INS)}
  </div>`;
  const sc = host.querySelector('.cu-scroll'); if (sc && keep) sc.scrollTop = keep;
  cuWire(host, INS);
  if (typing){ const q = document.getElementById('cu-q'); if (q){ q.focus(); const n = q.value.length; try { q.setSelectionRange(n, n); } catch (_) {} } }
  if (_lcOpen === 'customers') lcPlace('customers');
  if (editing){ const f = document.getElementById(editing); if (f) try { f.focus({ preventScroll: true }); } catch (_){} }
  if (INS && typeof insWatchWidth === 'function') insWatchWidth();
  if (typeof setActiveNav === 'function') setActiveNav('customers');
  cuRequestsLoad();
}
function cuRepaint(){ if (typeof state !== 'undefined' && state.view === 'customers') renderCustomers(); }
function cuWire(host, INS){
  host.querySelector('[data-cu-draft]')?.addEventListener('click', e => cuDraftFor(e.currentTarget.getAttribute('data-cu-draft') || ''));
  host.querySelectorAll('select[data-cu-f]').forEach(s => s.addEventListener('change', () => {
    const k = s.getAttribute('data-cu-f'); if (!['stream', 'owner', 'nda', 'status'].includes(k)) return;
    _cu[k] = s.value || (k === 'status' ? 'live' : 'all'); _cu.shown = 0; renderCustomers(); if (typeof placeSave === 'function') placeSave(); }));
  const q = host.querySelector('#cu-q');
  if (q) q.addEventListener('input', () => { _cu.q = q.value; _cu.shown = 0; renderCustomers(); });
  lcScrollWire(host, 'customers');
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
  cuChip,
  /* round 19 as drawn: a party's own facts, the party's standing, the page's
     find box, Columns and the paged foot — People draws the last three too */
  cuNeedShort, cuRequestsOf, cuStanding, cuStatusWants, partyRecordOf, partyCityOf, partyOrgNoOf, partyRecordSet, partyRecordOpen, partyCitySuggest, cuCityFromAddress, cuAddrAfterName,
  cuSinceOf, cuShortName, cuOwnerSay, cuAgreementSub, cuPanelPeopleHtml, cuFindHtml, cuCardHtml,
  LC_CSS, LC_PAGES, lcPlace, lcState, lcShown, lcBtnHtml, lcFootHtml, lcScrollWire, CU_PAGE });
