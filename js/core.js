// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================ STATE */
window.FIRST_PARTY = 'Highland Corporate Ltd'; // replaced by the workspace org name at login
window.PORTAL_MODE = false;                     // true when rendering the counterparty share portal

Object.assign(window,{FIRST_PARTY,PORTAL_MODE});

window.uid = 100;
const nextId = () => 'MK-' + (++uid);
const seedComments = () => ([
  { author:'Wanjiku Kamau', role:'Legal (Internal)', side:'internal', text:'Flagged clause 4 — please confirm the governing-law reference stays Kenyan.', ts:'2d ago' },
  { author:'Counterparty', role:'Reviewer', side:'external', text:'Agreed on scope. We will need the value confirmed before counsel signs off.', ts:'1d ago' },
]);

const state = {
  view:'dashboard',        // dashboard | folder | workspace
  activeId:null,
  folderId:null,
  folderQuery:'',
  settings:{}, dataVersion:0,
  mapPos:{}, mapSel:null,
  contracts:[
    // — Procurement & Raw Materials —
    mk('Refined Sugar Supply — Confectionery Line','Kabras Sugar (West Kenya Ltd)',48000000,'Signed','RM','09 Jul 2026','2027-07-31'),
    mk('Raw Milk Collection — Rift Valley Co-ops','Nandi Dairy Co-operative Union',36000000,'Signed','RM','03 Jul 2026','2027-06-30'),
    mk('Crude Edible Oil Supply','Wilmar East Africa Ltd',95000000,'Under Review','RM','16 Jul 2026','2027-03-31'),
    mk('PET Bottle & Preform Supply','Nampak Kenya Ltd',22000000,'Under Review','PK','15 Jul 2026','2027-01-31'),
    mk('Corrugated Carton Supply','Statpack Industries Ltd',14500000,'Draft','PK','18 Jul 2026',null),
    // — Manufacturing & Production —
    mk('Co-Packing — Powdered Beverages','Kevian Kenya Ltd',60000000,'Signed','CM','07 Jul 2026','2027-12-31'),
    mk('Contract Manufacturing — Bar Soap','Orbit Products Africa Ltd',40000000,'Under Review','CM','14 Jul 2026','2027-09-30'),
    mk('Tolling Agreement — Detergent Powder','Kapa Oil Refineries Ltd',33000000,'Under Review','CM','12 Jul 2026',null),
    mk('Filling Line Lease & Maintenance','Krones East Africa Ltd',8400000,'Signed','EQ','05 Jul 2026','2029-06-30'),
    mk('Forklift Fleet Lease — Plant','CFAO Equipment Kenya',3600000,'Draft','EQ','17 Jul 2026',null),
    // — Warehousing & Distribution —
    mk('Central Warehouse & 3PL — Industrial Area','Siginon Group',18000000,'Signed','WH','06 Jul 2026','2028-06-30'),
    mk('Cold-Chain Storage — Dairy & Chilled','Africa Logistics Properties',12600000,'Under Review','WH','15 Jul 2026','2027-12-31'),
    mk('Primary Distribution — Nairobi to Coast','Sendy Ltd',9800000,'Signed','FF','08 Jul 2026','2027-07-31'),
    mk('Cross-Border Freight — EAC Markets','Lori Systems',15200000,'Under Review','FF','13 Jul 2026',null),
    mk('Last-Mile Distribution — Western Region','Wasoko',6400000,'Draft','FF','18 Jul 2026',null),
    // — Sales & Route-to-Market —
    mk('Regional Distributor — Nyanza','Ramogi Distributors Ltd',52000000,'Signed','DA','04 Jul 2026','2027-06-30'),
    mk('Regional Distributor — Mt. Kenya','Muranga Distributors Ltd',44000000,'Under Review','DA','14 Jul 2026',null),
    mk('Modern Trade Listing & Supply','Naivas Supermarkets',85000000,'Signed','RL','02 Jul 2026','2027-06-30'),
    mk('Retail Supply — Modern Trade','Carrefour Kenya',78000000,'Under Review','RL','16 Jul 2026','2027-03-31'),
    mk('E-commerce Distribution Agreement','Copia Global',12000000,'Draft','DA','17 Jul 2026',null),
    // — Marketing & Brand —
    mk('Creative & Brand Agency Retainer','Scanad Kenya',24000000,'Signed','MK','06 Jul 2026','2027-06-30'),
    mk('Media Buying — TV & Radio','Royal Media Services',30000000,'Under Review','MK','15 Jul 2026','2027-06-30'),
    mk('Trade Activation & Field Marketing','Ogilvy Kenya',9600000,'Under Review','MK','12 Jul 2026',null),
    mk('Digital & Influencer Campaign','Aleph Group',5400000,'Draft','MK','18 Jul 2026',null),
    mk('Sponsorship — FKF Premier League','Football Kenya Federation',18000000,'Declined','MK','01 Jul 2026',null),
    // — Corporate & Compliance —
    mk('Mutual NDA — New Product Development','Givaudan East Africa',0,'Signed','ND','05 Jul 2026','2027-07-31'),
    mk('Head Office Lease — Westlands','Britam Properties',42000000,'Signed','LE','03 Jul 2026','2030-06-30'),
    mk('External Audit Engagement — FY2026','PwC Kenya',7200000,'Under Review','PS','16 Jul 2026',null),
    mk('Legal Retainer — Commercial & Regulatory','Bowmans (Coulson Harney LLP)',6000000,'Signed','PS','07 Jul 2026','2027-06-30'),
    mk('Vendor NDA — ERP Implementation','SAP East Africa',0,'Under Review','ND','14 Jul 2026',null),
  ],
};
const isMonetary = c => c.valueType !== 'none';
function mk(name,cp,value,status,tmpl,date,expiry,valueType){
  const c = { id:nextId(), name, counterparty:cp, value, status, template:tmpl,
    folder:TEMPLATES[tmpl].folder, valueType:valueType||TEMPLATES[tmpl].valueType,
    lastAction:date, expiry:expiry||null, hash:null, signedAt:null,
    signatory:'A. Otieno, Director', compliance:{iprs:false,pki:false},
    comments:seedComments(), fields:{}, scan:null,
    audit:[{at:new Date().toISOString(),user:'System',action:'Created',detail:'Seeded as sample data'}],
    signatures:[] };
  if(status==='Signed'){ c.hash='PRE-SEEDED'; c.compliance={iprs:true,pki:true}; }
  return c;
}
const getContract = id => state.contracts.find(c=>c.id===id);
const folderContracts = fid => state.contracts.filter(c=>c.folder===fid);

// Contract type/icon helpers — uploaded ("inbound") contracts have no template.
const isUpload = c => c && c.source==='upload';
const cIcon = c => isUpload(c) ? 'upload' : (TEMPLATES[c.template]?.ic || 'file');
const cKind = c => isUpload(c) ? 'External Document' : (TEMPLATES[c.template]?.kind || 'Contract');
const UPLOAD_MAX = 4*1024*1024; // 4 MB cap keeps localStorage/API payloads safe

/* ============================================================ HELPERS */
const fmtKES = n => 'KES ' + Number(n||0).toLocaleString('en-KE');
const fmtKESshort = n => { n=Number(n||0); if(n>=1e6) return 'KES '+(n/1e6).toFixed(2).replace(/\.00$/,'')+'M'; if(n>=1e3) return 'KES '+(n/1e3).toFixed(0)+'K'; return 'KES '+n; };
// Design status treatment: friendly lifecycle labels (Drafting/In Review/
// Executed/Closed) over the warm palette. Internal status values stay
// Draft/Under Review/Signed/Declined so filters, backend and logic are
// untouched — only the visible chip label and colours change.
// Industry status model: Draft=grey · In Review=amber · Executed=emerald ·
// Closed/Expired=ruby. Internal status values stay Draft/Under Review/Signed/
// Declined so filters, backend and logic are untouched — only the visible
// chip label and colours change.
const STATUS_META = {
  'Draft':        {label:'Drafting',  dot:'#98989b', bg:'#eceae6', tx:'#5d5d60', bd:'#dedcd6'},
  'Under Review': {label:'In Review', dot:'#b8862b', bg:'#fbf4e3', tx:'#7d5a14', bd:'#f0e3c2'},
  'Signed':       {label:'Executed',  dot:'#2e8763', bg:'#e8f4ee', tx:'#1e6b4d', bd:'#cfe7d9'},
  'Declined':     {label:'Closed',    dot:'#b0453c', bg:'#fdece9', tx:'#8f322b', bd:'#f5d4cd'},
};
const statusLabel = s => (STATUS_META[s]||{}).label || s;
// Pill status chip: wash bg + tone fg, leading 6px tone dot, 999px radius.
const statusChip = s => { const m=STATUS_META[s]||STATUS_META.Draft;
  return `<span class="badge" style="background:${m.bg};color:${m.tx}"><span class="dot" style="background:${m.dot}"></span>${m.label}</span>`; };

// ---- Risk model: bands ≥60 ruby / 35–59 amber / <35 emerald ----
const RISK_PAL = {
  ruby:  {bg:'#fdece9', fg:'#8f322b', dot:'#b0453c'},
  amber: {bg:'#fbf4e3', fg:'#7d5a14', dot:'#b8862b'},
  green: {bg:'#e8f4ee', fg:'#1e6b4d', dot:'#2e8763'},
};
const riskBand = r => r>=60?'ruby':r>=35?'amber':'green';
const riskPal  = r => RISK_PAL[riskBand(r)];
// A 0–100 risk score for display. Prefers the real scan-driven signal; for
// un-scanned contracts it derives a stable pseudo-score from immutable fields
// (display only — never persisted, never alters data flow or logic).
function contractRisk(c){
  if(!c) return 0;
  const open=(window.openFindings?openFindings(c):[]);
  if(open.length){ const w={high:34,med:16,low:7}; return Math.min(98, 22 + open.reduce((a,f)=>a+(w[f.sev]||8),0)); }
  let h=0; const seed=(c.id||'')+'|'+(c.counterparty||'')+'|'+(c.status||'');
  for(const ch of seed) h=(h*33+ch.charCodeAt(0))>>>0;
  let base = 8 + (h % 70);
  if(c.status==='Declined') base = 62 + (h%36);
  else if(c.status==='Signed') base = Math.min(base, 46);
  return base;
}
// small risk chip: "R nn" in the band colour
const riskChip = (r,withR=true) => { const p=riskPal(r); return `<span class="badge tnum" style="background:${p.bg};color:${p.fg}">${withR?'R ':''}${r}</span>`; };

// short value-stream label for dense grids (folder → single word)
const STREAM_SHORT = { proc:'Procurement', mfg:'Manufacturing', dist:'Distribution', sales:'Sales', mktg:'Marketing', corp:'Corporate' };
const streamLabel = c => STREAM_SHORT[c && c.folder] || (FOLDERS[c && c.folder]?.name) || '—';
// display owner initials (the app has no per-contract owner field; use the
// signed-in user, matching the existing register behaviour)
const ownerInitials = () => { const u=currentUser(); const n=(u&&u.name)||FIRST_PARTY||'HaTi'; return n.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase(); };
// short approval label derived from the real approval gate. The live gate is
// the rule-chain approvalState in approvals.js (window-attached, shadowing the
// legacy one below) — read it via window so this label matches what the sign
// panel actually enforces, instead of the superseded spend-threshold config.
function approvalLabel(c){
  if(c && c.approval) return 'Approved';
  if(c && c.status==='Declined') return 'Rejected';   // closed — nothing is pending any more
  const st=((window.approvalState)||approvalState)(c);
  if(c && c.status!=='Signed' && st.required){
    if(st.ok) return 'Approved';
    const a=st.next && st.next.approver;
    return 'Pending '+(a ? (a.kind==='member' ? a.name : (a.role==='legal'?'Legal':'Admin')) : 'approval');
  }
  return '—';
}

function toast(msg,kind='ok'){
  const root=document.getElementById('toast-root');
  const isErr = kind!=='ok';
  const el=document.createElement('div');
  el.className='toast-in';
  el.style.cssText=`display:flex;align-items:center;gap:10px;border-radius:4px;`
    +`border:1px solid ${isErr?'color-mix(in srgb,#fff 22%,transparent)':'color-mix(in srgb,#fff 14%,transparent)'};`
    +`background:${isErr?'#b0453c':'var(--color-accent-900)'};color:#fff;`
    +`padding:11px 15px;box-shadow:var(--shadow-lg);font-size:13px;font-family:var(--font-body);max-width:20rem;`;
  el.innerHTML=`<span style="display:inline-flex;color:${isErr?'#fff':'var(--color-accent-300)'};">${icon(kind==='ok'?'check2':'ban')}</span><span>${msg}</span>`;
  root.appendChild(el);
  setTimeout(()=>{el.style.transition='opacity .3s, transform .3s';el.style.opacity=0;el.style.transform='translateY(8px)';setTimeout(()=>el.remove(),300);},3200);
}
async function sha256(str){
  try{ const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }catch(e){ let h=0; for(let i=0;i<str.length;i++){h=(h*31+str.charCodeAt(i))>>>0;} return h.toString(16).padStart(8,'0').repeat(8).slice(0,64); }
}
const generatePseudo = seed => { let h=0; for(const ch of seed) h=(h*33+ch.charCodeAt(0))>>>0; return h.toString(16).padStart(60,'0').slice(0,60); };

Object.assign(window,{STATUS_META,RISK_PAL,STREAM_SHORT,UPLOAD_MAX,approvalLabel,cIcon,cKind,contractRisk,fmtKES,fmtKESshort,folderContracts,generatePseudo,getContract,isMonetary,isUpload,mk,nextId,ownerInitials,riskBand,riskPal,riskChip,seedComments,sha256,state,statusChip,statusLabel,streamLabel,toast,uid});
/* ============================================================
   PLATFORM CORE — persistence · auth · audit · sharing · export
   MVP runs fully client-side (localStorage) so it deploys as a
   static page. Every load/store function below is the seam
   where a hosted backend API slots in later (swap for fetch()).
   ============================================================ */
const LS = { org:'hati.v1.org', users:'hati.v1.users', session:'hati.v1.session', data:'hati.v1.data', ui:'hati.v1.ui' };
const lsGet = k => { try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const lsSet = (k,v) => localStorage.setItem(k, JSON.stringify(v));

/* ---------- optional backend (API mode) ----------
   When served by server/server.js the app stores everything on the
   server (multi-user, multi-device). Opened as a plain static page,
   it falls back to this browser's localStorage. */
window.REMOTE=null; // {org, me, users} when a HaTi server is present
Object.assign(window,{LS,REMOTE,lsGet,lsSet});

const nowISO = () => new Date().toISOString();
const fmtDT = iso => new Date(iso).toLocaleString('en-KE',{dateStyle:'medium',timeStyle:'short'});
const todayStr = () => new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
const fval = id => (document.getElementById(id)?.value||'').trim();

/* ---------- persistence (per-contract at scale) ----------
   API mode saves ONE contract at a time, each with its own optimistic-lock
   version — so an edit never re-sends the whole portfolio and a teammate's
   change to a different contract can't be clobbered. Static mode keeps the
   single-blob localStorage model. */
const dirty=new Map(); window.saveTimer=null;
function persist(c){
  if(API_MODE()){
    lsSet(LS.ui,{ view:state.view, activeId:state.activeId, folderId:state.folderId });
    if(!canEdit()) return;              // server rejects viewer writes
    if(c && c.id){ dirty.set(c.id,c); clearTimeout(saveTimer); saveTimer=setTimeout(flushSaves,400); }
    return;
  }
  lsSet(LS.data, { uid, contracts:state.contracts, settings:state.settings, view:state.view, activeId:state.activeId, folderId:state.folderId });
}
async function flushSaves(){
  const items=[...dirty.values()]; dirty.clear();
  for(const c of items){ await saveContract(c); }
  refreshStats();  // keep portfolio KPIs current after status/value changes
}
async function saveContract(c){
  const payload={...c}; delete payload._light; delete payload._loaded; delete payload._v;
  if(payload.upload && payload.upload.fileId){ payload.upload={...payload.upload, dataUrl:undefined}; }
  try{
    const r=await api('contracts/'+c.id,'PUT',{ contract:payload, baseVersion:c._v||0, uid });
    c._v=r.version; c._loaded=true; c._light=false;
  }catch(e){
    if(/conflict|version/i.test(e.message)){
      toast('This contract changed on the server — reloading it','err');
      try{ const fresh=await api('contracts/'+c.id); Object.assign(c,fresh); c._v=fresh._v; c._loaded=true; c._light=false;
        if(state.activeId===c.id) renderWorkspace(); }catch(_){}
    } else toast('Save failed: '+e.message,'err');
  }
}
async function saveSettings(){
  if(API_MODE()){ try{ await api('settings','PUT',state.settings); }catch(e){ toast('Settings save failed: '+e.message,'err'); } }
  else persist();
}
// Ensure a contract's full body (comments, audit, execution text, extracted text)
// is loaded before we render its workspace.
async function ensureFull(c){
  if(!API_MODE() || !c || c._loaded) return;
  const full=await api('contracts/'+c.id);
  Object.assign(c, full); c._loaded=true; c._light=false; c._v=full._v;
}
function hydrate(){
  const d = lsGet(LS.data);
  if(d && Array.isArray(d.contracts)){
    uid = d.uid || uid;
    state.contracts = d.contracts.map(migrateContract);
    state.settings = d.settings || {};
    state.view = d.view || 'dashboard';
    state.activeId = d.activeId || null;
    state.folderId = d.folderId || null;
  }
  else state.contracts = state.contracts.map(migrateContract);
}
function migrateContract(c){
  return Object.assign({ audit:[], signatures:[], comments:[], fields:{}, scan:null,
    compliance:{}, hash:null, signedAt:null, expiry:null, execution:null, approval:null, rounds:[] }, c);
}

/* ---------- approvals (spend-threshold sign-off) ---------- */
const DEFAULT_APPROVAL={ threshold:5000000, approverRole:'admin' };
const getApprovalCfg=()=>Object.assign({}, DEFAULT_APPROVAL, (state.settings&&state.settings.approval)||{});
function approvalState(c){
  const cfg=getApprovalCfg();
  const required = Number(cfg.threshold)>0 && isMonetary(c) && Number(c.value)>=Number(cfg.threshold) && c.status!=='Signed';
  const me=currentUser();
  const canApprove = !!me && (me.role==='admin' || (cfg.approverRole==='legal' && me.role==='legal'));
  const approverLabel = cfg.approverRole==='legal' ? 'an Admin or Legal approver' : 'an Admin';
  return { required, ok: !required || !!c.approval, threshold:Number(cfg.threshold),
    by:c.approval?.by, approverLabel, canApprove };
}
function approveContract(c){
  if(!approvalState(c).canApprove){ toast('You do not have approver rights','err'); return; }
  const u=currentUser();
  c.approval={ by:u.name, byId:u.id, role:ROLE_LABEL[u.role], at:nowISO() };
  logAudit(c,'Approved',`Approved for signing by ${u.name} (${ROLE_LABEL[u.role]})`);
  persist(c); renderSignButton(c); renderAuditSection(c);
  toast('Contract approved — signing unlocked');
}

/* ---------- workspace / auth ---------- */
const getOrg = () => REMOTE ? REMOTE.org : lsGet(LS.org);
const getUsers = () => REMOTE ? REMOTE.users : (lsGet(LS.users) || []);
const saveUsers = u => lsSet(LS.users, u);
const getSession = () => REMOTE ? (REMOTE.me?{userId:REMOTE.me.id}:null) : lsGet(LS.session);
const userById = id => getUsers().find(u=>u.id===id);
const currentUser = () => REMOTE ? REMOTE.me : (getSession() ? userById(getSession().userId) : null);
const canEdit = () => { const u=currentUser(); return !!u && u.role!=='viewer'; };
const isAdmin = () => currentUser()?.role==='admin';
const ROLE_LABEL = { admin:'Admin', legal:'Legal', viewer:'Viewer' };

const newSalt = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const hashPassword = (pw,salt) => sha256(`${salt}::${pw}`);

function renderAuth(mode){
  document.getElementById('app-shell').classList.add('hidden');
  const root=document.getElementById('auth-root');
  const shell = inner => `
  <div style="min-height:100vh;display:grid;place-items:center;background:var(--color-bg);padding:40px 16px;">
    <div style="width:100%;max-width:420px;">
      <div style="display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:20px;">
        <div style="width:36px;height:36px;background:var(--color-accent-800);color:#fff;display:grid;place-items:center;font-family:var(--font-mono);font-weight:600;font-size:17px;letter-spacing:.02em;border-radius:4px;">HT</div>
        <div style="line-height:1.15;">
          <div style="font-family:var(--font-mono);font-weight:600;font-size:20px;letter-spacing:.01em;color:var(--color-text);">HaTi</div>
          <div style="font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--color-neutral-600);">Contract Lifecycle</div>
        </div>
      </div>
      <div style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:7px;padding:26px;">${inner}</div>
      <p style="text-align:center;font-size:11px;color:var(--color-neutral-600);margin-top:14px;line-height:1.6;">${REMOTE?'Connected to your HaTi server — accounts and contracts are stored centrally.':'MVP demo — no data leaves this browser.'}</p>
    </div>
  </div>`;
  const input=(id,label,type='text',ph='')=>`
    <label style="display:block;margin-bottom:14px;">
      <span style="display:block;font-size:11.5px;font-weight:600;color:var(--color-neutral-700);margin-bottom:5px;font-family:var(--font-mono);letter-spacing:.02em;">${label}</span>
      <input id="${id}" type="${type}" placeholder="${ph}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 11px;font-size:13px;font-family:var(--font-body);color:var(--color-text);outline:none;"/></label>`;
  const H1='font-family:var(--font-mono);font-weight:600;font-size:22px;letter-spacing:-0.01em;color:var(--color-text);margin:0;';
  const SUB='font-size:12px;color:var(--color-neutral-700);margin:4px 0 18px;line-height:1.5;';
  const PBTN='width:100%;padding:9px;font-size:13px;margin-top:2px;';
  const LINKBTN='margin-top:14px;width:100%;background:none;border:0;font-size:11px;color:var(--color-neutral-600);cursor:pointer;font-family:var(--font-body);';
  if(mode==='setup'){
    root.innerHTML = shell(`
      <h1 style="${H1}">Create your workspace</h1>
      <p style="${SUB}">Set up your organization and the first admin account.</p>
      ${input('su-org','Organization name','text','e.g. Highland Corporate Ltd')}
      ${input('su-name','Your full name','text','e.g. Amina Otieno')}
      ${input('su-email','Work email','email','you@company.co.ke')}
      ${input('su-pass','Password','password','Min 8 characters')}
      <label style="display:flex;align-items:center;gap:10px;font-size:12px;color:var(--color-neutral-700);margin:2px 0 18px;"><input id="su-sample" type="checkbox" checked style="width:16px;height:16px;accent-color:var(--color-accent);"/> Load sample Kenyan FMCG portfolio (30 demo contracts)</label>
      <button id="su-go" class="ui-btn ui-btn-primary" style="${PBTN}">Create workspace &amp; sign in</button>`);
    document.getElementById('su-go').addEventListener('click',doSetup);
    root.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')doSetup();}));
  } else if(mode==='login'){
    root.innerHTML = shell(`
      <h1 style="${H1}">Sign in to ${getOrg()?.name||'your workspace'}</h1>
      <p style="${SUB}">Use your workspace credentials.</p>
      ${input('li-email','Email','email')}
      ${input('li-pass','Password','password')}
      <button id="li-go" class="ui-btn ui-btn-primary" style="${PBTN}">Sign in</button>
      <p id="li-err" class="hidden" style="text-align:center;font-size:12px;color:#b0453c;margin-top:12px;"></p>
      ${REMOTE?`<button id="li-forgot" style="${LINKBTN}">Forgot password?</button>`:''}
      ${REMOTE?'':`<button id="li-reset" style="${LINKBTN}">Reset workspace (erases all local data)</button>`}`);
    document.getElementById('li-go').addEventListener('click',doLogin);
    root.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();}));
    document.getElementById('li-forgot')?.addEventListener('click',()=>renderAuth('forgot'));
    document.getElementById('li-reset')?.addEventListener('click',async()=>{
      if(await confirmDialog({title:'Reset workspace?', message:'This permanently erases the workspace, all users and contracts stored in this browser. This cannot be undone.', confirmLabel:'Erase everything', danger:true})){
        Object.values(LS).forEach(k=>localStorage.removeItem(k)); location.reload();
      }
    });
  } else if(mode==='forgot'){
    root.innerHTML = shell(`
      <h1 style="${H1}">Reset your password</h1>
      <p style="${SUB}">Enter your email and we’ll send a reset link.</p>
      ${input('fp-email','Email','email')}
      <button id="fp-go" class="ui-btn ui-btn-primary" style="${PBTN}">Send reset link</button>
      <div id="fp-result" style="margin-top:12px;"></div>
      <button id="fp-back" style="${LINKBTN}">Back to sign in</button>`);
    document.getElementById('fp-back').addEventListener('click',()=>renderAuth('login'));
    document.getElementById('fp-go').addEventListener('click',async()=>{
      const email=fval('fp-email'); if(!email){ toast('Enter your email','err'); return; }
      try{
        const r=await api('password/reset-request','POST',{ email });
        document.getElementById('fp-result').innerHTML=`<div style="border-radius:4px;background:var(--color-accent-100);border:1px solid var(--color-divider);padding:11px;font-size:11px;color:var(--color-accent-800);line-height:1.5;">If that email is registered, a reset link has been sent.${r.devToken?` <br/>Email isn’t configured yet — <button id="fp-dev" style="text-decoration:underline;font-weight:600;color:var(--color-accent-700);background:none;border:0;cursor:pointer;">open the reset form</button> for testing.`:''}</div>`;
        document.getElementById('fp-dev')?.addEventListener('click',()=>renderAuth('reset:'+r.devToken));
      }catch(e){ toast(e.message,'err'); }
    });
  } else if(mode && mode.startsWith('reset:')){
    const token=mode.slice(6);
    root.innerHTML = shell(`
      <h1 style="${H1}">Set a new password</h1>
      <p style="${SUB}">Choose a new password for your account.</p>
      ${input('rs-pass','New password','password','Min 8 characters')}
      <button id="rs-go" class="ui-btn ui-btn-primary" style="${PBTN}">Save new password</button>
      <p id="rs-err" class="hidden" style="text-align:center;font-size:12px;color:#b0453c;margin-top:12px;"></p>`);
    document.getElementById('rs-go').addEventListener('click',async()=>{
      const pass=document.getElementById('rs-pass').value;
      if(pass.length<8){ toast('Password must be at least 8 characters','err'); return; }
      try{
        await api('password/reset','POST',{ token, password:pass });
        toast('Password updated — please sign in');
        location.hash=''; renderAuth('login');
      }catch(e){ const el=document.getElementById('rs-err'); el.textContent=e.message; el.classList.remove('hidden'); }
    });
  }
}
async function doSetup(){
  const name=fval('su-org'), uname=fval('su-name'), email=fval('su-email').toLowerCase();
  const pass=document.getElementById('su-pass').value;
  if(!name||!uname||!email){ toast('Fill in organization, name and email','err'); return; }
  if(pass.length<8){ toast('Password must be at least 8 characters','err'); return; }
  if(REMOTE){
    try{
      const sample=document.getElementById('su-sample').checked;
      await api('setup','POST',{ org:name, name:uname, email, password:pass,
        data:{ uid, contracts:sample?state.contracts.map(migrateContract):[], view:'dashboard', activeId:null, folderId:null } });
      await loadBootstrap();
      startApp();
      toast(`Workspace "${name}" created — karibu!`);
    }catch(e){ toast(e.message,'err'); }
    return;
  }
  const salt=newSalt();
  const admin={ id:'u1', name:uname, email, role:'admin', salt, hash:await hashPassword(pass,salt), createdAt:nowISO() };
  lsSet(LS.org,{ name, createdAt:nowISO() });
  saveUsers([admin]);
  lsSet(LS.session,{ userId:admin.id, at:nowISO() });
  if(!document.getElementById('su-sample').checked) state.contracts=[];
  persist();
  startApp();
  toast(`Workspace "${name}" created — karibu!`);
}
async function doLogin(){
  const email=fval('li-email').toLowerCase(), pass=document.getElementById('li-pass').value;
  const err=document.getElementById('li-err');
  if(REMOTE){
    try{
      await api('login','POST',{ email, password:pass });
      await loadBootstrap();
      startApp();
      toast(`Karibu tena, ${REMOTE.me.name.split(' ')[0]}`);
    }catch(e){ err.textContent=e.message; err.classList.remove('hidden'); }
    return;
  }
  const u=getUsers().find(x=>x.email===email);
  if(!u || (await hashPassword(pass,u.salt))!==u.hash){ err.textContent='Email or password is incorrect.'; err.classList.remove('hidden'); return; }
  lsSet(LS.session,{ userId:u.id, at:nowISO() });
  startApp();
  toast(`Karibu tena, ${u.name.split(' ')[0]}`);
}
function logout(){
  if(REMOTE){ api('logout','POST').catch(()=>{}).finally(()=>location.reload()); return; }
  localStorage.removeItem(LS.session); location.reload();
}

function startApp(){
  FIRST_PARTY = getOrg().name;
  document.getElementById('auth-root').innerHTML='';
  const shell=document.getElementById('app-shell');
  shell.classList.remove('hidden');   // renderAuth hides the shell; .hidden is !important so the class must go
  shell.style.display='grid';
  renderSideUser(); renderSideFolders();
  window.renderNewMenu&&renderNewMenu();
  window.applyPanelLayout&&applyPanelLayout();
  // resume where the user left off
  setView(['dashboard','register','pipeline','folder','intel','calendar','reports','templates','playbook','workspace','team','migration'].includes(state.view)?state.view:'dashboard');
  if(API_MODE()){ refreshStats(); pollPendingResponses(); setInterval(pollPendingResponses,45000); }
}
function renderSideUser(){
  const u=currentUser(); if(!u) return;
  const org=getOrg().name||'HaTi';
  const initials=(u.name||org).split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const av=document.getElementById('rail-avatar');
  if(av){ av.title=`${u.name} · ${org} · ${ROLE_LABEL[u.role]}`; av.onclick=()=>setView('team'); }
  const setTxt=(id,t)=>{ const el=document.getElementById(id); if(el) el.textContent=t; };
  setTxt('side-avatar', initials);
  setTxt('side-name', u.name||org);
  setTxt('side-role', `${ROLE_LABEL[u.role]||'Member'} · ${org}`);
  const online=(getUsers()||[]).length||1;
  setTxt('side-status', `${API_MODE()?'Server mode · SQLite':'Local mode'} · ${online} online`);
}
// folders/quick-create moved into the Register + New-contract menu; no rail list.
function renderSideFolders(){ /* rail has no folder list in the light-theme redesign */ }

/* ---------- audit trail ---------- */
function logAudit(c, action, detail, actor){
  c.audit = c.audit || [];
  const user = actor || currentUser()?.name || 'System';
  const last = c.audit[c.audit.length-1];
  // coalesce rapid repeats (e.g. keystrokes on the same field) into one entry
  if(last && last.action===action && last.detail===detail && last.user===user
     && (Date.now()-new Date(last.at).getTime())<60000){ last.at=nowISO(); return; }
  c.audit.push({ at:nowISO(), user, action, detail });
}
function renderAuditSection(c){
  const host=document.getElementById('audit-section'); if(!host) return;
  const items=(c.audit||[]).slice().reverse();
  host.innerHTML=`
    <div class="px-5 py-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-brand-500">${icon('history')}</span>
        <h3 class="text-sm font-display font-600 text-brand-900">Audit trail</h3>
        <span class="ml-auto text-[10px] font-mono text-brand-800/60">${items.length} events</span>
      </div>
      <div class="space-y-2 max-h-44 overflow-y-auto scroll-thin pr-1">
        ${items.length?items.map(e=>`
          <div class="flex gap-2 text-[11px] leading-relaxed">
            <span class="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-300 shrink-0"></span>
            <span class="min-w-0"><span class="font-medium text-brand-900">${e.action}</span>
              <span class="text-brand-800/70"> — ${e.detail}</span>
              <span class="block text-[10px] text-brand-800/60 font-mono">${e.user} · ${fmtDT(e.at)}</span></span>
          </div>`).join(''):`<div class="text-[11px] text-brand-800/65">No events recorded yet.</div>`}
      </div>
    </div>`;
}

/* ---------- negotiation rounds ---------- */
function renderNegotiationSection(c){
  const host=document.getElementById('nego-section'); if(!host) return;
  const rounds=c.rounds||[];
  if(!rounds.length){ host.innerHTML=''; return; }
  const open=rounds.filter(r=>r.status==='open').length;
  host.innerHTML=`
    <div class="px-5 py-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-gold-500">${icon('history')}</span>
        <h3 class="text-sm font-display font-600 text-brand-900">Negotiation</h3>
        ${open?`<span class="ml-auto inline-flex items-center gap-1 rounded-full border border-gold-500/25 bg-gold-500/10 text-gold-600 px-2 py-0.5 text-[10px] font-medium">${open} open</span>`:`<span class="ml-auto text-[10px] font-mono text-brand-800/60">${rounds.length} round${rounds.length===1?'':'s'}</span>`}
      </div>
      <div class="space-y-2">
        ${rounds.slice().reverse().map(r=>`
          <div class="rounded-lg border ${r.status==='open'?'border-gold-500/30 bg-gold-500/5':'border-brand-100 bg-white'} p-3">
            <div class="flex items-center gap-2 text-[11px] mb-1">
              <span class="font-semibold text-brand-900">Round ${r.n} — changes requested</span>
              <span class="ml-auto text-brand-800/60 font-mono">${fmtDT(r.at)}</span>
            </div>
            <div class="text-[11px] text-brand-800/65 mb-1">by ${r.by}</div>
            <p class="text-xs text-brand-800/80 leading-relaxed">${(r.comment||'').replace(/</g,'&lt;')}</p>
            ${r.proposedText?`<div class="mt-1.5 text-[11px] inline-flex items-center gap-1 rounded-full bg-gold-500/12 text-gold-600 px-2 py-0.5 font-600">${icon('history','w-3 h-3')} proposed edits (redline)</div>`:''}
            ${r.proposedValue!=null?`<div class="mt-1.5 text-[11px]"><span class="text-brand-800/70">Proposed value:</span> <span class="font-mono font-semibold text-brand-900">${fmtKES(r.proposedValue)}</span></div>`:''}
            ${r.status==='open'?(canEdit()?`
              <div class="mt-2 flex items-center gap-2">
                ${r.proposedText?`<button data-nego-redline="${r.n}" class="flex items-center gap-1 rounded-lg bg-brand-900 text-white px-3 py-1.5 text-[11px] font-medium hover:bg-brand-800 transition">${icon('history','w-3 h-3')} Review redline</button>
                <button data-nego-reject="${r.n}" class="rounded-lg border border-brand-200 text-brand-700 px-3 py-1.5 text-[11px] font-medium hover:bg-brand-50 transition">Reject</button>`
                :`<button data-nego-accept="${r.n}" class="flex items-center gap-1 rounded-lg bg-brand-900 text-white px-3 py-1.5 text-[11px] font-medium hover:bg-brand-800 transition">${icon('check2','w-3 h-3')} Accept${r.proposedValue!=null?' & apply value':''}</button>
                <button data-nego-reject="${r.n}" class="rounded-lg border border-brand-200 text-brand-700 px-3 py-1.5 text-[11px] font-medium hover:bg-brand-50 transition">Reject</button>`}
              </div>`:`<div class="mt-2 text-[11px] text-brand-800/65">Awaiting an approver to resolve.</div>`)
            :`<div class="mt-1.5 text-[11px] font-medium ${r.resolution?.decision==='accepted'?'text-brand-600':'text-rose-600'}">${r.resolution?.decision==='accepted'?'Accepted':'Rejected'} by ${r.resolution?.by||'—'} · ${r.resolution?fmtDT(r.resolution.at):''}</div>`}
          </div>`).join('')}
      </div>
      <p class="mt-2 text-[10px] text-brand-800/60">After resolving, re-share the updated document to send the next round.</p>
    </div>`;
  host.querySelectorAll('[data-nego-accept]').forEach(b=>b.addEventListener('click',()=>resolveRound(c,Number(b.getAttribute('data-nego-accept')),true)));
  host.querySelectorAll('[data-nego-redline]').forEach(b=>b.addEventListener('click',()=>reviewProposedRound(c,Number(b.getAttribute('data-nego-redline')))));
  host.querySelectorAll('[data-nego-reject]').forEach(b=>b.addEventListener('click',()=>resolveRound(c,Number(b.getAttribute('data-nego-reject')),false)));
}
function resolveRound(c, n, accept){
  if(!canEdit()){ toast('Viewers cannot resolve negotiation rounds','err'); return; }
  const r=(c.rounds||[]).find(x=>x.n===n); if(!r||r.status!=='open') return;
  const u=currentUser();
  r.status='closed'; r.resolution={ decision:accept?'accepted':'rejected', by:u.name, at:nowISO() };
  if(accept && r.proposedValue!=null){
    c.value=Number(r.proposedValue);
    c.approval=null; c.approvalChain=null; // value changed — prior approvals are void, rebuild the chain
  }
  logAudit(c,'Negotiation',`Round ${n} ${accept?'accepted':'rejected'} by ${u.name}${accept&&r.proposedValue!=null?` — value set to KES ${Number(r.proposedValue).toLocaleString('en-KE')}`:''}`);
  persist(c); renderWorkspace();
  toast(`Round ${n} ${accept?'accepted':'rejected'}`);
}

/* ---------- modal helper ---------- */
function openModal(html, opts={}){
  const root=document.getElementById('modal-root');
  const maxw=opts.maxWidth||'32rem';
  root.innerHTML=`
  <div style="position:fixed;inset:0;z-index:70;display:grid;place-items:center;padding:16px">
    <div id="modal-scrim" style="position:absolute;inset:0;background:color-mix(in srgb,#2b2b2d 50%,transparent);"></div>
    <div class="modal-in scroll-thin" style="position:relative;width:100%;max-width:${maxw};max-height:88vh;overflow-y:auto;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:7px;">${html}</div>
  </div>`;
  document.getElementById('modal-scrim').addEventListener('click',closeModal);
  return root;
}
function closeModal(){ document.getElementById('modal-root').innerHTML=''; }

/* Styled confirm — a branded replacement for the native window.confirm().
   Returns a Promise<boolean>. Self-contained overlay (appended to <body>) so it
   never clobbers an open modal in #modal-root. Usage:
     if(!await confirmDialog({title, message})) return; */
function confirmDialog(opts={}){
  const title=opts.title||'Are you sure?';
  const message=opts.message||'';
  const confirmLabel=opts.confirmLabel||'Confirm';
  const cancelLabel=opts.cancelLabel||'Cancel';
  const danger=!!opts.danger;
  const esc=s=>String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  return new Promise(resolve=>{
    const prev=document.getElementById('confirm-overlay'); if(prev) prev.remove();
    const ov=document.createElement('div');
    ov.id='confirm-overlay';
    ov.style.cssText='position:fixed;inset:0;z-index:90;display:grid;place-items:center;padding:16px';
    const btnFg=danger?'#fff':'#fff';
    const btnBg=danger?'var(--danger)':'var(--color-accent)';
    ov.innerHTML=`
      <div style="position:absolute;inset:0;background:color-mix(in srgb,#2b2b2d 50%,transparent)"></div>
      <div class="modal-in" role="alertdialog" aria-modal="true" style="position:relative;width:100%;max-width:30rem;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:7px;padding:22px 24px">
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:${message?'6px':'14px'}">
          <span style="width:34px;height:34px;flex:none;display:grid;place-items:center;border-radius:6px;background:${danger?'var(--red-tint,rgba(176,69,60,.1))':'var(--color-accent-100)'};color:${danger?'var(--danger)':'var(--color-accent-700)'}">${icon(danger?'alert':'shield','w-4 h-4')}</span>
          <h3 style="font-family:var(--font-heading);font-weight:600;font-size:17px;margin:0;line-height:1.3;padding-top:5px">${esc(title)}</h3>
        </div>
        ${message?`<p style="font-size:13px;color:var(--color-neutral-700);line-height:1.55;margin:0 0 16px;padding-left:46px">${esc(message)}</p>`:''}
        <div style="display:flex;justify-content:flex-end;gap:8px">
          <button id="cf-cancel" class="ui-btn">${esc(cancelLabel)}</button>
          <button id="cf-ok" class="ui-btn" style="background:${btnBg};border-color:${btnBg};color:${btnFg}">${esc(confirmLabel)}</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const done=val=>{ ov.remove(); document.removeEventListener('keydown',onKey); resolve(val); };
    function onKey(e){ if(e.key==='Escape') done(false); else if(e.key==='Enter') done(true); }
    document.addEventListener('keydown',onKey);
    ov.querySelector('#cf-cancel').addEventListener('click',()=>done(false));
    ov.querySelector('#cf-ok').addEventListener('click',()=>done(true));
    ov.addEventListener('click',e=>{ if(e.target===ov||e.target===ov.firstElementChild) done(false); });
    ov.querySelector('#cf-ok').focus();
  });
}

/* ---------- document sealing ----------
   For a generated contract the seal covers the field values; for an uploaded
   ("inbound") document it covers the file's own hash, so the seal proves
   exactly which file you signed. */
// Used only for the share-link doc fingerprint (change detection).
const canonicalDoc = c => isUpload(c)
  ? JSON.stringify({ id:c.id, source:'upload', fileName:c.upload?.fileName, fileHash:c.upload?.fileHash,
      firstParty:FIRST_PARTY, counterparty:c.counterparty, value:c.value })
  : JSON.stringify({ id:c.id, template:c.template, name:c.name,
      firstParty:FIRST_PARTY, counterparty:c.counterparty, value:c.value, valueType:c.valueType, fields:c.fields });

/* Evidence-grade sealing:
   at signature we FREEZE the fully-rendered contract text (values baked in),
   hash that exact text, and from then on the workspace renders the frozen
   copy — so what was sealed is always what is shown. The seal binds the
   frozen text (or, for uploads, the file bytes) to the parties and value. */
function freezeContractHtml(c){
  // E2: if an accepted redline replaced the drafted text, seal that exact text.
  if(c.redlineText){
    const d=document.createElement('div');
    d.innerHTML=`<div class="text-[13.5px] leading-[1.9] text-brand-800/85 whitespace-pre-wrap" data-anchor="redline">${String(c.redlineText).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}</div>`;
    return d.innerHTML;
  }
  const tmp=document.createElement('div');
  tmp.innerHTML=docBody(c);
  tmp.querySelectorAll('.seal-in,[data-anchor="sig"]').forEach(el=>el.remove());
  tmp.querySelectorAll('input,textarea').forEach(inp=>{
    const s=document.createElement('span');
    s.className='font-mono font-semibold text-brand-900';
    s.textContent=(inp.value||'').trim()||'—';
    inp.replaceWith(s);
  });
  return tmp.innerHTML;
}
const normText = html => { const d=document.createElement('div'); d.innerHTML=html||''; return (d.textContent||'').replace(/\s+/g,' ').trim(); };
function sealString(c){
  const content = isUpload(c) ? 'file:'+(c.upload?.fileHash||'') : 'text:'+(c.execution?.textHash||'');
  return JSON.stringify({ id:c.id, firstParty:FIRST_PARTY, counterparty:c.counterparty,
    value:c.value, valueType:c.valueType, content, signedAt:c.execution?.at||'' });
}

async function verifySeal(c){
  if(!c.hash){ toast('Document is not sealed yet','err'); return; }
  if(c.hash==='PRE-SEEDED'){ toast('Sample contract — sealed before evidence hashing existed','err'); return; }
  if(c.hash==='MIGRATED'){ toast(`Migrated contract — executed outside HaTi. The uploaded file's own SHA-256 (${(c.upload?.fileHash||'').slice(0,16)}…) is the evidence of record`); return; }
  if(!isUpload(c)){
    if(!c.execution?.html){ toast('No frozen snapshot on this record','err'); return; }
    const th=await sha256(normText(c.execution.html));
    if(th!==c.execution.textHash){ toast('Seal MISMATCH — the sealed text was altered','err'); return; }
  }
  const h=await sha256(sealString(c));
  if(h===c.hash) toast(isUpload(c)?'Seal valid — file and parties are intact':'Seal valid — sealed text, parties and value are intact');
  else toast('Seal MISMATCH — the record changed after signing','err');
}
function downloadFile(name, content, type='application/json'){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([content],{type}));
  a.download=name; a.click(); URL.revokeObjectURL(a.href);
}
function downloadEvidence(c){
  downloadFile(`${c.id}-evidence-pack.json`, JSON.stringify({
    generatedAt:nowISO(), platform:'HaTi CLM', org:FIRST_PARTY,
    legalBasis:'Electronic signature under the Business Laws (Amendment) Act 2020 (Kenya).',
    disclosure:'Government IPRS identity verification and CAK-accredited PKI signatures are not yet integrated.',
    contract:{ id:c.id, name:c.name, type:cKind(c), counterparty:c.counterparty,
      value:c.value, valueType:c.valueType, status:c.status },
    seal:{ sha256:c.hash, signedAt:c.signedAt,
      sealedTextSha256:c.execution?.textHash||null,
      sealedFileSha256:isUpload(c)?(c.upload?.fileHash||null):null,
      sealedText:isUpload(c)?null:normText(c.execution?.html||''),
      uploadedFile:isUpload(c)?{ name:c.upload?.fileName, size:c.upload?.size }:null },
    signatures:(c.signatures||[]).map(s=>({ party:s.party, name:s.name, email:s.email||null,
      method:s.method||null, ip:s.ip||null, userAgent:s.ua||null, at:s.at })),
    auditTrail:c.audit||[],
  },null,2));
  logAudit(c,'Exported','Evidence pack downloaded'); persist(c); renderAuditSection(c);
  toast('Evidence pack downloaded');
}

/* ---------- counterparty share links ---------- */
const b64e = obj => btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64d = str => { try{ return JSON.parse(decodeURIComponent(escape(atob(String(str).trim().replace(/-/g,'+').replace(/_/g,'/'))))); }catch(e){ return null; } };

async function openShareModal(c){
  // An uploaded document carries its file; that only fits through the server,
  // so static mode points the user at the original instead of a giant URL.
  if(isUpload(c) && !API_MODE()){
    toast('To share an uploaded document, run the HaTi server — or send the original file directly','err');
    return;
  }
  const docHash=await sha256(canonicalDoc(c));
  // E2: snapshot the exact text being sent so a returned redline diffs cleanly.
  if(c.status!=='Signed'){ const v=captureVersion(c,'Shared for review'); if(v) persist(c); }
  const payloadObj={ v:1, kind:'hati-share', org:FIRST_PARTY, sharedBy:currentUser().name, at:nowISO(), docHash,
    contract:{ id:c.id, name:c.name, template:c.template, source:c.source||null, upload:isUpload(c)?c.upload:undefined,
      counterparty:c.counterparty, value:c.value, valueType:c.valueType, fields:c.fields, folder:c.folder, redlineText:c.redlineText||undefined } };
  let link;
  if(API_MODE()){
    try{ const r=await api('shares','POST',{ payload:payloadObj });
      link=location.origin+location.pathname+'#share=t:'+r.token;
    }catch(e){ toast(e.message,'err'); return; }
  } else link=location.href.split('#')[0]+'#share='+b64e(payloadObj);
  openModal(`
    <div style="padding:22px 24px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="display:inline-flex;color:var(--color-accent);">${icon('share')}</span>
        <h2 style="font-family:var(--font-heading);font-weight:600;font-size:18px;color:var(--color-text);margin:0;">Share with counterparty</h2></div>
      <p style="font-size:12px;color:var(--color-neutral-700);margin:0 0 14px;line-height:1.55;">Send this secure link to ${c.counterparty||'the counterparty'}. They can review the document and respond — <strong>no account needed</strong>. ${API_MODE()?'Their signature or comments arrive on this contract automatically.':'Their response comes back as a code you import below the document.'}</p>
      <textarea id="share-link" readonly rows="4" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:11px;font-size:11px;font-family:var(--font-mono);color:var(--color-text);outline:none;word-break:break-all;">${link}</textarea>
      <div style="margin-top:14px;display:flex;align-items:center;gap:8px;justify-content:flex-end;">
        <button id="share-close" class="ui-btn">Close</button>
        <button id="share-copy" class="ui-btn ui-btn-primary">${icon('copy','w-3.5 h-3.5')} Copy link</button>
      </div>
    </div>`);
  document.getElementById('share-close').addEventListener('click',closeModal);
  document.getElementById('share-copy').addEventListener('click',async()=>{
    const ta=document.getElementById('share-link'); ta.select();
    try{ await navigator.clipboard.writeText(ta.value); }catch(e){ document.execCommand('copy'); }
    toast('Share link copied to clipboard');
  });
  logAudit(c,'Shared',`Review link generated for ${c.counterparty||'counterparty'}`);
  persist(c); renderAuditSection(c);
}

function openImportModal(c){
  openModal(`
    <div style="padding:22px 24px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="display:inline-flex;color:var(--color-accent);">${icon('upload')}</span>
        <h2 style="font-family:var(--font-heading);font-weight:600;font-size:18px;color:var(--color-text);margin:0;">Import counterparty response</h2></div>
      <p style="font-size:12px;color:var(--color-neutral-700);margin:0 0 12px;line-height:1.55;">Paste the response code the counterparty sent back after opening your share link.</p>
      <textarea id="imp-code" rows="5" placeholder="Paste response code…" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:11px;font-size:11px;font-family:var(--font-mono);color:var(--color-text);outline:none;"></textarea>
      <div style="margin-top:14px;display:flex;align-items:center;gap:8px;justify-content:flex-end;">
        <button id="imp-cancel" class="ui-btn">Cancel</button>
        <button id="imp-go" class="ui-btn ui-btn-primary">Import</button>
      </div>
    </div>`);
  document.getElementById('imp-cancel').addEventListener('click',closeModal);
  document.getElementById('imp-go').addEventListener('click',async()=>{
    const ok=await applyResponse(c, b64d(fval('imp-code')));
    if(ok) closeModal();
  });
}
async function applyResponse(c, r, opts={}){
  if(!r || r.kind!=='hati-response'){ if(!opts.background) toast('That code is not a valid HaTi response','err'); return false; }
  if(r.id!==c.id){ toast(`This response is for ${r.id}, not ${c.id}`,'err'); return false; }
  const currentHash=await sha256(canonicalDoc(c));
  if(r.docHash && r.docHash!==currentHash && r.docHash!==c.hash)
    toast('Note: the document changed after this share link was created','err');
  const who=r.name+(r.title?', '+r.title:'');
  if(r.action==='sign'){
    c.signatures=c.signatures||[];
    c.signatures.push({ party:'counterparty', name:r.name, title:r.title||'', email:r.email||'', at:r.at,
      method:r.method||'share-link', ip:r.ip||null, docHash:r.docHash });
    c.comments.push({ author:r.name, role:'Counterparty — Signed', side:'external', text:r.comment||'Approved and signed via secure share link.', ts:fmtDT(r.at) });
    logAudit(c,'Countersigned',`${who} signed via share link (${r.method||'share-link'})`);
    toast(`${r.name} has signed — countersignature recorded`);
  } else if(r.action==='changes'){
    c.comments.push({ author:r.name, role:'Counterparty — Changes requested', side:'external', text:r.comment, ts:fmtDT(r.at) });
    c.rounds=c.rounds||[];
    // E2: a change request may carry proposed edited text (a redline). Capture
    // the base text it was edited from so the owner can review a clean diff.
    const hasRedline = typeof r.proposedText==='string' && r.proposedText.trim().length>0;
    c.rounds.push({ n:c.rounds.length+1, at:r.at, by:who, comment:r.comment,
      proposedValue:(r.proposedValue!=null&&r.proposedValue!=='')?Number(r.proposedValue):null,
      proposedText: hasRedline ? r.proposedText : null,
      baseText: hasRedline ? (r.baseText || docPlainText(c)) : null,
      status:'open', resolution:null });
    logAudit(c,'Changes requested',`${who} requested changes${hasRedline?' with proposed edits (redline)':''}${r.proposedValue?` (proposed value KES ${Number(r.proposedValue).toLocaleString('en-KE')})`:''}`);
    toast(`${r.name} requested changes — review in Negotiation`);
  } else if(r.action==='decline'){
    c.status='Declined';
    c.comments.push({ author:r.name, role:'Counterparty — Declined', side:'external', text:r.comment, ts:fmtDT(r.at) });
    logAudit(c,'Declined',`${who} declined via share link`);
    toast(`${r.name} declined the agreement`,'err');
  } else { if(!opts.background) toast('Unknown response type','err'); return false; }
  c.lastAction=todayStr(); persist(c);
  if(opts.background) setView(state.view||'dashboard'); else renderWorkspace();
  return true;
}

/* poll the server for counterparty responses and apply them */
async function pollPendingResponses(){
  if(!API_MODE() || !canEdit()) return;
  try{
    const list=await api('shares/pending');
    for(const item of list){
      const c=getContract(item.response?.id);
      if(!c) continue;
      const ok=await applyResponse(c, item.response, {background:true});
      if(ok) await api('shares/'+item.token+'/applied','POST');
    }
  }catch(e){ /* transient network issues — next poll retries */ }
}

Object.assign(window,{DEFAULT_APPROVAL,ROLE_LABEL,applyResponse,approvalState,approveContract,b64d,b64e,canEdit,canonicalDoc,closeModal,confirmDialog,currentUser,dirty,doLogin,doSetup,downloadEvidence,downloadFile,ensureFull,flushSaves,fmtDT,freezeContractHtml,fval,getApprovalCfg,getOrg,getSession,getUsers,hashPassword,hydrate,isAdmin,logAudit,logout,migrateContract,newSalt,normText,nowISO,openImportModal,openModal,openShareModal,persist,pollPendingResponses,renderAuditSection,renderAuth,renderNegotiationSection,renderSideFolders,renderSideUser,resolveRound,saveContract,saveSettings,saveTimer,saveUsers,sealString,startApp,todayStr,userById,verifySeal});
