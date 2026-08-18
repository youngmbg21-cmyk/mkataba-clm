// HaTi — entry module (E0): imports every module in original
// execution order, then nav + shell wiring + boot.
import './i18n.js';        // what language this PERSON reads the app in — theirs, not the company's
import './components.js';
import './templates.js';
import './jurisdiction.js'; // where this workspace operates: law, money, which statute checks apply
import './core.js';
import './docx.js';
import './richdoc.js';
import './clausemodel.js'; // what a clause IS: read from the DOM, identified by a durable id
import './redline.js';   // the negotiation's diff: Myers ops, stored and rendered from storage
import './richpaste.js';
import './api.js';
import './aimd.js';    // markdown + tone markers, escaped: a model's words are untrusted input
import './aichart.js'; // in-chat charts, built from live state and never from the model
import './advice.js';
import './metadata.js';
import './versioning.js';
import './discuss.js';    // the light channel: talking about a point, not redrafting it
import './negotiation.js'; // the fingerprinted change model every intake path converges on
import './obligations.js';
import './playbook.js';
import './approvals.js';
import './review.js';       // internal review: the step between writing a redline and sending it
import './desk.js';         // the negotiation desk: who works this negotiation, and who may send
import './signature.js';
import './wizard.js';
import './views/calendar.js';
import './views/reports.js';
import './views/weekly.js';       // the weekly review: five slots, three sizes, no AI
import './views/healthreport.js'; // the Portfolio Health Report: deterministic document, opened by button or by Copilot
import './views/portal.js';
import './views/home.js';
import './views/register.js';
import './ocr.js';
import './dedupe.js';
import './family.js';
import './views/negotiation.js';  // the three-pane redline, rendered for whichever side is looking
import './views/contract.js';
import './pdfrich.js';
import './workshape.js';       // which shapes this business has, and what it calls a piece of work
import './views/portfolio.js';    // the universal frame: six panels every business gets
import './views/intelligence.js';
import './ai.js';
import './views/settings.js';
import './views/directory.js';    // People: the roster, read-only, for every role
import './views/queue.js';
import './views/advice.js';
import './views/adviceportal.js';
import './templatefields.js';
import './views/library.js';
import './fieldlib.js';            // the template-library field catalogue (shared with the server)
import './branding.js';            // document designs AND structures (shared with the server — one catalogue)
import './templateform.js';        // template-form rendering + validation (shared with the server)
import './views/templatelib.js';   // the versioned company standard-template library
import './views/templatebuilder.js';  // edits one draft version of a library template
import './views/designstep.js';       // the Design step: pick a structure and a style before publish
import './views/migration.js';
/* The phone. Imported last, so every function it reads — the dashboard's
   figures, the register's filter, the contract's next action, the Copilot —
   is already on window by the time it boots. It renders nothing at all above
   767px; see the rules at the top of js/mobile.js. */
import './mobile.js';
import './mobile-screens.js';
import './mobile-contract.js';
import './mobile-copilot.js';
import './mobile-portal.js';

/* ============================================================ NAV */
/* WO N1 — one door per thing. Views that live INSIDE a contract (the
   workspace, the negotiation workbench) and flows that feed the register
   (a folder, the bulk import) light "Contracts", so the sidebar never
   points at a door that no longer exists.

   "Our standards" is NOT in this table any more. It used to borrow the
   Templates door because it had none of its own; it now has one under
   Administration, so it lights itself. A view with its own nav item must
   never appear here — that is how a screen ends up highlighting a door it
   does not live behind. */
/* A view with no door of its own lights the door it lives behind. Import has
   its own door again, so it is no longer in here — leaving it would light
   Contracts while you stood on the import page, which is how a sidebar comes
   to disagree with the screen it is next to. */
/* `redline` is NOT in here any more. It borrowed the Contracts door for as long
   as it had none of its own; it has one now (12 Aug 2026), so it lights itself
   — and a view with its own nav item must never appear in this table, or the
   sidebar points at a door the reader is not standing behind. */
const NAV_HOME_FOR={ folder:'register', workspace:'register' };
function setActiveNav(view){
  const navFor = NAV_HOME_FOR[view] || view;
  document.querySelectorAll('.nav-item').forEach(b=>{
    const on=b.getAttribute('data-view')===navFor;
    b.classList.toggle('active',on);
    // keep the active tab visible: open its collapsible section (never closes others)
    if(on){ const sec=b.closest('.nav-section'); if(sec && !sec.classList.contains('open')) openNavSection(sec,true); }
  });
}
function openNavSection(sec, open){
  sec.classList.toggle('open',open);
  const head=sec.querySelector('.nav-section-head');
  if(head) head.setAttribute('aria-expanded',open?'true':'false');
}

/* ---- command bar: per-view title + subtitle ---- */
function commandMeta(view){
  const cs=state.contracts, count=cs.length;
  const m=(window.metrics?metrics():{totalValue:0});
  const totalV=fmtMoneyShort(m.totalValue||0);
  switch(view){
    case 'dashboard': {
      // agreements, not files: a master agreement plus six addenda is ONE
      const fam=(window.familyCounts?familyCounts(cs):{agreements:count,documents:count,amendments:0});
      const head=fam.amendments
        ? i18t('pg_dash_agreements',{a:fam.agreements.toLocaleString(jxLocale()),d:fam.documents.toLocaleString(jxLocale())})
        : i18tn('pg_dash_managed',count,{n:count.toLocaleString(jxLocale())});
      return [i18t('pg_portfolio'), i18t('pg_dash_sub',{head,value:totalV})];
    }
    case 'register':  return [i18t('nav_contracts'), i18t('pg_contracts_sub')];
    case 'templates': return [i18t('nav_templates'), i18t('pg_templates_sub')];
    case 'playbook':  return [i18t('nav_our_standards'), i18t('pg_standards_sub')];
    case 'pipeline':  return [i18t('pg_queue'), i18t('pg_queue_sub')];
    case 'advice':    return [i18t('nav_advice_desk'), i18t('pg_advice_sub')];
    // Named to match the nav item exactly. One feature answering to two names
    // is one name too many for a reader trying to describe where they were.
    case 'intel':     return [i18t('nav_insights'), i18t('pg_insights_sub')];
    case 'calendar':  return [i18t('pg_calendar'), i18t('pg_calendar_sub')];
    case 'migration': return [i18t('nav_import'), i18t('pg_import_sub')];
    case 'reports':   return [i18t('pg_reports'), i18t('pg_reports_sub')];
    case 'team':      return [i18t('pg_team'), i18t('pg_team_sub')];
    case 'directory': return [i18t('nav_people'), i18t('pg_people_sub')];
    case 'folder': {
      /* The FOLDER'S OWN NAME is the customer's word and stays as typed; only
         the sentence around it turns. */
      const f=FOLDERS[state.folderId];
      return [i18t('nav_contracts'), f?i18t('pg_folder_filtered',{name:f.name}):i18t('pg_contracts_sub_short')];
    }
    case 'workspace': {
      const c=getContract(state.activeId);
      return [i18t('pg_workspace'), c?`${c.id} · ${c.name}${c.counterparty?' — '+c.counterparty:''}`:i18t('pg_open_from_register')];
    }
    case 'redline': {
      const c=getContract(state.activeId);
      return [i18t('pg_negotiate'), c?`${c.id} · ${c.name}${c.counterparty?' — '+c.counterparty:''}`:i18t('pg_open_from_register')];
    }
    default: return ['HaTi', ''];
  }
}
/* ---------- THE PAGE HEADER ----------
   Each page states its own name and offers its own verbs. Two rules decide
   what appears, and both come from the reference:

     · THE DASHBOARD GETS NO HEADER AT ALL. Its hero already says what the
       screen is and already carries "Draft new agreement". A title bar above
       it repeated the name and put a second create button directly over the
       first — the duplication that prompted this.

     · A PAGE OFFERS ONLY ITS OWN VERBS. Export belongs where there is a
       working set to export; drafting belongs where a reader is looking at
       contracts, not at a calendar or an import queue. Anything a page
       already renders for itself is not repeated here — Templates draws its
       own "Create template", so it gets no create button from this. */
const PAGE_ACTIONS = {
  /* Contracts carries no Export: the page had two of them — this one and a
     second in the filter row — and both are gone. regExportCsv() is untouched
     and still reachable from the folder view. */
  register: ['new'],
  folder:   ['export', 'new'],
  workspace:['export'],
  pipeline: ['new'],
  reports:  ['export'],
};
function pageActionHtml(kind){
  if(kind==='export') return `<button data-page-export class="ui-btn" style="font-size:12px;padding:6px 12px" title="${i18t('ap_export_working_set')}">`+
    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px;vertical-align:-2px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>${i18t('ap_export')}</button>`;
  if(kind==='new') return `<button data-page-new class="ui-btn ui-btn-primary" style="font-size:12px;padding:6px 14px">${i18t('pg_new_contract')}</button>`;
  return '';
}
/* PAGES THAT ALREADY STATE THEIR OWN NAME get no header from here — putting
   one above them is the second layer this whole change removes.

     dashboard  the hero says what the screen is and carries its one verb
     redline    the workbench's own head card names the contract and the round,
                and carries the view toggle, Accept All and Publish Round
     workspace  the contract page leads with the contract's own name

   Everything else is a list or a tool with no name of its own, and says who it
   is here. */
const PAGE_OWNS_HEADER = ['dashboard', 'redline', 'workspace', 'templates'];
/* ---- WHERE THE SUBTITLE SITS, AND WHAT THAT COSTS THE PAGE ----
   Owner-asked, 13 Aug 2026, of Insights: "move the highlighted sentence to be
   next to the word Insights, and move the page up so the dashboards have more
   screen space."

   The two halves are one change. A subtitle under the title is a second LINE,
   and this header sits above #body-grid as its own flex row — every pixel it
   takes is a pixel #content-scroll does not get, and the Insights tabs size
   themselves against exactly that (height:var(--view-h)). Putting the sentence
   on the title's own line, and trimming the lead above it, hands the whole
   difference straight to the charts. Measured: 63px of header became 39px, and
   the three tabs each gained those 24px of chart.

   A LIST, NOT AN `if`. Insights is the page that asked and the only page in it
   today; the next page that wants it joins the list rather than growing a
   second branch in the markup. It is not made the default: most subtitles here
   are sentences rather than three words, and on the title's line a long one
   either wraps straight back to two lines or gets cut. Insights' reads as a
   caption to its own name, which is why it works there.

   IT STILL WRAPS. Below the width where both fit, the sentence drops to its own
   line exactly as before — a header that hid the page's own description to save
   a line would be trading the wrong thing. */
const PAGE_HEAD_INLINE_SUB = ['intel'];
function renderPageHeader(view){
  const host=document.getElementById('page-head'); if(!host) return;
  if(PAGE_OWNS_HEADER.includes(view)){ host.innerHTML=''; host.style.padding='0'; syncViewHeight(); return; }
  const [t,sub]=commandMeta(view);
  const acts=(PAGE_ACTIONS[view]||[]).map(pageActionHtml).join('');
  const inlineSub=PAGE_HEAD_INLINE_SUB.includes(view);
  host.style.padding=inlineSub?'10px 20px 0':'16px 20px 0';
  host.innerHTML=`
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap">
      <div style="min-width:0${inlineSub?';display:flex;align-items:baseline;gap:10px;flex-wrap:wrap':''}">
        <h1 style="margin:0;font-family:var(--font-heading);font-size:clamp(18px,16px + 0.35vw,24px);font-weight:700;letter-spacing:-.01em;color:var(--color-text);line-height:1.2">${esc(t)}</h1>
        ${sub?`<p style="margin:${inlineSub?'0':'3px 0 0'};font-size:12px;color:var(--color-neutral-500);line-height:1.5${inlineSub?';min-width:0':''}">${esc(sub)}</p>`:''}
      </div>
      ${acts?`<div style="display:flex;align-items:center;gap:8px;flex:none">${acts}</div>`:''}
    </div>`;
  syncViewHeight();
}
/* The full-height views size themselves against this rather than a constant,
   so a page header that grows a line — or a dashboard that has none at all —
   never leaves them overflowing or short. Measured from the scroll container
   itself, which is exactly the room a view has. */
function syncViewHeight(){
  const sc=document.getElementById('content-scroll');
  const root=document.documentElement;
  /* Both guarded: the node tests render this switch against a cut-down
     document that has neither a scroll container nor a documentElement. */
  if(sc && root && root.style) root.style.setProperty('--view-h', sc.clientHeight+'px');
}
/* Kept under its old name because the shell and several views call it. */
function updateCommandBar(view){ renderPageHeader(view); }
/* Guarded rather than assumed: this module is evaluated on a cut-down stage in
   the node tests, where there is no global addEventListener to bind to. */
/* Width matters as much as height now. syncViewHeight already ran on every
   resize; applyPanelLayout joins it, and applyRail after it, so crossing a
   breakpoint mid-drag re-asks every part of the shell that has an opinion
   about width. applyPanelLayout no longer has one — the Activity panel is a
   layer over the page rather than a column beside it — but it stays on this
   path so a reintroduced width rule would be honoured without anyone having to
   remember to wire it. Debounced with rAF because a drag fires this
   continuously and these handlers read layout. */
let _shellResizeQueued=false;
function onShellResize(){
  syncViewHeight();
  if(typeof requestAnimationFrame!=='function'){ applyPanelLayout(); return; }
  if(_shellResizeQueued) return;
  _shellResizeQueued=true;
  requestAnimationFrame(()=>{
    _shellResizeQueued=false;
    applyPanelLayout();
    // applyRail owns the sidebar's inline column and reads the floating
    // breakpoint, so crossing 1500 in either direction has to re-ask it.
    applyRail();
    placeLanguageSwitch();
    // A window dragged back to full width must not leave the drawer stranded
    // open over a sidebar that is already on screen.
    if(!navDrawerActive()) closeNavDrawer();
    syncViewHeight();
  });
}
if(typeof addEventListener==='function') addEventListener('resize', onShellResize);
function updateSidebarCounts(){
  const cs=state.contracts;
  const total=(state.serverStats&&state.serverStats.total!=null)?state.serverStats.total:cs.length;
  const counts={
    register: total,
    pipeline: cs.filter(c=>c.status==='Under Review').length,
    advice: (state.advice||[]).filter(r=>ADVICE_ACTIVE.includes(r.status)).length,
    /* obligationDue, not `.slice(0,10)`: slicing ten characters off "31 March
       2027" produces "31 March 2", which is not a date either — the count
       simply left out every obligation whose date a person had typed. */
    calendar: (window.allObligations?allObligations().filter(o=>{ const due=window.obligationDue?obligationDue(o):(o.due||'').slice(0,10);
      const d=(due&&window.daysUntil)?daysUntil(due):null; return d!=null&&!isNaN(d)&&d>=0&&d<=60; }).length:0),
    migration: cs.filter(c=>c.migration&&c.migration.needsReview).length,
    /* WHAT IS WAITING ON YOU, NOT HOW MANY NEGOTIATIONS THERE ARE. This door
       sits above every agreement, so a per-contract number on it would be
       counting the wrong book — and a count of running negotiations would say
       "3" to somebody who owes nothing on any of them. Same arithmetic as the
       round line, the Document tab's button and the workbench's own toolbar:
       one function, four surfaces, no way for them to disagree. */
    negotiations: (window.negoNeedsYouTotal?(()=>{ try{ return negoNeedsYouTotal(); }catch(_){ return 0; } })():0),
    templates: Object.keys(TEMPLATES).length + (window.customTemplates?customTemplates().length:0)
      + (window.tplLibCount?tplLibCount():0),
  };
  /* Tone of the count pill: teal = size of the portfolio, amber = items
     waiting on a person. A zero drops to neutral so an amber tag never cries
     wolf over an empty queue. */
  const NAV_COUNT_TONE={register:'teal',calendar:'amber',migration:'amber',pipeline:'amber',advice:'amber',negotiations:'amber'};
  document.querySelectorAll('[data-count]').forEach(el=>{
    const k=el.getAttribute('data-count'); const v=counts[k];
    el.textContent=(v==null||v==='')?'':Number(v).toLocaleString(jxLocale());
    const tone=(Number(v)>0&&NAV_COUNT_TONE[k])||'';
    if(tone) el.setAttribute('data-tone',tone); else el.removeAttribute('data-tone');
  });
  /* The bell's badge is refreshed on the same beat as the sidebar counts, and
     for the same reason: this runs on every view change and every save, which
     is exactly when the number can have moved. Nothing marks an alert as seen,
     so it goes down when the work does and never because somebody looked. */
  try{ updateAlertBadge(); }catch(e){}
  /* The "AI Active" and "N Open" nav tags left with the sidebar doors they
     sat on (WO N1): a negotiation waiting on the reader is announced
     on the contract itself — the Negotiate tab's count — and on Home's
     needs-attention surfaces, which is where the reader actually is. */
  /* WO N5 — earned nav. An item below its threshold is hidden, not greyed:
     a control that exists but refuses teaches nothing. The current view
     always keeps its door (a restored session or the "Show everything"
     toggle flipping off must never leave the reader on a page whose nav
     item has vanished), and the "New" tag rides on Insights from the render
     where it is earned until its first visit. */
  if(typeof NAV_EARN_AT!=='undefined'){
    document.querySelectorAll('.nav-item[data-view]').forEach(b=>{
      const v=b.getAttribute('data-view');
      if(!(v in NAV_EARN_AT)) return;
      b.classList.toggle('hidden', !(navEarned(v,total) || state.view===v));
    });
    const nnew=document.getElementById('nav-intel-new');
    if(nnew){
      if(state.view==='intel') navMarkSeen('intel');
      nnew.hidden=!(Number(total||0)>=NAV_EARN_AT.intel && !navSeen('intel'));
    }
  }
  /* ---- SETTINGS & RULES IS ADMIN-ONLY, AND THE DOOR SAYS SO ----
     Hidden rather than greyed, for the reason the earned-nav rule above gives:
     a control that exists but refuses teaches nothing. Everything a non-admin
     used to reach through here now lives in "Your account" under the avatar.
     The gate itself is renderTeam's — this is the door, not the wall, and a
     hidden nav item was never going to be one. Same escape as above: the
     CURRENT view keeps its door, so a restored session cannot leave somebody
     standing on a page whose nav item has vanished. */
  const teamNav=document.querySelector('.nav-item[data-view="team"]');
  if(teamNav) teamNav.classList.toggle('hidden',
    !((typeof isAdmin==='function' && isAdmin()) || state.view==='team'));
}

/* ============================================================ SHELL VIEW SWITCH */
const VIEW_LABEL = { dashboard:'Home', folder:'this value stream', intel:'Insights',
  calendar:'Calendar', reports:'Reports', register:'Contracts', migration:'Import contracts',
  pipeline:'Pipeline', advice:'Advice desk', templates:'Templates', playbook:'Our standards',
  team:'Team & settings', directory:'People', workspace:'the contract workspace',
  redline:'Negotiations' };

/* WHAT THE SCREEN SAYS WHEN A RENDER THROWS.

   A view is built from the whole portfolio, so one malformed record inside one
   contract can take the screen down for every other contract on it. That is not
   hypothetical — an expiry typed as "30 September 2026" made `toISOString()`
   throw out of renewalDecisionDate, out of renderDashboard, and Home and
   Calendar both went dead. And "dead" meant SILENT: the throw escaped before
   setActiveNav ran, so the nav button never highlighted and pressing it looked
   like a button that did nothing at all. Nothing on the screen, nothing in the
   toast, nothing to report.

   Two things follow, and the second matters more than the first. The render is
   caught, so the rest of setView runs and the shell arrives in a coherent state
   — the nav highlights, the sidebar counts update, the view is switched. And
   the failure is SAID: named view, the error, and the record if the error
   carries one. A screen that cannot draw itself must not pretend it was never
   asked to. */
function renderFailedHtml(view, e, cid){
  const esc=s=>String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  return `<div style="max-width:640px;margin:40px auto;border:1px solid var(--st-ruby-line);border-left:4px solid var(--st-ruby-dot);
      background:var(--st-ruby-bg);border-radius:8px;padding:16px 20px">
    <div style="font-size:14px;font-weight:600;color:var(--st-ruby-fg);margin-bottom:6px">${esc(VIEW_LABEL[view]||view)} could not be drawn</div>
    <div style="font-size:12.5px;line-height:1.6;color:var(--color-neutral-800)">
      Something in the portfolio stopped this screen from rendering${cid?` — the record involved is <b>${esc(cid)}</b>`:''}.
      Every other screen still works, and nothing has been changed or lost.
    </div>
    <div style="margin-top:10px;font-family:var(--font-mono);font-size:11px;color:var(--st-ruby-fg);word-break:break-word">${esc((e&&e.message)||String(e))}</div>
  </div>`;
}
/* THE INTRO IS FOR ARRIVING, NOT FOR EVERY REPAINT.

   Views are rebuilt wholesale (innerHTML), so the browser sees every render as
   a first appearance and replays the .view-enter fade-and-slide — including
   when nothing was navigated at all: the theme flip, the jurisdiction switch,
   a background response landing, the dashboard's minute refresh. The screen
   blinked under a reader who hadn't touched it, and every navigation read as
   a page reload.

   So the last rendered view is remembered here, and a repaint of the SAME view
   suppresses the entry animations (via .no-view-anim on #content). A genuine
   change of page still animates once — and after its intro has had time to
   finish, the suppression is re-applied so partial repaints that bypass
   setView (search keystrokes, live refreshes) never replay it either. */
let _lastRenderedView=null, _viewAnimTimer=null;
function markViewTransition(view){
  const host=document.getElementById('content');
  const fresh=_lastRenderedView!==view;
  _lastRenderedView=view;
  /* Guarded: the node tests evaluate this module on a cut-down document. */
  if(!host||!host.classList) return;
  if(_viewAnimTimer&&typeof clearTimeout==='function') clearTimeout(_viewAnimTimer);
  host.classList.toggle('no-view-anim',!fresh);
  if(fresh&&typeof setTimeout==='function')
    _viewAnimTimer=setTimeout(()=>host.classList.add('no-view-anim'),450);
}
function setView(view){
  /* Focus mode belongs to the negotiation bench. Leaving it must give the
     navigation back — a reader who exits in focus mode and lands on the
     register would otherwise find the sidebar and the top strip missing. */
  if(view!=='redline'&&typeof document!=='undefined'&&document.body&&document.body.classList)
    document.body.classList.remove('rl-focused');
  /* ---- A REPAINT IS NOT A NAVIGATION ----
     Arriving on a DIFFERENT view starts the reader at the top; re-entering
     the SAME view (a delete, a background response landing, a save that
     re-renders) must leave them exactly where they were. The scroll is
     captured before the rebuild — a shorter intermediate paint clamps
     scrollTop to 0 — and put back after it. */
  const _sameView = state.view === view;
  const _sc = document.getElementById('content-scroll');
  const _keepTop = _sameView && _sc ? _sc.scrollTop : 0;
  // remember where the workspace was opened from, so its Back button returns
  // there (register, a folder, the queue, …) instead of always the folder view
  if(view==='workspace' && state.view && state.view!=='workspace') state.wsReturn={view:state.view, folderId:state.folderId};
  // focus mode is a posture, not a setting: arriving at the Redline tab from
  // any other view always lands on the full screen with its exits visible
  if(view==='redline' && state.view!=='redline' && window.rlResetFocus) rlResetFocus();
  state.view=view;
  markViewTransition(view);
  try{
    if(view==='dashboard') renderDashboard();
    else if(view==='folder') renderFolder();
    else if(view==='intel') renderIntel();
    else if(view==='calendar') renderCalendar();
    else if(view==='reports') renderReports();
    else if(view==='register') renderRegister();
    else if(view==='migration') renderMigration();
    else if(view==='pipeline') renderPipeline();
    else if(view==='advice') renderAdviceDesk();
    else if(view==='templates') renderTemplatesPage();
    else if(view==='playbook') renderPlaybookPage();
    else if(view==='team') renderTeam();
    else if(view==='directory') renderDirectory();
    else if(view==='redline') renderRedline();
    else renderWorkspace();
  }catch(e){
    /* The id, when the record can be named. An error raised deep in a helper
       does not know which contract it was reading, so nothing is invented: the
       id travels only when the thrower attached one, or when the view is about
       a single contract and there is therefore no doubt which. */
    const cid=(e&&e.contractId)||((view==='workspace'||view==='doc')?state.activeId:null);
    try{ console.error('[hati] '+view+' failed to render', e); }catch(_){}
    try{
      const host=document.getElementById('content');
      if(host) host.innerHTML=renderFailedHtml(view, e, cid);
    }catch(_){}
    if(window.toast) toast(`${VIEW_LABEL[view]||view} could not be drawn${cid?` — check ${cid}`:''}: ${(e&&e.message)||e}`,'err');
  }
  setActiveNav(view);
  updateCommandBar(view);
  updateSidebarCounts();
  applyPanelLayout();
  placeLanguageSwitch();
  renderContextPanel();
  if(getOrg()&&!API_MODE()) persist();
  else if(getOrg()) lsSet(LS.ui,{ view:state.view, activeId:state.activeId, folderId:state.folderId });
  /* Opening a contract that is out with the other side is the moment to start
     watching closely, and leaving it is the moment to stop. */
  if(window.schedulePolling) schedulePolling();
  if(view==='workspace' && window.pollNow) pollNow('opened a contract');
  const sc=document.getElementById('content-scroll');
  if(sc){
    if(_sameView){ sc.scrollTop=_keepTop;
      // guarded: the cut-down node stage has no requestAnimationFrame
      if(typeof requestAnimationFrame==='function') requestAnimationFrame(()=>{ sc.scrollTop=_keepTop; }); }
    else sc.scrollTo({top:0});
  }
}
/* Repaint a same-view surface without losing the reader's place. For callers
   that repaint DIRECTLY (renderRegister after a delete) rather than through
   setView — the rebuild's shorter intermediate paint clamps scrollTop to 0,
   and this puts it back once the new frame has its height. */
function keepScroll(fn){
  const sc=document.getElementById('content-scroll');
  const top=sc?sc.scrollTop:0;
  fn();
  if(sc){ sc.scrollTop=top;
    if(typeof requestAnimationFrame==='function') requestAnimationFrame(()=>{ sc.scrollTop=top; }); }
}
function openFolder(fid){
  if(typeof canAccessFolder==='function' && !canAccessFolder(fid)){ toast(i18t('ap_no_stream_access'),'err'); setView('register'); return; }
  state.folderId=fid; state.folderQuery=''; state.folderShown=50; setView('folder');
}
function openWorkspace(id){ state.activeId=id; state.selId=id; setView('workspace'); }
/* Create a draft from a built-in template WITHOUT the guided fill — every field
   left blank for the user to complete in the document. No interface path calls
   this any more: both routes into a built-in template (the Templates page and
   the + New contract menu) go through openWizard(), so the questions whose
   answers become the contract's data get asked exactly once, the same way, in
   both places. Kept because it is window-exported and produces a valid draft. */
function createFromTemplate(tid){
  if(!canEdit()){ toast(i18t('ap_viewers_no_create'),'err'); return; }
  const t=TEMPLATES[tid], u=currentUser();
  const c={ id:nextId(), name:t.name+' (Draft)', counterparty:'', value:0, status:'Draft',
    template:tid, folder:t.folder,
    lastAction:todayStr(),
    hash:null, signedAt:null, signatory:u?.name||'Authorized signatory',
    compliance:{iprs:false,pki:false},
    comments:[{author:'System',role:'Automation',side:'internal',text:`New ${t.kind} generated from Template ${tid} and filed under ${FOLDERS[t.folder].name}. Fill the highlighted fields to begin.`,ts:fmtDT(nowISO())}],
    fields:{}, scan:null, expiry:null, valueType:t.valueType,
    audit:[{at:nowISO(),user:u?.name||'System',action:'Created',detail:`Generated from Template ${tid} (${t.kind})`}],
    signatures:[] };
  c._loaded=true; c._light=false; c._v=0;
  if(window.contractOwnerStamp) contractOwnerStamp(c);
  state.contracts.unshift(c);
  /* A NEW DRAFT OPENS ON KEY TERMS, not on its document — see
     wsTabDefaults. Registered at every creation site because there is no
     single funnel for creating a contract. */
  if(window.roomOpenOnTerms) roomOpenOnTerms(c.id);
  state.activeId=c.id; state.selId=c.id;
  persist(c);
  toast(`New ${t.kind} created and filed in ${FOLDERS[t.folder].name}`);
  setView('workspace');
}

/* ============================================================ NEW-CONTRACT MENU (command bar) */
function renderNewMenu(){
  const menu=document.getElementById('new-menu'); if(!menu) return;
  const item=(ic,bg,fg,title,sub,attrs='')=>`
    <button ${attrs} class="new-menu-item" style="width:100%;display:flex;align-items:center;gap:10px;border:0;background:none;cursor:pointer;padding:8px;border-radius:8px;text-align:left;color:inherit;" onmouseover="this.style.background='rgb(var(--color-accent-600-rgb)/.09)'" onmouseout="this.style.background='none'">
      <span style="width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:4px;background:${bg};color:${fg};">${icon(ic,'w-[15px] h-[15px]')}</span>
      <span style="min-width:0;"><span style="display:block;font-size:12px;font-weight:600;">${title}</span><span style="display:block;font-size:10px;color:var(--color-neutral-600);">${sub}</span></span>
    </button>`;
  /* WO N1: the three ways a contract gets INTO HaTi, in one menu, named for
     what they do. "Import many at once" reaches the same bulk-import page the
     sidebar's own "Import contracts" door does — deliberately two doors, since
     this menu is where you go to START one and the sidebar is where you go to
     RESUME one.

     ---- AND THE TEMPLATE LIST UNDER THEM IS GONE (Young, 09 Aug 2026) ----
     This menu used to print every company standard, every saved template and
     every built-in paper underneath those three, one row each. On a workspace
     with a real library that is a long scrolling column of contract names
     sitting under a heading that asks how a contract gets in here — and every
     one of those rows is the FIRST door, "Draft from a template", opened one
     level down. The owner's words: they already sit under the draft-from-
     template option.

     So the menu answers its own question and stops: three ways in. The picker
     behind the first one is where you choose which paper, and it carries all
     three groups (see openWizard, which gained the saved-templates group in the
     same change) so nothing lost its route.

     THE HANDLERS BELOW STAY. data-new / data-newlib / data-newtpl cost nothing
     when no row carries them, and they are what a future menu row would need. */
  menu.innerHTML=`
    ${item('sparkle','var(--tile-steel-bg)','var(--tile-steel-fg)','Draft from a template','Pick a template &amp; answer a few questions','id="menu-wizard"')}
    ${item('upload','var(--tile-amber-bg)','var(--tile-amber-fg)','Upload a received contract','Their paper — review, scan &amp; sign','id="menu-upload"')}
    ${item('box','var(--tile-steel-bg)','var(--tile-steel-fg)','Import many at once','Bring a whole back-catalogue in one go','id="menu-migrate"')}`;
  // A built-in template opens the SAME guided fill the Templates page opens.
  // It used to create an empty draft on the spot from here, so the identical
  // action produced two different experiences depending on where you started —
  // and the menu route silently skipped the questions whose answers become the
  // contract's data (counterparty, value, dates, payment terms).
  menu.querySelectorAll('[data-new]').forEach(el=>el.addEventListener('click',()=>{ menu.classList.add('hidden'); openWizard(el.getAttribute('data-new')); }));
  menu.querySelectorAll('[data-newtpl]').forEach(el=>el.addEventListener('click',()=>{ menu.classList.add('hidden'); createFromCustomTemplate(el.getAttribute('data-newtpl')); }));
  menu.querySelectorAll('[data-newlib]').forEach(el=>el.addEventListener('click',()=>{ menu.classList.add('hidden'); tplLibNewContract(el.getAttribute('data-newlib')); }));
  /* Still warmed here even though no row reads it any more: the wizard's picker
     draws the published library from this same cache, synchronously, and this
     menu is the commonest way anybody reaches that picker. Dropping the refresh
     with the rows would leave the picker showing yesterday's standards. */
  if(API_MODE()&&window.tplLibRefresh) tplLibRefresh();
  menu.querySelector('#menu-upload')?.addEventListener('click',()=>{ menu.classList.add('hidden'); openUploadModal(); });
  menu.querySelector('#menu-migrate')?.addEventListener('click',()=>{ menu.classList.add('hidden'); setView('migration'); });
  menu.querySelector('#menu-wizard')?.addEventListener('click',()=>{ menu.classList.add('hidden'); openWizard(); });
}
/* The menu is position:fixed, so every opener must anchor it to its own
   trigger — a caller that only unhides it inherits wherever the previous
   opener left it (which for a first open is the viewport's far left). */
function openNewMenu(anchor){
  const nm=document.getElementById('new-menu'); if(!nm) return;
  renderNewMenu();
  const el=(anchor&&anchor.getBoundingClientRect)?anchor:document.querySelector('[data-page-new]');
  if(el){
    const r=el.getBoundingClientRect();
    nm.style.top=Math.round(r.bottom+6)+'px';
    nm.style.left=Math.round(Math.min(Math.max(8,r.right-300),window.innerWidth-308))+'px';
  }
  nm.classList.remove('hidden');
}
window.openNewMenu=openNewMenu;

/* ============================================================ EXPORT (command bar) */
function exportWorkingSetCsv(){
  const R=(window.regState?regState():null);
  const rows=(window.regFiltered?regFiltered():state.contracts.slice());
  if(!rows.length){ toast(i18t('ap_nothing_to_export'),'err'); return; }
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const head=['ID','Name','Counterparty','Stream',`Value (${jxCurrency()})`,'Status','Last action','Expiry'];
  const body=rows.map(c=>[c.id,c.name,c.counterparty||'',FOLDERS[c.folder]?.name||'',csvValueCell(c),statusLabel(c.status),c.lastAction||'',c.expiry||''].map(esc).join(','));
  const csv=[head.map(esc).join(','),...body].join('\n');
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='hati-register.csv'; a.click(); URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} contract${rows.length===1?'':'s'} to CSV`);
}

/* ============================================================ GLOBAL SEARCH PALETTE (Cmd/Ctrl+K)
   A jump-anywhere search over the loaded working set — matches contract names,
   counterparties and IDs, plus value-stream folders — and opens the match
   directly. Keyboard-first: ↑/↓ to move, Enter to open, Esc to close. */
function commandPaletteResults(q){
  q=(q||'').trim().toLowerCase();
  const out=[];
  /* The reader's own streams. openFolder() below refuses one they are not
     granted, so listing it here offers a door that answers "no access" — and
     names a stream they were not meant to know about. */
  const folders=(typeof visibleFolders==='function')?visibleFolders():Object.values(FOLDERS||{});
  if(q){
    folders.filter(f=>f.name.toLowerCase().includes(q)).slice(0,4)
      .forEach(f=>out.push({kind:'folder',id:f.id,title:f.name,get sub(){ return i18t('ap_value_stream'); },ic:f.ic||'folder'}));
  }
  let cs=state.contracts.slice();
  if(q) cs=cs.filter(c=>(c.name+' '+(c.counterparty||'')+' '+c.id).toLowerCase().includes(q));
  else cs=cs.slice().sort((a,b)=>Date.parse(b.lastAction||0)-Date.parse(a.lastAction||0));
  cs.slice(0,q?12:6).forEach(c=>out.push({kind:'contract',id:c.id,
    title:c.name, sub:`${c.id}${c.counterparty?' · '+c.counterparty:''}`, ic:(window.cIcon?cIcon(c):'file'), status:c.status}));
  return out.slice(0,14);
}
function openCommandPalette(){
  const prev=document.getElementById('cmd-palette'); if(prev){ prev.querySelector('#cp-input')?.focus(); return; }
  const ov=document.createElement('div');
  ov.id='cmd-palette';
  ov.style.cssText='position:fixed;inset:0;z-index:85;display:flex;align-items:flex-start;justify-content:center;padding:12vh 16px 16px';
  ov.innerHTML=`
    <div style="position:absolute;inset:0;background:color-mix(in srgb,#2b2b2d 42%,transparent)"></div>
    <div class="modal-in" style="position:relative;width:100%;max-width:560px;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:8px;overflow:hidden">
      <div style="display:flex;align-items:center;gap:9px;padding:12px 14px;border-bottom:1px solid var(--color-divider)">
        <span style="color:var(--color-neutral-500);display:inline-flex">${icon('search','w-4 h-4')}</span>
        <input id="cp-input" placeholder="${i18t('ap_search_placeholder')}" autocomplete="off" style="flex:1;border:0;outline:0;background:transparent;font:inherit;font-size:14px;color:inherit"/>
        <span style="font-size:9.5px;border:1px solid var(--color-divider);padding:2px 6px;border-radius:3px;color:var(--color-neutral-600);font-family:var(--font-mono)">ESC</span>
      </div>
      <div id="cp-list" class="scroll-thin" style="max-height:52vh;overflow-y:auto;padding:6px"></div>
    </div>`;
  document.body.appendChild(ov);
  const input=ov.querySelector('#cp-input'), list=ov.querySelector('#cp-list');
  let results=[], active=0;
  /* ---- ASK-YOUR-BOOK (WO-4). Two additions ride the sync results: ----
     "In the wording" rows off the server's own full-text index (GET
     /api/search — the Register box's route, value-masking and all), fetched
     on a debounce and merged only while the typed query still matches; and
     an always-last "Ask Copilot" row that HANDS the question to the existing
     Copilot door with it prefilled — never a second AI path from here. */
  let ftsRows=[], ftsFor='', ftsT=null;
  const close=()=>{ clearTimeout(ftsT); ov.remove(); document.removeEventListener('keydown',onKey,true); };
  const openItem=it=>{
    if(it.kind==='ask'){
      close();
      if(window.openAI) openAI();
      const ai=document.getElementById('ai-input');
      if(ai){ ai.value=it.q; ai.focus(); }
      return;
    }
    close(); if(it.kind==='folder') openFolder(it.id); else openWorkspace(it.id);
  };
  const ftsPlan=()=>{
    const q=input.value.trim();
    clearTimeout(ftsT);
    if(!(typeof API_MODE==='function'&&API_MODE())||q.length<2){ ftsRows=[]; ftsFor=''; return; }
    ftsT=setTimeout(async()=>{
      try{
        const r=await api('search?q='+encodeURIComponent(q)+'&limit=8');
        // only merge while the box still says what was asked
        if(input.value.trim()===q){ ftsRows=(r&&r.hits)||[]; ftsFor=q.toLowerCase(); paint(); }
      }catch(_){ /* the sync rows stand alone — search down is not palette down */ }
    },250);
  };
  const paint=()=>{
    results=commandPaletteResults(input.value);
    const q=input.value.trim();
    if(q){
      const seen=new Set(results.filter(r=>r.kind==='contract').map(r=>r.id));
      if(ftsFor===q.toLowerCase())
        ftsRows.filter(h=>h&&!seen.has(h.id)).slice(0,5).forEach(h=>results.push({
          kind:'wording',id:h.id,title:h.name||h.id,
          // the server already masked snippets for readers without canViewValues
          sub:(h.snippet?String(h.snippet).replace(/[\[\]]/g,''):(h.counterparty||h.id)),
          ic:'search',get tag(){ return i18t('ap_tag_wording'); }}));
      results.push({kind:'ask',q,title:i18t('ap_ask_copilot',{q}),
        get sub(){ return i18t('ap_ask_copilot_sub'); },ic:'sparkle'});
    }
    if(active>=results.length) active=Math.max(0,results.length-1);
    if(!results.length){ list.innerHTML=`<div style="padding:22px 12px;text-align:center;font-size:12.5px;color:var(--color-neutral-600)">No matches${input.value.trim()?` for “${input.value.replace(/</g,'&lt;')}”`:''}.</div>`; return; }
    list.innerHTML=results.map((r,i)=>`
      <button data-cp-i="${i}" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:0;border-radius:5px;cursor:pointer;padding:8px 10px;font:inherit;color:inherit;background:${i===active?'color-mix(in srgb,var(--color-accent) 13%,transparent)':'none'}">
        <span style="width:28px;height:28px;flex:none;display:grid;place-items:center;border-radius:5px;border:1px solid var(--color-divider);background:var(--color-bg);color:var(--color-neutral-600)">${icon(r.ic,'w-3.5 h-3.5')}</span>
        <span style="min-width:0;flex:1">
          <span style="display:block;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${(r.title||'').replace(/</g,'&lt;')}</span>
          <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${(r.sub||'').replace(/</g,'&lt;')}</span>
        </span>
        ${r.kind==='contract'&&window.statusChip?`<span style="flex:none">${statusChip(r.status)}</span>`:`<span style="flex:none;font-size:9.5px;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.08em;color:var(--color-neutral-500)">${r.tag||r.kind}</span>`}
      </button>`).join('');
    list.querySelectorAll('[data-cp-i]').forEach(b=>{
      const i=+b.getAttribute('data-cp-i');
      b.addEventListener('click',()=>openItem(results[i]));
      b.addEventListener('mousemove',()=>{ if(active!==i){ active=i; paint(); } });
    });
    const act=list.querySelector(`[data-cp-i="${active}"]`); if(act) act.scrollIntoView({block:'nearest'});
  };
  function onKey(e){
    if(e.key==='Escape'){ e.preventDefault(); close(); }
    else if(e.key==='ArrowDown'){ e.preventDefault(); if(results.length){ active=(active+1)%results.length; paint(); } }
    else if(e.key==='ArrowUp'){ e.preventDefault(); if(results.length){ active=(active-1+results.length)%results.length; paint(); } }
    else if(e.key==='Enter'){ e.preventDefault(); if(results[active]) openItem(results[active]); }
  }
  document.addEventListener('keydown',onKey,true);
  input.addEventListener('input',()=>{ active=0; paint(); ftsPlan(); });
  ov.addEventListener('click',e=>{ if(e.target===ov||e.target===ov.firstElementChild) close(); });
  paint(); input.focus();
}

/* ============================================================ CONTEXT PANEL */
const relTime = iso => {
  const t=Date.parse(iso); if(isNaN(t)) return '';
  const s=Math.max(0,(Date.now()-t)/1000);
  if(s<60) return 'just now';
  if(s<3600) return Math.floor(s/60)+'m ago';
  if(s<86400) return Math.floor(s/3600)+'h ago';
  const d=Math.floor(s/86400); return d<30?d+'d ago':Math.floor(d/30)+'mo ago';
};
function activityCategory(txt){
  const t=(txt||'').toLowerCase();
  if(/sign|seal|execut|complet|clear|approved/.test(t)) return 'green';
  if(/declin|reject|risk|flag|high|breach|overdue/.test(t)) return 'ruby';
  if(/approv|pending|sent|review|wait|request|reminder/.test(t)) return 'amber';
  if(/creat|draft|generat/.test(t)) return 'gray';
  return 'steel';
}
const CAT_DOT={gray:'var(--st-gray-dot)',amber:'var(--st-amber-dot)',green:'var(--st-green-dot)',ruby:'var(--st-ruby-dot)',steel:'var(--color-accent)'};
function activityRow(id,action,detail,at){
  const txt=detail||action||'';
  return {id, txt:`${action?action+' — ':''}${txt}`.replace(/^ — /,''), at, when:relTime(at), cat:activityCategory((action||'')+' '+txt)};
}
function buildActivityFeed(limit=40){
  // Server mode: the light contract list carries no audit trail, so the
  // whole-workspace feed is served by /api/activity and cached here. The
  // client-side scan below is the fallback for local (single-device) mode.
  if(API_MODE()&&state.activityFeed) return state.activityFeed.slice(0,limit);
  const feed=[];
  state.contracts.forEach(c=>{
    (c.audit||[]).forEach(a=>feed.push(activityRow(c.id,a.action,a.detail,a.at)));
  });
  feed.sort((a,b)=>Date.parse(b.at||0)-Date.parse(a.at||0));
  return feed.slice(0,limit);
}
// Pull the workspace-wide activity feed from the server (server mode only) and
// re-render the panel when it lands. Throttled so panel re-renders don't hammer
// the endpoint; a fresh cache within the window is reused as-is.
let _activityAt=0, _activityBusy=false;
function refreshActivityFeed(force){
  if(!API_MODE()||_activityBusy) return;
  if(!force&&state.activityFeed&&(Date.now()-_activityAt)<15000) return;
  _activityBusy=true;
  api('activity?limit=40')
    .then(r=>{ state.activityFeed=(r.events||[]).map(e=>activityRow(e.id,e.action,e.detail,e.at)); })
    .catch(()=>{})
    .finally(()=>{ _activityAt=Date.now(); _activityBusy=false; if(state.panelOpen&&state.view!=='intel') renderContextPanel(); });
}
// Selecting a contract (register row, home list, or an activity entry) now opens
// its workspace.
function selectContract(id){ openWorkspace(id); }

/* ============================================================
   ALERTS — WHAT NEEDS THIS PERSON
   ============================================================
   THE BELL AND THE PANEL ICON USED TO DO THE SAME THING. The bell's own click
   handler pressed the panel button, and its tooltip admitted as much
   ("Notifications — the Activity panel carries the live feed"). Beside it sat a
   blue dot written straight into index.html: always on, counting nothing, and
   therefore trained out of every reader who has used this product for a week.
   An always-on badge is worse than no badge.

   So the two icons keep ONE panel and answer two different questions:
     · the panel icon → ACTIVITY: everything happening across the whole
       workspace, newest first. The scope is the company.
     · the bell → ALERTS: what is waiting on THIS person. The scope is you.

   ONE PANEL, TWO CONTENTS, NOT TWO PANELS. Same shell, same width, same
   slide-in, same scrim, same close — pressing one while the other is showing
   swaps the content, and the panel's own heading says which it is showing.

   AND EVERY NUMBER IS BORROWED, NEVER RE-DERIVED. This is the standing rule
   that "a door reading 3 cannot sit over a column showing 2" — a bell saying 4
   over a dashboard saying 3 is the same fault wearing a different hat. So each
   kind below calls the function that already answers it:
     negotiations   negoNeedsYouIds       (the Negotiations door's own count)
     reviews        reviewState           (mine to rule on / mine to wait for)
     approvals      hmDashSlices().myApprovals — the dashboard's own queue
     signature      nextSigner            (whose turn the route says it is)
     renewals       hmDashSlices().decisions / .expiring
   Nothing here invents a population.

   SCOPE. state.contracts is the caller's already-scoped bootstrap — the server
   filtered it on the way out (folderScopeFor) — so an alert can never name a
   contract this reader is not allowed to open. That is by construction, and it
   is why this reads state.contracts rather than assembling its own list. */
const ALERT_KINDS = [
  { k:'negotiation', tone:'amber', ic:'&#9998;' },
  { k:'review-mine', tone:'amber', ic:'&#128100;' },
  { k:'review-out',  tone:'gray',  ic:'&#8987;'  },
  { k:'approval',    tone:'amber', ic:'&#9989;'  },
  { k:'signature',   tone:'green', ic:'&#9997;'  },
  { k:'renewal',     tone:'gray',  ic:'&#128197;'},
];
const ALERT_TONE = { amber:'var(--st-amber-dot)', green:'var(--st-green-dot)',
  ruby:'var(--st-ruby-dot)', gray:'var(--st-gray-dot)' };
/* Every alert is a DOOR — it goes to the thing that needs doing, not to a list.
   `go` is what the row's press runs. */
function buildAlerts(){
  const out=[];
  const cs=(state.contracts||[]);
  const me=(typeof currentUser==='function')?currentUser():null;
  const push=(kind,c,text,go)=>{ const d=ALERT_KINDS.find(x=>x.k===kind)||ALERT_KINDS[0];
    out.push({ kind, id:c?c.id:'', name:c?(c.name||c.id):'', text, tone:d.tone, ic:d.ic, go }); };

  /* 1. Changes waiting on this reader in a negotiation. THE SAME number the
        Negotiations door and the round line print — negoNeedsYouIds — read off
        c.changes raw, because negoChanges() would START a negotiation on every
        contract it was asked about. */
  if(window.negoNeedsYouIds && window.negoIsLive){
    cs.filter(c=>{ try{ return negoIsLive(c); }catch(_){ return false; } }).forEach(c=>{
      let n=0; try{ n=negoNeedsYouIds(c).length; }catch(_){ n=0; }
      if(n) push('negotiation',c,i18tn('al_nego',n,{n}),()=>{ if(window.openRedlineWorkbench) openRedlineWorkbench(c.id); });
    });
  }
  /* 2. Reviews: what I owe a verdict on, and what I am waiting on. Both from
        reviewState, which answers from the READER's chair. */
  if(window.reviewState && window.reviewSeatShowsReview){
    cs.forEach(c=>{
      /* ---- ASKED ONLY OF A CONTRACT THAT HAS A REVIEW ON IT ----
         reviewState reaches reviewScope, which asks negoUnsentAsks/negoPending
         — and those go through negoChanges(), which runs negoInit() and CREATES
         a negotiation on any contract that has none. This loop runs over the
         whole workspace on every view change, so asking it blind started a
         negotiation on every agreement in the book. Caught in the browser, by
         the door test's own "counting must not start a negotiation" check.

         c.review.requests is read RAW, the way negoNeedsYouIds reads c.changes:
         a contract nobody has ever asked a review on can have no review row, so
         there is nothing to learn by asking. */
      const reqs = (c && c.review && Array.isArray(c.review.requests)) ? c.review.requests : [];
      if(!reqs.length) return;
      let st=null; try{ st=reviewState(c); }catch(_){ return; }
      if(!st) return;
      (st.mine||[]).forEach(rv=>push('review-mine',c,
        i18t('al_review_mine',{who:rv.by}),
        ()=>{ if(window.openRedlineWorkbench) openRedlineWorkbench(c.id); }));
      (st.waiting||[]).filter(rv=>!window.reviewMaySee||reviewMaySee(rv)).forEach(rv=>push('review-out',c,
        i18t('al_review_out',{who:rv.reviewer&&rv.reviewer.name}),
        ()=>{ if(window.openRedlineWorkbench) openRedlineWorkbench(c.id); }));
    });
  }
  /* 3. Approvals sitting with this person — the dashboard's own queue, so the
        bell and the Home card cannot disagree. And 4/5 ride on the same read. */
  let D=null; try{ D=(window.hmDashSlices?hmDashSlices():null); }catch(_){ D=null; }
  if(D){
    (D.myApprovals||[]).filter(x=>x.mine).forEach(x=>push('approval',x.c,
      i18t('al_approval'),()=>{ openWorkspace(x.c.id); if(window.roomGoTab) try{ roomGoTab(x.c,'sign'); }catch(_){} }));
    /* 5. A renewal decision coming due. */
    (D.decisions||[]).filter(x=>x.d<=30).forEach(x=>push('renewal',x.c,
      x.d===0?i18t('al_renewal_today'):i18tn('al_renewal_in',x.d,{n:x.d}),
      ()=>openWorkspace(x.c.id)));
    (D.expiring||[]).filter(x=>x.d<=30).forEach(x=>push('renewal',x.c,
      i18tn('al_expiring_in',x.d,{n:x.d}),()=>openWorkspace(x.c.id)));
  }
  /* 4. A signature where it is actually THEIR turn. nextSigner is the route's
        own answer about whose turn it is; matching by member record first and
        address second is the same order internalSignerRecipient uses. */
  if(me && window.nextSigner){
    cs.filter(c=>c.status!=='Declined').forEach(c=>{
      let ns=null; try{ ns=nextSigner(c); }catch(_){ ns=null; }
      if(!ns||ns.party==='counterparty'||ns.signed) return;
      const mine=(ns.memberId&&String(ns.memberId)===String(me.id))
        || (!!ns.email&&!!me.email&&String(ns.email).toLowerCase()===String(me.email).toLowerCase());
      if(!mine) return;
      push('signature',c,i18t('al_signature'),
        ()=>{ openWorkspace(c.id); if(window.roomGoTab) try{ roomGoTab(c,'sign'); }catch(_){} });
    });
  }
  return out;
}
/* THE DOT COUNTS WHAT THE PANEL WOULD SHOW, and it is not cleared by looking.
   Clearing on "you opened the panel" trains people to glance and dismiss, which
   is exactly how the hard-coded dot below it became invisible. It clears when
   the underlying thing is actually dealt with — an answer given, an approval
   made, a signature taken — because that is what keeps the number worth
   reading. Nothing anywhere marks an alert as seen. */
function alertCount(){ try{ return buildAlerts().length; }catch(e){ return 0; } }
/* ---- INSIGHTS NO LONGER SUPPRESSES THIS PANEL (owner-reported, 13 Aug 2026)
   It used to answer true on 'intel', which DISABLED both header buttons there.
   The reason was real when it was written and is not any more: the panel was a
   COLUMN then, and two right-hand columns — this one and the Intelligence
   dock — would have fought for the same width. It is a slide-over now. It
   takes no width from anything; it lies over the page like every other layer.

   THE PRODUCT ALREADY ACCEPTED THAT ON THIS VERY PAGE: the Copilot panel
   slides over the same space on Insights and was never suppressed. One layer
   allowed and its twin refused was the inconsistency.

   AND THE COST WAS NOT ONLY A DEAD BUTTON. The alert badge is hidden while
   suppressed, so a reader on Insights could not see that nine things were
   waiting on them, with nothing on screen to say why the number had gone.

   Kept as a predicate rather than deleted: it is asked in three places, and a
   page that genuinely cannot host a layer may exist one day. Nothing answers
   true today. */
function panelSuppressed(){ return false; }
function updateAlertBadge(){
  const dot=document.getElementById('hdr-notify-dot');
  const btn=document.getElementById('hdr-notify');
  const pan=document.getElementById('cmd-panel');
  const off=panelSuppressed();
  if(dot){
    const n=alertCount();
    dot.textContent=n>9?'9+':String(n);
    /* NOTHING WAITING, NOTHING DRAWN. The dot it replaces was hard-coded markup
       — always on, counting nothing — and an always-on badge is one people
       learn to ignore, which is exactly what had happened to it. */
    dot.hidden=!n||off;
    if(btn) btn.title=off?i18t('ap_alerts_not_here')
      :(n?i18tn('sh_alerts_n',n,{n}):i18t('sh_alerts_none'));
  }
  /* A DISABLED CONTROL WITH A REASON, not a live one that does nothing. */
  if(btn){ btn.disabled=off; btn.style.opacity=off?'.45':''; }
  if(pan){ pan.disabled=off; pan.style.opacity=off?'.45':'';
    pan.title=off?i18t('ap_activity_not_here'):i18t('sh_toggle_panel'); }
}
/* ---------- THE SIDEBAR, COLLAPSED TO ITS ICONS ----------
   256px of doors down to a 64px rail, giving 192px back to whatever is on the
   page. The words move to each button's `title`; nothing is dropped and
   nothing is reordered, so the rail is the same sidebar read at a glance
   rather than a different one.

   A CHOICE, REMEMBERED — NOT A BREAKPOINT. It is tempting to collapse this
   automatically on a narrow window, and it would be wrong: a sidebar that
   folds itself while you are reading has moved every door you were aiming at,
   for a reason you did not ask for and cannot see. Whoever needs the width
   takes it, and it stays taken until they say otherwise. Per browser, like
   the redline split and the document type size. */
const RAIL_KEY = 'hati.v1.railCollapsed';
/* COLLAPSED IS THE DEFAULT. The rail is what the workspace is meant to look
   like: seven glyphs down the edge and the width given to the contract, which
   is the thing anybody opened this to read. The labels are one press away and
   the press is remembered, so nobody who wants the words has to keep asking.
   A stored value always wins — `null` means "never chosen", not "chose no". */
function railCollapsed(){
  try { const v = localStorage.getItem(RAIL_KEY); return v === null ? true : v === '1'; }
  catch(e){ return true; }
}
function applyRail(){
  const shell=document.getElementById('app-shell'); if(!shell) return;
  /* The rail's LOOK is on below the line whatever the reader chose, because
     down there the sidebar is a 64px strip by construction. The stored choice
     is read, not written — see railCollapsed — so it is waiting unchanged when
     they are back on a wide screen. */
  const on=railCollapsed()||navDrawerActive();
  shell.classList.toggle('rail',on);
  /* The columns are set inline in index.html, so they are answered inline
     here — a stylesheet rule would lose to the attribute it is arguing with.

     BELOW THE LINE THE SIDEBAR IS NOT A COLUMN AT ALL — it is position:fixed
     (index.html, the max-width:1499px block) — but THE TRACK STAYS AT 64px,
     which is the whole design: the strip sits in that track at rest, and when
     it opens it widens OVER the page, so the page's own width never changes.
     The track used to collapse to 0px and the sidebar was reached from a menu
     button in the header. That is right at 390px and wrong at 1280, where
     there is ample room for the icons and hiding every door behind a press is
     a worse trade than the 64px.

     None of this is a second opinion about the rail — the rail is still the
     reader's own remembered choice and comes straight back when the window
     does. */
  if(shell.style) shell.style.gridTemplateColumns=
    (navDrawerActive()?'64px':(on?'64px':'256px'))+' minmax(0,1fr)';
  paintRailToggle();
  /* THE PAGE HAS TO BE TOLD. The negotiation panel writes its own column
     widths from a measurement (rlLayoutResizer) — it solves how much the round's
     queue may take before the contract loses its measure — and 192px arriving
     or leaving changes that answer. Without this the queue stays at whatever
     width the old window justified until something else forces a repaint. */
  if(typeof window!=='undefined' && window.rlLayoutResizer) window.rlLayoutResizer(document);
  syncViewHeight();
}
/* THE TOGGLE DESCRIBES THE WORDS, NOT THE TRACK. It used to be painted from
   the rail's LOOK, which below the line is on whatever happens — so a reader
   who had just floated the labels over the page was shown a chevron and a
   tooltip both offering to show them again. The one question this control
   answers is "are the labels up?": above the line that is the reader's stored
   choice, below it, whether the layer is open. */
function railLabelsShowing(){
  const nav=document.getElementById('side-nav');
  if(navDrawerActive()) return !!(nav&&nav.classList&&nav.classList.contains('open'));
  return !railCollapsed();
}
function paintRailToggle(){
  const btn=document.getElementById('cmd-rail'); if(!btn) return;
  const up=railLabelsShowing();
  btn.setAttribute('aria-pressed',up?'false':'true');
  /* The KEY is written alongside the text, not just the text. This tooltip
     flips with the rail's state, so a language switch that only rewrote
     data-i18n-title would leave the wrong half showing; and one that only
     set .title here would be reverted to English by the next repaint. Both
     are set together so whichever fires second still agrees. */
  const railKey=up?'sh_rail_hide':'sh_rail_show';
  btn.setAttribute('data-i18n-title',railKey);
  btn.title=i18t(railKey);
  /* THE CHEVRON POINTS THE WAY THE PRESS GOES, not the way the sidebar
     currently is. Pointing at the state rather than the act is how a toggle
     comes to describe the wrong half of itself. */
  const chev=btn.querySelector('.rail-chev');
  if(chev) chev.setAttribute('d',up?'M14.5 6 8.5 12l6 6':'M9.5 6 15.5 12l-6 6');
}
function toggleRail(){
  /* ONE BUTTON, TWO JOBS, AND THE PAGE DECIDES WHICH. Below the line the
     sidebar is a floating layer, so this opens and closes it and the reader's
     stored preference is left alone — flipping a preference that the width is
     not honouring would silently change what they get back on a wide screen. */
  if(navDrawerActive()){
    const nav=document.getElementById('side-nav');
    setNavDrawer(!(nav&&nav.classList&&nav.classList.contains('open')));
    return;
  }
  try { localStorage.setItem(RAIL_KEY, railCollapsed()?'0':'1'); } catch(e){}
  applyRail();
}

/* PANEL_MIN_W / shellNarrow are GONE. They existed to fold the activity column
   away below 1200px, where the sidebar and the panel together ate 548px of the
   window and left the middle less room than the register's own table needs.
   The panel takes no width at all now — it is a layer over the page — so there
   is no width at which it has to be taken away, and a breakpoint that answers
   a question nobody asks any more is a breakpoint that will be believed by the
   next person to read it. */
/* ---- WHERE THE NAV STOPS TAKING WIDTH AND STARTS FLOATING ----
   Owner-asked, 13 Aug 2026, from a ThinkPad: expanding the sidebar squeezed
   every page. It cost the page 192px (256 expanded against the 64px rail), and
   nothing adapted — every layout rule in this product measures the WINDOW,
   while the page gets the window minus the sidebar. So opening the nav shrank
   the page by a fifth and the layout carried on as though it had not.

   THE NUMBER IS DERIVED, NOT PICKED. The dashboard's two cards need 1200px of
   page width to stand side by side; 1200 + 256 = 1456, so a window narrower
   than that cannot afford an expanded sidebar. Rounded up to 1500 so a 1440
   laptop — one of the commonest there is — lands on the right side of it.

   Below it the sidebar is the 64px rail, always, and opening it floats the
   labels OVER the page: the page never moves, so it is safe to have it
   collapsed by default. Above it, nothing changed — the rail is the reader's
   own remembered choice and expanding still pushes, which is what somebody
   with the room asked for. Their stored preference is never overwritten by
   the width; it simply is not honoured below the line, and comes straight back
   above it. */
const NAV_DRAWER_W = 1500;
function navDrawerActive(){
  return typeof innerWidth === 'number' ? innerWidth < NAV_DRAWER_W : false;
}
/* TWO QUESTIONS THAT USED TO SHARE ONE ANSWER. "Is the sidebar a floating
   layer?" moved from 900 to 1500; "has the header run out of room for the
   language words?" did not move at all — at 1280 that header is not crowded,
   and the stylesheet's own rule for the toggle-in-the-sidebar is still written
   at 899. Letting placeLanguageSwitch keep asking navDrawerActive would have
   posted the toggle into the sidebar on every laptop, styled by a rule that
   does not apply there. */
const NAV_HEADER_TIGHT_W = 900;
function navHeaderTight(){
  return typeof innerWidth === 'number' ? innerWidth < NAV_HEADER_TIGHT_W : false;
}
/* THE PANEL IS A LAYER, NOT A COLUMN.

   It used to be a grid track, and this function wrote #body-grid's columns to
   open and close it — so opening Activity took 292px off the page, re-wrapped
   every line of the contract underneath it and moved whatever the reader was
   looking at sideways. It is a slide-over now (index.html, beside the Copilot
   it copies), and this function only says open or shut.

   Two things follow from that. The grid is never touched again — it has one
   track written into the markup, so nothing here can reshape the page. And the
   narrow-window suppression is gone: it existed because 292px is a column a
   small window cannot spare, and a layer costs no width at all. The panel
   opens at every size now, capped at 88vw so it can always be closed. */
function applyPanelLayout(){
  const panel=document.getElementById('context-panel');
  const scrim=document.getElementById('panel-scrim');
  if(!panel||!panel.classList) return;
  /* THE SUPPRESSION IS ASKED, NOT REPEATED. This line carried its own copy of
     `state.view!=='intel'` — the same rule panelSuppressed answers — so the
     two could disagree, and did: relaxing the predicate alone would have left
     the buttons live and the panel still refusing to open. One question, one
     place that answers it. */
  const show = !!(state.panelOpen && !panelSuppressed());
  panel.classList.toggle('open',show);
  panel.setAttribute('aria-hidden',show?'false':'true');
  if(scrim&&scrim.classList) scrim.classList.toggle('open',show);
  const btn=document.getElementById('cmd-panel');
  if(btn) btn.setAttribute('aria-expanded',show?'true':'false');
}
function closeContextPanel(){
  if(!state.panelOpen) return;
  state.panelOpen=false; applyPanelLayout();
}
/* The floating nav — everything below NAV_DRAWER_W, which since 13 Aug 2026 is
   every laptop rather than only the phone. Restyling, not rebuilding: the same
   <aside> with the same buttons simply widens over the page instead of taking
   the width from it. Above the line this is never called. */
function setNavDrawer(open){
  const nav=document.getElementById('side-nav');
  const scrim=document.getElementById('nav-scrim');
  const btn=document.getElementById('nav-toggle');
  if(nav&&nav.classList) nav.classList.toggle('open', !!open);
  if(scrim) scrim.hidden = !open;
  if(btn) btn.setAttribute('aria-expanded', open?'true':'false');
  /* The sidebar's own chevron is the door down here, so it has to answer for
     the state it just put the layer in. */
  paintRailToggle();
}
function closeNavDrawer(){ setNavDrawer(false); }
/* ---- THE LANGUAGE TOGGLE HAS TO STAY REACHABLE ----
   This used to relocate the jurisdiction flags. The market moved to Settings
   (it is the company's, and admin-only), and the toggle took its place in the
   header — so the same job now serves the language.

   Hiding a control at a narrow width is not an option: below 900 the header
   has no room at any size, so the toggle MOVES into the nav drawer, above the
   Copilot launcher, where its full words fit again. The node is relocated,
   not rebuilt, so the click listener bound in wireLanguagePicker keeps
   working exactly as it did. */
function placeLanguageSwitch(){
  const sw=document.getElementById('lang-switch');
  const drawerHome=document.querySelector('#side-nav .copilot-wrap');
  const headerHome=document.getElementById('brand-block');
  if(!sw||!drawerHome||!headerHome||!headerHome.parentElement) return;
  const wantDrawer=navHeaderTight();
  const inDrawer=sw.parentElement===drawerHome.parentElement;
  if(wantDrawer&&!inDrawer) drawerHome.parentElement.insertBefore(sw,drawerHome);
  else if(!wantDrawer&&inDrawer) headerHome.parentElement.insertBefore(sw,headerHome.nextSibling);
}
/* WHICH OF THE TWO THE PANEL IS SHOWING — 'activity' or 'alerts'. One panel,
   two contents; the heading says which, and pressing the other icon swaps it
   rather than opening a second layer. */
function panelFace(){ return state.panelFace==='alerts'?'alerts':'activity'; }
function setPanelFace(k){ state.panelFace=(k==='alerts')?'alerts':'activity'; }
function renderContextPanel(){
  const body=document.getElementById('panel-body'); if(!body) return;
  const title=document.getElementById('panel-title');
  const alerts=panelFace()==='alerts';
  /* THE PANEL SAYS WHICH IT IS SHOWING, in the heading and in the scope line
     under it. Activity is the WORKSPACE; alerts are the PERSON, and a reader
     who cannot tell them apart is a reader who will believe the wrong one. */
  if(title) title.textContent=alerts?i18t('sh_alerts'):i18t('sh_activity');
  const close=document.getElementById('panel-close');
  if(close){ const t=alerts?i18t('sh_close_alerts'):i18t('sh_close_activity');
    close.title=t; close.setAttribute('aria-label',t); }
  body.innerHTML=alerts?alertsPanelHtml():activityPanelHtml();
  if(alerts){
    const rows=buildAlerts();
    body.querySelectorAll('[data-alert-i]').forEach(el=>el.addEventListener('click',()=>{
      const a=rows[Number(el.getAttribute('data-alert-i'))];
      closeContextPanel();
      if(a&&typeof a.go==='function') a.go();
    }));
  } else {
    body.querySelectorAll('[data-sel-act]').forEach(el=>el.addEventListener('click',()=>selectContract(el.getAttribute('data-sel-act'))));
  }
}
function activityPanelHtml(){
  refreshActivityFeed();   // server mode: keep the whole-workspace feed current
  const feed=buildActivityFeed();
  return `
      <div style="padding:10px 12px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-600);margin-bottom:8px;">
          <span class="live-ping" style="width:6px;height:6px;border-radius:50%;background:var(--st-green-dot);"></span>${i18t('ap_scope_workspace')}
        </div>
        ${feed.length?feed.map(a=>`
          <button data-sel-act="${a.id}" style="display:flex;gap:9px;width:100%;padding:7px 2px;border:0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 7%,transparent);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit;" onmouseover="this.style.background='color-mix(in srgb,var(--color-text) 5%,transparent)'" onmouseout="this.style.background='none'">
            <span style="width:8px;height:8px;border-radius:50%;background:${CAT_DOT[a.cat]};flex:none;margin-top:4px;"></span>
            <span style="flex:1;min-width:0;">
              <span style="display:block;font-size:11.5px;line-height:1.4;">${a.txt}</span>
              <span style="display:block;font-size:10px;color:var(--color-neutral-500);margin-top:1px;font-family:var(--font-mono);">${a.id} · ${a.when}</span>
            </span>
          </button>`).join(''):`<div style="font-size:11.5px;color:var(--color-neutral-600);padding:12px 2px;">${i18t('ap_no_activity')}</div>`}
      </div>`;
}
/* "NOTHING NEEDS YOU RIGHT NOW" IS A REAL MESSAGE and a good one — an empty
   panel reads as a panel that failed to load. */
function alertsPanelHtml(){
  const rows=buildAlerts();
  return `
      <div style="padding:10px 12px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-600);margin-bottom:8px;">
          <span style="width:6px;height:6px;border-radius:50%;background:${rows.length?'var(--st-amber-dot)':'var(--st-green-dot)'};"></span>${i18t('ap_scope_you')}
        </div>
        ${rows.length?rows.map((a,i)=>`
          <button data-alert-i="${i}" data-alert-kind="${a.kind}" style="display:flex;gap:9px;width:100%;padding:9px 2px;border:0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 7%,transparent);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit;" onmouseover="this.style.background='color-mix(in srgb,var(--color-text) 5%,transparent)'" onmouseout="this.style.background='none'">
            <span style="width:8px;height:8px;border-radius:50%;background:${ALERT_TONE[a.tone]};flex:none;margin-top:5px;"></span>
            <span style="flex:1;min-width:0;">
              <span style="display:block;font-size:11.5px;line-height:1.4;font-weight:600;">${esc(a.text)}</span>
              <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(a.name)}</span>
              <span style="display:block;font-size:10px;color:var(--color-neutral-500);font-family:var(--font-mono);">${esc(a.id)}</span>
            </span>
          </button>`).join(''):`
          <div style="padding:26px 6px;text-align:center;">
            <div style="width:38px;height:38px;margin:0 auto 10px;display:grid;place-items:center;border-radius:50%;background:var(--st-green-bg);color:var(--st-green-fg);">&#10003;</div>
            <div style="font-size:13px;font-weight:600;color:var(--color-text);">${i18t('ap_nothing_needs_you')}</div>
            <div style="font-size:11.5px;color:var(--color-neutral-600);margin-top:4px;line-height:1.5;">${i18t('ap_nothing_needs_you_sub')}</div>
          </div>`}
      </div>`;
}

/* ============================================================ THEME + JURISDICTION (shell header) */
/* Light / dark via the `dark` class on <html> (Tailwind darkMode:'class' and
   the html.dark token block in index.html). A tiny head script applies the
   saved choice before first paint, so this only handles the live toggle. */
/* Guarded rather than assumed: this module is evaluated on a cut-down stage in
   the node tests, where document.documentElement does not exist. */
/* ---------- THREE THEMES, NOT A TWO-POSITION SWITCH ----------
   Green and Navy are the same platform in two colours; Dark is the same
   platform with the lights off. All three are one personal choice.

   THEY ARE NOT THE COMPANY'S BRAND COLOUR. That already exists and is a
   different thing: the design step sets an accent that dresses the DOCUMENT —
   the letterhead, the PDF, what the counterparty receives — and it accepts any
   colour, navy among its presets. This picks the colour of the tool you work
   in. Wiring the two together would mean a company whose brand is claret gets a
   claret platform built from a ramp nobody designed, and a personal preference
   would silently restyle every contract that left the building.

   TWO AXES UNDERNEATH, THREE OPTIONS ON TOP. The brand rides a data attribute
   and the lights ride the `dark` class, which are independent — so navy-at-
   night already works in the stylesheet and is one row away in the menu if
   anybody asks. The menu offers three because three is what was asked for and
   three is what is easy to explain. */
const THEMES = [
  { k:'green', get label(){ return i18t('ap_theme_green'); },      get note(){ return i18t('ap_theme_green_note'); },        brand:null,   dark:false },
  { k:'navy',  get label(){ return i18t('ap_theme_navy'); },       get note(){ return i18t('ap_theme_navy_note'); },   brand:'navy', dark:false },
  { k:'dark',  get label(){ return i18t('ap_theme_dark'); },       get note(){ return i18t('ap_theme_dark_note'); },         brand:null,   dark:true  },
];
const THEME_KEY = 'hati-theme';
/* 'light' and 'dark' are what the old two-position switch wrote, and they are
   still in people's browsers. Read them rather than resetting somebody who has
   been on dark for a month. */
function themeNow(){
  let v=''; try{ v=localStorage.getItem(THEME_KEY)||''; }catch(e){}
  if(v==='light') v='green';
  return THEMES.some(t=>t.k===v) ? v : 'green';
}
function applyTheme(mode){
  const root=document.documentElement;
  if(!root||!root.classList) return;
  const t=THEMES.find(x=>x.k===mode)
    || (mode==='dark' ? THEMES[2] : THEMES[0]);   // back-compat: applyTheme('dark')
  root.classList.toggle('dark', t.dark);
  if(t.brand) root.setAttribute('data-brand', t.brand);
  else root.removeAttribute('data-brand');
}
function setTheme(mode){
  const t=THEMES.find(x=>x.k===mode); if(!t) return;
  applyTheme(t.k);
  try{ localStorage.setItem(THEME_KEY, t.k); }catch(e){}
  /* Everything on screen was rendered against the old theme — inline-styled
     chips and render-time SVG colours don't respond to a class flip, so the
     view is repainted, same as the jurisdiction switch below. */
  if(window.setView && state && state.view) setView(state.view);
  renderThemeMenu();
  /* THE PHONE IS A SECOND SHELL AND setView DOES NOT DRAW IT. Its header
     carries a swatch of the current theme, which is rendered markup — the
     colours cascade to it on their own, the swatch does not. Without this the
     phone goes navy while its own control still shows green, which is the
     control disagreeing with the screen it sits on. Guarded: the phone shell
     is not loaded on every page. */
  if(window.mAppActive && window.mRender && mAppActive()) mRender();
}
/* Kept because the phone shell and older callers press it. It steps through
   the same three rather than flipping a switch that no longer exists. */
function toggleTheme(){
  const i=THEMES.findIndex(t=>t.k===themeNow());
  setTheme(THEMES[(i+1)%THEMES.length].k);
}
/* The swatch on each row is drawn from the theme's OWN values rather than from
   a list of colours kept here — a second list is a second thing to update, and
   the day it disagrees with the stylesheet the menu starts lying. */
const THEME_SWATCH = {
  green:'linear-gradient(135deg,#0d9488,#06b6d4)',
  navy:'linear-gradient(135deg,#24488f,#3f7ac4)',
  dark:'linear-gradient(135deg,#1e293b,#0f172a)',
};
function renderThemeMenu(){
  const menu=document.getElementById('theme-menu');
  const face=document.getElementById('theme-swatch');
  const cur=themeNow();
  if(face) face.style.background=THEME_SWATCH[cur]||'';
  const btn=document.getElementById('theme-btn');
  if(btn) btn.title='Theme — '+((THEMES.find(t=>t.k===cur)||{}).label||'');
  if(!menu) return;
  menu.innerHTML=`<div class="mgroup">${i18t('ap_theme')}</div>`+THEMES.map(t=>`
    <button type="button" data-theme-pick="${t.k}" role="menuitemradio" aria-checked="${t.k===cur}">
      <span class="tsw" style="background:${THEME_SWATCH[t.k]}"></span>
      <span>${t.label}<span class="tnote">${t.note}</span></span>
      ${t.k===cur?'<span class="ttick" aria-hidden="true">&#10003;</span>':''}
    </button>`).join('');
}
function wireThemeMenu(){
  const btn=document.getElementById('theme-btn'), menu=document.getElementById('theme-menu');
  renderThemeMenu();
  if(!btn||!menu) return;
  const shut=()=>{ menu.classList.add('hidden'); btn.setAttribute('aria-expanded','false'); };
  btn.addEventListener('click',e=>{ e.stopPropagation();
    const open=menu.classList.toggle('hidden');
    btn.setAttribute('aria-expanded',open?'false':'true'); });
  /* Delegated, because renderThemeMenu rewrites these rows on every change —
     a listener bound to a row would go with the row it was bound to. */
  menu.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-theme-pick]');
    if(b) setTheme(b.getAttribute('data-theme-pick'));
    shut();
  });
  document.addEventListener('click',ev=>{ if(!menu.contains(ev.target)&&!btn.contains(ev.target)) shut(); });
}
/* ---------- Jurisdiction switcher (top header) ----------
   This control existed and did nothing: it set a data attribute and told the
   reader their jurisdiction had switched, while the app went on formatting
   money as KES, telling the Copilot the contract was under Kenyan law, and
   citing a Kenyan Act on the executed copy. A switch that reports a change it
   did not make is worse than no switch, because the reader believes it.

   It is wired now. The code is the pack id from js/jurisdiction.js, so
   pressing it moves the currency, the governing-law sentences, the scanner's
   statute checks and the playbook's positions together — and the screen is
   repainted, because half the app would otherwise keep showing the old market
   until something else happened to redraw it. */
const REGIONS={ SE:{ id:'sweden', label:'Sweden (EU/GDPR)' }, KE:{ id:'kenya', label:'Kenya (KICA/ODPC)' } };
const regionCodeFor = id => Object.keys(REGIONS).find(k=>REGIONS[k].id===id) || 'KE';
function applyRegion(code){
  state.region=code;
  const root=document.documentElement; if(root&&root.setAttribute) root.setAttribute('data-region',code);
  /* No buttons to paint any more — the market is a select in Settings, which
     renders its own current value. The data-region attribute stays: stylesheets
     and the compliance badge read it. */
}
function setRegion(code,opts){
  if(!REGIONS[code]) return;
  /* The jurisdiction is the record; the code is this control's label for it. */
  if(window.jxSet) jxSet(REGIONS[code].id);
  applyRegion(code);
  try{ localStorage.setItem('hati-region',code); }catch(e){}
  if(opts&&opts.silent) return;
  /* Everything on screen was rendered against the old market. */
  if(window.setView) setView(state.view||'dashboard');
  if(window.toast) toast(`Jurisdiction switched to ${REGIONS[code].label} — money, governing-law checks and Copilot briefings follow it`);
}

/* ============================================================ COMMAND-BAR + PANEL WIRING (once) */
function wireShell(){
  // nav
  const nav=document.getElementById('nav');
  nav&&nav.addEventListener('click',e=>{
    // a section header (+/-) toggles its tabs; a tab navigates
    const head=e.target.closest('[data-section-toggle]');
    if(head){ const sec=head.closest('.nav-section'); openNavSection(sec,!sec.classList.contains('open')); return; }
    const btn=e.target.closest('[data-view]');
    if(btn){
      const v=btn.getAttribute('data-view');
      /* ---- THE NEGOTIATIONS DOOR ASKS A DIFFERENT QUESTION ----
         Every other item in this list names a view and setView draws it. This
         one names a PLACE with no agreement attached, and "which negotiation"
         has an answer state.activeId cannot give: it still holds whatever
         contract the reader last opened anywhere in the app, so a bare
         setView('redline') would have opened a draft nobody has ever redlined.
         openNegotiations reopens the last negotiation, or lands on the list. */
      if(v==='redline'&&window.openNegotiations) openNegotiations();
      else setView(v);
      // On a phone the nav is a drawer over the page: having chosen a
      // destination, get out of the way of it.
      closeNavDrawer();
    }
  });

  /* The header's menu button, drawn at 899 and below, and the two ways out of
     the layer it opens: the scrim and Escape. The button is a SECOND door to
     the same drawer — the sidebar's own chevron is the one that reaches it at
     every width below 1500 — and above that line none of this is reachable,
     because the sidebar is a column again. */
  document.getElementById('nav-toggle')?.addEventListener('click',e=>{
    e.stopPropagation();
    const nav=document.getElementById('side-nav');
    setNavDrawer(!(nav&&nav.classList.contains('open')));
  });
  document.getElementById('nav-scrim')?.addEventListener('click',closeNavDrawer);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeNavDrawer(); });

  // command-bar search → register filter
  const search=document.getElementById('cmd-search');
  if(search){
    search.addEventListener('input',()=>{
      const q=search.value;
      if(window.regState){ regState().query=q; }
      if(state.view!=='register'){ setView('register'); }
      else if(window.renderRegisterBody){ renderRegisterBody(); }
      const rs=document.getElementById('reg-search'); if(rs&&rs!==search) rs.value=q;
    });
    document.addEventListener('keydown',e=>{
      // Cmd/Ctrl+K → global jump palette (works even while typing in a field)
      if((e.metaKey||e.ctrlKey)&&(e.key==='k'||e.key==='K')){ e.preventDefault(); openCommandPalette(); return; }
      if(e.key==='/'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)){ e.preventDefault(); openCommandPalette(); }
    });
  }

  // global jump palette (⌘K hint button in the search box)
  document.getElementById('cmd-k-hint')?.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); openCommandPalette(); });

  // Export and + New contract are drawn into the page header per view, so they
  // are bound by delegation — binding once at startup would hold a reference to
  // a button that the next render replaces.
  renderNewMenu();
  const nm=document.getElementById('new-menu');
  document.addEventListener('click',e=>{
    const exp=e.target.closest?.('[data-page-export]');
    if(exp){ exportWorkingSetCsv(); return; }
    const nb=e.target.closest?.('[data-page-new]');
    if(nb){
      e.stopPropagation();
      if(nm.classList.contains('hidden')){
        renderNewMenu();
        // Anchored under its trigger and clamped to the viewport, because the
        // trigger is no longer in a fixed strip at a known position.
        const r=nb.getBoundingClientRect();
        nm.style.top=Math.round(r.bottom+6)+'px';
        nm.style.left=Math.round(Math.min(Math.max(8,r.right-300),window.innerWidth-308))+'px';
      }
      nm.classList.toggle('hidden');
      return;
    }
    if(nm&&!nm.classList.contains('hidden')&&!nm.contains(e.target)) nm.classList.add('hidden');
  });

  // Copilot
  document.getElementById('cmd-ai')?.addEventListener('click',()=>openAI());
  document.getElementById('side-copilot')?.addEventListener('click',()=>openAI());

  /* ---- TWO ICONS, TWO QUESTIONS, ONE PANEL ----
     The bell used to literally press this button (`document.getElementById
     ('cmd-panel')?.click()`), so the two header icons did the same thing and
     the product had no way at all to say "these four things are waiting on
     you". They share the shell and differ only in content — and pressing one
     while the OTHER is showing swaps the content rather than closing the
     panel, which is what makes them read as two views of one thing. */
  const openPanel=face=>{
    /* A PAGE MAY REFUSE TO HOST THE LAYER, and if one ever does, this is where
       the press stops — with both buttons disabled and a tooltip saying which
       page took the space (see panelSuppressed / updateAlertBadge), never a
       live control that does nothing. Nothing answers true today: Insights used
       to, and no longer does, because the panel stopped being a column. */
    if(panelSuppressed()) return;
    const same=state.panelOpen&&panelFace()===face;
    setPanelFace(face);
    state.panelOpen=!same;
    applyPanelLayout();
    if(state.panelOpen){ if(face==='activity') refreshActivityFeed(true); renderContextPanel(); }
  };
  document.getElementById('cmd-panel')?.addEventListener('click',()=>openPanel('activity'));
  document.getElementById('hdr-notify')?.addEventListener('click',()=>openPanel('alerts'));
  /* A layer needs a way out that is not the button that opened it — the reader
     who pressed a header icon should not have to find that icon again. Scrim,
     its own close button, and Escape, which is what every other layer in this
     product answers to. */
  document.getElementById('panel-close')?.addEventListener('click',closeContextPanel);
  document.getElementById('panel-scrim')?.addEventListener('click',closeContextPanel);
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape'||!state.panelOpen) return;
    /* The Copilot sits ON TOP of this panel, and a modal on top of both. One
       Escape closes one layer, and it must be the one the reader can see —
       so this stands down while either of those is up. */
    if(document.getElementById('ai-panel')?.classList.contains('open')) return;
    if(document.getElementById('modal-root')?.firstChild) return;
    closeContextPanel();
  });
  // sidebar → icon rail, and back
  document.getElementById('cmd-rail')?.addEventListener('click',toggleRail);
  /* Applied at wiring time, not at sign-in: the shell is in the document from
     the first paint and a reader who collapsed it last week must not watch it
     stand at 256px and then jump. */
  applyRail();
  /* The bell is wired with the panel toggle above — see openPanel. It used to
     be wired HERE, to a handler that clicked the other button. */

  // theme toggle + jurisdiction switcher (top header)
  wireThemeMenu();
  // closeNavDrawer because below 900 this control lives INSIDE the sidebar
  /* The stored JURISDICTION is the truth, not this control's own key: a
     workspace that set its market on another device (it rides on the org
     record) must not have it silently reverted by whatever this browser last
     had in localStorage. */
  /* The stored jurisdiction is the truth. This no longer paints a control —
     it sets data-region on the root, which the stylesheets and the compliance
     badge read. Silent, because nothing is being changed here. */
  setRegion(regionCodeFor(window.jxId?jxId():'kenya'),{silent:true});
  wireLanguagePicker();
}

/* ---------- THE LANGUAGE TOGGLE ----------
   Built from js/i18n.js rather than the markup, so adding a language grows the
   row by itself. Each option is written IN its own language — a control that
   offers "Swedish" to a Swedish speaker is offering it in English.

   Two labels per button: the full name, and a two-letter code that takes over
   below 1180px. The words go, the button does not, so the tap target survives
   a narrow window. */
function wireLanguagePicker(){
  const host=document.getElementById('lang-switch');
  if(!host||typeof langList!=='function') return;
  const paint=()=>{
    const now=langId();
    host.innerHTML=langList().map(l=>
      `<button type="button" class="lang-btn" data-lang="${l.id}" aria-pressed="${l.id===now}"`
      + ` title="${l.name}"><span class="lang-long">${l.name}</span>`
      + `<span class="lang-code">${l.id.toUpperCase()}</span></button>`).join('');
  };
  paint();
  host.addEventListener('click',e=>{
    const b=e.target.closest('[data-lang]');
    if(!b) return;
    if(b.getAttribute('data-lang')===langId()) return;   // already there; do not repaint for nothing
    langSet(b.getAttribute('data-lang'));
    closeNavDrawer();   // below 900 this control lives inside the sidebar
  });
  /* Re-painted on every language change too, so the pressed state follows a
     switch made from anywhere else — the Settings screen, or a second tab. */
  window.repaintLanguagePicker=paint;
  applyLanguage({repaint:false});   // paint the static shell before the first render
}

/* WHAT REDRAWS WHEN THE LANGUAGE CHANGES. js/i18n.js rewrites the static markup
   itself and then calls this for everything the app DRAWS — which is most of
   it. Kept here rather than in i18n.js because it is the router's business
   which screen is open, and i18n.js has no opinion about screens.

   i18n.js does not call this while something is being edited; see
   langEditingNow() there for why a language switch must never cost unsaved
   work. */
if(typeof window!=='undefined') window.onLanguageChange=function(){
  try{
    window.repaintLanguagePicker && repaintLanguagePicker();
    /* The SIDEBAR'S OWN FURNITURE, which no view redraws: the profile line
       carries the reader's role, and the folder list its counts. Without this
       the role under your own name stayed in whatever language you signed in
       with, on every screen. */
    window.renderSideUser && renderSideUser();
    window.renderSideFolders && renderSideFolders();
    updateSidebarCounts();
    renderPageHeader&&renderPageHeader();
    /* Re-entering the SAME view, which setView already treats as a repaint and
       not a navigation — it puts the scroll position back afterwards, so the
       reader stays exactly where they were rather than being thrown to the top
       of the page for changing a setting. */
    setView(state.view);
  }catch(e){}
};

// default panel state — closed on load/refresh; the user opens it with the
// panel toggle (never auto-summoned by a page load)
if(state.panelOpen===undefined) state.panelOpen=false;

/* BOOT
   1. #share=… in the URL → counterparty portal (no login needed)
   2. HaTi server present → API mode (central storage, live shares)
   3. No server → static mode backed by this browser's localStorage
   Either mode: no workspace → setup screen; no session → login. */
(async function boot(){
  const m=location.hash.match(/^#share=(.+)$/);
  if(m){ await portalEntry(m[1]); return; }
  const adv=location.hash.match(/^#advice(?:=(.*))?$/);
  if(adv){ await adviceEntry(adv[1]||''); return; }
  const rs=location.hash.match(/^#reset=(.+)$/);
  let st=null;
  try{ const r=await fetch('api/status',{credentials:'same-origin'}); if(r.ok) st=await r.json(); }catch(e){}
  if(st && st.mode==='api'){
    REMOTE={ org:st.orgName?{name:st.orgName}:null, me:null, users:[] };
    if(rs){ renderAuth('reset:'+rs[1]); return; }
    if(!st.setup){ renderAuth('setup'); return; }
    if(!st.authed){ renderAuth('login'); return; }
    try{ await loadBootstrap(); startApp(); }
    catch(e){ renderAuth('login'); }
    return;
  }
  hydrate();
  if(!getOrg()){ renderAuth('setup'); return; }
  if(!getSession()||!currentUser()){ localStorage.removeItem(LS.session); renderAuth('login'); return; }
  startApp();
})();

// Shell listeners are static (the shell markup ships in index.html), so wire
// them once at load — this also covers login completed from the auth screen,
// which calls startApp() directly.
wireShell();

Object.assign(window,{createFromTemplate,keepScroll,openFolder,openNavSection,openWorkspace,setActiveNav,setView,updateCommandBar,updateSidebarCounts,renderContextPanel,selectContract,applyPanelLayout,closeContextPanel,
  buildAlerts,alertCount,updateAlertBadge,panelSuppressed,panelFace,setPanelFace,alertsPanelHtml,activityPanelHtml,ALERT_KINDS,ALERT_TONE,railCollapsed,applyRail,toggleRail,railLabelsShowing,paintRailToggle,RAIL_KEY,setNavDrawer,closeNavDrawer,navDrawerActive,navHeaderTight,NAV_DRAWER_W,placeLanguageSwitch,exportWorkingSetCsv,renderNewMenu,renderPageHeader,syncViewHeight,wireShell,openCommandPalette,commandPaletteResults,applyTheme,toggleTheme,setTheme,themeNow,THEMES,renderThemeMenu,wireThemeMenu,setRegion,REGIONS,buildActivityFeed,refreshActivityFeed,relTime});
