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
  // extra portfolio aggregates so report cards aren't forced to track value
  const totalValue=active.reduce((s,c)=>s+Number(c.value||0),0);
  const pipeTotal=Object.values(pipeline).reduce((a,b)=>a+b,0);
  const pipeMonthsN=Object.keys(pipeline).length;
  const expiring90=cs.filter(c=>{ const exp=(c.metadata&&c.metadata.expiryDate)||c.expiry; return exp&&c.status!=='Declined'&&daysUntil(exp)>=0&&daysUntil(exp)<=90; }).length;
  const risks=cs.map(c=>contractRisk(c)).filter(n=>typeof n==='number'&&!isNaN(n));
  const avgRisk=risks.length?risks.reduce((a,b)=>a+b,0)/risks.length:null;
  const highRisk=cs.filter(c=>contractRisk(c)>=70).length;
  let openOb=0,overdueOb=0;
  if(typeof obState==='function') cs.forEach(c=>(c.obligations||[]).forEach(o=>{ const st=obState(o); if(st&&st!=='done'&&st!=='met'){ openOb++; if(st==='overdue') overdueOb++; } }));
  // count-based breakdowns for the selectable chart cards
  const byStatus={};
  cs.forEach(c=>{ byStatus[c.status]=(byStatus[c.status]||0)+1; });
  const countByFolder={};
  cs.forEach(c=>{ const k=FOLDERS[c.folder]?.name||'Other'; countByFolder[k]=(countByFolder[k]||0)+1; });
  const riskBands={Low:0,Medium:0,High:0};
  cs.forEach(c=>{ const b=riskBand(contractRisk(c)); riskBands[b==='ruby'?'High':b==='amber'?'Medium':'Low']++; });
  const obByState={Overdue:overdueOb, Open:Math.max(0,openOb-overdueOb), Completed:0};
  if(typeof obState==='function') cs.forEach(c=>(c.obligations||[]).forEach(o=>{ if(obState(o)==='done') obByState.Completed++; }));
  return { total:cs.length, active:active.length, avgCycle, cycleN:cycles.length, stageAge, roundsByType, byFolder, topParty, pipeline,
    totalValue, pipeTotal, pipeMonthsN, expiring90, avgRisk, highRisk, openOb, overdueOb, byStatus, countByFolder, riskBands, obByState };
}
function lastActivity(c){ const a=c.audit||[]; return a.length?Date.parse(a[a.length-1].at):Date.now(); }

const _esc = s => String(s==null?'':s).replace(/</g,'&lt;');
/* E7: one labelled horizontal bar — label + tabular value over a 7px track. */
function bar(label, value, max, valStr, color){
  const pct=max>0?Math.max(0,Math.min(100,Math.round(value/max*100))):0;
  return `<div style="margin-bottom:7px">
    <div style="display:flex;justify-content:space-between;gap:10px;font-size:11px;margin-bottom:2px"><span style="color:var(--color-neutral-700);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_esc(label)}</span><span style="font-weight:500;font-variant-numeric:tabular-nums;flex:none">${valStr}</span></div>
    <div style="height:7px;background:var(--color-neutral-200);border-radius:999px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${color};border-radius:999px"></div></div>
  </div>`;
}
/* Metric catalogue for the top stat cards. Each customer follows what matters
   to them — value isn't forced. `get(r)` returns {val, sub} from the computed
   report object; grad/ic set the card's look. */
const REPORT_METRICS=[
  {k:'avgCycle',   label:'Avg cycle · draft→signed', grad:'var(--grad-emerald)', ic:'clock', get:r=>({val:r.avgCycle!=null?Math.round(r.avgCycle)+'d':'—', sub:r.cycleN+' signed sampled'})},
  {k:'ageReview',  label:'Avg age · in review',       grad:'var(--grad-amber)',   ic:'clock', get:r=>({val:Math.round(r.stageAge['Under Review']||0)+'d', sub:'time on counterparty'})},
  {k:'ageDraft',   label:'Avg age · drafting',        grad:'var(--grad-steel)',   ic:'file',  get:r=>({val:Math.round(r.stageAge['Draft']||0)+'d', sub:'time internal'})},
  {k:'renewal',    label:'Renewal pipeline · 12mo',   grad:'var(--grad-emerald)', ic:'trend', get:r=>({val:fmtKESshort(r.pipeTotal), sub:r.pipeMonthsN+' months with expiries'})},
  {k:'totalValue', label:'Total portfolio value',     grad:'var(--grad-steel)',   ic:'trend', get:r=>({val:fmtKESshort(r.totalValue), sub:r.active+' active contracts'})},
  {k:'count',      label:'Contracts · total',         grad:'var(--grad-steel)',   ic:'file',  get:r=>({val:String(r.total), sub:r.active+' active'})},
  {k:'expiring',   label:'Expiring ≤ 90 days',        grad:'var(--grad-amber)',   ic:'clock', get:r=>({val:String(r.expiring90), sub:'need attention'})},
  {k:'avgRisk',    label:'Avg risk score',            grad:'var(--grad-ruby)',    ic:'shield',get:r=>({val:r.avgRisk!=null?String(Math.round(r.avgRisk)):'—', sub:r.highRisk+' high-risk (≥70)'})},
  {k:'openOb',     label:'Open obligations',          grad:'var(--grad-amber)',   ic:'list',  get:r=>({val:String(r.openOb), sub:r.overdueOb+' overdue'})},
];
const DEFAULT_REPORT_METRICS=['avgCycle','ageReview','ageDraft','renewal'];
function reportMetricSel(){
  const s=(state.settings&&Array.isArray(state.settings.reportMetrics))?state.settings.reportMetrics.slice():DEFAULT_REPORT_METRICS.slice();
  for(let i=0;i<4;i++) if(!REPORT_METRICS.some(m=>m.k===s[i])) s[i]=DEFAULT_REPORT_METRICS[i];
  return s;
}
const emptyMsg = t => `<p style="font-size:12px;color:var(--color-neutral-600)">${_esc(t)}</p>`;
/* Chart catalogue for the four lower cards. Like the hero stat cards, each card
   follows a KPI the user picks — value isn't forced. `render(r)` returns the bar
   HTML from the computed report object. */
const REPORT_CHARTS=[
  {k:'streamValue', label:'Portfolio value by value stream', render:r=>{
    const e=Object.entries(r.byFolder).sort((a,b)=>b[1]-a[1]); const mx=Math.max(1,...e.map(x=>x[1]));
    return e.map(([k,v])=>bar(k,v,mx,fmtKESshort(v),'var(--color-accent)')).join('')||emptyMsg('No data.'); }},
  {k:'partyValue', label:'Top counterparties by value', render:r=>{
    const mx=Math.max(1,...r.topParty.map(x=>x[1]));
    return r.topParty.map(([k,v])=>bar(k,v,mx,fmtKESshort(v),'var(--color-accent-700)')).join('')||emptyMsg('No data.'); }},
  {k:'renewalPipe', label:'Renewal pipeline · next 12 months', render:r=>{
    const months=Object.keys(r.pipeline).sort(); const mx=Math.max(1,...Object.values(r.pipeline));
    return months.length?months.map(m=>bar(new Date(m+'-01').toLocaleDateString('en-KE',{month:'short',year:'2-digit'}),r.pipeline[m],mx,fmtKESshort(r.pipeline[m]),'#2e8763')).join(''):emptyMsg('Nothing expiring in the next 12 months.'); }},
  {k:'roundsType', label:'Negotiation rounds by type (avg)', render:r=>{
    const e=Object.entries(r.roundsByType).filter(([,v])=>v.n).sort((a,b)=>(b[1].rounds/b[1].n)-(a[1].rounds/a[1].n)).slice(0,8);
    const mx=Math.max(1,...Object.values(r.roundsByType).map(x=>x.rounds/x.n));
    return e.length?e.map(([k,v])=>bar(k+` (${v.n})`, v.rounds/v.n, mx, (v.rounds/v.n).toFixed(1),'#b8862b')).join(''):emptyMsg('No negotiation data.'); }},
  {k:'stageCount', label:'Contracts by stage', render:r=>{
    const order=['Draft','Under Review','Signed','Declined']; const e=order.filter(k=>r.byStatus[k]).map(k=>[k,r.byStatus[k]]);
    const mx=Math.max(1,...e.map(x=>x[1]));
    return e.length?e.map(([k,v])=>bar(statusLabel(k),v,mx,String(v),(STATUS_META[k]||{}).dot||'var(--color-accent)')).join(''):emptyMsg('No data.'); }},
  {k:'streamCount', label:'Contract count by value stream', render:r=>{
    const e=Object.entries(r.countByFolder).sort((a,b)=>b[1]-a[1]); const mx=Math.max(1,...e.map(x=>x[1]));
    return e.length?e.map(([k,v])=>bar(k,v,mx,String(v),'var(--color-accent)')).join(''):emptyMsg('No data.'); }},
  {k:'riskBand', label:'Contracts by risk band', render:r=>{
    const e=Object.entries(r.riskBands); const mx=Math.max(1,...e.map(x=>x[1]));
    const col={Low:'#2e8763',Medium:'#b8862b',High:'#b0453c'};
    return e.some(x=>x[1])?e.map(([k,v])=>bar(k,v,mx,String(v),col[k]||'var(--color-accent)')).join(''):emptyMsg('No data.'); }},
  {k:'obState', label:'Obligations by status', render:r=>{
    const e=Object.entries(r.obByState); const mx=Math.max(1,...e.map(x=>x[1]));
    const col={Overdue:'#b0453c',Open:'#b8862b',Completed:'#2e8763'};
    return e.some(x=>x[1])?e.map(([k,v])=>bar(k,v,mx,String(v),col[k]||'var(--color-accent)')).join(''):emptyMsg('No obligations tracked yet.'); }},
];
const DEFAULT_REPORT_CHARTS=['streamValue','partyValue','renewalPipe','roundsType'];
function reportChartSel(){
  const s=(state.settings&&Array.isArray(state.settings.reportCharts))?state.settings.reportCharts.slice():DEFAULT_REPORT_CHARTS.slice();
  for(let i=0;i<4;i++) if(!REPORT_CHARTS.some(c=>c.k===s[i])) s[i]=DEFAULT_REPORT_CHARTS[i];
  return s;
}
function renderReports(){
  const r=computeReports();

  // TOP — gradient hero stat cards. Each card's metric is user-selectable via
  // the dropdown built into its label, so revenue/value is never forced.
  const sel=reportMetricSel();
  const statSlot=(idx)=>{
    const m=REPORT_METRICS.find(x=>x.k===sel[idx])||REPORT_METRICS[idx];
    const d=m.get(r);
    const optsHtml=REPORT_METRICS.map(x=>`<option value="${x.k}" ${x.k===m.k?'selected':''} style="color:#1d1f20;background:#fff">${x.label}</option>`).join('');
    return `
    <div style="display:flex;flex-direction:column;gap:10px;padding:15px 16px;border-radius:10px;background:${m.grad};color:#fff;box-shadow:var(--shadow-sm)">
      <span style="display:flex;align-items:center;gap:9px">
        <span style="width:30px;height:30px;flex:none;border-radius:7px;background:rgba(255,255,255,.22);display:grid;place-items:center;color:#fff">${icon(m.ic,'w-4 h-4',1.7)}</span>
        <label class="rpt-metric" title="Choose the metric this card follows" style="position:relative;flex:1;min-width:0;display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.38);border-radius:999px;padding:3px 6px 3px 10px;cursor:pointer;transition:background .12s,border-color .12s">
          <select data-report-metric="${idx}" style="appearance:none;-webkit-appearance:none;background:transparent;border:0;color:#fff;font:inherit;font-size:10px;letter-spacing:.06em;text-transform:uppercase;font-weight:600;line-height:1.25;cursor:pointer;outline:none;max-width:100%;text-overflow:ellipsis">${optsHtml}</select>
          <span style="color:#fff;font-size:9px;flex:none;pointer-events:none">▾</span>
        </label>
      </span>
      <span class="tnum" style="font-family:var(--font-mono);font-weight:600;font-size:25px;line-height:1.0;color:#fff">${d.val}</span>
      <span style="font-size:10.5px;color:rgba(255,255,255,.85)">${d.sub}</span>
    </div>`;
  };
  const stats=[statSlot(0),statSlot(1),statSlot(2),statSlot(3)].join('');

  // BELOW — 2×2 chart cards. Each card follows a KPI the user picks via the
  // dropdown built into its title, so no chart is forced.
  const csel=reportChartSel();
  const chartSlot=(idx)=>{
    const ch=REPORT_CHARTS.find(x=>x.k===csel[idx])||REPORT_CHARTS[idx];
    const opts=REPORT_CHARTS.map(x=>`<option value="${x.k}" ${x.k===ch.k?'selected':''}>${x.label}</option>`).join('');
    return `
    <section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:10px;padding:16px">
      <label class="rpt-chart" title="Choose the chart this card follows" style="display:inline-flex;align-items:center;gap:6px;max-width:100%;margin:0 0 10px;padding:3px 8px 3px 11px;border:1px solid var(--color-divider);border-radius:999px;cursor:pointer;transition:background .12s,border-color .12s">
        <select data-report-chart="${idx}" style="appearance:none;-webkit-appearance:none;background:transparent;border:0;font:inherit;font-size:14px;font-weight:600;color:var(--color-text);cursor:pointer;outline:none;max-width:100%;text-overflow:ellipsis">${opts}</select>
        <span style="color:var(--color-neutral-500);font-size:10px;flex:none;pointer-events:none">▾</span>
      </label>
      ${ch.render(r)}
    </section>`;
  };

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:16px 18px 28px">
    <style>
      .rpt-metric:hover{background:rgba(255,255,255,.30)!important;border-color:rgba(255,255,255,.7)!important}
      .rpt-metric:focus-within{background:rgba(255,255,255,.30)!important;border-color:#fff!important}
      .rpt-chart:hover{background:var(--color-bg);border-color:var(--color-accent)}
      .rpt-chart:focus-within{background:var(--color-bg);border-color:var(--color-accent)}
    </style>
    <div style="display:flex;flex-direction:column;gap:18px">
      <section style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">
        ${stats}
      </section>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
        ${chartSlot(0)}
        ${chartSlot(1)}
        ${chartSlot(2)}
        ${chartSlot(3)}
      </div>
    </div>
  </div>`;
  document.querySelectorAll('[data-report-metric]').forEach(selEl=>selEl.addEventListener('change',()=>{
    const i=Number(selEl.getAttribute('data-report-metric'));
    const arr=reportMetricSel(); arr[i]=selEl.value;
    state.settings=state.settings||{}; state.settings.reportMetrics=arr;
    if(typeof saveSettings==='function') saveSettings();
    renderReports();
  }));
  document.querySelectorAll('[data-report-chart]').forEach(selEl=>selEl.addEventListener('change',()=>{
    const i=Number(selEl.getAttribute('data-report-chart'));
    const arr=reportChartSel(); arr[i]=selEl.value;
    state.settings=state.settings||{}; state.settings.reportCharts=arr;
    if(typeof saveSettings==='function') saveSettings();
    renderReports();
  }));
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
