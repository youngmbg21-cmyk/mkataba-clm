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

const _esc = s => String(s==null?'':s).replace(/</g,'&lt;');
/* E7: one labelled horizontal bar — label + tabular value over a 7px track. */
function bar(label, value, max, valStr, color){
  const pct=max>0?Math.max(0,Math.min(100,Math.round(value/max*100))):0;
  return `<div style="margin-bottom:7px">
    <div style="display:flex;justify-content:space-between;gap:10px;font-size:11px;margin-bottom:2px"><span style="color:var(--color-neutral-700);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_esc(label)}</span><span style="font-weight:500;font-variant-numeric:tabular-nums;flex:none">${valStr}</span></div>
    <div style="height:7px;background:var(--color-neutral-200)"><div style="width:${pct}%;height:100%;background:${color}"></div></div>
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
  const roundsEntries=Object.entries(r.roundsByType).filter(([,v])=>v.n).sort((a,b)=>(b[1].rounds/b[1].n)-(a[1].rounds/a[1].n)).slice(0,8);
  const maxRounds=Math.max(1,...Object.values(r.roundsByType).map(x=>x.rounds/x.n));
  const empty=t=>`<p style="font-size:12px;color:var(--color-neutral-600)">${t}</p>`;

  // TOP — blueprint stat strip: 4 equal cells, hairline left-borders, corner marks
  const stat=(label,val,sub,i)=>`
    <div style="display:flex;flex-direction:column;gap:3px;padding:12px 14px;${i?'border-left:1px solid var(--color-divider)':''}">
      <span style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-600)">${label}</span>
      <span style="font-family:var(--font-mono);font-weight:600;font-size:24px;line-height:1.1;font-variant-numeric:tabular-nums">${val}</span>
      <span style="font-size:10.5px;color:var(--color-neutral-600)">${sub}</span>
    </div>`;
  const stats=[
    stat('Avg cycle · draft→signed', r.avgCycle!=null?Math.round(r.avgCycle)+'d':'—', r.cycleN+' signed sampled', 0),
    stat('Avg age · in review', Math.round(r.stageAge['Under Review']||0)+'d', 'time on counterparty', 1),
    stat('Avg age · drafting', Math.round(r.stageAge['Draft']||0)+'d', 'time internal', 1),
    stat('Renewal pipeline · 12mo', kes(pipeTotal), pipeMonths.length+' months with expiries', 1),
  ].join('');

  // BELOW — 2×2 chart cards
  const card=(title,body)=>`
    <section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:6px;padding:12px 14px">
      <h4 style="font-size:14px;margin:0 0 10px">${title}</h4>${body}
    </section>`;
  const streamCard=card('Portfolio value by value stream', Object.entries(r.byFolder).sort((a,b)=>b[1]-a[1]).map(([k,v])=>bar(k,v,maxFolder,kes(v),'var(--color-accent)')).join('')||empty('No data.'));
  const partyCard=card('Top counterparties by value', r.topParty.map(([k,v])=>bar(k,v,maxParty,kes(v),'var(--color-accent-700)')).join('')||empty('No data.'));
  const pipeCard=card('Renewal pipeline · next 12 months', pipeMonths.length?pipeMonths.map(m=>bar(new Date(m+'-01').toLocaleDateString('en-KE',{month:'short',year:'2-digit'}),r.pipeline[m],maxPipe,kes(r.pipeline[m]),'#2e8763')).join(''):empty('Nothing expiring in the next 12 months.'));
  const roundsCard=card('Negotiation rounds by type (avg)', roundsEntries.length?roundsEntries.map(([k,v])=>bar(k+` (${v.n})`, v.rounds/v.n, maxRounds, (v.rounds/v.n).toFixed(1), '#b8862b')).join(''):empty('No negotiation data.'));

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:14px 16px 28px">
    <div style="display:flex;flex-direction:column;gap:14px">
      <section class="blueprint" style="background:var(--color-surface);box-shadow:var(--shadow-sm);border-radius:6px;display:grid;grid-template-columns:repeat(4,1fr)">
        
        ${stats}
      </section>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        ${streamCard}
        ${partyCard}
        ${pipeCard}
        ${roundsCard}
      </div>
    </div>
  </div>`;
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
