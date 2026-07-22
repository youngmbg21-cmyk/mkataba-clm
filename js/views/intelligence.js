// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   VIEW: DEAL MAP  (force-directed graph of the portfolio)
   ============================================================ */
const REL_SEEDS = [ // name-matched so IDs stay dynamic \u2014 traces the value stream
  { from:'Refined Sugar Supply \u2014 Confectionery Line', to:'Co-Packing \u2014 Powdered Beverages', label:'feeds' },
  { from:'Co-Packing \u2014 Powdered Beverages', to:'Modern Trade Listing & Supply', label:'supplies' },
  { from:'Raw Milk Collection \u2014 Rift Valley Co-ops', to:'Cold-Chain Storage \u2014 Dairy & Chilled', label:'stored via' },
  { from:'Central Warehouse & 3PL \u2014 Industrial Area', to:'Last-Mile Distribution \u2014 Western Region', label:'feeds' },
  { from:'Regional Distributor \u2014 Nyanza', to:'Modern Trade Listing & Supply', label:'overlaps' },
  { from:'Crude Edible Oil Supply', to:'Tolling Agreement \u2014 Detergent Powder', label:'feeds' },
  { from:'Mutual NDA \u2014 New Product Development', to:'Contract Manufacturing \u2014 Bar Soap', label:'precedes' },
];
const STATUS_BAR = {'Draft':'#98989b','Under Review':'#b8862b','Signed':'#2e8763','Declined':'#b0453c'};
const KIND_TAG = {proc:{t:'PROC',c:'#2E9F80'},mfg:{t:'MFG',c:'#b45309'},dist:{t:'DIST',c:'#0369a1'},sales:{t:'SALES',c:'#b8862b'},mktg:{t:'MKTG',c:'#7c3aed'},corp:{t:'CORP',c:'#2e8763'},party:{t:'PARTY',c:'#2c455d'}};

function buildGraph(){
  const nodes=[], edges=[];
  const trunc=(s,n=24)=>s.length>n?s.slice(0,n-1)+'\u2026':s;
  // contract nodes
  state.contracts.forEach(c=>{
    nodes.push({ id:c.id, type:'contract', c, label:trunc(c.name), sub:c.id+' \u00b7 '+(c.value?fmtKESshort(c.value):'\u2014'),
      kind:c.folder, bar:STATUS_BAR[c.status], w:0,h:0,x:0,y:0 });
  });
  // party nodes (aggregate)
  const parties={};
  state.contracts.forEach(c=>{ if(!c.counterparty) return;
    (parties[c.counterparty]||(parties[c.counterparty]=[])).push(c); });
  Object.entries(parties).forEach(([name,cs])=>{
    const val=cs.filter(x=>x.status!=='Declined').reduce((s,x)=>s+Number(x.value||0),0);
    nodes.push({ id:'p:'+name, type:'party', party:name, cs, label:trunc(name), sub:cs.length+' deal'+(cs.length===1?'':'s')+' \u00b7 '+fmtKESshort(val),
      kind:'party', bar:'#2c455d', w:0,h:0,x:0,y:0 });
    cs.forEach(c=>edges.push({from:c.id, to:'p:'+name, label:'party to'}));
  });
  // seeded contract-to-contract relations
  REL_SEEDS.forEach(r=>{
    const a=state.contracts.find(c=>c.name===r.from), b=state.contracts.find(c=>c.name===r.to);
    if(a&&b) edges.push({from:a.id, to:b.id, label:r.label});
  });
  const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
  edges.forEach(e=>{e.s=byId[e.from]; e.t=byId[e.to];});
  const adj={}; nodes.forEach(n=>adj[n.id]=new Set());
  edges.forEach(e=>{adj[e.from].add(e.to); adj[e.to].add(e.from);});
  return {nodes, edges, adj};
}

function layoutGraph(nodes, edges, W, H){
  let seed=11; const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff;};
  const groups=[...Object.keys(FOLDERS),'party'];
  const gA={}; groups.forEach((g,i)=>gA[g]=i/groups.length*Math.PI*2 - Math.PI/3);
  nodes.forEach(n=>{
    if(state.mapPos[n.id]){ n.x=state.mapPos[n.id].x; n.y=state.mapPos[n.id].y; n.pinned=true; return; }
    const a=gA[n.kind]+(rnd()-.5)*1.1, r=Math.min(W,H)*(n.type==='party'?0.18:0.34);
    n.x=W/2+Math.cos(a)*r+(rnd()-.5)*40; n.y=H/2+Math.sin(a)*r+(rnd()-.5)*40;
  });
  for(let it=0; it<340; it++){
    const cool=1-it/340;
    for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j];
      let dx=a.x-b.x, dy=a.y-b.y; const d2=dx*dx+dy*dy+1, d=Math.sqrt(d2);
      const rep=Math.min(28, 14000/d2)*cool;
      dx/=d; dy/=d;
      if(!a.pinned){a.x+=dx*rep; a.y+=dy*rep;} if(!b.pinned){b.x-=dx*rep; b.y-=dy*rep;}
    }
    edges.forEach(e=>{
      let dx=e.t.x-e.s.x, dy=e.t.y-e.s.y; const d=Math.sqrt(dx*dx+dy*dy)+.01;
      const f=(d-165)*0.02*cool; dx/=d; dy/=d;
      if(!e.s.pinned){e.s.x+=dx*f*d*0.01+dx*f; e.s.y+=dy*f;} if(!e.t.pinned){e.t.x-=dx*f; e.t.y-=dy*f;}
    });
    nodes.forEach(n=>{ if(n.pinned) return;
      n.x+=(W/2-n.x)*0.006; n.y+=(H/2-n.y)*0.006;
      n.x=Math.max(110,Math.min(W-110,n.x)); n.y=Math.max(70,Math.min(H-70,n.y)); });
  }
}

/* ============================================================
   VIEW: PORTFOLIO INTELLIGENCE
   ============================================================ */
const SEV_WEIGHT = {high:5, med:2, low:1};
const riskScore = c => openFindings(c).reduce((s,f)=>s+SEV_WEIGHT[f.sev],0);
const daysUntil = iso => Math.ceil((new Date(iso+'T00:00:00') - Date.now())/86400000);
window.intelUI = { scanning:false, scannedAt:null };

function scanPortfolio(){
  state.contracts.forEach(c=>runScan(c));
  intelUI.scannedAt = new Date().toLocaleString('en-KE',{dateStyle:'medium',timeStyle:'short'});
}

/* ============================================================
   VIEW: INTEL — AI contract graph (force-directed, HaTi light theme)
   Every contract is a node, clustered around group hubs. A free-form AI
   box both FILTERS (non-matches disappear) and RE-CLUSTERS (group by
   customer / folder / status / value / city…). Uses the server LLM when a
   key is configured; otherwise the built-in interpreter.
   ============================================================ */
const INTEL_CAP = 120;
const STATUS_DOT = {'Draft':'#98989b','Under Review':'#b8862b','Signed':'#2e8763','Declined':'#b0453c'};
window.intel = { groupBy:'folder', groups:null /*{id:label} override from AI*/,
  lenses:[] /*[{id,label,ids:[],on,action:'filter'|'highlight',badges:{id:txt}|null}]*/,
  history:[] /*dock conversation: {role,text,cardIds?,ranked?,explainId?,err?}*/,
  busy:false, dockOpen:true, seq:1 };
window.IG = null;      // live graph model
window.intelRAF = 0;   // animation token
const igEsc = s => String(s??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

function valueBand(v){ v=Number(v||0); if(!v) return 'Non-monetary'; if(v>=50e6) return '≥ KES 50M'; if(v>=10e6) return 'KES 10–50M'; if(v>=1e6) return 'KES 1–10M'; return '< KES 1M'; }
function groupLabelOf(c, groupBy, override){
  if(override && override[c.id]) return override[c.id];
  switch(groupBy){
    case 'counterparty': return c.counterparty||'No counterparty';
    case 'status': return statusLabel(c.status);
    case 'valueBand': return valueBand(c.value);
    case 'kind': return cKind(c);
    case 'folder': default: return FOLDERS[c.folder]?.name||'Other';
  }
}

/* ---- pinned lenses: active ones intersect; any filter lens filters ---- */
function intelActive(){
  const on=intel.lenses.filter(l=>l.on);
  if(!on.length) return { ids:null, action:'filter', badges:null };
  let ids=null;
  on.forEach(l=>{ const s=new Set(l.ids); ids = ids===null ? s : new Set([...ids].filter(id=>s.has(id))); });
  const badges={};
  on.forEach(l=>{ if(l.badges) Object.entries(l.badges).forEach(([id,b])=>{ if(ids.has(id)) badges[id]=b; }); });
  return { ids, action: on.some(l=>l.action==='filter')?'filter':'highlight',
    badges: Object.keys(badges).length?badges:null };
}
function addLens(l){
  intel.lenses.push({ id:'lens'+(intel.seq++), on:true, action:l.action||'filter',
    label:l.label||l.ids.length+' matches', ids:[...l.ids], badges:l.badges||null });
  renderIntelDock();
}

/* ---- built-in fallback interpreter: query -> render_graph-shaped result ---- */
function parseHorizonDays(q){
  const m=q.match(/(\d+)\s*(day|week|month|year)s?/);
  if(m){ const n=+m[1]; return Math.round(n*({day:1,week:7,month:30.44,year:365.25})[m[2]]); }
  if(q.includes('this year')){ const end=new Date(new Date().getFullYear(),11,31); return Math.max(0,Math.ceil((end-Date.now())/86400000)); }
  return null;
}
function graphInterpret(qRaw){
  const q=(qRaw||'').toLowerCase().trim();
  const act=intelActive();
  // "of those / among these" → operate on the currently selected set
  const followup=/\b(of|among|from|out of)\s+(those|these|them)\b/.test(q);
  const cs=(followup && act.ids)? state.contracts.filter(c=>act.ids.has(c.id)) : state.contracts;
  const has=(...w)=>w.some(x=>q.includes(x));
  // analytical questions read better highlighted; explicit commands filter
  const questionish=/^(which|what|who|how|are|is|do|does)\b/.test(q)||q.includes('?');
  const mode=has('only','show ','filter','display')&&!questionish?'filter':(questionish?'highlight':'filter');
  let groupBy=null, vis=null, note='', badges=null, action=mode;
  // grouping intent
  if(has('by customer','by counterpart','by party','per customer','by client')) groupBy='counterparty';
  else if(has('by folder','by function','by value stream','by category','by department')) groupBy='folder';
  else if(has('by status','by stage','by lifecycle')) groupBy='status';
  else if(has('by value','by size','by amount','by exposure')) groupBy='valueBand';
  else if(has('by type','by kind','by contract type')) groupBy='kind';
  // filter intent
  const kindHit=(...k)=>cs.filter(c=>k.some(x=>cKind(c).toLowerCase().includes(x)));
  if(has('expir','renew','lapse','ending',' end ','coming to an end','ends in','end in','end within')){
    const horizon=parseHorizonDays(q)??90;
    vis=cs.filter(c=>c.expiry&&c.status!=='Declined'&&daysUntil(c.expiry)>=0&&daysUntil(c.expiry)<=horizon);
    note='Expiring ≤ '+(horizon%30===0&&horizon>=30?Math.round(horizon/30)+'mo':horizon+' days');
    badges={}; vis.forEach(c=>badges[c.id]='ends in '+daysUntil(c.expiry)+'d');
    action='highlight';
  }
  else if(has('lease')) { vis=kindHit('lease'); note='Leases'; }
  else if(has('nda','non-disclosure','confidential')) { vis=kindHit('nda','non-disclosure'); note='NDAs'; }
  else if(has('supply','raw material','packaging')) { vis=kindHit('supply','packaging','raw material'); note='Supply agreements'; }
  else if(has('draft')) { vis=cs.filter(c=>c.status==='Draft'); note='Drafts'; }
  else if(has('under review','pending','awaiting','in review')) { vis=cs.filter(c=>c.status==='Under Review'); note='In review'; }
  else if(has('signed','executed','sealed')) { vis=cs.filter(c=>c.status==='Signed'); note='Executed'; }
  else if(has('declined','closed','rejected')) { vis=cs.filter(c=>c.status==='Declined'); note='Closed'; }
  else if(has('high value','high-value','biggest','largest','top ','most valuable')) { vis=cs.filter(c=>Number(c.value||0)>=20e6); note='High-value (≥ KES 20M)'; }
  else if(has('non-monetary','no value')) { vis=cs.filter(c=>!isMonetary(c)); note='Non-monetary'; }
  else {
    // counterparty name match
    const party=cs.filter(c=>c.counterparty && c.counterparty.toLowerCase().split(/[^a-z0-9]+/).some(w=>w.length>3&&q.includes(w)));
    if(party.length){ vis=party; note='Counterparty match'; }
    else { const f=Object.values(FOLDERS).find(f=>{ const kw=f.name.toLowerCase().split(/[^a-z]+/).filter(w=>w.length>4); return kw.some(w=>q.includes(w)); });
      if(f){ vis=cs.filter(c=>c.folder===f.id); note=f.name; } }
  }
  const answer = vis===null
    ? (groupBy?'Regrouped the graph.':'I could not match that to a filter — try a contract type, status, counterparty or expiry horizon.')
    : (vis.length
      ? `${vis.length} contract${vis.length===1?'':'s'} match${vis.length===1?'es':''} (${note}). Largest: ${vis.slice().sort((a,b)=>Number(b.value||0)-Number(a.value||0))[0].name}.`
      : `No contracts match (${note}).`);
  return { visibleIds: vis&&vis.length?vis.map(c=>c.id):null, groupBy, groups:null, note, action, badges, answer };
}

/* ---- dock entry point: routes to graph query or template advisor ---- */
const IG_TEMPLATE_RE=/\btemplate\b|\bbase\b.{0,30}\b(new|next|on)\b|model (contract|agreement)|starting point|start(ing)? from/i;
async function intelAsk(qRaw){
  const q=(qRaw||'').trim();
  if(!q||intel.busy) return;
  intel.history.push({role:'user', text:q});
  intel.busy=true; renderIntelDock(); updateIntelNote();
  try{
    if(IG_TEMPLATE_RE.test(q)) await intelTemplateAsk(q);
    else await intelGraphAsk(q);
  }catch(e){
    intel.history.push({role:'assistant', text:'Something went wrong: '+igEsc(e.message), err:true});
  }
  intel.busy=false;
  rebuildIntelGraph(); renderIntelDock();
}

async function intelGraphAsk(q){
  const act=intelActive();
  let res=null;
  if(API_MODE() && state.aiConfigured){
    try{
      const payload={ query:q,
        contracts: state.contracts.slice(0,600).map(c=>({id:c.id,name:c.name,counterparty:c.counterparty||'',folder:FOLDERS[c.folder]?.name||'',kind:cKind(c),value:Number(c.value||0),status:c.status,expiry:c.expiry||''})),
        history: intel.history.slice(-9,-1).filter(m=>m.text).map(m=>({role:m.role,text:m.text})),
        activeIds: act.ids?[...act.ids]:null };
      res=await api('ai/graph','POST',payload);
    }catch(e){
      intel.history.push({role:'assistant', err:true,
        text:(/key|configure|401|model/i.test(e.message)?'The AI engine needs an API key — using the built-in interpreter instead.':'AI error: '+igEsc(e.message)+' — using the built-in interpreter instead.')});
    }
  }
  if(!res) res=graphInterpret(q);           // fallback
  if(res.groupBy){ intel.groupBy=res.groupBy; intel.groups=res.groups||null; }
  if(res.visibleIds && res.visibleIds.length)
    addLens({ label:res.note||res.visibleIds.length+' matches', ids:res.visibleIds, action:res.action||'filter', badges:res.badges||null });
  intel.history.push({role:'assistant', text:res.answer||res.note||'Done.', cardIds:(res.visibleIds||[]).slice(0,5)});
}

/* ---- template advisor: stage 1 metadata shortlist, stage 2 clause-level AI rank ---- */
function contractPlainText(c){
  try{
    if(isUpload(c)) return (c.upload&&c.upload.extractedText)||'';
    const host=document.createElement('div'); host.innerHTML=docBody(c);
    host.querySelectorAll('input').forEach(i=>i.replaceWith(document.createTextNode(i.value||i.getAttribute('value')||'')));
    return (host.textContent||'').replace(/\s+/g,' ').trim();
  }catch(e){ return ''; }
}
function templateShortlist(q){
  const ql=q.toLowerCase();
  const score=c=>{ let s=0;
    cKind(c).toLowerCase().split(/[^a-z]+/).forEach(w=>{ if(w.length>3&&ql.includes(w)) s+=4; });
    if(c.status==='Signed') s+=3;
    if(Number(c.value||0)>0) s+=1;
    if(c.counterparty) s+=1;
    if(isUpload(c)&&!(c.upload&&c.upload.extractedText)) s-=5;   // no text to compare
    return s; };
  return state.contracts.map(c=>({c,s:score(c)})).sort((a,b)=>b.s-a.s).slice(0,8).map(x=>x.c);
}
async function intelTemplateAsk(q){
  const shortlist=templateShortlist(q);
  if(!shortlist.length){ intel.history.push({role:'assistant', text:'There are no contracts to compare yet.'}); return; }
  if(API_MODE() && state.aiConfigured){
    try{
      await Promise.all(shortlist.map(c=>ensureFull(c).catch(()=>{})));
      const candidates=shortlist.map(c=>({id:c.id,name:c.name,kind:cKind(c),counterparty:c.counterparty||'',value:Number(c.value||0),status:c.status,expiry:c.expiry||'',text:contractPlainText(c)}));
      const res=await api('ai/template','POST',{query:q,candidates});
      applyTemplateResult(res.ranked, res.answer); return;
    }catch(e){
      intel.history.push({role:'assistant', err:true,
        text:(/key|configure|401|model/i.test(e.message)?'The AI engine needs an API key for template analysis — here is a metadata-only ranking instead.':'AI template analysis failed ('+igEsc(e.message)+') — here is a metadata-only ranking instead.')});
    }
  }
  // fallback: deterministic metadata ranking, honest about its limits
  const ranked=shortlist.slice(0,3).map(c=>({ id:c.id,
    reason:[c.status==='Signed'?'executed — battle-tested terms':'closest match on type', cKind(c), c.counterparty?('with '+c.counterparty):null].filter(Boolean).join(' · ') }));
  const top=getContract(ranked[0].id);
  applyTemplateResult(ranked, `Closest template match on metadata: <b>${top?.name||'—'}</b>.${(API_MODE()&&!state.aiConfigured)||!API_MODE()?' Configure the AI engine for a clause-level comparison.':''}`);
}
function applyTemplateResult(ranked, answer){
  const badges={}; ranked.forEach((r,i)=>badges[r.id]='#'+(i+1));
  addLens({ label:'Template picks · '+ranked.length, ids:ranked.map(r=>r.id), action:'highlight', badges });
  intel.history.push({role:'assistant', text:answer||'Ranked the best template candidates.', ranked});
}

/* ---- build the node/edge model from current state + lenses/group ---- */
function buildGraphModel(){
  const groupBy=intel.groupBy, override=intel.groups;
  const act=intelActive();
  let cs=state.contracts;
  if(act.ids && act.action==='filter') cs=cs.filter(c=>act.ids.has(c.id));
  const capped = cs.length>INTEL_CAP;
  if(capped) cs=cs.slice().sort((a,b)=>{
    // matched contracts survive the cap first, then largest by value
    const am=act.ids?.has(a.id)?1:0, bm=act.ids?.has(b.id)?1:0;
    return (bm-am)||(Number(b.value||0)-Number(a.value||0));
  }).slice(0,INTEL_CAP);
  const highlight = act.ids && act.action==='highlight';
  // hubs
  const hubMap={};
  cs.forEach(c=>{ const g=groupLabelOf(c,groupBy,override); (hubMap[g]||(hubMap[g]={label:g,ids:[]})).ids.push(c.id); });
  const hubs=Object.values(hubMap);
  const nodes=[], edges=[];
  hubs.forEach((h,i)=>{ nodes.push({id:'hub:'+h.label, kind:'hub', label:h.label, sub:h.ids.length+' contract'+(h.ids.length===1?'':'s')}); });
  cs.forEach(c=>{ const g=groupLabelOf(c,groupBy,override);
    nodes.push({id:c.id, kind:'contract', c, label:c.name, sub:c.id+(isMonetary(c)&&c.value?' · '+fmtKESshort(c.value):''), group:g, dot:STATUS_DOT[c.status]||'#98989b',
      hit: highlight&&act.ids.has(c.id), mut: highlight&&!act.ids.has(c.id), badge: act.badges?.[c.id]||null});
    edges.push({from:'hub:'+g, to:c.id});   // hub -> contract: arrows fan outward
  });
  return { nodes, edges, capped, shown:cs.length, total:cs.length };
}

/* ---- physics + svg (adapted, light theme) ---- */
function makeIntelGraph(model){
  const svg=document.getElementById('ig-svg'); if(!svg) return null;
  const gLinks=document.getElementById('ig-links'), gNodes=document.getElementById('ig-nodes'), vp=document.getElementById('ig-vp');
  gLinks.innerHTML=''; gNodes.innerHTML='';
  const W=svg.clientWidth||1000, H=svg.clientHeight||600;
  const nodes=model.nodes.map(n=>({...n})); const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
  const edges=model.edges.map(e=>({...e,s:byId[e.from],t:byId[e.to]})).filter(e=>e.s&&e.t);
  // seed positions: hubs on a ring, contracts near their hub
  let seed=42; const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
  const hubs=nodes.filter(n=>n.kind==='hub');
  hubs.forEach((h,i)=>{ const a=i/Math.max(1,hubs.length)*Math.PI*2; h.x=W/2+Math.cos(a)*Math.min(W,H)*0.28; h.y=H/2+Math.sin(a)*Math.min(W,H)*0.28; h.vx=h.vy=0; });
  nodes.filter(n=>n.kind==='contract').forEach(n=>{ const h=byId['hub:'+n.group]||{x:W/2,y:H/2}; n.x=h.x+(rnd()-.5)*120; n.y=h.y+(rnd()-.5)*120; n.vx=n.vy=0; });
  nodes.forEach(n=>{ if(n.kind==='hub'){ n.w=Math.max(96,Math.min(180,n.label.length*7+30)); n.h=40; } else { n.w=Math.max(92,Math.min(190,n.label.length*6.3+26)); n.h=n.sub?40:30; } });
  // svg build
  edges.forEach(e=>{ e.el=document.createElementNS('http://www.w3.org/2000/svg','path'); e.el.setAttribute('class','ig-link'); e.el.setAttribute('marker-end','url(#ig-arrow)'); gLinks.appendChild(e.el); });
  // adjacency (undirected) for the hover-focus highlight
  const adj={}; nodes.forEach(n=>adj[n.id]=new Set()); edges.forEach(e=>{ adj[e.from].add(e.to); adj[e.to].add(e.from); });
  nodes.forEach(n=>{
    const g=document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','ig-node'+(n.mut?' mut':'')+(n.hit?' hit':'')); n.g=g;
    const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
    rect.setAttribute('class','ig-chip'); rect.setAttribute('rx','10'); rect.setAttribute('width',n.w); rect.setAttribute('height',n.h);
    rect.setAttribute('fill', n.kind==='hub'?'#2c455d':'#ffffff');
    g.appendChild(rect);
    if(n.kind==='contract'){ const bar=document.createElementNS('http://www.w3.org/2000/svg','rect');
      bar.setAttribute('x',0); bar.setAttribute('y',0); bar.setAttribute('width',5); bar.setAttribute('height',n.h); bar.setAttribute('rx',2.5); bar.setAttribute('fill',n.dot); bar.setAttribute('pointer-events','none'); g.appendChild(bar); }
    const lab=document.createElementNS('http://www.w3.org/2000/svg','text');
    lab.setAttribute('class','ig-lab'); lab.setAttribute('x',n.kind==='hub'?11:13); lab.setAttribute('y',n.sub?17:19);
    lab.setAttribute('fill', n.kind==='hub'?'#eef6ff':'#2c455d'); lab.setAttribute('font-weight', n.kind==='hub'?'700':'600');
    lab.textContent = n.label.length>24?n.label.slice(0,23)+'…':n.label; g.appendChild(lab);
    if(n.sub){ const sub=document.createElementNS('http://www.w3.org/2000/svg','text');
      sub.setAttribute('class','ig-sub'); sub.setAttribute('x',n.kind==='hub'?11:13); sub.setAttribute('y',31);
      sub.setAttribute('fill', n.kind==='hub'?'#b5d9fd':'#7a7a7d'); sub.textContent=n.sub.length>26?n.sub.slice(0,25)+'…':n.sub; g.appendChild(sub); }
    if(n.badge){ // gold pill pinned to the chip's top-right corner (AI annotation)
      const bt=n.badge.length>14?n.badge.slice(0,13)+'…':n.badge, bw=bt.length*5.4+12;
      const br=document.createElementNS('http://www.w3.org/2000/svg','rect');
      br.setAttribute('x',n.w-bw+8); br.setAttribute('y',-8); br.setAttribute('width',bw); br.setAttribute('height',15); br.setAttribute('rx',7.5);
      br.setAttribute('fill','#b8862b'); br.setAttribute('stroke','#ffffff'); br.setAttribute('stroke-width','1.5'); br.setAttribute('pointer-events','none'); g.appendChild(br);
      const bl=document.createElementNS('http://www.w3.org/2000/svg','text');
      bl.setAttribute('class','ig-badge-txt'); bl.setAttribute('x',n.w-bw+14); bl.setAttribute('y',2.5); bl.setAttribute('fill','#1d1f20');
      bl.textContent=bt; g.appendChild(bl); }
    gNodes.appendChild(g);
    g.addEventListener('pointerdown',e=>igStartDrag(e,n));
    g.addEventListener('pointerenter',()=>{ if(IG&&!IG.dragging) igPaint(n); });
    g.addEventListener('pointerleave',()=>{ if(IG&&!IG.dragging) igPaint(null); });
    g.addEventListener('click',e=>{ e.stopPropagation(); if(IG&&IG.dragMoved) return;
      // contract -> explain it in the dock (workspace stays one click away in the card);
      // hub -> keep only its group
      if(n.kind==='contract') igExplain(n.id); else igFilterToGroup(n.label); });
  });
  return { svg, vp, nodes, edges, byId, adj, W, H, view:{x:0,y:0,k:1}, dragging:null, dragMoved:false };
}
// hover-focus: highlight the card + its connections, dim the rest (mirrors the reference)
function igPaint(focus){
  if(!IG) return;
  if(!focus){ IG.nodes.forEach(n=>n.g.classList.remove('hi','dim'));
    IG.edges.forEach(e=>{ e.el.classList.remove('hi','dim'); e.el.setAttribute('marker-end','url(#ig-arrow)'); }); return; }
  const near=IG.adj[focus.id]||new Set();
  IG.nodes.forEach(n=>{ const on=n.id===focus.id||near.has(n.id); n.g.classList.toggle('hi',n.id===focus.id); n.g.classList.toggle('dim',!on); });
  IG.edges.forEach(e=>{ const on=e.from===focus.id||e.to===focus.id; e.el.classList.toggle('hi',on); e.el.classList.toggle('dim',!on); e.el.setAttribute('marker-end',on?'url(#ig-arrowHi)':'url(#ig-arrow)'); });
}
// two-way linking: light up an explicit set of contract ids (hover from the dock)
function igPaintIds(ids){
  if(!IG) return;
  if(!ids||!ids.length){ igPaint(null); return; }
  const set=ids instanceof Set?ids:new Set(ids);
  IG.nodes.forEach(n=>{ const on=set.has(n.id)||(n.kind==='hub'&&[...(IG.adj[n.id]||[])].some(id=>set.has(id)));
    n.g.classList.toggle('hi',set.has(n.id)); n.g.classList.toggle('dim',!on); });
  IG.edges.forEach(e=>{ const on=set.has(e.to)||set.has(e.from);
    e.el.classList.toggle('hi',on); e.el.classList.toggle('dim',!on);
    e.el.setAttribute('marker-end',on?'url(#ig-arrowHi)':'url(#ig-arrow)'); });
}
function igFilterToGroup(label){ const ids=state.contracts.filter(c=>groupLabelOf(c,intel.groupBy,intel.groups)===label).map(c=>c.id);
  addLens({label:'Group: '+label, ids, action:'filter'}); rebuildIntelGraph(); }
// node click -> explain the contract inside the dock (Open workspace is the secondary action)
function igExplain(id){
  const c=getContract(id); if(!c) return;
  if(!intel.dockOpen){ intel.dockOpen=true; igSyncDockWidth(); }
  intel.history.push({role:'assistant', explainId:id});
  renderIntelDock(); igPaintIds([id]);
}
function igStartDrag(e,n){ e.stopPropagation(); IG.dragging=n; IG.dragMoved=false; n.g.setPointerCapture(e.pointerId);
  const p=igToWorld(e.clientX,e.clientY); IG.dragOff={x:n.x-p.x,y:n.y-p.y};
  const mv=ev=>{ if(!IG.dragging)return; const p=igToWorld(ev.clientX,ev.clientY); IG.dragging.x=p.x+IG.dragOff.x; IG.dragging.y=p.y+IG.dragOff.y; IG.dragging.vx=IG.dragging.vy=0; IG.dragMoved=true; };
  const up=()=>{ IG.dragging=null; window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up); setTimeout(()=>{if(IG)IG.dragMoved=false;},50); };
  window.addEventListener('pointermove',mv); window.addEventListener('pointerup',up);
}
function igToWorld(cx,cy){ const r=IG.svg.getBoundingClientRect(); return {x:(cx-r.left-IG.view.x)/IG.view.k,y:(cy-r.top-IG.view.y)/IG.view.k}; }
function igApplyView(){ IG.vp.setAttribute('transform',`translate(${IG.view.x},${IG.view.y}) scale(${IG.view.k})`); }
// Zoom-to-fit: frame the whole graph so you land zoomed OUT (see everything),
// then zoom in by choice. Measures the node bounding box and centres it in the
// live viewport with padding. Clamped to the wheel-zoom range (0.35–2.4) and
// capped at 1.05 so a tiny portfolio isn't blown up.
function igFitView(){
  if(!IG||!IG.nodes||!IG.nodes.length) return;
  const r=IG.svg.getBoundingClientRect();
  const vw=r.width||IG.W||1000, vh=r.height||IG.H||600;
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  IG.nodes.forEach(n=>{ minX=Math.min(minX,n.x-n.w/2); maxX=Math.max(maxX,n.x+n.w/2);
    minY=Math.min(minY,n.y-n.h/2); maxY=Math.max(maxY,n.y+n.h/2); });
  const pad=64, gw=(maxX-minX)+pad*2, gh=(maxY-minY)+pad*2;
  const k=Math.max(0.35,Math.min(1.05, Math.min(vw/gw, vh/gh)));
  IG.view.k=k;
  IG.view.x=(vw-(minX+maxX)*k)/2;
  IG.view.y=(vh-(minY+maxY)*k)/2;
  igApplyView();
}
function igTick(){
  const {nodes,edges,W,H}=IG;
  for(let i=0;i<nodes.length;i++){ const a=nodes[i];
    for(let j=i+1;j<nodes.length;j++){ const b=nodes[j];
      let dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy||1,d=Math.sqrt(d2); dx/=d;dy/=d;
      if(d2<140000){ const f=6500/d2; a.vx+=dx*f;a.vy+=dy*f; b.vx-=dx*f;b.vy-=dy*f; }
      const padX=(a.w+b.w)/2+16, padY=(a.h+b.h)/2+14, ox=padX-Math.abs(a.x-b.x), oy=padY-Math.abs(a.y-b.y);
      if(ox>0&&oy>0){ if(ox<oy){ const s=ox/2*Math.sign(a.x-b.x||dx); a.vx+=s*0.5;b.vx-=s*0.5; } else { const s=oy/2*Math.sign(a.y-b.y||dy); a.vy+=s*0.5;b.vy-=s*0.5; } }
    } }
  edges.forEach(e=>{ let dx=e.t.x-e.s.x,dy=e.t.y-e.s.y,d=Math.sqrt(dx*dx+dy*dy)||1; const f=(d-120)*0.02; dx/=d;dy/=d; e.s.vx+=dx*f;e.s.vy+=dy*f; e.t.vx-=dx*f;e.t.vy-=dy*f; });
  nodes.forEach(n=>{ n.vx+=(W/2-n.x)*0.0016; n.vy+=(H/2-n.y)*0.0016;
    if(n===IG.dragging)return; n.vx*=0.86;n.vy*=0.86; n.vx=Math.max(-35,Math.min(35,n.vx));n.vy=Math.max(-35,Math.min(35,n.vy)); n.x+=n.vx;n.y+=n.vy; });
}
function igRender(){
  IG.nodes.forEach(n=>n.g.setAttribute('transform',`translate(${n.x-n.w/2},${n.y-n.h/2})`));
  IG.edges.forEach(e=>{ const dx=e.t.x-e.s.x,dy=e.t.y-e.s.y,d=Math.sqrt(dx*dx+dy*dy)||1,nx=dx/d,ny=dy/d;
    const a=igClamp(e.s,nx,ny), b=igClamp(e.t,-nx,-ny);
    const mx=(a.x+b.x)/2, my=(a.y+b.y)/2, cx=mx-ny*16, cy=my+nx*16;   // gentle curve, like the reference
    e.el.setAttribute('d',`M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`); });
}
function igClamp(n,dx,dy){ const hw=n.w/2+2,hh=n.h/2+2,sx=dx?hw/Math.abs(dx):1e9,sy=dy?hh/Math.abs(dy):1e9,s=Math.min(sx,sy); return {x:n.x+dx*s,y:n.y+dy*s}; }

function rebuildIntelGraph(){
  const model=buildGraphModel();
  IG=makeIntelGraph(model); if(!IG) return;
  // pre-settle
  for(let i=0;i<220;i++) igTick();
  igRender(); igFitView();   // land zoomed-out, framing the whole graph
  updateIntelNote(); renderIntelLegend(model);
}
function updateIntelNote(){
  const el=document.getElementById('ig-note'); if(!el) return;
  const on=intel.lenses.filter(l=>l.on);
  const act=intelActive();
  const gb=({folder:'value stream',counterparty:'customer',status:'status',valueBand:'value',kind:'type',custom:'AI grouping'})[intel.groupBy]||intel.groupBy;
  el.innerHTML = intel.busy ? `<span class="text-brand-700">Thinking…</span>`
    : `<span class="text-ink/60">Grouped by <b class="text-ink">${gb}</b>${on.length?` · <b class="text-brand-700">${on.map(l=>igEsc(l.label)).join(' ∩ ')}</b> <span class="text-ink/40">· ${act.ids?act.ids.size:0} ${act.action==='filter'?'shown':'highlighted'}</span>`:''}</span>`
      + ((on.length||intel.groups)?` <button id="ig-clear" class="ml-2 text-[11px] font-600 text-brand-600 hover:text-brand-800">Clear all ✕</button>`:'');
  document.getElementById('ig-clear')?.addEventListener('click',()=>{ intel.lenses=[]; intel.groups=null; rebuildIntelGraph(); renderIntelDock(); });
}
function renderIntelLegend(model){
  const el=document.getElementById('ig-legend'); if(!el) return;
  el.innerHTML=`<div class="text-[10px] uppercase tracking-wider text-ink/40 mb-1.5">Status — click to filter</div>`+
    [['Draft','Drafting'],['Under Review','In Review'],['Signed','Executed'],['Declined','Closed']].map(([k,l])=>
      `<button data-igstatus="${k}" class="flex items-center gap-2 text-[11.5px] text-ink/70 hover:text-ink py-0.5"><span class="h-2.5 w-2.5 rounded-[3px]" style="background:${STATUS_DOT[k]}"></span>${l}</button>`).join('');
  el.querySelectorAll('[data-igstatus]').forEach(b=>b.addEventListener('click',()=>{ const s=b.getAttribute('data-igstatus');
    addLens({label:statusLabel(s), ids:state.contracts.filter(c=>c.status===s).map(c=>c.id), action:'filter'}); rebuildIntelGraph(); }));
}

const IG_SUGGESTIONS=[
  'Which contracts end in the next 6 months?',
  'Group by customer',
  'Show all leases',
  'Best template for a new supply agreement?',
];
function renderIntel(){
  intelRAF++; const myRAF=intelRAF;
  const groupOpts=[['folder','Value stream'],['counterparty','Customer'],['status','Status'],['valueBand','Value'],['kind','Type']];
  document.getElementById('content').innerHTML = `
  <div class="view-enter" style="height:calc(100vh - 52px);display:flex;flex-direction:column;min-height:0">
    <header style="flex:none;display:flex;align-items:center;gap:12px;padding:7px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
      <span style="font-size:11.5px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0">${state.contracts.length.toLocaleString('en-KE')} contracts · ask the panel to filter, analyse or regroup</span>
      <span style="flex:1"></span>
      <label style="display:flex;align-items:center;gap:8px;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-600);flex:none">Group by
        <span style="position:relative;display:inline-flex;align-items:center">
          <select id="ig-group" style="appearance:none;-webkit-appearance:none;-moz-appearance:none;border:1.5px solid var(--color-accent);background:var(--color-accent-100);color:var(--color-accent-800);font-family:var(--font-heading);font-weight:600;font-size:13px;letter-spacing:0;text-transform:none;padding:5px 26px 5px 11px;border-radius:4px;cursor:pointer;outline:none">
            ${groupOpts.map(([k,l])=>`<option value="${k}" ${intel.groupBy===k?'selected':''}>${l}</option>`).join('')}
          </select>
          <span style="position:absolute;right:9px;pointer-events:none;color:var(--color-accent);font-size:9px">▼</span>
        </span>
      </label>
    </header>
    <div id="ig-note" style="flex:none;padding:0 16px 4px;font-size:11.5px"></div>
    <div class="relative flex-1 min-h-0 bg-canvas flex" style="flex:1;min-height:0;display:flex;position:relative;background:var(--color-bg)">
      <div class="relative flex-1 min-w-0" style="flex:1;min-width:0;position:relative">
        <svg id="ig-svg" class="w-full h-full block cursor-grab" style="width:100%;height:100%;display:block"><defs>
          <marker id="ig-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#b7b7ba"></path></marker>
          <marker id="ig-arrowHi" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#5980a6"></path></marker>
        </defs><g id="ig-vp"><g id="ig-links"></g><g id="ig-nodes"></g></g></svg>
        <div id="ig-legend" class="absolute left-4 bottom-4 bg-white border border-line rounded-xl px-3 py-2.5 shadow-[0_6px_22px_-12px_rgba(60,40,10,.3)]"></div>
        <div class="absolute right-4 bottom-4 text-[11px] text-ink/40 bg-white border border-line rounded-lg px-2.5 py-1.5">Drag nodes · scroll to zoom · click a card to explain</div>
      </div>
      <aside id="ig-dock" class="shrink-0 bg-white border-l border-hair flex flex-col min-h-0 overflow-hidden" style="width:${intel.dockOpen?380:46}px"></aside>
    </div>
  </div>`;

  renderIntelDock();
  rebuildIntelGraph();
  // re-fit once layout settles so the fit uses the true viewport size
  requestAnimationFrame(()=>{ if(state.view==='intel'&&IG) igFitView(); });

  // pan & zoom
  const svg=document.getElementById('ig-svg');
  svg.addEventListener('wheel',e=>{ e.preventDefault(); if(!IG)return; const s=Math.exp(-e.deltaY*0.0012),nk=Math.max(0.35,Math.min(2.4,IG.view.k*s));
    const r=svg.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top; IG.view.x=mx-(mx-IG.view.x)*(nk/IG.view.k); IG.view.y=my-(my-IG.view.y)*(nk/IG.view.k); IG.view.k=nk; igApplyView(); },{passive:false});
  let pan=null;
  svg.addEventListener('pointerdown',e=>{ if(e.target.closest('.ig-node'))return; if(!IG)return; pan={x:e.clientX-IG.view.x,y:e.clientY-IG.view.y}; svg.classList.add('cursor-grabbing'); });
  window.addEventListener('pointermove',e=>{ if(pan&&IG){ IG.view.x=e.clientX-pan.x; IG.view.y=e.clientY-pan.y; igApplyView(); } });
  window.addEventListener('pointerup',()=>{ pan=null; svg.classList.remove('cursor-grabbing'); });

  // controls
  document.getElementById('ig-group').addEventListener('change',e=>{ intel.groupBy=e.target.value; intel.groups=null; rebuildIntelGraph(); });

  // animation loop (stops when leaving intel)
  (function loop(){ if(state.view!=='intel'||myRAF!==intelRAF||!IG) return; igTick(); igRender(); requestAnimationFrame(loop); })();
  setActiveNav('intel');
}

/* ---- right-hand AI dock ---- */
function igSyncDockWidth(){
  const dock=document.getElementById('ig-dock'); if(!dock) return;
  dock.style.width=(intel.dockOpen?380:46)+'px';
  // the canvas flexes — re-measure and re-settle once the width transition lands
  setTimeout(()=>{ if(state.view==='intel') rebuildIntelGraph(); },280);
}
function igMiniCard(id, extra){
  const c=getContract(id); if(!c) return '';
  return `
  <button data-ig-card="${c.id}" class="w-full text-left flex items-center gap-2 rounded-xl border border-brand-100 bg-white hover:border-brand-300 hover:shadow-sm px-2.5 py-2 transition">
    ${extra||''}<span class="h-6 w-6 shrink-0 grid place-items-center rounded-lg bg-brand-50 text-brand-500">${icon(cIcon(c),'w-3 h-3')}</span>
    <span class="min-w-0 flex-1">
      <span class="block truncate text-[12px] font-medium text-brand-900">${igEsc(c.name)}</span>
      <span class="block text-[10px] font-mono text-ink/45">${c.id}${isMonetary(c)&&c.value?' · '+fmtKESshort(c.value):''} · ${statusLabel(c.status)}</span>
    </span>
  </button>`;
}
function igRankCard(r,i){
  const c=getContract(r.id); if(!c) return '';
  return `
  <div class="rounded-xl border ${i===0?'border-brand-300 bg-brand-50/40':'border-brand-100 bg-white'} p-1.5 space-y-1">
    ${igMiniCard(r.id,`<span class="h-6 w-6 shrink-0 grid place-items-center rounded-full ${i===0?'bg-brand-600 text-white':'bg-gold-500/15 text-gold-600'} text-[11px] font-700">${i+1}</span>`)}
    <div class="px-2 pb-1 text-[11px] leading-snug text-ink/60">${igEsc(r.reason||'')}</div>
  </div>`;
}
function igExplainCard(id){
  const c=getContract(id); if(!c) return '';
  const d=c.expiry?daysUntil(c.expiry):null;
  const row=(k,v)=>`<div class="flex justify-between gap-3 text-[11.5px] py-0.5"><span class="text-ink/45">${k}</span><span class="text-right text-brand-900 font-medium truncate">${v}</span></div>`;
  return `
  <div class="rounded-xl border border-brand-100 bg-white p-3" data-ig-hoverid="${c.id}">
    <div class="flex items-center gap-2 mb-1.5">
      <span class="h-7 w-7 shrink-0 grid place-items-center rounded-lg bg-brand-50 text-brand-500">${icon(cIcon(c),'w-3.5 h-3.5')}</span>
      <div class="min-w-0"><div class="text-[12.5px] font-600 text-brand-900 truncate">${igEsc(c.name)}</div>
      <div class="text-[10px] font-mono text-ink/45">${c.id}</div></div>
    </div>
    ${row('Type',igEsc(cKind(c)))}
    ${row('Counterparty',igEsc(c.counterparty||'—'))}
    ${row('Value',isMonetary(c)&&c.value?fmtKESshort(c.value):'Non-monetary')}
    ${row('Status',statusLabel(c.status))}
    ${row('Expiry',c.expiry?(c.expiry+(d!=null?(d>=0?` · in ${d}d`:' · lapsed'):'')):'—')}
    ${row('Group',igEsc(groupLabelOf(c,intel.groupBy,intel.groups)))}
    <button data-ig-ws="${c.id}" class="mt-2 w-full rounded-lg bg-brand-900 text-white px-3 py-1.5 text-[11.5px] font-600 hover:bg-brand-800 transition">Open workspace →</button>
  </div>`;
}
function igMsgHTML(m){
  if(m.role==='user')
    return `<div class="ai-msg flex justify-end"><div class="max-w-[85%] rounded-2xl rounded-br-md bg-brand-900 text-white px-3.5 py-2 text-[13px]">${igEsc(m.text)}</div></div>`;
  const body = m.ranked ? m.ranked.map((r,i)=>igRankCard(r,i)).join('')
    : m.explainId ? igExplainCard(m.explainId)
    : (m.cardIds||[]).map(id=>igMiniCard(id)).join('');
  return `<div class="ai-msg flex gap-2">
    <div class="h-6 w-6 shrink-0 grid place-items-center rounded-lg bg-gold-500/15 text-gold-600 mt-0.5">${icon('sparkle','w-3 h-3')}</div>
    <div class="min-w-0 flex-1 space-y-1.5">
      ${m.text?`<div class="rounded-2xl rounded-tl-md border px-3.5 py-2 text-[13px] leading-relaxed ${m.err?'bg-rose-50 border-rose-200 text-rose-800':'bg-canvas border-brand-100 text-brand-900'}">${m.text}</div>`:''}
      ${body}
    </div>
  </div>`;
}
function renderIntelDock(){
  const dock=document.getElementById('ig-dock'); if(!dock) return;
  if(!intel.dockOpen){
    dock.innerHTML=`
      <button id="igd-expand" title="Open the intelligence panel" class="h-full w-full flex flex-col items-center pt-3 gap-2 text-gold-500 hover:bg-brand-50/60 transition">
        ${icon('sparkle','w-4 h-4')}<span class="text-[9px] font-mono text-ink/40 [writing-mode:vertical-rl]">AI panel</span>
      </button>`;
    document.getElementById('igd-expand').addEventListener('click',()=>{ intel.dockOpen=true; renderIntelDock(); igSyncDockWidth(); });
    return;
  }
  const msgs=intel.history.map(igMsgHTML).join('');
  const typing=intel.busy?`
    <div class="ai-msg flex gap-2">
      <div class="h-6 w-6 shrink-0 grid place-items-center rounded-lg bg-gold-500/15 text-gold-600 mt-0.5">${icon('sparkle','w-3 h-3')}</div>
      <div class="rounded-2xl rounded-tl-md bg-canvas border border-brand-100 px-3.5 py-2.5 typing"><span></span><span></span><span></span></div>
    </div>`:'';
  dock.innerHTML=`
    <div class="flex items-center gap-2 px-3.5 py-3 border-b border-hair shrink-0">
      <span class="text-gold-500">${icon('sparkle','w-4 h-4')}</span>
      <span class="font-display font-700 text-[13px] text-ink flex-1">Intelligence panel</span>
      <button id="igd-collapse" title="Collapse panel" class="h-6 w-6 grid place-items-center rounded-lg text-ink/40 hover:text-ink hover:bg-brand-50 transition text-[13px]">›</button>
    </div>
    ${intel.lenses.length?`
    <div class="px-3.5 py-2 border-b border-hair shrink-0 flex flex-wrap items-center gap-1.5">
      ${intel.lenses.map(l=>`
        <span data-lens-hover="${l.id}" class="ig-lens inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-mono cursor-pointer ${l.on?'border-brand-500 bg-brand-50 text-brand-700':'border-line bg-white text-ink/40'}">
          <button data-lens-toggle="${l.id}" title="${l.on?'Lens on — click to ignore':'Lens off — click to apply'}">${igEsc(l.label)} · ${l.ids.length}</button>
          <button data-lens-x="${l.id}" title="Remove lens" class="hover:text-rose-600">✕</button>
        </span>`).join('')}
      <button id="igd-clear" class="text-[10.5px] font-600 text-brand-600 hover:text-brand-800 ml-auto">Clear all</button>
    </div>`:''}
    <div id="igd-feed" class="flex-1 min-h-0 overflow-y-auto scroll-thin px-3.5 py-3 space-y-3">
      ${msgs||`<div class="text-[12.5px] text-ink/50 leading-relaxed pt-2">Habari! Ask me anything about this portfolio — I filter, highlight and regroup the nodes as I answer. Answers pin as lenses you can toggle or stack.</div>`}
      ${typing}
    </div>
    ${!intel.history.length?`
    <div class="px-3.5 pb-2 shrink-0 flex flex-wrap gap-1.5">
      ${IG_SUGGESTIONS.map(s=>`<button data-igsug="${igEsc(s)}" class="text-[10.5px] rounded-full border border-brand-100 bg-canvas hover:bg-brand-50 hover:border-brand-300 px-2.5 py-1 text-brand-700 transition text-left">${igEsc(s)}</button>`).join('')}
    </div>`:''}
    <div class="p-3 border-t border-hair shrink-0 relative">
      <input id="igd-input" placeholder="Ask about the portfolio…" class="w-full rounded-xl border border-inputln bg-white pl-3.5 pr-16 py-2.5 text-[13px] outline-none focus:border-brand-600 focus:ring-[3px] focus:ring-[rgba(11,122,95,.1)] transition"/>
      <button id="igd-go" class="absolute right-[18px] top-1/2 -translate-y-1/2 rounded-lg bg-brand-600 text-white px-3 py-1.5 text-[11px] font-600 hover:bg-brand-700 transition">Ask</button>
    </div>`;
  const feed=document.getElementById('igd-feed'); feed.scrollTop=feed.scrollHeight;
  // wiring
  document.getElementById('igd-collapse').addEventListener('click',()=>{ intel.dockOpen=false; renderIntelDock(); igSyncDockWidth(); });
  const go=()=>{ const inp=document.getElementById('igd-input'); const v=inp.value; inp.value=''; intelAsk(v); };
  document.getElementById('igd-go').addEventListener('click',go);
  document.getElementById('igd-input').addEventListener('keydown',e=>{ if(e.key==='Enter') go(); });
  dock.querySelectorAll('[data-igsug]').forEach(b=>b.addEventListener('click',()=>intelAsk(b.getAttribute('data-igsug'))));
  document.getElementById('igd-clear')?.addEventListener('click',()=>{ intel.lenses=[]; intel.groups=null; rebuildIntelGraph(); renderIntelDock(); });
  // lens chips: toggle / remove / hover-trace
  dock.querySelectorAll('[data-lens-toggle]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation();
    const l=intel.lenses.find(x=>x.id===b.getAttribute('data-lens-toggle')); if(l){ l.on=!l.on; rebuildIntelGraph(); renderIntelDock(); } }));
  dock.querySelectorAll('[data-lens-x]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation();
    intel.lenses=intel.lenses.filter(x=>x.id!==b.getAttribute('data-lens-x')); rebuildIntelGraph(); renderIntelDock(); }));
  dock.querySelectorAll('[data-lens-hover]').forEach(el=>{
    const l=()=>intel.lenses.find(x=>x.id===el.getAttribute('data-lens-hover'));
    el.addEventListener('pointerenter',()=>{ const x=l(); if(x) igPaintIds(x.ids); });
    el.addEventListener('pointerleave',()=>igPaintIds(null));
  });
  // contract cards: hover-trace + click to highlight; workspace button
  dock.querySelectorAll('[data-ig-card]').forEach(b=>{
    const id=b.getAttribute('data-ig-card');
    b.addEventListener('pointerenter',()=>igPaintIds([id]));
    b.addEventListener('pointerleave',()=>igPaintIds(null));
    b.addEventListener('click',()=>igPaintIds([id]));
  });
  dock.querySelectorAll('[data-ig-hoverid]').forEach(el=>{
    const id=el.getAttribute('data-ig-hoverid');
    el.addEventListener('pointerenter',()=>igPaintIds([id]));
    el.addEventListener('pointerleave',()=>igPaintIds(null));
  });
  dock.querySelectorAll('[data-ig-ws]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); openWorkspace(b.getAttribute('data-ig-ws')); }));
}

function closePartyModal(){ document.getElementById('party-scrim')?.classList.remove('open'); }
function openPartyModal(name){
  const scrim=document.getElementById('party-scrim'), modal=document.getElementById('party-modal');
  const own = state.contracts.filter(c=>c.counterparty===name);
  // pull in relation-linked contracts + their parties
  const ownIds=new Set(own.map(c=>c.id));
  const linked=[];
  REL_SEEDS.forEach(r=>{
    const a=state.contracts.find(c=>c.name===r.from), b=state.contracts.find(c=>c.name===r.to);
    if(!a||!b) return;
    if(ownIds.has(a.id)&&!ownIds.has(b.id)) linked.push(b);
    if(ownIds.has(b.id)&&!ownIds.has(a.id)) linked.push(a);
  });
  const nodes=[], edges=[];
  const trunc=(s,n=22)=>s.length>n?s.slice(0,n-1)+'\u2026':s;
  nodes.push({id:'p:'+name, type:'party', label:trunc(name), sub:own.length+' deals', bar:'#2c455d', kind:'party'});
  const addC=c=>{ if(nodes.some(n=>n.id===c.id)) return;
    nodes.push({id:c.id, type:'contract', c, label:trunc(c.name), sub:!isMonetary(c)?'non-monetary':(c.value?fmtKESshort(c.value):c.status), bar:STATUS_BAR[c.status], kind:c.folder}); };
  own.forEach(c=>{ addC(c); edges.push({from:c.id,to:'p:'+name,label:'party to'}); });
  linked.forEach(c=>{ addC(c);
    if(c.counterparty && c.counterparty!==name){
      const pid='p:'+c.counterparty;
      if(!nodes.some(n=>n.id===pid)) nodes.push({id:pid,type:'party',label:trunc(c.counterparty),sub:'counterparty',bar:'#2c455d',kind:'party'});
      edges.push({from:c.id,to:pid,label:'party to'});
    }});
  REL_SEEDS.forEach(r=>{
    const a=state.contracts.find(c=>c.name===r.from), b=state.contracts.find(c=>c.name===r.to);
    if(a&&b&&nodes.some(n=>n.id===a.id)&&nodes.some(n=>n.id===b.id)) edges.push({from:a.id,to:b.id,label:r.label});
  });
  const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
  edges.forEach(e=>{e.s=byId[e.from]; e.t=byId[e.to];});
  const W=640,H=340;
  nodes.forEach(n=>{ n.w=Math.max(104,Math.min(170,n.label.length*6.4+50)); n.h=38; n.x=0; n.y=0; });
  const savedPos=state.mapPos; state.mapPos={};   // fresh layout, don't reuse global cache
  layoutGraph(nodes, edges, W, H);
  state.mapPos=savedPos;

  const val=own.filter(x=>x.status!=='Declined').reduce((s,x)=>s+Number(x.value||0),0);
  modal.innerHTML=`
  <div class="view-enter bg-white rounded-2xl border border-brand-100 shadow-2xl shadow-brand-900/25 overflow-hidden">
    <div class="flex items-center gap-3 px-5 py-4 border-b border-brand-100/60">
      <span class="h-9 w-9 grid place-items-center rounded-lg bg-brand-900 text-gold-400">${icon('users')}</span>
      <div class="flex-1 min-w-0">
        <div class="font-display font-600 text-brand-900 truncate">${name}</div>
        <div class="text-[11px] font-mono text-brand-800/65">${own.length} agreements \u00b7 ${fmtKES(val)} exposure \u00b7 relationship neighborhood</div>
      </div>
      <button id="pm-close" class="h-8 w-8 grid place-items-center rounded-lg hover:bg-brand-50 text-brand-400 hover:text-brand-800 transition">${icon('x')}</button>
    </div>
    <svg viewBox="0 0 ${W} ${H}" class="w-full bg-canvas/60">
      ${edges.map((e,i)=>`<path class="mlink" d="M${e.s.x} ${e.s.y} L${e.t.x} ${e.t.y}"/>
        <text class="mlabel show" x="${(e.s.x+e.t.x)/2}" y="${(e.s.y+e.t.y)/2-3}" text-anchor="middle">${e.label}</text>`).join('')}
      ${nodes.map(n=>`
      <g class="mnode" ${n.type==='contract'?`data-open="${n.id}"`:''} transform="translate(${n.x},${n.y})">
        <rect class="chipbg" x="${-n.w/2}" y="${-n.h/2}" width="${n.w}" height="${n.h}" rx="8"/>
        <rect x="${-n.w/2}" y="${-n.h/2}" width="4" height="${n.h}" rx="2" fill="${n.bar}"/>
        <text x="${-n.w/2+10}" y="${-2}" font-size="10" font-weight="600" fill="#2c455d">${n.label.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text>
        <text x="${-n.w/2+10}" y="${10}" font-size="7.5" font-family="'IBM Plex Mono',monospace" fill="#7a7a7d">${n.sub}</text>
      </g>`).join('')}
    </svg>
    <div class="px-5 py-3 border-t border-brand-100/60 text-[11px] text-brand-800/65 flex items-center justify-between">
      <span>Click a contract node to open its workspace</span>
      <span class="font-mono">${nodes.length} nodes \u00b7 bounded neighborhood</span>
    </div>
  </div>`;
  scrim.classList.add('open');
  modal.querySelector('#pm-close').addEventListener('click',closePartyModal);
  modal.querySelectorAll('[data-open]').forEach(el=>el.addEventListener('click',()=>{ closePartyModal(); openWorkspace(el.getAttribute('data-open')); }));
}

Object.assign(window,{IG,IG_SUGGESTIONS,IG_TEMPLATE_RE,INTEL_CAP,KIND_TAG,REL_SEEDS,SEV_WEIGHT,STATUS_BAR,STATUS_DOT,addLens,applyTemplateResult,buildGraph,buildGraphModel,closePartyModal,contractPlainText,daysUntil,graphInterpret,groupLabelOf,igApplyView,igFitView,igClamp,igEsc,igExplain,igExplainCard,igFilterToGroup,igMiniCard,igMsgHTML,igPaint,igPaintIds,igRankCard,igRender,igStartDrag,igSyncDockWidth,igTick,igToWorld,intel,intelActive,intelAsk,intelGraphAsk,intelRAF,intelTemplateAsk,intelUI,layoutGraph,makeIntelGraph,openPartyModal,parseHorizonDays,rebuildIntelGraph,renderIntel,renderIntelDock,renderIntelLegend,riskScore,scanPortfolio,templateShortlist,updateIntelNote,valueBand});
