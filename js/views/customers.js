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

/* Per sitting: the list's own words, tab and filters (the list head's box,
   its tabs and its chips — Part 8, the Legora way). A refresh puts them back
   through PLACE_PARTS (cuPlace / cuPlacePut). */
/* THE LIST OPENS ON LIVE PARTIES (round 19 as drawn; the Live tab since Part
   8): the title still counts every party. `shown` is how many rows the list
   draws (CU_PAGE at a time, "Show 10 more"); `edit` the party whose own facts
   are being typed in the panel. */
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
/* THEIR REDLINES, COUNTED (round 19 as drawn: "2 redlines · 4 days",
   "Answer 2 redlines"): where the move is ours because their asks wait on an
   answer, the number of them — the Negotiations list's own reading
   (negoMoveSay); 0 where the move is ours for another reason */
function cuMoveRedlines(c){
  let m = null; try { m = (typeof negoMoveSay === 'function') ? negoMoveSay(c) : null; } catch (_){ m = null; }
  return m && m.k === 'you' && !m.why && Number(m.n) > 0 ? Number(m.n) : 0;
}
/* an approval the reader answers for an away colleague: their first name */
function cuApprovalFor(c){
  let fw = null; try { fw = (typeof apForWho === 'function') ? apForWho({ type: 'approval', mine: true, done: false, c }) : null; } catch (_){ fw = null; }
  return (fw && String(fw.name || '').trim().split(/\s+/)[0]) || '';
}
function cuNeedTitle(x){
  if (!x) return '';
  if (x.it.kind === 'request'){
    const who = String((x.r.by && x.r.by.name) || '').trim().split(/\s+/)[0] || i18t('cu_req_someone');
    return i18t('cu_need_request', { who, t: String(x.r.title || '').trim() });
  }
  if (x.it.kind === 'move'){ const n = cuMoveRedlines(x.c); return n ? i18tn('cu_need_answer_redlines', n, { n }) : i18t('cu_need_move'); }
  if (x.it.kind === 'approval'){ const who = cuApprovalFor(x.c); if (who) return i18t('cu_need_approval_for_cap', { who }); }
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
  if (k === 'move'){ let w = ''; try { w = (typeof regNegoCols === 'function') ? regNegoCols(x.c).waiting : ''; } catch (_){ w = ''; }
    const n = cuMoveRedlines(x.c), t = n ? i18tn('cu_need_redlines', n, { n }) : i18t('cu_need_move');
    return w && w !== '\u2014' ? `${t} · ${w}` : t; }
  /* "an approval, for Jonas" where the reader answers for an away colleague
     (When you're away: Approvals' own reading, apForWho) */
  if (k === 'approval'){ const who = cuApprovalFor(x.c); return who ? i18t('cu_need_approval_for', { who }) : i18t('cu_need_approval_short'); }
  if (k === 'details'){ const n = Number(x.it.n) || 1; return i18tn('cu_need_details', n, { n }); }
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
  /* an approval lands on its row on Approvals, lit — the People panel's own
     door (dirWaitGo), so the same words lead to the same place */
  if (kind === 'approval' && typeof dirWaitGo === 'function'){ dirWaitGo('approval', id); return; }
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
  /* LAND ON IT: the NDA brought up on the desk, its "Secret until" figure lit */
  if (typeof hbStripBring === 'function' && hbStripBring(id)){
    const q = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(String(id)) : String(id);
    if (typeof landOn === 'function') landOn(() => document.querySelector(`#bs-strip-${q} [data-bs-kpi="value"]`) || document.getElementById('bs-strip-' + id), { block: 'nearest', focus: false });
    return;
  }
  cuOpenAgreement(id);
}
/* an agreement in the panel: Home's paper on it, its line lit (the People
   panel's own door, dirOpenContract) */
function cuOpenAgreement(id){
  if (!id) return;
  if (typeof dirOpenContract === 'function'){ dirOpenContract(id); return; }
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
  /* the new look (round 6, as drawn): a party opens its own page — its facts, what waits on you, its agreements */
  if (!phone && typeof window.newLookOn === 'function' && newLookOn()){
    _cunParty = v.key;
    if (typeof state !== 'undefined' && state.view !== 'customers' && typeof setView === 'function') setView('customers'); else renderCustomers();
    return;
  }
  if (typeof regShowOnly === 'function') regShowOnly(cuIdsOf(v), phone ? `${v.name} · ${v.items.length}` : v.name, { party: true });
  /* LAND ON IT: the narrowed place's first paper, lit (People's Show their contracts) */
  if (!phone && typeof jlLand === 'function') jlLand('list');
}
/* ONE PARTY FROM ELSEWHERE (People's "Party · Nordvik Logistik AB ›"): the
   Parties list with nothing narrowing it away, that party chosen, and LAND
   ON IT — its row, scrolled into view and lit (People's dirOpenPerson) */
function cuSelectParty(key){
  if (!key || !cuCustomerOf(key)) return;
  _cu.stream = 'all'; _cu.owner = 'all'; _cu.nda = 'all'; _cu.status = 'all'; _cu.q = '';
  const at = cuRowsOf(cuCustomers(), cuNdaMap()).findIndex(r => r.key === key);
  _cu.shown = at >= 0 ? Math.max(CU_PAGE, at + 1) : 0;
  if (typeof insSelect === 'function') insSelect('customers', key);
  if (typeof state !== 'undefined' && state.view !== 'customers' && typeof setView === 'function') setView('customers'); else renderCustomers();
  /* the list head's box shows the words this door cleared (a question left in it goes) */
  if (typeof lhBoxSet === 'function') lhBoxSet('customers');
  if (typeof placeSave === 'function') placeSave();
  const q = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(String(key)) : String(key).replace(/"/g, '\\"');
  if (typeof landOn === 'function') landOn(`#cu-tbody [data-cu-cust="${q}"]`, { focus: false });
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
  /* LAND ON IT: the map's own chip for this party, lit */
  if (typeof landOn === 'function') landOn(() => { const l = (intel.lenses || []).find(x => x.label === v.name);
    return l ? document.querySelector(`[data-lens-hover="${(typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(String(l.id)) : l.id}"]`) : null; }, { focus: false });
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
  /* what Jambo found on the web is kept on the same record (round 3); a save of the city never drops it */
  const web = book[key] && book[key].web;
  if (rec) book[key] = web ? Object.assign({}, rec, { web }) : rec;
  else if (web) book[key] = { name, city: '', orgNo: '', by: '', at: '', web };
  else delete book[key];
  if (!((typeof API_MODE === 'function') && API_MODE())){ try { localStorage.setItem(CU_PR_LS, JSON.stringify(book)); } catch (_){} }
  return rec;
}
/* ---- WHAT THE WEB SAYS ABOUT THEM (round 3 of Jambo's journey, 22 Oct 2026) ----
   A plain internet search the server runs (POST /api/party-records/lookup):
   each fact with its sources, what could not be found, when and by whom. Kept
   on the party's record, so every screen reads one copy. A person's press, an
   editor's, on HaTi's server only (a browser alone cannot search). */
function partyWebOf(key){ const r = partyRecordOf(key); return r && r.web && Array.isArray(r.web.facts) ? r.web : null; }
function partyLookupMay(){ return partyRecordMay() && (typeof API_MODE === 'function') && API_MODE(); }
async function partyLookup(name, opts){
  const o = opts || {}, key = cuKeyOf(name);
  if (!key || !partyLookupMay()) return null;
  const lang = (typeof langId === 'function') ? langId() : 'en';
  const r = await api('party-records/lookup', 'POST', { name, lang, again: !!o.again });
  if (!r || !r.lookup) return null;
  const book = cuRecords();
  book[key] = Object.assign(book[key] || { name, city: '', orgNo: '', by: '', at: '' }, { web: r.lookup });
  return { lookup: r.lookup, kept: !!r.kept };
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
function cuMonthYear(iso, short){
  try { return new Date(iso + 'T00:00:00Z').toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined, { month: short ? 'short' : 'long', year: 'numeric', timeZone: 'UTC' }); } catch (_){ return iso; }
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
   ("Stream: All streams") and HaTi's own list (selectMenuSweep) dress it.
   (My notes and Requests still draw their boxes with it; Parties and People
   draw the list head's chips since Part 8.) */
function cuChip(o){
  const on = String(o.cur) !== String(o.def);
  const pick = ((o.opts || []).find(x => String(x[0]) === String(o.cur)) || [])[1] || '';
  return `<label class="reg-f reg-chip${on ? ' on' : ''}" title="${_cuE(o.title || o.label)}"><span class="reg-f-l">${_cuE(o.label)}</span><span class="reg-f-v">${_cuE(pick)}</span><select class="reg-chip-sel" ${o.attr}="${_cuE(o.key)}" title="${_cuE(o.title || o.label)}">${
    (o.opts || []).map(([v, l]) => `<option value="${_cuE(v)}"${String(v) === String(o.cur) ? ' selected' : ''}>${_cuE(l)}</option>`).join('')}</select></label>`;
}
/* THE LIST'S CARD, THE LEGORA WAY (Part 8, the owner's pick, 21 Oct 2026):
   the list head above carries the count (the lit tab), the views and
   Columns, so the card is the table alone and its foot — "1–10 of 27 · Show
   10 more". (Round 19's card head, "Parties 27 · live · sorted by name" and
   Columns at its right, went with the labelled band.) */
function cuCardHtml(o){
  return `<section class="ap-card cu-card">
    <div class="cu-scroll"${o.id ? ` id="${_cuE(o.id)}"` : ''} data-lc-scroll="${_cuE(o.seat || '')}">${o.table}</div>
    ${o.foot ? `<div class="ap-foot cu-foot">${o.foot}</div>` : ''}
  </section>`;
}
function cuPartFoot(){
  const w = cuWhole();
  return w.whole ? '' : `<span>${_cuE(i18t('cu_part_book', { have: w.have, total: w.total }))}</span>`;
}
/* ---- THE STYLE: the Approvals page's card and table (one look for every
   inspector list), plus the page's own few rules ---- */
/* THE CLOTHES THE TWO "WHO" LISTS SHARE (round 19: Parties and People drawn
   alike): the head's title row, the card and its scroller and the paged
   foot's line. One string, put on both pages. Columns' own rules moved with
   Columns to js/views/listhead.js, and the labelled band and its find box
   went with the list head the Legora way (Part 8, 21 Oct 2026): the box, the
   tabs and the chips are the list head's own clothes (index.html). */
const CU_WHO_CSS = `
  /* the title at the card's top, as every page head (.ph-card, 19 Oct 2026): the row starts its items there;
     it is the card's title row (.ph-top), so the 12px and the hairline under it are the one rule every head wears */
  .sap-band > .cu-head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--s-3);flex-wrap:wrap;}
  .cu-hl{display:flex;align-items:baseline;gap:var(--s-3);min-width:0;flex:1 1 auto;}
  .cu-t{margin:0;font-family:var(--font-title);font-size:20px;font-weight:var(--w-title-serif);letter-spacing:-.01em;line-height:1.2;color:var(--color-text);white-space:nowrap;}
  .cu-t .cu-tn{margin-left:6px;font-size:var(--t-card);font-weight:var(--w-body);color:var(--color-neutral-600);font-variant-numeric:tabular-nums;}
  .cu-hs{font-size:var(--t-meta);color:var(--color-neutral-700);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .cu-acts{display:flex;align-items:center;gap:var(--s-2);flex:none;min-height:var(--ctl-h);}
  .cu-body{flex:1;min-height:0;}
  .cu-card{display:flex;flex-direction:column;min-height:0;}
  .is-ins .cu-card{overflow:hidden;}
  .cu-scroll{flex:1;min-height:0;overflow:auto;}
  /* "1–10 of 27 · Show 10 more" reads as one line at the foot's start */
  .ap-foot.cu-foot{justify-content:flex-start;gap:4px;flex-wrap:wrap;}
  .ap-foot.cu-foot .lh-range{white-space:nowrap;}
  /* Jambo's panel on Parties and People: the lead button keeps its own width; a section's count is the plain number every panel draws (.ins-sec h3 .n, Chambers) */
  :is(.cu-page,.dir-page) .ins-acts .ins-lead{flex:0 1 auto;}
`;
const CU_CSS = `
  .cu-page{height:var(--view-h);box-sizing:border-box;}
  .cu-page .sap-band{padding-top:var(--page-pad-t);display:flex;flex-direction:column;gap:0;}
  .cu-table td.n,.cu-table th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;}
  .cu-table td.quiet{color:var(--color-neutral-500);}
  .cu-table td.amber{color:var(--st-amber-fg);font-weight:var(--w-strong);}
  .cu-standing{display:inline-flex;align-items:center;gap:4px;font-weight:var(--w-label);font-size:13px;white-space:nowrap;}
  .cu-table .cu-day{display:block;line-height:18px;white-space:nowrap;}
  .cu-table .cu-soon{display:block;font-size:12px;line-height:16px;color:var(--st-amber-fg);font-weight:var(--w-label);white-space:nowrap;}
  .cu-table .cu-more{font-size:12px;color:var(--color-text);}
  .cu-table td.cu-stream{white-space:nowrap;overflow:hidden;}
  .cu-table tbody tr[data-cu-cust]:focus{outline:none;}
  .cu-table tbody tr.is-sel td{background:color-mix(in srgb,var(--color-accent) 8%,transparent);}
  .cu-table tbody tr.is-sel td:first-child{box-shadow:inset 2px 0 0 var(--accent-solid);}
  .cu-table .cu-pn{display:block;font-weight:var(--w-label);color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cu-table .cu-ps{display:block;font-size:var(--t-micro);color:var(--color-quiet);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  /* the first column as drawn (Part 8, the Legora way): the party's initials in the outlined square every list
     draws (.reg-av), the name over its line */
  .cu-table .cu-who{display:flex;align-items:center;gap:10px;min-width:0;}
  .cu-table .cu-who-t{display:block;min-width:0;flex:1 1 auto;}
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
  .cu-table td.cu-wait{white-space:nowrap;overflow:hidden;}
  .cu-table td.cu-wait .ls-word-v{white-space:normal;align-items:flex-start;line-height:17px;display:-webkit-inline-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;padding-left:14px;text-indent:-14px;}
  .cu-table td.cu-wait .ls-word-v i{display:inline-block;margin:0 7px 1px 0;vertical-align:middle;}
  .cu-wait-t{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;white-space:normal;line-height:1.3;}
  /* the drawn words are regular weight, amber or red (round 19) */
  .cu-table td.cu-wait.amber,.cu-table td.cu-wait.ruby{font-weight:var(--w-body);}
  .cu-wait-more{display:block;margin-top:2px;font-size:var(--t-meta);font-weight:var(--w-body);color:var(--color-neutral-500);}
  /* a need's line wraps whole in the panel ("Master services agreement · /
     waiting 4 days", round 19) */
  .cu-needs .cu-li-b span{white-space:normal;}
  .cu-table td.ruby{color:var(--st-ruby-fg);font-weight:var(--w-strong);}
  .cu-list{border:1px solid var(--color-divider);border-radius:var(--radius-lg);overflow:hidden;}
  .cu-li{display:flex;align-items:center;gap:var(--s-2);padding:8px 12px;border:0;border-top:1px solid var(--color-divider);background:var(--color-surface);text-align:left;font:inherit;color:inherit;width:100%;box-sizing:border-box;}
  .cu-li:first-child{border-top:0;}
  button.cu-li{cursor:pointer;} button.cu-li:hover{background:var(--surface-2);}
  .cu-li-b{display:flex;flex-direction:column;min-width:0;flex:1;}
  .cu-li-b b{font-weight:var(--w-label);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cu-li-b span{font-size:var(--t-micro);color:var(--color-quiet);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cu-li.is-late .cu-li-b b{color:var(--st-ruby-fg);}
  .cu-li-b span .late{color:var(--st-ruby-fg);}
  .cu-ag-st{flex:none;font-size:var(--t-meta);}
  .cu-pp-av{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:var(--w-label);background:transparent;color:var(--color-quiet);border:1px solid var(--rule-strong);}
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
    /* THE LIST LANGUAGE (owner, 27 Oct 2026: the other lists "the same way"): the party's stream as a
       soft chip and its standing as a mark and a word; Live, Ended and City are under Columns (the grey line
       counts, Standing says Ended, the panel says the city); Waiting has the room for its dot and words whole */
    /* NARROWED (owner, 28 Oct 2026: "make Customers … match contacts", picked "Tighten the columns"): Stream,
       Standing, Next to end and Waiting give up 86px between them, so the table's own floor (jlListMin) is under the mark
       and the panel slides over at the same spot as on People; Waiting's words take two lines (.cu-wait) */
    { k: 'stream', label: i18t('reg_col_stream'), w: 118 },
    { k: 'standing', label: i18t('cu_col_standing'), w: 100 },
    { k: 'city', label: i18t('cu_col_city'), w: 94 },
    { k: 'live', label: i18t('cu_col_live'), r: 1, w: 66 },
    /* 88 (Round 2): it holds a count but its head must read whole in Swedish ("Avslutade"); with Waiting's 22 it pays
       for On paper's whole sum (112, Round 1), so the row is as wide as before and fits at 1366 beside the panel */
    { k: 'ended', label: i18t('cu_col_ended'), r: 1, w: 88 },
    ...(money ? [{ k: 'paper', label: i18t('cu_col_paper'), r: 1, w: 112 }] : []),
    { k: 'next', label: i18t('cu_col_next_end'), w: 104 },
    /* the drawn short words ("an approval, for Jonas") on up to two lines (.cu-wait-t), the whole in its title */
    { k: 'waiting', label: i18t('cu_col_waiting'), w: 114 },
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
/* THE NUMBER ON A DOOR IS THE LIST BEHIND IT (Part 8, the list head the
   Legora way): a tab's number, and each choice "+ Filter" offers, is the rows
   the list would show with that one choice made and every other held — the
   list's own reading (cuRowsOf), never a second copy of its rules */
function cuRowsWith(o, all, ndas){
  const was = {};
  Object.keys(o || {}).forEach(k => { was[k] = _cu[k]; _cu[k] = o[k]; });
  try { return cuRowsOf(all || cuCustomers(), ndas || cuNdaMap()); } finally { Object.assign(_cu, was); }
}
/* the list's views, as the Status box offered them (round 19), now the tab
   row: All · Live · Ended; the list still opens on Live */
const CU_TABS = ['all', 'live', 'ended'];
const CU_NDA_KEYS = ['inforce', 'unconfirmed', 'none'];
/* THE PARTY'S STANDING, IN WORDS (the list language): live with a deal still being negotiated, live, or
   ended — over the same items the row counts (cuView), so the mark never disagrees with the numbers */
function cuStandingWords(v){
  const open = (v.active || []).some(c => c && c.negotiation && c.status !== 'Signed' && c.status !== 'Declined');
  return open ? { tone: 'amber', kind: 'part', k: 'cu_st_nego' } : (v.active || []).length ? { tone: 'green', kind: 'done', k: 'cu_st_live' } : { tone: 'gray', kind: 'todo', k: 'cu_st_ended' };
}
function cuCellHtml(k, r, v, ndas){
  if (k === 'agreements') return `<td class="n">${v.items.length}</td>`;
  if (k === 'since'){ const d = cuSinceOf(v.items); return d ? `<td>${_cuE(cuMonthYear(d, true))}</td>` : `<td class="quiet">—</td>`; }
  if (k === 'stream'){
    const f = v.streams[0]; if (!f || typeof listChipHtml !== 'function') return `<td class="quiet">—</td>`;
    const short = (typeof STREAM_SHORT === 'object' && STREAM_SHORT && STREAM_SHORT[f]) || cuStreamName(f);
    const more = v.streams.length > 1 ? ` <span class="cu-more">+${v.streams.length - 1}</span>` : '';
    return `<td class="cu-stream" title="${_cuE(v.streams.map(cuStreamName).join(' · '))}">${listChipHtml(listStreamTone(f), short)}${more}</td>`;
  }
  if (k === 'standing'){
    const w = cuStandingWords(v);
    return `<td><span class="cu-standing" style="color:var(--st-${w.tone}-fg)">${typeof listMarkHtml === 'function' ? listMarkHtml(w.tone, w.kind) : ''}${_cuE(i18t(w.k))}</span></td>`;
  }  if (k === 'city'){ const city = partyCityOf(r.key); return `<td class="cu-city${city ? '' : ' quiet'}"${city ? ` title="${_cuE(city)}"` : ''}>${_cuE(city || '—')}</td>`; }
  if (k === 'live') return `<td class="n${v.active.length ? '' : ' quiet'}">${v.active.length || '—'}</td>`;
  if (k === 'ended') return `<td class="n${v.expired.length ? '' : ' quiet'}">${v.expired.length || '—'}</td>`;
  if (k === 'paper'){ const ov = cuMoneyWords(v.active); return `<td class="n${ov ? '' : ' quiet'}">${_cuE(ov || '—')}</td>`; }
  if (k === 'next'){
    if (!v.next) return `<td class="quiet">—</td>`;
    /* how close, in amber, once it is within the renewal window (90 days, the Contracts list's own) */
    const d = (typeof daysUntil === 'function') ? daysUntil(v.next) : null;
    const soon = d != null && d >= 0 && d <= 90 ? `<span class="cu-soon">${_cuE(i18tn('reg_ends_in', d, { n: d }))}</span>` : '';
    return `<td><span class="cu-day">${_cuE(cuDay(v.next))}</span>${soon}</td>`;
  }
  if (k === 'waiting'){
    /* the first, whole, as drawn ("an approval, for Jonas"); any more on a
       quiet line under it, the way the Party and NDA cells carry a second line */
    const ws = v.needs.length ? cuNeedShort(v.needs[0]) : '', wAll = v.needs.map(cuNeedTitle).join(' · '), wLate = v.needs.some(x => x.it.urgent);
    const more = v.needs.length > 1 ? `<span class="cu-wait-more">${_cuE(i18t('cu_pp_more', { n: v.needs.length - 1 }))}</span>` : '';
    /* a reading in words (the list language): a dot and the first, in its tone; the rest under it */
    if (ws && typeof listWordHtml === 'function') return `<td class="cu-wait" title="${_cuE(wAll)}"><span class="cu-wait-t">${listWordHtml(wLate ? 'ruby' : 'amber', ws, v.needs.length > 1 ? i18t('cu_pp_more', { n: v.needs.length - 1 }) : '')}</span></td>`;
    return `<td class="cu-wait${ws ? (wLate ? ' ruby' : ' amber') : ' quiet'}"${ws ? ` title="${_cuE(wAll)}"` : ''}><span class="cu-wait-t">${_cuE(ws || '—')}</span>${more}</td>`;
  }
  if (k === 'nda') return `<td class="cu-nda-td">${cuNdaCellHtml(cuNdaOf(r.key, ndas))}</td>`;
  return '<td></td>';
}
/* the columns that hold nothing for any row in the list: a dash in every row says nothing */
function cuEmptyCols(rows, ndas){
  const L = rows || [];
  if (L.length < 2) return [];
  const out = [];
  if (L.every(r => !partyCityOf(r.key))) out.push('city');
  if (L.every(r => !cuView(r).expired.length)) out.push('ended');
  if (L.every(r => { const n = cuNdaOf(r.key, ndas); return !n || n.state === 'none'; })) out.push('nda');
  return out;
}
/* THE LIST, ITS CARD: the table of the parties the head's words, tab and
   chips leave, ten at a time, and the foot */
function cuCardOf(all, ndas){
  const rows = cuRowsOf(all, ndas);
  /* ONE PAGE AT A TIME, the cap said ("1–10 of 27 · Show 10 more"); the
     party in the panel is always among the rows drawn */
  const sel = (typeof insSelected === 'function') ? insSelected('customers') : null;
  const at = sel ? rows.findIndex(r => r.key === sel) : -1;
  const shown = Math.min(rows.length, Math.max(_cu.shown || CU_PAGE, at + 1));
  const cols = cuColDefs(), byK = Object.fromEntries(cols.map(c => [c.k, c]));
  /* A COLUMN EMPTY FOR EVERYONE STEPS OUT (Round 2, owner's yes 24 Oct 2026): City, Ended and NDA, while no
     party in the list has one (two rows or more); each comes back the day one is filled (cuEmptyCols) */
  const empty = cuEmptyCols(rows, ndas);
  const keys = lcShown('customers', cols.map(c => c.k)).filter(k => !empty.includes(k));
  /* how the list is sorted rides the first column's head (round 19 said it
     on the card's own head, which the list head the Legora way replaced) */
  /* ROOM TO SPREAD (owner, 28 Oct 2026): where the list has the room, the grey line's two facts are
     columns of their own — Agreements and With us since — and the name stands alone. THE LIST'S COLUMNS
     (owner, 28 Oct 2026, listCols): Party and Waiting on you always stand; where the room is short NDA steps
     aside first, then Next to end, Stream, On paper, Standing; a column the reader chose under Columns (City,
     Live, Ended) steps aside last — the reader's own choice wins */
  const SPREAD = [{ k: 'agreements', label: i18t('cu_col_agreements'), r: 1, w: 108, spread: 1 }, { k: 'since', label: i18t('cu_col_since'), w: 124, spread: 1 }];
  const CU_RANK = { nda: 1, next: 2, stream: 3, paper: 4, standing: 5, city: 6, live: 6, ended: 6 };
  const DEFS = [{ k: 'name' }, ...SPREAD, ...keys.map(k => Object.assign({}, byK[k], { rank: CU_RANK[k] }))];
  const FIT = typeof listCols === 'function' ? listCols('customers', DEFS, cuRepaint) : { cols: DEFS.filter(d => !d.spread), spread: false };
  const spread = FIT.spread;
  const fitW = Object.fromEntries(FIT.cols.map(c => [c.k, c]));
  SPREAD.forEach(c => { byK[c.k] = c; });
  keys.splice(0, keys.length, ...FIT.cols.slice(1).map(c => c.k));
  const head = [{ k: 'name', t: i18t('cu_col_customer'), title: i18t('cu_list_sort'), w: fitW.name && fitW.name.w, name: true }, ...keys.map(k => ({ t: byK[k].label, r: byK[k].r, w: fitW[k].w, spread: byK[k].spread, rank: fitW[k].rank, k }))];
  const body = rows.slice(0, shown).map(r => {
    const v = cuView(r);
    /* the grey line (the list language): how many agreements, and since when — the streams are their own column now */
    const since = cuSinceOf(v.items);
    const sub = spread ? '' : [i18tn('cu_n_agreements', v.items.length, { n: v.items.length }), since ? i18t('cu_since', { d: cuMonthYear(since, true) }) : ''].filter(Boolean).join(' · ');
    return `<tr data-cu-cust="${_cuE(r.key)}" tabindex="-1">
      <td><span class="cu-who">${cuAvHtml(r.name)} <span class="cu-who-t"><span class="ap-name cu-pn" title="${_cuE(r.name)}">${_cuE(r.name)}</span> ${sub ? `<span class="ap-sub cu-ps" title="${_cuE(sub)}">${_cuE(sub)}</span>` : ''}</span></span></td>
      ${keys.map(k => cuCellHtml(k, r, v, ndas)).join('')}
    </tr>`;
  }).join('');
  const table = rows.length
    ? `<table class="ap-table ap-ins cu-table" data-list-seat="customers"><colgroup>${head.map(c => typeof listColTag === 'function' ? listColTag(c) : `<col${c.w ? ` style="width:${c.w}px"` : ''}>`).join('')}</colgroup><thead><tr>${
      head.map(h => `<th${h.r ? ' class="n"' : ''}${h.k && h.k !== 'name' ? ` data-cu-col="${_cuE(h.k)}"` : ''}${h.title ? ` title="${_cuE(h.title)}"` : ''}>${_cuE(h.t)}${typeof listGripHtml === 'function' ? listGripHtml('customers', h.k) : ''}</th>`).join('')}</tr></thead><tbody id="cu-tbody">${body}</tbody></table>`
    : `<div class="ap-empty">${_cuE(all.length ? i18t('cu_none_match') : i18t('cu_none_yet'))}</div>`;
  const foot = rows.length ? [lhFootHtml('customers', shown, rows.length, CU_PAGE), cuPartFoot()].filter(Boolean).join('') : cuPartFoot();
  return cuCardHtml({ seat: 'customers', id: 'cu-scroll', table, foot });
}
function cuListHtml(INS){
  const book = cuBook();
  const all = cuCustomers(book);
  const ndas = cuNdaMap();
  const standing = { live: 0, ended: 0 };
  all.forEach(r => { standing[cuStanding(r)]++; });
  /* a status that holds nobody is not offered; the list then shows them all */
  if (_cu.status !== 'all' && !standing[_cu.status]) _cu.status = 'all';
  const money = cuMoney();
  const activeAll = book.filter(c => cuBucket(c) === 'active');
  const loc = (typeof jxLocale === 'function') ? jxLocale() : undefined;
  const headSub = money ? (v => v ? i18t('cu_head_on_paper', { v }) : '')(cuMoneyWords(activeAll)) : '';
  const card = cuCardOf(all, ndas);
  /* THE HEAD, THE LEGORA WAY (Part 8, the owner's pick, 21 Oct 2026): the
     title row as it was (the name and every party counted, the money on
     paper, "+ Draft new agreement" at its right), then the list head's one
     box, the views as tabs and the filters a reader added as chips —
     round 19's labelled band (each word above its box) is gone */
  const top = `<div class="cu-head ph-top">
        <div class="cu-hl"><h1 class="cu-t">${_cuE(i18t('nav_customers'))}<span class="cu-tn">${_cuE(Number(all.length).toLocaleString(loc))}</span></h1>${headSub ? `<span class="cu-hs page-facts">${_cuE(headSub)}</span>` : ''}</div>
        <div class="cu-acts"><button type="button" class="hm-primary" data-cu-draft="">${(typeof icon === 'function') ? icon('plus', 'w-3.5 h-3.5', 2) : ''} ${_cuE(i18t('home_draft_new'))}</button></div>
      </div>`;
  return `${lhHtml('customers', { frame: 'card', top })}
    ${INS ? `<div class="ap-body is-ins cu-body">${card}<aside id="ins-panel" class="ins-panel" aria-label="${_cuE(i18t('ins_panel_label'))}"></aside></div>`
      : `<div class="cu-body">${card}</div>`}`;
}
/* THE LIST HEAD'S FILTERS (Part 8): Stream, Owner and NDA, each a chip once
   a reader adds it ("+ Filter"), each choice counted with the rows it leaves
   (cuRowsWith) — a choice that leaves nobody is not offered. The choices are
   what the book holds: every stream and owner on a party's contract, the
   NDA's three standings. */
function cuHeadFilters(all, ndas){
  const book = cuBook();
  const n = (k, v) => cuRowsWith({ [k]: v }, all, ndas).length;
  const streams = [...new Set(book.map(c => c.folder).filter(f => f && cuStreamName(f)))]
    .sort((a, b) => cuStreamName(a).localeCompare(cuStreamName(b)));
  const owners = [...new Set(book.map(c => (typeof contractOwnerName === 'function' && contractOwnerName(c)) || '').filter(Boolean))].sort();
  return [
    { k: 'stream', label: i18t('reg_chip_stream'), title: i18t('reg_value_stream'), cur: _cu.stream, def: 'all', opts: streams.map(f => [f, cuStreamName(f), n('stream', f)]) },
    { k: 'owner', label: i18t('cu_owner'), cur: _cu.owner, def: 'all', opts: owners.map(o => [o, o, n('owner', o)]) },
    { k: 'nda', label: i18t('cu_col_nda'), title: i18t('cu_nda_filter_title'), cur: _cu.nda, def: 'all', opts: CU_NDA_KEYS.map(k => [k, i18t('cu_nda_f_' + k), n('nda', k)]) },
  ];
}
/* the rows alone, drawn again under the head as the words are typed (the
   list head's setQuery): the box, its caret and the tabs are not touched */
function cuRowsRepaint(){
  const host = (typeof document !== 'undefined') ? document.getElementById('content') : null;
  const page = host && host.querySelector('.cu-page');
  const old = page && page.querySelector('.cu-card');
  if (!old || (typeof state !== 'undefined' && state.view !== 'customers')){ cuRepaint(); return; }
  const tmp = document.createElement('div');
  tmp.innerHTML = cuCardOf(cuCustomers(), cuNdaMap());
  const card = tmp.firstElementChild;
  if (!card){ cuRepaint(); return; }
  old.replaceWith(card);
  cuWireList(host, page.getAttribute('data-ins') === '1');
}
/* Columns, Show more and the head, the list head's own registries
   (js/views/listhead.js): the page says, at its own render, what it draws,
   what it counts and how it draws again — every press ends in this page's
   own state (_cu), its own repaint and its own place store */
function cuLcReg(){
  LC_PAGES.customers = { cols: () => cuColDefs().map(c => ({ k: c.k, label: c.label })), repaint: () => cuRepaint(), hide: ['live', 'ended', 'city'],
    /* a column stepped out for being empty is greyed in Columns with why, never a live tick that draws nothing */
    off: () => { const all = cuCustomers(), ndas = cuNdaMap(); return Object.fromEntries(cuEmptyCols(cuRowsOf(all, ndas), ndas).map(k => [k, i18t('cu_col_empty')])); } };
  const save = () => { if (typeof placeSave === 'function') placeSave(); };
  lhRegister('customers', {
    noun: 'parties',
    total: () => cuCustomers().length,
    q: () => _cu.q,
    setQuery: w => { _cu.q = String(w == null ? '' : w); _cu.shown = 0; cuRowsRepaint(); },
    boxId: 'cu-q',
    tabAttr: 'data-cu-status', tabsLabel: i18t('cu_status'),
    tabs: () => { const all = cuCustomers(), ndas = cuNdaMap();
      return CU_TABS.map(k => ({ k, label: i18t('cu_status_' + k), n: cuRowsWith({ status: k }, all, ndas).length, keep: k === 'all' })); },
    tabNow: () => _cu.status,
    tab: k => { _cu.status = CU_TABS.includes(k) ? k : 'live'; _cu.shown = 0; cuRepaint(); save(); },
    filters: () => cuHeadFilters(cuCustomers(), cuNdaMap()),
    apply: patch => {
      Object.keys(patch || {}).forEach(k => {
        const v = String(patch[k] == null ? '' : patch[k]);
        if (k === 'nda') _cu.nda = CU_NDA_KEYS.includes(v) ? v : 'all';
        else if (k === 'stream' || k === 'owner') _cu[k] = v || 'all';
      });
      _cu.shown = 0; cuRepaint(); save();
    },
    more: () => { _cu.shown = Math.max(_cu.shown || CU_PAGE, CU_PAGE) + CU_PAGE; cuRepaint(); },
  });
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
  return one && y ? i18t('cu_live_one_ended', { name: one.name || cuDay(cuEnds(one)), y }) : i18t('cu_live_none', { n: v.expired.length });
}
function cuNextSay(v){
  if (!v.next) return '';
  const c = v.items.find(x => x.status === 'Signed' && cuBucket(x) === 'active' && cuEnds(x) === v.next);
  return [cuDay(v.next), c && c.name].filter(Boolean).join(' · ');
}
/* THE PAGE IN JAMBO'S WORDS (nothing chosen): the list's own count — the
   number the lit tab says — what waits on the reader and the live parties
   without an NDA; each chip is one of the list head's own choices ("no NDA"
   stands as the NDA chip, "all parties" lights the All tab). Counted, no
   Jambo call. */
function cuSay(){
  const all = cuCustomers(), ndas = cuNdaMap();
  const rows = cuRowsOf(all, ndas);
  if (!all.length) return { lines: [_cuE(i18t('cu_none_yet'))] };
  const live = rows.filter(r => cuStanding(r) === 'live').length;
  const views = rows.map(cuView);
  const waiting = views.filter(v => v.needs.length).length;
  const noNda = rows.filter(r => cuStanding(r) === 'live' && cuNdaOf(r.key, ndas).state === 'none').length;
  const lines = [`<b>${_cuE(i18tn('cu_say', rows.length, { n: rows.length }))}</b>${_cuE(': ' + i18t('cu_say_live', { n: live }))}.`];
  if (waiting) lines.push(_cuE(i18tn('cu_say_waiting', waiting, { n: waiting }) + '.'));
  if (noNda) lines.push(_cuE(i18tn('cu_say_no_nda', noNda, { n: noNda }) + '.'));
  const chips = [];
  const set = (k, val) => () => { _cu[k] = val; _cu.shown = 0; cuRepaint(); if (typeof placeSave === 'function') placeSave(); };
  if (noNda && _cu.nda !== 'none') chips.push({ label: i18t('cu_say_chip_no_nda'), run: set('nda', 'none') });
  if (_cu.status !== 'all') chips.push({ label: i18t('cu_say_chip_all'), run: set('status', 'all') });
  return { lines, chips };
}
/* ---- BEFORE THE CALL: THE PARTY'S TWO MINUTES (Discover stage 9, owner 25 Oct 2026) ----
   Under the party's facts: how they negotiated (their asks we gave or held, by
   clause), the company facts' answers side by side, counted free by the server
   (GET /api/parties/brief); and the two-minute brief — kept, free; or one call
   on a press, said first, figures checked (POST /api/ai/party-brief). */
const _cuBrief = {};
let _cuBriefBusy = null;
function cuBriefLoad(r){
  const k = r.key; if (_cuBrief[k] !== undefined) return;
  /* no server (this browser alone, or a stage with none): the section has nothing to count and says nothing */
  if (typeof api !== 'function' || (typeof API_MODE === 'function' && !API_MODE())){ _cuBrief[k] = {}; return; }
  _cuBrief[k] = null;
  api('parties/brief?name=' + encodeURIComponent(r.name)).then(x => { _cuBrief[k] = x || {}; cuBriefPaint(k); }, () => { _cuBrief[k] = {}; cuBriefPaint(k); });
}
function cuBriefPaint(k){
  const host = document.querySelector(`[data-cu-brief-for="${CSS.escape(k)}"]`);
  if (host) host.innerHTML = cuBriefInner(k);
}
function cuBriefInner(k){
  const x = _cuBrief[k]; if (!x || !x.facts) return '';
  const F = x.facts, may = (typeof canEdit !== 'function') || !!canEdit();
  const neg = (F.negotiated || []).slice(0, 3).map(n => `<li>${_cuE(i18t('cu_br_neg', { clause: n.clause, gave: n.gave, held: n.held }))}</li>`).join('');
  const facts = (F.facts || []).map(f => `<li><b>${_cuE(f.fact)}</b>: ${f.answers.map(a => `<span class="${a.risk ? 'cu-br-risk' : ''}">${_cuE(a.ref)} ${_cuE(a.answer)}</span>`).join(' · ')}</li>`).join('');
  const b = x.brief, busy = _cuBriefBusy === k;
  /* HIS WORDS IN HIS CARD (the owner picked "Jambo's card", 26 Oct 2026): the
     two minutes ran as a paragraph under a small grey heading and was missed.
     The same builder as the approver's "In plain words" dresses it. */
  const brief = b
    ? jamboSayCardHtml({ who: i18t('cu_br_two_h'), attrs: ' data-cu-br-say',
        html: `<p class="cu-br-text">${_cuE(b.text)}</p>`,
        foot: `${b.unchecked && b.unchecked.length ? `<p class="cu-br-warn">${_cuE(i18t('cu_br_unchecked', { figs: b.unchecked.join(', ') }))}</p>` : ''}<p class="cu-br-note">${_cuE(i18t(b.unchecked && b.unchecked.length ? 'cu_br_kept_only' : 'cu_br_kept'))}</p>` })
    : may ? jamboSayAskHtml({ attrs: ' data-cu-br-say', body: `<p>${_cuE(i18t('cu_br_none'))}</p>`,
        foot: `<button type="button" class="ui-btn ui-btn-sm" data-cu-brief="${_cuE(k)}"${busy ? ' disabled' : ''}>${_cuE(i18t(busy ? 'cu_br_busy' : 'cu_br_write'))}</button><small>${_cuE(i18t(x.stale ? 'cu_br_cost_stale' : 'cu_br_cost'))}</small>` })
    : `<p class="ins-note">${_cuE(i18t('cu_br_viewer'))}</p>`;
  const body = `<div class="cu-br">${neg ? `<p class="cu-br-k">${_cuE(i18t('cu_br_neg_h'))}</p><ul class="cu-br-list">${neg}</ul>` : `<p class="ins-note">${_cuE(i18t('cu_br_neg_none'))}</p>`}
    ${facts ? `<p class="cu-br-k">${_cuE(i18t('cu_br_facts_h'))}</p><ul class="cu-br-list">${facts}</ul>` : ''}
    ${brief}</div>`;
  /* the section, heading and all, only once there is something counted to say */
  return (typeof insSecHtml === 'function') ? insSecHtml(i18t('cu_br_h'), '', body, 'cu-brief') : body;
}
function cuBriefSecHtml(r){
  cuBriefLoad(r);
  return `<div class="cu-br-host" data-cu-brief-for="${_cuE(r.key)}">${cuBriefInner(r.key)}</div>`;
}
async function cuBriefWrite(k){
  const x = _cuBrief[k]; if (!x || !x.facts || _cuBriefBusy) return;
  _cuBriefBusy = k; cuBriefPaint(k);
  try {
    const r = await api('ai/party-brief', 'POST', { name: x.facts.name });
    if (r && r.brief){ x.brief = r.brief; x.stale = false; }
    if (typeof toast === 'function') toast(i18t('cu_br_done'), 'ok');
  } catch (e){
    if (typeof toast === 'function') toast(e && (e.needsKey || e.kind === 'noKey') ? i18t('ac_nokey') : i18t('cu_br_err', { msg: (e && e.message) || '' }), 'err');
  } finally { _cuBriefBusy = null; cuBriefPaint(k); }
}
if (typeof document !== 'undefined' && !document._cuBriefWired){
  document._cuBriefWired = true;
  document.addEventListener('click', e => { const b = e.target && e.target.closest ? e.target.closest('[data-cu-brief]') : null; if (!b) return; e.preventDefault(); cuBriefWrite(b.getAttribute('data-cu-brief')); });
}
function cuPaintCustomerPanel(tb){
  const seat = 'customers';
  const idOf = r => r.getAttribute('data-cu-cust');
  /* no row left (the words or a chip leave nobody): the panel says the page,
     never a party the list no longer shows */
  const id = tb ? insPick(seat, [...tb.querySelectorAll('[data-cu-cust]')].map(idOf)) : null;
  if (tb) insMarkRow(tb, '[data-cu-cust]', idOf, id);
  const paint = key => {
    const r = key ? cuView(cuCustomerOf(key)) : null;
    if (!r){ _cu.edit = null; insPaintPanel({ seat, c: null, item: null, empty: i18t('cu_panel_none'), jlHome: i18t('nav_customers'), jlPh: i18t('jl_ph_any'), jlSay: cuSay }); return; }
    if (_cu.edit && _cu.edit !== r.key) _cu.edit = null;
    /* the new look (round 6, as drawn): the party in one sentence, its own facts, its doors, Jambo's remark */
    if (typeof window.newLookOn === 'function' && newLookOn()){
      insPaintPanel({ seat, jlWord: i18t('jl_w_party'), jlHome: i18t('nav_customers'), jlPh: i18t('jl_ph_any'), jlSay: cuSay, item: { id: r.key }, head: false,
        body: (_cu.edit === r.key ? cuPrFormHtml(r) : '') + cunPanelHtml(r) });
      return;
    }
    const may = partyRecordMay();
    const org = partyOrgNoOf(r.key);
    const orgHtml = org ? `${_cuE(org)}${may ? ` <button type="button" class="ui-link cu-org-go" data-cu-pr-edit="${_cuE(r.key)}">${_cuE(i18t('cu_pr_change'))}</button>` : ''}`
      : `<span class="cu-none">${_cuE(i18t('cu_org_none'))}</span>${may ? ` <button type="button" class="ui-link cu-org-go" data-cu-pr-edit="${_cuE(r.key)}">${_cuE(i18t('cu_pr_add'))}</button>` : ''}`;
    /* a fact with nothing in it is left out, as drawn (Kettle & Co: Owner ·
       Live agreements · NDA); the city's door in the line under the name
       opens the organisation no. too */
    const next = cuNextSay(r);
    const rows = (typeof insRowsHtml === 'function') ? insRowsHtml([
      ...(org ? [{ k: 'org', label: i18t('cu_f_org'), v: orgHtml }] : []),
      { k: 'owner', label: i18t('cu_owner'), v: _cuE(cuOwnerSay(r.items)) },
      { k: 'live', label: i18t('cu_f_live'), v: _cuE(cuLiveSay(r)) },
      ...(next ? [{ k: 'next', label: i18t('cu_col_next_end'), v: _cuE(next) }] : []),
      { k: 'nda', label: i18t('cu_col_nda'), v: cuNdaFactHtml(cuNdaOf(key), r.name) },
    ]) : '';
    const people = (typeof dirPeopleOfParty === 'function') ? dirPeopleOfParty(r.key) : [];
    const short = cuShortName(r.name);
    const sec = (t, n, b, cls) => (typeof insSecHtml === 'function' ? insSecHtml(t, n, b, cls) : '');
    /* Jambo's panel (round 19): it holds a party */
    insPaintPanel({ seat, jlWord: i18t('jl_w_party'), jlHome: i18t('nav_customers'), jlPh: i18t('jl_ph_any'), jlSay: cuSay, item: { id: r.key }, head: {
        title: r.name, sub: cuPanelSubHtml(r),
        acts: [{ k: 'open', kind: 'accent', label: i18t('cu_open_customer'), run: x => cuOpenCustomer(x.id) },
          { k: 'explorer', label: i18t('cu_open_explorer'), run: x => cuOpenExplorer(x.id) }] },
      body: (_cu.edit === r.key ? cuPrFormHtml(r) : '') + rows
        + (r.needs.length ? sec(i18t('cu_col_waiting'), r.needs.length, cuPanelNeedsHtml(r.needs), 'cu-needs') : '')
        /* BEFORE THE CALL (Discover stage 9): how they negotiate, the company facts side by side, the two minutes */
        + cuBriefSecHtml(r)
        /* AS DRAWN FOR A PARTY WITH NOTHING LIVE (Kettle & Co): Live agreements
           already names what ended, so no list repeats it; and where a
           colleague's request about them waits, that request is the way to
           draft for them (one door), so "Draft an agreement with …" is not
           offered beside it */
        + (r.active.length ? sec(i18t('cu_panel_agreements'), r.items.length, cuPanelAgreementsHtml(r.items), 'cu-ags') : '')
        + (people.length ? sec(i18t('cu_people_at', { party: short }), people.length, cuPanelPeopleHtml(people, r), 'cu-people') : '')
        + (r.needs.some(x => x.it.kind === 'request') ? '' : `<div class="cu-draft-with"><button type="button" class="ui-btn" data-cu-draft-with="${_cuE(r.key)}">${_cuE(i18t('cu_draft_with', { party: short }))}</button></div>`) });
  };
  paint(id);
  if (!tb) return;
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
      if (x.it.kind === 'move'){ const w = (typeof regNegoCols === 'function') ? regNegoCols(x.c).waiting : ''; if (w && w !== '—'){ line = i18t('cu_need_waiting', { days: w }); late = !!x.it.urgent; } }
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
  const a = t.closest('[data-cu-ag]'); if (a){ cuOpenAgreement(a.getAttribute('data-cu-ag')); return; }
  /* a person at the party: the People page, that person chosen and lit */
  const pp = t.closest('[data-cu-pp]'); if (pp){ if (typeof dirOpenPerson === 'function') dirOpenPerson(pp.getAttribute('data-cu-pp')); return; }
  const dw = t.closest('[data-cu-draft-with]'); if (dw){ const v = cuCustomerOf(dw.getAttribute('data-cu-draft-with')); if (v) cuDraftFor(v.name); }
});

/* ---- THE PAGE ---- */
/* ---- PARTIES, AS DRAWN (the new look, round 6) ----
   One list: the party (its city, organisation no. and streams under it), how many deals, the money on paper, where the
   newest live deal stands, the NDA (signed with its year, confirmed, or none), and what waits on you in words, late in
   red, with Open party on the row. Tabs All · Waiting on you · NDA missing. Every reading is the page's own (cuView,
   cuNdaMap, partyRecordOf); the row's press is the list's own (cuWireList). Reads only. */
let _cun = 'all';
const CUN_WORDS = { suggest:'ctf_n_suggest', quiet:'ctf_n_quiet', join:'ctf_n_join' };
/* THE PARTY'S PANEL, AS DRAWN (round 6): how much of your signed money they hold and when it ends, THE PARTY'S OWN
   FACTS (the record's city and organisation no., the person who last signed for them, the NDA), DOORS (Open party,
   the web search with its cost, Edit the party record) and Jambo's one remark (the NDAs missing where paper is live).
   Every figure a reading the page already makes; nothing is asked of the AI. */
function cunPanelHtml(r){
  const E = _cuE, money = !(typeof canViewValues === 'function' && !canViewValues());
  const signedVal = cs => cs.filter(c => c.status === 'Signed' && !c.archived).reduce((s, c) => { try { const h = (typeof fxHome === 'function') ? fxHome(c) : { v: Number(c.value) || 0 }; return s + ((typeof fxIsPay === 'function' && fxIsPay(c)) || h.missing ? 0 : (Number(h.v) || 0)); } catch (_){ return s; } }, 0);
  const mine = signedVal(r.items), all = signedVal((state.contracts || []).filter(c => c && !c._codeNamed));
  const pct = money && all > 0 && mine > 0 ? Math.round(mine / all * 100) : 0;
  const next = cuNextSay(r);
  const head = [pct ? i18tn('cun_p_head', r.items.length, { name: r.name, pct, n: r.items.length }) : i18tn('cun_p_head_n', r.items.length, { name: r.name, n: r.items.length }),
    next ? i18t('cun_p_next', { next }) : ''].filter(Boolean).join(' ');
  const rec = (typeof partyRecordOf === 'function' && partyRecordOf(r.key)) || {};
  const people = (typeof dirPeopleOfParty === 'function') ? dirPeopleOfParty(r.key) : [];
  const signer = people.find(p => p && p.signs) || people[0] || null;
  const nda = cuNdaOf(r.key);
  const ndaV = !nda || nda.state === 'none' ? i18t('cu_nda_none') : nda.state === 'inforce' && nda.c && nda.c.signedAt ? i18t('cun_p_nda_signed', { d: cuDay(String(nda.c.signedAt).slice(0, 10)) }) : i18t('cun_nda_conf');
  const row = (l, v, src) => `<div class="pd2-ch-r"><span>${E(l)}</span><b>${E(v)}</b><i>${E(src)}</i></div>`;
  const facts = [rec.city ? row(i18t('cun_p_city'), rec.city, i18t('cun_p_src_rec')) : '', row(i18t('cun_p_org'), rec.orgNo || i18t('cu_org_none'), rec.orgNo ? i18t('cun_p_src_rec') : ''),
    signer ? row(i18t('cun_p_signer'), [signer.name, signer.title].filter(Boolean).join(', '), i18t('cun_p_src_link')) : '',
    row(i18t('cu_col_nda'), ndaV, nda && nda.c && typeof contractRef === 'function' ? contractRef(nda.c) : '')].join('');
  const lead = r.items.find(c => !c.archived) || r.items[0];
  const short = cuShortName(r.name);
  const door = (attr, w, cost) => `<div class="pd2-ch-door"><button type="button" class="rfp-a" ${attr}>${E(w)}</button><span>${E(cost)}</span></div>`;
  const doors = door(`data-cun-open="${E(r.key)}"`, i18tn('cun_p_open', r.items.length, { n: r.items.length }), i18t('pd2_ch_free'))
    + (lead && typeof partyWebOpen === 'function' && typeof partyLookupMay === 'function' && partyLookupMay() ? door(`data-cun-web="${E(lead.id)}"`, i18t('cun_p_web', { name: short }), i18t('cun_p_web_cost')) : '')
    + (typeof partyRecordMay === 'function' && partyRecordMay() ? door(`data-cu-pr-edit="${E(r.key)}"`, i18t('cun_p_edit'), i18t('pd2_ch_free')) : '');
  /* his remark: the parties with live paper and no NDA on file */
  const map = cuNdaMap(), live = (typeof cuCustomers === 'function' ? cuCustomers() : []).map(x => cuView(x)).filter(Boolean)
    .filter(v => v.items.some(c => !c.archived && c.status !== 'Signed' && c.status !== 'Declined') && ['none', 'ended'].includes((map.get(v.key) || { state: 'none' }).state));
  const names = live.map(v => cuShortName(v.name));
  const say = names.length ? i18tn('cun_p_jambo', names.length, { n: names.length, list: (() => { try { return new Intl.ListFormat((typeof langLocale === 'function') ? langLocale() : undefined, { type: 'conjunction' }).format(names.slice(0, 3)); } catch (_){ return names.slice(0, 3).join(i18t('cun_p_and')); } })() }) : '';
  const turn = say ? `<div class="pd2-turn"><i class="pd2-jface" aria-hidden="true"></i><div><b>${E(i18t('cn2_jambo'))}</b><p>${E(say)}</p></div></div>` : '';
  return `<div class="pd2-chosen cun-panel"><p class="pd2-ch-head">${E(head)}</p><div class="pd2-ch-cap">${E(i18t('cun_p_facts'))}</div><div class="pd2-ch-tbl">${facts}</div><div class="pd2-ch-cap">${E(i18t('pd2_ch_doors'))}</div>${doors}${turn}</div>`;
}
if (typeof document !== 'undefined' && !document._cunPanelWired){ document._cunPanelWired = true;
  document.addEventListener('click', e => { const b = e.target && e.target.closest ? e.target.closest('[data-cun-web]') : null; if (!b) return; e.preventDefault(); if (typeof partyWebOpen === 'function') partyWebOpen(b.getAttribute('data-cun-web')); });
}
function cunRowHtml(v, nda){
  const rec = (typeof partyRecordOf === 'function' && partyRecordOf(v.key)) || {};
  const org = rec.orgNo ? i18t('cun_org', { n: rec.orgNo }) : i18t('cun_org_none');
  const sub = [rec.city || '', org, v.streams.map(f => (typeof STREAM_SHORT === 'object' && STREAM_SHORT && STREAM_SHORT[f]) || (typeof cuStreamName === 'function' ? cuStreamName(f) : f)).filter(Boolean).join(', ')].filter(Boolean).join(' · ');
  const money = !(typeof canViewValues === 'function' && !canViewValues());
  const val = v.items.reduce((s, c) => { try { const h = (typeof fxHome === 'function') ? fxHome(c) : { v: Number(c.value) || 0 }; return s + ((typeof fxIsPay === 'function' && fxIsPay(c)) || h.missing ? 0 : (Number(h.v) || 0)); } catch (_){ return s; } }, 0);
  const lead = v.items.filter(c => !c.archived).sort((a, b) => String(b.updatedAt || b.lastAction || '').localeCompare(String(a.updatedAt || a.lastAction || '')))[0] || v.items[0];
  let sm = null; try { sm = lead && typeof contractStatusMeta === 'function' ? contractStatusMeta(lead) : null; } catch (_){ sm = null; }
  const stand = sm ? `<span class="cun-st"><i style="background:${sm.dot}"></i>${esc(sm.label || '')}</span>` : '—';
  const n = nda || { state: 'none' };
  const yr = n.c && n.c.signedAt ? String(n.c.signedAt).slice(0, 4) : '';
  const ndaW = n.state === 'inforce' ? (yr ? i18t('cun_nda_signed', { y: yr }) : i18t('cun_nda_conf')) : n.state === 'unconfirmed' ? i18t('cun_nda_conf') : n.state === 'ended' ? i18t('cun_nda_ended') : n.state === 'draft' ? i18t('cun_nda_draft') : i18t('cun_nda_none');
  const ndaH = `<span class="cun-st${n.state === 'none' || n.state === 'ended' ? ' is-none' : ''}"><i></i>${esc(ndaW)}</span>`;
  const needs = (v.needs || []).filter(x => x && x.it);
  const verb = x => { const k = x.it.kind, n = x.it.n || 1;
    return k === 'approval' ? i18t('cun_w_approve', { name: x.c.name || '' }) : k === 'sign' ? i18t('cun_w_sign') : k === 'details' ? i18tn('cun_w_details', n, { n })
      : k === 'move' ? i18t('cun_w_move') : k === 'look' ? i18t('cun_w_look') : k === 'note' ? i18t('cun_w_note') : k === 'review' ? i18t('cun_w_review') : k === 'refused' ? i18t('cun_w_refused')
      : (CUN_WORDS[k] ? i18tn(CUN_WORDS[k], n, { n }) : ''); };
  const words = needs.slice(0, 2).map(x => { const w = verb(x); return w ? (x.it.urgent ? `${esc(w)} · <span class="cun-late">${esc(i18t('cun_late'))}</span>` : esc(w)) : ''; }).filter(Boolean).join(' · ');
  return `<tr data-cu-cust="${esc(v.key)}" tabindex="-1">
    <td><div class="cun-name">${esc(v.name)}</div><div class="cun-sub">${esc(sub)}</div></td>
    <td class="cun-num">${v.items.length}</td><td>${money && val ? esc(typeof fmtMoneyShort === 'function' ? fmtMoneyShort(val) : String(val)) : '—'}</td>
    <td>${stand}</td><td>${ndaH}</td><td class="cun-wait">${words || '—'}</td>
    <td class="cun-go"><button type="button" class="pd2-link" data-cun-open="${esc(v.key)}">${esc(i18t('cun_open'))}</button></td></tr>`;
}
let _cunParty = null;
function cunRender(host, INS){
  if (_cunParty && cuCustomerOf(_cunParty)) return cunPartyRender(host, INS, _cunParty);
  _cunParty = null;
  const all = (typeof cuCustomers === 'function' ? cuCustomers() : []).map(r => cuView(r)).filter(Boolean);
  const nda = cuNdaMap();
  const q = String(((state.cu || {}).q) || (document.getElementById('cun-q') || {}).value || '').trim().toLowerCase();
  const waiting = all.filter(v => (v.needs || []).length), missing = all.filter(v => { const s = (nda.get(v.key) || { state: 'none' }).state; return s === 'none' || s === 'ended'; });
  const list = (_cun === 'wait' ? waiting : _cun === 'nda' ? missing : all).filter(v => !q || v.name.toLowerCase().includes(q))
    .sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
  const tabs = [['folders', i18t('ctf_tab_folders'), null], ['all', i18t('cun_tab_list'), all.length], ['wait', i18t('cun_tab_wait'), waiting.length], ['nda', i18t('cun_tab_nda'), missing.length]].filter(t => t[2] || t[0] === 'all' || t[0] === 'folders' || t[0] === _cun);
  const agreements = all.reduce((s, v) => s + v.items.length, 0);
  host.innerHTML = `<style>${CU_WHO_CSS}${CU_CSS}</style>
  <div class="view-enter sap-page ap-page is-ins apn-page cun-page" data-ins-page="customers" data-ins="${INS ? '1' : '0'}" data-cu-screen="list">
    <div class="ap-body is-ins"><section class="ap-card apn-card">
      <div class="cun-head"><h2 class="ctf-h">${esc(i18t('nav_customers'))}</h2><span class="ctf-hf">${esc(i18tn('cun_n', all.length, { n: all.length }))}</span></div>
      <div class="apn-bar"><label class="apn-box">${typeof icon === 'function' ? icon('search', 'w-3.5 h-3.5') : ''}<input id="cun-q" type="search" autocomplete="off" placeholder="${esc(i18t('lh_filter_ph'))}" value="${esc(q)}"></label><span class="apn-sp"></span>
        ${tabs.map(t => `<button type="button" class="apn-tab${_cun === t[0] ? ' is-on' : ''}" data-cun-tab="${t[0]}">${esc(t[1])}${t[2] == null ? '' : ` <span>${t[2]}</span>`}</button>`).join('')}${_cun === 'folders' ? `<span class="ctf-hint">${esc(i18t('cun_f_hint'))}</span>` : ''}</div>
      ${_cun === 'folders' ? `<div class="cu-scroll"><div class="ctf-grid cunf-grid">${list.map(v => cunFolderCardHtml(v, nda.get(v.key))).join('')}</div></div>` : ''}
      <div class="cu-scroll"${_cun === 'folders' ? ' hidden' : ''}><table class="apn-table cun-table"><colgroup><col style="width:26%"><col style="width:70px"><col style="width:110px"><col style="width:130px"><col style="width:130px"><col><col style="width:96px"></colgroup>
        <thead><tr><th>${esc(i18t('cun_c_party'))}</th><th>${esc(i18t('cun_c_deals'))}</th><th>${esc(i18t('cun_c_paper'))}</th><th>${esc(i18t('cun_c_standing'))}</th><th>${esc(i18t('cun_c_nda'))}</th><th>${esc(i18t('cun_c_wait'))}</th><th></th></tr></thead>
        <tbody id="cu-tbody">${list.map(v => cunRowHtml(v, nda.get(v.key))).join('') || `<tr><td colspan="7" class="apn-none">${esc(i18t('ap_wl_none_match'))}</td></tr>`}</tbody></table></div>
      <div class="apn-foot">${esc(i18t('cun_foot', { n: all.length, m: agreements }))}</div>
    </section><aside id="ins-panel" class="ins-panel" aria-label="${esc(i18t('ins_panel_label'))}"></aside></div></div>`;
  cuWireList(host, INS);
  if (_cun === 'folders' && INS) cunFoldersPanelPaint(all, nda);
  if (INS && typeof insWatchWidth === 'function') insWatchWidth();
  if (typeof setActiveNav === 'function') setActiveNav('customers');
}
/* ---- PARTIES AS FOLDERS, AS DRAWN (round 6): a card per party — where it is and its streams, its deals, the money
   on paper and the NDA, and what waits on you in amber (late in red); a press opens the party's page ---- */
function cunNdaWords(n){
  const x = n || { state: 'none' }, yr = x.c && x.c.signedAt ? String(x.c.signedAt).slice(0, 4) : '';
  return x.state === 'inforce' ? (yr ? i18t('cun_f_nda_signed', { y: yr }) : i18t('cun_f_nda_conf')) : x.state === 'unconfirmed' ? i18t('cun_f_nda_conf') : i18t('cun_f_nda_none');
}
function cunMoney(v){
  if (typeof canViewValues === 'function' && !canViewValues()) return 0;
  return v.items.filter(c => !c.archived).reduce((s, c) => { try { const h = (typeof fxHome === 'function') ? fxHome(c) : { v: Number(c.value) || 0 }; return s + ((typeof fxIsPay === 'function' && fxIsPay(c)) || h.missing ? 0 : (Number(h.v) || 0)); } catch (_){ return s; } }, 0);
}
function cunWaitWords(v){
  const needs = (v.needs || []).filter(x => x && x.it);
  if (!needs.length) return '';
  const w = needs.slice(0, 2).map(x => cuNeedTitle(x)).filter(Boolean).map(t => t.charAt(0).toLowerCase() + t.slice(1));
  return needs.length > 1 ? i18t('cun_f_wait_n', { n: needs.length, what: w.join(', ') }) : (w[0] ? w[0].charAt(0).toUpperCase() + w[0].slice(1) : '');
}
function cunFolderCardHtml(v, n){
  const rec = (typeof partyRecordOf === 'function' && partyRecordOf(v.key)) || {};
  const streams = v.streams.map(f => (typeof STREAM_SHORT === 'object' && STREAM_SHORT && STREAM_SHORT[f]) || cuStreamName(f)).filter(Boolean).join(', ');
  const val = cunMoney(v);
  const facts = [i18tn('cun_f_deals', v.items.length, { n: v.items.length }), val ? (typeof fmtMoneyShort === 'function' ? fmtMoneyShort(val) : String(val)) : '', cunNdaWords(n)].filter(Boolean).join(' \u00b7 ');
  const late = (v.needs || []).some(x => x && x.it && x.it.urgent);
  const wait = cunWaitWords(v);
  const st = (n || {}).state;
  const dots = (wait ? '<i class="ctf-dot is-need"></i>' : '') + (v.items.some(c => c.status === 'Signed' && !c.archived) ? '<i class="ctf-dot is-live"></i>' : '') + (st === 'none' || st === 'ended' || !st ? '<i class="ctf-dot is-hollow"></i>' : '');
  return `<button type="button" class="ctf-card cunf-card" data-cun-open="${esc(v.key)}"><span class="ctf-tab" aria-hidden="true"></span><span class="ctf-dots">${dots}</span>
    <b class="ctf-name">${esc(v.name)}</b><span class="ctf-facts">${esc([rec.city || '', streams].filter(Boolean).join(' \u00b7 '))}</span><span class="ctf-facts">${esc(facts)}</span>
    ${wait ? `<span class="ctf-need">${esc(wait)}${late ? ` \u00b7 <span class="cun-late">${esc(i18t('cun_late'))}</span>` : ''}</span>` : `<span class="ctf-quiet">${esc(i18t('cun_f_quiet'))}</span>`}</button>`;
}
/* the folders' panel: who holds the most money, which have no NDA, what is late — read across, no call */
function cunFoldersPanelPaint(all, nda){
  const money = all.map(v => ({ v, m: cunMoney(v) })).sort((a, b) => b.m - a.m);
  const total = money.reduce((s, x) => s + x.m, 0), top = money[0];
  const noNda = all.filter(v => ['none', 'ended'].includes((nda.get(v.key) || { state: 'none' }).state));
  const late = all.filter(v => (v.needs || []).some(x => x && x.it && x.it.urgent));
  const waiting = all.filter(v => (v.needs || []).length);
  const short = v => cuShortName(v.name);
  const head = [top && top.m && total ? i18t('cun_fp_top', { name: short(top.v), pct: Math.round(top.m / total * 100) }) : '', noNda.length ? i18tn('cun_fp_nonda', noNda.length, { n: noNda.length }) : '', waiting.length ? i18tn('cun_fp_wait', waiting.length, { n: waiting.length }) : ''].filter(Boolean).join('; ');
  const row = (l, v2, src) => `<div class="pd2-ch-r"><span>${esc(l)}</span><b>${esc(v2)}</b><i>${esc(src || '')}</i></div>`;
  const rows = (top && top.m ? row(i18t('cun_fp_most'), [short(top.v), typeof fmtMoneyShort === 'function' ? fmtMoneyShort(top.m) : '', i18tn('cun_f_deals', top.v.items.length, { n: top.v.items.length })].filter(Boolean).join(' \u00b7 '), total ? Math.round(top.m / total * 100) + '%' : '') : '')
    + (noNda.length ? row(i18t('cun_fp_no_nda'), noNda.slice(0, 3).map(short).join(' \u00b7 '), String(noNda.length)) : '')
    + (late.length ? row(i18t('cun_fp_late'), late.slice(0, 3).map(short).join(' \u00b7 '), String(late.length)) : '');
  const door = (attr, w, cost) => `<div class="pd2-ch-door"><button type="button" class="rfp-a" ${attr}>${esc(w)}</button><span>${esc(cost)}</span></div>`;
  const doors = (top ? door(`data-cun-open="${esc(top.v.key)}"`, i18t('cun_fp_open', { name: short(top.v) }), i18t('pd2_ch_free')) : '') + door('data-cun-tab="all"', i18t('cun_fp_list'), i18t('pd2_ch_free'));
  const body = `<div class="pd2-chosen cun-panel"><p class="pd2-ch-head">${esc(head ? head + '.' : '')}</p>${rows ? `<div class="pd2-ch-cap">${esc(i18t('cun_fp_cap'))}</div><div class="pd2-ch-tbl">${rows}</div>` : ''}<div class="pd2-ch-cap">${esc(i18t('pd2_ch_doors'))}</div>${doors}</div>`;
  insPaintPanel({ seat: 'customers', jlWord: i18t('jl_w_party'), jlHome: i18t('nav_customers'), jlPh: i18t('jl_ph_any'), jlSay: cuSay, item: { id: '__folders' }, head: false, body });
}
/* ---- A PARTY'S OWN PAGE, AS DRAWN (round 6) ----
   ‹ Parties › name, its facts in one line, Edit the record · Web search · 1 call · + New agreement; THE PARTY'S OWN
   FACTS beside WAITING ON YOU (each its own door); the agreements with them (Standing, What stands out, Ends,
   Value); the panel is the party's (cunPanelHtml). Readings the Parties list already makes; nothing new is filed. */
function cunStandsOut(c){
  let dep = []; try { dep = (typeof stdDepartures === 'function') ? stdDepartures(c) : []; } catch (_){ dep = []; }
  if (dep[0]) return { amber: true, t: i18t('cun_pp_differs', { what: String(dep[0].category || '') }) };
  const end = String(c.expiry || '').slice(0, 10), today = (typeof todayISO === 'function') ? todayISO() : '';
  if (end && today && end >= today){ const m = Math.round((Date.parse(end) - Date.parse(today)) / (30.44 * 864e5)); if (m <= 18) return { t: i18tn('cun_pp_ends_in', m, { n: m }) }; }
  return { t: '' };
}
/* the party page's panel, as drawn: the sentence, READ FOR YOU (the notice owed on the next renewal, the people), and
   DOORS (the first thing waiting on you by its own door, the web search, a new agreement with them) */
function cunPartyPanelHtml(v){
  const E = esc, full = cunPanelHtml(v), head = (/<p class="pd2-ch-head">([\s\S]*?)<\/p>/.exec(full) || [])[1] || '';
  const row = (l, val, src) => `<div class="pd2-ch-r"><span>${E(l)}</span><b>${E(val)}</b><i>${E(src || '')}</i></div>`;
  const today = (typeof todayISO === 'function') ? todayISO() : '';
  const notice = v.items.filter(c => !c.archived && c.status === 'Signed' && c.expiry && Number((c.metadata || {}).noticePeriodDays) > 0 && String(c.expiry).slice(0, 10) >= today)
    .map(c => { const days = Number(c.metadata.noticePeriodDays); const by = new Date(Date.parse(String(c.expiry).slice(0, 10)) - days * 864e5).toISOString().slice(0, 10); return { c, days, by }; })
    .sort((a, b) => a.by.localeCompare(b.by))[0];
  const people = (typeof dirPeopleOfParty === 'function') ? dirPeopleOfParty(v.key) : [];
  const ppl = people.slice(0, 2).map(p => { const r = [...(p.roles || [])]; return i18t(r.includes('cpsign') ? 'cun_pp_signs' : 'cun_pp_negotiates', { name: p.name || p.email || '' }); }).join(' · ');
  const rows = (notice ? row(i18t('cun_pp_notice'), i18t('cun_pp_notice_v', { name: notice.c.name || '', n: notice.days, d: cuDay(notice.by) }), '') : '') + (ppl ? row(i18t('cun_pp_people'), ppl, i18t('cun_pp_links')) : '');
  const door = (attr, w, cost) => `<div class="pd2-ch-door"><button type="button" class="rfp-a" ${attr}>${E(w)}</button><span>${E(cost)}</span></div>`;
  const need = (v.needs || []).find(x => x && x.it && x.c);
  const lead = v.items.find(c => !c.archived) || v.items[0];
  const short = cuShortName(v.name);
  const doors = (need ? door(`data-cu-need="${E(need.it.kind)}" data-cu-id="${E(need.c.id)}"`, cuNeedTitle(need), i18t('pd2_ch_free')) : '')
    + (lead && typeof partyWebOpen === 'function' && typeof partyLookupMay === 'function' && partyLookupMay() ? door(`data-cun-web="${E(lead.id)}"`, i18t('cun_p_web', { name: short }), i18t('cun_p_web_cost')) : '')
    + ((typeof canEdit !== 'function' || canEdit()) ? door(`data-cu-draft-with="${E(v.key)}"`, i18t('cun_pp_new', { name: short }), i18t('pd2_ch_free')) : '');
  return `<div class="pd2-chosen cun-panel"><p class="pd2-ch-head">${head}</p>${rows ? `<div class="pd2-ch-cap">${E(i18t('cun_pp_read'))}</div><div class="pd2-ch-tbl">${rows}</div>` : ''}<div class="pd2-ch-cap">${E(i18t('pd2_ch_doors'))}</div>${doors}</div>`;
}
function cunPartyRender(host, INS, key){
  const v = cuView(cuCustomerOf(key)); const E = esc;
  const rec = (typeof partyRecordOf === 'function' && partyRecordOf(v.key)) || {};
  const streams = v.streams.map(f => (typeof STREAM_SHORT === 'object' && STREAM_SHORT && STREAM_SHORT[f]) || cuStreamName(f)).filter(Boolean).join(', ');
  const val = cunMoney(v);
  const facts = [i18tn('cun_pp_n', v.items.length, { n: v.items.length }), val ? (typeof fmtMoneyShort === 'function' ? fmtMoneyShort(val) : '') : '', streams, rec.city || ''].filter(Boolean).join(' \u00b7 ');
  const may = partyRecordMay(), lead = v.items.find(c => !c.archived) || v.items[0];
  const nda = cuNdaOf(v.key);
  const people = (typeof dirPeopleOfParty === 'function') ? dirPeopleOfParty(v.key) : [];
  const signer = people.find(p => p && (p.roles || []).includes && [...(p.roles || [])].includes('cpsign'));
  const theirLead = people.find(p => p && [...(p.roles || [])].includes('negotiate'));
  let sm = null; try { sm = lead && typeof contractStatusMeta === 'function' ? contractStatusMeta(lead) : null; } catch (_){ sm = null; }
  const signedN = v.items.filter(c => c.status === 'Signed').length, rest = v.items.length - signedN;
  const row = (l, val2, src) => `<div class="pd2-ch-r"><span>${E(l)}</span><b>${E(val2)}</b><i>${E(src || '')}</i></div>`;
  const ndaV = !nda || nda.state === 'none' ? i18t('cu_nda_none') : nda.state === 'inforce' && nda.c && nda.c.signedAt ? i18t('cun_p_nda_signed', { d: cuDay(String(nda.c.signedAt).slice(0, 10)) }) : i18t('cun_nda_conf');
  const own = (rec.city ? row(i18t('cun_p_city'), rec.city, i18t('cun_p_src_rec')) : '') + row(i18t('cun_p_org'), rec.orgNo || i18t('cu_org_none'), rec.orgNo ? i18t('cun_p_src_rec') : '')
    + (signer ? row(i18t('cun_p_signer'), [signer.name, signer.title].filter(Boolean).join(', '), i18t('cun_p_src_link')) : '')
    + (theirLead ? row(i18t('cun_pp_lead'), theirLead.name || theirLead.email || '', i18t('cun_pp_src_link')) : '')
    + row(i18t('cu_col_nda'), ndaV, nda && nda.c && typeof contractRef === 'function' ? contractRef(nda.c) : '')
    + (sm ? row(i18t('cun_c_standing'), [sm.label, signedN ? i18t('cun_pp_signed', { n: signedN }) : '', rest ? i18t('cun_pp_rest', { n: rest }) : ''].filter(Boolean).join(' \u00b7 '), i18t('cun_pp_src_read')) : '');
  const needs = (v.needs || []).filter(x => x && x.it && x.c);
  const waits = needs.length ? needs.slice(0, 4).map(x => `<div class="cunp-w"><div><b>${E(cuNeedTitle(x))}</b><span>${E(x.c.name || '')}</span></div><button type="button" class="rfp-a" data-cu-need="${E(x.it.kind)}" data-cu-id="${E(x.c.id)}">${E(i18t(CU_NEED_DOOR[x.it.kind] || 'cu_need_go_move'))}</button></div>`).join('')
    : `<p class="cunp-none">${E(i18t('cun_f_quiet'))}</p>`;
  const money = !(typeof canViewValues === 'function' && !canViewValues());
  const ags = v.items.slice().sort((a, b) => String(a.archived ? 1 : 0).localeCompare(String(b.archived ? 1 : 0))).map(c => {
    const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
    let m2 = null; try { m2 = (typeof regStageTone === 'function') ? regStageTone(c) : null; } catch (_){ m2 = null; }
    const so = cunStandsOut(c);
    const sub = [ref, c.signedAt ? i18t('cun_pp_signed_on', { d: cuDay(String(c.signedAt).slice(0, 10)) }) : ''].filter(Boolean).join(' \u00b7 ');
    return `<tr data-cu-ag="${E(c.id)}"><td class="cunp-mk">${typeof regStageMarkHtml === 'function' ? regStageMarkHtml(c) : ''}</td><td><div class="cun-name">${E(c.name || ref)}</div><div class="cun-sub">${E(sub)}</div></td>
      <td style="color:var(--st-${(m2 && m2.tone) || 'gray'}-fg)" class="cun-wait">${E((m2 && m2.m && m2.m.label) || c.status || '')}</td>
      <td class="cun-wait${so.amber ? ' cunp-amb' : ''}">${E(so.t || '\u2014')}</td><td class="cun-wait">${E(c.expiry ? cuDay(String(c.expiry).slice(0, 10)) : '\u2014')}</td>
      <td class="cun-wait" style="text-align:right">${money && Number(c.value) && typeof fmtMoneyShortOf === 'function' ? E(fmtMoneyShortOf(c)) : '\u2014'}</td></tr>`;
  }).join('');
  host.innerHTML = `<style>${CU_WHO_CSS}${CU_CSS}</style>
  <div class="view-enter sap-page ap-page is-ins apn-page cun-page cunp-page" data-ins-page="customers" data-ins="${INS ? '1' : '0'}" data-cu-screen="party">
    <div class="ap-body is-ins"><section class="ap-card apn-card">
      <div class="cun-head cunp-head"><button type="button" class="ctf-back" data-cunp-back>\u2039 ${E(i18t('nav_customers'))}</button><span class="ctf-crumb">\u203a</span><h2 class="ctf-h">${E(v.name)}</h2><span class="ctf-hf">${E(facts)}</span><span class="ctf-sp"></span>
        ${may ? `<button type="button" class="ctf-pill" data-cu-pr-edit="${E(v.key)}">${E(i18t('cun_pp_edit'))}</button>` : ''}
        ${lead && typeof partyWebOpen === 'function' && typeof partyLookupMay === 'function' && partyLookupMay() ? `<button type="button" class="ctf-pill" data-cun-web="${E(lead.id)}">${E(i18t('cun_pp_web'))}</button>` : ''}
        ${typeof canEdit !== 'function' || canEdit() ? `<button type="button" class="ui-btn ui-btn-primary ctf-new" data-cu-draft-with="${E(v.key)}">${typeof icon === 'function' ? icon('plus', 'w-3.5 h-3.5') : '+'}${E(i18t('ctf_new_agreement'))}</button>` : ''}</div>
      <div class="cu-scroll"><div class="cunp-two"><div><div class="pd2-ch-cap">${E(i18t('cun_p_facts'))}</div><div class="pd2-ch-tbl">${own}</div></div>
        <div><div class="pd2-ch-cap">${E(i18t('cu_col_waiting'))}</div><div class="cunp-waits">${waits}</div></div></div>
      <div class="pd2-ch-cap cunp-agh">${E(i18t('cun_pp_ags', { name: cuShortName(v.name), n: v.items.length }))}</div>
      <table class="apn-table cun-table cunp-table"><colgroup><col style="width:36px"><col style="width:30%"><col style="width:120px"><col><col style="width:120px"><col style="width:100px"></colgroup>
        <thead><tr><th></th><th>${E(i18t('reg_col_agreement'))}</th><th>${E(i18t('cun_c_standing'))}</th><th>${E(i18t('cun_pp_out'))}</th><th>${E(i18t('reg_col_ends'))}</th><th style="text-align:right">${E(i18t('reg_col_value'))}</th></tr></thead>
        <tbody>${ags}</tbody></table></div>
      <div class="apn-foot">${E([i18tn('cun_pp_n', v.items.length, { n: v.items.length }), val ? i18t('ctf_on_paper', { v: typeof fmtMoneyShort === 'function' ? fmtMoneyShort(val) : '' }) : ''].filter(Boolean).join(' \u00b7 '))}</div>
    </section><aside id="ins-panel" class="ins-panel" aria-label="${E(i18t('ins_panel_label'))}"></aside></div></div>`;
  if (INS) insPaintPanel({ seat: 'customers', jlWord: i18t('jl_w_party'), jlHome: i18t('nav_customers'), jlPh: i18t('jl_ph_any'), jlSay: cuSay, item: { id: v.key }, head: false,
    body: (_cu.edit === v.key ? cuPrFormHtml(v) : '') + cunPartyPanelHtml(v) });
  if (INS && typeof insWatchWidth === 'function') insWatchWidth();
  if (typeof setActiveNav === 'function') setActiveNav('customers');
}
if (typeof document !== 'undefined' && !document._cunpWired){ document._cunpWired = true;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest('[data-cunp-back]')){ e.preventDefault(); _cunParty = null; renderCustomers(); return; }
  });
}
if (typeof document !== 'undefined' && !document._cunWired){ document._cunWired = true;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const tab = t.closest('[data-cun-tab]'); if (tab){ e.preventDefault(); _cun = tab.getAttribute('data-cun-tab'); renderCustomers(); return; }
    const o = t.closest('[data-cun-open]'); if (o){ e.preventDefault(); e.stopPropagation(); cuOpenCustomer(o.getAttribute('data-cun-open')); }
  }, true);
  document.addEventListener('input', e => { if (e.target && e.target.id === 'cun-q'){ state.cu = state.cu || {}; state.cu.q = e.target.value; renderCustomers();
    const q = document.getElementById('cun-q'); if (q){ q.focus(); const n = q.value.length; try { q.setSelectionRange(n, n); } catch (_){} } } });
}
function renderCustomers(){
  const host = document.getElementById('content'); if (!host) return;
  const INS = (typeof insFits === 'function') && insFits() && typeof insPaintPanel === 'function';
  const keep = (() => { const sc = document.querySelector('.cu-scroll'); return sc ? sc.scrollTop : 0; })();
  /* the list head's box keeps its id (cu-q), so a repaint while it is typed in puts the caret back */
  const typing = document.activeElement && document.activeElement.id === 'cu-q';
  const editing = document.activeElement && document.activeElement.closest && document.activeElement.closest('#cu-pr-form') ? document.activeElement.id : '';
  cuLcReg();
  /* the new look draws Parties as drawn (round 6); the old look is unchanged */
  if (INS && typeof window.newLookOn === 'function' && newLookOn()){ cunRender(host, INS); return; }
  host.innerHTML = `<style>${CU_WHO_CSS}${CU_CSS}</style>
  <div class="view-enter sap-page ap-page cu-page${INS ? ' is-ins' : ''}" data-ins-page="customers" data-ins="${INS ? '1' : '0'}" data-cu-screen="list">
    ${cuListHtml(INS)}
  </div>`;
  const sc = host.querySelector('.cu-scroll'); if (sc && keep) sc.scrollTop = keep;
  cuWire(host, INS);
  if (typing){ const q = document.getElementById('cu-q'); if (q){ q.focus(); const n = q.value.length; try { q.setSelectionRange(n, n); } catch (_) {} } }
  lcPlace('customers');
  if (editing){ const f = document.getElementById(editing); if (f) try { f.focus({ preventScroll: true }); } catch (_){} }
  if (INS && typeof insWatchWidth === 'function') insWatchWidth();
  if (typeof setActiveNav === 'function') setActiveNav('customers');
  cuRequestsLoad();
}
function cuRepaint(){ if (typeof state !== 'undefined' && state.view === 'customers') renderCustomers(); }
/* the head's own presses (the box, the tabs, the chips, "+ Filter", Show
   more) are the list head's, delegated once (js/views/listhead.js); the page
   binds only what it draws itself */
function cuWire(host, INS){
  host.querySelector('[data-cu-draft]')?.addEventListener('click', e => cuDraftFor(e.currentTarget.getAttribute('data-cu-draft') || ''));
  cuWireList(host, INS);
}
/* the list's own hands: the next page at the scroller's end, the rows and the panel */
function cuWireList(host, INS){
  lcScrollWire(host, 'customers');
  const tb = host.querySelector('#cu-tbody');
  if (!tb){ if (INS && host.querySelector('#ins-panel')) cuPaintCustomerPanel(null); return; }
  if (INS){ cuPaintCustomerPanel(tb); return; }
  /* Narrow window: no panel, so a press opens. */
  tb.addEventListener('click', e => {
    const row = e.target.closest && e.target.closest('[data-cu-cust]');
    if (row) cuOpenCustomer(row.getAttribute('data-cu-cust'));
  });
}

/* ---- YOUR HISTORY WITH THEM, IN ONE READING (round 1 of Jambo's journey,
   owner, 22 Oct 2026: "Your history with them, in one line") ----
   What your own book knows about the other side of a contract: how many
   agreements you have with them, how many are signed and since when, whether
   they kept their dated duties, and what they pushed on before. READ ONLY,
   from the shelf's own book (cuBook: no archive, no amendment, no code-named
   deal) and the precedent's own mining — no AI, no outside call, nothing
   stored. null where there is no other side named or nothing else with them. */
function partyHistoryOf(c){
  if (!c || c._codeNamed) return null;
  const who = cuNameOf(c); if (!who) return null;
  const key = cuKeyOf(who);
  const others = cuBook().filter(x => x && String(x.id) !== String(c.id) && cuKeyOf(cuNameOf(x)) === key);
  if (!others.length) return { who, n: 0, signed: 0, since: null, late: 0, kept: 0, pushed: '' };
  const day = x => { try { return (typeof contractSignedAt === 'function') ? contractSignedAt(x) : null; } catch (_){ return null; } };
  const signedDays = others.map(day).filter(d => /^\d{4}-\d{2}-\d{2}/.test(String(d || ''))).sort();
  /* THEIR dated duties: kept = done on or before the day; late = done after it, or still open past it */
  const today = (typeof todayISO === 'function') ? todayISO() : new Date().toISOString().slice(0, 10);
  let kept = 0, late = 0;
  others.forEach(x => (Array.isArray(x.obligations) ? x.obligations : []).forEach(o => {
    if (!o || o.party !== 'theirs') return;
    const due = String(o.due || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return;
    if (o.status === 'done'){ const at = String(o.completedAt || '').slice(0, 10); if (at && at > due) late++; else kept++; }
    else if (due < today) late++;
  }));
  /* what they pushed on most, said by the precedent's own sentence */
  let pushed = '';
  try {
    if (typeof precedentMine === 'function' && typeof precedentLine === 'function'){
      const rows = Object.values(precedentMine({ counterparty: who }) || {})
        .filter(r => r && (r.theirs.accepted + r.theirs.refused) > 0)
        .sort((a, b) => (b.theirs.accepted + b.theirs.refused) - (a.theirs.accepted + a.theirs.refused));
      if (rows[0]) pushed = precedentLine({ withThem: Object.assign({ counterparty: who }, rows[0]), category: rows[0].category, unit: rows[0].unit }) || '';
    }
  } catch (_){ pushed = ''; }
  return { who, n: others.length, signed: signedDays.length, since: signedDays.length ? signedDays[0].slice(0, 4) : null, late, kept, pushed };
}
/* the reading in Jambo's words: one or two sentences, or '' */
function partyHistorySay(h){
  if (!h) return '';
  const T = (k, v) => i18t(k, v), Tn = (k, n, v) => i18tn(k, n, v);
  if (!h.n) return T('ph_first_time', { who: h.who });
  const out = [h.signed
    ? (h.since ? Tn('ph_signed_since', h.signed, { who: h.who, n: h.signed, year: h.since }) : Tn('ph_signed', h.signed, { who: h.who, n: h.signed }))
    : Tn('ph_none_signed', h.n, { who: h.who, n: h.n })];
  if (h.late) out.push(Tn('ph_late', h.late, { n: h.late }));
  else if (h.kept) out.push(T('ph_kept'));
  if (h.pushed) out.push(String(h.pushed));
  return out.join(' ');
}
Object.assign(window, { cunPanelHtml, cunPartyRender, cunFolderCardHtml, cunFoldersPanelPaint, cunStandsOut, partyWebOf, partyLookupMay, partyLookup, partyHistoryOf, partyHistorySay, cuNeedsOf, cuNeedTitle, cuNeedsSay, cuNeedGo, cuPanelNeedsHtml, CU_NEED_DOOR, CU_NEED_LINE, cuPanelAgreementsHtml, cuNameOf, cuKeyOf, cuBook, cuBucket, cuCustomers, cuCustomerOf, cuDoorCount, cuNextEnd, cuFilterItems, cuView, cuIdsOf,
  cuNdaMap, cuNdaOf, cuNdaWants, cuNdaShort, cuOpenNda,
  cuPlace, cuPlacePut, cuOpenCustomer, cuOpenExplorer, cuDraftFor, renderCustomers, cuRepaint,
  /* the one filter-box builder the band's clothes dress; My notes and Requests draw their boxes with it */
  cuChip,
  /* round 19 as drawn: a party's own facts, the party's standing, the page's
     card, and the clothes People wears too (CU_WHO_CSS; Columns, the paged
     foot and the head's box, tabs and chips are js/views/listhead.js's since
     Part 8) */
  cuNeedShort, cuRequestsOf, cuStanding, cuSay, cuMoveRedlines, cuOpenAgreement, cuSelectParty, cuStatusWants, partyRecordOf, partyCityOf, partyOrgNoOf, partyRecordSet, partyRecordOpen, partyCitySuggest, cuCityFromAddress, cuAddrAfterName,
  cuSinceOf, cuShortName, cuOwnerSay, cuAgreementSub, cuPanelPeopleHtml, cuCardHtml,
  /* the list head the Legora way (Part 8): the one reading behind every tab's number and every choice's count */
  cuRowsWith,
  CU_WHO_CSS, CU_PAGE });
