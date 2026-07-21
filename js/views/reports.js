// HaTi — E7 analytics & reporting. Globals window-attached.

/* ---- E7-T1: lifecycle events derived from the audit trail ---- */
function lifecycleEvents(c){
  return (c.audit||[]).map(a=>({ at:a.at, action:a.action, detail:a.detail }));
}
function firstAuditAt(c, actions){
  const hit=(c.audit||[]).find(a=>actions.includes(a.action));
  return hit?Date.parse(hit.at):null;
}
function daysBetween(a,b){ if(a==null||b==null) return null; return Math.max(0,(b-a)/86400000); }

/* ---- E7-T2: analytics computed over the loaded working set ----
   Server-mode aggregates (value by folder/party, renewal pipeline) come from
   /api/analytics (SQL, fast at scale); cycle-time & rounds are derived from
   the audit trail of the loaded contracts. */
function computeReports(){
  const cs=state.contracts;
  const active=cs.filter(c=>c.status!=='Declined');
  // cycle time draft -> signed
  const cycles=[];
  cs.forEach(c=>{ if(c.status==='Signed'){ const created=firstAuditAt(c,['Created','Uploaded']); const signed=firstAuditAt(c,['Signed']); const d=daysBetween(created,signed); if(d!=null) cycles.push(d); } });
  const avgCycle=cycles.length?cycles.reduce((a,b)=>a+b,0)/cycles.length:null;
  // time stuck in current stage (age of lastAction for non-signed)
  const stageAge={};
  ['Draft','Under Review'].forEach(s=>{ const arr=cs.filter(c=>c.status===s).map(c=>{ const t=firstAuditAt(c,['Created','Uploaded'])||Date.parse(c.at||0); return t?(Date.now()-lastActivity(c))/86400000:0; }); stageAge[s]=arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0; });
  // negotiation rounds per type
  const roundsByType={};
  cs.forEach(c=>{ const k=cKind(c); const r=(c.rounds||[]).length; if(!roundsByType[k]) roundsByType[k]={n:0,rounds:0}; roundsByType[k].n++; roundsByType[k].rounds+=r; });
  // value by folder
  const byFolder={};
  active.forEach(c=>{ const k=FOLDERS[c.folder]?.name||'Other'; byFolder[k]=(byFolder[k]||0)+Number(c.value||0); });
  // value by counterparty (top 8)
  const byParty={};
  active.forEach(c=>{ if(c.counterparty) byParty[c.counterparty]=(byParty[c.counterparty]||0)+Number(c.value||0); });
  const topParty=Object.entries(byParty).sort((a,b)=>b[1]-a[1]).slice(0,8);
  // renewal pipeline value next 12 months (by month)
  const pipeline={};
  active.forEach(c=>{ const exp=(c.metadata&&c.metadata.expiryDate)||c.expiry; if(!exp) return; const d=daysUntil(exp); if(d>=0&&d<=365){ const k=exp.slice(0,7); pipeline[k]=(pipeline[k]||0)+Number(c.value||0); } });
  return { total:cs.length, active:active.length, avgCycle, cycleN:cycles.length, stageAge, roundsByType, byFolder, topParty, pipeline };
}
function lastActivity(c){ const a=c.audit||[]; return a.length?Date.parse(a[a.length-1].at):Date.now(); }

function bar(label, value, max, fmt, color){
  const pct=max>0?Math.round(value/max*100):0;
  return `<div class="mb-2">
    <div class="flex items-center justify-between text-[11.5px] mb-0.5"><span class="text-ink/70 truncate pr-2">${label}</span><span class="font-mono font-600 text-ink tnum">${fmt(value)}</span></div>
    <div class="h-2 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full" style="width:${pct}%;background:${color||'#086B54'}"></div></div>
  </div>`;
}
function renderReports(){
  const r=computeReports();
  const kes=v=>fmtKESshort(v);
  const maxFolder=Math.max(1,...Object.values(r.byFolder));
  const maxParty=Math.max(1,...r.topParty.map(x=>x[1]));
  const pipeMonths=Object.keys(r.pipeline).sort();
  const maxPipe=Math.max(1,...Object.values(r.pipeline));
  const pipeTotal=Object.values(r.pipeline).reduce((a,b)=>a+b,0);
  const card=(title,body)=>`<div class="bg-white rounded-2xl elev-2 p-5"><h2 class="font-display font-600 text-ink mb-3">${title}</h2>${body}</div>`;
  const stat=(label,val,sub)=>`<div class="bg-white rounded-2xl elev-2 p-4"><div class="text-[10px] font-mono uppercase tracking-wide text-ink/45 mb-1">${label}</div><div class="font-display font-700 text-[22px] text-ink tnum">${val}</div>${sub?`<div class="text-[11px] text-ink/55 mt-0.5">${sub}</div>`:''}</div>`;
  document.getElementById('content').innerHTML=`
  <div class="view-enter h-full flex flex-col">
    <header class="shrink-0 sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-hair">
      <div class="px-8 py-4 max-w-[1240px] mx-auto w-full flex items-center justify-between gap-4">
        <div><h1 class="font-display font-700 text-[26px] tracking-tight text-ink">Reports</h1>
          <p class="text-[13px] text-ink/70 mt-0.5">Cycle time, bottlenecks, portfolio value and the renewal pipeline.</p></div>
        <button id="rep-export" class="flex items-center gap-1.5 rounded-xl bg-white elev-1 px-3.5 py-2.5 text-sm text-brand-700 font-600 hover:elev-2 transition">${icon('download','w-4 h-4')} Export CSV</button>
      </div>
    </header>
    <div class="flex-1 min-h-0 overflow-auto scroll-thin px-8 py-6 max-w-[1240px] mx-auto w-full space-y-5">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${stat('Avg cycle · draft→signed', r.avgCycle!=null?Math.round(r.avgCycle)+'d':'—', r.cycleN+' signed')}
        ${stat('Avg age · in review', Math.round(r.stageAge['Under Review']||0)+'d', 'time on counterparty')}
        ${stat('Avg age · drafting', Math.round(r.stageAge['Draft']||0)+'d', 'time internal')}
        ${stat('Renewal pipeline · 12mo', kes(pipeTotal), pipeMonths.length+' months with expiries')}
      </div>
      <div class="grid lg:grid-cols-2 gap-5">
        ${card('Portfolio value by value stream', Object.entries(r.byFolder).sort((a,b)=>b[1]-a[1]).map(([k,v])=>bar(k,v,maxFolder,kes)).join('')||'<p class="text-[12px] text-ink/55">No data.</p>')}
        ${card('Top counterparties by value', r.topParty.map(([k,v])=>bar(k,v,maxParty,kes,'#C79A3E')).join('')||'<p class="text-[12px] text-ink/55">No data.</p>')}
      </div>
      <div class="grid lg:grid-cols-2 gap-5">
        ${card('Renewal pipeline · next 12 months', pipeMonths.length?pipeMonths.map(m=>bar(new Date(m+'-01').toLocaleDateString('en-KE',{month:'short',year:'2-digit'}),r.pipeline[m],maxPipe,kes,'#0B7A5F')).join(''):'<p class="text-[12px] text-ink/55">Nothing expiring in the next 12 months.</p>')}
        ${card('Negotiation rounds by type', Object.entries(r.roundsByType).filter(([,v])=>v.n).sort((a,b)=>(b[1].rounds/b[1].n)-(a[1].rounds/a[1].n)).slice(0,8).map(([k,v])=>bar(k+` (${v.n})`, v.rounds/v.n, Math.max(1,...Object.values(r.roundsByType).map(x=>x.rounds/x.n)), n=>n.toFixed(1)+' avg','#8A5E1B')).join('')||'<p class="text-[12px] text-ink/55">No negotiation data.</p>')}
      </div>
    </div>
  </div>`;
  document.getElementById('rep-export').addEventListener('click',()=>exportReportsCsv(r));
  setActiveNav('reports');
}
function exportReportsCsv(r){
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const lines=[];
  lines.push(['Metric','Value'].map(esc).join(','));
  lines.push(['Contracts total', r.total].map(esc).join(','));
  lines.push(['Active contracts', r.active].map(esc).join(','));
  lines.push(['Avg cycle time draft->signed (days)', r.avgCycle!=null?Math.round(r.avgCycle):''].map(esc).join(','));
  lines.push(['Signed contracts sampled', r.cycleN].map(esc).join(','));
  lines.push([].join(','));
  lines.push(['Value by value stream','KES'].map(esc).join(','));
  Object.entries(r.byFolder).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>lines.push([k,Math.round(v)].map(esc).join(',')));
  lines.push([].join(','));
  lines.push(['Top counterparties','KES'].map(esc).join(','));
  r.topParty.forEach(([k,v])=>lines.push([k,Math.round(v)].map(esc).join(',')));
  lines.push([].join(','));
  lines.push(['Renewal pipeline month','KES'].map(esc).join(','));
  Object.keys(r.pipeline).sort().forEach(m=>lines.push([m,Math.round(r.pipeline[m])].map(esc).join(',')));
  downloadFile(`hati-reports-${new Date().toISOString().slice(0,10)}.csv`, lines.join('\n'), 'text/csv');
  toast('Reports exported to CSV');
}

Object.assign(window,{lifecycleEvents,firstAuditAt,computeReports,renderReports,exportReportsCsv});
