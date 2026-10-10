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
const _cu = { stream: 'all', owner: 'all', q: '' };

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
  return all.filter(c => c && !c.archived && !c.parentId && cuNameOf(c));
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
    (_cu.stream === 'all' || String(c.folder) === String(_cu.stream))
    && (_cu.owner === 'all' || ((typeof contractOwnerName === 'function' && contractOwnerName(c)) || '') === _cu.owner));
}
function cuFiltersOn(){ return _cu.stream !== 'all' || _cu.owner !== 'all'; }
/* ONE CUSTOMER AS THE PAGE SHOWS IT, filters applied — the row, its sub-line,
   the side panel and the doors read this, so they never disagree (owner's
   screenshot, 10 Oct 2026: Owner on, the row said 3 and its sub-line 21). */
function cuView(r){
  if (!r) return null;
  const items = cuFiltersOn() ? cuFilterItems(r.items) : r.items;
  const active = items.filter(c => cuBucket(c) === 'active'), expired = items.filter(c => cuBucket(c) === 'expired');
  const streams = [...new Set(items.map(c => c.folder).filter(f => f && cuStreamName(f)))];
  return { key: r.key, name: r.name, items, active, expired, streams, next: cuNextEnd(items), waiting: items.filter(cuWaitingOnYou).length };
}
/* The ids a door carries: the customer's agreements as counted, and every
   amendment under them, so the Contracts page draws each under its agreement. */
function cuIdsOf(v){
  const ids = new Set((v && v.items || []).map(c => c.id));
  const all = (typeof state !== 'undefined' && Array.isArray(state.contracts)) ? state.contracts : [];
  all.forEach(c => { if (c && c.parentId && ids.has(c.parentId)) ids.add(c.id); });
  return [...ids];
}

/* ---- THE PLACE A REFRESH PUTS BACK ---- the list's own find and filters; a
   customer kept by an older refresh ("cust") is ignored and lands on the list. */
function cuPlace(){ return { stream: _cu.stream, owner: _cu.owner, q: _cu.q }; }
function cuPlacePut(p){
  if (!p || typeof p !== 'object') return;
  _cu.stream = p.stream ? String(p.stream) : 'all';
  _cu.owner = p.owner ? String(p.owner) : 'all';
  _cu.q = p.q ? String(p.q) : '';
}

/* ---- THE DOORS ---- */
/* OPEN CUSTOMER = the Contracts page narrowed to this customer, through its
   own "only" chip (regShowOnly). × on the chip widens it; the rail's
   Customers door is the way back. */
function cuOpenCustomer(key){
  const v = cuView(cuCustomerOf(key));
  if (!v || !v.items.length) return;
  if (typeof regShowOnly === 'function') regShowOnly(cuIdsOf(v), `${v.name} · ${v.items.length}`);
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
function cuFilterBarHtml(items){
  const streams = [...new Set((items || []).map(c => c.folder).filter(f => f && cuStreamName(f)))]
    .sort((a, b) => cuStreamName(a).localeCompare(cuStreamName(b)));
  const owners = [...new Set((items || []).map(c => (typeof contractOwnerName === 'function' && contractOwnerName(c)) || '').filter(Boolean))].sort();
  return `<div class="reg-filterbar reg-fb">
    <label class="cu-find"><span class="sr-only">${_cuE(i18t('cu_find'))}</span><input id="cu-q" type="search" autocomplete="off" placeholder="${_cuE(i18t('cu_find_ph'))}" value="${_cuE(_cu.q)}"></label>
    ${cuChip({ label: i18t('reg_chip_stream'), title: i18t('reg_value_stream'), attr: 'data-cu-f', key: 'stream', cur: _cu.stream, def: 'all',
      opts: [['all', i18t('cu_all_streams')], ...streams.map(f => [f, cuStreamName(f)])] })}
    ${cuChip({ label: i18t('cu_owner'), attr: 'data-cu-f', key: 'owner', cur: _cu.owner, def: 'all',
      opts: [['all', i18t('cu_anyone')], ...owners.map(o => [o, o])] })}
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
`;

/* ---- THE CUSTOMERS PAGE ---- */
function cuListHtml(INS){
  const book = cuBook();
  const all = cuCustomers(book);
  const q = cuKeyOf(_cu.q);
  const rows = all.filter(r => !q || r.key.includes(q))
    .filter(r => !cuFiltersOn() || cuFilterItems(r.items).length);
  const money = cuMoney();
  const activeAll = book.filter(c => cuBucket(c) === 'active');
  const facts = [i18tn('cu_n_customers', all.length, { n: all.length })];
  if (money){ const v = cuMoneyWords(activeAll); if (v) facts.push(i18t('cu_active_on_paper', { v })); }
  const head = [{ t: i18t('cu_col_customer') }, { t: i18t('cu_col_active'), r: 1, w: 80 }, { t: i18t('cu_col_expired'), r: 1, w: 84 },
    ...(money ? [{ t: i18t('cu_col_on_paper'), r: 1, w: 130 }] : []), { t: i18t('cu_col_next_end'), w: 120 }, { t: i18t('cu_col_waiting'), r: 1, w: 120 }];
  const body = rows.map(r => {
    const v = cuView(r), act = v.active, exp = v.expired, w = v.waiting, next = v.next;
    const ov = money ? cuMoneyWords(act) : '';
    return `<tr data-cu-cust="${_cuE(r.key)}" tabindex="-1">
      <td><div class="ap-id">${cuAvHtml(r.name)}<div><span class="ap-name">${_cuE(r.name)}</span><span class="ap-sub">${
        _cuE(i18tn('cu_n_contracts', v.items.length, { n: v.items.length }))} · ${_cuE(i18tn('cu_n_streams', v.streams.length, { n: v.streams.length }))}</span></div></div></td>
      <td class="n">${act.length}</td>
      <td class="n${exp.length ? '' : ' quiet'}">${exp.length || '—'}</td>
      ${money ? `<td class="n${ov ? '' : ' quiet'}">${_cuE(ov || '—')}</td>` : ''}
      <td class="${next ? '' : 'quiet'}">${_cuE(next ? cuDay(next) : '—')}</td>
      <td class="n${w ? ' amber' : ' quiet'}">${w || '—'}</td>
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
      <div class="reg-tabbar cu-notabs">${cuFilterBarHtml(book)}</div>
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
    if (!r){ insPaintPanel({ seat, c: null, item: null, empty: i18t('cu_panel_none') }); return; }
    const count = list => { const v = money ? cuMoneyWords(list) : ''; return list.length ? `${list.length}${v ? ' · ' + v : ''}` : '0'; };
    const facts = [
      { k: 'active', label: i18t('cu_tab_active'), v: _cuE(count(r.active)) },
      { k: 'expired', label: i18t('cu_tab_expired'), v: _cuE(count(r.expired)) },
      { k: 'next', label: i18t('cu_col_next_end'), v: r.next ? _cuE(cuDay(r.next)) : '' },
      { k: 'waiting', label: i18t('cu_col_waiting'), v: _cuE(String(r.waiting)) },
    ];
    const streams = r.streams.map(f => `<span>${cuStripeHtml(f)}${_cuE(cuStreamName(f))}</span><span class="n">${r.items.filter(c => c.folder === f).length}</span>`).join('');
    insPaintPanel({ seat, item: { id: r.key }, head: {
        eyebrow: _cuE(i18tn('cu_n_contracts', r.items.length, { n: r.items.length })) + ' · ' + _cuE(i18tn('cu_n_streams', r.streams.length, { n: r.streams.length })),
        title: r.name,
        acts: [{ k: 'open', kind: 'accent', label: i18t('cu_open_customer'), iconEnd: 'chevR', run: x => cuOpenCustomer(x.id) },
          { k: 'explorer', label: i18t('cu_open_explorer'), run: x => cuOpenExplorer(x.id) }] },
      body: (typeof insKvHtml === 'function' ? insKvHtml(facts) : '')
        + (streams && typeof insSecHtml === 'function' ? insSecHtml(i18t('cu_panel_streams'), r.streams.length, `<div class="cu-panel-streams">${streams}</div>`) : '') });
  };
  paint(id);
  insListWire(tb, { rowSel: '[data-cu-cust]', idOf,
    onSelect: key => { insSelect(seat, key); insMarkRow(tb, '[data-cu-cust]', idOf, key); paint(key); },
    onOpen: key => cuOpenCustomer(key) });
}

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
    const k = s.getAttribute('data-cu-f'); if (!['stream', 'owner'].includes(k)) return;
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

Object.assign(window, { cuNameOf, cuKeyOf, cuBook, cuBucket, cuCustomers, cuCustomerOf, cuDoorCount, cuNextEnd, cuFilterItems, cuView, cuIdsOf,
  cuPlace, cuPlacePut, cuOpenCustomer, cuOpenExplorer, cuDraftFor, renderCustomers, cuRepaint });
