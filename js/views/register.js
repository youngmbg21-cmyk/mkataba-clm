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
/* `lk` names the dictionary entry; `k` is the stored sort preference. */
const FOLDER_SORTS=[
  {k:'updated',lk:'reg_sort_updated'},
  {k:'value',  lk:'reg_sort_value'},
  {k:'expiry', lk:'reg_sort_expiry'},
  {k:'name',   lk:'reg_sort_name'},
];
// The filtered + sorted contracts for the current folder (shared by the full
// render and the search/keystroke body re-render).
function folderFiltered(){
  const f=FOLDERS[state.folderId]; if(!f) return [];
  const q=(state.folderQuery||'').trim().toLowerCase();
  let cs=folderContracts(f.id);
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
  const val=cs.filter(c=>c.status!=='Declined').reduce((s,c)=>s+Number(c.value||0),0);
  const sortOpts=visibleSorts(FOLDER_SORTS).map(s=>`<option value="${s.k}" ${(state.folderSort||'updated')===s.k?'selected':''}>${t(s.lk)}</option>`).join('');

  const selStyle='font:inherit;font-size:12px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:4px 6px;color:inherit;cursor:pointer';
  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:14px 16px 28px">
    <style>
      .fold-table{width:100%;border-collapse:collapse;font-size:12.5px}
      .fold-table th{text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:color-mix(in srgb,var(--color-text) 60%,transparent);padding:6.8px;border-bottom:1px solid var(--color-divider);white-space:nowrap;background:#fafbfc}
      .fold-table td{padding:6.8px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 8%,transparent);vertical-align:middle}
      .fold-table tbody tr:hover{background:color-mix(in srgb,var(--color-text) 4%,transparent)}
    </style>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <button id="back-dash" style="width:28px;height:28px;flex:none;display:inline-grid;place-items:center;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;color:var(--color-accent-700);cursor:pointer" title="${t('fold_back_title')}">${icon('arrowLeft','w-4 h-4')}</button>
        <span style="width:28px;height:28px;flex:none;display:grid;place-items:center;background:var(--color-accent-800);color:#fff;border-radius:4px">${icon(f.ic,'w-4 h-4')}</span>
        <div style="min-width:0">
          <div style="font-family:var(--font-mono);font-weight:600;font-size:17px;color:var(--color-text);line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.name)}</div>
          <div style="font-size:11px;color:var(--color-neutral-600)">${(typeof canViewValues==='function'&&!canViewValues())
            ? tn('fold_count',cs.length,{count:`<span id="fold-count">${cs.length}</span>`})
            : tn('fold_count_value',cs.length,{count:`<span id="fold-count">${cs.length}</span>`,value:fmtKESshort(val)})}</div>
        </div>
        <span style="flex:1"></span>
        <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--color-neutral-700)">${t('reg_sort_label')}
          <select id="folder-sort" style="${selStyle}">${sortOpts}</select>
        </label>
        <div style="position:relative">
          <span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--color-neutral-500);display:inline-flex">${icon('search','w-3.5 h-3.5')}</span>
          <input id="folder-search" value="${(state.folderQuery||'').replace(/"/g,'&quot;')}" type="text" placeholder="${t('fold_search_ph')}" style="width:230px;max-width:60vw;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:6px 9px 6px 30px;font:inherit;font-size:12px;outline:none;color:inherit">
        </div>
      </div>

      <div id="fold-selbar" class="flex hidden items-center justify-between" style="gap:12px;border:1px solid var(--color-accent-800);background:var(--color-accent-800);color:#fff;border-radius:4px;padding:8px 12px">
        <span id="fold-sel-count" style="font-size:12px;font-weight:600">${t('reg_selected',{n:0})}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <button id="fold-export" style="display:inline-flex;align-items:center;gap:6px;border:0;background:rgba(255,255,255,.16);color:#fff;border-radius:4px;padding:5px 10px;font:inherit;font-size:11.5px;font-weight:600;cursor:pointer">${icon('download','w-3.5 h-3.5')} ${t('reg_export_csv')}</button>
          <button id="fold-clear" style="border:0;background:none;color:rgba(255,255,255,.72);padding:5px 8px;font:inherit;font-size:11.5px;font-weight:600;cursor:pointer">${t('reg_clear')}</button>
        </div>
      </div>

      <section class="blueprint bp-round" style="background:var(--color-surface);box-shadow:var(--shadow-sm)">
        
        <div style="overflow-x:auto">
          <table class="fold-table">
            <thead>
              <tr>
                <th style="width:26px;padding-left:12px"><input id="fold-selall" type="checkbox" style="accent-color:var(--color-accent)"></th>
                <th>${t('fold_th_contract')}</th>
                <th>${t('fold_th_type')}</th>
                <th style="text-align:right">${t('fold_th_value')}</th>
                <th>${t('fold_th_expires')}</th>
                <th>${t('fold_th_updated')}</th>
                <th style="text-align:right;padding-right:12px">${t('fold_th_status')}</th>
              </tr>
            </thead>
            <tbody id="fold-tbody" class="stagger">${folderRowsHtml(cs)}</tbody>
          </table>
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
function folderExpiryCell(c){
  // the family-aware term: a master agreement shows the date its latest
  // amendment set, with a note naming the amendment it came from
  const eff=effectiveExpiry(c);
  if(!eff) return `<span style="color:var(--color-neutral-400)">${t('value_none')}</span>`;
  const from=window.expirySource?expirySource(c):null;
  // formatted from a stored ISO date purely for display, so it follows the language
  const dt=new Date(eff+'T00:00:00').toLocaleDateString(langLocale('en-GB'),{day:'2-digit',month:'short',year:'numeric'});
  let col='var(--color-neutral-700)', hint='', weight=400;
  if(from) hint=t('reg_exp_from',{id:from.id});
  if(c.status!=='Declined'){ const d=daysUntil(eff);
    // whole sentences, with and without the source clause — never ' · from ' glued on
    if(d<0){ col='#8f322b'; weight=600; hint=from?t('reg_exp_ago_from',{n:-d,id:from.id}):t('reg_exp_ago',{n:-d}); }
    else if(d<30){ col='#8f322b'; weight=600; hint=from?t('reg_exp_in_from',{n:d,id:from.id}):t('reg_exp_in',{n:d}); }
    else if(d<=90){ col='#7d5a14'; hint=from?t('reg_exp_in_from',{n:d,id:from.id}):t('reg_exp_in',{n:d}); }
  }
  return `<span style="color:${col};font-weight:${weight}">${dt}</span>${hint?`<span style="display:block;font-size:10px;color:${col};opacity:.85">${hint}</span>`:''}`;
}
// Render up to state.folderShown rows as a table body, with a "Show more" pager.
function folderRowsHtml(cs){
  if(!cs.length) return `<tr><td colspan="7" style="padding:44px 20px;text-align:center">
      <div style="font-size:13px;font-weight:600;color:var(--color-text)">${(state.folderQuery||'').trim()?t('fold_empty_q',{q:esc(state.folderQuery)}):t('fold_empty_none')}</div>
      <div style="font-size:11.5px;color:var(--color-neutral-600);margin-top:4px">${(state.folderQuery||'').trim()?t('fold_empty_q_sub'):t('fold_empty_sub')}</div>
    </td></tr>`;
  const shown=Math.min(cs.length, state.folderShown||FOLDER_PAGE);
  const sel=state.folderSel||{};
  return cs.slice(0,shown).map((c,i)=>{
    const o=(window.openFindings?openFindings(c):[])||[];
    const scan=o.length?`<span class="badge" style="margin-left:6px;background:#f1dcd8;color:#8f322b" title="${t('reg_scan_title')}">${icon('scan','w-2.5 h-2.5')}${o.length}</span>`:'';
    return `
    <tr data-open="${c.id}" style="cursor:pointer;animation-delay:${Math.min(i,14)*22}ms">
      <td style="padding-left:12px" onclick="event.stopPropagation()"><input type="checkbox" data-fsel="${c.id}" ${sel[c.id]?'checked':''} style="accent-color:var(--color-accent)"></td>
      <td style="max-width:260px"><div style="display:flex;align-items:center;gap:9px;min-width:0">
        <span style="width:26px;height:26px;flex:none;display:grid;place-items:center;border-radius:4px;border:1px solid var(--color-divider);background:${isUpload(c)?'var(--color-accent-200)':'var(--color-bg)'};color:${isUpload(c)?'var(--color-accent-800)':'var(--color-neutral-600)'}" ${isUpload(c)?`title="${t('reg_uploaded_title')}"`:''}>${icon(cIcon(c),'w-3.5 h-3.5')}</span>
        <span style="min-width:0">
          <span style="display:block;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</span>
          <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t('reg_id_party',{id:`<span style="font-family:var(--font-mono)">${esc(c.id)}</span>`,party:esc(c.counterparty||t('reg_no_counterparty'))})}</span>
        </span>
      </div></td>
      <td style="font-size:11.5px;color:var(--color-neutral-700);white-space:nowrap"><span style="display:inline-flex;align-items:center;gap:6px">${icon(cIcon(c),'w-4 h-4')}${cKind(c)}</span>${scan}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums;font-weight:500;white-space:nowrap;${isMonetary(c)?'':'color:var(--color-neutral-400)'}" ${!isMonetary(c)?`title="${t('value_nm_title')}"`:''}>${!isMonetary(c)?t('value_nm'):(c.value?fmtKESshort(c.value):t('value_none'))}</td>
      <td style="font-size:11.5px;font-variant-numeric:tabular-nums;white-space:nowrap">${folderExpiryCell(c)}</td>
      <td style="font-size:11px;color:var(--color-neutral-600);white-space:nowrap">${c.lastAction||t('value_none')}</td>
      <td style="text-align:right;padding-right:12px;white-space:nowrap">${statusChip(c.status)}${shareDot(c.id)}${window.questionDot?questionDot(c.id):''}</td>
    </tr>`; }).join('') + (cs.length>shown
      ? `<tr><td colspan="7" style="padding:0"><button id="folder-more" style="width:100%;padding:11px;font-size:12.5px;font-weight:600;color:var(--color-accent-700);background:none;border:0;border-top:1px solid var(--color-divider);cursor:pointer">${t('fold_show_more',{n:Math.min(FOLDER_PAGE,cs.length-shown),rest:cs.length-shown})}</button></td></tr>`
      : '');
}
function folderSelCount(){ const s=state.folderSel||{}; return Object.keys(s).filter(k=>s[k]).length; }
function renderFolderSelBar(){
  const bar=document.getElementById('fold-selbar'); if(!bar) return; const n=folderSelCount();
  bar.classList.toggle('hidden',n===0);
  const lbl=document.getElementById('fold-sel-count'); if(lbl) lbl.textContent=t('reg_selected',{n});
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
  if(!rows.length){ toast(t('toast_nothing_selected'),'err'); return; }
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  // i18n-exempt: CSV column names are a file format parsed by name downstream
  const head=['ID','Name','Counterparty','Type','Value stream','Value (KES)','Status','Last action','Expiry'];
  const body=rows.map(c=>[c.id,c.name,c.counterparty||'',cKind(c),FOLDERS[c.folder]?.name||'',csvValueCell(c),statusLabel(c.status),c.lastAction||'',c.expiry||''].map(esc).join(','));
  const csv=[head.map(esc).join(','),...body].join('\n');
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`hati-${FOLDERS[state.folderId]?.id||'folder'}-selection.csv`; a.click(); URL.revokeObjectURL(url);
  toast(tn('toast_exported',rows.length));
}
// re-render only the table body + header count on keystroke/sort/selection
// (keeps the search input focused)
function renderFolderListOnly(){
  const f=FOLDERS[state.folderId]; if(!f) return;
  const cs=folderFiltered();
  const tb=document.getElementById('fold-tbody'); if(!tb) return;
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
/* The four real stages take their label from statusLabel(), so a stage is
   named identically here, on the queue board and in every status chip. */
const REG_STAGES=[
  {k:'all',          lk:'reg_stage_all'},
  {k:'awaiting',     lk:'home_kpi_awaiting'},
  {k:'Draft',        status:true},
  {k:'Under Review', status:true},
  {k:'Signed',       status:true},
  {k:'Declined',     status:true},
];
const regStageLabel = s => s.status ? statusLabel(s.k) : t(s.lk);
// Derived from FOLDERS so custom (user-created) streams appear automatically.
function regTypes(){
  const acc=(typeof userFolderAccess==='function')?userFolderAccess():'*';
  const folders=Object.values(FOLDERS).filter(f=>acc==='*'||acc.includes(f.id));
  return [{k:'all',label:t('reg_type_all')}].concat(
    // streamLabel() resolves the dictionary key STREAM_SHORT now holds; a custom
    // stream has no key and keeps its user-authored name
    folders.map(f=>({ k:f.id, label:(typeof STREAM_SHORT!=='undefined'&&STREAM_SHORT[f.id])?t(STREAM_SHORT[f.id]):f.name }))
  );
}
const REG_SORTS=[
  {k:'updated',lk:'reg_sort_updated'},
  {k:'value',  lk:'reg_sort_value'},
  {k:'risk',   lk:'reg_sort_risk'},
  {k:'expiry', lk:'reg_sort_expiry'},
  {k:'name',   lk:'reg_sort_name'},
];
const REG_VIEWS=[
  {k:'expiring90', lk:'report_metric_expiring'},   // same sentence as the Reports card
  {k:'expiring60', lk:'reg_view_expiring60'},
  {k:'expiring30', lk:'reg_view_expiring30'},
  {k:'autosoon',   lk:'reg_view_autosoon'},
  {k:'overdueob',  lk:'reg_view_overdueob'},
];
function regState(){ if(!state.reg) state.reg={query:'',stage:'all',type:'all',sort:'updated',dir:-1,page:1,sel:{},view:null}; return state.reg; }
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
// total pages for the current filtered set (min 1)
function regPageCount(cs){ return Math.max(1, Math.ceil(cs.length/REG_PAGE)); }
// clamp + return the current 1-based page
function regCurPage(cs){ const R=regState(); const n=regPageCount(cs); R.page=Math.min(Math.max(1, R.page||1), n); return R.page; }
// numbered pager (‹ Prev · 1 … windowed … N · Next ›), shown only when >1 page
function regPager(cs){
  const n=regPageCount(cs); if(n<=1) return '';
  const p=regCurPage(cs);
  const btn=(label,to,disabled,active)=>`<button ${disabled?'disabled':''} data-reg-page="${to}" style="min-width:32px;padding:5px 10px;font:inherit;font-size:12px;font-weight:${active?700:500};border:1px solid ${active?'var(--color-accent)':'var(--color-divider)'};background:${active?'var(--color-accent)':'var(--color-surface)'};color:${active?'#fff':(disabled?'var(--color-neutral-400)':'var(--color-accent-700)')};border-radius:6px;cursor:${disabled?'default':'pointer'}">${label}</button>`;
  const nums=[]; const lo=Math.max(1,p-2), hi=Math.min(n,p+2);
  if(lo>1){ nums.push(btn('1',1,false,p===1)); if(lo>2) nums.push('<span style="padding:0 3px;color:var(--color-neutral-500)">…</span>'); }
  for(let i=lo;i<=hi;i++) nums.push(btn(String(i),i,false,i===p));
  if(hi<n){ if(hi<n-1) nums.push('<span style="padding:0 3px;color:var(--color-neutral-500)">…</span>'); nums.push(btn(String(n),n,false,p===n)); }
  return `<div style="display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap">${btn(t('reg_prev'),p-1,p<=1,false)}${nums.join('')}${btn(t('reg_next'),p+1,p>=n,false)}</div>`;
}
// footer text: "Showing 1–40 of 55 · page 1 of 2 · aggregate KES …"
function regFooterText(cs){
  const n=regPageCount(cs), p=regCurPage(cs);
  const start=cs.length?(p-1)*REG_PAGE+1:0, end=Math.min(cs.length,p*REG_PAGE);
  const countAll=(state.serverStats&&state.serverStats.total!=null)?state.serverStats.total:state.contracts.length;
  const L=langLocale('en-KE');
  const b=v=>`<b style="color:var(--color-text)">${v}</b>`;
  const totalNote=cs.length!==Number(countAll)?` <span style="color:var(--color-neutral-500)">${t('reg_of_total',{n:Number(countAll).toLocaleString(L)})}</span>`:'';
  // agreements vs documents — a master plus its amendments is ONE agreement
  const fam=familyCounts(cs);
  const famNote=fam.amendments?tn('reg_fam',fam.agreements,{agreements:b(fam.agreements.toLocaleString(L)),documents:b(fam.documents.toLocaleString(L))}):'';
  const R=regState();
  const flatBtn=` · <button type="button" id="reg-flat" style="border:0;background:none;font:inherit;font-size:inherit;color:var(--color-accent-700);text-decoration:underline;cursor:pointer;padding:0">${R.flat?t('reg_flat_group'):t('reg_flat_show')}</button>`;
  const showing=t('reg_showing',{ range:b(t('reg_range',{start:start.toLocaleString(L),end:end.toLocaleString(L)})), n:b(cs.length.toLocaleString(L)) });
  const agg=(typeof canViewValues==='function'&&!canViewValues())?'':t('reg_aggregate',{value:b(fmtKESshort(regAggregate(cs)))});
  return `${showing}${totalNote}${famNote} · ${t('reg_page_of',{p,n})}${agg}${flatBtn}`;
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
  // 'awaiting' is a virtual stage = contracts out with a counterparty and not yet
  // signed (a live share in 'sent' or 'opened'), matching the dashboard KPI. It
  // reads the dispatch state, not the status column. Real status pills fall
  // through to the exact-match filter.
  if(R.stage==='awaiting') cs=cs.filter(c=>{ const s=state.shareByContract&&state.shareByContract[c.id]; return !!s&&(s.state==='sent'||s.state==='opened'); });
  else if(R.stage!=='all') cs=cs.filter(c=>c.status===R.stage);
  if(R.type!=='all') cs=cs.filter(c=>c.folder===R.type);
  if(R.renewal&&R.renewal!=='all') cs=cs.filter(c=>(c.metadata&&c.metadata.renewalType)===R.renewal);
  // E3-T5 saved views (presets over metadata/obligations)
  // family-aware: expiry views work on AGREEMENTS and on the term the latest
  // amendment actually set, not on whatever was typed on the master
  const expWithin=n=>c=>{ if(c.parentId||c.status==='Declined') return false; const e=effectiveExpiry(c); return !!e&&daysUntil(e)>=0&&daysUntil(e)<=n; };
  if(R.view==='expiring90') cs=cs.filter(expWithin(90));
  else if(R.view==='expiring60') cs=cs.filter(expWithin(60));
  else if(R.view==='expiring30') cs=cs.filter(expWithin(30));
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
/* Measure the stream-filter row and fold any pills that don't fit into a
   "More ▾" dropdown. Runs after each full render and on window resize, so the
   chips stay on one line no matter how many custom streams get added. */
function layoutStreamPills(){
  const R=regState();
  const row=document.getElementById('reg-streams');
  const wrap=document.getElementById('reg-more-wrap');
  const menu=document.getElementById('reg-more-menu');
  const moreBtn=document.getElementById('reg-more');
  if(!row||!wrap||!menu) return;
  const pills=Array.from(row.children);
  pills.forEach(p=>{ p.style.display=''; });
  menu.innerHTML=''; menu.classList.add('hidden'); wrap.style.display='none';
  if(moreBtn){ moreBtn.style.borderColor='var(--color-divider)'; moreBtn.style.background='var(--color-surface)'; moreBtn.style.color='var(--color-neutral-700)'; }
  const avail=row.getBoundingClientRect().width;
  if(!avail) return;
  const gap=6, widths=pills.map(p=>p.getBoundingClientRect().width);
  const total=widths.reduce((s,w,i)=>s+w+(i?gap:0),0);
  if(total<=avail) return;              // everything fits on one line — no More needed
  const reserve=74;                     // room reserved for the "More ▾" button
  let used=0; const hidden=[];
  pills.forEach((p,i)=>{ used+=widths[i]+(i?gap:0); if(used>avail-reserve) hidden.push(p); });
  if(!hidden.length) return;
  wrap.style.display='';
  let activeHidden=false;
  hidden.forEach(p=>{ p.style.display='none';
    const k=p.getAttribute('data-reg-type'); const on=p.getAttribute('data-active')==='1'; if(on) activeHidden=true;
    const item=document.createElement('button'); item.type='button'; item.setAttribute('data-reg-type',k); item.textContent=p.textContent;
    item.style.cssText='display:block;width:100%;text-align:left;white-space:nowrap;border:0;background:'+(on?'var(--color-accent-100)':'none')+';font:inherit;font-size:12px;padding:6px 10px;border-radius:4px;cursor:pointer;color:'+(on?'var(--color-accent-800)':'var(--color-neutral-700)')+';font-weight:'+(on?'600':'400');
    item.addEventListener('mouseenter',()=>{ if(!on) item.style.background='var(--color-neutral-100)'; });
    item.addEventListener('mouseleave',()=>{ if(!on) item.style.background='none'; });
    item.addEventListener('click',()=>{ R.type=k; R.page=1; renderRegister(); });
    menu.appendChild(item);
  });
  if(moreBtn && activeHidden){ moreBtn.style.borderColor='var(--color-accent)'; moreBtn.style.background='var(--color-accent)'; moreBtn.style.color='#fff'; }
}
// Row ⋯ actions — label + which real handler runs. All close the menu first.
const REG_ROW_ACTIONS=[
  {k:'open',   lk:'reg_row_open'},
  {k:'share',  lk:'reg_row_share'},
  {k:'scan',   lk:'reg_row_scan'},
  {k:'pdf',    lk:'reg_row_pdf'},
  {k:'decline',lk:'reg_row_decline', ruby:true},
  // permanent delete — only offered while a contract is still a draft or in review
  {k:'delete', lk:'reg_row_delete', ruby:true, when:c=>c.status==='Draft'||c.status==='Under Review'},
];
function regRowsHtml(cs){
  const R=regState();
  if(!cs.length){
    const filtered = R.query.trim()||R.stage!=='all'||R.type!=='all'||R.view||(R.renewal&&R.renewal!=='all');
    const line = filtered ? t('reg_empty_filtered') : t('reg_empty_none');
    const sub  = filtered ? t('reg_empty_filtered_sub') : t('reg_empty_none_sub');
    const btn  = filtered
      ? `<button id="reg-empty-clear" class="ui-btn" style="font-size:12px;padding:6px 14px">${t('reg_clear_filters')}</button>`
      : `<button id="reg-empty-new" class="ui-btn ui-btn-primary" style="font-size:12px;padding:6px 14px">${t('cmd_new_contract')}</button>`;
    return `<tr><td colspan="12" style="padding:48px 12px;text-align:center">
      <div style="max-width:340px;margin:0 auto">
        <div style="width:44px;height:44px;margin:0 auto 12px;display:grid;place-items:center;border-radius:8px;background:var(--color-bg);color:var(--color-neutral-500)">${icon('list','w-5 h-5')}</div>
        <div style="font-size:14px;font-weight:600;color:var(--color-text)">${line}</div>
        <div style="font-size:12px;color:var(--color-neutral-600);margin:4px 0 14px;line-height:1.5">${sub}</div>
        ${btn}
      </div></td></tr>`;
  }
  const p=regCurPage(cs); const start=(p-1)*REG_PAGE;
  const pageRows=cs.slice(start, start+REG_PAGE);
  const ini=regOwnerInitials();
  const ownerT=((currentUser()&&currentUser().name)||FIRST_PARTY||'').replace(/"/g,'&quot;');
  const actBtns=c=>REG_ROW_ACTIONS.filter(a=>!a.when||a.when(c)).map(a=>`<button data-act="${a.k}" data-id="${c.id}" style="border:0;background:none;font:inherit;font-size:11.5px;text-align:left;padding:6px 9px;cursor:pointer;color:${a.ruby?'#8f322b':'inherit'}">${t(a.lk)}</button>`).join('');
  return pageRows.map((c,i)=>{
    const risk=contractRisk(c), rp=riskPal(risk);
    const eff=effectiveExpiry(c);
    const din=eff?daysUntil(eff):null;
    const renDate=eff?new Date(eff+'T00:00:00').toLocaleDateString(langLocale('en-KE'),{day:'2-digit',month:'short',year:'2-digit'}):t('value_none');
    const renIn=din==null?'':(din<0?t('reg_ren_over',{n:Math.abs(din)}):t('reg_exp_in',{n:din}));
    // urgency colour: red under 30 days (and overdue), gold under 90, else neutral
    const renUrgent=din!=null&&din<30, renSoon=din!=null&&din>=30&&din<=90;
    const renColor=din==null?'transparent':(renUrgent?'#8f322b':renSoon?'#7d5a14':'var(--color-neutral-500)');
    const renDateColor=renUrgent?'#8f322b':renSoon?'#7d5a14':'var(--color-neutral-700)';
    const appr=approvalLabel(c);
    /* approvalLabel() returns TRANSLATED text, so the tone has to be chosen by
       comparing against the same dictionary entries rather than against English
       literals — in Swedish `appr` reads "Godkänt", and the old string compares
       silently fell through to amber for every row.
       The /escalat/ test stays as-is on purpose: it matches an approval RULE
       NAME, which is user-authored data in settings and is never translated. */
    const apprColor=appr===t('approval_approved')?'#1e6b4d'
      :appr===t('approval_rejected')?'#8f322b'
      :appr===t('value_none')?'var(--color-neutral-400)'
      :/escalat/i.test(appr)?'#8f322b':'#7d5a14';
    const val=!isMonetary(c)?t('value_nm'):(c.value?fmtKESshort(c.value):t('value_none'));
    return `
    <tr data-row="${c.id}" style="cursor:pointer;animation-delay:${Math.min(i,14)*22}ms">
      <td style="padding-left:12px;border-left:4px solid ${folderColor(c)}" onclick="event.stopPropagation()"><input type="checkbox" data-sel="${c.id}" ${R.sel[c.id]?'checked':''} style="accent-color:var(--color-accent)"></td>
      <td style="font-family:var(--font-mono);font-size:11.5px;color:var(--color-neutral-600);white-space:nowrap">${c.id}</td>
      <td style="max-width:230px${c._famChild?';padding-left:22px':''}">
        <span style="display:block;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c._famChild?`<span style="color:var(--color-neutral-400);font-family:var(--font-mono);font-size:10.5px" title="${t('reg_fam_child',{relation:esc(RELATION_LABEL[c.relation]||t('reg_relation_default')),parent:esc(c.parentId)})}">↳ </span>`:''}${cPrimary(c)}${c._famKids?`<button type="button" data-fam-toggle="${c.id}" title="${R.collapsed&&R.collapsed[c.id]?tn('reg_fam_show',c._famKids,{n:c._famKids}):tn('reg_fam_hide',c._famKids,{n:c._famKids})}" style="margin-left:6px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:999px;font:inherit;font-size:9.5px;font-family:var(--font-mono);padding:1px 7px;cursor:pointer;color:var(--color-neutral-700)">${R.collapsed&&R.collapsed[c.id]?'+':'−'}${c._famKids}</button>`:''}</span>
        <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c._famChild?t('reg_fam_child',{relation:RELATION_LABEL[c.relation]||t('reg_relation_default'),parent:c.parentId}):cSecondary(c)}</span>
      </td>
      <td style="font-size:11.5px;color:var(--color-neutral-700);white-space:nowrap"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${folderColor(c)};flex:none"></span>${streamLabel(c)}</span></td>
      <td><span style="width:22px;height:22px;border-radius:50%;background:var(--color-accent-200);color:var(--color-accent-800);display:inline-grid;place-items:center;font-size:9px;font-weight:700" title="${ownerT}">${ini}</span></td>
      <td style="text-align:right;font-variant-numeric:tabular-nums;font-weight:500;white-space:nowrap;${isMonetary(c)?'':'color:var(--color-neutral-400)'}">${val}</td>
      <td>
        <span style="display:inline-flex;align-items:center;gap:5px">
          <span style="width:40px;height:5px;background:var(--color-neutral-200);display:inline-block;border-radius:999px;overflow:hidden"><span style="display:block;width:${Math.min(100,risk)}%;height:100%;background:${rp.dot};border-radius:999px"></span></span>
          <span style="font-size:11px;font-weight:600;color:${rp.fg};font-variant-numeric:tabular-nums">${risk}</span>
        </span>
      </td>
      <td style="white-space:nowrap"><span style="font-size:11.5px;font-weight:${renUrgent?600:400};color:${renDateColor}">${renDate}</span> <span style="font-size:9.5px;font-weight:600;color:${renColor}">${renIn}</span></td>
      <td style="white-space:nowrap">${statusChip(c.status)}${shareDot(c.id)}${window.questionDot?questionDot(c.id):''}</td>
      <td><span style="font-size:10.5px;font-weight:500;white-space:nowrap;color:${apprColor}">${appr}</span></td>
      <td style="text-align:right;padding-right:12px;font-size:11px;color:var(--color-neutral-600);white-space:nowrap">${c.lastAction||t('value_none')}</td>
      <td style="position:relative;width:30px" onclick="event.stopPropagation()">
        <button data-menu="${c.id}" style="border:0;background:none;cursor:pointer;padding:2px 6px;color:var(--color-neutral-600);font-size:14px;letter-spacing:1px" title="${t('reg_row_actions_title')}">⋯</button>
        <div data-menu-pop="${c.id}" style="display:none;position:absolute;right:8px;top:26px;z-index:30;width:180px;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);border-radius:4px;padding:4px;flex-direction:column">${actBtns(c)}</div>
      </td>
    </tr>`;}).join('');
}
function regSelCount(){ const R=regState(); return Object.keys(R.sel).filter(k=>R.sel[k]).length; }
function regAggregate(cs){ return cs.filter(c=>c.status!=='Declined'&&isMonetary(c)).reduce((s,c)=>s+Number(c.value||0),0); }
function renderRegisterBody(){
  const cs=regFiltered();
  const tb=document.getElementById('reg-tbody'); if(tb){ tb.innerHTML=regRowsHtml(cs); wireRegRows(); }
  const sh=document.getElementById('reg-showing'); if(sh){ sh.innerHTML=regFooterText(cs);
    document.getElementById('reg-flat')?.addEventListener('click',()=>{ const R=regState(); R.flat=!R.flat; renderRegisterBody(); }); }
  const pgr=document.getElementById('reg-pager'); if(pgr){ pgr.innerHTML=regPager(cs); wireRegPager(); }
  renderRegSelBar();
}
function renderRegSelBar(){
  const bar=document.getElementById('reg-selbar'); if(!bar) return; const n=regSelCount();
  bar.classList.toggle('hidden',n===0);
  const lbl=document.getElementById('reg-sel-count'); if(lbl) lbl.textContent=t('reg_selected',{n});
}
function regCloseMenus(){ document.querySelectorAll('#reg-tbody [data-menu-pop]').forEach(m=>m.style.display='none'); }
function wireRegRows(){
  // whole-row click opens the contract's workspace
  document.querySelectorAll('#reg-tbody [data-row]').forEach(el=>el.addEventListener('click',()=>selectContract(el.getAttribute('data-row'))));
  // expand / collapse an agreement's linked documents
  document.querySelectorAll('#reg-tbody [data-fam-toggle]').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation(); const R=regState(); const id=b.getAttribute('data-fam-toggle');
    R.collapsed=R.collapsed||{}; if(R.collapsed[id]) delete R.collapsed[id]; else R.collapsed[id]=true;
    renderRegisterBody();
  }));
  document.querySelectorAll('#reg-tbody [data-sel]').forEach(el=>el.addEventListener('change',e=>{ const R=regState(); const id=el.getAttribute('data-sel'); if(el.checked) R.sel[id]=true; else delete R.sel[id]; renderRegSelBar(); }));
  // ⋯ popover: toggle one open at a time
  document.querySelectorAll('#reg-tbody [data-menu]').forEach(btn=>btn.addEventListener('click',e=>{ e.stopPropagation(); const id=btn.getAttribute('data-menu'); const pop=document.querySelector('#reg-tbody [data-menu-pop="'+id+'"]'); const open=pop&&pop.style.display==='flex'; regCloseMenus(); if(pop&&!open) pop.style.display='flex'; }));
  document.querySelectorAll('#reg-tbody [data-act]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); regCloseMenus();
    const id=b.getAttribute('data-id'), act=b.getAttribute('data-act'), c=getContract(id); if(!c) return;
    if(act==='open') openWorkspace(id);
    else if(act==='share') openShareModal(c);
    else if(act==='scan') runScanFor(c);
    else if(act==='delete') deleteContract(id).then(ok=>{ if(ok) renderRegister(); });
    else openWorkspace(id); // Export PDF / Decline & close are completed inside the workspace
  }));
  // empty-state actions
  document.getElementById('reg-empty-clear')?.addEventListener('click',()=>{ const R=regState(); R.query=''; R.stage='all'; R.type='all'; R.view=null; R.renewal='all'; R.page=1; const cs=document.getElementById('cmd-search'); if(cs) cs.value=''; renderRegister(); });
  document.getElementById('reg-empty-new')?.addEventListener('click',()=>{ const nb=document.getElementById('cmd-new'), nm=document.getElementById('new-menu'); if(nm){ if(window.renderNewMenu) renderNewMenu(); nm.classList.remove('hidden'); } else if(nb){ nb.click(); } });
}
function regExportSelectedCsv(){
  const R=regState(); const ids=Object.keys(R.sel).filter(k=>R.sel[k]);
  const rows=state.contracts.filter(c=>ids.includes(c.id));
  if(!rows.length){ toast(t('toast_nothing_selected'),'err'); return; }
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  // i18n-exempt: CSV column names are a file format parsed by name downstream
  const head=['ID','Name','Counterparty','Type','Folder','Value (KES)','Status','Last action','Expiry'];
  const body=rows.map(c=>[c.id,c.name,c.counterparty||'',cKind(c),FOLDERS[c.folder]?.name||'',csvValueCell(c),statusLabel(c.status),c.lastAction||'',c.expiry||''].map(esc).join(','));
  const csv=[head.map(esc).join(','),...body].join('\n');
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='hati-register-selection.csv'; a.click(); URL.revokeObjectURL(url);
  toast(tn('toast_exported',rows.length));
}
function renderRegister(){
  const R=regState(); R.page=1;
  const cs=regFiltered();
  // Industry filter pill: accent fill when active, hairline box + accent-border hover when not.
  const pill=(active)=>`display:inline-flex;align-items:center;border:1px solid ${active?'var(--color-accent)':'var(--color-divider)'};background:${active?'var(--color-accent)':'var(--color-surface)'};color:${active?'#fff':'var(--color-neutral-700)'};font-size:11.5px;font-weight:500;padding:5px 13px;border-radius:999px;cursor:pointer`;
  const selStyle='font:inherit;font-size:12px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:4px 6px;color:inherit;cursor:pointer';
  const stagePills=REG_STAGES.map(s=>`<button class="reg-pill" data-reg-stage="${s.k}" style="${pill(R.stage===s.k)}">${regStageLabel(s)}</button>`).join('');
  // map callback renamed from `t` to `ty`: `t` is the translation helper
  const typePills=regTypes().map(ty=>`<button class="reg-pill" data-reg-type="${ty.k}" data-active="${R.type===ty.k?'1':'0'}" style="${pill(R.type===ty.k)}">${ty.label}</button>`).join('');
  const sortOpts=visibleSorts(REG_SORTS).map(s=>`<option value="${s.k}" ${R.sort===s.k?'selected':''}>${t(s.lk)}</option>`).join('');
  // Clickable, sortable column header: shows a dim ↕ when inactive and a solid
  // ▲/▼ for the active sort direction. Clicking toggles asc/desc (see wiring below).
  const sortCaret=key=>R.sort===key
    ? `<span style="margin-left:4px;font-size:9px;color:var(--color-accent-700)">${R.dir===1?'▲':'▼'}</span>`
    : `<span class="reg-sort-idle" style="margin-left:4px;font-size:9px;color:var(--color-neutral-400)">↕</span>`;
  const sortableTh=(key,label,extra='')=>`<th class="reg-th-sort${R.sort===key?' active':''}" data-reg-sort="${key}" title="${t('reg_sort_by_title',{label})}" aria-sort="${R.sort===key?(R.dir===1?'ascending':'descending'):'none'}" style="cursor:pointer;user-select:none;${extra}">${label}${sortCaret(key)}</th>`;
  const viewPills=REG_VIEWS.map(v=>`<button class="reg-pill" data-reg-view="${v.k}" style="${pill(R.view===v.k)}">${t(v.lk)}</button>`).join('');
  const renewalSel=`<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--color-neutral-700)">${t('reg_renewal_label')}
    <select id="reg-renewal" style="${selStyle}">${[['all','reg_renewal_any'],['auto-renew','reg_renewal_auto'],['fixed','reg_renewal_fixed'],['evergreen','reg_renewal_evergreen']].map(([k,lk])=>`<option value="${k}" ${(R.renewal||'all')===k?'selected':''}>${t(lk)}</option>`).join('')}</select></label>`;
  // Server-mode full-text search + semantic ask live in a secondary strip (the
  // command bar owns the primary search); kept here so FTS wiring stays intact.
  const ftsBlock=API_MODE()?`
    <div style="position:relative;flex:1;min-width:200px;max-width:340px">
      <span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--color-neutral-500);display:inline-flex">${icon('search','w-3.5 h-3.5')}</span>
      <input id="reg-search" value="${R.query.replace(/"/g,'&quot;')}" placeholder="${t('reg_fts_ph')}" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:6px 9px 6px 30px;font:inherit;font-size:12px;outline:none;color:inherit">
      <div id="reg-fts" class="hidden" style="position:absolute;z-index:40;margin-top:4px;width:100%;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);border-radius:4px;max-height:320px;overflow-y:auto"></div>
    </div>`:'';

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="height:calc(100vh - 52px);box-sizing:border-box;padding:14px 16px 14px;display:flex;flex-direction:column">
    <style>
      .reg-table{width:100%;border-collapse:collapse;font-size:12.5px}
      .reg-table thead th{position:sticky;top:0;z-index:3}
      .reg-table th{text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:color-mix(in srgb,var(--color-text) 60%,transparent);padding:6.8px;border-bottom:1px solid var(--color-divider);white-space:nowrap;background:#fafbfc}
      .reg-table td{padding:6.8px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 8%,transparent);vertical-align:middle}
      .reg-table tbody tr:hover{background:color-mix(in srgb,var(--color-text) 4%,transparent)}
      .reg-pill:hover{border-color:var(--color-accent)}
      .reg-th-sort:hover{color:var(--color-accent-700)!important}
      .reg-th-sort:hover .reg-sort-idle{color:var(--color-accent-700)}
      .reg-th-sort.active{color:var(--color-accent-800)!important}
    </style>
    <div style="display:flex;flex-direction:column;gap:10px;flex:1;min-height:0">
      <!-- filter row 1: stage pills · Sort -->
      <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
        ${stagePills}
        <span style="flex:1;min-width:8px"></span>
        <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--color-neutral-700);flex:none">${t('reg_sort_label')}
          <select id="reg-sort" style="${selStyle}">${sortOpts}</select>
        </label>
      </div>
      <!-- filter row 2: stream pills on their own full-width line, overflow → More ▾ -->
      <div id="reg-streambar" style="display:flex;gap:6px;align-items:center;min-width:0;position:relative">
        <div id="reg-streams" style="display:flex;gap:6px;align-items:center;flex-wrap:nowrap;overflow:hidden;min-width:0;flex:1">${typePills}</div>
        <div id="reg-more-wrap" style="position:relative;flex:none;display:none">
          <button id="reg-more" type="button" class="reg-pill" style="${pill(false)}">${t('reg_more')}</button>
          <div id="reg-more-menu" class="hidden" style="position:absolute;top:calc(100% + 4px);right:0;z-index:40;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);border-radius:6px;padding:6px;min-width:180px;max-height:300px;overflow:auto"></div>
        </div>
      </div>
      <!-- secondary controls: saved views · renewal · full-text (server mode) -->
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px">
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px">
          <span style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500);margin-right:2px">${t('reg_saved_views')}</span>
          ${viewPills}
          ${R.view?`<button data-reg-view="" style="font-size:11px;font-weight:600;color:var(--color-accent-700);background:none;border:0;cursor:pointer;margin-left:2px">${t('reg_clear_view')}</button>`:''}
        </div>
        <span style="flex:1;min-width:8px"></span>
        ${renewalSel}
        ${ftsBlock}
      </div>
      <!-- legend: explains the coloured row edge-stripe (value stream) -->
      <div style="padding-top:2px;border-top:1px solid var(--color-divider)">${folderLegendHtml({style:'padding-top:8px'})}</div>

      <div id="reg-selbar" class="flex hidden items-center justify-between" style="gap:12px;border:1px solid var(--color-accent-800);background:var(--color-accent-800);color:#fff;border-radius:4px;padding:8px 12px">
        <span id="reg-sel-count" style="font-size:12px;font-weight:600">${t('reg_selected',{n:0})}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <button id="reg-export" style="display:inline-flex;align-items:center;gap:6px;border:0;background:rgba(255,255,255,.16);color:#fff;border-radius:4px;padding:5px 10px;font:inherit;font-size:11.5px;font-weight:600;cursor:pointer">${icon('download','w-3.5 h-3.5')} ${t('reg_export_csv')}</button>
          <button id="reg-clear" style="border:0;background:none;color:rgba(255,255,255,.72);padding:5px 8px;font:inherit;font-size:11.5px;font-weight:600;cursor:pointer">${t('reg_clear')}</button>
        </div>
      </div>

      <section class="blueprint bp-round" style="background:var(--color-surface);box-shadow:var(--shadow-sm);flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden">

        <div id="reg-scroll" style="flex:1;min-height:0;overflow:auto">
          <table class="reg-table">
            <thead>
              <tr>
                <th style="width:26px;padding-left:12px"><input id="reg-selall" type="checkbox" style="accent-color:var(--color-accent)"></th>
                <th>${t('reg_th_id')}</th>
                ${sortableTh('name',t('fold_th_contract'))}
                <th>${t('reg_th_stream')}</th>
                <th>${t('reg_th_owner')}</th>
                ${sortableTh('value',t('fold_th_value'),'text-align:right')}
                ${sortableTh('risk',t('reg_th_risk'))}
                ${sortableTh('expiry',t('reg_renewal_label'))}
                ${sortableTh('stage',t('advice_lbl_stage'))}
                <th>${t('home_appr_step_default')}</th>
                ${sortableTh('updated',t('fold_th_updated'),'text-align:right;padding-right:12px')}
                <th style="width:30px"></th>
              </tr>
            </thead>
            <tbody id="reg-tbody" class="stagger">${regRowsHtml(cs)}</tbody>
          </table>
        </div>
        <div style="flex:none;border-top:1px solid var(--color-divider);display:flex;align-items:center;justify-content:space-between;gap:10px 16px;flex-wrap:wrap;padding:5px 12px;font-size:11px;color:var(--color-neutral-600)">
          <span id="reg-showing">${regFooterText(cs)}</span>
          <div id="reg-pager" style="display:flex;align-items:center;gap:6px">${regPager(cs)}</div>
          <span>${t('reg_per_page',{n:REG_PAGE})}</span>
        </div>
      </section>
    </div>
  </div>`;

  wireRegRows();
  wireRegPager();
  renderRegSelBar();
  const si=document.getElementById('reg-search');
  if(si){
    si.addEventListener('input',()=>{ R.query=si.value; R.page=1; renderRegisterBody(); if(API_MODE()) ftsSearch(si.value); });
  }
  // outside click closes the FTS dropdown and any open row ⋯ menu
  document.addEventListener('click',e=>{ const box=document.getElementById('reg-fts'); if(box&&!box.contains(e.target)&&e.target!==si) box.classList.add('hidden'); if(!e.target.closest('[data-menu-pop]')&&!e.target.closest('[data-menu]')) regCloseMenus(); const mm=document.getElementById('reg-more-menu'); if(mm&&!mm.classList.contains('hidden')&&!e.target.closest('#reg-more-wrap')) mm.classList.add('hidden'); });
  document.getElementById('reg-more')?.addEventListener('click',e=>{ e.stopPropagation(); document.getElementById('reg-more-menu')?.classList.toggle('hidden'); });
  document.getElementById('reg-sort')?.addEventListener('change',e=>{ R.sort=e.target.value; R.dir=REG_SORT_DEFDIR[R.sort]||-1; R.page=1; renderRegister(); });
  // Column-header sorting: click a header to sort by it; click the active header
  // again to flip ascending/descending. First click uses the column's natural
  // direction (e.g. renewal nearest-first, value high-first).
  document.querySelectorAll('[data-reg-sort]').forEach(el=>el.addEventListener('click',()=>{
    const key=el.getAttribute('data-reg-sort');
    if(R.sort===key) R.dir=-R.dir; else { R.sort=key; R.dir=REG_SORT_DEFDIR[key]||-1; }
    R.page=1; renderRegister();
  }));
  document.getElementById('reg-renewal')?.addEventListener('change',e=>{ R.renewal=e.target.value; R.page=1; renderRegisterBody(); });
  document.querySelectorAll('[data-reg-stage]').forEach(el=>el.addEventListener('click',()=>{ R.stage=el.getAttribute('data-reg-stage'); R.page=1; renderRegister(); }));
  document.querySelectorAll('[data-reg-type]').forEach(el=>el.addEventListener('click',()=>{ R.type=el.getAttribute('data-reg-type'); R.page=1; renderRegister(); }));
  document.querySelectorAll('[data-reg-view]').forEach(el=>el.addEventListener('click',()=>{ R.view=el.getAttribute('data-reg-view')||null; R.page=1; renderRegister(); }));
  document.getElementById('reg-selall')?.addEventListener('change',e=>{ const on=e.target.checked; const cs=regFiltered(); const p=regCurPage(cs); cs.slice((p-1)*REG_PAGE, (p-1)*REG_PAGE+REG_PAGE).forEach(c=>{ if(on) R.sel[c.id]=true; else delete R.sel[c.id]; }); renderRegisterBody(); });
  document.getElementById('reg-export')?.addEventListener('click',regExportSelectedCsv);
  document.getElementById('reg-clear')?.addEventListener('click',()=>{ R.sel={}; renderRegisterBody(); });
  layoutStreamPills();
  if(!window._regStreamResizeBound){ window._regStreamResizeBound=true; window.addEventListener('resize',()=>{ if(state.view==='register') layoutStreamPills(); }); }
  setActiveNav('register');
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
      if(!r.hits||!r.hits.length){ box.innerHTML=`<div style="padding:10px 12px;font-size:12px;color:var(--color-neutral-600)">${t('reg_fts_none')}</div>`; box.classList.remove('hidden'); return; }
      box.innerHTML=r.hits.map(h=>`<button data-fts-open="${h.id}" style="display:block;width:100%;text-align:left;padding:8px 12px;border:0;border-bottom:1px solid var(--color-divider);background:none;cursor:pointer;font:inherit">
        <div style="font-size:12.5px;font-weight:600;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(h.name||h.id)} <span style="font-family:var(--font-mono);font-size:10px;color:var(--color-neutral-500)">${h.id}</span></div>
        ${h.snippet?`<div style="font-size:11px;color:var(--color-neutral-600);margin-top:2px">${h.snippet.replace(/</g,'&lt;').replace(/\[/g,'<mark style="background:#f1e6cd;border-radius:2px;padding:0 2px">').replace(/\]/g,'</mark>')}</div>`:(h.counterparty?`<div style="font-size:11px;color:var(--color-neutral-500)">${h.counterparty}</div>`:'')}
      </button>`).join('');
      box.classList.remove('hidden');
      box.querySelectorAll('[data-fts-open]').forEach(b=>b.addEventListener('click',()=>{ box.classList.add('hidden'); openWorkspace(b.getAttribute('data-fts-open')); }));
    }catch(e){ box.classList.add('hidden'); }
  },220);
}
Object.assign(window,{REG_PAGE,REG_SORTS,REG_STAGES,regStageLabel,regTypes,REG_VIEWS,REG_ROW_ACTIONS,ftsSearch,regAggregate,regCloseMenus,regExportSelectedCsv,regFiltered,regOwnerInitials,regRowsHtml,regSelCount,regState,renderRegSelBar,renderRegister,renderRegisterBody,wireRegRows,layoutStreamPills});
