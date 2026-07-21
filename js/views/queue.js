// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   VIEW: PIPELINE (Kanban board — drag between lifecycle stages)
   Safe drag rules: Draft <-> Under Review move freely; dragging onto
   Executed opens the workspace to verify & sign (never force-signs);
   dragging onto Closed asks to confirm the decline. Executed cards are
   locked. Viewers cannot drag. Every move persists through the normal
   path (audit + optimistic-locked server save).
   ============================================================ */
const PIPE_COLS=[
  {k:'Draft',        label:'Drafting',  color:'#9A9484'},
  {k:'Under Review', label:'In Review', color:'#C79A3E'},
  {k:'Signed',       label:'Executed',  color:'#086B54'},
  {k:'Declined',     label:'Closed',    color:'#B23A2E'},
];
const PIPE_CAP=60;
window.pipeDrag=null;
function pipeCard(c){
  const drag = canEdit() && c.status!=='Signed';
  return `
    <div data-card="${c.id}" ${drag?'draggable="true"':''} class="group bg-white rounded-xl elev-1 lift p-3.5 mb-3 ${drag?'cursor-grab active:cursor-grabbing':'cursor-pointer'}">
      <div class="flex items-center justify-between gap-2 mb-1.5">
        <span class="inline-flex items-center gap-1.5 text-[10px] font-mono text-brand-800/65">
          <span class="h-5 w-5 grid place-items-center rounded-md border ${isUpload(c)?'bg-gold-500/10 text-gold-600 border-gold-500/25':'bg-brand-50 text-brand-500 border-brand-100'}">${icon(cIcon(c),'w-3 h-3')}</span>${c.id}
        </span>
        ${(()=>{ const o=openFindings(c).filter(f=>f.sev==='high').length; return o?`<span class="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style="background:#F4E2DD;color:#9A342A">${icon('scan','w-2.5 h-2.5')}${o}</span>`:''; })()}
      </div>
      <div class="text-sm font-medium text-brand-900 leading-snug line-clamp-2 group-hover:text-brand-600 transition">${c.name}</div>
      <div class="text-[11px] text-brand-800/65 truncate mt-0.5">${c.counterparty||'No counterparty yet'}</div>
      <div class="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-brand-100/50">
        <span class="inline-flex items-center gap-1 text-[10px] text-brand-800/65 truncate">${icon('folder','w-3 h-3')}<span class="truncate">${FOLDERS[c.folder]?.name||''}</span></span>
        <span class="text-[11px] font-mono font-medium whitespace-nowrap ${isMonetary(c)?'text-brand-900':'text-brand-800/60'}">${!isMonetary(c)?'n/m':(c.value?fmtKESshort(c.value):'—')}</span>
      </div>
    </div>`;
}
function pipeColumnInner(col, list){
  const shown=list.slice(0,PIPE_CAP);
  const more=list.length>PIPE_CAP?`<button data-pipe-more="${col.k}" class="w-full mt-1 rounded-lg border border-brand-100 bg-white px-3 py-2 text-[11px] font-medium text-brand-600 hover:border-brand-300 transition">+${list.length-PIPE_CAP} more in Register →</button>`:'';
  const empty=list.length?'':`<div class="rounded-xl border border-dashed border-brand-100 px-3 py-8 text-center text-[11px] text-brand-800/60">Nothing here</div>`;
  return shown.map(pipeCard).join('')+empty+more;
}
function renderPipeline(){
  const cs=state.contracts;
  const valOf=arr=>arr.reduce((s,c)=>s+Number(c.value||0),0);
  const groups=PIPE_COLS.map(col=>{ const list=cs.filter(c=>c.status===col.k); return {col, list, val:valOf(list)}; });
  const total=cs.length;

  const columnsHtml=groups.map(g=>`
    <div class="flex flex-col min-w-0 min-h-0">
      <div class="shrink-0 flex items-center justify-between gap-2 px-1.5 pb-2.5">
        <div class="flex items-center gap-2 min-w-0">
          <span class="h-2.5 w-2.5 rounded-full shrink-0" style="background:${g.col.color}"></span>
          <span class="text-[11px] font-700 uppercase tracking-wider text-ink/70 truncate">${g.col.label}</span>
          <span class="text-[10px] font-600 tnum text-ink/65 bg-white elev-1 rounded-full px-1.5 py-0.5">${g.list.length}</span>
        </div>
        <span class="text-[11px] font-600 tnum text-ink/40 shrink-0">${fmtKESshort(g.val)}</span>
      </div>
      <div data-drop="${g.col.k}" class="pipe-col flex-1 min-h-0 overflow-y-auto scroll-thin rounded-2xl bg-brand-50/40 border border-transparent p-2.5 transition">
        ${pipeColumnInner(g.col, g.list)}
      </div>
    </div>`).join('');

  document.getElementById('content').innerHTML=`
  <div class="view-enter h-full flex flex-col">
    <header class="shrink-0 sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-hair">
      <div class="px-8 py-4 flex items-center justify-between gap-4 max-w-[1400px] mx-auto w-full">
        <div>
          <h1 class="font-display font-700 text-[26px] tracking-tight text-ink">My Queue</h1>
          <p class="text-[13px] text-ink/70"><span class="tnum">${total.toLocaleString('en-KE')}</span> contracts · ${canEdit()?'drag a card between stages to advance them':'read-only — you have viewer access'}</p>
        </div>
      </div>
    </header>
    <div class="flex-1 min-h-0 px-8 py-6 max-w-[1400px] mx-auto w-full">
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-full">${columnsHtml}</div>
    </div>
  </div>`;

  wirePipeline();
  setActiveNav('pipeline');
}
function pipeMove(id, target){
  const c=getContract(id); if(!c) return;
  if(!canEdit()){ toast('Viewers cannot move contracts','err'); return; }
  if(c.status===target) return;
  if(c.status==='Signed'){ toast('Executed contracts are sealed and cannot be moved','err'); return; }
  const label=(PIPE_COLS.find(x=>x.k===target)||{}).label||target;
  if(target==='Signed'){ toast('Open the contract to complete verification & signing'); openWorkspace(id); return; }
  if(target==='Declined'){
    if(!confirm(`Move “${c.name}” to Closed? This declines the contract.`)) return;
    c.status='Declined'; logAudit(c,'Declined','Moved to Closed on the pipeline board');
    toast(`${c.name.split(' —')[0]} moved to Closed`,'err');
  } else {
    const from=(PIPE_COLS.find(x=>x.k===c.status)||{}).label||c.status;
    c.status=target; logAudit(c,'Status changed',`${from} → ${label} (pipeline board)`);
    toast(`${c.name.split(' —')[0]} moved to ${label}`);
  }
  c.lastAction=todayStr(); persist(c);
  renderPipeline(); renderSideFolders();
}
function wirePipeline(){
  document.querySelectorAll('[data-card]').forEach(el=>{
    const id=el.getAttribute('data-card');
    el.addEventListener('click',()=>{ if(!el.getAttribute('draggable')||!pipeDrag) openWorkspace(id); });
    el.addEventListener('dragstart',e=>{ pipeDrag=id; el.classList.add('opacity-40'); try{e.dataTransfer.effectAllowed='move';}catch(_){} });
    el.addEventListener('dragend',()=>{ el.classList.remove('opacity-40'); pipeDrag=null; });
  });
  document.querySelectorAll('[data-drop]').forEach(col=>{
    col.addEventListener('dragover',e=>{ if(!pipeDrag) return; e.preventDefault(); col.classList.add('border-brand-300','bg-brand-50/70'); });
    col.addEventListener('dragleave',()=>col.classList.remove('border-brand-300','bg-brand-50/70'));
    col.addEventListener('drop',e=>{ e.preventDefault(); col.classList.remove('border-brand-300','bg-brand-50/70'); const id=pipeDrag; pipeDrag=null; if(id) pipeMove(id, col.getAttribute('data-drop')); });
  });
  document.querySelectorAll('[data-pipe-more]').forEach(el=>el.addEventListener('click',()=>{ regState().stage=el.getAttribute('data-pipe-more'); regState().type='all'; regState().sel={}; setView('register'); }));
}

Object.assign(window,{PIPE_CAP,PIPE_COLS,pipeCard,pipeColumnInner,pipeDrag,pipeMove,renderPipeline,wirePipeline});
