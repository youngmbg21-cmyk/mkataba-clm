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
  payterms:'Payment terms over standard',
  /* S7, 16 Sep 2026. "Owed to us" and not "receivable": HaTi reads agreements,
     not a ledger, so this is what the PAPER says is coming, not what a bank
     statement says has arrived. The tile's own sub-line says so. */
  owed:'Money owed to us',
  /* THE PORTFOLIO ROW'S OWN FOUR JOINED THE PICKER (the redesign, DECIDE 2,
     20 Sep 2026): Home reads tiles → Prepared for you → Needs your decision,
     and nothing that was on the page is gone — the lifecycle, import-queue and
     coverage tiles are chosen here like every other, beside Compliance, which
     was in the catalogue already. */
  lifecycle:'Contract lifecycle', importq:'Import queue', coverage:'Copilot coverage' };
/* Falls back to the English WORD, never the dictionary key — a tile reading
   `kpi_avgcycle` looks like broken software, one reading "Avg turnaround time"
   on a Swedish screen looks only untranslated. */
const KPI_META=Object.keys(KPI_EN)
  .reduce((o,k)=>(Object.defineProperty(o,k,{enumerable:true,
    get(){ return typeof t==='function' ? i18t('kpi_'+k) : KPI_EN[k]; }}),o),{});
const KPI_ALL_ORDER=['approvals','negotiations','obligations','owed','payterms','expiring90','avgcycle','under_mgmt','active_value','compliance','lifecycle','importq','coverage','awaiting','expiring30','expiring60','expired','highrisk'];
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
/* THE REFERENCE'S OWN FOUR (Young ruled 21 Sep 2026): waiting on you, live
   negotiations, expiring in 90 days, value under management. `avgcycle` keeps
   its place in the catalogue and one press puts it back; a reader who has
   already chosen four is untouched, because this is only what an unanswered
   workspace opens on. A money tile is dropped for a reader who may not see
   values by currentKpiSel's own filter. */
const DEFAULT_KPI_SEL=['approvals','negotiations','expiring90','active_value'];
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
/* ---- THE DESKTOP PICKER LEFT WITH THE TILES (Young ruled 24 Sep 2026) ----
   openKpiCustomizer and kpiApply drew the "Choose tiles" popover over Home's
   four tiles and repainted them on every tick. The Map took the tiles' place
   on the desktop, so the popover had no button and no tiles to choose — it is
   deleted rather than left behind as a door onto nothing. THE PHONE'S OWN
   SHEET IS THE PICKER NOW, and everything it reads stays exactly where it was:
   KPI_META, KPI_MAX, kpiAtMax, currentKpiSel, setKpiSel, kpiCatalogOrder. */
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
/* ---- WHAT WAITS ON THIS READER'S SIGNATURE ----
   Lifted out of renderDashboard on 20 Sep 2026 (the redesign order's step 10)
   because the Approvals & signing page draws the same rows: the contracts
   where the next signer is this member and signReadiness still counts
   something to settle. Reads nextSigner and signReadiness — never a second
   arithmetic — and writes nothing. */
function hmMySignings(cs){
  const meNow=(typeof currentUser==='function')?currentUser():null;
  /* A file THEY sign (26 Sep 2026) is never signed here, so it is never one
     of this reader's signings: its handover is on the Signing tab, and what is
     owed while it is out rides the bell (the `handover` alert). */
  return (meNow&&window.nextSigner&&window.signReadiness)?(cs||[]).filter(c=>c.status!=='Signed'&&c.status!=='Declined'&&!c.archived
    &&!(window.signRouteOf&&signRouteOf(c)==='outside')).map(c=>{
    let ns=null; try{ ns=nextSigner(c); }catch(_){ ns=null; }
    if(!ns||ns.party==='counterparty'||ns.signed) return null;
    const mine=(ns.memberId&&String(ns.memberId)===String(meNow.id))
      || (!!ns.email&&!!meNow.email&&String(ns.email).toLowerCase()===String(meNow.email).toLowerCase());
    if(!mine) return null;
    let n=0; try{ n=signReadiness(c,{ light:!!(c._light&&!c._loaded) }).n; }catch(_){ n=0; }
    return n?{ c, n }:null;
  }).filter(Boolean):[];
}
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
          <span style="font-size:var(--t-label);font-weight:var(--w-strong);font-family:var(--font-mono);color:var(--st-green-fg);flex:none">${(window.signRouteOf&&signRouteOf(r.c)==='outside')?esc(i18t('ho_hand_verb')):'issue link'}</span>
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
      ${isCur&&(s.k!=='sign'||gsGoTargetExists(s.k))?`<span style="flex:none;display:inline-flex;align-items:center;gap:2px;font-size:var(--t-body);font-weight:var(--w-label);color:var(--accent-ink)">${i18t('home_go')}${icon('chevR','w-3.5 h-3.5')}</span>`:''}`;
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
        <button id="gs-dismiss" class="ui-btn ui-btn-sm" title="${i18t('home_hide_checklist')}">${all?'Done — hide this':'Hide'}</button>
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
  /* ---- A RENEWAL SOMEBODY HAS ANSWERED IS NOT A DECISION DUE (16 Sep 2026) ----
     THIS IS THE SECOND READING OF THE SAME QUESTION and it is why the predicate
     is a published function rather than a condition written twice: the card and
     the overnight desk ask renewalWindow, this list asks renewalDecisionDate
     directly — and the alerts panel reads THIS list, so a decision recorded on
     the card had to reach the bell through here or the two would disagree.
     `renewalDecision` is an ordinary field and survives HEAVY by construction,
     so a light row answers this as well as a whole one. */
  const decided=window.renewalDecided||(()=>false);
  const decisions=cs.filter(c=>c.status!=='Declined'&&!decided(c)).map(c=>{ const dd=rdd(c); return dd?{c,dd,d:dU(dd)}:null; }).filter(x=>x&&x.d>=0&&x.d<=90).sort((a,b)=>a.d-b.d);
  /* Paper that has sat in review, longest first — the other half of what a
     person has to decide about, alongside the renewals. */
  const waitingLongest=cs.filter(c=>c.status==='Under Review').map(c=>({c,idle:idleOf(c)})).sort((a,b)=>b.idle-a.idle);
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
  /* A PERSONAL APPROVAL (23 Sep 2026) waits on its approver only once it is
     ASKED, and on the backup and the admins only once it has waited too long
     — signApprovalWaitsOn is that one reading, shared with the Approvals page
     and the bell. The rule steps are asked exactly as before. */
  const canApproveSomeStep=(st,c)=>!!me&&((st.chain||[]).some(s=>!s.sa&&s.status!=='approved'&&s.status!=='rejected'
    &&(typeof userCanApprove==='function'?userCanApprove(s.approver,me):false))
    || (typeof signApprovalWaitsOn==='function' && (()=>{ try{ return signApprovalWaitsOn(c,me).length>0; }catch(_){ return false; } })()));
  const myApprovals=cs.filter(c=>c.status!=='Signed'&&c.status!=='Declined').map(c=>{
    let st; try{ st=((window.approvalState)||approvalState)(c); }catch(e){ return null; }
    if(!st||!st.required||st.ok) return null;
    const mine=canApproveSomeStep(st,c), own=raisedByMe(c);
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
  /* THE CONTRACTS THE AVERAGE IS MADE OF travel beside it (24 Sep 2026), so
     the Map's turnaround door opens exactly those and the number on the door
     is the list behind it. The arithmetic is unchanged. */
  const cycleRows=cs.filter(c=>c.status==='Signed').map(c=>{
    const cr=_raised(c), sg=_signed(c);          /* see the note above the KPIs */
    if(cr!=null&&sg!=null){ const d=(sg-cr)/864e5; return d>0?{ id:c.id, d }:null; } return null;
  }).filter(x=>x!=null);
  const cycles=cycleRows.map(x=>x.d), cycleIds=cycleRows.map(x=>x.id);
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
  /* THROUGH navCounts, the one count per paint: the rail, this tile and the
     phone's bar all asked negoNeedsYouTotal for themselves, so one navigation
     walked the whole book four times for one figure. Still the same reading —
     navCounts borrows it — so the tile and the door cannot disagree. */
  const negoNeedsMe=(()=>{ try{
    if(window.navCounts) return navCounts().negotiations;
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
  /* ONE READING OF WHAT IS OWED, asked by the tile (the phone's figures list)
     and by the Map's side column — see hmOwed. */
  const owedW=hmOwed(cs, money);
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
    /* THE THREE FROM THE PORTFOLIO ROW (DECIDE 2). Same readings, same doors as
       the fixed tiles they replace: the lifecycle tile keeps its composite
       face (lifeTile, drawn in its place by workTiles) and its stage doors. */
    lifecycle:   {label:KPI_META.lifecycle,    val:Number(live.length).toLocaleString(jxLocale()),      delta:i18t('home_agreements_docs',{n:countAll,d:agreementsIn(cs).length}), sub:i18tn('home_live_by_stage',live.length,{n:live.length}), grad:G.steel, ic:'building', go:{stage:'all'}},
    importq:     {label:KPI_META.importq,      val:Number(importQ).toLocaleString(jxLocale()),          delta:importQ?i18t('home_import_waiting',{n:importQ}):i18t('home_import_none'), sub:i18t('home_back_catalogue'), grad:importQ?G.amber:G.steel, ic:'import', go:{nav:'migration'}},
    coverage:    {label:KPI_META.coverage,     val:Number(cov.unread).toLocaleString(jxLocale()),       delta:cov.total?[i18t('home_understood',{read:cov.read,total:cov.total}),cov.stale?i18t('home_changed_since',{n:cov.stale}):''].filter(Boolean).join(' · '):i18t('home_copilot_nothing_live'), sub:i18t('home_copilot_coverage_sub'), grad:cov.stale?G.ruby:G.steel, ic:'spark', go:{copilot:'unread'}},
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
    /* ---- MONEY OWED TO US (S7) ----
       ONE MORE OPTION ON A LIST, and nobody who does not pick it ever sees it:
       the four tiles under My work are the reader's own choice. It is not in
       the default four.

       WHAT IT COUNTS is obligations that are THEIRS carrying an amount and
       still outstanding — a promise on the other side, with a figure, that
       nobody has ticked off. Every figure is BORROWED (obligationAmount,
       obState, obligationIsTheirs, fxHome), so this tile and the Obligations
       worklist cannot disagree about what is owed.

       IT CONVERTS AND SAYS WHAT IT LEFT OUT, like every other figure that adds
       contracts up; and it draws no money at all for a reader without the
       permission — never a row of dashes. THE DESTINATION IS THE WORKLIST,
       narrowed the way the tile counted. */
    owed: (()=>{
      const { canMoney, sum, n, late, left } = owedW;
      return { label:KPI_META.owed,
        val: canMoney ? fmtMoneyShort(sum) : Number(n).toLocaleString(jxLocale()),
        delta: late?i18tn('home_owed_late',late,{n:late}):i18t('home_all_clear'),
        get sub(){ return left ? i18tn('home_owed_left',left,{n:left})
          : (n?i18tn('home_owed_of',n,{n}):i18t('home_owed_none')); },
        grad: late?G.amber:G.steel, ic:'coins',
        go:{obligations:{state:'open', side:'theirs'}} };
    })(),
  };
  return { cs, money, m, countAll, valOf, dU, idleOf, STAGE_DEF, stages, expiring, rdd,
    decisions, waitingLongest, fmtDDay, highRisk, awaiting, awaitingCount, me, raisedByMe,
    canApproveSomeStep, myApprovals, newThisWeek, stalled, onExecuted, lapsed, expWithin,
    exp30, exp60, exp90, expVal, expDelta, expSub, cycles, cycleIds, owedW, avgCycle, G, stageSub, live,
    clean, compliancePct, REG_PROFILE, apprMineN, myReviews, myJoinAsks, myStaleDesks, KPI_CATALOG,
    negoLive, negoNeedsMe, importQ, cov, agreementsIn };
}

/* ---- A CARD HEAD, AT MODULE SCOPE (24 Sep 2026) ----
   Lifted out of renderDashboard when the Map became its second wearer: a
   head of title · quiet sub · acts at the right, over the card's own hairline
   when `card` is set. Prepared for you and the Map ask this one builder, so
   the two card heads on the page can never drift apart. */
const hmSecHtml=(title,extra,card)=>`
    <div class="hm-sec${card?' is-cardh':''}">
      <h2>${esc(title)}</h2>${card?'':'<span class="hm-rule"></span>'}${extra||''}
    </div>`;

/* ---- MONEY OWED TO US, ONE READING (24 Sep 2026) ----
   Lifted out of the "Money owed to us" tile when the Map took its place on
   the desktop: the tile still draws on the phone's figures list and the Map's
   side column says the same fact, so the arithmetic lives once.

   WHAT IT COUNTS is obligations that are THEIRS carrying an amount and still
   outstanding — a promise on the other side, with a figure, that nobody has
   ticked off. Every figure is BORROWED (obligationAmount, obState,
   obligationIsTheirs, fxHome). It converts and COUNTS what it left out, and
   works no money out at all for a reader without the permission. */
function hmOwed(cs, money){
  const canMoney = (typeof obligationMoneyVisible==='function') ? obligationMoneyVisible() : money;
  let sum=0, n=0, late=0, left=0;
  for(const c of (cs||[])){
    for(const o of (Array.isArray(c&&c.obligations)?c.obligations:[])){
      if(!o) continue;
      if(typeof obligationIsTheirs==='function' && !obligationIsTheirs(o)) continue;
      const st=(typeof obState==='function')?obState(o):((o.status==='done')?'done':'open');
      if(st==='done') continue;
      const amt=(typeof obligationAmount==='function')?obligationAmount(o):Number(o.amount||0);
      if(!(amt>0)) continue;
      n++; if(st==='overdue') late++;
      if(!canMoney) continue;
      /* THE OBLIGATION'S MONEY IS THE CONTRACT'S OWN CURRENCY (J-5.2), so it
         converts through the contract exactly as the contract's value does —
         and an unconvertible one is LEFT OUT and counted, never summed at par. */
      const h=(typeof fxHome==='function')?fxHome({ value:amt, metadata:c.metadata }):{v:amt,missing:false};
      if(h&&h.missing) left++; else sum+=(h&&h.v)||0;
    }
  }
  return { n, late, sum, left, canMoney };
}

/* ============================================================
   THE MAP — WHERE YOUR CONTRACTS STAND (Young ruled 24 Sep 2026)
   ============================================================
   *"give me an idea of how the homepage should look like. It should be
   executive high level view and not too dense"* → three drawn options, and the
   owner picked the Map by name. Then: *"it is heavy on the cash side. make it
   so you have a toggle for review in cash or in quantity as in number of
   contracts"*, then *"instead of needs your decision, delete it and replace
   with prepared for you"*, then *"Build it"*. The drawing is the artifact
   "Executive Home Options".

   AND A DAY LATER (Young ruled 25 Sep 2026): *"reduce the where your
   contracts stand card by 25% as it is dominating the screen too much"* —
   the height came out of the air and the chart heights, never a figure (see
   the stylesheet); *"the color code of the drafting, review and executed
   should match the color coding in the contracts list page"* — hmStageTone
   below; and "Needs your decision" came back under Prepared for you with two
   rows (renderDashboard).

   IT REPLACES THE FOUR TILES AND "Choose tiles" ON THE DESKTOP, said to the
   owner before the build. THE CATALOGUE IS NOT DELETED: the phone's figures
   list reads KPI_META, currentKpiSel and the catalogue's readings, and every
   one of them is still here.

   COUNTING IS NOT DRAWING — the Insights panels' rule. hmMapData returns plain
   data and not one character of markup; hmMapInnerHtml draws it and works
   nothing out, so a figure on this card can never differ between what was
   counted and what was drawn. EVERY FIGURE IS BORROWED from the reading that
   already owns it: the stages are hmDashSlices' own, the renewal piles are
   renewalWindow's (the ONE predicate every renewal nag asks), what could hurt
   you is the Exposure register's leading row, owed is the owed tile's reading,
   turnaround is the turnaround tile's.

   MONEY OBEYS canViewValues BY CONSTRUCTION: a reader who may not see values
   gets no Value half of the switch at all and no money anywhere on the card —
   never a row of dashes. Every figure that ADDS contracts converts through
   fxHome, and what could not be converted is COUNTED AND SAID (fx_left_out).

   EVERY FIGURE IS A DOOR, AND THE NUMBER ON THE DOOR IS THE LIST BEHIND IT.
   A month or the ninety-day window opens the register narrowed to exactly the
   contracts it counted (regShowOnly with their ids); a stage opens the
   register on that stage; a zero is not a door. */
const HM_MAP_MONTHS = 12;
/* THE MEASURE IS THE READER'S OWN, remembered in this browser only — the same
   shape as the KPI choice it replaces (per person, per browser, never sent).
   COUNT AT REST, which is the owner's own complaint turned into the default:
   the drawing was "heavy on the cash side". */
function hmMeasureKey(){ const u=(typeof currentUser==='function')&&currentUser(); return 'hati.v1.homeMeasure.'+((u&&u.id)||'anon'); }
function hmMeasure(money){
  if(money===false) return 'count';
  let v=null; try{ v=localStorage.getItem(hmMeasureKey()); }catch(_){ v=null; }
  return v==='value' ? 'value' : 'count';
}
function hmSetMeasure(m){ try{ localStorage.setItem(hmMeasureKey(), m==='value'?'value':'count'); }catch(_){} }

/* THE THREE STAGES THE BAR DRAWS — the live book is exactly these three
   (STATUS_META has four and the fourth, Declined, is what "live" leaves out),
   so the three segments add up to the head's own number by construction. */
const HM_MAP_STAGES = [
  { k:'Draft',        word:'home_stage_drafting' },
  { k:'Under Review', word:'home_stage_in_review' },
  { k:'Signed',       word:'home_stage_executed' },
];
/* ---- A STAGE WEARS THE CONTRACTS LIST'S OWN COLOUR (Young ruled 25 Sep 2026) ----
   *"The color code of the drafting, review and executed should match the
   color coding in the contracts list page."* The list draws each stage as a
   dot in STATUS_META's `dot` — grey, amber, green — so the bar and the
   legend's squares ask that same table and nothing else, and a stage cannot
   be one colour in the list and another on Home.
   THIS REVERSES 24 Sep's own reasoning ("the accent's own three steps and
   never the status tones, because amber means one thing on this card"), kept
   beside the stylesheet: In Review is amber here now, as it is everywhere
   else, and the renewal chart's "decision due" pile is amber too. The owner's
   word decides it; the legend under each names what its colour means.
   READ THROUGH window: js/core.js owns the table and is not on every stage
   (the node suite's DOM loads no core), so the literal answers there — and
   f381 pins the literal EQUAL to STATUS_META's own, or it would drift. */
const HM_STAGE_TONE_FALLBACK = { 'Draft':'var(--st-gray-dot)', 'Under Review':'var(--st-amber-dot)', 'Signed':'var(--st-green-dot)' };
function hmStageTone(k){
  const M=(typeof window!=='undefined' && window.STATUS_META) || null;
  return (M && M[k] && M[k].dot) || HM_STAGE_TONE_FALLBACK[k] || 'var(--st-gray-dot)';
}

function hmMapData(sl){
  const S = sl || hmDashSlices();
  const money = !!S.money;
  const cs = S.cs || [];
  const live = S.live || [];

  const stages = HM_MAP_STAGES.map(d=>{
    const s=(S.stages||[]).find(x=>x.k===d.k)||{ n:0, val:0 };
    return { k:d.k, word:d.word, tone:hmStageTone(d.k), n:s.n||0, v:money?(s.val||0):null };
  });
  const total = { n:stages.reduce((a,s)=>a+s.n,0),
                  v:money?stages.reduce((a,s)=>a+(s.v||0),0):null };
  /* "19 IN NEGOTIATION" IS negoLiveList's OWN, narrowed to the stage it is
     printed under — a live negotiation on a record in any other stage would
     make the line claim more than the segment holds. */
  const nego = (S.negoLive||[]).filter(c=>c&&c.status==='Under Review'&&!c.archived).length;
  let left = { n:0, codes:[] };
  if(money && typeof fxMissing==='function'){
    let m={}; try{ m=fxMissing(live)||{}; }catch(_){ m={}; }
    const codes=Object.keys(m).sort();
    left={ n:codes.reduce((a,k)=>a+m[k],0), codes };
  }

  /* ---- THE NEXT TWELVE MONTHS, FROM THIS ONE ----
     THE CURRENT MONTH IS COLUMN ZERO, so nothing between today and the first
     of next month falls off the picture; it counts only from TODAY (an
     agreement that ended on the 3rd is not coming up for anything).
     A contract lands on the month its term ENDS, and its pile is the renewal
     card's own reading of the DECISION: made, due (inside the ninety-day
     window, or past it and still open) or not due yet. */
  const today=(typeof todayISO==='function')?todayISO():(()=>{ const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); })();
  const t0=new Date(today+'T00:00:00'); const y0=t0.getFullYear(), m0=t0.getMonth();
  const months=[];
  for(let i=0;i<HM_MAP_MONTHS;i++){ const d=new Date(y0,m0+i,1);
    months.push({ i, y:d.getFullYear(), m:d.getMonth(), n:0, v:0, ids:[],
      made:{n:0,v:0,ids:[]}, due:{n:0,v:0,ids:[]}, later:{n:0,v:0,ids:[]} }); }
  const winDays=(typeof RENEWAL_WINDOW_DAYS==='number')?RENEWAL_WINDOW_DAYS:90;
  const win={ d:winDays, n:0, v:0, ids:[] };
  for(const c of cs){
    let w=null; try{ w=(typeof renewalWindow==='function')?renewalWindow(c):null; }catch(_){ w=null; }
    if(!w || !w.expiry) continue;
    const ed=w.expiresDays; if(ed==null || isNaN(ed) || ed<0) continue;
    const e=new Date(String(w.expiry)+'T00:00:00'); if(isNaN(e.getTime())) continue;
    const i=(e.getFullYear()-y0)*12+(e.getMonth()-m0);
    if(i<0 || i>=HM_MAP_MONTHS) continue;
    const pile=w.decided?'made':(w.inWindow?'due':'later');
    let v=0;
    if(money){ const h=(typeof fxHome==='function')?fxHome(c):{ v:Number(c.value||0), missing:false };
      v=(h&&!h.missing)?(h.v||0):0; }
    const M=months[i];
    M[pile].n++; M[pile].v+=v; M[pile].ids.push(c.id);
    M.n++; M.v+=v; M.ids.push(c.id);
    if(ed<=winDays){ win.n++; win.v+=v; win.ids.push(c.id); }
  }
  /* WHERE THE WINDOW SITS, as a column and a fraction of it — today to today
     plus ninety days, measured in days, never rounded to whole months. */
  const dim=(y,m)=>new Date(y,m+1,0).getDate();
  const at=d=>({ i:(d.getFullYear()-y0)*12+(d.getMonth()-m0), f:(d.getDate()-1)/dim(d.getFullYear(),d.getMonth()) });
  const endD=new Date(y0,m0,t0.getDate()+winDays);
  /* THE BOX STARTS AT THE CURRENT MONTH'S OWN EDGE: that column only ever
     holds contracts ending from TODAY on (a past day of this month draws
     nothing), so its whole width is inside the window. The far edge is the
     ninetieth day itself, which can fall part-way through a month — a bar it
     crosses holds contracts on both sides of it, and the label's count is the
     exact one. */
  win.from={ i:0, f:0 };
  win.to=at(endD); win.to.f+=1/dim(endD.getFullYear(),endD.getMonth());
  if(win.to.i>=HM_MAP_MONTHS) win.to={ i:HM_MAP_MONTHS-1, f:1 };

  /* THE BUSIEST TWO MONTHS AFTER THE WINDOW — the wave worth seeing coming.
     Asked in EACH measure, because a month of many small contracts and a month
     of two large ones are different answers and the switch shows both. Inside
     the window the window's own label already speaks, so the bracket starts
     after it. Nothing ahead at all, nothing drawn. */
  const busiest=key=>{ let best=null;
    for(let i=win.to.i+1;i<HM_MAP_MONTHS-1;i++){
      const a=months[i], b=months[i+1], s=key==='value'?(a.v+b.v):(a.n+b.n);
      if(s>0 && (!best || s>best.s)) best={ i, s, n:a.n+b.n, v:a.v+b.v };
    }
    return best; };
  const peak={ count:busiest('count'), value:money?busiest('value'):null };

  /* ---- THE SIDE COLUMN ----
     WHAT COULD HURT YOU IS THE EXPOSURE REGISTER'S LEADING ROW — the same row
     that page puts first and draws the bar beside — so the door lands on the
     page already pointing at the fact it printed. Absent where the Insights
     module is not on the stage; a book with nothing uncapped leads with
     nothing and says so. */
  let hurt=null;
  if(typeof exposureData==='function'){
    try{ const e=exposureData(); const r=((e&&e.rows)||[]).find(x=>x.k===e.lead)||null;
      hurt=r?{ k:r.k, title:String(r.title||''), n:r.n||0, v:money?r.value:null }:{ k:null, n:0 }; }catch(_){ hurt=null; }
  }
  const owed = S.owedW || (typeof hmOwed==='function' ? hmOwed(cs, money) : { n:0, late:0, sum:0, left:0, canMoney:false });
  /* TURNAROUND IS THE TILE'S OWN AVERAGE, and its door opens exactly the
     contracts the average is made of — "the list that would change its
     number", this page's rule — rather than every signed contract. */
  const cyc=S.cycles||[];
  const turn=cyc.length?{ d:Math.round(cyc.reduce((a,x)=>a+x,0)/cyc.length), n:cyc.length, ids:(S.cycleIds||[]).slice() }:null;

  return { money, total, stages, nego, left, months, win, peak, hurt, owed, turn, today };
}

/* THE CARD'S INSIDE. It works nothing out — every number comes off `d` — so
   the switch repaints this and nothing else, and a figure cannot move between
   what was counted and what was drawn. */
function hmMapInnerHtml(d, mode){
  const byV=mode==='value' && d.money;
  const nf=n=>Number(n||0).toLocaleString(jxLocale());
  const cash=v=>fmtMoneyShort(v||0);
  const nC=n=>i18tn('home_map_n_contracts',n,{n:nf(n)});
  const go=`<svg class="hm-map-go" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><use href="#i-right"/></svg>`;

  /* ---- THE HEAD: the name, what the book holds, and the switch ----
     THE SWITCH IS THE DOCUMENT TAB'S OWN CONTROL (.doc-read-seg), borrowed
     rather than re-drawn — one segmented control, one dress, so the two can
     never drift. Only the shaded half is bold, the rule it already carries. */
  const sub=byV
    ? i18tn('home_map_sub_v',d.total.n,{n:nf(d.total.n),v:cash(d.total.v)})
    : i18tn('home_map_sub_n',d.total.n,{n:nf(d.total.n)});
  const leftOut=(byV && d.left.n) ? ' · '+i18tn('fx_left_out',d.left.n,{n:d.left.n,codes:d.left.codes.join(', ')}) : '';
  const cur=(typeof jxCurrency==='function')?jxCurrency():'';
  const seg=d.money?`<span class="doc-read-seg hm-map-seg" role="group" aria-label="${esc(i18t('home_map_by'))}">
      <button type="button" data-hm-measure="count" aria-pressed="${byV?'false':'true'}" title="${esc(i18t('home_map_count_title'))}">${esc(i18t('home_map_count'))}</button>
      <button type="button" data-hm-measure="value" aria-pressed="${byV?'true':'false'}" title="${esc(i18t('home_map_value_title',{cur}))}">${esc(i18t('home_map_value'))}</button>
    </span>`:'';
  const head=hmSecHtml(i18t('home_map_title'),
    `<span class="hm-sec-sub hm-map-sub">${esc(sub+leftOut)}</span>${seg}`,true);

  /* ---- BY STAGE ---- */
  const stTot=byV?(d.total.v||0):d.total.n;
  const bar=stTot>0?`<div class="hm-map-stages">${d.stages.map(s=>{
      const w=byV?(s.v||0):s.n; if(!(w>0)) return '';
      const say=i18t(s.word)+': '+(byV?cash(s.v)+' · ':'')+nC(s.n);
      return `<button type="button" style="flex-grow:${w};background:${esc(s.tone)}" data-hm-map="stage:${esc(s.k)}" aria-label="${esc(say)}" title="${esc(say)}"></button>`;
    }).join('')}</div>`
    :`<div class="hm-map-none">${esc(i18t('home_map_none'))}</div>`;
  const legend=`<div class="hm-map-legend">${d.stages.map(s=>{
      const big=byV?cash(s.v):nf(s.n);
      const unit=byV?nC(s.n):i18tn('home_map_unit',s.n,{n:s.n});
      const more=(s.k==='Under Review' && d.nego)?' · '+i18tn('home_map_nego',d.nego,{n:nf(d.nego)}):'';
      /* THE FIGURE AND ITS UNIT SHARE A LINE (25 Sep 2026, the card a
         quarter shorter): "12 contracts · 3 in negotiation" reads as one
         phrase, and the legend drops from three lines to two. */
      return `<button type="button" ${s.n?`data-hm-map="stage:${esc(s.k)}"`:'disabled'}>
        <span class="hm-map-ln"><i class="hm-map-sw" style="background:${esc(s.tone)}"></i>${esc(i18t(s.word))}</span>
        <span class="hm-map-lf"><span class="hm-map-lv">${esc(big)}</span>
        <span class="hm-map-lc">${esc(unit+more)}</span></span></button>`;
    }).join('')}</div>`;

  /* ---- COMING UP FOR RENEWAL ---- */
  const val=p=>byV?(p.v||0):p.n;
  const max=Math.max(0,...d.months.map(val));
  const any=d.months.some(M=>M.n>0);
  const mName=(M,opt)=>{ try{ return new Date(M.y,M.m,1).toLocaleDateString(langLocale(),opt); }catch(_){ return ''; } };
  /* A PLACE ON THE PLOT, as CSS: twelve columns with a gap between each, so a
     point a fraction of the way into column i sits i gaps and i + f column
     widths from the left edge. Written with the gap as a token, so the plot's
     own gap and the window's arithmetic cannot come apart. */
  const X=p=>`(${(p.i+p.f).toFixed(4)} * (100% - 11 * var(--map-gap)) / 12 + ${p.i} * var(--map-gap))`;
  const cols=d.months.map(M=>{
    const parts=[['later','is-later'],['due','is-due'],['made','is-made']].map(([k,cls])=>{
      const a=byV?(M[k].v||0):M[k].n;
      return a>0?`<i class="${cls}" style="height:${(max?a/max*100:0).toFixed(2)}%"></i>`:'';
    }).join('');
    const bits=[M.made.n?i18tn('home_map_bit_made',M.made.n,{n:M.made.n}):'',
      M.due.n?i18tn('home_map_bit_due',M.due.n,{n:M.due.n}):'',
      M.later.n?i18tn('home_map_bit_later',M.later.n,{n:M.later.n}):''].filter(Boolean).join(' · ');
    const say=mName(M,{month:'long',year:'numeric'})+': '+(byV?cash(M.v)+' · ':'')+nC(M.n)+(bits?' · '+bits:'');
    return `<button type="button" class="hm-map-col" ${M.n?`data-hm-map="month:${M.i}"`:'disabled'} aria-label="${esc(say)}" title="${esc(say)}">${parts}</button>`;
  }).join('');
  const axis=d.months.map(M=>{ const jan=M.m===0;
    return `<span${jan?' class="is-yr"':''}>${esc(mName(M,jan?{month:'short',year:'2-digit'}:{month:'short'}))}</span>`; }).join('');
  /* THE WINDOW'S LABEL IS ITS DOOR. The box behind it is decoration — pressing
     it would swallow the presses meant for the three columns under it. */
  const winFacts=[i18t('home_map_window',{d:d.win.d}), byV?cash(d.win.v):'', nC(d.win.n)].filter(Boolean);
  const winLabel=winFacts.map((f,i)=>(i?'<span class="hm-map-wsep"> · </span>':'')+`<span class="hm-map-wf">${esc(f)}</span>`).join('');
  const winBox=`<div class="hm-map-win" style="left:calc(${X(d.win.from)} - 3px);width:calc(${X(d.win.to)} - ${X(d.win.from)} + 6px)">
      <button type="button" class="hm-map-wl" ${d.win.n?'data-hm-map="window"':'disabled'}>${winLabel}</button></div>`;
  const pk=byV?d.peak.value:d.peak.count;
  /* A BRACKET NEAR THE RIGHT EDGE HANGS ITS FIGURE LEFTWARDS, or the card's
     own overflow would cut the number off at the rounded corner. */
  const peak=pk?`<div class="hm-map-peak${pk.i>=HM_MAP_MONTHS-3?' is-end':''}" aria-hidden="true" style="left:calc(${X({i:pk.i,f:0})});width:calc(${X({i:pk.i+1,f:1})} - ${X({i:pk.i,f:0})})">
      <span>${esc(byV?cash(pk.v)+' · '+nC(pk.n):nC(pk.n))}</span></div>`:'';
  const plot=any?`<div class="hm-map-plot">${winBox}${peak}${cols}</div><div class="hm-map-axis">${axis}</div>
      <div class="hm-map-key"><span><i class="hm-map-sw is-made"></i>${esc(i18t('home_map_rn_made'))}</span><span><i class="hm-map-sw is-due"></i>${esc(i18t('home_map_rn_due'))}</span><span><i class="hm-map-sw is-later"></i>${esc(i18t('home_map_rn_later'))}</span></div>`
    :`<div class="hm-map-none">${esc(i18t('home_map_rn_none'))}</div>`;

  /* ---- THE SIDE COLUMN: three facts, each a door, a zero is not one ---- */
  const fact=(label,fig,line,door)=>`<button type="button" class="hm-map-fact" ${door?`data-hm-map="${door}"`:'disabled'}>
      <span class="hm-map-fl">${esc(label)}${door?go:''}</span>
      <span class="hm-map-ff">${esc(fig)}</span>
      <span class="hm-map-fs">${line}</span></button>`;
  const facts=[];
  if(d.hurt){
    const h=d.hurt;
    if(!h.n) facts.push(fact(i18t('home_map_hurt'),'0',esc(i18t('home_map_hurt_none')),''));
    else facts.push(fact(i18t('home_map_hurt'),byV&&h.v!=null?cash(h.v):nf(h.n),
      esc(byV&&h.v!=null?i18tn('home_map_in_n',h.n,{n:nf(h.n)})+' · '+h.title:h.title),'hurt'));
  }
  const w=d.owed;
  if(!w.n) facts.push(fact(i18t('home_map_owed'),'0',esc(i18t('home_owed_none')),''));
  else{
    const late=w.late?' · <span class="is-late">'+esc(i18tn('home_owed_late',w.late,{n:w.late}))+'</span>':'';
    const lft=(byV&&w.canMoney&&w.left)?' · '+esc(i18tn('home_owed_left',w.left,{n:w.left})):'';
    facts.push(byV&&w.canMoney
      ? fact(i18t('home_map_owed'),cash(w.sum),esc(i18tn('home_owed_of',w.n,{n:w.n}))+late+lft,'owed')
      : fact(i18t('home_map_owed'),nf(w.n),esc(i18tn('home_map_owed_unit',w.n,{n:w.n}))+late,'owed'));
  }
  facts.push(d.turn
    ? fact(i18t('home_map_turn'),i18tn('home_map_days',d.turn.d,{n:d.turn.d}),esc(i18tn('home_map_turn_sub',d.turn.n,{n:d.turn.n})),d.turn.ids.length?'turn':'')
    : fact(i18t('home_map_turn'),'—',esc(i18t('home_map_turn_none')),''));

  return head+`<div class="hm-map-body">
      <div class="hm-map-charts">
        <div><span class="hm-map-lab">${esc(i18t('home_map_by_stage'))}</span>${bar}${legend}</div>
        <div class="hm-map-rn"><span class="hm-map-lab">${esc(i18t('home_map_rn_title'))}</span>${plot}</div>
      </div>
      <div class="hm-map-side">${facts.join('')}</div>
    </div>`;
}

/* ONE LISTENER PER CARD, delegated and bound once per element: the switch
   repaints the card's INSIDE, never the page, so the reader keeps their place
   and the pressed half keeps the keyboard. */
function hmMapWire(el, d){
  /* A STAGE WITH NO REAL ELEMENT (the node suite's own DOM) is asked nothing:
     binding is a browser's business, and a stub that cannot carry a dataset
     must not take the whole page down with it. */
  if(!el || !el.dataset || typeof el.addEventListener!=='function' || el.dataset.hmMapBound) return;
  el.dataset.hmMapBound='1';
  el.addEventListener('click',e=>{
    const sw=e.target.closest && e.target.closest('[data-hm-measure]');
    if(sw && el.contains(sw)){
      const m=sw.getAttribute('data-hm-measure')==='value'?'value':'count';
      if((el.getAttribute('data-measure')||'count')===m) return;
      hmSetMeasure(m);
      el.setAttribute('data-measure',m);
      el.innerHTML=hmMapInnerHtml(d,m);
      const back=el.querySelector(`[data-hm-measure="${m}"]`); if(back) try{ back.focus({preventScroll:true}); }catch(_){}
      return;
    }
    const b=e.target.closest && e.target.closest('[data-hm-map]');
    if(!b || !el.contains(b) || b.disabled) return;
    e.stopPropagation();
    const [kind,arg]=String(b.getAttribute('data-hm-map')||'').split(':');
    const only=(ids,label)=>{ if(window.regShowOnly && ids && ids.length) regShowOnly(ids,label); };
    /* THE STAGE DOOR PUTS THE CONTRACTS SEAT BACK FIRST. The Negotiations
       list is this same table on its own seat with its own filters, and the
       seat stays set when the reader leaves it — read the state without
       putting it back and the stage is written into the Negotiations seat and
       a Contracts list opens that never heard of it (regShowOnly's own reason,
       and the shell search's own fix). And the number on the door is the whole
       book's, so a named set left over from an earlier door is let go. */
    if(kind==='stage'){ if(window.regSetScope) regSetScope(null);
      const r=regState(); r.type='all'; r.sel={}; r.view=null; r.only=null; r.page=1; r.stage=arg; setView('register'); return; }
    if(kind==='month'){ const M=d.months[Number(arg)]; if(!M) return;
      let name=''; try{ name=new Date(M.y,M.m,1).toLocaleDateString(langLocale(),{month:'long',year:'numeric'}); }catch(_){}
      only(M.ids,i18t('home_map_ending_in',{month:name})); return; }
    if(kind==='window'){ only(d.win.ids,i18t('home_map_window_label',{d:d.win.d})); return; }
    if(kind==='hurt'){ if(window.intelGoTab) intelGoTab('exposure'); else setView('intel'); return; }
    if(kind==='owed'){ if(window.obwGoFiltered) obwGoFiltered({state:'open', side:'theirs'}); else setView('obligations'); return; }
    if(kind==='turn'){ only(d.turn&&d.turn.ids,i18t('home_map_turn_label')); return; }
  });
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
/* ---- THE TRIAGE CARD ---- (owner-approved design, 9 Sep 2026)
   A ROW IN "Needs your decision", drawn in that list's OWN vocabulary — the
   same .hm-row shell, the same left rule, the same title/meta/tag — so a card
   folded away is indistinguishable from its neighbours. What it adds is that
   it OPENS, and carries what was found.

   COUNTING IS NOT DRAWING: every figure and every word of detail comes from
   triageTiles / triageLine in js/triage.js, which return plain data. This
   draws them and works nothing out, so the card and the contract's own screens
   cannot come to disagree about what was found.

   IT IS A <div>, NOT A <button>, and that is forced rather than chosen: the
   ordinary rows are buttons, and a button may not contain the three buttons
   this card carries. It keeps the class, so the hover and the rule follow.

   THE FOLD IS PER SITTING AND IN MEMORY — the clause panel's own rule. A card
   folded on Monday is open again on Tuesday if nobody has dealt with it,
   because it is a posture rather than a fact about the contract.

   NO SIGNING-ROUTE TILE, and that is the one thing held back out of the drawn
   design, said out loud rather than quietly dropped: HaTi has no reading for
   who signs on either side, so a tile there would be a promise nothing can
   keep. "Change the route" waits on it. */
const _hmTriageFold=new Set();
function triageRowHtml(it){
  const c=it.c, open=it.expand&&!_hmTriageFold.has(it.cid);
  /* TEAL WHERE IT WAS READ, AMBER WHERE IT COULD NOT BE. Amber on this list
     means work owed, and a contract that arrived read and clean owes nothing
     — a colour that always shouts is one nobody reads. */
  const cls='hm-row is-tri'+(it.expand?' is-tri-ok':' is-crit')+(open?' is-tri-open':'');
  const head=`<div class="hm-tri-head">
      <span class="hm-rb"><span class="hm-rt">${it.txt}</span>
        <span class="hm-rm">${open?esc(triageSubHead(c)):it.meta}</span></span>
      <span class="hm-rtag">${esc(it.tag)}</span>
      <button type="button" class="hm-tri-fold" data-tri-fold="${esc(it.cid)}"
        title="${esc(i18t(open?'tri_fold':'tri_unfold'))}" aria-expanded="${open?'true':'false'}">${open?'&#9650;':'&#9660;'}</button>
    </div>`;
  if(!open) return `<div class="${cls}" data-tri-row="${esc(it.cid)}">${head}</div>`;
  const tiles=(typeof triageTiles==='function'?triageTiles(c):[]).map(t=>{
    const tone=t.ok?((t.count!=null&&t.count>0)?'is-warn':'is-ok'):'is-no';
    const mark=t.ok?((t.count!=null&&t.count>0)?String(t.count):'&#10003;'):'&mdash;';
    return `<div class="hm-tri-tile">
      <div class="hm-tri-th"><span class="hm-tri-chip ${tone}">${mark}</span>${esc(i18t(t.headKey))}</div>
      <div class="hm-tri-td">${esc(t.detail)}</div>
    </div>`; }).join('');
  return `<div class="${cls}" data-tri-row="${esc(it.cid)}">
      ${head}
      <div class="hm-tri-tiles">${tiles}</div>
      <div class="hm-tri-acts">
        <button type="button" class="${hmRowBtnCls('is-p')}" data-tri-act="redline:${esc(it.cid)}">${esc(i18t('tri_a_redline'))}</button>
        <button type="button" class="${hmRowBtnCls('')}" data-tri-act="brief:${esc(it.cid)}">${esc(i18t('tri_a_brief'))}</button>
        <button type="button" class="${hmRowBtnCls('is-plain')}" data-tri-act="decline:${esc(it.cid)}">${esc(i18t('tri_a_decline'))}</button>
      </div>
    </div>`;
}
/* The line under the title while the card is open: the file itself, who filed
   it and when — the provenance a reader wants before they act on any of it. */
/* A DAY, IN THE READER'S OWN WORDS. Lifted to module scope the day the desk
   became its SECOND reader: it was declared inside hmDashSlices and returned,
   which is fine for one caller and is how two would come to print the same
   date two ways on one page. NEVER fmtDocDate — that is the DOCUMENT's
   formatter and writes English months from a fixed list whatever language the
   reader has chosen, which is right on a contract and wrong on a screen. */
const fmtDDay=iso=>{ const t=Date.parse((iso||'')+'T00:00:00'); return isNaN(t)?iso:new Date(t).toLocaleDateString(langLocale(),{day:'2-digit',month:'short',year:'numeric'}); };

/* ---- THE OVERNIGHT DESK'S ROW (idea 19, owner-ruled 9 Sep 2026) ----
   Three kinds of prepared work, above the reader's own list. COUNTING IS NOT
   DRAWING: every figure, day and name comes from deskItems in js/desknight.js,
   which returns plain data; this composes the sentence and works nothing out,
   so the row and the screen it leads to cannot disagree about what was found.

   IT IS A <div>, NOT A <button>, and that is forced rather than chosen — the
   ordinary rows on this page are buttons, and a button may not contain the two
   or three this row carries. It keeps .hm-row, so the left rule, the tone and
   the type follow the list below it and a desk row is plainly one of the same
   family.

   IT BORROWS THE ACT ROW triage's card already had rather than declaring a
   second one that agrees today: one rule, two wearers, named in index.html. */
/* ---- ONE SIZE FOR A ROW'S BUTTONS ON HOME (Young, 26 Sep 2026: "the buttons
   should be the same size and likely the size of the needs your decision
   card") ----
   MEASURED: Needs your decision's verb is the ladder's row rung — 22px, 12px,
   medium, 8px of padding. Prepared for you's were .hm-tri-b, a hand-sized
   family the Compact ladder missed: 28px, 13px, weight 600, 12px of padding,
   and the lead act FILLED on every row, which is the ladder's own rule broken
   (one filled button per area; a repeated row's main act takes the accent's
   ink). Two rows of one family, a card apart, in two sizes.
   THE LADDER'S OWN CLASSES, NOT A FOURTH COPY OF ITS BOX: the row rung for
   every verb, the accent's ink for the lead act and the ladder's text button
   for Put away, which is its "Dismiss". .hm-tri-b and the is-p / is-plain marks
   stay on the element as hooks and carry no box of their own (index.html).
   ONE READING FOR BOTH ROWS THAT DRAW THEM — the desk's and the dormant
   triage row's — so the one that has no caller today cannot come back in the
   old size. */
function hmRowBtnCls(cls){
  const base=cls==='is-plain'?'ui-link':'ui-btn ui-btn-sm'+(cls==='is-p'?' ui-btn-accent':'');
  return base+' hm-tri-b'+(cls?' '+cls:'');
}
function deskRowHtml(it){
  const NOCP=i18t('home_no_counterparty');
  const who=esc(it.who||NOCP);
  /* THE KIND AND THE OBLIGATION TRAVEL ON THE BUTTON. The key is the desk's
     own dismissal token and its shape belongs to deskKeyOf; a handler that
     split it back apart would be a second reading of that shape. */
  const B=(act,label,cls)=>`<button type="button" class="${hmRowBtnCls(cls)}"
      data-desk-act="${esc(act)}" data-desk-cid="${esc(it.cid)}" data-desk-key="${esc(it.key)}"
      data-desk-kind="${esc(it.kind)}"${it.ob?` data-desk-ob="${esc(it.ob.id)}"`:''}
      >${esc(label)}</button>`;
  let tone='is-crit', txt='', meta='', tag='', acts='';

  if(it.kind==='chase'){
    /* RUBY: somebody outside the building is late and waiting on an answer,
       which is the only thing on this desk with a person on the far side. */
    tone='is-neg';
    txt=i18t('desk_chase_t',{who});
    /* THE META IS WHAT IT IS, THE TAG IS HOW LATE — never both. */
    meta=esc(it.what)+(it.noAddress?' &middot; '+esc(i18t('desk_chase_noaddr')):'');
    tag=i18tn('desk_late',it.days,{n:it.days});
    /* A VERB THAT CANNOT WORK IS NOT DRAWN. With no address on file no message
       can go, so the row offers the contract instead — where the address is
       typed — and the meta line says why rather than leaving it to be
       discovered after the press. */
    acts=(it.noAddress?'':B('send',i18t('desk_chase_send'),'is-p'))
      +B('open',i18t('desk_chase_open'),it.noAddress?'is-p':'')
      +B('discard',i18t('desk_discard'),'is-plain');
  }else if(it.kind==='notice'){
    /* THE ONE ROW ON THIS DESK WHERE DOING NOTHING IS ITSELF A DECISION — an
       agreement that renews by silence renews if this letter is not sent. So
       it leads the desk, and it is ruby inside a fortnight.
       THE ROW SAYS WHAT THE LETTER IS AND WHEN IT MUST GO, and nothing about
       serving it: HaTi drafts, a person serves. */
    if(it.urgent) tone='is-neg';
    txt=i18t(it.noticeKind==='non-renewal'?'desk_nt_t_nonren':'desk_nt_t_term',{who});
    meta=esc([i18t('desk_nt_by',{date:it.by?fmtDDay(it.by):''}),
      it.notice?i18t('desk_ren_notice',{n:it.notice}):'',
      i18t('desk_nt_ends',{date:it.ends?fmtDDay(it.ends):''})].filter(Boolean).join(' · '));
    tag=i18tn('desk_days',it.days,{n:it.days});
    acts=B('notice',i18t('desk_nt_read'),'is-p')
      +B('open',i18t('desk_ren_review'),'')
      +B('discard',i18t('desk_discard'),'is-plain');
  }else if(it.kind==='deviations'){
    txt=i18tn('desk_dev_t',it.n,{n:it.n,who});
    meta=esc(it.cats&&it.cats.length?i18t('desk_dev_m',{cats:it.cats.join(', ')}):i18t('desk_dev_m_plain'));
    tag=i18t('desk_dev_tag');
    acts=B('open',i18t('desk_dev_open'),'is-p')+B('discard',i18t('desk_discard'),'is-plain');
  }else{
    if(it.urgent) tone='is-neg';
    txt=i18t('desk_ren_t',{who});
    /* WHAT IS ALREADY READY, and only where it really is. The memo and the
       findings are facts on the record; absent, the line simply does not
       mention them, because a row claiming a reading nobody has made is the
       one thing this desk must never do. */
    const when=(it.w&&it.w.decideBy)||'';
    const bits=[i18t('desk_ren_by',{date:when?fmtDDay(when):''})];
    if(it.w&&it.w.notice) bits.push(i18t('desk_ren_notice',{n:it.w.notice}));
    /* A NOTE HaTi WROTE UNPROMPTED IS NOT THE SAME FACT as one somebody ran,
       and the row says which. This is where the overnight preparation shows
       itself — on the thing it is true of rather than in a heading over three
       rows, two of which are instant readings and were never prepared at all
       (the header's own no-clock-claim rule, one screen up). */
    if(it.memo) bits.push(i18t(it.prepared?'desk_ren_ready':'desk_ren_memo'));
    if(it.flags) bits.push(i18tn('desk_ren_flags',it.flags,{n:it.flags}));
    meta=esc(bits.filter(Boolean).join(' · '));
    /* THE DATE IS IN THE META AND THE COUNTDOWN IS THE TAG — the decisions list
       below reads the same way round, so the two sections scan alike. */
    tag=it.days<0?i18t('desk_ren_late'):i18tn('desk_days',it.days,{n:it.days});
    acts=B('open',i18t('desk_ren_review'),'is-p')+B('discard',i18t('desk_discard'),'is-plain');
  }

  /* NO MARKER ON THE ROW ITSELF. It carried a data-desk-row nothing read, and
     a dead selector is a mention the next reader has to rule out; which
     contract a row is about is on its own buttons, and the row is not pressable
     — every door it has is one of the verbs. */
  /* ---- THE KIND, AS A TAG AT THE LEFT (Young ruled 21 Sep 2026: "the card in
     hati does not include the highlighted features") ----
     The reference draws every desk row with its kind first — Notice · Read ·
     Memo — so three rows about three different KINDS of work can be told apart
     without reading the sentence. HaTi drew none, so the only difference
     between the rows was their wording.

     ITS TONE IS THE ROW'S OWN, never a second table: `tone` is already worked
     out above from urgency, so the tag and the row can never disagree about
     how pressing this is. A kind with no word is drawn as nothing rather than
     as a blank chip. */
  const KIND_WORD={ chase:'desk_kind_chase', notice:'desk_kind_notice',
                    deviations:'desk_kind_read', renewal:'desk_kind_memo' };
  const kw=KIND_WORD[it.kind]||KIND_WORD.renewal;
  const tagChip=kw?`<span class="hm-dk-tag ${tone}">${esc(i18t(kw))}</span>`:'';
  return `<div class="hm-row is-desk ${tone}">
      ${tagChip}
      <div class="hm-desk-head">
        <span class="hm-rb"><span class="hm-rt">${txt}</span><span class="hm-rm">${meta}</span></span>
        <span class="hm-rtag">${esc(tag)}</span>
      </div>
      <div class="hm-desk-acts">${acts}</div>
    </div>`;
}
function triageSubHead(c){
  const t=(typeof triageOf==='function')?triageOf(c):null;
  const f=(c&&c.upload&&c.upload.name)||'';
  const who=(t&&t.by)||'';
  return [f,who?i18t('tri_by',{who}):'',(window.contractRef?contractRef(c):c.id)].filter(Boolean).join(' · ');
}
/* ---- NEEDS YOUR DECISION — ONE READING (Young ruled 25 Sep 2026) ----
   The list the card draws, lifted out of renderDashboard when the card came
   back: COUNTING IS NOT DRAWING, and the card's rows, the count in its head,
   the "See all" door and the checks that press it all read THIS list, so the
   number on the door cannot drift from the list behind it. It writes
   nothing. `deskRows` is the desk's rows ON SCREEN — the page hands over the
   ones it drew; a caller that has none gets the same reading the page would
   make. */
function hmDecisionItems(S, deskRows){
  const SL=S||hmDashSlices();
  const { cs, myReviews, myStaleDesks, myJoinAsks, decisions, waitingLongest, fmtDDay } = SL;
  const shown=deskRows||((typeof deskItems==='function'&&typeof deskShown==='function')?deskShown(deskItems(cs)):[]);
  /* ONLY THE RENEWAL SOURCE IS FILTERED, and that is the whole precision of the
     one-door rule: a colleague waiting on your review is a different subject
     that happens to share a contract, and dropping that row because a renewal
     is also due would lose it.
     AND ONLY THE ROWS ON SCREEN, never deskAll — see deskCids, whose own first
     rule this reverses. The desk shows at most one renewal, so passing the
     whole list struck every OTHER renewal out of the list below and left it
     nowhere on the page. */
  const deskIds=(typeof deskCids==='function')?deskCids(shown):new Set();

  /* ---- THE ROWS, in the card's own order ----
     Restored as it stood on 23 Sep 2026, less the runway's raw facts (the
     rail is not drawn, so a row carries nothing for it). Every row is one
     decision owed BY NAME to this reader. A TAG IS A PLAIN STRING and the
     row escapes it once — it was escaped here AND at the row, so a translation
     carrying an ampersand would have printed "&amp;". */
  const strong=x=>`<strong style="font-weight:var(--w-strong)">${esc(x)}</strong>`;
  /* ONE READING, TWO SURFACES (20 Sep 2026): the Approvals & signing page
     draws the same list, so the arithmetic lives in hmMySignings. */
  const mySignings=hmMySignings(cs);
  const decisionItems=[
    /* REVIEWS LEAD, because they are the only item on this card that somebody
       is personally waiting on. A renewal date does not know your name; a
       colleague who sent you three redlines on Tuesday does. */
    ...(myReviews||[]).map(x=>({
      cid:x.c.id, urgent:!!(x.rv.due&&String(x.rv.due)<new Date().toISOString().slice(0,10)),
      txt:esc(i18t('rv_home_title'))+' — '+strong(x.c.name),
      meta:`${esc(i18t('rv_home_from',{who:x.rv.by}))} · ${esc(i18tn('rv_home_sub',x.st.total,{n:x.st.total}))}`,
      tag:x.rv.due?String(x.rv.due):i18t('rv_home_open'),
      verb:i18t('home_verb_review'),
    })),
    /* A QUIET DEAL: the counterparty is already waiting, and every day this
       sits here is a day they are not being answered. */
    ...(myStaleDesks||[]).map(x=>({
      cid:x.c.id, urgent:true,
      txt:esc(i18t('dk_stale_card',{who:x.c.counterparty||i18t('home_no_counterparty')}))+' — '+strong(x.c.name),
      meta:esc(i18tn('dk_stale_sub',x.stale.n,{n:x.stale.n,who:(x.stale.lead&&x.stale.lead.name)||''})),
      tag:i18t('dk_stale_tag',{n:x.stale.days}),
      verb:i18t('act_open'),
    })),
    /* SOMEBODY IS ASKING TO JOIN A NEGOTIATION YOU LEAD — one colleague
       waiting on one answer from this reader by name, the shape of every
       other row here. */
    ...(myJoinAsks||[]).map(x=>({
      cid:x.c.id, urgent:false,
      txt:esc(i18t('dk_join_card',{who:(x.req&&x.req.name)||''}))+' — '+strong(x.c.name),
      meta:(x.req&&x.req.why)?`\u201c${esc(x.req.why)}\u201d`:esc(x.c.counterparty||i18t('home_no_counterparty')),
      tag:i18t('dk_ask_tag'),
      verb:i18t('home_verb_answer'),
    })),
    /* YOUR SIGNATURE, AND WHAT STANDS BEFORE IT — the number is
       signReadiness's, the same the Signing tab and the head quote. */
    ...mySignings.map(x=>({
      cid:x.c.id, urgent:false,
      txt:i18t('home_sign_row',{n:x.n,name:strong(x.c.name)}),
      meta:esc(x.c.counterparty||i18t('home_no_counterparty')),
      tag:i18t('home_sign_tag'),
      verb:i18t('home_verb_sign'),
    })),
    ...(decisions||[]).filter(x=>!deskIds.has(x.c.id)).map(x=>({
      cid:x.c.id, urgent:x.d<=30,
      txt:i18t('home_renew_or_exit',{name:strong(x.c.name)}),
      meta:i18t('home_decide_by',{who:esc(x.c.counterparty||i18t('home_no_counterparty')),when:fmtDDay(x.dd)}),
      tag:x.d===0?i18t('home_today'):i18t('home_in_days',{n:x.d}),
      verb:i18t('home_verb_decide'),
    })),
    ...(waitingLongest||[]).map(x=>({
      cid:x.c.id, urgent:x.idle>=30,
      txt:i18t('home_waiting_on_review',{name:strong(x.c.name)}),
      meta:`${esc(x.c.counterparty||i18t('home_no_counterparty'))} · ${esc(window.contractRef?contractRef(x.c):x.c.id)}`,
      tag:i18t('home_idle_days',{n:x.idle}),
      verb:i18t('act_open'),
    })),
  ];
  return decisionItems;
}

/* ---- TWO ROWS, WHATEVER THE SCREEN (Young ruled 25 Sep 2026) ----
   *"only have 2 lines and nothing more."* The list used to fill the reader's
   screen (hmFitDecisions, a floor of four and a ceiling of forty); it is two
   now on every screen, and a number rather than a measurement, because
   nothing about the room below it decides how many the owner wants. A CAP IS
   A FACT: the head counts them all and "See all" opens every one. */
const HM_DD_ROWS = 2;

function renderDashboard(){
  /* ---- HOME IS THE GREETING, THE MAP AND PREPARED FOR YOU (Young ruled
     24 Sep 2026) ----
     *"instead of needs your decision, delete it and replace with prepared for
     you"*, over the drawing whose top was the Map; then *"Build it"*. The four
     tiles, "Choose tiles" and "Needs your decision" left the DESKTOP page,
     each said to the owner before it was built. What did NOT leave:
       · every reading behind them — hmDashSlices, the KPI catalogue, KPI_META
         and currentKpiSel still answer, because the phone's figures list and
         its picker read them, and the Approvals page reads hmMySignings;
       · the two reminders that lived only on that card — a colleague asking
         to join a negotiation and a negotiation gone quiet — which ride the
         bell now (buildAlerts, desk-join / desk-quiet);
       · every renewal it listed, which the Map's chart draws and opens.
     hmDashSlices is asked ONCE per paint and handed to the Map, which borrows
     every figure from it — one walk of the book (the performance audit's
     rule, paid for at 108 million list items).

     AND "NEEDS YOUR DECISION" CAME BACK THE NEXT DAY (Young ruled 25 Sep
     2026): *"below prepared for you card, add bring back the needs your
     attention card but only have 2 lines and nothing more."* It is the
     same card under its own name — the approved reference calls it "Needs
     your decision"; "Needs your attention" is the Settings page's block —
     with its own rows in its own order, and TWO of them. What did not come
     back with it: the line of time (js/runway.js stays dormant) and the
     fitted slice (hmFitDecisions). The two bell rows stay too — the bell
     says everything owed to you, this card the first two decisions. */
  const SL=hmDashSlices();
  const { cs, countAll, me } = SL;
  const mapD=hmMapData(SL);
  const measure=hmMeasure(mapD.money);



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

  /* ---- THE OVERNIGHT DESK (idea 19) ----
     Read before the list below it, because the list below it depends on the
     answer: a contract the desk has prepared a renewal for LEAVES "Needs your
     decision", or Home says the same thing about the same contract twice.
     (For one day, 24 Sep 2026, the desk was the only list on Home and there
     was nothing to evict from; the list came back on 25 Sep, and so did the
     eviction.) */
  const deskAll=(typeof deskItems==='function')?deskItems(cs):[];
  const deskRows=(typeof deskShown==='function')?deskShown(deskAll):[];
  /* The list below, read once with the desk's own rows (see hmDecisionItems). */
  const decisionItems=hmDecisionItems(SL, deskRows);

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
     forgotten on a tile added later. SINCE 24 SEP 2026 THE TILES ARE OFF THE
     DESKTOP HOME and hmTile went with them; both rules live on in the Map —
     every figure opens the list that makes it (fact(), the month and stage
     doors), and a zero draws and refuses the press — and on the phone's own
     tiles, which read the same catalogue's `go`. */
  /* ---- A SECTION HEAD, AND THE CARD HEAD IT BECOMES (Young ruled 21 Sep
     2026: Home must look exactly like the artifact) ----
     The reference draws Prepared for you and Needs your decision as CARDS: a
     head of title · quiet sub · acts at the right, a hairline, then the rows.
     This is the SAME builder with the rule dropped, because the card's own
     border is that rule — one head, two shapes, so the two sections and the
     My work label can never drift apart. `card` is opt-in, so My work is
     byte-identical to what it was. */
  /* THE HEAD BUILDER LIVES AT MODULE SCOPE since 24 Sep 2026 (hmSecHtml),
     because the Map draws its own head with it and a second copy of four
     lines of markup is how two card heads come to disagree. */
  const hmSec=hmSecHtml;
  const hmCard=(head,body)=>`<section class="hm-card">${head}${body}</section>`;

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

  /* ---- WHAT THE SECTION SAYS ABOUT ITSELF ----
     "Prepared for you", never a clock time, and that is the truthfulness rule
     this codebase applies to "sent means sent" applied to a claim about work:
     HaTi does not yet do anything while nobody is watching, so a header reading
     "finished 05:40" would be the page inventing a night shift. What IS true is
     the half that matters — the reader asked for none of this and it was ready
     when they arrived — and the promise the whole desk rests on, that NOTHING
     WAS SENT OR FILED.

     A CAP IS A FACT, NEVER A SILENT TRIM: at most one row per kind is on
     screen, so where more qualify the sub-line says how many of how many. */
  /* ---- THE COUNT IS WHAT IS ON SCREEN (Young ruled 9 Sep 2026) ----
     *"keep it as it is but remove the '2 out of 9' because i have no ability to
     see the rest of the 9."* It read "9 things … showing 2 of 9", and both
     halves named a population the reader cannot reach: the desk draws one of
     each kind and there is no door to the rest.

     THIS NARROWS "A CAP IS A FACT, NEVER A SILENT TRIM" RATHER THAN BREAKING
     IT. That rule exists so a reader is never shown a slice dressed as the
     whole — and it assumes the fact is ACTIONABLE. Here it was not: nothing on
     the page, and nothing anywhere, opens the other seven. A number you can
     neither reach nor act on is not a fact being kept honest, it is a promise
     the page cannot keep. So the sub-line counts the rows it is drawing, and
     every word of it is now true and reachable.

     WHAT IS NOT LOST, which is what makes this safe: the desk is a stack rather
     than a queue, and everything held back is still where it always was — the
     renewals in "Needs your decision" (off the page for one day, 24 Sep
     2026) and on the Map and the Calendar, the late promises on the
     Obligations worklist, what HaTi read on the contract itself. Discarding a row lets the
     next one step into the slot. `desk_showing` is STALE and left inert in both
     books; the day the desk grows a door onto the rest, it comes back. */
  const deskSub=deskRows.length
    ? esc(i18tn('desk_sub',deskRows.length,{n:deskRows.length}))
    : '';
  /* NOTHING PREPARED DRAWS NOTHING AT ALL — no heading, no empty state. An
     empty section that says so every morning is the furniture this rulebook
     keeps warning about, and the list below it already has its own empty
     state (for one day, 24 Sep 2026, there was no list below it). */
  const deskSection=deskRows.length?hmCard(
    hmSec(i18t('desk_sec'),`<span class="hm-desk-sub">${deskSub}</span>
      <button type="button" class="hm-cz" data-desk-act="discard-all">${esc(i18t('desk_discard_all'))}</button>`,true),
    `<div class="hm-rows" id="hm-desk-rows">${deskRows.map(deskRowHtml).join('')}</div>`):'';

  /* ---- NEEDS YOUR DECISION, TWO ROWS (Young ruled 25 Sep 2026) ----
     The row is the reference's, as it stood: a tone dot (ruby where it is
     urgent, amber otherwise), the decision over one quiet line, its tag, the
     verb as a word and the chevron — one press, the row's own. THE HEAD
     COUNTS THEM ALL and "See all" is drawn only where more wait than show,
     because pressing it with nothing more would open the list already on
     screen. AN EMPTY LIST SAYS SO in one line: this is the reader's own work,
     and "nothing to decide" is worth knowing, unlike an empty desk above. */
  const ddShown=decisionItems.slice(0,HM_DD_ROWS);
  const ddRowsHtml=ddShown.length
    ? `<div class="hm-rows" id="hm-dd-rows">${ddShown.map(it=>`
        <button type="button" class="hm-row ${it.urgent?'is-neg':'is-crit'}" data-sel="${esc(it.cid)}">
          <span class="hm-rdot" aria-hidden="true"></span>
          <span class="hm-rb"><span class="hm-rt">${it.txt}</span><span class="hm-rm">${it.meta}</span></span>
          <span class="hm-rtag">${esc(it.tag)}</span>
          ${it.verb?`<span class="hm-rverb">${esc(it.verb)}</span>`:''}
          <svg class="hm-rchev" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><use href="#i-right"/></svg>
        </button>`).join('')}</div>`
    : `<div class="hm-empty">${esc(i18t('home_nothing_to_decide'))}</div>`;
  const ddN=decisionItems.length;
  const ddHead=(ddN?`<span class="hm-sec-sub">${esc(i18tn('home_dd_items',ddN,{n:ddN}))} · ${esc(i18t('home_dd_sorted'))}</span>`:'')
    + (ddN>ddShown.length
    ? `<button type="button" class="hm-cz" data-hm-go="needsyou">${esc(i18t('home_see_all',{n:ddN}))}
         <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><use href="#i-right"/></svg></button>`
    : '');
  const ddSection=hmCard(hmSec(i18t('home_needs_decision'),ddHead,true), ddRowsHtml);

  document.getElementById('content').innerHTML=`
  <div class="view-enter hm-page">
    ${firstRunBanner}

    ${''/* THE HEAD IS THE REFERENCE'S (the redesign's second pass, 21 Sep
           2026): the greeting over its own line, and the act at the right.
           ONE ACT SINCE 24 Sep 2026 — Choose tiles (#kpi-customize) left with
           the four tiles it chose; the filled New agreement stays. */}
    <div class="hm-greet">
      <span class="hm-greet-l"><h1>${i18t(greetKey)}, ${esc(firstName)}</h1>
      <span class="hm-greet-sub">${todayLine}</span></span>
      <span style="flex:1 1 auto"></span>
      <button id="hero-draft" class="hm-primary">
        ${icon('plus','w-3.5 h-3.5',2)} ${i18t('home_draft_new')}
      </button>
    </div>

    ${''/* THE MAP (Young ruled 24 Sep 2026). data-measure carries the switch's
           own answer, so a repaint of the card's inside knows where it stands. */}
    <section class="hm-card hm-map" id="hm-map" data-measure="${measure}">${hmMapInnerHtml(mapD, measure)}</section>

    ${deskSection}

    ${ddSection}
  </div>`;

  // ---- wiring ----
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

  document.querySelectorAll('[data-act-decide]').forEach(el=>el.addEventListener('click',()=>openWorkspace(el.getAttribute('data-act-decide'))));
  document.querySelectorAll('[data-share-open]').forEach(el=>el.addEventListener('click',()=>openWorkspace(el.getAttribute('data-share-open'))));
  /* ---- THE TRIAGE CARD'S OWN PRESSES ----
     THE FOLD IS PER SITTING AND REPAINTS NOTHING BUT THIS PAGE. It is a
     posture, so it is not stored: a card folded on Monday is open again on
     Tuesday if nobody has dealt with the contract.
     EVERY OTHER PRESS ACKNOWLEDGES THE CARD, and that is an ACT rather than a
     render — a card that cleared itself the moment Home drew it would be a
     reading that writes. So the card stays until somebody does something with
     it, and one press is enough. */
  /* ---- THE DESK'S ACTS (idea 19) ----
     NOT ONE OF THEM IS A NEW WAY OF DOING ANYTHING. Send presses
     obligationChase, which is the product's one chase — its own confirm, its
     own record-before-the-message ordering, its own three honest answers.
     Open presses openWorkspace and roomGoTab, the worklist's own two lines.
     Discard writes the desk's own stamp and touches nothing else. */
  const deskGo=(cid,tab)=>{ if(!window.openWorkspace) return;
    openWorkspace(cid);
    const c=window.getContract?getContract(cid):null;
    if(c&&window.roomGoTab) try{ roomGoTab(c,tab); }catch(_){} };
  document.querySelectorAll('[data-desk-act]').forEach(el=>el.addEventListener('click',async ev=>{
    ev.stopPropagation();
    const act=el.getAttribute('data-desk-act');
    if(act==='discard-all'){
      /* IT ASKS, AND IT SAYS WHAT IT COSTS — which is nothing: every row here
         is a reading of something that stays exactly where it was.

         IT STILL PUTS AWAY deskAll RATHER THAN THE ROWS ON SCREEN, and that is
         the one place the whole population is still acted on: discard only what
         is drawn and the held-back ones step straight into the empty slots, so
         "Discard all" would appear to do nothing. THE WORDING NO LONGER NAMES A
         COUNT, though — the page deliberately stops mentioning a population the
         reader cannot see (Young, 9 Sep 2026), and a confirm is the wrong place
         to introduce one. */
      const ok=await confirmDialog({ title:i18t('desk_discard_q'),
        message:i18t('desk_discard_msg'),
        confirm:i18t('desk_discard_go') });
      if(!ok) return;
      let n=0;
      for(const it of deskAll){ if(window.deskDismiss&&deskDismiss(it.c,it.key)) n++; }
      if(n) renderDashboard();
      return;
    }
    const cid=el.getAttribute('data-desk-cid'), key=el.getAttribute('data-desk-key');
    const kind=el.getAttribute('data-desk-kind');
    const c=(state.contracts||[]).find(x=>x&&x.id===cid); if(!c) return;
    if(act==='discard'){ if(window.deskDismiss&&deskDismiss(c,key)) renderDashboard(); return; }
    /* WHERE THE READER ENDS UP: the contract, on the tab this row is about —
       the worklist's own rule. A late promise lands on Obligations; the other
       two land on Key terms, where the renewal card and what HaTi read both
       live. A row that opened the Document tab would make them hunt for what
       they pressed. */
    if(act==='open'){ deskGo(cid, kind==='chase'?'oblig':'terms'); return; }
    /* THE LETTER OPENS WHERE THE READER IS. It is a reading and a dialog —
       nothing is sent, nothing on the contract moves until they copy it — so
       it does not need the contract's page to be open first. */
    if(act==='notice'){ if(window.openNoticeDialog) openNoticeDialog(c); return; }
    if(act==='send'){
      const ob=el.getAttribute('data-desk-ob');
      if(!window.obligationChase||!ob) return;
      await obligationChase(cid,ob);
      renderDashboard();
      return;
    }
  }));
  document.querySelectorAll('[data-tri-fold]').forEach(el=>el.addEventListener('click',ev=>{
    ev.stopPropagation();
    const id=el.getAttribute('data-tri-fold');
    if(_hmTriageFold.has(id)) _hmTriageFold.delete(id); else _hmTriageFold.add(id);
    renderDashboard();
  }));
  document.querySelectorAll('[data-tri-act]').forEach(el=>el.addEventListener('click',async ev=>{
    ev.stopPropagation();
    const [act,id]=String(el.getAttribute('data-tri-act')||'').split(':');
    const c=(state.contracts||[]).find(x=>x&&x.id===id); if(!c) return;
    if(act==='decline'){
      /* THE ONE ACT HERE THAT CHANGES THE CONTRACT, so it asks first and says
         what it costs. Declining is a real status this product already
         understands — off every live list, every count and both sweeps — and
         it is the honest answer to paper that should never have been sent. */
      const ok=await confirmDialog({ title:i18t('tri_decline_q'),
        /* THE NAME GOES IN RAW: confirmDialog draws its message in a <p> and
           ESCAPES it, so escaping here too would show a contract called
           "Smith & Co" as "Smith &amp; Co" in the one dialog that asks
           somebody to decline it. Every other caller passes it raw. */
        message:i18t('tri_decline_msg',{name:c.name||(window.contractRef?contractRef(c):c.id)}),
        confirm:i18t('tri_a_decline'), danger:true });
      if(!ok) return;
      c.status='Declined'; c.lastAction=todayStr();
      logAudit(c,'Declined','Declined from the triage card — not ours');
      if(window.triageAck) triageAck(c);
      persist(c); toast(i18t('tri_declined'),'ok'); renderDashboard();
      if(window.updateSidebarCounts) updateSidebarCounts();
      return;
    }
    if(window.triageAck) triageAck(c);
    /* BOTH DOORS ARE THE PRODUCT'S OWN — the negotiation, and the Checks
       panel's brief. Neither is a second way of doing anything. */
    if(act==='redline'){ if(window.openRedlineWorkbench) openRedlineWorkbench(c); else selectContract(c.id); return; }
    if(act==='brief'){
      selectContract(c.id);
      if(window.openCheckPanel) setTimeout(()=>openCheckPanel(c,'brief'),0);
    }
  }));
  document.querySelectorAll('[data-tri-row]').forEach(el=>el.addEventListener('click',()=>{
    const id=el.getAttribute('data-tri-row');
    const c=(state.contracts||[]).find(x=>x&&x.id===id); if(!c) return;
    if(window.triageAck) triageAck(c);
    selectContract(id);
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
  /* ---- NEEDS YOUR DECISION'S TWO PRESSES ----
     A ROW OPENS ITS CONTRACT, as it always did. "See all" opens Contracts
     narrowed to every contract on the list — the rows are contracts waiting
     on this reader, so the door stays in Contracts; the bell owns the wider
     "everything owed to you". Scoped to the card, so no other [data-sel] on
     a page this module draws can answer. */
  document.querySelectorAll('#hm-dd-rows [data-sel]').forEach(el=>el.addEventListener('click',()=>selectContract(el.getAttribute('data-sel'))));
  document.querySelector('[data-hm-go="needsyou"]')?.addEventListener('click',e=>{
    e.stopPropagation();
    const ids=decisionItems.map(x=>x.cid).filter(Boolean);
    if(window.regShowOnly && ids.length){ regShowOnly(ids,i18t('home_needs_decision')); return; }
    const r=regState(); r.type='all'; r.sel={}; r.view=null; r.stage='all'; setView('register');
  });
  /* THE MAP'S DOORS AND ITS SWITCH, one delegated listener on the card. */
  hmMapWire(document.getElementById('hm-map'), mapD);
  setActiveNav('dashboard');
}

Object.assign(window,{renderDashboard,hmDashSlices,hmDecisionItems,HM_DD_ROWS,hmStageTone,hmMySignings,hmMapData,hmMapInnerHtml,hmMapWire,hmMeasure,hmSetMeasure,hmOwed,hmSecHtml,HM_MAP_MONTHS,HM_MAP_STAGES,copilotRead,copilotCoverage,gsSteps,gettingStartedHtml,gsIsSeed,
  KPI_META,currentKpiSel,setKpiSel,kpiCatalogOrder,DEFAULT_KPI_SEL,KPI_MAX,kpiAtMax,readyToSignItems});
