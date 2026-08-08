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
import './signature.js';
import './wizard.js';
import './views/calendar.js';
import './views/reports.js';
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
import './views/intelligence.js';
import './ai.js';
import './views/settings.js';
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
const NAV_HOME_FOR={ folder:'register', workspace:'register', redline:'register' };
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
function renderPageHeader(view){
  const host=document.getElementById('page-head'); if(!host) return;
  if(PAGE_OWNS_HEADER.includes(view)){ host.innerHTML=''; host.style.padding='0'; syncViewHeight(); return; }
  const [t,sub]=commandMeta(view);
  const acts=(PAGE_ACTIONS[view]||[]).map(pageActionHtml).join('');
  host.style.padding='16px 20px 0';
  host.innerHTML=`
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap">
      <div style="min-width:0">
        <h1 style="margin:0;font-family:var(--font-heading);font-size:clamp(18px,16px + 0.35vw,24px);font-weight:700;letter-spacing:-.01em;color:var(--color-text);line-height:1.2">${esc(t)}</h1>
        ${sub?`<p style="margin:3px 0 0;font-size:12px;color:var(--color-neutral-500);line-height:1.5">${esc(sub)}</p>`:''}
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
    // applyRail owns the sidebar's inline column and reads the drawer
    // breakpoint, so crossing 900 in either direction has to re-ask it.
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
    templates: Object.keys(TEMPLATES).length + (window.customTemplates?customTemplates().length:0)
      + (window.tplLibCount?tplLibCount():0),
  };
  /* Tone of the count pill: teal = size of the portfolio, amber = items
     waiting on a person. A zero drops to neutral so an amber tag never cries
     wolf over an empty queue. */
  const NAV_COUNT_TONE={register:'teal',calendar:'amber',migration:'amber',pipeline:'amber',advice:'amber'};
  document.querySelectorAll('[data-count]').forEach(el=>{
    const k=el.getAttribute('data-count'); const v=counts[k];
    el.textContent=(v==null||v==='')?'':Number(v).toLocaleString(jxLocale());
    const tone=(Number(v)>0&&NAV_COUNT_TONE[k])||'';
    if(tone) el.setAttribute('data-tone',tone); else el.removeAttribute('data-tone');
  });
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
}

/* ============================================================ SHELL VIEW SWITCH */
const VIEW_LABEL = { dashboard:'Home', folder:'this value stream', intel:'Insights',
  calendar:'Calendar', reports:'Reports', register:'Contracts', migration:'Import contracts',
  pipeline:'Pipeline', advice:'Advice desk', templates:'Templates', playbook:'Our standards',
  team:'Team & settings', workspace:'the contract workspace',
  redline:'the negotiation workbench' };

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
  state.contracts.unshift(c);
  state.activeId=c.id; state.selId=c.id;
  persist(c);
  toast(`New ${t.kind} created and filed in ${FOLDERS[t.folder].name}`);
  setView('workspace');
}

/* ============================================================ NEW-CONTRACT MENU (command bar) */
function renderNewMenu(){
  const menu=document.getElementById('new-menu'); if(!menu) return;
  const creatable=(window.myCreatableTemplates?myCreatableTemplates():Object.values(TEMPLATES));
  const item=(ic,bg,fg,title,sub,attrs='')=>`
    <button ${attrs} class="new-menu-item" style="width:100%;display:flex;align-items:center;gap:10px;border:0;background:none;cursor:pointer;padding:8px;border-radius:8px;text-align:left;color:inherit;" onmouseover="this.style.background='rgb(var(--color-accent-600-rgb)/.09)'" onmouseout="this.style.background='none'">
      <span style="width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:4px;background:${bg};color:${fg};">${icon(ic,'w-[15px] h-[15px]')}</span>
      <span style="min-width:0;"><span style="display:block;font-size:12px;font-weight:600;">${title}</span><span style="display:block;font-size:10px;color:var(--color-neutral-600);">${sub}</span></span>
    </button>`;
  const myTpls=(window.customTemplates&&canEdit())?customTemplates():[];
  /* Company standard templates (the versioned library) sit above the built-in
     papers: the whole point of publishing one is that it becomes the team's
     one-click default. Served from the library cache; a background refresh
     re-renders the open menu when the list has moved. */
  const libTpls=(window.tplLibPublished&&canEdit())?tplLibPublished():[];
  /* WO N1: the three ways a contract gets INTO HaTi, in one menu, named for
     what they do. "Import many at once" reaches the same bulk-import page the
     sidebar's own "Import contracts" door does — deliberately two doors, since
     this menu is where you go to START one and the sidebar is where you go to
     RESUME one. */
  menu.innerHTML=`
    ${item('sparkle','var(--tile-steel-bg)','var(--tile-steel-fg)','Draft from a template','Pick a template &amp; answer a few questions','id="menu-wizard"')}
    ${item('upload','var(--tile-amber-bg)','var(--tile-amber-fg)','Upload a received contract','Their paper — review, scan &amp; sign','id="menu-upload"')}
    ${item('box','var(--tile-steel-bg)','var(--tile-steel-fg)','Import many at once','Bring a whole back-catalogue in one go','id="menu-migrate"')}
    ${libTpls.length?`
    <div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500);padding:6px 8px 4px;">${i18t('ap_company_standards')}</div>
    ${libTpls.map(t=>item('copy','var(--tile-emerald-bg)','var(--tile-emerald-fg)',esc(t.name),'v'+t.publishedVersion+' · one-click, pre-filled &amp; branded',`data-newlib="${t.id}"`)).join('')}`:''}
    ${myTpls.length?`
    <div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500);padding:6px 8px 4px;">${i18t('ap_cp_templates')}</div>
    ${myTpls.map(t=>item('copy','var(--tile-steel-bg)','var(--tile-steel-fg)',t.name,(FOLDERS[t.folder]?.name||'')+' · your template',`data-newtpl="${t.id}"`)).join('')}`:''}
    <div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500);padding:6px 8px 4px;">${i18t('ap_hati_templates')}</div>
    ${creatable.map(t=>item(t.ic,'var(--color-bg)','var(--color-accent-700)',t.name,'Template '+t.id,`data-new="${t.id}"`)).join('')}`;
  // A built-in template opens the SAME guided fill the Templates page opens.
  // It used to create an empty draft on the spot from here, so the identical
  // action produced two different experiences depending on where you started —
  // and the menu route silently skipped the questions whose answers become the
  // contract's data (counterparty, value, dates, payment terms).
  menu.querySelectorAll('[data-new]').forEach(el=>el.addEventListener('click',()=>{ menu.classList.add('hidden'); openWizard(el.getAttribute('data-new')); }));
  menu.querySelectorAll('[data-newtpl]').forEach(el=>el.addEventListener('click',()=>{ menu.classList.add('hidden'); createFromCustomTemplate(el.getAttribute('data-newtpl')); }));
  menu.querySelectorAll('[data-newlib]').forEach(el=>el.addEventListener('click',()=>{ menu.classList.add('hidden'); tplLibNewContract(el.getAttribute('data-newlib')); }));
  if(API_MODE()&&window.tplLibRefresh) tplLibRefresh().then(changed=>{ if(changed&&!menu.classList.contains('hidden')) renderNewMenu(); });
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
  const folders=Object.values(FOLDERS||{});
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
  const close=()=>{ ov.remove(); document.removeEventListener('keydown',onKey,true); };
  const openItem=it=>{ close(); if(it.kind==='folder') openFolder(it.id); else openWorkspace(it.id); };
  const paint=()=>{
    results=commandPaletteResults(input.value);
    if(active>=results.length) active=Math.max(0,results.length-1);
    if(!results.length){ list.innerHTML=`<div style="padding:22px 12px;text-align:center;font-size:12.5px;color:var(--color-neutral-600)">No matches${input.value.trim()?` for “${input.value.replace(/</g,'&lt;')}”`:''}.</div>`; return; }
    list.innerHTML=results.map((r,i)=>`
      <button data-cp-i="${i}" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:0;border-radius:5px;cursor:pointer;padding:8px 10px;font:inherit;color:inherit;background:${i===active?'color-mix(in srgb,var(--color-accent) 13%,transparent)':'none'}">
        <span style="width:28px;height:28px;flex:none;display:grid;place-items:center;border-radius:5px;border:1px solid var(--color-divider);background:var(--color-bg);color:var(--color-neutral-600)">${icon(r.ic,'w-3.5 h-3.5')}</span>
        <span style="min-width:0;flex:1">
          <span style="display:block;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${(r.title||'').replace(/</g,'&lt;')}</span>
          <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${(r.sub||'').replace(/</g,'&lt;')}</span>
        </span>
        ${r.kind==='contract'&&window.statusChip?`<span style="flex:none">${statusChip(r.status)}</span>`:`<span style="flex:none;font-size:9.5px;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.08em;color:var(--color-neutral-500)">${r.kind}</span>`}
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
  input.addEventListener('input',()=>{ active=0; paint(); });
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
// its workspace — the right-hand panel is the live Activity feed only.
function selectContract(id){ openWorkspace(id); }
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
  const on=railCollapsed();
  shell.classList.toggle('rail',on);
  /* The columns are set inline in index.html, so they are answered inline
     here — a stylesheet rule would lose to the attribute it is arguing with.
     BELOW 900 THE SIDEBAR IS NOT A COLUMN AT ALL: it becomes a drawer over the
     page (index.html, the phone block), which takes it out of grid flow, so
     its track collapses to nothing and the page gets the whole width. That is
     not a second opinion about the rail — the rail is still the reader's own
     remembered choice and comes straight back when the window does — it is
     that at 390px an expanded sidebar leaves 134px for the page. */
  if(shell.style) shell.style.gridTemplateColumns=
    (navDrawerActive()?'0px':(on?'64px':'256px'))+' minmax(0,1fr)';
  const btn=document.getElementById('cmd-rail');
  if(btn){
    btn.setAttribute('aria-pressed',on?'true':'false');
    /* The KEY is written alongside the text, not just the text. This tooltip
       flips with the rail's state, so a language switch that only rewrote
       data-i18n-title would leave the wrong half showing; and one that only
       set .title here would be reverted to English by the next repaint. Both
       are set together so whichever fires second still agrees. */
    const railKey=on?'sh_rail_show':'sh_rail_hide';
    btn.setAttribute('data-i18n-title',railKey);
    btn.title=i18t(railKey);
    /* THE CHEVRON POINTS THE WAY THE PRESS GOES, not the way the sidebar
       currently is. Pointing at the state rather than the act is how a toggle
       comes to describe the wrong half of itself. */
    const chev=btn.querySelector('.rail-chev');
    if(chev) chev.setAttribute('d',on?'M9.5 6 15.5 12l-6 6':'M14.5 6 8.5 12l6 6');
  }
  /* THE PAGE HAS TO BE TOLD. The negotiation panel writes its own column
     widths from a measurement (rlLayoutResizer) — it solves how much the round's
     queue may take before the contract loses its measure — and 192px arriving
     or leaving changes that answer. Without this the queue stays at whatever
     width the old window justified until something else forces a repaint. */
  if(typeof window!=='undefined' && window.rlLayoutResizer) window.rlLayoutResizer(document);
  syncViewHeight();
}
function toggleRail(){
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
/* Below THIS the sidebar stops being a column and becomes a drawer over the
   page. Matches the `phone` breakpoint in index.html. */
const NAV_DRAWER_W = 900;
function navDrawerActive(){
  return typeof innerWidth === 'number' ? innerWidth < NAV_DRAWER_W : false;
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
  // Intel owns its right side with its embedded portfolio chatbot dock, so the
  // global Activity panel is suppressed there to avoid two right panels.
  const show = !!(state.panelOpen && state.view!=='intel');
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
/* The nav drawer (phone only — above 900 the sidebar is a column and this is
   never called). Restyling, not rebuilding: the same <aside> with the same
   buttons simply slides over the page instead of taking a grid track. */
function setNavDrawer(open){
  const nav=document.getElementById('side-nav');
  const scrim=document.getElementById('nav-scrim');
  const btn=document.getElementById('nav-toggle');
  if(nav&&nav.classList) nav.classList.toggle('open', !!open);
  if(scrim) scrim.hidden = !open;
  if(btn) btn.setAttribute('aria-expanded', open?'true':'false');
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
  const wantDrawer=navDrawerActive();
  const inDrawer=sw.parentElement===drawerHome.parentElement;
  if(wantDrawer&&!inDrawer) drawerHome.parentElement.insertBefore(sw,drawerHome);
  else if(!wantDrawer&&inDrawer) headerHome.parentElement.insertBefore(sw,headerHome.nextSibling);
}
function renderContextPanel(){
  const body=document.getElementById('panel-body'); if(!body) return;
  refreshActivityFeed();   // server mode: keep the whole-workspace feed current
  const feed=buildActivityFeed();
  body.innerHTML=`
      <div style="padding:10px 12px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-600);margin-bottom:8px;">
          <span class="live-ping" style="width:6px;height:6px;border-radius:50%;background:var(--st-green-dot);"></span>Live · whole workspace
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
  body.querySelectorAll('[data-sel-act]').forEach(el=>el.addEventListener('click',()=>selectContract(el.getAttribute('data-sel-act'))));
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
      setView(btn.getAttribute('data-view'));
      // On a phone the nav is a drawer over the page: having chosen a
      // destination, get out of the way of it.
      closeNavDrawer();
    }
  });

  /* The phone-only menu button, and the two ways out of the drawer it opens:
     the scrim and Escape. Above 900 none of this is reachable — the button is
     display:none and the sidebar is a column. */
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

  // panel toggle (Activity feed only)
  document.getElementById('cmd-panel')?.addEventListener('click',()=>{ state.panelOpen=!state.panelOpen; applyPanelLayout(); if(state.panelOpen){ refreshActivityFeed(true); renderContextPanel(); } });
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
  // header bell = the same live Activity feed (no second notification system)
  document.getElementById('hdr-notify')?.addEventListener('click',()=>document.getElementById('cmd-panel')?.click());

  // theme toggle + jurisdiction switcher (top header)
  wireThemeMenu();
  // closeNavDrawer because below 900 this control lives INSIDE the drawer
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
    closeNavDrawer();   // below 900 this control lives inside the drawer
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

Object.assign(window,{createFromTemplate,keepScroll,openFolder,openNavSection,openWorkspace,setActiveNav,setView,updateCommandBar,updateSidebarCounts,renderContextPanel,selectContract,applyPanelLayout,closeContextPanel,railCollapsed,applyRail,toggleRail,RAIL_KEY,setNavDrawer,closeNavDrawer,navDrawerActive,placeLanguageSwitch,exportWorkingSetCsv,renderNewMenu,renderPageHeader,syncViewHeight,wireShell,openCommandPalette,commandPaletteResults,applyTheme,toggleTheme,setTheme,themeNow,THEMES,renderThemeMenu,wireThemeMenu,setRegion,REGIONS,buildActivityFeed,refreshActivityFeed,relTime});
