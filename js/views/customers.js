/* ═══ CUSTOMER FOLDERS — SHELVES, DRAWN THE SAP WAY (owner, 10 Oct 2026:
   "implement the filter besides tabs and the custom folders SAP way"; the
   design he picked is "Customer folders" in the Customer Folders and Filters
   artifact) ══════════════════════════════════════════════════════════════

   A Customers page in the rail, then one page per customer: a white head with
   the customer's figures, Active | Expired | All as its tabs, and the list
   grouped by value stream inside, each group folding.

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

   ONE DOOR ONTO A CONTRACT: a row selects, the side panel is the Contracts
   panel (insPaintPanel, the same four facts and What Copilot read), a second
   press opens the contract. Amendments stay under their agreement (only
   agreements are rows, as the Contracts head counts them). Draft new
   agreement is the existing form with the counterparty filled in.

   NOTHING HERE WRITES. Read RAW — no reading here creates a negotiation. */

const CU_TABS = ['active', 'expired', 'all'];
/* Per sitting: which customer, which tab, the filters, the folded groups.
   A refresh puts it back through PLACE_PARTS (cuPlace / cuPlacePut). */
const _cu = { cust: null, tab: 'active', stream: 'all', owner: 'all', type: 'all', q: '', closed: {} };

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
function cuTypeOf(c){ try { return (typeof cKind === 'function') ? String(cKind(c) || '') : ''; } catch (_) { return ''; } }
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
    && (_cu.owner === 'all' || ((typeof contractOwnerName === 'function' && contractOwnerName(c)) || '') === _cu.owner)
    && (_cu.type === 'all' || cuTypeOf(c) === _cu.type));
}
function cuFiltersOn(){ return _cu.stream !== 'all' || _cu.owner !== 'all' || _cu.type !== 'all'; }

/* ---- THE PLACE A REFRESH PUTS BACK ---- */
function cuPlace(){ return { cust: _cu.cust, tab: _cu.tab, stream: _cu.stream, owner: _cu.owner, type: _cu.type, q: _cu.q }; }
function cuPlacePut(p){
  if (!p || typeof p !== 'object') return;
  _cu.cust = p.cust ? String(p.cust) : null;
  _cu.tab = CU_TABS.includes(p.tab) ? p.tab : 'active';
  _cu.stream = p.stream ? String(p.stream) : 'all';
  _cu.owner = p.owner ? String(p.owner) : 'all';
  _cu.type = p.type ? String(p.type) : 'all';
  _cu.q = p.q ? String(p.q) : '';
}

/* ---- THE DOORS ---- */
function cuOpenList(){ _cu.cust = null; cuRepaint(); if (typeof placeSave === 'function') placeSave(); }
function cuOpenCustomer(key){
  _cu.cust = key ? String(key) : null; _cu.tab = 'active'; _cu.closed = {};
  if (typeof state !== 'undefined' && state.view !== 'customers' && typeof setView === 'function') setView('customers');
  else cuRepaint();
  if (typeof placeSave === 'function') placeSave();
}
function cuDraftFor(name){
  if (typeof openNewAgreement === 'function') openNewAgreement({ prefill: { counterparty: name } });
  else if (typeof openNewDoors === 'function') openNewDoors();
}
/* "Open on Explorer" lands on Home's map grouped by customer — the map that
   already folds by customer. No second map is drawn. */
function cuOpenExplorer(){
  try { if (window.intel){ intel.groupBy = 'counterparty'; intel.groups = null; } } catch (_) {}
  if (typeof hbOpenExplorer === 'function') hbOpenExplorer(); else if (typeof setView === 'function') setView('dashboard');
}
function cuOpenContract(id){ if (typeof selectContract === 'function') selectContract(id); }

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
function cuFilterBarHtml(items, withFind){
  const streams = [...new Set((items || []).map(c => c.folder).filter(f => f && cuStreamName(f)))]
    .sort((a, b) => cuStreamName(a).localeCompare(cuStreamName(b)));
  const owners = [...new Set((items || []).map(c => (typeof contractOwnerName === 'function' && contractOwnerName(c)) || '').filter(Boolean))].sort();
  const types = [...new Set((items || []).map(cuTypeOf).filter(Boolean))].sort();
  return `<div class="reg-filterbar reg-fb">
    ${withFind ? `<label class="cu-find"><span class="sr-only">${_cuE(i18t('cu_find'))}</span><input id="cu-q" type="search" autocomplete="off" placeholder="${_cuE(i18t('cu_find_ph'))}" value="${_cuE(_cu.q)}"></label>` : ''}
    ${cuChip({ label: i18t('reg_chip_stream'), title: i18t('reg_value_stream'), attr: 'data-cu-f', key: 'stream', cur: _cu.stream, def: 'all',
      opts: [['all', i18t('cu_all_streams')], ...streams.map(f => [f, cuStreamName(f)])] })}
    ${withFind ? '' : cuChip({ label: i18t('cu_type'), attr: 'data-cu-f', key: 'type', cur: _cu.type, def: 'all',
      opts: [['all', i18t('cu_all_types')], ...types.map(t => [t, t])] })}
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
  .cu-crumb{display:flex;align-items:center;gap:6px;font-size:var(--t-meta);color:var(--color-neutral-600);}
  .cu-crumb button{background:none;border:0;padding:0;font:inherit;color:var(--accent-ink);cursor:pointer;}
  .cu-crumb button:hover{text-decoration:underline;}
  .cu-head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--s-3);flex-wrap:wrap;}
  .cu-id{display:flex;align-items:center;gap:var(--s-2);min-width:0;}
  .cu-id .reg-av{width:36px;height:36px;font-size:var(--t-label);}
  .cu-t{margin:0;font-family:var(--font-heading);font-size:20px;font-weight:var(--w-title);letter-spacing:-.01em;line-height:1.2;color:var(--color-text);}
  .cu-acts{display:flex;align-items:center;gap:var(--s-2);flex:none;min-height:var(--ctl-h);}
  .cu-kpis{display:flex;flex-wrap:wrap;gap:var(--s-2) var(--s-6,28px);}
  .cu-kpi dt{font-size:var(--t-meta);color:var(--color-neutral-600);}
  .cu-kpi dd{margin:2px 0 0;font-size:var(--t-card);font-weight:var(--w-strong);font-variant-numeric:tabular-nums;color:var(--color-text);}
  .cu-kpi dd small{font-size:var(--t-meta);font-weight:var(--w-body);color:var(--color-neutral-600);}
  .cu-kpi dd.is-amber{color:var(--st-amber-fg);}
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
  .cu-table tr.cu-grp td{background:var(--surface-2);font-weight:var(--w-strong);cursor:pointer;}
  .cu-table tr.cu-grp:hover td{background:color-mix(in srgb,var(--color-accent) 6%,var(--surface-2));}
  .cu-table tr.cu-grp .cu-car{display:inline-block;width:14px;color:var(--color-neutral-500);}
  .cu-table tr.cu-grp .cu-cnt{margin-left:8px;font-weight:var(--w-body);color:var(--color-neutral-600);}
  .cu-table tbody tr[data-cu-row]:focus,.cu-table tbody tr[data-cu-cust]:focus{outline:none;}
  .cu-table tbody tr.is-sel td{background:color-mix(in srgb,var(--color-accent) 8%,transparent);}
  .cu-table tbody tr.is-sel td:first-child{box-shadow:inset 2px 0 0 var(--accent-solid);}
  .cu-stripe{display:inline-block;width:4px;height:12px;border-radius:2px;vertical-align:-1px;margin-right:7px;}
  .cu-table td.cu-ind{padding-left:30px;}
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
    const items = cuFiltersOn() ? cuFilterItems(r.items) : r.items;
    const act = items.filter(c => cuBucket(c) === 'active'), exp = items.filter(c => cuBucket(c) === 'expired');
    const w = items.filter(cuWaitingOnYou).length, next = cuNextEnd(items);
    const ov = money ? cuMoneyWords(act) : '';
    return `<tr data-cu-cust="${_cuE(r.key)}" tabindex="-1">
      <td><div class="ap-id">${cuAvHtml(r.name)}<div><span class="ap-name">${_cuE(r.name)}</span><span class="ap-sub">${
        _cuE(i18tn('cu_n_contracts', r.items.length, { n: r.items.length }))} · ${_cuE(i18tn('cu_n_streams', r.streams.length, { n: r.streams.length }))}</span></div></div></td>
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
      <div class="reg-tabbar cu-notabs">${cuFilterBarHtml(book, true)}</div>
    </div>
    ${INS ? `<div class="ap-body is-ins cu-body">${cuCardHtml(i18t('nav_customers'), rows.length, table, foot)}<aside id="ins-panel" class="ins-panel" aria-label="${_cuE(i18t('ins_panel_label'))}"></aside></div>`
      : `<div class="cu-body">${cuCardHtml(i18t('nav_customers'), rows.length, table, foot)}</div>`}`;
}

/* ---- ONE CUSTOMER'S PAGE ---- */
function cuCustomerHtml(r, INS){
  const items = r.items;
  const act = items.filter(c => cuBucket(c) === 'active'), exp = items.filter(c => cuBucket(c) === 'expired');
  const tabbed = _cu.tab === 'active' ? act : _cu.tab === 'expired' ? exp : items;
  const list = cuFilterItems(tabbed);
  const money = cuMoney();
  const next = cuNextEnd(items), w = items.filter(cuWaitingOnYou).length;
  const kpi = (label, v, sub, cls) => `<div class="cu-kpi"><dt>${_cuE(label)}</dt><dd${cls ? ` class="${cls}"` : ''}>${_cuE(v)}${sub ? ` <small>· ${_cuE(sub)}</small>` : ''}</dd></div>`;
  /* The groups follow the stream's own order in the company's list. */
  const order = Object.keys((typeof FOLDERS !== 'undefined' && FOLDERS) || {});
  const ids = [...new Set(list.map(c => c.folder || ''))].sort((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    return (ia < 0 ? 1e6 : ia) - (ib < 0 ? 1e6 : ib);
  });
  const head = [{ t: i18t('reg_col_ref'), w: 96 }, { t: i18t('cu_col_agreement') }, { t: i18t('reg_col_stage'), w: 210 },
    ...(money ? [{ t: i18t('reg_col_value'), r: 1, w: 120 }] : []), { t: i18t('reg_col_ends'), w: 116 }];
  const cols = head.length;
  const row = c => {
    const m = (typeof regMoveWord === 'function') ? regMoveWord(c) : null;
    const mv = (m && m.k !== 'clear') ? ` <span class="ins-mv is-${m.k}">· ${_cuE(i18t(m.k === 'you' ? 'ins_your_move' : 'ins_their_move'))}</span>` : '';
    const stage = (typeof contractStatusDotHtml === 'function') ? contractStatusDotHtml(c) : _cuE(c.status || '');
    const priced = typeof isMonetary !== 'function' || isMonetary(c);
    const val = !priced ? i18t('reg_non_monetary') : !c.value ? '—'
      : (typeof fmtMoneyShortIn === 'function' && typeof contractCurrency === 'function') ? fmtMoneyShortIn(c.value, contractCurrency(c))
      : (typeof fmtMoneyOf === 'function') ? fmtMoneyOf(c) : String(c.value);
    const ends = cuEnds(c);
    return `<tr data-cu-row="${_cuE(c.id)}" tabindex="-1">
      <td class="mono cu-ind">${(typeof refHtml === 'function') ? refHtml(c) : _cuE(c.id)}</td>
      <td><span class="ap-name" title="${_cuE(c.name || '')}">${_cuE(c.name || '—')}</span></td>
      <td>${stage}${mv}</td>
      ${money ? `<td class="n${priced ? '' : ' quiet'}">${_cuE(val)}</td>` : ''}
      <td class="${ends ? '' : 'quiet'}">${_cuE(ends ? cuDay(ends) : '—')}</td>
    </tr>`;
  };
  const body = ids.map(id => {
    const g = list.filter(c => (c.folder || '') === id);
    const shut = !!_cu.closed[id];
    const gm = money ? cuMoneyWords(g) : '';
    return `<tr class="cu-grp" data-cu-grp="${_cuE(id)}" aria-expanded="${shut ? 'false' : 'true'}"><td colspan="${cols}"><span class="cu-car" aria-hidden="true">${shut ? '▸' : '▾'}</span>${
      id ? cuStripeHtml(id) : ''}${_cuE(cuStreamName(id) || i18t('cu_no_stream'))}<span class="cu-cnt">${g.length}${gm ? ' · ' + _cuE(gm) : ''}</span></td></tr>${shut ? '' : g.map(row).join('')}`;
  }).join('');
  const table = list.length
    ? `<table class="ap-table ap-ins cu-table"><colgroup>${head.map(h => `<col${h.w ? ` style="width:${h.w}px"` : ''}>`).join('')}</colgroup><thead><tr>${
      head.map(h => `<th${h.r ? ' class="n"' : ''}>${_cuE(h.t)}</th>`).join('')}</tr></thead><tbody id="cu-tbody">${body}</tbody></table>`
    : `<div class="ap-empty">${_cuE(_cu.tab === 'expired' ? i18t('cu_none_expired') : i18t('cu_none_here'))}</div>`;
  const title = i18t(_cu.tab === 'active' ? 'cu_title_active' : _cu.tab === 'expired' ? 'cu_title_expired' : 'cu_title_all');
  const foot = [`<span>${_cuE(i18tn('cu_n_contracts', list.length, { n: list.length }))} · ${_cuE(i18tn('cu_n_streams', ids.filter(Boolean).length, { n: ids.filter(Boolean).length }))}</span>`,
    cuPartFoot()].filter(Boolean).join('');
  const tabs = (typeof insViewTabsHtml === 'function') ? insViewTabsHtml({ label: i18t('cu_tabs_label'), attr: 'data-cu-tab', cur: _cu.tab,
    views: [{ k: 'active', label: i18t('cu_tab_active'), n: act.length }, { k: 'expired', label: i18t('cu_tab_expired'), n: exp.length }, { k: 'all', label: i18t('cu_tab_all'), n: items.length }] }) : '';
  return `<div class="sap-band">
      <nav class="cu-crumb" aria-label="${_cuE(i18t('cu_crumb_label'))}"><button type="button" data-cu-list>${_cuE(i18t('nav_customers'))}</button><span aria-hidden="true">›</span><span>${_cuE(r.name)}</span></nav>
      <div class="cu-head">
        <div class="cu-id">${cuAvHtml(r.name)}<div style="min-width:0"><h1 class="cu-t">${_cuE(r.name)}</h1><div class="page-facts">${
          _cuE(i18tn('cu_n_contracts', items.length, { n: items.length }))} · ${_cuE(i18tn('cu_n_streams', r.streams.length, { n: r.streams.length }))}</div></div></div>
        <div class="cu-acts">
          <button type="button" class="ui-btn" data-cu-explorer>${_cuE(i18t('cu_open_explorer'))}</button>
          <button type="button" class="hm-primary" data-cu-draft="${_cuE(r.name)}">${(typeof icon === 'function') ? icon('plus', 'w-3.5 h-3.5', 2) : ''} ${_cuE(i18t('home_draft_new'))}</button>
        </div>
      </div>
      <dl class="cu-kpis" style="margin:0">
        ${kpi(i18t('cu_tab_active'), String(act.length), money ? cuMoneyWords(act) : '')}
        ${kpi(i18t('cu_tab_expired'), String(exp.length), money ? cuMoneyWords(exp) : '')}
        ${kpi(i18t('cu_col_next_end'), next ? cuDay(next) : '—', '')}
        ${kpi(i18t('cu_col_waiting'), String(w), '', w ? 'is-amber' : '')}
      </dl>
      <div class="reg-tabbar">${tabs}${cuFilterBarHtml(items, false)}</div>
    </div>
    ${INS ? `<div class="ap-body is-ins cu-body">${cuCardHtml(title, list.length, table, foot)}<aside id="ins-panel" class="ins-panel" aria-label="${_cuE(i18t('ins_panel_label'))}"></aside></div>`
      : `<div class="cu-body">${cuCardHtml(title, list.length, table, foot)}</div>`}`;
}

/* ---- THE PANELS ---- */
function cuContractActs(c){
  if (!c) return [];
  let mayNego = true; try { mayNego = !window.negoMayStart || negoMayStart(c).ok; } catch (_) { mayNego = true; }
  const started = !!(c.negotiation && Array.isArray(c.changes) && c.changes.length);
  const openC = { k: 'open', kind: 'accent', label: i18t('ins_open_contract'), iconEnd: 'chevR', run: x => cuOpenContract(x.id) };
  const openN = { k: 'nego', label: i18t('ins_open_nego'), icon: 'msg', run: x => { if (typeof openRedlineWorkbench === 'function') openRedlineWorkbench(x.id); } };
  return (started && mayNego && typeof openRedlineWorkbench === 'function') ? [openC, openN] : [openC];
}
function cuPaintContractPanel(tb){
  const seat = 'customer';
  const idOf = r => r.getAttribute('data-cu-row');
  const id = insPick(seat, [...tb.querySelectorAll('[data-cu-row]')].map(idOf));
  insMarkRow(tb, '[data-cu-row]', idOf, id);
  const paint = pid => {
    const c = pid && typeof getContract === 'function' ? getContract(pid) : null;
    let menu = ''; if (c && typeof regRowActsHtml === 'function'){ try { menu = regRowActsHtml(c); } catch (_) { menu = ''; } }
    insPaintPanel({ seat, c, acts: cuContractActs(c), menuHtml: menu,
      onMenu: (act, cid) => { if (typeof regRunRowAct === 'function') regRunRowAct(act, cid); },
      moveSuffix: true, statusBeside: true, order: ['facts', 'reads'], factKeys: ['value', 'owner', 'stream', 'ends'],
      empty: i18t('ins_none_rows') });
  };
  paint(id);
  insListWire(tb, { rowSel: '[data-cu-row]', idOf,
    onSelect: pid => { insSelect(seat, pid); insMarkRow(tb, '[data-cu-row]', idOf, pid); paint(pid); },
    onOpen: pid => cuOpenContract(pid) });
}
function cuPaintCustomerPanel(tb){
  const seat = 'customers';
  const idOf = r => r.getAttribute('data-cu-cust');
  const id = insPick(seat, [...tb.querySelectorAll('[data-cu-cust]')].map(idOf));
  insMarkRow(tb, '[data-cu-cust]', idOf, id);
  const money = cuMoney();
  const paint = key => {
    const r = key ? cuCustomerOf(key) : null;
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
          { k: 'explorer', label: i18t('cu_open_explorer'), run: () => cuOpenExplorer() }] },
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
  /* A customer whose last contract went (deleted, re-named, out of reach)
     has no page: the reader lands on the list, never on an empty shelf. */
  const r = _cu.cust ? cuCustomerOf(_cu.cust) : null;
  if (_cu.cust && !r) _cu.cust = null;
  const INS = (typeof insFits === 'function') && insFits() && typeof insPaintPanel === 'function';
  const keep = (() => { const sc = document.querySelector('.cu-scroll'); return sc ? sc.scrollTop : 0; })();
  const typing = document.activeElement && document.activeElement.id === 'cu-q';
  host.innerHTML = `<style>${CU_CSS}</style>
  <div class="view-enter sap-page ap-page cu-page${INS ? ' is-ins' : ''}" data-ins-page="customers" data-ins="${INS ? '1' : '0'}" data-cu-screen="${r ? 'customer' : 'list'}">
    ${r ? cuCustomerHtml(r, INS) : cuListHtml(INS)}
  </div>`;
  const sc = host.querySelector('.cu-scroll'); if (sc && keep) sc.scrollTop = keep;
  cuWire(host, r, INS);
  if (typing){ const q = document.getElementById('cu-q'); if (q){ q.focus(); const n = q.value.length; try { q.setSelectionRange(n, n); } catch (_) {} } }
  if (INS && typeof insWatchWidth === 'function') insWatchWidth();
  if (typeof setActiveNav === 'function') setActiveNav('customers');
}
function cuRepaint(){ if (typeof state !== 'undefined' && state.view === 'customers') renderCustomers(); }
function cuWire(host, r, INS){
  host.querySelector('[data-cu-list]')?.addEventListener('click', () => cuOpenList());
  host.querySelector('[data-cu-explorer]')?.addEventListener('click', () => cuOpenExplorer());
  host.querySelector('[data-cu-draft]')?.addEventListener('click', e => cuDraftFor(e.currentTarget.getAttribute('data-cu-draft') || ''));
  host.querySelectorAll('[data-cu-tab]').forEach(b => b.addEventListener('click', () => {
    _cu.tab = CU_TABS.includes(b.getAttribute('data-cu-tab')) ? b.getAttribute('data-cu-tab') : 'active';
    renderCustomers(); if (typeof placeSave === 'function') placeSave(); }));
  host.querySelectorAll('select[data-cu-f]').forEach(s => s.addEventListener('change', () => {
    const k = s.getAttribute('data-cu-f'); if (!['stream', 'owner', 'type'].includes(k)) return;
    _cu[k] = s.value || 'all'; renderCustomers(); if (typeof placeSave === 'function') placeSave(); }));
  const q = host.querySelector('#cu-q');
  if (q) q.addEventListener('input', () => { _cu.q = q.value; renderCustomers(); });
  const tb = host.querySelector('#cu-tbody');
  if (!tb) return;
  /* A stream's heading folds its group; it is not a row the inspector moves to. */
  tb.addEventListener('click', e => {
    const g = e.target.closest && e.target.closest('[data-cu-grp]');
    if (!g) return;
    const id = g.getAttribute('data-cu-grp');
    _cu.closed[id] = !_cu.closed[id];
    renderCustomers();
  });
  if (INS){ if (r) cuPaintContractPanel(tb); else cuPaintCustomerPanel(tb); return; }
  /* Narrow window: no panel, so a press opens. */
  tb.addEventListener('click', e => {
    const row = e.target.closest && e.target.closest(r ? '[data-cu-row]' : '[data-cu-cust]');
    if (!row) return;
    if (r) cuOpenContract(row.getAttribute('data-cu-row')); else cuOpenCustomer(row.getAttribute('data-cu-cust'));
  });
}

Object.assign(window, { CU_TABS, cuNameOf, cuKeyOf, cuBook, cuBucket, cuCustomers, cuCustomerOf, cuDoorCount, cuNextEnd, cuFilterItems,
  cuPlace, cuPlacePut, cuOpenList, cuOpenCustomer, cuOpenExplorer, cuDraftFor, renderCustomers, cuRepaint });
