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
  negotiations:'Live negotiations',
  approvals:'Pending approvals', compliance:'Compliance rating', expiring30:'Expiring < 30 days',
  expiring60:'Expiring < 60 days', expiring90:'Expiring < 90 days', expired:'Term already ended',
  highrisk:'High-risk findings', avgcycle:'Avg turnaround time',
  obligations:'Obligations due',
  payterms:'Payment terms over standard' };
/* Falls back to the English WORD, never the dictionary key — a tile reading
   `kpi_avgcycle` looks like broken software, one reading "Avg turnaround time"
   on a Swedish screen looks only untranslated. */
const KPI_META=Object.keys(KPI_EN)
  .reduce((o,k)=>(Object.defineProperty(o,k,{enumerable:true,
    get(){ return typeof t==='function' ? i18t('kpi_'+k) : KPI_EN[k]; }}),o),{});
const KPI_ALL_ORDER=['approvals','negotiations','obligations','payterms','expiring90','avgcycle','under_mgmt','active_value','compliance','awaiting','expiring30','expiring60','expired','highrisk'];
/* ---- THE DEFAULT FOUR ARE "WHAT NEEDS ME TODAY" (owner-ruled 24 Aug 2026) ----
   They were Active contracts · Avg turnaround · Pending approvals · Compliance
   rating, and two of those were saying what the row beneath them already says:
   Active contracts is printed in the lifecycle tile's own footnote, and
   Compliance is a tile of its own on the fixed row. The first thing on the
   page repeated the second thing on the page.

   THE TWO ROWS NOW ANSWER DIFFERENT QUESTIONS. This one is what is owed —
   approvals sitting on you, rounds in flight, terms about to end, and how long
   the last ninety days took. The Portfolio row below is the shape of the book.
   Nothing left the catalogue: all twelve are still one press away under
   Customize, and a reader who wants the old four puts them straight back. */
const DEFAULT_KPI_SEL=['approvals','negotiations','expiring90','avgcycle'];
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
  /* Second click on the gear closes it. The trap hands focus back to whatever
     opened it, which on this path is the gear the reader has just pressed —
     so the release runs while the node is still in the document. */
  if(prev){ if(prev._kpiRelease){ try{ prev._kpiRelease(); }catch(_){} } prev.remove(); return; }
  /* The outside-press listener from a popover this one replaces. It removes
     itself on the next document click, but a run of ticks would stack one per
     tick until then — armed once, dropped here. */
  if(_kpiPopOff){ document.removeEventListener('click',_kpiPopOff,true); _kpiPopOff=null; }
  const sel=currentKpiSel();
  const full=kpiAtMax(sel);
  const pop=document.createElement('div');
  pop.id='kpi-cust-pop';
  pop.style.cssText='position:absolute;z-index:60;top:calc(100% + 6px);right:0;width:252px;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);border-radius:var(--radius);padding:var(--s-2);';
  /* At four, the rows that cannot be turned on SAY SO before they are pressed —
     dimmed, not pointing, and carrying the sentence as a tooltip. The ticked
     four stay live, because turning one off is the way forward. */
  const row=id=>{
    const on=sel.includes(id), shut=full&&!on;
    return `
    <label ${shut?`title="${esc(i18t('home_max_metrics',{max:KPI_MAX}))}"`:''}
      style="display:flex;align-items:center;gap:9px;padding:7px var(--s-2);border-radius:var(--radius);font-size:var(--t-body);${
        shut?'cursor:default;opacity:.45;':'cursor:pointer;'}"${
        shut?'':` onmouseover="this.style.background='color-mix(in srgb,var(--color-accent) 9%,transparent)'" onmouseout="this.style.background='none'"`}>
      <input type="checkbox" data-kpi-toggle="${id}" ${on?'checked':''} ${shut?'disabled':''} style="width:15px;height:15px;accent-color:var(--color-accent);flex:none;"/>
      <span style="flex:1;">${KPI_META[id]}</span>
    </label>`;
  };
  pop.innerHTML=`
    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:var(--s-2);padding:var(--s-1) var(--s-2) 6px;">
      <span style="font-size:var(--t-micro);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500);font-weight:var(--w-title);">${i18t('home_show_metrics')}</span>
      ${''/* The count is the rule, stated without being pressed: a reader who
             sees "4 of 4" never has to discover the ceiling by hitting it. */}
      <span id="kpi-cust-count" style="font-size:var(--t-label);font-weight:var(--w-title);font-variant-numeric:tabular-nums;color:${full?'var(--color-accent-700)':'var(--color-neutral-500)'};">${i18t('home_metrics_count',{n:sel.length,max:KPI_MAX})}</span>
    </div>
    ${kpiCatalogOrder().map(row).join('')}
    <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--s-2);border-top:1px solid var(--color-divider);margin-top:6px;padding:var(--s-2) var(--s-2) var(--s-1);">
      <span style="font-size:var(--t-label);color:var(--color-neutral-500);">${full?esc(i18t('home_max_metrics',{max:KPI_MAX})):i18t('home_drag_reorder')}</span>
      <button data-kpi-reset style="border:0;background:none;color:var(--accent-ink-700);font-weight:var(--w-strong);font-size:var(--t-label);cursor:pointer;padding:0;flex:none;">${i18t('home_reset')}</button>
    </div>`;
  anchor.parentElement.style.position='relative';
  anchor.parentElement.appendChild(pop);
  /* ---- THE KEYBOARD STAYS IN THE POPOVER, AND ESCAPE SHUTS IT ---- (25 Aug 2026)
     It had neither. Measured: Tab from the last tick walked into the KPI cards
     behind it — cards that are also DRAG HANDLES — and the only way to dismiss
     it was a mouse click somewhere else, which a keyboard reader does not have.
     kpiApply re-opens this popover against the freshly drawn button on every
     tick, so the trap is set here, where the element is created, and the two
     always match; the ways out below each release it. */
  const popRelease = (typeof window.trapFocus==='function') ? window.trapFocus(pop) : null;
  const shut = () => {
    if(popRelease){ try{ popRelease(); }catch(_){} }
    pop.remove(); document.removeEventListener('keydown', onEsc, true);
  };
  const onEsc = e => { if(e.key==='Escape' && pop.isConnected){ e.stopPropagation(); shut(); } };
  document.addEventListener('keydown', onEsc, true);
  pop._kpiRelease = shut;
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
  setTimeout(()=>{ const onDoc=e=>{ if(!pop.contains(e.target)&&e.target!==anchor&&!anchor.contains(e.target)){ shut(); document.removeEventListener('click',onDoc,true); if(_kpiPopOff===onDoc) _kpiPopOff=null; } }; _kpiPopOff=onDoc; document.addEventListener('click',onDoc,true); },0);
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
      <div style="font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--st-green-fg);margin-bottom:5px">${i18t('home_ready_to_sign')}</div>
      ${items.slice(0,6).map(r=>`
        <button data-sel="${esc(r.c.id)}" style="display:flex;align-items:flex-start;gap:9px;width:100%;padding:7px var(--s-1);border:0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 7%,transparent);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit" onmouseover="this.style.background='color-mix(in srgb,var(--color-text) 5%,transparent)'" onmouseout="this.style.background='none'">
          <span style="flex:1;min-width:0">
            <span style="display:block;font-size:var(--t-meta);font-weight:var(--w-body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.c.name)}</span>
            <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.sig.by||r.c.counterparty||'They')} signalled ready — nothing is signed yet</span>
          </span>
          <span style="font-size:var(--t-label);font-weight:var(--w-strong);font-family:var(--font-mono);color:var(--st-green-fg);flex:none">issue link</span>
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
  const CIRCLE='width:20px;height:20px;flex:none;display:grid;place-items:center;border-radius:50%;font-size:var(--t-label);font-weight:var(--w-title);font-family:var(--font-mono)';
  const rows=steps.map((s,i)=>{
    const isCur=!all&&cur&&s.k===cur.k;
    const dot=s.done
      ?`<span style="${CIRCLE};background:var(--st-green-dot);color:#fff">${icon('check2','w-3 h-3')}</span>`
      :`<span style="${CIRCLE};background:none;border:2px solid ${isCur?'var(--color-accent)':'var(--color-divider)'};color:${isCur?'var(--color-accent-700)':'var(--color-neutral-500)'}">${i+1}</span>`;
    const tone=s.done?'var(--color-neutral-500)':isCur?'var(--color-text)':'var(--color-neutral-500)';
    const body=`${dot}
      <span style="min-width:0;flex:1">
        <span style="display:block;font-size:var(--t-body);font-weight:var(--w-strong);color:${tone};${s.done?'text-decoration:line-through;text-decoration-color:var(--color-neutral-400);':''}">${s.t}</span>
        ${isCur?`<span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.45">${s.d}</span>`:''}
      </span>
      ${isCur&&(s.k!=='sign'||gsGoTargetExists(s.k))?`<span style="flex:none;font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--accent-ink-700)">${i18t('home_go')}</span>`:''}`;
    /* The whole current row is the button — a target the size of the step,
       not a link the size of an arrow. */
    return isCur&&(s.k!=='sign'||gsGoTargetExists(s.k))
      ?`<button data-gs-go="${s.k}" style="display:flex;align-items:center;gap:10px;width:100%;padding:var(--s-2) 10px;border:1px solid color-mix(in srgb,var(--color-accent) 25%,transparent);border-radius:var(--radius);background:color-mix(in srgb,var(--color-accent) 6%,transparent);cursor:pointer;font:inherit;text-align:left;color:inherit">${body}</button>`
      :`<div style="display:flex;align-items:center;gap:10px;padding:var(--s-2) 10px">${body}</div>`;
  }).join('');
  return `
    <section id="gs-card" style="border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-surface);padding:var(--s-4) 18px 14px;">
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:var(--s-2)">
        <h2 style="margin:0;font-family:var(--font-heading);font-weight:var(--w-title);font-size:var(--t-card);color:var(--color-text)">${all?'You’re set up — first contract signed ⚡':'Getting started'}</h2>
        <span style="font-size:var(--t-label);color:var(--color-neutral-600);font-family:var(--font-mono)">${done} of ${steps.length} done</span>
        <span style="flex:1"></span>
        <button id="gs-dismiss" class="ui-btn" title="${i18t('home_hide_checklist')}" style="font-size:var(--t-label);padding:3px 10px">${all?'Done — hide this':'Hide'}</button>
      </div>
      <div style="height:6px;border-radius:var(--radius);background:var(--color-neutral-100);margin-bottom:10px"><i style="display:block;height:100%;border-radius:var(--radius);background:var(--color-accent);width:${Math.round(done/steps.length*100)}%"></i></div>
      ${all?`<p style="margin:0;font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.55">Your workspace has done the whole journey — a contract in, scanned, sent and signed. Everything from here is more of the same.</p>`:rows}
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
/* ---- HOW MUCH OF THE BOOK COPILOT HAS READ (owner-ruled 24 Aug 2026) ----
   This replaced the Copilot SPEND tile, and the reasoning is worth keeping:
   spend was the only figure on the page in dollars while everything else is in
   shillings, the only one an ordinary reader could not act on, and the only
   one with no list behind it. Coverage has all three the other way round.

   READ MEANS ONE STORED FINDING AGAINST THE CURRENT WORDING — a brief, a
   playbook pass or a risk scan. ANY ONE of the three: asking for all three
   would leave the number permanently bad and nobody would trust it.

   OBLIGATIONS ARE DELIBERATELY NOT ONE OF THEM. A person can type an
   obligation by hand, so counting the list would book somebody's own work to
   Copilot — the flattering reading, which is the one a dispute destroys.

   THE BRIEF IS ASKED VIA _hasBrief, THE LIST'S BOOLEAN, not _brief itself:
   the memo rides only the single contract's GET, so a count built on _brief
   alone would be right in local mode and short in server mode. That is this
   codebase's recorded defect class, twice paid for. `_brief` is still read
   beside it for the local mode and the one contract that has been opened. */
function copilotRead(c){
  return !!(c && (c._hasBrief || c._brief || c.playbook || c.scan));
}
function copilotCoverage(live){
  const list=Array.isArray(live)?live:[];
  const read=list.filter(copilotRead);
  /* A CONTRACT AMENDED SINCE IT WAS LAST UNDERSTOOD IS THE USEFUL HALF. The
     stored findings are keyed to the wording they were taken from, so when the
     wording moves they stop answering for it — which is a warning nothing else
     on this page gives. Counted only where both readings exist; an older
     record that carries no hash says nothing rather than guessing. */
  const stale=read.filter(c=>{
    const at=(c._brief&&c._brief.at)||(c.playbook&&c.playbook.at)||(c.scan&&c.scan.at);
    const moved=c.updatedAt||c.updated||null;
    if(!at||!moved) return false;
    const a=Date.parse(at), m=Date.parse(moved);
    return !!(a&&m&&m>a);
  }).length;
  return { total:list.length, read:read.length, unread:list.length-read.length, stale };
}
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
  /* ---- THE DATES COME OFF THE ROW, NOT THE TRAIL (audit fix, 23 Aug 2026) ----
     Both figures below read c.audit, and in server mode state.contracts is the
     LIGHT list whose every row has had `audit` stripped by HEAVY. So on a real
     workspace "+N this week" was permanently "+0" — a confident wrong number a
     manager reads as "nothing was raised all week" — and "Avg turnaround time"
     was permanently a dash. Both are DEFAULT cards, so this was the first thing
     most people saw. Locally, where records are whole, both worked, which is
     why it survived.
     The server already carries _raisedAt / _signedAt on every row for exactly
     this, and Reports already reads them through repRaisedAt / repSignedAt.
     The dashboard now asks the same two functions — one reading, three
     surfaces — and they fall back to the trail wherever there is one, so local
     mode and an opened contract are untouched. */
  const _raised=c=>(window.repRaisedAt?repRaisedAt(c):null);
  const _signed=c=>(window.repSignedAt?repSignedAt(c):null);
  const newThisWeek=cs.filter(c=>{ const t=_raised(c); return t!=null&&(Date.now()-t)<7*864e5; }).length;
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
    const cr=_raised(c), sg=_signed(c);          /* see the note above the KPIs */
    if(cr!=null&&sg!=null){ const d=(sg-cr)/864e5; return d>0?d:null; } return null;
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
  /* ---- WHAT THE PORTFOLIO ROW COUNTS ----
     Every one of these is BORROWED from the reading that already owns it, so
     no figure on this page is worked out twice. Each is guarded, because this
     module renders on stages that do not load every other one. */
  const negoLive=(()=>{ try{ return window.negoLiveList?negoLiveList():[]; }catch(e){ return []; } })();
  const negoNeedsMe=(()=>{ try{
    return window.negoNeedsYouTotal?negoNeedsYouTotal():0; }catch(e){ return 0; } })();
  /* THE IMPORT QUEUE is the migration worklist — documents read out of the
     back catalogue and still waiting for a person. Counted off the same flag
     the migration page's own worklist reads (migration.needsReview), so the
     tile and that page can never report different numbers. */
  const importQ=cs.filter(c=>c.migration&&c.migration.needsReview).length;
  const cov=copilotCoverage(live);
  /* ---- WHAT IS OWED, AND WHEN (J-2.1) ----
     openObligations is the ONE reading of what is still outstanding across the
     book — it drops Declined and archived contracts itself, exactly as the
     alerts panel and the Insights page read it. A DATED obligation only: one
     with no date is never chased and never reminded about, so counting it
     under a card headed "due" would put a deadline on the record that the
     record does not carry. Read through window because this module draws on
     stages where js/obligations.js is not loaded. */
  const obDue=(typeof window.openObligations==='function'
    ? (openObligations(30)||[]) : []).filter(o=>o&&o.days!=null);
  const obLate=obDue.filter(o=>o.days<0).length;
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
    /* ROUNDS IN FLIGHT. The count is negoLiveList's, which is the same reading
       the sidebar's Negotiations door and that page's own heading print — one
       count, three surfaces, the standing rule. Read through window because
       this module draws on stages where the negotiation view is not loaded,
       and READ WITHOUT WRITING: negoLiveList asks negoIsLive, which looks at
       c.changes raw. Asking negoChanges instead would run negoInit and start a
       negotiation on every contract merely by counting them. */
    negotiations:{label:KPI_META.negotiations, val:Number(negoLive.length).toLocaleString(jxLocale()),
                  delta:negoNeedsMe?i18t('home_action_required'):i18t('home_all_clear'),
                  sub:negoLive.length?i18tn('home_nego_needs_you',negoNeedsMe,{n:negoNeedsMe})
                                     :i18t('home_nego_none'),
                  grad:negoNeedsMe?G.amber:G.steel, ic:'clock', go:{nav:'redline'}},
    /* THE PROMISES. Amber only when something is actually late — the same rule
       the tab's own count follows, and the reason this card can be trusted to
       mean something when it is coloured.
       THE DESTINATION IS THE WORKLIST (J-2.3), which lists obligations rather
       than contracts and narrows with the same reading this card counts. It
       pointed at the Calendar for the hour between the two phases; the note is
       kept because the reasoning is what makes the next one cheap. */
    obligations: {label:KPI_META.obligations, val:Number(obDue.length).toLocaleString(jxLocale()),
                  delta:obLate?i18tn('home_ob_overdue',obLate,{n:obLate}):i18t('home_ob_none'),
                  get sub(){ return i18t('home_ob_sub'); },
                  grad:obLate?G.amber:G.steel, ic:'calendar',
                  /* THE LIST NARROWS WITH THE READING THE CARD COUNTED — open
                     and dated, inside the same thirty days. A door whose
                     destination counts differently from its own figure is the
                     fault Home's own rule exists to prevent. */
                  go:{obligations:{state:'open', due:'30'}}},
    /* PAYMENT TERMS, BOTH SIDES (owner-ruled 2 Sep 2026: "home tile should
       count both sides"). One number carries both only because "outside
       standard" is read in each side's own direction and the SUB-LINE NAMES
       WHICH HALF IS WHICH — a customer on ninety days costs you cash, a
       supplier on ninety is cash you keep and a governance fact besides.
       Written as one sentence with no split it reads as all bad news.

       IT COUNTS NOTHING OF ITS OWN. payOverStandard is the tab's own reading,
       borrowed, so the tile and the tab cannot disagree about what is over —
       one reading, many surfaces, the standing rule.

       AMBER ONLY WHEN SOMETHING IS ACTUALLY OVER, like the promises card
       above it. THE DESTINATION IS THE TAB, not the register: the two halves
       can only be told apart there, and a mixed list of contracts in a table
       would not explain itself. */
    payterms:   (()=>{ const p=(typeof payOverStandard==='function')?payOverStandard():{n:0,customer:0,supplier:0,counted:0};
                  return {label:KPI_META.payterms, val:Number(p.n).toLocaleString(jxLocale()),
                  delta:i18t('home_pt_of',{n:Number(p.counted).toLocaleString(jxLocale())}),
                  get sub(){ return p.n?i18t('home_pt_split',{c:p.customer,s:p.supplier}):i18t('home_pt_clear'); },
                  grad:p.n?G.amber:G.steel, ic:'coins',
                  go:{intelTab:'payterms'}}; })(),
  };
  return { cs, money, m, countAll, valOf, dU, idleOf, STAGE_DEF, stages, expiring, rdd,
    decisions, waitingLongest, fmtDDay, highRisk, awaiting, awaitingCount, me, raisedByMe,
    canApproveSomeStep, myApprovals, newThisWeek, stalled, onExecuted, lapsed, expWithin,
    exp30, exp60, exp90, expVal, expDelta, expSub, cycles, avgCycle, G, stageSub, live,
    clean, compliancePct, REG_PROFILE, apprMineN, myReviews, myJoinAsks, myStaleDesks, KPI_CATALOG,
    negoLive, negoNeedsMe, importQ, cov, agreementsIn };
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
    <div id="email-setup-banner" style="display:flex;align-items:center;gap:9px;padding:var(--s-2) 13px;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-radius:var(--radius);font-size:var(--t-meta);color:var(--st-amber-fg);line-height:1.45;">
      <span style="flex:none;display:inline-flex;color:var(--st-amber-dot);">${icon('alert','w-3.5 h-3.5')}</span>
      <span style="flex:1;min-width:0;">${i18t('home_email_not_setup')}</span>
      ${admin?`<button id="email-setup-go" style="flex:none;border:0;background:none;padding:0;font:inherit;font-size:var(--t-meta);font-weight:var(--w-title);color:var(--st-amber-fg);cursor:pointer;text-decoration:underline;text-underline-offset:2px;">${i18t('home_set_it_up')}</button>`:''}
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
    clean, compliancePct, REG_PROFILE, apprMineN, myReviews, myJoinAsks, myStaleDesks, KPI_CATALOG,
    importQ, cov } = hmDashSlices();
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
  /* ---- EVERY CARD ITS OWN COLOUR, AND ITS NUMBER TO MATCH (owner-asked
     24 Aug 2026: "the colors of the top of the cards should all be different
     for each card and the number inside the cards should reflect that color as
     well", ruled: "just to tell them apart") ----
     HaTi coloured a tile by what its metric MEANT — amber attention, ruby
     overdue, green good — so two metrics that both mean "needs attention" drew
     the same amber side by side, which is what the owner's screenshot shows.
     THE COLOUR IS NOW POSITIONAL: the four tiles in a row take four different
     tones whatever the metrics happen to be, and the numeral takes its tile's
     tone.
     WHAT THIS COSTS, put to the owner before they ruled and recorded rather
     than re-argued: colour no longer MEANS anything on this page. Amber here
     does not say "this needs you". FOUR OTHER SURFACES KEEP THE OLD MEANING
     and must not be swept with it — the sidebar's amber counts, the alerts
     panel's amber rows, the register's status tones and the calendar legend.
     Home is the exception, deliberately.
     THE DEMO'S OWN RULE WAS NARROWER, and it is worth knowing which half was
     adopted: it colours a numeral only on a STATUS tone and leaves its
     brand-teal tiles' numbers black — three of its seven. The owner asked for
     every number to follow its card and that is what this does.
     THE ZERO-COUNT GREY IS UNTOUCHED — a tile counting zero is not a door, and
     with every other number coloured it is now the only grey one, which makes
     it a stronger signal rather than a weaker one. */
  const HM_ROW_TONES=['var(--color-accent-600)','var(--st-amber-dot)',
    'var(--st-ruby-dot)','var(--st-green-dot)'];
  const HM_ROW_INKS =['var(--color-accent-700)','var(--st-amber-fg)',
    'var(--st-ruby-fg)','var(--st-green-fg)'];
  const kpiCard=id=>{ const k=KPI_CATALOG[id], t=TONE_OF(k.grad); return `
    <button data-kpi-id="${id}" draggable="true" class="hati-stat" style="position:relative;display:flex;flex-direction:column;gap:7px;align-items:stretch;border:1px solid var(--color-divider);border-top:3px solid ${TONE_EDGE[t]};border-radius:var(--radius);background:var(--color-surface);padding:var(--s-3) 14px;font:inherit;color:inherit;cursor:grab;text-align:left;box-shadow:none;transition:transform var(--dur-2) var(--ease),opacity var(--dur-1);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
      <span style="display:block;font-size:var(--t-label);font-weight:var(--w-title);letter-spacing:.1em;text-transform:uppercase;line-height:1.3;color:var(--color-neutral-500);">${k.label}</span>
      <span style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;">
        <span class="tnum" style="font-family:var(--font-mono);font-weight:var(--w-strong);font-size:22px;line-height:1.1;letter-spacing:-.02em;color:var(--color-text);">${k.val}</span>
        <span style="font-size:var(--t-label);font-weight:var(--w-strong);color:${TONE_FG[t]};text-align:right;">${k.delta}</span>
      </span>
      <span style="font-size:var(--t-label);color:var(--color-neutral-500);line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${k.sub||''}</span>
    </button>`; };
  const kpiHtml=kpiSel.map(kpiCard).join('');


  /* The dashboard no longer carries Decisions due, Obligations, the renewal
     pipeline or the approvals queue — the redesign leads on the pipeline and
     the live feed instead. The reads behind them are unchanged and still
     surface where they belong: renewal decisions and obligation due dates on
     the Calendar, an approval chain on the contract itself. What stays here is
     only what a card still counts (myApprovals feeds Pending approvals). */
  /* ---- THE HERO BANNER IS BACK (owner-chose the "Hero B" render, 20 Aug
     2026 — this supersedes the Portfolio strip of the same day), and THE SAME
     DAY'S MARKED-UP SCREENSHOT CHANGED THREE THINGS ON IT (owner-asked):
     the readiness badge became a time-of-day GREETING with the reader's first
     name (home_greet_* — morning <12, afternoon <17, evening; home_greet_there
     when nameless), the title reads home_clm_title "Contract Lifecycle
     Management" (home_hero_badge / home_hero_title are stale — flag mentions),
     and it FOLLOWS THE READER'S LANGUAGE: it was kept in English in both for a
     day and the owner reported the Swedish banner still reading English on
     20 Aug 2026 — the page's own title is read by the reader, so it takes the
     dictionary's own settled rendering of this phrase (the one ng_clm already
     used) rather than a second wording,
     and the COLOURS ARE THE ACCENT'S OWN — a gradient from the accent tokens
     in the stylesheet, teal in the green workspace, blue in navy ("similar to
     image 1 when in green and act accordingly when in blue"), never a fixed
     navy. The SUB-LINE CARRIES THE LIVE FACTS the strip used to state
     (contracts under management, active value, needs-you) — information, not
     a tagline. Square corners like everything else. NOT the retired hm-hero
     (that class stays stale); this is .hm-banner. SAME IDS, SAME WIRING:
     #kpi-customize and #hero-draft ride the banner unchanged, so the KPI
     picker still re-opens against this button after a tick (kpiApply) and the
     draft button still opens the one new-contract menu. The numbers in the
     sub-line are BOLD — the values are passed pre-wrapped, so the line is not
     esc()'d; every piece is our own arithmetic or fmtMoneyShort output. */
  /* ---- THE HERO BANNER IS RETIRED (owner-approved render, 24 Aug 2026) ----
     A dark gradient block carrying a greeting, the page's own title and three
     live facts. All three survive somewhere better: the greeting is a plain
     line at the top of the page, "Contract Lifecycle Management" moved into
     the shell bar (shellTitleFor) which is where a console names the page you
     are on, and the three facts are said by the tiles — where a number is also
     a door. .hm-banner, .hm-banner-greet, .hm-banner-cta, .hm-banner-ghost and
     home_hero_managed / _value / _need are STALE — flag any mention. */
  const REGION_LABEL={SE:'Sweden', KE:'Kenya'};
  const regionNow=REGION_LABEL[state.region]||REGION_LABEL.KE;

  /* ---- THE LIFECYCLE IS A TILE NOW, NOT A RING (24 Aug 2026) ----
     The card drew a donut on two thirds with a stage key and a third column
     listing that stage's contracts. It is three blocks in the Portfolio row:
     a count, a bar and a word, each of them a DOOR into the register narrowed
     to that stage.

     WHAT WAS LOST WAS SAID OUT LOUD BEFORE IT WAS BUILT: reading a stage's
     contracts without leaving the page. Pressing a stage now opens the
     register, which shows more per contract than the cramped column did — one
     press either way. The owner was told and chose it.

     RETIRED WITH IT: hmArcsHtml, hmKeyHtml, hmSideHtml, hmSideHeadHtml,
     hmPaint, hmFit, _hmStage, RING_MIN/RING_MAX, PIPE_DOT and every .hm-pipe-*
     and .hm-ring-* class. Flag any mention as stale. What SURVIVES is the pair
     the tile still needs — the three stages and their counts — because they
     were never the ring's, they were the book's. */
  const PIPE_DEF=[
    {k:'Draft',        n:1, get title(){ return i18t('home_stage_draft'); },  tone:'steel',   fg:'var(--color-neutral-700)', bd:'var(--color-divider)',                              chip:'var(--color-neutral-100)'},
    {k:'Under Review', n:2, get title(){ return i18t('home_stage_review'); },  tone:'amber',   fg:'var(--st-amber-fg)',       bd:'color-mix(in srgb,#f59e0b 34%,transparent)',        chip:'var(--st-amber-bg)'},
    {k:'Signed',       n:3, get title(){ return i18t('home_stage_sign'); },   tone:'emerald', fg:'var(--st-green-fg)',       bd:'color-mix(in srgb,#10b981 34%,transparent)',        chip:'var(--st-green-bg)'},
  ];
  const hmCounts=PIPE_DEF.map(st=>cs.filter(c=>c.status===st.k).length);

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
      txt:i18t('rv_home_title')+' — <strong style="font-weight:var(--w-strong)">'+esc(x.c.name)+'</strong>',
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
        +' — <strong style="font-weight:var(--w-strong)">'+esc(x.c.name)+'</strong>',
      meta:esc(i18tn('dk_stale_sub',x.stale.n,{n:x.stale.n,who:x.stale.lead.name})),
      tag:esc(i18t('dk_stale_tag',{n:x.stale.days})),
    })),
    ...myJoinAsks.map(x=>({
      cid:x.c.id, urgent:false, ic:'users',
      txt:i18t('dk_join_card',{who:esc(x.req.name)})+' — <strong style="font-weight:var(--w-strong)">'+esc(x.c.name)+'</strong>',
      meta:x.req.why?`“${esc(x.req.why)}”`:esc(x.c.counterparty||i18t('home_no_counterparty')),
      tag:esc(i18t('dk_ask_tag')),
    })),
    ...decisions.map(x=>({
      cid:x.c.id, urgent:x.d<=30, ic:'calendar',
      txt:i18t('home_renew_or_exit',{name:`<strong style="font-weight:var(--w-strong)">${esc(x.c.name)}</strong>`}),
      meta:i18t('home_decide_by',{who:esc(x.c.counterparty||i18t('home_no_counterparty')),when:fmtDDay(x.dd)}),
      tag:x.d===0?i18t('home_today'):i18t('home_in_days',{n:x.d}),
    })),
    ...waitingLongest.map(x=>({
      cid:x.c.id, urgent:x.idle>=30, ic:'clock',
      txt:i18t('home_waiting_on_review',{name:`<strong style="font-weight:var(--w-strong)">${esc(x.c.name)}</strong>`}),
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
        <span style="display:flex;align-items:baseline;gap:var(--s-2);">
          <span style="flex:1;min-width:0;font-size:var(--t-meta);line-height:1.4;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${it.txt}</span>
          <span style="flex:none;font-size:var(--t-label);font-weight:var(--w-strong);font-family:var(--font-mono);color:${fg};">${esc(it.tag)}</span>
        </span>
        <span style="display:block;margin-top:2px;font-size:var(--t-label);color:var(--color-neutral-500);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${it.meta}</span>
      </span>
    </button>`; }).join('')
    || `<div style="display:flex;align-items:center;gap:var(--s-2);font-size:var(--t-meta);color:var(--color-neutral-500);padding:var(--s-3) 2px;"><span style="color:var(--st-green-fg);display:inline-flex;">${icon('check2','w-4 h-4')}</span>${i18t('home_nothing_to_decide')}</div>`;
  /* The footer link has to lead where the rows actually live, and this card
     holds two different kinds of item. A renewal decision is a date, so the
     calendar is its home; a contract sitting in review is not on any calendar —
     it is a row in the register. Sending both to the calendar (which the old
     single-purpose panel could safely do) would land a reader on a screen that
     shows none of what they clicked. So the footer names its destination, and
     when the list mixes the two it offers both. */
  const lnk=(attr,label)=>`<button ${attr} style="border:0;background:none;padding:2px;font:inherit;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--accent-ink-700);cursor:pointer;text-align:left;">${label}</button>`;
  const renewalN=decisions.length, reviewN=waitingLongest.length;
  /* ---- EVERY LINK HERE NAMES WHERE A ROW ABOVE IT LIVES (owner-asked 20 Aug
     2026: "remove any other shortcuts unrelated to decisions due") ----
     The high-risk link rode here for a day, put in when the bottom row was
     removed so the number kept a door. It was the one link with no row above
     it — this card holds renewal decisions and contracts sitting in review,
     and nothing else — so it is gone. The number is not lost: the Compliance
     card in the ribbon opens the register sorted by risk, and Our standards is
     a door in the sidebar. home_risk_link and data-open-standards are STALE. */
  const footerLinks=[
    renewalN?lnk('data-open-decisions',`${renewalN} renewal decision${renewalN===1?'':'s'} in the calendar →`):'',
    reviewN?lnk('data-open-review',i18t('home_waiting_in_review',{n:reviewN})):'',
  ].filter(Boolean);
  const decisionFooter=(decisionItems.length>8||footerLinks.length>1)&&footerLinks.length
    ? `<div style="flex:none;margin-top:var(--s-2);padding-top:var(--s-2);border-top:1px solid var(--color-divider);display:flex;flex-direction:column;gap:2px;align-items:flex-start;">${footerLinks.join('')}</div>`
    : '';
  const activitySection=`
    <section style="flex:1;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:none;border-radius:var(--radius);padding:var(--s-4) 18px;display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:6px;flex:none;">
        <h4 style="font-size:var(--t-card);margin:0;font-weight:var(--w-title);">${i18t('home_decisions_due')}</h4>
        <span class="live-ping" style="width:7px;height:7px;border-radius:50%;background:${decisionItems.length?'var(--st-amber-dot)':'var(--st-green-dot)'};flex:none;"></span>
        ${decisionItems.length?`<span style="margin-left:auto;font-size:var(--t-label);font-weight:var(--w-title);padding:2px var(--s-2);background:var(--st-amber-bg);color:var(--st-amber-fg);">${decisionItems.length}</span>`:''}
      </div>
      <div class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;">${decisionRows}</div>
      ${decisionFooter}
    </section>`;

  /* THE BOTTOM ROW IS GONE (owner-asked 20 Aug 2026, with the Hero B render).
     Its three cards repeated what the page already said — Awaiting counterparty
     and Expiring are KPI cards, and the high-risk door now rides Decisions
     due's footer links above. hm-foot / hm-foot-card / data-foot-* and the
     home_exp90_* / home_wait_* / home_risk_title keys are STALE — flag any
     mention (home_risk_link is the survivor). */

  /* U-2: a brand-new workspace opened on a cockpit of zeroed gauges with no
     route to the three real entry points. When there are no contracts yet, show
     a first-run welcome that points at them — draft from a template, import an
     existing portfolio, or explore — above the (still-zeroed) dashboard. Purely
     additive, so nothing that already renders disappears. */
  const firstRunBanner = countAll===0 ? `
    <section style="border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-surface);padding:22px 22px 20px;">
      <h2 style="margin:0 0 var(--s-1);font-family:var(--font-heading);font-weight:var(--w-title);font-size:var(--t-page);color:var(--color-text);">${i18t('home_welcome')}</h2>
      <p style="margin:0 0 var(--s-4);font-size:var(--t-body);color:var(--color-neutral-600);max-width:64ch;line-height:1.55;">${i18t('home_welcome_sub')}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:var(--s-3);">
        <button id="fr-draft" style="text-align:left;border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-bg);padding:15px;cursor:pointer;font:inherit;">
          <div style="font-weight:var(--w-title);font-size:var(--t-body);color:var(--color-text);margin-bottom:3px;">${i18t('home_draft_contract')}</div>
          <div style="font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.5;">Fill in the blanks on a ${regionNow} template — the register, filters and reminders populate as you type.</div>
        </button>
        <button id="fr-import" style="text-align:left;border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-bg);padding:15px;cursor:pointer;font:inherit;">
          <div style="font-weight:var(--w-title);font-size:var(--t-body);color:var(--color-text);margin-bottom:3px;">${i18t('home_import_existing')}</div>
          <div style="font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.5;">${i18t('home_import_sub')}</div>
        </button>
        <button id="fr-explore" style="text-align:left;border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-bg);padding:15px;cursor:pointer;font:inherit;">
          <div style="font-weight:var(--w-title);font-size:var(--t-body);color:var(--color-text);margin-bottom:3px;">${i18t('home_explore_register')}</div>
          <div style="font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.5;">${i18t('home_explore_sub')}</div>
        </button>
      </div>
    </section>` : '';
  /* ============================================================
     THE HOME PAGE — the enterprise design, owner-approved render 24 Aug 2026
     ============================================================
     WHAT LEFT, and each because the design answers it better or elsewhere:

     THE HERO BANNER. A dark gradient block carrying a greeting, the page's own
     title and three live facts. The greeting is a plain line now; the title
     moved into the shell bar (shellTitleFor), which is where a console names
     the page you are on; and the three facts are stated by the tiles below,
     which is where a number belongs when it is also a door. hm-banner and its
     parts are STALE — flag any mention.

     THE PIPELINE RING. A donut with a stage list beside it and a third column
     listing that stage's contracts. It is the Contract lifecycle tile now:
     three blocks, three counts, three DOORS. What is lost is reading the list
     without leaving the page, and the owner was told that before this was
     built — the register shows more per contract than the cramped column did.

     THE EMAIL WARNING STRIP. It moves to the alerts panel, where a standing
     workspace fault belongs; see buildAlerts. emailSetupLineHtml is kept as a
     builder with no caller on this page rather than deleted, because it is
     exported and a third caller must not be able to bring the band back
     through a door nobody remembered.

     ONE RULE DECIDES WHERE A TILE GOES: a card opens the list that would
     change its number. That is why Compliance opens the contracts that FAIL
     rather than all of them, and why Turnaround — which looked like it had no
     list at all, being an average — opens the contracts signed in the last
     ninety days, which are the ones the average is made of.

     AND A CARD COUNTING ZERO IS NOT A DOOR. The zero still draws, because it
     is true; the arrow goes and the press is refused, because a door onto an
     empty list is a press that makes the reader think they did something
     wrong. hmTile does that from the number itself, so it can never be
     forgotten on a tile added later. */
  const hmSec=(title,extra)=>`
    <div class="hm-sec">
      <h2>${esc(title)}</h2><span class="hm-rule"></span>${extra||''}
    </div>`;
  const hmArrow=`<svg class="hm-go" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><use href="#i-right"/></svg>`;
  /* A tile is a <button> whichever it is, so the row never changes shape; a
     dead one is DISABLED rather than merely unpainted, so the browser itself
     refuses the press and a keyboard reader is told instead of being led to a
     control that does nothing. */
  const hmDead=v=>{ const t=String(v==null?'':v).replace(/[^0-9.]/g,''); return t===''||Number(t)===0; };
  const hmTile=(o)=>{
    const dead=o.dead!=null?o.dead:hmDead(o.n);
    /* A DEAD TILE IS REFUSED, AND HOW IT IS REFUSED DEPENDS ON WHAT ELSE IT
       DOES. A fixed Portfolio tile does one thing, so `disabled` is right: the
       browser itself declines the press and a keyboard reader is told.
       A My-work tile is ALSO the drag handle for reordering the four, and a
       disabled button fires no drag events — so disabling it would take the
       reader's ability to move a zero card out of first place. Those keep
       aria-disabled and lose their destination and their arrow, which is what
       actually advertises a door; the handler checks .is-dead before it
       navigates. */
    const draggy=/draggable/.test(o.attrs||'');
    return `<button type="button" class="hm-tile ${o.tall?'is-port':'is-work'}${dead?' is-dead':''}"
      style="border-top-color:${o.edge}"
      ${dead?(draggy?'aria-disabled="true"':'disabled'):`data-hm-go="${esc(o.go||'')}"`}
      ${o.id?`id="${o.id}"`:''} ${o.attrs||''}>
      ${''/* ---- THREE REGIONS, THE SAME ON EVERY CARD (owner-asked 26 Aug
             2026: "The top cards and the bottom cards have to be the same size
             as far as height and remove empty spaces which makes the card look
             empty. Create a well structured card like a fiori card…") ----
             Header · figure · footing fact, and they are REGIONS rather than a
             run of children so the grid can line them up across the row. The
             header is one span holding the title and its detail, because the
             two are one region and a subgrid places children by ROW: left
             loose they would take two of the three rows between them and put
             the figure where the foot belongs. */}
      ${dead?'':hmArrow}
      <span class="hm-head"><span class="hm-t">${o.t}</span><span class="hm-s">${o.s||''}</span></span>
      <span class="hm-big"><span class="hm-n"${o.ink&&!dead?` style="color:${o.ink}"`:''}>${o.n}</span>${o.u?`<span class="hm-u">${o.u}</span>`:''}</span>
      <span class="hm-foot${o.fc?' '+o.fc:''}">${o.f||''}</span>
    </button>`;
  };

  /* MY WORK — the four the reader chooses. Same ids and the same drag-to-
     reorder as before; only the dress and the door are new. */
  const workTiles=kpiSel.map((id,i)=>{
    const k=KPI_CATALOG[id];
    return hmTile({ t:esc(k.label), s:esc(k.sub||''), n:esc(String(k.val)), u:'',
      f:esc(String(k.delta||'')), fc:'', edge:HM_ROW_TONES[i%4], ink:HM_ROW_INKS[i%4], go:'kpi:'+id,
      /* aria-describedby names the sr-only sentence under the row that tells a
         screen reader these cards reorder with Alt+Arrow. It goes HERE, on the
         builder that actually draws the row. kpiCard() further up is a second
         builder for the same tile whose output (kpiHtml) is computed and never
         interpolated — this line was written on that one first and reached
         nothing on the dashboard, which a browser press is what caught. */
      attrs:`data-kpi-id="${id}" draggable="true" aria-describedby="kpi-reorder-hint"`,
      /* An average has no number to test — "—" is not zero, it is "not yet
         measurable" — so the tile is dead when there is nothing behind it. */
      dead:String(k.val)==='—'||hmDead(k.val) });
  }).join('');

  /* PORTFOLIO — fixed furniture, in the design's own order. */
  const lifeTotal=hmCounts.reduce((a,b)=>a+b,0);
  const lifeW=n=>Math.round(46+40*(lifeTotal?n/lifeTotal:0.33));
  const LIFE_CLS=['is-draft','is-review','is-signed'];
  /* THE TILE USES THE SHORT STAGE WORDS. PIPE_DEF's own titles are the
     register's ("Draft & Template", "Review & Redline", "Sign & Executed") and
     they are right there; under a 46px block they overlapped each other. The
     stage they name is identical — only the label is shorter. */
  const LIFE_WORD=[i18t('home_stage_draft_short'),i18t('home_stage_review_short'),i18t('home_stage_sign_short')];
  const lifeStack=PIPE_DEF.map((st,i)=>{
    const n=hmCounts[i];
    return `<span class="hm-stg-wrap" style="width:${lifeW(n)}px">
      <button type="button" class="hm-stg ${LIFE_CLS[i]}${n?'':' is-zero'}"
        ${n?`data-hm-go="stage:${esc(st.k)}"`:'disabled'}>
        <span class="hm-sn">${n}</span><span class="hm-bar"></span>
        <span class="hm-sl">${esc(LIFE_WORD[i]||st.title)}</span>
      </button></span>`;
  }).join('');
  const lifeTile=`
    <div class="hm-tile is-port is-life" style="border-top-color:var(--color-accent-600)">
      <span class="hm-head"><span class="hm-t">${i18t('home_lifecycle')}</span><span class="hm-s">${i18tn('home_live_by_stage',live.length,{n:live.length})}</span></span>
      ${''/* THE WIDE CARD FILLS THE SAME THREE REGIONS, which is the test of
             whether the skeleton is right: its figure region holds a stage bar
             beside the money rather than one numeral, and it is the tallest
             thing any card puts there — which is where --hm-r2 comes from. */}
      <span class="hm-life">
        <span class="hm-stack">${lifeStack}</span>
        ${''/* A READER WITHOUT canViewValues GETS NO MONEY HALF AT ALL, not a
             dash under a money label. "Active value under management: —" tells
             them there is a figure and that it is being kept from them, which
             is worse than the tile simply being about stages; and the label
             alone was enough to fail this page's own no-money sweep. */}
        ${money?`<span class="hm-money">
          <span class="hm-m">${esc(fmtMoneyShort(valOf(live)))}</span>
          <span class="hm-ml">${i18t('home_active_value_sub')}</span>
        </span>`:''}
      </span>
      <span class="hm-foot">${i18t('home_agreements_docs',{n:countAll,d:agreementsIn(cs).length})}</span>
    </div>`;

  const portTiles=lifeTile
    + hmTile({ t:esc(KPI_META.compliance), s:i18t('home_playbook_conformance'),
        n:compliancePct+'<span class="hm-u">%</span>', u:'',
        f:i18t('home_clean_of_live',{clean,live:live.length}),
        fc:compliancePct>=90?'':'crit', edge:HM_ROW_TONES[1], ink:HM_ROW_INKS[1],
        go:'fails', tall:true, dead:false })
    + hmTile({ t:i18t('home_import_queue'), s:i18t('home_back_catalogue'),
        n:Number(importQ).toLocaleString(jxLocale()), u:i18t('home_docs'),
        f:importQ?i18t('home_import_waiting',{n:importQ}):i18t('home_import_none'),
        fc:'', edge:HM_ROW_TONES[2], ink:HM_ROW_INKS[2], go:'nav:migration', tall:true })
    + hmTile({ t:i18t('home_copilot_coverage'), s:i18t('home_copilot_coverage_sub'),
        n:Number(cov.unread).toLocaleString(jxLocale()), u:i18t('home_still_to_read'),
        f:cov.total?[i18t('home_understood',{read:cov.read,total:cov.total}),
                     cov.stale?i18t('home_changed_since',{n:cov.stale}):''].filter(Boolean).join(' · ')
                  :i18t('home_copilot_nothing_live'),
        fc:cov.stale?'crit':'', edge:HM_ROW_TONES[3], ink:HM_ROW_INKS[3], go:'copilot:unread', tall:true });

  /* NEEDS YOUR DECISION — four rows, then a link that carries the count. It is
     not drawn at or below four, because pressing it would open the list you
     are already reading. */
  /* THE ROWS ARE decisionItems, UNCHANGED. That list is assembled above from
     five readings — reviews owed, quiet desks, join requests, renewal
     decisions and contracts sitting in review — and this is a re-dressing of
     it, not a second reading. The tone follows its own `urgent` flag, so what
     was a ruby circle is a ruby left rule and nothing about which row is
     alarming has moved. */
  const ddAll=decisionItems||[];
  /* ---- AS MANY AS FIT ON THIS READER'S SCREEN (owner-ruled 29 Aug 2026) ----
     It was a flat four, so a 2000px-tall monitor showed the same four a laptop
     did and the rest of the screen was empty. HM_DD_MIN is what a laptop always
     got and is the floor a bad measurement falls back to, so the worst case is
     the page exactly as it shipped. The count is set after the paint by
     hmFitDecisions, which is the only time the room below this list is known. */
  const ddShown=ddAll.slice(0, Math.max(HM_DD_MIN, _hmDdFit|0));
  const ddRows=ddShown.length
    ? `<div class="hm-rows" id="hm-dd-rows">${ddShown.map(it=>`
        <button type="button" class="hm-row ${it.urgent?'is-neg':'is-crit'}" data-sel="${esc(it.cid)}">
          <span class="hm-rb"><span class="hm-rt">${it.txt}</span><span class="hm-rm">${it.meta}</span></span>
          <span class="hm-rtag">${esc(it.tag)}</span>
          <svg class="hm-rchev" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><use href="#i-right"/></svg>
        </button>`).join('')}</div>`
    : `<div class="hm-empty">${i18t('home_nothing_to_decide')}</div>`;
  /* DRAWN ONLY WHERE IT SHOWS SOMETHING NEW — at four or fewer, pressing it
     would open the list already on screen. */
  const ddLink=ddAll.length>ddShown.length
    ? `<button type="button" class="hm-cz" data-hm-go="needsyou">${i18t('home_see_all',{n:ddAll.length})}
         <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><use href="#i-right"/></svg></button>`
    : '';

  const hour=new Date().getHours();
  const greetKey=hour<12?'home_greet_morning':hour<17?'home_greet_afternoon':'home_greet_evening';
  const firstName=String((me&&me.name)||'').trim().split(/\s+/)[0]||i18t('home_greet_there');
  const REGION_LABEL2={SE:'Sweden', KE:'Kenya'};
  /* THE WORKSPACE'S NAME, READ THROUGH window. core.js sets it as a property
     of window rather than a module-scope const, and a bare read here threw on
     every stage that does not load the shell — which is most of the node
     suite. The ES-module rule this codebase already states. */
  const todayLine=[esc((window.FIRST_PARTY)||''), REGION_LABEL2[state.region]||REGION_LABEL2.KE,
    (()=>{ try{ return new Date().toLocaleDateString(langLocale(),{day:'numeric',month:'long',year:'numeric'}); }
           catch(e){ return ''; } })()].filter(Boolean).join(' · ');

  document.getElementById('content').innerHTML=`
  <div class="view-enter hm-page">
    ${firstRunBanner}

    <div class="hm-greet">
      <h1>${i18t(greetKey)}, ${esc(firstName)}</h1>
      <span class="hm-greet-sub">${todayLine}</span>
      <span style="flex:1 1 auto"></span>
      <button id="hero-draft" class="hm-primary">
        ${icon('plus','w-3.5 h-3.5',2)} ${i18t('home_draft_new')}
      </button>
    </div>

    ${hmSec(i18t('home_my_work'),`
      <button id="kpi-customize" class="hm-cz" title="${i18t('home_choose_metrics')}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
        ${i18t('home_customize_metrics')}
      </button>`)}
    <div id="kpi-grid" class="hm-tiles is-work" data-kpi-cols="${kpiCols}">${workTiles}</div>
    ${''/* A KEYBOARD AFFORDANCE NOBODY IS TOLD ABOUT IS ONE NOBODY USES. Drawn
         for a screen reader only, because the cards already SAY "drag to
         reorder" in the customizer's foot for everybody else and a second
         visible sentence under the row is furniture. */}
    <span id="kpi-reorder-hint" class="sr-only">${i18t('home_reorder_keys')}</span>

    ${hmSec(i18t('home_portfolio_sec'))}
    <div class="hm-tiles is-port">${portTiles}</div>

    ${hmSec(i18t('home_needs_decision'),ddLink)}
    ${ddRows}
  </div>`;

  // ---- wiring ----
  const SORT_DIR={value:-1,risk:-1,expiry:1};   // first-click direction for KPI drill-throughs
  const goReg=g=>{ const R=regState(); R.stage=g.stage||'all'; R.type='all'; R.view=g.view||null; if(g.sort){ R.sort=g.sort; R.dir=SORT_DIR[g.sort]||-1; } R.sel={}; setView('register'); };
  // KPI cards: click drills into the register; drag to reorder (persisted per user).
  const kgrid=document.getElementById('kpi-grid');
  let kpiDragId=null;
  kgrid?.querySelectorAll('[data-kpi-id]').forEach(el=>{
    const id=el.getAttribute('data-kpi-id');
    el.addEventListener('click',()=>{
      /* A tile counting zero opens nothing — see hmTile. It stays draggable,
         so the refusal lives here rather than on the element. */
      if(el.classList&&el.classList.contains('is-dead')) return;
      const g=KPI_CATALOG[id]&&KPI_CATALOG[id].go; if(!g) return;
      /* A metric whose list is not the register names the view it belongs to
         instead — Live negotiations is a list of negotiations, not of rows in
         the contracts table. */
      if(g.obligations){
        if(typeof window.obwGoFiltered === 'function') obwGoFiltered(g.obligations);
        else setView('obligations');
        return;
      }
      if(g.intelTab){
        if(typeof window.intelGoTab === 'function') intelGoTab(g.intelTab);
        else setView('intel');
        return;
      }
      if(g.nav){ setView(g.nav); return; }
      goReg(g);
    });
    el.addEventListener('dragstart',e=>{ kpiDragId=id; el.style.opacity='.35'; try{ e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain',id); }catch(_){} });
    el.addEventListener('dragend',()=>{ kpiDragId=null; el.style.opacity=''; });
    /* ---- AND THE KEYBOARD CAN REORDER THEM TOO ---- (25 Aug 2026)
       Dragging is the only way this row could be reordered, and drag-and-drop
       reaches nobody working from a keyboard, switch access or a screen
       reader. Alt+Arrow is the pattern browsers and editors already use for
       "move this item"; it is Alt-modified deliberately, because a bare arrow
       on a KPI card is how a reader scrolls the dashboard.
       IT GOES THROUGH THE SAME ARITHMETIC AS THE DROP — one array, one splice,
       one setKpiSel — so the two ways of moving a card cannot come to disagree
       about what the order is. */
    el.addEventListener('keydown',e=>{
      if(!e.altKey) return;
      const d = e.key==='ArrowLeft' ? -1 : e.key==='ArrowRight' ? 1 : 0;
      if(!d) return;
      e.preventDefault();
      const arr=currentKpiSel().filter(x=>KPI_CATALOG[x]);
      const from=arr.indexOf(id); if(from<0) return;
      const to=from+d; if(to<0||to>=arr.length) return;
      arr.splice(from,1); arr.splice(to,0,id); setKpiSel(arr); renderDashboard();
      /* The row is rebuilt, so the card the reader is moving is a NEW element —
         find it again and put focus back on it, or every press drops them at
         the top of the page. */
      setTimeout(()=>{ document.querySelector(`[data-kpi-id="${id}"]`)?.focus({preventScroll:true}); },0);
    });
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

  /* ---- EVERY DOOR ON THIS PAGE GOES THROUGH ONE HANDLER ----
     One rule decides where each tile lands: it opens the list that would
     change its number. Written as a destination STRING on the element rather
     than a listener per tile, so a tile added later is a door by construction
     and cannot be the one somebody forgot to wire.

     THE NUMBER AND THE LIST MUST MATCH. Each destination below narrows the
     register with the same reading the tile counted, never a near-enough one —
     a card that says 11 and opens a list of 14 is a card that is lying. */
  document.querySelectorAll('[data-hm-go]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    const [kind,arg]=String(el.getAttribute('data-hm-go')||'').split(':');
    const R=()=>{ const r=regState(); r.type='all'; r.sel={}; r.view=null; return r; };
    if(kind==='stage'){ const r=R(); r.stage=arg; setView('register'); return; }
    if(kind==='nav'){ setView(arg); return; }
    if(kind==='needsyou'){
      /* The rows above are contracts waiting on this reader, so the link stays
         in contracts. The bell owns the wider "everything owed to you". */
      const ids=(decisionItems||[]).map(x=>x.cid).filter(Boolean);
      if(window.regShowOnly && ids.length){ regShowOnly(ids,i18t('home_needs_decision')); return; }
      const r=R(); r.stage='all'; setView('register'); return;
    }
    if(kind==='fails'){
      /* COMPLIANCE OPENS THE ONES THAT FAIL, NOT ALL OF THEM. Pressing "92%"
         and landing on every contract in the book tells the reader nothing;
         the 8% with a finding is the whole point of the number. Same reading
         the percentage was worked out from — contractRisk at or above 60. */
      const ids=live.filter(c=>contractRisk(c)>=60).map(c=>c.id);
      if(window.regShowOnly && ids.length){ regShowOnly(ids,KPI_META.compliance); return; }
      const r=R(); r.stage='all'; r.sort='risk'; r.dir=-1; setView('register'); return;
    }
    if(kind==='copilot'){
      /* THE LIST IS THE ONES IT HAS NOT READ — the exact set the tile counted,
         handed over by id so the two can never disagree. */
      const ids=live.filter(c=>!copilotRead(c)).map(c=>c.id);
      if(window.regShowOnly && ids.length){ regShowOnly(ids,i18t('home_copilot_coverage')); return; }
      const r=R(); r.stage='all'; setView('register'); return;
    }
  }));
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
  /* [data-open-register] is retired with the pipeline head's link (22 Aug
     2026) — flag any mention as stale. The register is still reached from this
     page by [data-stage] above, which carries the stage it was pressed from. */
  document.getElementById('dd-ask-ai')?.addEventListener('click',e=>{
    e.preventDefault(); e.stopPropagation();
    if(typeof openAI==='function') openAI('What needs my attention in the next 90 days — renewals, expiries and anything overdue?');
  });
  /* THE RING'S OWN WIRING IS RETIRED WITH IT (24 Aug 2026). It repainted the
     donut, the key and the stage list in place on a press, and measured the
     ring against the card with a ResizeObserver. The lifecycle tile needs none
     of it: its three blocks are ordinary doors and go through the one
     [data-hm-go] handler above like every other tile on the page. */

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
  hmFitDecisions();
  setActiveNav('dashboard');
}

/* ---- FILL THE HEIGHT WITH THE DECISIONS THAT ARE WAITING ----
   Measured after the paint, because the room under this list is whatever the
   two card rows above it left — a number that does not exist while the markup
   is being built. Re-rendered ONLY when the answer actually changes, or a
   window resize would repaint the dashboard on every pixel of a drag.
   ONE ROW'S OWN HEIGHT IS MEASURED, never assumed: this row's padding has
   moved twice this month and a typed number would have gone stale with it. */
const HM_DD_MIN = 4;      /* what a laptop always showed, and the safe floor */
const HM_DD_MAX = 40;     /* past this it is a list, and the list has a page */
let _hmDdFit = HM_DD_MIN;
function hmFitDecisions(){
  if(typeof document==='undefined') return;
  const rows=document.getElementById('hm-dd-rows');
  if(!rows) return;
  const first=rows.firstElementChild;
  const rowH=first ? first.getBoundingClientRect().height : 0;
  if(!(rowH>0)) return;              /* a hidden pane measures 0 — leave it be */
  const want=(typeof window!=='undefined' && window.rowsThatFit)
    ? rowsThatFit(rows, rowH, HM_DD_MIN, HM_DD_MAX) : HM_DD_MIN;
  if(want===_hmDdFit) return;
  _hmDdFit=want;
  renderDashboard();
}
if(typeof window!=='undefined' && typeof ResizeObserver==='function'){
  /* The WINDOW is what changes the room, and the dashboard is rebuilt on every
     view change anyway — so one observer on the scroller, armed once. */
  const arm=()=>{
    const sc=document.getElementById('content-scroll');
    if(!sc || sc.dataset.hmFitBound) return;
    sc.dataset.hmFitBound='1';
    try{ new ResizeObserver(()=>hmFitDecisions()).observe(sc); }catch(_){}
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', arm);
  else arm();
}

Object.assign(window,{renderDashboard,hmFitDecisions,HM_DD_MIN,hmDashSlices,gsSteps,gettingStartedHtml,gsIsSeed,
  KPI_META,currentKpiSel,setKpiSel,kpiCatalogOrder,DEFAULT_KPI_SEL,KPI_MAX,kpiAtMax,readyToSignItems});
