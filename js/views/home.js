// HaTi — Home / Portfolio view (Industry redesign).
// The global command bar (index.html) now owns the title/subtitle/search/new;
// this module renders only the portfolio body into #content.
/* ============================================================
   VIEW: DASHBOARD / PORTFOLIO
   ============================================================ */
/* ---- KPI customization (per-user) ----------------------------------------
   The Portfolio KPI ribbon is a customizable catalog: the user picks which
   cards show, drags them to reorder, and the grid adapts to the count. The
   chosen subset + order is stored PER USER in localStorage so it survives
   reloads and stays independent of other teammates on the same server. */
const KPI_META={
  under_mgmt:  'Under management',
  active_value:'Active value',
  awaiting:    'Awaiting counterparty',
  expiring30:  'Expiring < 30 days',
  expiring60:  'Expiring < 60 days',
  expiring90:  'Expiring < 90 days',
  expired:     'Term already ended',
  highrisk:    'High-risk findings',
  avgcycle:    'Avg cycle · draft→signed',
};
const KPI_ALL_ORDER=['under_mgmt','active_value','awaiting','expiring30','expiring60','expiring90','expired','highrisk','avgcycle'];
const DEFAULT_KPI_SEL=['under_mgmt','active_value','awaiting','expiring90','expired','highrisk'];
/* Money-bearing metrics. A member without can_view_values receives no value
   from the server at all, so these cards would read "KES 0" — a wrong number,
   not a hidden one. They are removed from the catalog entirely rather than
   shown greyed out: an option that cannot be turned on is worse than an option
   that is not there. */
const KPI_MONEY=['active_value'];
const kpiMoneyOk=()=>typeof canViewValues!=='function'||canViewValues();
const kpiCatalogOrder=()=>kpiMoneyOk()?KPI_ALL_ORDER:KPI_ALL_ORDER.filter(id=>!KPI_MONEY.includes(id));
function kpiPrefsKey(){ const u=(typeof currentUser==='function')&&currentUser(); return 'hati.v1.kpis.'+((u&&u.id)||'anon'); }
/* Decisions due is the first thing on the page and used to start shut on every
   visit, so whatever came back overnight sat behind a click you had to know to
   make. It now opens by default; closing it is remembered, per user. */
function ddOpenKey(){ const u=(typeof currentUser==='function')&&currentUser(); return 'hati.v1.ddOpen.'+((u&&u.id)||'anon'); }
function ddStartsOpen(){ try{ const v=lsGet(ddOpenKey()); return v===null||v===undefined?true:!!v; }catch(_){ return true; } }
function getKpiSel(){ try{ const v=JSON.parse(localStorage.getItem(kpiPrefsKey())); return Array.isArray(v)?v.filter(id=>KPI_META[id]&&kpiCatalogOrder().includes(id)):[]; }catch(e){ return []; } }
function setKpiSel(arr){ try{ localStorage.setItem(kpiPrefsKey(), JSON.stringify(arr)); }catch(e){} }
function currentKpiSel(){ const s=getKpiSel(); return s.length?s:DEFAULT_KPI_SEL.filter(id=>kpiCatalogOrder().includes(id)); }
// Non-intrusive popover to toggle which KPI cards appear. Reorder is by dragging
// the cards themselves; this panel handles show/hide + reset.
function openKpiCustomizer(anchor){
  const prev=document.getElementById('kpi-cust-pop');
  if(prev){ prev.remove(); return; }   // second click on the gear closes it
  const sel=currentKpiSel();
  const pop=document.createElement('div');
  pop.id='kpi-cust-pop';
  pop.style.cssText='position:absolute;z-index:60;top:calc(100% + 6px);right:0;width:252px;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);border-radius:8px;padding:8px;';
  const row=id=>`
    <label style="display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:6px;cursor:pointer;font-size:12.5px;" onmouseover="this.style.background='rgba(89,128,166,.08)'" onmouseout="this.style.background='none'">
      <input type="checkbox" data-kpi-toggle="${id}" ${sel.includes(id)?'checked':''} style="width:15px;height:15px;accent-color:var(--color-accent);flex:none;"/>
      <span style="flex:1;">${KPI_META[id]}</span>
    </label>`;
  pop.innerHTML=`
    <div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-500);font-weight:700;padding:4px 8px 6px;">Show metrics</div>
    ${kpiCatalogOrder().map(row).join('')}
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid var(--color-divider);margin-top:6px;padding:8px 8px 4px;">
      <span style="font-size:10.5px;color:var(--color-neutral-500);">Drag cards to reorder</span>
      <button data-kpi-reset style="border:0;background:none;color:var(--color-accent-700);font-weight:600;font-size:11px;cursor:pointer;padding:0;">Reset</button>
    </div>`;
  anchor.parentElement.style.position='relative';
  anchor.parentElement.appendChild(pop);
  pop.querySelectorAll('[data-kpi-toggle]').forEach(cb=>cb.addEventListener('change',()=>{
    const id=cb.getAttribute('data-kpi-toggle');
    let cur=currentKpiSel();
    if(cb.checked){ if(!cur.includes(id)) cur.push(id); }
    else { if(cur.length<=1){ cb.checked=true; toast('Keep at least one metric','err'); return; } cur=cur.filter(x=>x!==id); }
    setKpiSel(cur); renderDashboard();
  }));
  pop.querySelector('[data-kpi-reset]')?.addEventListener('click',()=>{ setKpiSel(DEFAULT_KPI_SEL.slice()); renderDashboard(); });
  setTimeout(()=>{ const onDoc=e=>{ if(!pop.contains(e.target)&&e.target!==anchor&&!anchor.contains(e.target)){ pop.remove(); document.removeEventListener('click',onDoc,true); } }; document.addEventListener('click',onDoc,true); },0);
}
/* ---- THE THIRD PLACE A READINESS SIGNAL REACHES THE OWNER ------------------
   The waiting-on-you card on the dashboard, which is the one surface they see
   without opening anything.

   Read straight off the contract records rather than fetched: the signal
   arrives on the counterparty's response and applyResponse writes it onto the
   contract, so by the time this renders it is already there. Nothing new is
   polled and no endpoint was added for it.

   Split out of renderDashboard so both halves can be tested on their own — the
   dashboard proper needs the whole application shell around it, and the two
   questions worth asking here (which contracts, and what does it say) do not.

   A contract signed or declined since is not waiting on anybody and drops out.
   Newest signal first: the point of the list is what just landed. */
function readyToSignItems(cs){
  return (cs||[])
    .filter(c=>c && c.status!=='Signed' && c.status!=='Declined'
      && (window.negoReadySignal?negoReadySignal(c,'counterparty'):null))
    .map(c=>({ c, sig:negoReadySignal(c,'counterparty') }))
    /* A signal the change set has moved past does not belong on a list whose
       one instruction is "issue a signing link". The room and the Docs strip
       both still carry it, marked — this is the list of things actually ready
       for the next step, and that one is not. */
    .filter(x=>!x.sig.stale)
    .sort((a,b)=>String(b.sig.at||'').localeCompare(String(a.sig.at||'')));
}
/* Named "ready to sign" and never "signed", and it says outright that nothing
   has been. The whole point of the signal is that it is a message from the
   other side, not a state the deal has reached by itself. */
function readyToSignRowsHtml(items){
  if(!items||!items.length) return '';
  return `
    <div style="margin-bottom:10px" id="dd-ready-rows">
      <div style="font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#1e6b4d;margin-bottom:5px">Ready to sign — issue a signing link</div>
      ${items.slice(0,6).map(r=>`
        <button data-sel="${esc(r.c.id)}" style="display:flex;align-items:flex-start;gap:9px;width:100%;padding:7px 4px;border:0;border-bottom:1px solid rgba(29,31,32,.06);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit" onmouseover="this.style.background='rgba(29,31,32,.04)'" onmouseout="this.style.background='none'">
          <span style="flex:1;min-width:0">
            <span style="display:block;font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.c.name)}</span>
            <span style="display:block;font-size:10.5px;color:var(--color-neutral-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.sig.by||r.c.counterparty||'They')} signalled ready — nothing is signed yet</span>
          </span>
          <span style="font-size:10.5px;font-weight:600;font-family:var(--font-mono);color:#1e6b4d;flex:none">issue link</span>
        </button>`).join('')}
    </div>`;
}
function renderDashboard(){
  const cs=state.contracts;
  /* state.contracts, state.serverStats and state.shareOverview are already
     scoped and masked by the server (F1/F2) — every slice below is therefore
     scoped by construction. `money` is the last mile: it stops the dashboard
     printing totals derived from values it was never sent. */
  const money=kpiMoneyOk();
  const m=metrics();
  const countAll=(state.serverStats&&state.serverStats.total!=null)?state.serverStats.total:cs.length;
  const valOf=arr=>arr.reduce((s,c)=>s+Number(c.value||0),0);
  const dU=window.daysUntil||(iso=>Math.ceil((new Date(iso+'T00:00:00')-Date.now())/86400000));
  const idleOf=c=>{ const t=Date.parse(c.lastAction); return isNaN(t)?0:Math.max(0,Math.floor((Date.now()-t)/86400000)); };

  // ---- slices ----
  const STAGE_DEF=[
    {k:'Draft',        label:'Drafting',  color:'#98989b'},
    {k:'Under Review', label:'In Review', color:'#b8862b'},
    {k:'Signed',       label:'Executed',  color:'#2e8763'},
    {k:'Declined',     label:'Closed',    color:'#b0453c'},
  ];
  const stages=STAGE_DEF.map(s=>{ const list=cs.filter(c=>c.status===s.k); return {...s, n:list.length, val:valOf(list)}; });
  const stageTotal=stages.reduce((s,x)=>s+x.n,0)||1;

  // family-aware: a master agreement's real end date is whatever the latest
  // amendment says, and an amendment is not itself an expiring agreement
  const expiring=agreementsIn(cs).map(c=>({c,e:effectiveExpiry(c)})).filter(x=>x.e&&x.c.status!=='Declined')
    .map(x=>({c:x.c,d:dU(x.e),e:x.e})).filter(x=>x.d>=0&&x.d<=90).sort((a,b)=>a.d-b.d);
  // renewal decisions due (expiry − notice period), within 90 days, live contracts only
  const rdd=window.renewalDecisionDate||(()=>null);
  const decisions=cs.filter(c=>c.status!=='Declined').map(c=>{ const dd=rdd(c); return dd?{c,dd,d:dU(dd)}:null; }).filter(x=>x&&x.d>=0&&x.d<=90).sort((a,b)=>a.d-b.d);
  const fmtDDay=iso=>{ const t=Date.parse((iso||'')+'T00:00:00'); return isNaN(t)?iso:new Date(t).toLocaleDateString('en-KE',{day:'2-digit',month:'short',year:'numeric'}); };
  const highRisk=cs.filter(c=>c.status!=='Declined').map(c=>({c,r:contractRisk(c)})).filter(x=>x.r>=60).sort((a,b)=>b.r-a.r);
  const waiting=cs.filter(c=>c.status==='Under Review').map(c=>({c,idle:idleOf(c)})).sort((a,b)=>b.idle-a.idle);
  const reviewByRisk=cs.filter(c=>c.status==='Under Review').map(c=>({c,r:contractRisk(c)})).sort((a,b)=>b.r-a.r);
  // Awaiting counterparty = contracts that are OUT with a counterparty and not
  // yet signed — a live share in 'sent' or 'opened', so the ball is in their
  // court. This is the dispatch signal (state.shareByContract), independent of
  // the status column: a contract sent for signature counts as awaiting even if
  // its stage reads otherwise. Only meaningful in server mode (shares exist there).
  const awaiting=API_MODE()
    ? Object.values(state.shareByContract||{}).filter(s=>s&&(s.state==='sent'||s.state==='opened'))
    : [];
  const awaitingCount=awaiting.length;

  // ---- KPIs (customizable catalog) ----
  const newThisWeek=cs.filter(c=>(c.audit||[]).some(a=>/creat/i.test(a.action||'')&&(Date.now()-Date.parse(a.at||0))<7*864e5)).length;
  const stalled=awaiting.filter(s=>{ const t=Date.parse(s.at); return !isNaN(t)&&(Date.now()-t)>14*864e5; }).length;
  const onExecuted=highRisk.filter(x=>x.c.status==='Signed').length;
  // Expiry views: nearest-first buckets at 30 / 60 / 90 days (expiring is 0–90, sorted).
  /* Executed agreements whose term has already run out — the same read the
     status chip uses, so a row badged "Expired" is a row counted here. */
  const lapsed=agreementsIn(cs).filter(c=>!!(window.contractExpired&&contractExpired(c)))
    .sort((a,b)=>{ const ea=effectiveExpiry(a)||'', eb=effectiveExpiry(b)||''; return String(ea).localeCompare(String(eb)); });
  const expWithin=n=>expiring.filter(x=>x.d<=n);
  const exp30=expWithin(30), exp60=expWithin(60), exp90=expiring;
  const expVal=arr=>valOf(arr.map(x=>x.c));
  // The exposure figure on an expiring card is a money total. Without the
  // right, the card still earns its place — it just says WHEN instead of HOW
  // MUCH, which is the more actionable half anyway.
  const expDelta=arr=>money?`${fmtKESshort(expVal(arr))} exposure`
    :(arr.length?`soonest in ${arr[0].d}d`:'none due');
  // avg cycle draft→signed from audit where both stamps exist
  const cycles=cs.filter(c=>c.status==='Signed').map(c=>{
    const a=(c.audit||[]); const cr=a.find(x=>/creat/i.test(x.action||'')), sg=a.find(x=>/sign|execut|seal/i.test(x.action||''));
    if(cr&&sg){ const d=(Date.parse(sg.at)-Date.parse(cr.at))/864e5; return d>0?d:null; } return null;
  }).filter(x=>x!=null);
  const avgCycle=cycles.length?(cycles.reduce((s,x)=>s+x,0)/cycles.length).toFixed(1)+'d':'—';

  // Gradient hero cards — one semantic tone per KPI. The full catalog is keyed
  // by a stable id; the user's chosen subset + order comes from currentKpiSel().
  const G={steel:'var(--grad-steel)',green:'var(--grad-emerald)',amber:'var(--grad-amber)',ruby:'var(--grad-ruby)'};
  const KPI_CATALOG={
    under_mgmt:  {label:KPI_META.under_mgmt,   val:Number(countAll).toLocaleString('en-KE'),        delta:`+${newThisWeek} this week`,                                    grad:G.steel, ic:'building', go:{stage:'all'}},
    active_value:{label:KPI_META.active_value, val:fmtKESshort(m.totalValue),                        delta:`${Number(m.signed||0).toLocaleString('en-KE')} executed`,       grad:G.green, ic:'coins',    go:{stage:'all',sort:'value'}},
    awaiting:    {label:KPI_META.awaiting,     val:Number(awaitingCount).toLocaleString('en-KE'),    delta:`${stalled} stalled > 14d`,                                     grad:G.amber, ic:'clock',    go:{stage:'awaiting'}},
    expiring30:  {label:KPI_META.expiring30,   val:Number(exp30.length).toLocaleString('en-KE'),     delta:expDelta(exp30),                                               grad:G.ruby,  ic:'calendar', go:{stage:'all',sort:'expiry',view:'expiring30'}},
    expiring60:  {label:KPI_META.expiring60,   val:Number(exp60.length).toLocaleString('en-KE'),     delta:expDelta(exp60),                                               grad:G.amber, ic:'calendar', go:{stage:'all',sort:'expiry',view:'expiring60'}},
    expiring90:  {label:KPI_META.expiring90,   val:Number(exp90.length).toLocaleString('en-KE'),     delta:expDelta(exp90),                                               grad:G.amber, ic:'calendar', go:{stage:'all',sort:'expiry',view:'expiring90'}},
    /* THE BUCKET NOTHING FELL INTO. Every expiry card above filters on
       `days >= 0`, so a contract dropped out of all three on the morning its
       term ended — the one day it most needed somebody to look at it. */
    expired:     {label:KPI_META.expired,      val:Number(lapsed.length).toLocaleString('en-KE'),    delta:money?`${fmtKESshort(valOf(lapsed))} no longer active`:(lapsed.length?`longest ${Math.abs(dU(effectiveExpiry(lapsed[0])||''))}d ago`:'none'), grad:G.ruby,  ic:'alert',    go:{stage:'all',sort:'expiry',view:'expired'}},
    highrisk:    {label:KPI_META.highrisk,     val:Number(highRisk.length).toLocaleString('en-KE'),  delta:`${onExecuted} on executed paper`,                              grad:G.ruby,  ic:'alert',    go:{stage:'all',sort:'risk'}},
    avgcycle:    {label:KPI_META.avgcycle,     val:avgCycle,                                          delta:cycles.length?`${cycles.length} signed sampled`:'—',            grad:G.green, ic:'clock',    go:{stage:'Signed'}},
  };
  const kpiSel=currentKpiSel().filter(id=>KPI_CATALOG[id]);
  // Adaptive layout: the redesign's stat cards are wider and quieter than the
  // gradient blocks they replace, so they sit four to a row and wrap.
  /* Balanced rows, so a chosen sixth metric never lands alone on a second row:
     up to 4 sit in one row, 5–6 split 3+3 (or 3+2), more than 6 go four-up. */
  const kpiN=kpiSel.length||1, kpiCols=kpiN<=4?kpiN:(kpiN<=6?3:4);
  /* Tone is carried over from the card's old gradient, so a metric keeps the
     semantic colour it always had (steel = volume, emerald = good, amber =
     pending, ruby = risk) — now as an icon tile and a delta colour on a plain
     surface, per the new design. The tile tokens are theme-aware. */
  const TONE_OF=g=>g===G.green?'emerald':g===G.amber?'amber':g===G.ruby?'ruby':'steel';
  const TONE_BG={steel:'var(--tile-steel-bg)',emerald:'var(--tile-emerald-bg)',amber:'var(--tile-amber-bg)',ruby:'var(--tile-ruby-bg)'};
  const TONE_FG={steel:'var(--tile-steel-fg)',emerald:'var(--tile-emerald-fg)',amber:'var(--tile-amber-fg)',ruby:'var(--tile-ruby-fg)'};
  const kpiCard=id=>{ const k=KPI_CATALOG[id], t=TONE_OF(k.grad); return `
    <button data-kpi-id="${id}" draggable="true" class="hati-stat" style="position:relative;display:flex;flex-direction:column;gap:9px;align-items:stretch;border:1px solid var(--color-divider);border-radius:16px;background:var(--color-surface);padding:16px 18px;font:inherit;color:inherit;cursor:grab;text-align:left;box-shadow:var(--shadow-sm);transition:transform .2s var(--ease),box-shadow .2s var(--ease),border-color .15s,opacity .15s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow-md)';this.style.borderColor='color-mix(in srgb,var(--accent-solid) 35%,transparent)'" onmouseout="this.style.transform='none';this.style.boxShadow='var(--shadow-sm)';this.style.borderColor='var(--color-divider)'">
      <span style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <span style="font-size:11.5px;font-weight:600;color:var(--color-neutral-600);line-height:1.3;">${k.label}</span>
        <span style="width:28px;height:28px;flex:none;border-radius:9px;background:${TONE_BG[t]};color:${TONE_FG[t]};display:grid;place-items:center;">${icon(k.ic,'w-3.5 h-3.5',1.8)}</span>
      </span>
      <span style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;">
        <span class="tnum" style="font-weight:700;font-size:24px;line-height:1.05;letter-spacing:-.02em;color:var(--color-text);">${k.val}</span>
        <span style="font-size:11px;font-weight:600;color:${TONE_FG[t]};text-align:right;">${k.delta}</span>
      </span>
    </button>`; };
  const kpiHtml=kpiSel.map(kpiCard).join('');

  // ---- segmented stage bar + cards ----
  const segBar=stages.map((s,i)=>`<span style="width:${(s.n/stageTotal*100).toFixed(2)}%;background:${s.color};"></span>`).join('');
  const stageCards=stages.map(s=>`
    <button data-stage="${s.k}" style="display:flex;flex-direction:column;gap:3px;align-items:flex-start;border:1px solid var(--color-divider);border-radius:8px;background:var(--color-bg);padding:10px 12px;font:inherit;color:inherit;cursor:pointer;text-align:left;" onmouseover="this.style.borderColor='var(--color-accent)';this.style.background='rgba(89,128,166,.05)'" onmouseout="this.style.borderColor='var(--color-divider)';this.style.background='var(--color-bg)'">
      <span style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;"><span style="width:8px;height:8px;border-radius:50%;background:${s.color};"></span>${s.label}</span>
      <span class="tnum" style="font-family:var(--font-mono);font-weight:600;font-size:19px;line-height:1.1;">${s.n.toLocaleString('en-KE')}</span>
      <span style="font-size:10.5px;color:var(--color-neutral-600);">${money?`${s.n.toLocaleString('en-KE')} · ${fmtKESshort(s.val)}`:`${s.n.toLocaleString('en-KE')} contract${s.n===1?'':'s'}`}</span>
    </button>`).join('');

  // ---- needs your action ----
  const actionRows=reviewByRisk.slice(0,5).map(x=>{ const c=x.c;
    return `<button data-sel="${c.id}" style="display:flex;align-items:center;gap:9px;width:100%;padding:6px 4px;border:0;border-bottom:1px solid rgba(29,31,32,.07);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit;" onmouseover="this.style.background='rgba(29,31,32,.04)'" onmouseout="this.style.background='none'">
      <span style="font-family:var(--font-mono);font-size:11px;color:var(--color-neutral-600);width:56px;flex:none;">${c.id}</span>
      <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12.5px;font-weight:500;">${esc(c.name)}</span>
      <span style="font-size:11px;color:var(--color-neutral-600);width:110px;flex:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.counterparty||'—'}</span>
      ${riskChip(x.r)}
      ${window.contractStatusChip?contractStatusChip(c):statusChip(c.status)}
    </button>`; }).join('') || `<div style="font-size:11.5px;color:var(--color-neutral-600);padding:8px 4px;">Nothing waiting on your review.</div>`;

  // ---- renewal pipeline (6 mo) ----
  const now=new Date(); const months=[];
  for(let i=0;i<6;i++){ const d=new Date(now.getFullYear(),now.getMonth()+i,1); months.push({y:d.getFullYear(),mo:d.getMonth(),label:d.toLocaleDateString('en-KE',{month:'short'}),v:0,n:0}); }
  agreementsIn(cs).forEach(c=>{ const e=effectiveExpiry(c); if(!e||c.status==='Declined') return; const t=Date.parse(e); if(isNaN(t)) return; const d=new Date(t); const b=months.find(x=>x.y===d.getFullYear()&&x.mo===d.getMonth()); if(b){ b.v+=Number(c.value||0); b.n++; } });
  // Without the value right the pipeline is drawn from CONTRACT COUNTS, not
  // from a total of values the browser was never sent — the shape of the
  // renewal year is still readable, it just is not denominated in shillings.
  const pipeOf=x=>money?x.v:x.n;
  const pipeMax=Math.max(1,...months.map(pipeOf));
  const pipeTotal=months.reduce((s,x)=>s+x.v,0);
  const pipeCount=months.reduce((s,x)=>s+x.n,0);
  const pipeBars=months.map(x=>`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
      <span style="font-family:var(--font-mono);font-size:11px;width:44px;color:var(--color-neutral-700);">${x.label}</span>
      <div style="flex:1;height:8px;background:var(--color-neutral-200);border-radius:999px;overflow:hidden;"><div style="width:${(pipeOf(x)/pipeMax*100).toFixed(1)}%;height:100%;background:var(--color-accent);border-radius:999px;"></div></div>
      <span class="tnum" style="font-size:10.5px;width:66px;text-align:right;color:var(--color-neutral-700);">${money?(x.v?fmtKESshort(x.v).replace('KES ',''):'—'):(x.n||'—')}</span>
    </div>`).join('');
  const pipeSummary=money
    ? `${fmtKESshort(pipeTotal)} in expiries · ${pipeCount} contract${pipeCount===1?'':'s'}`
    : `${pipeCount} contract${pipeCount===1?'':'s'} expiring in the next 6 months`;

  // ---- approvals waiting ----
  /* This used to be "the five contracts that have sat in review longest",
     workspace-wide, with the amount printed next to each. That is a queue
     nobody owns: most rows were nothing to do with the person reading them,
     and every row broadcast a commercial figure.

     It is now the reader's OWN queue — the contracts whose approval chain is
     incomplete and where either (a) they are an eligible approver on a pending
     step under the approval rules, or (b) it is a contract they raised. The
     underlying list is already folder-scoped by the server; this narrows it to
     what the reader can actually act on. */
  const me=currentUser();
  const raisedByMe=c=>!!me&&(c.audit||[]).some(a=>/creat/i.test(a.action||'')&&a.user===me.name);
  const canApproveSomeStep=st=>!!me&&(st.chain||[]).some(s=>s.status!=='approved'&&s.status!=='rejected'
    &&(typeof userCanApprove==='function'?userCanApprove(s.approver,me):false));
  const myApprovals=cs.filter(c=>c.status!=='Signed'&&c.status!=='Declined').map(c=>{
    let st; try{ st=((window.approvalState)||approvalState)(c); }catch(e){ return null; }
    if(!st||!st.required||st.ok) return null;
    const mine=canApproveSomeStep(st), own=raisedByMe(c);
    if(!mine&&!own) return null;
    return { c, st, mine, own, idle:idleOf(c) };
  }).filter(Boolean).sort((a,b)=>b.idle-a.idle);
  const apprRows=myApprovals.slice(0,5).map(x=>{ const c=x.c; const dotc=x.idle>=30?'#b0453c':'#b8862b';
    // A rule's name is auto-generated from its condition ("Value ≥ KES 5M"),
    // so printing it would hand the spend threshold to someone who may not see
    // amounts. They get the generic label.
    const step=(money&&x.st.next&&x.st.next.name)||'Approval';
    const why=x.mine?'waiting on you':'yours · waiting on '+(x.st.approverLabel||'an approver');
    return `<button data-sel="${c.id}" style="display:flex;align-items:center;gap:8px;width:100%;padding:5px 0;border:0;border-bottom:1px solid rgba(29,31,32,.07);background:none;cursor:pointer;font:inherit;font-size:12px;text-align:left;color:inherit;">
      <span style="width:7px;height:7px;border-radius:50%;background:${dotc};flex:none;"></span>
      <span style="flex:1;min-width:0;">
        <span style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(step)} — ${esc(c.counterparty||c.name)}${(money&&isMonetary(c)&&c.value)?` (${fmtKESshort(c.value)})`:''}</span>
        <span style="display:block;font-size:10px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.id} · ${why}</span>
      </span>
      <span style="font-size:10.5px;color:var(--color-neutral-600);flex:none;">${x.idle}d</span>
    </button>`; }).join('') || `<div style="font-size:11.5px;color:var(--color-neutral-600);padding:6px 0;">Nothing is waiting on you.</div>`;

  // ---- compact attention row (used inside the Decisions-due panel) ----
  const attnRow=(c,tag,tagColor)=>`
    <button data-sel="${c.id}" style="display:flex;align-items:center;gap:8px;width:100%;padding:6px 4px;border:0;border-bottom:1px solid rgba(29,31,32,.06);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit;" onmouseover="this.style.background='rgba(29,31,32,.04)'" onmouseout="this.style.background='none'">
      <span style="flex:1;min-width:0;">
        <span style="display:block;font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(c.name)}</span>
        <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.id} · ${c.counterparty||'—'}</span>
      </span>
      <span style="font-size:10.5px;font-weight:600;font-family:var(--font-mono);color:${tagColor};flex:none;">${tag}</span>
    </button>`;
  // ---- decisions due (leads the page: the thing you open HaTi to act on) ----
  const decisionRows=decisions.slice(0,6).map(x=>{ const c=x.c, urgent=x.d<=30;
    return `<div style="display:flex;align-items:center;gap:11px;padding:9px 4px;border-bottom:1px solid rgba(29,31,32,.07)">
      <span style="width:9px;height:9px;border-radius:50%;background:${urgent?'#b0453c':'#b8862b'};flex:none"></span>
      <span style="flex:1;min-width:0">
        <span style="display:block;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</span>
        <span style="display:block;font-size:11px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.counterparty||'—'} · decide by ${fmtDDay(x.dd)}</span>
      </span>
      <span style="font-size:11.5px;font-weight:600;font-family:var(--font-mono);color:${urgent?'#8f322b':'#7d5a14'};flex:none;white-space:nowrap">${x.d===0?'today':'in '+x.d+'d'}</span>
      <button data-act-decide="${c.id}" class="ui-btn ui-btn-primary" style="font-size:11.5px;padding:5px 13px;flex:none">Act</button>
    </div>`; }).join('');
  // ---- out with counterparties (share dispatch traffic lights) ----
  const so=state.shareOverview||{}; const shCounts=so.counts||{};
  // Changes already reviewed are finished business — they leave the card
  // instead of impersonating work that still needs a decision.
  const shItems=(so.items||[]).filter(i=>i.state!=='reviewed');
  const needAttn=(shCounts.changes||0)+(shCounts.declined||0);
  const shPri={changes:0,declined:1,opened:2,sent:3,signed:4,reviewed:5,expired:6,revoked:7};
  shItems.sort((a,b)=>(shPri[a.state]??9)-(shPri[b.state]??9));
  /* A share that came back wanting something — changes or a decline — is not the
     same kind of item as one merely sent, and used to look like one. Those get an
     amber pulse on the count and a banded row, so what is waiting on you separates
     from what is waiting on them. */
  const needsYou=st=>st==='changes'||st==='declined';
  const shCountChip=(st,n)=>{ if(!n) return ''; const m=SHARE_META[st];
    return `<span class="badge${needsYou(st)?' needs-you':''}" style="background:${m.bg};color:${m.tx}"><span class="dot" style="background:${m.dot}"></span>${n} ${m.label.toLowerCase()}</span>`; };
  const shareRows=(API_MODE()?shItems:[]).slice(0,5).map(it=>`
    <button data-share-open="${it.contractId}"${needsYou(it.state)?' data-needs-you="1"':''} style="display:flex;align-items:center;gap:10px;width:100%;padding:6px 4px;border:0;border-bottom:1px solid rgba(29,31,32,.07);${needsYou(it.state)?'background:#fdf6e7;box-shadow:inset 3px 0 0 #b8862b;border-radius:5px;':'background:none;'}cursor:pointer;font:inherit;text-align:left;color:inherit;" onmouseover="this.style.background='rgba(29,31,32,.04)'" onmouseout="this.style.background='${needsYou(it.state)?'#fdf6e7':'none'}'">
      ${shareChip(it.state)}
      <span style="flex:1;min-width:0">
        <span style="display:block;font-size:12.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${it.name}</span>
        <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${it.contractId} · with ${it.recipientName||it.recipientEmail||it.counterparty||'counterparty'} · via ${it.channel==='whatsapp'?'WhatsApp':it.channel==='email'?'email':'link'}</span>
      </span>
      <span style="font-size:10px;color:var(--color-neutral-500);font-family:var(--font-mono);flex:none;white-space:nowrap">${fmtDT(it.at)}</span>
    </button>`).join('');
  const hasShares=API_MODE()&&shItems.length>0;
  // ---- Waiting longest (relocated from the deleted bottom cards into the empty
  // right-hand space inside the Decisions-due panel) ----
  const waitDdRows=waiting.slice(0,10).map(x=>attnRow(x.c,x.idle+'d idle',x.idle>=30?'#8f322b':'#7d5a14')).join('')
    || `<div class="dd-caught"><span style="color:#1e6b4d;display:inline-flex">${icon('check2','w-4 h-4')}</span>Nothing sitting in review.</div>`;
  // ---- Decisions due: one collapsible card merging renewal decisions with the
  // shares out for counterparty review — a compact summary that expands on click,
  // so the dashboard stays tight instead of two full-height stacked cards. ----
  /* THE THIRD PLACE A READINESS SIGNAL REACHES THE OWNER, and the one they see
     without opening anything: the waiting-on-you card on the dashboard.

     Read straight off the contract record rather than fetched — the signal
     arrives on the response and is applied by applyResponse, so by the time
     this renders it is already part of the contract. A contract that has been
     signed or declined since is not waiting on anybody, and drops out.

     Named "ready to sign", never "signed": the whole point of the signal is
     that it is a message, not a state the deal has reached. */
  const readyItems=readyToSignItems(cs);
  const ddCount=decisions.length+(hasShares?shItems.length:0)+(((state.waitingQuestions||{}).total)||0)+readyItems.length;
  const ddTone=(needAttn||decisions.some(x=>x.d<=30))?'#b8862b':'var(--color-accent)';
  const chevron=`<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
  const renewalStat=`<span class="dd-stat"><span class="dd-badge" style="${decisions.length?'background:#fbf4e3;color:#7d5a14':'background:#e8f4ee;color:#1e6b4d'}">${decisions.length?'•':'✓'}</span><b>${decisions.length}</b> renewal decision${decisions.length===1?'':'s'} <span style="color:var(--color-neutral-500)">· 90d</span></span>`;
  const shareStat=hasShares?`<span class="dd-sep"></span><span class="dd-stat"><span class="dd-badge" style="background:#eceae6;color:#5d5d60">•</span><b>${shItems.length}</b> out with counterparties</span>`:'';
  /* Questions the other side asked and nobody answered. These arrive through
     the light channel, which changes no document state — so without a count
     here the only two ways to learn of one are an email (the setting most
     workspaces have not configured) and opening that one contract. */
  const wq=(state.waitingQuestions&&Array.isArray(state.waitingQuestions.items))?state.waitingQuestions.items:[];
  const wqTotal=(state.waitingQuestions&&state.waitingQuestions.total)||0;
  const questionStat=wqTotal?`<span class="dd-sep"></span><span class="dd-stat"><span class="dd-badge" style="background:#fbf4e3;color:#7d5a14">•</span><b>${wqTotal}</b> question${wqTotal===1?'':'s'} waiting for you</span>`:'';
  /* ASK-AI, FROM THE PLACE THE QUESTION OCCURS TO YOU. A pre-filled question
     rather than an empty box: the hard part of using an assistant is knowing
     what it can answer, and the dashboard already knows what is worth asking
     about today. */
  const askDash=`<button id="dd-ask-ai" class="dd-more" style="padding:0;margin-left:auto;font-weight:600">Ask Copilot about this →</button>`;
  const readyStat=readyItems.length?`<span class="dd-sep"></span><span class="dd-stat" id="dd-ready-stat"><span class="dd-badge" style="background:#e8f4ee;color:#1e6b4d">•</span><b>${readyItems.length}</b> ready to sign</span>`:'';
  const readyRows=readyToSignRowsHtml(readyItems);
  const questionRows=wq.length?`
    <div style="margin-bottom:10px">
      <div style="font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#7d5a14;margin-bottom:5px">Questions waiting for you</div>
      ${wq.slice(0,6).map(q=>`
        <button data-sel="${esc(q.contractId)}" style="display:flex;align-items:flex-start;gap:9px;width:100%;padding:7px 4px;border:0;border-bottom:1px solid rgba(29,31,32,.06);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit" onmouseover="this.style.background='rgba(29,31,32,.04)'" onmouseout="this.style.background='none'">
          <span style="flex:1;min-width:0">
            <span style="display:block;font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(q.name)}</span>
            <span style="display:block;font-size:10.5px;color:var(--color-neutral-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc((q.latest&&q.latest.author)||q.counterparty||'They')}: “${esc((q.latest&&q.latest.body)||'')}”</span>
          </span>
          <span style="font-size:10.5px;font-weight:600;font-family:var(--font-mono);color:#7d5a14;flex:none">${q.count>1?q.count+' open':'reply'}</span>
        </button>`).join('')}
    </div>`:'';
  const decisionsSection=`
    <style>
      .dd-card{background:var(--color-surface);border:1px solid var(--color-divider);border-left:3px solid ${ddTone};box-shadow:var(--shadow-sm);border-radius:10px;overflow:hidden}
      .dd-card>summary{list-style:none;cursor:pointer;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
      .dd-card>summary::-webkit-details-marker{display:none}
      .dd-card>summary:focus-visible{outline:2px solid var(--color-accent);outline-offset:-2px}
      .dd-card>summary:hover{background:rgba(29,31,32,.02)}
      .dd-head{display:flex;align-items:center;gap:9px}
      .dd-ic{width:22px;height:22px;border-radius:6px;background:var(--color-accent-100);color:var(--color-accent-800);display:grid;place-items:center;flex:none}
      .dd-title{font-size:15px;font-weight:600}
      .dd-count{font-size:11px;font-weight:600;font-family:var(--font-mono);color:var(--color-accent-700);background:var(--color-accent-100);border-radius:999px;padding:1px 8px}
      .dd-chev{margin-left:auto;color:var(--color-neutral-500);display:inline-flex;transition:transform .2s}
      .dd-card[open] .dd-chev{transform:rotate(180deg)}
      .dd-stats{display:flex;flex-wrap:wrap;align-items:center;gap:6px 16px;padding-left:31px;font-size:12.5px;color:var(--color-neutral-600)}
      .dd-stat{display:inline-flex;align-items:center;gap:7px}
      .dd-stat b{color:var(--color-text);font-weight:600;font-family:var(--font-mono)}
      .dd-badge{width:15px;height:15px;border-radius:50%;display:grid;place-items:center;font-size:10px;flex:none}
      .dd-sep{width:1px;height:13px;background:var(--color-divider)}
      /* Contained footprint: the expanded panel never grows the card past this
         height — overflow scrolls INSIDE the panel instead of pushing the page. */
      .dd-detail{padding:2px 14px 14px;border-top:1px solid var(--color-divider);display:grid;grid-template-columns:1.55fr 1fr;gap:0 26px;max-height:min(46vh,360px);overflow-y:auto}
      .dd-col{min-width:0}
      .dd-col-r{border-left:1px solid var(--color-divider);padding-left:24px}
      @media (max-width:880px){ .dd-detail{grid-template-columns:1fr} .dd-col-r{border-left:0;padding-left:0} }
      .dd-eyebrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500);margin:13px 0 5px}
      .dd-caught{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--color-neutral-600);padding:3px 0}
      .dd-more{border:0;background:none;cursor:pointer;font-size:11px;color:var(--color-accent-700);font-weight:500;padding:6px 0 0}
      /* A slow breath, not a blink — and for anyone who has asked the system for
         less motion it becomes a static outline, since a flashing element on the
         first screen of the day is genuinely painful for some readers. */
      @keyframes dd-pulse{0%,100%{box-shadow:0 0 0 0 rgba(184,134,43,.6)}50%{box-shadow:0 0 0 6px rgba(184,134,43,0)}}
      .dd-eyebrow .badge.needs-you{animation:dd-pulse 1.9s ease-out infinite}
      @media (prefers-reduced-motion:reduce){
        .dd-eyebrow .badge.needs-you{animation:none;outline:2px solid #b8862b;outline-offset:2px}
      }
    </style>
    <details class="dd-card"${ddStartsOpen()?' open':''}>
      <summary>
        <span class="dd-head">
          <span class="dd-ic">${icon('clock','w-3.5 h-3.5')}</span>
          <span class="dd-title">Decisions due</span>
          ${ddCount?`<span class="dd-count">${ddCount}</span>`:''}
          <span class="dd-chev">${chevron}</span>
        </span>
        <span class="dd-stats">${renewalStat}${readyStat}${questionStat}${shareStat}</span>
      </summary>
      <div class="dd-detail">
        <div class="dd-col">
          <div class="dd-eyebrow" style="margin-top:6px">Renewal decisions · next 90 days${askDash}</div>
          ${decisions.length?decisionRows+(decisions.length>6?`<button data-open-decisions class="dd-more">See all in the calendar →</button>`:'')
            :`<div class="dd-caught"><span style="color:#1e6b4d;display:inline-flex">${icon('check2','w-4 h-4')}</span>None due — you're all caught up.</div>`}
          ${hasShares?`<div class="dd-eyebrow">Out with counterparties${needAttn?` · <span style="color:#7d5a14">${needAttn} need${needAttn===1?'s':''} your attention</span>`:''}<span style="flex:1"></span>${['sent','opened','changes','signed','declined'].map(st=>shCountChip(st,shCounts[st])).join(' ')}</div>${shareRows}`:''}
        </div>
        <div class="dd-col dd-col-r">
          ${readyRows}
          ${questionRows}
          <div class="dd-eyebrow"${questionRows?'':' style="margin-top:6px"'}>Waiting longest · in review${waiting.length?` · <span style="color:#7d5a14">${waiting.length}</span>`:''}</div>
          ${waitDdRows}
        </div>
      </div>
    </details>`;

  /* ---- OBLIGATIONS, ON THE SCREEN PEOPLE ACTUALLY OPEN ----

     The dashboard had no obligations panel at all. Every deliverable a contract
     carries — the quarterly report, the insurance certificate, the payment
     window — could only be seen by opening that contract and scrolling to its
     own panel. So the answer to "what do we owe this month, and what should we
     be chasing them for" lived in n places, one per contract, and nobody read
     it.

     Split ours from theirs, because they are different jobs. One is a task
     list; the other is a set of phone calls. */
  const obsAll=(window.openObligations?openObligations(45):[]);
  const obsOverdue=obsAll.filter(o=>o.days!=null&&o.days<0);
  const obsOurs=(window.obligationsOurs?obligationsOurs(obsAll):obsAll);
  const obsTheirs=(window.obligationsTheirs?obligationsTheirs(obsAll):[]);
  const obRow=o=>{
    const late=o.days!=null&&o.days<0;
    const when=o.days==null?'no date':late?`${Math.abs(o.days)}d ago`:`${o.days}d`;
    /* allObligations carries the counterparty along with each record, so a row
       from any contract can name who owes a "theirs" without looking it up —
       and cannot name the wrong one. */
    const owner=(window.obligationIsTheirs&&obligationIsTheirs(o))
      ? (o.counterparty||'the counterparty') : (o.assignee||'unassigned');
    return `<div style="display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(29,31,32,.07)">
      <button data-sel="${esc(o.cid)}" style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;padding:6px 2px;border:0;background:none;cursor:pointer;font:inherit;text-align:left;color:inherit">
        <span style="flex:none;width:7px;height:7px;border-radius:50%;background:${late?'#b0453c':'#2e8763'}"></span>
        <span style="flex:1;min-width:0">
          <span style="display:block;font-size:11.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(o.desc||'Obligation')}</span>
          <span style="display:block;font-size:10px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(o.cname||o.cid)} · ${esc(owner)}</span>
        </span>
      </button>
      ${(window.toggleObligationById&&o.id&&(!window.canEdit||canEdit()))
        ? `<button data-ob-done="${esc(o.id)}" data-ob-cid="${esc(o.cid)}" title="Mark this obligation complete" style="flex:none;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:2px 7px;font:inherit;font-size:10px;font-weight:600;color:var(--color-accent-700);cursor:pointer">Done</button>` : ''}
      <span style="flex:none;font-size:10px;font-weight:600;font-family:var(--font-mono);color:${late?'#8f322b':'var(--color-neutral-600)'};padding-right:2px">${when}</span>
    </div>`;
  };
  const obGroup=(title,list,empty)=>`
    <div style="margin-top:6px">
      <div style="display:flex;align-items:baseline;gap:6px;font-size:10.5px;color:var(--color-neutral-700);letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px">${title}<span style="flex:1"></span><span style="font-family:var(--font-mono);letter-spacing:0">${list.length}</span></div>
      ${list.length?list.slice(0,6).map(obRow).join(''):`<div style="font-size:11px;color:var(--color-neutral-600);padding:5px 2px">${empty}</div>`}
    </div>`;
  const obligationsSection=`
    <section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px;padding:12px 14px;">
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:4px;">
        <h4 style="font-size:15px;margin:0;">Obligations · next 45 days</h4>
        <span style="font-size:11px;color:${obsOverdue.length?'#8f322b':'var(--color-neutral-600)'};font-weight:${obsOverdue.length?600:400}">${obsOverdue.length?`${obsOverdue.length} overdue`:'nothing overdue'}<span style="color:var(--color-neutral-500);font-weight:400"> · </span><button id="ob-open-cal" style="border:0;background:none;padding:0;font:inherit;font-size:11px;color:var(--color-accent-700);font-weight:500;cursor:pointer">Open the calendar &rarr;</button></span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        ${obGroup('Ours to do', obsOurs, 'Nothing of ours is due.')}
        ${obGroup('Theirs to chase', obsTheirs, 'Nothing to chase them for.')}
      </div>
    </section>`;

  /* ---- WELCOME BANNER (redesign) ----
     The page used to open on a metric ribbon. It now opens on a statement of
     what this workspace is for, and the one button that starts real work. The
     sub-line names the jurisdiction actually in force (the header switcher),
     rather than claiming both. */
  const REGION_LABEL={SE:'Sweden 🇸🇪', KE:'Kenya 🇰🇪'};
  const regionNow=REGION_LABEL[state.region]||REGION_LABEL.KE;
  const heroSection=`
    <section style="position:relative;overflow:hidden;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding:24px 26px;border-radius:18px;background:linear-gradient(115deg,#0f172a 0%,#134e4a 62%,#0d9488 130%);border:1px solid #134e4a;box-shadow:var(--shadow-md);color:#fff;">
      <div style="position:absolute;right:-60px;top:-70px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(45,212,191,.28),transparent 68%);pointer-events:none;"></div>
      <div style="position:relative;min-width:0;display:flex;flex-direction:column;gap:7px;">
        <span style="align-self:flex-start;display:inline-flex;align-items:center;gap:7px;padding:3px 11px;border-radius:999px;background:rgba(20,184,166,.2);border:1px solid rgba(20,184,166,.34);color:#5eead4;font-size:11px;font-weight:600;">
          <span style="display:inline-flex;color:#5eead4;">${icon('check2','w-3 h-3',2)}</span>Multi-jurisdiction engine ready
        </span>
        <h2 style="margin:0;font-size:26px;line-height:1.15;font-weight:700;letter-spacing:-.02em;color:#fff;">SME Contract Control Center</h2>
        <p style="margin:0;font-size:12.5px;color:#cbd5e1;max-width:62ch;">Fast, accessible execution for ${regionNow} operations · ${Number(countAll).toLocaleString('en-KE')} contracts under management.</p>
      </div>
      <div style="position:relative;display:flex;align-items:center;gap:10px;flex:none;">
        <button id="hero-draft" style="display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border:0;border-radius:12px;background:var(--accent-solid);color:#fff;font:inherit;font-family:var(--font-heading);font-size:12.5px;font-weight:700;cursor:pointer;box-shadow:0 8px 20px -6px rgba(13,148,136,.7);transition:background .15s;" onmouseover="this.style.background='#14b8a6'" onmouseout="this.style.background='var(--accent-solid)'">
          ${icon('plus','w-3.5 h-3.5',2)} Draft new agreement
        </button>
      </div>
    </section>`;

  /* ---- ACTIVE CONTRACT LIFECYCLE PIPELINE (redesign) ----
     Three columns for the three things that actually happen to a contract, each
     showing the live records sitting in that stage. The column headers are the
     old stage filters, so every click-through the segmented bar used to offer
     still works. "Closed" is not a lifecycle stage you work in, so it keeps its
     place on the bar below rather than taking a fourth column. */
  const PIPE_DEF=[
    {k:'Draft',        n:1, title:'Draft & Template',  tone:'steel',   fg:'var(--color-neutral-700)', bd:'var(--color-divider)'},
    {k:'Under Review', n:2, title:'Review & Redline',  tone:'amber',   fg:'var(--st-amber-fg)',       bd:'color-mix(in srgb,#f59e0b 34%,transparent)'},
    {k:'Signed',       n:3, title:'Sign & Executed',   tone:'emerald', fg:'var(--st-green-fg)',       bd:'color-mix(in srgb,#10b981 34%,transparent)'},
  ];
  const pipeDocCard=(c,st)=>{
    const risky=st.k==='Under Review'&&contractRisk(c)>=60;
    const sub=st.k==='Signed'
      ? `<span style="color:var(--st-green-fg);font-weight:600;display:inline-flex;align-items:center;gap:4px;">${icon('check2','w-3 h-3',2)}${c.signedAt?'Executed':'Signed'}</span>`
      : `<span style="color:var(--color-neutral-500);">${esc(c.counterparty||'No counterparty yet')}</span>`;
    return `<button data-sel="${c.id}" style="display:block;width:100%;text-align:left;padding:9px 10px;border-radius:10px;background:var(--color-surface);border:1px solid ${st.bd};font:inherit;color:inherit;cursor:pointer;box-shadow:var(--shadow-sm);transition:border-color .15s;" onmouseover="this.style.borderColor='var(--accent-solid)'" onmouseout="this.style.borderColor='${st.bd}'">
      <span style="display:flex;align-items:flex-start;justify-content:space-between;gap:7px;">
        <span style="font-size:11.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;">${esc(c.name)}</span>
        ${risky?`<span style="flex:none;font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;background:var(--st-amber-bg);color:var(--st-amber-fg);">Action</span>`:''}
      </span>
      <span style="display:block;margin-top:2px;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sub}</span>
    </button>`;
  };
  const pipeCols=PIPE_DEF.map(st=>{
    const list=cs.filter(c=>c.status===st.k);
    const shown=(st.k==='Under Review'?list.slice().sort((a,b)=>contractRisk(b)-contractRisk(a)):list).slice(0,3);
    return `<div style="display:flex;flex-direction:column;gap:9px;padding:13px;border-radius:14px;background:var(--color-neutral-100);border:1px solid ${st.bd};min-width:0;">
      <button data-stage="${st.k}" style="display:flex;align-items:center;justify-content:space-between;gap:8px;border:0;background:none;padding:0;font:inherit;cursor:pointer;text-align:left;color:inherit;">
        <span style="font-size:11.5px;font-weight:700;color:${st.fg};">${st.n}. ${st.title}</span>
        <span style="flex:none;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--color-surface);border:1px solid var(--color-divider);color:${st.fg};">${list.length} doc${list.length===1?'':'s'}</span>
      </button>
      <div style="display:flex;flex-direction:column;gap:7px;">
        ${shown.map(c=>pipeDocCard(c,st)).join('')||`<div style="font-size:10.5px;color:var(--color-neutral-500);padding:4px 2px;">Nothing at this stage.</div>`}
        ${list.length>shown.length?`<button data-stage="${st.k}" style="border:0;background:none;padding:2px;font:inherit;font-size:10.5px;font-weight:600;color:var(--color-accent-600);cursor:pointer;text-align:left;">+ ${list.length-shown.length} more →</button>`:''}
      </div>
    </div>`;
  }).join('');
  const closedN=(stages.find(s=>s.k==='Declined')||{n:0}).n;
  const lifecycleSection=`
    <section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px;padding:16px 18px;min-width:0;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;">
        <h4 style="font-size:15px;margin:0;font-weight:700;">Active contract lifecycle pipeline</h4>
        <button data-open-register style="border:0;background:none;cursor:pointer;font:inherit;font-size:11.5px;color:var(--color-accent-600);font-weight:600;padding:0;">View full register →</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;">${pipeCols}</div>
      <div style="margin-top:14px;border-top:1px solid var(--color-divider);padding-top:11px;">
        <div style="display:flex;height:7px;overflow:hidden;margin-bottom:9px;border-radius:999px;">${segBar}</div>
        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;">${stageCards}</div>
        ${closedN?`<div style="font-size:10px;color:var(--color-neutral-500);margin-top:7px;">Closed and declined paper stays on the bar above and in the register — it is not a stage you work in.</div>`:''}
      </div>
      <div style="margin-top:13px;border-top:1px solid var(--color-divider);padding-top:11px;">
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;">
          <h6 style="margin:0;font-size:10.5px;color:var(--color-neutral-600);letter-spacing:.08em;text-transform:uppercase;font-weight:700;">Needs your action</h6>
          <span style="font-size:10px;color:var(--color-neutral-500);">sorted by risk</span>
        </div>
        ${actionRows}
      </div>
    </section>`;

  /* ---- LIVE AUDIT & ACTIVITY FEED (redesign) ----
     Real audit entries, not a decorative stream: the same feed the context
     panel reads, tinted by the category the entry already carries. */
  const ACT_TONE={green:['var(--tile-emerald-bg)','var(--tile-emerald-fg)','seal'],
                  amber:['var(--tile-amber-bg)','var(--tile-amber-fg)','clock'],
                  ruby:['var(--tile-ruby-bg)','var(--tile-ruby-fg)','alert'],
                  gray:['var(--st-gray-bg)','var(--st-gray-fg)','file'],
                  steel:['var(--tile-steel-bg)','var(--tile-steel-fg)','sparkle']};
  const acts=(window.buildActivityFeed?buildActivityFeed(6):[]);
  const actRows=acts.map(a=>{ const [bg,fg,ic]=ACT_TONE[a.cat]||ACT_TONE.steel;
    return `<button data-sel="${esc(a.id)}" style="display:flex;gap:11px;width:100%;padding:9px 2px;border:0;border-bottom:1px solid var(--color-divider);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit;">
      <span style="width:30px;height:30px;flex:none;border-radius:50%;background:${bg};color:${fg};display:grid;place-items:center;">${icon(ic,'w-3.5 h-3.5',1.8)}</span>
      <span style="flex:1;min-width:0;">
        <span style="display:block;font-size:11.5px;line-height:1.4;color:var(--color-text);">${esc(a.txt)}</span>
        <span style="display:block;margin-top:2px;font-size:10px;color:var(--color-neutral-500);font-family:var(--font-mono);">${esc(a.id)} · ${esc(a.when)}</span>
      </span>
    </button>`; }).join('')
    || `<div style="font-size:11.5px;color:var(--color-neutral-500);padding:10px 2px;">No activity recorded yet.</div>`;
  const activitySection=`
    <section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;min-width:0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <h4 style="font-size:15px;margin:0;font-weight:700;">Live audit &amp; activity</h4>
        <span class="live-ping" style="width:7px;height:7px;border-radius:50%;background:#10b981;flex:none;"></span>
      </div>
      <div style="flex:1;min-height:0;">${actRows}</div>
    </section>`;

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="display:flex;flex-direction:column;gap:18px;padding:16px 18px 28px;">
    ${window.emailSetupBannerHtml?emailSetupBannerHtml():''}

    <!-- Welcome banner — what this workspace is for, and the button that starts work -->
    ${heroSection}

    <!-- KPI ribbon — customizable gradient hero cards (pick, drag to reorder) -->
    <section>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500);font-weight:700;">Key metrics</span>
        <button id="kpi-customize" class="ui-btn" title="Choose which metrics to show" style="font-size:11px;padding:3px 10px;display:inline-flex;align-items:center;gap:6px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
          Customize
        </button>
      </div>
      <div id="kpi-grid" style="display:grid;grid-template-columns:repeat(${kpiCols},minmax(0,1fr));gap:14px;">
        ${kpiHtml}
      </div>
    </section>

    <!-- The lifecycle pipeline and the live feed, side by side (2:1) as in the
         design. Both cards size to their own content. -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;align-items:start;">
      ${lifecycleSection}
      ${activitySection}
    </div>

    <!-- Decisions due — renewal decisions + shares out with counterparties, one collapsible card -->
    ${decisionsSection}

    <!-- What the parties actually owe each other, split ours / theirs -->
    ${obligationsSection}

    <!-- Renewal pipeline + the reader's own approval queue -->
    <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:16px;align-items:start;">
      <section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px;padding:16px 18px;min-width:0;">
        <h4 style="font-size:15px;margin:0 0 10px;font-weight:700;">Renewal pipeline · 6 mo</h4>
        ${pipeBars}
        <div style="font-size:10.5px;color:var(--color-neutral-500);margin-top:6px;">${pipeSummary}</div>
      </section>
      <section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px;padding:16px 18px;min-width:0;">
        <h4 style="font-size:15px;margin:0 0 8px;font-weight:700;">Approvals waiting on you${myApprovals.length>5?` <span style="font-size:11px;font-weight:400;color:var(--color-neutral-500)">· ${myApprovals.length} total</span>`:''}</h4>
        <div class="scroll-thin" style="max-height:260px;overflow-y:auto;">${apprRows}</div>
      </section>
    </div>
  </div>`;

  // ---- wiring ----
  const SORT_DIR={value:-1,risk:-1,expiry:1};   // first-click direction for KPI drill-throughs
  const goReg=g=>{ const R=regState(); R.stage=g.stage||'all'; R.type='all'; R.view=g.view||null; if(g.sort){ R.sort=g.sort; R.dir=SORT_DIR[g.sort]||-1; } R.sel={}; setView('register'); };
  // KPI cards: click drills into the register; drag to reorder (persisted per user).
  const kgrid=document.getElementById('kpi-grid');
  let kpiDragId=null;
  kgrid?.querySelectorAll('[data-kpi-id]').forEach(el=>{
    const id=el.getAttribute('data-kpi-id');
    el.addEventListener('click',()=>{ if(KPI_CATALOG[id]) goReg(KPI_CATALOG[id].go); });
    el.addEventListener('dragstart',e=>{ kpiDragId=id; el.style.opacity='.35'; try{ e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain',id); }catch(_){} });
    el.addEventListener('dragend',()=>{ kpiDragId=null; el.style.opacity=''; });
    el.addEventListener('dragover',e=>{ e.preventDefault(); try{ e.dataTransfer.dropEffect='move'; }catch(_){} });
    el.addEventListener('drop',e=>{ e.preventDefault();
      const overId=id, dId=kpiDragId||(e.dataTransfer&&e.dataTransfer.getData('text/plain'));
      if(!dId||dId===overId) return;
      const arr=currentKpiSel().filter(x=>KPI_CATALOG[x]);
      const from=arr.indexOf(dId), to=arr.indexOf(overId);
      if(from<0||to<0) return;
      arr.splice(from,1); arr.splice(to,0,dId); setKpiSel(arr); renderDashboard();
    });
  });
  document.getElementById('kpi-customize')?.addEventListener('click',e=>{ e.stopPropagation(); openKpiCustomizer(e.currentTarget); });
  /* The banner's one button opens the same new-contract menu the command bar
     owns, rather than a second way of creating paper. */
  document.getElementById('hero-draft')?.addEventListener('click',e=>{
    e.stopPropagation();
    const nb=document.getElementById('cmd-new'), nm=document.getElementById('new-menu');
    if(nm){ if(window.renderNewMenu) renderNewMenu(); nm.classList.remove('hidden'); }
    else if(nb){ nb.click(); }
  });
  document.querySelectorAll('[data-stage]').forEach(el=>el.addEventListener('click',()=>{ const R=regState(); R.stage=el.getAttribute('data-stage'); R.type='all'; R.sel={}; setView('register'); }));
  document.querySelectorAll('[data-open-register]').forEach(el=>el.addEventListener('click',()=>{ const R=regState(); R.stage='all'; R.sel={}; setView('register'); }));
  document.getElementById('dd-ask-ai')?.addEventListener('click',e=>{
    e.preventDefault(); e.stopPropagation();
    if(typeof openAI==='function') openAI('What needs my attention in the next 90 days — renewals, expiries and anything overdue?');
  });
  document.querySelectorAll('[data-sel]').forEach(el=>el.addEventListener('click',()=>selectContract(el.getAttribute('data-sel'))));
  document.querySelectorAll('[data-act-decide]').forEach(el=>el.addEventListener('click',()=>openWorkspace(el.getAttribute('data-act-decide'))));
  document.querySelectorAll('[data-share-open]').forEach(el=>el.addEventListener('click',()=>openWorkspace(el.getAttribute('data-share-open'))));
  document.querySelectorAll('[data-open-decisions]').forEach(el=>el.addEventListener('click',()=>setView('calendar')));
  document.getElementById('ob-open-cal')?.addEventListener('click',e=>{ e.stopPropagation(); setView('calendar'); });
  /* Through the shared verb in js/obligations.js, exactly as the calendar does:
     one place decides what completing means, and one refresh puts every surface
     that counts them back in step — this panel included. */
  document.querySelectorAll('[data-ob-done]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    const o=toggleObligationById(el.getAttribute('data-ob-cid'), el.getAttribute('data-ob-done'), { from:'dashboard' });
    if(o) toast(`Marked complete: ${o.desc}`);
  }));
  // Decisions due opens on arrival; closing it is remembered, so the preference
  // belongs to the reader rather than being re-imposed on every render.
  document.querySelector('.dd-card')?.addEventListener('toggle',e=>{
    try{ lsSet(ddOpenKey(), !!e.currentTarget.open); }catch(_){}
  });
  if(window.wireEmailSetupBanner) wireEmailSetupBanner();
  setActiveNav('dashboard');
}

Object.assign(window,{renderDashboard});
