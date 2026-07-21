// HaTi — entry module (E0): imports every module in original
// execution order, then nav wiring + boot.
import './components.js';
import './templates.js';
import './core.js';
import './api.js';
import './metadata.js';
import './versioning.js';
import './obligations.js';
import './views/calendar.js';
import './views/portal.js';
import './views/home.js';
import './views/register.js';
import './views/contract.js';
import './views/intelligence.js';
import './ai.js';
import './views/settings.js';
import './views/queue.js';
/* ============================================================ NAV */
function setActiveNav(view){
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.getAttribute('data-view')===view));
  // folder highlighting in sidebar
  document.querySelectorAll('[data-side-folder]').forEach(b=>{
    b.classList.toggle('bg-white/10',view==='folder'&&b.getAttribute('data-side-folder')===state.folderId);
    b.classList.toggle('text-white',view==='folder'&&b.getAttribute('data-side-folder')===state.folderId);
  });
}
function setView(view){
  state.view=view;
  if(view==='dashboard') renderDashboard();
  else if(view==='folder') renderFolder();
  else if(view==='intel') renderIntel();
  else if(view==='calendar') renderCalendar();
  else if(view==='register') renderRegister();
  else if(view==='pipeline') renderPipeline();
  else if(view==='team') renderTeam();
  else renderWorkspace();
  if(getOrg()&&!API_MODE()) persist();
  else if(getOrg()) lsSet(LS.ui,{ view:state.view, activeId:state.activeId, folderId:state.folderId });
  window.scrollTo({top:0});
}
function openFolder(fid){ state.folderId=fid; state.folderQuery=''; state.folderShown=50; setView('folder'); }
function openWorkspace(id){ state.activeId=id; setView('workspace'); }
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
  state.activeId=c.id;
  persist(c);
  toast(`New ${t.kind} created and filed in ${FOLDERS[t.folder].name}`);
  setView('workspace');
  renderSideFolders();
}

// (folders + quick-create live in the Register chips and the New-contract
//  menu now; the old dark-sidebar population has been removed.)

document.getElementById('nav').addEventListener('click',e=>{
  const btn=e.target.closest('[data-view]');
  if(btn) setView(btn.getAttribute('data-view'));
});

/* BOOT
   1. #share=… in the URL → counterparty portal (no login needed)
   2. HaTi server present → API mode (central storage, live shares)
   3. No server → static mode backed by this browser's localStorage
   Either mode: no workspace → setup screen; no session → login. */
(async function boot(){
  const m=location.hash.match(/^#share=(.+)$/);
  if(m){ await portalEntry(m[1]); return; }
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

Object.assign(window,{createFromTemplate,openFolder,openWorkspace,setActiveNav,setView});
