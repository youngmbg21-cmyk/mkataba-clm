// HaTi — entry module (E0): imports every module in original
// execution order, then nav + shell wiring + boot.
import './i18n.js';   // EN/SV dictionary + t(): imported first so every module below can call it
import './components.js';
import './templates.js';
import './core.js';
import './docx.js';
import './richdoc.js';
import './clausemodel.js'; // what a clause IS: read from the DOM, identified by a durable id
import './redline.js';   // the negotiation's diff: Myers ops, stored and rendered from storage
import './docxwrite.js';   // the .docx writer (needs richdoc's sanitiser + docx.js's classifier)
import './richpaste.js';
import './api.js';
import './aimd.js';    // markdown + tone markers, escaped: a model's words are untrusted input
import './aichart.js'; // in-chat charts, built from live state and never from the model
import './advice.js';
import './metadata.js';
import './versioning.js';
import './discuss.js';    // the light channel: talking about a point, not redrafting it
import './negotiation.js'; // the fingerprinted change model every intake path converges on
import './wordflow.js';
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
        ? tn('cmd_head_agreements', fam.agreements, { agreements:fam.agreements.toLocaleString(langLocale('en-KE')), documents:fam.documents.toLocaleString(langLocale('en-KE')) })
        : tn('cmd_head_managed', count, { count:count.toLocaleString(langLocale('en-KE')) });
      return [t('cmd_title_portfolio'), t('cmd_sub_portfolio',{ head, value:totalV })];
    }
    case 'register':  return [t('cmd_title_register'),  t('cmd_sub_register')];
    case 'templates': return [t('cmd_title_templates'), t('cmd_sub_templates')];
    case 'playbook':  return [t('cmd_title_playbook'),  t('cmd_sub_playbook')];
    case 'pipeline':  return [t('cmd_title_queue'),     t('cmd_sub_queue')];
    case 'advice':    return [t('cmd_title_advice'),    t('cmd_sub_advice')];
    case 'intel':     return [t('cmd_title_intel'),     t('cmd_sub_intel')];
    case 'calendar':  return [t('cmd_title_calendar'),  t('cmd_sub_calendar')];
    case 'migration': return [t('cmd_title_migration'), t('cmd_sub_migration')];
    case 'reports':   return [t('cmd_title_reports'),   t('cmd_sub_reports')];
    case 'team':      return [t('cmd_title_team'),      t('cmd_sub_team')];
    case 'folder': {
      const f=FOLDERS[state.folderId];
      return [t('cmd_title_folder'), f?t('cmd_sub_folder_filtered',{ folder:f.name }):t('cmd_sub_folder')];
    }
    case 'workspace': {
      const c=getContract(state.activeId);
      if(!c) return [t('cmd_title_workspace'), t('cmd_sub_workspace_empty')];
      const sub=c.counterparty
        ? t('cmd_sub_workspace_party',{ id:c.id, name:c.name, party:c.counterparty })
        : t('cmd_sub_workspace',{ id:c.id, name:c.name });
      return [t('cmd_title_workspace'), sub];
    }
    default: return [t('cmd_title_app'), ''];
  }
}
function updateCommandBar(view){
  // NB: destructured as title/sub, not t/s — `t` is the translation helper.
  const [title,sub]=commandMeta(view);
  const te=document.getElementById('cmd-title'), se=document.getElementById('cmd-sub');
  if(te) te.textContent=title;
  if(se) se.textContent=sub;
}
function updateSidebarCounts(){
  const cs=state.contracts;
  const total=(state.serverStats&&state.serverStats.total!=null)?state.serverStats.total:cs.length;
  const counts={
    dashboard: total,
    register: total,
    pipeline: cs.filter(c=>c.status==='Under Review').length,
    advice: (state.advice||[]).filter(r=>ADVICE_ACTIVE.includes(r.status)).length,
    calendar: (window.allObligations?allObligations().filter(o=>{ const d=window.daysUntil?daysUntil((o.due||'').slice(0,10)):null; return d!=null&&d>=0&&d<=60; }).length:0),
    migration: cs.filter(c=>c.migration&&c.migration.needsReview).length,
    templates: Object.keys(TEMPLATES).length + (window.customTemplates?customTemplates().length:0),
  };
  document.querySelectorAll('[data-count]').forEach(el=>{
    const k=el.getAttribute('data-count'); const v=counts[k];
    el.textContent=(v==null||v==='')?'':Number(v).toLocaleString(langLocale('en-KE'));
  });
}

/* ============================================================ SHELL VIEW SWITCH */
function setView(view){
  // remember where the workspace was opened from, so its Back button returns
  // there (register, a folder, the queue, …) instead of always the folder view
  if(view==='workspace' && state.view && state.view!=='workspace') state.wsReturn={view:state.view, folderId:state.folderId};
  state.view=view;
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
  else renderWorkspace();
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
  if(typeof canAccessFolder==='function' && !canAccessFolder(fid)){ toast(t('toast_no_stream_access'),'err'); setView('register'); return; }
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
  if(!canEdit()){ toast(t('toast_viewer_no_create'),'err'); return; }
  // local renamed from `t` to `tpl`: `t` is the translation helper
  const tpl=TEMPLATES[tid], u=currentUser();
  const c={ id:nextId(), name:tpl.name+' (Draft)', counterparty:'', value:0, status:'Draft',
    template:tid, folder:tpl.folder,
    lastAction:todayStr(),
    hash:null, signedAt:null, signatory:u?.name||'Authorized signatory',
    compliance:{iprs:false,pki:false},
    /* The seeded comment and the audit entry below are RECORD DATA, written
       once into the contract and read later by anyone. They stay in English
       on purpose: language is a display preference, and baking the creator's
       interface language into a stored record would show a Swedish line to
       an English reader (and the reverse) forever after. */
    comments:[{author:'System',role:'Automation',side:'internal',text:`New ${tpl.kind} generated from Template ${tid} and filed under ${FOLDERS[tpl.folder].name}. Fill the highlighted fields to begin.`,ts:fmtDT(nowISO())}],
    fields:{}, scan:null, expiry:null, valueType:tpl.valueType,
    audit:[{at:nowISO(),user:u?.name||'System',action:'Created',detail:`Generated from Template ${tid} (${tpl.kind})`}],
    signatures:[] };
  c._loaded=true; c._light=false; c._v=0;
  state.contracts.unshift(c);
  state.activeId=c.id; state.selId=c.id;
  persist(c);
  toast(t('toast_created_filed',{ kind:tpl.kind, folder:FOLDERS[tpl.folder].name }));
  setView('workspace');
}

/* ============================================================ NEW-CONTRACT MENU (command bar) */
function renderNewMenu(){
  const menu=document.getElementById('new-menu'); if(!menu) return;
  const creatable=(window.myCreatableTemplates?myCreatableTemplates():Object.values(TEMPLATES));
  const item=(ic,bg,fg,title,sub,attrs='')=>`
    <button ${attrs} class="new-menu-item" style="width:100%;display:flex;align-items:center;gap:10px;border:0;background:none;cursor:pointer;padding:8px;border-radius:4px;text-align:left;color:inherit;" onmouseover="this.style.background='rgba(89,128,166,.1)'" onmouseout="this.style.background='none'">
      <span style="width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:4px;background:${bg};color:${fg};">${icon(ic,'w-[15px] h-[15px]')}</span>
      <span style="min-width:0;"><span style="display:block;font-size:12px;font-weight:600;">${title}</span><span style="display:block;font-size:10px;color:var(--color-neutral-600);">${sub}</span></span>
    </button>`;
  const myTpls=(window.customTemplates&&canEdit())?customTemplates():[];
  // map callbacks renamed from `t` to `tp`: `t` is the translation helper
  menu.innerHTML=`
    ${item('upload','#f1e6cd','#7d5a14',t('menu_upload_title'),t('menu_upload_sub'),'id="menu-upload"')}
    ${item('box','var(--color-accent-100)','var(--color-accent-800)',t('menu_migrate_title'),t('menu_migrate_sub'),'id="menu-migrate"')}
    ${item('sparkle','var(--color-accent-200)','var(--color-accent-800)',t('menu_wizard_title'),t('menu_wizard_sub'),'id="menu-wizard"')}
    ${myTpls.length?`
    <div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500);padding:6px 8px 4px;">${t('menu_my_templates')}</div>
    ${myTpls.map(tp=>item('copy','var(--color-accent-100)','var(--color-accent-800)',tp.name,t('menu_your_template_sub',{ folder:FOLDERS[tp.folder]?.name||'' }),`data-newtpl="${tp.id}"`)).join('')}`:''}
    <div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500);padding:6px 8px 4px;">${t('menu_std_templates')}</div>
    ${creatable.map(tp=>item(tp.ic,'var(--color-bg)','var(--color-accent-700)',tp.name,t('menu_template_sub',{ id:tp.id }),`data-new="${tp.id}"`)).join('')}`;
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
  if(!rows.length){ toast(t('toast_nothing_export'),'err'); return; }
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const head=['ID','Name','Counterparty','Stream','Value (KES)','Status','Last action','Expiry'];
  const body=rows.map(c=>[c.id,c.name,c.counterparty||'',FOLDERS[c.folder]?.name||'',csvValueCell(c),statusLabel(c.status),c.lastAction||'',c.expiry||''].map(esc).join(','));
  const csv=[head.map(esc).join(','),...body].join('\n');
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='hati-register.csv'; a.click(); URL.revokeObjectURL(url);
  toast(tn('toast_exported',rows.length));
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
      .forEach(f=>out.push({kind:'folder',id:f.id,title:f.name,sub:t('cp_value_stream'),ic:f.ic||'folder'}));
  }
  let cs=state.contracts.slice();
  if(q) cs=cs.filter(c=>(c.name+' '+(c.counterparty||'')+' '+c.id).toLowerCase().includes(q));
  else cs=cs.slice().sort((a,b)=>Date.parse(b.lastAction||0)-Date.parse(a.lastAction||0));
  cs.slice(0,q?12:6).forEach(c=>out.push({kind:'contract',id:c.id,
    title:c.name,
    sub:c.counterparty?t('cp_sub_contract_party',{ id:c.id, party:c.counterparty }):t('cp_sub_contract',{ id:c.id }),
    ic:(window.cIcon?cIcon(c):'file'), status:c.status}));
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
        <input id="cp-input" placeholder="${t('cp_input_ph')}" autocomplete="off" style="flex:1;border:0;outline:0;background:transparent;font:inherit;font-size:14px;color:inherit"/>
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
    if(!results.length){
      const q=input.value.trim();
      const empty=q?t('cp_no_matches_for',{ query:input.value.replace(/</g,'&lt;') }):t('cp_no_matches');
      list.innerHTML=`<div style="padding:22px 12px;text-align:center;font-size:12.5px;color:var(--color-neutral-600)">${empty}</div>`; return; }
    list.innerHTML=results.map((r,i)=>`
      <button data-cp-i="${i}" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:0;border-radius:5px;cursor:pointer;padding:8px 10px;font:inherit;color:inherit;background:${i===active?'rgba(89,128,166,.12)':'none'}">
        <span style="width:28px;height:28px;flex:none;display:grid;place-items:center;border-radius:5px;border:1px solid var(--color-divider);background:var(--color-bg);color:var(--color-neutral-600)">${icon(r.ic,'w-3.5 h-3.5')}</span>
        <span style="min-width:0;flex:1">
          <span style="display:block;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${(r.title||'').replace(/</g,'&lt;')}</span>
          <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${(r.sub||'').replace(/</g,'&lt;')}</span>
        </span>
        ${r.kind==='contract'&&window.statusChip?`<span style="flex:none">${statusChip(r.status)}</span>`:`<span style="flex:none;font-size:9.5px;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.08em;color:var(--color-neutral-500)">${t('cp_kind_'+r.kind)}</span>`}
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
/* local renamed from `t` to `ms`: `t` is the translation helper.
   Each bucket is a whole dictionary sentence with the number dropped in at
   {n}, so Swedish can put "för … sedan" around it instead of the English
   "… ago" order. */
const relTime = iso => {
  const ms=Date.parse(iso); if(isNaN(ms)) return '';
  const s=Math.max(0,(Date.now()-ms)/1000);
  if(s<60) return t('rel_just_now');
  if(s<3600) return t('rel_minutes',{ n:Math.floor(s/60) });
  if(s<86400) return t('rel_hours',{ n:Math.floor(s/3600) });
  const d=Math.floor(s/86400);
  return d<30 ? t('rel_days',{ n:d }) : t('rel_months',{ n:Math.floor(d/30) });
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
          <span class="live-ping" style="width:6px;height:6px;border-radius:50%;background:#2e8763;"></span>${t('panel_live_scope')}
        </div>
        ${feed.length?feed.map(a=>`
          <button data-sel-act="${a.id}" style="display:flex;gap:9px;width:100%;padding:7px 2px;border:0;border-bottom:1px solid rgba(29,31,32,.06);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit;" onmouseover="this.style.background='rgba(29,31,32,.04)'" onmouseout="this.style.background='none'">
            <span style="width:8px;height:8px;border-radius:50%;background:${CAT_DOT[a.cat]};flex:none;margin-top:4px;"></span>
            <span style="flex:1;min-width:0;">
              <span style="display:block;font-size:11.5px;line-height:1.4;">${a.txt}</span>
              <span style="display:block;font-size:10px;color:var(--color-neutral-500);margin-top:1px;font-family:var(--font-mono);">${a.id} · ${a.when}</span>
            </span>
          </button>`).join(''):`<div style="font-size:11.5px;color:var(--color-neutral-600);padding:12px 2px;">${t('panel_no_activity')}</div>`}
      </div>`;
  body.querySelectorAll('[data-sel-act]').forEach(el=>el.addEventListener('click',()=>selectContract(el.getAttribute('data-sel-act'))));
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

  // language toggle (EN ⇄ SV)
  document.getElementById('langToggleBtn')?.addEventListener('click',()=>toggleLanguage());

  // export
  document.getElementById('cmd-export')?.addEventListener('click',exportWorkingSetCsv);

  // new-contract menu (re-rendered on open so newly saved templates appear)
  renderNewMenu();
  const nb=document.getElementById('cmd-new'), nm=document.getElementById('new-menu');
  nb&&nb.addEventListener('click',e=>{ e.stopPropagation(); if(nm.classList.contains('hidden')) renderNewMenu(); nm.classList.toggle('hidden'); });
  document.addEventListener('click',e=>{ if(nm&&!nm.classList.contains('hidden')&&!nm.contains(e.target)&&e.target!==nb&&!nb.contains(e.target)) nm.classList.add('hidden'); });

  // Copilot
  document.getElementById('cmd-ai')?.addEventListener('click',()=>openAI());
  document.getElementById('side-copilot')?.addEventListener('click',()=>openAI());

  // panel toggle (Activity feed only)
  document.getElementById('cmd-panel')?.addEventListener('click',()=>{ state.panelOpen=!state.panelOpen; applyPanelLayout(); if(state.panelOpen){ refreshActivityFeed(true); renderContextPanel(); } });
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

Object.assign(window,{createFromTemplate,openFolder,openNavSection,openWorkspace,setActiveNav,setView,updateCommandBar,updateSidebarCounts,renderContextPanel,selectContract,applyPanelLayout,exportWorkingSetCsv,renderNewMenu,wireShell,openCommandPalette,commandPaletteResults});
