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
/* Migrated paper: signed elsewhere before it was filed here, so HaTi never took
   a signature for it. Its seal is the string 'MIGRATED' and the evidence of
   record is the uploaded file's own SHA-256 (see verifySeal / sealString). */
const isExternallyExecuted = c => !!c && (c.hash==='MIGRATED' || !!(c.migration&&c.migration.executedOutside));
const cIcon = c => isUpload(c) ? 'upload' : (TEMPLATES[c.template]?.ic || 'file');
const cKind = c => isUpload(c) ? 'External Document' : (TEMPLATES[c.template]?.kind || 'Contract');
// Card / row identity: the counterparty (the named party) is the headline so a
// contract is easy to pick out at a glance; the contract name/category is the
// supporting line. Drafts with no party yet fall back to the contract name as
// the headline rather than leading with an empty placeholder.
const cParty = c => (c && c.counterparty && c.counterparty.trim()) ? c.counterparty.trim() : '';
// These two are interpolated straight into markup by the register, the Queue
// board, the calendar and the cards, so they escape at the source — a contract
// name is user-controlled (a colleague types it, and on a migrated contract it
// comes from the uploaded file's name), and one unescaped call site is enough.
const cPrimary = c => esc(cParty(c) || (c && c.name) || '');
const cSecondary = c => cParty(c) ? esc(c.name) : 'No counterparty yet';
/* File-size ceiling. Two regimes, because the bytes land in different places:
   in LOCAL/static mode the file is stored inline in localStorage (quota
   ~5-10 MB total), so 4 MB is the honest limit; in SERVER mode the bytes go
   to the files store, and the only ceiling is the server's 15 MB JSON body
   limit — base64 inflates by 4/3, so a 10 MB file (~13.4 MB encoded) is the
   largest that reliably fits. Real Word contracts carry letterheads and
   logos and routinely pass 4 MB, which is what forced the split. */
const UPLOAD_MAX = 4*1024*1024;        // local/static mode
const UPLOAD_MAX_API = 10*1024*1024;   // server mode
const uploadMax = () => (typeof API_MODE==='function' && API_MODE()) ? UPLOAD_MAX_API : UPLOAD_MAX;
const uploadMaxLabel = () => uploadMax()===UPLOAD_MAX_API ? '10 MB' : '4 MB';
const uploadTooBigMsg = f => `“${f.name}” is ${(f.size/1048576).toFixed(1)} MB — the limit is ${uploadMaxLabel()}. In Word: Picture Tools → Compress Pictures shrinks embedded logos/scans, or split the document.`;
/* How much extracted text a contract keeps. The old 40k cap cut a long
   agreement off around page 10 — exactly where the renewal, termination and
   notice clauses live — so the whole document is kept and buildExtractionPayload()
   decides what actually goes to the AI. */
const EXTRACT_MAX_CHARS = 200000;

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
// Pill status chip: wash bg + tone fg, 999px radius. No inner dot — the chip's
// own colour carries the stage; the separate share dot (shareDot) sits outside
// the chip so the two signals never read as one confusing double dot.
const statusChip = s => { const m=STATUS_META[s]||STATUS_META.Draft;
  return `<span class="badge" style="background:${m.bg};color:${m.tx}">${m.label}</span>`; };

// ---- Share dispatch traffic lights ----
// A share (one recipient's tracked link) moves sent → opened → signed /
// changes / declined; expired and revoked are dead ends. State is derived
// server-side; these chips only render it. Distinct from STATUS_META — a
// contract can be In Review while its shares are in several of these states.
const SHARE_META = {
  sent:    {label:'Sent',      dot:'#98989b', bg:'#eceae6', tx:'#5d5d60'},
  opened:  {label:'Opened',    dot:'#5980a6', bg:'#e7edf3', tx:'#3f5f7d'},
  changes: {label:'Changes',   dot:'#b8862b', bg:'#fbf4e3', tx:'#7d5a14'},
  accepted:{label:'Accepted',  dot:'#2e8763', bg:'#e8f4ee', tx:'#1e6b4d'},
  signed:  {label:'Signed',    dot:'#2e8763', bg:'#e8f4ee', tx:'#1e6b4d'},
  declined:{label:'Declined',  dot:'#b0453c', bg:'#fdece9', tx:'#8f322b'},
  expired: {label:'Expired',   dot:'#a8a8ab', bg:'#f2f1ee', tx:'#8a8a8d'},
  revoked: {label:'Revoked',   dot:'#a8a8ab', bg:'#f2f1ee', tx:'#8a8a8d'},
};
const shareChip = st => { const m=SHARE_META[st]||SHARE_META.sent;
  return `<span class="badge" style="background:${m.bg};color:${m.tx}"><span class="dot" style="background:${m.dot}"></span>${m.label}</span>`; };
// traffic-light dot for dense tables — the tooltip carries the label. This is
// the contract's dispatch status (sent → opened → signed); it lives outside the
// stage chip so it reads as a distinct signal.
const shareDot = cid => { const s=state.shareByContract&&state.shareByContract[cid]; if(!s) return '';
  const m=SHARE_META[s.state]||SHARE_META.sent;
  return `<span title="Share: ${m.label}${s.n>1?` · ${s.n} recipients`:''}" style="display:inline-block;width:11px;height:11px;border-radius:50%;background:${m.dot};margin-left:8px;vertical-align:middle;flex:none"></span>`; };

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
  // family-aware: a master agreement whose term was extended by an amendment is
  // not the near-expiry risk its own stale date suggests, and one whose
  // amendment SHORTENED the term is more urgent than the master says.
  const eff=(window.effectiveExpiry?effectiveExpiry(c):null);
  const expiryPressure=(()=>{ if(!eff||c.status==='Declined') return 0;
    const d=(window.daysUntil?daysUntil(eff):null); if(d==null) return 0;
    return d<0?24:d<=30?18:d<=90?9:0; })();
  const open=(window.openFindings?openFindings(c):[]);
  if(open.length){ const w={high:34,med:16,low:7}; return Math.min(98, 22 + expiryPressure + open.reduce((a,f)=>a+(w[f.sev]||8),0)); }
  let h=0; const seed=(c.id||'')+'|'+(c.counterparty||'')+'|'+(c.status||'');
  for(const ch of seed) h=(h*33+ch.charCodeAt(0))>>>0;
  let base = 8 + (h % 70);
  if(c.status==='Declined') base = 62 + (h%36);
  else if(c.status==='Signed') base = Math.min(base, 46);
  return Math.min(98, base + expiryPressure);
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

Object.assign(window,{STATUS_META,SHARE_META,RISK_PAL,STREAM_SHORT,UPLOAD_MAX,UPLOAD_MAX_API,uploadMax,uploadMaxLabel,uploadTooBigMsg,EXTRACT_MAX_CHARS,approvalLabel,cIcon,cKind,cParty,cPrimary,cSecondary,contractRisk,fmtKES,fmtKESshort,folderContracts,generatePseudo,getContract,isMonetary,isUpload,mk,nextId,ownerInitials,riskBand,riskPal,riskChip,seedComments,sha256,shareChip,shareDot,state,statusChip,statusLabel,streamLabel,toast,uid});
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
/* Permanently delete a contract. Restricted to Draft / Under Review — executed
   (signed) and closed records are never destroyed. Returns true if deleted. */
async function deleteContract(id){
  const c=getContract(id); if(!c) return false;
  if(!canEdit()){ toast('Viewers cannot delete contracts','err'); return false; }
  if(c.status!=='Draft' && c.status!=='Under Review'){
    toast('Only draft or in-review contracts can be deleted','err'); return false;
  }
  const label=(c.name||c.id).split(' —')[0];
  if(!await confirmDialog({ title:`Delete “${c.name}”?`,
      message:`This permanently removes ${c.id} and its history from the workspace. This cannot be undone.`,
      confirmLabel:'Delete permanently', danger:true })) return false;
  if(API_MODE()){ try{ await api('contracts/'+id,'DELETE'); }catch(e){ toast('Delete failed: '+e.message,'err'); return false; } }
  const idx=state.contracts.findIndex(x=>x.id===id);
  if(idx>=0) state.contracts.splice(idx,1);
  if(state.activeId===id) state.activeId=null;
  persist();
  if(window.updateSidebarCounts) updateSidebarCounts();
  toast(`${label} deleted`,'err');
  return true;
}
async function flushSaves(){
  const items=[...dirty.values()]; dirty.clear();
  for(const c of items){ await saveContract(c); }
  refreshStats();  // keep portfolio KPIs current after status/value changes
}
async function saveContract(c){
  // A light row is a register summary, not a contract: the server strips audit,
  // comments, execution.html and the upload's extracted text out of every list
  // response. Saving one back writes those holes over the stored record and
  // destroys the history. Back-fill exactly what the list endpoint removed —
  // a merge, not a reload, so the caller's own changes are never discarded.
  if(c._light && !c._loaded){
    try{ await restoreHeavyFields(c); }
    catch(e){ toast(`Could not load ${c.id}'s history before saving — the change was not written`,'err'); return; }
  }
  const payload={...c}; delete payload._light; delete payload._loaded; delete payload._v;
  if(payload.upload && payload.upload.fileId){ payload.upload={...payload.upload, dataUrl:undefined}; }
  // Word-review version files and the rounds that carried them follow the same
  // rule: once the bytes live in the files store, the synced JSON keeps only
  // the reference — a 4 MB base64 blob per round would bloat every save.
  if(payload.upload && Array.isArray(payload.upload.versions))
    payload.upload={ ...payload.upload, versions: payload.upload.versions.map(v=>v&&v.fileId?{...v, dataUrl:undefined}:v) };
  if(Array.isArray(payload.rounds))
    payload.rounds=payload.rounds.map(r=>(r&&r.file&&r.file.fileId)?{...r, file:{...r.file, dataUrl:undefined}}:r);
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
/* The exact inverse of the server's HEAVY() list-row stripper. Restores only
   the fields a summary row is missing and leaves everything the caller has
   already changed alone — so a save that started from a register row keeps its
   edit AND keeps the record's history. Kept beside ensureFull deliberately:
   if HEAVY ever strips another field, both have to change together. */
async function restoreHeavyFields(c){
  if(!API_MODE() || !c || c._loaded) return;
  const full=await api('contracts/'+c.id);
  if(!Array.isArray(c.audit)    || !c.audit.length)    c.audit    = full.audit    || [];
  if(!Array.isArray(c.comments) || !c.comments.length) c.comments = full.comments || [];
  if(c.execution && full.execution && !c.execution.html && full.execution.html)
    c.execution={ ...c.execution, html: full.execution.html };
  if(c.upload && full.upload){
    if(!c.upload.extractedText && full.upload.extractedText) c.upload={ ...c.upload, extractedText: full.upload.extractedText };
    if(!c.upload.dataUrl && full.upload.dataUrl)             c.upload={ ...c.upload, dataUrl: full.upload.dataUrl };
  }
  c._loaded=true; c._light=false;
  if(c._v==null) c._v=full._v;
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

/* ---------- directory & per-member folder access ----------
   Both live in the org-wide appSettings blob, so they persist through
   saveSettings() in server mode (PUT /api/settings) AND local mode (localStorage)
   with no schema change:
     state.settings.directory    = [{ name, email, title }]   (contacts for auto-fill)
     state.settings.folderAccess = { [userId]: '*' | [folderId,…] }  (stream access) */
// A merged people directory: imported contacts PLUS team members (so signer
// fields can auto-fill a name → title + email). Title comes from the contact
// record when an email matches.
function orgDirectory(){
  const dir=(((state.settings||{}).directory)||[]).map(p=>({ name:p.name||'', email:p.email||'', title:p.title||'' }));
  const byEmail={}; dir.forEach(p=>{ const k=(p.email||'').toLowerCase(); if(k) byEmail[k]=p; });
  (getUsers()||[]).forEach(u=>{ const k=(u.email||'').toLowerCase(); if(!k) return;
    if(byEmail[k]){ if(!byEmail[k].title && u.title) byEmail[k].title=u.title; if(!byEmail[k].name) byEmail[k].name=u.name||''; }
    else { const p={ name:u.name||'', email:u.email, title:u.title||'' }; byEmail[k]=p; dir.push(p); } });
  return dir.filter(p=>p.name||p.email);
}
// Look a person up by exact name OR email (case-insensitive) — used to auto-fill.
function directoryLookup(nameOrEmail){
  const q=String(nameOrEmail||'').trim().toLowerCase(); if(!q) return null;
  return orgDirectory().find(p=>(p.name||'').toLowerCase()===q || (p.email||'').toLowerCase()===q)||null;
}
// A user's folder access: '*' = every stream (the default, and always for admins),
// otherwise an array of folder ids they are restricted to.
function userFolderAccess(u){
  u=u||currentUser(); if(!u) return '*'; if(u.role==='admin') return '*';
  const v=(((state.settings||{}).folderAccess)||{})[u.id];
  return (v==null||v==='*'||(Array.isArray(v)&&v.length===0))?'*':v;
}
function canAccessFolder(fid,u){ const a=userFolderAccess(u); return a==='*'||(Array.isArray(a)&&a.includes(fid)); }

/* ---------- signing capacity ----------
   A signature block states the capacity in which someone bound the company —
   "Amina Otieno, Chief Operating Officer". That is their JOB TITLE, and it is
   a different thing from their `role`, which is an Admin/Legal/Viewer
   PERMISSION LEVEL inside the software.

   The two were being confused: the sign path never recorded a title, and the
   signature block filled the gap with the permission level, so a COO who
   happened to be a workspace admin signed as "Admin". A permission level says
   nothing about authority to sign, so a missing title must render as nothing
   at all rather than as the wrong claim.

   Order of preference: the title on the member's own account, then the people
   directory (which may know them from an imported contact list), then empty. */
function signerTitle(u){
  u=u||currentUser(); if(!u) return '';
  if(u.title && String(u.title).trim()) return String(u.title).trim();
  if(typeof directoryLookup==='function'){
    const p=directoryLookup(u.email)||directoryLookup(u.name);
    if(p && p.title && String(p.title).trim()) return String(p.title).trim();
  }
  return '';
}
/* What to print under a signer's name. `title` is the capacity as recorded.
   `role` is the free-text "Title (e.g. CFO)" field on a signing route — but
   signatures taken before this was fixed had the PERMISSION LEVEL written into
   it, so a value that is exactly one of those labels is suppressed rather than
   displayed as a capacity. Display-only: it reads existing records more
   honestly without altering one, which matters because a signature on an
   executed contract is immutable by design. */
const ROLE_LABEL_SET = new Set(['Admin','Legal','Viewer']);
function signatureCapacity(s){
  if(!s) return '';
  const t=String(s.title||'').trim();
  if(t) return t;
  const r=String(s.role||'').trim();
  return (!r || ROLE_LABEL_SET.has(r)) ? '' : r;
}
/* Whether this member may see monetary amounts. The SERVER decides — it strips
   value fields, monetary aggregates and CSV value cells before responding, and
   never puts a figure in an AI prompt for someone without the right. This
   function exists so the interface can stop OFFERING what it will not receive
   (a "sort by value" option that cannot sort, a KPI card that would read KES 0),
   not to do the hiding. In static mode there is no server and no such
   permission, so it answers true and behaviour is unchanged. */
function canViewValues(u){
  u=u||currentUser();
  if(!u) return false;
  if(u.role==='admin') return true;
  return u.canViewValues!==false;
}
/* The Value cell for a browser-built CSV (a selection of register rows). A
   masked record has no `value` at all, and `c.value||0` would write a
   confident "0" into the sheet — a wrong number, not a hidden one. The
   authoritative, whole-register export is GET /api/export/contracts.csv, which
   the server masks the same way. */
const csvValueCell = c => (!isMonetary(c) || !canViewValues()) ? '' : (c.value||0);
Object.assign(window,{orgDirectory,directoryLookup,userFolderAccess,canAccessFolder,canViewValues,csvValueCell,signerTitle,signatureCapacity});

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
      ${input('su-title','Your job title','text','e.g. Chief Operating Officer')}
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
/* The email is the sign-in name AND the password-reset route, so a typo here
   is not a cosmetic problem — there is no second admin yet to fix it with. */
const validEmail = e => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(String(e||'').trim());
async function doSetup(){
  const name=fval('su-org').trim(), uname=fval('su-name').trim(), email=fval('su-email').trim().toLowerCase();
  const utitle=fval('su-title').trim();
  const pass=document.getElementById('su-pass').value;
  if(!name){ toast('Enter your organization name','err'); return; }
  if(!uname){ toast('Enter your full name','err'); return; }
  if(!validEmail(email)){ toast('Enter a valid work email — it is your sign-in and your password-reset route','err'); return; }
  if(pass.length<8){ toast('Password must be at least 8 characters','err'); return; }
  if(REMOTE){
    try{
      const sample=document.getElementById('su-sample').checked;
      await api('setup','POST',{ org:name, name:uname, title:utitle, email, password:pass,
        data:{ uid, contracts:sample?state.contracts.map(migrateContract):[], view:'dashboard', activeId:null, folderId:null } });
      await loadBootstrap();
      startApp();
      toast(`Workspace "${name}" created — karibu!`);
    }catch(e){ toast(e.message,'err'); }
    return;
  }
  const salt=newSalt();
  const admin={ id:'u1', name:uname, email, role:'admin', title:utitle, salt, hash:await hashPassword(pass,salt), createdAt:nowISO() };
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

/* An account created by an admin starts on a password the admin chose. Until
   the member replaces it, everything they do is attributable to two people —
   which for a signing product means attributable to neither. The server refuses
   their mutating requests; this is the screen that lets them fix it. */
function renderMustChangePassword(){
  const authRoot=document.getElementById('auth-root');
  const shell=document.getElementById('app-shell');
  shell.classList.add('hidden'); shell.style.display='none';
  const F='width:100%;min-height:38px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:8px 11px;font-size:13px;font-family:var(--font-body);color:var(--color-text);outline:none;margin-bottom:10px;';
  authRoot.innerHTML=`
    <div style="min-height:100vh;display:grid;place-items:center;background:var(--color-bg);padding:0 16px;">
      <div style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:7px;padding:30px;max-width:25rem;width:100%;">
        <h1 style="font-family:var(--font-heading);font-weight:600;font-size:20px;color:var(--color-text);margin:0 0 6px;">Choose your own password</h1>
        <p style="font-size:12.5px;color:var(--color-neutral-700);margin:0 0 16px;line-height:1.55;">Your account was created with a temporary password someone else chose. Set your own before you continue — anything you sign has to be attributable to you alone.</p>
        <input id="cp-current" type="password" placeholder="Temporary password" style="${F}"/>
        <input id="cp-new" type="password" placeholder="New password (min 8 characters)" style="${F}"/>
        <input id="cp-again" type="password" placeholder="Repeat the new password" style="${F}"/>
        <button id="cp-go" class="ui-btn ui-btn-primary" style="width:100%;padding:10px;font-size:14px;">Set my password</button>
        <p id="cp-err" class="hidden" style="text-align:center;font-size:12px;color:#b0453c;margin-top:12px;"></p>
      </div></div>`;
  document.getElementById('cp-go').addEventListener('click',async()=>{
    const cur=document.getElementById('cp-current').value;
    const nw=document.getElementById('cp-new').value;
    const again=document.getElementById('cp-again').value;
    const err=document.getElementById('cp-err');
    const fail=m=>{ err.textContent=m; err.classList.remove('hidden'); };
    if(nw.length<8) return fail('The new password must be at least 8 characters.');
    if(nw!==again) return fail('The two new passwords do not match.');
    try{
      await api('password/change','POST',{ current:cur, password:nw });
      if(REMOTE&&REMOTE.me&&REMOTE.me.prefs) delete REMOTE.me.prefs.mustChangePassword;
      toast('Password updated — karibu');
      startApp();
    }catch(e){ fail(e.message); }
  });
}
function startApp(){
  if(REMOTE && REMOTE.me && REMOTE.me.prefs && REMOTE.me.prefs.mustChangePassword){
    renderMustChangePassword(); return;
  }
  FIRST_PARTY = getOrg().name;
  document.getElementById('auth-root').innerHTML='';
  const shell=document.getElementById('app-shell');
  shell.classList.remove('hidden');   // renderAuth hides the shell; .hidden is !important so the class must go
  shell.style.display='grid';
  renderSideUser(); renderSideFolders();
  window.renderNewMenu&&renderNewMenu();
  window.applyPanelLayout&&applyPanelLayout();
  // resume where the user left off
  window.hydrateAdvice&&hydrateAdvice();   // Advice Desk queue (static mode; server mode loads async below)
  setView(['dashboard','register','pipeline','advice','folder','intel','calendar','reports','templates','playbook','workspace','team','migration'].includes(state.view)?state.view:'dashboard');
  if(API_MODE()){ refreshStats(); refreshShareOverview(); pollPendingResponses(); refreshAiUsage(); setInterval(pollPendingResponses,45000); setInterval(refreshShareOverview,60000); setInterval(refreshAiUsage,30000);
    window.loadAdviceRequests&&loadAdviceRequests().then(()=>{ updateSidebarCounts(); if(state.view==='advice') renderAdviceDesk(); }).catch(()=>{}); }
  repairMigratedSignatories();
}

/* One-time repair. Migration used to stamp the name of whoever ran the import
   into `signatory`, and the signature panel then read that as "Signed by …" —
   putting a person who never signed onto an executed contract. Nothing was
   forged (no signature record was ever created, and the evidence pack lists
   none), but the claim has to come off the record, not just off the screen.
   The condition is self-clearing, so this runs once per affected contract. */
async function repairMigratedSignatories(){
  if(!canEdit()) return;                                  // viewers cannot write
  const todo=state.contracts.filter(c=>isExternallyExecuted(c) && c.signatory);
  if(!todo.length) return;
  for(const c of todo){
    try{
      await ensureFull(c);                                // never save from a light record
      if(!c.signatory) continue;
      const was=c.signatory;
      c.signatory=null;
      logAudit(c,'Corrected',`Removed "${was}" as recorded signatory — this contract was executed outside HaTi and no signature was taken here`);
      persist(c);
    }catch(e){ /* leave it for the next load; the panel already reads honestly */ }
  }
  try{ await flushSaves(); }catch(e){}
  if(state.view==='workspace' && window.renderWorkspace) renderWorkspace();
}
function renderSideUser(){
  const u=currentUser(); if(!u) return;
  const org=getOrg().name||'HaTi';
  const initials=(u.name||org).split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const av=document.getElementById('rail-avatar');
  if(av){ av.title=`${u.name} · ${org} · ${ROLE_LABEL[u.role]}`; av.onclick=()=>setView('team'); }
  const lo=document.getElementById('side-logout');
  if(lo) lo.onclick=async()=>{
    const ok=(typeof confirmDialog==='function')
      ? await confirmDialog({ title:'Log out?', message:`End your session${org?` on ${org}`:''} and return to the sign-in screen?`, confirmLabel:'Log out' })
      : true;
    if(ok) logout();
  };
  const setTxt=(id,t)=>{ const el=document.getElementById(id); if(el) el.textContent=t; };
  setTxt('side-avatar', initials);
  setTxt('side-name', u.name||org);
  setTxt('side-role', `${ROLE_LABEL[u.role]||'Member'} · ${org}`);
  const online=(getUsers()||[]).length||1;
  // Show the storage backend AND whether the AI brain is live, so an entered key
  // is visibly reflected (green ✦ = Claude answering; grey = keyword fallback).
  const aiOn=(typeof copilotAvailable==='function') && copilotAvailable();
  const st=document.getElementById('side-status');
  if(st) st.innerHTML=`${API_MODE()?'Server mode · SQLite':'Local mode'} · <span style="color:${aiOn?'#1e6b4d':'var(--color-neutral-500)'};font-weight:600">${aiOn?'✦ Claude AI':'AI off'}</span> · ${online} online`;
}
// Bottom-left AI meter: today's real Anthropic API calls across the workspace,
// so the owner can watch actual usage and size a per-customer daily limit.
// Server mode only (in Local mode the browser calls Anthropic directly with no
// server tally); the count resets at local midnight (server AI_DAY_TZ).
async function refreshAiUsage(){
  const box=document.getElementById('side-ai-usage'), txt=document.getElementById('side-ai-usage-txt');
  if(!box||!txt) return;
  if(!API_MODE()){ box.style.display='none'; return; }
  box.onclick=()=>setView('team');
  try{
    const u=await api('ai/usage');
    state.aiUsage=u;
    const budget=Number(u.dailySpendLimit||0);
    const spent=Number(u.spend||0);
    const a=u.allowance;
    txt.textContent = a&&a.open
      ? `Onboarding allowance: $${Number(a.spent||0).toFixed(2)}${a.budget>0?' / $'+Number(a.budget).toFixed(2):''}`
      : `AI today: $${spent.toFixed(2)}${budget>0?' / $'+budget.toFixed(2):''} · ${Number(u.count||0).toLocaleString('en-KE')} req`;
    box.style.display='flex';
  }catch(e){ box.style.display='none'; }
}
// folders/quick-create moved into the Register + New-contract menu; no rail list.
function renderSideFolders(){ /* rail has no folder list in the light-theme redesign */ }

/* ---------- audit trail ---------- */
/* Where a signer's IP and device go now that they are off the document face:
   into the audit entry for the signature. Returns a suffix like
   " · IP 41.90.x.x · Chrome", or '' when neither was captured. The full
   user-agent string is kept on the signature record and travels in the
   evidence pack; the audit line names the device family, which is what a
   reader of the trail can actually use. */
function deviceFromUa(ua){
  const s=String(ua||'');
  if(!s) return '';
  if(/mobile|android|iphone|ipad/i.test(s)) return 'Mobile';
  if(/edg\//i.test(s)) return 'Edge';
  if(/chrome|crios/i.test(s)) return 'Chrome';
  if(/firefox/i.test(s)) return 'Firefox';
  if(/safari/i.test(s)) return 'Safari';
  return 'Browser';
}
function signerProvenance(ip, ua){
  const parts=[];
  if(ip) parts.push('IP '+ip);
  const dev=deviceFromUa(ua);
  if(dev) parts.push(dev);
  return parts.length?' · '+parts.join(' · '):'';
}
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
/* Rounds that have been ruled on. The presence of one is what makes "send the
   updated version" meaningful: something was decided, so the wording has moved
   and the other side is owed the new copy. */
const resolvedRounds = c => (c.rounds||[]).filter(r=>r.status!=='open' && r.resolution);

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
              <span class="font-semibold text-brand-900">Round ${r.n} — ${r.via==='word'?'returned Word file':'changes requested'}</span>
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
      ${resolvedRounds(c).length&&canEdit()&&c.status!=='Signed'?`
        <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:10px;border-top:1px solid var(--color-divider);padding-top:10px">
          <span style="flex:1;min-width:140px;font-size:11px;color:var(--color-neutral-700)">Ready for the next round? Send the counterparty the wording as it now reads.</span>
          <button id="nego-reshare" class="ui-btn ui-btn-primary" style="flex:none;font-size:11.5px;padding:6px 12px">${icon('send','w-3.5 h-3.5')} Send updated version</button>
        </div>`
      :`<p class="mt-2 text-[10px] text-brand-800/60">After resolving, re-share the updated document to send the next round.</p>`}
    </div>`;
  document.getElementById('nego-reshare')?.addEventListener('click',async e=>{
    const btn=e.currentTarget, restore=btn.innerHTML;
    btn.disabled=true; btn.innerHTML='<span class="animate-pulse">Sending…</span>';
    try{
      const { recipient }=await reshareToLastRecipient(c);
      toast(`Updated version sent to ${recipient.name||recipient.email||recipient.phone}`);
      renderAuditSection(c); renderSharesSection(c); refreshShareOverview();
    }catch(err){
      // nobody on record to send to — fall back to the full dialog rather than
      // leaving a pressed button that did nothing
      toast(err.message,'err');
      try{ openShareModal(c); }catch(_){}
    }
    btn.disabled=false; btn.innerHTML=restore;
  });
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
  // Given an explicit height the panel becomes a fill-the-window shell: it stops
  // scrolling itself and whatever is inside takes charge of its own overflow.
  const sized=opts.height
    ? `height:${opts.height};overflow:hidden;`
    : `max-height:88vh;overflow-y:auto;`;
  root.innerHTML=`
  <div style="position:fixed;inset:0;z-index:70;display:grid;place-items:center;padding:16px">
    <div id="modal-scrim" style="position:absolute;inset:0;background:color-mix(in srgb,#2b2b2d 50%,transparent);"></div>
    <div class="modal-in scroll-thin" style="position:relative;width:100%;max-width:${maxw};${sized}background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:7px;">${html}</div>
  </div>`;
  document.getElementById('modal-scrim').addEventListener('click',closeModal);
  // Esc closes, exactly like the scrim click — some modals (Compare, share)
  // otherwise strand keyboard users with no visible way out
  document.addEventListener('keydown',function esc(e){
    if(e.key!=='Escape'){ if(!document.getElementById('modal-scrim')) document.removeEventListener('keydown',esc); return; }
    document.removeEventListener('keydown',esc); closeModal();
  });
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

/* Styled prompt — a branded replacement for the native window.prompt().
   Returns a Promise<string|null>; null means cancelled, so an empty string is
   still distinguishable from "no answer". Same overlay contract as
   confirmDialog: appended to <body> at a higher z-index than #modal-root, so it
   stacks over an open modal instead of clobbering it. Usage:
     const name = await promptDialog({title, label, value});
     if(name==null) return; */
function promptDialog(opts={}){
  const title=opts.title||'';
  const message=opts.message||'';
  const label=opts.label||'';
  const placeholder=opts.placeholder||'';
  const confirmLabel=opts.confirmLabel||'OK';
  const cancelLabel=opts.cancelLabel||'Cancel';
  const esc=s=>String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  return new Promise(resolve=>{
    const prev=document.getElementById('prompt-overlay'); if(prev) prev.remove();
    const ov=document.createElement('div');
    ov.id='prompt-overlay';
    ov.style.cssText='position:fixed;inset:0;z-index:92;display:grid;place-items:center;padding:16px';
    ov.innerHTML=`
      <div style="position:absolute;inset:0;background:color-mix(in srgb,#2b2b2d 50%,transparent)"></div>
      <div class="modal-in" role="dialog" aria-modal="true" style="position:relative;width:100%;max-width:30rem;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:7px;padding:22px 24px">
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:${message?'6px':'12px'}">
          <span style="width:34px;height:34px;flex:none;display:grid;place-items:center;border-radius:6px;background:var(--color-accent-100);color:var(--color-accent-700)">${icon('pencil','w-4 h-4')}</span>
          <h3 style="font-family:var(--font-heading);font-weight:600;font-size:17px;margin:0;line-height:1.3;padding-top:5px">${esc(title)}</h3>
        </div>
        ${message?`<p style="font-size:12.5px;color:var(--color-neutral-700);line-height:1.55;margin:0 0 12px;padding-left:46px">${esc(message)}</p>`:''}
        <div style="padding-left:46px">
          ${label?`<label for="pd-input" style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px">${esc(label)}</label>`:''}
          <input id="pd-input" type="text" value="${esc(opts.value).replace(/"/g,'&quot;')}" placeholder="${esc(placeholder).replace(/"/g,'&quot;')}"
                 style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:8px 11px;font:inherit;font-size:13px;outline:none"/>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
            <button id="pd-cancel" class="ui-btn">${esc(cancelLabel)}</button>
            <button id="pd-ok" class="ui-btn ui-btn-primary">${esc(confirmLabel)}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const input=ov.querySelector('#pd-input');
    const done=val=>{ ov.remove(); document.removeEventListener('keydown',onKey,true); resolve(val); };
    function onKey(e){
      if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); done(null); }
      else if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); done(input.value); }
    }
    // capture phase: an open modal behind this one may also listen for Escape
    document.addEventListener('keydown',onKey,true);
    ov.querySelector('#pd-cancel').addEventListener('click',()=>done(null));
    ov.querySelector('#pd-ok').addEventListener('click',()=>done(input.value));
    ov.addEventListener('click',e=>{ if(e.target===ov||e.target===ov.firstElementChild) done(null); });
    input.focus(); input.select();
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
/* A READ-ONLY projection of a contract's document.
   `docBody()` renders a template's terms as <input> elements so the owner can
   complete them in place. Disabling them (PORTAL_MODE) stops the counterparty
   typing, but an <input> still holds its text in a `value` attribute rather
   than in the document — so the moment the document leaves the live browser
   view (copy/paste, print, PDF, any text projection) every commercial term
   silently disappears and the contract reads "made on ___ between X and ___".
   This substitutes each field for the text it holds, exactly as
   freezeContractHtml() does at signing, so what the counterparty reads, copies
   and prints is the same text that will be sealed. An empty field becomes an
   em-dash rather than nothing, so an unfilled term is visible as a gap the
   reader can point at. */
function readOnlyDocHtml(html){
  const tmp=document.createElement('div');
  tmp.innerHTML=String(html||'');
  tmp.querySelectorAll('input,textarea').forEach(inp=>{
    const s=document.createElement('span');
    s.className='field-frozen font-mono font-semibold text-brand-900';
    const v=(inp.value||inp.getAttribute('value')||'').trim();
    s.textContent=v||'—';
    if(!v) s.setAttribute('title','This term was not filled in before the contract was sent');
    inp.replaceWith(s);
  });
  return tmp.innerHTML;
}
function freezeContractHtml(c){
  // E2: if an accepted redline replaced the drafted text, seal that exact text.
  if(c.redlineText){
    // Rich working text freezes as the SANITISED fragment — never the raw
    // stored string. What gets sealed is exactly what the renderer will show.
    if(window.isRich && isRich(c.format)){
      return `<div class="hati-doc" data-anchor="redline">${sanitizeRich(c.redlineText)}</div>`;
    }
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

/* The exact string a frozen document is hashed over. VERSION-GATED, because
   every contract sealed before rich content existed was hashed with normText()
   and must keep verifying against the hash it was given:

     hashMode absent / 'text' → normText(html)      — unchanged, forever
     hashMode 'rich'          → canonicalRich(html) — formatting is part of the
                                                      document, so the seal binds it

   An old record has no hashMode, takes the first branch, and produces a
   byte-identical input to what it produced before this run. Nothing about a
   pre-existing seal moves. (See DESIGN-rich-documents.md.) */
function execHashInput(exec){
  const html=(exec&&exec.html)||'';
  if(exec && exec.hashMode==='rich' && window.canonicalRich) return canonicalRich(html);
  return normText(html);
}
function sealString(c){
  const content = isUpload(c) ? 'file:'+(c.upload?.fileHash||'') : 'text:'+(c.execution?.textHash||'');
  const base={ id:c.id, firstParty:FIRST_PARTY, counterparty:c.counterparty,
    value:c.value, valueType:c.valueType, content, signedAt:c.execution?.at||'' };
  // Seal v2 folds every signature MARK (its hash) into the seal, so the visible
  // signatures are as tamper-evident as the text. v1 (sealVersion unset) keeps
  // the exact original string — so every previously-sealed contract still verifies.
  if(Number(c.sealVersion||0)>=2){
    base.sigs=(c.signatures||[]).map(s=>({ name:s.name||'', at:s.at||'', form:s.form||s.method||'', imageHash:s.imageHash||'' }));
  }
  return JSON.stringify(base);
}

async function verifySeal(c){
  if(!c.hash){ toast('Document is not sealed yet','err'); return; }
  if(c.hash==='PRE-SEEDED'){ toast('Sample contract — sealed before evidence hashing existed','err'); return; }
  if(c.hash==='MIGRATED'){ toast(`Migrated contract — executed outside HaTi. The uploaded file's own SHA-256 (${(c.upload?.fileHash||'').slice(0,16)}…) is the evidence of record`); return; }
  if(!isUpload(c)){
    if(!c.execution?.html){ toast('No frozen snapshot on this record','err'); return; }
    const th=await sha256(execHashInput(c.execution));
    if(th!==c.execution.textHash){ toast('Seal MISMATCH — the sealed text was altered','err'); return; }
  }
  // v2: each stored signature mark must still hash to the value bound at signing.
  if(Number(c.sealVersion||0)>=2){
    for(const s of (c.signatures||[])){
      if(s.image && s.imageHash){ const ih=await sha256(s.image);
        if(ih!==s.imageHash){ toast('Seal MISMATCH — a signature mark was altered','err'); return; } }
    }
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
    // a migrated contract was signed elsewhere — citing the e-signature Act
    // here would claim HaTi took a signature it never took
    legalBasis: isExternallyExecuted(c)
      ? 'Executed outside HaTi and migrated in as a record. No electronic signature was taken in HaTi; the signatures are on the original document.'
      : 'Electronic signature under the Business Laws (Amendment) Act 2020 (Kenya).',
    disclosure:'Government IPRS identity verification and CAK-accredited PKI signatures are not yet integrated.',
    migration: isExternallyExecuted(c)
      ? { filedBy:(c.migration&&c.migration.importedBy)||null, filedAt:(c.migration&&c.migration.importedAt)||null,
          batch:(c.migration&&c.migration.batch)||null,
          note:'Executed on (as recorded) is taken from the migrated record and is not verified by HaTi.' }
      : null,
    contract:{ id:c.id, name:c.name, type:cKind(c), counterparty:c.counterparty,
      value:c.value, valueType:c.valueType, status:c.status },
    seal:{ sha256:c.hash, signedAt:c.signedAt,
      sealedTextSha256:c.execution?.textHash||null,
      sealedFileSha256:isUpload(c)?(c.upload?.fileHash||null):null,
      sealedText:isUpload(c)?null:normText(c.execution?.html||''),
      uploadedFile:isUpload(c)?{ name:c.upload?.fileName, size:c.upload?.size }:null },
    // `capacity` is the whole point of a signature block and was missing from
    // the pack entirely: the document that exists to prove a signature did not
    // say in what capacity anyone signed. Empty means none was recorded — it is
    // never back-filled from a permission level.
    signatures:(c.signatures||[]).map(s=>({ party:s.party, name:s.name, email:s.email||null,
      capacity:signatureCapacity(s)||null,
      method:s.method||null, form:s.form||null, signatureImageSha256:s.imageHash||null, signatureImage:s.image||null,
      ip:s.ip||null, userAgent:s.ua||null, at:s.at })),
    distribution:c.distribution||null,
    auditTrail:c.audit||[],
  },null,2));
  logAudit(c,'Exported','Evidence pack downloaded'); persist(c); renderAuditSection(c);
  toast('Evidence pack downloaded');
}

/* ---------- readiness: is this contract fit to leave the building? ----------
   The workspace already knows when a contract is incomplete — the action bar
   says "Complete key terms" and the Signing panel refuses to enable the button.
   Sharing consulted none of it, so a draft with no price, no dates and unfilled
   placeholders went to the counterparty in silence. This is that same knowledge
   in one place, so the share modal and the sign gate ask the same question.

   Returns [] when the contract is ready. Each problem has a `severity`:
   'block' — must be acknowledged before sending; 'warn' — worth saying. */
const PLACEHOLDER_RE = /\[[A-Z][A-Z0-9 ,.'&\/-]{2,60}\]|\{\{\s*[\w.-]+\s*\}\}|_{4,}/g;
function contractPlaceholders(c){
  if(isUpload(c)) return [];                 // their paper — brackets are theirs
  let text='';
  try{
    // The rendered text projection, so a value typed into a template field
    // counts as filled and only genuinely empty ones are reported.
    const html=(c.status==='Signed'&&c.execution&&c.execution.html)||docBody(c);
    const d=document.createElement('div');
    d.innerHTML=readOnlyDocHtml(html);
    text=d.innerText||'';
  }catch(e){
    text=(typeof c.redlineText==='string'?c.redlineText:'')||'';
  }
  const hits=String(text).match(PLACEHOLDER_RE)||[];
  // an em-dash from readOnlyDocHtml is an unfilled template field, not a
  // placeholder string — counted separately by the key-terms checks below
  return [...new Set(hits.map(h=>h.trim()))].slice(0,12);
}
function contractReadiness(c){
  const p=[];
  if(!c) return p;
  const add=(severity,key,label)=>p.push({ severity, key, label });
  if(!String(c.counterparty||'').trim()) add('block','counterparty','No counterparty is set.');
  if(isMonetary(c) && !(Number(c.value)>0))
    add('block','value','No contract value is set, and this contract type carries one.');
  if(!c.expiry && !(c.fields&&c.fields.expiry) && (c.metadata||{}).renewalType!=='evergreen')
    add('warn','term','No expiry or term end is recorded, so no renewal reminder can be scheduled.');
  if(!c.effectiveDate && !(c.fields&&c.fields.effDate))
    add('warn','effective','No effective date is recorded.');
  const ph=contractPlaceholders(c);
  if(ph.length) add('block','placeholders',
    `The document still contains ${ph.length} unfilled placeholder${ph.length===1?'':'s'}: ${ph.slice(0,5).join(', ')}${ph.length>5?', …':''}`);
  if(c.status==='Draft') add('warn','status','This contract is still a Draft.');
  const sig=(c.signatories||c.signers||[]).filter(s=>s&&(s.name||s.email));
  if(window.SIGN_ROUTE_ON && !sig.length) add('warn','signatory','No named signatory is set on the signature block.');
  return p;
}
const readinessBlocks = c => contractReadiness(c).filter(x=>x.severity==='block');

/* ---------- counterparty share links ---------- */
const b64e = obj => btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64d = str => { try{ return JSON.parse(decodeURIComponent(escape(atob(String(str).trim().replace(/-/g,'+').replace(/_/g,'/'))))); }catch(e){ return null; } };

// Prefilled WhatsApp deep link: opens the sender's own WhatsApp with the
// message ready to send — no Business API needed, and the recipient sees a
// number they recognise. The portal link itself carries the tracking.
const waShareLink=(phone,text)=>'https://wa.me/'+String(phone||'').replace(/[^\d]/g,'')+'?text='+encodeURIComponent(text);
const shareMessageText=(c,link,msg,expiresAt)=>
  `${currentUser().name} at ${FIRST_PARTY} shared "${c.name}" for your review.`
  +(msg?`\n\n${msg}`:'')
  +`\n\nOpen it here — review, sign, request changes or decline, no account needed:\n${link}`
  +(expiresAt?`\n\nThis link expires on ${String(expiresAt).slice(0,10)}.`:'');

/* The warning block at the top of the share modal. Naming what is missing is
   the whole point — "this contract is incomplete" is not actionable, "no value
   is set and the document still says [SUPPLIER CORPORATE NAME]" is. */
function readinessPanelHtml(c){
  const probs=contractReadiness(c);
  if(!probs.length) return '';
  const blocks=probs.filter(x=>x.severity==='block');
  const tone=blocks.length
    ? { bg:'#f9ecea', line:'#e3c4bf', fg:'#8f322b', head:`Not ready to send — ${blocks.length} thing${blocks.length===1?'':'s'} to fix` }
    : { bg:'#fbf4e3', line:'#f0e3c2', fg:'#7d5a14', head:'Worth checking before you send' };
  return `<div id="share-readiness" style="margin:0 0 12px;border:1px solid ${tone.line};background:${tone.bg};border-radius:5px;padding:10px 12px;">
    <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:${tone.fg};margin-bottom:6px;">${icon('alert','w-3.5 h-3.5')} ${tone.head}</div>
    <ul style="margin:0;padding-left:16px;font-size:11.5px;line-height:1.65;color:${tone.fg};">
      ${probs.map(x=>`<li>${esc(x.label)}</li>`).join('')}
    </ul>
    ${blocks.length?`<label style="display:flex;align-items:flex-start;gap:7px;margin-top:9px;font-size:11.5px;color:${tone.fg};cursor:pointer;">
      <input id="sh-ack" type="checkbox" style="margin-top:2px;accent-color:${tone.fg}"/>
      <span>Send it anyway. I understand the counterparty will see the contract exactly as it is above.</span></label>`:''}
  </div>`;
}
/* The allow-list that decides what a counterparty is shown. Everything the
   portal renders has to be in here; anything not in here does not exist as far
   as the other side is concerned. */
const shareDocText = c => { try{ return (typeof docPlainText==='function') ? docPlainText(c) : ''; }catch(_){ return ''; } };
/* The version history a counterparty is entitled to.

   Both sides now read the SAME list — same numbers, same captions, same
   authors — so "look at v3" means one thing to everyone on the deal. Matching
   captions is the point: a counterparty who sees "The paper you sent" while
   the other side sees "v2 · Edited by Young Mbagaya" cannot be talked through
   a negotiation over the phone.

   What still stays behind is drafting that was never sent to anybody. A
   contract worked on internally for a week before it went out has a history
   that is the organisation's own; the counterparty cannot refer to a version
   they never received, so publishing it would serve nothing and reveal
   working. The list therefore starts at whichever comes first: the received
   paper itself, or the first time the contract was shared. */
/* Captions travel as written, with one exception. A playbook insertion is
   labelled with the internal name of the clause and the fallback tier it came
   from — that is the organisation's negotiating position, not a description of
   the document, and naming it to the other side gives away the floor before
   the bargaining starts. */
function safeVersionLabel(label, org){
  const l=String(label||'Saved');
  return /^inserted preferred wording/i.test(l) ? ('Revised by '+(org||'the sender')) : l;
}
function shareVersions(c, org){
  const vs=(c.versions||[]);
  if(!vs.length) return undefined;
  const firstSent=vs.findIndex(v=>/^shared for review/i.test(v.label||''));
  // an inbound contract's first version IS the counterparty's own paper, so it
  // is theirs to see even though it predates any share
  const inbound=!!(c.source==='upload');
  let from = firstSent<0 ? (inbound?0:-1) : firstSent;
  if(inbound && firstSent>0) from=0;
  if(from<0) return undefined;
  const out=vs.slice(from)
    .filter(v=>v&&typeof v.text==='string'&&v.text.trim())
    .slice(-8)
    .map(v=>({ n:v.n, at:v.at, label:safeVersionLabel(v.label, org), by:v.by||null, text:v.text }));
  return out.length?out:undefined;
}
function buildSharePayload(c, docHash, who){
  const org=(who&&who.org)||FIRST_PARTY;
  const sharedBy=(who&&who.sharedBy)||currentUser().name;
  const shareUpload = u => u ? { fileName:u.fileName, size:u.size, mime:u.mime,
    fileHash:u.fileHash, dataUrl:u.dataUrl, extractedText:u.extractedText } : undefined;
  /* The negotiation history, trimmed to what the other side is entitled to
     know: which round, when they raised it, and what was decided. The proposed
     and base texts stay behind — they are bulk, and the current wording below
     already reflects any round that was accepted. The internal name of whoever
     ruled on it stays behind too; the banner speaks for the organisation. */
  const shareRounds = (c.rounds||[]).map(r=>({ n:r.n, at:r.at, by:r.by, status:r.status,
    resolution: r.resolution ? { decision:r.resolution.decision, at:r.resolution.at } : null }));
  // written out longhand, not as shorthand: this list is read as a list
  return { v:1, kind:'hati-share', org:org, sharedBy:sharedBy, at:nowISO(), docHash:docHash,
    contract:{ id:c.id, name:c.name, template:c.template, source:c.source||null,
      upload:isUpload(c)?shareUpload(c.upload):undefined,
      counterparty:c.counterparty, value:c.value, valueType:c.valueType, fields:c.fields,
      rounds:shareRounds.length?shareRounds:undefined,
      /* The wording exactly as it left, in plain text. A template-drafted
         contract has no stored body — it is rendered from the template and its
         fields — so the server could never reconstruct what a given link said.
         Recording it here is what lets the next link tell the same reader what
         moved since the copy they last opened. */
      docText:shareDocText(c)||undefined,
      versions:shareVersions(c, org),
      redlineText:c.redlineText||undefined, format:c.redlineText?docFormat(c.format):undefined } };
}
/* ---- who we last shared this contract with ----
   Six rounds of a negotiation meant six trips through a blank share form,
   retyping the same counterparty's address each time — five or six chances to
   send a live contract to the wrong person, and enough friction to discourage
   a round that was actually needed.

   The server has always stored the recipient on every share row; nothing ever
   read it back. These two are pure functions of that list so they can be
   tested directly, and so "who is this going to?" has exactly one answer.

   Revoked and expired shares still count as evidence of WHO the counterparty
   is: the link died, the person did not. */
function lastShareRecipient(shares){
  const list=(shares||[]).filter(s=>s && (s.recipientEmail||s.recipientPhone||s.recipientName));
  if(!list.length) return null;
  // the shares endpoint returns newest first; sort defensively rather than trust it
  const sorted=list.slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  const s=sorted[0];
  return { name:s.recipientName||'', email:s.recipientEmail||'', phone:s.recipientPhone||'',
    channel:s.channel||'email', token:s.token||null };
}
function shareModalPrefill(shares){
  const last=lastShareRecipient(shares);
  if(!last) return { name:'', email:'', phone:'', channel:'email' };
  return { name:last.name, email:last.email, phone:last.phone, channel:last.channel||'email' };
}
/* The shares this contract has already had, for prefill and for the reshare
   button. Never fatal: a contract that cannot reach the server still shares. */
async function contractShares(c){
  if(!API_MODE()) return [];
  try{ const r=await api('contracts/'+c.id+'/shares'); return r.shares||[]; }
  catch(e){ return []; }
}
/* ---- "Send updated version" ----
   The one-click path a resolved round leads to: same recipient, same channel,
   a fresh link carrying the wording as it now reads. Returns the created share
   so the caller can report the outcome; throws only if there is nobody to send
   to, which the button's own visibility already rules out. */
async function reshareToLastRecipient(c, opts={}){
  if(!canEdit()) throw new Error('Viewers cannot share contracts');
  const shares=opts.shares||await contractShares(c);
  const last=lastShareRecipient(shares);
  if(!last) throw new Error('This contract has not been shared with anyone yet');
  try{ await ensureFull(c); }catch(_){}
  const docHash=await sha256(canonicalDoc(c));
  if(c.status!=='Signed'){ const v=captureVersion(c,'Sent to you'); if(v) persist(c); }
  const payload=buildSharePayload(c, docHash);
  const r=await api('shares','POST',{ payload, channel:last.channel||'email',
    message:opts.message||'', recipient:{ name:last.name, email:last.email, phone:last.phone },
    expiryDays:opts.expiryDays||14, durable:opts.durable!==false });
  logAudit(c,'Shared',`Updated version sent to ${last.name||last.email||last.phone||'the counterparty'} via ${last.channel||'email'}`);
  persist(c);
  return { share:r, recipient:last };
}

async function openShareModal(c){
  // An uploaded document carries its file; that only fits through the server,
  // so static mode points the user at the original instead of a giant URL.
  if(isUpload(c) && !API_MODE()){
    toast('To share an uploaded document, run the HaTi server — or send the original file directly','err');
    return;
  }
  // A share copies the contract out of the building, so it must be copied
  // whole: a record loaded for a list view carries neither its uploaded file's
  // bytes nor its round history, and both are things the payload publishes.
  try{ await ensureFull(c); }catch(_){}
  const docHash=await sha256(canonicalDoc(c));
  // E2: snapshot the exact text being sent so a returned redline diffs cleanly.
  if(c.status!=='Signed'){ const v=captureVersion(c,'Shared for review'); if(v) persist(c); }
  /* THE SHARE PAYLOAD IS A COPY OF THE CONTRACT THAT LEAVES THE BUILDING.
     In server mode it sits in the shares table and is served to anyone holding
     the link; in static mode the whole thing travels inside the URL. Either
     way it is read by a party outside the organisation, so it carries ONLY
     what js/views/portal.js renders or needs to send a response back. Anything
     added here is published — audit it against the portal before adding it.

       id, name, counterparty  — the header and the response envelope
       template, fields        — so a built-in template can be re-rendered
       redlineText, format     — the working text, and the marker without which
                                 a rich document renders as literal markup
       source, upload          — an uploaded document's own file
       value, valueType        — the counter-proposal field ("propose a
                                 different value") and the certificate row
       org, sharedBy, at       — who sent it and when, shown in the header
       docHash                 — echoed in the response so the owner can tell
                                 the document changed after the link was made

     `folder` was in here and is not: which internal value stream a contract is
     filed under is the organisation's own filing structure, and the portal has
     never rendered it — it derives one from the template, falling back to
     'corp'. The upload is trimmed to the file itself; the near-duplicate
     signals (textFingerprint, simhash) and OCR bookkeeping are
     portfolio-analysis data with no meaning to a counterparty.

     Built by buildSharePayload() below rather than inline: the allow-list is the
     thing that decides what a counterparty can be shown, so it needs to be
     reachable by a test. It was inline when the returned-changes banner shipped,
     which is exactly how that banner came to be verified against a payload the
     application never actually produces. */
  const payloadObj=buildSharePayload(c, docHash);
  const server=API_MODE();
  // Who this went to last time. Fetched before the dialog is built so the
  // fields open already filled rather than filling themselves a moment later
  // under the user's cursor.
  const priorShares=await contractShares(c);
  const pre=shareModalPrefill(priorShares);
  const FLD='width:100%;min-height:34px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:6px 10px;font-size:12.5px;font-family:var(--font-body);color:var(--color-text);outline:none;';
  const LBL='display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.02em;';
  const tab=(k,label,active)=>`<button data-share-ch="${k}" style="flex:1;padding:7px 4px;font:inherit;font-size:12px;font-weight:600;cursor:pointer;border:1px solid ${active?'var(--color-accent)':'var(--color-divider)'};background:${active?'var(--color-accent)':'var(--color-surface)'};color:${active?'#fff':'var(--color-neutral-700)'};border-radius:4px">${label}</button>`;
  let ch=pre.channel||'email';
  const attr=s=>String(s==null?'':s).replace(/"/g,'&quot;');
  openModal(`
    <div style="padding:22px 24px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="display:inline-flex;color:var(--color-accent);">${icon('share')}</span>
        <h2 style="font-family:var(--font-heading);font-weight:600;font-size:18px;color:var(--color-text);margin:0;">Share with counterparty</h2></div>
      <p style="font-size:12px;color:var(--color-neutral-700);margin:0 0 12px;line-height:1.55;">Send ${esc(c.counterparty||'the counterparty')} a secure review link — they can review, sign, request changes or decline, <strong>no account needed</strong>. ${server?'Each recipient gets their own tracked link; the outcome arrives on this contract automatically and lands in your email.':'Their response comes back as a code you import below the document.'}</p>
      ${readinessPanelHtml(c)}
      ${server?'':`<div style="margin:0 0 12px;border:1px solid #e3c4bf;background:#f9ecea;border-radius:5px;padding:10px 12px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#8f322b;margin-bottom:5px;">${icon('alert','w-3.5 h-3.5')} Demo sharing — for demonstrations only</div>
        <p style="margin:0;font-size:11.5px;line-height:1.6;color:#8f322b;">Without a HaTi server the whole document travels <strong>inside the link itself</strong>. That link <strong>never expires and cannot be revoked</strong> — anyone who is forwarded it, now or in a year, can read this contract, and you will have no record that they did. Do not send a real contract this way. Run the HaTi server for tracked links that expire, can be withdrawn, and report back when they are opened.</p>
      </div>`}
      <div id="share-tabs" style="display:flex;gap:6px;margin-bottom:12px;">${tab('email','✉ Email',true)}${tab('whatsapp','WhatsApp',false)}${tab('link','Copy link',false)}</div>
      <div id="share-fields">
        ${pre.email||pre.phone||pre.name?`<div style="display:flex;align-items:center;gap:7px;margin:0 0 9px;font-size:11.5px;color:var(--color-neutral-700);border:1px solid var(--color-divider);background:var(--color-bg);border-radius:5px;padding:7px 10px">
          <span style="flex:none;color:var(--color-accent);display:inline-flex">${icon('check2','w-3.5 h-3.5')}</span>
          <span style="flex:1;min-width:0">Filled in from the last time you shared this contract. Change it if this round goes to someone else.</span>
        </div>`:''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <label><span style="${LBL}">Recipient name</span><input id="sh-name" type="text" value="${attr(pre.name)}" placeholder="e.g. Grace Njeri" style="${FLD}"/></label>
          <label id="sh-email-wrap"><span style="${LBL}">Recipient email *</span><input id="sh-email" type="email" value="${attr(pre.email)}" placeholder="them@company.co.ke" style="${FLD}"/></label>
          <label id="sh-phone-wrap" class="hidden"><span style="${LBL}">WhatsApp number *</span><input id="sh-phone" type="tel" value="${attr(pre.phone)}" placeholder="+254 7…" style="${FLD}"/></label>
        </div>
        <label style="display:block;margin-top:10px;"><span style="${LBL}">Personal message (optional)</span>
          <textarea id="sh-msg" rows="2" placeholder="e.g. As discussed — please review clause 4 in particular." style="${FLD}min-height:0;"></textarea></label>
        ${server?`<label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:11.5px;color:var(--color-neutral-700)">Link expires in
          <select id="sh-exp" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:4px 6px;font:inherit;font-size:12px;color:inherit;">
            ${[7,14,30,60].map(d=>`<option value="${d}" ${d===14?'selected':''}>${d} days</option>`).join('')}
          </select></label>`:''}
      </div>
      <div id="sh-result" style="margin-top:12px;"></div>
      <div style="margin-top:14px;display:flex;align-items:center;gap:8px;justify-content:flex-end;">
        <button id="share-close" class="ui-btn">Close</button>
        <button id="share-send" class="ui-btn ui-btn-primary">${icon('send','w-3.5 h-3.5')} <span id="sh-send-lbl">Send by email</span></button>
      </div>
    </div>`);
  const setCh=k=>{ ch=k;
    document.querySelectorAll('[data-share-ch]').forEach(b=>{ const on=b.getAttribute('data-share-ch')===k;
      b.style.border=`1px solid ${on?'var(--color-accent)':'var(--color-divider)'}`;
      b.style.background=on?'var(--color-accent)':'var(--color-surface)';
      b.style.color=on?'#fff':'var(--color-neutral-700)'; });
    document.getElementById('sh-email-wrap').classList.toggle('hidden',k==='whatsapp');
    document.getElementById('sh-phone-wrap').classList.toggle('hidden',k!=='whatsapp');
    document.getElementById('sh-send-lbl').textContent=k==='email'?'Send by email':k==='whatsapp'?'Open WhatsApp':'Create link';
  };
  document.querySelectorAll('[data-share-ch]').forEach(b=>b.addEventListener('click',()=>setCh(b.getAttribute('data-share-ch'))));
  if(ch!=='email') setCh(ch);         // open on the channel they used last time
  document.getElementById('share-close').addEventListener('click',closeModal);

  const resultBox=(html)=>{ document.getElementById('sh-result').innerHTML=html; };
  const copyBox=(link,note)=>`
    <div style="border:1px solid var(--color-divider);background:var(--color-accent-100);border-radius:6px;padding:12px;">
      ${note?`<div style="font-size:11.5px;color:var(--color-accent-800);font-weight:600;margin-bottom:6px;display:flex;align-items:center;gap:6px">${icon('check2','w-3.5 h-3.5')} ${note}</div>`:''}
      <textarea id="share-link" readonly rows="3" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:9px;font-size:10.5px;font-family:var(--font-mono);color:var(--color-text);outline:none;word-break:break-all;">${link}</textarea>
      <button id="share-copy" class="ui-btn" style="margin-top:6px;font-size:12px;">${icon('copy','w-3 h-3')} Copy link</button>
    </div>`;
  const wireCopy=()=>document.getElementById('share-copy')?.addEventListener('click',async()=>{
    const ta=document.getElementById('share-link'); ta.select();
    try{ await navigator.clipboard.writeText(ta.value); }catch(e){ document.execCommand('copy'); }
    toast('Share link copied to clipboard');
  });

  document.getElementById('share-send').addEventListener('click',async()=>{
    const name=fval('sh-name'), email=fval('sh-email'), phone=fval('sh-phone'), msg=fval('sh-msg');
    if(ch==='email' && !/.+@.+\..+/.test(email)){ toast('Enter the recipient’s email address','err'); return; }
    if(ch==='whatsapp' && phone.replace(/\D/g,'').length<9){ toast('Enter a WhatsApp number with country code, e.g. +2547…','err'); return; }
    // A share cannot be recalled, so an incomplete contract needs an explicit
    // acknowledgement rather than a toast that scrolls away.
    const ack=document.getElementById('sh-ack');
    if(ack && !ack.checked){
      toast('This contract is not ready to send — tick the confirmation, or close and complete it','err');
      const panel=document.getElementById('share-readiness');
      if(panel){ panel.style.outline='2px solid #b0453c'; setTimeout(()=>{ panel.style.outline=''; },1600);
                 panel.scrollIntoView({ block:'nearest', behavior:'smooth' }); }
      return;
    }
    const rcptLabel=name||email||phone||c.counterparty||'counterparty';
    if(server){
      let r;
      try{ r=await api('shares','POST',{ payload:payloadObj, channel:ch, message:msg,
        recipient:{ name, email, phone }, expiryDays:Number(fval('sh-exp'))||14 }); }
      catch(e){ toast(e.message,'err'); return; }
      if(ch==='email'){
        // Three different outcomes used to read as one cheerful green box that
        // always blamed a missing mail key — including when the key was working
        // and the provider had refused the message for a stated reason. Say
        // which of the three actually happened, and quote the reason.
        const link=r.link?`<div style="margin-top:8px"><span style="font-family:var(--font-mono);font-size:10.5px;word-break:break-all">${esc(r.link)}</span></div>`:'';
        if(r.emailSent){
          resultBox(`<div style="border:1px solid color-mix(in srgb,#2e8763 30%,transparent);background:#e8f4ee;border-radius:6px;padding:12px;font-size:12px;color:#1e6b4d;display:flex;align-items:flex-start;gap:8px;">${icon('check2','w-4 h-4')}<span><strong>Email sent</strong> to ${esc(email)}. You’ll be emailed when they open it${currentUser()?.prefs?.notifyShareOpens?'':' (if enabled in settings)'} and when they respond. Fill in another recipient to share again.</span></div>`);
        } else if(r.emailConfigured){
          resultBox(`<div style="border:1px solid color-mix(in srgb,#b8862b 45%,transparent);background:color-mix(in srgb,#b8862b 10%,transparent);border-radius:6px;padding:12px;font-size:12px;color:#7d5a14;display:flex;align-items:flex-start;gap:8px;">${icon('alert','w-4 h-4')}<span><strong>Not delivered — the mail provider refused it.</strong> The link was created and is safe to send another way, but ${esc(email)} has not received anything.${r.emailError?`<br><span style="display:inline-block;margin-top:6px;font-family:var(--font-mono);font-size:10.5px;line-height:1.5">${esc(r.emailError)}</span>`:' No reason was given.'}${link}</span></div>`);
        } else {
          resultBox(`<div style="border:1px solid color-mix(in srgb,#b8862b 45%,transparent);background:color-mix(in srgb,#b8862b 10%,transparent);border-radius:6px;padding:12px;font-size:12px;color:#7d5a14;display:flex;align-items:flex-start;gap:8px;">${icon('alert','w-4 h-4')}<span><strong>Queued, not sent.</strong> This server has no mail provider set up, so nothing left HaTi. An admin can read the message and the link in the outbox under Team &amp; Settings.${link}</span></div>`);
        }
      } else if(ch==='whatsapp'){
        const wa=waShareLink(phone, shareMessageText(c,r.link,msg,r.expiresAt));
        window.open(wa,'_blank');
        resultBox(copyBox(r.link,`Tracked link created for ${rcptLabel} — WhatsApp opened with the message prefilled. If it didn’t open, copy the link below.`)); wireCopy();
      } else { resultBox(copyBox(r.link,`Tracked link created${name?` for ${name}`:''} — expires ${String(r.expiresAt).slice(0,10)}.`)); wireCopy(); }
      logAudit(c,'Shared',`Sent to ${rcptLabel} via ${ch==='link'?'link':ch}${msg?' with a message':''}`);
      persist(c); renderAuditSection(c);
      refreshShareOverview(); renderSharesSection(c);
    } else {
      // static mode: the whole payload travels in the URL fragment
      const link=location.href.split('#')[0]+'#share='+b64e(payloadObj);
      if(ch==='email'){
        const subject=`${currentUser().name} shared "${c.name}" for your review`;
        location.href='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(shareMessageText(c,link,msg,null));
        resultBox(copyBox(link,'Your email app opened with the message prefilled. If it didn’t, copy the link below.')); wireCopy();
      } else if(ch==='whatsapp'){
        window.open(waShareLink(phone, shareMessageText(c,link,msg,null)),'_blank');
        resultBox(copyBox(link,'WhatsApp opened with the message prefilled. If it didn’t, copy the link below.')); wireCopy();
      } else { resultBox(copyBox(link)); wireCopy(); }
      logAudit(c,'Shared',`Review link ${ch==='link'?'generated':'sent via '+ch} for ${rcptLabel}`);
      persist(c); renderAuditSection(c);
    }
  });
}

/* ---- Shares panel (workspace): every dispatch for this contract with its
   traffic light, timestamps and per-share actions (copy / resend / revoke). */
async function renderSharesSection(c){
  const host=document.getElementById('shares-section'); if(!host) return;
  if(!API_MODE()){ host.innerHTML=''; return; }
  let shares=[];
  try{ const r=await api('contracts/'+c.id+'/shares'); shares=r.shares||[]; }catch(e){ host.innerHTML=''; return; }
  if(!shares.length){ host.innerHTML=''; return; }
  const esc=s=>String(s==null?'':s).replace(/[&<>]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[x]));
  const chLabel={email:'Email',whatsapp:'WhatsApp',link:'Link'};
  const live=s=>s.state==='sent'||s.state==='opened';
  host.innerHTML=`<div class="px-5 py-4">
    <div class="flex items-center gap-2 mb-3"><span class="text-brand-500">${icon('send')}</span>
      <h3 class="text-sm font-display font-600 text-brand-900">Shares</h3>
      <span class="ml-auto text-[10px] font-mono text-brand-800/60">${shares.length} sent</span></div>
    <div class="space-y-2">
      ${shares.map(s=>{
        const who=esc(s.recipientName||s.recipientEmail||s.recipientPhone||'Open link');
        const meta=[`sent ${fmtDT(s.sentAt||s.createdAt)}`,
          s.firstOpenedAt?`opened ${fmtDT(s.firstOpenedAt)}`:null,
          s.respondedAt?`responded ${fmtDT(s.respondedAt)}`:null,
          (!s.respondedAt&&!s.revokedAt&&s.expiresAt)?`expires ${String(s.expiresAt).slice(0,10)}`:null].filter(Boolean).join(' · ');
        return `<div style="border:1px solid var(--color-divider);border-radius:6px;padding:8px 10px;background:var(--color-bg)">
          <div style="display:flex;align-items:center;gap:8px;min-width:0">
            ${shareChip(s.state)}
            <span style="flex:1;min-width:0;font-size:11.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${who}">${who}</span>
            <span style="font-size:9.5px;color:var(--color-neutral-500);font-family:var(--font-mono);flex:none">${chLabel[s.channel]||'Link'}</span>
          </div>
          ${s.responseBy?`<div style="font-size:10.5px;color:var(--color-neutral-700);margin-top:3px">by ${esc(s.responseBy)}</div>`:''}
          <div style="font-size:10px;color:var(--color-neutral-600);font-family:var(--font-mono);margin-top:3px">${meta}</div>
          ${(live(s)&&canEdit())?`<div style="display:flex;gap:10px;margin-top:5px">
            <button data-sh-copy="${s.token}" style="border:0;background:none;padding:0;font:inherit;font-size:10.5px;font-weight:600;color:var(--color-accent-700);cursor:pointer">Copy link</button>
            ${s.channel==='email'?`<button data-sh-resend="${s.token}" style="border:0;background:none;padding:0;font:inherit;font-size:10.5px;font-weight:600;color:var(--color-accent-700);cursor:pointer">Resend</button>`:''}
            <button data-sh-revoke="${s.token}" style="border:0;background:none;padding:0;font:inherit;font-size:10.5px;font-weight:600;color:#b0453c;cursor:pointer">Revoke</button>
          </div>`:''}
        </div>`; }).join('')}
    </div></div>`;
  host.querySelectorAll('[data-sh-copy]').forEach(b=>b.addEventListener('click',async()=>{
    const link=location.origin+location.pathname+'#share=t:'+b.getAttribute('data-sh-copy');
    try{ await navigator.clipboard.writeText(link); }catch(e){}
    toast('Share link copied to clipboard');
  }));
  host.querySelectorAll('[data-sh-resend]').forEach(b=>b.addEventListener('click',async()=>{
    try{ const r=await api('shares/'+b.getAttribute('data-sh-resend')+'/resend','POST',{});
      toast(r.emailSent?'Reminder email sent':'Reminder queued to the outbox'); renderSharesSection(c);
    }catch(e){ toast(e.message,'err'); }
  }));
  host.querySelectorAll('[data-sh-revoke]').forEach(b=>b.addEventListener('click',async()=>{
    if(!await confirmDialog({title:'Revoke this share link?', message:'The recipient will no longer be able to open the contract from this link. You can share again at any time.', confirmLabel:'Revoke link', danger:true})) return;
    try{ await api('shares/'+b.getAttribute('data-sh-revoke')+'/revoke','POST',{});
      logAudit(c,'Share revoked','A counterparty share link was revoked'); persist(c); renderAuditSection(c);
      toast('Share link revoked'); renderSharesSection(c); refreshShareOverview();
    }catch(e){ toast(e.message,'err'); }
  }));
}

/* ---- Portfolio-wide dispatch overview: feeds the register/folder dots and
   the dashboard "Out with counterparties" strip. Refreshed on load + poll. */
async function refreshShareOverview(){
  if(!API_MODE()) return;
  try{
    const r=await api('shares/overview');
    state.shareOverview=r; state.shareByContract=r.byContract||{};
    if(state.view==='dashboard') renderDashboard();
  }catch(e){ /* transient — next refresh retries */ }
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
  // The caller may hand us a LIGHT register row — the list endpoint strips
  // audit, comments, execution.html and the upload's text off every row. This
  // function appends to the record and persists the whole object, so acting on
  // a light row would write those absences back over the full record and
  // destroy the audit trail at the exact moment a counterparty responds.
  try{ await ensureFull(c); }catch(e){
    toast('Could not load the full contract to record the response — try again','err');
    return false;
  }
  // An agreement that is already executed is not a thing a share link may
  // re-open. A stale or replayed link must not be able to flip a signed
  // contract to Declined or bolt another signature onto a sealed record.
  if((c.execution && c.execution.at) || isExternallyExecuted(c)){
    if(!opts.background) toast(`${c.id} is already executed — a share response cannot change it. Record an amendment instead.`,'err');
    return false;
  }
  const currentHash=await sha256(canonicalDoc(c));
  if(r.docHash && r.docHash!==currentHash && r.docHash!==c.hash)
    toast('Note: the document changed after this share link was created','err');
  const who=r.name+(r.title?', '+r.title:'');
  if(r.action==='sign'){
    c.signatures=c.signatures||[];
    const sig={ form:r.signatureForm||null, image:r.signatureImage||null, imageHash:r.signatureImageHash||null,
      typedName:r.signatureTypedName||null, font:r.signatureFont||null };
    c.signatures.push({ party:'counterparty', name:r.name, title:r.title||'', email:r.email||'', at:r.at,
      method:r.method||'share-link', ip:r.ip||null, ua:r.ua||null, docHash:r.docHash,
      form:sig.form, image:sig.image, imageHash:sig.imageHash, typedName:sig.typedName, font:sig.font });
    // If a signing route is running, mark this counterparty's step signed and advance.
    const ns=window.nextSigner?nextSigner(c):null;
    if(ns && ns.party==='counterparty'){ ns.signed=true; ns.at=r.at; ns.by=r.name; ns.signature=sig; }
    c.comments.push({ author:r.name, role:'Counterparty — Signed', side:'external', text:r.comment||'Approved and signed via secure share link.', ts:fmtDT(r.at) });
    logAudit(c,'Countersigned',`${who} signed via share link (${r.method||'share-link'}${sig.form?', '+sig.form+' signature':''})${signerProvenance(r.ip,r.ua)}`);
    toast(`${r.name} has signed — countersignature recorded`);
    // Last signature on a route ⇒ freeze, seal and distribute automatically.
    if(window.allSigned && allSigned(c) && c.status!=='Signed' && window.finalizeExecution){
      c.lastAction=todayStr(); persist(c);
      await finalizeExecution(c, { silent:!!opts.background });
      return true;
    }
  } else if(r.action==='accept'){
    /* Agreement to the wording, which is not execution. The contract keeps its
       status and its seal stays unwritten; what changes is that the other side
       has said yes to this text on the record, so the next step is signature
       rather than another round of drafting. */
    c.acceptance={ by:who, at:r.at, email:r.email||null, comment:r.comment||'' };
    c.comments.push({ author:r.name, role:'Counterparty — Wording accepted', side:'external',
      text:r.comment||'Accepted the current wording. Not yet signed.', ts:fmtDT(r.at) });
    logAudit(c,'Wording accepted',`${who} accepted the current wording without signing`);
    toast(`${r.name} accepted the wording — ready for signature`);
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
      if(ok){ await api('shares/'+item.token+'/applied','POST'); refreshShareOverview(); }
    }
  }catch(e){ /* transient network issues — next poll retries */ }
}

Object.assign(window,{DEFAULT_APPROVAL,buildSharePayload,lastShareRecipient,shareModalPrefill,contractShares,reshareToLastRecipient,resolvedRounds,ROLE_LABEL,applyResponse,deviceFromUa,signerProvenance,approvalState,approveContract,b64d,b64e,canEdit,canonicalDoc,validEmail,closeModal,confirmDialog,promptDialog,currentUser,deleteContract,dirty,doLogin,doSetup,downloadEvidence,downloadFile,ensureFull,restoreHeavyFields,flushSaves,fmtDT,freezeContractHtml,readOnlyDocHtml,execHashInput,fval,getApprovalCfg,getOrg,getSession,getUsers,hashPassword,hydrate,isAdmin,isExternallyExecuted,logAudit,logout,migrateContract,repairMigratedSignatories,newSalt,normText,nowISO,openImportModal,openModal,openShareModal,contractReadiness,readinessBlocks,contractPlaceholders,readinessPanelHtml,persist,pollPendingResponses,refreshShareOverview,renderAuditSection,renderAuth,renderMustChangePassword,renderNegotiationSection,renderSharesSection,refreshAiUsage,renderSideFolders,renderSideUser,resolveRound,saveContract,saveSettings,saveTimer,saveUsers,sealString,shareMessageText,startApp,todayStr,userById,verifySeal,waShareLink});
