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
const STATUS_BAR = {'Draft':'var(--st-gray-dot)','Under Review':'var(--st-amber-dot)','Signed':'var(--st-green-dot)','Declined':'var(--st-ruby-dot)'};
const KIND_TAG = {proc:{t:'PROC',c:'#2E9F80'},mfg:{t:'MFG',c:'#b45309'},dist:{t:'DIST',c:'#0369a1'},sales:{t:'SALES',c:'var(--st-amber-dot)'},mktg:{t:'MKTG',c:'#7c3aed'},corp:{t:'CORP',c:'var(--st-green-dot)'},party:{t:'PARTY',c:'#2c455d'}};

function buildGraph(){
  const nodes=[], edges=[];
  const trunc=(s,n=24)=>s.length>n?s.slice(0,n-1)+'\u2026':s;
  // contract nodes
  state.contracts.forEach(c=>{
    nodes.push({ id:c.id, type:'contract', c, label:trunc(c.name), sub:c.id+' \u00b7 '+(c.value?(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):'\u2014'),
      kind:c.folder, bar:STATUS_BAR[c.status], w:0,h:0,x:0,y:0 });
  });
  // party nodes (aggregate)
  const parties={};
  state.contracts.forEach(c=>{ if(!c.counterparty) return;
    (parties[c.counterparty]||(parties[c.counterparty]=[])).push(c); });
  Object.entries(parties).forEach(([name,cs])=>{
    const val=cs.filter(x=>x.status!=='Declined'&&!x.archived).reduce((s,x)=>s+(window.fxHomeValue?fxHomeValue(x):Number(x.value||0)),0);
    nodes.push({ id:'p:'+name, type:'party', party:name, cs, label:trunc(name), sub:cs.length+' deal'+(cs.length===1?'':'s')+' \u00b7 '+fmtMoneyShort(val),
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
  intelUI.scannedAt = new Date().toLocaleString(langLocale(),{dateStyle:'medium',timeStyle:'short'});
}

/* ============================================================
   VIEW: INTEL — Copilot contract graph (force-directed, HaTi light theme)
   Every contract is a node, clustered around group hubs. A free-form Copilot
   box both FILTERS (non-matches disappear) and RE-CLUSTERS (group by
   customer / folder / status / value / city…). Uses the server LLM when a
   key is configured; otherwise the built-in interpreter.
   ============================================================ */
const INTEL_CAP = 120;
const STATUS_DOT = {'Draft':'var(--st-gray-dot)','Under Review':'var(--st-amber-dot)','Signed':'var(--st-green-dot)','Declined':'var(--st-ruby-dot)'};
window.intel = { groupBy:'folder', groups:null /*{id:label} override from Copilot*/,
  lenses:[] /*[{id,label,ids:[],on,action:'filter'|'highlight',badges:{id:txt}|null}]*/,
  history:[] /*dock conversation: {role,text,cardIds?,ranked?,explainId?,compare?,err?}*/,
  compareSel:[] /*contract ids staged for a node-driven comparison*/,
  frictionAI:null /*Copilot's read on the friction brief: {busy,key,html,at,err}*/,
  busy:false, dockOpen:true,
  // Horizon-style leftward expand; the preference sticks per device.
  dockWide:(()=>{ try{ return !!(typeof lsGet==='function'&&lsGet('hati.v1.intelWide')); }catch(_){ return false; } })(),
  seq:1 };
// Dock width: collapsed sliver, normal, or wide (capped so the graph always
// keeps meaningful room; on narrow screens wide degrades gracefully).
function igDockWidth(){
  if(!intel.dockOpen) return 46;
  if(!intel.dockWide) return 380;
  return Math.max(380, Math.min(660, Math.round((window.innerWidth||1200)*0.45)));
}
window.IG = null;      // live graph model
window.intelRAF = 0;   // animation token
const igEsc = s => String(s??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

function valueBand(v){ v=Number(v||0); const c=jxCurrency(); if(!v) return 'Non-monetary'; if(v>=50e6) return `≥ ${c} 50M`; if(v>=10e6) return `${c} 10–50M`; if(v>=1e6) return `${c} 1–10M`; return `< ${c} 1M`; }
function groupLabelOf(c, groupBy, override){
  if(override && override[c.id]) return override[c.id];
  switch(groupBy){
    case 'counterparty': return c.counterparty||'No counterparty';
    case 'status': return statusLabel(c.status);
    case 'valueBand': return valueBand(c.value);
    case 'kind': return cKind(c);
    case 'expiry': {
      const e=(typeof effectiveExpiry==='function'?effectiveExpiry(c):c.expiry);
      const d=e?daysUntil(String(e).slice(0,10)):null;
      if(d==null||isNaN(d)) return 'No expiry set';
      if(d<0) return 'Expired';
      if(d<=30) return 'Within 30 days';
      if(d<=90) return '31–90 days';
      if(d<=365) return '3–12 months';
      return 'Beyond a year';
    }
    case 'risk': {
      if(!c.scan) return 'Not scanned';
      const r=riskScore(c);
      return r>=8?'High risk':r>=3?'Medium risk':r>=1?'Low risk':'No open findings';
    }
    case 'source': return c.source==='upload'?'Uploaded paper'
      :(c.templateId||c.templateForm||c.template)?'From a template':'Drafted in HaTi';
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
    vis=cs.filter(c=>c.expiry&&c.status!=='Declined'&&!c.archived&&daysUntil(c.expiry)>=0&&daysUntil(c.expiry)<=horizon);
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
  else if(has('high value','high-value','biggest','largest','top ','most valuable')) { vis=cs.filter(c=>Number(c.value||0)>=20e6); note=`High-value (≥ ${jxCurrency()} 20M)`; }
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

/* ---- dock entry point: routes to the right engine ----
   The Intel dock is a notebook over the whole contract repository. Intent
   routing:
   • compliance/red-flag questions   → intelComplianceScan (reads every contract)
   • compare / 2+ ids                → intelChatAsk (grounded side-by-side)
   • template advice                 → intelTemplateAsk
   • graph commands (group/filter/…) → intelGraphAsk (map manipulation)
   • everything else that reads/summarises/quotes a contract → intelChatAsk
   • otherwise                        → intelGraphAsk (safe default) */
const IG_TEMPLATE_RE=/\btemplate\b|\bbase\b.{0,30}\b(new|next|on)\b|model (contract|agreement)|starting point|start(ing)? from/i;
// "which contracts have risky/illegal clauses", "red flags", "compliance issues"…
const IG_COMPLIANCE_RE=/\b(illegal|unlawful|non-?complian(?:t|ce)|red[-\s]?flags?|problematic|risky clauses?|risk(?:y)?\s+(?:or|and)\s+(?:illegal|unlawful|problematic)|onerous|unfair terms?|dodgy|complian(?:ce|t)\s+(?:issues?|risks?|review|check)|potential(?:ly)?\s+(?:illegal|unlawful|risky|problematic))\b/i;
// reads / summarises / quotes a contract → grounded Copilot Q&A
const IG_QA_RE=/\b(summar(?:y|ise|ize|ies)|quote|verbatim|explain|describe|read|clause|says?|state[sd]?|obligations?|payment terms?|governing law|liabilit\w*|termination|indemnit\w*|renewal terms?|brief(?:ing)?|what (?:does|do|is|are|kind|type)|tell me about|how much (?:is|does)|when does)\b/i;
// manipulates the map rather than reading text → graph interpreter
const IG_GRAPH_RE=/\b(group by|regroup|filter|show (?:only|all|me)|highlight|hide|cluster|colou?r by|which contracts? (?:end|expire|renew|are|match))\b/i;
async function intelAsk(qRaw){
  const q=(qRaw||'').trim();
  if(!q||intel.busy) return;
  intel.history.push({role:'user', text:q});
  intel.busy=true; renderIntelDock(); updateIntelNote();
  try{
    const idHits=(q.match(/MK-\d+/gi)||[]).length;
    if(IG_COMPLIANCE_RE.test(q))                        await intelComplianceScan(q);
    else if(/\bcompare\b/i.test(q) || idHits>=2)        await intelChatAsk(q);
    else if(IG_TEMPLATE_RE.test(q))                     await intelTemplateAsk(q);
    else if(IG_GRAPH_RE.test(q) && !IG_QA_RE.test(q))   await intelGraphAsk(q);
    else if(IG_QA_RE.test(q) || idHits===1)             await intelChatAsk(q);
    else                                                await intelGraphAsk(q);
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
        text:(/key|configure|401|model/i.test(e.message)?'The Copilot engine needs an API key — using the built-in interpreter instead.':'Copilot error: '+igEsc(e.message)+' — using the built-in interpreter instead.')});
    }
  } else if(!API_MODE() && typeof _localAiKey==='function' && _localAiKey() && typeof aiLocalGraph==='function'){
    // local mode with a browser-stored key → browser-direct graph interpreter
    try{ res=await aiLocalGraph(q); }
    catch(e){
      intel.history.push({role:'assistant', err:true,
        text:'Copilot error: '+igEsc(e.message||String(e))+' — using the built-in interpreter instead.'});
    }
  }
  if(!res) res=graphInterpret(q);           // fallback
  if(res.groupBy){ intel.groupBy=res.groupBy; intel.groups=res.groups||null; }
  if(res.visibleIds && res.visibleIds.length)
    addLens({ label:res.note||res.visibleIds.length+' matches', ids:res.visibleIds, action:res.action||'filter', badges:res.badges||null });
  intel.history.push({role:'assistant', text:res.answer||res.note||'Done.', cardIds:(res.visibleIds||[]).slice(0,5)});
}

/* ---- template advisor: stage 1 metadata shortlist, stage 2 clause-level Copilot rank ---- */
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
        text:(/key|configure|401|model/i.test(e.message)?'The Copilot engine needs an API key for template analysis — here is a metadata-only ranking instead.':'Copilot template analysis failed ('+igEsc(e.message)+') — here is a metadata-only ranking instead.')});
    }
  }
  // fallback: deterministic metadata ranking, honest about its limits
  const ranked=shortlist.slice(0,3).map(c=>({ id:c.id,
    reason:[c.status==='Signed'?'executed — battle-tested terms':'closest match on type', cKind(c), c.counterparty?('with '+c.counterparty):null].filter(Boolean).join(' · ') }));
  const top=getContract(ranked[0].id);
  applyTemplateResult(ranked, `Closest template match on metadata: <b>${top?.name||'—'}</b>.${(API_MODE()&&!state.aiConfigured)||!API_MODE()?' Configure the Copilot engine for a clause-level comparison.':''}`);
}
function applyTemplateResult(ranked, answer){
  const badges={}; ranked.forEach((r,i)=>badges[r.id]='#'+(i+1));
  addLens({ label:'Template picks · '+ranked.length, ids:ranked.map(r=>r.id), action:'highlight', badges });
  intel.history.push({role:'assistant', text:answer||'Ranked the best template candidates.', ranked});
}

/* ---- HaTi Copilot in the Intel dock: node-aware Q&A, comparison & insight ----
   These call the same server-mediated /api/ai/chat endpoint the main Copilot
   panel uses, so answers are grounded in the real contracts and cite them. The
   graph then lights up the cited nodes. All degrade gracefully with no key. */

// Map the dock conversation to the server's message shape (role + plain text).
function intelChatMessages(){
  const strip=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  /* ---- AN ERROR BUBBLE IS NOT PART OF THE CONVERSATION ----
     The dock pushes its own failures into `intel.history` as assistant turns —
     "Copilot error: Daily Copilot budget reached…" — and then sent them back to
     the model as though the assistant had said them. So one failure went on
     poisoning every later answer for the rest of the sitting, long after the
     budget was raised or the network came back. The main Copilot panel has
     excluded `err` from its own history all along (js/ai.js); this is the same
     guard, and the two now read alike. */
  return intel.history
    .filter(m=>(m.role==='user'||m.role==='assistant') && m.text && !m.err)
    .map(m=>({ role:m.role, content:strip(m.text) }))
    .filter(m=>m.content).slice(-8);
}

// Turn a chat response into a dock message + light the cited nodes.
/* ---- RICH DOCK ANSWERS, CHARTS INCLUDED ----
   The main Copilot panel extracts ```hati-chart``` fences into live charts;
   the dock used aiFmt for the text but never HYDRATED the canvases, so a
   chart the model drew arrived as an empty card. This runs the same
   extraction, keeps the blocks ON the message, and renderIntelDock hydrates
   them after every paint — same drawing features, both surfaces. */
let _igFmtSeq=0;
function igFmtRich(raw){
  if(typeof aiExtractCharts!=='function'||typeof aiRichText!=='function')
    return { html:(typeof aiFmt==='function')?aiFmt(String(raw==null?'':raw)):igEsc(String(raw==null?'':raw)), blocks:[] };
  const { text, blocks }=aiExtractCharts(String(raw==null?'':raw), 'igd'+(++_igFmtSeq));
  let html=aiRichText(text);
  for(const b of blocks) b.html=aiChartHtml(b);
  html=aiPlaceCharts(html, blocks);
  for(const b of blocks) html=html.split(`<div class="ai-chart-host" id="${b.key}"></div>`)
    .join(`<div class="ai-chart-host" id="${b.key}">${b.html}</div>`);
  return { html, blocks };
}
function intelPushChatResult(res){
  const cardIds=(res.cards||[]).map(c=>c.id).filter(id=>getContract(id));
  const rich=igFmtRich(res.answer||'');
  const notice=res.notice?`<div class="text-[11px] text-amber-700 mt-2">${igEsc(res.notice)}</div>`:'';
  intel.history.push({ role:'assistant', text:rich.html+notice, compare:res.compare||null, cardIds, blocks:rich.blocks });
  if(cardIds.length) igPaintIds(cardIds);
}

// General Copilot Q&A in the Intel dock (used for compare + typed questions).
// With no Copilot key, comparisons still work via the deterministic local table;
// other free-form questions get a clear nudge instead of silence.
async function intelChatAsk(q){
  const ids=(String(q).match(/MK-\d+/gi)||[]).map(s=>s.toUpperCase()).filter((v,i,a)=>a.indexOf(v)===i);
  if(!(typeof copilotAvailable==='function' && copilotAvailable())){
    if(ids.length>=2 && typeof localCompareData==='function'){
      const cmp=localCompareData(ids);
      if(cmp){ intel.history.push({role:'assistant', text:'Side-by-side from your live contract data.'+(cmp.verdict?' '+igEsc(cmp.verdict):''), compare:cmp, cardIds:ids.filter(id=>getContract(id))}); igPaintIds(ids); return; }
    }
    intel.history.push({role:'assistant', err:true,
      text:'For free-form questions I need an Anthropic API key (Team &amp; Settings → Copilot engine). Meanwhile I can still filter, highlight and regroup the map — or compare specific contracts, e.g. "compare MK-101 and MK-104".'});
    return;
  }
  try{
    const res=await copilotAsk(intelChatMessages(), { view:'intel' });
    intelPushChatResult(res);
  }catch(e){
    // Copilot failed mid-flight → still deliver a local comparison if we can.
    if(ids.length>=2 && typeof localCompareData==='function'){
      const cmp=localCompareData(ids);
      if(cmp){ intel.history.push({role:'assistant', text:'The Copilot engine was unavailable, so here is a side-by-side from your live data instead.', compare:cmp, cardIds:ids.filter(id=>getContract(id))}); igPaintIds(ids); return; }
    }
    intel.history.push({role:'assistant', err:true, text:'Copilot error: '+igEsc(e.message||String(e))});
  }
}

/* Portfolio-wide clause review. Reads every live contract through the
   deterministic Kenyan-practice scan (the same engine behind per-contract "Copilot
   review") and surfaces the ones carrying potential legal/compliance concerns —
   risks, missing protections, ambiguous terms. Grounded, instant, and works with
   or without an Copilot key. Framed as a first-pass review for counsel, not advice. */
async function intelComplianceScan(q){
  const cs=(state.contracts||[]).filter(c=>c.status!=='Declined'&&!c.archived);
  const RANK=(typeof SEV_RANK==='object'&&SEV_RANK)||{high:3,med:2,low:1};
  const worst=arr=>(typeof worstSevOf==='function')?worstSevOf(arr)
    :(arr.some(f=>f.sev==='high')?'high':arr.some(f=>f.sev==='med')?'med':'low');
  const rows=[];
  cs.forEach(c=>{
    let findings=[];
    try{ findings = c.scan ? (typeof openFindings==='function'?openFindings(c):[])
                           : (typeof scanRules==='function'?scanRules(c):[]); }catch(_){ findings=[]; }
    // Genuine clause concerns only: risks, ambiguities and missing legal
    // protections. Exclude the generic data-entry gaps (ids "g-…": no value,
    // date, counterparty) — those are completeness prompts, not clause risk.
    const flagged=(findings||[]).filter(f=>f&&(f.kind==='risk'||f.kind==='ambiguity'||(f.kind==='missing'&&!/^g-/.test(f.id||''))));
    if(flagged.length) rows.push({c, findings:flagged, worst:worst(flagged)});
  });
  rows.sort((a,b)=> (RANK[b.worst]||0)-(RANK[a.worst]||0) || b.findings.length-a.findings.length);

  if(!rows.length){
    intel.history.push({role:'assistant', text:`Good news — a first-pass review of your ${cs.length} live contract${cs.length===1?'':'s'} surfaced no clauses flagged as potentially risky, unlawful or missing. Open any contract and run <b>${i18t('int_copilot_review')}</b> for a deeper per-contract check.`});
    return;
  }
  const sevPill=s=>{ const lbl=((typeof SEV_META==='object'&&SEV_META&&SEV_META[s]&&SEV_META[s].label)||s);
    const col=s==='high'?['var(--st-ruby-bg)','var(--st-ruby-fg)']:s==='med'?['var(--st-amber-bg)','var(--st-amber-fg)']:['var(--st-gray-bg)','var(--st-gray-fg)'];
    return `<span style="display:inline-flex;align-items:center;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:1px 7px;border-radius:0;background:${col[0]};color:${col[1]}">${igEsc(lbl)}</span>`; };
  const top=rows.slice(0,8);
  const totalFindings=rows.reduce((n,r)=>n+r.findings.length,0);
  let html=`<b>${i18t('int_compliance_review')}</b> ${rows.length} of ${cs.length} live contracts carry clauses worth a closer look — ${totalFindings} potential issue${totalFindings===1?'':'s'} in all (risks, missing protections or ambiguous terms), ranked by severity. This is a first-pass review to raise with counsel, not legal advice.`;
  html+=top.map(r=>{
    const items=r.findings.slice(0,3).map(f=>`<li style="margin:2px 0"><b>${igEsc(f.title)}</b>${f.why?` — ${igEsc(f.why)}`:''}</li>`).join('');
    const more=r.findings.length>3?`<div style="font-size:12px;color:var(--color-neutral-500);margin-top:1px">+${r.findings.length-3} more</div>`:'';
    return `<div style="margin-top:10px;padding-top:9px;border-top:1px solid color-mix(in srgb,var(--color-text) 9%,transparent)">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;flex-wrap:wrap">
        <button data-ig-ws="${r.c.id}" data-ig-hoverid="${r.c.id}" title="Open ${igEsc(r.c.name)}" style="font-size:14px;font-weight:600;color:var(--color-accent-800);background:none;border:0;padding:0;cursor:pointer;text-align:left">${igEsc(r.c.name)}</button>
        ${sevPill(r.worst)}
        <span style="font-size:12px;color:var(--color-neutral-500);font-family:var(--font-mono)">${igEsc(r.c.id)}</span>
      </div>
      <ul style="margin:0;padding-left:16px;font-size:13px;color:var(--color-neutral-700);line-height:1.45">${items}</ul>${more}
    </div>`;
  }).join('');
  if(rows.length>top.length) html+=`<div style="font-size:12px;color:var(--color-neutral-600);margin-top:9px">…and ${rows.length-top.length} more flagged contract${rows.length-top.length===1?'':'s'}. Ask me about any one by name or id for the detail, or open it and run <b>${i18t('int_copilot_review')}</b>.</div>`;

  intel.history.push({role:'assistant', text:html});
  igPaintIds(top.map(r=>r.c.id));
}

// Node click → an instant facts card PLUS an async Copilot insight beneath it.
function intelAIExplain(id){
  const c=getContract(id); if(!c) return;
  if(!(typeof copilotAvailable==='function' && copilotAvailable())) return;   // facts card already shown by igExplain
  intel.busy=true; renderIntelDock();
  copilotAsk(
    [{role:'user', content:`Give a brief, risk-focused briefing on contract ${id} (${c.name}) — what it is, its status and value, and the most important thing to watch. 3 sentences max.`}],
    { view:'intel', activeContractId:id, activeContractName:c.name },
  ).then(res=>{ intel.busy=false; intelPushChatResult(res); rebuildIntelGraph(); renderIntelDock(); igPaintIds([id]); })
    .catch(e=>{ intel.busy=false; intel.history.push({role:'assistant', err:true,
      text:'Couldn’t generate an insight for '+igEsc(c.name)+' — '+igEsc(e.message||String(e))}); renderIntelDock(); });
}

// Node-driven comparison tray: toggle a contract in/out of the selection.
function intelToggleCompare(id){
  if(!getContract(id)) return;
  const i=intel.compareSel.indexOf(id);
  if(i>=0) intel.compareSel.splice(i,1); else intel.compareSel.push(id);
  intel.compareSel=intel.compareSel.slice(0,4);   // cap matches the server tool
  igPaintIds(intel.compareSel);
  renderIntelDock();
}
// Run the comparison over the staged nodes. With no Copilot key (or on Copilot failure)
// it still delivers the deterministic local table, so Compare ALWAYS works.
async function intelRunCompare(){
  const ids=intel.compareSel.slice();
  if(ids.length<2){ if(typeof toast==='function') toast(i18t('int_stage_two'),'err'); return; }
  const names=ids.map(id=>getContract(id)?.name||id);
  intel.history.push({role:'user', text:'Compare '+names.join(', ')});
  intel.compareSel=[]; intel.busy=true; renderIntelDock();
  const localFallback=(prefix)=>{
    const cmp=(typeof localCompareData==='function')?localCompareData(ids):null;
    if(cmp) intel.history.push({role:'assistant', text:(prefix||'Side-by-side from your live contract data.')+(cmp.verdict?' '+igEsc(cmp.verdict):''), compare:cmp, cardIds:ids});
    else intel.history.push({role:'assistant', err:true, text:'Could not build the comparison.'});
  };
  try{
    if(typeof copilotAvailable==='function' && copilotAvailable()){
      const res=await copilotAsk([{role:'user', content:'Compare these contracts side by side: '+ids.join(', ')+'. Cover value, term/expiry, payment terms, key risks and open findings.'}], { view:'intel' });
      intelPushChatResult(res);
    } else {
      localFallback(`Side-by-side from your live contract data. <span class="text-[11px] text-amber-700">${i18t('int_add_key')}</span>`);
    }
  }catch(e){ localFallback('The Copilot engine was unavailable ('+igEsc(e.message||'error')+'), so here is a side-by-side from your live data instead.'); }
  intel.busy=false; rebuildIntelGraph(); renderIntelDock(); igPaintIds(ids);
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
    nodes.push({id:c.id, kind:'contract', c, label:c.name, sub:c.id+(isMonetary(c)&&c.value?' · '+(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):''), group:g, dot:STATUS_DOT[c.status]||'var(--st-gray-dot)',
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
  nodes.forEach(n=>{ if(n.kind==='hub'){ n.w=Math.max(100,Math.min(196,n.label.length*7.8+32)); n.h=40; } else { n.w=Math.max(92,Math.min(190,n.label.length*6.3+26)); n.h=n.sub?40:30; } });
  // svg build
  edges.forEach(e=>{ e.el=document.createElementNS('http://www.w3.org/2000/svg','path'); e.el.setAttribute('class','ig-link'); e.el.setAttribute('marker-end','url(#ig-arrow)'); gLinks.appendChild(e.el); });
  // adjacency (undirected) for the hover-focus highlight
  const adj={}; nodes.forEach(n=>adj[n.id]=new Set()); edges.forEach(e=>{ adj[e.from].add(e.to); adj[e.to].add(e.from); });
  nodes.forEach(n=>{
    const g=document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','ig-node'+(n.mut?' mut':'')+(n.hit?' hit':'')); n.g=g;
    const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
    rect.setAttribute('class','ig-chip'); rect.setAttribute('rx','10'); rect.setAttribute('width',n.w); rect.setAttribute('height',n.h);
    /* A GROUP is not a contract, and in dark mode the old slate hub fill sat
       a shade away from the contract chips — one field of near-identical
       cards. Hubs now wear the brand's deep teal with an accent ring, in
       both themes: the accent tokens re-map per theme, so the distinction
       survives dark mode instead of fighting it. */
    rect.style.fill = n.kind==='hub'?'var(--color-accent-800, #134e4a)':'var(--color-surface)';
    if(n.kind==='hub'){ rect.style.stroke='var(--accent-solid, #14b8a6)'; rect.setAttribute('stroke-width','1.5'); }
    g.appendChild(rect);
    if(n.kind==='contract'){ const bar=document.createElementNS('http://www.w3.org/2000/svg','rect');
      bar.setAttribute('x',0); bar.setAttribute('y',0); bar.setAttribute('width',5); bar.setAttribute('height',n.h); bar.setAttribute('rx',2.5); bar.setAttribute('fill',n.dot); bar.setAttribute('pointer-events','none'); g.appendChild(bar); }
    const lab=document.createElementNS('http://www.w3.org/2000/svg','text');
    lab.setAttribute('class','ig-lab'); lab.setAttribute('x',n.kind==='hub'?11:13); lab.setAttribute('y',n.sub?17:19);
    lab.style.fill = n.kind==='hub'?'var(--color-accent-50)':'var(--color-text)'; lab.setAttribute('font-weight', n.kind==='hub'?'700':'600');
    if(n.kind==='hub') lab.setAttribute('letter-spacing','.5');
    /* Uppercase is the second distinguisher — colour alone is the one channel
       a reader might not have. */
    const labText=n.kind==='hub'?String(n.label).toUpperCase():n.label;
    lab.textContent = labText.length>24?labText.slice(0,23)+'…':labText; g.appendChild(lab);
    if(n.sub){ const sub=document.createElementNS('http://www.w3.org/2000/svg','text');
      sub.setAttribute('class','ig-sub'); sub.setAttribute('x',n.kind==='hub'?11:13); sub.setAttribute('y',31);
      sub.setAttribute('fill', n.kind==='hub'?'var(--color-accent-200)':'#7a7a7d'); sub.textContent=n.sub.length>26?n.sub.slice(0,25)+'…':n.sub; g.appendChild(sub); }
    if(n.badge){ // gold pill pinned to the chip's top-right corner (Copilot annotation)
      const bt=n.badge.length>14?n.badge.slice(0,13)+'…':n.badge, bw=bt.length*5.4+12;
      const br=document.createElementNS('http://www.w3.org/2000/svg','rect');
      br.setAttribute('x',n.w-bw+8); br.setAttribute('y',-8); br.setAttribute('width',bw); br.setAttribute('height',15); br.setAttribute('rx',7.5);
      br.setAttribute('fill','var(--st-amber-dot)'); br.style.stroke='var(--color-surface)'; br.setAttribute('stroke-width','1.5'); br.setAttribute('pointer-events','none'); g.appendChild(br);
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
  // Layer a real Copilot insight beneath the instant facts card (no-op if the
  // Copilot engine isn't configured — the facts card still stands on its own).
  intelAIExplain(id);
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
  // ever-advancing clock → a tiny persistent drift so the graph never freezes
  const t=(IG._t=(IG._t||0)+1)*0.02;
  for(let i=0;i<nodes.length;i++){ const a=nodes[i];
    for(let j=i+1;j<nodes.length;j++){ const b=nodes[j];
      let dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy||1,d=Math.sqrt(d2); dx/=d;dy/=d;
      if(d2<140000){ const f=6500/d2; a.vx+=dx*f;a.vy+=dy*f; b.vx-=dx*f;b.vy-=dy*f; }
      const padX=(a.w+b.w)/2+16, padY=(a.h+b.h)/2+14, ox=padX-Math.abs(a.x-b.x), oy=padY-Math.abs(a.y-b.y);
      if(ox>0&&oy>0){ if(ox<oy){ const s=ox/2*Math.sign(a.x-b.x||dx); a.vx+=s*0.5;b.vx-=s*0.5; } else { const s=oy/2*Math.sign(a.y-b.y||dy); a.vy+=s*0.5;b.vy-=s*0.5; } }
    } }
  edges.forEach(e=>{ let dx=e.t.x-e.s.x,dy=e.t.y-e.s.y,d=Math.sqrt(dx*dx+dy*dy)||1; const f=(d-120)*0.02; dx/=d;dy/=d; e.s.vx+=dx*f;e.s.vy+=dy*f; e.t.vx-=dx*f;e.t.vy-=dy*f; });
  nodes.forEach((n,idx)=>{ n.vx+=(W/2-n.x)*0.0016; n.vy+=(H/2-n.y)*0.0016;
    if(n===IG.dragging)return;
    // stable per-node phase (hash of id) → each node drifts on its own gentle orbit
    if(n._ph==null){ let h=0; const s=String(n.id||idx); for(let k=0;k<s.length;k++) h=(h*31+s.charCodeAt(k))>>>0; n._ph=(h%628)/100; }
    n.vx+=Math.cos(t+n._ph)*0.05; n.vy+=Math.sin(t*1.07+n._ph*1.3)*0.05;
    n.vx*=0.86;n.vy*=0.86; n.vx=Math.max(-35,Math.min(35,n.vx));n.vy=Math.max(-35,Math.min(35,n.vy)); n.x+=n.vx;n.y+=n.vy; });
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
  const gb=({folder:'value stream',counterparty:'customer',status:'status',valueBand:'value',kind:'type',custom:'Copilot grouping'})[intel.groupBy]||intel.groupBy;
  el.innerHTML = intel.busy ? `<span class="text-brand-700">${i18t('int_thinking')}</span>`
    : `<span class="text-ink/60">${i18t('int_grouped_by')} <b class="text-ink">${gb}</b>${on.length?` · <b class="text-brand-700">${on.map(l=>igEsc(l.label)).join(' ∩ ')}</b> <span class="text-ink/40">· ${act.ids?act.ids.size:0} ${act.action==='filter'?'shown':'highlighted'}</span>`:''}</span>`
      + ((on.length||intel.groups)?` <button id="ig-clear" class="ml-2 text-[11px] font-600 text-brand-600 hover:text-brand-800">${i18t('int_clear_all_x')}</button>`:'');
  document.getElementById('ig-clear')?.addEventListener('click',()=>{ intel.lenses=[]; intel.groups=null; rebuildIntelGraph(); renderIntelDock(); });
}
function renderIntelLegend(model){
  const el=document.getElementById('ig-legend'); if(!el) return;
  el.innerHTML=`<div class="text-[10px] uppercase tracking-wider text-ink/40 mb-1.5">${i18t('int_status_click')}</div>`+
    [['Draft','Drafting'],['Under Review','In Review'],['Signed','Executed'],['Declined','Closed']].map(([k,l])=>
      `<button data-igstatus="${k}" class="flex items-center gap-2 text-[11.5px] text-ink/70 hover:text-ink py-0.5"><span class="h-2.5 w-2.5 rounded-[3px]" style="background:${STATUS_DOT[k]}"></span>${l}</button>`).join('');
  el.querySelectorAll('[data-igstatus]').forEach(b=>b.addEventListener('click',()=>{ const s=b.getAttribute('data-igstatus');
    addLens({label:statusLabel(s), ids:state.contracts.filter(c=>c.status===s).map(c=>c.id), action:'filter'}); rebuildIntelGraph(); }));
}

const IG_SUGGESTIONS=[
  'Which contracts have potentially risky or unlawful clauses?',
  'Summarize my highest-value contract',
  'What does MK-101 say about liability?',
  'Compare my two highest-value contracts',
  'Which contracts end in the next 6 months?',
  'Group by customer',
];
function renderIntel(){
  intelRAF++; const myRAF=intelRAF;
  /* Two surfaces under one nav item: the graph, and the negotiation-friction
     read of the same portfolio. The tab lives on the module state so a
     repaint comes back where the reader was. */
  /* Three surfaces under one nav item. The frame is first and is the default:
     it is the overview every business gets, and the other two are the two
     specific questions you go on to ask. */
  if(['frame','map','friction'].indexOf(intel.tab)<0) intel.tab='frame';
  const groupOpts=[['folder','Value stream'],['counterparty','Customer'],['status','Status'],['valueBand','Value'],['kind','Type'],['expiry','Expiry window'],['risk','Risk'],['source','Origin']];
  /* UNDERLINE TABS, not pills. Both controls in this strip read the same way:
     the live one is the one with the accent rule under it. The -1px bottom
     margin drops that rule onto the header's own hairline so the two share a
     single line instead of stacking two. */
  /* NO WEIGHT HERE — each builder sets its own, because weight is half the
     active state (20 Aug 2026, measured against the SAP render, which draws
     every tab `active ? 700 : 400`). This carried a flat 600 for every tab,
     live or not, so the row had no weight contrast and the duplex 600 did not
     even widen the live one: colour and the underline were doing all the work
     on their own. */
  const UNDERTAB='border:0;border-radius:0;background:none;margin-bottom:-1px;padding:10px 1px;font:inherit;cursor:pointer;display:flex;align-items:center';
  /* align-self:stretch, NOT a fixed height. The strip grows when the caption
     runs to two lines on a narrow window; a centred button would leave its
     underline floating in the middle of a tall strip. Stretched, the rule
     always lands on the strip's own hairline, and -1px puts the two on the
     same line instead of stacking them. */
  const TABROW='display:flex;align-items:stretch;align-self:stretch;flex:none';
  /* ---- A RESTING TAB IS DARK INK, NOT A CAPTION (owner-asked 23 Aug 2026) ----
     "The font I have highlighted should also be the font used in the tab
     navigation panels within the insights page." The same correction .room-tab
     took on 22 Aug, in the owner's same words, never swept past that one row.
     MEASURED, this row already matched the negotiation page's reading tabs on
     Inter, 14px, 400 resting, 700 + accent live and the 2px underline, and
     differed on one value: it rested on --color-neutral-500, the LABEL shade,
     where the reference rests on --color-text. A tab is a thing you read and
     press, not metadata about one. The FRICTION SEGMENTS below take the same
     ink for the same reason — they are the same control at 13px, and leaving
     them faded would put the fault back one row down. */
  const tabBtn=(k,label)=>`<button data-ig-tab="${k}" style="${UNDERTAB};border-bottom:2px solid ${intel.tab===k?'var(--accent-solid,var(--color-accent))':'transparent'};font-size:14px;font-weight:${intel.tab===k?700:400};color:${intel.tab===k?'var(--accent-ink,var(--color-accent))':'var(--color-text)'}">${label}</button>`;
  const tabsHtml=`<div style="${TABROW};gap:20px">${tabBtn('frame',i18t('pf_tab'))}${tabBtn('friction',i18t('int_negotiation_friction'))}${tabBtn('map',i18t('int_contract_graph'))}</div>`;
  /* The friction levers live IN the header strip (the approved comp): the
     period toggle and the counterparty select sit beside the tabs, so the
     panel below is all answer and no chrome. */
  const ff=intel.frictionFilter||null;
  /* The counterparty SELECT has gone. Filtering by counterparty is still live —
     it is done by clicking a name in the report itself (data-igf-cp), and Clear
     below still lifts it — so the strip carries one lever, not two. */
  const ffOn=days=>days==null?!(ff&&ff.days):(ff&&ff.days)===days;
  const ffSeg=(days,label)=>`<button data-igf-days="${days==null?'':days}" style="${UNDERTAB};border-bottom:2px solid ${ffOn(days)?'var(--accent-solid,var(--color-accent))':'transparent'};font-size:13px;font-weight:${ffOn(days)?700:400};color:${ffOn(days)?'var(--accent-ink,var(--color-accent))':'var(--color-text)'}">${label}</button>`;
  const frictionControls=`
      <div style="${TABROW};gap:16px">${ffSeg(null,i18t('int_all_time'))}${ffSeg(90,i18t('int_last_90'))}</div>
      ${ff&&(ff.counterparty||ff.days||ff.clause)?`<button id="ig-friction-clear" style="border:0;background:none;cursor:pointer;font:inherit;font-size:12px;font-weight:700;color:var(--color-accent);flex:none">✕ Clear</button>`:''}`;
  /* ---- THE HEAD AND THE TABS ARE ONE WHITE CARD (owner-reported 24 Aug 2026:
         "the highlighted area should just be one big white card not divided
         into grey and white") ----
     The tab strip below has always painted itself on --color-surface; the
     TITLE line above it is the shell's #page-head, which paints nothing and so
     sat on the page's grey ground. Measured: a transparent 33px band directly
     on top of a white 42px one, with no gap between them — two halves of what
     reads as one header, in two different colours.
     WRITTEN HERE, NOT IN THE SHELL, and that is deliberate: this style block
     lives inside #content, so it is thrown away the moment the reader leaves
     Insights and cannot quietly repaint the header of a page that has not asked
     for it. It is the register's own precedent, which paints the same element
     the same way for the same reason. */
  const headStyle=`<style>#page-head{background:var(--color-surface)}</style>`;
  const headerHtml=headStyle+`
    <!-- No vertical padding: the tab buttons carry it themselves, so their
         underline lands on the strip's own hairline.

         ONE LINE, NOT WRAPPED. The strip used to wrap so the caption would
         never be cut mid-word — it needed 541px and got 358px at 1280, and the
         sentence explaining the report was truncated. Underline tabs change
         the trade: in a WRAPPED flex container each line has its own height,
         so a stretched tab reaches only the bottom of ITS line and the rule
         floats mid-strip. Kept to one line, the tabs span the whole strip
         however tall the caption makes it. The caption keeps its ellipsis and
         is still hidden outright below 899px, so nothing is cut mid-word —
         it is trimmed with a "…" or not shown. Friction has no caption. -->
    <header style="flex:none;display:flex;align-items:center;gap:0 14px;padding:0 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
      ${tabsHtml}
      ${intel.tab==='map'?`<span class="ig-hd-sub" style="font-size:13px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1 1 auto;min-width:0">${state.contracts.length.toLocaleString(jxLocale())} contracts · ask the panel to read, summarise, quote or flag risky clauses</span>`:''}
      <span style="flex:1"></span>
      ${intel.tab==='friction'?frictionControls:''}
      ${intel.tab==='map'?`<label style="display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-600);flex:none">Group by
        <span style="position:relative;display:inline-flex;align-items:center">
          <select id="ig-group" style="appearance:none;-webkit-appearance:none;-moz-appearance:none;border:1.5px solid var(--color-accent);background:var(--color-accent-100);color:var(--color-accent-800);font-family:var(--font-heading);font-weight:600;font-size:14px;letter-spacing:0;text-transform:none;padding:5px 26px 5px 11px;border-radius:0;cursor:pointer;outline:none">
            ${groupOpts.map(([k,l])=>`<option value="${k}" ${intel.groupBy===k?'selected':''}>${l}</option>`).join('')}
          </select>
          <span style="position:absolute;right:9px;pointer-events:none;color:var(--color-accent);font-size:10px">▼</span>
        </span>
      </label>`:''}
    </header>`;
  if(intel.tab==='frame'){
    /* Same shell as the friction tab: header strip, then one scrolling body.
       The frame carries no header levers of its own — its controls are the
       panels themselves. */
    document.getElementById('content').innerHTML=`
    <div class="view-enter" style="height:var(--view-h);display:flex;flex-direction:column;min-height:0">
      ${headerHtml}
      <div id="ig-frame" class="scroll-thin pf-scroll" style="flex:1;min-height:0;overflow-y:auto;background:var(--color-bg);padding:12px 20px 16px">${
        (typeof portfolioFrameHtml==='function')?portfolioFrameHtml():''}</div>
    </div>`;
    document.querySelectorAll('[data-ig-tab]').forEach(b=>b.addEventListener('click',()=>{ intel.tab=b.getAttribute('data-ig-tab'); renderIntel(); }));
    if(typeof wirePortfolioFrame==='function') wirePortfolioFrame(renderIntel);
    return;
  }
  if(intel.tab==='friction'){
    /* THE CONTROL TOWER — full width, no pinned Copilot. The dock stays on
       the Contract Graph, where its questions drive the map; here the levers
       are real controls on the page, and free-form probing goes through the
       regular Copilot launcher, whose snapshot carries these same KPIs. */
    document.getElementById('content').innerHTML=`
    <div class="view-enter" style="height:var(--view-h);display:flex;flex-direction:column;min-height:0">
      ${headerHtml}
      <div id="ig-friction" class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;background:var(--color-bg);padding:9px 20px 14px">${intelFrictionHtml()}</div>
    </div>`;
    document.querySelectorAll('[data-ig-tab]').forEach(b=>b.addEventListener('click',()=>{ intel.tab=b.getAttribute('data-ig-tab'); renderIntel(); }));
    document.getElementById('ig-friction-clear')?.addEventListener('click',()=>{ intel.frictionFilter=null; renderIntel(); });
    document.querySelectorAll('[data-igf-days]').forEach(b=>b.addEventListener('click',()=>{
      const v=b.getAttribute('data-igf-days');
      intel.frictionFilter={...(intel.frictionFilter||{}), days:v?Number(v):null};
      if(!intel.frictionFilter.days) delete intel.frictionFilter.days;
      if(!Object.keys(intel.frictionFilter).length) intel.frictionFilter=null;
      renderIntel();
    }));
    /* The brief's own verbs (WO friction redesign): the clause link opens Our
       standards; "See the six" unfolds the named deadlocks in place; any
       counterparty — hero link or table row — filters the page to them; a
       deadlock row opens its contract. */
    document.querySelector('[data-igf-standards]')?.addEventListener('click',()=>setView('playbook'));
    document.querySelector('[data-igf-deadlocks]')?.addEventListener('click',()=>{
      document.getElementById('igf-deadlist')?.classList.toggle('hidden'); });
    document.querySelectorAll('[data-igf-open]').forEach(b=>b.addEventListener('click',e=>{
      e.stopPropagation(); openWorkspace(b.getAttribute('data-igf-open')); }));
    document.querySelectorAll('[data-igf-cp]').forEach(el=>el.addEventListener('click',()=>{
      intel.frictionFilter={...(intel.frictionFilter||{}), counterparty:el.getAttribute('data-igf-cp')};
      renderIntel();
    }));
    intelFrictionWireAI();
    setActiveNav('intel');
    return;
  }
  document.getElementById('content').innerHTML = `
  <div class="view-enter" style="height:var(--view-h);display:flex;flex-direction:column;min-height:0">
    ${headerHtml}
    <div id="ig-note" style="flex:none;padding:0 16px 4px;font-size:13px"></div>
    <div class="relative flex-1 min-h-0 bg-canvas flex" style="flex:1;min-height:0;display:flex;position:relative;background:var(--color-bg)">
      <div class="relative flex-1 min-w-0" style="flex:1;min-width:0;position:relative">
        <svg id="ig-svg" class="w-full h-full block cursor-grab" style="width:100%;height:100%;display:block"><defs>
          <marker id="ig-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#b7b7ba"></path></marker>
          <marker id="ig-arrowHi" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--color-accent)"></path></marker>
        </defs><g id="ig-vp"><g id="ig-links"></g><g id="ig-nodes"></g></g></svg>
        <div id="ig-legend" class="absolute left-4 bottom-4 bg-white border border-line rounded-xl px-3 py-2.5 shadow-[0_6px_22px_-12px_rgba(60,40,10,.3)]"></div>
        <div class="absolute right-4 bottom-4 text-[11px] text-ink/40 bg-white border border-line rounded-lg px-2.5 py-1.5">${i18t('int_drag_nodes')}</div>
      </div>
      <aside id="ig-dock" class="shrink-0 flex flex-col min-h-0 overflow-hidden" style="width:${igDockWidth()}px;background:var(--color-bg);border-left:1px solid var(--color-neutral-300);box-shadow:-10px 0 28px -20px rgba(43,43,45,.35);transition:width .28s cubic-bezier(.22,.61,.36,1)"></aside>
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
  window._igPan=null;
  svg.addEventListener('pointerdown',e=>{ if(e.target.closest('.ig-node'))return; if(!IG)return;
    window._igPan={x:e.clientX-IG.view.x,y:e.clientY-IG.view.y}; svg.classList.add('cursor-grabbing'); });
  /* ---- THE PAN PAIR IS ARMED ONCE, ON THE WINDOW ----
     Bound per render, and this map is re-rendered on every grouping change and
     every return to Insights, so the pair stacked for the life of the sitting
     — each copy holding an svg node that had been replaced. The drag handler
     forty lines up gets this right already: it removes its own pair on
     pointerup. This one had no way to.

     `pan` therefore lives on the window flag rather than in the closure, so
     the one surviving listener works with whatever the CURRENT render set —
     a closure variable would belong to the first paint for ever. */
  if(!window._igPanWired){
    window._igPanWired=true;
    window.addEventListener('pointermove',e=>{
      const p=window._igPan; if(!p||!IG) return;
      IG.view.x=e.clientX-p.x; IG.view.y=e.clientY-p.y; igApplyView();
    });
    window.addEventListener('pointerup',()=>{
      window._igPan=null;
      const live=document.getElementById('ig-svg');
      if(live) live.classList.remove('cursor-grabbing');
    });
  }

  // controls
  document.getElementById('ig-group').addEventListener('change',e=>{ intel.groupBy=e.target.value; intel.groups=null; rebuildIntelGraph(); });
  document.querySelectorAll('[data-ig-tab]').forEach(b=>b.addEventListener('click',()=>{ intel.tab=b.getAttribute('data-ig-tab'); renderIntel(); }));

  // animation loop (stops when leaving intel — or when the tab is not the map;
  // intelRAF was bumped at the top, so a tab switch retires this loop too)
  (function loop(){ if(state.view!=='intel'||myRAF!==intelRAF||!IG) return; igTick(); igRender(); requestAnimationFrame(loop); })();
  setActiveNav('intel');
}

/* ============================================================
   NEGOTIATION FRICTION — where deals get stuck
   ============================================================
   Every number here is COUNTED from the fingerprinted change records the
   negotiations already store — no new collection, no model, no estimate.
   A clause "contested" in a deal means at least one tracked change was
   filed against it there, in any round, by either side. */
function intelFrictionStats(filter){
  const f=filter||null;
  const cutoff=f&&f.days?Date.now()-f.days*86400000:null;
  const inWindow=iso=>{ if(!cutoff) return true; const t=new Date(iso||0).getTime(); return isFinite(t)&&t>=cutoff; };
  const list=((window.state&&Array.isArray(state.contracts))?state.contracts:[])
    .filter(c=>!f||!f.counterparty||String(c&&c.counterparty||'').toLowerCase()
      .includes(String(f.counterparty).toLowerCase()));
  const per=new Map(); const cps=new Map(); const dealRounds=new Map();
  const days=[]; const decideMs=[]; const deadlockList=[];
  let deals=0, roundsSum=0, deadlocks=0, openedThisMonth=0;
  let oursAcc=0, oursRej=0, theirsAcc=0, theirsRej=0;
  let signed=0, signedRound1=0;
  const monthKey=iso=>String(iso||'').slice(0,7);
  const thisMonth=monthKey(new Date().toISOString());
  for(const c of list){
    if(!c||!c.negotiation||typeof window.negoAllChanges!=='function') continue;
    let all=[];
    try{ all=negoAllChanges(c); }catch(_){ continue; }
    if(!all.length) continue;
    /* The period filter reads ACTIVITY: a deal counts when any of its changes
       (or its opening) falls inside the window. */
    if(cutoff&&!(inWindow(c.negotiation.startedAt)||all.some(ch=>inWindow(ch&&ch.createdAt)))) continue;
    deals++;
    if(monthKey(c.negotiation.startedAt)===thisMonth) openedThisMonth++;
    const rounds=Math.max(1, Number(c.negotiation.round)||1);
    roundsSum+=rounds; dealRounds.set(c.id, rounds);
    const cpKey=String(c.counterparty||'').trim()||'(no counterparty)';
    if(!cps.has(cpKey)) cps.set(cpKey,{name:cpKey,deals:0,rounds:0,acc:0,rej:0});
    const cp=cps.get(cpKey); cp.deals++; cp.rounds+=rounds;
    if(c.execution&&c.execution.at){
      signed++;
      if(((c.negotiation.rounds&&c.negotiation.rounds.length)||0)<=1) signedRound1++;
      if(c.negotiation.startedAt){
        const d=(new Date(c.execution.at)-new Date(c.negotiation.startedAt))/86400000;
        if(isFinite(d)&&d>=0) days.push(d);
      }
    }
    const labels=new Set();
    for(const ch of all){
      if(!ch) continue;
      const k=String(ch.clauseLabel||ch.headingText||'').replace(/\s+/g,' ').trim();
      if(k) labels.add(k.length>44?k.slice(0,44):k);
      const ours=ch.authorSide==='owner';
      if(ch.status==='accepted'){ ours?oursAcc++:theirsAcc++; if(ours) cp.acc++; }
      if(ch.status==='rejected'){
        ours?oursRej++:theirsRej++; if(ours) cp.rej++;
        if(!ch.withdrawn){ deadlocks++;
          /* Named, not just counted — "See the six" has to have six to show. */
          if(deadlockList.length<12) deadlockList.push({ id:c.id, name:String(c.name||c.id),
            clause:String(ch.clauseLabel||ch.headingText||'a clause').replace(/\s+/g,' ').trim().slice(0,60) });
        }
      }
      if((ch.status==='accepted'||ch.status==='rejected')&&ch.resolvedAt&&ch.createdAt){
        const ms=new Date(ch.resolvedAt)-new Date(ch.createdAt);
        if(isFinite(ms)&&ms>=0) decideMs.push(ms);
      }
    }
    for(const k of labels){
      if(!per.has(k)) per.set(k,{label:k,ids:new Set()});
      per.get(k).ids.add(c.id);
    }
  }
  const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
  /* Per-clause extra rounds: avg rounds where the clause was fought minus avg
     where it was not — claimed only when both sides of the split exist. */
  const extraOf=e=>{
    const withR=[], without=[];
    for(const [id,r] of dealRounds) (e.ids.has(id)?withR:without).push(r);
    return (withR.length&&without.length)?avg(withR)-avg(without):null;
  };
  const ranked=[...per.values()]
    .filter(e=>!f||!f.clause||e.label.toLowerCase().includes(String(f.clause).toLowerCase()))
    .sort((a,b)=>b.ids.size-a.ids.size).slice(0,8)
    .map(e=>({label:e.label, n:e.ids.size, share:deals?e.ids.size/deals:0, extra:extraOf(e)}));
  const counterparties=[...cps.values()]
    .map(cp=>({name:cp.name, deals:cp.deals, avgRounds:cp.deals?cp.rounds/cp.deals:0,
      acceptUs:(cp.acc+cp.rej)?cp.acc/(cp.acc+cp.rej):null}))
    .sort((a,b)=>b.avgRounds-a.avgRounds).slice(0,8);
  const median=a=>{ if(!a.length) return null; const s=[...a].sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
  let insight=null;
  if(ranked.length&&deals>=3&&ranked[0].extra!=null&&ranked[0].extra>0.05)
    insight={ label:ranked[0].label, share:ranked[0].share, extra:ranked[0].extra };
  /* The slowest counterparty a reader can act on: most rounds per deal, named
     party preferred over the anonymous bucket, two deals before the label
     sticks — one slow deal is an anecdote, not a pattern. */
  const named=[...cps.values()].filter(cp=>cp.name!=='(no counterparty)');
  const slowPool=(named.length?named:[...cps.values()]).filter(cp=>cp.deals>=2);
  const slowest=slowPool.length?slowPool
    .map(cp=>({name:cp.name, deals:cp.deals, avgRounds:cp.rounds/cp.deals,
      acceptUs:(cp.acc+cp.rej)?cp.acc/(cp.acc+cp.rej):null}))
    .sort((a,b)=>b.avgRounds-a.avgRounds)[0]:null;
  return { deals, openedThisMonth, avgRounds: deals?roundsSum/deals:0,
    avgDays: days.length?avg(days):null, medianDays: median(days),
    oursAcceptShare:(oursAcc+oursRej)?oursAcc/(oursAcc+oursRej):null,
    theirsAcceptShare:(theirsAcc+theirsRej)?theirsAcc/(theirsAcc+theirsRej):null,
    deadlocks, deadlockList, medianDecisionMs:median(decideMs),
    round1Share: signed?signedRound1/signed:null, signed,
    clauses: ranked, counterparties, slowest, insight };
}
/* THE FRICTION PAGE, AS A BRIEF (redesign to the approved comp).

   One panel, two columns. The LEFT answers "what is slowing you down" in
   three sentences a reader can act on — the costliest clause, the refused
   changes nobody withdrew, the slowest counterparty — each with its number
   leading and one link that does the obvious thing. The RIGHT keeps the
   evidence: the contested-clauses bars and the per-counterparty table,
   click-to-filter. Colour is never alone: a teal bar means the clause costs
   extra rounds and the +N figure beside it says how many (in red, a cost); a
   grey bar with a green −N means fighting it actually shortens deals. */
function intelFrictionHtml(){
  const f=intel.frictionFilter||null;
  const st=intelFrictionStats(f);
  const pct=v=>Math.round(v*100);
  if(!st.deals) return `<div style="max-width:960px;margin:0 auto">
    <div style="max-width:560px;margin:40px auto;text-align:center;color:var(--color-neutral-600);font-size:14px;line-height:1.6">
    <b style="color:var(--color-text)">${f?i18t('int_nothing_matches'):i18t('int_no_negotiations')}</b><br/>${f?i18t('int_clear_filters'):i18t('int_once_contracts')}</div></div>`;
  const hrs=ms=>{ if(ms==null) return null; const h=ms/3600000; return h<1?'&lt;1h':h<48?Math.round(h)+'h':Math.round(h/24)+'d'; };
  const RULE='border-bottom:1px solid var(--color-divider)';
  const LINK='display:inline-block;margin-top:6px;font-size:13px;font-weight:700;color:var(--color-accent-700);cursor:pointer;background:none;border:0;padding:0;font-family:inherit';

  /* ---- left: the three sentences ---- */
  const top=st.clauses[0]||null;
  const hero=(num,tone,body)=>`<div style="display:flex;gap:14px;padding:9px 0;${RULE}">
    <div style="flex:none;min-width:62px;font-size:22px;font-weight:700;letter-spacing:-.02em;line-height:1.1;font-variant-numeric:tabular-nums;color:${tone}">${num}</div>
    <div style="min-width:0;font-size:14px;line-height:1.55;color:var(--color-neutral-800)">${body}</div>
  </div>`;
  const clauseHero=top?hero(pct(top.share)+'%','var(--color-text)',
    `of negotiations get stuck on <b>${igEsc(top.label)}</b>${top.extra!=null&&top.extra>0
      ?` — and when they do, the deal takes <b>${top.extra.toFixed(1)} more round${top.extra>=1.95?'s':''}</b>. It is the single change worth making to your standard paper.`
      :` — contested more than any other clause${top.extra!=null&&top.extra<0?', though the fights there tend to settle quickly':''}.`}
    <br><button data-igf-standards style="${LINK}">${i18t('int_open_clause_std')}</button>`):'';
  const dl=st.deadlockList;
  const dealCount=new Set(dl.map(x=>x.id)).size;
  const deadHero=hero(String(st.deadlocks), st.deadlocks?'var(--st-amber-fg,#b45309)':'var(--color-text)',
    st.deadlocks
      ?`change${st.deadlocks===1?' is':'s are'} <b>${i18t('int_refused_open')}</b> — nobody withdrew ${st.deadlocks===1?'it':'them'}, so ${dealCount===1?'one deal is':dealCount+' deals are'} waiting on a decision somebody has to make.
        <br><button data-igf-deadlocks style="${LINK}">See the ${st.deadlocks<=12?['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'][st.deadlocks]:st.deadlocks} →</button>
        <div id="igf-deadlist" class="hidden" style="margin-top:8px">${dl.map(x=>`<button data-igf-open="${igEsc(x.id)}" style="display:flex;gap:8px;width:100%;text-align:left;border:0;background:none;cursor:pointer;font:inherit;font-size:13px;padding:4px 0;color:var(--color-neutral-700)"><b style="color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px">${igEsc(x.name)}</b><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${igEsc(x.clause)}</span><span style="margin-left:auto;color:var(--color-accent-700);font-weight:700;white-space:nowrap">open →</span></button>`).join('')}</div>`
      :`changes are refused and still open — every refusal on the book has been answered or withdrawn. Nothing is deadlocked.`);
  const sl=st.slowest;
  const slowHero=(sl&&st.counterparties.length>1)?hero(sl.avgRounds.toFixed(1),'var(--color-text)',
    `rounds per deal with <b>${igEsc(sl.name)}</b>, against ${st.avgRounds.toFixed(1)} across the book — the slowest counterparty you negotiate with${sl.acceptUs!=null?`, and they accept <b>${pct(sl.acceptUs)}%</b> of what you ask`:''}.
     ${f&&f.counterparty===sl.name?'':`<br><button data-igf-cp="${igEsc(sl.name)}" style="${LINK}">Filter the page to ${igEsc(sl.name)} →</button>`}`):'';
  const mini=(n,t)=>`<div style="min-width:0"><div style="font-size:17px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-.01em">${n}</div><div style="font-size:12px;color:var(--color-neutral-600);font-weight:600;line-height:1.35">${t}</div></div>`;
  const minis=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px 18px;padding-top:10px">
    ${st.medianDays!=null?mini(st.medianDays<1?'&lt;1 day':Math.round(st.medianDays)+' days','median to signature'):''}
    ${st.medianDecisionMs!=null?mini(hrs(st.medianDecisionMs),'median decision time'):''}
    ${(st.oursAcceptShare!=null||st.theirsAcceptShare!=null)?mini(`${st.oursAcceptShare!=null?pct(st.oursAcceptShare)+'%':'—'} / ${st.theirsAcceptShare!=null?pct(st.theirsAcceptShare)+'%':'—'}`,'our asks / their asks accepted'):''}
    ${st.round1Share!=null?mini(pct(st.round1Share)+'%','signed within round 1'):''}
  </div>`;
  /* THE READING COLUMN STOPS AT A READABLE MEASURE. With the card filling the
     width (see below), these paragraphs ran ~130 characters a line on a wide
     monitor — past the point where prose is comfortable. The CARD is full
     width, as the owner asked; the SENTENCES are not. */
  const left=`<div style="padding:12px 18px;min-width:0;max-width:78ch">
    <div style="font-size:16px;font-weight:700;letter-spacing:-.01em">${i18t('int_what_slowing')}</div>
    <div style="font-size:12px;color:var(--color-neutral-600);margin-top:2px">${st.deals} negotiation${st.deals===1?'':'s'}${st.openedThisMonth?` · ${st.openedThisMonth} opened this month`:''} · ${st.avgRounds.toFixed(1)} rounds each on average</div>
    ${clauseHero}${deadHero}${slowHero}
    ${minis}
  </div>`;

  /* ---- right: the evidence ---- */
  const extraTxt=cl=>cl.extra==null?`<span style="color:var(--color-neutral-500)">—</span>`
    :cl.extra>0.05?`<span style="color:var(--st-ruby-fg,#b91c1c);font-weight:700">+${cl.extra.toFixed(1)}</span>`
    :cl.extra<-0.05?`<span style="color:var(--st-green-fg,#047857);font-weight:700">−${Math.abs(cl.extra).toFixed(1)}</span>`
    :`<span style="color:var(--color-neutral-500)">0.0</span>`;
  const bars=st.clauses.map(cl=>`
    <span style="font-size:13px;font-weight:600;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${igEsc(cl.label)}">${igEsc(cl.label)}</span>
    <span style="position:relative;height:13px;border-radius:0;background:var(--color-neutral-100);min-width:0"><span style="position:absolute;inset:0 auto 0 0;width:${Math.max(2,pct(cl.share))}%;background:${cl.extra!=null&&cl.extra>0.05?'var(--accent-solid,var(--color-accent))':'var(--color-neutral-400)'};border-radius:0"></span></span>
    <span style="font-size:13px;color:var(--color-neutral-600);font-variant-numeric:tabular-nums;text-align:right">${pct(cl.share)}%</span>
    <span style="font-size:12px;font-variant-numeric:tabular-nums;text-align:right">${extraTxt(cl)}</span>`).join('');
  const cpRows=st.counterparties.map(cp=>{
    const chip=cp.avgRounds>=st.avgRounds+0.5?`<span style="font-size:10px;font-weight:700;padding:1px 7px;border-radius:0;background:var(--st-amber-bg,#fef3c7);color:var(--st-amber-fg,#b45309)">slow</span>`
      :cp.avgRounds<=Math.max(1,st.avgRounds-0.3)?`<span style="font-size:10px;font-weight:700;padding:1px 7px;border-radius:0;background:var(--st-green-bg,#d1fae5);color:var(--st-green-fg,#047857)">smooth</span>`:'';
    return `<tr data-igf-cp="${igEsc(cp.name)}" style="cursor:pointer" onmouseover="this.style.background='color-mix(in srgb,var(--color-text) 4%,transparent)'" onmouseout="this.style.background='none'">
      <td style="padding:6px 8px;${RULE};font-size:13px;font-weight:600">${igEsc(cp.name)}</td>
      <td style="padding:6px 8px;${RULE};font-size:13px;font-variant-numeric:tabular-nums">${cp.deals}</td>
      <td style="padding:6px 8px;${RULE};font-size:13px;font-variant-numeric:tabular-nums">${cp.avgRounds.toFixed(1)}</td>
      <td style="padding:6px 8px;${RULE};font-size:13px;font-variant-numeric:tabular-nums">${cp.acceptUs!=null?pct(cp.acceptUs)+'%':'—'}</td>
      <td style="padding:6px 8px;${RULE}">${chip}</td></tr>`;
  }).join('');
  const th=t=>`<th style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-500);text-align:left;padding:5px 8px;${RULE}">${t}</th>`;
  const right=`<div style="padding:12px 18px;border-left:1px solid var(--color-divider);min-width:0">
    <div style="display:flex;align-items:baseline;gap:10px"><span style="font-size:14px;font-weight:700">${i18t('int_most_contested')}</span>
      <span style="font-size:12px;color:var(--color-neutral-500);margin-left:auto;white-space:nowrap">% of ${st.deals} negotiation${st.deals===1?'':'s'} · extra rounds</span></div>
    <div role="img" aria-label="${i18t('int_bar_chart_aria')}" style="display:grid;grid-template-columns:minmax(120px,170px) 1fr 40px 40px;gap:5px 9px;align-items:center;margin:8px 0 12px">${bars}</div>
    <div style="display:flex;align-items:baseline;gap:10px"><span style="font-size:14px;font-weight:700">${i18t('int_friction_by_cp')}</span>
      <span style="font-size:12px;color:var(--color-accent-700);margin-left:auto;white-space:nowrap">${i18t('int_click_row_filter')}</span></div>
    <div style="overflow-x:auto;margin-top:6px"><table style="border-collapse:collapse;width:100%"><tr>${th('Counterparty')}${th('Deals')}${th('Rounds')}${th('Accept us')}${th('')}</tr>${cpRows}</table></div>
    <div style="font-size:12px;color:var(--st-amber-fg,#b45309);opacity:.85;margin-top:9px;line-height:1.55">Counted from the fingerprinted tracked changes in each negotiation's record. Ask the Copilot to probe any of these numbers — it carries the same figures.</div>
  </div>`;

  /* ---- HALF THE DEAD SPACE, AT EVERY WINDOW WIDTH ----
     The brief was capped at 1120px and centred, so every pixel a wider screen
     offered became empty gutter: 333px of nothing either side of it at 1860,
     while the contested-clause bars — the whole point of the right-hand column
     — were squeezed into what was left.

     Not a bigger fixed cap, because a fixed cap is only ever right on the
     screen it was chosen on. This takes HALF of whatever is empty, whatever
     the width: if the gutter is g, the card grows by g and the gutter becomes
     g/2. Written out, target width = (host + 1120)/2; 50% resolves against the
     content box while the gutter is measured from the border box, so the
     constant carries the host's own 20px side padding too — 1120/2 + 20 = 580.
     max-width:100% keeps it honest on a window narrower than the old cap,
     where there was no gutter to halve in the first place. */
  /* ---- THE CARD FILLS ITS HOST, LIKE PORTFOLIO (owner-asked 24 Aug 2026:
     "the space between the card and the edge in the negotiation friction tab
     should be the same as the distance in the portfolio tab") ----
     MEASURED before: 20px each side at 1280 and 1440 — already matching — then
     58 at 1600, 138 at 1920 and 298 at 2560. This was the only screen in
     Insights with a width rule of its own: capped once, given back half the
     dead space later, and the owner is asking for the other half. The design
     reference draws these panels full width with no gutter, so this is a
     correction toward it. Measured after: 20px each side at every width.
     AND THE PROSE IS HELD, which is why the cap existed. At full width on a
     2560 monitor the left column's paragraphs ran about 130 characters a line.
     The CARD fills the width as asked; the SENTENCES inside it stop at a
     readable measure, and the bars and the counterparty table take the extra
     room, which is where it is useful. */
  return `<div>
    <div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:0;box-shadow:var(--shadow-sm);overflow:hidden">
      ${intelFrictionCopilotHtml(st)}
      <div class="igf-split" style="display:grid">${left}${right}</div>
    </div>
  </div>`;
}

/* ---- COPILOT'S READ (hybrid layer over the counted brief) ----
   It sits at the top of the card, above the figures it reads, because it is
   the first thing worth offering somebody who has just opened the page — not
   a footnote they have to scroll past the whole brief to find. The order is
   the only thing that moved: it still runs on click alone, and the counted
   report below is still the page whether it is ever run or not.
   The brief below stays pure arithmetic; this strip is the only AI on the
   page, and it runs ONLY on click. The model is handed the already-counted
   figures and asked to interpret them — never to compute — so a wrong number
   cannot enter through here. The read is keyed to the figures it was written
   from: when the numbers move (new activity, a filter), a stored read is not
   shown as if it were current — the button comes back instead. */
function intelFrictionKey(st){
  return JSON.stringify([intel.frictionFilter||null, st.deals, st.deadlocks,
    st.avgRounds.toFixed(2),
    st.clauses.slice(0,3).map(c=>[c.label,Math.round(c.share*100),c.extra]),
    st.slowest?[st.slowest.name,st.slowest.avgRounds.toFixed(1)]:null]);
}
function intelFrictionCopilotHtml(st){
  const key=intelFrictionKey(st);
  const ai=intel.frictionAI;
  const on=(typeof copilotAvailable==='function')&&copilotAvailable();
  const head=`<div style="display:flex;align-items:center;gap:8px">
    <span style="width:22px;height:22px;flex:none;display:grid;place-items:center;border-radius:0;background:var(--color-accent-100);color:var(--color-accent-700)">${icon('sparkle','w-3 h-3',2)}</span>
    <span style="font-size:14px;font-weight:700">${i18t('int_copilots_read')}</span>
    <span style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:2px 7px;border-radius:0;background:var(--color-accent-100);color:var(--color-accent-700)">${i18t('int_optional_ai')}</span>
  </div>`;
  let body;
  if(ai&&ai.busy&&ai.key===key){
    body=`<div style="display:flex;align-items:center;gap:9px;font-size:13px;color:var(--color-neutral-600);padding:2px 0">
      <span class="live-ping" style="width:7px;height:7px;border-radius:50%;background:var(--accent-solid,var(--color-accent));flex:none"></span>${i18t('int_reading_figures')}</div>`;
  }else if(ai&&ai.html&&ai.key===key){
    body=`<div class="igf-ai-read" style="font-size:14px;line-height:1.7;color:var(--color-neutral-800)">${ai.html}</div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:8px;padding-top:8px;border-top:1px dashed var(--color-divider);font-size:12px;color:var(--color-neutral-500)">
        <span style="flex:none;font-size:10px;font-weight:700;padding:1px 7px;border-radius:0;background:var(--st-amber-bg);color:var(--st-amber-fg)">${i18t('int_ai_commentary')}</span>
        <span style="min-width:0">Generated at ${igEsc(ai.at||'')} from the counted figures below — the numbers are the app's, the interpretation is Copilot's.</span>
        <button id="igf-ai-regen" style="margin-left:auto;border:0;background:none;cursor:pointer;font:inherit;font-size:12px;font-weight:700;color:var(--color-accent-700);flex:none;white-space:nowrap">↻ Regenerate</button>
      </div>`;
  }else if(ai&&ai.err&&ai.key===key){
    body=`<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span style="font-size:13px;color:var(--st-ruby-fg)">${igEsc(ai.err)}</span>
      <button id="igf-ai-ask" style="border:0;background:none;cursor:pointer;font:inherit;font-size:13px;font-weight:700;color:var(--color-accent-700)">${i18t('int_try_again')}</button>
    </div>`;
  }else{
    const stale=!!(ai&&ai.html);
    const hint=!on
      ?'Add an Anthropic key in Team &amp; Settings → Copilot engine to turn this on. The counted report below works without it.'
      :stale?'The figures below have changed since the last read — generate a fresh one. Nothing runs until you click.'
      :'Copilot explains what is behind the figures below and what to do this week. Nothing runs until you click — the counted report never depends on it.';
    body=`<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <button id="igf-ai-ask" ${on?'':'disabled'} style="display:inline-flex;align-items:center;gap:7px;border:0;border-radius:0;padding:7px 15px;background:${on?'var(--accent-solid,var(--color-accent))':'var(--color-neutral-300)'};color:#fff;font:inherit;font-family:var(--font-heading);font-size:13px;font-weight:700;cursor:${on?'pointer':'not-allowed'};flex:none">${icon('sparkle','w-3 h-3',2)} Interpret these numbers</button>
      <span style="font-size:12px;color:var(--color-neutral-600);line-height:1.5;max-width:56ch">${hint}</span>
    </div>`;
  }
  return `<div id="igf-copilot" style="border-bottom:1px solid var(--color-divider);background:linear-gradient(180deg,color-mix(in srgb,var(--color-accent) 4%,transparent),transparent 70%);padding:12px 20px 13px">
    ${head}<div style="margin-top:8px">${body}</div>
  </div>`;
}
function intelFrictionWireAI(){
  document.getElementById('igf-ai-ask')?.addEventListener('click',()=>intelFrictionAsk());
  document.getElementById('igf-ai-regen')?.addEventListener('click',()=>intelFrictionAsk());
}
/* Repaint the strip alone, so a generation landing does not rebuild the page
   and throw away the reader's scroll position. */
function intelFrictionRepaintAI(){
  const el=document.getElementById('igf-copilot'); if(!el) return;
  el.outerHTML=intelFrictionCopilotHtml(intelFrictionStats(intel.frictionFilter||null));
  intelFrictionWireAI();
}
async function intelFrictionAsk(){
  if(!((typeof copilotAvailable==='function')&&copilotAvailable())) return;
  if(intel.frictionAI&&intel.frictionAI.busy) return;
  const f=intel.frictionFilter||null;
  const st=intelFrictionStats(f);
  if(!st.deals) return;
  const key=intelFrictionKey(st);
  intel.frictionAI={busy:true,key};
  intelFrictionRepaintAI();
  const pct=v=>Math.round(v*100);
  const hrs=ms=>{ const h=ms/3600000; return h<1?'under 1 hour':h<48?Math.round(h)+' hours':Math.round(h/24)+' days'; };
  const facts=[
    `- Negotiations analysed: ${st.deals}${st.openedThisMonth?` (${st.openedThisMonth} opened this month)`:''}`,
    `- Average rounds per deal: ${st.avgRounds.toFixed(1)}`,
    st.medianDays!=null?`- Median time to signature: ${st.medianDays<1?'under 1 day':Math.round(st.medianDays)+' days'}`:'',
    st.medianDecisionMs!=null?`- Median decision time on a change: ${hrs(st.medianDecisionMs)}`:'',
    st.oursAcceptShare!=null?`- Our asks accepted by the other side: ${pct(st.oursAcceptShare)}%`:'',
    st.theirsAcceptShare!=null?`- Their asks accepted by us: ${pct(st.theirsAcceptShare)}%`:'',
    st.round1Share!=null?`- Signed within round 1: ${pct(st.round1Share)}%`:'',
    `- Changes refused and still open (deadlocks): ${st.deadlocks}${st.deadlockList.length?' — '+st.deadlockList.slice(0,5).map(x=>`${x.name} (${x.clause})`).join('; '):''}`,
    st.clauses.length?`- Most-contested clauses (share of deals · extra rounds when contested): ${st.clauses.slice(0,5).map(c=>`${c.label} ${pct(c.share)}%${c.extra!=null?` · ${c.extra>=0?'+':''}${c.extra.toFixed(1)}r`:''}`).join('; ')}`:'',
    st.slowest?`- Slowest counterparty: ${st.slowest.name} at ${st.slowest.avgRounds.toFixed(1)} rounds/deal over ${st.slowest.deals} deals${st.slowest.acceptUs!=null?`, accepting ${pct(st.slowest.acceptUs)}% of our asks`:''}`:'',
    f&&f.days?`- Window: these figures cover the last ${f.days} days only`:'',
    f&&f.counterparty?`- Filter: these figures cover only deals with ${f.counterparty}`:'',
  ].filter(Boolean).join('\n');
  const prompt=`You are commenting on the Negotiation Friction report the reader is looking at. The figures below were COUNTED by the app from the tracked changes its negotiations recorded — treat them as ground truth.\n\n${facts}\n\nInterpret these figures: what pattern do they suggest about where deals get stuck, and what are the one or two most useful actions this week? Rules: never recalculate, extrapolate or invent a number — only repeat figures exactly as listed above. Write 2-3 short paragraphs separated by blank lines, each opening with a **bolded one-sentence takeaway**. Highlight the phrases the reader must not miss with tone markers, sparingly — at most two per paragraph, each wrapping a short plain phrase with no bold or other formatting inside it: {!…} around a recommended action or a figure that demands a decision, {-…} around a figure that is costing rounds or money, {+…} around a genuinely healthy figure. Never place a marker inside the bolded takeaway. No headings, no bullet lists, no preamble, no closing offer of further help.`;
  try{
    const res=await copilotAsk([{role:'user',content:prompt}],{view:'intel'});
    const rich=igFmtRich(res.answer||'');
    intel.frictionAI={busy:false,key,html:rich.html,
      at:new Date().toLocaleTimeString(jxLocale(),{hour:'2-digit',minute:'2-digit'})};
  }catch(e){
    intel.frictionAI={busy:false,key,
      err:(e&&e.needsKey)?'No Copilot key configured — add one in Team & Settings → Copilot engine.':'Copilot was unavailable — '+(e&&e.message?e.message:String(e))};
  }
  if(state.view==='intel'&&intel.tab==='friction') intelFrictionRepaintAI();
}

/* ---- right-hand Copilot dock ---- */
function igSyncDockWidth(){
  const dock=document.getElementById('ig-dock'); if(!dock) return;
  dock.style.width=igDockWidth()+'px';
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
      <span class="block text-[10px] font-mono text-ink/45">${c.id}${isMonetary(c)&&c.value?' · '+(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):''} · ${statusLabel(c.status)}</span>
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
  const eff=(window.effectiveExpiry?effectiveExpiry(c):null)||c.expiry;
  const d=eff?daysUntil(eff):null;
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
    ${row('Value',isMonetary(c)&&c.value?(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):'Non-monetary')}
    ${row('Status',statusLabel(c.status))}
    ${row('Expiry',c.expiry?(c.expiry+(d!=null?(d>=0?` · ${i18t('int_in_days',{n:d})}`:` · ${i18t('int_lapsed')}`):'')):'—')}
    ${row('Group',igEsc(groupLabelOf(c,intel.groupBy,intel.groups)))}
    <div class="mt-2 flex items-center gap-1.5">
      <button data-ig-ws="${c.id}" class="flex-1 rounded-lg bg-brand-900 text-white px-3 py-1.5 text-[11.5px] font-600 hover:bg-brand-800 transition">${i18t('int_open_workspace')}</button>
      <button data-ig-cmp="${c.id}" class="rounded-lg border ${intel.compareSel.includes(c.id)?'border-brand-500 bg-brand-50 text-brand-700':'border-brand-200 text-brand-700 hover:border-brand-400'} px-2.5 py-1.5 text-[11.5px] font-600 transition" title="${i18t('int_stage_for_compare')}">${intel.compareSel.includes(c.id)?'✓ Comparing':'+ Compare'}</button>
    </div>
  </div>`;
}
function igMsgHTML(m){
  if(m.role==='user')
    return `<div class="ai-msg flex justify-end"><div class="max-w-[85%] rounded-2xl rounded-br-md bg-brand-900 text-white px-3.5 py-2 text-[13px]">${igEsc(m.text)}</div></div>`;
  // Q&A answers stay text-only — the matching contracts are still highlighted on
  // the graph (igPaintIds), but we no longer append a card list under the answer.
  const body = m.ranked ? m.ranked.map((r,i)=>igRankCard(r,i)).join('')
    : m.explainId ? igExplainCard(m.explainId)
    : (m.compare && typeof aiCompareTable==='function' ? aiCompareTable(m.compare) : '');
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
      <button id="igd-expand" title="${i18t('int_open_panel')}" class="h-full w-full flex flex-col items-center pt-3 gap-2 text-gold-500 hover:bg-brand-50/60 transition">
        ${icon('sparkle','w-4 h-4')}<span class="text-[9px] font-mono text-ink/40 [writing-mode:vertical-rl]">${i18t('int_copilot_panel')}</span>
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
      <span class="font-display font-700 text-[13px] text-ink flex-1">${i18t('int_intelligence_panel')}</span>
      ${(()=>{ const b=(typeof copilotBrainInfo==='function')?copilotBrainInfo():{live:false,get label(){ return i18t('int_basic_mode'); },hint:''};
        return b.live
          ?`<span title="${igEsc(b.hint)}" class="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-600 text-white" style="background:var(--color-accent-800,#2c455d)">✦ ${igEsc(b.label)}</span>`
          :`<span title="${igEsc(b.hint)}" class="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-600" style="background:var(--st-amber-bg);color:var(--st-amber-fg)">○ Basic mode</span>`; })()}
      ${intel.history.length?`<button id="igd-history-clear" title="${i18t('int_clear_conversation')}" class="h-6 w-6 grid place-items-center rounded-lg text-ink/40 hover:text-rose-600 hover:bg-brand-50 transition">${icon('trash','w-3.5 h-3.5')}</button>`:''}
      <button id="igd-expand" title="${intel.dockWide?'Shrink the panel':'Expand the panel'}" class="h-6 w-6 grid place-items-center rounded-lg text-ink/40 hover:text-ink hover:bg-brand-50 transition">${intel.dockWide
        ?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 17l5-5-5-5"/><path d="M6 17l5-5-5-5"/></svg>'
        :'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-5-5 5-5"/><path d="M18 17l-5-5 5-5"/></svg>'}</button>
      <button id="igd-collapse" title="${i18t('int_collapse_panel')}" class="h-6 w-6 grid place-items-center rounded-lg text-ink/40 hover:text-ink hover:bg-brand-50 transition text-[13px]">›</button>
    </div>
    ${intel.lenses.length?`
    <div class="px-3.5 py-2 border-b border-hair shrink-0 flex flex-wrap items-center gap-1.5">
      ${intel.lenses.map(l=>`
        <span data-lens-hover="${l.id}" class="ig-lens inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-mono cursor-pointer ${l.on?'border-brand-500 bg-brand-50 text-brand-700':'border-line bg-white text-ink/40'}">
          <button data-lens-toggle="${l.id}" title="${l.on?'Lens on — click to ignore':'Lens off — click to apply'}">${igEsc(l.label)} · ${l.ids.length}</button>
          <button data-lens-x="${l.id}" title="${i18t('int_remove_lens')}" class="hover:text-rose-600">✕</button>
        </span>`).join('')}
      <button id="igd-clear" class="text-[10.5px] font-600 text-brand-600 hover:text-brand-800 ml-auto">${i18t('int_clear_all')}</button>
    </div>`:''}
    <div id="igd-feed" class="flex-1 min-h-0 overflow-y-auto scroll-thin px-3.5 py-3 space-y-3" style="background:transparent">
      ${msgs||`<div class="text-[12.5px] text-ink/50 leading-relaxed pt-2">${i18t('int_notebook_welcome')}</div>`}
      ${typing}
    </div>
    ${!intel.history.length?`
    <div class="px-3.5 pb-2 shrink-0 flex flex-wrap gap-1.5">
      ${IG_SUGGESTIONS.slice(0,3).map(s=>`<button data-igsug="${igEsc(s)}" class="text-[10.5px] rounded-full border border-brand-100 bg-canvas hover:bg-brand-50 hover:border-brand-300 px-2.5 py-1 text-brand-700 transition text-left">${igEsc(s)}</button>`).join('')}
    </div>`:''}
    ${intel.compareSel.length?`
    <div class="px-3.5 py-2 border-t border-hair shrink-0 flex items-center gap-2 bg-brand-50/40">
      <span class="text-[11px] text-brand-800/70 flex-1 min-w-0 truncate">${i18t('int_comparing')} <b class="text-brand-900">${intel.compareSel.length}</b>: ${intel.compareSel.map(id=>igEsc(getContract(id)?.name||id)).join(', ')}</span>
      <button id="igd-cmp-clear" class="text-[10.5px] font-600 text-ink/50 hover:text-ink">${i18t('int_clear')}</button>
      <button id="igd-cmp-run" class="rounded-lg px-2.5 py-1 text-[11px] font-600 transition ${intel.compareSel.length<2?'bg-brand-100 text-brand-500':'bg-brand-600 text-white hover:bg-brand-700'}" title="${intel.compareSel.length<2?'Tap “+ Compare” on one more node first':'Run the side-by-side comparison'}">${intel.compareSel.length<2?'Pick 1 more…':'Compare '+intel.compareSel.length}</button>
    </div>`:''}
    <div class="p-3 border-t border-hair shrink-0 relative">
      <input id="igd-input" placeholder="${i18t('int_ask_portfolio')}" class="w-full rounded-xl border border-inputln bg-white pl-3.5 pr-16 py-2.5 text-[13px] outline-none focus:border-brand-600 focus:ring-[3px] focus:ring-[rgba(11,122,95,.1)] transition"/>
      <button id="igd-go" class="absolute right-[18px] top-1/2 -translate-y-1/2 rounded-lg bg-brand-600 text-white px-3 py-1.5 text-[11px] font-600 hover:bg-brand-700 transition">${i18t('int_ask')}</button>
    </div>`;
  const feed=document.getElementById('igd-feed'); feed.scrollTop=feed.scrollHeight;
  // charts in dock answers come back to life after every repaint
  if(typeof aiHydrateCharts==='function'){
    const blocks=intel.history.flatMap(m=>(m&&m.blocks)||[]);
    if(blocks.length) aiHydrateCharts(blocks);
  }
  // wiring
  document.getElementById('igd-collapse').addEventListener('click',()=>{ intel.dockOpen=false; renderIntelDock(); igSyncDockWidth(); });
  // widen the dock leftward / shrink back; the graph re-fits automatically
  document.getElementById('igd-expand')?.addEventListener('click',()=>{
    intel.dockWide=!intel.dockWide;
    try{ if(typeof lsSet==='function') lsSet('hati.v1.intelWide',intel.dockWide); }catch(_){}
    renderIntelDock(); igSyncDockWidth();
  });
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
  // node-driven comparison: stage/unstage a contract, run or clear the tray
  dock.querySelectorAll('[data-ig-cmp]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); intelToggleCompare(b.getAttribute('data-ig-cmp')); }));
  document.getElementById('igd-cmp-clear')?.addEventListener('click',()=>{ intel.compareSel=[]; igPaintIds(null); renderIntelDock(); });
  document.getElementById('igd-cmp-run')?.addEventListener('click',()=>intelRunCompare());
  // clear the dock conversation (lenses are separate and survive on purpose)
  document.getElementById('igd-history-clear')?.addEventListener('click',()=>{
    // cleared immediately — no confirm prompt (lenses are separate and survive)
    intel.history=[]; intel.compareSel=[]; igPaintIds(null); renderIntelDock();
    if(typeof toast==='function') toast(i18t('int_conversation_deleted'));
  });
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
    nodes.push({id:c.id, type:'contract', c, label:trunc(c.name), sub:!isMonetary(c)?'non-monetary':(c.value?(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):c.status), bar:STATUS_BAR[c.status], kind:c.folder}); };
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

  const val=own.filter(x=>x.status!=='Declined'&&!x.archived).reduce((s,x)=>s+(window.fxHomeValue?fxHomeValue(x):Number(x.value||0)),0);
  modal.innerHTML=`
  <div class="view-enter bg-white rounded-2xl border border-brand-100 shadow-2xl shadow-brand-900/25 overflow-hidden">
    <div class="flex items-center gap-3 px-5 py-4 border-b border-brand-100/60">
      <span class="h-9 w-9 grid place-items-center rounded-lg bg-brand-900 text-gold-400">${icon('users')}</span>
      <div class="flex-1 min-w-0">
        <div class="font-display font-600 text-brand-900 truncate">${name}</div>
        <div class="text-[11px] font-mono text-brand-800/65">${own.length} agreements \u00b7 ${fmtMoney(val)} exposure \u00b7 relationship neighborhood</div>
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
        <text x="${-n.w/2+10}" y="${-2}" font-size="10" font-weight="600" style="fill:var(--color-text)">${n.label.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text>
        <text x="${-n.w/2+10}" y="${10}" font-size="7.5" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" fill="#7a7a7d">${n.sub}</text>
      </g>`).join('')}
    </svg>
    <div class="px-5 py-3 border-t border-brand-100/60 text-[11px] text-brand-800/65 flex items-center justify-between">
      <span>${i18t('int_click_node')}</span>
      <span class="font-mono">${nodes.length} nodes \u00b7 bounded neighborhood</span>
    </div>
  </div>`;
  scrim.classList.add('open');
  modal.querySelector('#pm-close').addEventListener('click',closePartyModal);
  modal.querySelectorAll('[data-open]').forEach(el=>el.addEventListener('click',()=>{ closePartyModal(); openWorkspace(el.getAttribute('data-open')); }));
}

Object.assign(window,{IG,IG_SUGGESTIONS,IG_TEMPLATE_RE,INTEL_CAP,KIND_TAG,REL_SEEDS,SEV_WEIGHT,STATUS_BAR,STATUS_DOT,addLens,applyTemplateResult,buildGraph,buildGraphModel,closePartyModal,contractPlainText,daysUntil,graphInterpret,groupLabelOf,igApplyView,igDockWidth,igFitView,igClamp,igEsc,igExplain,igExplainCard,igFilterToGroup,igMiniCard,igMsgHTML,igPaint,igPaintIds,igRankCard,igRender,igStartDrag,igSyncDockWidth,igTick,igToWorld,intel,intelActive,intelAsk,intelChatAsk,intelChatMessages,intelPushChatResult,intelAIExplain,intelToggleCompare,intelRunCompare,intelGraphAsk,intelRAF,intelTemplateAsk,intelUI,layoutGraph,makeIntelGraph,openPartyModal,parseHorizonDays,intelFrictionStats,intelFrictionHtml,rebuildIntelGraph,renderIntel,renderIntelDock,renderIntelLegend,riskScore,scanPortfolio,templateShortlist,updateIntelNote,valueBand});
