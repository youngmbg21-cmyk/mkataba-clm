// HaTi — entry module (E0): imports every module in original
// execution order, then nav + shell wiring + boot.
import './components.js';
import './templates.js';
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
import './views/portal.js';
import './views/home.js';
import './views/register.js';
import './ocr.js';
import './dedupe.js';
import './family.js';
import './views/negotiation.js';  // the three-pane redline, rendered for whichever side is looking
import './views/contract.js';
// the sandbox beside the Doc page: internal-vs-shared tried on a page that
// cannot write to a contract or reach a share payload (see views/doclab.js)
import './views/doclab.js';
import './pdfrich.js';
import './views/intelligence.js';
import './ai.js';
import './views/settings.js';
import './views/queue.js';
import './views/advice.js';
import './views/adviceportal.js';
import './templatefields.js';
import './views/library.js';
import './views/migration.js';

/* ============================================================ NAV */
function setActiveNav(view){
  // 'folder' is a sub-view of Register in the new shell
  const navFor = view==='folder' ? 'register' : view;
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
  const totalV=fmtKESshort(m.totalValue||0);
  switch(view){
    case 'dashboard': {
      // agreements, not files: a master agreement plus six addenda is ONE
      const fam=(window.familyCounts?familyCounts(cs):{agreements:count,documents:count,amendments:0});
      const head=fam.amendments
        ? `${fam.agreements.toLocaleString('en-KE')} agreements · ${fam.documents.toLocaleString('en-KE')} documents`
        : `${count.toLocaleString('en-KE')} contracts under management`;
      return ['Portfolio', `${head} · ${totalV} active value`];
    }
    case 'register':  return ['Contract Register', 'filter, sort and act in bulk across the working set'];
    case 'templates': return ['Templates', 'HaTi standard paper, your firm’s templates and sample documents'];
    case 'playbook':  return ['Clause Library & Playbook', 'standard wording, negotiation positions and portfolio deviations'];
    case 'pipeline':  return ['My Queue', 'drag between lifecycle stages · signing runs through the workspace'];
    case 'advice':    return ['Advice Desk', 'customer advice, review & drafting requests · published rates and a transparent turnaround promise'];
    // Named to match the nav item exactly. One feature answering to two names —
    // "Portfolio Intel" in the sidebar, "Portfolio Intelligence" on the page —
    // is one name too many for a reader trying to describe where they were.
    case 'intel':     return ['Portfolio Intel', 'Copilot contract graph · clustered by value stream'];
    case 'calendar':  return ['Renewal Calendar & Obligations', 'expiry, renewal-decision deadlines and obligations — surfaced automatically from every contract'];
    case 'migration': return ['Migration', 'bulk-import an existing portfolio · Copilot extraction with human review'];
    case 'reports':   return ['Reports', 'cycle time, bottlenecks, value concentration and the renewal pipeline'];
    case 'team':      return ['Team & Settings', 'members, roles, approval gate and the Copilot engine'];
    case 'folder': {
      const f=FOLDERS[state.folderId]; return ['Register', f?`filtered to ${f.name}`:'filter, sort and act in bulk'];
    }
    case 'workspace': {
      const c=getContract(state.activeId);
      return ['Contract Workspace', c?`${c.id} · ${c.name}${c.counterparty?' — '+c.counterparty:''}`:'open a contract from the register'];
    }
    case 'doclab': {
      const c=getContract(state.activeId);
      return ['Doc Lab (sandbox)', c?`${c.id} · trying internal vs shared — nothing here is saved to the contract`:'open a contract from the register'];
    }
    case 'redline': {
      const c=getContract(state.activeId);
      return ['Redline', c?`${c.id} · ${c.name}${c.counterparty?' — '+c.counterparty:''}`:'open a contract from the register'];
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
  register: ['export', 'new'],
  folder:   ['export', 'new'],
  workspace:['export'],
  pipeline: ['new'],
  reports:  ['export'],
};
function pageActionHtml(kind){
  if(kind==='export') return `<button data-page-export class="ui-btn" style="font-size:12px;padding:6px 12px" title="Export the working set">`+
    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px;vertical-align:-2px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Export</button>`;
  if(kind==='new') return `<button data-page-new class="ui-btn ui-btn-primary" style="font-size:12px;padding:6px 14px">+ New contract</button>`;
  return '';
}
/* PAGES THAT ALREADY STATE THEIR OWN NAME get no header from here — putting
   one above them is the second layer this whole change removes.

     dashboard  the hero says what the screen is and carries its one verb
     redline    the workbench's own head card names the contract and the round,
                and carries the view toggle, Accept All and Publish Round
     workspace  the contract page leads with the contract's own name
     doclab     the lab's status strip does the same for the sandbox

   Everything else is a list or a tool with no name of its own, and says who it
   is here. */
const PAGE_OWNS_HEADER = ['dashboard', 'redline', 'workspace', 'doclab'];
function renderPageHeader(view){
  const host=document.getElementById('page-head'); if(!host) return;
  if(PAGE_OWNS_HEADER.includes(view)){ host.innerHTML=''; host.style.padding='0'; syncViewHeight(); return; }
  const [t,sub]=commandMeta(view);
  const acts=(PAGE_ACTIONS[view]||[]).map(pageActionHtml).join('');
  host.style.padding='16px 20px 0';
  host.innerHTML=`
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap">
      <div style="min-width:0">
        <h1 style="margin:0;font-family:var(--font-heading);font-size:21px;font-weight:700;letter-spacing:-.01em;color:var(--color-text);line-height:1.2">${esc(t)}</h1>
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
if(typeof addEventListener==='function') addEventListener('resize', syncViewHeight);
function updateSidebarCounts(){
  const cs=state.contracts;
  const total=(state.serverStats&&state.serverStats.total!=null)?state.serverStats.total:cs.length;
  const counts={
    dashboard: total,
    register: total,
    pipeline: cs.filter(c=>c.status==='Under Review').length,
    advice: (state.advice||[]).filter(r=>ADVICE_ACTIVE.includes(r.status)).length,
    /* obligationDue, not `.slice(0,10)`: slicing ten characters off "31 March
       2027" produces "31 March 2", which is not a date either — the count
       simply left out every obligation whose date a person had typed. */
    calendar: (window.allObligations?allObligations().filter(o=>{ const due=window.obligationDue?obligationDue(o):(o.due||'').slice(0,10);
      const d=(due&&window.daysUntil)?daysUntil(due):null; return d!=null&&!isNaN(d)&&d>=0&&d<=60; }).length:0),
    migration: cs.filter(c=>c.migration&&c.migration.needsReview).length,
    templates: Object.keys(TEMPLATES).length + (window.customTemplates?customTemplates().length:0),
  };
  /* Tone of the count pill: teal = size of the portfolio, amber = items
     waiting on a person. A zero drops to neutral so an amber tag never cries
     wolf over an empty queue. */
  const NAV_COUNT_TONE={dashboard:'teal',register:'teal',calendar:'amber',migration:'amber',pipeline:'amber',advice:'amber'};
  document.querySelectorAll('[data-count]').forEach(el=>{
    const k=el.getAttribute('data-count'); const v=counts[k];
    el.textContent=(v==null||v==='')?'':Number(v).toLocaleString('en-KE');
    const tone=(Number(v)>0&&NAV_COUNT_TONE[k])||'';
    if(tone) el.setAttribute('data-tone',tone); else el.removeAttribute('data-tone');
  });
}

/* ============================================================ SHELL VIEW SWITCH */
const VIEW_LABEL = { dashboard:'Home', folder:'this value stream', intel:'Intelligence',
  calendar:'Calendar', reports:'Reports', register:'Register', migration:'Migration',
  pipeline:'Pipeline', advice:'Advice desk', templates:'Templates', playbook:'Playbook',
  team:'Team & settings', workspace:'the contract workspace', doclab:'the Doc Lab',
  redline:'the Redline workbench' };

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
  return `<div style="max-width:640px;margin:40px auto;border:1px solid #e6c9c1;border-left:4px solid #b0453c;
      background:#fdf4f2;border-radius:8px;padding:16px 20px">
    <div style="font-size:14px;font-weight:600;color:#8f322b;margin-bottom:6px">${esc(VIEW_LABEL[view]||view)} could not be drawn</div>
    <div style="font-size:12.5px;line-height:1.6;color:var(--color-neutral-800)">
      Something in the portfolio stopped this screen from rendering${cid?` — the record involved is <b>${esc(cid)}</b>`:''}.
      Every other screen still works, and nothing has been changed or lost.
    </div>
    <div style="margin-top:10px;font-family:var(--font-mono);font-size:11px;color:#8f322b;word-break:break-word">${esc((e&&e.message)||String(e))}</div>
  </div>`;
}
function setView(view){
  // remember where the workspace was opened from, so its Back button returns
  // there (register, a folder, the queue, …) instead of always the folder view
  if(view==='workspace' && state.view && state.view!=='workspace') state.wsReturn={view:state.view, folderId:state.folderId};
  state.view=view;
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
    else if(view==='doclab') renderDocLab();
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
  renderContextPanel();
  if(getOrg()&&!API_MODE()) persist();
  else if(getOrg()) lsSet(LS.ui,{ view:state.view, activeId:state.activeId, folderId:state.folderId });
  /* Opening a contract that is out with the other side is the moment to start
     watching closely, and leaving it is the moment to stop. */
  if(window.schedulePolling) schedulePolling();
  if(view==='workspace' && window.pollNow) pollNow('opened a contract');
  const sc=document.getElementById('content-scroll'); if(sc) sc.scrollTo({top:0});
}
function openFolder(fid){
  if(typeof canAccessFolder==='function' && !canAccessFolder(fid)){ toast('You do not have access to that value stream','err'); setView('register'); return; }
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
  if(!canEdit()){ toast('Viewers cannot create contracts','err'); return; }
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
    <button ${attrs} class="new-menu-item" style="width:100%;display:flex;align-items:center;gap:10px;border:0;background:none;cursor:pointer;padding:8px;border-radius:8px;text-align:left;color:inherit;" onmouseover="this.style.background='rgba(13,148,136,.09)'" onmouseout="this.style.background='none'">
      <span style="width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:4px;background:${bg};color:${fg};">${icon(ic,'w-[15px] h-[15px]')}</span>
      <span style="min-width:0;"><span style="display:block;font-size:12px;font-weight:600;">${title}</span><span style="display:block;font-size:10px;color:var(--color-neutral-600);">${sub}</span></span>
    </button>`;
  const myTpls=(window.customTemplates&&canEdit())?customTemplates():[];
  menu.innerHTML=`
    ${item('upload','#f1e6cd','#7d5a14','Upload a received contract','Their paper — review, scan &amp; sign','id="menu-upload"')}
    ${item('box','var(--color-accent-100)','var(--color-accent-800)','Bulk migration','Import a whole portfolio at once','id="menu-migrate"')}
    ${item('sparkle','var(--color-accent-200)','var(--color-accent-800)','Guided setup','Pick a template &amp; answer a few questions','id="menu-wizard"')}
    ${myTpls.length?`
    <div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500);padding:6px 8px 4px;">My templates</div>
    ${myTpls.map(t=>item('copy','var(--color-accent-100)','var(--color-accent-800)',t.name,(FOLDERS[t.folder]?.name||'')+' · your template',`data-newtpl="${t.id}"`)).join('')}`:''}
    <div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500);padding:6px 8px 4px;">HaTi standard templates</div>
    ${creatable.map(t=>item(t.ic,'var(--color-bg)','var(--color-accent-700)',t.name,'Template '+t.id,`data-new="${t.id}"`)).join('')}`;
  // A built-in template opens the SAME guided fill the Templates page opens.
  // It used to create an empty draft on the spot from here, so the identical
  // action produced two different experiences depending on where you started —
  // and the menu route silently skipped the questions whose answers become the
  // contract's data (counterparty, value, dates, payment terms).
  menu.querySelectorAll('[data-new]').forEach(el=>el.addEventListener('click',()=>{ menu.classList.add('hidden'); openWizard(el.getAttribute('data-new')); }));
  menu.querySelectorAll('[data-newtpl]').forEach(el=>el.addEventListener('click',()=>{ menu.classList.add('hidden'); createFromCustomTemplate(el.getAttribute('data-newtpl')); }));
  menu.querySelector('#menu-upload')?.addEventListener('click',()=>{ menu.classList.add('hidden'); openUploadModal(); });
  menu.querySelector('#menu-migrate')?.addEventListener('click',()=>{ menu.classList.add('hidden'); setView('migration'); });
  menu.querySelector('#menu-wizard')?.addEventListener('click',()=>{ menu.classList.add('hidden'); openWizard(); });
}

/* ============================================================ EXPORT (command bar) */
function exportWorkingSetCsv(){
  const R=(window.regState?regState():null);
  const rows=(window.regFiltered?regFiltered():state.contracts.slice());
  if(!rows.length){ toast('Nothing to export','err'); return; }
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const head=['ID','Name','Counterparty','Stream','Value (KES)','Status','Last action','Expiry'];
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
      .forEach(f=>out.push({kind:'folder',id:f.id,title:f.name,sub:'Value stream',ic:f.ic||'folder'}));
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
        <input id="cp-input" placeholder="Search contracts, counterparties, streams…" autocomplete="off" style="flex:1;border:0;outline:0;background:transparent;font:inherit;font-size:14px;color:inherit"/>
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
      <button data-cp-i="${i}" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:0;border-radius:5px;cursor:pointer;padding:8px 10px;font:inherit;color:inherit;background:${i===active?'rgba(89,128,166,.12)':'none'}">
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
const CAT_DOT={gray:'#98989b',amber:'#b8862b',green:'#2e8763',ruby:'#b0453c',steel:'#5980a6'};
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
function applyPanelLayout(){
  const grid=document.getElementById('body-grid'); const panel=document.getElementById('context-panel');
  if(!grid) return;
  // Intel owns its right side with its embedded portfolio chatbot dock, so the
  // global Activity panel is suppressed there to avoid two right panels.
  const show = state.panelOpen && state.view!=='intel';
  if(show){ grid.style.gridTemplateColumns='1fr 292px'; if(panel) panel.style.display='flex'; }
  else { grid.style.gridTemplateColumns='1fr'; if(panel) panel.style.display='none'; }
}
function renderContextPanel(){
  const body=document.getElementById('panel-body'); if(!body) return;
  refreshActivityFeed();   // server mode: keep the whole-workspace feed current
  const feed=buildActivityFeed();
  body.innerHTML=`
      <div style="padding:10px 12px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-600);margin-bottom:8px;">
          <span class="live-ping" style="width:6px;height:6px;border-radius:50%;background:#2e8763;"></span>Live · whole workspace
        </div>
        ${feed.length?feed.map(a=>`
          <button data-sel-act="${a.id}" style="display:flex;gap:9px;width:100%;padding:7px 2px;border:0;border-bottom:1px solid rgba(29,31,32,.06);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit;" onmouseover="this.style.background='rgba(29,31,32,.04)'" onmouseout="this.style.background='none'">
            <span style="width:8px;height:8px;border-radius:50%;background:${CAT_DOT[a.cat]};flex:none;margin-top:4px;"></span>
            <span style="flex:1;min-width:0;">
              <span style="display:block;font-size:11.5px;line-height:1.4;">${a.txt}</span>
              <span style="display:block;font-size:10px;color:var(--color-neutral-500);margin-top:1px;font-family:var(--font-mono);">${a.id} · ${a.when}</span>
            </span>
          </button>`).join(''):`<div style="font-size:11.5px;color:var(--color-neutral-600);padding:12px 2px;">No activity recorded yet.</div>`}
      </div>`;
  body.querySelectorAll('[data-sel-act]').forEach(el=>el.addEventListener('click',()=>selectContract(el.getAttribute('data-sel-act'))));
}

/* ============================================================ THEME + JURISDICTION (shell header) */
/* Light / dark via the `dark` class on <html> (Tailwind darkMode:'class' and
   the html.dark token block in index.html). A tiny head script applies the
   saved choice before first paint, so this only handles the live toggle. */
/* Guarded rather than assumed: this module is evaluated on a cut-down stage in
   the node tests, where document.documentElement does not exist. */
function applyTheme(mode){ const root=document.documentElement; if(root&&root.classList) root.classList.toggle('dark', mode==='dark'); }
function toggleTheme(){
  const root=document.documentElement; if(!root||!root.classList) return;
  const dark=!root.classList.contains('dark');
  applyTheme(dark?'dark':'light');
  try{ localStorage.setItem('hati-theme', dark?'dark':'light'); }catch(e){}
  if(window.toast) toast(dark?'Dark theme enabled':'Light theme enabled');
}
/* Jurisdiction switcher (top header): a workspace compliance profile — SE
   (EU/GDPR) or KE (KICA/ODPC). Presentation-level for now: it selects which
   regulatory frame the UI speaks in; it does not rewrite any contract data. */
const REGIONS={ SE:{ label:'Sweden (EU/GDPR)' }, KE:{ label:'Kenya (KICA/ODPC)' } };
function applyRegion(code){
  state.region=code;
  const root=document.documentElement; if(root&&root.setAttribute) root.setAttribute('data-region',code);
  const se=document.getElementById('region-se'), ke=document.getElementById('region-ke');
  if(se&&se.classList) se.classList.toggle('active',code==='SE');
  if(ke&&ke.classList) ke.classList.toggle('active',code==='KE');
}
function setRegion(code,opts){
  if(!REGIONS[code]) return;
  applyRegion(code);
  try{ localStorage.setItem('hati-region',code); }catch(e){}
  if(!(opts&&opts.silent) && window.toast) toast(`Jurisdiction switched to ${REGIONS[code].label}`);
}

/* ============================================================ COMMAND-BAR + PANEL WIRING (once) */
function wireShell(){
  // nav
  const nav=document.getElementById('nav');
  nav&&nav.addEventListener('click',e=>{
    // a section header (+/-) toggles its tabs; a tab navigates
    const head=e.target.closest('[data-section-toggle]');
    if(head){ const sec=head.closest('.nav-section'); openNavSection(sec,!sec.classList.contains('open')); return; }
    const btn=e.target.closest('[data-view]'); if(btn) setView(btn.getAttribute('data-view'));
  });

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
  // header bell = the same live Activity feed (no second notification system)
  document.getElementById('hdr-notify')?.addEventListener('click',()=>document.getElementById('cmd-panel')?.click());

  // theme toggle + jurisdiction switcher (top header)
  document.getElementById('theme-toggle-btn')?.addEventListener('click',toggleTheme);
  document.getElementById('region-se')?.addEventListener('click',()=>setRegion('SE'));
  document.getElementById('region-ke')?.addEventListener('click',()=>setRegion('KE'));
  let savedRegion=null; try{ savedRegion=localStorage.getItem('hati-region'); }catch(e){}
  setRegion(REGIONS[savedRegion]?savedRegion:'KE',{silent:true});
}

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

Object.assign(window,{createFromTemplate,openFolder,openNavSection,openWorkspace,setActiveNav,setView,updateCommandBar,updateSidebarCounts,renderContextPanel,selectContract,applyPanelLayout,exportWorkingSetCsv,renderNewMenu,renderPageHeader,syncViewHeight,wireShell,openCommandPalette,commandPaletteResults,applyTheme,toggleTheme,setRegion,buildActivityFeed,refreshActivityFeed,relTime});
