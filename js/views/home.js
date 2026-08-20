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
/* Read as KPI_META[id] by the dashboard tiles AND by the phone's figures list,
   so these are getters: every existing call site keeps working unchanged and
   picks up the reader's language, where a plain string would have frozen the
   label at load. */
const KPI_EN={
  under_mgmt:'Active contracts', active_value:'Active value', awaiting:'Awaiting counterparty',
  approvals:'Pending approvals', compliance:'Compliance rating', expiring30:'Expiring < 30 days',
  expiring60:'Expiring < 60 days', expiring90:'Expiring < 90 days', expired:'Term already ended',
  highrisk:'High-risk findings', avgcycle:'Avg turnaround time' };
/* Falls back to the English WORD, never the dictionary key — a tile reading
   `kpi_avgcycle` looks like broken software, one reading "Avg turnaround time"
   on a Swedish screen looks only untranslated. */
const KPI_META=Object.keys(KPI_EN)
  .reduce((o,k)=>(Object.defineProperty(o,k,{enumerable:true,
    get(){ return typeof t==='function' ? i18t('kpi_'+k) : KPI_EN[k]; }}),o),{});
const KPI_ALL_ORDER=['under_mgmt','active_value','avgcycle','approvals','compliance','awaiting','expiring30','expiring60','expiring90','expired','highrisk'];
/* The four the design leads on: how much paper is live, how fast it moves,
   what is stuck on a person, and how much of it is clean. Everything else in
   the catalog stays one click away under Customize. */
const DEFAULT_KPI_SEL=['under_mgmt','avgcycle','approvals','compliance'];
/* ---- FOUR, AND FOUR IS THE WHOLE RIBBON (owner-asked, 13 Aug 2026) ----
   "For the 4 main KPI cards, make it so that you cannot have more than 4."

   The ribbon was a catalogue with a FLOOR and no ceiling: eleven metrics, keep
   at least one, and a reader could tick all eleven. The row is one line of
   cards across the top of Home and it is the first thing on the page — at five
   the cards start giving up their sentence, and past that the row is a list
   wearing card clothes.

   THE CEILING IS ONE NUMBER, read by BOTH pickers (this popover and the
   phone's sheet — the duplication this rulebook opens by warning about) and by
   the reading itself. currentKpiSel caps as it reads, so a preference saved
   before this rule existed — or on another device, or by a future writer that
   forgets — can never draw a fifth card. The stored list is not rewritten
   behind the reader's back; it is simply not honoured past four, and the first
   change they make saves the capped four.

   A REFUSAL NEEDS ITS WAY FORWARD ON THE SAME SCREEN, which is why the pickers
   do more than refuse: at four, the un-ticked rows go quiet and say what to do,
   and the head counts. Nobody should have to press a control to learn it will
   not work. */
const KPI_MAX=4;
const kpiAtMax=sel=>((sel||[]).length)>=KPI_MAX;
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
/* Capped HERE, at the one reading every surface asks — the desktop ribbon, the
   phone's figures list, both pickers. A cap applied only where cards are drawn
   would leave the pickers offering a fifth tick that draws nothing. */
function currentKpiSel(){ const s=getKpiSel(); return (s.length?s:DEFAULT_KPI_SEL.filter(id=>kpiCatalogOrder().includes(id))).slice(0,KPI_MAX); }
// Non-intrusive popover to toggle which KPI cards appear. Reorder is by dragging
// the cards themselves; this panel handles show/hide + reset.
/* THE PANEL STAYS OPEN WHILE YOU WORK IT. A toggle repaints the dashboard, and
   the popover hangs inside #content — so every tick used to destroy it. That
   was survivable while a reader could simply ADD a metric; with a ceiling of
   four, every change is a SWAP, and a swap became untick → reopen → tick.
   Re-opened against the freshly drawn button rather than kept alive across the
   repaint, because the node it was anchored to no longer exists. */
let _kpiPopOff=null;
function kpiApply(cur){
  setKpiSel(cur);
  renderDashboard();
  const btn=document.getElementById('kpi-customize');
  if(btn) openKpiCustomizer(btn);
}
function openKpiCustomizer(anchor){
  const prev=document.getElementById('kpi-cust-pop');
  if(prev){ prev.remove(); return; }   // second click on the gear closes it
  /* The outside-press listener from a popover this one replaces. It removes
     itself on the next document click, but a run of ticks would stack one per
     tick until then — armed once, dropped here. */
  if(_kpiPopOff){ document.removeEventListener('click',_kpiPopOff,true); _kpiPopOff=null; }
  const sel=currentKpiSel();
  const full=kpiAtMax(sel);
  const pop=document.createElement('div');
  pop.id='kpi-cust-pop';
  pop.style.cssText='position:absolute;z-index:60;top:calc(100% + 6px);right:0;width:252px;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);border-radius:0;padding:8px;';
  /* At four, the rows that cannot be turned on SAY SO before they are pressed —
     dimmed, not pointing, and carrying the sentence as a tooltip. The ticked
     four stay live, because turning one off is the way forward. */
  const row=id=>{
    const on=sel.includes(id), shut=full&&!on;
    return `
    <label ${shut?`title="${esc(i18t('home_max_metrics',{max:KPI_MAX}))}"`:''}
      style="display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:0;font-size:12.5px;${
        shut?'cursor:default;opacity:.45;':'cursor:pointer;'}"${
        shut?'':` onmouseover="this.style.background='color-mix(in srgb,var(--color-accent) 9%,transparent)'" onmouseout="this.style.background='none'"`}>
      <input type="checkbox" data-kpi-toggle="${id}" ${on?'checked':''} ${shut?'disabled':''} style="width:15px;height:15px;accent-color:var(--color-accent);flex:none;"/>
      <span style="flex:1;">${KPI_META[id]}</span>
    </label>`;
  };
  pop.innerHTML=`
    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:4px 8px 6px;">
      <span style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-500);font-weight:700;">${i18t('home_show_metrics')}</span>
      ${''/* The count is the rule, stated without being pressed: a reader who
             sees "4 of 4" never has to discover the ceiling by hitting it. */}
      <span id="kpi-cust-count" style="font-size:10.5px;font-weight:700;font-variant-numeric:tabular-nums;color:${full?'var(--color-accent-700)':'var(--color-neutral-500)'};">${i18t('home_metrics_count',{n:sel.length,max:KPI_MAX})}</span>
    </div>
    ${kpiCatalogOrder().map(row).join('')}
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid var(--color-divider);margin-top:6px;padding:8px 8px 4px;">
      <span style="font-size:10.5px;color:var(--color-neutral-500);">${full?esc(i18t('home_max_metrics',{max:KPI_MAX})):i18t('home_drag_reorder')}</span>
      <button data-kpi-reset style="border:0;background:none;color:var(--color-accent-700);font-weight:600;font-size:11px;cursor:pointer;padding:0;flex:none;">${i18t('home_reset')}</button>
    </div>`;
  anchor.parentElement.style.position='relative';
  anchor.parentElement.appendChild(pop);
  pop.querySelectorAll('[data-kpi-toggle]').forEach(cb=>cb.addEventListener('change',()=>{
    const id=cb.getAttribute('data-kpi-toggle');
    let cur=currentKpiSel();
    if(cb.checked){
      /* The model refuses too, not only the drawing. A disabled box is a
         statement about pixels; this is the rule. */
      if(kpiAtMax(cur)&&!cur.includes(id)){ cb.checked=false; toast(i18t('home_max_metrics',{max:KPI_MAX}),'err'); return; }
      if(!cur.includes(id)) cur.push(id);
    }
    else { if(cur.length<=1){ cb.checked=true; toast(i18t('home_keep_one_metric'),'err'); return; } cur=cur.filter(x=>x!==id); }
    kpiApply(cur);
  }));
  pop.querySelector('[data-kpi-reset]')?.addEventListener('click',()=>{ kpiApply(DEFAULT_KPI_SEL.slice()); });
  setTimeout(()=>{ const onDoc=e=>{ if(!pop.contains(e.target)&&e.target!==anchor&&!anchor.contains(e.target)){ pop.remove(); document.removeEventListener('click',onDoc,true); if(_kpiPopOff===onDoc) _kpiPopOff=null; } }; _kpiPopOff=onDoc; document.addEventListener('click',onDoc,true); },0);
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
      <div style="font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--st-green-fg);margin-bottom:5px">${i18t('home_ready_to_sign')}</div>
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
      ${isCur&&(s.k!=='sign'||gsGoTargetExists(s.k))?`<span style="flex:none;font-size:11.5px;font-weight:600;color:var(--color-accent-700)">${i18t('home_go')}</span>`:''}`;
    /* The whole current row is the button — a target the size of the step,
       not a link the size of an arrow. */
    return isCur&&(s.k!=='sign'||gsGoTargetExists(s.k))
      ?`<button data-gs-go="${s.k}" style="display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border:1px solid color-mix(in srgb,var(--color-accent) 25%,transparent);border-radius:0;background:color-mix(in srgb,var(--color-accent) 6%,transparent);cursor:pointer;font:inherit;text-align:left;color:inherit">${body}</button>`
      :`<div style="display:flex;align-items:center;gap:10px;padding:8px 10px">${body}</div>`;
  }).join('');
  return `
    <section id="gs-card" style="border:1px solid var(--color-divider);border-radius:0;background:var(--color-surface);padding:16px 18px 14px;">
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:8px">
        <h2 style="margin:0;font-family:var(--font-heading);font-weight:700;font-size:14.5px;color:var(--color-text)">${all?'You’re set up — first contract signed ⚡':'Getting started'}</h2>
        <span style="font-size:11px;color:var(--color-neutral-600);font-family:var(--font-mono)">${done} of ${steps.length} done</span>
        <span style="flex:1"></span>
        <button id="gs-dismiss" class="ui-btn" title="${i18t('home_hide_checklist')}" style="font-size:11px;padding:3px 10px">${all?'Done — hide this':'Hide'}</button>
      </div>
      <div style="height:6px;border-radius:0;background:var(--color-neutral-100);margin-bottom:10px"><i style="display:block;height:100%;border-radius:0;background:var(--color-accent);width:${Math.round(done/steps.length*100)}%"></i></div>
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

/* THE DASHBOARD'S FIGURES, SPLIT OUT SO TWO SHELLS CAN READ THEM.

   Every slice and every metric the dashboard shows used to be computed inside
   renderDashboard, which meant it could only ever be read by the thing that
   drew the dashboard. The phone shows the same figures on a different shape of
   screen, and the one thing it must not do is work them out a second time: two
   copies of "how many contracts are expiring inside 30 days" is two answers
   waiting to disagree in front of a customer.

   So the computation moved out here and renderDashboard now reads it, exactly
   as the phone does. Not one line of the arithmetic changed in the move —
   deliberately, so the desktop it feeds is the desktop that shipped. */
function hmDashSlices(){
  /* THE ARCHIVE SHELF (WO-5): filed-away contracts leave every dashboard
     figure at the one door the whole dashboard reads through. */
  const cs=(state.contracts||[]).filter(c=>!c.archived);
  /* state.contracts, state.serverStats and state.shareOverview are already
     scoped and masked by the server (F1/F2) — every slice below is therefore
     scoped by construction. `money` is the last mile: it stops the dashboard
     printing totals derived from values it was never sent. */
  const money=kpiMoneyOk();
  const m=metrics();
  const countAll=(state.serverStats&&state.serverStats.total!=null)?state.serverStats.total:cs.length;
  /* W2-1: every dashboard figure is ONE currency — the workspace's — with
     each foreign contract converted at the admin's dated rate (fxHomeValue).
     A currency with no rate is left out and hmDashSlices carries fxMissing
     so the card can say so. */
  const valOf=arr=>arr.reduce((s,c)=>s+(window.fxHomeValue?fxHomeValue(c):Number(c.value||0)),0);
  const dU=window.daysUntil||(iso=>Math.ceil((new Date(iso+'T00:00:00')-Date.now())/86400000));
  const idleOf=c=>{ const t=Date.parse(c.lastAction); return isNaN(t)?0:Math.max(0,Math.floor((Date.now()-t)/86400000)); };

  // ---- slices ----
  /* GETTERS, not fixed strings. This table is built once per render but read
     again by callers that outlive the render, and a plain string would freeze
     whatever language was current when the array was made. */
  const STAGE_DEF=[
    {k:'Draft',        get label(){ return i18t('home_stage_drafting'); },  color:'var(--st-gray-dot)'},
    {k:'Under Review', get label(){ return i18t('home_stage_in_review'); }, color:'var(--st-amber-dot)'},
    {k:'Signed',       get label(){ return i18t('home_stage_executed'); },  color:'var(--st-green-dot)'},
    {k:'Declined',     get label(){ return i18t('home_stage_closed'); },    color:'var(--st-ruby-dot)'},
  ];
  /* Spread would COPY the getter's current value and freeze it, so label is
     re-declared as a getter on the new object rather than carried across. */
  const stages=STAGE_DEF.map(s=>{ const list=cs.filter(c=>c.status===s.k);
    return { k:s.k, color:s.color, get label(){ return s.label; }, n:list.length, val:valOf(list) }; });

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
  const fmtDDay=iso=>{ const t=Date.parse((iso||'')+'T00:00:00'); return isNaN(t)?iso:new Date(t).toLocaleDateString(langLocale(),{day:'2-digit',month:'short',year:'numeric'}); };
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
  /* ---- WHO RAISED IT, ON A ROW THAT HAS NO HISTORY ----
     This read the audit trail, and the dashboard reads the LIGHT list, which
     the server strips the audit trail out of — so this answered false for
     every contract in server mode and true only in local mode, where records
     are whole. Half of "Decisions due" was dead in production and correct in
     development, which is why it survived.
     `_raisedBy` is the same fact carried on the row (see HEAVY, server.js).
     The trail is still asked where there IS one, so local mode and an opened
     contract are unchanged. */
  const raisedByMe=c=>{
    if(!me) return false;
    if(c && c._raisedBy!=null) return c._raisedBy===me.name;
    return (c&&c.audit||[]).some(a=>/creat/i.test(a.action||'')&&a.user===me.name);
  };
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
  const stageSub=stages.filter(s=>s.n).map(s=>`${s.n} ${s.label.toLowerCase()}`).join(' · ')||i18t('home_nothing_filed');
  /* Compliance rating — a measured share, not a badge: how many live agreements
     carry NO high-risk finding. The delta names the regulatory profile in force
     (the header's jurisdiction switcher), because that is what the rating is
     being read against. */
  const live=cs.filter(c=>c.status!=='Declined');
  const clean=live.filter(c=>contractRisk(c)<60).length;
  const compliancePct=live.length?Math.round(clean/live.length*100):100;
  const REG_PROFILE={SE:'EU / GDPR', KE:'KICA / ODPC'};
  const apprMineN=myApprovals.filter(x=>x.mine).length;
  /* ---- REVIEWS SITTING ON THIS PERSON'S DESK ----
     The same principle the approvals queue above was rewritten for: a list that
     is not the reader's own is a list nobody owns. reviewInboxFor filters to
     contracts where an internal review is OPEN and this reader is the named
     reviewer — so the count is a promise somebody made to them by name, not a
     workspace-wide tally they can do nothing about. */
  const myReviews=(window.reviewInboxFor?reviewInboxFor(cs, me):[]);
  /* Colleagues waiting on THIS person to let them onto a negotiation. Same
     principle as the review inbox above: a list that is not the reader's own is
     a list nobody owns, so deskJoinInboxFor returns only the desks this reader
     may actually change. */
  const myJoinAsks=(window.deskJoinInboxFor?deskJoinInboxFor(cs, me):[]);
  /* ---- THE PRICE OF ONE DOOR OUT ----
     Making one person the only route to the counterparty means the deal goes
     quiet the week they are on leave. This is the flag that stops that being
     invisible: negotiations where THEY are waiting on US and have been for more
     working days than the setting allows. Drawn for the lead and for admins,
     and never anywhere the counterparty can see it — they get a reply, not a
     notification that we noticed. */
  const myStaleDesks=(window.deskStaleInboxFor?deskStaleInboxFor(cs, me):[]);
  const KPI_CATALOG={
    under_mgmt:  {label:KPI_META.under_mgmt,   val:Number(countAll).toLocaleString(jxLocale()),        delta:i18t('home_new_this_week',{n:newThisWeek}),                                    sub:stageSub, grad:G.steel, ic:'building', go:{stage:'all'}},
    /* W2-1: the figure is ONE currency, and where a foreign contract could not
       be converted the card SAYS SO instead of quietly under-reporting — the
       sub-line carries the count and the codes. A silent trim on a money
       headline is the worst version of the fault this product already refuses
       for charts. */
    active_value:{label:KPI_META.active_value, val:fmtMoneyShort(m.totalValue),                        delta:i18t('home_executed',{n:Number(m.signed||0).toLocaleString(jxLocale())}),       sub:(()=>{
      const miss=(window.fxMissing?fxMissing(cs):{}), codes=Object.keys(miss).sort();
      if(codes.length){ const n=codes.reduce((s,k)=>s+miss[k],0);
        return i18tn('fx_left_out',n,{n,codes:codes.join(', ')}); }
      return i18t('home_across_agreements',{n:agreementsIn(cs).length.toLocaleString(jxLocale())});
    })(), grad:G.green, ic:'coins',    go:{stage:'all',sort:'value'}},
    awaiting:    {label:KPI_META.awaiting,     val:Number(awaitingCount).toLocaleString(jxLocale()),    delta:i18t('home_stalled',{n:stalled}),                                     sub:API_MODE()?i18t('home_out_with_cp'):i18t('home_shares_need_server'), grad:G.amber, ic:'clock',    go:{stage:'awaiting'}},
    approvals:   {label:KPI_META.approvals,    val:Number(myApprovals.length).toLocaleString(jxLocale()), delta:myApprovals.length?i18t('home_action_required'):i18t('home_all_clear'),            sub:myApprovals.length?i18t('home_waiting_split',{mine:apprMineN,others:myApprovals.length-apprMineN}):i18t('home_no_chain_open'), grad:G.amber, ic:'clock', go:{stage:'Under Review'}},
    compliance:  {label:KPI_META.compliance,   val:`${compliancePct}%`,                              delta:REG_PROFILE[state.region]||REG_PROFILE.KE,                      sub:i18t('home_clean_of_live',{clean,live:live.length}), grad:compliancePct>=90?G.green:compliancePct>=70?G.amber:G.ruby, ic:'shield', go:{stage:'all',sort:'risk'}},
    expiring30:  {label:KPI_META.expiring30,   val:Number(exp30.length).toLocaleString(jxLocale()),     delta:expDelta(exp30),  sub:expSub(exp30),                           grad:G.ruby,  ic:'calendar', go:{stage:'all',sort:'expiry',view:'expiring30'}},
    expiring60:  {label:KPI_META.expiring60,   val:Number(exp60.length).toLocaleString(jxLocale()),     delta:expDelta(exp60),  sub:expSub(exp60),                           grad:G.amber, ic:'calendar', go:{stage:'all',sort:'expiry',view:'expiring60'}},
    expiring90:  {label:KPI_META.expiring90,   val:Number(exp90.length).toLocaleString(jxLocale()),     delta:expDelta(exp90),  sub:expSub(exp90),                           grad:G.amber, ic:'calendar', go:{stage:'all',sort:'expiry',view:'expiring90'}},
    /* THE BUCKET NOTHING FELL INTO. Every expiry card above filters on
       `days >= 0`, so a contract dropped out of all three on the morning its
       term ended — the one day it most needed somebody to look at it. */
    expired:     {label:KPI_META.expired,      val:Number(lapsed.length).toLocaleString(jxLocale()),    delta:money?i18t('home_no_longer_active',{v:fmtMoneyShort(valOf(lapsed))}):(lapsed.length?i18t('home_longest_ago',{n:Math.abs(dU(effectiveExpiry(lapsed[0])||''))}):i18t('home_none')), sub:i18t('home_past_end_date',{n:lapsed.length}), grad:G.ruby,  ic:'alert',    go:{stage:'all',sort:'expiry',view:'expired'}},
    highrisk:    {label:KPI_META.highrisk,     val:Number(highRisk.length).toLocaleString(jxLocale()),  delta:i18t('home_on_executed',{n:onExecuted}), get sub(){ return i18t('home_risk_60'); }, grad:G.ruby,  ic:'alert',    go:{stage:'all',sort:'risk'}},
    avgcycle:    {label:KPI_META.avgcycle,     val:avgCycle,                                          delta:cycles.length?i18t('home_signed_sampled',{n:cycles.length}):'—', get sub(){ return i18t('home_draft_to_signed'); }, grad:G.green, ic:'clock',    go:{stage:'Signed'}},
  };
  return { cs, money, m, countAll, valOf, dU, idleOf, STAGE_DEF, stages, expiring, rdd,
    decisions, waitingLongest, fmtDDay, highRisk, awaiting, awaitingCount, me, raisedByMe,
    canApproveSomeStep, myApprovals, newThisWeek, stalled, onExecuted, lapsed, expWithin,
    exp30, exp60, exp90, expVal, expDelta, expSub, cycles, avgCycle, G, stageSub, live,
    clean, compliancePct, REG_PROFILE, apprMineN, myReviews, myJoinAsks, myStaleDesks, KPI_CATALOG };
}

/* THE EMAIL WARNING, SAID ONCE AND QUIETLY.
   The full banner is three lines and a block of amber at the very top of the
   dashboard, every visit, forever. The fact still matters — without email
   nothing can be delivered — so it stays, as one line. It carries the same id
   the responsive rules and the wiring already look for, and the shared
   emailSetupBannerHtml() is left untouched for anywhere else that wants it. */
function emailSetupLineHtml(){
  if(typeof emailOff!=='function' || !emailOff()) return '';
  const admin=(typeof isAdmin==='function')&&isAdmin();
  return `
    <div id="email-setup-banner" style="display:flex;align-items:center;gap:9px;padding:8px 13px;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-radius:0;font-size:11.5px;color:var(--st-amber-fg);line-height:1.45;">
      <span style="flex:none;display:inline-flex;color:var(--st-amber-dot);">${icon('alert','w-3.5 h-3.5')}</span>
      <span style="flex:1;min-width:0;">${i18t('home_email_not_setup')}</span>
      ${admin?`<button id="email-setup-go" style="flex:none;border:0;background:none;padding:0;font:inherit;font-size:11.5px;font-weight:700;color:var(--st-amber-fg);cursor:pointer;text-decoration:underline;text-underline-offset:2px;">${i18t('home_set_it_up')}</button>`:''}
    </div>`;
}

/* Which lifecycle stage the pipeline card is listing. Per sitting, in
   memory: a working preference, not a setting. */
let _hmStage=null;
function renderDashboard(){
  const { cs, money, m, countAll, valOf, dU, idleOf, STAGE_DEF, stages, expiring, rdd,
    decisions, waitingLongest, fmtDDay, highRisk, awaiting, awaitingCount, me, raisedByMe,
    canApproveSomeStep, myApprovals, newThisWeek, stalled, onExecuted, lapsed, expWithin,
    exp30, exp60, exp90, expVal, expDelta, expSub, cycles, avgCycle, G, stageSub, live,
    clean, compliancePct, REG_PROFILE, apprMineN, myReviews, myJoinAsks, myStaleDesks, KPI_CATALOG } = hmDashSlices();
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
  /* THE TOP EDGE IS THE CARD'S TONE (the SAP treatment, owner-approved render
     20 Aug 2026): a 3px coloured rule along the top of a flat white card —
     teal for volume, amber for pending, green for good, ruby for risk — so
     whichever four metrics the reader picks, each carries its own colour.
     THE HOVER MUST NOT TOUCH borderColor ANY MORE: resetting it would paint
     all four sides the divider grey and erase the top edge. */
  const TONE_EDGE={steel:'var(--color-accent-600)',emerald:'var(--st-green-dot)',amber:'var(--st-amber-dot)',ruby:'var(--st-ruby-dot)'};
  const kpiCard=id=>{ const k=KPI_CATALOG[id], t=TONE_OF(k.grad); return `
    <button data-kpi-id="${id}" draggable="true" class="hati-stat" style="position:relative;display:flex;flex-direction:column;gap:7px;align-items:stretch;border:1px solid var(--color-divider);border-top:3px solid ${TONE_EDGE[t]};border-radius:0;background:var(--color-surface);padding:12px 14px;font:inherit;color:inherit;cursor:grab;text-align:left;box-shadow:none;transition:transform .2s var(--ease),opacity .15s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
      <span style="display:block;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;line-height:1.3;color:var(--color-neutral-500);">${k.label}</span>
      <span style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;">
        <span class="tnum" style="font-family:var(--font-mono);font-weight:300;font-size:clamp(20px,17px + 0.45vw,28px);line-height:1.1;letter-spacing:-.02em;color:var(--color-text);">${k.val}</span>
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
  /* ---- THE PORTFOLIO STRIP (owner-approved render, 20 Aug 2026) ----
     The teal hero banner is gone — the SAP treatment opens on one slim line
     that names the page and states the book (the same facts the hero's
     sub-line carried), with the two controls on its right: Customize (moved
     up from the retired KEY METRICS caption row) and Draft new agreement.
     SAME IDS, SAME WIRING: #kpi-customize and #hero-draft are unchanged, so
     the KPI picker still re-opens against this button after a tick (kpiApply)
     and the draft button still opens the one new-contract menu. The greeting
     went with the banner — a page title is not a salutation. */
  /* No flag emoji: Windows draws them as bare letter pairs in boxes. */
  const REGION_LABEL={SE:'Sweden', KE:'Kenya'};
  const regionNow=REGION_LABEL[state.region]||REGION_LABEL.KE;
  const activeVal=(money&&typeof fmtMoneyShort==='function')?fmtMoneyShort(valOf(live)):'';
  const heroLine=[
    i18tn('home_hero_managed',countAll,{n:Number(countAll).toLocaleString(jxLocale())}),
    activeVal?i18t('home_hero_value',{v:activeVal}):'',
    apprMineN?i18tn('home_hero_need',apprMineN,{n:apprMineN}):'',
  ].filter(Boolean).join(' · ');
  /* THE GREETING IS BACK, OWNER-ASKED (20 Aug 2026, off the old hero render —
     this reverses "a page title is not a salutation"): a small time-of-day
     line over the page's real title. The hour is the reader's own clock; the
     name is their first name, falling back to the dictionary's "there". */
  const hour=new Date().getHours();
  const greetKey=hour<12?'home_greet_morning':hour<17?'home_greet_afternoon':'home_greet_evening';
  const firstName=String((me&&me.name)||'').trim().split(/\s+/)[0]||i18t('home_greet_there');
  const heroSection=`
    <section class="hm-strip">
      <div style="min-width:0;flex:1 1 auto;">
        <div class="hm-greet">${i18t(greetKey)}, ${esc(firstName)}</div>
        <h2 class="hm-strip-title">${i18t('home_clm_title')}</h2>
        <p class="hm-strip-line">${esc(heroLine)}</p>
      </div>
      <button id="kpi-customize" class="ui-btn" title="${i18t('home_choose_metrics')}" style="font-size:11px;padding:5px 10px;display:inline-flex;align-items:center;gap:6px;flex:none;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
        ${i18t('home_customize')}
      </button>
      <button id="hero-draft" class="ui-btn" style="font-size:11.5px;font-weight:600;padding:5px 11px;display:inline-flex;align-items:center;gap:7px;flex:none;">
        ${icon('plus','w-3.5 h-3.5',2)} ${i18t('home_draft_new')}
      </button>
    </section>`;

  /* ---- ACTIVE CONTRACT LIFECYCLE PIPELINE (redesign) ----
     Three columns for the three things that actually happen to a contract, each
     showing the live records sitting in that stage. The column headers are the
     old stage filters, so every click-through the segmented bar used to offer
     still works. "Closed" is not a lifecycle stage you work in, so it keeps its
     place on the bar below rather than taking a fourth column. */
  const PIPE_DEF=[
    {k:'Draft',        n:1, get title(){ return i18t('home_stage_draft'); },  tone:'steel',   fg:'var(--color-neutral-700)', bd:'var(--color-divider)',                              chip:'var(--color-neutral-100)'},
    {k:'Under Review', n:2, get title(){ return i18t('home_stage_review'); },  tone:'amber',   fg:'var(--st-amber-fg)',       bd:'color-mix(in srgb,#f59e0b 34%,transparent)',        chip:'var(--st-amber-bg)'},
    {k:'Signed',       n:3, get title(){ return i18t('home_stage_sign'); },   tone:'emerald', fg:'var(--st-green-fg)',       bd:'color-mix(in srgb,#10b981 34%,transparent)',        chip:'var(--st-green-bg)'},
  ];
  /* ---- ONE RING AND ONE LIST, NOT THREE COLUMNS (owner-asked, 13 Aug 2026) ----
     The card drew three scrolling columns side by side. Each was a third of the
     card wide, so a contract's name was cut off mid-word ("Mutual Non-Disclo…")
     on every row, and the shape of the book — where the live agreements
     actually sit — had to be read off three separate counts.

     It is a ring on two thirds and ONE list on one third now: press a segment,
     or its row in the key, and the list beside it swaps to that stage. NOTHING
     ABOUT THE CARD CHANGED — same box, same padding, same heading, same "View
     full register", and it is still exactly as tall as Decisions due beside it.
     Only what is painted inside it.

     IT IS ALL IN THE MARKUP, NOT PAINTED ON AFTER. The first build filled the
     ring and the list from script once the card was in the DOM, which left the
     rendered HTML holding empty placeholders — the dashboard's own tests read
     that HTML, and a card that is blank until script runs is a card that is
     blank if script never does. The builders below are used BY the template and
     again by hmPaint when a stage is pressed.

     THE COLOURS ARE THE CARD'S OWN. Draft has always been drawn in neutral here
     (PIPE_DEF's fg is --color-neutral-700, its chip --color-neutral-100), and
     that turns out to be the only workable choice: in a teal workspace the
     "steel" tone is #14b8a6 and the executed tone is #10b981 — 5.4 apart on the
     normal-vision scale, which is two slices of one colour once they touch in a
     ring rather than sitting in separate columns. Neutral for work not started,
     amber for work in flight, green for work done: measured apart in both
     themes, and every slice is named in the key besides. */
  const PIPE_DOT=['var(--color-neutral-500)','var(--st-amber-dot)','var(--st-green-dot)'];
  const hmCounts=PIPE_DEF.map(st=>cs.filter(c=>c.status===st.k).length);
  const hmTotal=hmCounts.reduce((a,b)=>a+b,0);
  /* Whichever stage is listed. Per sitting, in memory — a working preference,
     not a setting. Falls back to the first stage that has anything in it. */
  if(_hmStage==null||!PIPE_DEF.some(st=>st.k===_hmStage))
    _hmStage=(PIPE_DEF[Math.max(0,hmCounts.findIndex(n=>n>0))]||PIPE_DEF[0]).k;
  const hmIdx=()=>Math.max(0,PIPE_DEF.findIndex(st=>st.k===_hmStage));
  const hmPct=i=>hmTotal?Math.round((hmCounts[i]/hmTotal)*100):0;

  const RING_R=70, RING_C=2*Math.PI*70, RING_SEG_GAP=5;
  const hmArcsHtml=()=>{ let at=0;
    return PIPE_DEF.map((st,i)=>{
      const len=hmTotal?(hmCounts[i]/hmTotal)*RING_C:0;
      const draw=Math.max(len-RING_SEG_GAP,0), on=i===hmIdx();
      const arc=`<circle class="hm-seg" cx="100" cy="100" r="${RING_R}" fill="none"`
        +` stroke="${PIPE_DOT[i]}" stroke-width="${on?34:26}"`
        +` stroke-dasharray="${draw.toFixed(2)} ${(RING_C-draw).toFixed(2)}" stroke-dashoffset="${(-at).toFixed(2)}"`
        +` tabindex="0" role="button" aria-pressed="${on}" data-hm-stage="${st.k}"`
        +` aria-label="${esc(st.n+'. '+st.title)} — ${hmCounts[i]}"></circle>`;
      at+=len; return arc;
    }).join('');
  };

  const hmKeyHtml=()=>PIPE_DEF.map((st,i)=>
    `<button class="hm-leg" type="button" data-hm-stage="${st.k}" aria-pressed="${i===hmIdx()}">
      <span class="hm-leg-dot" style="background:${PIPE_DOT[i]}"></span>
      <span class="hm-leg-name">${st.n}. ${esc(st.title)}</span>
      <span class="hm-leg-n">${hmCounts[i]}</span>
      <span class="hm-leg-pct">${hmPct(i)}%</span>
      <span class="hm-leg-bar"><i style="width:${hmPct(i)}%;background:${PIPE_DOT[i]}"></i></span>
    </button>`).join('');

  /* A ROW IS TWO LINES, NOT THREE: the name, then the state and the
     counterparty sharing one — the same facts the old card carried, in two
     thirds of the height, which is what puts more of them on screen.

     THE FLAG ONLY SAYS WHAT THE HEADING DOES NOT. The list is titled with the
     stage, so repeating it on every row is the same word twice; what the
     heading cannot say is which are executed and which need somebody. */
  const pipeRow=(c,st)=>{
    const risky=st.k==='Under Review'&&contractRisk(c)>=60;
    const flag=st.k==='Signed'
      ? `<span class="hm-row-flag" style="color:var(--st-green-fg);">${icon('check2','w-3 h-3',2)}${c.signedAt?i18t('home_stage_executed'):i18t('home_signed')}</span>`
      : risky ? `<span class="hm-row-flag" style="color:var(--st-amber-fg);">${i18t('home_action')}</span>` : '';
    return `<button data-sel="${c.id}" class="hm-row" type="button">
      <span class="hm-row-name">${esc(c.name)}</span>
      <span class="hm-row-meta">${flag}${flag?'<span class="hm-row-sep">&middot;</span>':''}<span class="hm-row-cp">${esc(c.counterparty||i18t('home_no_counterparty_yet'))}</span></span>
    </button>`;
  };

  /* EIGHT IN THE BOX, THE REST BEHIND THE LINK — and the box takes the height
     that is left rather than asking for one, so the card cannot grow when the
     stage changes. */
  const hmSideHtml=()=>{
    const i=hmIdx(), st=PIPE_DEF[i];
    const list=cs.filter(c=>c.status===st.k);
    const shown=(st.k==='Under Review'?list.slice().sort((a,b)=>contractRisk(b)-contractRisk(a)):list).slice(0,8);
    return `<div class="hm-side-head">
        <h5 class="hm-side-title" style="color:${st.fg};">${st.n}. ${esc(st.title)}</h5>
        <button class="hm-side-count" type="button" data-stage="${st.k}" style="background:${st.chip};color:${st.fg};">${i18tn('home_docs',hmCounts[i],{n:hmCounts[i]})}</button>
      </div>
      <div class="hm-pipe-list scroll-thin" id="hm-list">${
        shown.map(c=>pipeRow(c,st)).join('')||`<div class="hm-row-none">${i18t('home_nothing_at_stage')}</div>`}</div>
      <div class="hm-side-foot">${list.length>shown.length
        ? `<button data-stage="${st.k}" class="hm-side-more" type="button">${i18t('home_more_arrow',{n:list.length-shown.length})}</button>` : ''}</div>`;
  };

  const lifecycleSection=`
    <section class="hm-pipe-card" style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:none;border-radius:0;padding:16px 18px;min-width:0;">
      <div style="flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;">
        <h4 style="font-size:14px;margin:0;font-weight:700;">${i18t('home_pipeline_aria')}</h4>
        <button data-open-register style="border:0;background:none;cursor:pointer;font:inherit;font-size:11.5px;color:var(--color-accent-600);font-weight:600;padding:0;">${i18t('home_view_register')}</button>
      </div>
      <div class="hm-pipe-cols" style="display:grid;gap:11px;">
        <div class="hm-pipe-chart" id="hm-pipe-chart">
          <div class="hm-ring-row" id="hm-ring-row">
            <div class="hm-ring-block">
              <div class="hm-ring-stage">
                <svg viewBox="0 0 200 200" role="img" aria-label="${esc(i18t('home_pipeline_aria'))}">
                  <circle cx="100" cy="100" r="${RING_R}" fill="none" stroke="var(--color-neutral-100)" stroke-width="26"></circle>
                  <g id="hm-segs" transform="rotate(-90 100 100)">${hmArcsHtml()}</g>
                </svg>
                <div class="hm-ring-centre">
                  <div class="hm-ring-fig" id="hm-fig">${hmCounts[hmIdx()]}</div>
                  <div class="hm-ring-of" id="hm-of">${i18t('home_pipe_of_live',{n:hmTotal})}</div>
                </div>
              </div>
              <div class="hm-ring-what" id="hm-what">${esc(PIPE_DEF[hmIdx()].title)}<small>${esc(i18t('home_pipe_share',{n:hmPct(hmIdx())}))}</small></div>
            </div>
            <div class="hm-key" id="hm-key">${hmKeyHtml()}</div>
          </div>
          <div class="hm-ring-hint" id="hm-hint">${i18t('home_pipe_pick')}</div>
        </div>
        <div class="hm-pipe-side" id="hm-side">${hmSideHtml()}</div>
      </div>
    </section>`;

  /* ---- DECISIONS DUE (in the design's feed slot) ----
     The audit stream that sat here read "Created — Seeded as sample data" over
     and over, because a created record is the only history a fresh contract
     has. What belongs in the one column beside the pipeline is what needs a
     person: a renewal decision whose date is closing, and paper that has sat in
     review. Drawn in the design's feed row — a round tone tile, two lines — and
     capped to the pipeline's height, scrolling inside its own box. */
  const decisionItems=[
    /* REVIEWS LEAD, because they are the only item on this card that somebody
       is personally waiting on. A renewal date does not know your name; a
       colleague who sent you three redlines on Tuesday does. */
    ...myReviews.map(x=>({
      cid:x.c.id, urgent:!!(x.rv.due&&String(x.rv.due)<new Date().toISOString().slice(0,10)), ic:'users',
      txt:i18t('rv_home_title')+' — <strong style="font-weight:600">'+esc(x.c.name)+'</strong>',
      meta:`${esc(i18t('rv_home_from',{who:x.rv.by}))} · ${esc(i18tn('rv_home_sub',x.st.total,{n:x.st.total}))}`,
      tag:x.rv.due?esc(String(x.rv.due)):esc(i18t('rv_home_open')),
    })),
    /* ---- SOMEBODY IS ASKING TO JOIN A NEGOTIATION YOU LEAD ----
       Not a new inbox. A request to join is exactly the shape of everything
       else on this card — one colleague waiting on one answer from this reader
       by name — and putting it anywhere else would be a second place to look
       for the same kind of thing. Answered in the desk sheet, one press away
       from the contract it is about. */
    /* Quiet deals lead everything: the counterparty is already waiting, and
       every day this sits on the card is a day they are not being answered. */
    ...myStaleDesks.map(x=>({
      cid:x.c.id, urgent:true, ic:'clock',
      txt:i18t('dk_stale_card',{who:esc(x.c.counterparty||i18t('home_no_counterparty'))})
        +' — <strong style="font-weight:600">'+esc(x.c.name)+'</strong>',
      meta:esc(i18tn('dk_stale_sub',x.stale.n,{n:x.stale.n,who:x.stale.lead.name})),
      tag:esc(i18t('dk_stale_tag',{n:x.stale.days})),
    })),
    ...myJoinAsks.map(x=>({
      cid:x.c.id, urgent:false, ic:'users',
      txt:i18t('dk_join_card',{who:esc(x.req.name)})+' — <strong style="font-weight:600">'+esc(x.c.name)+'</strong>',
      meta:x.req.why?`“${esc(x.req.why)}”`:esc(x.c.counterparty||i18t('home_no_counterparty')),
      tag:esc(i18t('dk_ask_tag')),
    })),
    ...decisions.map(x=>({
      cid:x.c.id, urgent:x.d<=30, ic:'calendar',
      txt:i18t('home_renew_or_exit',{name:`<strong style="font-weight:600">${esc(x.c.name)}</strong>`}),
      meta:i18t('home_decide_by',{who:esc(x.c.counterparty||i18t('home_no_counterparty')),when:fmtDDay(x.dd)}),
      tag:x.d===0?i18t('home_today'):i18t('home_in_days',{n:x.d}),
    })),
    ...waitingLongest.map(x=>({
      cid:x.c.id, urgent:x.idle>=30, ic:'clock',
      txt:i18t('home_waiting_on_review',{name:`<strong style="font-weight:600">${esc(x.c.name)}</strong>`}),
      meta:`${esc(x.c.counterparty||i18t('home_no_counterparty'))} · ${esc(x.c.id)}`,
      tag:i18t('home_idle_days',{n:x.idle}),
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
    || `<div style="display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--color-neutral-500);padding:12px 2px;"><span style="color:var(--st-green-fg);display:inline-flex;">${icon('check2','w-4 h-4')}</span>${i18t('home_nothing_to_decide')}</div>`;
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
    reviewN?lnk('data-open-review',i18t('home_waiting_in_review',{n:reviewN})):'',
  ].filter(Boolean);
  const decisionFooter=(decisionItems.length>8||footerLinks.length>1)&&footerLinks.length
    ? `<div style="flex:none;margin-top:8px;padding-top:8px;border-top:1px solid var(--color-divider);display:flex;flex-direction:column;gap:2px;align-items:flex-start;">${footerLinks.join('')}</div>`
    : '';
  const activitySection=`
    <section style="flex:1;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:none;border-radius:0;padding:16px 18px;display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex:none;">
        <h4 style="font-size:14px;margin:0;font-weight:700;">${i18t('home_decisions_due')}</h4>
        <span class="live-ping" style="width:7px;height:7px;border-radius:50%;background:${decisionItems.length?'#f59e0b':'#10b981'};flex:none;"></span>
        ${decisionItems.length?`<span style="margin-left:auto;font-size:10px;font-weight:700;padding:2px 8px;background:var(--st-amber-bg);color:var(--st-amber-fg);">${decisionItems.length}</span>`:''}
      </div>
      <div class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;">${decisionRows}</div>
      ${decisionFooter}
    </section>`;

  /* ---- THE BOTTOM ROW: three summary cards (owner-approved render, 20 Aug 2026) ----
     Drawings of numbers hmDashSlices ALREADY computes — nothing here counts
     anything of its own (the one-count-many-surfaces rule): what expires
     inside 90 days and the money at stake, what has been sent out and sits
     unsigned, and what carries a risk score of 60 or more beside how many are
     clean. Each card is a DOOR to the page that acts on its number — the
     calendar, the negotiations list, Our standards. The little donut is a
     plain inline SVG (share of the live book) in the same semantic colours as
     the KPI top edges. IT IS ALL IN THE MARKUP — the pipeline card's lesson:
     the numbers are in the rendered HTML, never painted on after. */
  const footRing=(n,color)=>{ const C=2*Math.PI*21, f=Math.max(n?0.06:0, Math.min(1, n/Math.max(1,live.length)));
    return `<svg width="52" height="52" viewBox="0 0 52 52" style="flex:none;" aria-hidden="true">
      <circle cx="26" cy="26" r="21" fill="none" stroke="var(--color-neutral-100)" stroke-width="7"></circle>
      <circle cx="26" cy="26" r="21" fill="none" stroke="${color}" stroke-width="7" stroke-dasharray="${(f*C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 26 26)"></circle>
      <text x="26" y="32" text-anchor="middle" style="font:300 17px var(--font-body);fill:var(--color-text);">${n}</text>
    </svg>`; };
  /* Owner-asked 20 Aug 2026: the card wears its status on its LEFT EDGE, the
     change card's own mark. The tone is the ring's tone while the count says
     something is waiting, and the green dot when it is zero — an all-clear
     card must not wear an alarm colour. Inline on the element, like the KPI
     top edges, so the hover's border-color repaint can never erase it (the
     KPI cards' recorded lesson); left padding gives back the 2px the wider
     border takes, so the content does not shift against the other cards. */
  const footTone=(n,alert)=> n?alert:'var(--st-green-dot)';
  const footCard=(tone,ring,title,sub,act,attr)=>`
    <button ${attr} class="hm-foot-card" type="button" style="border-left:3px solid ${tone};padding-left:14px;">
      ${ring}
      <span style="min-width:0;text-align:left;">
        <span style="display:block;font-size:13px;font-weight:700;color:var(--color-text);">${title}</span>
        <span style="display:block;font-size:12px;color:var(--color-neutral-500);margin:2px 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sub}</span>
        <span style="display:block;font-size:11.5px;font-weight:600;color:var(--color-accent-600);">${act} &rarr;</span>
      </span>
    </button>`;
  /* Money on the expiring card only where the reader may see money — the
     no-rights sub says WHEN instead, which expDelta above already words. */
  const expSubLine=expiring.length
    ? (money?i18t('home_exp90_value',{v:fmtMoneyShort(expVal(expiring))}):expDelta(expiring))
    : i18t('home_exp90_none');
  const waitSub=awaitingCount?i18tn('home_wait_n',awaitingCount,{n:awaitingCount}):i18t('home_wait_none');
  const expTone=footTone(expiring.length,'var(--st-ruby-dot)'),
        waitTone=footTone(awaitingCount,'var(--st-amber-dot)'),
        riskTone=footTone(highRisk.length,'var(--st-ruby-dot)');
  const footRow=`
    <div class="hm-foot">
      ${footCard(expTone,footRing(expiring.length,expTone),i18t('home_exp90_title'),expSubLine,i18t('home_exp90_open'),'data-foot-cal')}
      ${footCard(waitTone,footRing(awaitingCount,waitTone),i18t('home_wait_title'),waitSub,i18t('home_wait_open'),'data-foot-nego')}
      ${footCard(riskTone,footRing(highRisk.length,riskTone),i18t('home_risk_title'),i18t('home_risk_sub',{n:clean}),i18t('home_risk_open'),'data-foot-std')}
    </div>`;

  /* U-2: a brand-new workspace opened on a cockpit of zeroed gauges with no
     route to the three real entry points. When there are no contracts yet, show
     a first-run welcome that points at them — draft from a template, import an
     existing portfolio, or explore — above the (still-zeroed) dashboard. Purely
     additive, so nothing that already renders disappears. */
  const firstRunBanner = countAll===0 ? `
    <section style="border:1px solid var(--color-divider);border-radius:0;background:var(--color-surface);padding:22px 22px 20px;">
      <h2 style="margin:0 0 4px;font-family:var(--font-heading);font-weight:700;font-size:19px;color:var(--color-text);">${i18t('home_welcome')}</h2>
      <p style="margin:0 0 16px;font-size:12.5px;color:var(--color-neutral-600);max-width:64ch;line-height:1.55;">${i18t('home_welcome_sub')}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;">
        <button id="fr-draft" style="text-align:left;border:1px solid var(--color-divider);border-radius:0;background:var(--color-bg);padding:15px;cursor:pointer;font:inherit;">
          <div style="font-weight:700;font-size:13px;color:var(--color-text);margin-bottom:3px;">${i18t('home_draft_contract')}</div>
          <div style="font-size:11.5px;color:var(--color-neutral-600);line-height:1.5;">Fill in the blanks on a ${regionNow} template — the register, filters and reminders populate as you type.</div>
        </button>
        <button id="fr-import" style="text-align:left;border:1px solid var(--color-divider);border-radius:0;background:var(--color-bg);padding:15px;cursor:pointer;font:inherit;">
          <div style="font-weight:700;font-size:13px;color:var(--color-text);margin-bottom:3px;">${i18t('home_import_existing')}</div>
          <div style="font-size:11.5px;color:var(--color-neutral-600);line-height:1.5;">${i18t('home_import_sub')}</div>
        </button>
        <button id="fr-explore" style="text-align:left;border:1px solid var(--color-divider);border-radius:0;background:var(--color-bg);padding:15px;cursor:pointer;font:inherit;">
          <div style="font-weight:700;font-size:13px;color:var(--color-text);margin-bottom:3px;">${i18t('home_explore_register')}</div>
          <div style="font-size:11.5px;color:var(--color-neutral-600);line-height:1.5;">${i18t('home_explore_sub')}</div>
        </button>
      </div>
    </section>` : '';
  document.getElementById('content').innerHTML=`
  <div class="view-enter hm-page" style="display:flex;flex-direction:column;gap:12px;padding:14px 20px 20px;">
    ${emailSetupLineHtml()}
    ${firstRunBanner}

    <!-- The Getting started checklist has left this page. It occupied the top
         of the dashboard permanently to carry four one-off steps; the same
         steps are visible in the work itself. gettingStartedHtml() is kept
         intact so it can be put back or moved elsewhere. -->

    <!-- Welcome banner — what this workspace is for, and the button that starts work -->
    ${heroSection}

    <!-- KPI ribbon — customizable flat cards with a coloured top edge (pick,
         drag to reorder). The KEY METRICS caption row is retired (the SAP
         treatment): the cards say what they are, and Customize now sits on
         the Portfolio strip above. -->
    <section>
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

    <!-- Three summary cards under the main row — each a door (calendar,
         negotiations, standards). The page already scrolls when content
         outgrows the window (overflow-y:auto on .hm-page), so a short laptop
         scrolls to them rather than crushing the row above. -->
    ${footRow}

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
  /* The bottom row's three doors. Negotiations goes through the NAMED door —
     a bare setView('redline') reads state.activeId and would reopen whatever
     contract was last touched (the Negotiations-door rule). */
  document.querySelector('[data-foot-cal]')?.addEventListener('click',()=>setView('calendar'));
  document.querySelector('[data-foot-nego]')?.addEventListener('click',()=>{
    if(window.openNegotiations) openNegotiations({list:true}); else setView('redline'); });
  document.querySelector('[data-foot-std]')?.addEventListener('click',()=>setView('playbook'));
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
  /* ---- PRESSING A STAGE SWAPS THE CARD'S CONTENTS AND NOTHING ELSE ----
     Repainted in place rather than re-rendering the dashboard: the rest of the
     page does not so much as reflow. The handlers sit on the three containers,
     which survive a repaint, so they are attached once per render and never
     stack. */
  const hmPane=document.getElementById('hm-pipe-chart');
  if(hmPane){
    const hmSegs=document.getElementById('hm-segs');
    const hmKey=document.getElementById('hm-key');
    const hmSide=document.getElementById('hm-side');
    const hmRow=document.getElementById('hm-ring-row');

    const hmPaint=()=>{
      const i=hmIdx();
      hmSegs.innerHTML=hmArcsHtml();
      hmKey.innerHTML=hmKeyHtml();
      hmSide.innerHTML=hmSideHtml();
      document.getElementById('hm-fig').textContent=hmCounts[i];
      document.getElementById('hm-what').innerHTML=
        esc(PIPE_DEF[i].title)+'<small>'+esc(i18t('home_pipe_share',{n:hmPct(i)}))+'</small>';
    };

    /* THE RING IS MEASURED FROM THE CARD, NEVER THE OTHER WAY ROUND. The card's
       height belongs to .hm-main-row; the chart is sized to whatever it is
       handed and can never push the card taller. */
    const RING_FLOOR=84, RING_MIN=120, RING_MAX=200, KEY_MIN=250, PANE_PAD=20, PANE_GAP=18;
    const hmFit=()=>{
      if(!hmPane.getBoundingClientRect) return;      // not a measuring DOM
      const r=hmPane.getBoundingClientRect();
      if(!r.height||!r.width) return;                // a hidden pane has no width
      /* Each step down drops the cheapest line left on the card — first the
         hint, then the proportion bars — and only when the key genuinely does
         not fit the height the card has. Measured, not a magic width. */
      hmPane.classList.remove('hm-tight','hm-vtight');
      const fits=()=>hmKey.scrollHeight<=r.height-PANE_PAD;
      if(!fits()||r.height<300) hmPane.classList.add('hm-tight');
      if(!fits()) hmPane.classList.add('hm-vtight');
      const chrome=hmPane.classList.contains('hm-tight')?34:56;
      const keyH=hmKey.scrollHeight;
      const beside=Math.min(r.height-PANE_PAD-chrome, r.width-PANE_PAD-PANE_GAP-KEY_MIN);
      const stacked=Math.min(r.height-PANE_PAD-chrome-keyH-10, r.width-PANE_PAD);
      /* THE ROW IS THE DESIGN (owner-approved render, 20 Aug 2026 — this
         REVERSES "stacking earns its place by leaving a bigger ring"): the
         ring sits BESIDE its stage list wherever a usable ring fits there,
         and stacking is only the fallback for a card too narrow to hold both.
         A bigger ring stopped being a prize the day RING_MAX came down to the
         render's modest size. Taking the stack on a short card is still what
         pushes the key out through the bottom of the pane. */
      const stack=beside<RING_MIN&&stacked>=RING_MIN;
      hmRow.classList.toggle('hm-stack',stack);
      /* RING_MIN is a preference, not a floor to clamp UP to — clamping a
         negative budget up to 120px is how a chart grows larger than the space
         it is being fitted into. */
      hmPane.style.setProperty('--hm-ring',
        Math.max(RING_FLOOR,Math.min(RING_MAX,Math.floor(stack?stacked:beside)))+'px');
    };

    const hmPick=k=>{
      if(!k||k===_hmStage) return;
      _hmStage=k; hmPaint(); hmFit();
      const hint=document.getElementById('hm-hint'); if(hint) hint.hidden=true;
    };
    hmSegs.addEventListener('click',e=>{ const el=e.target.closest&&e.target.closest('.hm-seg'); if(el) hmPick(el.getAttribute('data-hm-stage')); });
    hmSegs.addEventListener('keydown',e=>{ const el=e.target.closest&&e.target.closest('.hm-seg'); if(!el) return;
      if(e.key==='Enter'||e.key===' '){ e.preventDefault(); hmPick(el.getAttribute('data-hm-stage')); } });
    hmKey.addEventListener('click',e=>{ const el=e.target.closest&&e.target.closest('.hm-leg'); if(el) hmPick(el.getAttribute('data-hm-stage')); });
    /* The list is rebuilt on every press, so its rows are reached by
       delegation from the pane that survives — not bound per row. */
    hmSide.addEventListener('click',e=>{
      const t=e.target.closest&&e.target.closest('[data-sel],[data-stage]');
      if(!t) return;
      if(t.hasAttribute('data-sel')) selectContract(t.getAttribute('data-sel'));
      else { const Rg=regState(); Rg.stage=t.getAttribute('data-stage'); Rg.type='all'; Rg.sel={}; setView('register'); }
    });

    hmFit();
    if(typeof ResizeObserver==='function') new ResizeObserver(hmFit).observe(hmPane);
  }

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

Object.assign(window,{renderDashboard,hmDashSlices,gsSteps,gettingStartedHtml,gsIsSeed,
  KPI_META,currentKpiSel,setKpiSel,kpiCatalogOrder,DEFAULT_KPI_SEL,KPI_MAX,kpiAtMax,readyToSignItems});
