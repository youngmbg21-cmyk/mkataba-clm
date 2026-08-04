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
  under_mgmt:  'Active contracts',
  active_value:'Active value',
  awaiting:    'Awaiting counterparty',
  approvals:   'Pending approvals',
  compliance:  'Compliance rating',
  expiring30:  'Expiring < 30 days',
  expiring60:  'Expiring < 60 days',
  expiring90:  'Expiring < 90 days',
  expired:     'Term already ended',
  highrisk:    'High-risk findings',
  avgcycle:    'Avg turnaround time',
};
const KPI_ALL_ORDER=['under_mgmt','active_value','avgcycle','approvals','compliance','awaiting','expiring30','expiring60','expiring90','expired','highrisk'];
/* The four the design leads on: how much paper is live, how fast it moves,
   what is stuck on a person, and how much of it is clean. Everything else in
   the catalog stays one click away under Customize. */
const DEFAULT_KPI_SEL=['under_mgmt','avgcycle','approvals','compliance'];
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
    <label style="display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:6px;cursor:pointer;font-size:12.5px;" onmouseover="this.style.background='color-mix(in srgb,var(--color-accent) 9%,transparent)'" onmouseout="this.style.background='none'">
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
      <div style="font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--st-green-fg);margin-bottom:5px">Ready to sign — issue a signing link</div>
      ${items.slice(0,6).map(r=>`
        <button data-sel="${esc(r.c.id)}" style="display:flex;align-items:flex-start;gap:9px;width:100%;padding:7px 4px;border:0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 7%,transparent);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit" onmouseover="this.style.background='color-mix(in srgb,var(--color-text) 5%,transparent)'" onmouseout="this.style.background='none'">
          <span style="flex:1;min-width:0">
            <span style="display:block;font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.c.name)}</span>
            <span style="display:block;font-size:10.5px;color:var(--color-neutral-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.sig.by||r.c.counterparty||'They')} signalled ready — nothing is signed yet</span>
          </span>
          <span style="font-size:10.5px;font-weight:600;font-family:var(--font-mono);color:var(--st-green-fg);flex:none">issue link</span>
        </button>`).join('')}
    </div>`;
}
/* ============================================================
   GETTING STARTED (WO N3)
   ============================================================
   The checklist that walks a new workspace to first value: add a contract →
   let Copilot scan it → send it → watch it come back signed. Every tick is
   read from REAL state on every render — nothing is stored about progress,
   so the card can never disagree with the portfolio. Only the dismissal is
   remembered (per user, same pattern as the KPI picker), because "seen and
   closed" is the one fact the data cannot carry.

   Demo paper does not count. A workspace seeded with the sample portfolio
   arrives with pre-signed contracts, and a checklist born fully ticked
   teaches nothing — so "add" and "signed" require a NON-seed contract
   (gsIsSeed). "Scan" and "send" count on any contract, seeds included:
   scanning or sending a sample IS the customer learning the action. */
const gsIsSeed=c=>!!(c&&(c.seeded||c.hash==='PRE-SEEDED'||c.signatory==='A. Otieno, Director'
  ||(c.audit||[]).some(a=>a&&a.detail==='Seeded as sample data')));
function gsKey(){ const u=(typeof currentUser==='function')&&currentUser(); return 'hati.v1.gs-hidden.'+((u&&u.id)||'anon'); }
function gsHidden(){ try{ return localStorage.getItem(gsKey())==='1'; }catch(e){ return false; } }
function gsHide(){ try{ localStorage.setItem(gsKey(),'1'); }catch(e){} }
function gsSteps(){
  const cs=state.contracts||[];
  const mine=cs.filter(c=>!gsIsSeed(c));
  /* Sent: the share overview covers server mode (light rows carry no audit);
     the audit scan covers local mode, where every row is fully loaded. */
  const sent=Object.keys(state.shareByContract||{}).length>0
    ||cs.some(c=>(c.audit||[]).some(a=>a&&a.action==='Shared'));
  return [
    {k:'add',  t:'Add your first contract',      d:'Draft one from a template, or upload one you received.', done:mine.length>0},
    {k:'scan', t:'Let Copilot scan a contract',  d:'A read-through that flags risky terms in plain English.', done:cs.some(c=>c.scan)},
    {k:'send', t:'Send one to the other side',   d:'They get a secure link — no account needed.',             done:sent},
    {k:'sign', t:'Watch it come back signed',    d:'Sealed, filed and on the record.',                        done:mine.some(c=>c.status==='Signed')},
  ];
}
/* Where each step's button lands. Prefers the customer's own paper over a
   seed, and never invents a target — a step with nowhere to go renders as
   text, not as a button that shrugs. */
function gsGo(k,anchor){
  const cs=state.contracts||[];
  if(k==='add'){
    if(window.openNewMenu) openNewMenu(anchor);
    return;
  }
  let c=null;
  if(k==='scan') c=cs.find(x=>!gsIsSeed(x)&&!x.scan)||cs.find(x=>!x.scan)||cs[0];
  if(k==='send') c=cs.find(x=>!gsIsSeed(x)&&x.status!=='Signed')||cs.find(x=>x.status!=='Signed')||cs[0];
  if(k==='sign'){ const sb=state.shareByContract||{};
    c=cs.find(x=>sb[x.id])||cs.find(x=>x.status==='Under Review'); }
  if(c&&window.openWorkspace) openWorkspace(c.id);
}
function gettingStartedHtml(){
  if(gsHidden()) return '';
  /* Viewers cannot draft, send or sign, so a to-do list of those verbs would
     only advertise what their role withholds. */
  if(typeof canEdit==='function'&&!canEdit()) return '';
  const cs=state.contracts||[];
  /* An empty workspace is the first-run welcome's moment (U-2, above the
     fold with the same three entry points) — one guide at a time. */
  if(!cs.length) return '';
  const steps=gsSteps();
  const done=steps.filter(s=>s.done).length;
  const all=done===steps.length;
  const cur=steps.find(s=>!s.done);
  const CIRCLE='width:20px;height:20px;flex:none;display:grid;place-items:center;border-radius:50%;font-size:10px;font-weight:700;font-family:var(--font-mono)';
  const rows=steps.map((s,i)=>{
    const isCur=!all&&cur&&s.k===cur.k;
    const dot=s.done
      ?`<span style="${CIRCLE};background:var(--st-green-dot);color:#fff">${icon('check2','w-3 h-3')}</span>`
      :`<span style="${CIRCLE};background:none;border:2px solid ${isCur?'var(--color-accent)':'var(--color-divider)'};color:${isCur?'var(--color-accent-700)':'var(--color-neutral-500)'}">${i+1}</span>`;
    const tone=s.done?'var(--color-neutral-500)':isCur?'var(--color-text)':'var(--color-neutral-500)';
    const body=`${dot}
      <span style="min-width:0;flex:1">
        <span style="display:block;font-size:12.5px;font-weight:600;color:${tone};${s.done?'text-decoration:line-through;text-decoration-color:var(--color-neutral-400);':''}">${s.t}</span>
        ${isCur?`<span style="display:block;font-size:11px;color:var(--color-neutral-600);line-height:1.45">${s.d}</span>`:''}
      </span>
      ${isCur&&(s.k!=='sign'||gsGoTargetExists(s.k))?`<span style="flex:none;font-size:11.5px;font-weight:600;color:var(--color-accent-700)">Go &rarr;</span>`:''}`;
    /* The whole current row is the button — a target the size of the step,
       not a link the size of an arrow. */
    return isCur&&(s.k!=='sign'||gsGoTargetExists(s.k))
      ?`<button data-gs-go="${s.k}" style="display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border:1px solid color-mix(in srgb,var(--color-accent) 25%,transparent);border-radius:9px;background:color-mix(in srgb,var(--color-accent) 6%,transparent);cursor:pointer;font:inherit;text-align:left;color:inherit">${body}</button>`
      :`<div style="display:flex;align-items:center;gap:10px;padding:8px 10px">${body}</div>`;
  }).join('');
  return `
    <section id="gs-card" style="border:1px solid var(--color-divider);border-radius:14px;background:var(--color-surface);padding:16px 18px 14px;">
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:8px">
        <h2 style="margin:0;font-family:var(--font-heading);font-weight:700;font-size:14.5px;color:var(--color-text)">${all?'You’re set up — first contract signed ⚡':'Getting started'}</h2>
        <span style="font-size:11px;color:var(--color-neutral-600);font-family:var(--font-mono)">${done} of ${steps.length} done</span>
        <span style="flex:1"></span>
        <button id="gs-dismiss" class="ui-btn" title="Hide this checklist — it will not come back" style="font-size:11px;padding:3px 10px">${all?'Done — hide this':'Hide'}</button>
      </div>
      <div style="height:6px;border-radius:4px;background:var(--color-neutral-100);margin-bottom:10px"><i style="display:block;height:100%;border-radius:4px;background:var(--color-accent);width:${Math.round(done/steps.length*100)}%"></i></div>
      ${all?`<p style="margin:0;font-size:12px;color:var(--color-neutral-600);line-height:1.55">Your workspace has done the whole journey — a contract in, scanned, sent and signed. Everything from here is more of the same.</p>`:rows}
    </section>`;
}
/* "Watch it come back signed" is a wait, not a task — it is a button only
   when there is a contract out with the other side to go and look at. */
function gsGoTargetExists(k){
  if(k!=='sign') return true;
  const cs=state.contracts||[], sb=state.shareByContract||{};
  return !!(cs.find(x=>sb[x.id])||cs.find(x=>x.status==='Under Review'));
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
    {k:'Draft',        label:'Drafting',  color:'var(--st-gray-dot)'},
    {k:'Under Review', label:'In Review', color:'var(--st-amber-dot)'},
    {k:'Signed',       label:'Executed',  color:'var(--st-green-dot)'},
    {k:'Declined',     label:'Closed',    color:'var(--st-ruby-dot)'},
  ];
  const stages=STAGE_DEF.map(s=>{ const list=cs.filter(c=>c.status===s.k); return {...s, n:list.length, val:valOf(list)}; });

  // family-aware: a master agreement's real end date is whatever the latest
  // amendment says, and an amendment is not itself an expiring agreement
  const expiring=agreementsIn(cs).map(c=>({c,e:effectiveExpiry(c)})).filter(x=>x.e&&x.c.status!=='Declined')
    .map(x=>({c:x.c,d:dU(x.e),e:x.e})).filter(x=>x.d>=0&&x.d<=90).sort((a,b)=>a.d-b.d);
  // renewal decisions due (expiry − notice period), within 90 days, live contracts only
  const rdd=window.renewalDecisionDate||(()=>null);
  const decisions=cs.filter(c=>c.status!=='Declined').map(c=>{ const dd=rdd(c); return dd?{c,dd,d:dU(dd)}:null; }).filter(x=>x&&x.d>=0&&x.d<=90).sort((a,b)=>a.d-b.d);
  /* Paper that has sat in review, longest first — the other half of what a
     person has to decide about, alongside the renewals. */
  const waitingLongest=cs.filter(c=>c.status==='Under Review').map(c=>({c,idle:idleOf(c)})).sort((a,b)=>b.idle-a.idle);
  const fmtDDay=iso=>{ const t=Date.parse((iso||'')+'T00:00:00'); return isNaN(t)?iso:new Date(t).toLocaleDateString('en-KE',{day:'2-digit',month:'short',year:'numeric'}); };
  const highRisk=cs.filter(c=>c.status!=='Declined').map(c=>({c,r:contractRisk(c)})).filter(x=>x.r>=60).sort((a,b)=>b.r-a.r);
  // Awaiting counterparty = contracts that are OUT with a counterparty and not
  // yet signed — a live share in 'sent' or 'opened', so the ball is in their
  // court. This is the dispatch signal (state.shareByContract), independent of
  // the status column: a contract sent for signature counts as awaiting even if
  // its stage reads otherwise. Only meaningful in server mode (shares exist there).
  const awaiting=API_MODE()
    ? Object.values(state.shareByContract||{}).filter(s=>s&&(s.state==='sent'||s.state==='opened'))
    : [];
  const awaitingCount=awaiting.length;

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
  const expDelta=arr=>money?`${fmtMoneyShort(expVal(arr))} exposure`
    :(arr.length?`soonest in ${arr[0].d}d`:'none due');
  const expSub=arr=>arr.length?`soonest ${arr[0].d===0?'today':'in '+arr[0].d+' days'} · ${esc(arr[0].c.counterparty||arr[0].c.name)}`:'nothing inside the window';
  // avg cycle draft→signed from audit where both stamps exist
  const cycles=cs.filter(c=>c.status==='Signed').map(c=>{
    const a=(c.audit||[]); const cr=a.find(x=>/creat/i.test(x.action||'')), sg=a.find(x=>/sign|execut|seal/i.test(x.action||''));
    if(cr&&sg){ const d=(Date.parse(sg.at)-Date.parse(cr.at))/864e5; return d>0?d:null; } return null;
  }).filter(x=>x!=null);
  const avgCycle=cycles.length?(cycles.reduce((s,x)=>s+x,0)/cycles.length).toFixed(1)+'d':'—';

  // Gradient hero cards — one semantic tone per KPI. The full catalog is keyed
  // by a stable id; the user's chosen subset + order comes from currentKpiSel().
  const G={steel:'var(--grad-steel)',green:'var(--grad-emerald)',amber:'var(--grad-amber)',ruby:'var(--grad-ruby)'};
  /* Third line on every card, per the design: the figure's composition, so the
     number can be read without opening the register. */
  const stageSub=stages.filter(s=>s.n).map(s=>`${s.n} ${s.label.toLowerCase()}`).join(' · ')||'nothing filed yet';
  /* Compliance rating — a measured share, not a badge: how many live agreements
     carry NO high-risk finding. The delta names the regulatory profile in force
     (the header's jurisdiction switcher), because that is what the rating is
     being read against. */
  const live=cs.filter(c=>c.status!=='Declined');
  const clean=live.filter(c=>contractRisk(c)<60).length;
  const compliancePct=live.length?Math.round(clean/live.length*100):100;
  const REG_PROFILE={SE:'EU / GDPR', KE:'KICA / ODPC'};
  const apprMineN=myApprovals.filter(x=>x.mine).length;
  const KPI_CATALOG={
    under_mgmt:  {label:KPI_META.under_mgmt,   val:Number(countAll).toLocaleString('en-KE'),        delta:`+${newThisWeek} this week`,                                    sub:stageSub, grad:G.steel, ic:'building', go:{stage:'all'}},
    active_value:{label:KPI_META.active_value, val:fmtMoneyShort(m.totalValue),                        delta:`${Number(m.signed||0).toLocaleString('en-KE')} executed`,       sub:`across ${agreementsIn(cs).length.toLocaleString('en-KE')} agreements`, grad:G.green, ic:'coins',    go:{stage:'all',sort:'value'}},
    awaiting:    {label:KPI_META.awaiting,     val:Number(awaitingCount).toLocaleString('en-KE'),    delta:`${stalled} stalled > 14d`,                                     sub:API_MODE()?'out with counterparties':'shares need server mode', grad:G.amber, ic:'clock',    go:{stage:'awaiting'}},
    approvals:   {label:KPI_META.approvals,    val:Number(myApprovals.length).toLocaleString('en-KE'), delta:myApprovals.length?'Action required':'All clear',            sub:myApprovals.length?`${apprMineN} waiting on you · ${myApprovals.length-apprMineN} on others`:'no approval chain is open', grad:G.amber, ic:'clock', go:{stage:'Under Review'}},
    compliance:  {label:KPI_META.compliance,   val:`${compliancePct}%`,                              delta:REG_PROFILE[state.region]||REG_PROFILE.KE,                      sub:`${clean} of ${live.length} live with no high-risk finding`, grad:compliancePct>=90?G.green:compliancePct>=70?G.amber:G.ruby, ic:'shield', go:{stage:'all',sort:'risk'}},
    expiring30:  {label:KPI_META.expiring30,   val:Number(exp30.length).toLocaleString('en-KE'),     delta:expDelta(exp30),  sub:expSub(exp30),                           grad:G.ruby,  ic:'calendar', go:{stage:'all',sort:'expiry',view:'expiring30'}},
    expiring60:  {label:KPI_META.expiring60,   val:Number(exp60.length).toLocaleString('en-KE'),     delta:expDelta(exp60),  sub:expSub(exp60),                           grad:G.amber, ic:'calendar', go:{stage:'all',sort:'expiry',view:'expiring60'}},
    expiring90:  {label:KPI_META.expiring90,   val:Number(exp90.length).toLocaleString('en-KE'),     delta:expDelta(exp90),  sub:expSub(exp90),                           grad:G.amber, ic:'calendar', go:{stage:'all',sort:'expiry',view:'expiring90'}},
    /* THE BUCKET NOTHING FELL INTO. Every expiry card above filters on
       `days >= 0`, so a contract dropped out of all three on the morning its
       term ended — the one day it most needed somebody to look at it. */
    expired:     {label:KPI_META.expired,      val:Number(lapsed.length).toLocaleString('en-KE'),    delta:money?`${fmtMoneyShort(valOf(lapsed))} no longer active`:(lapsed.length?`longest ${Math.abs(dU(effectiveExpiry(lapsed[0])||''))}d ago`:'none'), sub:`${lapsed.length} past their end date`, grad:G.ruby,  ic:'alert',    go:{stage:'all',sort:'expiry',view:'expired'}},
    highrisk:    {label:KPI_META.highrisk,     val:Number(highRisk.length).toLocaleString('en-KE'),  delta:`${onExecuted} on executed paper`, sub:'risk score 60 or above', grad:G.ruby,  ic:'alert',    go:{stage:'all',sort:'risk'}},
    avgcycle:    {label:KPI_META.avgcycle,     val:avgCycle,                                          delta:cycles.length?`${cycles.length} signed sampled`:'—', sub:'draft to signed, from the audit trail', grad:G.green, ic:'clock',    go:{stage:'Signed'}},
  };
  const kpiSel=currentKpiSel().filter(id=>KPI_CATALOG[id]);
  // Adaptive layout: the redesign's stat cards are wider and quieter than the
  // gradient blocks they replace, so they sit four to a row and wrap.
  /* Balanced rows, so a chosen sixth metric never lands alone on a second row:
     up to 4 sit in one row, 5–6 split 3+3 (or 3+2), more than 6 go four-up. */
  const kpiN=kpiSel.length||1, kpiCols=kpiN<=4?kpiN:(kpiN<=6?3:4);
  /* The design's stat card: a muted label with a bare tinted glyph on the first
     line, the figure and its delta on the second, and the composition on a
     quiet third. No icon tile and no gradient — the colour is carried by the
     glyph and the delta alone. Tone comes from the metric's semantics (steel =
     volume, emerald = good, amber = pending, ruby = risk). */
  const TONE_OF=g=>g===G.green?'emerald':g===G.amber?'amber':g===G.ruby?'ruby':'steel';
  const TONE_FG={steel:'var(--tile-steel-fg)',emerald:'var(--tile-emerald-fg)',amber:'var(--tile-amber-fg)',ruby:'var(--tile-ruby-fg)'};
  const kpiCard=id=>{ const k=KPI_CATALOG[id], t=TONE_OF(k.grad); return `
    <button data-kpi-id="${id}" draggable="true" class="hati-stat" style="position:relative;display:flex;flex-direction:column;gap:8px;align-items:stretch;border:1px solid var(--color-divider);border-radius:16px;background:var(--color-surface);padding:20px;font:inherit;color:inherit;cursor:grab;text-align:left;box-shadow:var(--shadow-sm);transition:transform .2s var(--ease),box-shadow .2s var(--ease),border-color .15s,opacity .15s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow-md)';this.style.borderColor='color-mix(in srgb,var(--accent-solid) 35%,transparent)'" onmouseout="this.style.transform='none';this.style.boxShadow='var(--shadow-sm)';this.style.borderColor='var(--color-divider)'">
      <span style="display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--color-neutral-500);">
        <span style="font-size:11.5px;font-weight:600;line-height:1.3;">${k.label}</span>
        <span style="flex:none;display:inline-flex;color:${TONE_FG[t]};">${icon(k.ic,'w-4 h-4',1.8)}</span>
      </span>
      <span style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;">
        <span class="tnum" style="font-weight:700;font-size:clamp(20px,17px + 0.45vw,28px);line-height:1.1;letter-spacing:-.02em;color:var(--color-text);">${k.val}</span>
        <span style="font-size:11px;font-weight:600;color:${TONE_FG[t]};text-align:right;">${k.delta}</span>
      </span>
      <span style="font-size:11px;color:var(--color-neutral-500);line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${k.sub||''}</span>
    </button>`; };
  const kpiHtml=kpiSel.map(kpiCard).join('');


  /* The dashboard no longer carries Decisions due, Obligations, the renewal
     pipeline or the approvals queue — the redesign leads on the pipeline and
     the live feed instead. The reads behind them are unchanged and still
     surface where they belong: renewal decisions and obligation due dates on
     the Calendar, an approval chain on the contract itself. What stays here is
     only what a card still counts (myApprovals feeds Pending approvals). */
  /* ---- WELCOME BANNER (redesign) ----
     The page used to open on a metric ribbon. It now opens on a statement of
     what this workspace is for, and the one button that starts real work. The
     sub-line names the jurisdiction actually in force (the header switcher),
     rather than claiming both. */
  /* No flag emoji: Windows draws them as bare letter pairs in boxes. */
  const REGION_LABEL={SE:'Sweden', KE:'Kenya'};
  const regionNow=REGION_LABEL[state.region]||REGION_LABEL.KE;
  const heroSection=`
    <section class="hm-hero" style="position:relative;overflow:hidden;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding:24px 26px;border-radius:18px;background:linear-gradient(115deg,#0f172a 0%,#134e4a 62%,#0d9488 130%);border:1px solid #134e4a;box-shadow:var(--shadow-md);color:#fff;">
      <div style="position:absolute;right:-60px;top:-70px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(45,212,191,.28),transparent 68%);pointer-events:none;"></div>
      <div style="position:relative;min-width:0;display:flex;flex-direction:column;gap:7px;">
        <span style="align-self:flex-start;display:inline-flex;align-items:center;gap:7px;padding:3px 11px;border-radius:999px;background:rgba(20,184,166,.2);border:1px solid rgba(20,184,166,.34);color:#5eead4;font-size:11px;font-weight:600;">
          <span style="display:inline-flex;color:#5eead4;">${icon('check2','w-3 h-3',2)}</span>Multi-jurisdiction engine ready
        </span>
        <h2 style="margin:0;font-size:clamp(21px,17px + 0.62vw,31px);line-height:1.15;font-weight:700;letter-spacing:-.02em;color:#fff;">SME Contract Control Center</h2>
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
    {k:'Draft',        n:1, title:'Draft & Template',  tone:'steel',   fg:'var(--color-neutral-700)', bd:'var(--color-divider)',                              chip:'var(--color-neutral-100)'},
    {k:'Under Review', n:2, title:'Review & Redline',  tone:'amber',   fg:'var(--st-amber-fg)',       bd:'color-mix(in srgb,#f59e0b 34%,transparent)',        chip:'var(--st-amber-bg)'},
    {k:'Signed',       n:3, title:'Sign & Executed',   tone:'emerald', fg:'var(--st-green-fg)',       bd:'color-mix(in srgb,#10b981 34%,transparent)',        chip:'var(--st-green-bg)'},
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
    /* AS MANY AS THE WINDOW HAS ROOM FOR, not a fixed two.
       Two was chosen when this row set its own height and the Decisions card
       beside it filled into whatever that came to. The row now grows to fill
       the page instead (see .hm-main-row), so a hard slice of two meant a
       1920x950 screen showed six contracts and left 306px of the dashboard
       blank — the dead band under the cards that was reported. The list below
       scrolls inside its own column, so a short window still shows two and a
       tall one shows what it has room for. "+N more" stays outside the scroll,
       pinned at the foot of the column, and still carries the rest. */
    const shown=(st.k==='Under Review'?list.slice().sort((a,b)=>contractRisk(b)-contractRisk(a)):list).slice(0,6);
    return `<div style="display:flex;flex-direction:column;gap:9px;padding:13px;border-radius:14px;background:var(--color-surface);border:1px solid ${st.bd};min-width:0;min-height:0;">
      <button data-stage="${st.k}" style="display:flex;align-items:center;justify-content:space-between;gap:8px;border:0;background:none;padding:0;font:inherit;cursor:pointer;text-align:left;color:inherit;">
        <span style="font-size:11.5px;font-weight:700;color:${st.fg};">${st.n}. ${st.title}</span>
        <span style="flex:none;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:${st.chip};color:${st.fg};">${list.length} doc${list.length===1?'':'s'}</span>
      </button>
      <div class="hm-pipe-list scroll-thin" style="display:flex;flex-direction:column;gap:7px;">
        ${shown.map(c=>pipeDocCard(c,st)).join('')||`<div style="font-size:10.5px;color:var(--color-neutral-500);padding:4px 2px;">Nothing at this stage.</div>`}
      </div>
      ${list.length>shown.length?`<button data-stage="${st.k}" style="flex:none;border:0;background:none;padding:2px;font:inherit;font-size:10.5px;font-weight:600;color:var(--color-accent-600);cursor:pointer;text-align:left;">+ ${list.length-shown.length} more →</button>`:''}
    </div>`;
  }).join('');
  const lifecycleSection=`
    <section class="hm-pipe-card" style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px;padding:16px 18px;min-width:0;">
      <div style="flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;">
        <h4 style="font-size:15px;margin:0;font-weight:700;">Active contract lifecycle pipeline</h4>
        <button data-open-register style="border:0;background:none;cursor:pointer;font:inherit;font-size:11.5px;color:var(--color-accent-600);font-weight:600;padding:0;">View full register →</button>
      </div>
      <div class="hm-pipe-cols" style="display:grid;gap:11px;">${pipeCols}</div>
    </section>`;

  /* ---- DECISIONS DUE (in the design's feed slot) ----
     The audit stream that sat here read "Created — Seeded as sample data" over
     and over, because a created record is the only history a fresh contract
     has. What belongs in the one column beside the pipeline is what needs a
     person: a renewal decision whose date is closing, and paper that has sat in
     review. Drawn in the design's feed row — a round tone tile, two lines — and
     capped to the pipeline's height, scrolling inside its own box. */
  const decisionItems=[
    ...decisions.map(x=>({
      cid:x.c.id, urgent:x.d<=30, ic:'calendar',
      txt:`Renew or exit — <strong style="font-weight:600">${esc(x.c.name)}</strong>`,
      meta:`${esc(x.c.counterparty||'no counterparty')} · decide by ${fmtDDay(x.dd)}`,
      tag:x.d===0?'today':`in ${x.d}d`,
    })),
    ...waitingLongest.map(x=>({
      cid:x.c.id, urgent:x.idle>=30, ic:'clock',
      txt:`Waiting on review — <strong style="font-weight:600">${esc(x.c.name)}</strong>`,
      meta:`${esc(x.c.counterparty||'no counterparty')} · ${esc(x.c.id)}`,
      tag:`${x.idle}d idle`,
    })),
  ];
  const decisionRows=decisionItems.slice(0,8).map(it=>{
    const bg=it.urgent?'var(--tile-ruby-bg)':'var(--tile-amber-bg)';
    const fg=it.urgent?'var(--tile-ruby-fg)':'var(--tile-amber-fg)';
    return `<button data-sel="${esc(it.cid)}" style="display:flex;gap:11px;width:100%;padding:9px 2px;border:0;border-bottom:1px solid var(--color-divider);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit;">
      <span style="width:30px;height:30px;flex:none;border-radius:50%;background:${bg};color:${fg};display:grid;place-items:center;">${icon(it.ic,'w-3.5 h-3.5',1.8)}</span>
      <span style="flex:1;min-width:0;">
        <span style="display:flex;align-items:baseline;gap:8px;">
          <span style="flex:1;min-width:0;font-size:11.5px;line-height:1.4;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${it.txt}</span>
          <span style="flex:none;font-size:10px;font-weight:600;font-family:var(--font-mono);color:${fg};">${esc(it.tag)}</span>
        </span>
        <span style="display:block;margin-top:2px;font-size:10px;color:var(--color-neutral-500);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${it.meta}</span>
      </span>
    </button>`; }).join('')
    || `<div style="display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--color-neutral-500);padding:12px 2px;"><span style="color:var(--st-green-fg);display:inline-flex;">${icon('check2','w-4 h-4')}</span>Nothing to decide — you're all caught up.</div>`;
  /* The footer link has to lead where the rows actually live, and this card
     holds two different kinds of item. A renewal decision is a date, so the
     calendar is its home; a contract sitting in review is not on any calendar —
     it is a row in the register. Sending both to the calendar (which the old
     single-purpose panel could safely do) would land a reader on a screen that
     shows none of what they clicked. So the footer names its destination, and
     when the list mixes the two it offers both. */
  const lnk=(attr,label)=>`<button ${attr} style="border:0;background:none;padding:2px;font:inherit;font-size:11px;font-weight:600;color:var(--color-accent-600);cursor:pointer;text-align:left;">${label}</button>`;
  const renewalN=decisions.length, reviewN=waitingLongest.length;
  const footerLinks=[
    renewalN?lnk('data-open-decisions',`${renewalN} renewal decision${renewalN===1?'':'s'} in the calendar →`):'',
    reviewN?lnk('data-open-review',`${reviewN} waiting in review →`):'',
  ].filter(Boolean);
  const decisionFooter=(decisionItems.length>8||footerLinks.length>1)&&footerLinks.length
    ? `<div style="flex:none;margin-top:8px;padding-top:8px;border-top:1px solid var(--color-divider);display:flex;flex-direction:column;gap:2px;align-items:flex-start;">${footerLinks.join('')}</div>`
    : '';
  const activitySection=`
    <section style="flex:1;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex:none;">
        <h4 style="font-size:15px;margin:0;font-weight:700;">Decisions due</h4>
        <span class="live-ping" style="width:7px;height:7px;border-radius:50%;background:${decisionItems.length?'#f59e0b':'#10b981'};flex:none;"></span>
        ${decisionItems.length?`<span style="margin-left:auto;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--st-amber-bg);color:var(--st-amber-fg);">${decisionItems.length}</span>`:''}
      </div>
      <div class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;">${decisionRows}</div>
      ${decisionFooter}
    </section>`;

  /* U-2: a brand-new workspace opened on a cockpit of zeroed gauges with no
     route to the three real entry points. When there are no contracts yet, show
     a first-run welcome that points at them — draft from a template, import an
     existing portfolio, or explore — above the (still-zeroed) dashboard. Purely
     additive, so nothing that already renders disappears. */
  const firstRunBanner = countAll===0 ? `
    <section style="border:1px solid var(--color-divider);border-radius:14px;background:var(--color-surface);padding:22px 22px 20px;">
      <h2 style="margin:0 0 4px;font-family:var(--font-heading);font-weight:700;font-size:19px;color:var(--color-text);">Welcome — let's put your first contract in.</h2>
      <p style="margin:0 0 16px;font-size:12.5px;color:var(--color-neutral-600);max-width:64ch;line-height:1.55;">Your workspace is ready. Start one of three ways — you can always do the others later.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;">
        <button id="fr-draft" style="text-align:left;border:1px solid var(--color-divider);border-radius:11px;background:var(--color-bg);padding:15px;cursor:pointer;font:inherit;">
          <div style="font-weight:700;font-size:13px;color:var(--color-text);margin-bottom:3px;">Draft a contract</div>
          <div style="font-size:11.5px;color:var(--color-neutral-600);line-height:1.5;">Fill in the blanks on a ${regionNow} template — the register, filters and reminders populate as you type.</div>
        </button>
        <button id="fr-import" style="text-align:left;border:1px solid var(--color-divider);border-radius:11px;background:var(--color-bg);padding:15px;cursor:pointer;font:inherit;">
          <div style="font-weight:700;font-size:13px;color:var(--color-text);margin-bottom:3px;">Import your existing contracts</div>
          <div style="font-size:11.5px;color:var(--color-neutral-600);line-height:1.5;">Drop a back-catalogue of PDFs or scans — HaTi extracts the terms and files them for you.</div>
        </button>
        <button id="fr-explore" style="text-align:left;border:1px solid var(--color-divider);border-radius:11px;background:var(--color-bg);padding:15px;cursor:pointer;font:inherit;">
          <div style="font-weight:700;font-size:13px;color:var(--color-text);margin-bottom:3px;">Explore the register</div>
          <div style="font-size:11.5px;color:var(--color-neutral-600);line-height:1.5;">See where contracts live once they're in — search, filters, stages and export.</div>
        </button>
      </div>
    </section>` : '';
  document.getElementById('content').innerHTML=`
  <div class="view-enter hm-page" style="display:flex;flex-direction:column;gap:9px;padding:12px 18px 18px;">
    ${window.emailSetupBannerHtml?emailSetupBannerHtml():''}
    ${firstRunBanner}

    <!-- Getting started (WO N3) — the visible path from "workspace exists"
         to "first contract signed", ticked from real state on every render -->
    ${gettingStartedHtml()}

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
      <!-- The chosen count is what the row wants; minmax gives it a floor, so
           on a narrow window the cards wrap onto a second line instead of
           squeezing every label into 34px of a 92px word. -->
      <div id="kpi-grid" style="display:grid;grid-template-columns:repeat(${kpiCols},minmax(0,1fr));gap:14px;" data-kpi-cols="${kpiCols}">
        ${kpiHtml}
      </div>
    </section>

    <!-- The lifecycle pipeline and the live feed, side by side (2:1) as in the
         design. Both cards size to their own content. -->
    <!-- The pipeline sets the height of this row; the decisions card is filled
         absolutely into the remaining column so a long list scrolls inside it
         instead of stretching the row and leaving the pipeline half-empty. -->
    <div class="hm-main-row" style="display:grid;gap:16px;align-items:stretch;">
      ${lifecycleSection}
      <div class="hm-decisions" style="position:relative;min-width:0;">
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;min-height:0;">
          ${activitySection}
        </div>
      </div>
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
    const nb=document.getElementById('cmd-new');
    if(window.openNewMenu){ openNewMenu(e.currentTarget); }
    else if(nb){ nb.click(); }
  });
  /* U-2: first-run welcome cards route to the three real entry points. Draft
     reuses the same new-contract menu the command bar owns. */
  document.getElementById('fr-draft')?.addEventListener('click',e=>{
    e.stopPropagation();
    const nb=document.getElementById('cmd-new');
    if(window.openNewMenu){ openNewMenu(e.currentTarget); }
    else if(nb){ nb.click(); }
  });
  document.getElementById('fr-import')?.addEventListener('click',()=>setView('migration'));
  /* Getting started (WO N3): the current step is one button; dismissal is
     forever (per user), so the card never nags a workspace that closed it. */
  document.querySelectorAll('[data-gs-go]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation(); gsGo(el.getAttribute('data-gs-go'),el); }));
  document.getElementById('gs-dismiss')?.addEventListener('click',e=>{
    e.stopPropagation(); gsHide(); renderDashboard(); });
  document.getElementById('fr-explore')?.addEventListener('click',()=>{ const R=regState(); R.stage='all'; R.type='all'; R.sel={}; setView('register'); });
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
  // contracts sitting in review are register rows, not calendar entries
  document.querySelectorAll('[data-open-review]').forEach(el=>el.addEventListener('click',()=>{
    const R=regState(); R.stage='Under Review'; R.type='all'; R.view=null; R.sel={}; setView('register');
  }));
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

Object.assign(window,{renderDashboard,gsSteps,gettingStartedHtml,gsIsSeed});
