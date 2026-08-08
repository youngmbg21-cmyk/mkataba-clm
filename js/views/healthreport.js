// HaTi — the Portfolio Health Report. Globals window-attached like every module.
//
// A NAMED DOCUMENT WITH A FIXED SHAPE, not a long chat message. Ask Copilot
// for "a report on the health of my portfolio" or press the button on the
// Reports screen — the SAME document opens either way, in its own tab, with a
// Print / save-as-PDF button at the top. Seven sections, always in the same
// order, so by the third month a reader knows exactly where to look.
//
// TWO RULES CARRIED OVER FROM THE REST OF THE PRODUCT:
//  · Every figure is read from live state through the same functions the
//    screens use (computeReports, effectiveExpiry, obState, contractRisk,
//    intelFrictionStats). Nothing here re-derives a number its own way.
//  · The AI never touches this document. Copilot only OPENS it; the content
//    is deterministic. That is why it works in basic (no-key) mode too.
//
// MONEY: kpiMoneyOk() gates every amount. A reader whose account may not see
// values gets counts and dates — and the report says so, because an exported
// file travels further than a screen.

/* ---------- the monthly snapshot ----------
   "What changed since last month" needs a last month. Recorded once per
   calendar month, in THIS BROWSER's localStorage (a server copy is a later
   step — the report says which snapshot it compared against). Called from
   renderReports and from every report build, so visiting either is enough. */
const HR_SNAPS_KEY='hati.v1.monthlySnaps';
function _hrLsGet(k){ try{ return (typeof lsGet==='function')?lsGet(k):JSON.parse(localStorage.getItem(k)); }catch(_){ return null; } }
function _hrLsSet(k,v){ try{ if(typeof lsSet==='function') lsSet(k,v); else localStorage.setItem(k,JSON.stringify(v)); }catch(_){} }
function hatiMonthKey(d){ const x=d||new Date(); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`; }
function hatiMonthlySnapshots(){ const v=_hrLsGet(HR_SNAPS_KEY); return Array.isArray(v)?v:[]; }
function hatiRecordMonthlySnapshot(){
  const cs=(window.state&&Array.isArray(state.contracts))?state.contracts:[];
  if(!cs.length) return null;             // an empty boot is not a portfolio
  const month=hatiMonthKey();
  const snaps=hatiMonthlySnapshots();
  if(snaps.some(s=>s&&s.month===month)) return null;
  const live=cs.filter(c=>c.status!=='Declined');
  const _obState=(typeof obState==='function')?obState:(o=>(o&&o.status==='done')?'done':'open');
  const obs=(typeof allObligations==='function')?allObligations().filter(o=>_obState(o)!=='done'):[];
  const snap={ month, at:new Date().toISOString(),
    total:cs.length,
    signed:cs.filter(c=>c.status==='Signed').length,
    underReview:cs.filter(c=>c.status==='Under Review').length,
    drafts:cs.filter(c=>c.status==='Draft').length,
    totalValue:live.reduce((s,c)=>s+Number(c.value||0),0),
    openOb:obs.length,
    overdueOb:obs.filter(o=>_obState(o)==='overdue').length,
    highRisk:(typeof contractRisk==='function')?cs.filter(c=>contractRisk(c)>=70).length:0 };
  snaps.push(snap);
  _hrLsSet(HR_SNAPS_KEY, snaps.slice(-24));   // two years is plenty
  return snap;
}
function hatiPrevMonthlySnapshot(){
  const month=hatiMonthKey();
  const prev=hatiMonthlySnapshots().filter(s=>s&&s.month&&s.month<month);
  return prev.length?prev[prev.length-1]:null;
}

/* ---------- the score ----------
   Starts at 100; each finding subtracts points, each line capped so one bad
   habit cannot zero the score alone. THE WORKINGS ARE PART OF THE REPORT —
   a number nobody can take apart is a number nobody senior will trust. */
function healthScoreOf(d){
  const ded=[];
  const add=(key,n,per,cap)=>{ if(n>0) ded.push({ key, n, pts:Math.min(cap,n*per) }); };
  add('hr_ded_overdue',  d.overdueOb.length,        4, 20);
  add('hr_ded_lapsed',   d.lapsed.length,           5, 20);
  add('hr_ded_expiring', d.expiring90.length,       2, 14);
  add('hr_ded_risk',     d.highRisk70,              4, 20);
  add('hr_ded_idle',     d.stuckReview.filter(x=>x.idle>14).length, 3, 15);
  add('hr_ded_deadlock', d.deadlocks,               5, 15);
  const score=Math.max(5, 100-ded.reduce((s,x)=>s+x.pts,0));
  const gradeKey=score>=85?'hr_grade_strong':score>=70?'hr_grade_good':score>=55?'hr_grade_fair':'hr_grade_weak';
  return { score, gradeKey, deductions:ded };
}

/* ---------- the data, gathered once ---------- */
function healthReportData(){
  const cs=(window.state&&Array.isArray(state.contracts))?state.contracts:[];
  const r=(typeof computeReports==='function')?computeReports():{byFolder:{},topParty:[],pipeline:{},roundsByType:{},byStatus:{},riskBands:{},obByState:{},total:cs.length,active:0,totalValue:0,avgCycle:null,cycleN:0,openOb:0,overdueOb:0};
  const money=(typeof kpiMoneyOk==='function')?kpiMoneyOk():(typeof canViewValues==='function'?canViewValues():true);
  const exp=c=>(typeof effectiveExpiry==='function'?effectiveExpiry(c):c.expiry)||null;
  const dU=iso=>(typeof daysUntil==='function'?daysUntil(iso):Math.ceil((new Date(iso+'T00:00:00')-Date.now())/86400000));
  const live=cs.filter(c=>c.status!=='Declined');
  const ag=(typeof agreementsIn==='function')?agreementsIn(live):live;

  const withExp=ag.map(c=>({c,e:exp(c)})).filter(x=>x.e).map(x=>({...x,d:dU(x.e)}));
  const expiring90=withExp.filter(x=>x.d>=0&&x.d<=90).sort((a,b)=>a.d-b.d);
  const lapsed=withExp.filter(x=>x.d<0&&x.c.status==='Signed');
  const win=n=>expiring90.filter(x=>x.d<=n).length;

  const idleOf=c=>{ const t=Date.parse(c.lastAction); return isNaN(t)?0:Math.max(0,Math.floor((Date.now()-t)/86400000)); };
  const stuckReview=cs.filter(c=>c.status==='Under Review').map(c=>({c,idle:idleOf(c)})).sort((a,b)=>b.idle-a.idle);
  const awaiting=(typeof API_MODE==='function'&&API_MODE())
    ?Object.values(state.shareByContract||{}).filter(s=>s&&(s.state==='sent'||s.state==='opened')).length:0;

  const risk=(typeof contractRisk==='function')?contractRisk:(()=>0);
  const risky=live.map(c=>({c,r:risk(c)})).filter(x=>x.r>=60).sort((a,b)=>b.r-a.r);
  const findingsOf=c=>(typeof openFindings==='function'&&c.scan)?openFindings(c).slice(0,2).map(f=>f.title):[];

  const _obState=(typeof obState==='function')?obState:(o=>(o&&o.status==='done')?'done':'open');
  const _obDue=o=>(typeof obligationDue==='function'?obligationDue(o):(o&&o.due)||null);
  const obs=(typeof allObligations==='function')?allObligations().filter(o=>_obState(o)!=='done'):[];
  const overdueOb=obs.filter(o=>_obState(o)==='overdue');

  const rdd=(typeof renewalDecisionDate==='function')?renewalDecisionDate:(()=>null);
  const decisions=live.map(c=>{ const dd=rdd(c); return dd?{c,dd,d:dU(dd)}:null; })
    .filter(x=>x&&x.d>=0&&x.d<=90).sort((a,b)=>a.d-b.d);

  let friction=null;
  try{ if(typeof intelFrictionStats==='function'){ const f=intelFrictionStats(null); if(f&&f.deals) friction=f; } }catch(_){}

  const d={ generatedAt:new Date(), cs, live, r, money,
    expiring90, lapsed, win30:win(30), win60:win(60), win90:expiring90.length,
    stuckReview, awaiting, risky, findingsOf,
    highRisk70:live.filter(c=>risk(c)>=70).length,
    obs, overdueOb, decisions,
    deadlocks:friction?Number(friction.deadlocks)||0:0,
    friction,
    prev:hatiPrevMonthlySnapshot() };
  d.health=healthScoreOf(d);
  return d;
}

/* ---------- charts, as pictures ----------
   The report is a standalone document, so its charts travel as embedded PNGs
   drawn OFFSCREEN from the same recipes the Copilot uses. Always drawn on the
   LIGHT palette: a report is printed and forwarded, and dark-theme ink on
   white paper is unreadable — so the dark class steps aside for the build. */
async function _hrChartImages(){
  const out={};
  if(typeof aiChartLib!=='function'||typeof AI_CHART_RECIPES!=='object') return out;
  let Chart; try{ Chart=await aiChartLib(); }catch(_){ return out; }
  const money=(typeof kpiMoneyOk==='function')?kpiMoneyOk():true;
  const kinds=[['status','statusBreakdown'],['expiry','expiryTimeline']]
    .concat(money?[['party','valueByCounterparty'],['renewal','renewalPipeline']]:[]);
  const rootCl=document.documentElement.classList;
  const wasDark=!!(rootCl&&rootCl.contains&&rootCl.contains('dark'));
  if(wasDark) rootCl.remove('dark');
  if(typeof _acRefreshPalette==='function') try{ _acRefreshPalette(); }catch(_){}
  const host=document.createElement('div');
  host.style.cssText='position:fixed;left:-10000px;top:0;width:840px;pointer-events:none;opacity:0';
  document.body.appendChild(host);
  try{
    for(const [slot,kind] of kinds){
      let cfg=null;
      try{ cfg=AI_CHART_RECIPES[kind]&&AI_CHART_RECIPES[kind](); }catch(_){ cfg=null; }
      if(!cfg) continue;
      const cv=document.createElement('canvas');
      cv.width=820; cv.height=330;
      host.appendChild(cv);
      cfg.options=cfg.options||{};
      cfg.options.responsive=false;
      cfg.options.animation=false;
      cfg.options.devicePixelRatio=2;
      try{
        const ch=new Chart(cv.getContext('2d'), cfg);
        out[slot]=ch.toBase64Image('image/png',1);
        ch.destroy();
      }catch(_){}
      cv.remove();
    }
  } finally {
    host.remove();
    if(wasDark) rootCl.add('dark');
    if(typeof _acRefreshPalette==='function') try{ _acRefreshPalette(); }catch(_){}
  }
  return out;
}

/* ---------- the document ---------- */
const _hrEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
function _hrMoney(n){ return (typeof fmtMoneyShort==='function')?fmtMoneyShort(n):String(n); }
function _hrDate(iso){ const t=Date.parse(String(iso||'')+'T00:00:00'); return isNaN(t)?_hrEsc(iso):new Date(t).toLocaleDateString(jxLocale(),{day:'2-digit',month:'short',year:'numeric'}); }
function _hrSign(n){ return (n>0?'+':'')+n; }

function buildHealthReportHtml(d, imgs){
  const t=k=>i18t(k);
  const money=d.money;
  const chartImg=(slot,titleKey)=>imgs&&imgs[slot]
    ?`<figure><figcaption>${_hrEsc(t(titleKey))}</figcaption><img src="${imgs[slot]}" alt="${_hrEsc(t(titleKey))}"></figure>`:'';
  const table=(cols,rows)=>rows.length
    ?`<table><thead><tr>${cols.map(c=>`<th>${_hrEsc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(cells=>`<tr>${cells.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`:'';
  const pct=v=>v==null?'n/a':Math.round(v*100)+'%';

  // §1 — deltas against last month's snapshot (if this browser has one)
  let delta;
  if(!d.prev) delta=`<p class="muted">${_hrEsc(t('hr_delta_first'))}</p>`;
  else{
    const p=d.prev;
    const live=d.live.reduce((s,c)=>s+Number(c.value||0),0);
    const bits=[
      `${_hrSign(d.cs.length-p.total)} ${_hrEsc(t('hr_d_contracts'))}`,
      `${_hrSign(d.cs.filter(c=>c.status==='Signed').length-(p.signed||0))} ${_hrEsc(t('hr_d_signed'))}`,
      money?`${(live-(p.totalValue||0))>=0?'+':'−'}${_hrEsc(_hrMoney(Math.abs(live-(p.totalValue||0))))} ${_hrEsc(t('hr_d_value'))}`:'',
      `${_hrSign(d.obs.length-(p.openOb||0))} ${_hrEsc(t('hr_d_openob'))}`,
    ].filter(Boolean);
    delta=`<p>${_hrEsc(i18t('hr_delta_since',{month:p.month}))} ${bits.join(' · ')}</p>`;
  }

  // the workings behind the score
  const workings=d.health.deductions.length
    ?table([t('hr_col_what'),t('hr_col_count'),t('hr_col_points')],
      d.health.deductions.map(x=>[_hrEsc(t(x.key)),String(x.n),'−'+x.pts]))
    :`<p class="muted">${_hrEsc(t('hr_no_deductions'))}</p>`;

  // §2 — where the money is
  const streams=Object.entries(d.r.byFolder||{}).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  const moneySection=money
    ?`${chartImg('party','hr_party_chart')}
      ${streams.length?`<h3>${_hrEsc(t('hr_by_stream'))}</h3>${table([t('hr_col_stream'),t('hr_col_value')],streams.map(([k,v])=>[_hrEsc(k),_hrEsc(_hrMoney(v))]))}`:''}`
    :`<p class="muted">${_hrEsc(t('hr_no_money_note'))}</p>`;

  // §3 — expiring
  const expRows=d.expiring90.slice(0,10).map(x=>[
    _hrEsc(x.c.name||x.c.id), _hrEsc(x.c.counterparty||'—'), _hrDate(x.e), String(x.d),
    ...(money?[x.c.value?_hrEsc(_hrMoney(x.c.value)):'—']:[]) ]);
  const expCols=[t('hr_col_contract'),t('hr_col_party'),t('hr_col_date'),t('hr_col_days'),...(money?[t('hr_col_value')]:[])];

  // §4 — stuck
  const stuckRows=d.stuckReview.slice(0,8).map(x=>[_hrEsc(x.c.name||x.c.id),_hrEsc(x.c.counterparty||'—'),String(x.idle)]);
  const deadNames=(d.friction&&Array.isArray(d.friction.deadlockList))
    ?d.friction.deadlockList.map(x=>x&&(x.name||x.id||x)).filter(v=>typeof v==='string'&&v).slice(0,4):[];

  // §5 — risky
  const riskRows=d.risky.slice(0,8).map(x=>{
    const f=d.findingsOf(x.c);
    return [_hrEsc(x.c.name||x.c.id),_hrEsc(x.c.counterparty||'—'),String(Math.round(x.r)),_hrEsc(f.join('; ')||'—')];
  });

  // §6 — friction
  let frictionHtml=`<p class="muted">${_hrEsc(t('hr_friction_none'))}</p>`;
  if(d.friction){
    const f=d.friction;
    frictionHtml=`
      <p>${_hrEsc(i18t('hr_friction_sum',{deals:f.deals,rounds:f.avgRounds.toFixed(1)}))}${f.avgDays!=null?` · ${_hrEsc(i18t('hr_friction_days',{days:f.avgDays<1?'<1':String(Math.round(f.avgDays))}))}`:''}</p>
      <p>${_hrEsc(i18t('hr_friction_accept',{ours:pct(f.oursAcceptShare),theirs:pct(f.theirsAcceptShare)}))}</p>
      ${f.clauses&&f.clauses.length?`<h3>${_hrEsc(t('hr_friction_clauses'))}</h3><ul>${f.clauses.slice(0,5).map(cl=>`<li>${_hrEsc(cl.label)} — ${pct(cl.share)}</li>`).join('')}</ul>`:''}
      ${f.counterparties&&f.counterparties.length?`<h3>${_hrEsc(t('hr_friction_slowest'))}</h3><ul>${f.counterparties.slice(0,3).map(cp=>`<li>${_hrEsc(cp.name)} — ${cp.avgRounds.toFixed(1)}</li>`).join('')}</ul>`:''}`;
  }

  // §7 — actions
  const actParts=[];
  if(d.decisions.length) actParts.push(`<h3>${_hrEsc(t('hr_act_renewals'))}</h3>${table([t('hr_col_contract'),t('hr_col_party'),t('hr_col_date'),t('hr_col_days')],d.decisions.slice(0,8).map(x=>[_hrEsc(x.c.name||x.c.id),_hrEsc(x.c.counterparty||'—'),_hrDate(x.dd),String(x.d)]))}`);
  if(d.overdueOb.length) actParts.push(`<h3>${_hrEsc(t('hr_act_overdue'))}</h3><ul>${d.overdueOb.slice(0,8).map(o=>`<li>${_hrEsc(o.desc||'—')}${o.cname?` — ${_hrEsc(o.cname)}`:''}</li>`).join('')}</ul>`);

  const gen=d.generatedAt.toLocaleDateString(jxLocale(),{day:'2-digit',month:'long',year:'numeric'});
  const chartsMissing=!imgs||!Object.keys(imgs).length;

  return `<!doctype html>
<html lang="${(typeof langId==='function'?langId():'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${_hrEsc(t('hr_title'))}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;color:#1f2937;background:#fff;margin:0;
    font-size:14px;line-height:1.6}
  .page{max-width:820px;margin:0 auto;padding:36px 28px 64px}
  .toolbar{display:flex;justify-content:flex-end;gap:10px;padding:14px 0;border-bottom:1px solid #e5e7eb;
    font-family:-apple-system,'Segoe UI',Arial,sans-serif}
  .toolbar button{border:0;background:#0d9488;color:#fff;font:inherit;font-size:13px;font-weight:600;
    border-radius:6px;padding:8px 16px;cursor:pointer}
  h1{font-size:26px;margin:26px 0 4px}
  .sub{color:#6b7280;font-size:12.5px;margin:0 0 22px;font-family:-apple-system,'Segoe UI',Arial,sans-serif}
  h2{font-size:16px;margin:30px 0 8px;padding-top:14px;border-top:1px solid #e5e7eb}
  h2 .no{color:#9ca3af;font-weight:400;margin-right:8px}
  h3{font-size:13px;margin:14px 0 6px;font-family:-apple-system,'Segoe UI',Arial,sans-serif;
    text-transform:uppercase;letter-spacing:.05em;color:#4b5563}
  .muted{color:#6b7280}
  .scorebox{display:flex;align-items:baseline;gap:18px;flex-wrap:wrap;margin:6px 0 10px}
  .score{font-size:54px;font-weight:700;line-height:1}
  .score.s-strong{color:#0f7a58}.score.s-good{color:#0f7a58}.score.s-fair{color:#b8791b}.score.s-weak{color:#b91c1c}
  .grade{font-size:16px;font-weight:600}
  table{border-collapse:collapse;width:100%;margin:8px 0 14px;font-size:13px;
    font-family:-apple-system,'Segoe UI',Arial,sans-serif}
  th{font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;text-align:left;
    border-bottom:1px solid #d1d5db;padding:5px 10px 5px 0}
  td{border-bottom:1px solid #f3f4f6;padding:6px 10px 6px 0;vertical-align:top}
  figure{margin:14px 0;page-break-inside:avoid}
  figcaption{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:6px;
    font-family:-apple-system,'Segoe UI',Arial,sans-serif}
  figure img{max-width:100%;border:1px solid #e5e7eb;border-radius:6px}
  ul{margin:6px 0 14px;padding-left:20px}
  li{margin:3px 0}
  .foot{margin-top:34px;padding-top:12px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:11.5px;
    font-family:-apple-system,'Segoe UI',Arial,sans-serif}
  @media print{ .toolbar{display:none} .page{padding:0} body{font-size:12.5px} }
</style>
</head>
<body>
<div class="page">
  <div class="toolbar"><button onclick="window.print()">${_hrEsc(t('hr_print'))}</button></div>
  <h1>${_hrEsc(t('hr_title'))}</h1>
  <p class="sub">${_hrEsc(i18t('hr_generated',{date:gen,n:d.cs.length}))}</p>

  <div class="scorebox">
    <span class="score s-${d.health.gradeKey.replace('hr_grade_','')}">${d.health.score}</span>
    <span class="grade">${_hrEsc(t(d.health.gradeKey))} <span class="muted">${_hrEsc(t('hr_out_of'))}</span></span>
  </div>
  ${chartImg('status','hr_status_chart')}

  <h2><span class="no">1</span>${_hrEsc(t('hr_s1'))}</h2>
  ${delta}
  <h3>${_hrEsc(t('hr_workings'))}</h3>
  <p class="muted" style="font-size:12px">${_hrEsc(t('hr_workings_note'))}</p>
  ${workings}

  <h2><span class="no">2</span>${_hrEsc(t('hr_s2'))}</h2>
  ${moneySection}

  <h2><span class="no">3</span>${_hrEsc(t('hr_s3'))}</h2>
  <p>${_hrEsc(i18t('hr_exp_within',{n30:d.win30,n60:d.win60,n90:d.win90}))}</p>
  ${expRows.length?table(expCols,expRows):`<p class="muted">${_hrEsc(t('hr_expiring_none'))}</p>`}
  ${chartImg('expiry','hr_expiry_chart')}

  <h2><span class="no">4</span>${_hrEsc(t('hr_s4'))}</h2>
  ${stuckRows.length?`<h3>${_hrEsc(t('hr_stuck_review'))}</h3>${table([t('hr_col_contract'),t('hr_col_party'),t('hr_col_idle')],stuckRows)}`:`<p class="muted">${_hrEsc(t('hr_stuck_none'))}</p>`}
  ${d.awaiting?`<p>${_hrEsc(i18tn('hr_awaiting',d.awaiting,{n:d.awaiting}))}</p>`:''}
  ${deadNames.length?`<p>${_hrEsc(t('hr_deadlocks'))} ${deadNames.map(_hrEsc).join(', ')}</p>`:''}

  <h2><span class="no">5</span>${_hrEsc(t('hr_s5'))}</h2>
  ${riskRows.length?table([t('hr_col_contract'),t('hr_col_party'),t('hr_col_risk'),t('hr_risk_top_findings')],riskRows):`<p class="muted">${_hrEsc(t('hr_risky_none'))}</p>`}

  <h2><span class="no">6</span>${_hrEsc(t('hr_s6'))}</h2>
  ${frictionHtml}

  <h2><span class="no">7</span>${_hrEsc(t('hr_s7'))}</h2>
  ${actParts.length?actParts.join(''):`<p class="muted">${_hrEsc(t('hr_act_none'))}</p>`}
  ${money?chartImg('renewal','hr_renewal_chart'):''}

  <div class="foot">
    ${_hrEsc(t('hr_facts_note'))}
    ${chartsMissing?' '+_hrEsc(t('hr_charts_offline')):''}
  </div>
</div>
</body>
</html>`;
}

/* ---------- opening it ----------
   The window opens SYNCHRONOUSLY inside the user's click/Enter — a popup
   opened after an await is a popup the browser blocks — and is then filled
   once the chart images are ready. Returns true if a window opened. */
function openHealthReport(){
  try{ hatiRecordMonthlySnapshot(); }catch(_){}
  let w=null;
  try{ w=window.open('','_blank'); }catch(_){ w=null; }
  if(!w){ if(typeof toast==='function') toast(i18t('hr_popup_blocked'),'err'); return false; }
  try{
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${_hrEsc(i18t('hr_title'))}</title></head><body style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;padding:40px;color:#374151">${_hrEsc(i18t('hr_building'))}</body></html>`);
  }catch(_){}
  (async()=>{
    let imgs={};
    try{ imgs=await _hrChartImages(); }catch(_){ imgs={}; }
    let html='';
    try{ html=buildHealthReportHtml(healthReportData(), imgs); }
    catch(e){
      html=`<!doctype html><body style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;padding:40px;color:#374151">${_hrEsc(i18t('hr_failed'))}</body>`;
    }
    try{ w.document.open(); w.document.write(html); w.document.close(); }catch(_){}
  })();
  return true;
}

Object.assign(window,{ hatiRecordMonthlySnapshot, hatiMonthlySnapshots, hatiPrevMonthlySnapshot,
  hatiMonthKey, healthScoreOf, healthReportData, buildHealthReportHtml, openHealthReport });
