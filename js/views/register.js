// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   VIEW: FOLDER (filtered register + local search)
   ============================================================ */
function renderFolder(){
  const f=FOLDERS[state.folderId];
  if(!f){ setView('dashboard'); return; }
  const q=state.folderQuery.trim().toLowerCase();
  let cs=folderContracts(f.id);
  if(q) cs=cs.filter(c=>(c.name+' '+c.counterparty+' '+c.id).toLowerCase().includes(q));
  const val=cs.filter(c=>c.status!=='Declined').reduce((s,c)=>s+Number(c.value||0),0);

  document.getElementById('content').innerHTML=`
  <div class="view-enter">
    <header class="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-hair">
      <div class="px-8 py-4 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <button id="back-dash" class="h-9 w-9 grid place-items-center rounded-lg border border-brand-100 bg-white text-brand-700 hover:bg-brand-50 transition shrink-0">${icon('arrowLeft')}</button>
          <span class="h-9 w-9 grid place-items-center rounded-lg bg-brand-900 text-gold-400 shrink-0">${icon(f.ic)}</span>
          <div class="min-w-0">
            <h1 class="font-display font-700 text-lg tracking-tight text-brand-900 truncate">${f.name}</h1>
            <p class="text-[11px] font-mono text-brand-800/65">${cs.length} contracts · ${fmtKESshort(val)} active value</p>
          </div>
        </div>
        <div class="flex items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 py-2 w-72 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition">
          ${icon('search','w-4 h-4 text-brand-800/60')}
          <input id="folder-search" value="${state.folderQuery.replace(/"/g,'&quot;')}" type="text" placeholder="Search in this folder…" class="flex-1 text-sm outline-none bg-transparent"/>
        </div>
      </div>
    </header>

    <div class="px-8 py-6 max-w-[1000px]">
      <section class="bg-white rounded-2xl elev-2 overflow-hidden">${folderListHtml(cs)}</section>
    </div>
  </div>`;

  wireOpens();
  document.getElementById('back-dash').addEventListener('click',()=>setView('dashboard'));
  const si=document.getElementById('folder-search');
  si.addEventListener('input',()=>{ state.folderQuery=si.value; state.folderShown=FOLDER_PAGE; renderFolderListOnly(); });
  si.focus(); si.setSelectionRange(si.value.length,si.value.length);
  wireFolderMore();
  setActiveNav('folder');
}
const FOLDER_PAGE=50;
// Render only up to state.folderShown rows, with a "Show more" pager — so a
// folder with hundreds of contracts never dumps them all into the DOM at once.
function folderListHtml(cs){
  if(!cs.length) return `
    <div class="px-5 py-10 text-center">
      <div class="mx-auto h-12 w-12 grid place-items-center rounded-xl bg-canvas border border-brand-100 text-brand-300 mb-3">${icon('search','w-5 h-5')}</div>
      <div class="text-sm font-medium text-brand-900">No contracts match "${state.folderQuery}"</div>
      <div class="text-xs text-brand-800/70 mt-1">Clear the search, or ask HaTi AI to look across all folders.</div>
    </div>`;
  const shown=Math.min(cs.length, state.folderShown||FOLDER_PAGE);
  const rows=cs.slice(0,shown).map(c=>contractRow(c)).join('');
  const more = cs.length>shown
    ? `<button id="folder-more" class="w-full px-5 py-3 text-xs font-medium text-brand-600 hover:bg-brand-50 border-t border-brand-100/60 transition">Show more — ${cs.length-shown} of ${cs.length} remaining</button>`
    : '';
  return rows+more;
}
function wireFolderMore(){
  document.getElementById('folder-more')?.addEventListener('click',()=>{ state.folderShown=(state.folderShown||FOLDER_PAGE)+FOLDER_PAGE; renderFolderListOnly(); });
}
// re-render only list body on keystroke (keeps input focus)
function renderFolderListOnly(){
  const f=FOLDERS[state.folderId]; if(!f) return;
  const q=state.folderQuery.trim().toLowerCase();
  let cs=folderContracts(f.id);
  if(q) cs=cs.filter(c=>(c.name+' '+c.counterparty+' '+c.id).toLowerCase().includes(q));
  const section=document.querySelector('#content section');
  if(!section) return;
  section.innerHTML = folderListHtml(cs);
  wireOpens(section); wireFolderMore();
}

Object.assign(window,{FOLDER_PAGE,folderListHtml,renderFolder,renderFolderListOnly,wireFolderMore});
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
const REG_TYPES=[
  {k:'all',label:'All types'},
  {k:'proc',label:'Procurement'},
  {k:'mfg',label:'Manufacturing'},
  {k:'dist',label:'Distribution'},
  {k:'sales',label:'Sales'},
  {k:'mktg',label:'Marketing'},
  {k:'corp',label:'Corporate'},
];
const REG_SORTS=[
  {k:'updated',label:'Recently updated'},
  {k:'value',label:'Value (high → low)'},
  {k:'expiry',label:'Expiring soonest'},
  {k:'name',label:'Name (A → Z)'},
];
const REG_VIEWS=[
  {k:'expiring90', label:'Expiring ≤ 90 days'},
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
  else if(R.view==='autosoon') cs=cs.filter(c=>{ const dd=renewalDecisionDate(c); return (c.metadata&&c.metadata.renewalType==='auto-renew')&&dd&&daysUntil(dd)>=0&&daysUntil(dd)<=60; });
  else if(R.view==='overdueob') cs=cs.filter(c=>(c.obligations||[]).some(o=>obState(o)==='overdue'));
  const q=R.query.trim().toLowerCase();
  if(q) cs=cs.filter(c=>(c.name+' '+(c.counterparty||'')+' '+c.id).toLowerCase().includes(q));
  const upd=c=>{ const t=Date.parse(c.lastAction); return isNaN(t)?0:t; };
  if(R.sort==='updated') cs.sort((a,b)=>upd(b)-upd(a));
  else if(R.sort==='value') cs.sort((a,b)=>Number(b.value||0)-Number(a.value||0));
  else if(R.sort==='name') cs.sort((a,b)=>a.name.localeCompare(b.name));
  else if(R.sort==='expiry') cs.sort((a,b)=>{ const da=a.expiry?daysUntil(a.expiry):1e9, db=b.expiry?daysUntil(b.expiry):1e9; return da-db; });
  return cs;
}
function regOwnerInitials(){ const u=currentUser(); const n=(u&&u.name)||FIRST_PARTY||'HaTi'; return n.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
function regRowsHtml(cs){
  const R=regState();
  if(!cs.length) return `<tr><td colspan="7" class="px-4 py-12 text-center text-sm text-brand-800/70">No contracts match the current filters.</td></tr>`;
  const shown=Math.min(cs.length, R.shown||REG_PAGE);
  const ini=regOwnerInitials();
  return cs.slice(0,shown).map((c,i)=>`
    <tr data-open="${c.id}" class="group hover:bg-brand-50/50 transition cursor-pointer" style="box-shadow:inset 0 -1px 0 rgba(60,40,10,.05);animation-delay:${Math.min(i,14)*22}ms">
      <td class="pl-5 pr-1 py-3.5 w-8 align-middle" onclick="event.stopPropagation()"><input type="checkbox" data-sel="${c.id}" ${R.sel[c.id]?'checked':''} class="h-4 w-4 rounded border-brand-200 accent-brand-700 align-middle"/></td>
      <td class="px-2 py-3.5">
        <div class="min-w-0"><span class="block text-[14.5px] font-600 text-ink truncate group-hover:text-brand-600 transition">${c.name}</span><span class="block text-[11px] text-ink/65 truncate mt-0.5"><span class="font-mono">${c.id}</span> · ${c.counterparty||'—'}</span></div>
      </td>
      <td class="px-2 py-3.5 hidden md:table-cell"><span class="inline-flex items-center gap-1.5 text-[13px] text-ink/70">${icon(cIcon(c),'w-4 h-4 text-brand-500')}${cKind(c)}</span>${c.metadata&&c.metadata.renewalType&&c.metadata.renewalType!=='unknown'?`<span class="ml-1.5 inline-block text-[9px] font-mono uppercase tracking-wide rounded px-1 py-0.5 ${c.metadata.renewalType==='auto-renew'?'bg-gold-500/15 text-amber':'bg-brand-50 text-brand-600'}">${(RENEWAL_LABEL[c.metadata.renewalType]||'').replace(' term','')}</span>`:''}</span></td>
      <td class="px-2 py-3.5 hidden lg:table-cell"><span class="h-6 w-6 grid place-items-center rounded-full bg-brand-100 text-[9px] font-semibold text-brand-700 font-mono" title="${(currentUser()&&currentUser().name)||FIRST_PARTY}">${ini}</span></td>
      <td class="px-2 py-3.5 text-right whitespace-nowrap text-[13px] font-600 tnum ${isMonetary(c)?'text-ink':'text-ink/40'}">${!isMonetary(c)?'n/m':(c.value?fmtKESshort(c.value):'—')}</td>
      <td class="px-2 py-3.5 hidden sm:table-cell whitespace-nowrap text-[12px] tnum text-ink/65">${c.lastAction||'—'}</td>
      <td class="px-2 pr-5 py-3.5 text-right">${statusChip(c.status)}</td>
    </tr>`).join('') + (cs.length>shown
      ? `<tr><td colspan="7"><button id="reg-more" class="w-full px-4 py-3.5 text-[13px] font-600 text-brand-600 hover:bg-brand-50 transition" style="box-shadow:inset 0 1px 0 rgba(60,40,10,.06)">Show ${Math.min(REG_PAGE,cs.length-shown)} more · ${cs.length-shown} remaining</button></td></tr>`
      : '');
}
function regSelCount(){ const R=regState(); return Object.keys(R.sel).filter(k=>R.sel[k]).length; }
function renderRegisterBody(){
  const cs=regFiltered();
  const tb=document.getElementById('reg-tbody'); if(tb){ tb.innerHTML=regRowsHtml(cs); wireRegRows(); }
  const cnt=document.getElementById('reg-count'); if(cnt) cnt.textContent=cs.length.toLocaleString('en-KE');
  renderRegSelBar();
}
function renderRegSelBar(){
  const bar=document.getElementById('reg-selbar'); if(!bar) return; const n=regSelCount();
  bar.classList.toggle('hidden',n===0);
  const lbl=document.getElementById('reg-sel-count'); if(lbl) lbl.textContent=n+' selected';
}
function wireRegRows(){
  document.querySelectorAll('#reg-tbody [data-open]').forEach(el=>el.addEventListener('click',()=>openWorkspace(el.getAttribute('data-open'))));
  document.querySelectorAll('#reg-tbody [data-sel]').forEach(el=>el.addEventListener('change',e=>{ const R=regState(); const id=el.getAttribute('data-sel'); if(el.checked) R.sel[id]=true; else delete R.sel[id]; renderRegSelBar(); }));
  document.getElementById('reg-more')?.addEventListener('click',()=>{ regState().shown=(regState().shown||REG_PAGE)+REG_PAGE; renderRegisterBody(); });
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
  const chip=(active)=>active
    ? 'inline-flex items-center rounded-full bg-brand-900 text-white border border-brand-900 px-3 py-1.5 text-xs font-medium transition'
    : 'inline-flex items-center rounded-full bg-white text-brand-800/70 border border-brand-100 px-3 py-1.5 text-xs font-medium hover:border-brand-300 transition';
  const stageChips=REG_STAGES.map(s=>`<button data-reg-stage="${s.k}" class="${chip(R.stage===s.k)}">${s.label}</button>`).join('');
  const typeChips=REG_TYPES.map(t=>`<button data-reg-type="${t.k}" class="${chip(R.type===t.k)}">${t.label}</button>`).join('');
  const sortOpts=REG_SORTS.map(s=>`<option value="${s.k}" ${R.sort===s.k?'selected':''}>${s.label}</option>`).join('');

  document.getElementById('content').innerHTML=`
  <div class="view-enter h-full flex flex-col">
    <header class="shrink-0 sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-hair">
      <div class="px-8 py-4 flex items-center justify-between gap-4 max-w-[1240px] mx-auto w-full">
        <div>
          <h1 class="font-display font-700 text-[26px] tracking-tight text-ink">Contract Register</h1>
          <p class="text-[13px] text-ink/70 mt-0.5"><span id="reg-count" class="tnum font-600 text-ink/70">${cs.length.toLocaleString('en-KE')}</span> of <span class="tnum">${Number(countAll).toLocaleString('en-KE')}</span> contracts · filter, sort and act in bulk</p>
        </div>
        <button id="reg-ai" class="hidden md:flex items-center gap-2 rounded-xl bg-white elev-1 px-3.5 py-2.5 text-sm text-ink/70 w-64 hover:elev-2 lift text-left">
          ${icon('sparkle','w-4 h-4 text-gold-500')}<span class="flex-1 truncate">Ask AI about the register…</span>
        </button>
      </div>
    </header>

    <div class="flex-1 min-h-0 flex flex-col gap-4 px-8 pt-5 pb-7 max-w-[1240px] mx-auto w-full">
      <div class="shrink-0 flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative flex-1 min-w-[220px] max-w-md">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-300">${icon('search','w-4 h-4')}</span>
            <input id="reg-search" value="${R.query.replace(/"/g,'&quot;')}" placeholder="Filter by name, party or ID…" class="w-full rounded-xl bg-white elev-1 pl-10 pr-3 py-2.5 text-sm outline-none focus:elev-2 transition"/>
          </div>
          <div class="flex flex-wrap items-center gap-2">${stageChips}</div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-[11px] font-600 text-ink/50 uppercase tracking-wide mr-1">Saved views</span>
          ${REG_VIEWS.map(v=>`<button data-reg-view="${v.k}" class="${chip(R.view===v.k)}">${v.label}</button>`).join('')}
          ${R.view?`<button data-reg-view="" class="text-[11px] font-600 text-brand-600 hover:text-brand-800 ml-1">clear</button>`:''}
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">${typeChips}</div>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 text-[13px] text-ink/70">Renewal
              <select id="reg-renewal" class="rounded-xl bg-white elev-1 px-3 py-2 text-[13px] text-ink outline-none">
                ${[['all','Any'],['auto-renew','Auto-renew'],['fixed','Fixed'],['evergreen','Evergreen']].map(([k,l])=>`<option value="${k}" ${(R.renewal||'all')===k?'selected':''}>${l}</option>`).join('')}
              </select>
            </label>
            <label class="flex items-center gap-2 text-[13px] text-ink/70">Sort
              <select id="reg-sort" class="rounded-xl bg-white elev-1 px-3 py-2 text-[13px] text-ink outline-none">${sortOpts}</select>
            </label>
          </div>
        </div>
      </div>

      <div id="reg-selbar" class="shrink-0 hidden items-center justify-between gap-3 rounded-xl bg-ink text-white px-4 py-2.5 elev-2">
        <span id="reg-sel-count" class="text-[13px] font-600">0 selected</span>
        <div class="flex items-center gap-2">
          <button id="reg-export" class="inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 text-xs font-600 transition">${icon('download','w-3.5 h-3.5')} Export CSV</button>
          <button id="reg-clear" class="rounded-lg text-white/70 hover:text-white px-2 py-1.5 text-xs font-600 transition">Clear</button>
        </div>
      </div>

      <div class="flex-1 min-h-0 bg-white rounded-2xl elev-2 overflow-hidden flex flex-col">
        <div class="flex-1 min-h-0 overflow-auto scroll-thin">
          <table class="w-full text-left">
            <thead class="sticky top-0 z-10">
              <tr class="bg-brand-50 text-[10px] uppercase tracking-wider text-ink/65" style="box-shadow:inset 0 -1px 0 var(--sh1,rgba(60,40,10,.06)),0 1px 0 rgba(60,40,10,.05)">
                <th class="pl-5 pr-1 py-3 w-8"><input id="reg-selall" type="checkbox" class="h-4 w-4 rounded border-brand-200 accent-brand-700 align-middle"/></th>
                <th class="px-2 py-3 font-700">Contract</th>
                <th class="px-2 py-3 font-700 hidden md:table-cell">Type</th>
                <th class="px-2 py-3 font-700 hidden lg:table-cell">Owner</th>
                <th class="px-2 py-3 font-700 text-right">Value</th>
                <th class="px-2 py-3 font-700 hidden sm:table-cell">Updated</th>
                <th class="px-2 pr-5 py-3 font-700 text-right">Stage</th>
              </tr>
            </thead>
            <tbody id="reg-tbody" class="stagger">${regRowsHtml(cs)}</tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`;

  wireRegRows();
  renderRegSelBar();
  const si=document.getElementById('reg-search');
  si.addEventListener('input',()=>{ R.query=si.value; R.shown=REG_PAGE; renderRegisterBody(); });
  document.getElementById('reg-sort').addEventListener('change',e=>{ R.sort=e.target.value; R.shown=REG_PAGE; renderRegisterBody(); });
  document.getElementById('reg-renewal').addEventListener('change',e=>{ R.renewal=e.target.value; R.shown=REG_PAGE; renderRegisterBody(); });
  document.querySelectorAll('[data-reg-stage]').forEach(el=>el.addEventListener('click',()=>{ R.stage=el.getAttribute('data-reg-stage'); R.shown=REG_PAGE; renderRegister(); }));
  document.querySelectorAll('[data-reg-type]').forEach(el=>el.addEventListener('click',()=>{ R.type=el.getAttribute('data-reg-type'); R.shown=REG_PAGE; renderRegister(); }));
  document.querySelectorAll('[data-reg-view]').forEach(el=>el.addEventListener('click',()=>{ R.view=el.getAttribute('data-reg-view')||null; R.shown=REG_PAGE; renderRegister(); }));
  document.getElementById('reg-selall').addEventListener('change',e=>{ const on=e.target.checked; regFiltered().slice(0,Math.min(regFiltered().length,R.shown||REG_PAGE)).forEach(c=>{ if(on) R.sel[c.id]=true; else delete R.sel[c.id]; }); renderRegisterBody(); });
  document.getElementById('reg-export').addEventListener('click',regExportSelectedCsv);
  document.getElementById('reg-clear').addEventListener('click',()=>{ R.sel={}; renderRegisterBody(); });
  document.getElementById('reg-ai').addEventListener('click',()=>openAI());
  setActiveNav('register');
}

Object.assign(window,{REG_PAGE,REG_SORTS,REG_STAGES,REG_TYPES,regExportSelectedCsv,regFiltered,regOwnerInitials,regRowsHtml,regSelCount,regState,renderRegSelBar,renderRegister,renderRegisterBody,wireRegRows});
