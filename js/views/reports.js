// HaTi — E7 analytics & reporting. Globals window-attached.

/* ---- E7-T1: lifecycle events derived from the audit trail ---- */
function lifecycleEvents(c){
  return (c.audit||[]).map(a=>({ at:a.at, action:a.action, detail:a.detail }));
}
function firstAuditAt(c, actions){
  const hit=(c.audit||[]).find(a=>actions.includes(a.action));
  return hit?Date.parse(hit.at):null;
}
/* ---- THE THREE DATES, ON A ROW THAT HAS NO HISTORY ----
   computeReports reads state.contracts, which in server mode is the LIGHT
   list — and the audit trail is stripped from every row on it. So every
   reading below used to come back empty on a real server and correct in local
   mode, where records are whole: MEASURED, cycle time was null for every
   signed contract and a contract that had sat fifteen days in Draft reported
   a stage age of 0.0 days.
   The server carries the three dates on the row (see auditDatesOf in
   server.js). The trail is still asked wherever there IS one, so local mode
   and an opened contract are unchanged. */
const _repAt = v => { const t=Date.parse(v||''); return isNaN(t)?null:t; };
function repRaisedAt(c){
  return _repAt(c&&c._raisedAt) ?? firstAuditAt(c,['Created','Uploaded','Migrated']);
}
function repSignedAt(c){
  return _repAt(c&&c._signedAt) ?? firstAuditAt(c,['Signed']);
}
function daysBetween(a,b){ if(a==null||b==null) return null; return Math.max(0,(b-a)/86400000); }

/* ---- E7-T2: analytics computed over the loaded working set ----
   Server-mode aggregates (value by folder/party, renewal pipeline) come from
   /api/analytics (SQL, fast at scale); cycle-time & rounds are derived from
   the audit trail of the loaded contracts. */
function computeReports(){
  const cs=state.contracts;
  const active=cs.filter(c=>c.status!=='Declined'&&!c.archived);
  // cycle time draft -> signed
  const cycles=[];
  cs.forEach(c=>{ if(c.status==='Signed'){ const created=repRaisedAt(c); const signed=repSignedAt(c); const d=daysBetween(created,signed); if(d!=null) cycles.push(d); } });
  const avgCycle=cycles.length?cycles.reduce((a,b)=>a+b,0)/cycles.length:null;
  // time stuck in current stage (age of lastAction for non-signed)
  const stageAge={};
  ['Draft','Under Review'].forEach(s=>{ const arr=cs.filter(c=>c.status===s).map(c=>{ const t=repRaisedAt(c); return t?(Date.now()-lastActivity(c))/86400000:0; }); stageAge[s]=arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0; });
  // negotiation rounds per type
  const roundsByType={};
  cs.forEach(c=>{ const k=cKind(c); const r=(c.rounds||[]).length; if(!roundsByType[k]) roundsByType[k]={n:0,rounds:0}; roundsByType[k].n++; roundsByType[k].rounds+=r; });
  // value by folder
  const byFolder={};
  const _v=c=>(window.fxHomeValue?fxHomeValue(c):Number(c.value||0));   // W2-1: one currency
  active.forEach(c=>{ const k=FOLDERS[c.folder]?.name||'Other'; byFolder[k]=(byFolder[k]||0)+_v(c); });
  // value by counterparty (top 8)
  const byParty={};
  active.forEach(c=>{ if(c.counterparty) byParty[c.counterparty]=(byParty[c.counterparty]||0)+_v(c); });
  const topParty=Object.entries(byParty).sort((a,b)=>b[1]-a[1]).slice(0,8);
  // renewal pipeline value next 12 months (by month)
  const pipeline={};
  agreementsIn(active).forEach(c=>{ const exp=effectiveExpiry(c); if(!exp) return; const d=daysUntil(exp); if(d>=0&&d<=365){ const k=exp.slice(0,7); pipeline[k]=(pipeline[k]||0)+_v(c); } });
  // extra portfolio aggregates so report cards aren't forced to track value
  const totalValue=active.reduce((s,c)=>s+_v(c),0);
  const pipeTotal=Object.values(pipeline).reduce((a,b)=>a+b,0);
  const pipeMonthsN=Object.keys(pipeline).length;
  const expiring90=agreementsIn(cs).filter(c=>{ const exp=effectiveExpiry(c); return exp&&c.status!=='Declined'&&!c.archived&&daysUntil(exp)>=0&&daysUntil(exp)<=90; }).length;
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
/* When anything last happened to this contract. On a light row the trail is
   absent, and falling through to "now" made every stage age zero — the age of
   a contract nothing has happened to since it was raised is the age of the
   raising, not of this instant. */
function lastActivity(c){
  const a=c.audit||[];
  if(a.length) return Date.parse(a[a.length-1].at);
  return _repAt(c&&c._lastAuditAt) ?? _repAt(c&&c.lastAction) ?? Date.now();
}

const _esc = s => String(s==null?'':s).replace(/</g,'&lt;');
/* E7: one labelled horizontal bar — label + tabular value over a 7px track. */
function bar(label, value, max, valStr, color){
  const pct=max>0?Math.max(0,Math.min(100,Math.round(value/max*100))):0;
  return `<div style="margin-bottom:7px">
    <div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;margin-bottom:2px"><span style="color:var(--color-neutral-700);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_esc(label)}</span><span style="font-weight:400;font-variant-numeric:tabular-nums;flex:none">${valStr}</span></div>
    <div style="height:7px;background:var(--color-neutral-200);border-radius:0;overflow:hidden"><div style="width:${pct}%;height:100%;background:${color};border-radius:0"></div></div>
  </div>`;
}
/* Metric catalogue for the top stat cards. Each customer follows what matters
   to them — value isn't forced. `get(r)` returns {val, sub} from the computed
   report object; grad/ic set the card's look. */
const REPORT_METRICS=[
  {k:'avgCycle',   get label(){ return i18t('rep_avg_cycle'); }, grad:'var(--grad-emerald)', ic:'clock', get:r=>({val:r.avgCycle!=null?Math.round(r.avgCycle)+'d':'—', sub:i18t('rep_signed_sampled',{n:r.cycleN})})},
  {k:'ageReview',  get label(){ return i18t('rep_avg_age_review'); },       grad:'var(--grad-amber)',   ic:'clock', get:r=>({val:Math.round(r.stageAge['Under Review']||0)+'d', get sub(){ return i18t('rep_time_on_cp'); }})},
  {k:'ageDraft',   get label(){ return i18t('rep_avg_age_draft'); },        grad:'var(--grad-steel)',   ic:'file',  get:r=>({val:Math.round(r.stageAge['Draft']||0)+'d', sub:i18t('rep_time_internal')})},
  {k:'renewal',    get label(){ return i18t('rep_renewal_pipeline_12'); },   grad:'var(--grad-emerald)', ic:'trend', get:r=>({val:fmtMoneyShort(r.pipeTotal), sub:i18tn('rep_months_expiries',r.pipeMonthsN,{n:r.pipeMonthsN})})},
  {k:'totalValue', get label(){ return i18t('rep_total_value'); },     grad:'var(--grad-steel)',   ic:'trend', get:r=>({val:fmtMoneyShort(r.totalValue), sub:r.active+' active contracts'})},
  {k:'count',      get label(){ return i18t('rep_contracts_total'); },         grad:'var(--grad-steel)',   ic:'file',  get:r=>({val:String(r.total), sub:r.active+' active'})},
  {k:'expiring',   get label(){ return i18t('rep_expiring_90'); },        grad:'var(--grad-amber)',   ic:'clock', get:r=>({val:String(r.expiring90), sub:'need attention'})},
  {k:'avgRisk',    get label(){ return i18t('rep_avg_risk'); },            grad:'var(--grad-ruby)',    ic:'shield',get:r=>({val:r.avgRisk!=null?String(Math.round(r.avgRisk)):'—', sub:r.highRisk+' high-risk (≥70)'})},
  {k:'openOb',     get label(){ return i18t('rep_open_obligations'); },          grad:'var(--grad-amber)',   ic:'list',  get:r=>({val:String(r.openOb), sub:r.overdueOb+' overdue'})},
];
/* "2026-01" as a month, named with its whole year. The two-digit form read as
   a day of the month on a screen full of real dates — see pfMonthLabel. The
   fallback strip below and the Chart.js version share this one function so the
   two renderings of the same bar can never label it differently. */
const repMonthLabel = m => { try{
    return new Date(m+'-01').toLocaleDateString(langLocale(),{month:'short',year:'numeric'});
  }catch(e){ return String(m); } };
const DEFAULT_REPORT_METRICS=['avgCycle','ageReview','ageDraft','renewal'];
function reportMetricSel(){
  const s=(state.settings&&Array.isArray(state.settings.reportMetrics))?state.settings.reportMetrics.slice():DEFAULT_REPORT_METRICS.slice();
  for(let i=0;i<4;i++) if(!REPORT_METRICS.some(m=>m.k===s[i])) s[i]=DEFAULT_REPORT_METRICS[i];
  return s;
}
const emptyMsg = t => `<p style="font-size:13px;color:var(--color-neutral-600)">${_esc(t)}</p>`;
/* Chart catalogue for the four lower cards. Like the hero stat cards, each card
   follows a KPI the user picks — value isn't forced. `render(r)` returns the bar
   HTML from the computed report object. */
const REPORT_CHARTS=[
  {k:'streamValue', get label(){ return i18t('rep_value_by_stream'); }, render:r=>{
    const e=Object.entries(r.byFolder).sort((a,b)=>b[1]-a[1]); const mx=Math.max(1,...e.map(x=>x[1]));
    return e.map(([k,v])=>bar(k,v,mx,fmtMoneyShort(v),'var(--color-accent)')).join('')||emptyMsg('No data.'); }},
  {k:'partyValue', get label(){ return i18t('rep_top_cp'); }, render:r=>{
    const mx=Math.max(1,...r.topParty.map(x=>x[1]));
    return r.topParty.map(([k,v])=>bar(k,v,mx,fmtMoneyShort(v),'var(--color-accent-700)')).join('')||emptyMsg('No data.'); }},
  {k:'renewalPipe', get label(){ return i18t('rep_renewal_next_12'); }, render:r=>{
    const months=Object.keys(r.pipeline).sort(); const mx=Math.max(1,...Object.values(r.pipeline));
    return months.length?months.map(m=>bar(repMonthLabel(m),r.pipeline[m],mx,fmtMoneyShort(r.pipeline[m]),'var(--st-green-dot)')).join(''):emptyMsg('Nothing expiring in the next 12 months.'); }},
  {k:'roundsType', get label(){ return i18t('rep_rounds_by_type'); }, render:r=>{
    const e=Object.entries(r.roundsByType).filter(([,v])=>v.n).sort((a,b)=>(b[1].rounds/b[1].n)-(a[1].rounds/a[1].n)).slice(0,8);
    const mx=Math.max(1,...Object.values(r.roundsByType).map(x=>x.rounds/x.n));
    return e.length?e.map(([k,v])=>bar(k+` (${v.n})`, v.rounds/v.n, mx, (v.rounds/v.n).toFixed(1),'var(--st-amber-dot)')).join(''):emptyMsg('No negotiation data.'); }},
  {k:'stageCount', get label(){ return i18t('rep_by_stage'); }, render:r=>{
    const order=['Draft','Under Review','Signed','Declined']; const e=order.filter(k=>r.byStatus[k]).map(k=>[k,r.byStatus[k]]);
    const mx=Math.max(1,...e.map(x=>x[1]));
    return e.length?e.map(([k,v])=>bar(statusLabel(k),v,mx,String(v),(STATUS_META[k]||{}).dot||'var(--color-accent)')).join(''):emptyMsg('No data.'); }},
  {k:'streamCount', get label(){ return i18t('rep_count_by_stream'); }, render:r=>{
    const e=Object.entries(r.countByFolder).sort((a,b)=>b[1]-a[1]); const mx=Math.max(1,...e.map(x=>x[1]));
    return e.length?e.map(([k,v])=>bar(k,v,mx,String(v),'var(--color-accent)')).join(''):emptyMsg('No data.'); }},
  {k:'riskBand', get label(){ return i18t('rep_by_risk'); }, render:r=>{
    const e=Object.entries(r.riskBands); const mx=Math.max(1,...e.map(x=>x[1]));
    const col={Low:'var(--st-green-dot)',Medium:'var(--st-amber-dot)',High:'var(--st-ruby-dot)'};
    return e.some(x=>x[1])?e.map(([k,v])=>bar(k,v,mx,String(v),col[k]||'var(--color-accent)')).join(''):emptyMsg('No data.'); }},
  {k:'obState', get label(){ return i18t('rep_obligations_by_status'); }, render:r=>{
    const e=Object.entries(r.obByState); const mx=Math.max(1,...e.map(x=>x[1]));
    const col={Overdue:'var(--st-ruby-dot)',Open:'var(--st-amber-dot)',Completed:'var(--st-green-dot)'};
    return e.some(x=>x[1])?e.map(([k,v])=>bar(k,v,mx,String(v),col[k]||'var(--color-accent)')).join(''):emptyMsg('No obligations tracked yet.'); }},
];
const DEFAULT_REPORT_CHARTS=['streamValue','partyValue','renewalPipe','roundsType'];
function reportChartSel(){
  const s=(state.settings&&Array.isArray(state.settings.reportCharts))?state.settings.reportCharts.slice():DEFAULT_REPORT_CHARTS.slice();
  for(let i=0;i<4;i++) if(!REPORT_CHARTS.some(c=>c.k===s[i])) s[i]=DEFAULT_REPORT_CHARTS[i];
  return s;
}
/* Shared soft dropdown for the report cards. A native <select> can't have its
   OS-drawn option list rounded/softened, so this renders a custom rounded menu
   that matches the dashboard. `variant`: 'hero' = translucent pill on the
   gradient stat cards, 'card' = shaded pill on the white chart cards (so it
   reads against the white surface). */
function reportDropdown(variant, kind, idx, catalog, selKey){
  const cur=catalog.find(x=>x.k===selKey)||catalog[idx];
  const hero=variant==='hero';
  const trig=hero
    ? 'background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.42);color:#fff;font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:600'
    : 'background:var(--color-bg);border:1px solid var(--color-divider);color:var(--color-text);font-size:15px;font-weight:600';
  const chev=hero?'#fff':'var(--color-neutral-500)';
  const opts=catalog.map(x=>`<button type="button" data-rd-opt="${kind}:${idx}:${x.k}" class="rd-opt${x.k===cur.k?' rd-opt-on':''}" style="display:block;width:100%;text-align:left;border:0;background:none;font:inherit;font-size:14px;padding:7px 11px;border-radius:0;cursor:pointer;white-space:nowrap">${_esc(x.label)}</button>`).join('');
  return `<div class="rd" style="position:relative;max-width:100%;${hero?'flex:1;min-width:0':'margin:0 0 10px'}">
    <button type="button" data-rd-trigger="${kind}:${idx}" class="rd-trigger rd-trigger-${hero?'hero':'card'}" title="${esc(hero?i18t('rep_choose_metric'):i18t('rep_choose_chart'))}" style="display:inline-flex;align-items:center;gap:8px;max-width:100%;border-radius:0;padding:4px 9px 4px 12px;cursor:pointer;line-height:1.25;transition:background .12s,border-color .12s;${trig}">
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_esc(cur.label)}</span>
      <span aria-hidden="true" class="rd-chev" style="flex:none;color:${chev};pointer-events:none">▾</span>
    </button>
    <div data-rd-menu="${kind}:${idx}" class="rd-menu" style="display:none;position:absolute;left:0;top:calc(100% + 6px);z-index:50;min-width:220px;max-width:300px;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);border-radius:0;padding:5px">${opts}</div>
  </div>`;
}
// Toggle / select / outside-close wiring for every reportDropdown on the page.
function wireReportDropdowns(){
  const closeAll=()=>document.querySelectorAll('[data-rd-menu]').forEach(m=>m.style.display='none');
  document.querySelectorAll('[data-rd-trigger]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation();
    const menu=document.querySelector('[data-rd-menu="'+btn.getAttribute('data-rd-trigger')+'"]');
    const open=menu&&menu.style.display==='block'; closeAll();
    if(menu&&!open) menu.style.display='block';
  }));
  document.querySelectorAll('[data-rd-opt]').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation(); closeAll();
    const p=b.getAttribute('data-rd-opt').split(':'), kind=p[0], idx=Number(p[1]), val=p[2];
    state.settings=state.settings||{};
    if(kind==='metric'){ const arr=reportMetricSel(); arr[idx]=val; state.settings.reportMetrics=arr; }
    else { const arr=reportChartSel(); arr[idx]=val; state.settings.reportCharts=arr; }
    if(typeof saveSettings==='function') saveSettings();
    renderReports();
  }));
  // one global outside-click closer, registered once so renders don't stack it
  if(!window.__rdWired){ window.__rdWired=true; document.addEventListener('click',()=>document.querySelectorAll('[data-rd-menu]').forEach(m=>m.style.display='none')); }
}
/* ---- E7 charts, drawn for real ----
   The eight selectable cards used to be hand-drawn CSS strips. They now build
   a genuine chart (through aiSimpleChart / the shared Copilot recipes, so a
   chart is ONE look everywhere) and keep the strip HTML as the fallback for a
   workspace with no outbound network — Chart.js arrives from a CDN. */
function repChartConfig(k, r){
  if(typeof aiSimpleChart!=='function') return null;
  const mLbl=repMonthLabel;
  if(k==='streamValue'){
    const e=Object.entries(r.byFolder).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
    return e.length?aiSimpleChart('hbar',e.map(x=>x[0]),e.map(x=>x[1]),{unit:'money'}):null;
  }
  if(k==='partyValue'){
    const e=r.topParty.filter(([,v])=>v>0);
    return e.length?aiSimpleChart('hbar',e.map(x=>x[0]),e.map(x=>x[1]),{unit:'money'}):null;
  }
  if(k==='renewalPipe'){
    const months=Object.keys(r.pipeline).sort();
    return months.length?aiSimpleChart('bar',months.map(mLbl),months.map(m=>r.pipeline[m]),{unit:'money'}):null;
  }
  if(k==='roundsType'){
    const e=Object.entries(r.roundsByType).filter(([,v])=>v.n).sort((a,b)=>(b[1].rounds/b[1].n)-(a[1].rounds/a[1].n)).slice(0,8);
    return e.length?aiSimpleChart('hbar',e.map(([kk,v])=>`${kk} (${v.n})`),e.map(([,v])=>Math.round(v.rounds/v.n*10)/10)):null;
  }
  // parts-of-a-whole cards ride the Copilot's own recipes, colours and all
  if(k==='stageCount') return (typeof AI_CHART_RECIPES==='object'&&AI_CHART_RECIPES.statusBreakdown)?AI_CHART_RECIPES.statusBreakdown():null;
  if(k==='riskBand')   return (typeof AI_CHART_RECIPES==='object'&&AI_CHART_RECIPES.riskBands)?AI_CHART_RECIPES.riskBands():null;
  if(k==='streamCount'){
    const e=Object.entries(r.countByFolder).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
    return e.length?aiSimpleChart('hbar',e.map(x=>x[0]),e.map(x=>x[1])):null;
  }
  if(k==='obState'){
    const e=Object.entries(r.obByState).filter(([,v])=>v>0);
    return e.length?aiSimpleChart('doughnut',e.map(x=>x[0]),e.map(x=>x[1])):null;
  }
  return null;
}
/* Hydrate the four cards after the view paints; every failure path lands on
   the CSS-strip fallback, never on an empty box. Instances live in the shared
   AI_CHARTS registry so the copy / PNG / CSV toolbar works here unchanged. */
async function repHydrateCharts(items){
  const bars=it=>{ const host=document.getElementById(it.key); if(host) host.innerHTML=it.fallback; };
  if(typeof aiChartLib!=='function'||typeof AI_CHARTS==='undefined'){ items.forEach(bars); return; }
  let Chart;
  try{ Chart=await aiChartLib(); }catch(_){ items.forEach(bars); return; }
  for(const it of items){
    const host=document.getElementById(it.key); if(!host) continue;
    const canvas=host.querySelector('canvas');
    if(!canvas||!it.cfg){ bars(it); continue; }
    if(typeof aiChartDestroy==='function') aiChartDestroy(it.key);
    try{ AI_CHARTS.set(it.key, new Chart(canvas.getContext('2d'), it.cfg)); }
    catch(_){ bars(it); }
  }
}
function renderReports(){
  const r=computeReports();
  // this month's portfolio figures, banked for "what changed since last month"
  if(typeof hatiRecordMonthlySnapshot==='function') try{ hatiRecordMonthlySnapshot(); }catch(_){}
  // a repaint replaces the canvases wholesale — destroy the old instances first
  if(typeof AI_CHARTS!=='undefined'&&typeof aiChartDestroy==='function')
    for(const k of Array.from(AI_CHARTS.keys())) if(String(k).startsWith('repchart-')) aiChartDestroy(k);

  // TOP — gradient hero stat cards. Each card's metric is user-selectable via
  // the dropdown built into its label, so revenue/value is never forced.
  const sel=reportMetricSel();
  const statSlot=(idx)=>{
    const m=REPORT_METRICS.find(x=>x.k===sel[idx])||REPORT_METRICS[idx];
    const d=m.get(r);
    return `
    <div style="display:flex;flex-direction:column;gap:10px;padding:15px 16px;border-radius:0;background:${m.grad};color:#fff;box-shadow:var(--shadow-sm)">
      <span style="display:flex;align-items:center;gap:9px">
        <span style="width:30px;height:30px;flex:none;border-radius:0;background:rgba(255,255,255,.22);display:grid;place-items:center;color:#fff">${icon(m.ic,'w-4 h-4',1.7)}</span>
        ${reportDropdown('hero','metric',idx,REPORT_METRICS,sel[idx])}
      </span>
      <span class="tnum" style="font-family:var(--font-mono);font-weight:600;font-size:25px;line-height:1.0;color:#fff">${d.val}</span>
      <span style="font-size:12px;color:rgba(255,255,255,.85)">${d.sub}</span>
    </div>`;
  };
  const stats=[statSlot(0),statSlot(1),statSlot(2),statSlot(3)].join('');

  // BELOW — 2×2 chart cards. Each card follows a KPI the user picks via the
  // dropdown built into its title, so no chart is forced. Real charts, with
  // the old CSS strips as the no-network fallback — see repHydrateCharts.
  const csel=reportChartSel();
  const chartItems=[];
  const chartSlot=(idx)=>{
    const ch=REPORT_CHARTS.find(x=>x.k===csel[idx])||REPORT_CHARTS[idx];
    const key=`repchart-${idx}`;
    let cfg=null; try{ cfg=repChartConfig(ch.k, r); }catch(_){ cfg=null; }
    const fallback=ch.render(r);
    chartItems.push({ key, cfg, fallback });
    const acts=(cfg&&typeof aiChartActionsHtml==='function')
      ?`<div style="position:relative;flex:none;width:76px;height:24px">${aiChartActionsHtml(key)}</div>`:'';
    return `
    <section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:0;padding:16px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
        ${reportDropdown('card','chart',idx,REPORT_CHARTS,csel[idx])}
        ${acts}
      </div>
      <div id="${key}">${cfg?`<div class="ai-chart-canvas" style="height:220px"><canvas></canvas></div>`:fallback}</div>
    </section>`;
  };

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:16px 18px 28px">
    <style>
      .rd-trigger-hero:hover{background:rgba(255,255,255,.30)!important;border-color:rgba(255,255,255,.7)!important}
      .rd-trigger-card:hover{background:var(--color-neutral-100)!important;border-color:var(--color-accent)!important}
      .rd-chev{font-size:15px;line-height:1}
      .rd-menu{animation:rdIn .1s ease}
      .rd-opt{color:var(--color-text)}
      .rd-opt:hover{background:var(--color-bg)}
      .rd-opt-on{background:var(--color-accent-100);color:var(--color-accent-800);font-weight:600}
      @keyframes rdIn{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
    </style>
    <div style="display:flex;flex-direction:column;gap:18px">
      <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap">
        <button type="button" id="rep-export" style="display:inline-flex;align-items:center;gap:7px;border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-neutral-700);font:inherit;font-size:13px;font-weight:600;border-radius:0;padding:7px 12px;cursor:pointer">${icon('download','w-3.5 h-3.5')}${i18t('rep_export_btn')}</button>
        ${''/* THE WEEKLY REVIEW sits beside the health report because they are the
               same kind of thing — a deterministic document, opened in a tab,
               with no model anywhere near it. The size lives next to the button
               rather than inside the document: choosing it afterwards would mean
               reading the wrong one first. */}
        <label style="display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:var(--color-neutral-700)">${i18t('rep_weekly_size')}
          <select id="rep-weekly-tier" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:6px 9px;font:inherit;font-size:13px;color:inherit;outline:none">
            ${(typeof WK_TIERS!=='undefined'?WK_TIERS:['skinny','tower','full']).map(t=>`<option value="${t}"${(typeof wkTier==='function'&&wkTier()===t)?' selected':''}>${i18t('wk_tier_'+t)}</option>`).join('')}
          </select></label>
        <button type="button" id="rep-weekly" style="display:inline-flex;align-items:center;gap:7px;border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-neutral-700);font:inherit;font-size:13px;font-weight:600;border-radius:0;padding:7px 12px;cursor:pointer">${icon('file','w-3.5 h-3.5')}${i18t('rep_weekly_btn')}</button>
        <button type="button" id="rep-health" style="display:inline-flex;align-items:center;gap:7px;border:0;background:var(--color-accent);color:#fff;font:inherit;font-size:13px;font-weight:600;border-radius:0;padding:7px 12px;cursor:pointer">${icon('file','w-3.5 h-3.5')}${i18t('rep_health_btn')}</button>
      </div>
      <section class="rp-stats" style="display:grid;gap:14px">
        ${stats}
      </section>
      <div class="rp-charts" style="display:grid;gap:18px">
        ${chartSlot(0)}
        ${chartSlot(1)}
        ${chartSlot(2)}
        ${chartSlot(3)}
      </div>
    </div>
  </div>`;
  wireReportDropdowns();
  /* The CSV export existed for a year with no way to reach it — the button IS
     the fix. The health report is the same document Copilot builds on request. */
  const ex=document.getElementById('rep-export');
  if(ex) ex.addEventListener('click',()=>exportReportsCsv(r));
  document.getElementById('rep-weekly-tier')?.addEventListener('change',e=>{
    if(typeof wkSetTier==='function') wkSetTier(e.target.value); });
  document.getElementById('rep-weekly')?.addEventListener('click',()=>{
    if(typeof openWeeklyReview==='function') openWeeklyReview(); });
  const hb=document.getElementById('rep-health');
  if(hb) hb.addEventListener('click',()=>{ if(typeof openHealthReport==='function') openHealthReport(); });
  repHydrateCharts(chartItems.filter(it=>it.cfg));
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
  lines.push(['Value by value stream',jxCurrency()].map(esc).join(','));
  Object.entries(r.byFolder).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>lines.push([k,Math.round(v)].map(esc).join(',')));
  lines.push([].join(','));
  lines.push(['Top counterparties',jxCurrency()].map(esc).join(','));
  r.topParty.forEach(([k,v])=>lines.push([k,Math.round(v)].map(esc).join(',')));
  lines.push([].join(','));
  lines.push(['Renewal pipeline month',jxCurrency()].map(esc).join(','));
  Object.keys(r.pipeline).sort().forEach(m=>lines.push([m,Math.round(r.pipeline[m])].map(esc).join(',')));
  downloadFile(`hati-reports-${new Date().toISOString().slice(0,10)}.csv`, lines.join('\n'), 'text/csv');
  toast(i18t('rep_exported_csv'));
}

Object.assign(window,{lifecycleEvents,firstAuditAt,repRaisedAt,repSignedAt,computeReports,renderReports,exportReportsCsv,repChartConfig,repHydrateCharts,repMonthLabel});
