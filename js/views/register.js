// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   VIEW: FOLDER (filtered register + local search)
   ============================================================ */
const FOLDER_PAGE=50;
const FOLDER_SORTS=[
  {k:'updated',label:'Recently updated'},
  {k:'value',label:'Value (high → low)'},
  {k:'expiry',label:'Expiring soonest'},
  {k:'name',label:'Name (A → Z)'},
];
// The filtered + sorted contracts for the current folder (shared by the full
// render and the search/keystroke body re-render).
function folderFiltered(){
  const f=FOLDERS[state.folderId]; if(!f) return [];
  const q=(state.folderQuery||'').trim().toLowerCase();
  let cs=folderContracts(f.id);
  if(q) cs=cs.filter(c=>(c.name+' '+(c.counterparty||'')+' '+c.id).toLowerCase().includes(q));
  const sort=state.folderSort||'updated';
  const upd=c=>{ const t=Date.parse(c.lastAction); return isNaN(t)?0:t; };
  if(sort==='updated') cs.sort((a,b)=>upd(b)-upd(a));
  else if(sort==='value') cs.sort((a,b)=>Number(b.value||0)-Number(a.value||0));
  else if(sort==='name') cs.sort((a,b)=>a.name.localeCompare(b.name));
  else if(sort==='expiry') cs.sort((a,b)=>{ const da=a.expiry?daysUntil(a.expiry):1e9, db=b.expiry?daysUntil(b.expiry):1e9; return da-db; });
  return cs;
}
function renderFolder(){
  const f=FOLDERS[state.folderId];
  if(!f){ setView('dashboard'); return; }
  state.folderShown=FOLDER_PAGE; state.folderSel={};   // fresh selection on entry
  const cs=folderFiltered();
  const val=cs.filter(c=>c.status!=='Declined').reduce((s,c)=>s+Number(c.value||0),0);
  const sortOpts=FOLDER_SORTS.map(s=>`<option value="${s.k}" ${(state.folderSort||'updated')===s.k?'selected':''}>${s.label}</option>`).join('');

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
        <button id="back-dash" style="width:28px;height:28px;flex:none;display:inline-grid;place-items:center;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;color:var(--color-accent-700);cursor:pointer" title="Back to portfolio">${icon('arrowLeft','w-4 h-4')}</button>
        <span style="width:28px;height:28px;flex:none;display:grid;place-items:center;background:var(--color-accent-800);color:#fff;border-radius:4px">${icon(f.ic,'w-4 h-4')}</span>
        <div style="min-width:0">
          <div style="font-family:var(--font-mono);font-weight:600;font-size:17px;color:var(--color-text);line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</div>
          <div style="font-size:11px;color:var(--color-neutral-600)"><span id="fold-count">${cs.length}</span> contracts · ${fmtKESshort(val)} active value</div>
        </div>
        <span style="flex:1"></span>
        <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--color-neutral-700)">Sort
          <select id="folder-sort" style="${selStyle}">${sortOpts}</select>
        </label>
        <div style="position:relative">
          <span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--color-neutral-500);display:inline-flex">${icon('search','w-3.5 h-3.5')}</span>
          <input id="folder-search" value="${(state.folderQuery||'').replace(/"/g,'&quot;')}" type="text" placeholder="Search in this folder…" style="width:230px;max-width:60vw;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:6px 9px 6px 30px;font:inherit;font-size:12px;outline:none;color:inherit">
        </div>
      </div>

      <div id="fold-selbar" class="flex hidden items-center justify-between" style="gap:12px;border:1px solid var(--color-accent-800);background:var(--color-accent-800);color:#fff;border-radius:4px;padding:8px 12px">
        <span id="fold-sel-count" style="font-size:12px;font-weight:600">0 selected</span>
        <div style="display:flex;align-items:center;gap:8px">
          <button id="fold-export" style="display:inline-flex;align-items:center;gap:6px;border:0;background:rgba(255,255,255,.16);color:#fff;border-radius:4px;padding:5px 10px;font:inherit;font-size:11.5px;font-weight:600;cursor:pointer">${icon('download','w-3.5 h-3.5')} Export CSV</button>
          <button id="fold-clear" style="border:0;background:none;color:rgba(255,255,255,.72);padding:5px 8px;font:inherit;font-size:11.5px;font-weight:600;cursor:pointer">Clear</button>
        </div>
      </div>

      <section class="blueprint bp-round" style="background:var(--color-surface);box-shadow:var(--shadow-sm)">
        
        <div style="overflow-x:auto">
          <table class="fold-table">
            <thead>
              <tr>
                <th style="width:26px;padding-left:12px"><input id="fold-selall" type="checkbox" style="accent-color:var(--color-accent)"></th>
                <th>Contract</th>
                <th>Type</th>
                <th style="text-align:right">Value</th>
                <th>Expires</th>
                <th>Updated</th>
                <th style="text-align:right;padding-right:12px">Status</th>
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
  if(!c.expiry) return '<span style="color:var(--color-neutral-400)">—</span>';
  const dt=new Date(c.expiry+'T00:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  let col='var(--color-neutral-700)', hint='', weight=400;
  if(c.status!=='Declined'){ const d=daysUntil(c.expiry);
    if(d<0){ col='#8f322b'; weight=600; hint=`${-d}d ago`; }
    else if(d<30){ col='#8f322b'; weight=600; hint=`in ${d}d`; }
    else if(d<=90){ col='#7d5a14'; hint=`in ${d}d`; }
  }
  return `<span style="color:${col};font-weight:${weight}">${dt}</span>${hint?`<span style="display:block;font-size:10px;color:${col};opacity:.85">${hint}</span>`:''}`;
}
// Render up to state.folderShown rows as a table body, with a "Show more" pager.
function folderRowsHtml(cs){
  if(!cs.length) return `<tr><td colspan="7" style="padding:44px 20px;text-align:center">
      <div style="font-size:13px;font-weight:600;color:var(--color-text)">${(state.folderQuery||'').trim()?`No contracts match "${state.folderQuery}"`:'No contracts in this value stream yet'}</div>
      <div style="font-size:11.5px;color:var(--color-neutral-600);margin-top:4px">${(state.folderQuery||'').trim()?'Clear the search, or ask HaTi AI to look across all folders.':'Create one with New contract, or upload received paper.'}</div>
    </td></tr>`;
  const shown=Math.min(cs.length, state.folderShown||FOLDER_PAGE);
  const sel=state.folderSel||{};
  return cs.slice(0,shown).map((c,i)=>{
    const o=(window.openFindings?openFindings(c):[])||[];
    const scan=o.length?`<span class="badge" style="margin-left:6px;background:#f1dcd8;color:#8f322b" title="Open scan findings">${icon('scan','w-2.5 h-2.5')}${o.length}</span>`:'';
    return `
    <tr data-open="${c.id}" style="cursor:pointer;animation-delay:${Math.min(i,14)*22}ms">
      <td style="padding-left:12px" onclick="event.stopPropagation()"><input type="checkbox" data-fsel="${c.id}" ${sel[c.id]?'checked':''} style="accent-color:var(--color-accent)"></td>
      <td style="max-width:260px"><div style="display:flex;align-items:center;gap:9px;min-width:0">
        <span style="width:26px;height:26px;flex:none;display:grid;place-items:center;border-radius:4px;border:1px solid var(--color-divider);background:${isUpload(c)?'var(--color-accent-200)':'var(--color-bg)'};color:${isUpload(c)?'var(--color-accent-800)':'var(--color-neutral-600)'}" ${isUpload(c)?'title="Uploaded — received from counterparty"':''}>${icon(cIcon(c),'w-3.5 h-3.5')}</span>
        <span style="min-width:0">
          <span style="display:block;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name}</span>
          <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span style="font-family:var(--font-mono)">${c.id}</span> · ${c.counterparty||'No counterparty yet'}</span>
        </span>
      </div></td>
      <td style="font-size:11.5px;color:var(--color-neutral-700);white-space:nowrap"><span style="display:inline-flex;align-items:center;gap:6px">${icon(cIcon(c),'w-4 h-4')}${cKind(c)}</span>${scan}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums;font-weight:500;white-space:nowrap;${isMonetary(c)?'':'color:var(--color-neutral-400)'}" ${!isMonetary(c)?'title="Non-monetary agreement"':''}>${!isMonetary(c)?'n/m':(c.value?fmtKESshort(c.value):'—')}</td>
      <td style="font-size:11.5px;font-variant-numeric:tabular-nums;white-space:nowrap">${folderExpiryCell(c)}</td>
      <td style="font-size:11px;color:var(--color-neutral-600);white-space:nowrap">${c.lastAction||'—'}</td>
      <td style="text-align:right;padding-right:12px;white-space:nowrap">${statusChip(c.status)}${shareDot(c.id)}</td>
    </tr>`; }).join('') + (cs.length>shown
      ? `<tr><td colspan="7" style="padding:0"><button id="folder-more" style="width:100%;padding:11px;font-size:12.5px;font-weight:600;color:var(--color-accent-700);background:none;border:0;border-top:1px solid var(--color-divider);cursor:pointer">Show ${Math.min(FOLDER_PAGE,cs.length-shown)} more · ${cs.length-shown} remaining</button></td></tr>`
      : '');
}
function folderSelCount(){ const s=state.folderSel||{}; return Object.keys(s).filter(k=>s[k]).length; }
function renderFolderSelBar(){
  const bar=document.getElementById('fold-selbar'); if(!bar) return; const n=folderSelCount();
  bar.classList.toggle('hidden',n===0);
  const lbl=document.getElementById('fold-sel-count'); if(lbl) lbl.textContent=n+' selected';
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
  if(!rows.length){ toast('Nothing selected','err'); return; }
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const head=['ID','Name','Counterparty','Type','Value stream','Value (KES)','Status','Last action','Expiry'];
  const body=rows.map(c=>[c.id,c.name,c.counterparty||'',cKind(c),FOLDERS[c.folder]?.name||'',isMonetary(c)?(c.value||0):'',statusLabel(c.status),c.lastAction||'',c.expiry||''].map(esc).join(','));
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
  {k:'all',label:'All stages'},
  {k:'Draft',label:'Drafting'},
  {k:'Under Review',label:'In Review'},
  {k:'Signed',label:'Executed'},
  {k:'Declined',label:'Closed'},
];
// Derived from FOLDERS so custom (user-created) streams appear automatically.
function regTypes(){
  return [{k:'all',label:'All streams'}].concat(
    Object.values(FOLDERS).map(f=>({ k:f.id, label:(typeof STREAM_SHORT!=='undefined'&&STREAM_SHORT[f.id])||f.name }))
  );
}
const REG_SORTS=[
  {k:'updated',label:'Recently updated'},
  {k:'value',label:'Value (high → low)'},
  {k:'risk',label:'Risk (high → low)'},
  {k:'expiry',label:'Expiring soonest'},
  {k:'name',label:'Name (A → Z)'},
];
const REG_VIEWS=[
  {k:'expiring90', label:'Expiring ≤ 90 days'},
  {k:'expiring60', label:'Expiring ≤ 60 days'},
  {k:'expiring30', label:'Expiring ≤ 30 days'},
  {k:'autosoon',   label:'Auto-renewing soon'},
  {k:'overdueob',  label:'Overdue obligations'},
];
function regState(){ if(!state.reg) state.reg={query:'',stage:'all',type:'all',sort:'updated',shown:REG_PAGE,sel:{},view:null}; return state.reg; }
function regFiltered(){
  const R=regState(); let cs=state.contracts.slice();
  if(R.stage!=='all') cs=cs.filter(c=>c.status===R.stage);
  if(R.type!=='all') cs=cs.filter(c=>c.folder===R.type);
  if(R.renewal&&R.renewal!=='all') cs=cs.filter(c=>(c.metadata&&c.metadata.renewalType)===R.renewal);
  // E3-T5 saved views (presets over metadata/obligations)
  if(R.view==='expiring90') cs=cs.filter(c=>c.expiry&&c.status!=='Declined'&&daysUntil(c.expiry)>=0&&daysUntil(c.expiry)<=90);
  else if(R.view==='expiring60') cs=cs.filter(c=>c.expiry&&c.status!=='Declined'&&daysUntil(c.expiry)>=0&&daysUntil(c.expiry)<=60);
  else if(R.view==='expiring30') cs=cs.filter(c=>c.expiry&&c.status!=='Declined'&&daysUntil(c.expiry)>=0&&daysUntil(c.expiry)<=30);
  else if(R.view==='autosoon') cs=cs.filter(c=>{ const dd=renewalDecisionDate(c); return (c.metadata&&c.metadata.renewalType==='auto-renew')&&dd&&daysUntil(dd)>=0&&daysUntil(dd)<=60; });
  else if(R.view==='overdueob') cs=cs.filter(c=>(c.obligations||[]).some(o=>obState(o)==='overdue'));
  const q=R.query.trim().toLowerCase();
  if(q) cs=cs.filter(c=>(c.name+' '+(c.counterparty||'')+' '+c.id).toLowerCase().includes(q));
  const upd=c=>{ const t=Date.parse(c.lastAction); return isNaN(t)?0:t; };
  if(R.sort==='updated') cs.sort((a,b)=>upd(b)-upd(a));
  else if(R.sort==='value') cs.sort((a,b)=>Number(b.value||0)-Number(a.value||0));
  else if(R.sort==='risk') cs.sort((a,b)=>contractRisk(b)-contractRisk(a));
  else if(R.sort==='name') cs.sort((a,b)=>a.name.localeCompare(b.name));
  else if(R.sort==='expiry') cs.sort((a,b)=>{ const da=a.expiry?daysUntil(a.expiry):1e9, db=b.expiry?daysUntil(b.expiry):1e9; return da-db; });
  return cs;
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
    item.addEventListener('click',()=>{ R.type=k; R.shown=REG_PAGE; renderRegister(); });
    menu.appendChild(item);
  });
  if(moreBtn && activeHidden){ moreBtn.style.borderColor='var(--color-accent)'; moreBtn.style.background='var(--color-accent)'; moreBtn.style.color='#fff'; }
}
// Row ⋯ actions — label + which real handler runs. All close the menu first.
const REG_ROW_ACTIONS=[
  {k:'open',   label:'Open workspace'},
  {k:'share',  label:'Share with counterparty'},
  {k:'scan',   label:'Run AI scan'},
  {k:'pdf',    label:'Export PDF'},
  {k:'decline',label:'Decline & close', ruby:true},
  // permanent delete — only offered while a contract is still a draft or in review
  {k:'delete', label:'Delete permanently', ruby:true, when:c=>c.status==='Draft'||c.status==='Under Review'},
];
function regRowsHtml(cs){
  const R=regState();
  if(!cs.length){
    const filtered = R.query.trim()||R.stage!=='all'||R.type!=='all'||R.view||(R.renewal&&R.renewal!=='all');
    const line = filtered ? 'No contracts match the current filters.' : 'No contracts in your register yet.';
    const sub  = filtered ? 'Try widening the filters, or clear them to see everything.' : 'Create one from a template, or upload a contract you received.';
    const btn  = filtered
      ? `<button id="reg-empty-clear" class="ui-btn" style="font-size:12px;padding:6px 14px">Clear all filters</button>`
      : `<button id="reg-empty-new" class="ui-btn ui-btn-primary" style="font-size:12px;padding:6px 14px">+ New contract</button>`;
    return `<tr><td colspan="12" style="padding:48px 12px;text-align:center">
      <div style="max-width:340px;margin:0 auto">
        <div style="width:44px;height:44px;margin:0 auto 12px;display:grid;place-items:center;border-radius:8px;background:var(--color-bg);color:var(--color-neutral-500)">${icon('list','w-5 h-5')}</div>
        <div style="font-size:14px;font-weight:600;color:var(--color-text)">${line}</div>
        <div style="font-size:12px;color:var(--color-neutral-600);margin:4px 0 14px;line-height:1.5">${sub}</div>
        ${btn}
      </div></td></tr>`;
  }
  const shown=Math.min(cs.length, R.shown||REG_PAGE);
  const ini=regOwnerInitials();
  const ownerT=((currentUser()&&currentUser().name)||FIRST_PARTY||'').replace(/"/g,'&quot;');
  const actBtns=c=>REG_ROW_ACTIONS.filter(a=>!a.when||a.when(c)).map(a=>`<button data-act="${a.k}" data-id="${c.id}" style="border:0;background:none;font:inherit;font-size:11.5px;text-align:left;padding:6px 9px;cursor:pointer;color:${a.ruby?'#8f322b':'inherit'}">${a.label}</button>`).join('');
  return cs.slice(0,shown).map((c,i)=>{
    const risk=contractRisk(c), rp=riskPal(risk);
    const din=c.expiry?daysUntil(c.expiry):null;
    const renDate=c.expiry?new Date(c.expiry+'T00:00:00').toLocaleDateString('en-KE',{day:'2-digit',month:'short',year:'2-digit'}):'—';
    const renIn=din==null?'':(din<0?Math.abs(din)+'d over':'in '+din+'d');
    // urgency colour: red under 30 days (and overdue), gold under 90, else neutral
    const renUrgent=din!=null&&din<30, renSoon=din!=null&&din>=30&&din<=90;
    const renColor=din==null?'transparent':(renUrgent?'#8f322b':renSoon?'#7d5a14':'var(--color-neutral-500)');
    const renDateColor=renUrgent?'#8f322b':renSoon?'#7d5a14':'var(--color-neutral-700)';
    const appr=approvalLabel(c);
    const apprColor=appr==='Approved'?'#1e6b4d':appr==='Rejected'?'#8f322b':appr==='—'?'var(--color-neutral-400)':/escalat/i.test(appr)?'#8f322b':'#7d5a14';
    const val=!isMonetary(c)?'n/m':(c.value?fmtKESshort(c.value):'—');
    return `
    <tr data-row="${c.id}" style="cursor:pointer;animation-delay:${Math.min(i,14)*22}ms">
      <td style="padding-left:12px;border-left:4px solid ${folderColor(c)}" onclick="event.stopPropagation()"><input type="checkbox" data-sel="${c.id}" ${R.sel[c.id]?'checked':''} style="accent-color:var(--color-accent)"></td>
      <td style="font-family:var(--font-mono);font-size:11.5px;color:var(--color-neutral-600);white-space:nowrap">${c.id}</td>
      <td style="max-width:230px">
        <span style="display:block;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${cPrimary(c)}</span>
        <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${cSecondary(c)}</span>
      </td>
      <td style="font-size:11.5px;color:var(--color-neutral-700);white-space:nowrap">${streamLabel(c)}</td>
      <td><span style="width:22px;height:22px;border-radius:50%;background:var(--color-accent-200);color:var(--color-accent-800);display:inline-grid;place-items:center;font-size:9px;font-weight:700" title="${ownerT}">${ini}</span></td>
      <td style="text-align:right;font-variant-numeric:tabular-nums;font-weight:500;white-space:nowrap;${isMonetary(c)?'':'color:var(--color-neutral-400)'}">${val}</td>
      <td>
        <span style="display:inline-flex;align-items:center;gap:5px">
          <span style="width:40px;height:5px;background:var(--color-neutral-200);display:inline-block;border-radius:999px;overflow:hidden"><span style="display:block;width:${Math.min(100,risk)}%;height:100%;background:${rp.dot};border-radius:999px"></span></span>
          <span style="font-size:11px;font-weight:600;color:${rp.fg};font-variant-numeric:tabular-nums">${risk}</span>
        </span>
      </td>
      <td style="white-space:nowrap"><span style="font-size:11.5px;font-weight:${renUrgent?600:400};color:${renDateColor}">${renDate}</span> <span style="font-size:9.5px;font-weight:600;color:${renColor}">${renIn}</span></td>
      <td style="white-space:nowrap">${statusChip(c.status)}${shareDot(c.id)}</td>
      <td><span style="font-size:10.5px;font-weight:500;white-space:nowrap;color:${apprColor}">${appr}</span></td>
      <td style="text-align:right;padding-right:12px;font-size:11px;color:var(--color-neutral-600);white-space:nowrap">${c.lastAction||'—'}</td>
      <td style="position:relative;width:30px" onclick="event.stopPropagation()">
        <button data-menu="${c.id}" style="border:0;background:none;cursor:pointer;padding:2px 6px;color:var(--color-neutral-600);font-size:14px;letter-spacing:1px" title="Row actions">⋯</button>
        <div data-menu-pop="${c.id}" style="display:none;position:absolute;right:8px;top:26px;z-index:30;width:180px;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);border-radius:4px;padding:4px;flex-direction:column">${actBtns(c)}</div>
      </td>
    </tr>`;}).join('') + (cs.length>shown
      ? `<tr><td colspan="12" style="padding:0"><button id="reg-more" style="width:100%;padding:11px;font-size:12.5px;font-weight:600;color:var(--color-accent-700);background:none;border:0;border-top:1px solid var(--color-divider);cursor:pointer">Show ${Math.min(REG_PAGE,cs.length-shown)} more · ${cs.length-shown} remaining</button></td></tr>`
      : '');
}
function regSelCount(){ const R=regState(); return Object.keys(R.sel).filter(k=>R.sel[k]).length; }
function regAggregate(cs){ return cs.filter(c=>c.status!=='Declined'&&isMonetary(c)).reduce((s,c)=>s+Number(c.value||0),0); }
function renderRegisterBody(){
  const cs=regFiltered();
  const tb=document.getElementById('reg-tbody'); if(tb){ tb.innerHTML=regRowsHtml(cs); wireRegRows(); }
  const cnt=document.getElementById('reg-count'); if(cnt) cnt.textContent=cs.length.toLocaleString('en-KE');
  const aggr=document.getElementById('reg-aggr'); if(aggr) aggr.textContent=fmtKESshort(regAggregate(cs));
  renderRegSelBar();
}
function renderRegSelBar(){
  const bar=document.getElementById('reg-selbar'); if(!bar) return; const n=regSelCount();
  bar.classList.toggle('hidden',n===0);
  const lbl=document.getElementById('reg-sel-count'); if(lbl) lbl.textContent=n+' selected';
}
function regCloseMenus(){ document.querySelectorAll('#reg-tbody [data-menu-pop]').forEach(m=>m.style.display='none'); }
function wireRegRows(){
  // whole-row click selects the contract into the Summary panel (does not navigate)
  document.querySelectorAll('#reg-tbody [data-row]').forEach(el=>el.addEventListener('click',()=>selectContract(el.getAttribute('data-row'))));
  document.querySelectorAll('#reg-tbody [data-sel]').forEach(el=>el.addEventListener('change',e=>{ const R=regState(); const id=el.getAttribute('data-sel'); if(el.checked) R.sel[id]=true; else delete R.sel[id]; renderRegSelBar(); }));
  // ⋯ popover: toggle one open at a time
  document.querySelectorAll('#reg-tbody [data-menu]').forEach(btn=>btn.addEventListener('click',e=>{ e.stopPropagation(); const id=btn.getAttribute('data-menu'); const pop=document.querySelector('#reg-tbody [data-menu-pop="'+id+'"]'); const open=pop&&pop.style.display==='flex'; regCloseMenus(); if(pop&&!open) pop.style.display='flex'; }));
  document.querySelectorAll('#reg-tbody [data-act]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); regCloseMenus();
    const id=b.getAttribute('data-id'), act=b.getAttribute('data-act'), c=getContract(id); if(!c) return;
    if(act==='open') openWorkspace(id);
    else if(act==='share') openShareModal(c);
    else if(act==='scan') runScan(c);
    else if(act==='delete') deleteContract(id).then(ok=>{ if(ok) renderRegister(); });
    else openWorkspace(id); // Export PDF / Decline & close are completed inside the workspace
  }));
  document.getElementById('reg-more')?.addEventListener('click',()=>{ regState().shown=(regState().shown||REG_PAGE)+REG_PAGE; renderRegisterBody(); });
  // empty-state actions
  document.getElementById('reg-empty-clear')?.addEventListener('click',()=>{ const R=regState(); R.query=''; R.stage='all'; R.type='all'; R.view=null; R.renewal='all'; R.shown=REG_PAGE; const cs=document.getElementById('cmd-search'); if(cs) cs.value=''; renderRegister(); });
  document.getElementById('reg-empty-new')?.addEventListener('click',()=>{ const nb=document.getElementById('cmd-new'), nm=document.getElementById('new-menu'); if(nm){ if(window.renderNewMenu) renderNewMenu(); nm.classList.remove('hidden'); } else if(nb){ nb.click(); } });
}
function regExportSelectedCsv(){
  const R=regState(); const ids=Object.keys(R.sel).filter(k=>R.sel[k]);
  const rows=state.contracts.filter(c=>ids.includes(c.id));
  if(!rows.length){ toast('Nothing selected','err'); return; }
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const head=['ID','Name','Counterparty','Type','Folder','Value (KES)','Status','Last action','Expiry'];
  const body=rows.map(c=>[c.id,c.name,c.counterparty||'',cKind(c),FOLDERS[c.folder]?.name||'',isMonetary(c)?(c.value||0):'',statusLabel(c.status),c.lastAction||'',c.expiry||''].map(esc).join(','));
  const csv=[head.map(esc).join(','),...body].join('\n');
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='hati-register-selection.csv'; a.click(); URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} contract${rows.length===1?'':'s'} to CSV`);
}
function renderRegister(){
  const R=regState(); R.shown=REG_PAGE;
  const cs=regFiltered();
  const countAll=(state.serverStats&&state.serverStats.total!=null)?state.serverStats.total:state.contracts.length;
  // Industry filter pill: accent fill when active, hairline box + accent-border hover when not.
  const pill=(active)=>`display:inline-flex;align-items:center;border:1px solid ${active?'var(--color-accent)':'var(--color-divider)'};background:${active?'var(--color-accent)':'var(--color-surface)'};color:${active?'#fff':'var(--color-neutral-700)'};font-size:11.5px;font-weight:500;padding:5px 13px;border-radius:999px;cursor:pointer`;
  const selStyle='font:inherit;font-size:12px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:4px 6px;color:inherit;cursor:pointer';
  const stagePills=REG_STAGES.map(s=>`<button class="reg-pill" data-reg-stage="${s.k}" style="${pill(R.stage===s.k)}">${s.label}</button>`).join('');
  const typePills=regTypes().map(t=>`<button class="reg-pill" data-reg-type="${t.k}" data-active="${R.type===t.k?'1':'0'}" style="${pill(R.type===t.k)}">${t.label}</button>`).join('');
  const sortOpts=REG_SORTS.map(s=>`<option value="${s.k}" ${R.sort===s.k?'selected':''}>${s.label}</option>`).join('');
  const viewPills=REG_VIEWS.map(v=>`<button class="reg-pill" data-reg-view="${v.k}" style="${pill(R.view===v.k)}">${v.label}</button>`).join('');
  const renewalSel=`<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--color-neutral-700)">Renewal
    <select id="reg-renewal" style="${selStyle}">${[['all','Any'],['auto-renew','Auto-renew'],['fixed','Fixed'],['evergreen','Evergreen']].map(([k,l])=>`<option value="${k}" ${(R.renewal||'all')===k?'selected':''}>${l}</option>`).join('')}</select></label>`;
  // Server-mode full-text search + semantic ask live in a secondary strip (the
  // command bar owns the primary search); kept here so FTS wiring stays intact.
  const ftsBlock=API_MODE()?`
    <div style="position:relative;flex:1;min-width:200px;max-width:340px">
      <span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--color-neutral-500);display:inline-flex">${icon('search','w-3.5 h-3.5')}</span>
      <input id="reg-search" value="${R.query.replace(/"/g,'&quot;')}" placeholder="Full-text: names, parties &amp; clauses…" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:6px 9px 6px 30px;font:inherit;font-size:12px;outline:none;color:inherit">
      <div id="reg-fts" class="hidden" style="position:absolute;z-index:40;margin-top:4px;width:100%;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);border-radius:4px;max-height:320px;overflow-y:auto"></div>
    </div>
    <button id="reg-ask" style="display:inline-flex;align-items:center;gap:6px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:6px 10px;font:inherit;font-size:12px;font-weight:600;color:var(--color-accent-700);cursor:pointer">${icon('sparkle','w-3.5 h-3.5')} Ask your portfolio</button>`:'';

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:14px 16px 28px">
    <style>
      .reg-table{width:100%;border-collapse:collapse;font-size:12.5px}
      .reg-table th{text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:color-mix(in srgb,var(--color-text) 60%,transparent);padding:6.8px;border-bottom:1px solid var(--color-divider);white-space:nowrap;background:#fafbfc}
      .reg-table td{padding:6.8px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 8%,transparent);vertical-align:middle}
      .reg-table tbody tr:hover{background:color-mix(in srgb,var(--color-text) 4%,transparent)}
      .reg-pill:hover{border-color:var(--color-accent)}
    </style>
    <div style="display:flex;flex-direction:column;gap:10px">
      <!-- filter row 1: stage pills · Sort -->
      <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
        ${stagePills}
        <span style="flex:1;min-width:8px"></span>
        <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--color-neutral-700);flex:none">Sort
          <select id="reg-sort" style="${selStyle}">${sortOpts}</select>
        </label>
      </div>
      <!-- filter row 2: stream pills on their own full-width line, overflow → More ▾ -->
      <div id="reg-streambar" style="display:flex;gap:6px;align-items:center;min-width:0;position:relative">
        <div id="reg-streams" style="display:flex;gap:6px;align-items:center;flex-wrap:nowrap;overflow:hidden;min-width:0;flex:1">${typePills}</div>
        <div id="reg-more-wrap" style="position:relative;flex:none;display:none">
          <button id="reg-more" type="button" class="reg-pill" style="${pill(false)}">More ▾</button>
          <div id="reg-more-menu" class="hidden" style="position:absolute;top:calc(100% + 4px);right:0;z-index:40;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);border-radius:6px;padding:6px;min-width:180px;max-height:300px;overflow:auto"></div>
        </div>
      </div>
      <!-- secondary controls: saved views · renewal · full-text (server mode) -->
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px">
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px">
          <span style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500);margin-right:2px">Saved views</span>
          ${viewPills}
          ${R.view?`<button data-reg-view="" style="font-size:11px;font-weight:600;color:var(--color-accent-700);background:none;border:0;cursor:pointer;margin-left:2px">clear</button>`:''}
        </div>
        <span style="flex:1;min-width:8px"></span>
        ${renewalSel}
        ${ftsBlock}
      </div>
      <!-- legend: explains the coloured row edge-stripe (value stream) -->
      <div style="padding-top:2px;border-top:1px solid var(--color-divider)">${folderLegendHtml({style:'padding-top:8px'})}</div>

      <div id="reg-selbar" class="flex hidden items-center justify-between" style="gap:12px;border:1px solid var(--color-accent-800);background:var(--color-accent-800);color:#fff;border-radius:4px;padding:8px 12px">
        <span id="reg-sel-count" style="font-size:12px;font-weight:600">0 selected</span>
        <div style="display:flex;align-items:center;gap:8px">
          <button id="reg-export" style="display:inline-flex;align-items:center;gap:6px;border:0;background:rgba(255,255,255,.16);color:#fff;border-radius:4px;padding:5px 10px;font:inherit;font-size:11.5px;font-weight:600;cursor:pointer">${icon('download','w-3.5 h-3.5')} Export CSV</button>
          <button id="reg-clear" style="border:0;background:none;color:rgba(255,255,255,.72);padding:5px 8px;font:inherit;font-size:11.5px;font-weight:600;cursor:pointer">Clear</button>
        </div>
      </div>

      <section class="blueprint bp-round" style="background:var(--color-surface);box-shadow:var(--shadow-sm)">
        
        <div style="overflow-x:auto">
          <table class="reg-table">
            <thead>
              <tr>
                <th style="width:26px;padding-left:12px"><input id="reg-selall" type="checkbox" style="accent-color:var(--color-accent)"></th>
                <th>ID</th>
                <th>Contract</th>
                <th>Stream</th>
                <th>Owner</th>
                <th style="text-align:right">Value</th>
                <th>Risk</th>
                <th>Renewal</th>
                <th>Stage</th>
                <th>Approval</th>
                <th style="text-align:right;padding-right:12px">Updated</th>
                <th style="width:30px"></th>
              </tr>
            </thead>
            <tbody id="reg-tbody" class="stagger">${regRowsHtml(cs)}</tbody>
          </table>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:8px 12px;border-top:1px solid var(--color-divider);font-size:11px;color:var(--color-neutral-600)">
          <span>Showing <b id="reg-count" style="color:var(--color-text)">${cs.length.toLocaleString('en-KE')}</b> of ${Number(countAll).toLocaleString('en-KE')} contracts · working set aggregate <b id="reg-aggr" style="color:var(--color-text)">${fmtKESshort(regAggregate(cs))}</b></span>
          <span>CSV export includes filters · server-side pagination active</span>
        </div>
      </section>
    </div>
  </div>`;

  wireRegRows();
  renderRegSelBar();
  const si=document.getElementById('reg-search');
  if(si){
    si.addEventListener('input',()=>{ R.query=si.value; R.shown=REG_PAGE; renderRegisterBody(); if(API_MODE()) ftsSearch(si.value); });
    document.getElementById('reg-ask')?.addEventListener('click',()=>openPortfolioAsk());
  }
  // outside click closes the FTS dropdown and any open row ⋯ menu
  document.addEventListener('click',e=>{ const box=document.getElementById('reg-fts'); if(box&&!box.contains(e.target)&&e.target!==si) box.classList.add('hidden'); if(!e.target.closest('[data-menu-pop]')&&!e.target.closest('[data-menu]')) regCloseMenus(); const mm=document.getElementById('reg-more-menu'); if(mm&&!mm.classList.contains('hidden')&&!e.target.closest('#reg-more-wrap')) mm.classList.add('hidden'); });
  document.getElementById('reg-more')?.addEventListener('click',e=>{ e.stopPropagation(); document.getElementById('reg-more-menu')?.classList.toggle('hidden'); });
  document.getElementById('reg-sort')?.addEventListener('change',e=>{ R.sort=e.target.value; R.shown=REG_PAGE; renderRegisterBody(); });
  document.getElementById('reg-renewal')?.addEventListener('change',e=>{ R.renewal=e.target.value; R.shown=REG_PAGE; renderRegisterBody(); });
  document.querySelectorAll('[data-reg-stage]').forEach(el=>el.addEventListener('click',()=>{ R.stage=el.getAttribute('data-reg-stage'); R.shown=REG_PAGE; renderRegister(); }));
  document.querySelectorAll('[data-reg-type]').forEach(el=>el.addEventListener('click',()=>{ R.type=el.getAttribute('data-reg-type'); R.shown=REG_PAGE; renderRegister(); }));
  document.querySelectorAll('[data-reg-view]').forEach(el=>el.addEventListener('click',()=>{ R.view=el.getAttribute('data-reg-view')||null; R.shown=REG_PAGE; renderRegister(); }));
  document.getElementById('reg-selall')?.addEventListener('change',e=>{ const on=e.target.checked; regFiltered().slice(0,Math.min(regFiltered().length,R.shown||REG_PAGE)).forEach(c=>{ if(on) R.sel[c.id]=true; else delete R.sel[c.id]; }); renderRegisterBody(); });
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
      if(!r.hits||!r.hits.length){ box.innerHTML=`<div style="padding:10px 12px;font-size:12px;color:var(--color-neutral-600)">No full-text matches.</div>`; box.classList.remove('hidden'); return; }
      box.innerHTML=r.hits.map(h=>`<button data-fts-open="${h.id}" style="display:block;width:100%;text-align:left;padding:8px 12px;border:0;border-bottom:1px solid var(--color-divider);background:none;cursor:pointer;font:inherit">
        <div style="font-size:12.5px;font-weight:600;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${(h.name||h.id).replace(/</g,'&lt;')} <span style="font-family:var(--font-mono);font-size:10px;color:var(--color-neutral-500)">${h.id}</span></div>
        ${h.snippet?`<div style="font-size:11px;color:var(--color-neutral-600);margin-top:2px">${h.snippet.replace(/</g,'&lt;').replace(/\[/g,'<mark style="background:#f1e6cd;border-radius:2px;padding:0 2px">').replace(/\]/g,'</mark>')}</div>`:(h.counterparty?`<div style="font-size:11px;color:var(--color-neutral-500)">${h.counterparty}</div>`:'')}
      </button>`).join('');
      box.classList.remove('hidden');
      box.querySelectorAll('[data-fts-open]').forEach(b=>b.addEventListener('click',()=>{ box.classList.add('hidden'); openWorkspace(b.getAttribute('data-fts-open')); }));
    }catch(e){ box.classList.add('hidden'); }
  },220);
}
/* ---- E6-T2 semantic "Ask your portfolio" ---- */
async function openPortfolioAsk(){
  openModal(`<div class="p-6">
    <div class="flex items-center gap-2 mb-1"><span class="text-gold-500">${icon('sparkle','w-4 h-4')}</span>
      <h3 class="font-serif font-600 text-lg text-ink">Ask your portfolio</h3></div>
    <p class="text-xs text-ink/60 mb-3">Ask a question in plain language, e.g. “which contracts let the counterparty terminate without cause?” — answered with quoted evidence from the contract text.</p>
    <div class="flex gap-2 mb-3"><input id="pa-q" placeholder="Ask a question…" class="flex-1 rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"/>
      <button id="pa-go" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">Ask</button></div>
    <div id="pa-out" class="text-[12px] text-ink/55"></div></div>`);
  const run=async()=>{
    const q=document.getElementById('pa-q').value.trim(); if(!q) return;
    const out=document.getElementById('pa-out'); out.innerHTML='<span class="text-brand-600">Searching…</span>';
    try{
      // gather candidate contracts by FTS, then load their text for the AI
      const fts=await api('search?q='+encodeURIComponent(q.split(/\s+/).slice(0,6).join(' '))+'&limit=20');
      const ids=(fts.hits||[]).map(h=>h.id).slice(0,15);
      const cands=[];
      for(const id of ids){ const c=getContract(id); if(!c) continue; try{ await ensureFull(c); }catch(e){}
        cands.push({ id:c.id, name:c.name, counterparty:c.counterparty||'', text:(window.docPlainText?docPlainText(c):'')||(c.upload&&c.upload.extractedText)||'' }); }
      if(!cands.length){ out.innerHTML='<span class="text-ink/55">No candidate contracts matched — try different keywords.</span>'; return; }
      const r=await api('ai/search','POST',{ question:q, candidates:cands });
      out.innerHTML=`<div class="rounded-lg bg-canvas border border-line px-3 py-2.5 text-[12.5px] text-ink/85 mb-2">${(r.answer||'').replace(/</g,'&lt;')}</div>`+
        (r.matches||[]).map(m=>{ const c=getContract(m.id); if(!c) return ''; return `<button data-pa-open="${m.id}" class="w-full text-left rounded-lg border border-line bg-white hover:border-brand-300 px-3 py-2 mb-1.5 transition">
          <div class="text-[12px] font-600 text-ink">${c.name.replace(/</g,'&lt;')} <span class="font-mono text-[10px] text-ink/45">${c.id}</span></div>
          ${m.evidence?`<div class="text-[11px] text-ink/55 italic mt-0.5">“${m.evidence.replace(/</g,'&lt;')}”</div>`:''}</button>`; }).join('');
      out.querySelectorAll('[data-pa-open]').forEach(b=>b.addEventListener('click',()=>{ closeModal(); openWorkspace(b.getAttribute('data-pa-open')); }));
    }catch(e){ out.innerHTML=`<span class="text-rose-600">${/key|configure|401/.test(e.message)?'The AI engine needs a key for semantic search.':'Search failed: '+e.message}</span>`; }
  };
  document.getElementById('pa-go').addEventListener('click',run);
  document.getElementById('pa-q').addEventListener('keydown',e=>{ if(e.key==='Enter') run(); });
}

Object.assign(window,{REG_PAGE,REG_SORTS,REG_STAGES,regTypes,REG_VIEWS,REG_ROW_ACTIONS,ftsSearch,openPortfolioAsk,regAggregate,regCloseMenus,regExportSelectedCsv,regFiltered,regOwnerInitials,regRowsHtml,regSelCount,regState,renderRegSelBar,renderRegister,renderRegisterBody,wireRegRows,layoutStreamPills});
