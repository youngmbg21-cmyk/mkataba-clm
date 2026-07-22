// HaTi — entry module (E0): imports every module in original
// execution order, then nav + shell wiring + boot.
import './components.js';
import './templates.js';
import './core.js';
import './api.js';
import './metadata.js';
import './versioning.js';
import './obligations.js';
import './playbook.js';
import './approvals.js';
import './wizard.js';
import './views/calendar.js';
import './views/reports.js';
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
  // 'folder' is a sub-view of Register in the new shell
  const navFor = view==='folder' ? 'register' : view;
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.getAttribute('data-view')===navFor));
}

/* ---- command bar: per-view title + subtitle ---- */
function commandMeta(view){
  const cs=state.contracts, count=cs.length;
  const m=(window.metrics?metrics():{totalValue:0});
  const totalV=fmtKESshort(m.totalValue||0);
  switch(view){
    case 'dashboard': return ['Portfolio', `${count.toLocaleString('en-KE')} contracts under management · ${totalV} active value`];
    case 'register':  return ['Contract Register', 'filter, sort and act in bulk across the working set'];
    case 'pipeline':  return ['My Queue', 'drag between lifecycle stages · signing runs through the workspace'];
    case 'intel':     return ['Portfolio Intelligence', 'AI contract graph · clustered by value stream'];
    case 'calendar':  return ['Renewal Calendar', 'expiries, renewal decisions and obligation due dates'];
    case 'reports':   return ['Reports', 'cycle time, bottlenecks, value concentration and the renewal pipeline'];
    case 'team':      return ['Team & Settings', 'members, roles, approval gate and the AI engine'];
    case 'folder': {
      const f=FOLDERS[state.folderId]; return ['Register', f?`filtered to ${f.name}`:'filter, sort and act in bulk'];
    }
    case 'workspace': {
      const c=getContract(state.activeId);
      return ['Contract Workspace', c?`${c.id} · ${c.name}${c.counterparty?' — '+c.counterparty:''}`:'open a contract from the register'];
    }
    default: return ['HaTi', ''];
  }
}
function updateCommandBar(view){
  const [t,s]=commandMeta(view);
  const te=document.getElementById('cmd-title'), se=document.getElementById('cmd-sub');
  if(te) te.textContent=t;
  if(se) se.textContent=s;
}
function updateSidebarCounts(){
  const cs=state.contracts;
  const total=(state.serverStats&&state.serverStats.total!=null)?state.serverStats.total:cs.length;
  const counts={
    dashboard: total,
    register: total,
    pipeline: cs.filter(c=>c.status==='Under Review').length,
    calendar: (window.allObligations?allObligations().filter(o=>{ const d=window.daysUntil?daysUntil((o.due||'').slice(0,10)):null; return d!=null&&d>=0&&d<=60; }).length:0),
  };
  document.querySelectorAll('[data-count]').forEach(el=>{
    const k=el.getAttribute('data-count'); const v=counts[k];
    el.textContent=(v==null||v==='')?'':Number(v).toLocaleString('en-KE');
  });
}

/* ============================================================ SHELL VIEW SWITCH */
function setView(view){
  state.view=view;
  if(view==='dashboard') renderDashboard();
  else if(view==='folder') renderFolder();
  else if(view==='intel') renderIntel();
  else if(view==='calendar') renderCalendar();
  else if(view==='reports') renderReports();
  else if(view==='register') renderRegister();
  else if(view==='pipeline') renderPipeline();
  else if(view==='team') renderTeam();
  else renderWorkspace();
  setActiveNav(view);
  updateCommandBar(view);
  updateSidebarCounts();
  applyPanelLayout();
  renderContextPanel();
  if(getOrg()&&!API_MODE()) persist();
  else if(getOrg()) lsSet(LS.ui,{ view:state.view, activeId:state.activeId, folderId:state.folderId });
  const sc=document.getElementById('content-scroll'); if(sc) sc.scrollTo({top:0});
}
function openFolder(fid){ state.folderId=fid; state.folderQuery=''; state.folderShown=50; setView('folder'); }
function openWorkspace(id){ state.activeId=id; state.selId=id; setView('workspace'); }
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
  const item=(id,ic,bg,fg,title,sub,extra='')=>`
    <button ${extra} class="new-menu-item" style="width:100%;display:flex;align-items:center;gap:10px;border:0;background:none;cursor:pointer;padding:8px;border-radius:4px;text-align:left;color:inherit;" onmouseover="this.style.background='rgba(89,128,166,.1)'" onmouseout="this.style.background='none'">
      <span style="width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:4px;background:${bg};color:${fg};">${icon(ic,'w-[15px] h-[15px]')}</span>
      <span style="min-width:0;"><span style="display:block;font-size:12px;font-weight:600;">${title}</span><span style="display:block;font-size:10px;color:var(--color-neutral-600);">${sub}</span></span>
    </button>`;
  menu.innerHTML=`
    ${item('upload','#f1e6cd','#7d5a14','Upload a received contract','Their paper — review, scan &amp; sign','id="menu-upload"')}
    ${item('sparkle','var(--color-accent-200)','var(--color-accent-800)','Guided setup','Pick a template &amp; answer a few questions','id="menu-wizard"')}
    <div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500);padding:6px 8px 4px;">Or generate directly</div>
    ${creatable.map(t=>item(t.ic,'var(--color-bg)','var(--color-accent-700)',t.name,'Template '+t.id,`data-new="${t.id}"`)).join('')}`;
  menu.querySelectorAll('[data-new]').forEach(el=>el.addEventListener('click',()=>{ menu.classList.add('hidden'); createFromTemplate(el.getAttribute('data-new')); }));
  menu.querySelector('#menu-upload')?.addEventListener('click',()=>{ menu.classList.add('hidden'); openUploadModal(); });
  menu.querySelector('#menu-wizard')?.addEventListener('click',()=>{ menu.classList.add('hidden'); openWizard(); });
}

/* ============================================================ EXPORT (command bar) */
function exportWorkingSetCsv(){
  const R=(window.regState?regState():null);
  const rows=(window.regFiltered?regFiltered():state.contracts.slice());
  if(!rows.length){ toast('Nothing to export','err'); return; }
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const head=['ID','Name','Counterparty','Stream','Value (KES)','Status','Last action','Expiry'];
  const body=rows.map(c=>[c.id,c.name,c.counterparty||'',FOLDERS[c.folder]?.name||'',isMonetary(c)?(c.value||0):'',statusLabel(c.status),c.lastAction||'',c.expiry||''].map(esc).join(','));
  const csv=[head.map(esc).join(','),...body].join('\n');
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='hati-register.csv'; a.click(); URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} contract${rows.length===1?'':'s'} to CSV`);
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
function buildActivityFeed(limit=40){
  const feed=[];
  state.contracts.forEach(c=>{
    (c.audit||[]).forEach(a=>{
      const txt=a.detail||a.action||'';
      feed.push({id:c.id, txt:`${a.action?a.action+' — ':''}${txt}`.replace(/^ — /,''), at:a.at, when:relTime(a.at), cat:activityCategory((a.action||'')+' '+txt)});
    });
  });
  feed.sort((a,b)=>Date.parse(b.at||0)-Date.parse(a.at||0));
  return feed.slice(0,limit);
}
function selectContract(id){
  state.selId=id; state.panel='summary'; state.panelOpen=true;
  applyPanelLayout(); renderContextPanel();
}
function applyPanelLayout(){
  const grid=document.getElementById('body-grid'); const panel=document.getElementById('context-panel');
  if(!grid) return;
  if(state.panelOpen){ grid.style.gridTemplateColumns='1fr 292px'; if(panel) panel.style.display='flex'; }
  else { grid.style.gridTemplateColumns='1fr'; if(panel) panel.style.display='none'; }
}
function panelTermsFor(c){
  const streamName=FOLDERS[c.folder]?.name||'—';
  const fmtDate=d=>{ if(!d) return '—'; const t=Date.parse(d); return isNaN(t)?d:new Date(t).toLocaleDateString('en-KE',{day:'2-digit',month:'short',year:'numeric'}); };
  return [
    ['Counterparty', c.counterparty||'—'],
    ['Value', isMonetary(c)?(c.value?fmtKESshort(c.value):'—'):'n/m'],
    ['Stream', streamName],
    ['Expiry', fmtDate(c.expiry)],
    ['Renewal', (c.metadata&&c.metadata.renewalType&&RENEWAL_LABEL&&RENEWAL_LABEL[c.metadata.renewalType])||'—'],
    ['Status', statusLabel(c.status)],
    ['Owner', (currentUser()&&currentUser().name)||FIRST_PARTY||'—'],
  ];
}
function renderContextPanel(){
  const body=document.getElementById('panel-body'); if(!body) return;
  // tab active state
  const ta=document.getElementById('panel-tab-activity'), ts=document.getElementById('panel-tab-summary');
  const activity=state.panel!=='summary';
  ta&&ta.classList.toggle('active',activity); ts&&ts.classList.toggle('active',!activity);

  if(activity){
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
              <span style="display:block;font-size:10px;color:var(--color-neutral-500);margin-top:1px;font-family:var(--font-heading);">${a.id} · ${a.when}</span>
            </span>
          </button>`).join(''):`<div style="font-size:11.5px;color:var(--color-neutral-600);padding:12px 2px;">No activity recorded yet.</div>`}
      </div>`;
    body.querySelectorAll('[data-sel-act]').forEach(el=>el.addEventListener('click',()=>selectContract(el.getAttribute('data-sel-act'))));
    return;
  }

  // Summary
  const c=getContract(state.selId)||getContract(state.activeId)||state.contracts[0];
  if(!c){ body.innerHTML=`<div style="padding:12px;font-size:11.5px;color:var(--color-neutral-600);">No contract selected.</div>`; return; }
  const m=STATUS_META[c.status]||STATUS_META.Draft;
  const rs=contractRisk(c);
  const rp=riskPal(rs);
  const terms=panelTermsFor(c);
  const recent=(c.audit||[]).slice().sort((a,b)=>Date.parse(b.at||0)-Date.parse(a.at||0)).slice(0,3)
    .map(a=>`<div style="display:flex;gap:8px;padding:4px 0;font-size:11px;border-bottom:1px solid rgba(29,31,32,.05);"><span style="font-family:var(--font-heading);color:var(--color-neutral-500);flex:none;width:44px;">${relTime(a.at).replace(' ago','')}</span><span style="color:var(--color-neutral-800);">${a.detail||a.action||''}</span></div>`).join('')
    || `<div style="font-size:11px;color:var(--color-neutral-600);">No recent activity.</div>`;
  body.innerHTML=`
    <div style="padding:12px;">
      <div style="font-family:var(--font-heading);font-size:11px;color:var(--color-neutral-600);">${c.id}</div>
      <div style="font-size:14px;font-weight:600;line-height:1.3;margin:2px 0 6px;">${c.name}</div>
      <span class="badge" style="background:${m.bg};color:${m.tx};">${m.label}</span>
      <div style="margin-top:12px;border-top:1px solid var(--color-divider);padding-top:8px;">
        ${terms.map(([k,v])=>`<div style="display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid rgba(29,31,32,.06);font-size:11.5px;"><span style="color:var(--color-neutral-600);">${k}</span><span style="font-weight:500;text-align:right;">${v}</span></div>`).join('')}
      </div>
      <div style="margin-top:10px;">
        <div style="display:flex;justify-content:space-between;font-size:10.5px;margin-bottom:3px;"><span style="color:var(--color-neutral-600);">Risk score</span><span style="font-weight:600;color:${rp.fg};">${rs} / 100</span></div>
        <div style="height:6px;background:var(--color-neutral-200);border-radius:2px;overflow:hidden;"><div style="width:${rs}%;height:100%;background:${rp.dot};"></div></div>
      </div>
      <div style="margin-top:12px;">
        <h6 style="margin:0 0 6px;font-size:10px;color:var(--color-neutral-600);letter-spacing:.08em;text-transform:uppercase;">Recent on this contract</h6>
        ${recent}
      </div>
      <div style="display:flex;gap:6px;margin-top:14px;">
        <button id="panel-open-ws" class="ui-btn ui-btn-primary blueprint" style="flex:1;padding:5px 11px;font-size:12px;"><i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>Open workspace</button>
        <button id="panel-scan" class="ui-btn" style="padding:5px 11px;font-size:12px;">Run AI scan</button>
      </div>
    </div>`;
  body.querySelector('#panel-open-ws')?.addEventListener('click',()=>openWorkspace(c.id));
  body.querySelector('#panel-scan')?.addEventListener('click',()=>{ openWorkspace(c.id); });
}

/* ============================================================ COMMAND-BAR + PANEL WIRING (once) */
function wireShell(){
  // nav
  const nav=document.getElementById('nav');
  nav&&nav.addEventListener('click',e=>{ const btn=e.target.closest('[data-view]'); if(btn) setView(btn.getAttribute('data-view')); });

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
      if(e.key==='/'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)){ e.preventDefault(); search.focus(); }
    });
  }

  // export
  document.getElementById('cmd-export')?.addEventListener('click',exportWorkingSetCsv);

  // new-contract menu
  renderNewMenu();
  const nb=document.getElementById('cmd-new'), nm=document.getElementById('new-menu');
  nb&&nb.addEventListener('click',e=>{ e.stopPropagation(); nm.classList.toggle('hidden'); });
  document.addEventListener('click',e=>{ if(nm&&!nm.classList.contains('hidden')&&!nm.contains(e.target)&&e.target!==nb&&!nb.contains(e.target)) nm.classList.add('hidden'); });

  // AI
  document.getElementById('cmd-ai')?.addEventListener('click',()=>openAI());

  // panel toggle + tabs
  document.getElementById('cmd-panel')?.addEventListener('click',()=>{ state.panelOpen=!state.panelOpen; applyPanelLayout(); });
  document.getElementById('panel-tab-activity')?.addEventListener('click',()=>{ state.panel='activity'; renderContextPanel(); });
  document.getElementById('panel-tab-summary')?.addEventListener('click',()=>{ state.panel='summary'; renderContextPanel(); });
}

// default panel state
if(state.panelOpen===undefined) state.panelOpen=true;
if(!state.panel) state.panel='activity';

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

// Shell listeners are static (the shell markup ships in index.html), so wire
// them once at load — this also covers login completed from the auth screen,
// which calls startApp() directly.
wireShell();

Object.assign(window,{createFromTemplate,openFolder,openWorkspace,setActiveNav,setView,updateCommandBar,updateSidebarCounts,renderContextPanel,selectContract,applyPanelLayout,exportWorkingSetCsv,renderNewMenu,wireShell});
