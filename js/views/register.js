// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   VIEW: FOLDER (filtered register + local search)
   ============================================================ */
const FOLDER_PAGE=50;
/* A member without can_view_values never receives a value from the server, so
   offering them "Value (high → low)" would be an option that silently sorts
   every row as zero. Drop it from the menu rather than leave it there broken —
   and fall the current sort back to the default if they were already on it. */
function visibleSorts(list){
  if(typeof canViewValues!=='function' || canViewValues()) return list;
  return list.filter(s=>s.k!=='value');
}
const FOLDER_SORTS=[
  {k:'updated',get label(){ return i18t('reg_sort_recent'); }},
  {k:'value',get label(){ return i18t('reg_sort_value'); }},
  {k:'expiry',get label(){ return i18t('reg_sort_expiring'); }},
  {k:'name',get label(){ return i18t('reg_sort_name'); }},
];
// The filtered + sorted contracts for the current folder (shared by the full
// render and the search/keystroke body re-render).
function folderFiltered(){
  const f=FOLDERS[state.folderId]; if(!f) return [];
  const q=(state.folderQuery||'').trim().toLowerCase();
  // the stream drawer is a daily list, so the shelf stays off it (WO-5);
  // the Archived view on the Contracts page is the one way back in
  let cs=folderContracts(f.id).filter(c=>!c.archived);
  if(q) cs=cs.filter(c=>(c.name+' '+(c.counterparty||'')+' '+c.id).toLowerCase().includes(q));
  let sort=state.folderSort||'updated';
  // a stored "sort by value" preference is meaningless without the right
  if(sort==='value' && typeof canViewValues==='function' && !canViewValues()) sort='updated';
  const upd=c=>{ const t=Date.parse(c.lastAction); return isNaN(t)?0:t; };
  if(sort==='updated') cs.sort((a,b)=>upd(b)-upd(a));
  else if(sort==='value') cs.sort((a,b)=>Number(b.value||0)-Number(a.value||0));
  else if(sort==='name') cs.sort((a,b)=>a.name.localeCompare(b.name));
  else if(sort==='expiry') cs.sort((a,b)=>{ const ea=effectiveExpiry(a), eb=effectiveExpiry(b); const da=ea?daysUntil(ea):1e9, db=eb?daysUntil(eb):1e9; return da-db; });
  return cs;
}
function renderFolder(){
  const f=FOLDERS[state.folderId];
  if(!f){ setView('dashboard'); return; }
  state.folderShown=FOLDER_PAGE; state.folderSel={};   // fresh selection on entry
  const cs=folderFiltered();
  const val=cs.filter(c=>c.status!=='Declined').reduce((s,c)=>s+(window.fxHomeValue?fxHomeValue(c):Number(c.value||0)),0);
  const sortOpts=visibleSorts(FOLDER_SORTS).map(s=>`<option value="${s.k}" ${(state.folderSort||'updated')===s.k?'selected':''}>${s.label}</option>`).join('');

  /* A select left on `appearance:auto` is drawn by the platform, and the
     platform draws it with a hard dark edge and a square corner whatever the
     border says. Turning the appearance off hands the closed control back to
     us — soft grey edge, the same 8px corner the rest of the page uses, and
     our own chevron in place of the native arrow.

     The OPEN list is still the browser's own popup and cannot be styled from
     a page in any engine; only the closed control is ours to dress. */
  /* BASE64, NOT A RAW SVG. These styles are written into a style="" attribute,
     and a plain data URI carries the quotes the SVG's own attributes need —
     the first one closes the attribute and the whole rule is dropped, which is
     exactly what happened: the arrow vanished entirely. Base64 has no quotes
     in it, so it survives the trip into the attribute. */
  const selChevron='url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTRhM2I4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTYgOSA2IDYgNi02Ii8+PC9zdmc+)';
  const selStyle='font:inherit;font-size:13px;border:1px solid var(--field-line);background-color:var(--color-surface);border-radius:0;padding:5px 26px 5px 9px;color:inherit;cursor:pointer;appearance:none;-webkit-appearance:none;background-image:'+selChevron+';background-repeat:no-repeat;background-position:right 8px center;background-size:12px';
  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:var(--page-pad)">
    <style>
      .fold-table{width:100%;border-collapse:collapse;font-size:14px}
      .fold-table th{text-align:left;font-size:12px;color:color-mix(in srgb,var(--color-text) 60%,transparent);padding:6.8px;border-bottom:1px solid var(--color-divider);white-space:nowrap;background:var(--color-neutral-100)}
      .fold-table td{padding:6.8px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 8%,transparent);vertical-align:middle}
      .fold-table tbody tr:hover{background:color-mix(in srgb,var(--color-text) 4%,transparent)}
    </style>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <button id="back-dash" style="width:28px;height:28px;flex:none;display:inline-grid;place-items:center;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;color:var(--color-accent-700);cursor:pointer" title="${i18t('reg_back_to_portfolio')}">${icon('arrowLeft','w-4 h-4')}</button>
        <span style="width:28px;height:28px;flex:none;display:grid;place-items:center;background:var(--color-accent-800);color:#fff;border-radius:0">${icon(f.ic,'w-4 h-4')}</span>
        <div style="min-width:0">
          <div style="font-family:var(--font-mono);font-weight:600;font-size:17px;color:var(--color-text);line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.name)}</div>
          <div style="font-size:12px;color:var(--color-neutral-600)"><span id="fold-count">${cs.length}</span> contracts${(typeof canViewValues==='function'&&!canViewValues())?'':` · ${fmtMoneyShort(val)} active value`}</div>
        </div>
        <span style="flex:1"></span>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--color-neutral-700)">${i18t('reg_sort')}
          <select id="folder-sort" style="${selStyle}">${sortOpts}</select>
        </label>
        <div style="position:relative">
          <span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--color-neutral-500);display:inline-flex">${icon('search','w-3.5 h-3.5')}</span>
          <input id="folder-search" value="${(state.folderQuery||'').replace(/"/g,'&quot;')}" type="text" placeholder="${i18t('reg_search_folder')}" style="width:230px;max-width:60vw;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:6px 9px 6px 30px;font:inherit;font-size:13px;outline:none;color:inherit">
        </div>
      </div>

      <div id="fold-selbar" class="flex hidden items-center justify-between" style="gap:12px;border:1px solid var(--color-accent-800);background:var(--color-accent-800);color:#fff;border-radius:0;padding:8px 12px">
        <span id="fold-sel-count" style="font-size:13px;font-weight:600">${i18t('reg_n_selected',{n:0})}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <button id="fold-export" style="display:inline-flex;align-items:center;gap:6px;border:0;background:rgba(255,255,255,.16);color:#fff;border-radius:0;padding:5px 10px;font:inherit;font-size:13px;font-weight:600;cursor:pointer">${icon('download','w-3.5 h-3.5')} Export CSV</button>
          <button id="fold-clear" style="border:0;background:none;color:rgba(255,255,255,.72);padding:5px 8px;font:inherit;font-size:13px;font-weight:600;cursor:pointer">${i18t('reg_clear')}</button>
        </div>
      </div>

      <section class="blueprint bp-round" style="background:var(--color-surface);box-shadow:var(--shadow-sm)">
        
        <div class="table-scroll">
          <table class="fold-table">
            <thead>
              <tr>
                <th style="width:26px;padding-left:12px"><input id="fold-selall" type="checkbox" style="accent-color:var(--color-accent)"></th>
                <th>${i18t('reg_col_contract')}</th>
                <th>${i18t('reg_col_type')}</th>
                <th style="text-align:right">${i18t('reg_col_value')}</th>
                <th>${i18t('reg_col_expires')}</th>
                <th>${i18t('reg_col_updated')}</th>
                <th style="width:58px;text-align:center" title="${i18t('reg_link_title')}">${i18t('reg_col_link')}</th>
                <th style="text-align:right;padding-right:12px">${i18t('reg_col_status')}</th>
              </tr>
            </thead>
            <tbody id="fold-tbody">${folderRowsHtml(cs)}</tbody>
          </table>
        </div>
        ${''/* The legend belongs WITH the table it explains, so this page grew
               a footer strip to hold it — the register already had one. A
               column of coloured marks and no key is the thing that prompted
               all of this. */}
        <div style="border-top:1px solid var(--color-divider);padding:6px 12px">
          ${window.shareLegendHtml?shareLegendHtml({style:'font-size:12px'}):''}
        </div>
      </section>
    </div>
  </div>`;

  document.getElementById('back-dash').addEventListener('click',()=>setView('dashboard'));
  const si=document.getElementById('folder-search');
  si.addEventListener('input',()=>{ state.folderQuery=si.value; state.folderShown=FOLDER_PAGE; renderFolderListOnly(); });
  si.focus(); si.setSelectionRange(si.value.length,si.value.length);
  document.getElementById('folder-sort').addEventListener('change',e=>{ state.folderSort=e.target.value; state.folderShown=FOLDER_PAGE; renderFolderListOnly(); });
  // controls that live OUTSIDE the tbody — bound once (the tbody re-renders on
  // search/sort, so binding these here avoids stacking duplicate listeners).
  document.getElementById('fold-selall').addEventListener('change',e=>{ const on=e.target.checked; const cs=folderFiltered();
    cs.slice(0,Math.min(cs.length,state.folderShown||FOLDER_PAGE)).forEach(c=>{ state.folderSel=state.folderSel||{}; if(on) state.folderSel[c.id]=true; else delete state.folderSel[c.id]; });
    renderFolderListOnly(); });
  document.getElementById('fold-export').addEventListener('click',folderExportSelectedCsv);
  document.getElementById('fold-clear').addEventListener('click',()=>{ state.folderSel={}; renderFolderListOnly(); });
  wireFolderRows();
  renderFolderSelBar();
  setActiveNav('folder');
}
// Expiry cell: the date, plus a coloured "in Nd" / "Nd ago" hint when it's
// close or past (only for live contracts).
/* ---- THE EXPIRY DATE IS NUMERIC, DOTTED (owner-approved mockup, 20 Aug
   2026: "25.08.2026 · 7 d") ---- one fixed shape on every table that prints
   a term end. Digits, not month words, so the months-follow-the-language
   rule has nothing to translate here and both languages read one format. */
function regDotDate(iso){
  const d=new Date(iso+'T00:00:00');
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}
function folderExpiryCell(c){
  // the family-aware term: a master agreement shows the date its latest
  // amendment set, with a note naming the amendment it came from
  const eff=effectiveExpiry(c);
  if(!eff) return '<span style="color:var(--color-neutral-400)">—</span>';
  const from=window.expirySource?expirySource(c):null;
  const dt=regDotDate(eff);
  let col='var(--color-neutral-700)', hint='', weight=400;
  if(from) hint=i18t('reg_from_id',{id:from.id});
  if(c.status!=='Declined'){ const d=daysUntil(eff);
    if(d<0){ col='var(--st-ruby-fg)'; weight=600; hint=`${i18t('reg_days_ago',{n:-d})}${from?' · '+i18t('reg_from_id',{id:from.id}):''}`; }
    else if(d<30){ col='var(--st-ruby-fg)'; weight=600; hint=`${i18t('reg_in_days',{n:d})}${from?' · from '+from.id:''}`; }
    else if(d<=90){ col='var(--st-amber-fg)'; hint=`${i18t('reg_in_days',{n:d})}${from?' · from '+from.id:''}`; }
  }
  return `<span style="color:${col};font-weight:${weight};font-variant-numeric:tabular-nums">${dt}</span>${hint?`<span style="display:block;font-size:12px;color:${col}">${hint}</span>`:''}`;
}
// Render up to state.folderShown rows as a table body, with a "Show more" pager.
function folderRowsHtml(cs){
  if(!cs.length) return `<tr><td colspan="8" style="padding:44px 20px;text-align:center">
      <div style="font-size:14px;font-weight:600;color:var(--color-text)">${(state.folderQuery||'').trim()?i18t('reg_stream_none_match',{q:state.folderQuery}):i18t('reg_stream_none_yet')}</div>
      <div style="font-size:13px;color:var(--color-neutral-600);margin-top:4px">${(state.folderQuery||'').trim()?i18t('reg_stream_widen'):i18t('reg_stream_create_hint')}</div>
    </td></tr>`;
  const shown=Math.min(cs.length, state.folderShown||FOLDER_PAGE);
  const sel=state.folderSel||{};
  return cs.slice(0,shown).map((c,i)=>{
    const o=(window.openFindings?openFindings(c):[])||[];
    const scan=o.length?`<span class="badge" style="margin-left:6px;background:var(--st-ruby-bg);color:var(--st-ruby-fg)" title="${i18t('reg_open_findings')}">${icon('scan','w-2.5 h-2.5')}${o.length}</span>`:'';
    return `
    <tr data-open="${c.id}" style="cursor:pointer;animation-delay:${Math.min(i,14)*22}ms">
      <td style="padding-left:12px" onclick="event.stopPropagation()"><input type="checkbox" data-fsel="${c.id}" ${sel[c.id]?'checked':''} style="accent-color:var(--color-accent)"></td>
      <td style="max-width:260px"><div style="display:flex;align-items:center;gap:9px;min-width:0">
        <span style="width:26px;height:26px;flex:none;display:grid;place-items:center;border-radius:0;border:1px solid var(--color-divider);background:${isUpload(c)?'var(--color-accent-200)':'var(--color-bg)'};color:${isUpload(c)?'var(--color-accent-800)':'var(--color-neutral-600)'}" ${isUpload(c)?`title="${i18t('reg_uploaded_from_cp')}"`:''}>${icon(cIcon(c),'w-3.5 h-3.5')}</span>
        <span style="min-width:0">
          <span style="display:block;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</span>
          <span style="display:block;font-size:12px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span style="font-family:var(--font-mono)">${esc(c.id)}</span> · ${esc(c.counterparty||'No counterparty yet')}</span>
        </span>
      </div></td>
      <td style="font-size:13px;color:var(--color-neutral-700);white-space:nowrap"><span style="display:inline-flex;align-items:center;gap:6px">${icon(cIcon(c),'w-4 h-4')}${cKind(c)}</span>${scan}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums;font-weight:400;white-space:nowrap;${isMonetary(c)?'':'color:var(--color-neutral-400)'}" ${!isMonetary(c)?`title="${i18t('reg_non_monetary')}"`:''}>${!isMonetary(c)?'n/m':(c.value?(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):'—')}</td>
      <td style="font-size:13px;font-variant-numeric:tabular-nums;white-space:nowrap">${folderExpiryCell(c)}</td>
      <td style="font-size:12px;color:var(--color-neutral-600);white-space:nowrap">${c.lastAction||'—'}</td>
      ${''/* Same split as the register: the link mark to its own column, the
             question pill left with the stage it qualifies. */}
      <td style="text-align:center;white-space:nowrap">${window.shareLinkCell?shareLinkCell(c.id):''}</td>
      <td style="text-align:right;padding-right:12px;white-space:nowrap">${window.questionDot?questionDot(c.id):''}${window.contractStatusChip?contractStatusChip(c):statusChip(c.status)}</td>
    </tr>`; }).join('') + (cs.length>shown
      ? `<tr><td colspan="8" style="padding:0"><button id="folder-more" style="width:100%;padding:11px;font-size:14px;font-weight:600;color:var(--color-accent-700);background:none;border:0;border-top:1px solid var(--color-divider);cursor:pointer">Show ${Math.min(FOLDER_PAGE,cs.length-shown)} more · ${cs.length-shown} remaining</button></td></tr>`
      : '');
}
function folderSelCount(){ const s=state.folderSel||{}; return Object.keys(s).filter(k=>s[k]).length; }
function renderFolderSelBar(){
  const bar=document.getElementById('fold-selbar'); if(!bar) return; const n=folderSelCount();
  bar.classList.toggle('hidden',n===0);
  const lbl=document.getElementById('fold-sel-count'); if(lbl) lbl.textContent=i18t('reg_n_selected',{n});
}
// per-body wiring — safe to call on every tbody re-render (row checkboxes,
// the row "open" handler and the pager all live inside #fold-tbody).
function wireFolderRows(){
  wireOpens(document.getElementById('fold-tbody')||document);
  document.querySelectorAll('#fold-tbody [data-fsel]').forEach(el=>el.addEventListener('change',()=>{
    state.folderSel=state.folderSel||{}; const id=el.getAttribute('data-fsel');
    if(el.checked) state.folderSel[id]=true; else delete state.folderSel[id];
    renderFolderSelBar(); }));
  document.getElementById('folder-more')?.addEventListener('click',()=>{ state.folderShown=(state.folderShown||FOLDER_PAGE)+FOLDER_PAGE; renderFolderListOnly(); });
}
function folderExportSelectedCsv(){
  const sel=state.folderSel||{}; const ids=Object.keys(sel).filter(k=>sel[k]);
  const rows=folderContracts(state.folderId).filter(c=>ids.includes(c.id));
  if(!rows.length){ toast(i18t('reg_nothing_selected'),'err'); return; }
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const head=['ID','Name','Counterparty','Type','Value stream',`Value (${jxCurrency()})`,'Status','Last action','Expiry'];
  const body=rows.map(c=>[c.id,c.name,c.counterparty||'',cKind(c),FOLDERS[c.folder]?.name||'',csvValueCell(c),statusLabel(c.status),c.lastAction||'',c.expiry||''].map(esc).join(','));
  const csv=[head.map(esc).join(','),...body].join('\n');
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`hati-${FOLDERS[state.folderId]?.id||'folder'}-selection.csv`; a.click(); URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} contract${rows.length===1?'':'s'} to CSV`);
}
// re-render only the table body + header count on keystroke/sort/selection
// (keeps the search input focused)
function renderFolderListOnly(){
  const f=FOLDERS[state.folderId]; if(!f) return;
  const cs=folderFiltered();
  const tb=document.getElementById('fold-tbody'); if(!tb) return;
  /* Same as renderRegisterBody: the intro played when the page arrived. */
  tb.innerHTML=folderRowsHtml(cs);
  const cnt=document.getElementById('fold-count'); if(cnt) cnt.textContent=cs.length;
  const all=document.getElementById('fold-selall'); if(all){ const shownIds=cs.slice(0,Math.min(cs.length,state.folderShown||FOLDER_PAGE)); all.checked=shownIds.length>0 && shownIds.every(c=>state.folderSel&&state.folderSel[c.id]); }
  wireFolderRows(); renderFolderSelBar();
}

Object.assign(window,{FOLDER_PAGE,FOLDER_SORTS,folderFiltered,folderRowsHtml,folderExpiryCell,renderFolder,renderFolderListOnly,renderFolderSelBar,wireFolderRows,folderExportSelectedCsv});
/* ============================================================
   VIEW: REGISTER (global filterable / sortable table + bulk select)
   Client-side over the loaded working set, consistent with the folder
   view. Filters: search, lifecycle stage, contract type (folder), sort.
   ============================================================ */
const REG_PAGE=40;
const REG_STAGES=[
  {k:'all',get label(){ return i18t('reg_all_stages'); }},
  {k:'awaiting',get label(){ return i18t('reg_awaiting_cp'); }},
  {k:'Draft',label:'Drafting'},
  {k:'Under Review',label:'In Review'},
  {k:'Signed',label:'Executed'},
  {k:'Declined',label:'Closed'},
];
// Derived from FOLDERS so custom (user-created) streams appear automatically.
function regTypes(){
  const acc=(typeof userFolderAccess==='function')?userFolderAccess():'*';
  const folders=Object.values(FOLDERS).filter(f=>acc==='*'||acc.includes(f.id));
  return [{k:'all',get label(){ return i18t('reg_all_streams'); }}].concat(
    folders.map(f=>({ k:f.id, label:(typeof STREAM_SHORT!=='undefined'&&STREAM_SHORT[f.id])||f.name }))
  );
}
const REG_SORTS=[
  {k:'updated',get label(){ return i18t('reg_sort_recent'); }},
  {k:'value',get label(){ return i18t('reg_sort_value'); }},
  {k:'risk',get label(){ return i18t('reg_sort_risk'); }},
  {k:'expiry',get label(){ return i18t('reg_sort_expiring'); }},
  {k:'name',get label(){ return i18t('reg_sort_name'); }},
];
const REG_VIEWS=[
  {k:'expiring90', get label(){ return i18t('reg_exp_90'); }},
  {k:'expiring60', get label(){ return i18t('reg_exp_60'); }},
  {k:'expiring30', get label(){ return i18t('reg_exp_30'); }},
  {k:'expired',    get label(){ return i18t('reg_term_ended'); }},
  {k:'autosoon',   get label(){ return i18t('reg_auto_renew'); }},
  {k:'overdueob',  get label(){ return i18t('reg_overdue_obligations'); }},
  {k:'archived',   get label(){ return i18t('reg_view_archived'); }},
];
/* ---- WHICH PAGE THIS TABLE IS ON (added 2026-08-12) ----
   The register's machinery — its filters, its row builder, its body renderer,
   its wiring — now draws TWO pages: Contracts, and Negotiations. The owner
   asked for the second one to BE the first one, grouped by whose move it is
   (see renderNegotiationsList in js/views/negotiation.js, which is the door).

   IT IS A PROPERTY OF THE PAGE, ABOVE THE FILTERS, and that is the whole
   reason it is not regShowOnly. `only` is a set somebody handed the register
   and it is deliberately CLEARABLE — by its own ✕, by both Clear-all handlers
   and by the phone's. Reused as-is here, the reader would press Clear on the
   Negotiations page and be looking at all 145 contracts under a heading that
   says Negotiations. The scope is asked FIRST in regFiltered, no control
   offers to remove it, and Clear still clears everything the reader chose.

   TWO FILTER STATES, NOT ONE. state.reg is Contracts'; state.regNego is this
   page's. A stage filter set while looking at negotiations is not an opinion
   about the register, and carrying it across would be one page silently
   answering for the other. */
let REG_SCOPE = null;
/* ═══ ROW DENSITY — three heights on one axis (25 Aug 2026) ═══════════════
   SAP Fiori ships cozy / compact / condensed because the same table is read
   two different ways: a contract register is SCANNED and an approval queue is
   read one row at a time. HaTi shipped one 36px row, typed once as
   --reg-row-h with a single consumer.

   THE MIDDLE RUNG IS 36 AND IT IS THE DEFAULT, so nobody's book moves on the
   morning this ships. Fiori's own verified ladder is 48/32/24 against a
   different base; 36 is the value already tuned against THIS product's type,
   and the bracket is built around it rather than replacing it.

   THREE THINGS TRAVEL TOGETHER, not just the height: the padding and the line
   box move with it, because a 30px row with 12px of side padding reads as a
   squeezed 36 rather than as a condensed row.

   IT CANNOT REACH THE PHONE, and that is by construction rather than by a
   guard: below 768px the desktop shell hides entirely and the phone draws its
   own cards — `.reg-table` is never rendered there. Fiori states plainly that
   compact and condensed "cannot be interacted with via touch", so the phone
   keeping its own touch sizes is the rule, not an omission. */
/* ═══ WHICH FILTERS SIT ON THE BAR — "Adapt filters" (25 Aug 2026) ════════
   SAP Fiori's filter bar shows a user-chosen SUBSET of the available filters
   and keeps the rest behind an "Adapt filters" link. That is the answer to the
   problem this bar actually had: it would not fit on one line, and WO-15
   solved that on 24 Aug by DELETING the Renewal filter outright.

   THIS DOES NOT REVERSE THAT RULING, AND THE DEFAULT IS WHY. The bar's default
   set is exactly what ships today — stage, stream, saved view, category — and
   Renewal is NOT on it. The owner asked twice for it to be off their bar and
   it stays off. What changes is that a reader who wants it can now put it
   there, on their own browser, instead of the filter being unreachable.
   Its READING never went anywhere: regFiltered has known how to narrow by
   renewal type all along (line ~525), so this restores a door to a room that
   was still standing.

   THE SAFETY PROPERTY, and it is the whole reason this is not dangerous: a
   filter that is NARROWING THE LIST is drawn on the bar whether or not it was
   chosen. A hidden control that is quietly cutting the book is exactly the
   fault the owner's own removal note was guarding against — "so the filter can
   never be quietly on". It still cannot be. */
const REG_BAR_KEY = 'hati.v1.regBarFilters';
const REG_BAR_FILTERS = [
  { k:'stage',    fixed:true,  get label(){ return i18t('reg_lifecycle_stage'); } },
  { k:'type',     fixed:true,  get label(){ return i18t('reg_value_stream'); } },
  { k:'view',     fixed:false, get label(){ return i18t('reg_saved_views'); } },
  { k:'category', fixed:false, get label(){ return i18t('me_category'); } },
  { k:'renewal',  fixed:false, get label(){ return i18t('reg_renewal'); } },
];
/* Stage and stream are `fixed` — they are the two questions this register is
   always asked, and a bar with neither is not a filter bar. */
const REG_BAR_DEFAULT = ['stage','type','view','category'];
function regBarChosen(){
  try{
    const raw = localStorage.getItem(REG_BAR_KEY);
    if(!raw) return REG_BAR_DEFAULT.slice();
    const want = JSON.parse(raw);
    if(!Array.isArray(want)) return REG_BAR_DEFAULT.slice();
    const ok = REG_BAR_FILTERS.filter(f=>f.fixed||want.includes(f.k)).map(f=>f.k);
    return ok.length ? ok : REG_BAR_DEFAULT.slice();
  }catch(_){ return REG_BAR_DEFAULT.slice(); }
}
function regBarSetChosen(keys){
  try{ localStorage.setItem(REG_BAR_KEY, JSON.stringify(
    REG_BAR_FILTERS.filter(f=>f.fixed||keys.includes(f.k)).map(f=>f.k))); }catch(_){}
}
/* IS THIS FILTER ACTUALLY NARROWING ANYTHING RIGHT NOW — the predicate the
   safety property above rests on. */
function regFilterActive(k, R){
  R = R || regState();
  if(k==='stage')    return R.stage!=='all';
  if(k==='type')     return R.type!=='all';
  if(k==='view')     return !!R.view;
  if(k==='category') return !!R.category && R.category!=='all';
  if(k==='renewal')  return !!R.renewal && R.renewal!=='all';
  return false;
}
/* Chosen, PLUS anything currently narrowing the list. */
function regBarShown(R){
  const chosen = regBarChosen();
  return REG_BAR_FILTERS.filter(f=>chosen.includes(f.k)||regFilterActive(f.k,R)).map(f=>f.k);
}

const REG_DENSITY = {
  comfortable:{ h:44, padX:16, line:20 },
  compact:    { h:36, padX:12, line:20 },   /* today's row — the default */
  condensed:  { h:30, padX:8,  line:18 },
};
const REG_DENSITY_KEY = 'hati.v1.regDensity';
/* ABSENT MEANS COMPACT — the historic behaviour — so there is no migration
   and an unknown stored value falls back rather than drawing a broken row. */
function regDensity(){
  try{ const v = localStorage.getItem(REG_DENSITY_KEY); return REG_DENSITY[v] ? v : 'compact'; }
  catch(_){ return 'compact'; }
}
function regSetDensity(k){
  if(!REG_DENSITY[k]) return false;
  try{ localStorage.setItem(REG_DENSITY_KEY, k); }catch(_){}
  return true;
}
/* The three custom properties the table's own rules already read. Written as
   a style attribute on .reg-table so one element carries the whole mode. */
function regDensityVars(k){
  const d = REG_DENSITY[REG_DENSITY[k] ? k : 'compact'];
  return `--reg-row-h:${d.h}px;--reg-row-px:${d.padX}px;--reg-row-line:${d.line}px`;
}

function regScope(){ return REG_SCOPE; }
function regSetScope(k){ REG_SCOPE = (k === 'negotiations') ? 'negotiations' : null; }
const REG_STATE_DEF = () => ({query:'',stage:'all',type:'all',category:'all',sort:'updated',dir:-1,page:1,sel:{},view:null,only:null});
function regState(){
  if(regScope()==='negotiations'){ if(!state.regNego) state.regNego=REG_STATE_DEF(); return state.regNego; }
  if(!state.reg) state.reg=REG_STATE_DEF(); return state.reg;
}
/* ---- THE THREE GROUPS, IN THIS ORDER, ON EVERY SHELL ----
   Waiting on you first: it is the reason to open the page at all. The keys are
   what negWhoseMove answers with (js/views/negotiation.js), the tone is the
   app's existing amber / neutral / green state colour and nothing new, and the
   NAME and the COUNT ride beside the colour so the page reads in grey-scale.
   The phone renders its own row shape from this same list — one order, two
   shells, the way Contracts already works. */
const NEGO_BANDS=[
  {k:'you',  tone:'amber',  get label(){ return i18t('ngl_band_you'); }},
  {k:'them', tone:'gray',   get label(){ return i18t('ngl_band_them'); }},
  {k:'clear',tone:'green',  get label(){ return i18t('ngl_band_clear'); }},
];
const NEGO_BAND_DOT={amber:'var(--st-amber-dot)',gray:'var(--color-neutral-400)',green:'var(--st-green-dot)'};
/* Partition, never re-sort inside a group: whatever order the register's own
   sort produced is preserved within each band, which is what makes "Sort" mean
   something on this page. Stamped on the record the way regGroupFamilies
   stamps _famKids, so the renderer does not have to ask twice. */
function negoGroupByMove(cs){
  const buckets={you:[],them:[],clear:[]};
  for(const c of cs){
    const m=(typeof window.negWhoseMove==='function')?window.negWhoseMove(c):{k:'clear',n:0};
    c._ngBand=m.k; c._ngN=m.n;
    (buckets[m.k]||buckets.clear).push(c);
  }
  return NEGO_BANDS.reduce((out,b)=>out.concat(buckets[b.k]||[]),[]);
}
/* How many rows each band holds IN THE SET ON SCREEN. The bands count the
   filtered view — see the note the page prints when a filter is on. */
function negoBandCounts(cs){
  const n={you:0,them:0,clear:0};
  cs.forEach(c=>{ n[c._ngBand===undefined?'clear':c._ngBand]=(n[c._ngBand]||0)+1; });
  return n;
}
/* ---- A NAMED SET, SENT HERE FROM SOMEWHERE ELSE (added 2026-08-11) ----
   Asked for against the calendar: a day carrying more than one contract should
   open the register on those contracts, so the reader can see them side by side
   and pick. There was no way to say that — every filter here is a QUESTION
   (which stage, which stream, which category), and "these two, because that is
   what was on the 31st" is an ANSWER somebody else worked out.

   So `only` is a set of ids with a label saying where it came from. Two rules
   make it safe, and they are the same two the origin filter on the negotiation
   column has to obey: it SAYS on screen what it is narrowed to, and the way
   back is on the same chip. A list silently showing two of a hundred and
   thirty-nine contracts is indistinguishable from a broken register.

   It is an ordinary filter in every other respect — the stage, stream and
   category dropdowns still narrow further inside it, Clear clears it with the
   rest, and it survives navigation exactly as they do. */
function regShowOnly(ids, label){
  const list=Array.from(new Set((ids||[]).filter(Boolean)));
  /* A named set is always sent to CONTRACTS. The scope is cleared before the
     state is read, or a calendar day pressed while the reader happened to be on
     the Negotiations page would write its answer into that page's filters and
     then open a register that had never heard of it. */
  regSetScope(null);
  const R=regState();
  R.only=list.length?{ ids:list, label:String(label||'') }:null;
  R.page=1;
  if(typeof setView==='function') setView('register'); else renderRegister();
}
/* The category list has ONE source: the metadata field that records it. Add
   a category there and it reaches this filter and the phone's chips without
   either of them being edited. */
const regCategories = () => ((typeof META_FIELDS!=='undefined'?META_FIELDS:[]).find(f=>f.k==='category')||{opts:[]}).opts||[];
const regCatLabel = k => (typeof metaOptLabel==='function' ? metaOptLabel(k) : k);
/* 'none' is not a category — it is the pile that has none recorded yet, which
   is the worklist for getting a portfolio countable. Without it those
   contracts vanish under every category and there is no way back to them. */
function regCatMatch(c, want){
  const has=(c.metadata&&c.metadata.category)||'';
  return want==='none' ? !has : has===want;
}
// Ascending-natural comparators; regFiltered() multiplies each by R.dir (1 = asc, -1 = desc)
// so a column header click can toggle direction. STAGE follows lifecycle order.
const REG_STAGE_ORDER={ 'Draft':0, 'Under Review':1, 'Signed':2, 'Declined':3 };
const REG_CMP={
  updated:(a,b)=>((Date.parse(a.lastAction)||0)-(Date.parse(b.lastAction)||0)),
  value:(a,b)=>Number(a.value||0)-Number(b.value||0),
  risk:(a,b)=>contractRisk(a)-contractRisk(b),
  name:(a,b)=>(a.name||'').localeCompare(b.name||''),
  expiry:(a,b)=>{ const ea=effectiveExpiry(a), eb=effectiveExpiry(b); const da=ea?daysUntil(ea):1e9, db=eb?daysUntil(eb):1e9; return da-db; },
  stage:(a,b)=>((REG_STAGE_ORDER[a.status]??9)-(REG_STAGE_ORDER[b.status]??9)),
};
// direction applied on a column's FIRST header click (1 = ascending, -1 = descending)
const REG_SORT_DEFDIR={ updated:-1, value:-1, risk:-1, name:1, expiry:1, stage:1 };
/* ---- THIS LIST DOES NOT PAGE, AND THAT IS THE ANSWER TO THE BAND BREAK ----
   Contracts pages at 40 because a register holds every agreement a company has
   ever had. Live negotiations are the handful being argued over right now — a
   workspace with 145 contracts had one — so paging them buys nothing and costs
   the one thing the grouping exists for: a band header stranded at the foot of
   a page, or repeated at the top of the next one with a count that is either
   the group's or the page's and misleading whichever it is. One page, every
   group whole. The footer still counts CONTRACT ROWS (a band is not a row), so
   "showing 1–8 of 8" is the truth and the pager draws nothing. */
function regPageSize(){ return regScope()==='negotiations' ? 1e6 : REG_PAGE; }
// total pages for the current filtered set (min 1)
function regPageCount(cs){ return Math.max(1, Math.ceil(cs.length/regPageSize())); }
// clamp + return the current 1-based page
function regCurPage(cs){ const R=regState(); const n=regPageCount(cs); R.page=Math.min(Math.max(1, R.page||1), n); return R.page; }
// numbered pager (‹ Prev · 1 … windowed … N · Next ›), shown only when >1 page
function regPager(cs){
  const n=regPageCount(cs); if(n<=1) return '';
  const p=regCurPage(cs);
  const btn=(label,to,disabled,active)=>`<button ${disabled?'disabled':''} data-reg-page="${to}" style="min-width:32px;padding:5px 10px;font:inherit;font-size:13px;font-weight:${active?700:500};border:1px solid ${active?'var(--color-accent)':'var(--color-divider)'};background:${active?'var(--color-accent)':'var(--color-surface)'};color:${active?'#fff':(disabled?'var(--color-neutral-400)':'var(--color-accent-700)')};border-radius:0;cursor:${disabled?'default':'pointer'}">${label}</button>`;
  const nums=[]; const lo=Math.max(1,p-2), hi=Math.min(n,p+2);
  if(lo>1){ nums.push(btn('1',1,false,p===1)); if(lo>2) nums.push('<span style="padding:0 3px;color:var(--color-neutral-500)">…</span>'); }
  for(let i=lo;i<=hi;i++) nums.push(btn(String(i),i,false,i===p));
  if(hi<n){ if(hi<n-1) nums.push('<span style="padding:0 3px;color:var(--color-neutral-500)">…</span>'); nums.push(btn(String(n),n,false,p===n)); }
  return `<div style="display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap">${btn('‹ Prev',p-1,p<=1,false)}${nums.join('')}${btn('Next ›',p+1,p>=n,false)}</div>`;
}
// footer text: "Showing 1–40 of 55 · page 1 of 2 · aggregate KES …"
function regFooterText(cs){
  const n=regPageCount(cs), p=regCurPage(cs);
  const size=regPageSize();
  const start=cs.length?(p-1)*size+1:0, end=Math.min(cs.length,p*size);
  /* WHAT THE FOOTER IS COUNTING AGAINST. On Contracts it is the whole book —
     "of 145". On Negotiations that number would be a lie about a page that
     never shows anything but live negotiations, so the total is the live book:
     the same list the heading counts. */
  const countAll=regScope()==='negotiations'
    ? ((typeof window.negoLiveList==='function')?negoLiveList().length:cs.length)
    : ((state.serverStats&&state.serverStats.total!=null)?state.serverStats.total:state.contracts.length);
  const totalNote=cs.length!==Number(countAll)?` <span style="color:var(--color-neutral-500)">${i18t('reg_of_total',{n:Number(countAll).toLocaleString(jxLocale())})}</span>`:'';
  // agreements vs documents — a master plus its amendments is ONE agreement
  const fam=familyCounts(cs);
  const B=x=>`<b style="color:var(--color-text)">${x}</b>`;
  const famNote=fam.amendments?` · ${i18tn('reg_agreements',fam.agreements,{n:B(fam.agreements.toLocaleString(jxLocale()))})} · ${i18t('reg_documents',{n:B(fam.documents.toLocaleString(jxLocale()))})}`:'';
  const R=regState();
  /* Neither the amendment fold nor the page counter belongs on a list that
     never pages and groups by something else entirely. */
  const neg=regScope()==='negotiations';
  const flatBtn=neg?'':` · <button type="button" id="reg-flat" style="border:0;background:none;font:inherit;font-size:inherit;color:var(--color-accent-700);text-decoration:underline;cursor:pointer;padding:0">${R.flat?i18t('reg_group_amendments'):i18t('reg_show_flat')}</button>`;
  const pageNote=neg?'':` · ${i18t('reg_page_of',{p,n})}`;
  return `${i18t('reg_showing',{start:B(start.toLocaleString(jxLocale())),end:B(end.toLocaleString(jxLocale())),n:B(cs.length.toLocaleString(jxLocale()))})}${totalNote}${neg?'':famNote}${pageNote}${(typeof canViewValues==='function'&&!canViewValues())?'':` · ${i18t('reg_aggregate')} ${B(fmtMoneyShort(regAggregate(cs)))}`}${flatBtn}`;
}
// pinned-footer pager wiring — jump page + scroll the table body back to top
function wireRegPager(){
  document.querySelectorAll('#reg-pager [data-reg-page]').forEach(b=>b.addEventListener('click',()=>{
    const R=regState(); const cs=regFiltered(); const to=Number(b.getAttribute('data-reg-page'));
    R.page=Math.min(Math.max(1,to), regPageCount(cs)); renderRegisterBody();
    const sc=document.getElementById('reg-scroll'); if(sc) sc.scrollTop=0;
  }));
}
function regFiltered(){
  const R=regState(); let cs=state.contracts.slice();
  /* ---- THE PAGE'S OWN NARROWING, ABOVE EVERY QUESTION AND ABOVE `only` ----
     See regSetScope. Nothing below can widen this and no control offers to.
     A stage without the negotiation module answers with NOTHING rather than
     with everything: a page that says "Live negotiations" and lists all 145
     contracts is worse than a page that lists none. */
  if(regScope()==='negotiations')
    cs=(typeof window.negoIsLive==='function') ? cs.filter(c=>negoIsLive(c)) : [];
  /* Then, because it is not a question about a contract but a set somebody
     else chose — everything below narrows WITHIN it. */
  if(R.only&&Array.isArray(R.only.ids)){ const keep=new Set(R.only.ids); cs=cs.filter(c=>keep.has(c.id)); }
  /* ---- THE ARCHIVE SHELF (WO-5): filed away, not deleted ----
     Archived contracts leave every default list and come back under exactly
     ONE view, where they are all that shows. It lives with the views because
     "show me the shelf" is a way of looking, not a stage — an archived
     Signed contract is still Signed. Search (FTS and the palette) still
     finds them, which is the difference between filing and deleting. */
  if(R.view==='archived') cs=cs.filter(c=>!!c.archived);
  else cs=cs.filter(c=>!c.archived);
  // 'awaiting' is a virtual stage = contracts out with a counterparty and not yet
  // signed (a live share in 'sent' or 'opened'), matching the dashboard KPI. It
  // reads the dispatch state, not the status column. Real status pills fall
  // through to the exact-match filter.
  if(R.stage==='awaiting') cs=cs.filter(c=>{ const s=state.shareByContract&&state.shareByContract[c.id]; return !!s&&(s.state==='sent'||s.state==='opened'); });
  else if(R.stage!=='all') cs=cs.filter(c=>c.status===R.stage);
  if(R.type!=='all') cs=cs.filter(c=>c.folder===R.type);
  if(R.renewal&&R.renewal!=='all') cs=cs.filter(c=>(c.metadata&&c.metadata.renewalType)===R.renewal);
  if(R.category&&R.category!=='all') cs=cs.filter(c=>regCatMatch(c,R.category));
  // E3-T5 saved views (presets over metadata/obligations)
  // family-aware: expiry views work on AGREEMENTS and on the term the latest
  // amendment actually set, not on whatever was typed on the master
  const expWithin=n=>c=>{ if(c.parentId||c.status==='Declined') return false; const e=effectiveExpiry(c); return !!e&&daysUntil(e)>=0&&daysUntil(e)<=n; };
  if(R.view==='expiring90') cs=cs.filter(expWithin(90));
  else if(R.view==='expiring60') cs=cs.filter(expWithin(60));
  else if(R.view==='expiring30') cs=cs.filter(expWithin(30));
  /* Executed contracts whose term has run out. They match none of the three
     buckets above — each is `days >= 0` — so before this there was no filter
     anywhere in the product that would list them. */
  else if(R.view==='expired') cs=cs.filter(c=>!c.parentId&&!!(window.contractExpired&&contractExpired(c)));
  else if(R.view==='autosoon') cs=cs.filter(c=>{ const dd=renewalDecisionDate(c); return (c.metadata&&c.metadata.renewalType==='auto-renew')&&dd&&daysUntil(dd)>=0&&daysUntil(dd)<=60; });
  else if(R.view==='overdueob') cs=cs.filter(c=>(c.obligations||[]).some(o=>obState(o)==='overdue'));
  const q=R.query.trim().toLowerCase();
  if(q) cs=cs.filter(c=>(c.name+' '+(c.counterparty||'')+' '+c.id).toLowerCase().includes(q));
  // Per-member folder/stream access: a restricted member only ever sees the
  // streams an admin granted them (admins are always unrestricted).
  const acc=(typeof userFolderAccess==='function')?userFolderAccess():'*';
  if(acc!=='*') cs=cs.filter(c=>acc.includes(c.folder));
  const sortKey=(R.sort==='value' && typeof canViewValues==='function' && !canViewValues()) ? 'updated' : R.sort;
  const cmp=REG_CMP[sortKey]||REG_CMP.updated;
  const dir=(R.dir===1||R.dir===-1)?R.dir:(REG_SORT_DEFDIR[sortKey]||-1);
  cs.sort((a,b)=>{ const r=dir*cmp(a,b); return r!==0?r:((Date.parse(b.lastAction)||0)-(Date.parse(a.lastAction)||0)); });
  /* GROUPED BY WHOSE MOVE IT IS, not by family. An amendment carries its own
     negotiation, so nesting one under its parent here would put two separate
     arguments on one row; and the group order is the whole design of this page.
     The register's sort survives — it decides the order INSIDE each band. */
  if(regScope()==='negotiations') return negoGroupByMove(cs);
  // FAMILY GROUPING (default). Amendments sit under their parent instead of
  // floating as separate rows — a master agreement plus six addenda reads as
  // one agreement with six documents, which is what it is. `flat` shows every
  // document as its own row, which is what an auditor wants.
  return R.flat ? cs : regGroupFamilies(cs);
}
/* Order the filtered set so each child follows its parent, and tag the rows the
   renderer needs to indent / collapse. Children whose parent is not in the
   filtered set stay where they are (they are still real results). */
function regGroupFamilies(cs){
  const R=regState();
  const inSet=new Set(cs.map(c=>c.id));
  const kidsBy=new Map();
  for(const c of cs){ if(c.parentId&&inSet.has(c.parentId)){
    if(!kidsBy.has(c.parentId)) kidsBy.set(c.parentId,[]); kidsBy.get(c.parentId).push(c); } }
  const out=[];
  for(const c of cs){
    if(c.parentId&&inSet.has(c.parentId)) continue;      // emitted under its parent
    c._famKids=(kidsBy.get(c.id)||[]).length;
    c._famChild=false;
    out.push(c);
    const expanded = c._famKids && !(R.collapsed && R.collapsed[c.id]);
    if(expanded) for(const k of kidsBy.get(c.id)){ k._famChild=true; k._famKids=0; out.push(k); }
  }
  return out;
}
function regOwnerInitials(){ const u=currentUser(); const n=(u&&u.name)||FIRST_PARTY||'HaTi'; return n.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
// Row ⋯ actions — label + which real handler runs. All close the menu first.
/* ---- A SYMBOL PER ROW, AND THE SYMBOLS CARRY THE COLOUR ----
   This was six lines of plain text at one weight, so opening a contract,
   exporting it and deleting it all looked the same and the only way to find
   the row you wanted was to read all six. Each verb has a mark now, coloured
   with the accent — the label stays black, so the colour is a way in rather
   than six shouting lines. The two destructive rows keep ruby on BOTH the mark
   and the label: they are the one distinction a menu must never blur. */
const REG_ROW_ACTIONS=[
  {k:'open',   ic:'folderOpen',get label(){ return i18t('reg_open_workspace'); }},
  {k:'share',  ic:'share',     get label(){ return i18t('reg_share_with_cp'); }},
  {k:'scan',   ic:'sparkle',   get label(){ return i18t('reg_run_scan'); }},
  {k:'pdf',    ic:'printer',   get label(){ return i18t('reg_export_pdf'); }},
  {k:'decline',ic:'ban',       get label(){ return i18t('reg_decline_close'); }, ruby:true},
  /* the archive shelf (WO-5): reversible filing, editor-and-up — the same
     level as re-filing between streams, and audited the same way */
  {k:'archive', ic:'folder',  get label(){ return i18t('reg_archive'); }, when:c=>!c.archived&&(typeof canEdit!=='function'||canEdit())},
  {k:'restore', ic:'history', get label(){ return i18t('reg_restore'); }, when:c=>!!c.archived&&(typeof canEdit!=='function'||canEdit())},
  // permanent delete — only offered while a contract is still a draft or in review
  {k:'delete', ic:'trash',     get label(){ return i18t('reg_delete_permanently'); }, ruby:true, when:c=>c.status==='Draft'||c.status==='Under Review'},
];
/* THE ROW'S PRIMARY VERB.
   Not one generic "Open" down the column — each row offers the thing that
   stage actually calls for: a contract in review is opened to be argued over,
   an executed one is opened to be read. The destination is the engine's own
   workspace either way, so nothing here routes anywhere the ⋯ menu could not
   — which is also why the labels must not name surfaces ("Vault", "Doc Lab")
   that the platform no longer has. */
/* THE TITLE COLUMN IS THE TITLE, not the party.
   Everywhere else in HaTi a contract is headed by the OTHER SIDE — cPrimary
   returns the counterparty and falls back to the name (see js/core.js): on a
   card or a board tile, "Naivas Ltd" is what a reader is scanning for. The
   reference's register is built the other way, with Contract Title and
   Counterparty as two separate columns, so reusing cPrimary here printed the
   same company twice on every row. cPrimary is left alone — the Queue board,
   the calendar and the cards are all still party-led and correct. */
function regTitleOf(c){
  return esc((c && c.name && c.name.trim()) || cParty(c) || i18t('reg_untitled'));
}
function regPrimaryAction(c){
  const s = String((c && c.status) || 'Draft');
  if (s === 'Signed')       return i18t('reg_act_view');
  if (s === 'Under Review') return i18t('reg_act_review');
  if (s === 'Declined')     return i18t('reg_act_record');
  return i18t('reg_act_draft');
}
/* ---- WHOSE MOVE, AS ONE WORD ----
   The same readings the list has always drawn, in the same three classes, so
   the colours and the grey-scale fallback are one definition. Built here
   because BOTH shells want it: the desktop's last column and the phone's card.

   IT IS ONE WORD SINCE 25 Aug 2026 (owner-asked, off a screenshot with this
   column ringed: "change the highlighted area to simply Mine, theirs, etc.")
   — and that REVERSES the note that stood here, which argued the counterparty
   should be NAMED because "With Saw Sawa Ltd" answers what a reader scanning
   the page is deciding. TWO THINGS WERE WRONG WITH IT. The name is already on
   the row, two columns to the left, so the cell was repeating a cell you can
   see; and at the width this column gets it was being CUT — the screenshot
   reads "With Saw Sa…", "With Juno Li…", "1 change not…" — so the detail it
   was defending was not on screen anyway.

   NOTHING IS LOST ON THE DESKTOP: the sentence each cell used to print is the
   cell's own hover, which is the treatment the status chip beside it already
   takes ("a table cell has no room for a sentence"). THE PHONE HAS NO HOVER
   and therefore does drop the count — said out loud rather than absorbed; its
   card already prints the counterparty on a line of its own, so only the
   number goes.

   THE THIRD STATE IS ONE WORD TOO, and that was not the first answer. It was
   left as "Nothing outstanding" on the reasoning that it is not an answer to
   *whose* but the absence of one — and photographing the column killed that:
   at the width this column gets it drew "Nothing outst…", so the one cell
   still being CUT was the one exempted from the fix. "Neither" is the honest
   one-word answer to "whose move" when nobody owes one, and the sentence it
   replaced is its hover like the other two. */
function negoMovePillHtml(c){
  const m=(typeof window.negWhoseMove==='function')?window.negWhoseMove(c):{k:'clear',n:0};
  /* One word, one class, and the sentence it replaced on the hover. A title
     identical to its own word is noise, so the clear state carries none. */
  const pill=(cls,word,full)=>`<span class="ngl-w ${cls}"${
    full&&full!==word?` title="${esc(full)}"`:''}>${esc(word)}</span>`;
  const MINE=()=>i18t('ngl_move_mine');
  /* ---- WAITING ON US, BUT NOT TO DECIDE ANYTHING (13 Aug 2026) ----
     negWhoseMove bands an agreement whose counterparty holds no live copy
     under "Waiting on you", because sending them one is the move. Counting
     decisions here would be wrong twice over — there are none to make, and
     the number would send the reader to a column with nothing in it. The
     hover says what the move IS instead. See negWhoseMove for the whole rule. */
  if(m.why==='nocopy') return pill('ngl-w-you',MINE(),i18t('ng_no_live_copy'));
  /* ---- AND THE SAME FOR WORK WE HAVE NOT SENT (14 Aug 2026) ----
     Same reasoning one step earlier: these are our own asks, still on our desk,
     so there is nothing for this reader to DECIDE and "N needs you" would send
     them to a column of their own drafting. See negWhoseMove. */
  if(m.why==='unsent') return pill('ngl-w-you',MINE(),i18tn('ng_not_sent_yet',m.n,{n:m.n}));
  if(m.k==='you') return pill('ngl-w-you',MINE(),i18tn('ng_needs_you',m.n,{n:m.n}));
  if(m.k==='them') return pill('ngl-w-them',i18t('ngl_move_theirs'),
    i18t('ng_door_with',{who:c.counterparty||i18t('ng_door_them')}));
  return pill('ngl-w-clear',i18t('ngl_move_none'),i18t('ng_door_clear'));
}
/* ---- A BAND IS NOT A ROW ----
   It is a full-width heading that happens to live between rows: a coloured dot,
   the name in small caps, the count. Everything about the markup says so —
   role="presentation" on the <tr> and the <td> so no screen reader announces a
   table row, a real heading inside for the ones that do announce, no data-row
   (which is what wireRegRows binds the whole-row click to), no tab stop, and it
   is generated during render rather than being a member of the filtered set, so
   the footer's "showing 1–8 of 8" can never count one. */
function negoBandRowHtml(band, n){
  return `<tr class="ngl-band" role="presentation"><td role="presentation" colspan="8">
    <div class="ngl-band-in" role="heading" aria-level="3">
      <span class="ngl-band-dot" style="background:${NEGO_BAND_DOT[band.tone]}" aria-hidden="true"></span>
      <span class="ngl-band-k">${esc(band.label)}</span>
      <span class="ngl-band-n">${n}</span>
    </div></td></tr>`;
}
function regRowsHtml(cs){
  const R=regState();
  const neg=regScope()==='negotiations';
  if(!cs.length){
    const filtered = R.query.trim()||R.stage!=='all'||R.type!=='all'||R.view||(R.renewal&&R.renewal!=='all')||(R.category&&R.category!=='all')||!!R.only;
    const line = filtered ? i18t('reg_none_match') : i18t('reg_none_yet');
    const sub  = filtered ? i18t('reg_widen') : i18t('reg_create_from_template');
    const btn  = filtered
      ? `<button id="reg-empty-clear" class="ui-btn" style="font-size:13px;padding:6px 14px">${i18t('reg_clear_all_filters')}</button>`
      : `<button id="reg-empty-new" class="ui-btn ui-btn-primary" style="font-size:13px;padding:6px 14px">${i18t('pg_new_contract')}</button>`;
    return `<tr><td colspan="8" style="padding:48px 12px;text-align:center">
      <div style="max-width:340px;margin:0 auto">
        <div style="width:44px;height:44px;margin:0 auto 12px;display:grid;place-items:center;border-radius:0;background:var(--color-bg);color:var(--color-neutral-500)">${icon('list','w-5 h-5')}</div>
        <div style="font-size:15px;font-weight:600;color:var(--color-text)">${line}</div>
        <div style="font-size:13px;color:var(--color-neutral-600);margin:4px 0 14px;line-height:1.5">${sub}</div>
        ${btn}
      </div></td></tr>`;
  }
  const p=regCurPage(cs); const size=regPageSize(); const start=(p-1)*size;
  const pageRows=cs.slice(start, start+size);
  /* THREE BANDS, IN FIXED ORDER, EACH WITH ITS OWN COUNT — and an empty one is
     information ("Waiting on you · 0" is worth reading), which is why they are
     drawn off the fixed list rather than off the rows that happen to exist.
     Three bands over NOTHING is not information, and that case never reaches
     here: with no live negotiation at all the page draws its empty state
     instead of a table (see renderNegotiationsList). */
  const bandN=neg?negoBandCounts(pageRows):null;
  let bandAt=neg?0:-1;
  const bandsBefore=k=>{
    if(!neg) return '';
    let out='';
    while(bandAt<NEGO_BANDS.length && NEGO_BANDS[bandAt].k!==k){
      out+=negoBandRowHtml(NEGO_BANDS[bandAt],bandN[NEGO_BANDS[bandAt].k]||0); bandAt++;
    }
    if(bandAt<NEGO_BANDS.length){ out+=negoBandRowHtml(NEGO_BANDS[bandAt],bandN[k]||0); bandAt++; }
    return out;
  };
  const bandsAfter=()=>{
    let out='';
    while(neg && bandAt<NEGO_BANDS.length){
      out+=negoBandRowHtml(NEGO_BANDS[bandAt],bandN[NEGO_BANDS[bandAt].k]||0); bandAt++;
    }
    return out;
  };
  let lastBand=null;
  const actBtns=c=>REG_ROW_ACTIONS.filter(a=>!a.when||a.when(c)).map(a=>`<button data-act="${a.k}" data-id="${c.id}" class="reg-act${a.ruby?' danger':''}" style="display:flex;align-items:center;gap:9px;width:100%;border:0;background:none;font:inherit;font-size:13px;text-align:left;padding:6px 9px;border-radius:0;cursor:pointer;color:${a.ruby?'var(--st-ruby-fg)':'inherit'}">${window.icon?icon(a.ic,'w-3.5 h-3.5'):''}${a.label}</button>`).join('');
  return pageRows.map((c,i)=>{
    const eff=effectiveExpiry(c);
    const din=eff?daysUntil(eff):null;
    const renDate=eff?regDotDate(eff):'—';   // the mockup's "25.08.2026" shape
    const renIn=din==null?'':(din<0?i18t('reg_days_over',{n:Math.abs(din)}):i18t('reg_in_days',{n:din}));
    // urgency colour: red under 30 days (and overdue), gold under 90, else neutral
    const renUrgent=din!=null&&din<30, renSoon=din!=null&&din>=30&&din<=90;
    /* ---- ONE COLOUR PER EXPIRY CELL (the black ink, 24 Aug 2026) ----
       The date and its "· N d" suffix are one fact read as one glance, and
       the design draws the whole cell in one colour. HaTi drew the date in the
       primary ink and the suffix in the LABEL ink, so an ordinary row carried
       two greys inside a single cell — and the suffix was 14px text sitting on
       the secondary shade, which this product's own four-shades rule reserves
       for 11–13px. Urgent and soon already agreed (both halves ruby, both
       amber); only the ordinary branch disagreed, and it now matches the date
       beside it. THE URGENCY TONES ARE UNTOUCHED — the whole point of the cell
       is that ruby and amber still mean what they mean. */
    const renColor=din==null?'transparent':(renUrgent?'var(--st-ruby-fg)':renSoon?'var(--st-amber-fg)':'var(--color-neutral-700)');
    const renDateColor=renUrgent?'var(--st-ruby-fg)':renSoon?'var(--st-amber-fg)':'var(--color-neutral-700)';
    const val=!isMonetary(c)?'n/m':(c.value?(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):'—');
    /* The band header for the group this row opens, drawn once, ahead of it. */
    let band='';
    if(neg && c._ngBand!==lastBand){ band=bandsBefore(c._ngBand); lastBand=c._ngBand; }
    return band + `
    <tr data-row="${c.id}"${neg?' data-nego-row="1"':''} tabindex="${i===0?0:-1}"
      style="cursor:pointer;animation-delay:${Math.min(i,14)*22}ms">
      <td class="reg-mk">${c.id}</td>
      <td style="max-width:300px${c._famChild?';padding-left:30px':''}">
        ${''/* ---- ONE LINE PER CONTRACT (owner-ruled 24 Aug 2026) ----
              The document KIND used to sit on a quiet second line under the
              title, and that second line was the whole of this row's height:
              the owner chose to drop it and take the design's 36px row, which
              turns about 17 contracts on a laptop into about 24. THE FACT IS
              NOT LOST — the kind rides the title's own hover, and the VALUE
              STREAM it used to sit beside is now a column of its own rather
              than a colour with a legend at the foot of the page.
              A CHILD ROW IS THE SAME ONE LINE: the indent and the arrow say it
              is filed under the row above, and the arrow's hover names the
              relation and the parent, which is what the old second line said
              in full width. */}
        <span style="display:flex;align-items:center;gap:9px;min-width:0">
        <span class="reg-tick" style="background:${folderColor(c)}"></span>
        <span class="reg-title" style="min-width:0;flex:1;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(regTitleOf(c))} · ${esc(cKind(c))}">${c._famChild?`<span style="color:var(--color-neutral-400);font-family:var(--font-mono);font-size:13px;font-weight:400" title="${esc(RELATION_LABEL[c.relation]||'Amendment')} of ${esc(c.parentId)}">↳ </span>`:''}${regTitleOf(c)}${c._famKids?`<button type="button" data-fam-toggle="${c.id}" title="${R.collapsed&&R.collapsed[c.id]?'Show':'Hide'} the ${c._famKids} linked document${c._famKids===1?'':'s'}" style="margin-left:6px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:0;font:inherit;font-weight:400;font-size:13px;font-family:var(--font-mono);padding:1px 7px;cursor:pointer;color:var(--color-neutral-700)">${R.collapsed&&R.collapsed[c.id]?'+':'−'}${c._famKids}</button>`:''}</span>
        </span>
      </td>
      <td style="color:var(--color-neutral-700);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.counterparty||'—')}</td>
      ${''/* ---- THE STREAM IS A WORD NOW, NOT ONLY A COLOUR ----
             The 3px tick beside the title stays — it is the fastest thing on
             the row — but it was the ONLY carrier, explained by a legend at the
             very bottom of the page, and this file's own standing rule is that
             colour is never the only carrier. The column it takes is the one
             the LINK column gave up: that column answered "what happened to the
             link you sent them", which is a fact about one contract rather than
             something you scan a register for, and it drew an em-dash on every
             row of an ordinary workspace. It is on the contract's own page. */}
      <td style="color:var(--color-neutral-600);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc((window.FOLDERS&&FOLDERS[c.folder]&&FOLDERS[c.folder].name)||'')}">${esc((window.FOLDERS&&FOLDERS[c.folder]&&FOLDERS[c.folder].name)||'—')}</td>
      <td style="text-align:right;font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-weight:400;white-space:nowrap;${isMonetary(c)?'':'color:var(--color-neutral-400)'}">${val}</td>
      ${''/* The mockup's expiry cell: the date, then "· in Nd" in the urgency
            colour — red inside 30 days, amber to 90 — carrying its weight. */}
      <td style="white-space:nowrap;font-variant-numeric:tabular-nums"><span style="font-weight:400;color:${renDateColor}">${renDate}</span>${renIn?` <span style="font-size:13px;font-weight:400;color:${renColor}">· ${renIn}</span>`:''}</td>
      ${''/* ---- THE STAGE IS A DOT AND A WORD (owner-approved render, 24 Aug
             2026) ---- It was a filled chip, and five of them running down the
             middle of the page read as five buttons. The dot is the shape a
             scanned column needs and the word beside it is what keeps the
             colour from being the only carrier; contractStatusDotHtml shares
             its branch with the chip and the head's sentence, so no two of the
             three can disagree about which stage this is. THE QUESTION PILL
             STAYS beside it — an unanswered question IS about where the
             contract stands. */}
      <td style="white-space:nowrap"><span style="display:inline-flex;align-items:center;gap:6px">${window.questionDot?questionDot(c.id):''}${window.contractStatusDotHtml?contractStatusDotHtml(c):(window.contractStatusChip?contractStatusChip(c):statusChip(c.status))}</span></td>
      ${''/* ---- THE LAST COLUMN IS A STATE, NOT AN ACTION ----
             On Contracts it is the row's own verb plus the ⋯ menu. On
             Negotiations it is whose move it is, and the ⋯ IS GONE with the
             verb: every row on this page does exactly one thing — it opens the
             negotiation — and a menu whose first line reads "Open workspace"
             and lands somewhere else is a trap laid on the one page where the
             destination is not in doubt. Every one of those verbs is a press
             away on Contracts, where the row press already means "open the
             contract". */}
      ${''/* ---- THE ROW'S VERB IS THE ROW (owner-approved render, 24 Aug 2026)
             ---- The last column used to carry a text verb — "Review terms",
             "View contract" — beside the ⋯. Pressing the row already opens the
             contract, so that verb was mostly restating the stage two columns
             along. The ⋯ STAYS and keeps every act it had: it is the only way
             to archive, export or delete from this page, and its own first row
             ("Open workspace") is what the verb did.
             regPrimaryAction — the reading that chose the verb's WORD per
             status — now has NO caller. It is left exported rather than
             deleted, on this file's own convention for a builder whose feature
             has gone: a third caller must not be able to bring the column back
             through a door nobody remembered, and f240 pins that the row draws
             no verb. */}
      ${neg ? `<td style="text-align:right;white-space:nowrap">${negoMovePillHtml(c)}</td>` : `
      <td class="reg-cell-menu" style="position:relative;text-align:right;white-space:nowrap" onclick="event.stopPropagation()">
        <button data-menu="${c.id}" style="border:0;background:none;cursor:pointer;padding:0 4px;line-height:var(--row-line-1);color:var(--color-neutral-600);font-size:13px;letter-spacing:1px;vertical-align:middle" title="${i18t('reg_more_actions')}">⋯</button>
        <div data-menu-pop="${c.id}" style="display:none;position:absolute;right:8px;top:34px;z-index:30;width:180px;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);border-radius:0;padding:4px;flex-direction:column;text-align:left">${actBtns(c)}</div>
      </td>`}
    </tr>`;}).join('')
    /* Any band with no rows under it still gets its header and its zero — and
       the trailing ones are only reachable here, after the last row. */
    + bandsAfter();
}
// W2-1: converted to the workspace currency, so one column total is one currency
function regAggregate(cs){ return cs.filter(c=>c.status!=='Declined'&&!c.archived&&isMonetary(c)).reduce((s,c)=>s+(window.fxHomeValue?fxHomeValue(c):Number(c.value||0)),0); }
function renderRegisterBody(){
  const cs=regFiltered();
  /* The stagger intro belongs to arriving at the page; this body re-renders on
     every search keystroke, sort and pager press, and rows that replay their
     fade-in per keystroke read as a flickering table. One intro, then still. */
  const tb=document.getElementById('reg-tbody'); if(tb){ tb.innerHTML=regRowsHtml(cs); wireRegRows(); }
  const sh=document.getElementById('reg-showing'); if(sh){ sh.innerHTML=regFooterText(cs);
    document.getElementById('reg-flat')?.addEventListener('click',()=>{ const R=regState(); R.flat=!R.flat; renderRegisterBody(); }); }
  const pgr=document.getElementById('reg-pager'); if(pgr){ pgr.innerHTML=regPager(cs); wireRegPager(); }
}
function regCloseMenus(){ document.querySelectorAll('#reg-tbody [data-menu-pop]').forEach(m=>m.style.display='none'); }
function wireRegRows(){
  /* Whole-row click opens the contract's workspace — EXCEPT on the Negotiations
     page, where a row opens the NEGOTIATION. Same table, same builder, one
     different destination, decided off the row's own attribute rather than off
     the scope flag so a row can never disagree with the page that drew it. */
  const openRow=el=>{
    const id=el.getAttribute('data-row');
    if(el.getAttribute('data-nego-row')&&window.openRedlineWorkbench) openRedlineWorkbench(id);
    else selectContract(id);
  };
  document.querySelectorAll('#reg-tbody [data-row]').forEach(el=>el.addEventListener('click',()=>openRow(el)));

  /* ═══ ARROW KEYS THROUGH THE LIST — the single biggest "this feels fast"
     signal, and the one every benchmark has and HaTi did not ═══════════════
     MEASURED before this: js/views/register.js contained zero ArrowDown
     handling, and on the Negotiations page the row press was the SOLE route
     in — that list was mouse-only outright.

     ROVING TABINDEX, NOT role="grid". One row is in the tab order at a time
     and the arrows move which; the table stays a table. Declaring role="grid"
     would change how the whole thing is announced and how every cell is
     addressed, which is a much larger claim than "the arrows work" and would
     reach every existing reading of this table.

     THE BAND HEADINGS ARE SKIPPED BY CONSTRUCTION: they carry no data-row —
     they are role="presentation" grouping rows with no tab stop — so the
     query below simply never sees them and Down steps from the last row of
     one band to the first of the next.

     ONE DELEGATED LISTENER on the tbody, not one per row: this body repaints
     on every filter, sort and page change, and a listener per row would stack
     one set per repaint. */
  const tbody=document.getElementById('reg-tbody');
  if(tbody && !tbody.dataset.regKeysBound){
    tbody.dataset.regKeysBound='1';
    tbody.addEventListener('keydown',e=>{
      const row=e.target.closest && e.target.closest('[data-row]');
      if(!row) return;
      /* A control INSIDE the row owns its own keys — the ⋯ menu button and
         the family toggle are real buttons and Enter must press them, not
         open the contract behind them. */
      if(e.target!==row && /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
      const rows=[...tbody.querySelectorAll('[data-row]')];
      const i=rows.indexOf(row);
      let to=-1;
      if(e.key==='ArrowDown') to=Math.min(i+1,rows.length-1);
      else if(e.key==='ArrowUp') to=Math.max(i-1,0);
      else if(e.key==='Home') to=0;
      else if(e.key==='End') to=rows.length-1;
      else if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openRow(row); return; }
      else return;
      e.preventDefault();
      const next=rows[to]; if(!next||next===row) return;
      row.setAttribute('tabindex','-1');
      next.setAttribute('tabindex','0');
      next.focus({preventScroll:true});
      next.scrollIntoView({block:'nearest'});
    });
  }
  // expand / collapse an agreement's linked documents
  document.querySelectorAll('#reg-tbody [data-fam-toggle]').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation(); const R=regState(); const id=b.getAttribute('data-fam-toggle');
    R.collapsed=R.collapsed||{}; if(R.collapsed[id]) delete R.collapsed[id]; else R.collapsed[id]=true;
    renderRegisterBody();
  }));
  // ⋯ popover: toggle one open at a time
  document.querySelectorAll('#reg-tbody [data-menu]').forEach(btn=>btn.addEventListener('click',e=>{ e.stopPropagation(); const id=btn.getAttribute('data-menu'); const pop=document.querySelector('#reg-tbody [data-menu-pop="'+id+'"]'); const open=pop&&pop.style.display==='flex'; regCloseMenus(); if(pop&&!open) pop.style.display='flex'; }));
  document.querySelectorAll('#reg-tbody [data-act]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); regCloseMenus();
    const id=b.getAttribute('data-id'), act=b.getAttribute('data-act'), c=getContract(id); if(!c) return;
    if(act==='open') openWorkspace(id);
    else if(act==='share') openShareModal(c);
    else if(act==='scan') runScanFor(c);
    else if(act==='archive'||act==='restore'){
      if(window.contractSetArchived) contractSetArchived(c,act==='archive').then(ok=>{ if(ok) regRepaint(); });
    }
    else if(act==='delete') deleteContract(id).then(ok=>{ if(ok){
      /* The reader was three pages down when they pressed Delete; the row goes,
         the place stays. renderRegister() rebuilds the whole view and hard-resets
         R.page to 1, and the table scrolls inside #reg-scroll (not the outer
         #content-scroll) — so repaint only the body, which keeps the current page
         (clamping just if this page emptied), and put #reg-scroll back where it was. */
      const sc=document.getElementById('reg-scroll'); const top=sc?sc.scrollTop:0;
      renderRegisterBody();
      const sc2=document.getElementById('reg-scroll');
      if(sc2){ sc2.scrollTop=top;
        if(typeof requestAnimationFrame==='function') requestAnimationFrame(()=>{ sc2.scrollTop=top; }); }
    } });
    else openWorkspace(id); // Export PDF / Decline & close are completed inside the workspace
  }));
  // empty-state actions
  document.getElementById('reg-empty-clear')?.addEventListener('click',()=>{ const R=regState(); R.query=''; R.stage='all'; R.type='all'; R.view=null; R.renewal='all'; R.category='all'; R.only=null; R.page=1; const cs=document.getElementById('cmd-search'); if(cs) cs.value=''; regRepaint(); });
  document.getElementById('reg-empty-new')?.addEventListener('click',e=>{ e.stopPropagation(); const nb=document.getElementById('cmd-new'); if(window.openNewMenu){ openNewMenu(e.currentTarget); } else if(nb){ nb.click(); } });
}
/* Exports what the register is showing — every row the current filters, search
   and stage/stream pills resolve to, not just the page on screen. The old body
   read a tick-box selection; with the reference's seven columns there is no
   tick box, so that version could only ever have said "Nothing selected". */
function regExportCsv(){
  const rows=regFiltered();
  if(!rows.length){ toast(i18t('reg_nothing_to_export'),'err'); return; }
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const head=['ID','Name','Counterparty','Type','Category','Folder',`Value (${jxCurrency()})`,'Status','Last action','Expiry'];
  const body=rows.map(c=>[c.id,c.name,c.counterparty||'',cKind(c),(c.metadata&&c.metadata.category)||'',FOLDERS[c.folder]?.name||'',csvValueCell(c),statusLabel(c.status),c.lastAction||'',c.expiry||''].map(esc).join(','));
  const csv=[head.map(esc).join(','),...body].join('\n');
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='hati-register.csv'; a.click(); URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} contract${rows.length===1?'':'s'} to CSV`);
}
/* ---- ONE TABLE, TWO PAGES ----
   opts.scope switches this between Contracts (nothing passed) and Negotiations
   ('negotiations'); opts.head is the page's own heading block above the filter
   bar; opts.nav is which sidebar door lights. Everything else — the filters,
   the row builder, the body renderer, the wiring, the footer — is shared, on
   purpose and as the whole point: two tables of contracts built by two
   functions eventually disagree about what a row says, and disagreeing is
   exactly what the Negotiations page was written as a twenty-line signpost to
   avoid. Reuse is now what keeps that promise. */
let _regOpts={};
/* Repaint the page that is actually on screen. Every filter control inside this
   file used to call renderRegister() bare, which with two pages sharing the
   renderer would have turned Negotiations into Contracts on the first press of
   a dropdown — the scope reset to null by the argument nobody passed. */
function regRepaint(){ renderRegister(_regOpts); }
function renderRegister(opts){
  const o=opts||{};
  _regOpts={ scope:o.scope||null, head:o.head||null, nav:o.nav||'register', hostId:o.hostId||'content' };
  regSetScope(o.scope);
  const neg=regScope()==='negotiations';
  const R=regState(); R.page=1;
  const cs=regFiltered();
  const headHtml=typeof o.head==='function' ? o.head(cs) : (o.head||'');
  /* A select left on `appearance:auto` is drawn by the platform, and the
     platform draws it with a hard dark edge and a square corner whatever the
     border says. Turning the appearance off hands the closed control back to
     us — soft grey edge, the same 8px corner the rest of the page uses, and
     our own chevron in place of the native arrow.

     The OPEN list is still the browser's own popup and cannot be styled from
     a page in any engine; only the closed control is ours to dress. */
  /* BASE64, NOT A RAW SVG. These styles are written into a style="" attribute,
     and a plain data URI carries the quotes the SVG's own attributes need —
     the first one closes the attribute and the whole rule is dropped, which is
     exactly what happened: the arrow vanished entirely. Base64 has no quotes
     in it, so it survives the trip into the attribute. */
  const selChevron='url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTRhM2I4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTYgOSA2IDYgNi02Ii8+PC9zdmc+)';
  const selStyle='font:inherit;font-size:13px;border:1px solid var(--field-line);background-color:var(--color-surface);border-radius:0;padding:5px 26px 5px 9px;color:inherit;cursor:pointer;appearance:none;-webkit-appearance:none;background-image:'+selChevron+';background-repeat:no-repeat;background-position:right 8px center;background-size:12px';
  /* ---- ONE FILTER BAR, NOT THREE TIERS OF PILLS ----
     Stages, streams and saved views used to be three full-width rows of pills
     (plus a legend band and an export band) stacked above the table — the
     register's own data started below the fold. Each filter is now a compact
     dropdown on a single row; an active one carries the accent border so a
     narrowed set is still visible at a glance, and Clear puts everything back. */
  /* ---- A FILTER SAYS WHAT IT FILTERS (owner-approved render, 24 Aug 2026) ----
     These were five bare dropdowns whose only label was a title attribute, so
     two of them reading "Any" sat side by side meaning different things and the
     only way to tell was to hover. The label is drawn above the control, which
     is the design's own arrangement; the SELECT keeps its id, its options and
     its title, so every handler and every test that reaches for it is
     untouched. The row aligns on flex-end, so a labelled control and a bare one
     (the clear button, the sort) still sit on one baseline. */
  /* ---- THE ACTIVE FILTER IS THE ONE CARRIER NOW, SO IT HAS TO BE READABLE ----
     The resting edge went neutral on 25 Aug (the reference's own treatment), so
     "this filter is narrowing your list" is carried by the accent border, the
     600 weight and the accent ink alone. The INK was `--color-accent-800`, and
     dark does not redefine the accent ramp — MEASURED, 2.35:1 on the night
     panel, where AA wants 4.5. `--accent-ink` is the same accent ink WITH a
     dark answer and measures 9.59:1; the button beside it has read it since
     23 Aug and this control simply never did. The BORDER is fine either way
     (4.77:1) and is untouched. */
  const selFilter=(id,opts,active,title,label)=>`<label class="reg-f"><span class="reg-f-l">${esc(label||title)}</span><select id="${id}" title="${title}" style="${selStyle};max-width:180px${active?';border-color:var(--color-accent);color:var(--accent-ink);font-weight:600':''}">${opts}</select></label>`;
  const stageOpts=REG_STAGES.map(s=>`<option value="${s.k}" ${R.stage===s.k?'selected':''}>${s.label}</option>`).join('');
  const typeOpts=regTypes().map(t=>`<option value="${t.k}" ${R.type===t.k?'selected':''}>${t.label}</option>`).join('');
  const viewOpts=`<option value="" ${R.view?'':'selected'}>${i18t('reg_saved_views')}</option>`
    +REG_VIEWS.map(v=>`<option value="${v.k}" ${R.view===v.k?'selected':''}>${v.label}</option>`).join('');
  /* ---- RENEWAL IS BACK, AND IT IS OFF THE BAR BY DEFAULT ----
     Recovered unchanged from before WO-15 removed it, except that it now goes
     through selFilter like the other six rather than carrying its own copy of
     the markup — one builder is what stops them drifting. Every key it needs
     was still in both dictionaries. */
  const renewalActive=!!R.renewal&&R.renewal!=='all';
  const renewalOpts=[['all',i18t('reg_any')],['auto-renew',i18t('reg_renew_auto')],
                     ['fixed',i18t('reg_fixed')],['evergreen',i18t('reg_evergreen')]]
    .map(([k,l])=>`<option value="${k}" ${(R.renewal||'all')===k?'selected':''}>${l}</option>`).join('');
  const BAR=regBarShown(R);
  const densityOpts=['comfortable','compact','condensed']
    .map(k=>`<option value="${k}" ${regDensity()===k?'selected':''}>${esc(i18t('reg_density_'+k))}</option>`).join('');
  const filtered=R.stage!=='all'||R.type!=='all'||!!R.view||(R.renewal&&R.renewal!=='all')||(R.category&&R.category!=='all')||!!R.only;
  /* THE CHIP IS THE NARROWING AND THE WAY OUT OF IT, in one object — see
     regShowOnly. It leads the bar because it is the widest statement on it:
     every dropdown beside it narrows within this set. */
  const onlyChip=R.only?`<span id="reg-only-chip" title="${esc(i18t('reg_only_title'))}"
      style="display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;border-radius:0;padding:5px 6px 5px 10px;
        background:var(--color-accent-100);border:1px solid var(--color-accent-300);color:var(--color-accent-800)">
      <span>${esc(R.only.label||i18t('reg_only_fallback'))}</span>
      <button id="reg-only-clear" title="${esc(i18t('reg_only_clear'))}" aria-label="${esc(i18t('reg_only_clear'))}"
        style="border:0;background:none;font:inherit;font-size:14px;line-height:1;color:inherit;cursor:pointer;padding:0 3px;opacity:.7">&times;</button>
    </span>`:'';
  /* ---- AND THE LOCKED ONE, WHICH SAYS WHAT THE PAGE IS ----
     It wears the accent like the chip above it and carries a padlock, and it
     has no ✕ because there is nothing to remove: it is not a filter the reader
     chose. It leads the bar so everything to its right is plainly a narrowing
     WITHIN live negotiations. */
  /* ---- NO LOCKED CHIP (owner-asked 24 Aug 2026: "delete the highlighted
     filters so that there is enough space for all the filters to be on one
     line") ----
     It was never a filter — a padlock with no way to clear it, saying what the
     page IS. THE BETTER REASON TO REMOVE IT IS NOT THE SPACE: the heading
     directly above already reads "Negotiations" with a live count beside it,
     and the sentence under that says the same thing again, so the chip was a
     third statement of one fact. The SCOPE is untouched — it belongs to the
     page, not to the chip, and regFiltered applies it first whatever the bar
     draws. `lockChip` and `#reg-lock-chip` are retired — flag any mention. */
  const lockChip='';
  const sortOpts=visibleSorts(REG_SORTS).map(s=>`<option value="${s.k}" ${R.sort===s.k?'selected':''}>${s.label}</option>`).join('');
  // Clickable, sortable column header: shows a dim ↕ when inactive and a solid
  // ▲/▼ for the active sort direction. Clicking toggles asc/desc (see wiring below).
  const sortCaret=key=>R.sort===key
    ? `<span style="margin-left:4px;font-size:10px;color:var(--color-accent-700)">${R.dir===1?'▲':'▼'}</span>`
    : `<span class="reg-sort-idle" style="margin-left:4px;font-size:10px;color:var(--color-neutral-400)">↕</span>`;
  const sortableTh=(key,label,extra='')=>`<th class="reg-th-sort${R.sort===key?' active':''}" data-reg-sort="${key}" title="${i18t('reg_sort_by',{col:label})}" aria-sort="${R.sort===key?(R.dir===1?'ascending':'descending'):'none'}" style="cursor:pointer;user-select:none;${extra}">${label}${sortCaret(key)}</th>`;
  const catActive=!!(R.category&&R.category!=='all');
  const catOpts=[['all',i18t('reg_any')]].concat(regCategories().map(k=>[k,regCatLabel(k)]))
    .concat([['none',i18t('reg_uncategorised')]]);
  /* These two already carried a visible label, inline to the left of the
     control. They take the same stacked label as the three above so the bar
     reads as one row of filters rather than two conventions. */
  const categorySel=`<label class="reg-f"><span class="reg-f-l">${esc(i18t('me_category'))}</span>
    <select id="reg-category" style="${selStyle}${catActive?';border-color:var(--color-accent);color:var(--accent-ink);font-weight:600':''}">${catOpts.map(([k,l])=>`<option value="${k}" ${(R.category||'all')===k?'selected':''}>${l}</option>`).join('')}</select></label>`;
  /* ---- NO RENEWAL FILTER (owner-asked 24 Aug 2026, twice: "delete ... the
     filter i have highlighted", and again for the Negotiations seat) ----
     THE CONTROL GOES AND THE READING STAYS. regFiltered still knows how to
     narrow by renewal type, which costs nothing and keeps the shape two other
     files read; what is gone is the only thing that ever SET it, so the filter
     can never be quietly on. `renewalSel` is retired — flag any mention.
     DIVERGES FROM THE DESIGN REFERENCE, which draws Renewal type as one of its
     five filter chips and shows it in its active state. The owner's ruling. */
  // Server-mode full-text search + semantic ask live in a secondary strip (the
  // command bar owns the primary search); kept here so FTS wiring stays intact.
  /* ---- SEARCH IS THE FIRST FILTER, NOT A STRIP OF ITS OWN (owner-asked
     24 Aug 2026, off the design's own filter bar) ----
     It sat on a second row under the five dropdowns, which made a reader scan
     two lines to find out how the list was narrowed and left the box looking
     like a leftover. It is a labelled control in the same row now, FIRST,
     which is where the design puts it. The dropdown it opens (#reg-fts) is
     absolutely positioned against this wrapper, so the wrapper keeps
     position:relative and the whole suggestion list follows it unchanged. */
  const ftsBlock=API_MODE()?`
    <label class="reg-f" style="position:relative;flex:1 1 220px;min-width:180px;max-width:300px"><span class="reg-f-l">${esc(i18t('reg_search'))}</span>
      <span style="position:absolute;left:9px;bottom:8px;color:var(--color-neutral-500);display:inline-flex">${icon('search','w-3.5 h-3.5')}</span>
      ${''/* WHITE, LIKE EVERY CONTROL BESIDE IT (owner-reported 22 Aug 2026).
             It was --color-bg, the PAGE's grey, while all six dropdowns on the
             same row are --color-surface — so the one box a reader types into
             was the only sunk thing in a row of raised ones. The stream page's
             own search box took the same correction in the same breath: two
             search boxes in one product disagreeing about their own colour is
             how the next screen picks the wrong one. */}
      ${''/* THE SAME HEIGHT AS THE SELECTS BESIDE IT. It padded 6px against
             their 5px, which is 2px taller — invisible on its own line and
             plainly wrong once it joined the row, which is the head-row lesson
             of 22 Aug in a smaller costume. Matched to selStyle's own padding
             rather than given a height of its own, so the two cannot drift. */}
      <input id="reg-search" value="${R.query.replace(/"/g,'&quot;')}" placeholder="${esc(i18t('reg_search_ph'))}" style="width:100%;border:1px solid var(--field-line);background:var(--color-surface);border-radius:0;padding:5px 9px 5px 30px;font:inherit;font-size:13px;outline:none;color:inherit">
      <div id="reg-fts" class="hidden" style="position:absolute;z-index:40;margin-top:4px;width:100%;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);border-radius:0;max-height:320px;overflow-y:auto"></div>
    </label>`:'';

  const hostEl=document.getElementById(_regOpts.hostId)||document.getElementById('content');
  if(!hostEl) return;
  hostEl.innerHTML=`
  ${''/* ---- THE WRAPPER READS THE SAME TOKENS THE BAND CANCELS (25 Aug 2026)
         ----
         Owner-reported, off a screenshot of Contracts on a laptop: "there is
         still a grey gap in the card that needs to be eliminated." The band
         bleeds to the view's edge by pulling the view's own padding back —
         `margin:calc(var(--page-pad-t) * -1) calc(var(--page-pad-x) * -1)` —
         and this wrapper TYPED 14px and 16px. The two only cancelled by luck,
         at the one window height where --page-pad-t happens to be 16.
         THE DAY --page-pad-t STARTED TIGHTENING WITH THE WINDOW, THE LUCK RAN
         OUT: on a laptop it is 10, so the band began 14 - 10 = 4px BELOW the
         head's bottom edge and the page ground showed through as a strip
         across the card. At the very short step it is 6px. MEASURED at 800:
         a 4px grey band the full width of the page.
         The bottom stays a typed 14 — it is the gap above the table, not a
         join with anything. */}
  <div class="view-enter${neg?' ngl-page':''}" style="height:var(--view-h);box-sizing:border-box;padding:var(--page-pad-t) var(--page-pad-x) 14px;display:flex;flex-direction:column">
    <style>
      /* ---- THE PROTOTYPE'S TABLE ----
         The reference is a rounded card with an uppercase 10px header band, p-4
         cells, hairline dividers between rows and a hover tint. Written in the
         design's tokens rather than its raw slate classes so the same rules
         carry the dark theme — the header band used to be a hardcoded var(--color-neutral-100),
         which is a light-mode value sitting on a dark surface. */
      /* ---- THE LINE DESIGN (owner-approved mockup, 20 Aug 2026) ----
         Measured off the owner's own HTML: a flat white table ruled by
         hairlines, an uppercase 10.5/700 header on the surface itself (no
         grey band), teal tracking numbers, regular-weight titles with the
         document KIND on a quiet second line, the stream tick beside the
         title rather than on the row's edge, and a tighter row. */
      /* ---- THE ROWS COME DOWN ONE RUNG (owner-asked 24 Aug 2026: "reduce
         the font by a size in the contracts page list of contracts and the
         negotiations page list of contracts", ruled yes when told the cost) ----
         14px to 13. EVERY CELL DROPS TOGETHER — the 23 Aug ruling flattened
         this row to one size and one weight and flat-rows-and-alerts-verify
         pins exactly that, so a partial drop would fail it honestly. Five of
         those cells are INLINE styles and had to move in the markup; a class
         rule cannot reach them. The document kind stays SMALLER than the row,
         which is that check's other half.
         DIVERGES FROM THE DESIGN REFERENCE, whose type scale puts table row
         text at 14px. Recorded as the owner's ruling. */
      .reg-table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:13px}
      .reg-table thead th{position:sticky;top:0;z-index:3}
      /* ---- THE COLUMN HEADS ARE NOT SHOUTED (owner-asked 24 Aug 2026: "the
         headers highlighted should not be in capital letters apart from the
         first letters of the words", then ruled: only the first) ----
         The capitals were never typed — this rule forced them. The tracking
         goes with them: letter-spacing exists to make capitals readable and
         reads loose on ordinary words.
         SENTENCE CASE IS THE SIMPLER RULING, and it costs Swedish nothing:
         Swedish already writes these heads with one capital, so it does not
         move at all, and only two English heads change. One rule, both
         languages, nothing to keep in step.
         DIVERGES FROM THE DESIGN REFERENCE, which states uppercase column
         headers twice — in its type scale and again in its letter-spacing
         rule. The owner has seen both and ruled. Recorded, not drift. */
      .reg-table th{text-align:left;font-size:12px;font-weight:700;
        color:var(--color-neutral-500);padding:var(--s-2) var(--pad-row-x);
        border-bottom:1px solid var(--color-divider);white-space:nowrap;
        background:var(--color-surface)}
      /* ---- THE ROW IS THE DENSITY LEVER ----
         MEASURED at 55.39px against every enterprise grid in circulation
         (Fluent 44, AG Grid / Atlassian 40-42, Material compact / Salesforce
         32-36), which put 11.6 rows of a 40-row page on a 1440x900 laptop and
         8.2 on a 1366x768 one. The height is 4 + 20 + 16 + 4 + 1 = 45px, and
         it is DECLARED rather than emergent: the two line boxes below are what
         make the arithmetic hold, because with no line-height the two lines
         inherited 1.5 and the padding could not reach the number on its own. */
      ${''/* overflow:hidden is what makes a stated width bite. Several cells
             carry nowrap content, and in a fixed layout a child wider than its
             column spills over the one beside it rather than widening the
             table — so the clip is not decoration, it is the other half of the
             rule above. */}
      .reg-table td{padding:var(--pad-row);border-bottom:1px solid var(--rule);vertical-align:middle;
        overflow:hidden}
      .reg-table tbody tr:last-child td{border-bottom:0}
      .reg-table tbody tr{transition:background .12s}
      .reg-table tbody tr:hover{background:color-mix(in srgb,var(--color-text) 4%,transparent)}
      /* ---- THE KEYBOARD'S OWN ROW, AND WHY IT IS NOT AN OUTLINE ----
         With border-collapse:collapse a <tr> paints no box of its own, so an
         outline or a border on the row draws nothing at all — the cells own
         the edges. Two inset shadows on every cell give one continuous rule
         across the whole row instead of a box per cell, which is what an
         outline would have looked like if it had worked.
         :focus-visible, so a mouse press never draws it — the arrows and Tab
         do. --focus-color, so it follows the theme like every other ring
         (and it now has a dark answer, 25 Aug). */
      .reg-table tbody tr[data-row]:focus{outline:none}
      .reg-table tbody tr[data-row]:focus-visible td{
        background:color-mix(in srgb,var(--color-text) 6%,transparent);
        box-shadow:inset 0 2px 0 var(--focus-color),inset 0 -2px 0 var(--focus-color)}
      /* The tracking number leads the row, so it is set in the figure face and
         never wraps — an id that breaks across two lines stops being an id.
         Teal, like the mockup: the id is the row's own link-coloured handle. */
      /* ---- ONE SIZE, ONE WEIGHT, EVERY COLOUR KEPT (owner-asked 23 Aug 2026,
         off a render: "apart from the headers, the letters and numbers in the
         rows are all not bold and the same font size but the font colour
         differences are still intact") ----
         SEVEN things in a row were set larger or bolder than their neighbours
         and every one of them is 14px regular now: this reference, the status
         word, the urgent expiry date, the "· 7 d" countdown, the row's verb,
         the ⋯ and — on Negotiations — the whose-move words. NOT ONE COLOUR
         MOVED: the teal reference, the three status washes, the ruby and amber
         countdowns, the three whose-move inks and the stream tick are all
         exactly what they were.
         THE HEADERS ARE THE EXCEPTION AND THAT IS THE POINT — the column heads
         and the three group headings on Negotiations keep their 700 and their
         letter-spacing, because with every row reading at one weight they are
         the only thing left telling a heading from a row.
         THE DOCUMENT KIND STAYS AT 12px (owner-chosen off the render, having
         been shown it at 14): it is a second line under the title, and at the
         title's own size it competes with the title and costs every row four
         pixels of height. It is the one place in a row where a size difference
         is carrying something. */
      .reg-table{--reg-row-h:36px}   /* the fallback; regDensityVars overrides it per render */
      .reg-mk{font-family:var(--font-mono);font-size:13px;font-weight:400;
        color:var(--color-accent-600);white-space:nowrap;font-variant-numeric:tabular-nums}
      /* The status chip, flattened HERE and not at .badge — that class dresses
         every card, list and panel in the product, and this is a decision about
         a table row. The wash and the ink are untouched. */
      .reg-table .badge{font-size:13px;font-weight:400}
      .reg-title{font-weight:400;color:var(--color-text);line-height:var(--row-line-1)}
      /* ---- THE ROW IS ONE LINE AND 36px (owner-ruled 24 Aug 2026) ----
         The cell padding is what sets it: 8px above and below a 20px line box
         is 36, which is the design's own --row-h. It was 4px above and below
         TWO line boxes (20 + 16) and measured 45. THE NUMBER IS NOT TYPED ON
         THE ROW — it falls out of the padding and the line, so a type change
         moves the row with it instead of clipping inside a fixed height.
         .reg-kind is RETIRED with the second line — flag any mention as stale. */
      /* THE HEIGHT IS STATED, AND ON A TABLE CELL THAT IS A FLOOR RATHER THAN A
         CAP — a td grows past its own height when its content needs to, which
         is what makes this safe where it would not be on a div. It is stated
         because the arithmetic alone does not land: with 8px of padding above
         and below a 20px line the row still measured 38.2, because an
         inline-flex child sits on the BASELINE and the strut adds its descender
         space underneath. Measured at each step rather than assumed. This is
         also the design's own rule (--row-h). */
      /* ---- A CUT CELL SAYS SO (WO-9, 24 Aug 2026) ----
         The sideways scroll is gone — table-layout:fixed above bounds the
         table to its container, measured at 0 overflow at 1152/1280/1366/1440/
         1920 in both languages. WHAT WAS LEFT IS THE OTHER HALF OF THE OWNER'S
         REPORT: "words disappear to the right of the tables". A fixed layout
         cuts a cell whose content is too wide, and with no text-overflow the
         words simply STOP — measured, 8 to 16 cells a page at laptop widths,
         which is exactly the cut-off WHOSE MOVE column in the screenshot.
         THE REFERENCE'S OWN RULE, TYPOGRAPHY.md section 6: "Every table cell
         that holds a name, a title or free text: min-width:0; white-space:
         nowrap; overflow:hidden; text-overflow:ellipsis on the cell", and
         "Column header cells: same three properties, so a header label can
         never overlap its neighbour when tracks compress." So this is a
         correction toward the design, not a workaround.
         NOTHING IS LOST SILENTLY: every cell that can be cut already carries
         its full text on hover, and the ellipsis is what says there is more. */
      /* PADDING AND LEADING MOVE WITH THE HEIGHT — see REG_DENSITY. The
         fallbacks are the historic values, so a table rendered before the
         mode existed (or by a caller that does not set it) draws exactly as
         it always did. */
      .reg-table td{height:var(--reg-row-h);padding:0 var(--reg-row-px,var(--pad-row-x));
        line-height:var(--reg-row-line,var(--row-line-1));
        overflow:hidden;text-overflow:ellipsis}
      .reg-table th{overflow:hidden;text-overflow:ellipsis}
      /* ---- EXCEPT THE CELL THAT HOSTS THE ROW MENU (owner-reported 25 Aug
         2026: "the 3 dots at the end were a filter where I had options to
         archive delete and so forth. What has happened to that feature?") ----
         The row menu is a position:absolute pop-up INSIDE its cell, which is
         position:relative so the menu hangs off it. overflow:hidden clips
         an absolutely-positioned child to its clipping ancestor, so the rule
         above cropped a 180x234 menu down to the 35x36 cell — MEASURED, 27x2
         pixels of it survived. The button still worked and all seven rows were
         still in the DOM; the menu was simply invisible.
         THE REFERENCE'S OWN RULE IS WHAT EXEMPTS IT, so this is not a special
         case bolted on: TYPOGRAPHY.md section 6 asks for the clip on "every
         table cell that holds a NAME, A TITLE OR FREE TEXT". This cell holds a
         button and a menu, is white-space:nowrap with one glyph in it, and
         can never need an ellipsis.
         NAMED IN THE MARKUP rather than matched with :has(), because which cell
         hosts a pop-up is a fact about the row builder and belongs there — a
         selector that has to guess will guess wrong the day a second pop-up is
         added. */
      .reg-table td.reg-cell-menu{overflow:visible;text-overflow:clip}
      .reg-table td > span{vertical-align:middle}
      /* The tick no longer spans two lines, so it stops stretching and takes a
         height of its own beside the one line it marks. */
      .reg-tick{flex:none;width:3px;height:14px;align-self:center}
      /* The stage, as a dot and a word. The dot is the shape a scanned column
         needs; the word is what stops the colour being the only carrier. BOTH
         come from contractStatusDotHtml, which shares its branch with the chip
         and the head's sentence — the dot takes the tone's brighter dot shade
         and the word its darker text shade, which is what every chip in this product
         already does and what keeps a 14px word readable while an 8px circle
         still catches the eye. currentColor here is only the fallback for a
         stage that somehow draws without its inline tone. */
      /* ---- THE WHOLE FILTER AREA IS ONE WHITE BAND (owner-asked 24 Aug 2026,
         off the design's own bar) ----
         The title, the filters and the search sat on the PAGE ground while the
         table below them was a white card, so the controls read as loose
         furniture floating above the thing they govern. The design draws them
         on --surf with a hairline under, and the contract room's head already
         does exactly this (.room-band) — one treatment, two pages, rather than
         a second convention here.
         IT IS A WRAPPER, NOT A BACKGROUND ON EACH PART: painting them
         separately leaves the flex gap between them grey and gives two bars
         where the design has one band. The negative margin cancels the view's
         own padding so the white runs to the shell's edge, and the padding
         puts it back inside so nothing it contains moves by a pixel — the
         room band's own trick, and asserted rather than assumed. */
      .reg-band{background:var(--color-surface);border-bottom:1px solid var(--color-divider);
        margin:calc(var(--page-pad-t) * -1) calc(var(--page-pad-x) * -1) 0;
        padding:var(--page-pad-t) var(--page-pad-x) 10px;
        display:flex;flex-direction:column;gap:8px}
      /* AND THE PAGE'S NAME IS ON THE BAND WITH IT. The title, its sentence and
         the one act are drawn by the SHELL into #page-head, which is a sibling
         ABOVE #content and cannot be wrapped from in here — so it is painted
         rather than moved. This rule lives in the register's own <style>, which
         is injected with the register's markup and goes with it, so no other
         view ever sees it: the page after this one gets its grey back with
         nothing to remember. The two boxes butt exactly (the head's bottom IS
         the content's top, measured), and the head runs 10px wider because it
         sits outside the scroller — that 10px is the scrollbar gutter. */
      #page-head{background:var(--color-surface)}
      /* ---- AND THE BAND REACHES THE SCREEN'S EDGE (owner-reported 25 Aug
         2026, off two screenshots: "remove the separation strip in the top two
         cards and make it one card just like in the negotiations page", and
         "the top white cards should cover all the way to the end of the
         screen") ----
         ONE CAUSE, BOTH REPORTS. The shell's scroller reserves a scrollbar
         gutter permanently (scrollbar-gutter:stable in index.html, so moving
         between a scrolling page and a fixed one cannot shift content
         sideways). #page-head sits OUTSIDE that scroller and the band sits
         inside it, so the two white boxes had different right edges — MEASURED
         at 1440: the head ran to 1440 and the band stopped at 1430. That 10px
         step is what read as two cards with a strip between them, and the
         grey showing beside the band is what the second screenshot ringed.
         THE GUTTER IS DEAD SPACE ON THIS PAGE, which is why turning it off
         here is honest rather than a workaround: this view is exactly
         --view-h tall and the TABLE does its own scrolling, so the page
         scroller can never scroll and has no scrollbar to reserve room for.
         It is written in the register's own injected <style>, so it goes with
         the page and the next view gets the shell's rule back untouched.
         BLEEDING THE BAND INTO THE GUTTER WAS TRIED FIRST AND REJECTED: a
         negative margin does paint into it, and it leaves the scroller with
         10px of horizontal overflow that only overflow-x:hidden can swallow.
         A page that has to hide an overflow to look right is one pixel from
         scrolling sideways. */
      #content-scroll{scrollbar-gutter:auto}
      .reg-f{display:flex;flex-direction:column;min-width:0}
      .reg-f-l{font-size:12px;color:var(--color-neutral-600);margin-bottom:3px;white-space:nowrap}
      .reg-stg{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;font-weight:400;vertical-align:middle}
      .reg-stg i{width:8px;height:8px;border-radius:50%;flex:none;background:currentColor}
      .reg-th-sort:hover{color:var(--color-accent-700)!important}
      .reg-th-sort:hover .reg-sort-idle{color:var(--color-accent-700)}
      .reg-th-sort.active{color:var(--color-accent-800)!important}
    </style>
    <div style="display:flex;flex-direction:column;gap:8px;flex:1;min-height:0">
      ${''/* THE BAND — the page's own name, its filters and its search on one
             white ground, with the table's card below it on the page grey. */}
      <div class="reg-band">
      ${headHtml}
      <!-- THE ONE FILTER BAR: stage · stream · saved view · category · renewal ·
           clear,
           then sort, full-text search (server mode) and the export — a single
           compact strip where three tiers of pills used to stack, so the table
           itself starts above the fold. -->
      <div class="reg-filterbar" style="display:flex;flex-wrap:wrap;gap:8px 10px;align-items:flex-end">
        ${lockChip}
        ${onlyChip}
        ${ftsBlock}
        ${''/* ---- ONLY THE CHOSEN FILTERS DRAW, PLUS ANY THAT ARE NARROWING ----
               regBarShown() is the union: what this reader put on their bar,
               and anything currently cutting the list whether they chose it or
               not. The second half is the safety property — a hidden control
               quietly shortening the book is the exact fault WO-15's removal
               note was guarding against. */}
        ${BAR.includes('stage')?selFilter('reg-stage-sel',stageOpts,R.stage!=='all',i18t('reg_lifecycle_stage')):''}
        ${BAR.includes('type')?selFilter('reg-type-sel',typeOpts,R.type!=='all',i18t('reg_value_stream')):''}
        ${''/* The long sentence is the TOOLTIP, not the label — used as a label it
                    ran to 460px and pushed the whole bar off the row. */}
        ${BAR.includes('view')?selFilter('reg-view-sel',viewOpts,!!R.view,i18t('reg_saved_views_title'),i18t('reg_saved_views')):''}
        ${BAR.includes('category')?categorySel:''}
        ${BAR.includes('renewal')?selFilter('reg-renewal',renewalOpts,renewalActive,i18t('reg_renewal')):''}
        ${''/* THE DOOR TO THE REST. A link rather than a button, because it
               opens a chooser rather than acting on the list — the same
               weight Fiori gives it. */}
        <button id="reg-adapt" type="button" title="${esc(i18t('reg_adapt_title'))}"
          style="font-size:12px;font-weight:600;color:var(--accent-ink);background:none;border:0;cursor:pointer;padding:2px 4px;align-self:flex-end;margin-bottom:7px">${esc(i18t('reg_adapt'))}</button>
        ${filtered?`<button id="reg-clear-filters" style="font-size:12px;font-weight:600;color:var(--color-accent-700);background:none;border:0;cursor:pointer;padding:2px 4px">${i18t('reg_clear')}</button>`:''}
        <span style="flex:1;min-width:8px"></span>
        ${''/* ---- SORT IS STACKED LIKE THE OTHER FIVE (owner-asked 25 Aug 2026:
               "stack Sort's label like the other five") ----
               It carried its word BESIDE the box while the other five carry
               theirs ABOVE it, which is a wider shape for the same control —
               MEASURED, it was the widest item on the row and therefore the
               first to drop to a second line when Swedish's longer words or an
               active filter's 600 weight pushed the row over.
               IT GOES THROUGH selFilter, THE SAME BUILDER, rather than being
               restyled to match: one builder for all six is what stops them
               drifting apart again, and it is what let this one drift in the
               first place.
               `active` IS ALWAYS FALSE, deliberately. On the other five that
               flag means "this is narrowing your list", and sorting narrows
               nothing — a sort control wearing the accent would claim the list
               was filtered when it is not. */}
        ${''/* ---- DENSITY SITS BESIDE SORT, AFTER THE SPACER, AND FOR THE SAME
               REASON (25 Aug 2026) ----
               Everything LEFT of the spacer narrows the list; these two change
               how it is DRAWN. `active` is false for the same reason it is
               false on Sort: on the five filters that flag means "this is
               narrowing your list", and a density wearing the accent would
               claim the book had been filtered when it has not.
               It goes through selFilter — the same builder as the other six —
               because one builder is what stops them drifting apart. */}
        ${selFilter('reg-density',densityOpts,false,i18t('reg_density_title'),i18t('reg_density'))}
        ${selFilter('reg-sort',sortOpts,false,i18t('reg_sort'))}
        ${''/* SORTING RUNS INSIDE A GROUP HERE, and the same control on Contracts
               sorts the whole page. A control that quietly means something else
               is a lie by omission, so the page says it beside the control. */}
        ${neg?`<span id="reg-sort-note" style="flex:none;font-size:12px;color:var(--color-neutral-500)">${esc(i18t('ngl_sort_note'))}</span>`:''}
      </div>
      </div>

      <section class="blueprint bp-round" style="background:var(--color-surface);box-shadow:var(--shadow-sm);flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden">

        <div id="reg-scroll" style="flex:1;min-height:0;overflow:auto">
          <!-- The whole density mode rides on ONE element as three custom
               properties, so nothing below has to know which mode is on. -->
          <table class="reg-table" data-reg-density="${regDensity()}" style="${regDensityVars(regDensity())}">
            <thead>
              <!-- THE PROTOTYPE'S SEVEN, with the tracking number added in front.
                   Sorting is kept on the four columns that carried it before —
                   the reference has no sort affordance, but losing the ability
                   to order a register by value or renewal date would be losing
                   a tool, not a decoration. -->
              ${''/* ---- THE COLUMNS DO NOT MOVE WHEN YOU TURN THE PAGE
                     (owner-reported 24 Aug 2026: "when you click through the
                     pages, the columns move which is not how i want it … there
                     should be no scrolling from left to right") ----
                     An AUTO table sizes each column to the content of the rows
                     it is currently showing, so a page of long names widened the
                     title and every column beside it moved. MEASURED on a
                     150-contract book: the title column was 217px on page 1 and
                     306px on page 3, and all seven others shifted with it.
                     table-layout:fixed reads the widths off THIS row and holds
                     them, whatever the page shows — the same fix, and the same
                     lesson, as the calendar's obligation table.
                     EVERY WIDTH IS A PERCENTAGE AND THEY SUM TO 100, which is
                     what makes "no left-right scrolling" a guarantee rather than
                     something that happens to hold at today's window: the table
                     is exactly its pane, at every width, on every page.
                     SIX OF THE EIGHT ARE THE SAME ON BOTH PAGES. Only the title
                     and the last column differ, because the last one holds a ⋯
                     on Contracts and a sentence about whose move it is on
                     Negotiations, and the title is the column with the give. */}
              <tr>
                <th style="width:8%">MK</th>
                ${sortableTh('name',i18t('reg_col_title'),`width:${neg?17:23}%`)}
                <th style="width:17%">${i18t('reg_col_counterparty')}</th>
                <th style="width:15%">${i18t('reg_value_stream')}</th>
                ${sortableTh('value',i18t('reg_col_value'),'text-align:right;width:10%')}
                ${sortableTh('expiry',i18t('reg_col_expiry'),'width:13%')}
                ${sortableTh('stage',i18t('reg_col_status'),'width:11%')}
                <th style="text-align:right;width:${neg?9:3}%">${neg?i18t('ngl_col_move'):''}</th>
              </tr>
            </thead>
            <tbody id="reg-tbody">${regRowsHtml(cs)}</tbody>
          </table>
        </div>
        <div style="flex:none;border-top:1px solid var(--color-divider);display:flex;align-items:center;justify-content:space-between;gap:10px 16px;flex-wrap:wrap;padding:5px 12px;font-size:12px;color:var(--color-neutral-600)">
          <span id="reg-showing">${regFooterText(cs)}</span>
          <div id="reg-pager" style="display:flex;align-items:center;gap:6px">${regPager(cs)}</div>
          ${''/* ONE LEGEND DOWN HERE, NOT TWO. The strip carried both the link
                 states (sent · opened · changes · signed · declined · not sent)
                 and the value streams, and between them and the count and the
                 pager it wrapped to two lines and read as a wall. The value
                 streams key stays because the stripe down the left edge of
                 every row is the thing on this page with no other explanation;
                 the LINK column has a heading and every dot names its own state
                 on hover, so it explains itself where a reader is already
                 looking. The folder page keeps its link key — there the strip
                 holds nothing else, and the marks are why it exists. */}
          ${folderLegendHtml({style:'font-size:12px'})}
          <span>${neg?esc(i18t('ngl_no_paging')):i18t('reg_per_page',{n:REG_PAGE})}</span>
        </div>
      </section>
    </div>
  </div>`;

  wireRegRows();
  wireRegPager();
  const si=document.getElementById('reg-search');
  if(si){
    si.addEventListener('input',()=>{ R.query=si.value; R.page=1; renderRegisterBody(); if(API_MODE()) ftsSearch(si.value); });
  }
  /* ---- OUTSIDE CLICK: ARMED ONCE ON THE DOCUMENT, NOT PER PAINT ----
     This closes the search dropdown and any open row ⋯ menu, and it was bound
     inside the wiring — which runs on EVERY filter press, every sort, every
     page. So a reader who used the filters twenty times had twenty copies of
     it, all firing on every click for the life of the sitting.

     The house pattern: a flag on `document`, and the live element resolved AT
     PRESS TIME rather than captured. The search box is looked up by id inside
     the handler for exactly that reason — the `si` this paint closed over is
     replaced by the next one, and a listener holding the old node would stop
     recognising the box the reader is typing in. */
  if(!document._regOutsideWired){
    document._regOutsideWired=true;
    document.addEventListener('click',e=>{
      const box=document.getElementById('reg-fts');
      const live=document.getElementById('reg-search');
      if(box&&!box.contains(e.target)&&e.target!==live) box.classList.add('hidden');
      if(!e.target.closest('[data-menu-pop]')&&!e.target.closest('[data-menu]')) regCloseMenus();
    });
  }
  /* ---- "ADAPT FILTERS" ----
     It goes through openModal, which this product already gets right: role,
     aria-modal, a name, focus in, Tab cycling and focus back to the opener.
     A second hand-rolled panel would be a second implementation of all of
     that, and this file's own rule is one builder per job. */
  document.getElementById('reg-adapt')?.addEventListener('click',()=>{
    const chosen=regBarChosen();
    const rows=REG_BAR_FILTERS.map(f=>{
      const on=chosen.includes(f.k);
      /* A FIXED FILTER IS SHOWN TICKED AND DISABLED rather than hidden: a
         chooser that silently omits two of the six leaves the reader counting
         and wondering where they went. It says what it is instead. */
      return `<label style="display:flex;align-items:center;gap:10px;padding:9px 2px;border-bottom:1px solid var(--color-divider);${f.fixed?'opacity:.6':'cursor:pointer'}">
        <input type="checkbox" data-adapt="${f.k}" ${on?'checked':''} ${f.fixed?'disabled':''} style="width:15px;height:15px;flex:none;accent-color:var(--accent-solid)"/>
        <span style="flex:1;font-size:14px">${esc(f.label)}</span>
        ${f.fixed?`<span style="font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500)">${esc(i18t('reg_adapt_always'))}</span>`:''}
      </label>`;
    }).join('');
    openModal(`
      <div style="padding:16px 18px 10px;border-bottom:1px solid var(--color-divider)">
        <h3 style="margin:0;font-size:17px;font-weight:700">${esc(i18t('reg_adapt_title'))}</h3>
        <p style="margin:4px 0 0;font-size:13px;color:var(--color-neutral-600);line-height:1.5">${esc(i18t('reg_adapt_sub'))}</p>
      </div>
      <div style="padding:4px 18px 8px">${rows}</div>
      <div style="padding:12px 18px 16px;display:flex;gap:8px;align-items:center">
        <button id="reg-adapt-reset" class="ui-btn ui-btn-plain">${esc(i18t('reg_adapt_reset'))}</button>
        <span style="flex:1"></span>
        <button id="reg-adapt-done" class="ui-btn ui-btn-primary">${esc(i18t('act_done'))}</button>
      </div>`,{label:i18t('reg_adapt_title'),maxWidth:'440px'});
    const read=()=>[...document.querySelectorAll('[data-adapt]:checked')].map(b=>b.getAttribute('data-adapt'));
    document.getElementById('reg-adapt-reset')?.addEventListener('click',()=>{
      regBarSetChosen(REG_BAR_DEFAULT.slice()); closeModal(); regRepaint();
    });
    document.getElementById('reg-adapt-done')?.addEventListener('click',()=>{
      regBarSetChosen(read()); closeModal(); regRepaint();
    });
  });

  /* A DENSITY CHANGE IS A REPAINT, NOT A NAVIGATION: the page, the filters and
     the reader's place are all untouched — only the rows' rhythm moves. */
  document.getElementById('reg-density')?.addEventListener('change',e=>{
    if(regSetDensity(e.target.value)) regRepaint();
  });
  document.getElementById('reg-sort')?.addEventListener('change',e=>{ R.sort=e.target.value; R.dir=REG_SORT_DEFDIR[R.sort]||-1; R.page=1; regRepaint(); });
  // Column-header sorting: click a header to sort by it; click the active header
  // again to flip ascending/descending. First click uses the column's natural
  // direction (e.g. renewal nearest-first, value high-first).
  document.querySelectorAll('[data-reg-sort]').forEach(el=>el.addEventListener('click',()=>{
    const key=el.getAttribute('data-reg-sort');
    if(R.sort===key) R.dir=-R.dir; else { R.sort=key; R.dir=REG_SORT_DEFDIR[key]||-1; }
    R.page=1; regRepaint();
  }));
  document.getElementById('reg-renewal')?.addEventListener('change',e=>{ R.renewal=e.target.value; R.page=1; regRepaint(); });
  document.getElementById('reg-category')?.addEventListener('change',e=>{ R.category=e.target.value; R.page=1; regRepaint(); });
  document.getElementById('reg-stage-sel')?.addEventListener('change',e=>{ R.stage=e.target.value; R.page=1; regRepaint(); });
  document.getElementById('reg-type-sel')?.addEventListener('change',e=>{ R.type=e.target.value; R.page=1; regRepaint(); });
  document.getElementById('reg-view-sel')?.addEventListener('change',e=>{ R.view=e.target.value||null; R.page=1; regRepaint(); });
  document.getElementById('reg-only-clear')?.addEventListener('click',()=>{ R.only=null; R.page=1; regRepaint(); });
  document.getElementById('reg-clear-filters')?.addEventListener('click',()=>{ R.stage='all'; R.type='all'; R.view=null; R.renewal='all'; R.category='all'; R.only=null; R.page=1; regRepaint(); });

  regFitBandOffset();
  setActiveNav(_regOpts.nav);
}

/* ---- WHERE A BAND PINS IS THE HEADER'S HEIGHT, ASKED OF THE HEADER ----
   The Negotiations list draws full-width bands between its rows and both they
   and the column header are position:sticky inside #reg-scroll. The band's
   offset was typed as 38px against a header that renders 35, so a 3px slot sat
   between them and every row scrolled visibly through it — reported as the list
   breaking on scroll (owner, 22 Aug 2026). The number is read off the header
   now and written as --reg-head-h for the rule in index.html.
   TWO PROPERTIES, each of which this codebase has learned once already:
   A HEIGHT OF ZERO IS NOT A HEIGHT — the pane can be display:none when a
   sitting starts, and writing 0 there would pin every band to the top of the
   scroller — so a zero is refused and today's value stands.
   AND IT IS OBSERVED, NOT MEASURED ONCE: the header's height follows the
   reader's type and the window's width, so a ResizeObserver re-reads it. Bound
   once per element (dataset.regHeadObserved), because this function is called
   from the full render AND from every body repaint. */
function regFitBandOffset(){
  const sc=document.getElementById('reg-scroll'); if(!sc) return;
  const hd=sc.querySelector('.reg-table thead tr'); if(!hd) return;
  const apply=()=>{
    const h=Math.round(hd.getBoundingClientRect().height);
    if(h>0) sc.style.setProperty('--reg-head-h',h+'px');
  };
  apply();
  if(!hd.dataset.regHeadObserved && typeof ResizeObserver==='function'){
    hd.dataset.regHeadObserved='1';
    try{ new ResizeObserver(apply).observe(hd); }catch(e){}
  }
}

/* ---- E6-T1 full-text search dropdown (server mode) ---- */
let ftsTimer=null;
function ftsSearch(q){
  const box=document.getElementById('reg-fts'); if(!box) return;
  q=(q||'').trim();
  clearTimeout(ftsTimer);
  if(q.length<2){ box.classList.add('hidden'); return; }
  ftsTimer=setTimeout(async()=>{
    try{
      const r=await api('search?q='+encodeURIComponent(q)+'&limit=12');
      if(!r.hits||!r.hits.length){ box.innerHTML=`<div style="padding:10px 12px;font-size:13px;color:var(--color-neutral-600)">${i18t('reg_no_fulltext')}</div>`; box.classList.remove('hidden'); return; }
      box.innerHTML=r.hits.map(h=>`<button data-fts-open="${h.id}" style="display:block;width:100%;text-align:left;padding:8px 12px;border:0;border-bottom:1px solid var(--color-divider);background:none;cursor:pointer;font:inherit">
        <div style="font-size:14px;font-weight:600;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(h.name||h.id)} <span style="font-family:var(--font-mono);font-size:12px;color:var(--color-neutral-500)">${h.id}</span></div>
        ${h.snippet?`<div style="font-size:12px;color:var(--color-neutral-600);margin-top:2px">${h.snippet.replace(/</g,'&lt;').replace(/\[/g,'<mark style="background:var(--st-amber-bg);border-radius:0;padding:0 2px">').replace(/\]/g,'</mark>')}</div>`:(h.counterparty?`<div style="font-size:12px;color:var(--color-neutral-500)">${h.counterparty}</div>`:'')}
      </button>`).join('');
      box.classList.remove('hidden');
      box.querySelectorAll('[data-fts-open]').forEach(b=>b.addEventListener('click',()=>{ box.classList.add('hidden'); openWorkspace(b.getAttribute('data-fts-open')); }));
    }catch(e){ box.classList.add('hidden'); }
  },220);
}
Object.assign(window,{REG_BAR_FILTERS,REG_BAR_DEFAULT,regBarChosen,regBarSetChosen,regBarShown,regFilterActive,REG_DENSITY,regDensity,regSetDensity,regDensityVars,regDotDate,REG_PAGE,REG_SORTS,REG_STAGES,regTypes,REG_VIEWS,REG_ROW_ACTIONS,ftsSearch,regAggregate,regCloseMenus,regExportCsv,regFiltered,regCategories,regCatMatch,regCatLabel,regOwnerInitials,regPrimaryAction,regTitleOf,regRowsHtml,regState,regShowOnly,renderRegister,renderRegisterBody,wireRegRows,
  regScope,regSetScope,regRepaint,regPageSize,regFitBandOffset,NEGO_BANDS,NEGO_BAND_DOT,negoGroupByMove,negoBandCounts,negoMovePillHtml,negoBandRowHtml});
