// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   VIEW: DEAL MAP  (force-directed graph of the portfolio)
   ============================================================ */
/* REL_SEEDS IS EMPTY AND STALE (A-2, 11 Sep 2026). It was seven name-matched
   demo links ("feeds", "supplies", "precedes") between seeded contracts — a
   picture of a supply chain that no record held, drawn as though the book
   said so. A link on this graph is now a FACT off the record or it is not
   drawn: buildGraphEdges below reads the family (parentId), the payment
   chain (an obligation's `after` pointing at another contract's obligation)
   and the shared counterparty, and nothing else. The name survives one
   release as an exported empty array so a third caller cannot bring the
   drawing back; flag any reader of it as stale. */
const REL_SEEDS = [];
const STATUS_BAR = {'Draft':'var(--st-gray-dot)','Under Review':'var(--st-amber-dot)','Signed':'var(--st-green-dot)','Declined':'var(--st-ruby-dot)'};
const KIND_TAG = {proc:{t:'PROC',c:'#2E9F80'},mfg:{t:'MFG',c:'#b45309'},dist:{t:'DIST',c:'#0369a1'},sales:{t:'SALES',c:'var(--st-amber-dot)'},mktg:{t:'MKTG',c:'#7c3aed'},corp:{t:'CORP',c:'var(--st-green-dot)'},party:{t:'PARTY',c:'#2c455d'}};

function buildGraph(){
  const nodes=[], edges=[];
  const trunc=(s,n=24)=>s.length>n?s.slice(0,n-1)+'\u2026':s;
  // contract nodes
  state.contracts.forEach(c=>{
    nodes.push({ id:c.id, type:'contract', c, label:trunc(c.name), sub:(window.contractRef?contractRef(c):c.id)+' \u00b7 '+(c.value?(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):'\u2014'),
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
  // contract-to-contract links, read off the record (family and payment chain)
  buildGraphEdges(state.contracts).filter(e=>e.kind!=='party').forEach(e=>edges.push({from:e.from, to:e.to, label:e.label, kind:e.kind}));
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

/* ---- THE FOUR SURFACES UNDER ONE NAV ITEM, IN ONE LIST ----
   The tab ROW is built from this and renderIntel's own guard reads it, so a
   name that is on the row is a name the guard accepts. They were written out
   separately and drifted the moment a fourth tab arrived: the button drew, the
   press registered, and the guard — a bare ['frame','map','friction'] — sent
   the reader straight back to the frame with nothing on screen saying why.
   ORDER IS THE ROW'S ORDER and the first entry is the default.
   LABELS ARE KEYS, NEVER RESOLVED STRINGS: an object literal holding i18t(...)
   freezes whatever language was current at load, which is the getter trap this
   codebase has recorded four separate times. */
/* PAYMENT TERMS SITS AFTER OBLIGATIONS (owner-ruled 2 Sep 2026) and before the
   contract graph. ONE LIST, read by the tab row AND by renderIntel's own
   guard — the guard was once written out separately as a bare array, and the
   fourth tab then drew, registered its press, and redrew the OVERVIEW with
   nothing anywhere saying why. A fifth surface is a name added here and
   nowhere else. LABELS ARE KEYS, never resolved strings: an object literal of
   translated text freezes whatever language was current at load. */
/* EXPLORER LEFT THIS ROW ON 3 OCT 2026 (Young ruled: "keep Insights for the
   detailed tabs"): the map lives on Home, behind its Board | Explorer switch,
   and a door here that still names 'map' is sent there (renderIntel,
   intelGoTab). IG_TAB_LABEL keeps its word — the map's lists still say it. */
const IG_TABS = ['frame','friction','obligations','payterms','exposure'];
/* IS THE MAP ON THE SCREEN NOW? Since 3 Oct 2026 that means Home, showing
   its Explorer side. Every guard that asked "Insights, on the map tab" asks
   this instead, so the map's timers and its loop stop the moment it is
   covered or left. */
function igMapUp(){
  if(!window.state) return false;
  if(state.view==='intel'&&intel.tab==='map') return true;
  return state.view==='dashboard' && typeof window.hbFace==='function' && hbFace()==='explorer' && !!document.getElementById('ig-svg');
}
/* Is Explorer's page (the stage and the Copilot panel) on the screen at all —
   on Home that is both sides, the board covering the map or not. */
function igPageUp(){ return !!(window.state && (state.view==='intel'||state.view==='dashboard') && document.getElementById('ig-row')); }
const IG_TAB_LABEL = { frame:'pf_tab', friction:'int_negotiation_friction',
  obligations:'int_obligations', payterms:'pt_tab', exposure:'int_exposure',
  map:'int_contract_graph' };

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
/* The map draws at most this many contracts — the largest by value, matched ones
   first — and the head line SAYS so when it bites (a cap is a fact, never a
   silent trim). Was 120, which cut a 179-contract book without a word; 300
   keeps a turn smooth (measured: 420 contracts turned at 20–30 frames a second). */
const INTEL_CAP = 300;
const STATUS_DOT = {'Draft':'var(--st-gray-dot)','Under Review':'var(--st-amber-dot)','Signed':'var(--st-green-dot)','Declined':'var(--st-ruby-dot)'};

/* ============================================================
   A-2 · THE BLAST RADIUS — what depends on this contract
   (WORKORDER-contract-graph-nodes.md, 11 Sep 2026)
   ============================================================
   A LINK IS A FACT OFF THE RECORD OR IT IS NOT DRAWN. Three facts the record
   already holds tie one contract to another, and these are the only edges
   this graph draws between contracts:
     family — c.parentId (an amendment, annex, call-off… of its master);
     chain  — an obligation whose `after` points at an obligation stored on
              ANOTHER contract (the payment chain crossing a contract line);
     party  — two contracts naming the same counterparty, THROUGH the party's
              own hub and never pairwise (six contracts with one customer
              would otherwise be fifteen lines saying one thing).
   COUNTING IS NOT DRAWING: these return plain data, the renderer draws it,
   and every figure is borrowed — fxHome for the money, fxMissing for what a
   converted total left out, obligationBlocked for what is held. They READ
   WITHOUT WRITING: c.obligations and c.parentId raw, never a model call that
   would start a negotiation on a contract merely asked about. */
const GRAPH_EDGE_KINDS = ['family','chain','party'];
/* Fold a counterparty name the way obligationAlreadyOn folds a description:
   case and whitespace go, nothing else — "Naivas Ltd" and "Naivas" are two
   parties, because saying they are one is a guess about the record. */
/* A SPAN OF DAYS SAID AT THE SCALE IT IS (Young, 3 Oct 2026: "3385 d past
   decision" on the map). Under two months in days, under two years in months,
   past that in years; the number behind it is unchanged. */
function igSpanWords(days){
  const d=Math.abs(Math.round(Number(days)||0));
  if(d<60) return i18t('int_span_days',{ n:d });
  if(d<730){ const m=Math.round(d/30.44); return i18tn('int_span_months',m,{ n:m }); }
  const y=Math.round(d/365.25); return i18tn('int_span_years',y,{ n:y });
}
function igDecideText(days){ return days<0 ? i18t('int_fact_decide_past_t',{ t:igSpanWords(-days) }) : i18t('int_fact_decide_t',{ t:igSpanWords(days) }); }
const _gFold = s => String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
/* ONE PARTY, ONE GROUP (Young, 4 Oct 2026: "Young Mbgaya" stood twice on the
   map grouped by customer). The grouping read the name exactly as typed while
   the party's own lines (graphPartyStats) already folded case and spacing, so
   "Juno Ltd" and "juno ltd " drew two cards counting each other's contracts.
   The group is the FOLDED name, printed in the spelling most of the book
   uses (ties: the first met). A different spelling ("Mbagaya" / "Mbgaya") is
   a different name: HaTi does not guess two parties are one. */
let _gPartyNames=null;
function graphPartyLabel(name){
  const k=_gFold(name); if(!k) return '';
  const cs=(typeof state==='object'&&state&&state.contracts)||[];
  if(!_gPartyNames||_gPartyNames.cs!==cs||_gPartyNames.n!==cs.length){
    const tally={};
    cs.forEach(c=>{ const raw=String(c.counterparty||'').replace(/\s+/g,' ').trim(); const f=raw.toLowerCase(); if(!f) return;
      const t=tally[f]||(tally[f]={}); t[raw]=(t[raw]||0)+1; });
    const best={};
    Object.keys(tally).forEach(f=>{ let top='', n=-1; Object.keys(tally[f]).forEach(s=>{ if(tally[f][s]>n){ top=s; n=tally[f][s]; } }); best[f]=top; });
    _gPartyNames={ cs, n:cs.length, best };
  }
  return _gPartyNames.best[k]||String(name).replace(/\s+/g,' ').trim();
}
/* THE LIVE BOOK. An archived or declined contract depends on nothing and
   nothing depends on it: counting one into a blast radius tells the reader a
   dead agreement is at risk. The same reading fxMissing and the sidebar's
   counts use. */
/* "Showing n of N": N is the book the board counts — archived contracts are
   off the default lists (the owner's screenshot, 5 Oct 2026: "of 181" beside
   the board's 178) */
const igBookTotal = () => (state.contracts||[]).filter(c=>c&&!c.archived).length;
const graphLiveContract = c => !!(c && c.status!=='Declined' && !c.archived);
const _gRelWord = k => { const w=(typeof RELATION_LABEL!=='undefined'&&RELATION_LABEL&&RELATION_LABEL[k])||''; return w||String(k||'amendment'); };
/* Every edge the record supports over the given contracts (default: the whole
   book). {from,to,kind,label}. Family: child → master, so the arrow points at
   what the amendment hangs off. Chain: the later step's contract → the earlier
   step's, so it points at what has to be paid first. Party: contract →
   'party:<folded name>', a hub id the model maps onto the counterparty hub
   when the graph is grouped by counterparty and drops otherwise — a party
   edge is drawn via a hub or not at all. A pointer at a contract or an
   obligation that is not in the list is no edge: a dangling reference is an
   absence, never a guess. */
function buildGraphEdges(cs){
  const list=Array.isArray(cs)?cs:(state.contracts||[]);
  const live=list.filter(graphLiveContract);
  const ids=new Set(live.map(c=>c.id));
  const edges=[], seen=new Set();
  const push=e=>{ const k=e.kind+'|'+e.from+'|'+e.to; if(seen.has(k)) return; seen.add(k); edges.push(e); };
  live.forEach(c=>{
    if(c.parentId && c.parentId!==c.id && ids.has(c.parentId))
      push({from:c.id, to:c.parentId, kind:'family', label:_gRelWord(c.relation)});
  });
  /* Where each obligation id lives. Ids are minted per obligation ('ob_…') and
     the first home wins; an id that appears on two contracts is a record
     fault this reading does not paper over. */
  const home={};
  live.forEach(c=>(c.obligations||[]).forEach(o=>{ const id=String((o&&o.id)||''); if(id&&!home[id]) home[id]=c.id; }));
  live.forEach(c=>(c.obligations||[]).forEach(o=>{
    const a=(typeof obligationAfter==='function')?obligationAfter(o):String((o&&o.after)||'').trim()||null;
    if(!a) return; const h=home[a]; if(!h||h===c.id) return;
    push({from:c.id, to:h, kind:'chain', label:'after'});
  }));
  const party={};
  live.forEach(c=>{ const k=_gFold(c.counterparty); if(!k) return; (party[k]||(party[k]={name:c.counterparty,ids:[]})).ids.push(c.id); });
  Object.keys(party).forEach(k=>{ const p=party[k]; if(p.ids.length<2) return;
    p.ids.forEach(id=>push({from:id, to:'party:'+k, kind:'party', label:p.name})); });
  return edges;
}
/* WHAT DEPENDS ON THIS CONTRACT — direct dependents only, by the three facts
   above, never a transitive walk: an amendment of an amendment is refused by
   the family model (one level deep), a chain is read one step back by
   obligationBlocked, and "everything a customer touches touches everything
   else" is a picture no record supports. Returns:
     contracts   [{id, name, kind}]  the dependents, family first
     amendments / calloffs / party   how many of each kind
     value       the dependents' contract values converted to home currency,
                 monetary ones only — null where this reader may not see money
     missing     {code:count} of what that total LEFT OUT (fxMissing's rule)
     held        obligations on the dependents that are blocked right now
   The contract itself is never its own dependent. */
function graphDependents(id){
  const c=(typeof getContract==='function')?getContract(id):null;
  const empty={ id:String(id||''), contracts:[], amendments:0, calloffs:0, party:0, value:null, missing:{}, held:0, found:!!c };
  if(!c) return empty;
  const kinds={};
  const note=(cid,kind)=>{ if(cid===c.id) return; if(!kinds[cid]) kinds[cid]=kind; };
  buildGraphEdges(state.contracts||[]).forEach(e=>{
    if(e.kind==='party'){ return; }
    if(e.to===c.id) note(e.from,e.kind);
  });
  const mine=_gFold(c.counterparty);
  if(mine && graphLiveContract(c)) (state.contracts||[]).forEach(x=>{ if(graphLiveContract(x)&&x.id!==c.id&&_gFold(x.counterparty)===mine) note(x.id,'party'); });
  const order={family:0,chain:1,party:2};
  const deps=Object.keys(kinds).map(cid=>({id:cid, kind:kinds[cid], c:getContract(cid)})).filter(d=>d.c)
    .sort((a,b)=>(order[a.kind]-order[b.kind])||String(a.id).localeCompare(String(b.id)));
  const out=Object.assign({},empty,{ contracts:deps.map(d=>({id:d.id, name:d.c.name||(window.contractRef?contractRef(d.c):d.id), kind:d.kind})),
    amendments:deps.filter(d=>d.kind==='family').length, calloffs:deps.filter(d=>d.kind==='chain').length, party:deps.filter(d=>d.kind==='party').length });
  const cs=deps.map(d=>d.c);
  const money=(typeof canViewValues!=='function')||canViewValues();
  if(money){
    let v=0; cs.forEach(x=>{ if(!(typeof isMonetary==='function'?isMonetary(x):true)) return; if(!(Number(x.value||0)>0)) return;
      const h=(typeof fxHome==='function')?fxHome(x):{v:Number(x.value||0),missing:false}; if(!h.missing) v+=h.v; });
    out.value=v; out.missing=(typeof fxMissing==='function')?fxMissing(cs):{};
  }
  out.held=cs.reduce((n,x)=>n+((x.obligations||[]).filter(o=>(typeof obligationBlocked==='function')?obligationBlocked(o,x):false).length),0);
  return out;
}
/* Every contract that has dependents, keyed by id — the shape that travels to
   Copilot as ctx.graph.links so get_dependents is a LOOKUP on both hosts.
   Bounded: names are left off (the id is what a tool answers with and the
   name is on get_contract), and a contract with nothing depending on it is
   simply absent rather than an entry of zeros. */
function graphDependentsAll(){
  const out={};
  (state.contracts||[]).forEach(c=>{ if(!graphLiveContract(c)) return; const d=graphDependents(c.id); if(!d.contracts.length) return;
    out[c.id]={ contracts:d.contracts.map(x=>({id:x.id,kind:x.kind})), amendments:d.amendments, calloffs:d.calloffs, party:d.party, value:d.value, missing:d.missing, held:d.held }; });
  return out;
}
/* ============================================================
   A-1 · NODE FACTS — what a node says about itself
   ============================================================
   Six readings, every one BORROWED from the surface that already owns it, so
   a node cannot disagree with the card, the calendar or the Home tile about
   the same contract:
     decideDays   renewalWindow — days to the renewal decision, only inside
                  the window that card draws (RENEWAL_WINDOW_DAYS); past is
                  negative and still said
     whose        negoMoveSay — Mine · Theirs, the register's own word; null
                  where nothing is outstanding
     overdue      obligations obState()==='overdue' and NOT obligationBlocked —
                  a step nobody could have done yet is not late by anybody's
                  fault, the worklist's own band rule
     overdueValue obligationAmount over those, only where money may be seen
     offStandard  deviationSummary — deviations + missing, null where no
                  review has ever run (an absence is not a clean sheet)
     unread       !copilotRead — the Home tile's exact rule; null where the
                  rule is not on this stage
   COUNTING IS NOT DRAWING and it READS WITHOUT WRITING (c.changes and
   c.obligations raw through the readings; never negoChanges). */
function graphNodeFacts(c){
  const out={ decideDays:null, missed:false, whose:null, whoseSay:'', overdue:0, overdueValue:null, offStandard:null, unread:null };
  if(!c) return out;
  /* `rw.decided` rides on the very object this already has (16 Sep 2026). A
     node saying a decision is owed on a renewal somebody answered is the one
     fault class this codebase pays for most — two screens disagreeing about
     what the product did — and the answer was one word away. */
  try{ if(typeof renewalWindow==='function'){ const rw=renewalWindow(c); if(rw&&rw.inWindow&&!rw.decided){ out.decideDays=rw.days; out.missed=!!rw.missed; } } }catch(_){}
  try{ if(typeof negoMoveSay==='function'){ const m=negoMoveSay(c); if(m&&m.k&&m.k!=='clear'){ out.whose=m.word; out.whoseSay=m.say||''; } } }catch(_){}
  try{
    const late=(c.obligations||[]).filter(o=>o&&(typeof obState==='function'?obState(o):o.status)==='overdue'&&!(typeof obligationBlocked==='function'&&obligationBlocked(o,c)));
    out.overdue=late.length;
    const money=(typeof canViewValues!=='function')||canViewValues();
    if(money&&late.length){ let v=0,any=false; late.forEach(o=>{ const n=(typeof obligationAmount==='function')?obligationAmount(o):null; if(n!==null){ v+=n; any=true; } }); out.overdueValue=any?v:null; }
  }catch(_){}
  try{ if(typeof deviationSummary==='function'){ const sm=deviationSummary(c); if(sm&&sm.total) out.offStandard=sm.dev+sm.miss; } }catch(_){}
  try{ if(typeof copilotRead==='function') out.unread=!copilotRead(c); }catch(_){}
  return out;
}
/* THE THIRD LINE ON THE NODE: at most THREE facts, in the order a negotiator
   scans — the decision clock (amber), whose move, then what is late (ruby).
   "Not read" takes the last slot only where there is room. Each is
   {text, tone}; the renderer prints them and decides nothing. */
const GRAPH_NODE_FACTS_MAX = 3;
function graphNodeFactLine(c){
  const f=graphNodeFacts(c), out=[];
  if(f.decideDays!=null) out.push({ k:'decide', text: igDecideText(f.decideDays), tone:'amber' });
  if(f.whose) out.push({ k:'whose', text:f.whose, tone:f.whoseSay&&/mine/i.test(f.whose)?'amber':'ink', title:f.whoseSay });
  if(f.overdue) out.push({ k:'overdue', text:i18tn('int_fact_overdue',f.overdue,{n:f.overdue}), tone:'ruby' });
  if(f.unread) out.push({ k:'unread', text:i18t('int_fact_unread'), tone:'mute' });
  return out.slice(0,GRAPH_NODE_FACTS_MAX);
}
/* THE FACT ROWS, ONE BUILDER FOR THE CARD AND THE HOVER — the hover is the
   card's rows drawn beside the node, never a third rendering. */
function igFactRowsHtml(c){
  const f=graphNodeFacts(c);
  const row=(k,v,tone)=>`<div class="flex justify-between gap-3 text-[11.5px] py-0.5" data-ig-fact="${k}"><span class="text-ink/45">${i18t('int_fr_'+k)}</span><span class="text-right font-medium truncate"${tone?` style="color:var(--st-${tone}-fg)"`:' style="color:var(--color-text)"'}>${v}</span></div>`;
  const parts=[];
  if(f.decideDays!=null) parts.push(row('decide', igDecideText(f.decideDays), 'amber'));
  if(f.whose) parts.push(row('whose', igEsc(f.whose)+(f.whoseSay&&f.whoseSay!==f.whose?` <span class="text-ink/45 font-normal">· ${igEsc(f.whoseSay)}</span>`:''), null));
  if(f.overdue) parts.push(row('overdue', i18tn('int_fact_overdue',f.overdue,{n:f.overdue})+(f.overdueValue!=null?` · ${fmtMoneyShort(f.overdueValue)}`:''), 'ruby'));
  if(f.offStandard!=null) parts.push(row('standard', f.offStandard?i18tn('int_fact_offstd',f.offStandard,{n:f.offStandard}):i18t('int_fact_aligned'), f.offStandard?'amber':'green'));
  if(f.unread!=null) parts.push(row('read', f.unread?i18t('int_fact_unread'):i18t('int_fact_read'), f.unread?null:'green'));
  return parts.join('');
}
/* THE HOVER CARD — one element, moved to whichever node is under the pointer,
   drawn only where the node has a fact to show. It is the explain card's own
   rows; pressing the node still opens the full card in the dock. */
function igHoverShow(n){
  const host=document.getElementById('ig-svg'); if(!host||!n||n.kind!=='contract'||!n.c) return;
  const rows=igFactRowsHtml(n.c); if(!rows){ igHoverHide(); return; }
  let el=document.getElementById('ig-hover');
  if(!el){ el=document.createElement('div'); el.id='ig-hover'; el.className='ig-hover'; host.parentElement.appendChild(el); }
  el.innerHTML=`<div class="text-[12px] font-600 text-brand-900 truncate mb-0.5">${igEsc(n.c.name)}</div>${rows}`;
  const r=n.g.getBoundingClientRect(), pr=host.parentElement.getBoundingClientRect();
  const w=240, x=Math.max(8,Math.min(pr.width-w-8, r.right-pr.left+8)), y=Math.max(8,Math.min(pr.height-8-el.offsetHeight, r.top-pr.top));
  el.style.left=x+'px'; el.style.top=y+'px'; el.hidden=false;
}
function igHoverHide(){ const el=document.getElementById('ig-hover'); if(el) el.hidden=true; }
/* ============================================================
   A-3 · THE COUNTERPARTY NODE — one party, read across the book
   ============================================================
   Under the counterparty grouping the hub IS the party, and a party is the
   one thing on this graph a reader negotiates with rather than about. So the
   hub carries four lines, every one BORROWED: contracts and share of the book
   by VALUE in home currency (owner-ruled — fxHome, fxMissing for what was left
   out), rounds per deal from intelFrictionStats (the friction tab's own
   figure), promises met on time from obligationOnTime (a FRACTION below three
   answered — a percentage of two is a coin toss dressed as a rate), and the
   payment terms from payTermsData's own rows (side, days, standard, over).
   THE BOOK IS THE LIVE BOOK — not Declined, not archived, graphLiveContract —
   the same population fxMissing and the graph's edges read. Money obeys
   canViewValues: a viewer gets the name and the count. */
const GRAPH_ONTIME_MIN = 3;
function graphPartyStats(name){
  const key=_gFold(name);
  const out={ name:String(name||''), key, contracts:0, ids:[], value:null, missing:{}, share:null, rounds:null, onTime:{met:0,answered:0}, pay:null, found:false };
  if(!key) return out;
  const book=(state.contracts||[]).filter(graphLiveContract);
  const mine=book.filter(c=>_gFold(c.counterparty)===key);
  if(!mine.length) return out;
  out.found=true; out.name=mine[0].counterparty; out.contracts=mine.length; out.ids=mine.map(c=>c.id);
  const money=(typeof canViewValues!=='function')||canViewValues();
  const sum=cs=>{ let v=0; cs.forEach(x=>{ if(!(typeof isMonetary==='function'?isMonetary(x):true)) return; if(!(Number(x.value||0)>0)) return;
    const h=(typeof fxHome==='function')?fxHome(x):{v:Number(x.value||0),missing:false}; if(!h.missing) v+=h.v; }); return v; };
  if(money){
    out.value=sum(mine); out.missing=(typeof fxMissing==='function')?fxMissing(mine):{};
    const all=sum(book); out.share=all>0?out.value/all:null;
  }
  /* Rounds per deal: the friction tab's own reading, asked for this party.
     Its filter is a contains-match, so the exact name is picked out of what
     comes back rather than trusted whole. */
  try{ if(typeof intelFrictionStats==='function'){ const fs=intelFrictionStats({counterparty:out.name});
    const row=(fs.counterparties||[]).find(cp=>_gFold(cp.name)===key);
    if(row&&row.deals) out.rounds={ deals:row.deals, avg:Math.round(row.avgRounds*10)/10 }; } }catch(_){}
  mine.forEach(c=>(c.obligations||[]).forEach(o=>{ const t=(typeof obligationOnTime==='function')?obligationOnTime(o):null; if(t===null) return; out.onTime.answered++; if(t) out.onTime.met++; }));
  try{ if(typeof payTermsData==='function'){ const rows=(payTermsData().rows||[]).filter(r=>_gFold(r.counterparty)===key);
    if(rows.length){ const sides=[...new Set(rows.map(r=>r.side))], stds=[...new Set(rows.map(r=>r.standard))];
      out.pay={ side:sides.length===1?sides[0]:'mixed', days:Math.round(rows.reduce((a,r)=>a+r.days,0)/rows.length), standard:stds.length===1?stds[0]:null, over:rows.filter(r=>r.over).length, n:rows.length }; } } }catch(_){}
  return out;
}
/* Every party on the live book, keyed by folded name — the table that rides
   the brief as ctx.graph.parties, ids and money left off. */
function graphPartyStatsAll(){
  const out={}, seen=new Set();
  (state.contracts||[]).filter(graphLiveContract).forEach(c=>{ const k=_gFold(c.counterparty); if(!k||seen.has(k)) return; seen.add(k);
    const p=graphPartyStats(c.counterparty); if(!p.found) return;
    out[k]={ name:p.name, contracts:p.contracts, value:p.value, missing:p.missing, share:p.share, rounds:p.rounds, onTime:p.onTime, pay:p.pay }; });
  return out;
}
/* THE FOUR LINES ON THE HUB, as plain strings — the renderer prints them and
   decides nothing. Line 1 is always there; a line with nothing behind it is
   simply not drawn. On-time is a fraction below GRAPH_ONTIME_MIN answered. */
function graphPartyLines(p){
  if(!p||!p.found) return [];
  const L=[];
  /* THE SHARE IS OF THE BOOK'S VALUE, and says so (Young, 3 Oct 2026: "9
     contracts · 0% of the book" read as if they did not count). A party whose
     contracts carry no value has no share to print; a share under one per cent
     is "under 1%", never a 0 beside contracts that are there. */
  const pc=p.share!=null?p.share*100:null;
  const share=(pc!=null&&p.value>0)?` · ${pc<1?i18t('int_cp_under_1'):Math.round(pc)+'%'} ${i18t('int_cp_of_value')}`:'';
  L.push(i18tn('int_cp_contracts',p.contracts,{n:p.contracts})+share);
  const mid=[];
  if(p.rounds) mid.push(i18t('int_cp_rounds',{n:p.rounds.avg}));
  if(p.onTime.answered) mid.push(p.onTime.answered>=GRAPH_ONTIME_MIN ? i18t('int_cp_ontime_pct',{n:Math.round(p.onTime.met/p.onTime.answered*100)}) : i18t('int_cp_ontime_frac',{m:p.onTime.met,a:p.onTime.answered}));
  if(mid.length) L.push(mid.join(' · '));
  if(p.pay){ const sideWord=p.pay.side==='customer'?i18t('int_cp_pay_in'):p.pay.side==='supplier'?i18t('int_cp_pay_out'):i18t('int_cp_pay_mixed');
    L.push(i18t('int_cp_pay',{d:p.pay.days,side:sideWord})+(p.pay.over?` · ${i18tn('int_cp_pay_over',p.pay.over,{n:p.pay.over})}`:'')); }
  return L;
}
/* ============================================================
   A-4 · THE RENEWAL CLIFF — the book laid out by decision date
   ============================================================
   A grouping ('decision') whose hubs are QUARTERS, in order, and a scrubber
   that walks the reader forward through them. The date is renewalDecisionDate
   — the effective expiry less the notice period, family-aware, the same
   reading the renewal card and the reminder sweep use — never a second
   arithmetic. A contract with no readable date is its own group rather than
   pushed in with the nearest. Labels are English literals like every other
   group on this graph. */
const GRAPH_CLIFF_QUARTERS = 4;            // this quarter plus the next four are named; beyond is "Later"
const GRAPH_CLIFF_MAX_DAYS = 540;          // the scrubber walks eighteen months ahead
const _gQ = d => ({ y:d.getFullYear(), q:Math.floor(d.getMonth()/3) });
const _gQIdx = d => { const q=_gQ(d); return q.y*4+q.q; };
const _gQLabel = idx => `Q${(idx%4)+1} ${Math.floor(idx/4)}`;
/* {date, days, label, order} for one contract. order is the quarter's index
   from THIS quarter (0), negative for a quarter already gone, so hubs can be
   laid out left to right in time; 'Later' sorts after the named quarters and
   'No decision date' last of all. */
function graphDecisionOf(c){
  /* ---- A DECIDED RENEWAL IS NOT ON THE CLIFF, AND IT IS NOT NOWHERE EITHER ----
     (16 Sep 2026.) The cliff counts decisions still owed, so an answered one
     does not belong on a quarter — but NOTHING IS FOLDED AWAY (the payment-terms
     ruling), so it gets a hub of its own rather than being dropped into "No
     decision date", which would say something untrue about it. `days:null`
     keeps it out of the scrubber's passed/ahead arithmetic, which is right: it
     is not a decision ahead and it is not one that passed. */
  if(typeof renewalDecided==='function' && renewalDecided(c))
    return { date:null, days:null, label:'Decided', order:GRAPH_CLIFF_QUARTERS+2 };
  const date=(typeof renewalDecisionDate==='function')?renewalDecisionDate(c):null;
  if(!date) return { date:null, days:null, label:'No decision date', order:GRAPH_CLIFF_QUARTERS+3 };
  const d=new Date(String(date).slice(0,10)+'T00:00:00'); if(isNaN(d.getTime())) return { date:null, days:null, label:'No decision date', order:GRAPH_CLIFF_QUARTERS+3 };
  const now=new Date(); now.setHours(0,0,0,0);
  const rel=_gQIdx(d)-_gQIdx(now);
  const days=Math.round((d-now)/86400000);
  if(rel<0) return { date, days, label:'Passed', order:-1 };
  if(rel===0) return { date, days, label:'This quarter', order:0 };
  if(rel<=GRAPH_CLIFF_QUARTERS) return { date, days, label:_gQLabel(_gQIdx(d)), order:rel };
  return { date, days, label:'Later', order:GRAPH_CLIFF_QUARTERS+1 };
}
const graphDecisionOrder = label => { if(label==='Passed') return -1; if(label==='This quarter') return 0; if(label==='Later') return GRAPH_CLIFF_QUARTERS+1; if(label==='Decided') return GRAPH_CLIFF_QUARTERS+2; if(label==='No decision date') return GRAPH_CLIFF_QUARTERS+3;
  const m=/^Q([1-4]) (\d{4})$/.exec(label||''); if(!m) return 99; const now=new Date(); return (Number(m[2])*4+Number(m[1])-1)-_gQIdx(now); };
/* A CROWDED QUARTER IS SAID IN WORDS, AND ONLY WHERE IT IS ONE: a named
   quarter holding more than one and a half times the average over the named
   quarters that hold anything, and at least three. Amber only there — an
   amber count on every hub is a warning nobody reads. */
function graphCliffCrowded(hubs){
  const q=hubs.filter(h=>graphDecisionOrder(h.label)>=0&&graphDecisionOrder(h.label)<=GRAPH_CLIFF_QUARTERS);
  if(!q.length) return new Set();
  const avg=q.reduce((a,h)=>a+h.ids.length,0)/q.length;
  return new Set(q.filter(h=>h.ids.length>=3&&h.ids.length>avg*1.5).map(h=>h.label));
}
/* THE SCRUBBER'S ANSWER for a cutoff N days ahead: which contracts are
   passed (decision on or before the cutoff) and which are ahead. Per hub.
   READ, never drawn — igApplyCliff paints it. */
function graphCliffAt(days, cs){
  const list=(cs||state.contracts||[]);
  const passed=[], ahead=[], undated=[];
  /* AT TODAY a decision due today is still ahead — it has not passed. At a
     cutoff further on, "look ahead to that date" includes a decision falling
     on it. */
  list.forEach(c=>{ const d=graphDecisionOf(c); if(d.days==null) undated.push(c.id); else if(days>0?d.days<=days:d.days<0) passed.push(c.id); else ahead.push(c.id); });
  return { days, passed, ahead, undated };
}
/* Paint the cutoff onto the live graph: a class on every contract node whose
   decision is on or before it, and "N passed · N ahead" on every quarter
   hub's own line. A class flip and a text write, never a repaint. */
function igApplyCliff(days){
  if(!IG||intel.groupBy!=='decision') return;
  const at=graphCliffAt(days);
  const passed=new Set(at.passed);
  IG.nodes.forEach(n=>{ if(n.kind==='contract') n.g.classList.toggle('passed',passed.has(n.id)); });
  IG.nodes.filter(n=>n.kind==='hub').forEach(h=>{ const ids=[...(IG.adj[h.id]||[])].filter(id=>IG.byId[id]&&IG.byId[id].kind==='contract');
    /* Neither hub carries a decision to pass or wait for, so neither takes the
       "N passed · N ahead" line. */
    if(!ids.length||h.label==='No decision date'||h.label==='Decided') return;
    const p=ids.filter(id=>passed.has(id)).length;
    const el=h.g.querySelector('.ig-sub'); if(el) el.textContent=i18t('int_cliff_hub',{p, a:ids.length-p})+(h.crowded?' · '+i18t('int_cliff_crowded'):''); });
  const out=document.getElementById('ig-cliff-out'); if(out){ const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+days);
    out.textContent=days?i18t('int_cliff_by',{d:d.toLocaleDateString((typeof langLocale==='function')?langLocale():undefined,{day:'numeric',month:'short',year:'numeric'})}):i18t('int_cliff_today'); }
}
/* ============================================================
   A-5 · MONEY FLOWING THROUGH THE VALUE STREAM
   ============================================================
   Each value-stream hub says what money comes IN, goes OUT and nets, ON
   PAPER. The side is the payment terms tab's own reading — paySide, which
   reads the contract's category: a CUSTOMER is who pays us (in), a SUPPLIER
   is who we pay (out) — never a second reading beside it. Value through
   fxHome; a foreign contract with no rate is COUNTED under `missing` and
   never summed; a monetary contract whose side cannot be read is `unsided`,
   counted and named, never assumed; a non-monetary contract is in no column.
   Money obeys canViewValues: a viewer's hub is the stream's name and count.
   NOTHING HERE READS AN INVOICE — HaTi holds none — and every figure is
   labelled "on paper" wherever it is printed. */
function graphStreamFlow(cs){
  const list=(Array.isArray(cs)?cs:(state.contracts||[])).filter(graphLiveContract);
  const money=(typeof canViewValues!=='function')||canViewValues();
  const out={};
  list.forEach(c=>{
    const f=c.folder||'other';
    const S=out[f]||(out[f]={ folder:f, n:0, in:0, out:0, net:0, missing:{}, unsided:0, sided:0 });
    S.n++;
    if(!money) return;
    if(typeof isMonetary==='function'&&!isMonetary(c)) return;
    if(!(Number(c.value||0)>0)) return;
    const side=(typeof paySide==='function')?paySide(c):null;
    if(!side){ S.unsided++; return; }
    const h=(typeof fxHome==='function')?fxHome(c):{v:Number(c.value||0),missing:false,code:''};
    if(h.missing){ S.missing[h.code]=(S.missing[h.code]||0)+1; return; }
    S.sided++;
    if(side==='customer') S.in+=h.v; else S.out+=h.v;
    S.net=S.in-S.out;
  });
  return out;
}
/* The hub's lines — In / Out on one, Net with its sign on the next — each
   with its own ink: in takes the hub's light teal, out amber, net green or
   ruby by sign. Strings and inks only; the renderer prints them. */
function graphStreamLines(S){
  if(!S) return [];
  const money=(typeof canViewValues!=='function')||canViewValues();
  if(!money) return [];
  const L=[];
  L.push({ text:`${i18t('int_flow_in')} ${fmtMoneyShort(S.in)} · ${i18t('int_flow_out')} ${fmtMoneyShort(S.out)}`, fill:'var(--color-accent-100)' });
  const sign=S.net>0?'+':S.net<0?'−':'';
  L.push({ text:`${i18t('int_flow_net')} ${sign}${fmtMoneyShort(Math.abs(S.net))} · ${i18t('int_flow_on_paper')}`, fill:S.net>0?'var(--st-green-dot)':S.net<0?'var(--st-ruby-dot)':'var(--color-accent-200)' });
  return L;
}
/* ============================================================
   C-1 · THE FULL COPILOT GETS THE GRAPH'S OTHER READINGS (ruling 7)
   ============================================================
   ctx.graph already carries links (A-2) and parties (A-3). This adds the
   streams (graphStreamFlow's per-folder in/out/net/missing), the cliff (the
   decision quarters and their counts, crowded ones named), the facts (each
   node's A-1 facts, only for nodes with something to say, capped and the cap
   counted), and the lenses in force — so "of those" works in a typed
   question. Every figure is the reading's own; the server never recomputes
   any of it and clamps each field as pageSays does (f299 pins both hosts say
   the same sentence). Money obeys canViewValues by construction: the stream
   flow and the overdue value are read through readings that already ask. */
const GRAPH_CTX_FACTS_MAX=200;
function graphCliffQuarters(cs){
  const hubMap={};
  (cs||state.contracts||[]).forEach(c=>{ const g=graphDecisionOf(c).label; (hubMap[g]||(hubMap[g]={label:g,ids:[]})).ids.push(c.id); });
  const hubs=Object.values(hubMap), crowded=graphCliffCrowded(hubs);
  return hubs.map(h=>({ label:h.label, n:h.ids.length, crowded:crowded.has(h.label) })).sort((a,b)=>graphDecisionOrder(a.label)-graphDecisionOrder(b.label));
}
function graphCopilotContext(){
  const out={};
  try{ const flow=graphStreamFlow(); const streams={};
    Object.values(flow).forEach(S=>{ streams[S.folder]={ name:FOLDERS[S.folder]?.name||'Other', n:S.n, in:S.in, out:S.out, net:S.net, missing:S.missing, unsided:S.unsided, sided:S.sided }; });
    if(Object.keys(streams).length) out.streams=streams; }catch(_){}
  try{ const cliff=graphCliffQuarters(); if(cliff.length) out.cliff=cliff; }catch(_){}
  try{ const facts={}; let n=0, omitted=0;
    (state.contracts||[]).forEach(c=>{ if(!graphLiveContract(c)) return; const f=graphNodeFacts(c);
      if(f.decideDays==null&&!f.whose&&!f.overdue&&f.offStandard==null&&!f.unread) return;
      if(n>=GRAPH_CTX_FACTS_MAX){ omitted++; return; } n++;
      facts[c.id]={ ...(c.contractNo?{contractNo:c.contractNo}:{}), decideDays:f.decideDays, missed:f.missed, whose:f.whose, overdue:f.overdue, overdueValue:f.overdueValue, offStandard:f.offStandard, unread:f.unread }; });
    if(n){ out.facts=facts; if(omitted) out.factsOmitted=omitted; } }catch(_){}
  try{ const lenses=graphLensesNow(); if(lenses.length) out.lenses=lenses; }catch(_){}
  return Object.keys(out).length?out:null;
}
/* Link width from value: bounded, sqrt of the share of the largest, so one
   giant contract does not make every other link a hairline. */
const GRAPH_LINK_W_MIN=1.5, GRAPH_LINK_W_MAX=9;
function graphLinkWidth(v, vmax){ if(!(v>0)||!(vmax>0)) return null; return Math.round((GRAPH_LINK_W_MIN+(GRAPH_LINK_W_MAX-GRAPH_LINK_W_MIN)*Math.sqrt(Math.min(1,v/vmax)))*10)/10; }
/* THE "IF THIS ENDS" BLOCK on the dock's explain card. Drawn only where
   something depends on the contract — a block reading "nothing depends on
   this" on every card is furniture. Every figure is graphDependents' own; the
   block computes nothing. "See the list" is the register's one door
   (regShowOnly), never a second list drawn here. */
function igDependentsHtml(id){
  const d=graphDependents(id); if(!d.contracts.length) return '';
  const parts=[];
  if(d.amendments) parts.push(i18tn('int_dep_amend',d.amendments));
  if(d.calloffs) parts.push(i18tn('int_dep_chain',d.calloffs));
  if(d.party) parts.push(i18tn('int_dep_party',d.party));
  const money=d.value!=null;
  const miss=Object.keys(d.missing||{});
  const lines=[];
  lines.push(`<div class="text-[11.5px] text-brand-900"><b>${i18tn('int_dep_n',d.contracts.length)}</b> <span class="text-ink/50">· ${igEsc(parts.join(' · '))}</span></div>`);
  if(money && d.value>0) lines.push(`<div class="text-[11.5px] text-ink/70">${i18t('int_dep_value',{v:fmtMoneyShort(d.value)})}${miss.length?` <span class="text-ink/45">· ${i18t('int_dep_missing',{n:miss.map(k=>`${d.missing[k]} × ${k}`).join(', ')})}</span>`:''}</div>`);
  if(d.held) lines.push(`<div class="text-[11.5px]" style="color:var(--st-amber-fg)">${i18tn('int_dep_held',d.held)}</div>`);
  return `<div class="mt-2 pt-2" style="border-top:1px solid var(--color-divider)" data-ig-deps-block="${igEsc(id)}">
    <div class="text-[10px] uppercase tracking-wider text-ink/45 mb-1">${i18t('int_if_ends')}</div>
    ${lines.join('')}
    <button data-ig-deps="${igEsc(id)}" class="ui-link" style="margin-top:6px">${i18t('int_dep_see_list')}${icon('chevR','w-3.5 h-3.5')}</button>
  </div>`;
}
window.intel = { groupBy:'folder', groups:null /*{id:label} override from Copilot*/,
  /* CLOSED AT REST (Young ruled 27 Sep 2026: "when you open the explorer page,
     the legend should always be closed as the resting state"): folded to its
     head on every ARRIVAL at the tab (renderIntel asks), opened by a press for
     the rest of the visit, never stored. */
  legendFolded:true /*the graph's legend, folded to its head — per visit, in memory*/,
  lenses:[] /*[{id,label,ids:[],on,action:'filter'|'highlight',badges:{id:txt}|null}]*/,
  history:[] /*dock conversation: {role,text,cardIds?,ranked?,explainId?,compare?,err?,paperId?,quotes?}*/,
  compareSel:[] /*contract ids staged for a node-driven comparison*/,
  /* ANALYZE CONTRACT (Young ruled 26 Sep 2026, "all three in one"): the one
     contract whose paper sits where the nodes were. Per SITTING and in memory,
     like every other cut on this page. {id, mode:'paper'|'graph', focus,
     pins:[{n,turn,k,text,ob,lost}], seq, on:{turn,k}|null, words}. Null = no
     contract has been analyzed; the panel's bin is what clears it. */
  paper:null,
  frictionAI:null /*Copilot's read on the friction brief: {busy,key,html,at,err}*/,
  /* WHICH SLICE OF THE PAYMENT TERMS TABLE IS SHOWING (owner-asked 2 Sep 2026:
     "make the page interactive so that when you click on the graphs they filter
     the table accordingly"). Per SITTING and in memory, like every other cut on
     this page: a stored one would land a reader on a narrowed table a week
     later with nothing on screen saying why. It cannot be quietly on — the
     table says what it is showing and carries the way back. */
  ptCut:{ side:null, bucket:null },
  cliffDays:0 /*A-4: the renewal cliff's scrubber, days ahead of today; per sitting*/,
  busy:false, dockOpen:true,
  /* THE WIDEN BUTTON IS GONE (Young ruled 27 Sep 2026): "bring the divider
     that is in the document and negotiate pages to the Explorer page as
     opposed to have the arrow button". The panel's width is the divider's —
     IG_SPLIT_KEY below. `dockWide` and its store (hati.v1.intelWide) are
     STALE: nothing reads or writes them. */
  seq:1 };
/* ---------- THE SPLIT, DRAGGED (Young ruled 27 Sep 2026) ----------
   The Document tab's and the Negotiate page's divider, on this page: the
   panel beside the map (or the paper) takes the width the reader drags it to,
   remembered in this browser. It is the clause editor's mechanism — the
   POINTER'S POSITION, never the distance travelled, with the grab offset kept
   so the handle does not jump under the finger — and the Negotiate page's
   resting rule: where nobody has chosen, the panel opens at a WIDTH
   (IG_DOCK_W0, the panel's own resting width before this), because that is a
   fact about the panel's cards and a fraction gives them a different number
   on every monitor. What is stored is the PANEL'S width.
   THE FLOORS WIN: the panel keeps IG_DOCK_MIN (its card's three doors on one
   line), the column beside it IG_LEFT_MIN (the Document tab's own floor for a
   contract column), and at a floor the grip goes amber, as on the other two
   pages. A double-click, Home or Enter put it back; the arrows step it.
   Folded to its strip (the › in the panel's head, kept), the divider stands
   down: there is nothing to drag. */
const IG_DOCK_W0 = 380, IG_DOCK_MIN = 340, IG_LEFT_MIN = 420, IG_DOCK_FOLDED = 46;
const IG_SPLIT_KEY = 'hati.v1.igDockW';
/* null = nobody has chosen, which is what lets the resting place be a width. */
function _igDockPref(){
  try{ const v=Number(localStorage.getItem(IG_SPLIT_KEY)); if(v>0&&isFinite(v)) return Math.round(v); }catch(_){ return null; }
  /* THE OLD WIDEN BUTTON'S CHOICE IS CARRIED ACROSS ONCE (the owner's list,
     27 Sep 2026): someone who had widened the panel opened at the default
     width the first time after the divider replaced the button. The old
     choice is read once, turned into the width it gave (45% of the window,
     380–660, the button's own arithmetic), stored as a width and retired. */
  try{
    const wide=(typeof lsGet==='function')?lsGet('hati.v1.intelWide'):localStorage.getItem('hati.v1.intelWide');
    if(wide!=null){
      try{ localStorage.removeItem('hati.v1.intelWide'); }catch(_){}
      if(wide&&wide!=='false'){
        const w=Math.max(380, Math.min(660, Math.round((window.innerWidth||1200)*0.45)));
        _igDockSave(w); return w;
      }
    }
  }catch(_){}
  return null;
}
function _igDockSave(w){ try{ if(w==null) localStorage.removeItem(IG_SPLIT_KEY); else localStorage.setItem(IG_SPLIT_KEY,String(Math.round(w))); }catch(_){ } }
/* The width the panel takes in a row `avail` wide: the reader's choice or the
   resting width, clamped by both floors. Pure, so the stage can ask it. */
function igDockClamp(want, avail){
  let w=Number(want)||IG_DOCK_W0;
  if(avail>0){
    if(avail>=IG_LEFT_MIN+IG_DOCK_MIN) w=Math.min(Math.max(w,IG_DOCK_MIN), avail-IG_LEFT_MIN);
    else w=Math.max(IG_DOCK_MIN, Math.min(w, avail));
  } else w=Math.max(w,IG_DOCK_MIN);
  return Math.round(w);
}
function igDockWidth(){
  if(!intel.dockOpen) return IG_DOCK_FOLDED;
  const row=(typeof document!=='undefined')?document.getElementById('ig-row'):null;
  return igDockClamp(_igDockPref()??IG_DOCK_W0, row?row.clientWidth:0);
}
/* THE ONE LAYOUT PASS: writes the panel's width and puts the handle on its
   left edge. Every door calls this and nothing else writes the width. */
function igFitSplit(){
  const row=document.getElementById('ig-row'), dock=document.getElementById('ig-dock'), rez=document.getElementById('ig-resizer');
  if(!row||!dock) return;
  const w=igDockWidth();
  dock.style.width=w+'px';
  if(!rez) return;
  if(!intel.dockOpen||!row.clientWidth){ rez.hidden=true; return; }
  rez.hidden=false;
  rez.style.right=(w-7)+'px';
  const avail=row.clientWidth;
  const atMin=w<=IG_DOCK_MIN, atMax=avail>=IG_LEFT_MIN+IG_DOCK_MIN&&w>=avail-IG_LEFT_MIN;
  if(atMin||atMax) rez.setAttribute('data-at-limit',atMin?'min':'max'); else rez.removeAttribute('data-at-limit');
  rez.setAttribute('aria-valuenow',String(w));
}
/* The map re-measures once the width has settled — the same reaction the
   panel's fold has always had (igSyncDockWidth), never on every pointer move. */
let _igSplitT=0;
function igSplitSettle(){
  if(_igSplitT) clearTimeout(_igSplitT);
  _igSplitT=setTimeout(()=>{ _igSplitT=0; if(igMapUp()) rebuildIntelGraph(); },280);
}
function igWireSplit(){
  const row=document.getElementById('ig-row'), dock=document.getElementById('ig-dock'), rez=document.getElementById('ig-resizer');
  if(!row||!dock||!rez) return;
  igFitSplit();
  if(rez.dataset.igSplitBound) return;
  rez.dataset.igSplitBound='1';
  let grabDx=0;
  const widthAt=x=>{ const r=row.getBoundingClientRect(); return igDockClamp(r.right-(x+grabDx), row.clientWidth); };
  const onMove=e=>{ const x=(e.touches&&e.touches[0])?e.touches[0].clientX:e.clientX; _igDockSave(widthAt(x)); igFitSplit(); };
  const onUp=()=>{ delete rez.dataset.drag; dock.style.transition='';
    document.body.style.cursor=''; document.body.style.userSelect='';
    window.removeEventListener('pointermove',onMove); window.removeEventListener('pointerup',onUp);
    igSplitSettle(); };
  rez.addEventListener('pointerdown',e=>{ e.preventDefault(); rez.dataset.drag='1';
    const hb=rez.getBoundingClientRect(); grabDx=(hb.left+hb.width/2)-e.clientX;
    /* The panel's width transition would make the handle trail the pointer. */
    dock.style.transition='none';
    document.body.style.cursor='col-resize'; document.body.style.userSelect='none';
    window.addEventListener('pointermove',onMove); window.addEventListener('pointerup',onUp); });
  rez.addEventListener('keydown',e=>{
    if(e.key==='Home'||e.key==='Enter'){ e.preventDefault(); _igDockSave(null); igFitSplit(); igSplitSettle(); return; }
    const step=Math.max(8,Math.round(row.clientWidth*0.02));
    const d=e.key==='ArrowLeft'?step:e.key==='ArrowRight'?-step:0;   /* left widens the panel */
    if(!d) return;
    e.preventDefault(); _igDockSave(igDockClamp(igDockWidth()+d,row.clientWidth)); igFitSplit(); igSplitSettle();
  });
  rez.addEventListener('dblclick',()=>{ _igDockSave(null); igFitSplit(); igSplitSettle(); });
  if(!window._igSplitResizeBound){ window._igSplitResizeBound=true;
    window.addEventListener('resize',()=>{ if(igPageUp()){ igFitSplit(); if(igMapUp()) igNoteMeasure(); } }); }
}
window.IG = null;      // live graph model
window.intelRAF = 0;   // animation token
const igEsc = s => String(s??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
/* THE CHAT BUBBLE CLEANS WHAT IT DRAWS (the owner's list, 27 Sep 2026).
   Every writer into intel.history was meant to escape its own text, and one
   did not (the template ranking pushed the model's answer as written). The
   bubble is the one place they all meet, so it is the wall: scripts, frames
   and every event handler or javascript: link are taken out before drawing.
   The formatter's own markup (bold, lists, tables, charts) passes. */
const IG_UNSAFE_TAGS = 'script,style,iframe,object,embed,link,meta,base,form,input,textarea,select,button';
function igSafeHtml(html){
  const raw = String(html==null?'':html);
  if(!/[<&]/.test(raw)) return raw;
  if(typeof document==='undefined' || !document.createElement) return igEsc(raw);
  const t = document.createElement('template'); t.innerHTML = raw;
  t.content.querySelectorAll(IG_UNSAFE_TAGS).forEach(n => n.remove());
  t.content.querySelectorAll('*').forEach(n => {
    for(const a of Array.from(n.attributes)){
      const nm = a.name.toLowerCase(), v = String(a.value||'').trim().toLowerCase();
      if(nm.startsWith('on') || nm === 'srcdoc' || ((nm === 'href' || nm === 'src' || nm === 'xlink:href' || nm === 'action' || nm === 'formaction') && /^(javascript|vbscript|data:text)/.test(v.replace(/\s+/g,''))))
        n.removeAttribute(a.name);
    }
  });
  return t.innerHTML;
}

function valueBand(v){ v=Number(v||0); const c=jxCurrency(); if(!v) return 'Non-monetary'; if(v>=50e6) return `≥ ${c} 50M`; if(v>=10e6) return `${c} 10–50M`; if(v>=1e6) return `${c} 1–10M`; return `< ${c} 1M`; }
/* ============================================================
   C-1 · THE GROUPING MENU IS ONE LIST (owner-reported 11 Sep 2026)
   ============================================================
   "cluster by expiration date" was answered with a caption saying so while
   every node stayed on its value-stream hub: the map Copilot's tool could
   only NAME six groupings, the dropdown drew ten, and faced with a dimension
   it could not name the model answered `custom` with an empty map, which the
   page took on trust. THIS LIST is the one statement of what the map can
   group by: the dropdown draws it, groupLabelOf cuts every key on it, the
   built-in interpreter's cues name keys on it, the caption reads its word,
   the refusal quotes it, and the SERVER's tool enum MIRRORS it (f299 pins the
   two equal as a set — the IG_TABS rule applied to groupings). A grouping is
   added HERE and cut in groupLabelOf; nowhere else.
   `none` is the bucket a contract with no such fact lands in — named, never
   folded into a neighbour — so the composed answer can say "14 in No expiry
   set" off the built model. Labels are English literals like every other
   group on this graph. THE BUCKETS ARE HATI'S, NEVER COPILOT'S: the model
   names the dimension and the product cuts it.
   The four time groupings each read ONE existing reading — contractSignedAt
   (the one reading of when a contract was signed), effectiveExpiry, and
   repRaisedAt (the `_raisedAt` transport the light list carries, else the
   trail's first Created line) — never a second arithmetic. */
const GRAPH_GROUPINGS=[
  { k:'folder',        label:'Value stream',     none:null },
  { k:'counterparty',  label:'Customer',         none:'No counterparty' },
  { k:'status',        label:'Status',           none:null },
  { k:'valueBand',     label:'Value',            none:'Non-monetary' },
  { k:'kind',          label:'Type',             none:null },
  { k:'expiry',        label:'Expiry window',    none:'No expiry set' },
  { k:'payterms',      label:'Payment terms',    none:'No payment terms' },
  { k:'decision',      label:'Renewal decision', none:'No decision date' },
  { k:'risk',          label:'Risk',             none:'Not scanned' },
  { k:'source',        label:'Origin',           none:null },
  { k:'signedYear',    label:'Signed year',      none:'Not signed' },
  { k:'signedQuarter', label:'Signed quarter',   none:'Not signed' },
  { k:'expiryYear',    label:'Expiry year',      none:'No expiry set' },
  { k:'createdMonth',  label:'Created month',    none:'No created date' },
  /* THE FACTS LIST GREW (the view recipe, 28 Sep 2026): every fact a contract
     carries is a grouping, so every fact can narrow, group, make floors or
     columns, colour, size or label the map. Each reads ONE existing reading. */
  { k:'liability',     label:'Liability cap',    none:'Cap not read' },
  { k:'law',           label:'Governing law',    none:'Law not read' },
  { k:'owner',         label:'Owner',            none:'Nobody owns this' },
  { k:'obligations',   label:'Open obligations', none:null },
  { k:'read',          label:'Read by Copilot',  none:null },
];
const GRAPH_GROUP_KEYS=GRAPH_GROUPINGS.map(g=>g.k);
const graphGroupingOf=k=>GRAPH_GROUPINGS.find(g=>g.k===k)||null;
/* The caption's word for a grouping — the dropdown's own label, lower-cased,
   so the control and the note line cannot name one cut two ways. */
const graphGroupingWord=k=>k==='custom'?'Copilot grouping':((graphGroupingOf(k)||{}).label||String(k||'')).toLowerCase();
const GRAPH_MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const _gSignedDay=c=>{ try{ return (typeof contractSignedAt==='function')?(contractSignedAt(c)||null):null; }catch(_){ return null; } };
const _gExpiryDay=c=>{ const e=(typeof effectiveExpiry==='function'?effectiveExpiry(c):c.expiry); return e?String(e).slice(0,10):null; };
const _gCreatedDay=c=>{ try{ if(typeof repRaisedAt!=='function') return null; const t=repRaisedAt(c); if(t==null||isNaN(t)) return null; const d=new Date(t); return isNaN(d.getTime())?null:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }catch(_){ return null; } };
const _gQuarterOfDay=d=>`Q${Math.floor((Number(d.slice(5,7))-1)/3)+1} ${d.slice(0,4)}`;
function groupLabelOf(c, groupBy, override){
  if(override && override[c.id]) return override[c.id];
  switch(groupBy){
    case 'counterparty': return graphPartyLabel(c.counterparty)||'No counterparty';
    case 'status': return statusLabel(c.status);
    case 'valueBand': return valueBand(c.value);
    case 'kind': return cKind(c);
    case 'expiry': {
      const e=_gExpiryDay(c);
      const d=e?daysUntil(e):null;
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
    /* PAYMENT TERMS AS A LENS (owner-asked 2 Sep 2026). It borrows the bands
       the payment terms tab draws, so the graph and that page can never sort
       one contract two ways. Labels here are English literals like every other
       group in this graph. A contract nobody has read the terms off is its own
       group rather than being pushed in with the shortest — that absence is
       the actionable fact on this subject. */
    case 'payterms': {
      const dd=(typeof payDays==='function')?payDays(c):null;
      if(dd==null) return 'No payment terms';
      return (typeof payBucketOf==='function'?payBucketOf(dd):String(dd))+' days';
    }
    /* THE RENEWAL CLIFF (A-4). The quarter the renewal decision falls in,
       off renewalDecisionDate — the renewal card's and the reminder sweep's
       own reading. A contract with no readable date is its own group. */
    case 'decision': return graphDecisionOf(c).label;
    /* C-1: three time groupings the dropdown did not have, plus created
       month. Each is ONE existing reading; a contract with no such date is its
       own named bucket. */
    case 'signedYear': { const d=_gSignedDay(c); return d?d.slice(0,4):'Not signed'; }
    case 'signedQuarter': { const d=_gSignedDay(c); return d?_gQuarterOfDay(d):'Not signed'; }
    case 'expiryYear': { const e=_gExpiryDay(c); return (e&&/^\d{4}/.test(e))?e.slice(0,4):'No expiry set'; }
    case 'createdMonth': { const d=_gCreatedDay(c); return d?`${GRAPH_MONTHS[Number(d.slice(5,7))-1]} ${d.slice(0,4)}`:'No created date'; }
    case 'liability': { const v=String((c.metadata&&c.metadata.liabilityCapped)||'').toLowerCase();
      return v==='capped'?'Liability capped':v==='uncapped'?'Liability uncapped':v==='unclear'?'Cap unclear':'Cap not read'; }
    case 'law': { let l=''; try{ l=(typeof contractGoverningLaw==='function')?contractGoverningLaw(c):String((c.metadata&&c.metadata.governingLaw)||''); }catch(_){} return String(l||'').trim()||'Law not read'; }
    case 'owner': { let o=null; try{ o=(typeof contractOwnerName==='function')?contractOwnerName(c):null; }catch(_){} return o||'Nobody owns this'; }
    case 'obligations': { const k=((c.obligations)||[]).filter(o=>o&&!o.completedAt&&!o.done&&o.status!=='done').length; return !k?'No open obligations':k<=2?'1–2 open':'3 or more open'; }
    case 'read': { let u=null; try{ u=graphNodeFacts(c).unread; }catch(_){} return u?'Not read yet':'Read'; }
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
/* ---- A LENS IS ADDED ONCE (owner-reported 11 Sep 2026, off a dock carrying
   seven "Drafting · 77" chips: every press on a legend row pushed a fresh
   lens, so a reader who pressed twice to see whether it had worked got the
   same cut stacked). One filter says one thing however often it is asked
   for. The reading is the SAME CUT — same action, same label, same set of
   ids — and it lives here, in the one funnel every lens goes through, so the
   legend, the Copilot answers and the node-driven cuts inherit it. A second
   press on a cut that is already on the dock turns it back on if it was
   switched off, and otherwise changes nothing. */
function addLens(l){
  const ids=[...(l.ids||[])], key=ids.slice().sort().join('|');
  /* the same cut asked for again, even with the other action, is ONE chip:
     its action follows the latest ask (the owner saw the chip twice when
     "Show these on the map" narrowed what Copilot had lit, 3 Oct 2026) */
  const same=intel.lenses.find(x=>x.label===(l.label||ids.length+' matches') && x.ids.slice().sort().join('|')===key);
  if(same){ same.on=true; same.action=l.action||'filter'; if(l.badges) same.badges=l.badges; renderIntelDock(); return; }
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
/* THE CUES THAT NAME A GROUPING, in the order they are asked: the more
   specific phrase first, so "by expiry year" is the year and not the window,
   "by quarter signed" the signing quarter and not the renewal cliff, "by
   value stream" the stream and not the value band. Every key here is on
   GRAPH_GROUPINGS (f299 pins it); a cue for a key the map cannot cut would be
   a promise the map cannot keep. */
const GRAPH_GROUP_CUES=[
  ['expiryYear',   ['by expiry year','by expiration year','by year of expiry','by year of expiration','by year they expire','by year they end','by the year they expire']],
  ['signedQuarter',['by signed quarter','by quarter signed','by quarter they were signed','by signing quarter','by quarter of signing','when they were signed','by signature date','by signing date','by date signed','by date they were signed','by when signed']],
  ['signedYear',   ['by signed year','by year signed','by year they were signed','by signing year','by year of signature','by year of signing']],
  ['createdMonth', ['by created month','by month created','by month they were created','by creation month','by month of creation','when they were created','by creation date','by date created','by date raised','by month raised']],
  ['counterparty', ['by customer','by counterpart','by party','per customer','by client','by supplier','by vendor']],
  ['folder',       ['by folder','by function','by value stream','by category','by department','by stream']],
  ['status',       ['by status','by stage','by lifecycle']],
  ['valueBand',    ['by value','by size','by amount','by exposure']],
  ['kind',         ['by type','by kind','by contract type']],
  ['payterms',     ['by payment terms','by payment term','by terms of payment','by credit terms']],
  ['decision',     ['by renewal decision','by decision date','by renewal date','renewal cliff','by quarter']],
  ['expiry',       ['by expiry','by expiration','by expire','by end date','by when they expire','by when they end','by time left','by time remaining','by remaining term']],
  ['risk',         ['by risk']],
  ['source',       ['by origin','by source','uploaded vs','by where they came from','by how they were made']],
  ['liability',    ['by liability cap','by liability','by cap']],
  ['law',          ['by governing law','by jurisdiction','by law']],
  ['owner',        ['by owner','by who owns']],
  ['obligations',  ['by open obligations','by obligations']],
  ['read',         ['by read','by whether copilot read']],
];
function graphGroupCue(q){
  const s=String(q||'').toLowerCase();
  const hit=GRAPH_GROUP_CUES.find(([,cues])=>cues.some(x=>s.includes(x)));
  return hit?hit[0]:null;
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
  // grouping intent — the cue table names keys on GRAPH_GROUPINGS and nothing else
  groupBy=graphGroupCue(q);
  /* A PURE GROUPING ASK IS NOT A FILTER: "cluster by expiration date" carries
     the word "expir" and used to fall into the expiring-soon filter as well,
     so the map narrowed to ninety days while the caption said it had grouped.
     A command that opens with a grouping verb and names a dimension is the
     grouping alone. */
  const pureGroup=!!groupBy && /^(group|cluster|regroup|arrange|organi[sz]e|sort|split|break|bucket|lay)\b/.test(q) && !has('only','show ','filter','highlight','hide');
  // filter intent
  const kindHit=(...k)=>cs.filter(c=>k.some(x=>cKind(c).toLowerCase().includes(x)));
  if(pureGroup){ /* nothing narrows */ }
  else if(has('expir','renew','lapse','ending',' end ','coming to an end','ends in','end in','end within')){
    const horizon=parseHorizonDays(q)??90;
    /* The AMENDED end date (_gExpiryDay → effectiveExpiry), the same the
       Copilot card and the server read (the owner's list, 27 Sep 2026). */
    vis=cs.filter(c=>{ const e=_gExpiryDay(c); return e&&c.status!=='Declined'&&!c.archived&&daysUntil(e)>=0&&daysUntil(e)<=horizon; });
    note='Expiring ≤ '+(horizon%30===0&&horizon>=30?Math.round(horizon/30)+'mo':horizon+' days');
    badges={}; vis.forEach(c=>badges[c.id]='ends in '+daysUntil(_gExpiryDay(c))+'d');
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
  /* A grouping's sentence is COMPOSED by intelGraphApply off the built model,
     so the fallback says nothing of its own there; the filter sentence keeps
     its "Largest:" line, which the numbers do not say. */
  const answer = vis===null
    ? (groupBy?'':'I could not match that to a filter — try a contract type, status, counterparty or expiry horizon.')
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
/* ============================================================
   COPILOT STEERS THE MAP — the reader's own words, read here first
   (the brain drawing, 28 Sep 2026)
   ============================================================
   With no filter doors on the map, Copilot is the way to narrow, group,
   colour, size and walk it. Four commands are plain arithmetic over the
   record and need no model, so they are read here and spend nothing:
   COLOUR BY a grouping, SIZE BY value / open obligations / nothing, OUTLIERS
   (each contract against its own value stream — never a risk score), and
   WALK THROUGH (the set on the map, one at a time). SHOW EVERYTHING takes
   every cut off. Anything else goes on to Copilot exactly as before; a
   sentence that carries one of these and something more has this part done
   here and the rest asked. Every answer says what was applied. */
const GRAPH_OUTLIER_MIN=3, GRAPH_OUTLIER_X=3, GRAPH_OUTLIER_PAY_GAP=30, GRAPH_WALK_MAX=24;
const _igMedian=a=>{ const b=a.slice().sort((x,y)=>x-y), m=b.length>>1; return b.length?(b.length%2?b[m]:(b[m-1]+b[m])/2):null; };
/* THE OUTLIERS: a contract whose value is GRAPH_OUTLIER_X times its stream's
   median or more, or which pays GRAPH_OUTLIER_PAY_GAP days or more slower
   than its stream's median — each only where the stream has
   GRAPH_OUTLIER_MIN contracts to measure against. Money obeys canViewValues;
   a value with no rate home is left out, never guessed. */
function graphOutliers(cs){
  const list=(cs||state.contracts||[]), moneyOk=(typeof canViewValues!=='function')||canViewValues();
  const by={}; list.forEach(c=>{ (by[c.folder||'_']||(by[c.folder||'_']=[])).push(c); });
  const out={};
  Object.values(by).forEach(group=>{
    if(moneyOk){ const vals=[]; group.forEach(c=>{ if(typeof isMonetary==='function'&&!isMonetary(c)) return; if(!(Number(c.value||0)>0)) return;
        const h=(typeof fxHome==='function')?fxHome(c):{ v:Number(c.value||0), missing:false }; if(!h.missing) vals.push([c,h.v]); });
      if(vals.length>=GRAPH_OUTLIER_MIN){ const med=_igMedian(vals.map(x=>x[1]));
        if(med>0) vals.forEach(([c,v])=>{ if(v>=med*GRAPH_OUTLIER_X) (out[c.id]||(out[c.id]=[])).push(i18t('int_outlier_value',{ x:Math.round(v/med*10)/10 })); }); } }
    if(typeof payDays==='function'){ const ds=group.map(c=>[c,payDays(c)]).filter(x=>x[1]!=null);
      if(ds.length>=GRAPH_OUTLIER_MIN){ const med=_igMedian(ds.map(x=>x[1]));
        ds.forEach(([c,d])=>{ if(d>=med+GRAPH_OUTLIER_PAY_GAP) (out[c.id]||(out[c.id]=[])).push(i18t('int_outlier_pay',{ d, m:Math.round(med) })); }); } }
  });
  return Object.keys(out).map(id=>({ id, why:out[id] }));
}
/* The set a walk-through visits: what the map is showing (or what it has
   highlighted), soonest decision first, then the largest; capped, and the
   cap is said. */
function graphWalkIds(){
  const act=intelActive();
  let cs=(IG&&IG.contracts?IG.contracts.map(n=>n.c):state.contracts).filter(Boolean);
  if(act.ids&&act.action==='highlight') cs=cs.filter(c=>act.ids.has(c.id));
  const dd=c=>{ const d=graphDecisionOf(c); return d.days==null?1e9:d.days; };
  const by=intel.sortBy&&IG_TOP_BY[intel.sortBy];
  cs=cs.slice().sort(by?((a,b)=>{ const x=by(a), y=by(b); return (y==null?-Infinity:y)-(x==null?-Infinity:x); }):((a,b)=>(dd(a)-dd(b))||(Number(b.value||0)-Number(a.value||0))));
  return { ids:cs.slice(0,GRAPH_WALK_MAX).map(c=>c.id), total:cs.length };
}
const IG_OUTLIER_RE=/\boutliers?\b|\bunusual (?:ones|contracts)\b|\bstands? out\b|\bavvikare\b|\bsticker ut\b/i;
const IG_WALK_RE=/\bwalk (?:me |us )?through\b|\bone by one\b|\bone at a time\b|\bgå igenom\b|\ben i taget\b|\bett i taget\b|\ben och en\b/i;
const IG_EVERYTHING_RE=/^(?:please\s+)?(?:show (?:me )?(?:everything|all(?: (?:the )?contracts)?|the whole (?:book|map))|reset(?: the map)?|clear(?: all| the map)?|start (?:again|over))[.!]?$/i;
/* ============================================================
   THE VIEW RECIPE (Young, 28 Sep 2026: "Let's go with this")
   ============================================================
   Everything the map shows is ONE short list of settings — which contracts
   (the lenses), grouped by, floors by, columns by, coloured by, sized by,
   labelled by, the top N, a comparison, the date the timeline reads, and the
   view. Every way of asking ends as a change to the recipe; the map draws the
   recipe and the head line reads it back. A saved view is a saved recipe;
   undo is the recipe before. The recipe lives on `intel`, in memory, per
   sitting; only a view the reader SAVES is kept (in this browser, like the
   template builder's drafts). Story: docs/MAP-HISTORY.md, "THE VIEW RECIPE". */
const IG_RECIPE_ROLES=['group','floors','columns','colour','size','label','time'];
const IG_ROLE_FIELD={ group:'groupBy', floors:'floorsBy', columns:'columnsBy', colour:'colourBy', size:'sizeBy', label:'labelBy', time:'timeBy' };
const IG_ROLE_WORD={ group:'int_role_group', floors:'int_role_floors', columns:'int_role_columns', colour:'int_role_colour', size:'int_role_size', label:'int_role_label', time:'int_role_time' };
const IG_TIME_KEYS=['decision','expiry','signed','created'];
/* What a role can offer when the words named no fact: the nearest things
   the map CAN do in that role (ask back, step 4). */
const IG_NEAREST={ group:['folder','counterparty','status'], floors:['status','payterms','valueBand'], columns:['folder','counterparty','kind'], colour:['status','risk','payterms'], size:['value','obligations','same'], label:['counterparty','owner','payterms'], time:['decision','expiry','signed'] };
const IG_UNDO_MAX=30, IG_VIEWS_KEY='hati.v1.igViews', IG_VIEWS_MAX=12, IG_TOP_DEFAULT=10;
function igRecipeNow(){
  return { lenses:intel.lenses.map(l=>({ ...l, ids:l.ids.slice(), badges:l.badges?{ ...l.badges }:null })),
    groupBy:intel.groupBy, groups:intel.groups?{ ...intel.groups }:null,
    floorsBy:intel.floorsBy||null, columnsBy:intel.columnsBy||null, colourBy:intel.colourBy||null, sizeBy:intel.sizeBy||null,
    labelBy:intel.labelBy||null, timeBy:intel.timeBy||null, sortBy:intel.sortBy||null, view:igbCam().view,
    names:intel.names?{ ...intel.names }:null, dotScale:intel.dotScale||1, bubbleBy:intel.bubbleBy||null, folds:{ ...(intel.folds||{}) },
    bundles:Array.isArray(intel.bundles)?intel.bundles.map(x=>({ ...x })):null, edgeNames:intel.edgeNames===true||null, rv:IG_RECIPE_V };
}
/* THE RECIPE'S EDITION. A place kept by an older edition is not put back:
   the map lands on its starting view ONCE (Young, 4 Oct 2026 — a map left
   grouped by customer with every group a big bubble was coming back on every
   refresh). Raise it only when the recipe's meaning changes. */
const IG_RECIPE_V=2;
/* A REFRESH LANDS WHERE YOU WERE (Young, 28 Sep 2026): what this page keeps
   across a reload, read by placeSave and put back by placeResume (js/app.js)
   BEFORE the first paint. */
function intelPlace(){
  const p={ tab:intel.tab };
  if(intel.tab==='map'){ try{ p.recipe=igRecipeNow(); p.cam=intel.cam?{ ...intel.cam, w:intel.cam.w.slice() }:null; }catch(_){} }
  return p;
}
function intelPlacePut(p){
  if(!p) return;
  if(IG_TABS.includes(p.tab)) intel.tab=p.tab;
  if(p.recipe&&p.recipe.rv!==IG_RECIPE_V){ igLandingSet(); return; }
  if(p.recipe){ try{ igRecipeSet(p.recipe); }catch(_){} }
  if(p.cam&&Array.isArray(p.cam.w)&&p.cam.w.length===IGB_NV) intel.cam={ ...p.cam, w:p.cam.w.slice() };
}
function igRecipeSet(r){
  if(!r) return;
  intel.lenses=(r.lenses||[]).map(l=>({ ...l, ids:l.ids.slice() }));
  intel.groupBy=r.groupBy||'folder'; intel.groups=r.groups||null;
  ['floorsBy','columnsBy','colourBy','sizeBy','labelBy','timeBy','sortBy'].forEach(k=>{ intel[k]=r[k]||null; });
  intel.names=r.names?{ ...r.names }:null; intel.dotScale=igDotScaleClamp(r.dotScale||1); intel.bubbleBy=r.bubbleBy||null;
  if(r.folds&&typeof r.folds==='object') intel.folds={ ...r.folds };
  intel.bundles=Array.isArray(r.bundles)&&r.bundles.length?r.bundles.filter(x=>x&&x.q).slice(0,IG_BUNDLES_MAX).map(x=>({ q:String(x.q), label:String(x.label||x.q) })):null;
  intel.edgeNames=r.edgeNames===true?true:null;
  intel.walk=null;
  igSetView(r.view==null?igbCam().view:r.view);
}
/* Every change goes through here: the recipe before it is kept for undo. */
function igRecipePush(){
  const st=intel.recipeStack||(intel.recipeStack=[]);
  st.push(igRecipeNow()); if(st.length>IG_UNDO_MAX) st.shift();
}
function igRecipeUndo(){
  const st=intel.recipeStack||[]; if(!st.length) return false;
  igRecipeSet(st.pop()); return true;
}
/* THE HEAD LINE READS THE RECIPE BACK — every setting that is not at rest. */
function igRecipeSays(){
  const out=[], w=k=>graphGroupingWord(k);
  if(intel.floorsBy) out.push(i18t('int_says_floors',{ x:w(intel.floorsBy) }));
  if(intel.columnsBy) out.push(i18t('int_says_columns',{ x:w(intel.columnsBy) }));
  if(intel.colourBy&&intel.colourBy!=='status'&&GRAPH_GROUP_KEYS.includes(intel.colourBy)) out.push(i18t('int_coloured_by',{ x:w(intel.colourBy) }));
  if(intel.sizeBy&&intel.sizeBy!=='value'&&IGB_SIZE_KEYS.includes(intel.sizeBy)) out.push(i18t('int_sized_by',{ x:i18t(IGB_SIZE_WORD[intel.sizeBy]) }));
  if(intel.labelBy&&GRAPH_GROUP_KEYS.includes(intel.labelBy)) out.push(i18t('int_says_label',{ x:w(intel.labelBy) }));
  if(intel.timeBy&&igbCam().view===4) out.push(i18t('int_says_time',{ x:i18t('int_time_'+intel.timeBy) }));
  if(intel.sortBy) out.push(i18t('int_says_sort',{ x:igSortWord(intel.sortBy) }));
  if(intel.names&&intel.names.mode==='none') out.push(i18t('int_says_names_none'));
  else if(intel.names&&intel.names.mode==='only') out.push(i18t('int_says_names_only',{ x:intel.names.label||intel.names.q }));
  else if(intel.names&&intel.names.mode==='hide') out.push(i18t('int_says_names_hide',{ x:intel.names.label||intel.names.q }));
  if((intel.dotScale||1)!==1) out.push(i18t('int_says_dots',{ n:Math.round((intel.dotScale||1)*100) }));
  if(intel.bubbleBy==='value') out.push(i18t('int_says_bubbles_value'));
  if(Array.isArray(intel.bundles)&&intel.bundles.length) out.push(i18t('int_says_bundles',{ x:intel.bundles.map(x=>x.label).join(', ') }));
  if(intel.edgeNames===true) out.push(i18t('int_says_edge_names'));
  return out;
}
/* ---- ONE LIST OF FACTS, AND THE WORDS PEOPLE USE FOR THEM ----
   Every grouping on GRAPH_GROUPINGS, named the ways a reader names it, in
   both languages. Longest first when read, so "payment terms" is not read
   as "terms", nor "expiry year" as "expiry". A word here for a key the map
   cannot cut would be a promise it cannot keep (f427 pins every key). */
const IG_FACT_WORDS={
  folder:['value streams','value stream','business units','business unit','departments','department','functions','function','streams','stream','categories','category','värdeströmmar','värdeström','avdelningar','avdelning','kategorier','kategori'],
  counterparty:['counterparties','counterparty','customers','customer','clients','client','suppliers','supplier','vendors','vendor','parties','party','partners','partner','motparter','motpart','kunder','kund','leverantörer','leverantör'],
  status:['lifecycle stage','lifecycle','statuses','status','stages','stage','phases','phase','steg','fas','faser','skede'],
  valueBand:['contract value','value band','values','value','sizes','size','amounts','amount','worth','money','värde','belopp','storlek'],
  kind:['contract types','contract type','types','type','kinds','kind','avtalstyper','avtalstyp','typer','typ'],
  expiry:['expiry window','expiry dates','expiry date','expiration','expiry','end dates','end date','when they end','when they expire','time left','utgångsdatum','utgång','slutdatum','löptid'],
  payterms:['payment terms','payment term','payment days','days to pay','days to get paid','credit terms','terms of payment','betalningsvillkor','betalningsdagar','betalningstid','kredittid'],
  decision:['renewal decisions','renewal decision','renewal dates','renewal date','renewals','renewal','decision dates','decision date','förnyelsebeslut','förnyelser','förnyelse'],
  risk:['risk levels','risk level','risks','risk','risknivå','risker'],
  source:['where they came from','origins','origin','sources','source','ursprung','källa'],
  signedYear:['year signed','signed year','signing year','signeringsår'],
  signedQuarter:['quarter signed','signed quarter','signing quarter','signeringskvartal'],
  expiryYear:['expiry year','year of expiry','utgångsår'],
  createdMonth:['month created','created month','creation month','skapad månad'],
  liability:['liability caps','liability cap','liability','caps','cap','ansvarsbegränsning','ansvarstak','ansvar'],
  law:['governing law','governing laws','jurisdictions','jurisdiction','law','tillämplig lag','jurisdiktion','lag'],
  owner:['owners','owner','who owns them','ägare','ansvarig'],
  obligations:['open obligations','obligations','duties','öppna åtaganden','åtaganden','skyldigheter'],
  read:['read by copilot','read or not','whether read','läst eller inte','lästa']
};
const _igFactList=(()=>{ const a=[]; Object.keys(IG_FACT_WORDS).forEach(k=>IG_FACT_WORDS[k].forEach(w=>a.push([w,k]))); return a.sort((x,y)=>y[0].length-x[0].length); })();
const _igNorm=s=>String(s||'').toLowerCase().replace(/[’']/g,"'").replace(/[?!.,;:()]/g,' ').replace(/\s+/g,' ').trim();
/* The fact a stretch of words names, reading from its start (after "the",
   "their", "its"…). Returns { key, len } or null. */
function igFactFind(text){
  let t=_igNorm(text).replace(/^(?:(?:the|their|its|our|a|de|dess|sina|sin|våra|vår)\s+)+/,'');
  for(const [w,k] of _igFactList){ if(t===w||t.startsWith(w+' ')) return { key:k, len:w.length, word:w }; }
  return null;
}
/* The fact named ANYWHERE in the words (for asking back). */
function igFactAnywhere(text){
  const t=' '+_igNorm(text)+' ';
  for(const [w,k] of _igFactList){ if(t.includes(' '+w+' ')) return { key:k, word:w }; }
  return null;
}
function igColourKeyOf(words){
  const w=_igNorm(words);
  if(/^(?:the\s+)?(?:status|stage|lifecycle|steg)\b/.test(w)) return 'status';
  const f=igFactFind(w); return f?f.key:graphGroupCue('by '+w.replace(/^the\s+/,''));
}
function igSizeKeyOf(words){
  const w=_igNorm(words);
  if(/value|money|amount|worth|size of the deal|värde|belopp|pengar/.test(w)) return 'value';
  if(/obligation|dut(?:y|ies)|promise|owed|åtagand|skyldighet/.test(w)) return 'obligations';
  if(/nothing|same|equal|uniform|one size|inget|samma|lika/.test(w)) return 'same';
  return null;
}
/* THE ORDER A FACT'S BUCKETS STAND IN on the floors, the grid and the
   timeline's lanes: the stages in their order, time in time order, bands low
   to high, everything else largest first; the "none" bucket always last. */
function igFactOrder(key, labels, count){
  const g=graphGroupingOf(key), none=g&&g.none;
  const num=l=>{ const m=String(l).match(/-?\d+(?:[.,]\d+)?/); return m?Number(m[0].replace(',','.')):Infinity; };
  const time=l=>{ const y=String(l).match(/(\d{4})/), q=String(l).match(/Q(\d)/), mo=GRAPH_MONTHS.findIndex(m=>String(l).startsWith(m)); return (y?Number(y[1]):9999)*100+(q?Number(q[1])*3:(mo>=0?mo+1:0)); };
  const FIX={ status:IGB_FLOOR_STATUS.map(igbStatusWord), expiry:['Expired','Within 30 days','31–90 days','3–12 months','Beyond a year'],
    obligations:['3 or more open','1–2 open','No open obligations'], liability:['Liability uncapped','Cap unclear','Liability capped'], read:['Not read yet','Read'],
    risk:['High risk','Medium risk','Low risk','No open findings'] };
  const rank=l=>{
    if(l===none) return 1e12;
    if(FIX[key]){ const i=FIX[key].indexOf(l); return i<0?5e11:i; }
    if(key==='decision') return (typeof graphDecisionOrder==='function')?graphDecisionOrder(l):0;
    if(['signedYear','signedQuarter','expiryYear','createdMonth'].includes(key)) return time(l);
    if(key==='payterms') return num(l);
    if(key==='valueBand') return /Non-monetary/.test(l)?9e11:/</.test(l)?0:/≥/.test(l)?3:num(l);
    return -(count&&count[l]||0);
  };
  return labels.slice().sort((a,b)=>(rank(a)-rank(b))||String(a).localeCompare(String(b)));
}
/* ---- WHICH CONTRACTS: THE WORDS THAT NARROW ----
   A stretch of words read as conditions over the record ("uncapped Sales
   contracts over 5M renewing in 90 days"): each condition is an existing
   reading, several are ANDed, and each carries the words the lens is named
   with. Nothing understood is null — the reader passes the sentence on. */
const IG_STATUS_WORDS=[
  ['Draft',['drafts','draft','drafting','utkast']],
  ['Under Review',['under review','in review','in negotiation','being negotiated','review','under granskning','granskning','förhandling']],
  ['Signed',['signed ones','signed','executed','active','live ones','signerade','undertecknade','aktiva']],
  ['Declined',['closed','declined','dead','cancelled','stängda','avböjda']]
];
const IG_UNIT_DAYS={ day:1, days:1, dag:1, dagar:1, week:7, weeks:7, vecka:7, veckor:7, month:30.44, months:30.44, månad:30.44, månader:30.44, quarter:91.3, quarters:91.3, kvartal:91.3, year:365.25, years:365.25, år:365.25 };
function igMoneyOf(n, unit){ let v=Number(String(n).replace(/[, ]/g,'')); if(!isFinite(v)) return null;
  const u=String(unit||'').toLowerCase(); if(/^(m|mn|million|millions|miljon|miljoner|mkr)$/.test(u)) v*=1e6; else if(/^(k|thousand|tusen)$/.test(u)) v*=1e3; else if(/^(bn|b|billion|miljard|miljarder)$/.test(u)) v*=1e9; return v; }
function igHomeValue(c){ if(!c||(typeof isMonetary==='function'&&!isMonetary(c))||!(Number(c.value||0)>0)) return null;
  const h=(typeof fxHome==='function')?fxHome(c):{ v:Number(c.value||0), missing:false }; return h.missing?null:h.v; }
/* THE READER'S WORDS, FOR BOTH SCREENS (the owner's review, 3 Oct 2026
   evening: "Show me all Juno contracts" showed everything). Every condition
   carries the FIELD it reads (conditions on one field are OR-ed — "Naivas
   and Carrefour", "drafts and signed" — and fields are AND-ed) and the HIT,
   the words in the question it was read from, so a reader can tell whether
   anything in the question was left unread (igLeftover). A counterparty is
   named by its whole name or by its first word — three letters or more and
   not an everyday word — so "Juno" finds Juno Logistics Ltd and Juno Limited
   both; the word is said back in the book's own spelling. The generic kind
   "Contract" is never a condition, so "contracts" names nothing. */
const IG_CP_STOP=new Set(('the and group limited ltd llc inc plc ab as oy kenya africa east west north south central new old royal modern global united national international general first second holdings company co corp corporation services service industries industry trading enterprises enterprise partners foundation association union bank').split(' '));
function igConditions(text){
  let t=' '+_igNorm(text)+' '; const conds=[];
  const add=(label,fn,field,hit)=>conds.push({ label, fn, field:field||label, hit:hit||label });
  const hit=re=>{ const m=t.match(re); return m?m[0].trim():null; };
  const moneyOk=(typeof canViewValues!=='function')||canViewValues();
  const live=c=>c&&!c.archived&&c.status!=='Declined'&&(typeof isAgreement!=='function'||isAgreement(c));
  // signed in a year: read first, so "signed" is not also read as the stage
  const sy=t.match(/\b(?:signed|executed|signerade|undertecknade)\s+(?:in|during|under|i)?\s*(\d{4})\b/);
  if(sy){ add('signed in '+sy[1], c=>{ const d=_gSignedDay(c); return !!d&&d.slice(0,4)===sy[1]; }, 'signedYear', sy[0]); t=t.replace(sy[0],' '); }
  // stages
  IG_STATUS_WORDS.forEach(([st,ws])=>{ const w=ws.find(w=>t.includes(' '+w+' ')); if(w) add(igbStatusWord(st), c=>c.status===st, 'status', w); });
  // money
  const inRange=/\b(?:between|mellan)\b/.test(t);
  const mv=t.match(/(?:^|\s)(over|above|more than|greater than|at least|bigger than|larger than|över|mer än|minst|större än)\s*(?:sek|kes|usd|eur|kr)?\s*([\d][\d.,]*)\s*(m|mn|million|millions|k|thousand|bn|billion|miljoner|miljon|mkr|tusen|miljarder)?\b/);
  const igUnitShort=u=>!u?'':/^(m|mn|million|millions|miljon|miljoner|mkr)$/.test(u)?'M':/^(k|thousand|tusen)$/.test(u)?'K':/^(bn|b|billion|miljard|miljarder)$/.test(u)?'B':u;
  if(mv&&moneyOk&&!inRange){ const v=igMoneyOf(mv[2],mv[3]); if(v!=null) add(mv[1]+' '+mv[2]+igUnitShort(mv[3]), c=>{ const h=igHomeValue(c); return h!=null&&h>=v; }, 'valueAbove', mv[0]); }
  const lv=t.match(/\b(under|below|less than|smaller than|under|mindre än)\s*(?:sek|kes|usd|eur|kr)?\s*([\d][\d.,]*)\s*(m|mn|million|millions|k|thousand|bn|billion|miljoner|miljon|mkr|tusen|miljarder)?\b/);
  if(lv&&moneyOk&&!inRange&&!/\b(days?|dagar)\b/.test(t.slice(t.indexOf(lv[0])+lv[0].length, t.indexOf(lv[0])+lv[0].length+8))){ const v=igMoneyOf(lv[2],lv[3]); if(v!=null) add(lv[1]+' '+lv[2]+igUnitShort(lv[3]), c=>{ const h=igHomeValue(c); return h!=null&&h<v; }, 'valueBelow', lv[0]); }
  // a range: "between 2 million and 80 million", "from 2M to 80M", "2M–80M"
  const U='(m|mn|million|millions|k|thousand|bn|billion|miljoner|miljon|mkr|tusen|miljarder)';
  const bt=t.match(new RegExp('\\b(?:between|from|mellan|från)\\s*(?:sek|kes|usd|eur|kr)?\\s*([\\d][\\d.,]*)\\s*'+U+'?\\s*(?:and|to|och|till|-|–)\\s*(?:sek|kes|usd|eur|kr)?\\s*([\\d][\\d.,]*)\\s*'+U+'?(?![\\p{L}\\p{N}])','u'))
    ||t.match(new RegExp('(?:^|\\s)([\\d][\\d.,]*)\\s*'+U+'?\\s*[-–]\\s*([\\d][\\d.,]*)\\s*'+U+'(?![\\p{L}\\p{N}])','u'));
  if(bt&&moneyOk&&!/^\s*(?:days?|dagar)\b/.test(t.slice(t.indexOf(bt[0])+bt[0].length))){
    const u2=bt[4]||bt[2]||'', u1=bt[2]||u2; const lo=igMoneyOf(bt[1],u1), hi=igMoneyOf(bt[3],u2);
    if(lo!=null&&hi!=null&&hi>=lo){ const short=u=>/^(m|mn|million|millions|miljon|miljoner|mkr)$/.test(u)?'M':/^(k|thousand|tusen)$/.test(u)?'K':/^(bn|b|billion|miljard|miljarder)$/.test(u)?'B':'';
      add('between '+bt[1]+short(u1)+' and '+bt[3]+short(u2), c=>{ const h=igHomeValue(c); return h!=null&&h>=lo&&h<=hi; }, 'valueBetween', bt[0]); } }
  { const h=hit(/ (?:no money|non-monetary|without value|utan värde) /); if(h) add('non-monetary', c=>igHomeValue(c)==null, 'money', h); }
  // renewal / expiry windows — HOME'S OWN READING of an ending: a live
  // agreement (not closed, not archived, not an amendment) whose effective
  // end falls inside the window; a renewal is the decision date's
  const win=t.match(/\b(renew(?:ing|s|al|als)?|expir(?:e|es|ing|y)|end(?:ing|s)?|förnya(?:s|r)?|löper ut|går ut|upphör)\b[^0-9]*?\b(?:in|within|next|over the next|inom|kommande|de närmaste|nästa)\s*(?:the\s+)?(?:next\s+)?(\d+)?\s*(days?|weeks?|months?|quarters?|years?|dagar|dag|veckor|vecka|månader|månad|kvartal|år)\b/);
  const endDays=c=>{ if(!live(c)) return null; const e=_gExpiryDay(c); return e?daysUntil(e):null; };
  if(win){ const n=Number(win[2]||1), d=Math.round(n*(IG_UNIT_DAYS[win[3]]||1)), renew=/renew|förny/.test(win[1]);
    add(win[0].trim(), c=>{ const days=renew?graphDecisionOf(c).days:endDays(c); return days!=null&&days>=0&&days<=d; }, renew?'renewWindow':'expiryWindow', win[0]); }
  else { const ty=t.match(/\b(renew(?:ing|s)?|expir(?:e|es|ing)|end(?:ing|s)?|förnyas|löper ut|går ut)\b.*?\b(this year|i år)\b/);
    if(ty){ const end=new Date(new Date().getFullYear(),11,31), d=Math.max(0,Math.ceil((end-Date.now())/864e5)), renew=/renew|förny/.test(ty[1]);
      add(renew?'renewing this year':'expiring this year', c=>{ const days=renew?graphDecisionOf(c).days:endDays(c); return days!=null&&days>=0&&days<=d; }, renew?'renewWindow':'expiryWindow', ty[0]); } }
  { const h=hit(/ (?:expired|already ended|past (?:their |its |the )?end date|utgångna|har gått ut) /);
    if(h) add('expired', c=>(typeof contractExpired==='function')?(live(c)&&contractExpired(c)):(()=>{ const e=_gExpiryDay(c); const d=e?daysUntil(e):null; return d!=null&&d<0; })(), 'expired', h); }
  // the record's own flags
  { const h=hit(/ (?:overdue|late obligations|past due|försenade|förfallna) /); if(h) add('overdue', c=>graphNodeFacts(c).overdue>0, 'overdue', h); }
  { const h=hit(/ (?:waiting on us|our move|mine to answer|väntar på oss|vårt drag) /); if(h) add('waiting on us', c=>{ try{ const w=negWhoseMove(c); return !!w&&w.k==='you'; }catch(_){ return false; } }, 'move', h); }
  { const h=hit(/ (?:waiting on them|their move|with the other side|väntar på dem|deras drag) /); if(h) add('waiting on them', c=>{ try{ const w=negWhoseMove(c); return !!w&&w.k==='them'; }catch(_){ return false; } }, 'move', h); }
  /* DEAL FACTS (5 Oct 2026, the board's Part 8). "Stalled" is said as what
     HaTi can know — a live negotiation with a move owed by one side — never a
     guessed number of quiet days; "negotiations" is the contracts that have
     one, read RAW off the record (READING MUST NOT WRITE: never negoInit). */
  { const h=hit(/ (?:stalled|stuck|fastnade|fastnat|stillastående) /); if(h) add('waiting on a side', c=>{ try{ const w=negWhoseMove(c); return !!w&&(w.k==='you'||w.k==='them'); }catch(_){ return false; } }, 'stalled', h); }
  { const h=hit(/ (?:negotiations|förhandlingar|förhandlingarna) /); if(h) add('in negotiation', c=>live(c)&&c.status!=='Signed'&&((Array.isArray(c.changes)&&c.changes.length>0)||!!c.negotiation), 'nego', h); }
  { const h=hit(/ (?:not read|unread|never read|inte lästa|olästa|oläst) /); if(h) add('not read yet', c=>graphNodeFacts(c).unread===true, 'read', h); }
  { const h=hit(/ (?:off[- ]standard|departing|deviat\w*|avvik\w*) /); if(h) add('off standard', c=>graphNodeFacts(c).offStandard>0, 'offStandard', h); }
  { const u=hit(/ (?:uncapped|no cap|without a cap|unlimited liability|obegränsat|utan tak|obegränsat ansvar) /), k=u?null:hit(/ (?:capped|with a cap|limited liability|begränsat ansvar|med tak) /);
    if(u) add('liability uncapped', c=>groupLabelOf(c,'liability')==='Liability uncapped', 'liability', u);
    else if(k) add('liability capped', c=>groupLabelOf(c,'liability')==='Liability capped', 'liability', k); }
  { const h=hit(/ (?:no owner|nobody owns|unowned|utan ägare) /); if(h) add('nobody owns', c=>groupLabelOf(c,'owner')==='Nobody owns this', 'owner', h); }
  /* THE READER'S OWN CONTRACTS (Young picked "Yours, measured", 4 Oct 2026):
     the contracts the person asking owns, by the record's own owner
     (contractOwnedBy) — so the shelf's "yours" pictures are board questions
     like any other, and typing "my contracts" asks the same thing */
  { const me=(typeof currentUser==='function')?currentUser():null;
    const h=me&&typeof contractOwnedBy==='function'?hit(/ (?:my (?:own )?(?:[a-zåäö]+ )?(?:contracts?|agreements?)|contracts? i own|(?:that |which )?i own|owned by me|mina (?:egna )?avtal|avtal (?:som )?jag äger) /):null;
    if(h) add(i18t('hb_lens_mine'), c=>contractOwnedBy(c,me), 'owner', h); }
  // which side of the table: the record's own category (paySide's reading)
  if(typeof paySide==='function'){
    const sp=hit(/ (?:suppliers?|vendors?|leverantör(?:er)?) /), cu=sp?null:hit(/ (?:customers?|clients?|kund(?:er)?) /);
    if(sp) add(i18t('hb_lens_suppliers'), c=>paySide(c)==='supplier', 'side', sp);
    else if(cu) add(i18t('hb_lens_customers'), c=>paySide(c)==='customer', 'side', cu); }
  // payment days
  const pd=t.match(/\b(?:pay(?:ing|s)?|payment)\b[^0-9]*?\b(later than|slower than|over|more than|longer than|beyond|above|within|under|less than|faster than)\s*(\d+)\s*(?:days?|dagar)/)
    ||t.match(/\b(over|more than|under|less than|within)\s*(\d+)\s*(?:days?|dagar)\s*(?:to pay|payment|att betala|betalning)/);
  if(pd&&typeof payDays==='function'){ const n=Number(pd[2]), slow=/later|slower|over|more|longer|beyond|above/.test(pd[1]);
    add((slow?'paying later than ':'paying within ')+n+' days', c=>{ const d=payDays(c); return d!=null&&(slow?d>n:d<=n); }, 'payDays', pd[0]); }
  // governing law, by the laws the book holds
  const laws=[...new Set((state.contracts||[]).map(c=>groupLabelOf(c,'law')).filter(l=>l!=='Law not read'))];
  laws.forEach(l=>{ const w=_igNorm(l), adj={ kenya:'kenyan', sweden:'swedish', england:'english', 'england and wales':'english', uganda:'ugandan', tanzania:'tanzanian' }[w];
    const h=[' '+w+' law ',' law of '+w+' ',adj?' '+adj+' law ':null,' '+w+'n law '].filter(Boolean).find(x=>t.includes(x));
    if(h) add(l+' law', c=>groupLabelOf(c,'law')===l, 'law', h.trim()); });
  // value streams, types and counterparties by the names the book holds
  const fold=s=>_igNorm(s).replace(/&/g,'and');
  const FOLD=(typeof FOLDERS!=='undefined'&&FOLDERS)||{};
  Object.values(FOLD).forEach(f=>{ const n=fold(f.name), first=n.split(' ')[0];
    const h=t.includes(' '+n+' ')?n:(first.length>=4&&t.includes(' '+first+' '))?first:null;
    if(h) add(f.name, c=>FOLD[c.folder]&&FOLD[c.folder].name===f.name, 'folder', h); });
  const kindOf=c=>{ try{ return (typeof cKind==='function')?cKind(c):''; }catch(_){ return ''; } };
  const kinds=[...new Set((state.contracts||[]).map(kindOf).filter(Boolean))];
  kinds.forEach(k=>{ const n=_igNorm(k), pl=n.endsWith('s')?n:n+'s';
    if(n==='contract'||n==='agreement'||n.length<3) return;      // "contracts" names nothing
    const h=t.includes(' '+n+' ')?n:t.includes(' '+pl+' ')?pl:null;
    if(h) add(k, c=>kindOf(c)===k, 'kind', h); });
  const cps=[...new Set((state.contracts||[]).map(c=>c.counterparty).filter(Boolean))];
  const named=new Set();
  cps.forEach(p=>{ const n=_igNorm(p); if(n&&t.includes(' '+n+' ')){ named.add(p); add(p, c=>c.counterparty===p, 'counterparty', n); } });
  const firstOf=p=>_igNorm(p).split(' ')[0].replace(/[^\p{L}\p{N}&'-]/gu,'');
  const byWord={};
  cps.forEach(p=>{ if(named.has(p)) return; const w=firstOf(p); if(w.length<3||IG_CP_STOP.has(w)||!t.includes(' '+w+' ')) return; (byWord[w]||(byWord[w]=[])).push(p); });
  Object.keys(byWord).forEach(w=>{ const ps=byWord[w], word=String(ps[0]).trim().split(/\s+/)[0].replace(/[^\p{L}\p{N}&'-]/gu,'');
    if(named.size&&[...named].some(p=>firstOf(p)===w)) return;      // the whole name already said it
    /* one party answers to the word: its whole name; several: the word they share */
    if(ps.length===1) add(ps[0], c=>c.counterparty===ps[0], 'counterparty', w);
    else add(word, c=>firstOf(c.counterparty||'')===w, 'counterparty', w); });
  // one label never stands twice (a stream named twice by two words)
  const seen=new Set(); return conds.filter(x=>seen.has(x.label)?false:(seen.add(x.label),true));
}
/* What a question still says once every condition's own words and the
   everyday filler are taken out: '' when the conditions were the whole of
   it, else the words left — which are somebody else's to answer. */
const IG_FILLER=/\b(?:show|shows|showing|me|us|all|the|a|an|our|my|your|their|its|contracts?|agreements?|deals?|ones?|obligations?|åtaganden?|value|valued|worth|värde|värda|list|find|give|get|see|please|which|what|who|that|those|these|have|has|had|are|is|were|was|be|in|of|with|for|and|or|to|do|does|did|we|any|every|from|just|only|now|still|currently|there|here|how|many|number|count|visa|alla|avtal|avtalen|vilka|vad|som|har|är|med|för|och|eller|mig|oss|bara|endast|hur|många|antal|lista|hitta)\b/g;
function igLeftover(text, conds){
  let t=' '+_igNorm(text)+' ';
  (conds||[]).forEach(x=>{ const h=' '+_igNorm(x.hit||'')+' '; if(h.trim()) t=t.split(h).join(' '); });
  return t.replace(IG_FILLER,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
/* AND across fields, OR within one: "Naivas and Carrefour" is either, "signed
   Naivas contracts" is both. */
function igIdsWhere(conds, base){
  const groups={}; (conds||[]).forEach(x=>{ const f=x.field||x.label; (groups[f]||(groups[f]=[])).push(x); });
  const gs=Object.values(groups);
  return (base||state.contracts||[]).filter(c=>gs.every(g=>g.some(x=>{ try{ return x.fn(c); }catch(_){ return false; } }))).map(c=>c.id);
}
/* ---- THE TOP N: "top 10 by value", "the 3 biggest in each stream" ---- */
const IG_TOP_BY={ value:c=>igHomeValue(c), payterms:c=>(typeof payDays==='function'?payDays(c):null), obligations:c=>((c.obligations)||[]).filter(o=>o&&!o.completedAt&&!o.done).length, renewal:c=>{ const d=graphDecisionOf(c).days; return d==null?null:-d; } };
/* an archived contract is off every list, so never in a top N */
/* dir 'up' is the other end: the N smallest (Young, 6 Oct 2026); a contract
   with no value on record is in neither end */
function igTopIds(n, by, per, base, dir){
  const read=IG_TOP_BY[by]||IG_TOP_BY.value, cs=(base||state.contracts||[]).filter(c=>c&&!c.archived&&read(c)!=null&&!(dir==='up'&&by==='value'&&!(read(c)>0)));
  const pickN=list=>list.slice().sort((a,b)=>(dir==='up'?read(a)-read(b):read(b)-read(a))).slice(0,n).map(c=>c.id);
  if(!per) return pickN(cs);
  const by2={}; cs.forEach(c=>{ const g=groupLabelOf(c,per,null); (by2[g]||(by2[g]=[])).push(c); });
  return Object.values(by2).flatMap(pickN);
}
function igSortWord(k){ return i18t('int_sort_'+k); }
/* ---- READING A SENTENCE INTO RECIPE CHANGES — free, in the browser ----
   Returns { acts:[…], rest } where each act is one change, or null when the
   sentence names nothing the reader knows (it goes on to Copilot). The same
   reader serves English and Swedish; f427 is its phrase book. */
const IG_ROLE_RE=[
  ['floors',/\b(?:floors?|levels?|layers?|tiers?|storeys?|stories|rows?|stack(?:s|ed)?|våningar(?:na)?|våning|nivåer(?:na)?|plan(?:en)?|rader(?:na)?|rad)\b/],
  ['columns',/\b(?:columns?|kolumner(?:na)?|kolumn)\b/],
  ['colour',/\b(?:colou?r(?:ed|s|ing)?|shade[sd]?|tint(?:ed)?|färg(?:a|lägg|er|lagda)?)\b/],
  ['size',/\b(?:size[sd]?|sizing|scale[sd]?|storlek)\b/],
  ['label',/\b(?:label(?:led|ed|s)?|labels|tag(?:ged)?|etiketter(?:na)?|etikett(?:era)?|märk(?:t|a)?)\b/],
  ['group',/\b(?:group(?:ed|s)?|lanes?|swim ?lanes?|banor|cluster(?:ed|s)?|bundle[sd]?|split|divide[sd]?|separate[sd]?|segment(?:ed)?|break (?:it |them )?down|arrange[sd]?|organi[sz]e[sd]?|sort (?:them )?into|gruppera(?:d|t)?|dela(?: upp)?|klustra|samla|segmentera|ordna)\b/]
];
const IG_BY_RE=/\b(?:by|per|of|according to|based on|on|into|with|efter|per|enligt|utifrån|på|med|av)\s+(.+)$/;
const IG_VIEW_WORDS=[[3,/\b(?:grid|matrix|table of|cross[- ]tab|rutnät|matris|tabell)\b/],[4,/\b(?:time ?line|over time|chronolog\w*|tidslinje|över tid)\b/],[0,/\b(?:brain view|as a brain|brain|hjärnvy|hjärna)\b/],[1,/\b(?:wiring|network view|kopplingar|nätverk)\b/],[2,/\b(?:floors view|floor view|våningsvy)\b/]];
const IG_DOT_SCALE_MIN=.5, IG_DOT_SCALE_MAX=3, IG_DOT_STEP=1.5;
function igDotScaleClamp(v){ const n=Number(v); return Math.max(IG_DOT_SCALE_MIN,Math.min(IG_DOT_SCALE_MAX,isFinite(n)&&n>0?n:1)); }
/* The words for the map's LOOK — names, bubble size, folding groups into one
   bubble — as acts igRecipeRun carries out. Fixed English and Swedish
   patterns over the normalised question; never translated words. */
const IG_NAMES_RE='(?:names?|labels?|captions?|words|text|titles?|namn(?:en)?|etiketter(?:na)?|texter(?:na)?)';
const IG_DOTS_RE='(?:bubbles?|dots?|circles?|points?|nodes?|bubblor(?:na)?|bubbla|prickar(?:na)?|punkter(?:na)?|cirklar(?:na)?)';
/* whose names: "customer names", "the counterparty names", "kundnamnen" */
const IG_WHOSE_RE='(?:(?:customer|client|counterparty|party|supplier|vendor|contract|kund|motparts?|leverantörs|avtals)(?:s|\'s)?\\s*)?';
const IG_EDGE_RE='(?:edges?|sides?|axis|axes|margins?|borders?|rims?|kanter(?:na)?|kanten|sidor(?:na)?|axlar(?:na)?)';
function igLookRead(q){
  let m;
  /* names on the edges — asked for, or taken off (4 Oct 2026) */
  if(new RegExp('^(?:please\\s+)?(?:show|put|add|turn on|switch on|bring back|give me|print|write|label)\\s+(?:the\\s+)?'+IG_WHOSE_RE+IG_NAMES_RE+'\\s+(?:on|along|at|to|round|around)\\s+(?:the\\s+)?'+IG_EDGE_RE+'$').test(q)
    ||new RegExp('^(?:visa|sätt|skriv)\\s+'+IG_WHOSE_RE+IG_NAMES_RE+'\\s+(?:på|längs|vid)\\s+'+IG_EDGE_RE+'$').test(q)) return [{ edgeNames:true }];
  if(new RegExp('^(?:please\\s+)?(?:hide|remove|drop|take (?:away|off)|turn off|switch off|clear|no)\\s+(?:the\\s+)?'+IG_WHOSE_RE+IG_NAMES_RE+'\\s+(?:on|along|at|from|off)\\s+(?:the\\s+)?'+IG_EDGE_RE+'$').test(q)
    ||new RegExp('^(?:please\\s+)?(?:take|move|get)\\s+(?:the\\s+)?'+IG_WHOSE_RE+IG_NAMES_RE+'\\s+(?:off|away from|from)\\s+(?:the\\s+)?'+IG_EDGE_RE+'$').test(q)
    ||new RegExp('^(?:dölj|göm|ta bort)\\s+'+IG_WHOSE_RE+IG_NAMES_RE+'\\s+(?:på|längs|vid|från)\\s+'+IG_EDGE_RE+'$').test(q)) return [{ edgeNames:false }];
  /* names back */
  if(new RegExp('^(?:please\\s+)?(?:show|bring back|turn on|switch on|put back|give me back|restore)\\s+(?:all\\s+)?(?:the\\s+)?'+IG_WHOSE_RE+IG_NAMES_RE+'(?:\\s+again|\\s+back)?$').test(q)
    ||new RegExp('^(?:visa|tänd|ta tillbaka)\\s+(?:alla\\s+)?'+IG_WHOSE_RE+IG_NAMES_RE+'(?:\\s+igen)?$').test(q)) return [{ names:null }];
  /* "remove the grouping", "ungroup", "no groups" (4 Oct 2026) */
  if(/^(?:please\s+)?(?:remove|undo|clear|drop|take away|turn off|get rid of|no|stop)\s+(?:the\s+|all\s+(?:the\s+)?)?(?:grouping|groupings|groups|clusters|clustering|bundles?|bundling)$/.test(q)
    ||/^(?:please\s+)?(?:ungroup|unbundle|de-?group)(?:\s+(?:everything|it all|them|the map|all))?$/.test(q)
    ||/^(?:ta bort|ångra|rensa)\s+(?:grupperingen|grupperna|grupper)$|^avgruppera(?: allt)?$/.test(q)) return [{ ungroup:true }];
  /* the big bubbles off: "remove the big bubbles", "no big bubbles" */
  if(/^(?:please\s+)?(?:remove|hide|drop|clear|open|unfold|get rid of|no|take away|lose)\s+(?:all\s+)?(?:the\s+)?(?:big|large|group)\s+(?:bubbles?|circles?)$/.test(q)
    ||/^(?:ta bort|dölj|öppna)\s+(?:alla\s+)?(?:de\s+)?stora\s+bubblorna?$/.test(q)) return [{ fold:'none' }];
  /* "the bubbles need to be small", "make the bubbles small", "small bubbles" */
  if(new RegExp('\\b'+IG_DOTS_RE+'\\b').test(q)&&/\b(?:small|tiny|little|små|liten|lilla)\b/.test(q)&&!/\b(?:smaller|than|än|mindre)\b/.test(q)) return [{ small:true }];
  /* ONE BUBBLE FOR CONTRACTS NAMED ACROSS GROUPS: "fold all Juno contracts
     into one bubble", "put Juno in one bubble", "show Juno as one bubble" —
     unless the words name a fact ("each customer as one bubble"), read below */
  m=q.match(/^(?:please\s+)?(?:fold|gather|bundle|collapse|put|group|combine|merge|pull|roll|lump)\s+(?:up\s+)?(?:together\s+)?(?:all\s+)?(?:of\s+)?(?:the\s+)?(.+?)\s+(?:together\s+)?(?:into|in|as)\s+(?:one|a|a single|single|the same)\s+(?:big\s+)?(?:bubble|circle)$/)
    ||q.match(/^(?:please\s+)?(?:show|make|draw|turn)\s+(?:all\s+)?(?:of\s+)?(?:the\s+)?(.+?)\s+(?:as|into)\s+(?:one|a single|a)\s+(?:big\s+)?(?:bubble|circle)$/)
    ||q.match(/^(?:samla|fäll ihop|lägg|slå ihop)\s+(?:alla\s+)?(.+?)\s+(?:i|till|som)\s+en\s+(?:stor\s+)?bubbla$/)
    ||q.match(/^(?:visa|gör)\s+(?:alla\s+)?(.+?)\s+(?:som|till)\s+en\s+(?:stor\s+)?bubbla$/);
  if(m){ const what=m[1].replace(/^(?:each|every|varje)\s+/,'').trim();
    if(!igFactFind(what)&&!/^(?:groups?|grupp(?:er)?|everything|allt)$/.test(what)){
      const c=igConditions(what); if(c.length) return [{ bundle:{ q:what, label:c.map(x=>x.label).join(' · ') } }];
      return [{ namesUnknown:what }]; } }
  /* some names: "only show names for Juno and Naivas", "names only for signed", "hide the names of drafts" */
  m=q.match(new RegExp('^(?:only\\s+|just\\s+)?(?:show|keep|leave|put)\\s+(?:the\\s+)?'+IG_NAMES_RE+'\\s+(?:only\\s+|just\\s+)?(?:for|of|on)\\s+(?:the\\s+)?(.+)$'))
    ||q.match(new RegExp('^(?:only|just)\\s+'+IG_NAMES_RE+'\\s+(?:for|of|on)\\s+(?:the\\s+)?(.+)$'))
    ||q.match(new RegExp('^'+IG_NAMES_RE+'\\s+only\\s+(?:for|of|on)\\s+(?:the\\s+)?(.+)$'))
    ||q.match(new RegExp('^(?:visa\\s+)?(?:bara\\s+|endast\\s+)'+IG_NAMES_RE+'\\s+(?:för|på)\\s+(.+)$'))
    ||q.match(new RegExp('^visa\\s+'+IG_NAMES_RE+'\\s+(?:bara\\s+|endast\\s+)?(?:för|på)\\s+(.+)$'));
  if(m){ const c=igConditions(m[1]); return c.length?[{ names:{ mode:'only', q:m[1].trim(), label:c.map(x=>x.label).join(' · ') } }]:[{ namesUnknown:m[1].trim() }]; }
  m=q.match(new RegExp('^(?:please\\s+)?(?:hide|remove|drop|take (?:away|off)|turn off|switch off)\\s+(?:the\\s+)?'+IG_NAMES_RE+'\\s+(?:of|for|on)\\s+(?:the\\s+)?(.+)$'))
    ||q.match(new RegExp('^(?:dölj|göm|ta bort)\\s+'+IG_NAMES_RE+'\\s+(?:för|på)\\s+(.+)$'));
  if(m){ const c=igConditions(m[1]); return c.length?[{ names:{ mode:'hide', q:m[1].trim(), label:c.map(x=>x.label).join(' · ') } }]:[{ namesUnknown:m[1].trim() }]; }
  /* no names at all: "hide the names", "just the bubbles", "remove the labels" */
  if(new RegExp('^(?:please\\s+)?(?:hide|remove|drop|take (?:away|off)|turn off|switch off|clear|lose|get rid of|no)\\s+(?:all\\s+)?(?:the\\s+)?'+IG_WHOSE_RE+IG_NAMES_RE+'(?:\\s+(?:and|so|to)\\s+.*)?$').test(q)
    ||new RegExp('^(?:(?:show\\s+)?(?:me\\s+)?)?(?:just|only|nothing but)\\s+(?:the\\s+)?'+IG_DOTS_RE+'$').test(q)
    ||new RegExp('^'+IG_DOTS_RE+'\\s+only$').test(q)
    ||new RegExp('^(?:without|no)\\s+(?:the\\s+)?'+IG_NAMES_RE+'$').test(q)
    ||new RegExp('^(?:dölj|göm|ta bort|släck)\\s+(?:alla\\s+)?'+IG_WHOSE_RE+IG_NAMES_RE+'$').test(q)
    ||new RegExp('^(?:visa\\s+)?(?:bara|endast)\\s+'+IG_DOTS_RE+'$').test(q)) return [{ names:{ mode:'none' } }];
  /* bubble size */
  if(new RegExp('\\b(?:normal|default|regular|usual|original|standard)\\s+(?:size|sized)\\b|\\breset\\s+(?:the\\s+)?(?:'+IG_DOTS_RE+'\\s+)?size\\b|\\bnormal storlek\\b|\\bvanlig storlek\\b').test(q)&&new RegExp(IG_DOTS_RE+'|\\bsize\\b|storlek').test(q)) return [{ dots:'reset' }];
  const big=new RegExp('\\b(?:bigger|larger|enlarge|grow|increase|blow up|större|förstora)\\b').test(q), small=new RegExp('\\b(?:smaller|shrink|reduce|tinier|decrease|mindre|förminska)\\b').test(q);
  if((big||small)&&!(big&&small)&&new RegExp(IG_DOTS_RE).test(q)&&!/\b(?:than|än)\b/.test(q)){
    const much=/\b(?:much|a lot|far|way|mycket|betydligt)\b/.test(q), bit=/\b(?:a (?:bit|little)|slightly|lite|något)\b/.test(q);
    const k=much?2:bit?1.2:IG_DOT_STEP; return [{ dots:big?k:1/k }]; }
  /* fold every group into one bubble — and, when a fact is named, group by it first */
  m=q.match(/^(?:show\s+)?(?:me\s+)?(?:each|every|all(?: the)?|the)?\s*(.+?)\s+as\s+(?:one|a single|single|big|their own)?\s*(?:big\s+)?(?:bubbles?|circles?)$/)
    ||q.match(/^(?:show\s+)?(?:me\s+)?one\s+(?:big\s+)?(?:bubble|circle)\s+(?:per|for each|for every|for)\s+(.+)$/)
    ||q.match(/^(?:visa\s+)?(?:varje|alla)\s+(.+?)\s+som\s+(?:en\s+)?(?:stor\s+)?bubbl(?:a|or)$/)
    ||q.match(/^(?:visa\s+)?en\s+(?:stor\s+)?bubbla\s+(?:per|för varje)\s+(.+)$/);
  if(m){ const f=igFactFind(m[1].replace(/^(?:the|each|every|varje)\s+/,'')); if(f||/^(?:group|groups|grupp|grupper)$/.test(m[1].trim())) return (f?[{ role:'group', fact:f.key }]:[]).concat([{ fold:'all' }]); }
  if(/^(?:please\s+)?(?:fold|collapse|gather|close|bundle|group)\s+(?:up\s+)?(?:everything|it all|them all|all(?: the)?(?: groups| bubbles)?|every group|the groups|each group)(?:\s+into (?:one|a|single|big)?\s*bubbles?)?$/.test(q)
    ||/^(?:one (?:big )?bubble (?:per|for each) group|groups as bubbles|bubbles per group)$/.test(q)
    ||/^(?:fäll ihop|samla)\s+(?:allt|alla(?: grupper)?)$/.test(q)) return [{ fold:'all' }];
  if(/^(?:please\s+)?(?:open|unfold|expand|spread)\s+(?:up\s+)?(?:everything|it all|them all|all(?: the)?(?: groups| bubbles)?|every group|the groups|each group)(?:\s+again)?$/.test(q)
    ||/^(?:fäll ut|öppna)\s+(?:allt|alla(?: grupper)?)(?:\s+igen)?$/.test(q)) return [{ fold:'none' }];
  /* the big bubbles' measure: "size the bubbles by value", "bubbles by count" */
  m=q.match(new RegExp('\\b(?:size\\s+)?(?:the\\s+)?(?:group\\s+|big\\s+)?'+IG_DOTS_RE+'\\s+(?:sized\\s+)?(?:by|on|per|efter)\\s+(value|worth|money|amount|count|number|how many|contracts|värde|antal|avtal)\\b'));
  if(m&&/\b(?:big|group|bubbles?|bubblor)\b/.test(q)) return [{ bubbleBy:/value|worth|money|amount|värde/.test(m[1])?'value':'count' }];
  m=q.match(/^(?:please\s+)?(?:open|unfold|expand|spread)\s+(?:up\s+)?(?:the\s+)?(.+?)(?:\s+(?:bubble|group|again|back))*$/)||q.match(/^(?:öppna|fäll ut)\s+(.+?)(?:\s+(?:igen|bubblan|gruppen))*$/);
  if(m&&IG&&IG.hubs){ const w=_igNorm(m[1]); const hit=IG.hubs.filter(h=>h.folded&&_igNorm(h.label).includes(w)); if(w.length>=3&&hit.length) return [{ fold:'open', labels:hit.map(h=>h.label) }]; }
  if(m&&Array.isArray(intel.bundles)&&intel.bundles.length){ const w=_igNorm(m[1]).replace(/\s+(?:contracts?|avtal(?:en)?)$/,'');
    if(w.length>=3&&intel.bundles.some(b=>_igNorm(b.label).includes(w)||_igNorm(b.q).includes(w))) return [{ unbundle:[w] }]; }
  m=q.match(/^(?:please\s+)?(?:fold|collapse|close|gather)\s+(?:up\s+)?(?:the\s+)?(.+?)(?:\s+(?:bubble|group|into one bubble|into a bubble))*$/)||q.match(/^(?:fäll ihop|samla)\s+(.+?)(?:\s+(?:bubblan|gruppen))*$/);
  if(m&&IG&&IG.hubs){ const w=_igNorm(m[1]); const hit=IG.hubs.filter(h=>!h.folded&&_igNorm(h.label).includes(w)); if(w.length>=3&&hit.length) return [{ fold:'close', labels:hit.map(h=>h.label) }]; }
  return null;
}
function igRecipeParse(qRaw){
  const q0=String(qRaw||'').trim(); if(!q0) return null;
  const q=_igNorm(q0.replace(/[,;]/g,' and '));
  const acts=[]; let rest=q;
  /* a question about what a contract says is not for the map */
  if(/^(?:please\s+)?(?:summari[sz]e|explain|describe|quote|tell me about|draft|write|translate|sammanfatta|förklara|beskriv|citera|skriv|översätt)\b/.test(q)) return null;
  if(/^(?:undo|go back|back|previous view|revert|undo that|take that back|ångra|tillbaka|gå tillbaka|backa)$/.test(q)) return { acts:[{ undo:true }], rest:'' };
  if(/^(?:please\s+)?(?:reset(?: the map| everything| it)?|start (?:again|over)|back to (?:the )?start|återställ(?: kartan| allt)?|börja om)$/.test(q)) return { acts:[{ everything:true }, { landing:true }], rest:'' };
  if(IG_EVERYTHING_RE.test(q)||/^(?:visa allt|visa alla(?: avtal)?|rensa(?: allt| kartan)?)$/.test(q)) return { acts:[{ everything:true }], rest:'' };
  let m=q.match(/^(?:save|keep|remember)\s+(?:this|the current|the)?\s*(?:view|map|layout)(?:\s+(?:as|called|named)\s+(.+))?$/)||q.match(/^spara\s+(?:den här\s+|denna\s+)?(?:vyn|vy|kartan)(?:\s+som\s+(.+))?$/);
  if(m){ const raw=m[1]?String(q0).slice(-m[1].length).trim():''; return { acts:[{ save:(raw&&_igNorm(raw)===m[1].trim()?raw:(m[1]||'')).trim() }], rest:'' }; }
  m=q.match(/^(?:open|show|load|go to|switch to)\s+(?:the\s+|my\s+)?(?:saved\s+)?view\s+(.+)$/)||q.match(/^(?:öppna|visa)\s+(?:den sparade\s+)?vyn\s+(.+)$/);
  if(m){ const raw=String(q0).slice(-m[1].length).trim(); return { acts:[{ open:(_igNorm(raw)===m[1].trim()?raw:m[1]).trim() }], rest:'' }; }
  /* NAMES, BUBBLE SIZE AND ONE BUBBLE PER GROUP (Young, 3–4 Oct 2026: "be
     able to ask copilot to remove names and only see the bubbles", "show
     certain or remove certain names", "make the bubbles bigger or smaller",
     "make the bubbles be represented by one big bubble"). Read here, free,
     before the roles — "size" and "show" mean something else below. */
  { const t=igLookRead(q); if(t) return { acts:t, rest:'' }; }
  /* follow-ups: narrow what is showing rather than start again */
  let follow=false;
  const fm=q.match(/^(?:and|also|now|then|plus|of (?:those|these|them)|among (?:those|these|them)|from (?:those|these)|och|också|nu|sedan|av (?:dem|dessa)|bland (?:dem|dessa))\b[\s,]*(?:only\s+|just\s+|bara\s+|endast\s+)?/);
  if(fm){ follow=true; rest=q.slice(fm[0].length); }
  if(/\b(?:of (?:those|these|them)|among (?:those|these|them)|av dem|bland dem)\b/.test(q)) follow=true;
  /* "instead" and "same but …" change the role that was changed last */
  const inst=rest.match(/^(?:same but|same thing but|the same but|samma men|samma sak men)\s+(?:by\s+|with\s+|efter\s+|med\s+)?(.+)$/)||rest.match(/^(.+?)\s+(?:instead|istället)$/);
  if(inst&&!IG_ROLE_RE.some(([,re])=>re.test(inst[1]))){ const f=igFactFind(inst[1].replace(/^(?:by|per|efter)\s+/,''));
    if(f) return { acts:[{ role:intel.lastRole||'group', fact:f.key }], rest:'' }; }
  if(/\b(?:instead|istället)\b/.test(rest)) rest=rest.replace(/\s*\b(?:instead|istället)\b/g,'');
  /* the views, named */
  const views=IG_VIEW_WORDS.filter(([,re])=>re.test(rest));
  /* "X against Y" / "X by Y grid": two facts make a grid */
  const vs=rest.match(/^(?:show\s+|visa\s+)?(?:me\s+)?(?:a\s+)?(?:grid\s+of\s+|matrix\s+of\s+)?(.+?)\s+(?:against|versus|vs|by|x|×|mot|per)\s+(.+?)(?:\s+(?:grid|matrix|rutnät|matris))?$/);
  if(vs){ const a=igFactFind(vs[1]), b=igFactFind(vs[2]);
    if(a&&b&&a.key!==b.key&&(views.some(([k])=>k===3)||/against|versus|\bvs\b|\bmot\b|×|\bx\b/.test(rest)||/grid|matrix|rutnät|matris/.test(rest)))
      return { acts:[{ role:'columns', fact:a.key }, { role:'floors', fact:b.key }, { view:3 }], rest:'' }; }
  /* compare two sets: "compare Sales with Procurement", "Naivas vs Carrefour" */
  const cm=rest.match(/^(?:compare|jämför)\s+(.+?)\s+(?:with|and|to|against|vs\.?|versus|med|och|mot)\s+(.+)$/)||rest.match(/^(.+?)\s+(?:vs\.?|versus)\s+(.+)$/);
  if(cm){ const A=igConditions(cm[1]), B=igConditions(cm[2]); if(A.length&&B.length) return { acts:[{ compare:{ a:A, b:B, aLabel:A.map(x=>x.label).join(' '), bLabel:B.map(x=>x.label).join(' ') } }], rest:'' }; }
  /* connections */
  const cn=rest.match(/\b(?:depends? on|connected to|tied to|linked to|related to|family of|amendments? (?:of|to)|hänger ihop med|kopplade till|beror på)\s+([a-z0-9\-]+(?:\s[a-z0-9\-]+)?)/);
  if(cn){ const id=cn[1].toUpperCase(); if(getContract(id)) return { acts:[{ linked:id }], rest:'' };
    const cp=(state.contracts||[]).find(c=>_igNorm(c.counterparty).startsWith(cn[1])); if(cp) return { acts:[{ linkedParty:cp.counterparty }], rest:'' }; }
  if(/(?:^|\s)(?:amendments? with their (?:parents?|masters?)|families|the family tree|contract families|avtalsfamiljer|ändringar med sina huvudavtal)(?:\s|$)/.test(rest)) acts.push({ families:true });
  /* top N / biggest N, optionally per group */
  const tp=rest.match(/\b(?:top|biggest|largest|highest|smallest|lowest|slowest|de\s+)?\s*(\d+)?\s*(?:biggest|largest|highest|top|smallest|lowest|least valuable|bottom|slowest[- ]paying|slowest payers|slowest|most obligations|största|högsta|minsta|lägsta|långsammaste|topp)\b/)
    ||rest.match(/\b(?:top|topp|bottom)\s*(\d+)\b/);
  const tpEnd=/\b(?:smallest|lowest|least valuable|bottom|minsta|lägsta)\b/.test(rest)&&!/slow|pay|betal|långsam|obligation|åtagand|renew|förny|soonest/.test(rest);
  if(tp&&(/\b(top|topp|biggest|largest|highest|slowest|största|högsta|långsammaste)\b/.test(rest)||tpEnd)){
    /* the other end: "the 5 smallest contracts", "lowest value", "bottom 10" */
    const up=tpEnd&&!/\b(?:top|topp|biggest|largest|highest|största|högsta)\b/.test(rest);
    const n=Number((rest.match(/\b(\d+)\b/)||[])[1]||IG_TOP_DEFAULT);
    const by=/slow|pay|betal|långsam/.test(rest)?'payterms':/obligation|åtagand/.test(rest)?'obligations':/renew|förny|soonest/.test(rest)?'renewal':'value';
    const perM=rest.match(/\b(?:in each|per|for each|within each|by each|i varje|för varje|per)\s+(.+)$/); const per=perM?igFactFind(perM[1]):null;
    acts.push({ top:Object.assign({ n:Math.max(1,Math.min(200,n)), by, per:per?per.key:null }, up&&by==='value'?{ dir:'up' }:{}) });
    rest=rest.replace(/\b(?:in each|per|for each|within each|i varje|för varje)\s+.+$/,'');
  }
  /* sort */
  const so=rest.match(/\b(?:sort(?:ed)?|order(?:ed)?|rank(?:ed)?|sortera|ordna|rangordna)\s+(?:them\s+|it\s+)?(?:by|efter)\s+(.+)$/);
  if(so){ const k=/value|värde|size|big/.test(so[1])?'value':/pay|betal/.test(so[1])?'payterms':/obligation|åtagand/.test(so[1])?'obligations':/renew|förny|decision/.test(so[1])?'renewal':null;
    if(k){ acts.push({ sort:k }); rest=rest.replace(so[0],''); } }
  /* timeline of which date */
  if(views.some(([k])=>k===4)){ const tb=/sign|signer|underteck/.test(rest)?'signed':/creat|raised|skapad/.test(rest)?'created':/expir|end|utgång|slut/.test(rest)?'expiry':/renew|decision|förny/.test(rest)?'decision':null; if(tb) acts.push({ role:'time', fact:tb }); }
  /* roles: "<role word> … by <fact>" */
  const clauses=rest.split(/\s*(?:,|;|\band then\b|\band\b|\bthen\b|\boch\b|\bsedan\b)\s*/).filter(Boolean)
    .flatMap(cl=>cl.split(/\s+(?=(?:colou?r|shade|size|label|tag|floors?|levels?|layers?|columns?|group|cluster|färg|storlek|etikett|våning|nivå|kolumn|gruppera)\w*\s+(?:\w+\s+){0,2}(?:by|per|efter|with|med)\b)/)).filter(Boolean);
  let unknown=null;
  clauses.forEach(cl=>{
    const role=(IG_ROLE_RE.find(([,re])=>re.test(cl))||[])[0];
    /* the "by" whose words name a fact: "lanes with colour by owner" reads past "with" */
    const by0=cl.match(IG_BY_RE); let by=by0;
    for(let m=by0; m; m=m[1].match(IG_BY_RE)){ if(igFactFind(m[1])){ by=m; break; } }
    if(role==='size'){ const k=igSizeKeyOf(by?by[1]:cl); if(k){ acts.push({ role:'size', fact:k }); return; } if(by){ unknown=unknown||{ text:by[1], role }; return; } }
    if(role&&by){ const f=role==='colour'?igColourKeyOf(by[1]):(igFactFind(by[1])||{}).key; if(f){ acts.push({ role, fact:f }); return; } }
    /* A ROLE AND A FACT ANYWHERE IN THE WORDS (Young, 28 Sep 2026: "maybe i
       want copilot to create floors of value stream or floors of owners"):
       "show streams as floors", "make the floors value streams", "put owners
       on the floors" name a role and a fact without "by". Words AFTER a "by"
       that named nothing are never scanned ("cluster by moon phase" is not
       the stage just because it says "phase") — only the words before it. */
    if(role){ const rre=(IG_ROLE_RE.find(([k])=>k===role)||[])[1], head=by0?cl.slice(0,by0.index):cl; const f=igFactAnywhere(rre?head.replace(new RegExp(rre.source,'g'),' '):head);
      if(f){ acts.push({ role, fact:role==='colour'&&f.key==='status'?'status':f.key }); return; }
      if(by){ unknown=unknown||{ text:by[1], role }; return; } }
    if(!role&&by&&!/^(?:the\s+)?(?:next|end|this)\b/.test(by[1])&&!IG_VIEW_WORDS.some(([,re])=>re.test(cl))&&!acts.some(a=>a.top||a.sort)&&!/\b(?:top|topp|biggest|largest|slowest|sort|order|rank|sortera)\b/.test(cl)){
      /* a bare "by <fact>" ("contracts by stream", "per counterparty") groups */
      const f=igFactFind(by[1]); if(f&&!/\b(?:only|just|bara|endast|hide|göm|dölj|which|vilka)\b/.test(cl)){ acts.push({ role:'group', fact:f.key }); return; }
    }
  });
  /* narrowing: only / hide / highlight */
  const nar=rest.match(/\b(?:only|just|nothing but|bara|endast|enbart)\s+(.+)$/);
  const hid=rest.match(/\b(?:hide|without|except|excluding|exclude|leave out|but not|göm|dölj|utan|förutom|utom)\s+(.+)$/);
  const hil=rest.match(/^(?:highlight|light up|mark|point out|which|what|markera|lys upp|vilka|visa vilka)\s+(.+)$/);
  if(nar){ const c=igConditions(nar[1]); if(c.length) acts.push({ narrow:{ conds:c, mode:follow?'and':'only' } }); }
  else if(hid){ const c=igConditions(hid[1]); if(c.length) acts.push({ narrow:{ conds:c, mode:'hide' } }); }
  else if(hil&&!/\boutliers?\b/.test(hil[1])){ const c=igConditions(hil[1]); if(c.length&&!/\b(say|says|mean|clause|wording|står|säger)\b/.test(hil[1])) acts.push({ narrow:{ conds:c, mode:'highlight' } }); }
  else if(follow){ const c=igConditions(rest); if(c.length) acts.push({ narrow:{ conds:c, mode:'and' } }); }
  else if(/^(?:show(?: me)?|give me|find|list|visa(?: mig)?|hitta|lista)\s+/.test(rest)&&!acts.some(a=>a.role||a.top)){ const c=igConditions(rest); if(c.length) acts.push({ narrow:{ conds:c, mode:'only' } }); }
  views.forEach(([k])=>{ if(!acts.some(a=>a.view!=null)) acts.push({ view:k }); });
  /* floors or columns imply their view */
  if(acts.some(a=>a.role==='floors')&&!acts.some(a=>a.view!=null)) acts.push({ view:acts.some(a=>a.role==='columns')?3:2 });
  if(acts.some(a=>a.role==='columns')&&!acts.some(a=>a.view!=null)) acts.push({ view:3 });
  if(acts.length) return { acts, rest:'' , unknown };
  /* a fact named with no instruction ("payment terms", "by owner?") — ask */
  const bare=q.replace(/^(?:(?:show(?: me)?|the|our|my|contracts?|avtal(?:en)?|visa|by|efter)\s+)+/,'');
  const f=igFactFind(bare); if(f&&bare.length<=f.len+2) return { acts:[{ ask:f.key }], rest:'' };
  /* CONDITIONS WITH NO VERB ("Juno contracts", "NDAs", "contracts expiring in
     the next 6 months", "Carrefour drafts") narrow, when the conditions are
     the whole of the question; a question word makes it a highlight. What
     the conditions do not cover goes on to Copilot. */
  { const cq=igConditions(q); if(cq.length&&!igLeftover(q,cq)) return { acts:[{ narrow:{ conds:cq, mode:/^(?:which|what|vilka|vad)\b/.test(q)?'highlight':'only' } }], rest:'' }; }
  if(unknown) return { acts:[{ unknownFact:String(unknown.text).trim(), role:unknown.role }], rest:q };
  return null;
}
/* ---- DOING WHAT WAS READ ----
   One undo point for the whole sentence, then each change, then ONE answer
   line composed from what the map now shows (never a claim of our own). */
function igRoleSet(role, fact){
  const f=IG_ROLE_FIELD[role]; if(!f) return false;
  if(role==='size'){ if(!IGB_SIZE_KEYS.includes(fact)) return false; intel.sizeBy=fact; }
  else if(role==='time'){ if(!IG_TIME_KEYS.includes(fact)) return false; intel.timeBy=fact; }
  else if(role==='group'){ if(!GRAPH_GROUP_KEYS.includes(fact)) return false; intel.groupBy=fact; intel.groups=null; }
  else if(role==='colour'){ if(fact!=='status'&&!GRAPH_GROUP_KEYS.includes(fact)) return false; intel[f]=fact; }
  else { if(!GRAPH_GROUP_KEYS.includes(fact)) return false; intel[f]=fact; }
  intel.lastRole=role; return true;
}
function igRoleSays(role, fact){
  const x=role==='size'?i18t(IGB_SIZE_WORD[fact]):role==='time'?i18t('int_time_'+fact):graphGroupingWord(fact);
  return i18t('int_did_role',{ role:i18t(IG_ROLE_WORD[role]), x });
}
function igChoiceButtons(fact){
  return [['group',fact],['floors',fact],['colour',fact]].map(([role,f])=>({ label:igRoleSays(role,f).replace(/\.$/,''), acts:[{ role, fact:f }].concat(role==='floors'?[{ view:2 }]:[]) }));
}
function igViewsRead(){ try{ const v=JSON.parse(localStorage.getItem(IG_VIEWS_KEY)||'[]'); return Array.isArray(v)?v:[]; }catch(_){ return []; } }
function igViewsWrite(list){ try{ localStorage.setItem(IG_VIEWS_KEY, JSON.stringify(list.slice(-IG_VIEWS_MAX))); return true; }catch(_){ return false; } }
function igViewName(){ const bits=[graphGroupingWord(intel.groupBy)].concat(igRecipeSays()).concat(intel.lenses.filter(l=>l.on).map(l=>l.label)); const s=bits.join(' · '); return s.charAt(0).toUpperCase()+s.slice(1); }
/* Recipes are saved without their ids' badges' prose, and a lens keeps its
   ids: a saved view opened next week shows the same contracts it named. */
function igViewSave(name){
  const list=igViewsRead().filter(v=>v.name!==name);
  list.push({ name:name||igViewName(), recipe:igRecipeNow(), at:(typeof todayISO==='function')?todayISO():'' });
  return igViewsWrite(list)?(name||list[list.length-1].name):null;
}
function igViewFind(name){ const n=_igNorm(name); return igViewsRead().slice().reverse().find(v=>_igNorm(v.name)===n||_igNorm(v.name).startsWith(n)||_igNorm(v.name).includes(n))||null; }
/* THE STARTING VIEW (Young, 4 Oct 2026: "reset" always comes back here):
   grouped by value stream, small dots, names on, nothing folded by a person,
   no bundle, no names on the edges. The lenses are "everything"'s. */
function igLandingSet(){
  ['floorsBy','columnsBy','colourBy','sizeBy','labelBy','timeBy','sortBy','lastRole','names','bubbleBy','bundles','edgeNames','foldWant'].forEach(k=>{ intel[k]=null; });
  intel.dotScale=1; intel.groupBy='folder'; intel.groups=null; intel.folds={};
  if(typeof igPaintGroupSelect==='function') try{ igPaintGroupSelect(); }catch(_){}
}
function igRecipeRun(parsed, opts){
  const said=[]; let choices=null, list=null, listTitle=null, changed=false, lensNote=null;
  const acts=parsed.acts||[];
  const quiet=acts.every(a=>a.undo||a.ask||a.unknownFact||a.save!=null||a.namesUnknown);
  if(!quiet&&!(opts&&opts.noPush)) igRecipePush();
  for(const a of acts){
    if(a.undo){ said.push(igRecipeUndo()?i18t('int_did_undo'):i18t('int_undo_none')); changed=true; continue; }
    if(a.everything){ intel.lenses=[]; intel.groups=null; intel.walk=null; const t=igBookTotal(); said.push(i18t('int_did_showing',{ n:t, t })+'.'); changed=true; continue; }
    if(a.landing){ igLandingSet(); said.push(i18t('int_did_landing')); changed=true; continue; }
    if(a.save!=null){ const n=igViewSave(a.save); said.push(n?i18t('int_did_saved',{ name:n }):i18t('int_save_failed')); continue; }
    if(a.open){ const v=igViewFind(a.open); if(v){ igRecipeSet(v.recipe); said.push(i18t('int_did_opened',{ name:v.name })); changed=true; }
      else { const names=igViewsRead().map(x=>x.name); said.push(names.length?i18t('int_view_unknown',{ name:a.open }):i18t('int_views_none')); if(names.length) choices=names.slice(-3).map(n=>({ label:n, acts:[{ open:n }] })); } continue; }
    if(a.ask){ said.push(i18t('int_ask_role',{ x:graphGroupingWord(a.ask) })); choices=igChoiceButtons(a.ask); continue; }
    if(a.unknownFact){ const role=IG_RECIPE_ROLES.includes(a.role)?a.role:'group'; said.push(i18t('int_fact_unknown',{ x:a.unknownFact }));
      choices=IG_NEAREST[role].map(k=>({ label:igRoleSays(role,k).replace(/\.$/,''), acts:[{ role, fact:k }].concat(role==='floors'?[{ view:2 }]:role==='columns'?[{ view:3 }]:[]) })); continue; }
    if(a.role){ if(igRoleSet(a.role,a.fact)){ said.push(igRoleSays(a.role,a.fact)); changed=true; } continue; }
    /* the map's LOOK (4 Oct 2026): names, bubble size, folds — undoable, kept in a saved view */
    if('names' in a){ intel.names=a.names;
      /* names asked for are names shown: a group folded away (small groups
         start folded on a crowded map) is opened for the contracts named */
      if(a.names&&a.names.mode==='only'&&IG&&IG.hubs){ let ids=[]; try{ ids=igIdsWhere(igConditions(a.names.q)); }catch(_){} const set=new Set(ids), F=intel.folds||(intel.folds={});
        IG.hubs.forEach(h=>{ if(h.folded&&(h.kids||[]).some(n=>set.has(n.id))) F[h.foldKey]=false; }); }
      said.push(!a.names?i18t('int_did_names_all'):a.names.mode==='none'?i18t('int_did_names_none')
      :i18t(a.names.mode==='only'?'int_did_names_only':'int_did_names_hide',{ x:a.names.label||a.names.q })); changed=true; continue; }
    if(a.namesUnknown){ said.push(i18t('int_names_unknown',{ x:a.namesUnknown })); continue; }
    if(a.dots){ const was=intel.dotScale||1, now=a.dots==='reset'?1:igDotScaleClamp(was*a.dots); intel.dotScale=now;
      said.push(now===was?i18t(now>=IG_DOT_SCALE_MAX?'int_did_dots_max':now<=IG_DOT_SCALE_MIN?'int_did_dots_min':'int_did_dots',{ n:Math.round(now*100) }):i18t('int_did_dots',{ n:Math.round(now*100) })); continue; }
    if(a.bubbleBy){ intel.bubbleBy=a.bubbleBy==='value'&&((typeof canViewValues!=='function')||canViewValues())?'value':'count';
      said.push(i18t(intel.bubbleBy==='value'?'int_did_bubbles_value':'int_did_bubbles_count')); continue; }
    if(a.fold){ const F=intel.folds||(intel.folds={});
      if(a.fold==='all'||a.fold==='none'){ intel.foldWant=a.fold; if(IG&&IG.hubs) IG.hubs.forEach(h=>{ F[h.foldKey]=a.fold==='all'?IG_FOLD_BUBBLE:false; }); if(a.fold==='all') intel.walk=null;
        if(a.fold==='none') intel.bundles=null;
        said.push(i18t(a.fold==='all'?'int_did_fold_all':'int_did_open_all')); }
      else { const want=a.fold==='close'; (IG&&IG.hubs||[]).filter(h=>a.labels.includes(h.label)).forEach(h=>{ F[h.foldKey]=want?IG_FOLD_BUBBLE:false; });
        said.push(i18t(want?'int_did_fold_some':'int_did_open_some',{ x:a.labels.join(', ') })); }
      changed=true; continue; }
    /* ONE BUBBLE FOR CONTRACTS NAMED ACROSS GROUPS ("fold all Juno contracts
       into one bubble"): the grouping is left exactly as it was */
    if(a.bundle){ let ids=[]; try{ ids=igIdsWhere(igConditions(a.bundle.q)); }catch(_){}
      if(ids.length<2){ said.push(i18t(ids.length?'int_bundle_single':'int_bundle_nomatch',{ x:a.bundle.label||a.bundle.q })); continue; }
      const B=(Array.isArray(intel.bundles)?intel.bundles:[]).filter(b=>_igNorm(b.q)!==_igNorm(a.bundle.q));
      B.push({ q:a.bundle.q, label:a.bundle.label||a.bundle.q }); intel.bundles=B.slice(-IG_BUNDLES_MAX); intel.walk=null;
      if(igbCam().view>=2) igSetView(0);
      said.push(i18t('int_did_bundle',{ n:ids.length, x:a.bundle.label||a.bundle.q })); changed=true; continue; }
    if(a.unbundle){ const B=Array.isArray(intel.bundles)?intel.bundles:[];
      const keep=a.unbundle==='all'?[]:B.filter(b=>!a.unbundle.some(w=>_igNorm(b.label).includes(w)||_igNorm(b.q).includes(w)));
      const gone=B.length-keep.length; intel.bundles=keep.length?keep:null;
      if(gone) said.push(i18t('int_did_unbundle',{ x:B.filter(b=>!keep.includes(b)).map(b=>b.label).join(', ') }));
      changed=changed||gone>0; continue; }
    if('edgeNames' in a){ intel.edgeNames=a.edgeNames?true:null; said.push(i18t(a.edgeNames?'int_did_edge_names_on':'int_did_edge_names_off')); changed=true; continue; }
    /* "the bubbles need to be small": the big bubbles open first; then the dots go to their own size */
    if(a.small){ const F=intel.folds||(intel.folds={}); let opened=0;
      Object.keys(F).forEach(k=>{ if(F[k]===IG_FOLD_BUBBLE){ F[k]=false; opened++; } });
      if(IG&&IG.hubs) IG.hubs.forEach(h=>{ if(h.folded&&F[h.foldKey]===false) igFoldHub(h,false); });
      const nb=Array.isArray(intel.bundles)?intel.bundles.length:0; intel.bundles=null;
      const was=intel.dotScale||1, now=(opened||nb)?Math.min(1,was):was>1?1:igDotScaleClamp(was/IG_DOT_STEP); intel.dotScale=now;
      said.push(opened||nb?i18t('int_did_small_open'):i18t(now<=IG_DOT_SCALE_MIN&&now===was?'int_did_dots_min':'int_did_dots',{ n:Math.round(now*100) })); changed=true; continue; }
    /* "remove the grouping": back to the map's own grouping, every group open, no bundles */
    if(a.ungroup){ intel.groupBy='folder'; intel.groups=null; intel.bundles=null; intel.foldWant='none'; intel.folds={};
      igPaintGroupSelect(); said.push(i18t('int_did_ungroup',{ x:graphGroupingWord('folder') })); changed=true; continue; }
    if(a.view!=null){ igSetView(a.view); changed=true; continue; }
    if(a.sort){ intel.sortBy=a.sort; said.push(i18t('int_says_sort',{ x:igSortWord(a.sort) }).replace(/^./,ch=>ch.toUpperCase())+'.'); changed=true; continue; }
    if(a.narrow){ const n=a.narrow, label=n.conds.map(x=>x.label).join(' · ');
      const hit=igIdsWhere(n.conds);
      if(n.mode==='only') intel.lenses=intel.lenses.filter(l=>l.action!=='filter');
      if(n.mode==='hide'){ const drop=new Set(hit); const keep=(state.contracts||[]).map(c=>c.id).filter(id=>!drop.has(id)); addLens({ label:i18t('int_lens_without',{ x:label }), ids:keep, action:'filter' }); lensNote=i18t('int_did_hidden',{ n:hit.length, x:label }); }
      else if(n.mode==='highlight'){ addLens({ label, ids:hit, action:'highlight' }); lensNote=i18t('int_did_highlighted',{ n:hit.length, t:igBookTotal() })+' · '+label; list=hit; listTitle=label; }
      else { addLens({ label, ids:hit, action:'filter' }); lensNote=hit.length?i18t('int_did_showing',{ n:intelActive().ids?intelActive().ids.size:hit.length, t:igBookTotal() })+' · '+label:i18t('int_did_nomatch'); list=hit; listTitle=label; }
      changed=true; continue; }
    if(a.top){ const t=a.top, base=(()=>{ const act=intelActive(); return (state.contracts||[]).filter(c=>!(act.ids&&act.action==='filter')||act.ids.has(c.id)); })();
      const ids=igTopIds(t.n,t.by,t.per,base,t.dir), label=i18t(t.dir==='up'?'int_bottom_label':'int_top_label',{ n:t.n, x:igSortWord(t.by) })+(t.per?' · '+i18t('int_top_per',{ x:graphGroupingWord(t.per) }):'');
      intel.lenses=intel.lenses.filter(l=>l.action!=='filter'||l.kind==='top'?false:true); addLens({ label, ids, action:'filter' });
      intel.sortBy=t.by; lensNote=i18t('int_did_showing',{ n:ids.length, t:igBookTotal() })+' · '+label; list=ids; listTitle=label; changed=true;
      /* CHART FIRST on the board (Young, 3 Oct 2026): the list arrives in its
         ranked order, so the List picture reads biggest (or smallest) first */
      continue; }
    if(a.compare){ const A=igIdsWhere(a.compare.a), B=igIdsWhere(a.compare.b), groups={};
      A.forEach(id=>{ groups[id]=a.compare.aLabel; }); B.forEach(id=>{ if(!groups[id]) groups[id]=a.compare.bLabel; });
      intel.lenses=intel.lenses.filter(l=>l.action!=='filter'); addLens({ label:i18t('int_compare_lens',{ a:a.compare.aLabel, b:a.compare.bLabel }), ids:Object.keys(groups), action:'filter' });
      intel.groupBy='custom'; intel.groups=groups;
      const tot=ids=>{ let s=0; ids.forEach(id=>{ const v=igHomeValue(getContract(id)); if(v!=null) s+=v; }); return s; };
      const money=(typeof canViewValues!=='function')||canViewValues(), fmt=v=>(typeof fmtMoneyShort==='function')?fmtMoneyShort(v):String(Math.round(v));
      lensNote=i18t('int_did_compare',{ a:a.compare.aLabel, na:A.length, b:a.compare.bLabel, nb:B.length })+(money?' · '+fmt(tot(A))+' / '+fmt(tot(B)):'');
      list=Object.keys(groups); listTitle=i18t('int_compare_lens',{ a:a.compare.aLabel, b:a.compare.bLabel }); changed=true; continue; }
    if(a.linked){ const d=graphDependents(a.linked), fam=(state.contracts||[]).filter(c=>c.parentId===a.linked||c.id===(getContract(a.linked)||{}).parentId).map(c=>c.id);
      const ids=[a.linked].concat((d.contracts||[]).map(x=>x.id)).concat(fam); const uniq=[...new Set(ids)];
      intel.lenses=intel.lenses.filter(l=>l.action!=='filter'); addLens({ label:i18t('int_linked_lens',{ x:a.linked }), ids:uniq, action:'filter' });
      lensNote=i18t('int_did_linked',{ n:uniq.length-1, x:a.linked }); list=uniq; listTitle=i18t('int_linked_lens',{ x:a.linked }); changed=true; continue; }
    if(a.linkedParty){ const ids=(state.contracts||[]).filter(c=>c.counterparty===a.linkedParty).map(c=>c.id), more=new Set(ids);
      buildGraphEdges(state.contracts||[]).filter(e=>e.kind!=='party').forEach(e=>{ if(ids.includes(e.from)) more.add(e.to); if(ids.includes(e.to)) more.add(e.from); });
      intel.lenses=intel.lenses.filter(l=>l.action!=='filter'); addLens({ label:i18t('int_linked_lens',{ x:a.linkedParty }), ids:[...more], action:'filter' });
      lensNote=i18t('int_did_showing',{ n:more.size, t:igBookTotal() })+' · '+i18t('int_linked_lens',{ x:a.linkedParty }); list=[...more]; changed=true; continue; }
    if(a.families){ const kids=new Set(); (state.contracts||[]).forEach(c=>{ if(c.parentId&&getContract(c.parentId)){ kids.add(c.id); kids.add(c.parentId); } });
      intel.lenses=intel.lenses.filter(l=>l.action!=='filter'); addLens({ label:i18t('int_families_lens'), ids:[...kids], action:'filter' });
      lensNote=kids.size?i18t('int_did_showing',{ n:kids.size, t:igBookTotal() })+' · '+i18t('int_families_lens'):i18t('int_families_none'); list=[...kids]; changed=true; continue; }
  }
  if(lensNote) said.push(lensNote);
  if(changed) rebuildIntelGraph();
  intel.history.push({ role:'assistant', text:igEsc(said.filter(Boolean).join(' ')||i18t('int_did_nothing')), choices:choices||null,
    listIds:list&&list.length?list.slice():null, listTitle:listTitle||null, cardIds:list?list.slice(0,5):[] });
  return opts&&opts.report?{ changed, said }:true;
}
/* COPILOT'S MAP TOOL KNOWS THE LOOK (Young, 4 Oct 2026: "Remove customer
   names" came back as a label setting and a "Customers only" lens, with a
   sentence saying the names were hidden). The tool's `look` names the same
   acts the free reader does; each is carried out by igRecipeRun, which says
   in HaTi's words what the map did. */
function igLookActs(look){
  if(!look||typeof look!=='object') return [];
  const acts=[];
  if(look.grouping==='reset') acts.push({ ungroup:true });
  if(look.names==='none') acts.push({ names:{ mode:'none' } }); else if(look.names==='all') acts.push({ names:null });
  if(look.edgeNames===true||look.edgeNames===false) acts.push({ edgeNames:look.edgeNames });
  if(look.bubbles==='none') acts.push({ fold:'none' }); else if(look.bubbles==='all') acts.push({ fold:'all' });
  if(look.dots==='small') acts.push({ small:true }); else if(look.dots==='bigger') acts.push({ dots:IG_DOT_STEP });
  else if(look.dots==='smaller') acts.push({ dots:1/IG_DOT_STEP }); else if(look.dots==='normal') acts.push({ dots:'reset' });
  if(typeof look.bundle==='string'&&look.bundle.trim()){ const q=_igNorm(look.bundle.trim().slice(0,80)); let c=[]; try{ c=igConditions(q); }catch(_){}
    acts.push(c.length?{ bundle:{ q, label:c.map(x=>x.label).join(' · ') } }:{ namesUnknown:look.bundle.trim().slice(0,80) }); }
  return acts;
}
/* A sentence that says the map did something. Printed only where the map did. */
const IG_CLAIM_RE=/\b(?:hid(?:den|e)?|removed?|now (?:shows?|showing|displays?)|i(?:'ve| have)? (?:updated|changed|set|turned|made|grouped|folded|hidden|removed)|regrouped|grouped|folded|bundled|resized|turned (?:off|on)|switched (?:off|on)|labell?ed|colou?red|sized|dold|gömd|ändrat|grupperat)\b/i;
/* Returns the part of the sentence still to be asked of Copilot ('' when the
   whole of it was done here), or null when none of it was for here. A
   grouping by something no fact names ("by region") goes to Copilot, which
   can place contracts by reading them; a colour, size or floors by something
   no fact names is answered here, with the nearest things the map can do. */
async function intelMapLocal(q){
  const say=text=>intel.history.push({ role:'assistant', text:igEsc(text) });
  const walk=IG_WALK_RE.test(q), outl=IG_OUTLIER_RE.test(q);
  const all=re=>new RegExp(re.source,'gi');
  let rest=q; if(walk) rest=rest.replace(all(IG_WALK_RE),' '); if(outl) rest=rest.replace(all(IG_OUTLIER_RE),' ');
  rest=rest.replace(/\s+/g,' ').trim();
  const parsed=igRecipeParse(rest);
  if(parsed&&parsed.acts.length===1&&parsed.acts[0].unknownFact&&parsed.acts[0].role==='group') return q;
  if(!parsed&&!walk&&!outl) return null;
  if(parsed) igRecipeRun(parsed);
  else { const left=rest.replace(/\b(?:and|then|please|me|the|them|these|those|which|what|are|is|show|find|contracts?|och|dem|dessa|vilka|visa|avtal(?:en)?)\b/gi,' ').replace(/[?.!,;]/g,' ').replace(/\s+/g,' ').trim();
    if(left.split(' ').filter(Boolean).length>=2){ igRecipePush(); await intelGraphAsk(rest); rebuildIntelGraph(); } }
  if(outl){ const act=intelActive(), cs=(state.contracts||[]).filter(c=>!(act.ids&&act.action==='filter')||act.ids.has(c.id));
    const hits=graphOutliers(cs);
    if(!hits.length) say(i18t('int_outliers_none'));
    else { const badges={}; hits.forEach(h=>{ badges[h.id]=h.why[0]; });
      if(!parsed) igRecipePush();
      addLens({ label:i18t('int_outliers_lens'), ids:hits.map(h=>h.id), action:'highlight', badges });
      intel.history.push({ role:'assistant', text:igEsc(i18t('int_outliers_found',{ n:hits.length })), cardIds:hits.slice(0,5).map(h=>h.id), listIds:hits.map(h=>h.id), listTitle:i18t('int_outliers_lens') }); } }
  if(walk){ rebuildIntelGraph(); const w=graphWalkIds();
    if(!w.ids.length){ intel.walk=null; say(i18t('int_walk_none')); }
    else { intel.walk={ ids:w.ids, clock:0, playing:true };
      intel.history.push({ role:'assistant', text:igEsc(i18t('int_walk_start',{ n:w.ids.length })+(w.total>w.ids.length?' · '+i18t('int_walk_capped',{ n:w.ids.length, t:w.total }):'')), listIds:w.ids, listTitle:i18t(IG_TAB_LABEL.map) }); } }
  return '';
}
/* A QUESTION PUT READY IN THE PANEL (Young, 4 Oct 2026): "When you have the
   option to ask copilot from the dashboard, it should ask the copilot in the
   intelligence panel" — not the chat window outside the page. A board door
   puts its question in this panel's own box, ready, and sends nothing: the
   press that spends is Send, under the cost line, as for a typed question.
   A question sent exactly as it was put ready is a question ABOUT A
   CONTRACT — it goes to Copilot's reading chat and is never re-read by the
   board's free reader (which would hear "risks" and open the Exposure panel). */
let _igReadyAsk='';
function intelAskReady(q){
  q=String(q||'').trim(); if(!q) return false;
  if(!intel.dockOpen){ intel.dockOpen=true; renderIntelDock(); igSyncDockWidth(); }
  const inp=document.getElementById('igd-input'); if(!inp) return false;
  const had=String(inp.value||'');
  if(had.trim() && had.trim()!==_igReadyAsk && had!==_igStrandLastAsk) return false;
  inp.value=q; _igReadyAsk=q;
  if(window.chatFieldGrow) chatFieldGrow(inp);
  try{ inp.focus({ preventScroll:true }); inp.setSelectionRange(q.length,q.length); }catch(_){}
  return true;
}
async function intelAsk(qRaw){
  const q=(qRaw||'').trim();
  if(!q||intel.busy) return;
  const readied=!!_igReadyAsk && q===_igReadyAsk; _igReadyAsk='';
  if(readied){
    intel.history.push({role:'user', text:q});
    intel.busy=true; renderIntelDock(); updateIntelNote();
    try{ await intelChatAsk(q); }
    catch(e){ intel.history.push({role:'assistant', text:'Something went wrong: '+igEsc(e.message), err:true}); }
    intel.busy=false; renderIntelDock();
    return;
  }
  /* ON HOME THE BOARD'S FREE READER ANSWERS FIRST (3 Oct 2026): a figure, a
     panel, a contract by its reference, the lens, the side of the screen.
     What it does not understand goes on exactly as on the map. No spend. */
  /* THE READING, AS CHIPS (the board that answers right, Part 4): a reply
     that drew or changed the open chart carries how it was read */
  const rdSnap=(state.view==='dashboard'&&typeof window.hbReadingSnap==='function')?hbReadingSnap():null;
  const rdOf=()=>{ try{ const r=rdSnap?hbReadingAfter(rdSnap):null; return r?{ reading:r }:{}; }catch(_){ return {}; } };
  if(state.view==='dashboard' && typeof window.hbAsk==='function'){
    let said=null; try{ said=hbAsk(q); }catch(e){ said=null; }
    if(said){ intel.history.push({role:'user', text:q}); intel.history.push(Object.assign({role:'assistant', text:said}, typeof window.hbTakeMeta==='function'?hbTakeMeta():{}, rdOf(), typeof window.hbBoardReplyMeta==='function'?hbBoardReplyMeta():{})); renderIntelDock(); return; }
  }
  const h0=intel.history.length;
  /* A TYPED QUESTION ON THE BOARD STARTS AFRESH (the honest reply, 5 Oct
     2026): a set an earlier question left on the map no longer narrows the
     next one ("Top 10 by value" drawing 2) — the board's own count stays */
  if(igBoardNow()) intel.lenses=(intel.lenses||[]).filter(l=>l.hb||l.action!=='filter');
  intel.history.push({role:'user', text:q});
  intel.busy=true; renderIntelDock(); updateIntelNote();
  try{
    const idHits=(q.match(/(?:MK|RL)-\d+/gi)||[]).length;
    /* THE QUESTIONS FOLLOW THE SWITCH (26 Sep 2026): with the paper up, every
       question is about that contract and goes with its wording; on Graph the
       box asks about the portfolio exactly as before. */
    /* ---- NO MORE GUESSING FROM WORDS (the view recipe, 28 Sep 2026) ----
       Young's "divide the floors by payment terms" was sent to a reading of
       one contract because "payment terms" was on a word list. Now: the free
       reader takes what it understands; two named contracts go side by side;
       the compliance sweep and the template adviser keep their own doors;
       and EVERYTHING ELSE goes to Copilot, which decides whether the question
       is about the map (it returns a recipe) or about what a contract says
       (it hands the question to the reading chat). */
    /* ON THE BOARD THE MAP IS NOT THE SCREEN (4 Oct 2026): the map's own reader
       (regroup, floors, colour) would rearrange a map nobody is looking at and
       say "Nothing changed on the map"; on the board it reads only what lands
       on the board (outliers, the walk, a top N, a narrowing, a comparison —
       each a list), and the rest goes to Copilot with the
       board — or, with no key, to the map's filter reader, whose list the
       board draws */
    let mapListy=false;
    if(igBoardNow()){ try{ const pz=igRecipeParse(q); mapListy=!!(pz&&pz.acts.some(x=>x.top||x.narrow||x.compare||x.linked||x.linkedParty||x.families||x.sort)); }catch(_){ mapListy=false; } }
    const boardUp=!!igBoardNow()&&!IG_WALK_RE.test(q)&&!IG_OUTLIER_RE.test(q)&&!mapListy;
    const mapRest=(igPaperUp()||boardUp)?null:await intelMapLocal(q);
    if(mapRest!=null){ if(mapRest) await intelGraphAsk(mapRest); }
    else if(igPaperUp())                                await igPaperAsk(q);
    else if(idHits>=2)                                  await intelChatAsk(q);
    else if(IG_COMPLIANCE_RE.test(q))                   await intelComplianceScan(q);
    else if(IG_TEMPLATE_RE.test(q))                     await intelTemplateAsk(q);
    else                                                await intelGraphAsk(q);
  }catch(e){
    intel.history.push({role:'assistant', text:'Something went wrong: '+igEsc(e.message), err:true});
  }
  intel.busy=false;
  rebuildIntelGraph(); renderIntelDock();
  /* ASKED ON HOME'S BOARD, ANSWERED ON THE BOARD (4 Oct 2026): a list that
     came back from Copilot or the map is drawn on the board as well. */
  if(state.view==='dashboard' && typeof window.hbShowFound==='function'){
    const m=intel.history.slice(h0).reverse().find(x=>x&&x.role==='assistant'&&Array.isArray(x.listIds)&&x.listIds.length);
    if(m){ try{ hbShowFound(m.listIds, m.listTitle||'', m.listChart||null);
      /* the reply is written from what the board now draws (the honest reply) */
      if(igBoardNow()&&typeof window.hbFoundSay==='function'){ const say=hbFoundSay(); if(say){ m.text=say; renderIntelDock(); } } }catch(_){} }
    /* the Copilot reply that drew or changed the open chart carries its reading too */
    const last=intel.history.slice(h0).reverse().find(x=>x&&x.role==='assistant'&&!x.err);
    if(last&&!last.reading){ const r=rdOf(); if(r.reading){ last.reading=r.reading; renderIntelDock(); } }
    /* …and the Right / Wrong marks (Part 6), on every reply asked on the board */
    if(last&&typeof window.hbBoardReplyMeta==='function'&&hbBoardReplyMeta().boardReply&&!last.boardReply){ last.boardReply=true; renderIntelDock(); }
  }
}

/* ============================================================
   C-1 · THE CARD CARRIES EVERY FACT THE MAP DRAWS (11 Sep 2026)
   ============================================================
   The per-contract card sent to /api/ai/graph used to carry eight fields —
   no signed date, no created date, no decision date — which is why "cluster
   by when they were signed" was excused with "I don't have those dates".
   EVERY VALUE HERE IS BORROWED from the reading the graph already draws
   (A-1's graphNodeFacts, the pay-terms tab's payDays, the family's
   effectiveExpiry, the register's negWhoseMove) — never a second arithmetic,
   and the same card is what `where` is applied to, so what travels and what
   is filtered are one reading. Money obeys canViewValues here, and the
   server strips it again on its own reading (scopeAiPortfolio — THE SERVER
   IS THE WALL). WORDING IS NEVER SENT for a map command: grouping needs
   none, and the full Copilot reads it on demand through get_contract.
   READING MUST NOT WRITE: c.changes and c.obligations are read raw through
   readings that read them raw. */
const GRAPH_ASK_CAP=600;                       // contracts per map command — a cap is a fact, and the answer says it
function graphNextDue(c){
  let best=null;
  (c.obligations||[]).forEach(o=>{ if(!o) return; if((typeof obState==='function'?obState(o):o.status)==='done') return;
    if(typeof obligationBlocked==='function'&&obligationBlocked(o,c)) return;
    const d=(typeof obligationDue==='function')?obligationDue(o):(o.due||null); if(!d) return;
    const s=String(d).slice(0,10); if(!/^\d{4}-\d{2}-\d{2}$/.test(s)) return;
    if(best===null||s<best) best=s; });
  return best;
}
function graphCopilotCard(c){
  const money=(typeof canViewValues!=='function')||canViewValues();
  const f=graphNodeFacts(c);
  const m=(c&&c.metadata&&typeof c.metadata==='object')?c.metadata:{};
  const dec=(typeof renewalDecisionDate==='function')?renewalDecisionDate(c):null;
  const pay=(typeof payDays==='function')?payDays(c):null;
  let move=null; try{ if(typeof negWhoseMove==='function'){ const w=negWhoseMove(c); move=(w&&w.k)||null; } }catch(_){}
  let live=null; try{ if(typeof negoIsLive==='function') live=!!negoIsLive(c); }catch(_){}
  const card={ id:c.id, name:c.name, counterparty:c.counterparty||'', folder:FOLDERS[c.folder]?.name||'', kind:cKind(c), status:c.status||'',
    currency:(typeof contractCurrency==='function')?contractCurrency(c):'',
    expiry:_gExpiryDay(c)||'', signedAt:_gSignedDay(c)||'', createdAt:_gCreatedDay(c)||'',
    decisionDate:dec?String(dec).slice(0,10):'', noticeDays:(m.noticePeriodDays!=null&&m.noticePeriodDays!=='')?Number(m.noticePeriodDays):null, effDate:m.effectiveDate?String(m.effectiveDate).slice(0,10):'',
    payTermsDays:(pay==null||isNaN(pay))?null:Number(pay),
    parentId:c.parentId||'', relation:c.relation||'',
    move, live, overdue:f.overdue, nextDue:graphNextDue(c)||'',
    offStandard:f.offStandard, risk:c.scan?riskScore(c):null, read:(f.unread==null)?null:!f.unread,
    archived:!!c.archived, source:c.source||'' };
  if(money) card.value=Number(c.value||0);
  return card;
}
/* FILTERS ARE FIELDS, NOT ID LISTS (ruling 4): the tool hands back a
   structured `where` and HaTi applies it over its own cards, so a
   159-contract book does not depend on the model copying ids by hand. Every
   condition reads the card the model was sent; a card carrying no value never
   matches a money cut (an absence is stated, not guessed). Returns null where
   nothing in `where` narrows. */
const GRAPH_WHERE_KEYS=['status','folder','kind','counterparty','valueAbove','valueBelow','expiringWithinDays','signedFrom','signedTo','overdueObligations','offStandard','notRead','move','archived'];
function graphWhereIds(where){
  /* THE PREDICATE IS SHARED (js/graphwhere.js, Copilot audit phase 4): the
     chat's list_portfolio applies the same one on the server over its own
     reading of the record. This host reads folder NAMES on its cards, so it
     hands the id lookup in. */
  const w=graphWhereNarrow(where, GRAPH_WHERE_KEYS);
  if(!w) return null;
  const fold=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
  const reads={ daysUntil, folderIdOf:name=>{ const f=fold(name); return String((Object.values(FOLDERS).find(x=>fold(x.name)===f)||{}).id||''); } };
  return (state.contracts||[]).filter(c=>graphWhereHit(graphCopilotCard(c), w, reads)).map(c=>c.id);
}
/* WHAT IS ON SCREEN TRAVELS TOO (ruling 6): the grouping in force, the lenses
   (label, action, count), the crowded quarters, the reader's language and the
   workspace currency. Facts, never sentences — the server clamps each. */
function graphCrowdedQuarters(cs){
  const hubMap={};
  (cs||state.contracts||[]).forEach(c=>{ const g=graphDecisionOf(c).label; (hubMap[g]||(hubMap[g]={label:g,ids:[]})).ids.push(c.id); });
  return [...graphCliffCrowded(Object.values(hubMap))];
}
function graphLensesNow(){
  return intel.lenses.filter(l=>l.on).map(l=>({ label:String(l.label||''), action:l.action||'filter', count:(l.ids||[]).length }));
}
/* ON HOME'S BOARD, THE BOARD IS THE SCREEN (4 Oct 2026): a question asked
   while the Board is up carries what the board shows (hbBoardNow), so
   Copilot answers about the numbers in front of the reader, not the map. */
function igBoardNow(){
  try{ return (state.view==='dashboard' && typeof window.hbFace==='function' && hbFace()==='board' && typeof window.hbBoardNow==='function') ? (hbBoardNow()||'') : ''; }catch(_){ return ''; }
}
function graphAskScreen(){
  return { groupBy:intel.groupBy, custom:!!intel.groups, lenses:graphLensesNow(), crowded:graphCrowdedQuarters(),
    lang:(typeof langPromptName==='function')?langPromptName():'', currency:(typeof jxCurrency==='function')?jxCurrency():'',
    board:igBoardNow(), guide:igBoardGuide() };
}
/* THE DATA GUIDE RIDES BESIDE THE BOARD (work order Part 3): what each field
   holds, so Copilot picks fields that work; on the board only */
function igBoardGuide(){
  try{ return (igBoardNow() && typeof window.hbDataGuide==='function') ? (hbDataGuide(hbS().lens)||'') : ''; }catch(_){ return ''; }
}
async function intelGraphAsk(q){
  const act=intelActive();
  let res=null, capped=null, payload=null;
  if(API_MODE() && state.aiConfigured){
    try{
      const all=state.contracts||[];
      const cards=all.slice(0,GRAPH_ASK_CAP).map(graphCopilotCard);
      if(all.length>cards.length) capped={ sent:cards.length, total:all.length };
      payload={ query:q, contracts:cards, sent:cards.length, total:all.length,
        history: intel.history.slice(-9,-1).filter(m=>m.text).map(m=>({role:m.role,text:m.text})),
        activeIds: act.ids?[...act.ids]:null,
        screen: graphAskScreen() };
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
  /* COPILOT DECIDED IT IS ABOUT WORDING: the reading chat answers it, and
     the map is left exactly as it was. */
  if(res&&res.kind==='wording'){ await intelChatAsk(q); return; }
  /* ASKED ON THE BOARD, COPILOT PRESSES THE BOARD'S BUTTONS (4 Oct 2026): a
     chart-only answer changes the open chart (or draws a new one) and the map
     is left exactly as it was */
  /* CHECK AND REPAIR (work order Part 4): Copilot's cards are checked before
     they are applied; what fails goes back ONCE, at the cost of one more
     call, and the panel says so */
  if(res&&igBoardNow()&&typeof window.hbBoardTakes==='function'){
    const retry=payload?(note=>api('ai/graph','POST',Object.assign({},payload,{ query:q+'\n\n'+note, screen:graphAskScreen() }))):null;
    let said=null; try{ said=(typeof window.hbBoardTakesChecked==='function')?await hbBoardTakesChecked(res,retry,q):hbBoardTakes(res,q); }catch(_){ said=null; }
    /* DIG DEEPER (Charts That Explain, rec 4): under Copilot's board answer,
       the press that hands the question to the analyst, its cost beside it */
    if(said){ intel.history.push(Object.assign({ role:'assistant', text:said+igNoticeHtml(res.notice), deeper:q }, typeof window.hbTakeMeta==='function'?hbTakeMeta():{})); return; }
  }
  if(!res){ res=graphInterpret(q);           // fallback
    /* The built-in reader understood nothing: say what the map can do, as
       presses, rather than leave a sentence and nothing to act on. */
    if(!res.groupBy&&!res.visibleIds) res.ask=[{ role:'group', fact:'counterparty' },{ role:'floors', fact:'payterms' },{ role:'colour', fact:'risk' }]; }
  igRecipePush();
  intelGraphApply(q, res, { capped });
}
/* ============================================================
   C-1 · THE ANSWER IS WRITTEN FROM WHAT THE MAP DID (ruling 5)
   ============================================================
   Nothing the model returns is taken on trust. A grouping must be a key on
   GRAPH_GROUPINGS, or `custom` with a map that places at least one contract
   under at least two labels; anything else is first read by the product's
   own cue table (the query "cluster by expiration date" names a dimension
   the map can cut whatever the model answered) and, where that names nothing
   either, REFUSED IN WORDS with the map left exactly as it was — no caption
   flip, no lens. The chat line is composed off the model buildGraphModel
   builds, so it cannot say "clustered by expiration date" over hubs that
   are value streams; Copilot's own sentence rides as a second line only
   where it says something the numbers do not. Returns what it did. */
/* ON THE BOARD A SET COPILOT CHOSE IS NAMED BY HATI (the honest reply, 5 Oct
   2026): the asked-for name, HaTi's top-N label, the open card's, or the
   person's own words — never the model's note ("· as graph") */
function igBoardTitle(q,res){
  if(!igBoardNow()||typeof window.hbFoundTitle!=='function') return null;
  try{ return hbFoundTitle(q,res&&res._top); }catch(_){ return null; }
}
function graphSaysMore(own, note, line){
  const s=String(own||'').replace(/\s+/g,' ').trim(); if(!s) return false;
  const fold=x=>String(x||'').replace(/\s+/g,' ').trim().toLowerCase().replace(/[.!]+$/,'');
  if(fold(s)===fold(note)||fold(s)===fold(line)) return false;
  if(/^(regrouped|done|grouped|clustered|showing|highlighted)\b/i.test(s)) return false;
  return /\b(?:MK|RL)-\d+/i.test(s) || s.split(/\s+/).length>=6;
}
function intelGraphApply(q, res, opts){
  res=res||{}; opts=opts||{};
  const total=igBookTotal();
  const known=new Set((state.contracts||[]).map(c=>c.id));
  let groupBy=res.groupBy?String(res.groupBy):null, groups=null, refused=false;
  if(groupBy==='custom'){
    const raw=(res.groups&&typeof res.groups==='object')?res.groups:{};
    const clean={}; Object.keys(raw).forEach(id=>{ const l=String(raw[id]==null?'':raw[id]).replace(/\s+/g,' ').trim(); if(known.has(id)&&l) clean[id]=l.slice(0,60); });
    const labels=new Set(Object.values(clean));
    if(Object.keys(clean).length&&labels.size>=2) groups=clean;
    else groupBy=null;
  } else if(groupBy && !GRAPH_GROUP_KEYS.includes(groupBy)) groupBy=null;
  if(res.groupBy && !groupBy){
    /* The model named a grouping the map cannot draw. The product reads the
       command itself before giving up. */
    const cue=graphGroupCue(q);
    if(cue) groupBy=cue; else refused=true;
  }
  /* Filters: the field filter wins, an id list is intersected with it. */
  let whereIds=null; try{ whereIds=graphWhereIds(res.where); }catch(_){ whereIds=null; }
  let ids=Array.isArray(res.visibleIds)?res.visibleIds.filter(id=>known.has(id)):null;
  if(whereIds){ ids=ids&&ids.length?whereIds.filter(id=>ids.includes(id)):whereIds; }
  if(refused){
    intel.history.push({ role:'assistant', text:igEsc(i18t('int_group_refused',{ list:GRAPH_GROUPINGS.map(g=>g.label.toLowerCase()).join(', ') })), cardIds:[],
      choices:['folder','counterparty','status'].map(k=>({ label:igRoleSays('group',k).replace(/\.$/,''), acts:[{ role:'group', fact:k }] })) });
    return { refused:true, groupBy:null, ids:null };
  }
  if(groupBy){ intel.groupBy=groupBy; intel.groups=groups; igPaintGroupSelect(); }
  /* the LOOK first, in HaTi's words; a look that names the names or the dots
     is not also a label or a size setting */
  const lookActs=igLookActs(res.look);
  const lookDid=lookActs.length?igRecipeRun({ acts:lookActs },{ noPush:true, report:true }):null;
  const lookNames=lookActs.some(a=>'names' in a||'edgeNames' in a), lookDots=lookActs.some(a=>a.dots||a.small);
  /* THE REST OF THE RECIPE, each role judged like the grouping: a fact the
     map knows, or nothing. The sentence is composed from what was set. */
  const roleSaid=[];
  [['floors','floorsBy'],['columns','columnsBy'],['colour','colourBy'],['size','sizeBy'],['label','labelBy'],['time','timeBy']].forEach(([role,k])=>{
    if((role==='label'&&lookNames)||(role==='size'&&lookDots)) return;
    const v=res[k]; if(typeof v==='string'&&v&&igRoleSet(role,v)) roleSaid.push(igRoleSays(role,v)); });
  const vw=typeof res.view==='string'?IGB_VIEWS.indexOf(res.view):(Number.isInteger(res.view)?res.view:-1);
  if(vw>=0&&vw<IGB_VIEWS.length) igSetView(vw);
  else if(res.floorsBy&&intel.floorsBy===res.floorsBy) igSetView(res.columnsBy?3:2);
  else if(res.columnsBy&&intel.columnsBy===res.columnsBy) igSetView(3);
  if(res.top&&typeof res.top==='object'&&Number(res.top.n)>0){
    const by=IG_TOP_BY[res.top.by]?res.top.by:'value', per=GRAPH_GROUP_KEYS.includes(res.top.per)?res.top.per:null, n=Math.min(200,Math.round(Number(res.top.n))), dir=res.top.dir==='up'?'up':'down';
    const tIds=igTopIds(n,by,per,null,dir); ids=ids&&ids.length?tIds.filter(id=>ids.includes(id)):tIds;
    res._top=i18t(dir==='up'?'int_bottom_label':'int_top_label',{ n, x:igSortWord(by) })+(per?' · '+i18t('int_top_per',{ x:graphGroupingWord(per) }):'');
    res.note=res.note||res._top; intel.sortBy=by; }
  const choices=Array.isArray(res.ask)?res.ask.slice(0,3).filter(o=>o&&IG_RECIPE_ROLES.includes(o.role)&&(o.role==='size'?IGB_SIZE_KEYS.includes(o.fact):o.role==='time'?IG_TIME_KEYS.includes(o.fact):GRAPH_GROUP_KEYS.includes(o.fact)))
    .map(o=>({ label:igRoleSays(o.role,o.fact).replace(/\.$/,''), acts:[{ role:o.role, fact:o.fact }].concat(o.role==='floors'?[{ view:2 }]:o.role==='columns'?[{ view:3 }]:[]) })):null;
  const action=res.action==='highlight'?'highlight':'filter';
  /* a request about the look narrows nothing unless its words narrow */
  if(lookActs.length&&ids&&!/\b(?:only|just|which|what|show me|among|bara|endast|vilka|vilket)\b/i.test(q)) ids=null;
  if(ids&&ids.length)
    addLens({ label:igBoardTitle(q,res)||res.note||ids.length+' matches', ids, action, badges:res.badges||null });
  /* Composed off the built model — counts, never a sentence the model wrote. */
  const parts=[];
  if(groupBy){
    const model=buildGraphModel();
    const hubs=model.nodes.filter(n=>n.kind==='hub');
    parts.push(i18t('int_did_grouped',{ n:model.shown, m:hubs.length, by:graphGroupingWord(groupBy) }));
    const g=graphGroupingOf(groupBy);
    if(g&&g.none){ const k=model.nodes.filter(n=>n.kind==='contract'&&n.group===g.none).length; if(k) parts.push(i18t('int_did_in',{ n:k, label:g.none })); }
  }
  if(ids&&ids.length) parts.push(i18t(action==='highlight'?'int_did_highlighted':'int_did_showing',{ n:ids.length, t:total })+(res.note?' · '+String(res.note):''));
  else if(ids&&!ids.length&&!groupBy) parts.push(i18t('int_did_nomatch'));
  if(opts.capped&&opts.capped.total>opts.capped.sent) parts.push(i18t('int_did_capped',{ n:opts.capped.sent, t:opts.capped.total }));
  roleSaid.forEach(x=>parts.push(x.replace(/\.$/,'')));
  let line=parts.map(igEsc).join(' · ');
  /* THE COUNT IS HATI'S, NEVER THE MODEL'S (the owner's screenshot, 3 Oct
     2026: the board showed 35 and the sentence said "16 contracts"): a
     sentence that states a different number of contracts is not printed. */
  let own0=String(res.answer||'').trim();
  /* asked on the Board: a sentence stating a number of contracts the board
     does not show is left out, as the board's own ask does (hbWhyCheck) */
  const onBoard=igBoardNow();
  /* …and one naming a picture or a split the open chart does not draw
     (the disconnect check, hbProseChecked) */
  if(onBoard&&own0&&!(ids&&ids.length)&&typeof window.hbProseChecked==='function') own0=hbProseChecked(own0).text;
  const saidN=own0.match(/\b(\d[\d,.\s]*)\s+(?:matching\s+|live\s+|such\s+)?(?:contracts?|agreements?|avtal)\b/i);
  const ownN=(saidN&&ids&&Number(String(saidN[1]).replace(/[^\d]/g,''))!==ids.length)?'':own0;
  /* ---- COPILOT'S OWN SENTENCE IS FORMATTED, NOT PRINTED RAW (Young, 28 Sep
     2026: Explorer's answers showed "**" round bold words and ran a list into
     one line, where the side panel drew the same answer properly) ----
     The model writes markdown; this line escaped it as plain text. It now goes
     through aiRichText — the side panel's own renderer, which escapes before
     it formats — and the dock carries the side panel's answer styles. The
     counts composed above stay plain words, as before. */
  const rich=typeof aiRichText==='function';
  /* THE MAP SAYS WHAT IT DID, AND NOTHING IT DID NOT (Young, 4 Oct 2026):
     where nothing here changed the map, a sentence claiming it did is not
     printed — the reader is told the map is as it was. */
  const didHere=!!(groupBy||(ids&&ids.length)||roleSaid.length||vw>=0||(choices&&choices.length)||(lookDid&&lookDid.changed));
  const own=(!didHere||lookDid)&&IG_CLAIM_RE.test(ownN)?'':ownN;
  const ownHtml=own?(rich?aiRichText(own):igEsc(own)):'';
  if(!line&&lookDid){ if(!ownHtml||!graphSaysMore(own,res.note,'')) return { refused:false, groupBy, ids, look:true }; line=ownHtml; }
  /* asked on the Board, the map is not the screen: "Nothing changed on the
     map" is not said over an answer about the board */
  else if(!line) line=didHere?(ownHtml||igEsc(res.note||'Done.')):(ownHtml&&onBoard?ownHtml:igEsc(i18t('int_did_nothing'))+(ownHtml?(rich?'':'<br>')+ownHtml:''));
  else if(graphSaysMore(own,res.note,parts[0])) line+=(rich?'':'<br>')+ownHtml;
  intel.history.push({ role:'assistant', text:line, cardIds:(ids||[]).slice(0,5), listIds:(ids&&ids.length)?ids.slice():null, listTitle:igBoardTitle(q,res)||(res.note?String(res.note):null), listHonest:!!igBoardTitle(q,res), listChart:(res&&res.chart&&typeof res.chart==='object')?res.chart:null, choices:choices&&choices.length?choices:null });
  return { refused:false, groupBy, ids };
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
      applyTemplateResult(res.ranked, igFmtRich(res.answer||'').html); return;
    }catch(e){
      intel.history.push({role:'assistant', err:true,
        text:(/key|configure|401|model/i.test(e.message)?'The Copilot engine needs an API key for template analysis — here is a metadata-only ranking instead.':'Copilot template analysis failed ('+igEsc(e.message)+') — here is a metadata-only ranking instead.')});
    }
  }
  // fallback: deterministic metadata ranking, honest about its limits
  const ranked=shortlist.slice(0,3).map(c=>({ id:c.id,
    reason:[c.status==='Signed'?'executed — battle-tested terms':'closest match on type', cKind(c), c.counterparty?('with '+c.counterparty):null].filter(Boolean).join(' · ') }));
  const top=getContract(ranked[0].id);
  applyTemplateResult(ranked, `Closest template match on metadata: <b>${igEsc(top?.name||'—')}</b>.${(API_MODE()&&!state.aiConfigured)||!API_MODE()?' Configure the Copilot engine for a clause-level comparison.':''}`);
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

/* ---- THE SERVER'S NOTICE IS A LINE UNDER THE ANSWER, NEVER A POP-UP ----
   (owner-asked 11 Sep 2026: "remove such pops in this page", off a red toast
   reading "One quoted excerpt could not be matched to the contract text…").
   api() surfaces every Copilot notice as a toast for all its callers; this
   page has printed the same sentence in amber under the answer since the dock
   was built, so the toast was the one fact said twice, and the louder printing
   was the one that read as an alarm. IG_QUIET is passed on EVERY Copilot call
   this page makes, and igNoticeHtml is the ONE line they print instead — a
   caller that goes quiet and prints nothing has turned a fact into a silent
   trim, which this rulebook forbids by name. The main Copilot panel is
   untouched: it was not in the ask. */
const IG_QUIET={quiet:true};
function igNoticeHtml(notice){
  return notice?`<div class="text-[11px] text-amber-700 mt-2">${igEsc(notice)}</div>`:'';
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
  intel.history.push({ role:'assistant', text:rich.html+igNoticeHtml(res.notice), compare:res.compare||null, cardIds, blocks:rich.blocks });
  if(cardIds.length) igPaintIds(cardIds);
}

// General Copilot Q&A in the Intel dock (used for compare + typed questions).
// With no Copilot key, comparisons still work via the deterministic local table;
// other free-form questions get a clear nudge instead of silence.
async function intelChatAsk(q){
  const ids=(String(q).match(/(?:MK|RL)-\d+/gi)||[]).map(s=>s.toUpperCase())
    .map(r=>{ const x=(state.contracts||[]).find(y=>y.id===r||y.contractNo===r); return x?x.id:r; }).filter((v,i,a)=>a.indexOf(v)===i);
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
    const msgs=intelChatMessages();
    const board=igBoardNow();
    if(board&&msgs.length&&msgs[msgs.length-1].role==='user')
      msgs[msgs.length-1]={ role:'user', content:'[The reader is on the Home board. What the board shows now:\n'+board+'\nAnswer from these numbers when the question is about the board.]\n\n'+msgs[msgs.length-1].content };
    const res=await copilotAsk(msgs, { view:'intel' }, null, IG_QUIET);
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
    return `<span style="display:inline-flex;align-items:center;font-size:var(--t-figure);font-weight:var(--w-title);letter-spacing:.04em;text-transform:uppercase;padding:1px 7px;border-radius:var(--radius);background:${col[0]};color:${col[1]}">${igEsc(lbl)}</span>`; };
  const top=rows.slice(0,8);
  const totalFindings=rows.reduce((n,r)=>n+r.findings.length,0);
  let html=`<b>${i18t('int_compliance_review')}</b> ${rows.length} of ${cs.length} live contracts carry clauses worth a closer look — ${totalFindings} potential issue${totalFindings===1?'':'s'} in all (risks, missing protections or ambiguous terms), ranked by severity. This is a first-pass review to raise with counsel, not legal advice.`;
  html+=top.map(r=>{
    const items=r.findings.slice(0,3).map(f=>`<li style="margin:2px 0"><b>${igEsc(f.title)}</b>${f.why?` — ${igEsc(f.why)}`:''}</li>`).join('');
    const more=r.findings.length>3?`<div style="font-size:var(--t-label);color:var(--color-neutral-500);margin-top:1px">+${r.findings.length-3} more</div>`:'';
    return `<div style="margin-top:10px;padding-top:9px;border-top:1px solid color-mix(in srgb,var(--color-text) 9%,transparent)">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;flex-wrap:wrap">
        <button data-ig-ws="${r.c.id}" data-ig-hoverid="${r.c.id}" title="Open ${igEsc(r.c.name)}" style="font-size:var(--t-body);font-weight:var(--w-strong);color:var(--accent-ink);background:none;border:0;padding:0;cursor:pointer;text-align:left">${igEsc(r.c.name)}</button>
        ${sevPill(r.worst)}
        <span style="font-size:var(--t-label);color:var(--color-neutral-500);font-family:var(--font-mono)">${igEsc(window.contractRef?contractRef(r.c):r.c.id)}</span>
      </div>
      <ul style="margin:0;padding-left:var(--s-4);font-size:var(--t-meta);color:var(--color-neutral-700);line-height:1.45">${items}</ul>${more}
    </div>`;
  }).join('');
  if(rows.length>top.length) html+=`<div style="font-size:var(--t-label);color:var(--color-neutral-600);margin-top:9px">…and ${rows.length-top.length} more flagged contract${rows.length-top.length===1?'':'s'}. Ask me about any one by name or id for the detail, or open it and run <b>${i18t('int_copilot_review')}</b>.</div>`;

  intel.history.push({role:'assistant', text:html});
  igPaintIds(top.map(r=>r.c.id));
}

// Node click → an instant facts card PLUS an async Copilot insight beneath it.
function intelAIExplain(id){
  const c=getContract(id); if(!c) return;
  if(!(typeof copilotAvailable==='function' && copilotAvailable())) return;   // facts card already shown by igExplain
  intel.busy=true; renderIntelDock();
  copilotAsk(
    [{role:'user', content:`Give a brief, risk-focused briefing on contract ${c.contractNo||id}${c.contractNo?' (worked as '+id+')':''} (${c.name}) — what it is, its status and value, and the most important thing to watch. 3 sentences max.`}],
    { view:'intel', activeContractId:id, activeContractName:c.name, ...(c.contractNo?{activeContractNo:c.contractNo}:{}) }, null, IG_QUIET,
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
  const names=ids.map(id=>getContract(id)?.name||(window.contractRef?contractRef(getContract(id)||{id}):id));
  intel.history.push({role:'user', text:'Compare '+names.join(', ')});
  intel.compareSel=[]; intel.busy=true; renderIntelDock();
  const localFallback=(prefix)=>{
    const cmp=(typeof localCompareData==='function')?localCompareData(ids):null;
    if(cmp) intel.history.push({role:'assistant', text:(prefix||'Side-by-side from your live contract data.')+(cmp.verdict?' '+igEsc(cmp.verdict):''), compare:cmp, cardIds:ids});
    else intel.history.push({role:'assistant', err:true, text:'Could not build the comparison.'});
  };
  try{
    if(typeof copilotAvailable==='function' && copilotAvailable()){
      const res=await copilotAsk([{role:'user', content:'Compare these contracts side by side: '+ids.map(id=>{ const x=getContract(id); return x&&x.contractNo?x.contractNo+' (worked as '+id+')':id; }).join(', ')+'. Cover value, term/expiry, payment terms, key risks and open findings.'}], { view:'intel' }, null, IG_QUIET);
      intelPushChatResult(res);
    } else {
      localFallback(`Side-by-side from your live contract data. <span class="text-[11px] text-amber-700">${i18t('int_add_key')}</span>`);
    }
  }catch(e){ localFallback('The Copilot engine was unavailable ('+igEsc(e.message||'error')+'), so here is a side-by-side from your live data instead.'); }
  intel.busy=false; rebuildIntelGraph(); renderIntelDock(); igPaintIds(ids);
}

/* ---- build the node/edge model from current state + lenses/group ---- */
function buildGraphModel(){
  _gPartyNames=null;   /* the spelling a group prints is re-read with the book, never kept across an edit */
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
  const crowded=(groupBy==='decision'&&!override)?graphCliffCrowded(hubs):new Set();
  const moneyOk=(typeof canViewValues!=='function')||canViewValues();
  const flow=(groupBy==='folder'&&!override&&moneyOk)?graphStreamFlow(cs):null;
  /* A-5: the value each hub→contract link carries, for its width. Only where
     money may be seen; a viewer's links are all one width. */
  let vmax=0; const linkV={};
  if(moneyOk) cs.forEach(c=>{ if(typeof isMonetary==='function'&&!isMonetary(c)) return; if(!(Number(c.value||0)>0)) return; const h=(typeof fxHome==='function')?fxHome(c):{v:Number(c.value||0),missing:false}; if(h.missing) return; linkV[c.id]=h.v; vmax=Math.max(vmax,h.v); });
  const nodes=[], edges=[];
  hubs.forEach((h,i)=>{
    const node={id:'hub:'+h.label, kind:'hub', label:h.label, sub:h.ids.length+' contract'+(h.ids.length===1?'':'s')};
    /* A-3: under the counterparty grouping the hub is the party and carries
       its four lines and its share of the book. The stats are read once here
       so the renderer prints them and computes nothing. */
    if(groupBy==='counterparty'&&!override){ const p=graphPartyStats(h.label); if(p.found){ node.party=p; node.lines=graphPartyLines(p); node.sub=null; } }
    /* A-5: a value-stream hub carries money in, out and net, on paper. */
    if(groupBy==='folder'&&!override&&flow){ const S=Object.values(flow).find(x=>(FOLDERS[x.folder]?.name||'Other')===h.label); if(S){ const L=graphStreamLines(S); if(L.length){ node.flow=S; node.lines=L; } } }
    /* A-4: a quarter hub knows its place in time and whether it is crowded. */
    if(groupBy==='decision'&&!override){ node.order=graphDecisionOrder(h.label); node.crowded=crowded.has(h.label);
      if(node.crowded) node.sub+=' · '+i18t('int_cliff_crowded'); }
    nodes.push(node); });
  cs.forEach(c=>{ const g=groupLabelOf(c,groupBy,override);
    nodes.push({id:c.id, kind:'contract', c, label:c.name, sub:(window.contractRef?contractRef(c):c.id)+(isMonetary(c)&&c.value?' · '+(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):''), group:g, dot:STATUS_DOT[c.status]||'var(--st-gray-dot)',
      hit: highlight&&act.ids.has(c.id), mut: highlight&&!act.ids.has(c.id), badge: act.badges?.[c.id]||null});
    edges.push({from:'hub:'+g, to:c.id, kind:groupBy==='counterparty'?'party':'group', w:graphLinkWidth(linkV[c.id],vmax)});   // hub -> contract: arrows fan outward; width is value
  });
  /* THE RECORD'S OWN LINKS, on top of the grouping. A party edge is already
     the hub→contract line when the graph is grouped by counterparty (tagged
     above), and is dropped under any other grouping: a party link is drawn
     through a hub or not at all. Family and chain edges join only where both
     ends are on the page. */
  const onPage=new Set(cs.map(c=>c.id));
  const kinds=new Set(edges.filter(e=>e.kind==='party').length?['party']:[]);
  buildGraphEdges(cs).forEach(e=>{ if(e.kind==='party') return; if(!onPage.has(e.from)||!onPage.has(e.to)) return;
    kinds.add(e.kind); edges.push({from:e.from, to:e.to, kind:e.kind, label:e.label}); });
  return { nodes, edges, capped, shown:cs.length, total:cs.length, edgeKinds:GRAPH_EDGE_KINDS.filter(k=>kinds.has(k)), linear:groupBy==='decision'&&!override, flow };
}

/* ════════════════════════════════════════════════════════════════════════
   EXPLORER — THE BRAIN DRAWING (owner-approved design, 28 Sep 2026)
   ════════════════════════════════════════════════════════════════════════
   The map keeps every reading it had — buildGraphModel's groups, contracts
   and links, the lenses, Copilot's groupings — and changes only how they are
   DRAWN and MOVED. Three views that glide into each other: BRAIN (the book as
   a brain, each group a lobe), WIRING (the force layout the map always had,
   laid flat) and FLOORS (one floor per stage, one column per group). Dragging
   turns whichever view is showing, the wheel zooms, a double-click faces it
   again. A group is a card carrying its money on paper; pressing the card
   folds its contracts into it. THERE ARE NO FILTER DOORS ON THE MAP: Copilot
   is the one way to narrow it (the owner, 28 Sep 2026).
   The canvas under the SVG paints what carries no words (the brain's tissue,
   the glow, the dots); the SVG on top keeps every node a real element with
   its classes and marks, so hover, press, the lenses and the cliff work as
   they always did. Story: docs/MAP-HISTORY.md, "EXPLORER — THE BRAIN DRAWING". */
const SVG_NS='http://www.w3.org/2000/svg';
const IGB_VIEWS=['brain','wiring','floors','grid','timeline'];
const IGB_VIEW_WORD={brain:'int_view_brain',wiring:'int_view_wiring',floors:'int_view_floors',grid:'int_view_grid',timeline:'int_view_timeline'};
/* a twist of this many radians turns the view as far as one pixel of drag */
const IGB_TWIST=.006;
const IGB_PITCH_MAX=.16, IGB_TL_DX=.035, IGB_TL_RING=9, IGB_TL_ZS=1.8;
/* the spots around a date, nearest first: the timeline's crowd packing */
const IGB_TL_SPOTS=(()=>{ const s=[]; for(let i=-IGB_TL_RING+1;i<IGB_TL_RING;i++) for(let j=-IGB_TL_RING+1;j<IGB_TL_RING;j++) s.push([i,j]); return s.sort((a,b)=>Math.hypot(a[0],a[1])-Math.hypot(b[0],b[1])||Math.abs(a[1])-Math.abs(b[1])); })();
const IGB_TILT=[.2,.02,.36,.95,.9], IGB_SCALE=[1.3,1.05,.74,1,1], IGB_CY=[.52,.5,.47,.5,.5];
const IGB_NV=5;   // the views; every weight list carries one per view
const igbDot=(w,a)=>a.reduce((s,v,i)=>s+v*w[i],0);
const IGB_RX=.78, IGB_RY=.64, IGB_RZ=1.08, IGB_GOLD=2.39996;
const IGB_TISSUE_N=2400;
const IGB_FLOOR_Y=[.78,.26,-.26,-.78];
const IGB_FLOOR_STATUS=['Draft','Under Review','Signed','Declined'];
/* LITERAL COLOURS: the canvas reads no tokens, and the words over a dot must
   wear the dot's own colour. The stage is one dark scene, like the Brain page. */
const IGB_STATUS_COL={'Draft':'#A9C2BD','Under Review':'#F2B24C','Signed':'#62D291','Declined':'#F0726A'};
const IGB_PALETTE=['#AC9CFA','#E0CB8F','#38CDB8','#86B8EA','#F09274','#A7E8D8','#9FB9C9','#E6A09A','#CFE3A0','#C9A0DC','#7FD1E8','#E8C07F'];
const IGB_IDLE='#2F6C63', IGB_WALK='#F2B24C', IGB_OTHER='#9FB9C9';
const IGB_FACT_TONE={amber:'#F2B24C',ruby:'#F0726A',ink:'#E6F2EF',mute:'#8FB5AD'};
/* A group this small starts folded, where the map has more groups than
   IGB_FOLD_MANY — the design's own rule, so a long tail of one-contract groups
   does not bury the big ones. Folds are per sitting, in memory. */
const IGB_FOLD_SMALL=3, IGB_FOLD_MANY=4;
const IGB_ZOOM_MIN=.6, IGB_ZOOM_MAX=3.5, IGB_ZOOM_STEP=1.15;
const IGB_TURN_RATE=.08;                       // radians a second, the brain's own slow turn
const IGB_SPIN_KEY=['rot',null,'rotL',null,null];   // which angle each view turns by itself (Wiring drifts; Grid and Timeline sway)
/* THE FLAT VIEWS MOVE TOO (Young, 28 Sep 2026: "Floor should be spinning just
   like brain and the others should be moving"). Brain and Floors turn all the
   way round at the brain's own rate. GRID AND TIMELINE SWAY (Young, 4 Oct
   2026, reversing 29 Sep's "spin fully": "the tables should not spin round,
   they should just slowly swing down to the left and not far at all and down
   to the right as well") — IGB_SWAY each way, once every IGB_SWAY_S, round
   whatever angle the reader set. Display-only (`cam.sway`, added in the
   projection), held while the reader holds or points at the map, and held
   where it is when Still is pressed. A drag still turns them as far as the
   hand takes them. */
const IGB_SWAY=.12, IGB_SWAY_S=36;
const IGB_STEP_S=2.4, IGB_PULSE_S=.9;          // a walk-through: one contract every 2.4 s
const IGB_LABEL_W=150;
const IGB_SIZE_KEYS=['value','obligations','same'];
const IGB_SIZE_WORD={value:'int_size_value',obligations:'int_size_obligations',same:'int_size_same'};
/* THE SLOTS: where each group sits in the brain. The first nine are the
   design's own lobes (the sixth is the cerebellum); a book with more groups
   takes further directions off a golden spiral, so no group is merged away. */
const IGB_SLOTS=[ {dir:[0,.2,-1]}, {dir:[0,.25,1]}, {dir:[1,-.3,.25]}, {dir:[0,1,-.05]}, {dir:[-1,-.3,.25]},
  {cereb:true}, {dir:[.72,.72,-.35]}, {dir:[-.72,.72,-.35]}, {dir:[.55,.62,.6]} ];
function igbSlot(i){
  if(i<IGB_SLOTS.length) return IGB_SLOTS[i];
  const k=i-IGB_SLOTS.length, y=.9-((k*.618)%1)*1.2, r=Math.sqrt(Math.max(0,1-y*y)), a=k*IGB_GOLD+.7;
  return {dir:[Math.cos(a)*r, y, Math.sin(a)*r]};
}
const igbNorm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; };
function igbCortex(d,f){
  d=igbNorm(d);
  const k=1/Math.sqrt((d[0]/IGB_RX)**2+(d[1]/IGB_RY)**2+(d[2]/IGB_RZ)**2);
  const fold=1+.045*Math.sin(9*d[0]+4*d[2])*Math.cos(7*d[1]+2*d[0]);
  const p=[d[0]*k*f*fold, d[1]*k*f*fold, d[2]*k*f*fold];
  if(p[1]<-.28) p[1]=-.28+(p[1]+.28)*.45;
  if(Math.abs(p[0])<.06&&p[1]>.2) p[1]*=.93;
  return p;
}
function igbBasis(d){ const a=Math.abs(d[1])<.9?[0,1,0]:[1,0,0];
  const u=igbNorm([d[1]*a[2]-d[2]*a[1], d[2]*a[0]-d[0]*a[2], d[0]*a[1]-d[1]*a[0]]);
  return [u, [d[1]*u[2]-d[2]*u[1], d[2]*u[0]-d[0]*u[2], d[0]*u[1]-d[1]*u[0]]]; }
function igbRand(seed){ let s=seed||11; const rnd=()=>(s=(s*16807)%2147483647)/2147483647; return { rnd, gauss:()=>(rnd()+rnd()+rnd()-1.5)/1.5 }; }
function igbHash(str){ let h=0; const s=String(str); for(let k=0;k<s.length;k++) h=(h*31+s.charCodeAt(k))>>>0; return h; }
/* asked for every dot on every frame: the colour is parsed once per hex */
const _igbRgb=new Map();
function igbHexA(h,a){ let p=_igbRgb.get(h); if(!p){ const n=parseInt(String(h).slice(1),16); p='rgba('+(n>>16)+','+((n>>8)&255)+','+(n&255)+','; _igbRgb.set(h,p); } return p+Math.max(0,Math.min(1,a))+')'; }
const igbClamp01=x=>Math.max(0,Math.min(1,x));
const igbStatusWord=st=>(typeof statusLabel==='function')?statusLabel(st):st;
function igbTrim(s,n){ s=String(s==null?'':s); return s.length>n?s.slice(0,n-1)+'…':s; }
function igbEl(tag,attrs,parent){ const e=document.createElementNS(SVG_NS,tag); if(attrs) for(const k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; }
function igbFloorOf(status){ const i=IGB_FLOOR_STATUS.indexOf(status); if(i>=0) return i; return /expir|terminat|cancel|closed|declin/i.test(String(status||''))?3:1; }
function igbReduced(){ try{ return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(_){ return false; } }
/* THE CAMERA IS THE SITTING'S, in memory: a regroup or a new answer keeps the
   view the reader chose and the way they turned it. Nothing stores it. */
function igbCam(){
  if(!intel.cam||!Array.isArray(intel.cam.w)||intel.cam.w.length!==IGB_NV) intel.cam={ view:0, w:[1,0,0,0,0], spin:!igbReduced(), rot:-1.4, tiltOff:0, rotW:0, tiltW:0, rotL:0, tiltL:0, rotG:0, tiltG:0, rotT:0, tiltT:0, zoom:1 };
  return intel.cam;
}
/* The brain's tissue: faint dots that make its shape and are never
   contracts. Seeded, so the brain is the same brain every time. */
let _igbTissue=null;
function igbTissue(){
  if(_igbTissue) return _igbTissue;
  const { rnd, gauss }=igbRand(11), out=[];
  for(let i=0;i<IGB_TISSUE_N;i++){
    const u=rnd(); let A, kind='cortex';
    if(u<.74) A=igbCortex([gauss(),gauss(),gauss()], .86+rnd()*.16);
    else if(u<.86){ const d=igbNorm([gauss(),gauss()*.8-.3,gauss()-.4]), f=.8+rnd()*.25; A=[d[0]*.46*f,-.46+d[1]*.22*f,-.72+d[2]*.3*f]; kind='cereb'; }
    else if(u<.91){ const t=rnd(); A=[gauss()*.06,-.4-t*.62,-.34-t*.12]; kind='stem'; }
    else A=igbCortex([gauss(),gauss(),gauss()], .35+rnd()*.45);
    out.push({ A, kind, wa:rnd(), wb:rnd(), wt:rnd(), jx:gauss()*.03, jy:gauss()*.03,
      L:[-1.62+rnd()*3.24, IGB_FLOOR_Y[Math.floor(rnd()*4)], -.5+rnd()], s:rnd(), ph:rnd()*6.283, sp:.4+rnd()*1.4 });
  }
  return (_igbTissue=out);
}
/* Money printed beside a dot: the contract's own currency, and only where
   money may be seen. An empty string is "print nothing", never a zero. */
function igbMoneyOf(c){
  if(!c||(typeof canViewValues==='function'&&!canViewValues())) return '';
  if(typeof isMonetary==='function'&&!isMonetary(c)) return '';
  if(!(Number(c.value||0)>0)) return '';
  return (typeof fmtMoneyShortOf==='function')?fmtMoneyShortOf(c):fmtMoneyShort(c.value);
}
/* PLACING THE BOOK. Groups biggest first, so the design's lobes go to the
   groups with most in them; each contract on its lobe by a golden spiral; each
   on its stage's floor in its group's column. A graph built over an old one
   starts every node where it was, so a regroup GLIDES instead of jumping. */
function igbLayout(G){
  const hubs=G.nodes.filter(n=>n.kind==='hub');
  const kidsOf=h=>[...(G.adj[h.id]||[])].map(id=>G.byId[id]).filter(n=>n&&n.kind==='contract');
  hubs.forEach(h=>{ h.kids=kidsOf(h); });
  const order=hubs.slice().sort((a,b)=>(b.kids.length-a.kids.length)||String(a.label).localeCompare(String(b.label)));
  const folds=intel.folds||(intel.folds={});
  /* "fold everything" asked before the groups existed (a regroup in the same
     sentence) is applied to the groups as built */
  if(intel.foldWant){ const all=intel.foldWant==='all'; hubs.forEach(h=>{ folds[(intel.groupBy||'')+'|'+h.label]=all?IG_FOLD_BUBBLE:false; }); intel.foldWant=null; }
  const many=hubs.length>IGB_FOLD_MANY;
  order.forEach((h,i)=>{
    h.slot=igbSlot(i); h.col=IGB_PALETTE[i%IGB_PALETTE.length];
    h.foldKey=(intel.groupBy||'')+'|'+h.label;
    if(!(h.foldKey in folds)) folds[h.foldKey]=!intel.groups&&many&&h.kids.length<=IGB_FOLD_SMALL;
    h.folded=!!folds[h.foldKey];
    const d=h.slot.cereb?igbNorm([0,-.6,-.8]):igbNorm(h.slot.dir), [u,v]=igbBasis(d), crowd=Math.min(1,14/Math.max(14,h.kids.length));
    h.hAt=h.slot.cereb?[0,-.5,-.78]:igbCortex(d,1.06);
    h.kids.forEach((n,j)=>{ n.hub=h;
      const a=(j+2)*IGB_GOLD, rr=.1+.055*Math.sqrt(j+1)*(.6+.4*crowd);
      if(h.slot.cereb){ const r2=(.12+.045*Math.sqrt(j+1))*(.6+.4*crowd); n.At=[Math.cos(a)*r2*2.2, -.46+Math.sin(a)*.05, -.8+Math.sin(a)*r2]; }
      else { const o=[u[0]*Math.cos(a)*rr+v[0]*Math.sin(a)*rr, u[1]*Math.cos(a)*rr+v[1]*Math.sin(a)*rr, u[2]*Math.cos(a)*rr+v[2]*Math.sin(a)*rr]; n.At=igbCortex([d[0]+o[0],d[1]+o[1],d[2]+o[2]],1.03); }
    });
  });
  igbAxes(G, hubs, order);
  const prev=G.prev&&G.prev.byId?G.prev.byId:{};
  G.nodes.forEach(n=>{ const p=prev[n.id];
    if(n.kind==='hub'){ n.hA=(p&&p.hA)?p.hA.slice():n.hAt.slice(); n.hL=(p&&p.hL)?p.hL.slice():n.hLt.slice();
      n.hG=n.hGt.slice(); n.hT=n.hTt.slice();
      n.fold=(p&&p.fold!=null)?p.fold:(n.folded?1:0); n.vis=p&&p.vis!=null?p.vis:0; }
    else { if(!n.At){ n.At=[0,0,0]; } if(!n.Lt) n.Lt=[0,0,0]; if(!n.Gt) n.Gt=[0,0,0]; if(!n.Tt) n.Tt=[0,0,0];
      n.A=(p&&p.A)?p.A.slice():n.At.slice(); n.L=(p&&p.L)?p.L.slice():n.Lt.slice();
      n.G=(p&&p.G)?p.G.slice():n.Gt.slice(); n.T=(p&&p.T)?p.T.slice():n.Tt.slice(); n.r0=p&&p.r0||null; }
    n.W3=[0,0,0]; });
  G.hubs=order; G.contracts=G.nodes.filter(n=>n.kind==='contract');
  /* The tissue takes the colour of the lobe it lies in. */
  const lobes=order.filter(h=>!h.slot.cereb), cer=order.find(h=>h.slot.cereb)||null;
  G.treg=igbTissue().map(d=>{
    if(d.kind==='stem') return null;
    if(d.kind==='cereb') return cer;
    let best=null, bd=-9; const vv=igbNorm(d.A);
    lobes.forEach(h=>{ const dd=igbNorm(h.slot.dir), dot=dd[0]*vv[0]+dd[1]*vv[1]+dd[2]*vv[2]; if(dot>bd){ bd=dot; best=h; } });
    return bd>.35?best:null; });
  igbColours(G); igbSizes(G);
}
/* ---- THE AXES: FLOORS, COLUMNS, THE GRID AND THE TIMELINE ----
   Floors follow `floorsBy` (the stage at rest), columns follow `columnsBy`
   (the grouping at rest), and the grid is the same two axes laid flat, one
   cell per pair, each cell saying how many and how much. The timeline lays
   contracts along the date `timeBy` names (the renewal decision at rest), one
   lane per group; a contract with no such date stands in a strip of its own
   and is counted, never dropped. Every bucket is a fact's own reading. */
const IGB_FLOORS_MAX=10, IGB_COLS_MAX=14;
function igbTimeOf(c, k){
  try{ if(k==='expiry') return _gExpiryDay(c); if(k==='signed') return _gSignedDay(c); if(k==='created') return _gCreatedDay(c);
    const d=graphDecisionOf(c); return d&&d.date?String(d.date).slice(0,10):null; }catch(_){ return null; }
}
function igbBuckets(key, nodes){
  const lab=n=>groupLabelOf(n.c,key,key===intel.groupBy?intel.groups:null), count={};
  nodes.forEach(n=>{ const l=lab(n); count[l]=(count[l]||0)+1; });
  return { of:lab, labels:igFactOrder(key,Object.keys(count),count), count };
}
function igbAxes(G, hubs, order){
  const kids=G.nodes.filter(n=>n.kind==='contract');
  /* floors */
  const fKey=intel.floorsBy||'status';
  const fb=fKey==='status'?{ of:n=>igbStatusWord(IGB_FLOOR_STATUS[igbFloorOf(n.c&&n.c.status)]), labels:IGB_FLOOR_STATUS.map(igbStatusWord) }:igbBuckets(fKey,kids);
  const fl=fb.labels.slice(0,IGB_FLOORS_MAX), nf=Math.max(1,fl.length);
  G.floors=fl.map((l,i)=>({ label:l, y:nf>1?.78-i*(1.56/(nf-1)):0, col:fKey==='status'?IGB_STATUS_COL[IGB_FLOOR_STATUS[i]]:IGB_PALETTE[i%IGB_PALETTE.length] }));
  const floorOf=n=>{ const i=fl.indexOf(fb.of(n)); return i<0?nf-1:i; };
  /* columns: the grouping's own cards, unless Copilot was asked for another */
  const cKey=intel.columnsBy&&intel.columnsBy!==intel.groupBy?intel.columnsBy:null;
  let cols;
  if(cKey){ const cb=igbBuckets(cKey,kids); cols=cb.labels.slice(0,IGB_COLS_MAX).map((l,i)=>({ label:l, col:IGB_PALETTE[i%IGB_PALETTE.length], of:cb.of }));
    const last=cols.length-1; kids.forEach(n=>{ const i=cols.findIndex(c=>c.label===cb.of(n)); n._col=i<0?last:i; }); }
  else { const cs=G.linear?hubs.slice().sort((a,b)=>(a.order??99)-(b.order??99)):order;
    cols=cs.map(h=>({ label:h.label, col:h.col, hub:h })); cs.forEach((h,i)=>h.kids.forEach(n=>{ n._col=i; })); }
  /* FLOORS AND COLUMNS BY ONE FACT say the same thing twice (floors of value
     streams over value-stream columns fill one diagonal), so the floors keep
     the fact and the columns step aside: every floor spreads its contracts
     across the whole width. */
  if(!intel.groups&&fKey===(cKey||intel.groupBy)){ cols=[{ label:'', col:IGB_OTHER, x:0 }]; kids.forEach(n=>{ n._col=0; }); }
  /* EVERY CONTRACT ITS OWN PLACE ON ITS FLOOR (Young, 28 Sep 2026: "brain and
     wiring seem to show a lot more contracts… the other screens do not seem to
     show the magnitude of the portfolio"). The columns used to sit 0.4 apart
     in the middle of a 3.4-wide floor and every cell stacked three abreast, so
     179 contracts read as a few thin piles. Now the columns share the whole
     floor and each cell lays its contracts out over its own patch, as square
     as the patch allows, never closer than the dots need nor further than
     IGB_PITCH_MAX apart. */
  const N=cols.length, FW=3.1, gap=FW/Math.max(1,N);
  cols.forEach((c,k)=>{ c.x=-FW/2+gap*(k+.5); });
  G.cols=cols; G.colKey=N>1?(cKey||intel.groupBy):null; G.floorKey=fKey;
  const cellsL={};
  kids.forEach(n=>{ const f=floorOf(n); n._floor=f; (cellsL[n._col+'|'+f]||(cellsL[n._col+'|'+f]=[])).push(n); });
  const rw=gap*.86, rd=.86;
  Object.values(cellsL).forEach(list=>{ const n0=list[0], x=cols[n0._col]?cols[n0._col].x:0, y=G.floors[n0._floor].y, k=list.length;
    const per=Math.max(1,Math.min(k,Math.ceil(Math.sqrt(k*rw/rd)))), rows=Math.ceil(k/per), pitch=Math.min(rw/per, rd/rows, IGB_PITCH_MAX);
    list.forEach((n,j)=>{ const r=Math.floor(j/per), inRow=r<rows-1?per:k-per*(rows-1);
      n.Lt=[x+((j%per)-(inRow-1)/2)*pitch, y, (r-(rows-1)/2)*pitch]; }); });
  /* the grid: the same two axes, flat, one cell per pair */
  const gx0=-1.22, gx1=1.6, gz0=-.82, gz1=.86, gcw=(gx1-gx0)/Math.max(1,N), gch=(gz1-gz0)/nf;
  G.grid={ x0:gx0, z0:gz0, cw:gcw, ch:gch, cells:{} };
  const byCell={}; kids.forEach(n=>{ const key=n._col+'|'+n._floor; (byCell[key]||(byCell[key]=[])).push(n); });
  Object.keys(byCell).forEach(key=>{ const [ci,fi]=key.split('|').map(Number), list=byCell[key];
    const per=Math.max(1,Math.ceil(Math.sqrt(list.length*gcw/gch))), rows=Math.ceil(list.length/per);
    const x0=gx0+ci*gcw, z0=gz0+fi*gch, px=gcw*.8/per, pz=Math.min(gch*.62/Math.max(1,rows), px);
    list.forEach((n,j)=>{ n.Gt=[x0+gcw*.1+px*((j%per)+.5), 0, z0+gch*.3+pz*(Math.floor(j/per)+.5)]; });
    let v=0; list.forEach(n=>{ const h=igHomeValue(n.c); if(h!=null) v+=h; });
    G.grid.cells[key]={ n:list.length, v, ci, fi }; });
  /* the timeline: dates along, one lane per group */
  const tKey=IG_TIME_KEYS.includes(intel.timeBy)?intel.timeBy:'decision';
  const lanes=order, nl=Math.max(1,lanes.length), ly=i=>nl>1?-.78+i*(1.56/(nl-1)):0;
  const dated=kids.map(n=>{ const d=igbTimeOf(n.c,tKey); const t=d?Date.parse(d):NaN; return [n,isNaN(t)?null:t]; });
  const ts=dated.map(x=>x[1]).filter(x=>x!=null), t0=ts.length?Math.min(...ts):Date.now(), t1=ts.length?Math.max(...ts):Date.now()+864e5;
  const tx=t=>-1.1+2.45*((t-t0)/Math.max(864e5,t1-t0));
  /* A crowd on one date is a crowd, not one dot: a contract that would land on
     another's spot in its lane takes the nearest free spot around its date — a
     small packed cluster, never wider than the lane — so a quarter-end with
     forty renewals LOOKS like forty. */
  let undated=0; const laneIx=new Map(lanes.map((h,i)=>[h,i]));
  /* across the lane the plane is seen at an angle, so a step there is drawn
     shorter than one along it: it is taken IGB_TL_ZS times longer */
  const laneH=nl>1?1.56/(nl-1):.9, zMax=laneH*.45, S=IGB_TL_DX, SZ=S*IGB_TL_ZS, placed={};
  const at=dated.map(([n,t])=>{ const li=n.hub?laneIx.get(n.hub):0; return [n,li,t==null?1.55:tx(t),t]; }).sort((a,b)=>(a[1]-b[1])||(a[2]-b[2]));
  at.forEach(([n,li,x,t])=>{ if(t==null) undated++;
    const mine=placed[li]||(placed[li]=[]), near=mine.filter(p=>Math.abs(p[0]-x)<S*IGB_TL_RING);
    let spot=[x,0];
    for(const [i,j] of IGB_TL_SPOTS){ const ox=x+i*S, oz=j*SZ; if(Math.abs(oz)>zMax) continue;
      if(!near.some(p=>Math.hypot((p[0]-ox)/S,(p[1]-oz)/SZ)<.95)){ spot=[ox,oz]; break; } }
    mine.push(spot); n.Tt=[spot[0], 0, ly(li)+spot[1]]; });
  const span2=t1-t0, ticks=[];
  if(ts.length){ const d0=new Date(t0), step=span2>3*365*864e5?12:span2>400*864e5?3:1;
    const d=new Date(d0.getFullYear(), d0.getMonth()-(d0.getMonth()%step), 1);
    for(let i=0;i<60&&d.getTime()<=t1;i++){ if(d.getTime()>=t0) ticks.push({ x:tx(d.getTime()), label:step===12?String(d.getFullYear()):d.toLocaleDateString((typeof langLocale==='function')?langLocale():undefined,{ month:'short', year:'numeric' }) }); d.setMonth(d.getMonth()+step); } }
  let nowX=null; const now=Date.now(); if(ts.length&&now>=t0&&now<=t1) nowX=tx(now);
  G.tl={ key:tKey, ticks, lanes:lanes.map((h,i)=>({ label:h.label, y:ly(i), col:h.col })), undated, nowX, empty:!ts.length };
  hubs.forEach(h=>{ const i=laneIx.get(h)||0, cc=cols.find(c=>c.hub===h); h.hLt=[cc?cc.x:0, 1.08, 0]; h.hGt=[cols.findIndex(c=>c.hub===h)>=0?cols.find(c=>c.hub===h).x:0, 1.08, 0]; h.hTt=[-1.3, 0, ly(i)]; });
}
/* COLOUR BY: status at rest; any grouping the map knows on Copilot's word.
   Coloured by the grouping it is grouped by, the dots wear their card's colour. */
function igbColours(G){
  const key=GRAPH_GROUP_KEYS.includes(intel.colourBy)?intel.colourBy:'status';
  G.colourKey=key;
  if(key==='status'){ G.colourOf=n=>IGB_STATUS_COL[n.c&&n.c.status]||IGB_OTHER;
    G.colourRows=IGB_FLOOR_STATUS.map(s=>({ k:s, label:igbStatusWord(s), col:IGB_STATUS_COL[s], status:s })); return; }
  const labOf=n=>groupLabelOf(n.c,key,key===intel.groupBy?intel.groups:null);
  const map=new Map();
  if(key===intel.groupBy&&!intel.groups) G.hubs.forEach(h=>map.set(h.label,h.col));
  else { const cnt={}; G.contracts.forEach(n=>{ const l=labOf(n); cnt[l]=(cnt[l]||0)+1; });
    Object.keys(cnt).sort((a,b)=>(cnt[b]-cnt[a])||a.localeCompare(b)).forEach((l,i)=>map.set(l,IGB_PALETTE[i%IGB_PALETTE.length])); }
  G.contracts.forEach(n=>{ n.colourLabel=labOf(n); });
  G.colourOf=n=>map.get(n.colourLabel)||IGB_OTHER;
  G.colourRows=[...map].map(([label,col])=>({ k:label, label, col }));
}
/* SIZE BY: value (in the home currency, one arithmetic), open obligations, or
   one size. A viewer who may not see money gets one size, never a hint. */
function igbSizes(G){
  let key=IGB_SIZE_KEYS.includes(intel.sizeBy)?intel.sizeBy:'value';
  const moneyOk=(typeof canViewValues!=='function')||canViewValues();
  if(key==='value'&&!moneyOk) key='same';
  G.sizeKey=key;
  if(key==='value'){ let vmax=0; const v={};
    G.contracts.forEach(n=>{ const c=n.c; if(!c||(typeof isMonetary==='function'&&!isMonetary(c))||!(Number(c.value||0)>0)) return;
      const h=(typeof fxHome==='function')?fxHome(c):{ v:Number(c.value||0), missing:false }; if(h.missing) return; v[n.id]=h.v; vmax=Math.max(vmax,h.v); });
    G.contracts.forEach(n=>{ n.rT=v[n.id]&&vmax?2.4+4.4*Math.sqrt(v[n.id]/vmax):2.4; }); }
  else if(key==='obligations') G.contracts.forEach(n=>{ const k=((n.c&&n.c.obligations)||[]).filter(o=>o&&!o.completedAt&&!o.done).length; n.rT=2.4+Math.min(6,k*1.1); });
  else G.contracts.forEach(n=>{ n.rT=3.4; });
  G.contracts.forEach(n=>{ if(n.r0==null) n.r0=n.rT; });
}
/* The wiring is the force layout, laid flat and fitted to the stage. The fit
   eases, so the drift of the physics never shakes the page. */
function igbWiring(G){
  if(!G.nodes.length) return;
  let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
  G.nodes.forEach(n=>{ if(n.x<minX)minX=n.x; if(n.x>maxX)maxX=n.x; if(n.y<minY)minY=n.y; if(n.y>maxY)maxY=n.y; });
  const U=Math.max(1,Math.min(G.W,G.H)*.36*IGB_SCALE[1]);
  const X=Math.max(.4,(G.W/2-110)/U), Y=Math.max(.3,(G.H/2-60)/U);
  const cx=(minX+maxX)/2, cy=(minY+maxY)/2, s=Math.max(1e-3,(maxX-minX)/2/X,(maxY-minY)/2/Y);
  const b=G.wb; if(!b) G.wb={ cx, cy, s }; else { b.cx+=(cx-b.cx)*.08; b.cy+=(cy-b.cy)*.08; b.s+=(s-b.s)*.08; }
  const w=G.wb;
  G.nodes.forEach(n=>{ if(n._wz==null) n._wz=((igbHash(n.id)%100)/100-.5)*.16; n.W3[0]=(n.x-w.cx)/w.s; n.W3[1]=-(n.y-w.cy)/w.s; n.W3[2]=n._wz; });
}
function igbHeart(h,w){ const P=[h.hA,h.W3,h.hL,h.hG||h.hL,h.hT||h.hL]; return [0,1,2].map(i=>P.reduce((s,v,k)=>s+v[i]*w[k],0)); }
/* A fold gathers contracts into their card only where cards are drawn —
   the brain and the wiring; the floors, the grid and the timeline always
   show every contract. */
const igbCardW=w=>Math.max(0,1-w[2]-w[3]-w[4]);
/* A group bubble's radius: its share of the biggest group, by count or (when
   asked, and money may be seen) by value converted home — area follows the
   figure, so the radius follows its square root. */
const IGB_BUBBLE_R=[12,48];
function igBubbleRadius(G,h){
  const by=intel.bubbleBy==='value'&&((typeof canViewValues!=='function')||canViewValues())?'value':'count';
  if(!G._bub||G._bub.by!==by){ const m=new Map(); let top=0;
    G.hubs.forEach(x=>{ let v=x.kids.length; if(by==='value'){ v=0; x.kids.forEach(n=>{ const hv=n.c?igHomeValue(n.c):null; if(hv) v+=hv; }); } m.set(x,v); if(v>top) top=v; });
    G._bub={ by, m, top }; }
  const v=G._bub.m.get(h)||0, t=G._bub.top||1;
  /* many groups share the stage: the biggest bubble gives way so a crowd of
     forty stays forty bubbles rather than one blot */
  const top=Math.max(IGB_BUBBLE_R[0]+6,IGB_BUBBLE_R[1]*Math.min(1,Math.sqrt(12/Math.max(1,G.hubs.length))));
  return IGB_BUBBLE_R[0]+(top-IGB_BUBBLE_R[0])*Math.sqrt(Math.max(0,v)/t);
}
/* THE BUNDLES' BUBBLES: one per bundle, where its contracts sit (the middle
   of their dots as drawn), sized against the biggest group like a group's
   bubble, its name and count written under it. Only where cards are drawn —
   the brain and the wiring; the flat views show every contract. */
function igbDrawBundles(G,ctx,bw,txt){
  G._bundles=[];
  const B=Array.isArray(intel.bundles)?intel.bundles:[], S=igBundleSets(); if(!B.length||bw<=.05) return;
  const zs=Math.sqrt(igbCam().zoom), byVal=intel.bubbleBy==='value'&&((typeof canViewValues!=='function')||canViewValues());
  let top=0; G.hubs.forEach(h=>{ let v=h.kids.length; if(byVal){ v=0; h.kids.forEach(n=>{ const hv=n.c?igHomeValue(n.c):null; if(hv) v+=hv; }); } if(v>top) top=v; });
  B.forEach((b,i)=>{ const ms=G.contracts.filter(n=>S[i]&&S[i].has(n.id)); if(ms.length<2) return;
    const f=Math.min(1,ms.reduce((s,n)=>s+(n.bd||0),0)/ms.length)*bw; if(f<.05) return;
    let x=0, y=0; ms.forEach(n=>{ x+=n.q[0]; y+=n.q[1]; }); x/=ms.length; y/=ms.length;
    let v=ms.length; if(byVal){ v=0; ms.forEach(n=>{ const hv=n.c?igHomeValue(n.c):null; if(hv) v+=hv; }); }
    const t=Math.max(top,v)||1, r=(IGB_BUBBLE_R[0]+(IGB_BUBBLE_R[1]-IGB_BUBBLE_R[0])*Math.sqrt(Math.max(0,v)/t))*zs*(intel.dotScale||1)*Math.max(.25,f);
    const col=IGB_PALETTE[(i+5)%IGB_PALETTE.length];
    igbGlow(ctx,x,y,r*1.9,col,.32*f);
    ctx.fillStyle=igbHexA(col,.82*f); ctx.beginPath(); ctx.arc(x,y,r,0,6.283); ctx.fill();
    ctx.strokeStyle='rgba(230,242,239,'+(.55*f)+')'; ctx.lineWidth=1.2; ctx.stroke();
    txt(igbTrim(b.label,28)+' · '+ms.length, x, y+r+14, col, .95*f, 11, 600, 'center');
    G._bundles.push({ i, x, y, r, label:b.label, n:ms.length }); });
}
function igBubDoors(G){
  if(!G||!G.svg) return;
  const ns='http://www.w3.org/2000/svg', nodes=G.svg.querySelector('#ig-nodes');
  let layer=G.svg.querySelector('#ig-bubs');
  if(!layer){ layer=document.createElementNS(ns,'g'); layer.id='ig-bubs'; (nodes&&nodes.parentNode||G.svg).insertBefore(layer,nodes||null); }
  if(layer._for!==G){ layer.innerHTML=''; layer._for=G; }
  const tap=igTapCoarse()?IG_TAP_R_TOUCH:0;
  G.hubs.forEach(h=>{
    if(!(h._bubR>2)){ if(h.bubEl&&h.bubEl._disp!=='none'){ h.bubEl._disp='none'; h.bubEl.style.display='none'; } return; }
    if(!h.bubEl){ const c=document.createElementNS(ns,'circle'); c.setAttribute('class','ig-bub'); c.setAttribute('fill','transparent'); c.style.cursor='pointer';
      const t=document.createElementNS(ns,'title'); t.textContent=h.label+' · '+((h.lines&&h.lines[0])||h.sub||i18tn('hb_n_contracts',(h.kids||[]).length,{ n:(h.kids||[]).length }))+' — '+i18t('int_bub_open');
      c.appendChild(t);
      c.addEventListener('click',e=>{ e.stopPropagation(); if(IG&&IG.dragMoved) return; igRecipePush(); igFoldHub(h,false); updateIntelNote(); });
      layer.appendChild(c); h.bubEl=c; }
    if(h.bubEl._disp==='none'){ h.bubEl._disp=''; h.bubEl.style.display=''; }
    const bq=h._bq||h.q; igbSet(h.bubEl,'cx',bq[0].toFixed(1)); igbSet(h.bubEl,'cy',bq[1].toFixed(1)); igbSet(h.bubEl,'r',String(Math.round(Math.max(h._bubR,tap))));
  });
  /* a bundle's bubble opens on a press, the same as a group's */
  const D=G._bundles||[], els=layer._bd||(layer._bd=[]);
  D.forEach((b,k)=>{ let c=els[k];
    if(!c){ c=document.createElementNS(ns,'circle'); c.setAttribute('class','ig-bub ig-bub-bundle'); c.setAttribute('fill','transparent'); c.style.cursor='pointer';
      c.appendChild(document.createElementNS(ns,'title'));
      c.addEventListener('click',e=>{ e.stopPropagation(); if(IG&&IG.dragMoved) return; const lab=c._label; if(!lab) return;
        igRecipePush(); const B=(intel.bundles||[]).filter(x=>x.label!==lab); intel.bundles=B.length?B:null; updateIntelNote(); });
      layer.appendChild(c); els[k]=c; }
    c._label=b.label; const tt=b.label+' · '+i18tn('hb_n_contracts',b.n,{ n:b.n })+' — '+i18t('int_bub_open'); if(c.firstChild.textContent!==tt) c.firstChild.textContent=tt;
    c.style.display=''; igbSet(c,'cx',b.x.toFixed(1)); igbSet(c,'cy',b.y.toFixed(1)); igbSet(c,'r',String(Math.round(Math.max(b.r,tap)))); });
  for(let k=D.length;k<els.length;k++) els[k].style.display='none';
}
/* WHICH NAMES THE MAP PRINTS (Young, 3–4 Oct 2026): all (rest), none ("just
   the bubbles"), only these, or all but these — the set read with the map's
   own conditions reader, again whenever the question changes. */
function igNamesRule(){
  const n=intel.names; if(!n) return null;
  if(n.mode==='none') return { none:true };
  const key=n.mode+'|'+n.q; if(!IG) return null;
  if(IG._nmKey!==key){ IG._nmKey=key; let ids=[]; try{ ids=igIdsWhere(igConditions(n.q)); }catch(_){} IG._nmSet=new Set(ids); }
  return { mode:n.mode, set:IG._nmSet };
}
function igNameShows(id,R){ if(!R) return true; if(R.none) return false; return R.mode==='only'?R.set.has(id):!R.set.has(id); }
/* BIG BUBBLES ONLY WHEN ASKED (Young, 4 Oct 2026: "they should only be bigger
   if they are folded into bundles like fold all Juno customers into one bubble
   but individual bubbles should not be getting a big bubble"). A fold is
   stored as true (gathered by the map itself on a crowded stage: NO bubble,
   the contracts gather into the card as they always did) or IG_FOLD_BUBBLE
   (asked — a card press, Fold all, "fold everything", "fold Juno"). A group
   of one contract is never a bubble. */
const IG_FOLD_BUBBLE='b';
function igHubBubbles(h){ return !!h&&h.folded&&(intel.folds||{})[h.foldKey]===IG_FOLD_BUBBLE&&(h.kids||[]).length>1; }
/* A BUNDLE is contracts named by the map's own conditions reader ("fold all
   Juno contracts into one bubble"), drawn as ONE bubble wherever they sit,
   across every group — the grouping is not touched. In the recipe; cleared
   by "reset", by pressing the bubble, or by "open Juno". */
const IG_BUNDLES_MAX=6;
function igBundleSets(){
  const B=Array.isArray(intel.bundles)?intel.bundles:[]; if(!IG) return [];
  const key=JSON.stringify(B.map(b=>b.q));
  if(IG._bdKey!==key){ IG._bdKey=key; IG._bdSets=B.map(b=>{ let ids=[]; try{ ids=igIdsWhere(igConditions(b.q)); }catch(_){} return new Set(ids); }); }
  return IG._bdSets||[];
}
function igBundleOf(id){ const S=igBundleSets(); for(let i=0;i<S.length;i++) if(S[i].has(id)) return i; return -1; }
/* NAMES ON THE EDGES (Young, 4 Oct 2026: "names of the customer never used to
   appear on the edges only in the contracts. They should appear on the edges
   when i ask for it. Names should not be there twice"). A floor, column or
   lane cut by the counterparty prints its names only when asked
   (`intel.edgeNames`); every other fact prints as before. Either way a name
   that would sit on another is not drawn — the dots still say it on hover. */
const IG_EDGE_PARTY_KEYS=['counterparty'];
function igEdgeNamesShow(key){ return !IG_EDGE_PARTY_KEYS.includes(key)||intel.edgeNames===true; }
function igHubNamed(h,R){ if(!R) return true; if(R.none) return false; return (h.kids||[]).some(n=>igNameShows(n.id,R)); }
function igbMix(n,w){
  const P=[n.A,n.W3,n.L,n.G||n.L,n.T||n.L];
  const p=[0,1,2].map(i=>P.reduce((s,v,k)=>s+v[i]*w[k],0));
  const h=n.hub; if(!h) return p;
  const f=h.fold*igbCardW(w); if(f<=0) return p;
  const H=igbHeart(h,w); return [p[0]+(H[0]-p[0])*f, p[1]+(H[1]-p[1])*f, p[2]+(H[2]-p[2])*f];
}
/* THE PROJECTION — the Brain page's own: turn, tilt, a gentle perspective. */
function igbProjector(G){
  const cam=igbCam(), w=cam.w;
  const rot=igbDot(w,[cam.rot,cam.rotW,cam.rotL-.2,cam.rotG+(cam.sway||0),cam.rotT+(cam.sway||0)]);
  const tilt=igbDot(w,[IGB_TILT[0]+cam.tiltOff,IGB_TILT[1]+cam.tiltW,IGB_TILT[2]+cam.tiltL,IGB_TILT[3]+cam.tiltG,IGB_TILT[4]+cam.tiltT]);
  /* the flat views fill the stage's width, the turning ones its height */
  const base=Math.max(1,Math.min(G.W,G.H))*.36, flat=Math.max(1,Math.min(G.W/3.6,G.H/2.1));
  const SC=cam.zoom*(base*igbDot(w.slice(0,3),IGB_SCALE.slice(0,3))+flat*(w[3]+w[4]));
  const c=Math.cos(rot), s=Math.sin(rot), ct=Math.cos(tilt), st=Math.sin(tilt), cy=G.H*igbDot(w,IGB_CY);
  return p=>{ const x=p[0]*SC, y=p[1]*SC, z=p[2]*SC, x1=x*c-z*s, z1=x*s+z*c, y2=y*ct-z1*st, z2=y*st+z1*ct, f=1000/(1000-z2);
    return [G.W/2+x1*f, cy-y2*f, f, z2/SC]; };
}
/* One step of time: the views glide, the nodes glide, the folds close and
   open, the brain turns slowly unless the reader is holding or pointing at
   it, and a walk-through moves on. */
function igbStep(G,dt){
  const cam=igbCam(), rm=igbReduced(), tgt=[0,0,0,0,0]; tgt[cam.view]=1;
  const ease=rm?1:Math.min(1,dt*2.4), glide=rm?1:Math.min(1,dt*2.2), fe=rm?1:Math.min(1,dt*4), ve=rm?1:Math.min(1,dt*2);
  cam.w=cam.w.map((v,i)=>v+(tgt[i]-v)*ease);
  G.nodes.forEach(n=>{
    if(n.kind==='hub'){ for(let i=0;i<3;i++){ n.hA[i]+=(n.hAt[i]-n.hA[i])*glide; n.hL[i]+=(n.hLt[i]-n.hL[i])*glide; }
      n.fold+=((n.folded?1:0)-n.fold)*fe; n.vis+=(1-n.vis)*ve; }
    else { for(let i=0;i<3;i++){ n.A[i]+=(n.At[i]-n.A[i])*glide; n.L[i]+=(n.Lt[i]-n.L[i])*glide; n.G[i]+=(n.Gt[i]-n.G[i])*glide; n.T[i]+=(n.Tt[i]-n.T[i])*glide; } n.r0+=(n.rT-n.r0)*Math.min(1,rm?1:dt*6);
      n.bd=(n.bd||0)+((igBundleOf(n.id)>=0?1:0)-(n.bd||0))*fe; } });
  /* Turning / Still (the bar's own button, `cam.spin`; a reader who asked for
     less motion starts Still). Holding or pointing at the map holds it. */
  const spin=cam.spin==null?!rm:!!cam.spin;
  if(spin&&!G.turning&&!G.hover){ const k=IGB_SPIN_KEY[cam.view]; if(k) cam[k]+=dt*IGB_TURN_RATE; else if(cam.view>=3) cam.swayT=(cam.swayT||0)+dt; }
  /* Still holds the swing where it is (a pressed Still is still at once) */
  if(spin){ const swayTo=cam.view>=3?IGB_SWAY*Math.sin((cam.swayT||0)*2*Math.PI/IGB_SWAY_S):0;
    cam.sway=(cam.sway||0)+(swayTo-(cam.sway||0))*(rm?1:Math.min(1,dt*2)); }
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)); ['rot','rotW','rotL','rotG','rotT'].forEach(k=>{ cam[k]=wrap(cam[k]); });
  const wk=intel.walk;
  if(wk&&wk.playing){ wk.clock=Math.min(wk.ids.length*IGB_STEP_S+1, wk.clock+dt);
    wk.ids.forEach((id,k)=>{ if(wk.clock>=k*IGB_STEP_S){ const n=G.byId[id]; if(n&&n.hub&&n.hub.folded) igFoldHub(n.hub,false); } });
    const lit=Math.min(wk.ids.length, Math.floor((wk.clock-IGB_PULSE_S)/IGB_STEP_S)+1);
    if(lit!==G._walkLit){ G._walkLit=lit; updateIntelNote(); } }
}
function igbWalkLit(id){ const wk=intel.walk; if(!wk) return -1; const k=wk.ids.indexOf(id); if(k<0) return -1; return wk.clock>=k*IGB_STEP_S+IGB_PULSE_S?k:-1; }
/* THE CANVAS: floors, tissue, the glow round each group, the dots. Nothing
   here carries a word a reader must read except the floors' own names. */
function igbDraw(G,t){
  const cv=G.cv, ctx=G.ctx; if(!cv||!ctx) return;
  const W=G.W, H=G.H, dpr=Math.min(2,window.devicePixelRatio||1);
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){ cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); }
  ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
  const w=igbCam().w, pj=G.pj, rm=igbReduced(), walking=!!intel.walk, zs=Math.sqrt(igbCam().zoom);
  /* The canvas's own words (floor and lane names, cell counts, the axis) are
     room: igbPlace keeps every contract's words clear of them. */
  G.reserve=G.noteBox?[G.noteBox]:[];
  const txt=(t,x,y,col,a,size,weight,align)=>{ const sz=size||10; ctx.font=(weight||600)+' '+sz+'px Geist, system-ui, sans-serif'; ctx.textAlign=align||'left'; ctx.fillStyle=igbHexA(col,a); ctx.fillText(t,x,y); ctx.textAlign='left';
    if(a>.3){ const w=ctx.measureText(t).width, x0=align==='right'?x-w:align==='center'?x-w/2:x; G.reserve.push({ x:x0-2, y:y-sz, w:w+4, h:sz+4 }); } };
  /* AN EDGE NAME IS DRAWN ONLY WHERE IT FITS, and a party's names only when
     asked (igEdgeNamesShow): the first of two that would sit on each other
     keeps its place, the second is not drawn. */
  const edge=G._edge=[];
  const edgeTxt=(key,t,x,y,col,a,size,weight,align)=>{ if(!igEdgeNamesShow(key)) return; const sz=size||10;
    ctx.font=(weight||600)+' '+sz+'px Geist, system-ui, sans-serif'; const tw=ctx.measureText(t).width, x0=align==='right'?x-tw:align==='center'?x-tw/2:x;
    const A={ x:x0-3, y:y-sz, w:tw+6, h:sz+4 }; if(edge.some(B=>A.x<B.x+B.w&&B.x<A.x+A.w&&A.y<B.y+B.h&&B.y<A.y+A.h)) return;
    A.t=t; edge.push(A); txt(t,x,y,col,a,size,weight,align); };
  if(w[2]>.05){
    (G.floors||[]).forEach(f=>{ const y=f.y, a=pj([-1.7,y,-.5]), b=pj([1.7,y,-.5]), c=pj([1.7,y,.5]), d=pj([-1.7,y,.5]);
      ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.lineTo(c[0],c[1]); ctx.lineTo(d[0],d[1]); ctx.closePath();
      ctx.fillStyle='rgba(56,205,184,'+(.035*w[2])+')'; ctx.fill(); ctx.strokeStyle='rgba(56,205,184,'+(.16*w[2])+')'; ctx.lineWidth=1; ctx.stroke();
      const lab=igbTrim(String(f.label).toUpperCase(),22); ctx.font='600 10px Geist, system-ui, sans-serif';
      edgeTxt(G.floorKey, lab, Math.max(6,d[0]-8-ctx.measureText(lab).width), d[1]+4, f.col, .9*w[2]); });
    (G.cols||[]).forEach((c,k)=>{ if(!c.label) return; const q=pj([c.x,(G.floors&&G.floors.length?G.floors[G.floors.length-1].y:-.78),.62]);
      edgeTxt(G.colKey, igbTrim(String(c.label).toUpperCase(),14), q[0], q[1]+14+(k%2)*11, c.col, .85*w[2], 9, 600, 'center'); });
  }
  /* THE GRID: one cell per column × floor, each saying how many and how much. */
  if(w[3]>.05&&G.grid){ const g=G.grid, a3=w[3], money=(typeof canViewValues!=='function')||canViewValues();
    const fmt=v=>(typeof fmtMoneyShort==='function')?fmtMoneyShort(v):String(Math.round(v));
    (G.cols||[]).forEach((c,ci)=>{ if(!c.label) return; const q=pj([g.x0+(ci+.5)*g.cw, 0, g.z0-.09]), qa=pj([g.x0+ci*g.cw, 0, g.z0-.09]), qb=pj([g.x0+(ci+1)*g.cw, 0, g.z0-.09]);
      /* the label fits the cell as it is DRAWN, so a turned grid never piles its headings on each other */
      edgeTxt(G.colKey, igbTrim(String(c.label).toUpperCase(),Math.max(4,Math.floor(Math.hypot(qb[0]-qa[0],qb[1]-qa[1])/7.2))), q[0], q[1], c.col, .9*a3, 10, 600, 'center'); });
    (G.floors||[]).forEach((f,fi)=>{ const q=pj([g.x0-.04, 0, g.z0+(fi+.5)*g.ch]); edgeTxt(G.floorKey, igbTrim(String(f.label),18), q[0], q[1]+3, f.col, .9*a3, 10, 600, 'right'); });
    (G.cols||[]).forEach((c,ci)=>(G.floors||[]).forEach((f,fi)=>{ const x0=g.x0+ci*g.cw, z0=g.z0+fi*g.ch, P=[pj([x0+.01,0,z0+.01]),pj([x0+g.cw-.01,0,z0+.01]),pj([x0+g.cw-.01,0,z0+g.ch-.01]),pj([x0+.01,0,z0+g.ch-.01])];
      const cell=g.cells[ci+'|'+fi];
      ctx.beginPath(); P.forEach((p,k)=>k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath();
      ctx.fillStyle='rgba(56,205,184,'+((cell?.06:.015)*a3)+')'; ctx.fill(); ctx.strokeStyle='rgba(160,220,210,'+(.18*a3)+')'; ctx.lineWidth=1; ctx.stroke();
      if(cell){ ctx.font='700 12px Geist, system-ui, sans-serif'; const nw=ctx.measureText(String(cell.n)).width; txt(String(cell.n), P[0][0]+6, P[0][1]+13, '#FFFFFF', .95*a3, 12, 700); if(money&&cell.v>0) txt(fmt(cell.v), P[0][0]+6+nw+6, P[0][1]+13, '#8FB5AD', .9*a3, 10, 500); } }));
  }
  /* THE TIMELINE: dates along, one lane per group, today marked, the undated counted. */
  if(w[4]>.05&&G.tl){ const tl=G.tl, a4=w[4];
    tl.lanes.forEach(l=>{ line2(pj([-1.15,0,l.y]),pj([1.4,0,l.y]),'rgba(160,220,210,'+(.14*a4)+')'); const q=pj([-1.17,0,l.y]); edgeTxt(intel.groups?'custom':intel.groupBy, igbTrim(String(l.label),20), q[0], q[1]+3, l.col, .9*a4, 10, 600, 'right'); });
    const za=(tl.lanes.length?tl.lanes[tl.lanes.length-1].y:.8)+.16;
    line2(pj([-1.1,0,za]),pj([1.35,0,za]),'rgba(207,227,222,'+(.4*a4)+')');
    tl.ticks.forEach(k=>{ const q=pj([k.x,0,za]), q2=pj([k.x,0,za+.04]); line2(q,q2,'rgba(207,227,222,'+(.5*a4)+')'); txt(k.label, q[0], q[1]+15, '#8FB5AD', .9*a4, 10, 500, 'center'); });
    if(tl.nowX!=null){ const q0=pj([tl.nowX,0,-.92]), q1=pj([tl.nowX,0,za]); line2(q0,q1,'rgba(242,178,76,'+(.55*a4)+')'); txt(i18t('int_tl_today'), q0[0], q0[1]-4, IGB_WALK, .95*a4, 10, 600, 'center'); }
    const qu=pj([1.55,0,-.94]); txt(i18t('int_tl_undated',{ n:tl.undated }), qu[0], qu[1], '#8FB5AD', .9*a4, 10, 600, 'center');
    if(tl.empty){ const qm=pj([0,0,0]); txt(i18t('int_tl_empty',{ x:i18t('int_time_'+tl.key) }), qm[0], qm[1], '#CFE3DE', .9*a4, 12, 500, 'center'); }
  }
  const T=igbTissue(), H0=G.hubs, nh=H0.length, FL=(G.floors&&G.floors.length)?G.floors:[{ y:0 }], flat=w[3]+w[4];
  for(let i=0;i<T.length;i++){ const d=T[i];
    let W3=[d.L[0],d.L[1],d.L[2]];
    if(nh){ const ha=H0[Math.floor(d.wa*nh)], hb=H0[Math.floor(d.wb*nh)]; W3=[ha.W3[0]+(hb.W3[0]-ha.W3[0])*d.wt+d.jx, ha.W3[1]+(hb.W3[1]-ha.W3[1])*d.wt+d.jy, 0]; }
    const Lf=[d.L[0], FL[Math.floor(d.wt*FL.length)].y, d.L[2]], Sh=[d.L[0]*.98, -.02, (d.wb*2-1)*.92];
    const p=[0,1,2].map(k=>d.A[k]*w[0]+W3[k]*w[1]+Lf[k]*w[2]+Sh[k]*flat);
    const q=pj(p), front=igbClamp01((q[3]+1.1)/2.2), reg=G.treg&&G.treg[i];
    let a=(.2+front*.5)*(walking?.55:1)*(1-.45*w[1])*(1-.7*flat);
    if(!rm&&Math.sin(t*d.sp+d.ph)>.985) a=Math.min(1,a+.5*(1-flat));
    const sz=(.9+d.s*1.3)*q[2]*zs;
    ctx.fillStyle=igbHexA(reg?reg.col:IGB_IDLE,a); ctx.fillRect(q[0]-sz/2,q[1]-sz/2,sz,sz); }
  const bw=igbCardW(w);
  if(bw>.05) G.hubs.forEach(h=>{ if(h.fold>.95) return; const q=h.q, vis=(w[0]*igbClamp01((q[3]+.25)*2)+w[1])*h.vis;
    igbGlow(ctx,q[0],q[1],50+6*Math.sqrt(h.kids.length),h.col,.1*bw*vis*(1-h.fold)); });
  /* ONE BIG BUBBLE PER GROUP (Young, 4 Oct 2026): a folded group is drawn as
     a bubble in its colour where its contracts gathered, sized by how many it
     holds — or by their value when asked (igBubbleRadius) — and the card
     moves under it (igbPlace). */
  const NRb=igNamesRule();
  G.hubs.forEach(h=>{ const f=h.fold*bw; h._bubR=0; if(f<.05||!igHubBubbles(h)) return;
    const vis=Math.min(1,(w[0]*igbClamp01((h.q[3]+.25)*2)+w[1])*h.vis); if(vis<.08) return;
    const r=igBubbleRadius(G,h)*Math.sqrt(igbCam().zoom)*(intel.dotScale||1);
    /* THE CARD STAYS WHERE IT WAS PRESSED: the bubble rises just above the
       card's place, so a second press on the card opens it again; with the
       names hidden there is no card, and the bubble sits where the contracts
       gathered */
    const q=igHubNamed(h,NRb)?[h.q[0],h.q[1]-h.h/2-6-r*f,h.q[2],h.q[3]]:h.q; h._bq=q;
    igbGlow(ctx,q[0],q[1],r*1.9,h.col,.32*f*vis);
    ctx.fillStyle=igbHexA(h.col,.82*f*vis); ctx.beginPath(); ctx.arc(q[0],q[1],r*Math.max(.25,f),0,6.283); ctx.fill();
    ctx.strokeStyle='rgba(230,242,239,'+(.55*f*vis)+')'; ctx.lineWidth=1.2; ctx.stroke();
    /* a card that had to step away from its bubble is tied to it by a faint
       line (last frame's place: igbPlace runs after this) */
    if(h.box&&h.g&&h.g.style.display!=='none'){ const bx=Math.max(h.box.x,Math.min(q[0],h.box.x+h.box.w)), by=Math.max(h.box.y,Math.min(q[1],h.box.y+h.box.h)), d=Math.hypot(bx-q[0],by-q[1]);
      if(d>r*f+14){ const ux=(bx-q[0])/d, uy=(by-q[1])/d; ctx.beginPath(); ctx.moveTo(q[0]+ux*r*f,q[1]+uy*r*f); ctx.lineTo(bx,by);
        ctx.strokeStyle=igbHexA(h.col,.45*f*vis); ctx.lineWidth=1; ctx.stroke(); } }
    h._bubR=r*f; });
  igbDrawBundles(G,ctx,bw,txt);
  const P=G.contracts.slice().sort((a,b)=>a.q[3]-b.q[3]);
  P.forEach(n=>{
    if(n._fold>.95) return;
    const q=n.q, a=n._a, r=n._r, lit=n._lit, cl=n.g.classList, col=G.colourOf(n), tw=rm?1:.85+.15*Math.sin(t*2+(n._ph||0));
    igbGlow(ctx,q[0],q[1],r*(lit>=0?6:4.2),lit>=0?IGB_WALK:col,(lit>=0?.75:.42)*a*tw);
    ctx.fillStyle=igbHexA(lit>=0?'#FFFFFF':col,a); ctx.beginPath(); ctx.arc(q[0],q[1],r,0,6.283); ctx.fill();
    if(cl.contains('hi')||cl.contains('hit')||G.sel===n.id){ ctx.strokeStyle='rgba(230,242,239,'+(.9*Math.max(.4,a))+')'; ctx.lineWidth=1.3; ctx.beginPath(); ctx.arc(q[0],q[1],r+4,0,6.283); ctx.stroke(); }
    if(n.badge&&a>.2){ ctx.save(); ctx.setLineDash([3,3]); ctx.strokeStyle='rgba(242,178,76,.95)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(q[0],q[1],r+6+(rm?0:Math.sin(t*3+(n._ph||0))),0,6.283); ctx.stroke(); ctx.restore(); } });
  const wk=intel.walk;
  if(wk){ const ids=wk.ids, at=id=>G.byId[id]&&G.byId[id].q;
    ctx.lineWidth=1.2;
    for(let i=1;i<ids.length;i++){ if(igbWalkLit(ids[i])<0) break; const a=at(ids[i-1]), b=at(ids[i]); if(!a||!b) continue;
      ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.quadraticCurveTo((a[0]+b[0])/2,(a[1]+b[1])/2-40,b[0],b[1]); ctx.strokeStyle=igbHexA(IGB_WALK,.45); ctx.stroke(); }
    const k=Math.floor(wk.clock/IGB_STEP_S), u=(wk.clock-k*IGB_STEP_S)/IGB_PULSE_S;
    if(k<ids.length&&u>=0&&u<=1&&at(ids[k])){ const to=at(ids[k]), from=(k&&at(ids[k-1]))||[W/2,H*.52];
      const mx=(from[0]+to[0])/2, my=(from[1]+to[1])/2-40, v=1-u, px=v*v*from[0]+2*v*u*mx+u*u*to[0], py=v*v*from[1]+2*v*u*my+u*u*to[1];
      igbGlow(ctx,px,py,18,IGB_WALK,.95); ctx.fillStyle='#FFFFFF'; ctx.beginPath(); ctx.arc(px,py,2.2,0,6.283); ctx.fill(); } }
}
/* How strongly each contract shows this frame — folded into its card, dimmed
   by a hover or a highlight, passed by the cliff, lit by a walk-through. Read
   by the canvas AND by the words, so the two never disagree. */
function igbShade(G){
  const w=igbCam().w, walking=!!intel.walk, zs=Math.sqrt(igbCam().zoom);
  G.contracts.forEach(n=>{
    const q=n.q, fold=Math.max(n.hub?n.hub.fold*igbCardW(w):0,(n.bd||0)*igbCardW(w)), cl=n.g.classList, lit=igbWalkLit(n.id), front=igbClamp01((q[3]+1.1)/2.2);
    n._fold=fold; n._lit=lit; n._r=n.r0*q[2]*zs*(intel.dotScale||1);
    n._a=(walking&&lit<0?.3:1)*(cl.contains('dim')?.22:1)*(cl.contains('passed')?.3:1)*(cl.contains('mut')?.28:1)*(.45+front*.55)*(1-fold); });
}
function line2(a,b,col){ const ctx=IG&&IG.ctx; if(!ctx) return; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.strokeStyle=col; ctx.lineWidth=1; ctx.stroke(); }
function igbGlow(ctx,x,y,r,col,a){ if(!(r>0)||!(a>0)) return; const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,igbHexA(col,a)); g.addColorStop(1,igbHexA(col,0));
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,6.283); ctx.fill(); }
/* THE WORDS: every group card where it faces the reader, then every contract's
   two small lines where they fit without covering another; where they do not,
   its number alone; where not even that fits, the dot speaks on hover. */
/* Where a card may step to when its own place is taken: one card's height up
   or down first (the cards are wide and short), then sideways, then the
   diagonals, then twice as far. Units are about half a card's width across
   and one card's height down. */
/* A FINGER IS NOT A MOUSE (Young's iPad, 4 Oct 2026: a contract's dot was
   too small to press, and a press that wobbled turned the map instead). On a
   coarse pointer each dot answers a press across IG_TAP_R_TOUCH (a 44px
   target, the touch guideline's), and a finger may wander IG_TAP_SLOP_TOUCH
   before its press becomes a turn. A mouse keeps its 8px and its 4px. */
const IG_TAP_R_TOUCH=22, IG_TAP_SLOP_TOUCH=12;
let _igCoarse=null;
function igTapCoarse(){ if(_igCoarse==null){ try{ _igCoarse=!!(window.matchMedia&&window.matchMedia('(pointer: coarse)').matches); }catch(_){ _igCoarse=false; } } return _igCoarse; }
const IGB_HUB_STEPS=Object.freeze([[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1],[0,2],[0,-2],[2,0],[-2,0],[2,1],[-2,1],[2,-1],[-2,-1],[0,3],[0,-3],[2,2],[-2,2],[2,-2],[-2,-2]].map(Object.freeze));
function igbSet(el,k,v){ if(el['_'+k]!==v){ el['_'+k]=v; el.setAttribute(k,v); } }
function igbShow(el,on){ const v=on?'':'none'; if(el._disp!==v){ el._disp=v; el.style.display=v; } }
function igbPlace(G){
  const w=igbCam().w, bw=igbCardW(w), W=G.W, H=G.H, placed=(G.reserve||[]).slice(), gap=2;
  /* the stage's own furniture — the view bar and the legend — is not a place
     for a card, and every group bubble is kept clear before any card is set */
  if(G.svg){ const sr=G.svg.getBoundingClientRect();
    [document.querySelector('#ig-gwrap .ig-viewbar'),document.getElementById('ig-legend')].forEach(el=>{ if(!el||el.hidden) return; const r=el.getBoundingClientRect(); if(r.width>0) placed.push({ x:r.left-sr.left, y:r.top-sr.top, w:r.width, h:r.height }); }); }
  G.hubs.forEach(h=>{ if(h._bubR>2&&h._bq) placed.push({ x:h._bq[0]-h._bubR, y:h._bq[1]-h._bubR, w:2*h._bubR, h:2*h._bubR }); });
  (G._bundles||[]).forEach(b=>{ if(b.r>2) placed.push({ x:b.x-b.r, y:b.y-b.r, w:2*b.r, h:2*b.r }); });
  const inside=A=>A.x>=2&&A.y>=2&&A.x+A.w<=W-2&&A.y+A.h<=H-2;
  const clash=A=>placed.some(B=>A.x<B.x+B.w+gap&&B.x<A.x+A.w+gap&&A.y<B.y+B.h+gap&&B.y<A.y+A.h+gap);
  const NR=igNamesRule();
  G.hubs.forEach(h=>{ const q=h.q, vis=(w[0]*igbClamp01((q[3]+.25)*2)+w[1])*bw*h.vis;
    if(vis<.08||!igHubNamed(h,NR)){ igbShow(h.g,false); h.box=null; return; }
    /* A card stays on the stage: near an edge it slides in rather than being
       cut off under the panel or the rail. */
    const at=(dx,dy)=>{ const A={ x:Math.max(4,Math.min(W-h.w-4,q[0]-h.w/2+dx)), y:Math.max(4,Math.min(H-h.h-4,q[1]-h.h/2+dy)), w:h.w, h:h.h }; return clash(A)?null:A; };
    /* CARDS NEVER COVER CARDS (Young, 4 Oct 2026: grouped by customer, forty
       cards piled into one unreadable heap). G.hubs is biggest group first, so
       the biggest groups keep their own spot; a later card steps aside to the
       nearest free place (IGB_HUB_STEPS), trying the place it held last frame
       second so a turning map does not make it jump about; a card with no
       free place is not drawn — its dots still speak on hover, the same rule
       the contracts' own labels follow. */
    let box=at(0,0);
    if(!box&&h._off) box=at(h._off[0],h._off[1]);
    if(!box) for(const [fx,fy] of IGB_HUB_STEPS){ const dx=fx*(h.w*.55+gap), dy=fy*(h.h+gap); box=at(dx,dy); if(box){ h._off=[dx,dy]; break; } }
    if(!box){ igbShow(h.g,false); h.box=null; return; }
    if(box.x===Math.max(4,Math.min(W-h.w-4,q[0]-h.w/2))&&box.y===Math.max(4,Math.min(H-h.h-4,q[1]-h.h/2))) h._off=null;
    igbShow(h.g,true);
    const x=box.x, y=box.y;
    h.box=box;
    igbSet(h.g,'transform',`translate(${Math.round(x)},${Math.round(y)})`);
    igbSet(h.card,'opacity',Math.min(1,vis).toFixed(2));
    placed.push(h.box); });
  const order=G.contracts.filter(n=>n._fold<.95).sort((a,b)=>((b._lit>=0)-(a._lit>=0))||((G.sel===b.id)-(G.sel===a.id))
    ||(b.g.classList.contains('hit')-a.g.classList.contains('hit'))||((!!b.badge)-(!!a.badge))||(b.q[3]-a.q[3]));
  G.contracts.forEach(n=>{ if(!(n._fold<.95)) igbShow(n.g,false); });
  order.forEach(n=>{
    const q=n.q, r=n._r||3; igbShow(n.g,true);
    igbSet(n.g,'transform',`translate(${Math.round(q[0])},${Math.round(q[1])})`);
    igbSet(n.hitEl,'r',String(Math.max(igTapCoarse()?IG_TAP_R_TOUCH:8,Math.round(r+4))));
    const quiet=n.g.classList.contains('mut')||n._fold>.5||n._a<.12||!igNameShows(n.id,NR);
    let at=null;
    if(!quiet){ const tw=n.tw, th=n.th;
      for(const [x,y] of [[r+6,-11],[-r-6-tw,-11],[-tw/2,-r-5-th],[-tw/2,r+5]]){ const A={ x:q[0]+x, y:q[1]+y, w:tw, h:th }; if(inside(A)&&!clash(A)){ at=[x,y,A]; break; } } }
    if(at){ placed.push(at[2]); igbShow(n.tag,true); igbShow(n.num,false); igbSet(n.tag,'transform',`translate(${Math.round(at[0])},${Math.round(at[1])})`);
      igbSet(n.tag,'opacity',Math.max(.4,Math.min(1,n._a)).toFixed(2)); igbPaintWalkNo(n); return; }
    igbShow(n.tag,false);
    let at2=null;
    if(!quiet){ const nw=n.nw, nh=11;
      for(const [x,y] of [[r+4,-5],[-r-4-nw,-5],[-nw/2,-r-3-nh],[-nw/2,r+3]]){ const A={ x:q[0]+x, y:q[1]+y, w:nw, h:nh }; if(inside(A)&&!clash(A)){ at2=[x,y,A]; break; } } }
    if(at2){ placed.push(at2[2]); igbShow(n.num,true); igbSet(n.num,'transform',`translate(${Math.round(at2[0])},${Math.round(at2[1])})`); igbSet(n.num,'opacity',Math.max(.4,Math.min(1,n._a)).toFixed(2)); }
    else igbShow(n.num,false);
  });
  /* A BUBBLE IS A DOOR TOO: pointing at it names the group (its title), a
     press opens the group again — so a bubble whose card stepped down or was
     hidden ("hide the names") is still something a reader can read and use. */
  igBubDoors(G);
  G.edges.forEach(e=>{ const s=e.s, t=e.t;
    const gone=x=>x.kind==='contract'?!(x._fold<.95):(x.g._disp==='none');
    if(gone(s)||gone(t)){ igbShow(e.el,false); return; }
    const hubEdge=s.kind==='hub'||t.kind==='hub';
    const a=hubEdge?bw*Math.min(s.kind==='hub'?s.vis:1,1)*(1-(t.hub?t.hub.fold:0)):1;
    if(a<.04){ igbShow(e.el,false); return; }
    igbShow(e.el,true); igbSet(e.el,'stroke-opacity',a.toFixed(2));
    const cen=x=>(x.kind==='hub'&&x.box)?[x.box.x+x.box.w/2,x.box.y+x.box.h/2]:x.q;
    const A=cen(s), B=cen(t);
    igbSet(e.el,'d',hubEdge?`M${A[0].toFixed(1)},${A[1].toFixed(1)} L${B[0].toFixed(1)},${B[1].toFixed(1)}`
      :`M${A[0].toFixed(1)},${A[1].toFixed(1)} Q${((A[0]+B[0])/2).toFixed(1)},${((A[1]+B[1])/2-24).toFixed(1)} ${B[0].toFixed(1)},${B[1].toFixed(1)}`); });
}
/* A walk-through numbers each contract it has reached, in its first line. */
function igbPaintWalkNo(n){ const k=n._lit, v=k>=0?(k+1)+'  ':''; if(n.walkNo&&n.walkNo._t!==v){ n.walkNo._t=v; n.walkNo.textContent=v; } }
/* PRESS A CARD TO FOLD IT: its contracts gather into it and the card says so.
   The only writer of a fold; per sitting, in memory. */
function igFoldHub(h,want){
  if(!h||h.kind!=='hub') return;
  h.folded=want==null?!h.folded:!!want;
  /* a fold a person pressed or asked for is a bubble (igHubBubbles) */
  (intel.folds||(intel.folds={}))[h.foldKey]=h.folded?IG_FOLD_BUBBLE:false;
  h.g.classList.toggle('folded',h.folded);
  if(h.chev) h.chev.setAttribute('d',h.folded?'M-2,-4 L2,0 L-2,4':'M-4,-2 L0,2 L4,-2');
  h.g.setAttribute('aria-expanded',h.folded?'false':'true');
  igPaintFoldAll();
}
function igFoldAll(){
  if(!IG||!IG.hubs) return;
  const fold=IG.hubs.some(h=>!h.folded);
  if(fold&&intel.walk) intel.walk=null;
  IG.hubs.forEach(h=>igFoldHub(h,fold));
  updateIntelNote();
}
function igPaintFoldAll(){
  const b=document.getElementById('ig-foldall'); if(!b||!IG||!IG.hubs) return;
  const t=i18t(IG.hubs.some(h=>!h.folded)?'int_fold_all':'int_open_all'); if(b.textContent!==t) b.textContent=t;
}
function igSetView(v){
  const cam=igbCam(); cam.view=Math.max(0,Math.min(IGB_NV-1,Number(v)||0));
  document.querySelectorAll('[data-ig-view]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.getAttribute('data-ig-view'))===cam.view)));
}
function igSetZoom(z){
  const cam=igbCam(); cam.zoom=Math.max(IGB_ZOOM_MIN,Math.min(IGB_ZOOM_MAX,Number(z)||1));
  const el=document.getElementById('ig-zv'); if(el) el.textContent=Math.round(cam.zoom*100)+'%';
}
/* A double-click faces the view again: the turn, the tilt and the zoom. */
/* TURNING / STILL — the Brain page's own button (its words and its mark),
   on the Explorer's bar: one press stops or starts the motion of every view. */
const IG_IC_TURN='<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><ellipse cx="8" cy="8" rx="6" ry="2.6"/><path d="M11.5 4.2l2 1.2-1.6 1.6"/></svg>';
function igbSpinning(){ const c=igbCam(); return c.spin==null?!igbReduced():!!c.spin; }
function igSpinLabel(){ return IG_IC_TURN+igEsc(i18t(igbSpinning()?'int_turning':'int_still')); }
function igSetSpin(on){
  igbCam().spin=!!on;
  const b=document.getElementById('ig-spin'); if(b){ b.innerHTML=igSpinLabel(); b.setAttribute('aria-pressed',String(!!on)); }
}
function igFaceAgain(){
  const cam=igbCam();
  if(cam.view===0){ cam.rot=-1.4; cam.tiltOff=0; } else if(cam.view===1){ cam.rotW=0; cam.tiltW=0; } else if(cam.view===2){ cam.rotL=0; cam.tiltL=0; }
  else if(cam.view===3){ cam.rotG=0; cam.tiltG=0; } else { cam.rotT=0; cam.tiltT=0; }
  igSetZoom(1);
}
/* THE SIDE FACING YOU FOLLOWS THE MOUSE, in every view — the Brain page's
   own rule (a drag to the right brings the left side round to the front). */
function igTurnBy(dx,dy){
  const cam=igbCam();
  if(cam.view===0){ cam.rot-=dx*.006; cam.tiltOff=Math.max(-.5,Math.min(.8,cam.tiltOff+dy*.004)); }
  else if(cam.view===1){ cam.rotW-=dx*.006; cam.tiltW=Math.max(-1.1,Math.min(1.1,cam.tiltW+dy*.004)); }
  else if(cam.view===2){ cam.rotL-=dx*.006; cam.tiltL=Math.max(-.3,Math.min(1.1,cam.tiltL+dy*.004)); }
  /* the grid and the timeline lie on the table: a sideways drag spins the
     table, an up-down drag tips it between looking straight down and
     looking along it */
  else if(cam.view===3){ cam.rotG-=dx*.006; cam.tiltG=Math.max(-.75,Math.min(.6,cam.tiltG+dy*.004)); }
  else { cam.rotT-=dx*.006; cam.tiltT=Math.max(-.7,Math.min(.65,cam.tiltT+dy*.004)); }
}

/* ---- the graph: the model's nodes as real elements, placed by the brain ---- */
function makeIntelGraph(model){
  const svg=document.getElementById('ig-svg'); if(!svg) return null;
  const gLinks=document.getElementById('ig-links'), gNodes=document.getElementById('ig-nodes'), vp=document.getElementById('ig-vp');
  gLinks.innerHTML=''; gNodes.innerHTML='';
  const W=svg.clientWidth||1000, H=svg.clientHeight||600;
  const nodes=model.nodes.map(n=>({...n})); const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
  const edges=model.edges.map(e=>({...e,s:byId[e.from],t:byId[e.to]})).filter(e=>e.s&&e.t);
  /* THE WIRING'S SEED: groups on a ring, contracts near their group — the
     force layout the map always had, which the Wiring view lays flat. */
  let seed=42; const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
  const hubs=nodes.filter(n=>n.kind==='hub');
  /* A-4: the renewal cliff is a TIMELINE, so its hubs seed on a line, in
     time order, left to right — a ring would put next year beside last
     quarter. Every other grouping keeps the ring. */
  if(model.linear){ const sorted=hubs.slice().sort((a,b)=>(a.order??99)-(b.order??99));
    sorted.forEach((h,i)=>{ h.x=W*(0.12+0.76*(sorted.length>1?i/(sorted.length-1):0.5)); h.y=H/2; h.vx=h.vy=0; h.timeline=true; }); }
  else hubs.forEach((h,i)=>{ const a=i/Math.max(1,hubs.length)*Math.PI*2; h.x=W/2+Math.cos(a)*Math.min(W,H)*0.28; h.y=H/2+Math.sin(a)*Math.min(W,H)*0.28; h.vx=h.vy=0; });
  nodes.filter(n=>n.kind==='contract').forEach(n=>{ const h=byId['hub:'+n.group]||{x:W/2,y:H/2}; n.x=h.x+(rnd()-.5)*120; n.y=h.y+(rnd()-.5)*120; n.vx=n.vy=0; });
  const adj={}; nodes.forEach(n=>adj[n.id]=new Set()); edges.forEach(e=>{ adj[e.from].add(e.to); adj[e.to].add(e.from); });
  const G={ svg, vp, nodes, edges, byId, adj, W, H, view:{x:0,y:0,k:1}, dragging:null, dragMoved:false, linear:!!model.linear, prev:IG,
    cv:document.getElementById('ig-cv'), ctx:null, sel:(IG&&IG.sel)||null, hover:null, turning:false };
  try{ G.ctx=G.cv&&G.cv.getContext?G.cv.getContext('2d'):null; }catch(_){ G.ctx=null; }
  igbLayout(G); G.prev=null;   // the old graph is read once, never held
  /* A LINK SAYS WHAT KIND OF LINK IT IS, in its own dress: a family edge is
     the solid accent, a chain edge dashed, a group edge the quiet line from a
     card to its contract. The class is the only carrier of the kind, so the
     legend and the line read the same rule; the width is the value's. */
  edges.forEach(e=>{ e.el=document.createElementNS(SVG_NS,'path'); e.el.setAttribute('class','ig-link'+(e.kind&&e.kind!=='group'?' ig-link-'+e.kind:'')); if(e.kind&&e.kind!=='group') e.el.setAttribute('data-ig-link',e.kind); if(e.w){ e.el.style.strokeWidth=e.w+'px'; e.el.setAttribute('data-ig-w',e.w); } gLinks.appendChild(e.el); });
  const kids=nodes.filter(n=>n.kind==='contract'), hubsFirst=nodes.filter(n=>n.kind==='hub');
  /* Contracts first, cards over them: a card is never hidden under a dot's words. */
  kids.concat(hubsFirst).forEach(n=>{
    const g=igbEl('g',{ class:'ig-node '+(n.kind==='hub'?'ig-hub':'ig-c')+(n.mut?' mut':'')+(n.hit?' hit':'') }); n.g=g;
    if(n.kind==='contract'){
      n.facts=n.c?graphNodeFactLine(n.c):[]; n.unread=!!(n.c&&graphNodeFacts(n.c).unread);
      if(n.unread) g.classList.add('unread');
      n._ph=(igbHash(n.id)%628)/100;
      /* The physics' footprint: about a label's size, so the wiring spaces
         its contracts for their words. */
      n.w=120; n.h=28;
      if(model.linear&&n.c){ const d=graphDecisionOf(n.c); if(d.date) g.setAttribute('data-ig-decision',d.date); }
      n.hitEl=igbEl('circle',{ class:'ig-dot-hit', r:10, cx:0, cy:0, fill:'transparent' },g);
      const ref=(window.contractRef?contractRef(n.c):n.id), name=igbTrim(n.label,24), money=igbMoneyOf(n.c);
      const tag=n.tag=igbEl('g',{ class:'ig-tag' },g);
      const chip=igbEl('rect',{ class:'ig-chip', x:-4, y:-2, rx:3, height:27 },tag);
      const l1=igbEl('text',{ class:'ig-lab', x:0, y:9 },tag);
      n.walkNo=igbEl('tspan',{ fill:'#FFFFFF' },l1);
      const r1=igbEl('tspan',{ 'font-weight':'700' },l1); r1.textContent=ref;
      const n1=igbEl('tspan',{},l1); n1.textContent='  '+name;
      const l2=igbEl('text',{ class:'ig-facts', x:0, y:21 },tag);
      let twoLen=money.length;
      const add=(txt,fill,k,bold)=>{ if(twoLen){ const sep=igbEl('tspan',{ fill:'#5E7C76' },l2); sep.textContent=' · '; twoLen+=3; }
        const sp=igbEl('tspan',{ fill },l2); if(k) sp.setAttribute('data-ig-fact',k); if(bold) sp.setAttribute('font-weight','700'); sp.textContent=txt; twoLen+=txt.length; };
      if(money){ const m=igbEl('tspan',{ fill:IGB_FACT_TONE.mute },l2); m.textContent=money; }
      /* A-1: THE SECOND LINE — Copilot's badge first (an outlier's reason, an
         annotation), else the reading the map is coloured by, else the
         contract's own facts, each in its own tone. */
      if(n.badge){ add(igbTrim(n.badge,40),IGB_FACT_TONE.amber,null,true); l2.lastChild.setAttribute('class','ig-badge-txt'); }
      else if(intel.labelBy&&GRAPH_GROUP_KEYS.includes(intel.labelBy)&&n.c) add(igbTrim(groupLabelOf(n.c,intel.labelBy,intel.labelBy===intel.groupBy?intel.groups:null),30),IGB_FACT_TONE.ink);
      else if(intel.colourBy&&intel.colourBy!=='status'&&GRAPH_GROUP_KEYS.includes(intel.colourBy)&&n.c) add(igbTrim(groupLabelOf(n.c,intel.colourBy,intel.colourBy===intel.groupBy?intel.groups:null),30),IGB_FACT_TONE.ink);
      else n.facts.slice(0,2).forEach(f=>add(f.text,IGB_FACT_TONE[f.tone]||IGB_FACT_TONE.ink,f.k,f.tone==='amber'||f.tone==='ruby'));
      n.tw=Math.min(IGB_LABEL_W+30,Math.max((ref.length+2+name.length)*5.7,twoLen*5.1))+10; n.th=27;
      chip.setAttribute('width',n.tw);
      n.num=igbEl('text',{ class:'ig-num', x:0, y:9 },g); n.num.textContent=ref; n.nw=ref.length*5.6+2;
      n.num.style.display='none'; n.num._disp='none';
    } else {
      const lines=(n.lines||[]);
      n.w=lines.length?220:176;
      let y=27; const ys=[];
      if(n.sub) y+=12;
      lines.forEach((l,i)=>ys.push(y+i*12));
      const share=n.party&&n.party.share!=null;
      n.h=(lines.length?ys[ys.length-1]:(n.sub?27:14))+(share?12:10);
      g.setAttribute('role','button'); g.setAttribute('tabindex','0'); g.setAttribute('aria-expanded',n.folded?'false':'true');
      if(n.folded) g.classList.add('folded');
      const card=n.card=igbEl('g',{ class:'ig-card' },g);
      igbEl('rect',{ class:'ig-chip', width:n.w, height:n.h, rx:4, stroke:n.col },card);
      igbEl('rect',{ x:1, y:1, width:3, height:n.h-2, fill:n.col, 'pointer-events':'none' },card);
      const lab=igbEl('text',{ class:'ig-lab', x:10, y:14 },card);
      /* Uppercase is the second distinguisher — colour alone is the one channel
         a reader might not have. */
      lab.textContent=igbTrim(String(n.label).toUpperCase(),n.w>200?30:24);
      n.chev=igbEl('path',{ class:'ig-fold', d:n.folded?'M-2,-4 L2,0 L-2,4':'M-4,-2 L0,2 L4,-2', transform:`translate(${n.w-12},10)`, fill:'none', stroke:'#CFE3DE', 'stroke-width':'1.4', 'pointer-events':'none' },card);
      if(n.sub){ const sub=igbEl('text',{ class:'ig-sub', x:10, y:27 },card);
        /* Inline, not an attribute: the stage's sheet sets every card line's ink,
           and a presentation attribute loses to any sheet rule. */
        if(n.crowded){ sub.style.fill=IGB_FACT_TONE.amber; sub.setAttribute('font-weight','700'); }
        sub.textContent=igbTrim(n.sub,34); }
      /* A-3 and A-5: a party card carries its lines and a share bar whose
         length is the party's share of the book; a stream card its money in,
         out and net, on paper. The renderer prints them and computes nothing. */
      n.lines&&n.lines.forEach((l,i)=>{ const t=typeof l==='string'?l:l.text, fill=(typeof l==='string'?null:l.fill);
        const ln=igbEl('text',{ class:'ig-sub ig-cp-line', 'data-ig-cp-line':i, x:10, y:ys[i], 'pointer-events':'none' },card);
        if(fill) ln.style.fill=igbCardTone(fill);
        if(n.flow) ln.setAttribute('data-ig-flow',i);
        ln.textContent=t.length>38?t.slice(0,37)+'…':t; });
      if(share){ const yb=(ys.length?ys[ys.length-1]:27)+5, bw=n.w-20;
        igbEl('rect',{ x:10, y:yb, width:bw, height:3, rx:1.5, fill:'rgba(143,181,173,.25)', 'pointer-events':'none' },card);
        igbEl('rect',{ class:'ig-cp-share', x:10, y:yb, width:Math.max(2,Math.round(bw*Math.min(1,n.party.share))), height:3, rx:1.5, fill:n.col, 'pointer-events':'none' },card); }
    }
    gNodes.appendChild(g);
    g.addEventListener('pointerenter',()=>{ if(IG&&!IG.turning){ IG.hover=n; igPaint(n); if(n.kind==='contract') igHoverShow(n); } });
    g.addEventListener('pointerleave',()=>{ if(IG){ IG.hover=null; if(!IG.turning){ igPaint(null); igHoverHide(); } } });
    g.addEventListener('click',e=>{ e.stopPropagation(); if(IG&&IG.dragMoved) return;
      /* A contract explains itself in the dock; a card FOLDS — a press on a
         group is never a filter (the owner, 28 Sep 2026). */
      if(n.kind==='contract') igExplain(n.id); else { igFoldHub(n); updateIntelNote(); } });
    if(n.kind==='hub') g.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); igFoldHub(n); } });
  });
  return G;
}
/* A card's line may name a token colour for its figure (teal in, amber out);
   on the dark card it wears the stage's own shade of the same meaning. */
function igbCardTone(fill){ const f=String(fill);
  if(/amber/.test(f)) return IGB_FACT_TONE.amber; if(/ruby|rose|red/.test(f)) return IGB_FACT_TONE.ruby;
  if(/green/.test(f)) return IGB_STATUS_COL.Signed; return '#CFE3DE'; }
// hover-focus: light the node and its connections, dim the rest
function igPaint(focus){
  if(!IG) return;
  if(!focus){ IG.nodes.forEach(n=>n.g.classList.remove('hi','dim'));
    IG.edges.forEach(e=>e.el.classList.remove('hi','dim')); return; }
  const near=IG.adj[focus.id]||new Set();
  IG.nodes.forEach(n=>{ const on=n.id===focus.id||near.has(n.id); n.g.classList.toggle('hi',n.id===focus.id); n.g.classList.toggle('dim',!on); });
  IG.edges.forEach(e=>{ const on=e.from===focus.id||e.to===focus.id; e.el.classList.toggle('hi',on); e.el.classList.toggle('dim',!on); });
}
// two-way linking: light up an explicit set of contract ids (hover from the dock)
function igPaintIds(ids){
  if(!IG) return;
  if(!ids||!ids.length){ igPaint(null); return; }
  const set=ids instanceof Set?ids:new Set(ids);
  IG.nodes.forEach(n=>{ const on=set.has(n.id)||(n.kind==='hub'&&[...(IG.adj[n.id]||[])].some(id=>set.has(id)));
    n.g.classList.toggle('hi',set.has(n.id)); n.g.classList.toggle('dim',!on); });
  IG.edges.forEach(e=>{ const on=set.has(e.to)||set.has(e.from);
    e.el.classList.toggle('hi',on); e.el.classList.toggle('dim',!on); });
}
// node click -> explain the contract inside the dock (Open workspace is the secondary action)
function igExplain(id){
  const c=getContract(id); if(!c) return;
  if(IG) IG.sel=id;
  if(!intel.dockOpen){ intel.dockOpen=true; igSyncDockWidth(); }
  intel.history.push({role:'assistant', explainId:id});
  renderIntelDock(); igPaintIds([id]);
  // Layer a real Copilot insight beneath the instant facts card (no-op if the
  // Copilot engine isn't configured — the facts card still stands on its own).
  intelAIExplain(id);
}
function igToWorld(cx,cy){ const r=IG.svg.getBoundingClientRect(); return {x:(cx-r.left-IG.view.x)/IG.view.k,y:(cy-r.top-IG.view.y)/IG.view.k}; }
function igApplyView(){ IG.vp.setAttribute('transform',`translate(${IG.view.x},${IG.view.y}) scale(${IG.view.k})`); }
/* FITTING IS MEASURING THE STAGE: the brain is drawn to the stage's own size
   every frame, so a fit reads the size and leaves the reader's turn and zoom
   alone. */
function igFitView(){
  if(!IG||!IG.svg) return;
  const r=IG.svg.getBoundingClientRect();
  if(r.width>0&&r.height>0){ IG.W=r.width; IG.H=r.height; }
  IG.view={x:0,y:0,k:1}; igApplyView();
}
function igTick(){
  const {nodes,edges,W,H}=IG;
  // ever-advancing clock → a tiny persistent drift so the wiring never freezes
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
    /* A-4: a timeline hub keeps its place in time — the physics may not shuffle
       next year to the left of this quarter. */
    if(n.timeline){ n.vx=0; n.vy=(H/2-n.y)*0.08; n.y+=n.vy; return; }
    // stable per-node phase (hash of id) → each node drifts on its own gentle orbit
    if(n._ph==null){ let h=0; const s=String(n.id||idx); for(let k=0;k<s.length;k++) h=(h*31+s.charCodeAt(k))>>>0; n._ph=(h%628)/100; }
    n.vx+=Math.cos(t+n._ph)*0.05; n.vy+=Math.sin(t*1.07+n._ph*1.3)*0.05;
    n.vx*=0.86;n.vy*=0.86; n.vx=Math.max(-35,Math.min(35,n.vx));n.vy=Math.max(-35,Math.min(35,n.vy)); n.x+=n.vx;n.y+=n.vy; });
}
/* ONE FRAME: time moves on, every node is projected once, the canvas paints,
   the words are placed. */
function igRender(){
  if(!IG) return;
  const now=((typeof performance!=='undefined'&&performance.now)?performance.now():Date.now())/1000;
  const dt=IG._last==null?0:Math.min(.05,Math.max(0,now-IG._last)); IG._last=now;
  if(IG.svg){ const r=IG.svg.getBoundingClientRect(); if(r.width>0&&r.height>0){ IG.W=r.width; IG.H=r.height; } }
  igbStep(IG,dt); igbWiring(IG);
  const w=igbCam().w; IG.pj=igbProjector(IG);
  IG.hubs.forEach(h=>{ h.q=IG.pj(igbHeart(h,w)); });
  IG.contracts.forEach(n=>{ n.q=IG.pj(igbMix(n,w)); });
  igbShade(IG); igbDraw(IG,now); igbPlace(IG);
}
function igClamp(n,dx,dy){ const hw=n.w/2+2,hh=n.h/2+2,sx=dx?hw/Math.abs(dx):1e9,sy=dy?hh/Math.abs(dy):1e9,s=Math.min(sx,sy); return {x:n.x+dx*s,y:n.y+dy*s}; }

/* C-1: THE CONTROL FOLLOWS THE MAP. The Group By dropdown is drawn by the
   page header and was never told when a typed command regrouped the map, so
   it went on saying "Value stream" over expiry hubs — the control and the
   caption disagreeing about what the product had done. Painted on every
   rebuild for a grouping the dropdown carries.
   ---- AND FOR COPILOT'S OWN (the owner's list, 27 Sep 2026) ----
   A Copilot grouping had no option, so the menu went on naming the reader's
   last pick over Copilot's hubs. It gets a row of its own while it is live,
   named as the caption names it (graphGroupingWord), and loses it after. */
function igPaintGroupSelect(){
  const sel=document.getElementById('ig-group'); if(!sel) return;
  const has=sel.querySelector('option[value="custom"]');
  if(intel.groupBy==='custom'){
    if(!has){ const o=document.createElement('option'); o.value='custom';
      o.textContent=graphGroupingWord('custom').replace(/^./,ch=>ch.toUpperCase()); sel.insertBefore(o, sel.firstChild); }
    sel.value='custom'; return;
  }
  if(has) has.remove();
  if(GRAPH_GROUP_KEYS.includes(intel.groupBy) && sel.value!==intel.groupBy) sel.value=intel.groupBy;
}
function rebuildIntelGraph(){
  const model=buildGraphModel();
  IG=makeIntelGraph(model); if(!IG) return;
  // pre-settle the wiring's physics
  for(let i=0;i<220;i++) igTick();
  igFitView(); igRender();
  updateIntelNote(); renderIntelLegend(model); igPaintGroupSelect(); igPaintFoldAll(); igSetView(igbCam().view);
  if(model.linear) igApplyCliff(Number(intel.cliffDays)||0);
}
function updateIntelNote(){
  const el=document.getElementById('ig-note'); if(!el) return;
  const on=intel.lenses.filter(l=>l.on);
  const act=intelActive();
  const gb=graphGroupingWord(intel.groupBy);   // C-1: the dropdown's own word, one list
  /* A-4: THE SCRUBBER lives on this line, beside the grouping it belongs to —
     a control on a strip that is already there, never a new one. Per sitting
     (intel.cliffDays), in memory; a stored cutoff would land a reader on a
     faded graph a week later with nothing saying why. */
  const cliff=(intel.groupBy==='decision'&&!intel.groups)?` <label class="ig-cliff" style="display:inline-flex;align-items:center;gap:8px;margin-left:14px;font-size:var(--t-meta);color:var(--color-neutral-600)">${i18t('int_cliff_label')}
      <input id="ig-cliff" type="range" min="0" max="${GRAPH_CLIFF_MAX_DAYS}" step="30" value="${Number(intel.cliffDays)||0}" aria-label="${i18t('int_cliff_label')}" style="width:160px;accent-color:var(--accent-solid)">
      <span id="ig-cliff-out" style="min-width:90px;color:var(--color-text)"></span></label>`:'';
  /* THE HEAD LINE SAYS WHAT THE MAP IS SHOWING (the brain drawing, 28 Sep
     2026): with Copilot the one way to narrow the map, this line is where the
     reader sees what was applied — how many of the book, grouped how, coloured
     and sized by what, and the walk-through's place — with one way back. */
  const total=igBookTotal();
  const shown=act.ids&&act.action==='filter'?act.ids.size:total;
  const bits=[];
  if(act.ids&&act.action==='filter') bits.push(`<b class="text-ink">${igEsc(i18t('int_did_showing',{ n:shown, t:total }))}</b>`);
  if(shown>INTEL_CAP) bits.push(`<b class="text-ink">${igEsc(i18t('int_map_capped',{ n:INTEL_CAP, t:shown }))}</b>`);
  bits.push(`${i18t('int_grouped_by')} <b class="text-ink">${gb}</b>`);
  if(on.length) bits.push(`<b class="text-brand-700">${on.map(l=>igEsc(l.label)).join(' ∩ ')}</b>${act.action==='filter'?'':` <span class="text-ink/40">${igEsc(i18t('int_did_highlighted',{ n:act.ids?act.ids.size:0, t:total }))}</span>`}`);
  igRecipeSays().forEach(x=>bits.push(igEsc(x)));
  const wk=intel.walk;
  if(wk){ const k=Math.max(0,Math.min(wk.ids.length,Math.floor((wk.clock-IGB_PULSE_S)/IGB_STEP_S)+1));
    bits.push(`<b class="text-ink">${igEsc(i18t('int_walking',{ k, n:wk.ids.length }))}</b> <button id="ig-walk-stop" type="button" class="ui-link">${i18t('int_walk_stop')}</button>`); }
  el.innerHTML = intel.busy ? `<span class="text-brand-700">${i18t('int_thinking')}</span>`
    : `<span class="text-ink/60">${bits.join(' · ')}</span>`
      + ((on.length||intel.groups||wk)?` <button id="ig-clear" type="button" class="ui-link" style="margin-left:6px">${i18t('int_clear_all_x')}</button>`:'')
      + ((intel.recipeStack||[]).length?` <button id="ig-undo" type="button" class="ui-link" style="margin-left:6px">${i18t('int_undo')}</button>`:'')
      + ((on.length||intel.groups||igRecipeSays().length||intel.groupBy!=='folder')?` <button id="ig-save" type="button" class="ui-link" style="margin-left:6px">${i18t('int_save_view')}</button>`:'')
      + cliff;
  document.getElementById('ig-clear')?.addEventListener('click',()=>{ igShowEverything(); });
  document.getElementById('ig-walk-stop')?.addEventListener('click',()=>{ intel.walk=null; updateIntelNote(); });
  document.getElementById('ig-undo')?.addEventListener('click',()=>{ igRecipeRun({ acts:[{ undo:true }] }); renderIntelDock(); updateIntelNote(); });
  document.getElementById('ig-save')?.addEventListener('click',()=>{ igRecipeRun({ acts:[{ save:'' }] }); renderIntelDock(); });
  document.getElementById('ig-cliff')?.addEventListener('input',e=>{ intel.cliffDays=Number(e.target.value)||0; igApplyCliff(intel.cliffDays); });
  igNoteMeasure();
}
/* Where the head line sits on the stage, in the stage's own pixels — read once
   per repaint of the line (and on a resize), never per frame. */
function igNoteMeasure(){
  const el=document.getElementById('ig-note'), st=document.getElementById('ig-gwrap'); if(!IG) return;
  if(!el||!st||!el.childNodes.length){ IG.noteBox=null; return; }
  const a=el.getBoundingClientRect(), b=st.getBoundingClientRect();
  IG.noteBox={ x:a.left-b.left-4, y:a.top-b.top-4, w:a.width+8, h:a.height+8 };
}
/* SHOW EVERYTHING: every cut Copilot made comes off, its grouping with it, and
   a walk-through stops. The colour and the size stay — they narrow nothing. */
function igShowEverything(){ igRecipePush(); intel.lenses=[]; intel.groups=null; intel.walk=null; rebuildIntelGraph(); renderIntelDock(); }
function renderIntelLegend(model){
  const el=document.getElementById('ig-legend'); if(!el) return;
  /* THE LEGEND FOLDS TO ITS HEAD (owner-asked 11 Sep 2026): it sits over the
     graph's own corner, and a reader who knows the colours wants the corner
     back. A class flip and a per-sitting flag, never a repaint of the graph —
     the head row is the control, the chevron says which way it goes, and the
     sheet hides everything under it. Nothing is stored: a legend that came
     back folded a week later would hide the key to a graph the reader had not
     seen since.
     ---- A KEY, NOT A DOOR (the brain drawing, 28 Sep 2026) ----
     "remove all these filters. the idea is the filters should come from asking
     a question in copilot." The status rows used to filter the map when
     pressed; they now only say what each colour means, and they follow the
     colour Copilot was asked for. Narrowing the map is Copilot's alone. */
  el.classList.toggle('is-folded', !!intel.legendFolded);
  const row=(attrs,col,label)=>`<div ${attrs} class="igl-row"><span class="igl-sw" style="background:${col}"></span>${igEsc(label)}</div>`;
  const G=IG&&IG.colourRows?IG:null;
  const colourKey=G?G.colourKey:'status';
  let html=`<div data-ig-legend-head class="igl-head"><span class="igl-k">${i18t('int_legend')}</span><button type="button" data-ig-legend-fold aria-expanded="${intel.legendFolded?'false':'true'}" title="${i18t(intel.legendFolded?'int_legend_show':'int_legend_hide')}" aria-label="${i18t(intel.legendFolded?'int_legend_show':'int_legend_hide')}" class="ui-btn ui-btn-plain ui-btn-sm ui-btn-icon">${icon(intel.legendFolded?'chevR':'chevD','w-3.5 h-3.5')}</button></div>`;
  if(colourKey==='status'){
    html+=`<div class="igl-k">${i18t('int_status_click')}</div>`+
      IGB_FLOOR_STATUS.map(k=>row(`data-igstatus="${k}"`,IGB_STATUS_COL[k],igbStatusWord(k))).join('');
  } else {
    const rows=G.colourRows, max=10;
    html+=`<div class="igl-k">${igEsc(i18t('int_colour_legend',{ x:graphGroupingWord(colourKey) }))}</div>`+
      rows.slice(0,max).map(r=>row(`data-ig-colour="${igEsc(r.k)}"`,r.col,r.label)).join('')+
      (rows.length>max?`<div class="igl-row igl-more">+${rows.length-max}</div>`:'');
  }
  /* A-5: the money legend — teal in, amber out — and one sentence naming what
     the figures left out, drawn only where something was. Every hub already
     says "on paper"; the legend's own sentence about it ("what the paper says,
     not what was invoiced") was RETIRED 11 Sep 2026, owner-asked — the hub
     carries the fact and the sentence was the same fact a second time.
     Its dictionary key (the paper-note one) is inert in both books. */
  if(model&&model.flow){
    const F=Object.values(model.flow); const miss=F.reduce((a,S)=>a+Object.values(S.missing||{}).reduce((x,y)=>x+y,0),0), uns=F.reduce((a,S)=>a+(S.unsided||0),0);
    html+=`<div class="igl-k igl-gap">${i18t('int_flow_legend')}</div>
      <div data-ig-legend-flow="in" class="igl-row"><span class="igl-sw" style="background:#38CDB8"></span>${i18t('int_flow_in_word')}</div>
      <div data-ig-legend-flow="out" class="igl-row"><span class="igl-sw" style="background:${IGB_FACT_TONE.amber}"></span>${i18t('int_flow_out_word')}</div>
      ${(miss||uns)?`<div data-ig-legend-flow="left" class="igl-row igl-note">${i18t('int_flow_left_out',{m:miss,u:uns})}</div>`:''}`;
  }
  /* THE LINK KINDS ON THIS PAGE, and only those: a row for a line that is not
     drawn is furniture. Each swatch is the line's own class, so the legend
     cannot describe a dress the graph does not wear. */
  const kinds=(model&&model.edgeKinds)||[];
  if(kinds.length){
    const word={family:'int_link_family',chain:'int_link_chain',party:'int_link_party'};
    html+=`<div class="igl-k igl-gap">${i18t('int_links')}</div>`+
      kinds.map(k=>`<div data-ig-legend-link="${k}" class="igl-row"><svg width="22" height="8" aria-hidden="true"><path class="ig-link ig-link-${k}" d="M1,4 L21,4" style="opacity:1"></path></svg>${i18t(word[k])}</div>`).join('');
  }
  el.innerHTML=html;
  el.querySelector('[data-ig-legend-fold]')?.addEventListener('click',()=>{ intel.legendFolded=!intel.legendFolded; renderIntelLegend(model); });
}

const IG_SUGGESTIONS=[
  'Divide the floors by payment terms',
  'Which contracts have potentially risky or unlawful clauses?',
  'Summarize my highest-value contract',
  'What does MK-101 say about liability?',
  'Compare my two highest-value contracts',
  'Which contracts end in the next 6 months?',
  'Group by customer',
];
/* A FILTER ON THIS PAGE KEEPS THE READER'S PLACE; A TAB DOES NOT, and that is
   the rule rather than an oversight. Switching tab puts entirely different
   content on screen, so a remembered offset would drop the reader at an
   arbitrary point in it — the rule keepScroll states says a press that
   NAVIGATES may land at the top. Filtering and paging redraw the same reading
   and must not move anybody, so those presses come through here. */
function intelRepaint(){
  if(typeof window!=='undefined' && typeof window.keepScroll==='function') keepScroll(renderIntel);
  else renderIntel();
}
function renderIntel(){
  intelRAF++; const myRAF=intelRAF;
  /* Two surfaces under one nav item: the graph, and the negotiation-friction
     read of the same portfolio. The tab lives on the module state so a
     repaint comes back where the reader was. */
  /* Four surfaces under one nav item. The frame is first and is the default:
     it is the overview every business gets, and the other three are the
     specific questions you go on to ask — where deals get stuck, where
     promises go quiet, and how the book hangs together.

     IT IS ONE LIST AND THE TAB ROW READS IT, so a fifth surface is a name
     added HERE and nowhere else. Written as a bare array beside the row, this
     whitelist silently sent every press of a new tab back to the frame: the
     button drew, the press registered, the page redrew the overview, and
     nothing anywhere said why. f247 asserts the row and the guard hold the
     same names in the same order. */
  /* ---- THE MAP IS DRAWN ON HOME (Young ruled 3 Oct 2026) ----
     On Home this same page draws with Home's head row in place of the tabs,
     the board laid over the stage (js/views/homeboard.js), and the map built
     only while its side is showing. A door on Insights still naming the map
     is sent to Home's Explorer side rather than drawing it here. */
  const onHome = state.view==='dashboard' && typeof window.hbHeadHtml==='function';
  if(!onHome && intel.tab==='map' && typeof window.hbOpenExplorer==='function'){ intel.tab=IG_TABS[0]; hbOpenExplorer(); return; }
  if(!onHome && IG_TABS.indexOf(intel.tab)<0) intel.tab=IG_TABS[0];
  const groupOpts=GRAPH_GROUPINGS.map(g=>[g.k,g.label]);   // C-1: ONE list — the tool's enum mirrors it
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
  const UNDERTAB='border:0;border-radius:var(--radius);background:none;margin-bottom:-1px;padding:10px 1px;font:inherit;cursor:pointer;display:flex;align-items:center';
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
  /* 20 Sep 2026 (the redesign order, design only): the same values every tab
     row wears now — secondary ink at label weight resting, the page ink at
     strong weight live, over the accent rule; `.on` marks the live one. */
  const tabBtn=(k,label)=>`<button data-ig-tab="${k}" class="${intel.tab===k?'on':''}" style="${UNDERTAB};border-bottom:2px solid ${intel.tab===k?'var(--accent-solid,var(--color-accent))':'transparent'};font-size:var(--t-body);font-weight:${intel.tab===k?'var(--w-strong)':'var(--w-label)'};color:${intel.tab===k?'var(--color-text)':'var(--color-neutral-600)'}">${label}</button>`;
  const tabsHtml=`<div style="${TABROW};gap:20px">${IG_TABS.map(k=>tabBtn(k,i18t(IG_TAB_LABEL[k]))).join('')}</div>`;
  /* The friction levers live IN the header strip (the approved comp): the
     period toggle and the counterparty select sit beside the tabs, so the
     panel below is all answer and no chrome. */
  const ff=intel.frictionFilter||null;
  /* The counterparty SELECT has gone. Filtering by counterparty is still live —
     it is done by clicking a name in the report itself (data-igf-cp), and Clear
     below still lifts it — so the strip carries one lever, not two. */
  const ffOn=days=>days==null?!(ff&&ff.days):(ff&&ff.days)===days;
  const ffSeg=(days,label)=>`<button data-igf-days="${days==null?'':days}" class="${ffOn(days)?'on':''}" style="${UNDERTAB};border-bottom:2px solid ${ffOn(days)?'var(--accent-solid,var(--color-accent))':'transparent'};font-size:var(--t-meta);font-weight:${ffOn(days)?'var(--w-strong)':'var(--w-label)'};color:${ffOn(days)?'var(--color-text)':'var(--color-neutral-600)'}">${label}</button>`;
  const frictionControls=`
      <div style="${TABROW};gap:var(--s-4)">${ffSeg(null,i18t('int_all_time'))}${ffSeg(90,i18t('int_last_90'))}</div>
      ${ff&&(ff.counterparty||ff.days||ff.clause)?`<button id="ig-friction-clear" type="button" class="ui-link" style="flex:none">${icon('x','w-3.5 h-3.5')}Clear</button>`:''}`;
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
  /* THE GROUP-BY SELECT, one builder for both heads that carry it — the map's
     wiring asks for #ig-group by id wherever the map is drawn. */
  const groupSel=`<span style="position:relative;display:inline-flex;align-items:center">
          <select id="ig-group" style="appearance:none;-webkit-appearance:none;-moz-appearance:none;border:1.5px solid var(--color-accent);background:var(--st-steel-bg);color:var(--st-steel-fg);font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-body);letter-spacing:0;text-transform:none;padding:5px 26px 5px 11px;border-radius:var(--radius);cursor:pointer;outline:none">
            ${''/* Copilot's own grouping gets its row here too — see igPaintGroupSelect. */}
            ${intel.groupBy==='custom'?`<option value="custom" selected>${graphGroupingWord('custom').replace(/^./,ch=>ch.toUpperCase())}</option>`:''}
            ${groupOpts.map(([k,l])=>`<option value="${k}" ${intel.groupBy===k?'selected':''}>${l}</option>`).join('')}
          </select>
          <span style="position:absolute;right:9px;pointer-events:none;color:var(--color-accent);font-size:var(--t-figure)">▼</span>
        </span>`;
  const headerHtml=onHome ? hbHeadHtml(groupSel) : headStyle+`
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
    <header id="ig-head" style="flex:none;display:flex;align-items:center;gap:0 14px;padding:0 var(--s-4);background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
      ${tabsHtml}
      ${''/* ════ THE MAP'S CAPTION IS GONE (Young ruled it 19 Sep 2026) ════
             "Remove this highlighted wording." It was a page explaining itself
             under its own title, which is the one thing this product's own
             standing rule forbids everywhere else — and it was hard-coded
             English, so it read the same in Svenska. The panel beside it says
             what it can do; the map shows the contracts.
             WHAT GOES WITH IT, said out loud: the total count was on that line
             and nowhere else on the screen (the legend counts each cluster,
             not the book). The owner was offered the count on its own and took
             the whole line. `.ig-hd-sub`'s under-899px rule in index.html goes
             with it. */}
      <span style="flex:1"></span>
      ${intel.tab==='friction'?frictionControls:''}
      ${intel.tab==='map'?`<label style="display:flex;align-items:center;gap:var(--s-2);font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-600);flex:none">Group by
        ${groupSel}
      </label>`:''}
    </header>`;
  if(!onHome&&intel.tab==='frame'){
    /* Same shell as the friction tab: header strip, then one scrolling body.
       The frame carries no header levers of its own — its controls are the
       panels themselves. */
    document.getElementById('content').innerHTML=`
    <div class="view-enter" style="height:var(--view-h);display:flex;flex-direction:column;min-height:0">
      ${headerHtml}
      <div id="ig-frame" class="scroll-thin pf-scroll igx-host">${
        (typeof portfolioFrameHtml==='function')?portfolioFrameHtml():''}</div>
    </div>`;
    document.querySelectorAll('[data-ig-tab]').forEach(b=>b.addEventListener('click',()=>{ intel.tab=b.getAttribute('data-ig-tab'); renderIntel(); }));
    if(typeof wirePortfolioFrame==='function') wirePortfolioFrame(renderIntel);
    return;
  }
  if(!onHome&&intel.tab==='friction'){
    /* THE CONTROL TOWER — full width, no pinned Copilot. The dock stays on
       Explorer (the map tab), where its questions drive the map; here the levers
       are real controls on the page, and free-form probing goes through the
       regular Copilot launcher, whose snapshot carries these same KPIs. */
    document.getElementById('content').innerHTML=`
    <div class="view-enter" style="height:var(--view-h);display:flex;flex-direction:column;min-height:0">
      ${headerHtml}
      <div id="ig-friction" class="scroll-thin igx-host">${intelFrictionHtml()}</div>
    </div>`;
    document.querySelectorAll('[data-ig-tab]').forEach(b=>b.addEventListener('click',()=>{ intel.tab=b.getAttribute('data-ig-tab'); renderIntel(); }));
    document.getElementById('ig-friction-clear')?.addEventListener('click',()=>{ intel.frictionFilter=null; intelRepaint(); });
    document.querySelectorAll('[data-igf-days]').forEach(b=>b.addEventListener('click',()=>{
      const v=b.getAttribute('data-igf-days');
      intel.frictionFilter={...(intel.frictionFilter||{}), days:v?Number(v):null};
      if(!intel.frictionFilter.days) delete intel.frictionFilter.days;
      if(!Object.keys(intel.frictionFilter).length) intel.frictionFilter=null;
      intelRepaint();
    }));
    /* The ledger's own doors (Clause Ledger, 28 Sep 2026): a lens, a row, a
       figure, Our standards, a negotiation, a counterparty to hold the page
       to. ONE delegated listener on the scroller — the ledger repaints under
       it on every press. Copilot's read keeps its own two ids, as before. */
    intelFrictionWire(document.getElementById('ig-friction'));
    intelFrictionWireAI();
    setActiveNav('intel');
    return;
  }
  if(!onHome&&intel.tab==='obligations'){
    /* THE SAME SHELL AS THE FRICTION TAB — header strip, then one scrolling
       body. This page carries no header levers of its own and that is
       deliberate: every number on it is a count of the whole live book, and a
       filter would put a narrowed figure under a heading that claims to be
       about the portfolio. */
    document.getElementById('content').innerHTML=`
    <div class="view-enter" style="height:var(--view-h);display:flex;flex-direction:column;min-height:0">
      ${headerHtml}
      <div id="ig-oblig" class="scroll-thin igx-host">${intelObligationsHtml()}</div>
    </div>`;
    intelObligationsWire(document.getElementById('ig-oblig'));
    document.querySelectorAll('[data-ig-tab]').forEach(b=>b.addEventListener('click',()=>{ intel.tab=b.getAttribute('data-ig-tab'); renderIntel(); }));
    setActiveNav('intel');
    return;
  }
  if(!onHome&&intel.tab==='exposure'){
    /* THE SAME SHELL as the two tabs above it — header strip, then one
       scrolling body, and no header levers of its own: every figure on it
       counts the whole live book, and a filter would put a narrowed number
       under a heading that claims to be about the portfolio. */
    document.getElementById('content').innerHTML=`
    <div class="view-enter" style="height:var(--view-h);display:flex;flex-direction:column;min-height:0">
      ${headerHtml}
      <div id="ig-exp-body" class="scroll-thin igx-host">${exposureHtml()}</div>
    </div>`;
    document.querySelectorAll('[data-ig-tab]').forEach(b=>b.addEventListener('click',()=>{ intel.tab=b.getAttribute('data-ig-tab'); renderIntel(); }));
    exposureWire();
    setActiveNav('intel');
    return;
  }
  if(!onHome&&intel.tab==='payterms'){
    /* THE SAME SHELL AS THE OBLIGATIONS TAB — header strip, then one scrolling
       body, and no header levers of its own for the same reason: every figure
       on it counts the whole live book, and a filter would put a narrowed
       number under a heading that claims to be about the portfolio. */
    document.getElementById('content').innerHTML=`
    <div class="view-enter" style="height:var(--view-h);display:flex;flex-direction:column;min-height:0">
      ${headerHtml}
      <div id="ig-pt-body" class="scroll-thin igx-host">${intelPayTermsHtml()}</div>
    </div>`;
    document.querySelectorAll('[data-ig-tab]').forEach(b=>b.addEventListener('click',()=>{ intel.tab=b.getAttribute('data-ig-tab'); renderIntel(); }));
    ptWire();
    setActiveNav('intel');
    return;
  }
  /* AN ARRIVAL FOLDS THE LEGEND; A REPAINT DOES NOT (27 Sep 2026). The map
     already on screen is the tell: a press on the tab from another tab, or the
     page reached from elsewhere, replaces a #content that holds no map, while a
     repaint of this tab (a language change, the rail door pressed while here)
     replaces the map itself and keeps the reader's choice. */
  if(!document.getElementById('ig-svg')) intel.legendFolded=true;
  const mapNow = !onHome || (typeof hbFace==='function' && hbFace()==='explorer');
  /* ANALYZE CONTRACT (26 Sep 2026): the left column is a strip over a stage.
     The strip (#ig-strip) is drawn only once a contract has been analyzed and
     carries the Graph | Paper switch; the stage (#ig-gwrap) holds the graph
     exactly as before, and the paper (#ig-paper) COVERS it — never replaces
     it — so the nodes' layout, physics and fit survive a reader looking at
     the paper. Both are painted by igPaintPaper. */
  document.getElementById('content').innerHTML = `
  <div id="ig-page" class="view-enter" style="height:var(--view-h);display:flex;flex-direction:column;min-height:0">
    ${headerHtml}
    <div id="ig-row" class="relative flex-1 min-h-0 bg-canvas flex" style="flex:1;min-height:0;display:flex;position:relative;background:var(--color-bg)">
      <div ${onHome?'id="hb-col" ':''}class="relative flex-1 min-w-0" style="flex:1;min-width:0;position:relative;display:flex;flex-direction:column">
        <div id="ig-strip" class="ig-strip" hidden></div>
        <div id="ig-gwrap" class="ig-brain" style="flex:1;min-height:0;position:relative">
        <canvas id="ig-cv" aria-hidden="true"></canvas>
        <svg id="ig-svg" class="w-full h-full block" style="width:100%;height:100%;display:block"><g id="ig-vp"><g id="ig-links"></g><g id="ig-nodes"></g></g></svg>
        <div id="ig-legend" class="igl"></div>
        ${''/* THE HEAD LINE RIDES THE STAGE (Young, 29 Sep 2026: "remove the space
               in the highlighted area and give it to the dark screen"). It was a
               row of its own between the tabs and the map; it now sits in the
               stage's top-left corner the way the legend and the view bar sit in
               theirs, and its row is the map's. */}
        <div id="ig-note" class="ig-note"></div>
        ${''/* THE VIEW BAR — the three views, the zoom and Fold all, in the
               stage's own corner where the old "drag nodes" hint sat. How to
               move the map is machinery, so it lives on the bar's hover. */}
        <div class="ig-viewbar" title="${igEsc(i18t('int_drag_nodes'))}">
          <div class="ig-seg" role="group" aria-label="${igEsc(i18t('int_view_label'))}">${IGB_VIEWS.map((v,i)=>`<button type="button" data-ig-view="${i}" aria-pressed="${igbCam().view===i}">${i18t(IGB_VIEW_WORD[v])}</button>`).join('')}</div>
          <div class="ig-seg"><button type="button" data-ig-zoom="out" aria-label="${igEsc(i18t('int_zoom_out'))}">${icon('minus','w-3.5 h-3.5')}</button><span id="ig-zv" class="ig-zv">${Math.round(igbCam().zoom*100)}%</span><button type="button" data-ig-zoom="in" aria-label="${igEsc(i18t('int_zoom_in'))}">${icon('plus','w-3.5 h-3.5')}</button></div>
          <div class="ig-seg"><button type="button" id="ig-spin" aria-pressed="${igbSpinning()}">${igSpinLabel()}</button></div>
          <div class="ig-seg"><button type="button" id="ig-foldall">${i18t('int_fold_all')}</button></div>
        </div>
        <div id="ig-paper" class="ig-paper" hidden></div>
        </div>
        ${onHome?`<div id="hb-board" class="hb-board scroll-thin"></div>
          <div id="hb-tools" class="hb-tools"></div><canvas id="hb-ink" class="hb-ink" aria-hidden="true"></canvas>
          <div id="hb-laser" class="hb-laser" hidden></div><div id="hb-laser-1" class="hb-laser is-trail" hidden></div><div id="hb-laser-2" class="hb-laser is-trail" hidden></div><div id="hb-laser-3" class="hb-laser is-trail" hidden></div>`:''}
      </div>
      <aside id="ig-dock" class="shrink-0 flex flex-col min-h-0 overflow-hidden" style="width:${igDockWidth()}px;background:var(--color-bg);border-left:1px solid var(--color-neutral-300);box-shadow:-10px 0 28px -20px rgba(43,43,45,.35);transition:width var(--dur-3) cubic-bezier(.22,.61,.36,1)"></aside>
      <div id="ig-resizer" class="ig-resizer" role="separator" aria-orientation="vertical" tabindex="0" aria-valuemin="${IG_DOCK_MIN}"
        aria-label="${igEsc(i18t('int_drag_width'))}" title="${igEsc(i18t('int_drag_width'))}"${intel.dockOpen?'':' hidden'}><span></span></div>
    </div>
  </div>`;

  renderIntelDock();
  igWireSplit();
  if(mapNow){ if(onHome) hbLensOnMap(); rebuildIntelGraph(); }
  igPaintPaper();
  // re-fit once layout settles so the fit uses the true viewport size
  requestAnimationFrame(()=>{ if(igMapUp()&&IG) igFitView(); });

  /* ---- TURN, ZOOM, FACE AGAIN (the brain drawing, 28 Sep 2026) ----
     A drag anywhere on the stage — on a dot or a card too — turns the view
     that is showing; a press that did not move is a press. The wheel and a
     pinch zoom, a double-click faces the view again. The move and release
     pair is armed ONCE, on the window (a render replaces the stage, and a
     pair bound per render stacked for the life of the sitting — the pan's
     own lesson); the pair reads the LIVE graph and the live flag. */
  const svg=document.getElementById('ig-svg');
  svg.addEventListener('wheel',e=>{ e.preventDefault(); if(!IG) return; igSetZoom(igbCam().zoom*(e.deltaY<0?1.08:1/1.08)); },{passive:false});
  /* ---- FINGERS (Young, 28 Sep 2026, on an iPad: "all pages in explore have
     the same issue with trying to rotate and spin the screen") ----
     Three things a mouse never does. (1) A finger whose lift the page never
     hears — a system gesture from the screen's edge takes it — stayed in the
     count, so every later one-finger drag was read as the second finger of a
     pinch and the map would not turn again until a reload: the FIRST finger
     of a new touch (isPrimary) now starts the count afresh. (2) Two fingers
     only zoomed; now they also turn — a twist spins the view, and moving both
     turns and tips it as one finger does. (3) Lifting one of two fingers left
     the other doing nothing; it now carries on turning. */
  svg.addEventListener('pointerdown',e=>{ if(!IG) return;
    const T=window._igTouch||(window._igTouch=new Map());
    if(e.pointerType==='touch'&&e.isPrimary) T.clear();
    T.set(e.pointerId,[e.clientX,e.clientY]);
    if(T.size>=2){ const [p,q]=[...T.values()]; window._igPinch={ d:Math.hypot(p[0]-q[0],p[1]-q[1])||1, z:igbCam().zoom, a:Math.atan2(q[1]-p[1],q[0]-p[0]), m:[(p[0]+q[0])/2,(p[1]+q[1])/2] }; window._igTurn=null; return; }
    window._igTurn={ x:e.clientX, y:e.clientY, moved:0, slop:(e.pointerType==='touch'||e.pointerType==='pen')?IG_TAP_SLOP_TOUCH:4 }; IG.dragMoved=false; });
  svg.addEventListener('dblclick',e=>{ e.preventDefault(); igFaceAgain(); });
  svg.addEventListener('dragstart',e=>e.preventDefault());
  /* Safari's own pinch would zoom the PAGE under the map (the stage's touch-action says the rest) */
  ['gesturestart','gesturechange'].forEach(k=>svg.addEventListener(k,e=>e.preventDefault(),{passive:false}));
  if(!window._igTurnWired){
    window._igTurnWired=true;
    window.addEventListener('pointermove',e=>{
      const T=window._igTouch; if(T&&T.has(e.pointerId)) T.set(e.pointerId,[e.clientX,e.clientY]);
      if(window._igPinch&&T&&T.size>=2){ const P=window._igPinch, [p,q]=[...T.values()];
        igSetZoom(P.z*Math.hypot(p[0]-q[0],p[1]-q[1])/P.d);
        const a=Math.atan2(q[1]-p[1],q[0]-p[0]), m=[(p[0]+q[0])/2,(p[1]+q[1])/2], da=Math.atan2(Math.sin(a-P.a),Math.cos(a-P.a));
        const dx=(m[0]-P.m[0])-da/IGB_TWIST, dy=m[1]-P.m[1]; P.a=a; P.m=m;
        if(IG&&(Math.abs(dx)+Math.abs(dy))>0){ if(!IG.turning){ IG.turning=true; IG.dragMoved=true; IG.hover=null; igPaint(null); igHoverHide(); IG.svg.classList.add('is-turning'); } igTurnBy(dx,dy); }
        return; }
      const d=window._igTurn; if(!d||!IG) return;
      const dx=e.clientX-d.x, dy=e.clientY-d.y; d.x=e.clientX; d.y=e.clientY; d.moved+=Math.abs(dx)+Math.abs(dy);
      /* A TURN LETS GO OF THE HOVER (Young, 29 Sep 2026: "they seem to get
         stuck"): a drag that began or ended over a contract left its hover
         light on and every other dot faded, so the map read as frozen while
         it was turning. The light goes when the turn starts. */
      if(d.moved>(d.slop||4)){ if(!IG.turning){ IG.turning=true; IG.dragMoved=true; IG.hover=null; igPaint(null); igHoverHide(); IG.svg.classList.add('is-turning'); } igTurnBy(dx,dy); }
    });
    const end=e=>{
      const T=window._igTouch; if(T&&e&&e.pointerId!=null) T.delete(e.pointerId); if(!T||T.size<2) window._igPinch=null;
      /* the finger still down carries on turning from where it is */
      if(T&&T.size===1&&e&&e.pointerType==='touch'){ const pt=[...T.values()][0]; window._igTurn={ x:pt[0], y:pt[1], moved:5 }; return; }
      window._igTurn=null;
      if(IG&&IG.turning){ IG.turning=false; IG.hover=null; igPaint(null); IG.svg.classList.remove('is-turning'); setTimeout(()=>{ if(IG) IG.dragMoved=false; },50); }
    };
    window.addEventListener('pointerup',end); window.addEventListener('pointercancel',end);
  }
  document.querySelectorAll('[data-ig-view]').forEach(b=>b.addEventListener('click',()=>igSetView(b.getAttribute('data-ig-view'))));
  document.querySelectorAll('[data-ig-zoom]').forEach(b=>b.addEventListener('click',()=>igSetZoom(igbCam().zoom*(b.getAttribute('data-ig-zoom')==='in'?IGB_ZOOM_STEP:1/IGB_ZOOM_STEP))));
  document.getElementById('ig-foldall')?.addEventListener('click',()=>igFoldAll());
  document.getElementById('ig-spin')?.addEventListener('click',()=>igSetSpin(!igbSpinning()));

  // controls
  /* Leaving Copilot's grouping takes its row away (igPaintGroupSelect, on the rebuild). */
  document.getElementById('ig-group').addEventListener('change',e=>{ intel.groupBy=e.target.value; intel.groups=null; rebuildIntelGraph(); });
  document.querySelectorAll('[data-ig-tab]').forEach(b=>b.addEventListener('click',()=>{ intel.tab=b.getAttribute('data-ig-tab'); renderIntel(); }));

  // animation loop (stops when leaving intel — or when the tab is not the map;
  // intelRAF was bumped at the top, so a tab switch retires this loop too)
  /* The physics only SHOWS on the Wiring view; elsewhere it idles at a
     quarter of the frames — enough to keep its drift alive for the moment the
     reader turns to the wiring, and a third of each frame back on a big book. */
  let _igF=0;
  (function loop(){ if(!igMapUp()||myRAF!==intelRAF||!IG) return;
    const cw=intel.cam&&intel.cam.w; if((cw&&cw[1]>.01)||(_igF++%4===0)) igTick();
    igRender(); requestAnimationFrame(loop); })();
  setActiveNav(onHome?'dashboard':'intel');
  if(onHome) hbAfterMount();
}

/* ============================================================
   NEGOTIATION FRICTION — where deals get stuck
   ============================================================
   Every number here is COUNTED from the fingerprinted change records the
   negotiations already store — no new collection, no model, no estimate.
   A clause "contested" in a deal means at least one tracked change was
   filed against it there, in any round, by either side. */
/* ---- THE REPORT HAS ONE HOUSE STYLE, WHATEVER THE CONTRACTS UNDER IT DO ----
   (owner-asked 26 Aug 2026: "although the contracts may have capital letters
   for the headers, in the analytics report make sure it conforms to uniformity
   and have proper grammar. Not all caps.")

   A clause name here is the CONTRACT'S own heading, printed back — so one chart
   carried "SPECIFICATIONS, QUALITY & INSPECT..." beside "Delivery Information"
   and read as a rendering fault rather than as two contracts drafted by two
   firms. Title Case is the one style this page prints in, always, and it does
   not follow the paper: a report comparing eight agreements has to have a
   voice of its own or every row shouts as loudly as its author did.

   IT CHANGES WHAT IS PRINTED AND NOTHING ELSE. No contract is rewritten, no
   heading on any paper moves, and the case machinery is clausemodel's — the
   same reading a clause added to a document asks, from the other direction.
   Reached through window because a stage without that module must fall back to
   the raw heading rather than throw: this is a chart label. */
const _igClauseName = s => {
  const t=String(s==null?'':s).replace(/\s+/g,' ').trim();
  if(!t) return '';
  /* clauseNameShown AND NOT clauseTitleCase, which is what this asked from
     26 Aug 2026 until 10 Sep and which did NOTHING to the labels on this page.
     MEASURED: "Clause 2 · SPECIFICATIONS, QUALITY & INSPECTION" came back
     unchanged. The reason is the acronym rule reading the WHOLE string — the
     word "Clause" carries a lowercase letter, so the name is not "shouting",
     so every capitalised word after it is read as an acronym somebody typed
     and kept exactly. Right for a bare heading, wrong for a LABEL with a
     number in front of it, and a stamped clause name is always the second
     shape. clauseNameShown parses the number off first, which is the whole
     reason it exists. */
  try{ return window.clauseNameShown ? clauseNameShown(t)
    : (window.clauseTitleCase ? clauseTitleCase(t) : t); }catch(_){ return t; }
};
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
  /* THE CLAUSE LEDGER'S READINGS (owner-picked 28 Sep 2026). Plain counts off
     the same walk, collected BESIDE the old ones and never instead of them:
     every field this function returned before still means what it meant, so
     Copilot's snapshot, the health report and the Explorer's hub read on
     unchanged. Nothing new calls a name that initialises a negotiation — the
     walk below is the one it always was. */
  const dealRows=[]; const dealIds=[]; const daysIds=[]; const round1Ids=[];
  const clauseKey=lbl=>{ const k=_igClauseName(lbl||''); if(!k) return null;
    const label=k.length>44?k.slice(0,44):k; return {label, kk:label.toLowerCase()}; };
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
    const row={ id:c.id, name:String(c.name||c.id), cp:cpKey, round:rounds,
      signed:false, days:null, declined:c.status==='Declined',
      keys:new Set(), open:new Map() /* clause key → {label, ours, theirs}: refused and never withdrawn */ };
    dealRows.push(row); dealIds.push(c.id);
    if(c.execution&&c.execution.at){
      signed++; row.signed=true;
      if(((c.negotiation.rounds&&c.negotiation.rounds.length)||0)<=1){ signedRound1++; round1Ids.push(c.id); }
      if(c.negotiation.startedAt){
        const d=(new Date(c.execution.at)-new Date(c.negotiation.startedAt))/86400000;
        if(isFinite(d)&&d>=0){ days.push(d); row.days=d; daysIds.push(c.id); }
      }
    }
    const labels=new Set();
    for(const ch of all){
      if(!ch) continue;
      const k=_igClauseName(ch.clauseLabel||ch.headingText||'');
      if(k) labels.add(k.length>44?k.slice(0,44):k);
      const ours=ch.authorSide==='owner';
      /* The ledger's per-clause counts: how each side's asks ended on this
         clause, and what is refused and still open on it, deal by deal. The
         same definitions as the book-wide figures beside them (a refusal is a
         refusal whether or not it was later withdrawn; "still open" is one
         that was not), so a clause's bar and the book's tick are one ruler. */
      const ck=clauseKey(ch.clauseLabel||ch.headingText||'');
      if(ck){
        if(!per.has(ck.kk)) per.set(ck.kk,{label:ck.label,ids:new Set(),asks:{ours:{acc:0,rej:0},theirs:{acc:0,rej:0}}});
        const pe=per.get(ck.kk); row.keys.add(ck.kk);
        if(ch.status==='accepted') pe.asks[ours?'ours':'theirs'].acc++;
        if(ch.status==='rejected') pe.asks[ours?'ours':'theirs'].rej++;
      }
      if(ch.status==='rejected'&&!ch.withdrawn){
        const ok=ck?ck.kk:'';
        if(!row.open.has(ok)) row.open.set(ok,{label:ck?ck.label:'',ours:0,theirs:0});
        row.open.get(ok)[ours?'ours':'theirs']++;
      }
      if(ch.status==='accepted'){ ours?oursAcc++:theirsAcc++; if(ours) cp.acc++; }
      if(ch.status==='rejected'){
        ours?oursRej++:theirsRej++; if(ours) cp.rej++;
        if(!ch.withdrawn){ deadlocks++;
          /* Named, not just counted — "See the six" has to have six to show. */
          if(deadlockList.length<12) deadlockList.push({ id:c.id, name:String(c.name||(window.contractRef?contractRef(c):c.id)),
            clause:(_igClauseName(ch.clauseLabel||ch.headingText||'')||'a clause').slice(0,60) });
        }
      }
      if((ch.status==='accepted'||ch.status==='rejected')&&ch.resolvedAt&&ch.createdAt){
        const ms=new Date(ch.resolvedAt)-new Date(ch.createdAt);
        if(isFinite(ms)&&ms>=0) decideMs.push(ms);
      }
    }
    for(const k of labels){
      /* KEYED WITHOUT ITS CASE, so one clause is one row. Two contracts writing
         "PAYMENT TERMS" and "Payment terms" are arguing about the same clause,
         and counting them as two halves the figure this chart exists to show.
         The LABEL is the report's own spelling of it, so whichever arrived
         first the row reads the same. */
      const kk=k.toLowerCase();
      if(!per.has(kk)) per.set(kk,{label:k,ids:new Set(),asks:{ours:{acc:0,rej:0},theirs:{acc:0,rej:0}}});
      per.get(kk).ids.add(c.id);
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
  const out={ deals, openedThisMonth, avgRounds: deals?roundsSum/deals:0,
    avgDays: days.length?avg(days):null, medianDays: median(days),
    oursAcceptShare:(oursAcc+oursRej)?oursAcc/(oursAcc+oursRej):null,
    theirsAcceptShare:(theirsAcc+theirsRej)?theirsAcc/(theirsAcc+theirsRej):null,
    deadlocks, deadlockList, medianDecisionMs:median(decideMs),
    round1Share: signed?signedRound1/signed:null, signed,
    clauses: ranked, counterparties, slowest, insight };
  out.ledger=intelFrictionLedgerData({ per, cps, dealRows, dealRounds, ranked, avg,
    dealIds, daysIds, round1Ids, avgRounds:out.avgRounds, signedN:days.length });
  return out;
}
/* THE CLAUSE LEDGER, COUNTED (owner-picked 28 Sep 2026, "Clause Ledger").
   intelFrictionStats walks the book once and hands its tallies here; this
   shapes them into the three lists the page reads — clauses, counterparties,
   and the negotiations waiting on a decision — and the facts each detail
   prints. PLAIN COUNTS OFF THE TRACKED CHANGES, NO SCORE, and no drawing: the
   renderer prints what this returns and works nothing out of its own.
   THE CLAUSE LIST IS THE SAME EIGHT NAMES st.clauses CARRIES (the most
   contested), ordered here by the extra rounds they cost — so Copilot's
   snapshot, the health report and this page never disagree about which
   clauses are on it. */
function intelFrictionLedgerData(t){
  const { per, cps, dealRows, dealRounds, ranked, avg } = t;
  const byId=new Map(dealRows.map(r=>[r.id,r]));
  const cpDeals=new Map(); for(const r of dealRows) cpDeals.set(r.cp,(cpDeals.get(r.cp)||0)+1);
  const openSum=r=>{ let n=0; for(const o of r.open.values()) n+=o.ours+o.theirs; return n; };
  const noAsks=()=>({ours:{acc:0,rej:0},theirs:{acc:0,rej:0}});
  /* Waiting on a decision: every negotiation carrying a refused change nobody
     withdrew — the population the "refused, still open" figure counts, named
     in full rather than capped (deadlockList stops at twelve for the prompt). */
  const waiting=dealRows.filter(r=>r.open.size).map(r=>{
    let ours=0, theirs=0; for(const o of r.open.values()){ ours+=o.ours; theirs+=o.theirs; }
    return { id:r.id, name:r.name, cp:r.cp, round:r.round, n:ours+theirs,
      theyRefusedOurs:ours, weRefusedTheirs:theirs,
      byClause:[...r.open.values()].map(o=>({label:o.label, ours:o.ours, theirs:o.theirs, n:o.ours+o.theirs}))
        .sort((a,b)=>b.n-a.n) };
  }).sort((a,b)=>b.n-a.n||b.round-a.round);
  const clauses=ranked.map(cl=>{
    const kk=cl.label.toLowerCase(); const e=per.get(kk)||{ids:new Set(),asks:noAsks()};
    const withR=[], without=[];
    for(const [id,r] of dealRounds) (e.ids.has(id)?withR:without).push(r);
    const openDeals=dealRows.filter(r=>r.open.has(kk)).map(r=>{ const o=r.open.get(kk);
      return { id:r.id, name:r.name, cp:r.cp, round:r.round, n:o.ours+o.theirs }; }).sort((a,b)=>b.n-a.n);
    const byCp=new Map(); for(const id of e.ids){ const r=byId.get(id); if(r) byCp.set(r.cp,(byCp.get(r.cp)||0)+1); }
    const by=[...byCp].map(([name,n])=>({name, n, of:cpDeals.get(name)||n}))
      .sort((a,b)=>b.n/b.of-a.n/a.of||b.n-a.n||a.name.localeCompare(b.name));
    return { label:cl.label, n:cl.n, share:cl.share, extra:cl.extra,
      withAvg:withR.length?avg(withR):null, withoutAvg:without.length?avg(without):null,
      ours:{...e.asks.ours}, theirs:{...e.asks.theirs},
      open:openDeals.reduce((s,d)=>s+d.n,0), openDeals, by };
  }).sort((a,b)=>(b.extra==null?-1e9:b.extra)-(a.extra==null?-1e9:a.extra)||b.n-a.n);
  const listed=new Set(clauses.map(c=>c.label.toLowerCase()));
  const outside=new Map();
  for(const r of dealRows) for(const [kk,o] of r.open) if(!listed.has(kk)){
    const w=outside.get(kk)||{label:o.label,n:0}; w.n+=o.ours+o.theirs; outside.set(kk,w); }
  const allCps=[...cps.values()].map(cp=>{
    const rows=dealRows.filter(r=>r.cp===cp.name);
    const cls=new Map();
    for(const r of rows) for(const kk of r.keys){ const e=per.get(kk); if(!e) continue;
      cls.set(kk,{label:e.label, n:(cls.has(kk)?cls.get(kk).n:0)+1}); }
    return { name:cp.name, deals:cp.deals, avgRounds:cp.deals?cp.rounds/cp.deals:0,
      acceptUs:(cp.acc+cp.rej)?cp.acc/(cp.acc+cp.rej):null,
      open:rows.reduce((s,r)=>s+openSum(r),0),
      signedN:rows.filter(r=>r.signed).length,
      negotiations:rows.map(r=>({ id:r.id, name:r.name, round:r.round, signed:r.signed,
        declined:r.declined, days:r.days, open:openSum(r) }))
        .sort((a,b)=>(a.signed-b.signed)||b.round-a.round),
      clauses:[...cls.values()].sort((a,b)=>b.n-a.n||a.label.localeCompare(b.label)) };
  });
  /* The counterparty list reads as a PATTERN, so it is the parties with two or
     more negotiations — one slow deal is an anecdote (the slowest-counterparty
     rule this page has always had). A book with none of those shows them all. */
  const two=allCps.filter(cp=>cp.deals>=2);
  const cpPool=(two.length?two:allCps).sort((a,b)=>b.avgRounds-a.avgRounds||b.deals-a.deals);
  return { clauses, waiting, counterparties:cpPool.slice(0,8),
    cpsOne:two.length?allCps.length-two.length:0, cpsBeyond:Math.max(0,cpPool.length-8),
    openOutside:[...outside.values()].sort((a,b)=>b.n-a.n),
    dealIds:t.dealIds, signedIds:t.daysIds, round1Ids:t.round1Ids, signedN:t.signedN,
    avgRounds:t.avgRounds };
}
/* THE FRICTION PAGE IS A CLAUSE LEDGER (owner-picked 28 Sep 2026, "Clause
   Ledger", off the Insights design-options page; he said "build").

   REPLACES the 26 Aug brief — three written sentences on the left, the
   contested-clause bars and the counterparty table on the right, four KPI
   cards under the prose. Every fact that page carried stays: its figures are
   the strip across the top, its costliest clause is the first row of the
   clause list, its refused-and-open count is the amber figure, its slowest
   counterparty is the first row of the counterparty list. What went is the
   PROSE, which was hard-coded English and said three facts a reader then had
   to go and find.

   THE SHAPE: Copilot's read first and UNTOUCHED (the owner's one condition:
   "leave the copilot feature"); a strip of six figures, every one that has a
   list behind it a door onto that list; then ONE ranked list with a details
   panel beside it. The list reads by Clauses · Counterparties · Waiting on a
   decision; a press on a row fills the panel, and each panel carries the one
   door to where you ACT — Our standards, the negotiation, or the page held to
   a counterparty (the counterparty filter this page has always had).

   COUNTING IS NOT DRAWING: every number below comes off intelFrictionStats(f)
   and its .ledger (intelFrictionLedgerData). This function computes nothing
   but percentages and the order of what it was handed. */
const IGF_LED_LENSES=['clauses','cps','wait'];
/* Which list and which row, per sitting and in memory — like every other cut
   on this page. Keyed by the row's own identity (the clause's name, the
   counterparty's, the contract's id), never by position, so a filter that
   re-ranks the list keeps the reader on the thing they picked, and a row that
   left the list falls back to the first one. */
function intelFrictionLedgerState(){
  if(!intel.frictionLedger||typeof intel.frictionLedger!=='object')
    intel.frictionLedger={ lens:'clauses', sel:{ clauses:null, cps:null, wait:null } };
  const s=intel.frictionLedger;
  if(!IGF_LED_LENSES.includes(s.lens)) s.lens='clauses';
  if(!s.sel||typeof s.sel!=='object') s.sel={ clauses:null, cps:null, wait:null };
  return s;
}
const _igfLedKey={ clauses:x=>x.label, cps:x=>x.name, wait:x=>x.id };
function intelFrictionLedgerRows(led, lens){
  return lens==='cps'?led.counterparties:lens==='wait'?led.waiting:led.clauses;
}
/* The one reading of "which row is in hand": the stored key where that row is
   still on the list, else the first. */
function intelFrictionLedgerPick(led, lens){
  const rows=intelFrictionLedgerRows(led, lens);
  if(!rows.length) return { pos:-1, row:null, rows };
  const want=intelFrictionLedgerState().sel[lens];
  let pos=rows.findIndex(r=>_igfLedKey[lens](r)===want);
  if(pos<0) pos=0;
  return { pos, row:rows[pos], rows };
}
const _igfPc=v=>Math.round(v*100);
/* A negotiation is named "<contract> — <counterparty>", unless the contract's
   own name already says who it is with (a name typed "MSA — Naivas" would
   otherwise read "MSA — Naivas — Naivas"). The party's first word counts as
   saying so where it is a real word: "MSA — Naivas" is already about Naivas
   Supermarkets. A display choice only; nothing is matched or counted by it. */
const _igfDealName=(name,cp)=>{ const n=String(name||''), p=String(cp||'');
  if(!p||p==='(no counterparty)') return n;
  const low=n.toLowerCase(), first=p.split(/\s+/)[0]||'';
  return (low.includes(p.toLowerCase())||(first.length>=4&&low.includes(first.toLowerCase())))?n:`${n} — ${p}`; };
const _igfDays=d=>d==null?null:d<1?i18t('igf_led_under_day'):i18tn('igf_led_days',Math.round(d));
const _igfSpan=ms=>{ if(ms==null) return null; const h=ms/3600000;
  return h<1?i18t('igf_led_under_hour'):h<48?i18tn('igf_led_hours',Math.round(h)):i18tn('igf_led_days',Math.round(h/24)); };
/* A count is a chip only where it is something; a zero is a quiet figure, and
   never a door. */
const _igfChip=(n,word)=>n?`<span class="igf-led-chip is-amber">${word||n}</span>`:`<span class="igf-led-zero">0</span>`;
const _igfExtra=v=>v==null?`<span class="igf-led-zero" title="${igEsc(i18t('igf_led_tip_extra_none'))}">—</span>`
  :v>0.05?`<b class="igf-led-cost">+${v.toFixed(1)}</b>`
  :v<-0.05?`<b class="igf-led-gain">−${Math.abs(v).toFixed(1)}</b>`
  :`<span class="igf-led-zero">${v<0?'−':'+'}${Math.abs(v).toFixed(1)}</span>`;
const _igfDoor=(attr,label,tip)=>`<button type="button" class="ui-link igf-led-door" ${attr} title="${igEsc(tip||label)}">${igEsc(label)}${icon('chevR','w-3 h-3',2)}</button>`;
const _igfHead=(lbl,name,door)=>`<div class="igf-led-dh"><div class="igf-led-dh-t"><div class="igf-led-lbl">${lbl}</div><h3 class="igf-led-dname">${igEsc(name)}</h3></div>${door||''}</div>`;
const _igfFigs=a=>`<div class="igf-led-dfigs">${a.map(([t,n,s,tone,tip])=>`<div title="${igEsc(tip||'')}"><div class="igf-led-lbl">${t}</div><div class="igf-led-dn${tone?' '+tone:''}">${n}</div><div class="igf-led-ds">${s}</div></div>`).join('')}</div>`;
const _igfSec=(b,s,body)=>`<div class="igf-led-dsec"><div class="igf-led-dsh"><b>${b}</b>${s?`<span>${s}</span>`:''}</div>${body}</div>`;
/* FIT TO SCREEN (owner-picked 29 Sep 2026): the panel is exactly as tall as the
   list beside it. Its head, its figures and how the asks ended stay put; the
   lists under them (refused and still open, who contested it, their
   negotiations, the refusals by clause) scroll INSIDE the panel, never the page. */
const _igfLong=body=>`<div class="igx-scroll igf-led-dscroll">${body}</div>`;
/* How one side's asks on a clause ended, against the whole book's share — the
   book's figure is intelFrictionStats' own, so the tick and the strip's
   reading cannot disagree. */
function _igfAskRow(label, a, book){
  const n=a.acc+a.rej;
  if(!n) return `<div class="igf-led-askrow"><span class="igf-led-askname">${label}</span><span class="igf-led-stack is-empty"></span><span class="igf-led-asksay">${i18t('igf_led_no_decided')}</span></div>`;
  const p=_igfPc(a.acc/n);
  const tick=book==null?'':`<em class="igf-led-tick" style="left:${_igfPc(book)}%"></em>`;
  return `<div class="igf-led-askrow" title="${igEsc(i18t('igf_led_ask_tip',{a:a.acc,n,r:a.rej}))}"><span class="igf-led-askname">${label}</span><span class="igf-led-stack"><i class="igf-led-acc" style="width:${p}%"></i><i class="igf-led-ref" style="width:${100-p}%"></i>${tick}</span><span class="igf-led-asksay"><b>${p}%</b> ${i18t('igf_led_accepted_word')}</span></div>`;
}
function _igfNegoRow(id, name, sub, chip){
  return `<button type="button" class="igf-led-row" data-igf-open="${igEsc(id)}" title="${igEsc(i18t('igf_led_open_tip',{name}))}"><span class="igf-led-rname">${igEsc(name)}${sub?` <span class="igf-led-rsub">· ${sub}</span>`:''}</span>${chip||'<span></span>'}</button>`;
}
function intelFrictionDetailHtml(st, lens, pick){
  const led=st.ledger; const row=pick.row;
  if(!row) return '';
  const k=pick.pos+1, N=pick.rows.length;
  const f=intel.frictionFilter||null;
  if(lens==='clauses'){
    const c=row;
    const door=_igfDoor('data-igf-standards',i18t('igf_led_door_std'),i18t('igf_led_door_std_tip'));
    const figs=_igfFigs([
      [i18t('igf_led_th_contested'),_igfPc(c.share)+'%',i18t('igf_led_n_of_deals',{a:c.n,b:st.deals}),'',i18t('igf_led_tip_cont')],
      [i18t('igf_led_th_extra'),c.extra==null?'—':`${c.extra<0?'−':'+'}${Math.abs(c.extra).toFixed(1)}`,
        (c.withAvg!=null&&c.withoutAvg!=null)?i18t('igf_led_d_split',{w:c.withAvg.toFixed(1),wo:c.withoutAvg.toFixed(1)}):i18t('igf_led_d_split_none'),
        c.extra!=null&&c.extra>0.05?'igf-led-cost':'',i18t('igf_led_tip_extra')],
      [i18t('igf_led_f_open'),String(c.open),c.open?i18tn('igf_led_s_in_deals',c.openDeals.length):i18t('igf_led_s_nothing_waiting'),
        c.open?'is-amber':'',i18t('igf_led_tip_open')]]);
    const asks=_igfSec(i18t('igf_led_sec_asks'),i18t('igf_led_sec_asks_sub'),
      _igfAskRow(i18t('igf_led_ours'),c.ours,st.oursAcceptShare)
      +_igfAskRow(i18t('igf_led_theirs'),c.theirs,st.theirsAcceptShare)
      +`<div class="igf-led-legend"><span><i class="igf-led-acc"></i>${i18t('igf_led_lg_acc')}</span><span><i class="igf-led-ref"></i>${i18t('igf_led_lg_ref')}</span>${
        (st.oursAcceptShare!=null||st.theirsAcceptShare!=null)?`<span><i class="igf-led-lgtick"></i>${i18t('igf_led_lg_book',{o:st.oursAcceptShare!=null?_igfPc(st.oursAcceptShare)+'%':'—',t:st.theirsAcceptShare!=null?_igfPc(st.theirsAcceptShare)+'%':'—'})}</span>`:''}</div>`);
    const shown=c.by.slice(0,5), more=c.by.length-shown.length;
    const who=_igfSec(i18t('igf_led_sec_who'),i18t('igf_led_sec_who_sub'),
      `<div class="igf-led-rows">${shown.map(p=>`<button type="button" class="igf-led-row is-bar" data-igf-cp="${igEsc(p.name)}" title="${igEsc(i18t('igf_led_hold_tip',{name:p.name}))}"><span class="igf-led-rname">${igEsc(p.name)}</span><span class="igf-led-track is-mini"><span style="width:${Math.round(p.n/p.of*100)}%"></span></span><span class="igf-led-rsub">${i18t('igf_led_n_of',{a:p.n,b:p.of})}</span></button>`).join('')}</div>`
      +(more>0?`<div class="igf-led-foot">${i18tn('igf_led_who_more',more)}</div>`:''));
    const open=_igfSec(i18t('igf_led_sec_open'),'',
      c.openDeals.length?`<div class="igf-led-rows">${c.openDeals.map(d=>_igfNegoRow(d.id,_igfDealName(d.name,d.cp),i18t("igf_led_round_n",{n:d.round}),_igfChip(d.n,i18t('igf_led_open_n',{n:d.n})))).join('')}</div>`
        :`<div class="igf-led-none">${i18t('igf_led_open_none')}</div>`);
    return _igfHead(i18t('igf_led_d_clause',{k,n:N}),c.label,door)+figs+asks+_igfLong(open+who);
  }
  if(lens==='cps'){
    const p=row;
    const held=!!(f&&f.counterparty===p.name);
    const door=held?'':_igfDoor(`data-igf-cp="${igEsc(p.name)}"`,i18t('igf_led_hold_tip',{name:p.name}),i18t('igf_led_hold_tip',{name:p.name}));
    const openN=p.negotiations.filter(x=>!x.signed&&!x.declined).length;
    const figs=_igfFigs([
      [i18t('igf_led_f_deals'),String(p.deals),i18t('igf_led_s_signed_open',{s:p.signedN,o:openN})],
      [i18t('igf_led_f_rounds'),p.avgRounds.toFixed(1),i18t('igf_led_s_against',{v:st.avgRounds.toFixed(1)}),p.avgRounds>=st.avgRounds+0.5?'is-amber':''],
      [i18t('igf_led_th_accept'),p.acceptUs!=null?_igfPc(p.acceptUs)+'%':'—',
        st.oursAcceptShare!=null?i18t('igf_led_s_against',{v:_igfPc(st.oursAcceptShare)+'%'}):i18t('igf_led_no_decided'),'',i18t('igf_led_tip_accept')]]);
    const negs=_igfSec(i18t('igf_led_sec_theirs'),'',`<div class="igf-led-rows">${p.negotiations.map(x=>{
      const sub=x.signed?(x.days!=null?i18t('igf_led_nego_signed',{r:x.round,d:_igfDays(x.days)}):i18t('igf_led_nego_signed_nod',{r:x.round}))
        :x.declined?i18t('igf_led_nego_declined',{n:x.round}):i18t('igf_led_nego_open',{n:x.round});
      /* A signed agreement says SIGNED first: that is the fact about it a
         reader needs, and an open refusal on it is history, not a wait. */
      const chip=x.signed?`<span class="igf-led-chip is-green">${i18t('igf_led_chip_signed')}</span>`
        :x.open?`<span class="igf-led-chip is-amber">${i18t('igf_led_chip_refused_open',{n:x.open})}</span>`:'';
      return _igfNegoRow(x.id,x.name,sub,chip);
    }).join('')}</div>`);
    const listed=new Set(led.clauses.map(c=>c.label.toLowerCase()));
    const cls=_igfSec(i18t('igf_led_sec_cp_clauses'),'',p.clauses.length?`<div class="igf-led-rows">${p.clauses.map(c=>{
      const inner=`<span class="igf-led-rname">${igEsc(c.label)}</span><span class="igf-led-track is-mini"><span style="width:${Math.round(c.n/p.deals*100)}%"></span></span><span class="igf-led-rsub">${i18t('igf_led_n_of',{a:c.n,b:p.deals})}</span>`;
      /* A clause on the ledger's own list is a door back onto it; one that is
         not (outside the eight most contested) is a line, never a dead press. */
      return listed.has(c.label.toLowerCase())
        ?`<button type="button" class="igf-led-row is-bar" data-igf-clause="${igEsc(c.label)}" title="${igEsc(i18t('igf_led_clause_tip',{name:c.label}))}">${inner}</button>`
        :`<div class="igf-led-row is-bar is-static">${inner}</div>`;
    }).join('')}</div>`:`<div class="igf-led-none">${i18t('igf_led_cp_clauses_none')}</div>`);
    return _igfHead(i18t('igf_led_d_cp',{k,n:N}),p.name,door)+figs+_igfLong(negs+cls);
  }
  const d=row;
  const door=_igfDoor(`data-igf-open="${igEsc(d.id)}"`,i18t('igf_led_door_nego'),i18t('igf_led_open_tip',{name:d.name}));
  const figs=_igfFigs([
    [i18t('igf_led_f_open'),String(d.n),i18t('igf_led_s_nobody_withdrew'),'is-amber',i18t('igf_led_tip_open')],
    [i18t('igf_led_f_they_refused'),String(d.theyRefusedOurs),i18t('igf_led_s_ours_proposed')],
    [i18t('igf_led_f_we_refused'),String(d.weRefusedTheirs),i18t('igf_led_s_theirs_proposed')]]);
  const by=_igfSec(i18t('igf_led_sec_byclause'),'',`<table class="igf-led-bytable"><thead><tr><th>${i18t('igf_led_th_clause')}</th><th class="r">${i18t('igf_led_f_they_refused')}</th><th class="r">${i18t('igf_led_f_we_refused')}</th></tr></thead><tbody>${
    d.byClause.map(x=>`<tr><td>${igEsc(x.label||i18t('igf_led_no_clause'))}</td><td class="r">${x.ours}</td><td class="r">${x.theirs}</td></tr>`).join('')}</tbody></table>`);
  return _igfHead(i18t("igf_led_d_wait",{n:d.round}),_igfDealName(d.name,d.cp),door)+figs+_igfLong(by);
}
/* One figure in the strip. A figure with a list behind it is a BUTTON onto
   that list; a figure without one (an average, a median of decisions) is a
   div, and a zero is never a door. */
function _igfFig(key, label, n, sub, o={}){
  const tag=o.go?'button':'div';
  return `<${tag} class="igx-fig${o.on?' on':''}" data-igf-fig="${key}"${o.go?` type="button" data-igf-go="${o.go}"`:''} title="${igEsc(o.tip||'')}"><span class="igx-fig-t">${label}</span><span class="igx-fig-n${o.tone?' '+o.tone:''}">${n}</span><span class="igx-fig-s">${sub}</span></${tag}>`;
}
function intelFrictionLedgerHtml(st){
  const led=st.ledger; const S=intelFrictionLedgerState(); const lens=S.lens;
  const signedN=led.signedN, signedAll=st.signed||0, r1=led.round1Ids.length;
  const openDeals=led.waiting.length;
  const strip=`<div class="igx-figs" style="--igx-n:6">${[
    _igfFig('deals',i18t('igf_led_f_deals'),String(st.deals),
      st.openedThisMonth?i18t('igf_led_s_opened',{n:st.openedThisMonth}):i18t('igf_led_s_tracked'),
      {go:st.deals?'deals':null,tip:i18t('igf_led_tip_list',{n:st.deals})}),
    _igfFig('rounds',i18t('igf_led_f_rounds'),st.avgRounds.toFixed(1),i18t('igf_led_s_average')),
    _igfFig('tosign',i18t('igf_led_f_tosign'),st.medianDays!=null?_igfDays(st.medianDays):'—',
      signedN?i18t('igf_led_s_median_signed',{n:signedN}):i18t('igf_led_s_none_signed'),
      {go:signedN?'signed':null,tip:signedN?i18t('igf_led_tip_list',{n:signedN}):''}),
    _igfFig('decide',i18t('igf_led_f_decide'),st.medianDecisionMs!=null?_igfSpan(st.medianDecisionMs):'—',
      st.medianDecisionMs!=null?i18t('igf_led_s_per_change'):i18t('igf_led_s_none_decided'),
      {tip:i18t('igf_led_tip_decide')}),
    _igfFig('round1',i18t('igf_led_f_round1'),st.round1Share!=null?_igfPc(st.round1Share)+'%':'—',
      signedAll?i18t('igf_led_s_of_signed',{a:r1,b:signedAll}):i18t('igf_led_s_none_signed'),
      {go:r1?'round1':null,tip:r1?i18t('igf_led_tip_list',{n:r1}):''}),
    _igfFig('open',i18t('igf_led_f_open'),String(st.deadlocks),
      st.deadlocks?i18tn('igf_led_s_in_deals',openDeals):i18t('igf_led_s_nothing_waiting'),
      {go:st.deadlocks?'wait':null,on:lens==='wait',tone:st.deadlocks?'igx-warn':'',tip:st.deadlocks?i18t('igf_led_tip_open')+' '+i18t('igf_led_tip_wait'):i18t('igf_led_tip_open')})
  ].join('')}</div>`;
  const pick=intelFrictionLedgerPick(led, lens);
  const lensBtn=(k,label,n)=>`<button type="button" data-igf-lens="${k}" class="${lens===k?'on':''}" aria-pressed="${lens===k}">${label}<span class="igf-led-cnt">${n}</span></button>`;
  const seg=`<span class="reg-seg igf-led-seg" role="group">${lensBtn('clauses',i18t('igf_led_lens_clauses'),led.clauses.length)}${lensBtn('cps',i18t('igf_led_lens_cps'),led.counterparties.length)}${lensBtn('wait',i18t('igf_led_lens_wait'),led.waiting.length)}</span>`;
  const th=(t,o={})=>`<th${o.r?' class="r"':''}${o.tip?` title="${igEsc(o.tip)}"`:''}>${t}</th>`;
  const tr=(pos,key,tip,cells)=>`<tr data-igf-row="${igEsc(key)}" tabindex="0" class="${pos===pick.pos?'is-sel':''}" aria-selected="${pos===pick.pos}" title="${igEsc(tip)}">${cells}</tr>`;
  let sub, head, rows, foot='', empty='';
  if(lens==='clauses'){
    sub=i18tn('igf_led_sub_clauses',led.clauses.length);
    head=th(i18t('igf_led_th_clause'))+th(i18t('igf_led_th_contested'),{tip:i18t('igf_led_tip_cont')})
      +th(i18t('igf_led_th_extra'),{r:1,tip:i18t('igf_led_tip_extra')})+th(i18t('igf_led_f_open'),{r:1,tip:i18t('igf_led_tip_open')});
    rows=led.clauses.map((c,pos)=>tr(pos,c.label,i18t('igf_led_tip_show',{name:c.label}),
      `<td class="igf-led-name">${igEsc(c.label)}</td><td><div class="igf-led-barcell"><span class="igf-led-track"><span style="width:${Math.max(2,_igfPc(c.share))}%"></span></span><span class="igf-led-w">${_igfPc(c.share)}%</span><span class="igf-led-rsub">${i18t('igf_led_n_of',{a:c.n,b:st.deals})}</span></div></td><td class="r">${_igfExtra(c.extra)}</td><td class="r">${_igfChip(c.open)}</td>`));
    const out=led.openOutside; const n=out.reduce((s,x)=>s+x.n,0);
    /* Named where they have a name (the first three, the rest said as "…");
       a refusal on a change that names no clause is counted and not named. */
    const named=out.filter(x=>x.label);
    if(n) foot=i18tn('igf_led_foot_outside',n,{names:named.length
      ?': '+named.slice(0,3).map(x=>igEsc(x.label)).join(', ')+(named.length>3?' …':''):''});
    if(!led.clauses.length) empty=i18t('igf_led_empty_clauses');
  }else if(lens==='cps'){
    sub=led.counterparties.some(p=>p.deals>=2)?i18t('igf_led_sub_cps_two'):i18t('igf_led_sub_cps_all');
    const scale=Math.max(5,Math.ceil(Math.max(0,...led.counterparties.map(p=>p.avgRounds))));
    head=th(i18t('igf_led_th_cp'))+th(i18t('igf_led_f_deals'),{r:1})+th(i18t('igf_led_f_rounds'),{tip:i18t('igf_led_foot_book',{v:st.avgRounds.toFixed(1)})})
      +th(i18t('igf_led_th_accept'),{r:1,tip:i18t('igf_led_tip_accept')})+th(i18t('igf_led_f_open'),{r:1,tip:i18t('igf_led_tip_open')});
    rows=led.counterparties.map((p,pos)=>tr(pos,p.name,i18t('igf_led_tip_show',{name:p.name}),
      `<td class="igf-led-name">${igEsc(p.name)}</td><td class="r">${p.deals}</td><td><div class="igf-led-barcell"><span class="igf-led-track is-tick"><span style="width:${Math.round(p.avgRounds/scale*100)}%"></span><em class="igf-led-tick" style="left:${Math.round(st.avgRounds/scale*100)}%"></em></span><span class="igf-led-w">${p.avgRounds.toFixed(1)}</span></div></td><td class="r">${p.acceptUs!=null?_igfPc(p.acceptUs)+'%':'<span class="igf-led-zero">—</span>'}</td><td class="r">${_igfChip(p.open)}</td>`));
    foot=[led.cpsOne?i18tn('igf_led_foot_cps_one',led.cpsOne):'', led.cpsBeyond?i18t('igf_led_foot_beyond',{n:led.cpsBeyond}):'',
      i18t('igf_led_foot_book',{v:st.avgRounds.toFixed(1)})].filter(Boolean).join(' ');
  }else{
    sub=i18t('igf_led_sub_wait');
    head=th(i18t('igf_led_th_nego'))+th(i18t('igf_led_th_round'),{r:1})+th(i18t('igf_led_th_refused_on'))+th(i18t('igf_led_f_open'),{r:1,tip:i18t('igf_led_tip_open')});
    rows=led.waiting.map((d,pos)=>tr(pos,d.id,i18t('igf_led_tip_show',{name:d.name}),
      `<td class="igf-led-nw"><div class="igf-led-name">${igEsc(d.name)}</div><div class="igf-led-rsub">${igEsc(d.cp)}</div></td><td class="r">${d.round}</td><td class="igf-led-rsub"><span class="igf-led-refon">${d.byClause.map(x=>igEsc(x.label||i18t('igf_led_no_clause'))).join(' · ')}</span></td><td class="r">${_igfChip(d.n)}</td>`));
    if(led.waiting.length) foot=i18tn('igf_led_foot_wait',st.deadlocks,{deals:i18tn('igf_led_s_in_deals',led.waiting.length)});
    else empty=i18t('igf_led_empty_wait');
  }
  /* The rows stretch to fill the card and scroll inside it when they do not
     fit (--igf-rows lets the stylesheet cap how tall a row may grow). */
  const list=`<div class="igx-card igf-led-list">
      <div class="igf-led-ch"><b>${i18t('igf_led_title')}</b><span class="igf-led-sub">${sub}</span>${seg}</div>
      ${empty?`<div class="igf-led-none is-list">${empty}</div>`:`<div class="igx-scroll igf-led-scroll"><table class="igf-led-table" data-igf-list="${lens}" style="--igf-rows:${rows.length}"><thead><tr>${head}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`}
      ${foot?`<div class="igf-led-foot">${foot}</div>`:''}
    </div>`;
  const detail=pick.row?`<div class="igx-card igf-led-detail" data-igf-detail="${lens}">${intelFrictionDetailHtml(st, lens, pick)}</div>`:'';
  return strip+`<div class="igx-row igf-led-grid${detail?'':' is-solo'}">${list}${detail}</div>`;
}
function intelFrictionHtml(){
  const f=intel.frictionFilter||null;
  const st=intelFrictionStats(f);
  if(!st.deals) return `<div style="max-width:960px;margin:0 auto">
    <div style="max-width:560px;margin:var(--s-10) auto;text-align:center;color:var(--color-neutral-600);font-size:var(--t-body);line-height:1.6">
    <b style="color:var(--color-text)">${f?i18t('int_nothing_matches'):i18t('int_no_negotiations')}</b><br/>${f?i18t('int_clear_filters'):i18t('int_once_contracts')}</div></div>`;
  /* COPILOT'S READ LEADS, IN A CARD OF ITS OWN, AND IS NOT TOUCHED: the strip
     is intelFrictionCopilotHtml exactly as it was, keyed and repainted by the
     same three functions. The card is only its frame now that the report
     under it is several cards rather than one.
     FIT TO SCREEN (owner-picked 29 Sep 2026): the page is one grid exactly the
     tab's height — Copilot's read, the six figures, then the list beside its
     panel sharing what is left (#igf-ledger lends its two children to it). */
  return `<div class="igx-fit igf-led">
    <div class="igx-card igf-led-cop">${intelFrictionCopilotHtml(st)}</div>
    <div id="igf-ledger">${intelFrictionLedgerHtml(st)}</div>
  </div>`;
}
/* A press on a lens or a row repaints the LEDGER alone — never the page, so
   Copilot's read, its busy state and the reader's scroll stay where they are.
   Focus goes back to the row that was pressed from the keyboard. */
function intelFrictionLedgerRepaint(focusKey){
  const host=document.getElementById('igf-ledger'); if(!host) return;
  /* The list scrolls inside its own card now, and a press on a row repaints
     it: the same list comes back where the reader had it. A new lens is a
     new list and starts at its top. */
  const was=host.querySelector('[data-igf-list]');
  const kept=was?{ lens:was.getAttribute('data-igf-list'), top:(was.closest('.igx-scroll')||{}).scrollTop||0 }:null;
  host.innerHTML=intelFrictionLedgerHtml(intelFrictionStats(intel.frictionFilter||null));
  const now=kept&&kept.top?host.querySelector(`[data-igf-list="${kept.lens}"]`):null;
  const sc=now&&now.closest('.igx-scroll'); if(sc) sc.scrollTop=kept.top;
  if(focusKey!=null){
    const r=[...host.querySelectorAll('[data-igf-row]')].find(x=>x.getAttribute('data-igf-row')===focusKey);
    if(r) r.focus();
  }
}
/* EVERY DOOR ON THE PAGE, ONE DELEGATED LISTENER on the tab's own scroller,
   bound once per element: the ledger is repainted under it on every press, so
   a listener on a painted row would be dead after the first. */
function intelFrictionWire(host){
  if(!host||!host.dataset||!host.addEventListener||host.dataset.igfBound) return;
  host.dataset.igfBound='1';
  const S=()=>intelFrictionLedgerState();
  const select=(row,fromKey)=>{ const s=S(); s.sel[s.lens]=row.getAttribute('data-igf-row');
    intelFrictionLedgerRepaint(fromKey?s.sel[s.lens]:null); };
  host.addEventListener('click',e=>{
    const t=e.target;
    const lens=t.closest('[data-igf-lens]'); if(lens){ S().lens=lens.getAttribute('data-igf-lens'); intelFrictionLedgerRepaint(); return; }
    const go=t.closest('[data-igf-go]');
    if(go){
      const k=go.getAttribute('data-igf-go'); const st=intelFrictionStats(intel.frictionFilter||null); const led=st.ledger;
      if(k==='wait'){ const s=S(); s.lens=s.lens==='wait'?'clauses':'wait'; intelFrictionLedgerRepaint(); return; }
      const ids=k==='deals'?led.dealIds:k==='signed'?led.signedIds:k==='round1'?led.round1Ids:[];
      const label=i18t(k==='deals'?'igf_led_list_deals':k==='signed'?'igf_led_list_signed':'igf_led_list_round1');
      if(ids.length&&typeof regShowOnly==='function') regShowOnly(ids,label);
      return;
    }
    const std=t.closest('[data-igf-standards]'); if(std){ setView('playbook'); return; }
    const open=t.closest('[data-igf-open]'); if(open){ openWorkspace(open.getAttribute('data-igf-open')); return; }
    const cp=t.closest('[data-igf-cp]');
    if(cp){ intel.frictionFilter={...(intel.frictionFilter||{}), counterparty:cp.getAttribute('data-igf-cp')}; intelRepaint(); return; }
    const cl=t.closest('[data-igf-clause]');
    if(cl){ const s=S(); s.lens='clauses'; s.sel.clauses=cl.getAttribute('data-igf-clause'); intelFrictionLedgerRepaint(); return; }
    const row=t.closest('[data-igf-row]'); if(row){ select(row,false); }
  });
  host.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ') return;
    const row=e.target.closest&&e.target.closest('[data-igf-row]'); if(!row) return;
    e.preventDefault(); select(row,true);
  });
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
  const head=`<div style="display:flex;align-items:center;gap:var(--s-2)">
    <span style="width:22px;height:22px;flex:none;display:grid;place-items:center;border-radius:var(--radius);background:var(--st-steel-bg);color:var(--st-steel-fg)">${icon('sparkle','w-3 h-3',2)}</span>
    <span style="font-size:var(--t-body);font-weight:var(--w-title)">${i18t('int_copilots_read')}</span>
    <span style="font-size:var(--t-figure);font-weight:var(--w-title);letter-spacing:.08em;text-transform:uppercase;padding:2px 7px;border-radius:var(--radius);background:var(--st-steel-bg);color:var(--st-steel-fg)">${i18t('int_optional_ai')}</span>
  </div>`;
  let body;
  if(ai&&ai.busy&&ai.key===key){
    body=`<div style="display:flex;align-items:center;gap:9px;font-size:var(--t-meta);color:var(--color-neutral-600);padding:2px 0">
      <span class="live-ping" style="width:7px;height:7px;border-radius:50%;background:var(--accent-solid,var(--color-accent));flex:none"></span>${i18t('int_reading_figures')}</div>`;
  }else if(ai&&ai.html&&ai.key===key){
    body=`<div class="igf-ai-read" style="font-size:var(--t-body);line-height:1.7;color:var(--color-neutral-800)">${ai.html}</div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:var(--s-2);padding-top:var(--s-2);border-top:1px dashed var(--color-divider);font-size:var(--t-label);color:var(--color-neutral-500)">
        <span style="flex:none;font-size:var(--t-figure);font-weight:var(--w-title);padding:1px 7px;border-radius:var(--radius);background:var(--st-amber-bg);color:var(--st-amber-fg)">${i18t('int_ai_commentary')}</span>
        <span style="min-width:0">Generated at ${igEsc(ai.at||'')} from the counted figures below — the numbers are the app's, the interpretation is Copilot's.</span>
        <button id="igf-ai-regen" type="button" class="ui-link" style="margin-left:auto;flex:none">${icon('refresh','w-3.5 h-3.5')}Regenerate</button>
      </div>`;
  }else if(ai&&ai.err&&ai.key===key){
    body=`<div style="display:flex;align-items:center;gap:var(--s-3);flex-wrap:wrap">
      <span style="font-size:var(--t-meta);color:var(--st-ruby-fg)">${igEsc(ai.err)}</span>
      <button id="igf-ai-ask" class="ui-link">${i18t('int_try_again')}${icon('chevR','w-3.5 h-3.5')}</button>
    </div>`;
  }else{
    const stale=!!(ai&&ai.html);
    const hint=!on
      ?'Add an Anthropic key in Team &amp; Settings → Copilot engine to turn this on. The counted report below works without it.'
      :stale?'The figures below have changed since the last read — generate a fresh one. Nothing runs until you click.'
      :'Copilot explains what is behind the figures below and what to do this week. Nothing runs until you click — the counted report never depends on it.';
    body=`<div style="display:flex;align-items:center;gap:var(--s-3);flex-wrap:wrap">
      <button id="igf-ai-ask" type="button" class="ui-btn ui-btn-primary" ${on?'':'disabled'} style="flex:none">${icon('sparkle','w-3.5 h-3.5',2)}Interpret these numbers</button>
      <span style="font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.5;max-width:56ch">${hint}</span>
    </div>`;
  }
  return `<div id="igf-copilot" style="border-bottom:1px solid var(--color-divider);background:linear-gradient(180deg,color-mix(in srgb,var(--color-accent) 4%,transparent),transparent 70%);padding:var(--s-3) 20px 13px">
    ${head}<div style="margin-top:var(--s-2)">${body}</div>
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
    const res=await copilotAsk([{role:'user',content:prompt}],{view:'intel'}, null, IG_QUIET);
    const rich=igFmtRich(res.answer||'');
    intel.frictionAI={busy:false,key,html:rich.html+igNoticeHtml(res.notice),
      at:new Date().toLocaleTimeString(jxLocale(),{hour:'2-digit',minute:'2-digit'})};
  }catch(e){
    intel.frictionAI={busy:false,key,
      err:(e&&e.needsKey)?'No Copilot key configured — add one in Team & Settings → Copilot engine.':'Copilot was unavailable — '+(e&&e.message?e.message:String(e))};
  }
  if(state.view==='intel'&&intel.tab==='friction') intelFrictionRepaintAI();
}
/* The Clause Ledger's own names (28 Sep 2026), published here beside the code
   rather than on the file's long list at its end — the other Insights tabs are
   being rebuilt at the same time and one line everybody appends to is where
   their work and this would collide. */
Object.assign(window,{IGF_LED_LENSES,intelFrictionLedgerData,intelFrictionLedgerState,
  intelFrictionLedgerRows,intelFrictionLedgerPick,intelFrictionDetailHtml,intelFrictionLedgerHtml,
  intelFrictionLedgerRepaint,intelFrictionWire});


/* ============================================================
   WHERE OBLIGATIONS GO QUIET — the promises nobody will be reminded about
   ============================================================
   The negotiation tab beside this one asks where deals get STUCK. This one
   asks where they get FORGOTTEN — which is the quieter failure, because a
   stalled negotiation has somebody waiting on it and a dropped obligation has
   nobody at all.

   COUNTING IS NOT DRAWING, the Insights panels' own rule: intelObligationsData
   returns plain data and draws nothing, intelObligationsHtml draws it and
   computes nothing. f247 greps both halves.

   IT BORROWS EVERY READING AND INVENTS NONE — obligationDue for the date,
   obState for open/overdue/done, obligationIsTheirs for the side, daysUntil
   for the arithmetic, and the live book is the same one openObligations reads
   (not Declined, not archived). A second copy of "is this overdue" is how two
   screens come to disagree about the same commitment.

   THE SILENCE TEST IS THE SWEEP'S OWN MILESTONES, MIRRORED — see OB_LAST_*
   below. This page's whole claim is "no email will be sent about this", and a
   second opinion here about when the mail fires would be a page confidently
   contradicting the thing that actually sends it.

   WHAT IT CANNOT SEE IS SAID OUT LOUD RATHER THAN GUESSED. Nothing on the
   record says whether a contract was ever READ for obligations, and nothing
   says WHEN one was completed — so "58 contracts with none on file" is
   reported as two possibilities and not as a finding, and the on-time panel
   states what it needs instead of estimating it. */
const OB_ROWS = 5;            // row lists cap at five and say when they have
const OB_HORIZON = 90;        // the forward window — the renewal card's own 90
/* THE SWEEP'S MILESTONES (server/server.js, runReminders). With an assignee
   that resolves to a member the sweep writes to THEM 7 days before, on the
   day, and the day after, and escalates to the admins on day 4. With no
   assignee that resolves it writes ONCE, to the admins, on day 1. Past the
   last of those, nothing about that obligation is ever sent again. The daily
   brief carries an item until 30 days overdue and then drops it.
   OUR SIDE IS AN AGENT'S NOW (runOurPromises, 27 Sep 2026): the assignee, ELSE
   THE CONTRACT'S OWNER, 7 days before, on the day and the day after — and no
   day-four mail. So for ours the last milestone is day 1 and a person is
   reached wherever either resolves. The two lines above are THEIR side. */
const OB_LAST_OWNED = -4, OB_LAST_UNOWNED = -1, OB_BRIEF_FLOOR = -30;
const OB_LAST_OURS = -1;
/* And the FIRST milestone, the same on both sweeps: seven days before the
   date (runReminders' `od === 7`, runOurPromises' MILESTONE key 7). */
const OB_FIRST_DAYS = 7;

/* ---- WILL A REMINDER REACH THE PERSON WHO OWES THIS, EVER AGAIN? ----
   THE ONE PREDICATE (28 Sep 2026, the Reminder Line). The page's headline
   count and the line's hollow dots and green windows all ask THIS, per
   obligation, so the picture and the figure cannot come to disagree about
   who is told — a second copy of the rule is how that starts.
   No readable date and nothing fires at all. Nobody the mail resolves to and
   nothing ever reaches a person who owes it — the one admin note on day 1 is
   a note to a bystander, not a reminder to an owner. Past the last milestone
   and every mail has already gone. Who the mail resolves to is the server's
   own lookup, mirrored in js/obligations.js: obligationReminderTo (the
   sweep's obligationRecipient) for the assignee and, on OUR side only,
   obligationOwnerTo (runOurPromises' contractOwnerRecipient) after it.
   `first`..`last` is the window, in days before the date, in which the person
   is written to: 7 before to the day after on ours; theirs runs on to the
   admins' day-four mail, which is what keeps it counted as reached until then.
   Read through window because this module draws on stages where
   js/obligations.js is not loaded; without it nobody resolves, which
   over-reports silence rather than under-reporting it — the safe direction on
   a page whose whole subject is what goes unsaid. */
function obReminderOf(o, c){
  const raw=String((o&&o.due)||'').trim();
  const due=(typeof obligationDue==='function')?obligationDue(o):(raw||null);
  const od=due?daysUntil(due):null;
  const theirs=(typeof obligationIsTheirs==='function')?obligationIsTheirs(o):((o&&o.party)==='theirs');
  const ours=!theirs;
  const typed=String((o&&o.assignee)||'').trim();
  const mem=(typed&&typeof window.obligationReminderTo==='function')?obligationReminderTo({ assignee:typed }):null;
  const owner=(!mem&&ours&&typeof window.obligationOwnerTo==='function')?obligationOwnerTo(c):null;
  const owned=!!mem, reach=owned||!!owner;
  const last=ours?OB_LAST_OURS:OB_LAST_OWNED;
  const bad=(due==null);
  const spent=(due!=null&&od!=null&&od<(ours?OB_LAST_OURS:owned?OB_LAST_OWNED:OB_LAST_UNOWNED));
  const quiet=bad||!reach||(od!=null&&od<last);
  const why=[];
  if(quiet){
    if(bad) why.push(raw?'unreadable':'nodate');
    if(!reach){ if(!typed) why.push('noowner'); else why.push('gone'); }
    if(spent) why.push('spent');
  }
  const to=mem||owner;
  return { due, raw, od, ours, typed, owned, reach,
    memberId: mem&&mem.id!=null?String(mem.id):'', memberName: mem?String(mem.name||typed):'',
    to: mem?'assignee':(owner?'owner':null), toName: to?String(to.name||''):'',
    first:OB_FIRST_DAYS, last, spent, quiet, why };
}

/* ═══ THE EXPOSURE REGISTER (S10, 16 Sep 2026) ═══════════════════════════
   *"A risk score out of 100 — every competitor has one and none can explain
   it. The exposure register counts instead, and every count opens onto the
   contracts behind it."*

   THE REFUSAL IS THE FEATURE, and it is written here rather than left as an
   absence: there is NO SCORE on this page and there is not to be one. A
   rating a lawyer cannot derive is worse than a count they can press, and
   every row here is a count with a door on it.

   NOTHING IS DERIVED FROM WORDING AT DRAW TIME. Each row asks a field the
   record already holds — the same fields the Overview prints and the Key terms
   form writes — so what this page says and what the contract says are the same
   sentence. A contract whose field is absent or `unclear` is in NO exposure
   row; it is in the last row instead, which is the honest one.

   MONEY IS "ON PAPER", NEVER "AT RISK". The contract's value is what the
   agreement is worth, not what an uncapped indemnity would cost — nobody can
   know that, and a column headed "exposure" carrying a contract value would be
   the same made-up number in a different hat. The foot says so.

   READING MUST NOT WRITE: every figure is `c.metadata` and `copilotRead`, and
   nothing here calls a name that initialises anything. */
const EXPOSURE_KINDS = [
  { k:'liability',
    get title(){ return i18t('int_exp_liability'); },
    get sub(){ return i18t('int_exp_liability_sub'); },
    hit: c => _expMeta(c).liabilityCapped === 'uncapped' },
  { k:'price',
    get title(){ return i18t('int_exp_price'); },
    get sub(){ return i18t('int_exp_price_sub'); },
    /* `open` is the option that means "they may set it" — a ceiling or an
       index is a price you can plan around, and `nochange` is no exposure at
       all. */
    hit: c => _expMeta(c).priceReview === 'open' },
  { k:'indemnity',
    get title(){ return i18t('int_exp_indemnity'); },
    get sub(){ return i18t('int_exp_indemnity_sub'); },
    hit: c => _expMeta(c).indemnityCapped === 'uncapped' },
  { k:'autorenew',
    get title(){ return i18t('int_exp_autorenew'); },
    get sub(){ return i18t('int_exp_autorenew_sub'); },
    /* A window under a month is the one that goes past unnoticed. An absent
       notice period is NOT counted: "we do not know" is the last row's
       business, not this one's. */
    hit: c => { const m=_expMeta(c); const n=Number(m.noticePeriodDays);
      return m.renewalType === 'auto-renew' && isFinite(n) && n > 0 && n < EXPOSURE_NOTICE_DAYS; } },
  { k:'lockin',
    get title(){ return i18t('int_exp_lockin'); },
    get sub(){ return i18t('int_exp_lockin_sub'); },
    hit: c => { const m=_expMeta(c);
      return m.exclusivity === 'exclusive' && m.terminateForConvenience === 'no'; } },
];
const EXPOSURE_NOTICE_DAYS = 30;
const _expMeta = c => (c && c.metadata) || {};

/* THE LIVE BOOK, and it is the same reading every other tab on this page uses:
   not Declined, not archived. An amendment is left in — it is a live agreement
   with its own terms, and on this subject an amendment that removed a cap is
   exactly the record a reader is looking for. */
function exposureLive(){
  const S=(window.state&&Array.isArray(state.contracts))?state.contracts:[];
  return S.filter(c=>c&&c.status!=='Declined'&&!c.archived);
}
/* WHAT "READ CLOSELY ENOUGH" MEANS is copilotRead's answer and not a second
   one: a brief, a playbook pass or a risk scan against the current wording.
   Read through window — this module draws on stages without js/views/home.js,
   and there it answers "nothing has been read", which OVER-reports the last
   row rather than under-reporting it. On a page whose whole subject is what
   you cannot see, that is the safe direction. */
const _expRead = c => (typeof window.copilotRead==='function') ? !!copilotRead(c) : false;

/* The money, in the workspace's own currency, with what could not be converted
   counted and said. fxHome answers `converted:false, missing:false` for a
   contract ALREADY in the home currency — a real figure, not a failure — so
   the test is `!missing`. */
function _expMoney(list){
  let sum=0, left=0;
  for(const c of list){
    if(typeof fxHome!=='function'){ sum += Number((c&&c.value)||0); continue; }
    const h=fxHome(c);
    if(h && h.missing) left++; else sum += (h && h.v) || 0;
  }
  return { sum, left };
}
function exposureData(){
  const live = exposureLive();
  const money = (typeof canViewValues!=='function') || canViewValues();
  const rows = EXPOSURE_KINDS.map(kind=>{
    let hits=[];
    try{ hits = live.filter(c=>{ try{ return !!kind.hit(c); }catch(_){ return false; } }); }catch(_){ hits=[]; }
    const m = money ? _expMoney(hits) : { sum:null, left:0 };
    /* THE WORST ONE IS THE LARGEST BY VALUE, which is the only ordering this
       page can defend — there is no severity here to rank by, and inventing
       one would be the score coming back through a side door. Null where the
       reader is not shown figures, and null on an empty row. */
    let worst = null;
    if(money && hits.length){
      let best=null, bv=-1;
      hits.forEach(c=>{ const h=(typeof fxHome==='function')?fxHome(c):{v:Number(c.value||0),missing:false};
        const v=(h&&!h.missing)?(h.v||0):0; if(v>bv){ bv=v; best=c; } });
      if(best) worst = { id:best.id, ref:(window.contractRef?contractRef(best):best.id), name:best.name||'', who:best.counterparty||'' };
    }
    return { k:kind.k, title:kind.title, sub:kind.sub, n:hits.length,
      ids:hits.map(c=>c.id), value:m.sum, left:m.left, worst };
  });
  /* ════ WORST FIRST (Young ruled it 19 Sep 2026) ═════════════════
     *"Exposure page is very bland and does not highlight where your eyes
     should focus on."* MEASURED off the owner's own screenshot: six rows in
     one weight and one ink, THREE OF THEM READING ZERO, taking exactly as
     much of the page as the two that are not. A table where nothing is
     emphasised emphasises nothing.

     THE RANK IS THE ROW'S OWN FIGURE and nothing else — by what it is WORTH
     where the reader is shown money, by how MANY where they are not. That is
     the same pair of readings `worst` already picks a contract by, so the
     page cannot rank one way and name a worst contract the other. A zero row
     sinks by construction rather than being hidden. Ties keep the kinds' own
     order, because Array#sort is stable and these five are written in the
     order a lawyer would list them.

     IT IS WORKED OUT HERE, never in the renderer — this page's own rule, so
     a figure can never differ between what is counted and what is drawn. */
  rows.sort((a,b)=> (money ? ((b.value||0)-(a.value||0)) || (b.n-a.n) : (b.n-a.n)));
  /* THE LEADING ROW IS THE FIRST ONE THAT IS NOT EMPTY, and there may be
     none: a book with no uncapped anything leads with nothing, and a bar over
     a zero would be an alarm about an absence. */
  const lead = (rows[0] && rows[0].n) ? rows[0].k : null;

  const unread = live.filter(c=>!_expRead(c));
  const um = money ? _expMoney(unread) : { sum:null, left:0 };
  /* WHAT WAS LEFT OUT OF THE FIGURES, once, for the whole page. A row already
     carries its own `left` for its own hover; this is the SET of contracts no
     figure above could include, so the line under the table counts contracts
     and not appearances. fxMissing's rule: what is left out is counted and
     SAID. */
  let fxLeft = 0;
  if(money && typeof fxHome==='function'){
    const seen=new Set();
    for(const r of rows) for(const id of r.ids) seen.add(id);
    for(const c of live) if(seen.has(c.id)){ const h=fxHome(c); if(h&&h.missing) fxLeft++; }
  }
  return { rows, live:live.length, money, lead, fxLeft,
    unread:{ n:unread.length, ids:unread.map(c=>c.id), value:um.sum, left:um.left } };
}
/* ═══ THE PATTERN GRID (owner-picked by name, 28 Sep 2026) ═══════════════
   The five exposures set against the company's OWN groupings — category,
   value stream or owner, one switch — so a reader can see that "every supply
   contract lets them change the price", which is a playbook change and not a
   one-contract fix. Pressing a square lists its contracts beside the grid,
   with the register's own door (regShowOnly) to open them.

   EVERYTHING THE RANKED TABLE PROMISED STILL HOLDS, because the grid is drawn
   OFF exposureData and never beside it: the same five readings, ranked the
   same way (value where the reader is shown money, else count), the same one
   lead, a zero row still stands down, the coverage reading is still counted
   and still set apart from the five (under a rule, never among them), and
   the fxMissing rule still leaves an unconvertible contract out of the money
   and says so.

   A SQUARE'S SHADE IS ITS OWN FIGURE AND NOTHING ELSE — the count, or the
   value where the reader picks Value. It is NOT a blend of exposures, and the
   rows are never added into one figure per group: a grid like this is easily
   mistaken for a heat map of "how risky", and the one thing this page refuses
   is a number a lawyer cannot derive. The "at least one" row counts each
   contract ONCE; "two or more" is a plain fact about a contract, never a
   ranking. The ramp is the ACCENT's, never ruby: ruby on this page is the
   lead's bar alone.

   COUNTING IS NOT DRAWING. exposureGridData groups and counts, and
   exposureCellData lists a square; the renderer only prints what they say. */
const EXP_PG_BY = ['cat','stream','owner'];
const EXP_PG_STEPS = 4;
/* How many of a square's contracts the side list draws. It SCROLLS inside
   its card since Fit to Screen (29 Sep 2026), so it draws a long page of
   them; past that the rest are counted and said ("and N more"), and the door
   under the list opens every one in Contracts. Was 8 while the list grew the
   page. */
const EXP_PG_LIST = 50;
/* Per sitting, in memory: which grouping, what a square shows, and which
   square is picked. `k:null` means "the lead" (or the at-least-one row when
   nothing leads); `g:null` means every group. */
const _expPg = { by:'cat', m:'n', k:null, g:null };

/* One contract's money in the home currency — fxHome's answer, and the same
   `!missing` test _expMoney makes, so a list item and a square can never
   disagree about whether a contract is in the figure. */
function _expOne(c){
  if(typeof fxHome!=='function') return { v:Number((c&&c.value)||0), missing:false };
  const h=fxHome(c);
  return (h && h.missing) ? { v:null, missing:true } : { v:(h && h.v) || 0, missing:false };
}
/* WHICH GROUP A CONTRACT SITS IN. Each dimension is the product's own reading:
   category is the record's closed list (metadata.category, labelled by
   metaOptLabel, "No category yet" where absent — the register's own words);
   value stream is c.folder named off FOLDERS, and a stream the reader cannot
   open is NEVER named (visibleFolders); owner is contractOwnerName. An
   absence is its own group, drawn last, rather than folded into another. */
function _expGroupOf(c, by, seen){
  if(by==='owner'){
    const n=(typeof contractOwnerName==='function') ? contractOwnerName(c) : null;
    return n ? { key:'o:'+n, label:String(n) } : { key:'', label:i18t('exp_pg_no_owner') };
  }
  if(by==='stream'){
    const F=(typeof FOLDERS==='object' && FOLDERS) ? FOLDERS : {};
    const id=c && c.folder;
    if(!id || !F[id]) return { key:'', label:i18t('exp_pg_no_stream') };
    if(seen && !seen.has(id)) return { key:'~', label:i18t('exp_pg_other_stream') };
    return { key:'s:'+id, label:String(F[id].name||id) };
  }
  const k=(c && c.metadata && c.metadata.category) || '';
  return k ? { key:'c:'+k, label:String((typeof metaOptLabel==='function') ? metaOptLabel(k) : k) }
           : { key:'', label:i18t('reg_uncategorised') };
}
function exposureGridData(by, d){
  by = EXP_PG_BY.indexOf(by) < 0 ? 'cat' : by;
  d = d || exposureData();
  const live = exposureLive();
  const byId = new Map(live.map(c=>[c.id, c]));
  const seen = (typeof visibleFolders==='function')
    ? new Set((visibleFolders()||[]).map(f=>f && f.id)) : null;
  const gOf = new Map(), groups = new Map();
  for(const c of live){
    const g=_expGroupOf(c, by, seen);
    gOf.set(c.id, g.key);
    if(!groups.has(g.key)) groups.set(g.key, { key:g.key, label:g.label, n:0 });
    groups.get(g.key).n++;
  }
  /* Biggest group first, the absences last — the mock-up's order. */
  const cols = Array.from(groups.values()).sort((a,b)=>
    ((a.key===''||a.key==='~')?1:0) - ((b.key===''||b.key==='~')?1:0)
    || b.n - a.n || a.label.localeCompare(b.label));
  const money = d.money;
  const pack = ids => {
    const list = ids.map(id=>byId.get(id)).filter(Boolean);
    const m = money ? _expMoney(list) : { sum:null, left:0 };
    return { n:list.length, value:m.sum, left:m.left, ids:list.map(c=>c.id) };
  };
  const cellsOf = ids => {
    const out = {};
    cols.forEach(g=>{ out[g.key] = pack(ids.filter(id=>gOf.get(id)===g.key)); });
    return out;
  };
  /* How many of the five each contract carries — a plain fact about the
     contract, read for "two or more" and for the list's "3 of the five". */
  const times = {};
  d.rows.forEach(r=>r.ids.forEach(id=>{ times[id]=(times[id]||0)+1; }));
  const anyIds = live.filter(c=>times[c.id]).map(c=>c.id);
  const twoIds = live.filter(c=>(times[c.id]||0) > 1).map(c=>c.id);
  const rows = d.rows.map(r=>({ k:r.k, title:r.title, sub:r.sub, n:r.n, value:r.value,
    left:r.left, ids:r.ids, lead:d.lead===r.k, cells:cellsOf(r.ids) }));
  /* THE SHADE: one ramp over the five rows' squares, in EXP_PG_STEPS steps of
     the largest square — by count, and by value for the Value switch. A square
     with contracts in it is never shaded as empty. */
  let maxN = 0, maxV = 0;
  rows.forEach(r=>cols.forEach(g=>{ const x=r.cells[g.key];
    if(x.n > maxN) maxN = x.n; if((x.value||0) > maxV) maxV = x.value||0; }));
  const step = (f, max, n) => !n ? 0
    : (!(f > 0) || !(max > 0)) ? 1 : Math.min(EXP_PG_STEPS, Math.max(1, Math.ceil(f * EXP_PG_STEPS / max)));
  rows.forEach(r=>cols.forEach(g=>{ const x=r.cells[g.key];
    x.stepN = step(x.n, maxN, x.n); x.stepV = money ? step(x.value||0, maxV, x.n) : 0; }));
  const any = Object.assign({ k:'any', title:i18t('exp_pg_any'), sub:i18t('exp_pg_any_sub') },
    pack(anyIds), { cells:cellsOf(anyIds) });
  const unread = Object.assign({ k:'unread', title:i18t('int_exp_unread'), sub:i18t('int_exp_unread_sub') },
    pack(d.unread.ids), { cells:cellsOf(d.unread.ids) });
  const two = Object.assign({ k:'two', title:i18t('exp_pg_two') }, pack(twoIds));
  return { by, money, live:d.live, lead:d.lead, fxLeft:d.fxLeft, cols, rows, any, unread, two, times };
}
/* Which square is picked, checked against what the grid now holds: the
   reader's pick where it still stands, else the lead, else "at least one". */
function exposureGridPick(G){
  const all = G.rows.concat([G.any, G.unread]);
  let k = _expPg.k;
  const r = all.find(x=>x.k===k);
  if(!r || !r.n) k = G.lead || 'any';
  let g = _expPg.g;
  const row = all.find(x=>x.k===k);
  if(g != null && (!G.cols.some(c=>c.key===g) || !row || !row.cells[g] || !row.cells[g].n)) g = null;
  return { k, g };
}
/* One square's contracts, largest first where money is shown (else by name):
   the list beside the grid and the door under it read this and nothing else. */
function exposureCellData(G, k, g){
  const row = G.rows.concat([G.any, G.unread, G.two]).find(r=>r.k===k) || null;
  if(!row) return null;
  const col = (g == null) ? null : (G.cols.find(c=>c.key===g) || null);
  const pick = col ? row.cells[col.key] : { n:row.n, value:row.value, left:row.left, ids:row.ids };
  const byId = new Map(exposureLive().map(c=>[c.id, c]));
  const items = pick.ids.map(id=>byId.get(id)).filter(Boolean).map(c=>{
    const h = G.money ? _expOne(c) : { v:null, missing:false };
    return { id:c.id, who:String(c.counterparty||''), name:String(c.name||''),
      value:h.v, left:h.missing, read:_expRead(c), carries:G.times[c.id]||0 };
  });
  items.sort((a,b)=> (G.money ? ((b.value||0) - (a.value||0)) : 0)
    || a.who.localeCompare(b.who) || a.name.localeCompare(b.name));
  const dim = i18t('exp_pg_by_' + G.by);
  return { k:row.k, title:row.title, g:col ? col.key : null, group:col ? col.label : null, dim,
    n:pick.n, value:pick.value, left:pick.left, ids:pick.ids, items };
}
/* THE RENDERER COMPUTES NOTHING — the page's own rule, so a figure can never
   differ between what is counted and what is drawn. */
function exposureHtml(){
  const d = exposureData();
  const e = igEsc;
  const G = exposureGridData(_expPg.by, d);
  const P = exposureGridPick(G);
  const S = exposureCellData(G, P.k, P.g);
  const m = (G.money && _expPg.m==='v') ? 'v' : 'n';
  const money = n => { if(n==null) return ''; try{ return (typeof fmtMoneyShort==='function')?fmtMoneyShort(n):Number(n).toLocaleString(jxLocale()); }catch(_){ return String(n); } };
  /* In a square the currency is said once, in the column head. */
  const bare = n => money(n).replace(/^[^\d-]+/, '');
  const cur = (typeof jxCurrency==='function') ? jxCurrency() : '';
  const star = x => (G.money && x && x.left)
    ? `<span title="${e(i18t('int_exp_left_out',{n:x.left}))}" style="color:var(--st-amber-fg);font-weight:var(--w-body)"> *</span>` : '';
  const nC = n => i18tn('exp_pg_n', n, { n });
  /* A drawn arrow, never a typed one — `.ui-link > svg` sizes it. */
  const chev = (typeof icon==='function') ? icon('chevR','',2) : '';
  /* ════ THE LEADING ROW CARRIES THE WEIGHT (Young, 19 Sep 2026) ════════
     A 3px bar in the margin. ONE TONE, AND IT IS RUBY — this product's own
     word for "this is against you". The work order asked for ruby above a
     threshold and amber below it; THERE IS NO SUCH THRESHOLD IN THIS PRODUCT,
     and inventing one here is the score coming back through a side door,
     which this page exists to refuse.

     THE BAR IS RESERVED ON EVERY ROW, transparent where it does not draw —
     a bar that appears only on one row would shift that row's words. */
  const BAR = k => `border-left:3px solid ${d.lead===k?'var(--st-ruby-fg)':'transparent'}`;

  const seg = (attr, now, opts, label) => `<div class="doc-read-seg" role="group" aria-label="${e(label)}">${
    opts.map(([k,l])=>`<button type="button" ${attr}="${k}" aria-pressed="${now===k?'true':'false'}">${e(l)}</button>`).join('')}</div>`;
  const byCtl = seg('data-exp-by', G.by, EXP_PG_BY.map(k=>[k, i18t('exp_pg_by_'+k)]), i18t('exp_pg_by_label'));
  const mCtl = G.money ? seg('data-exp-m', m, [['n', i18t('exp_pg_m_n')], ['v', i18t('exp_pg_m_v')]], i18t('exp_pg_m_label')) : '';

  /* ════ THE HEADLINE FIGURES — the shared tile (Fit to Screen, owner-picked
     29 Sep 2026) ═══════════════════════════════════════════════════════
     Four `.igx-fig` tiles in one strip, each a door and a zero never one:
     the three this page always said (at least one · two or more · not read
     closely enough) and the LEADING EXPOSURE, which is exposureData's own
     `lead` — the first row of the ranking, by value where money is shown and
     by count where it is not — its count and its money, named. IT IS NOT A
     SCORE: nothing is added across the five, and the tile says which row
     leads, never how bad anything is. It wears no tone: ruby on this page is
     the lead's bar alone, and a coloured figure would be a verdict the
     reading does not make. Its door picks the lead row, as a press on the
     row's own total would. The full sentence rides the hover.
     THE MEANING EDGE (owner-picked 29 Sep 2026): the FIGURE stays untoned, and
     each tile says what it asks of you in the strip on its top (`m`): carrying
     an exposure is amber, not read closely enough is grey stripes (HaTi cannot
     say), and the lead tile's strip is ruby — the SAME ruby as the lead row's
     bar, the owner's reversal of "ruby is the bar alone": one exposure, one
     red. A zero tile keeps the plain count's strip. */
  const figS = (x, words) => (G.money && x.n) ? words + ' · ' + money(x.value) : words;
  const fig = (x, t, s, tip, attrs, m) => {
    const inner = `<span class="igx-fig-t">${e(t)}</span><span class="igx-fig-n">${x.n}</span><span class="igx-fig-s">${e(s)}${star(x)}</span>`;
    return x.n ? `<button type="button" class="igx-fig exp-pg-fig igx-m-${m}" ${attrs} title="${e(tip)}">${inner}</button>`
               : `<div class="igx-fig exp-pg-fig is-zero" title="${e(tip)}">${inner}</div>`;
  };
  const leadRow = G.lead ? (G.rows.find(r=>r.k===G.lead) || null) : null;
  const leadFig = leadRow
    ? `<button type="button" class="igx-fig exp-pg-fig igx-m-ruby" data-exp-cell="${e(leadRow.k)}" data-exp-g="*" data-exp-lead="1" title="${
        e(i18t(G.money ? 'exp_fit_lead_why_v' : 'exp_fit_lead_why_n'))}"><span class="igx-fig-t">${
        e(i18t('exp_fit_lead_t'))}</span><span class="igx-fig-n">${leadRow.n}</span><span class="igx-fig-s">${
        e(figS(leadRow, leadRow.title))}${star(leadRow)}</span></button>`
    : `<div class="igx-fig exp-pg-fig is-zero" data-exp-lead="1"><span class="igx-fig-t">${
        e(i18t('exp_fit_lead_t'))}</span><span class="igx-fig-n">—</span><span class="igx-fig-s">${e(i18t('exp_pg_nothing'))}</span></div>`;
  const facts = `<div class="igx-figs exp-pg-figs" style="--igx-n:4">${
    fig(G.any, i18t('exp_fit_any_t'), figS(G.any, i18t('exp_fit_any_s', { live:G.live })),
      G.any.n + ' ' + i18tn('exp_pg_fact_any', G.any.n, { live:G.live }), 'data-exp-cell="any" data-exp-g="*"', 'amber')}${
    fig(G.two, i18t('exp_fit_two_t'), figS(G.two, i18t('exp_fit_two_s')),
      G.two.n + ' ' + i18tn('exp_pg_fact_two', G.two.n, {}), 'data-exp-go="two"', 'amber')}${
    fig(G.unread, i18t('exp_fit_unread_t'), figS(G.unread, i18t('exp_fit_unread_s')),
      G.unread.n + ' ' + i18t('exp_pg_fact_unread'), 'data-exp-cell="unread" data-exp-g="*"', 'gray')}${
    leadFig}</div>`;

  const picked = (k, g) => P.k===k && P.g===g;
  const cell = (r, col) => {
    const x = r.cells[col.key];
    const tip = `${r.title} · ${col.label}: ${nC(x.n)}${(G.money && x.n) ? ' · ' + money(x.value) : ''}`;
    if(!x.n) return `<span class="exp-pg-cell is-none" title="${e(r.title + ' · ' + col.label + ': ' + i18t('exp_pg_none'))}"></span>`;
    const tone = r.k==='any' ? 'is-any' : r.k==='unread' ? 'is-cov' : ('exp-r' + (m==='v' ? x.stepV : x.stepN));
    return `<button type="button" class="exp-pg-cell ${tone}${picked(r.k, col.key) ? ' is-sel' : ''}" data-exp-cell="${e(r.k)}" data-exp-g="${e(col.key)}" aria-pressed="${picked(r.k, col.key)}" title="${e(tip)}">${
      m==='v' ? e(bare(x.value)) : x.n}</button>`;
  };
  const row = r => {
    const dead = !r.n;                       /* a zero row stands down */
    const ink = dead ? 'var(--color-neutral-500)' : 'var(--color-text)';
    const tot = `<span><b>${r.n}</b>${(G.money && r.n) ? ' · ' + e(bare(r.value)) : ''}${star(r)}</span>`;
    return `<span class="exp-pg-rl" data-exp-row="${e(r.k)}" style="${BAR(r.k)};color:${ink}" title="${e(r.title + ' — ' + r.sub)}">${e(r.title)}<small>${e(r.sub)}</small></span>${
      G.cols.map(col=>cell(r, col)).join('')}${
      r.n ? `<button type="button" class="exp-pg-tot${picked(r.k, null) ? ' is-sel' : ''}" data-exp-cell="${e(r.k)}" data-exp-g="*" aria-pressed="${picked(r.k, null)}">${tot}</button>`
          : `<span class="exp-pg-tot" style="color:${ink}">${tot}</span>`}`;
  };
  const head = `<span></span>${G.cols.map(col=>`<span class="exp-pg-hd" title="${e(col.label)}">${e(col.label)}<small>${e(i18t('exp_pg_live', { n:col.n }))}</small></span>`).join('')}<span class="exp-pg-hd is-tot">${
    e(G.money ? i18t('exp_pg_all_money', { cur }) : i18t('exp_pg_all'))}</span>`;
  /* THE ROWS SHARE THE CARD'S HEIGHT (Fit to Screen): the head row is its own
     height, the five and the two under the rule split what is left equally,
     and the rule keeps its own thin line — so no gap opens between rows and
     no band of empty card is left under the grid. */
  const grid = `<div class="igx-fill exp-pg-scroll" id="exp-pg-scroll"><div class="exp-pg-mx" style="grid-template-columns:minmax(190px,240px) repeat(${G.cols.length},minmax(60px,1fr)) 104px;grid-template-rows:auto repeat(${G.rows.length},minmax(var(--ctl-h-lg),1fr)) auto repeat(2,minmax(var(--ctl-h-lg),1fr))">${
    head}${G.rows.map(row).join('')}<span class="exp-pg-sep"></span>${row(G.any)}${row(G.unread)}</div></div>`;
  const legend = `<div class="exp-pg-legend">
      <span><span class="exp-pg-ramp"><i class="exp-r1"></i><i class="exp-r2"></i><i class="exp-r3"></i><i class="exp-r4"></i></span>${e(i18t(m==='v' ? 'exp_pg_ramp_v' : 'exp_pg_ramp_n'))}</span>
      <span><i class="exp-pg-key is-cov"></i>${e(i18t('int_exp_unread'))}</span>
      <span><i class="exp-pg-key is-none"></i>${e(i18t('exp_pg_none'))}</span>
    </div>`;
  /* THE ASTERISK EARNS A WORD — once, for the whole page. */
  const fxLine = d.fxLeft ? `
    <p class="exp-pg-note"><span style="color:var(--st-amber-fg)">*</span> ${
      e(i18tn('int_exp_fx_line', d.fxLeft, { n:d.fxLeft }))}</p>` : '';

  /* THE SQUARE'S CONTRACTS, beside the grid. Every name opens its contract;
     the door under them opens the whole square in Contracts. The list
     scrolls INSIDE the card (Fit to Screen), so the card is the grid's
     height whatever the square holds, and the door stays at its foot. */
  const side = !S || !S.n ? `<aside class="igx-card exp-pg-side"><p class="exp-pg-empty">${e(i18t('exp_pg_nothing'))}</p></aside>` : `
    <aside class="igx-card exp-pg-side" aria-live="polite">
      <div class="exp-pg-lbl">${e(S.group == null ? i18t('exp_pg_every') : i18t('exp_pg_sel_in', { dim:S.dim, group:S.group }))}</div>
      <div class="exp-pg-sel-t">${e(S.title)}</div>
      <div class="exp-pg-sel-s">${e(nC(S.n))}${G.money ? ' · ' + e(money(S.value)) + star(S) + ' · ' + e(i18t('exp_pg_largest_first')) : ''}</div>
      <div class="igx-scroll scroll-thin exp-pg-list" id="exp-pg-list">${S.items.slice(0, EXP_PG_LIST).map(it=>`
        <button type="button" class="exp-pg-li" data-exp-one="${e(it.id)}" title="${e(it.who ? it.who + ' — ' + it.name : it.name)}">
          <span class="exp-pg-who">${e(it.who || it.name || it.id)}</span>
          <span class="exp-pg-v">${G.money ? (it.left ? '<span style="color:var(--st-amber-fg)">*</span>' : e(money(it.value))) : ''}</span>
          <span class="exp-pg-sub">${e(it.name)}${it.read ? '' : ' · ' + e(i18t('exp_pg_not_read'))}</span>
          <span class="exp-pg-sub is-r">${it.carries > 1 ? e(i18t('exp_pg_of_five', { n:it.carries })) : ''}</span>
        </button>`).join('')}${
      S.items.length > EXP_PG_LIST ? `<div class="exp-pg-more">${e(i18t('exp_pg_more', { n:S.items.length - EXP_PG_LIST }))}</div>` : ''}</div>
      <button type="button" class="ui-link exp-pg-open" data-exp-open="1">${e(i18tn('exp_pg_open', S.n, { n:S.n }))}${chev}</button>
    </aside>`;

  /* ════ FIT TO SCREEN (owner-picked by name, 29 Sep 2026) ══════════════
     The shared grammar (.igx-*, index.html "INSIGHTS FITS THE SCREEN"): the
     four figures in one strip, then ONE row — the grid's card (8 parts)
     beside the list's card (4 parts), both exactly the height that is left.
     The grid's rows grow to fill their card; the list scrolls inside its. */
  return `
  <section class="exp-pg igx-fit">
    ${facts}
    <div class="igx-row exp-pg-cols" style="--igx-cols:minmax(0,8fr) minmax(0,4fr)">
      <div class="igx-card exp-pg-main">
        <div class="exp-pg-head">
          <h2>${e(i18t('exp_pg_head'))}</h2>
          <span class="exp-pg-head-sub">${e(i18t('exp_pg_head_sub'))}</span>
          <span class="exp-pg-ctl">${byCtl}${mCtl}</span>
        </div>
        ${grid}
        ${legend}${fxLine}
        <p class="exp-pg-note">${e(i18t('exp_pg_foot'))}</p>
      </div>
      ${side}
    </div>
  </section>`;
}
/* Set the grid's switches and paint the body again, keeping the reader's
   place — the body's own scroll and the grid's sideways scroll. */
function exposureGridSet(patch){
  const was = _expPg.k + '|' + _expPg.g;
  Object.assign(_expPg, patch || {});
  const host = document.getElementById('ig-exp-body');
  if(!host) return;
  const sx = document.getElementById('exp-pg-scroll');
  const left = sx ? sx.scrollLeft : 0, gTop = sx ? sx.scrollTop : 0, top = host.scrollTop;
  /* The side list keeps its place while the same square stays picked (a
     Value press); a new square starts its list at the top. */
  const ls = document.getElementById('exp-pg-list');
  const lTop = (ls && was === _expPg.k + '|' + _expPg.g) ? ls.scrollTop : 0;
  host.innerHTML = exposureHtml();
  host.scrollTop = top;
  const sx2 = document.getElementById('exp-pg-scroll');
  if(sx2){ sx2.scrollLeft = left; sx2.scrollTop = gTop; }
  const ls2 = document.getElementById('exp-pg-list');
  if(ls2) ls2.scrollTop = lTop;
}
/* EVERY FIGURE IS A DOOR, and the door out is the one the rest of this page
   already uses: regShowOnly, the named-set filter, which SAYS on the Contracts
   page what it is narrowed to and carries the way back on the same chip. A
   square's press only picks it; a name opens its contract. Delegated on the
   body, bound ONCE, and every press re-reads the live figures. */
function exposureWire(){
  const host = document.getElementById('ig-exp-body');
  if(!host || host.dataset.expWired) return;
  host.dataset.expWired = '1';
  host.addEventListener('click', ev=>{
    const b = ev.target && ev.target.closest && ev.target.closest('[data-exp-by],[data-exp-m],[data-exp-cell],[data-exp-go],[data-exp-open],[data-exp-one]');
    if(!b || !host.contains(b)) return;
    if(b.hasAttribute('data-exp-by')) return exposureGridSet({ by:b.getAttribute('data-exp-by'), g:null });
    if(b.hasAttribute('data-exp-m')) return exposureGridSet({ m:b.getAttribute('data-exp-m') });
    if(b.hasAttribute('data-exp-cell')){
      const g = b.getAttribute('data-exp-g');
      return exposureGridSet({ k:b.getAttribute('data-exp-cell'), g:(g==='*' || g==null) ? null : g });
    }
    if(b.hasAttribute('data-exp-one')){
      const id = b.getAttribute('data-exp-one');
      if(id && typeof selectContract==='function') selectContract(id);
      return;
    }
    const d = exposureData();
    const G = exposureGridData(_expPg.by, d);
    let r = null;
    if(b.hasAttribute('data-exp-open')){
      const P = exposureGridPick(G);
      const S = exposureCellData(G, P.k, P.g);
      r = S ? { ids:S.ids, title:S.group == null ? S.title : S.title + ' · ' + S.group } : null;
    } else {
      const k = b.getAttribute('data-exp-go');
      r = (k==='unread') ? { ids:d.unread.ids, title:i18t('int_exp_unread') }
        : (k==='two') ? { ids:G.two.ids, title:G.two.title }
        : (d.rows.find(x=>x.k===k)||null);
    }
    if(!r || !r.ids || !r.ids.length) return;
    if(typeof regShowOnly==='function') regShowOnly(r.ids, r.title);
  });
}
Object.assign(window,{EXP_PG_BY,EXP_PG_STEPS,EXP_PG_LIST,exposureGridData,exposureGridPick,exposureCellData,exposureGridSet});

function intelObligationsData(){
  const S=(window.state&&Array.isArray(state.contracts))?state.contracts:[];
  /* The live book — the same reading openObligations uses. A deal nobody is
     doing has no deliverables, and an archived record is filed, not live. */
  const live=S.filter(c=>c&&c.status!=='Declined'&&!c.archived);

  /* WHO THE MAIL WOULD REACH, AND WHEN, IS obReminderOf's — above, beside
     the sweep's own milestones. It was worked out inline here until the
     Reminder Line (28 Sep 2026) drew the same answer as dots and windows:
     one predicate, asked once per obligation, feeds both the counts and the
     picture, so the two cannot disagree about who is told. */
  const stateOf=o=>(typeof obState==='function')?obState(o):((o&&o.status)==='done'?'done':'open');
  /* THE KEY EVERY DOOR NARROWS BY is the Obligations list's own (obKeyOf), so
     a figure here opens exactly the rows it counted. Absent on a stage without
     js/obligations.js, where there is no list to open either. */
  const keyOf=(c,o,i)=>(typeof window.obKeyOf==='function')?obKeyOf(c.id,o,i):null;

  let total=0, open=0, done=0, overdue=0, silent=0, reasonSum=0;
  const why={ nodate:0, unreadable:0, noowner:0, gone:0, spent:0 };
  const ages=[0,0,0,0];                    // 1–4 · 5–30 · 31–90 · 90+ days overdue
  const repeat={ monthly:0, quarterly:0, annual:0 };
  let repeatTotal=0, ahead=0, aheadOurs=0, aheadTheirs=0;
  /* THE SETS BEHIND EVERY FIGURE — the keys a door narrows the Obligations
     list to, and the contract ids for the one figure that counts contracts. */
  const keys={ silent:[], overdue:[], ahead:[], ontime:[], stopped:[], ours:[], theirs:[] };
  const coverIds=[];
  /* J-2.2: the record carries `obligationsReadAt` now, stamped by the scan and
     by nothing else, so the contracts with nothing on file finally split — one
     read and genuinely clear, one nobody has ever opened. ABSENCE IS "NO
     RECORD OF A READING", never "never read": a contract scanned before that
     field existed carries no stamp, and calling it unread would be this page
     inventing a fact rather than reporting one. */
  const cover={ withOb:0, none:0, noneSigned:0, noneReview:0, noneDraft:0, noneOther:0,
    noneClear:0, noneUnknown:0 };
  /* AND WHETHER THEY WERE MET ON TIME, counted only where the record can
     answer: a completion date AND a due date. `unknown` is every obligation
     ticked off before completion carried a date — not counted either way,
     because an inferred date is a guess wearing a fact's clothes. */
  const ontime={ on:0, late:0, unknown:0 };

  /* ---- THE LANES (the Reminder Line, owner-picked 28 Sep 2026) ----
     One lane per person carrying an obligation — on OUR side the colleague
     who owes it, on THEIRS the colleague watching it — and one for nobody.
     A person is one lane however their name was typed: the lane is keyed on
     the member the mail resolves to, and on the typed name only where
     nobody resolves. */
  const lanes={ ours:new Map(), theirs:new Map() };
  const laneOf=(side,r)=>{
    const k=r.memberId?'u:'+r.memberId:(r.typed?'n:'+r.typed.toLowerCase():'');
    let L=lanes[side].get(k);
    if(!L){
      L={ key:k, side, name:r.owned?r.memberName:r.typed, named:!!r.typed, owned:r.owned,
        n:0, dots:[], later:[], nodate:[], keys:[], viaOwner:0, unreached:0, first:r.first, last:r.last };
      lanes[side].set(k,L);
    }
    return L;
  };

  live.forEach(c=>{
    const list=(c.obligations||[]);
    if(list.length) cover.withOb++;
    else {
      cover.none++; coverIds.push(c.id);
      if(c.obligationsReadAt) cover.noneClear++; else cover.noneUnknown++;
      if(c.status==='Signed') cover.noneSigned++;
      else if(c.status==='Under Review') cover.noneReview++;
      else if(c.status==='Draft') cover.noneDraft++;
      else cover.noneOther++;
    }
    list.forEach((o,i)=>{
      total++;
      const key=keyOf(c,o,i);
      if(stateOf(o)==='done'){
        done++;
        /* ON TIME, LATE, OR UNANSWERABLE — obligationOnTime is the one reading
           and it returns null wherever either date is missing, which is every
           obligation ticked off before J-2.2 and every one with no due date.
           Those are counted as UNKNOWN and printed as unknown; inferring a
           completion date would be the fault this whole page exists to name. */
        const ot=(typeof window.obligationOnTime==='function')?obligationOnTime(o):null;
        if(ot===true) ontime.on++; else if(ot===false) ontime.late++; else ontime.unknown++;
        if(ot!=null&&key) keys.ontime.push(key);
        /* MARKED REPEATING, AND SINCE J-2.2 IT REALLY DOES REPEAT — completing
           an instance opens the next one on the same cadence. The reading is
           unchanged and is what makes that safe: a commitment counts as
           STOPPED only where no obligation with the same wording is still open
           on the same contract, so a rolled series is not accused of dropping
           anything and neither is somebody who re-created one by hand. */
        const cad=String((o&&o.recurring)||'none').toLowerCase();
        if(cad!=='none'&&Object.prototype.hasOwnProperty.call(repeat,cad)){
          const d=String((o&&o.desc)||'').trim().toLowerCase();
          const alive=list.some(x=>x!==o&&String((x&&x.desc)||'').trim().toLowerCase()===d&&stateOf(x)!=='done');
          if(!alive){ repeat[cad]++; repeatTotal++; if(key) keys.stopped.push(key); }
        }
        return;
      }
      open++;
      const r=obReminderOf(o,c);
      const od=r.od, due=r.due;
      if(r.quiet){
        silent++;
        r.why.forEach(k=>{ why[k]++; });
        reasonSum+=r.why.length;
        if(key) keys.silent.push(key);
      }

      if(due!=null&&od!=null&&od<0){
        overdue++;
        if(key) keys.overdue.push(key);
        const a=-od;
        if(a<=4) ages[0]++; else if(a<=30) ages[1]++; else if(a<=90) ages[2]++; else ages[3]++;
      }

      if(due!=null&&od!=null&&od>=0&&od<=OB_HORIZON){
        ahead++;
        if(key) keys.ahead.push(key);
        if(r.ours) aheadOurs++; else aheadTheirs++;
      }

      /* ---- ONTO ITS LANE, AS A DOT THE PREDICATE ALREADY DECIDED ----
         `told` IS `!quiet` and nothing else: a hollow dot is exactly an
         obligation the headline counts. Undated ones are listed, not drawn —
         there is no day to put them on. Past the horizon they are counted on
         the lane and drawn on no day either. */
      const side=r.ours?'ours':'theirs';
      if(key) keys[side].push(key);
      const L=laneOf(side,r);
      L.n++;
      if(key) L.keys.push(key);
      if(!r.reach) L.unreached++;
      else if(r.to==='owner') L.viaOwner++;
      const dot={ key, cid:c.id, desc:String((o&&o.desc)||''), cp:String((o&&o.counterparty)||c.counterparty||''),
        contract:String(c.name||''), due, raw:r.raw, od, told:!r.quiet, why:r.why.slice(),
        to:r.to, toName:r.toName, typed:r.typed, ours:r.ours };
      if(due==null) L.nodate.push(dot);
      else if(od>OB_HORIZON) L.later.push(dot);
      else L.dots.push(dot);
    });
  });

  /* ---- THE WINDOW A LANE DRAWS IS THE PREDICATE'S OWN ----
     Drawn only where EVERY obligation on the lane reaches somebody: a lane of
     one colleague the sweep can write to, or of promises whose contracts'
     owners all can be — so a hollow dot never sits in a window claiming that
     person is emailed about it. `first`/`last` came off obReminderOf. */
  /* THE APPROVED DRAWING'S ORDER, in both groups: the colleagues the mail
     can reach, then nobody's pile, then names the mail cannot reach — so the
     lanes read from "told" down to "told nobody". Heaviest first inside each,
     so the one person carrying too much is the first of them read. A cap is
     a fact: past OB_ROWS+1 lanes the rest share ONE lane that says how many
     people it holds, and every dot is still drawn. */
  const rank=l=>l.owned?0:(!l.named?1:2);
  const laneRows=side=>{
    const all=[...lanes[side].values()].sort((a,b)=>
      rank(a)-rank(b) || b.n-a.n || String(a.name).localeCompare(String(b.name)));
    const cap=OB_ROWS+1;
    let rows=all;
    if(all.length>cap){
      const rest=all.slice(cap-1);
      const m={ key:'more', side, name:'', named:true, owned:rest.every(l=>l.owned), more:rest.length,
        n:0, dots:[], later:[], nodate:[], keys:[], viaOwner:0, unreached:0, first:rest[0].first, last:rest[0].last };
      rest.forEach(l=>{ m.n+=l.n; m.dots.push(...l.dots); m.later.push(...l.later); m.nodate.push(...l.nodate);
        m.keys.push(...l.keys); m.viaOwner+=l.viaOwner; m.unreached+=l.unreached; });
      rows=all.slice(0,cap-1).concat([m]);
    }
    return rows.map(l=>Object.assign(l,{
      band:(l.n>0&&l.unreached===0)?{ first:l.first, last:l.last }:null,
      laterKeys:l.later.map(d=>d.key).filter(Boolean),
      nodateKeys:l.nodate.map(d=>d.key).filter(Boolean),
    }));
  };

  return {
    contracts:live.length, total, open, done, overdue,
    silent, why, reasonSum, silentOverlap:Math.max(0,reasonSum-silent),
    ages, pastBoth:ages[2]+ages[3],
    ahead, aheadOurs, aheadTheirs, horizon:OB_HORIZON,
    repeat, repeatTotal, cover, coverIds,
    ontime, keys,
    lanes:{ ours:laneRows('ours'), theirs:laneRows('theirs') },
    /* The line's own furniture, read off the sweep's milestones rather than
       typed into the renderer: where the daily brief lets go, and where the
       first mail goes out. */
    briefFloor:OB_BRIEF_FLOOR, firstDays:OB_FIRST_DAYS,
    /* BOTH CLOSED 29 Aug 2026 (J-2.2). They were `false` and said so on the
       cards; the fields exist now, so the panels are real. What is still not
       on the record — who owns a duty on THEIR side — is deliberate, and the
       lane for their side says so ("nobody on our side named"). */
    canSeeScan:true, canSeeCompletedOn:true,
  };
}

/* THE CARD CHROME QUOTES portfolio.js's PF_CARD, so the three Insights tabs
   read as one page. Every value is a TOKEN — surface, divider, radius, the
   type ladder — so a change to the ladder moves both and there is nothing to
   keep in step by hand; the two padding literals are the one exception and
   f247 pins them to each other rather than to a number, which is what stopped
   RV_FLD's copy drifting 2px from the thing it quoted. */
const OB_CARD='background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius);padding:13px 15px;display:flex;flex-direction:column;min-width:0';
const OB_H='display:flex;align-items:baseline;gap:var(--s-2);margin-bottom:9px;flex-wrap:wrap';
const OB_TITLE='font-size:var(--t-body);font-weight:var(--w-title);letter-spacing:-.01em';
const OB_HINT='font-size:var(--t-label);color:var(--color-neutral-600);margin-left:auto';
const OB_LEAD='font-size:var(--t-meta);line-height:1.55;color:var(--color-neutral-700);margin:0 0 11px';
const OB_NOTE='font-size:var(--t-label);line-height:1.55;color:var(--color-neutral-600);margin:10px 0 0';
const OB_NUM='font-family:var(--font-heading);font-weight:var(--w-title);font-variant-numeric:tabular-nums;letter-spacing:-.02em';
const obCard=(title,hint,body,foot)=>`<section style="${OB_CARD}">
  <div style="${OB_H}"><span style="${OB_TITLE}">${title}</span>${hint?`<span style="${OB_HINT}">${hint}</span>`:''}</div>
  <div style="flex:1 1 auto;min-height:0">${body}</div>
  ${foot?`<div style="margin-top:auto;padding-top:10px;font-size:var(--t-label);line-height:1.55;color:var(--color-neutral-600)">${foot}</div>`:''}</section>`;
/* A flag on a card head says what KIND of thing the card is, in a word:
   a gap in the record, a commitment that has stopped, a field we do not keep. */
const obFlag=(txt,bg,fg)=>`<span style="font-size:var(--t-figure);font-weight:var(--w-title);letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:var(--radius);background:${bg};color:${fg};margin-left:auto;flex:none">${txt}</span>`;

/* ---- COLOUR DOES ONE JOB PER CHART, AND NEVER ON ITS OWN ----
   OURS is the workspace's own accent — our team's workload — and THEIRS is
   amber, which is this product's word for work owed by somebody else and
   waiting on a chaser. Amber is fixed in both the teal and the navy workspace,
   so the pair stays tellable apart whichever brand is on; a second accent-ish
   hue would collapse into the accent in one of them, which is the trap the
   calendar's own legend already paid for once.
   The pair is the payment-terms tab's now: since the Reminder Line (28 Sep
   2026) the obligations page's one colour question is "will anybody be
   told" — green filled, ruby hollow — and the SHAPE (filled or hollow) says
   it too, so no reading rests on the hue. */
/* A MONTH IS A WORD, so it follows the reader's LANGUAGE and not the market's
   (langLocale), and it carries its whole YEAR — "Jan" on an axis beside a
   calendar showing next January is two surfaces that read as though they
   disagree. portfolio.js's pfMonthLabel says the same thing and cannot be
   borrowed: it takes an OFFSET from this month, and these keys are calendar
   months off the obligations themselves.
   NO CALLER SINCE THE REMINDER LINE (28 Sep 2026), which prints DAYS through
   obDay; kept published because it is a correct reading f247 still pins. */
function obMonthLabel(key){
  const m=/^(\d{4})-(\d{2})$/.exec(String(key||''));
  if(!m) return String(key||'');
  const d=new Date(Number(m[1]), Number(m[2])-1, 1);
  try{ return d.toLocaleDateString(langLocale(),{month:'short',year:'numeric'}); }
  catch(e){ return String(key); }
}
const OB_OURS='var(--accent-solid,var(--color-accent))';
const OB_THEIRS='var(--st-amber-dot,#f59e0b)';

/* ════ THE REMINDER LINE (owner-picked by name, 28 Sep 2026) ════════════════
   *"Reminder Line"* off three drawn options (Silence First · Reminder Line ·
   Who Owes What), then "build". Every open obligation is a dot on the day it
   falls due, in a lane for the person carrying it — our colleague who owes
   it, or the colleague watching what they owe us — and one lane for nobody.
   A green window in a lane is when the reminder emails about a due date
   sitting there go out; a hollow dot will never be emailed about; overdue
   sits left of the Today line. Six tiles carry today's other readings,
   each a door.

   IT FITS THE SCREEN (owner-picked "Fit to Screen", 29 Sep 2026): the six
   tiles lead as the Insights figure strip (.igx-figs), and the line is ONE
   card that takes every pixel left (.igx-fit's second row). Its lanes share
   that height (each lane grows, none shrinks below what it draws on its
   own), and when there are more lanes than fit they scroll INSIDE the card
   (#ob-rl-scroll, .igx-scroll) while the dates row stays put. The page
   itself never scrolls on a desktop, and no empty band sits under the card.

   IT DRAWS AND COUNTS NOTHING. Every dot, window and figure is
   intelObligationsData's, and hollow/filled and the window are obReminderOf's
   — the ONE predicate the headline count asks too.

   THE DESIGNER'S NAMED LIMIT, KEPT: why a dot is silent is only in its hover.
   The hover says it in plain words (the reason, never a code), and so does
   the dot's own label for a reader who cannot hover.

   EVERY DOT AND FIGURE IS A DOOR, AND A ZERO IS NOT ONE. A dot opens its
   obligation in its own place (the contract's Obligations tab, that row
   picked — obOpenContract). A figure opens the Obligations list showing
   exactly the obligations it counted (obwGoFiltered's `only`, keyed the list's
   own way, obKeyOf), and "Nothing recorded" opens those contracts on the
   Contracts list (regShowOnly). The sets are the ones this paint drew. */
const _obRlDoors=new Map();
function intelObligationsHtml(){
  const d=intelObligationsData();
  const E=igEsc;
  const n=(v)=>Number(v||0).toLocaleString(jxLocale());
  if(!d.total) return `<div style="max-width:960px;margin:0 auto">
    <div style="max-width:560px;margin:var(--s-10) auto;text-align:center;color:var(--color-neutral-600);font-size:var(--t-body);line-height:1.6">
    <b style="color:var(--color-text)">${i18t('int_ob_none')}</b><br/>${i18t('int_ob_none_why')}</div></div>`;

  /* ---- the doors: a set remembered under an id, pressed by the wire ---- */
  _obRlDoors.clear();
  const listDoor=typeof window.obwGoFiltered==='function';
  const regDoor=typeof window.regShowOnly==='function';
  const doorOf=(id,spec)=>{
    const set=spec.kind==='contracts'?spec.ids:spec.keys;
    if(!set||!set.length) return null;
    if(spec.kind==='contracts'?!regDoor:!listDoor) return null;
    _obRlDoors.set(id,spec);
    return id;
  };
  /* A figure in a column: an em-dash for zero, a door otherwise. */
  const figHtml=(id,v,keys,label,tip,ruby)=>{
    if(!v) return '&mdash;';
    const door=doorOf(id,{ kind:'obligations', keys, label, state:'open' });
    return door
      ? `<button type="button" class="ob-rl-fig${ruby?' is-ruby':''}" data-ob-rl-door="${door}" title="${E(tip)}">${n(v)}</button>`
      : `<span title="${E(tip)}">${n(v)}</span>`;
  };

  /* ---- the line's scale: the report's own horizon either side of today ---- */
  const H=d.horizon;
  const X=off=>((Math.max(-H,Math.min(H,off))+H)/(2*H)*100);
  /* A LOCAL day, like todayISO — never toISOString, which is UTC. */
  const isoAt=off=>{ const t=new Date(); t.setHours(0,0,0,0); t.setDate(t.getDate()+off);
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`; };
  const dayWord=iso=>(typeof window.obDay==='function'&&obDay(iso))||(typeof regDotDate==='function'?regDotDate(iso):iso);
  const pct=v=>Math.round(v*100)/100;

  /* ---- a dot's hover: what it is, when, and who is told — or why nobody ---- */
  const whyWords=dt=>dt.why.map(k=>
      k==='nodate'?i18t('ob_rl_why_nodate')
    : k==='unreadable'?i18t('ob_rl_why_unreadable',{ raw:dt.raw })
    : k==='noowner'?i18t(dt.ours?'ob_rl_why_noowner_ours':'ob_rl_why_noowner_theirs')
    : k==='gone'?i18t(dt.ours?'ob_rl_why_gone_ours':'ob_rl_why_gone_theirs',{ who:dt.typed })
    : i18t('ob_rl_why_spent')).join('; ');
  const dotSay=dt=>{
    const head=[dt.desc, [dt.cp, dt.contract].filter(Boolean).join(' · ')].filter(Boolean).join(' — ');
    const when=dt.od==null?i18t('ob_rl_dot_nodate')
      : dt.od<0?i18tn('ob_rl_dot_late',-dt.od,{ date:dayWord(dt.due) })
      : dt.od===0?i18t('ob_rl_dot_today')
      : i18t('ob_rl_dot_due',{ date:dayWord(dt.due) });
    const who=dt.told
      ? i18t(dt.to==='owner'?'ob_rl_dot_to_owner':'ob_rl_dot_to',{ who:dt.toName })
      : i18t('ob_rl_dot_silent',{ why:whyWords(dt) });
    return `${head}\n${i18t(dt.ours?'ob_side_ours':'ob_side_theirs')} · ${when}\n${who}`;
  };

  /* ---- one lane ---- */
  const ownerSays=L=>L.viaOwner===0?i18t('ob_rl_sub_owner_none')
    : L.viaOwner===L.n?i18t('ob_rl_sub_owner_all')
    : i18tn('ob_rl_sub_owner_some',L.viaOwner,{ n:n(L.viaOwner) });
  const laneHtml=(L,idx)=>{
    let name, sub, ruby=false;
    if(L.key==='more'){ name=i18tn('ob_rl_more_people',L.more,{ n:n(L.more) }); sub=i18t('ob_rl_sub_more'); }
    else if(!L.named){
      name=i18t(L.side==='ours'?'ob_rl_nobody_ours':'ob_rl_nobody_theirs'); ruby=true;
      sub=L.side==='ours'?ownerSays(L):i18t('ob_rl_sub_nobody_theirs');
    } else {
      name=L.side==='theirs'?i18t('ob_rl_chasing',{ who:L.name }):L.name;
      ruby=!L.owned;
      sub=L.owned?i18t('ob_rl_sub_member')
        :i18t('ob_rl_sub_gone')+(L.side==='ours'&&L.viaOwner?' · '+ownerSays(L):'');
    }
    /* DOTS THAT WOULD TOUCH STACK, so two promises on one day are two dots. */
    const lv=[];
    const pos=L.dots.slice().sort((a,b)=>a.od-b.od).map(dt=>{
      const x=X(dt.od); let k=0;
      while(lv[k]!=null&&x-lv[k]<1.6) k++;
      lv[k]=x; return { dt, x, k };
    });
    /* The lane's FLOOR: it grows to share the card's height (.ob-rl-grid is
       a column), so the dots ride its middle rather than a fixed pixel. */
    const h=36+(Math.max(1,lv.length)-1)*13;
    const who=L.key==='more'?i18t('ob_rl_win_more')
      : (L.side==='ours'&&!L.owned)?i18t('ob_rl_owner_word'):L.name;
    const band=L.band?`<div class="ob-rl-past" style="width:${pct(X(L.band.last))}%" title="${E(i18t('ob_rl_past_tip'))}"></div>
      <div class="ob-rl-win" style="left:${pct(X(L.band.last))}%;width:${pct(X(L.band.first)-X(L.band.last))}%"
        title="${E(i18t(L.side==='ours'?'ob_rl_win_ours':'ob_rl_win_theirs',{ who, first:L.band.first, late:-L.band.last }))}"></div>`:'';
    const dots=pos.map(({dt,x,k})=>{
      const top=`calc(50% + ${(k%2?1:-1)*Math.ceil(k/2)*13}px)`;
      const say=dotSay(dt);
      return dt.key&&typeof window.obOpenContract==='function'
        ? `<button type="button" class="ob-rl-dot ${dt.told?'is-told':'is-silent'}" style="left:${pct(x)}%;top:${top}"
            data-ob-rl-key="${E(dt.key)}" data-ob-rl-cid="${E(dt.cid)}" title="${E(say)}" aria-label="${E(say.replace(/\n/g,'. '))}"></button>`
        : `<span class="ob-rl-dot ${dt.told?'is-told':'is-silent'}" style="left:${pct(x)}%;top:${top}" title="${E(say)}"></span>`;
    }).join('');
    const tag=`${L.side}:${idx}`;
    const lbl=name;
    return `<div class="ob-rl-row">
      <span class="ob-rl-who${ruby?' is-ruby':''}"><span class="ob-rl-name">${E(name)}</span><small>${E(sub)}</small></span>
      <div class="ob-rl-strip" style="min-height:${h}px">${band}
        <div class="ob-rl-brief" style="left:${pct(X(d.briefFloor))}%"></div>
        <div class="ob-rl-now" style="left:${pct(X(0))}%"></div>${dots}</div>
      <span class="ob-rl-n">${figHtml('lane:'+tag+':later',L.later.length,L.laterKeys,i18t('ob_rl_only_later',{ who:lbl }),
          i18tn('ob_rl_later_tip',L.later.length,{ n:n(L.later.length), date:dayWord(isoAt(H)) }))}</span>
      <span class="ob-rl-n">${figHtml('lane:'+tag+':nodate',L.nodate.length,L.nodateKeys,i18t('ob_rl_only_nodate',{ who:lbl }),
          i18tn('ob_rl_nodate_tip',L.nodate.length,{ n:n(L.nodate.length) }),true)}</span>
      <span class="ob-rl-n is-total">${figHtml('lane:'+tag+':open',L.n,L.keys,i18t('ob_rl_only_lane',{ who:lbl }),i18t('ob_rl_door'))}</span>
    </div>`;
  };

  /* ---- the ruler: today, and the day the daily brief lets go ---- */
  const ticks=[...new Set([-H,-2*H/3,-H/3,0,H/3,2*H/3,H,d.briefFloor].map(Math.round))].sort((a,b)=>a-b);
  const tickHtml=ticks.map(off=>{
    const words=off===0?i18t('ob_rl_today')
      : off===d.briefFloor?i18t('ob_rl_brief_stops',{ date:dayWord(isoAt(off)) })
      : dayWord(isoAt(off));
    const edge=off===-H?'transform:none':off===H?'transform:translateX(-100%)':'';
    return `<span class="${off===0?'is-now':''}" style="left:${pct(X(off))}%;${edge}"${
      off===d.briefFloor?` title="${E(i18tn('ob_rl_brief_tip',-d.briefFloor,{ n:-d.briefFloor }))}"`:''}>${E(words)}</span>`;
  }).join('');
  const groupHtml=(side,keyWord)=>{
    const lanes=d.lanes[side];
    if(!lanes.length) return '';
    const total=lanes.reduce((s,L)=>s+L.n,0);
    return `<div class="ob-rl-group">${E(i18t(keyWord))} · ${
      figHtml('group:'+side,total,d.keys[side],i18t(keyWord),i18t('ob_rl_door'))}</div>`
      +lanes.map((L,i)=>laneHtml(L,i)).join('');
  };
  const sw=(bg,edge)=>`<span class="ob-rl-sw" style="background:${bg};box-shadow:inset 0 0 0 1px ${edge}"></span>`;
  const line=`<section class="igx-card ob-rl-card">
    <div style="${OB_H}"><span style="${OB_TITLE}">${i18t('ob_rl_title')}</span>
      <span style="font-size:var(--t-label);color:var(--color-neutral-600)">${i18t('ob_rl_hint')}</span></div>
    <div class="ob-rl-legend">
      <span><span class="ob-rl-key is-told"></span>${i18t('ob_rl_key_told')}</span>
      <span><span class="ob-rl-key is-silent"></span>${i18t('ob_rl_key_silent')}</span>
      <span>${sw('var(--st-green-bg)','var(--st-green-dot)')}${i18t('ob_rl_key_window')}</span>
      <span>${sw('var(--st-ruby-bg)','var(--st-ruby-dot)')}${i18t('ob_rl_key_past')}</span>
    </div>
    <div class="ob-rl-scroll igx-scroll scroll-thin" id="ob-rl-scroll"><div class="ob-rl-grid" role="group" aria-label="${E(i18t('ob_rl_aria'))}">
      <div class="ob-rl-row is-head"><span></span><div class="ob-rl-ticks">${tickHtml}</div>
        <span class="ob-rl-n">${i18t('ob_rl_col_later')}</span><span class="ob-rl-n">${i18t('ob_rl_col_nodate')}</span><span class="ob-rl-n">${i18t('ob_rl_col_open')}</span></div>
      ${groupHtml('ours','ob_rl_ours')}${groupHtml('theirs','ob_rl_theirs')}
    </div></div>
  </section>`;

  /* ---- the six tiles: today's other readings, each a door ---- */
  /* THE INSIGHTS FIGURE TILE (.igx-fig), the same on every tab; the tone
     colours the figure only, and a tile with a set behind it is a button. */
  const tile=(id,spec,title,value,sub,tone,tip)=>{
    const door=spec&&value?doorOf(id,spec):null;
    const cls=value&&tone?` igx-${tone}`:'';
    const inner=`<span class="igx-fig-t">${E(title)}</span>
      <span class="igx-fig-n${cls}">${E(String(value))}</span>
      <span class="igx-fig-s">${E(sub)}</span>`;
    return door
      ? `<button type="button" class="igx-fig" data-ob-rl-door="${door}" title="${E(tip||i18t('ob_rl_door'))}">${inner}</button>`
      : `<div class="igx-fig">${inner}</div>`;
  };
  const known=d.ontime.on+d.ontime.late;
  const rep=[['monthly','ob_rl_t_rep_monthly'],['quarterly','ob_rl_t_rep_quarterly'],['annual','ob_rl_t_rep_annual']]
    .filter(([k])=>d.repeat[k]).map(([k,key])=>i18t(key,{ n:n(d.repeat[k]) })).join(' · ');
  const tiles=`<div class="igx-figs" style="--igx-n:6">
    ${tile('silent',{ kind:'obligations', keys:d.keys.silent, label:i18t('ob_rl_t_silent'), state:'open' },
      i18t('ob_rl_t_silent'), n(d.silent), i18t('ob_rl_t_silent_sub',{ open:n(d.open) }), 'bad', i18t('ob_rl_t_silent_tip'))}
    ${tile('late',{ kind:'obligations', keys:d.keys.overdue, label:i18t('ob_rl_t_late'), state:'open' },
      i18t('ob_rl_t_late'), n(d.overdue), i18t('ob_rl_t_late_sub',{ n:n(d.pastBoth) }), 'bad')}
    ${tile('ahead',{ kind:'obligations', keys:d.keys.ahead, label:i18t('ob_rl_t_ahead',{ days:H }), state:'open' },
      i18t('ob_rl_t_ahead',{ days:H }), n(d.ahead), i18t('ob_rl_t_ahead_sub',{ ours:n(d.aheadOurs), theirs:n(d.aheadTheirs) }), '')}
    ${tile('ontime',{ kind:'obligations', keys:d.keys.ontime, label:i18t('ob_rl_t_ontime'), state:'done' },
      i18t('ob_rl_t_ontime'), known?Math.round(d.ontime.on/known*100)+'%':'—',
      [known?i18t('ob_rl_t_ontime_sub',{ on:n(d.ontime.on), known:n(known) }):i18t('ob_rl_t_ontime_none'),
       d.ontime.unknown?i18t('ob_rl_t_unknown',{ n:n(d.ontime.unknown) }):''].filter(Boolean).join(' · '),
      known?'good':'', i18t('ob_rl_t_ontime_tip'))}
    ${tile('cover',{ kind:'contracts', ids:d.coverIds, label:i18t('ob_rl_t_cover') },
      i18t('ob_rl_t_cover'), n(d.cover.none), i18t('ob_rl_t_cover_sub',{ n:n(d.cover.noneSigned) }), 'warn', i18t('ob_rl_t_cover_tip'))}
    ${tile('stopped',{ kind:'obligations', keys:d.keys.stopped, label:i18t('ob_rl_t_rep'), state:'done' },
      i18t('ob_rl_t_rep'), n(d.repeatTotal), rep||i18t('ob_rl_t_rep_none'), 'warn', i18t('ob_rl_t_rep_tip'))}
  </div>`;

  /* The figures first, then the line in all the height that is left. */
  return `<div id="ig-ob" class="igx-fit">
    ${tiles}
    ${line}
  </div>`;
}
/* ONE LISTENER PER PAINT: #ig-oblig is rebuilt by every renderIntel, so the
   element this binds to is new each time and nothing is bound twice. */
function intelObligationsWire(host){
  if(!host) return;
  host.addEventListener('click',ev=>{
    const dot=ev.target.closest&&ev.target.closest('[data-ob-rl-key]');
    if(dot){ if(typeof window.obOpenContract==='function') obOpenContract(dot.getAttribute('data-ob-rl-cid'), dot.getAttribute('data-ob-rl-key')); return; }
    const b=ev.target.closest&&ev.target.closest('[data-ob-rl-door]');
    if(!b) return;
    const s=_obRlDoors.get(b.getAttribute('data-ob-rl-door'));
    if(!s) return;
    if(s.kind==='contracts') regShowOnly(s.ids, s.label);
    else obwGoFiltered({ state:s.state||'open', only:{ keys:s.keys.slice(), label:s.label } });
  });
}
/* ════════════════════════════════════════════════════════════════════════
   THE PAYMENT TERMS TAB (owner-ruled 2 Sep 2026)
   Option A with B's exception list folded into it, off three drawn options:
   lead with the gap between how long we wait and how long we get to pay,
   then the spread, then every contract outside the standard.

   COUNTING IS NOT DRAWING: every figure comes from payTermsData() in
   js/payterms.js. Nothing here counts anything of its own, so this page and
   the Home tile cannot come to disagree about what a contract's terms are.

   IT BORROWS THE OBLIGATIONS TAB'S OWN CARD VOCABULARY — obCard, OB_CARD,
   OB_NUM, OB_OURS, OB_THEIRS — rather than declaring a second set that agrees
   today and drifts later. Same shelf, same shell, same page.

   COLOUR DOES ONE JOB HERE AND NEVER ON ITS OWN. OURS is the workspace accent
   (money coming in) and THEIRS is amber (money going out) — the obligations
   report's own pair, for its own reason: amber is fixed in both the teal and
   the navy workspace, so the two stay tellable apart whichever brand is on.
   Every bar carries its figure, every legend spells its count, and the side is
   written in words on every exception row, so no reading rests on the hue. */
/* ---- THE ROWS SCROLL INSIDE THEIR CARD (owner-picked "Fit to Screen", 29 Sep 2026) ----
   REVERSES the 2 Sep pager ("the same height as the chart above it … pages to
   click to"). The chart now sits ABOVE the table rather than beside it, both
   full width, and the page is one screen: the table card takes the height the
   grid hands it and its rows scroll inside it (.igx-scroll), the head row held
   at the top of that scroller (sticky INSIDE it, so it stays exactly as wide as
   the rows when a scrollbar appears — the lesson of 2 Sep). Nothing is paged,
   so nothing is measured: ptFitTable, ptPagerHtml, PT_PAGE_MIN and
   intel.ptPage are gone. Every row is drawn — a list is never trimmed. */

/* ---- THE TAB'S OWN PRESSES (owner-asked 2 Sep 2026) ----
   Re-armed on every paint of the body, because a filter press REPLACES the
   markup every one of these listeners is bound to. It repaints the BODY and
   not the view: renderIntel would rebuild the tab strip and the header too,
   and the reader's place in a scrolling table is the one thing they are
   holding on to.

   THE PRESS TOGGLES. Pressing the live cut again clears it, so the way back is
   on the thing the reader pressed as well as on the table's own line. */
function ptRepaint(){
  const host = document.getElementById('ig-pt-body');
  if(!host) return;
  const keep = host.scrollTop;
  host.innerHTML = intelPayTermsHtml();
  host.scrollTop = keep;
  ptWire();
}
function ptWire(){
  /* A row opens its contract — the friction tab's own verb, and the reason the
     table is worth more than the figures above it. */
  document.querySelectorAll('[data-pt-open]').forEach(b =>
    b.addEventListener('click', () => openWorkspace(b.getAttribute('data-pt-open'))));
  document.querySelectorAll('[data-pt-bar]').forEach(b =>
    b.addEventListener('click', () => {
      const [side, bucket] = String(b.getAttribute('data-pt-bar') || '').split('|');
      const c = intel.ptCut || {};
      intel.ptCut = (c.side === side && c.bucket === bucket) ? { side:null, bucket:null } : { side, bucket };
      ptRepaint();
    }));
  document.querySelectorAll('[data-pt-side]').forEach(b =>
    b.addEventListener('click', () => {
      const side = b.getAttribute('data-pt-side');
      const c = intel.ptCut || {};
      intel.ptCut = (c.side === side && !c.bucket) ? { side:null, bucket:null } : { side, bucket:null };
      ptRepaint();
    }));
  document.querySelectorAll('[data-pt-clear]').forEach(b =>
    b.addEventListener('click', () => { intel.ptCut = { side:null, bucket:null }; ptRepaint(); }));
  /* THE FIGURE TILE IS THE TABLE'S OWN DOOR: it counts the table's own
     population (`against`), so a press puts the whole of that list in front of
     the reader — any cut cleared, the rows back at the top, the table brought
     into view on a narrow window, and the first row holding the focus. */
  document.querySelectorAll('[data-pt-all]').forEach(b =>
    b.addEventListener('click', () => {
      intel.ptCut = { side:null, bucket:null };
      ptRepaint();
      const rows = document.getElementById('ig-pt-rows');
      const card = document.getElementById('ig-pt-table');
      if(rows) rows.scrollTop = 0;
      if(card && card.scrollIntoView) card.scrollIntoView({ block:'nearest' });
      const first = rows && rows.querySelector('[data-pt-open]');
      if(first) first.focus({ preventScroll:true });
    }));
}

function intelPayTermsHtml(){
  const d = (typeof payTermsData === 'function') ? payTermsData() : null;
  const E = igEsc;
  const n = v => Number(v || 0).toLocaleString(jxLocale());
  const RULE = 'border-bottom:1px solid var(--color-divider)';
  const money = v => (d && d.money.visible && typeof fmtMoneyShort === 'function') ? fmtMoneyShort(v) : '';

  if(!d || !d.counted) return `<div style="max-width:960px;margin:0 auto">
    <div style="max-width:560px;margin:var(--s-10) auto;text-align:center;color:var(--color-neutral-600);font-size:var(--t-body);line-height:1.6">
    <b style="color:var(--color-text)">${i18t('pt_empty')}</b><br/>${i18t('pt_empty_why')}</div></div>`;

  /* ---- 1 · the two sides and the hole between them ----
     FIT TO SCREEN (owner-picked 29 Sep 2026): the grammar's own figure tile
     (.igx-fig), one strip across the top. The READINGS are unchanged — each
     side's number is written in its side's own ink (the accent, the amber),
     readable in both themes, beside the square in the exact colour of that
     side's bars; the gap is amber only when it is against us.
     THE MEANING EDGE (owner-picked 29 Sep 2026): a tile's top strip follows
     its figure's tone; We pay wears its side's amber, the gap is green when we
     are paid in first, and a side that cannot answer is grey stripes. */
  const hero = (S, kKey, subValue, subCount, tone, ink, m) => `<div class="igx-fig${S.avgDays == null ? ' igx-m-gray' : m ? ' igx-m-' + m : ''}">
    <span class="igx-fig-t"><span class="pt-sw" style="background:${tone}"></span>${i18t(kKey)}</span>
    ${S.avgDays == null
      ? `<span class="igx-fig-n" style="color:var(--color-neutral-600)">—</span>
         <span class="igx-fig-s">${i18t('pt_side_empty')}</span>`
      : `<span class="igx-fig-n" style="color:${ink}">${n(S.avgDays)} <span class="pt-unit">${i18t('pt_days')}</span></span>
         <span class="igx-fig-s">${i18t(S.basis === 'value' ? subValue : subCount, { n:n(S.n) })}</span>`}
  </div>`;

  /* THE GAP ONLY MEANS SOMETHING WHEN BOTH SIDES CAN ANSWER, so with one of
     them empty it says so rather than printing a number worked out against
     nothing. Amber only when the gap is against us — a figure that is always
     coloured is one nobody reads. */
  const gapSay = d.gap == null ? i18t('pt_gap_none')
    : d.gap > 0 ? i18t('pt_gap_fund')
    : d.gap < 0 ? i18t('pt_gap_ahead')
    : i18t('pt_gap_level');
  const gapFig = `<div class="igx-fig${d.gap == null ? ' igx-m-gray' : d.gap < 0 ? ' igx-m-green' : ''}">
    <span class="igx-fig-t">${i18t('pt_the_gap')}</span>
    ${d.gap == null
      ? `<span class="igx-fig-n" style="color:var(--color-neutral-600)">—</span>`
      : `<span class="igx-fig-n${d.gap > 0 ? ' igx-warn' : ''}">${n(Math.abs(d.gap))} <span class="pt-unit">${i18t('pt_days')}</span></span>`}
    <span class="igx-fig-s">${gapSay}</span>
  </div>`;

  /* THE FOURTH FIGURE IS THE TABLE'S OWN COUNT — `against`, the very number
     on the table's "N driving" chip — so it adds no reading, and it is the
     table's own door (ptWire, data-pt-all). NOT "over your standard": on the
     supplier side over-standard and against-you are opposites (owner-ruled
     2 Sep), and this count is the second. A zero is not a door. */
  const nAgainst = (d.against || []).length;
  const driveInner = `<span class="igx-fig-t">${i18t('pt_fit_drive_t')}</span>
    <span class="igx-fig-n${nAgainst ? ' igx-warn' : ''}">${n(nAgainst)}</span>
    <span class="igx-fig-s">${i18tn('pt_fit_drive_s', nAgainst, { n:n(nAgainst) })}</span>`;
  const driveFig = nAgainst
    ? `<button type="button" class="igx-fig" data-pt-all="1" title="${E(i18t('pt_show_all'))}">${driveInner}</button>`
    : `<div class="igx-fig">${driveInner}</div>`;

  const heroes = `<div class="igx-figs" style="--igx-n:4">
    ${hero(d.customer, 'pt_we_wait', 'pt_wait_sub_value', 'pt_wait_sub_count', OB_OURS, 'var(--accent-ink)')}
    ${hero(d.supplier, 'pt_we_pay', 'pt_pay_sub_value', 'pt_pay_sub_count', OB_THEIRS, 'var(--st-amber-fg,#b45309)', 'amber')}
    ${gapFig}${driveFig}
  </div>`;

  /* ---- 2 · where the terms sit ---- */
  const GAP_PX = 14;
  const cols = d.bucketKeys.length;
  const maxV = Math.max(1, ...d.bucketKeys.map((k, i) =>
    Math.max(d.customer.buckets[i].n, d.supplier.buckets[i].n)));
  /* WHERE THE STANDARD'S RULE IS DRAWN. Five equal columns with a gap between
     each: the boundary after column i sits at ((i+1)/5) of the width, less a
     small correction for the gaps the columns give up. Derived rather than
     typed, so it stays right if a bucket is ever added. The COUNTS never come
     from this line — payOver asks each contract its own standard. */
  const cutOf = (intel.ptCut && typeof intel.ptCut === 'object') ? intel.ptCut : {};
  const lineAt = si => si < 0 ? '0px'
    : `calc(${Math.round((si + 1) / cols * 1000) / 10}% - ${Math.round(((cols - 1) * (si + 1) / cols - si - 0.5) * GAP_PX * 10) / 10}px)`;
  /* THE CAPTION SITS ON THE LINE, UNDER THE AXIS — the owner's second fix.
     Hung to the right of the line at the TOP, as it was, it read as a label
     for the shaded block rather than as a boundary; under the axis there is
     guaranteed room and a mark there reads as an axis annotation, which is
     what it is. One row per line, so two captions can never collide however
     close the two targets are. Clamped at both ends: a caption centred on a
     line at 0% or 100% would hang off the plot. */
  const capAt = si => si < 0 ? 'left:0'
    : si >= cols - 1 ? `left:${lineAt(si)};transform:translateX(-100%)`
    : `left:${lineAt(si)};transform:translateX(-50%)`;

  /* ---- THE BOUNDARY IS A LINE PER SIDE, AND NOTHING IS SHADED (owner-asked
     2 Sep 2026: "i do not understand this chart", off a screenshot with the
     shaded right-hand side ringed) ----
     The region ran from the standard to the right EDGE, so on an ordinary book
     three of the five bands were a large amber block holding nothing at all —
     the biggest object on the chart, saying that nothing is there. It is gone.
     A boundary is a LINE, and with a target per side there are two of them, in
     their own colours, so a reader can tell which bars each one governs. Where
     the two coincide there is one line, captioned as the shared standard.
     A side with no rows, or one whose contracts carry two different playbook
     limits, gets NO line rather than one that implies it governs the rest. */
  const lineFor = (S, ink, key) => (S.rows.length && S.standard != null && S.splitAfter != null)
    ? { si:S.splitAfter, std:S.standard, ink, key } : null;
  const lc = lineFor(d.customer, OB_OURS, 'pt_target_in');
  const ls = lineFor(d.supplier, OB_THEIRS, 'pt_target_out');
  const AMBER_INK = 'var(--st-amber-fg,#b45309)';
  const lines = (lc && ls && lc.std === ls.std)
    ? [{ si:lc.si, std:lc.std, ink:AMBER_INK, key:'pt_standard' }]
    : [lc, ls].filter(Boolean);

  /* WHICH BANDS ARE PAST THAT SIDE'S OWN LINE — the owner's "shade only the
     bars that are actually past the standard". A band is only called past when
     the WHOLE band is (payStandardSplit's own rule), so the mark can never
     over-claim; the exact count is the flag on this card and the list below,
     which ask each contract its own standard. THE MARK IS RUBY, NOT AMBER:
     amber is already the money-going-out side on this chart, so an amber
     figure over an amber bar would say nothing. */
  const pastFor = S => (S.splitAfter == null ? -Infinity : S.splitAfter);
  /* ---- A BAR IS A CONTROL (owner-asked 2 Sep 2026) ----
     *"make the page interactive so that when you click on the graphs they
     filter the table accordingly."* It is a real <button>, so it is reachable
     without a mouse — this product's own rule that every act has a key beside
     its click — and an EMPTY bar is disabled rather than drawn live: a press
     that could only narrow the table to nothing is a dead press, and greying
     is what this product does where it can know that before the press.
     Pressing the live cut again clears it, so the way back is on the thing the
     reader pressed. */
  const barLive = (S, i) => cutOf.side === S.key && cutOf.bucket === d.bucketKeys[i];
  const barFor = (S, tone, i) => {
    const b = S.buckets[i];
    const h = Math.max(2, Math.round(b.n / maxV * 100));
    const past = b.n > 0 && S.standard != null && i > pastFor(S);
    const on = barLive(S, i);
    return `<button type="button" ${b.n ? '' : 'disabled '}data-pt-bar="${E(S.key)}|${E(d.bucketKeys[i])}"
      aria-pressed="${on ? 'true' : 'false'}"
      title="${E(i18t(S.key === 'customer' ? 'pt_side_cust' : 'pt_side_supp') + ' · ' + d.bucketKeys[i] + ' ' + i18t('pt_days') + ' · ' + b.n)}"
      style="position:relative;width:24px;min-height:2px;height:${b.n ? h + '%' : '2px'};background:${tone};border:0;padding:0;font:inherit;border-radius:1px 1px 0 0;display:block;cursor:${b.n ? 'pointer' : 'default'}${on ? ';outline:2px solid var(--color-text);outline-offset:2px' : ''}">
      <span data-pt-n="1" style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-family:var(--font-mono);font-size:var(--t-micro);font-variant-numeric:tabular-nums;font-weight:${past ? 'var(--w-title)' : 'var(--w-body)'};color:${past ? 'var(--st-ruby-fg)' : 'var(--color-neutral-600)'}">${n(b.n)}</span></button>`;
  };
  const ariaSpread = d.bucketKeys.map((k, i) =>
    `${k}: ${i18t('pt_are_paid')} ${d.customer.buckets[i].n}, ${i18t('pt_we_pay')} ${d.supplier.buckets[i].n}`).join('; ')
    + (lines.length ? '. ' + lines.map(L => i18t(L.key, { n:n(L.std) })).join('; ') : '');
  /* WHERE THE LINES COME FROM, said on the card. A reader has to be able to
     tell a target somebody here typed from the playbook default that answers
     when nobody has. */
  const targetNote = (d.targets.customer != null && d.targets.supplier != null)
      ? i18t('pt_targets_set', { i:n(d.targets.customer), o:n(d.targets.supplier) })
    : d.targets.customer != null ? i18t('pt_targets_in_only', { n:n(d.targets.customer) })
    : d.targets.supplier != null ? i18t('pt_targets_out_only', { n:n(d.targets.supplier) })
    : '';
  /* FIT TO SCREEN (owner-picked 29 Sep 2026): the chart card fills its cell
     of the grid, full width, ABOVE the table, and the PLOT grows to fill the
     card (.pt-plot) instead of sitting at a typed 168px. The question moves up
     beside the title and the legend to the right of it, so the height goes to
     the bars. Bars, lines, captions and the notes are unchanged. */
  const chartFoot = [targetNote,
     (d.standardVaries && !targetNote) ? i18t('pt_standard_varies', { n:n(d.standard) }) : '',
     d.noTerms.n ? i18tn('pt_no_terms', d.noTerms.n, { n:n(d.noTerms.n), total:n(d.bookN) }) : '',
     d.noSide.n ? i18tn('pt_no_side', d.noSide.n, { n:n(d.noSide.n) }) : ''].filter(Boolean).join(' ');
  const spread = `<section id="ig-pt-chart" class="igx-card">
    <div style="${OB_H}"><span style="${OB_TITLE}">${i18t('pt_spread_title')}</span>
      <span style="min-width:0;font-size:var(--t-meta);color:var(--color-neutral-700)">${i18t('pt_spread_q')}</span>
      <span style="display:flex;gap:20px;flex-wrap:wrap;margin-left:auto">
       ${[[d.customer, OB_OURS, 'pt_are_paid'], [d.supplier, OB_THEIRS, 'pt_we_pay']].map(([S, tone, k]) =>
         `<button type="button" ${S.n ? '' : 'disabled '}data-pt-side="${E(S.key)}" aria-pressed="${cutOf.side === S.key && !cutOf.bucket ? 'true' : 'false'}"
            style="display:flex;align-items:center;gap:8px;font:inherit;font-size:var(--t-meta);color:var(--color-neutral-700);border:0;background:none;padding:2px 4px;margin:-2px -4px;border-radius:var(--radius);cursor:${S.n ? 'pointer' : 'default'}${cutOf.side === S.key && !cutOf.bucket ? ';outline:2px solid var(--color-text);outline-offset:1px' : ''}">
            <span style="width:11px;height:11px;border-radius:1px;background:${tone}"></span>${i18t(k)} <b style="font-variant-numeric:tabular-nums">${n(S.n)}</b></button>`).join('')}
      </span></div>
    <div role="img" class="igx-fill" aria-label="${E(i18t('pt_spread_title') + '. ' + ariaSpread)}" style="position:relative;padding-top:22px">
      <div class="pt-plot" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${GAP_PX}px;align-items:end;position:relative;border-bottom:1px solid var(--color-divider)">
        ${d.bucketKeys.map((k, i) => `<span style="display:flex;gap:5px;align-items:flex-end;justify-content:center;height:100%">${barFor(d.customer, OB_OURS, i)}${barFor(d.supplier, OB_THEIRS, i)}</span>`).join('')}
        ${lines.map(L => `<span aria-hidden="true" style="position:absolute;top:-4px;bottom:0;left:${lineAt(L.si)};width:0;border-left:1px dashed ${L.ink};pointer-events:none"></span>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${GAP_PX}px;padding-top:8px">
        ${d.bucketKeys.map(k => `<span style="text-align:center;font-family:var(--font-mono);font-size:var(--t-micro);font-variant-numeric:tabular-nums;color:var(--color-neutral-600)">${k}</span>`).join('')}
      </div>
      ${lines.map(L => `<div style="position:relative;height:17px;margin-top:2px"><span style="position:absolute;top:0;${capAt(L.si)};white-space:nowrap;font-size:var(--t-micro);font-weight:var(--w-title);color:${L.ink}">${i18t(L.key, { n:n(L.std) })}</span></div>`).join('')}
    </div>
    ${chartFoot ? `<div style="padding-top:8px;font-size:var(--t-label);line-height:1.55;color:var(--color-neutral-600)">${chartFoot}</div>` : ''}
  </section>`;

  /* ---- 3 · ONE TABLE, SCROLLING IN ITS CARD, OF WHAT IS AGAINST YOU ----
     *"make this one scrollable table with only 'What is driving the gap'"* (2
     Sep), then *"This table should be the same height as the chart above it.
     If the list is long then it will have pages to click to. This table should
     also only contain contracts that put you at a disadvantage when it comes
     to payment terms."*

     THE POPULATION IS `against`, NOT `rows` — every contract on terms that
     cost you: paid LATER than target on the money coming in, paying SOONER
     than target on the money going out. That is a different list from
     `exceptions`, which reads "past the standard" literally on both sides and
     therefore holds a supplier you pay LATER than your own policy. That is
     money you keep — a governance fact rather than a disadvantage — and the
     Contracts filter is where it lives now.

     NOTHING IS COUNTED HERE. payTermsData answered both questions per
     contract; this draws the answers, and the head's count is that same
     reading's own length.

     ONE COLUMN TEMPLATE, DECLARED ONCE, read by the head row and by every data
     row. EVERY COLUMN IS A FRACTION, never `auto`: two grids only line up if
     their columns resolve alike, and `auto` sizes to CONTENT — measured, a
     head and a body sharing one template string still drew columns 65px and
     37px wide.

     THE ROWS SCROLL INSIDE THE CARD (Fit to Screen, 29 Sep 2026 — the 2 Sep
     pager is reversed): the head row is sticky INSIDE the scroller, because a
     sibling above it stops being the same width the moment the scroller grows
     a scrollbar. Every row is drawn; nothing is paged or trimmed. */
  const PT_COLS = 'minmax(0,.7fr) minmax(0,1.7fr) minmax(0,1.2fr) minmax(0,.7fr) minmax(0,1.3fr) minmax(0,.8fr) minmax(0,.9fr)';
  const cut = cutOf;
  const inCut = r => (!cut.side || r.side === cut.side) && (!cut.bucket || r.bucket === cut.bucket);
  const against = d.against || [];
  const rows = against.filter(inCut);
  /* The stream's NAME is resolved here, at draw time, off the id the reading
     carries — and guarded, because FOLDERS belongs to the screens and a stage
     that does not load them must draw the table rather than take the page
     down. */
  const streamOf = r => {
    try{ return (FOLDERS[r.folder] && FOLDERS[r.folder].name) || i18t('pt_no_stream'); }
    catch(e){ return i18t('pt_no_stream'); }
  };
  const cell = (v, extra) => `<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;${extra || ''}">${v}</span>`;
  const NUMCELL = 'font-family:var(--font-mono);font-size:var(--t-label);font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap';
  const head = [
    ['pt_col_ref', ''], ['pt_col_party', ''], ['pt_col_stream', ''],
    ['pt_col_side', ''], ['pt_col_terms', 'text-align:right'],
    ['pt_col_gap', 'text-align:right'], ['pt_col_value', 'text-align:right'],
  ].map(([k, x]) => `<span style="font-size:var(--t-micro);letter-spacing:.09em;text-transform:uppercase;font-weight:var(--w-title);color:var(--color-neutral-600);${x}">${i18t(k)}</span>`).join('');

  /* THE NARROWING SAYS SO AND CARRIES THE WAY BACK ON THE SAME LINE — the
     standing rule for every control on this product that can hide a row. */
  const cutWords = [cut.side ? i18t(cut.side === 'customer' ? 'pt_side_cust' : 'pt_side_supp') : '',
                    cut.bucket ? cut.bucket + ' ' + i18t('pt_days') : ''].filter(Boolean).join(' · ');
  const cutLine = cutWords
    ? `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;font-size:var(--t-meta);color:var(--color-neutral-600)">
         <span>${i18t('pt_showing', { n:n(rows.length), total:n(against.length), cut:E(cutWords) })}</span>
         <button data-pt-clear="1" type="button" class="ui-link">${i18t('pt_show_all')}</button>
       </div>` : '';

  const rowHtml = r => `<button data-pt-open="${E(r.id)}" title="${E(r.name || r.ref || r.id)}"
      style="display:grid;grid-template-columns:${PT_COLS};gap:4px 14px;align-items:baseline;width:100%;text-align:left;border:0;background:none;padding:8px 0;${RULE};font:inherit;cursor:pointer">
    ${cell(E(r.ref || r.id), 'font-family:var(--font-mono);font-size:var(--t-label);color:var(--accent-ink);font-weight:var(--w-title)')}
    ${cell(E(r.counterparty || r.name), 'font-size:var(--t-meta);color:var(--color-text)')}
    ${cell(E(streamOf(r)), 'font-size:var(--t-label);color:var(--color-neutral-600)')}
    ${cell(i18t(r.side === 'customer' ? 'pt_side_cust' : 'pt_side_supp'), `font-size:var(--t-label);color:${r.side === 'customer' ? OB_OURS : OB_THEIRS}`)}
    <span style="${NUMCELL};color:var(--color-neutral-600)">${i18t('pt_drive_terms', { d:n(r.days), t:n(r.standard) })}${r.over ? ` <b style="font-size:var(--t-micro);letter-spacing:.09em;text-transform:uppercase;color:var(--st-ruby-fg)">${i18t('pt_over_tag')}</b>` : ''}</span>
    <span style="${NUMCELL};font-weight:var(--w-title);color:${r.gapDays > 0 ? 'var(--st-ruby-fg)' : 'var(--color-neutral-500)'}">${r.gapDays > 0 ? n(r.gapDays) + ' ' + i18t('pt_days') : '—'}</span>
    <span style="${NUMCELL};color:var(--color-neutral-600)">${money(r.value) || '—'}</span>
  </button>`;

  const body = rows.length ? rows.map(rowHtml).join('')
    : `<p style="${OB_LEAD};margin:14px 0 4px">${i18t(against.length ? 'pt_tbl_none' : 'pt_tbl_clear')}</p>`;
  const drivers = `<section id="ig-pt-table" class="igx-card">
    <div style="${OB_H}"><span style="${OB_TITLE}">${i18t('pt_drive_title')}</span>
      <span style="flex:1 1 320px;min-width:0;font-size:var(--t-meta);color:var(--color-neutral-700)">${i18t(d.gap != null && d.gap > 0 ? 'pt_drive_q' : 'pt_tbl_q')}</span>${
      against.length ? obFlag(i18t('pt_drive_flag', { n:n(against.length) }), 'var(--st-amber-bg)', 'var(--st-amber-fg,#b45309)') : ''}</div>
    ${cutLine}
    <div id="ig-pt-rows" class="igx-scroll scroll-thin">
      <div class="pt-head" style="display:grid;grid-template-columns:${PT_COLS};gap:4px 14px;padding-bottom:7px;${RULE}">${head}</div>
      ${body}
    </div>
  </section>`;

  /* ---- 4 · what this page cannot see ----
     The honest limit, and it is the most important thing on the tab: HaTi
     reads agreements, not your bank. Named so the page never looks as though
     it is answering a question it cannot. FIT TO SCREEN keeps every word of it
     and lays it on ONE row under the table (.pt-blind), so the page still ends
     at the bottom of the screen. */
  const blind = `<section id="ig-pt-blind" class="igx-card pt-blind">
    <div style="font-size:var(--t-body);font-weight:var(--w-title);letter-spacing:-.01em">${i18t('pt_blind_title')}</div>
    ${[[i18t('pt_blind_1'), i18t('pt_blind_1_why')], [i18t('pt_blind_2'), i18t('pt_blind_2_why')]]
      .map(([t, w]) => `<div style="min-width:0"><div style="font-size:var(--t-meta);font-weight:var(--w-title);margin-bottom:3px">${E(t)}</div><p style="${OB_NOTE};margin:0">${w}</p></div>`).join('')}
    <p style="${OB_NOTE};margin:0">${i18t('pt_method')}</p>
  </section>`;

  /* ONE SCREEN (owner-picked "Fit to Screen", 29 Sep 2026: "update fit to
     screen where the graph is above the what is driving the gap card"). The
     shared grid (.igx-fit): the figures, then the chart (.85) ABOVE the table
     (1.15), both full width, then the honest limit. The chart's row never
     squeezes below its own drawing (min-content) — on a window too short for
     that the page scrolls, the grammar's own floor — while the table's rows
     scroll inside their card. */
  return `<div id="ig-pt" class="igx-fit" style="--igx-rows:auto minmax(min-content,.85fr) minmax(0,1.15fr) auto">
    ${heroes}${spread}${drivers}${blind}
  </div>`;
}

/* THE ONE NAMED DOOR ONTO A TAB. The Home tile presses it, so the tile cannot
   land on Insights and leave the reader on whichever tab they were last on —
   and a second door added later joins this function rather than repeating the
   two lines. An unknown key falls through to the page's own guard. */
function intelGoTab(k){
  if(k==='map' && typeof window.hbOpenExplorer==='function'){ hbOpenExplorer(); return; }
  if(IG_TABS.indexOf(k) >= 0) intel.tab = k;
  setView('intel');
}

/* ---- right-hand Copilot dock ---- */
function igSyncDockWidth(){
  const dock=document.getElementById('ig-dock'); if(!dock) return;
  /* The divider's own pass: the width, and the handle shown or stood down. */
  if(document.getElementById('ig-row')) igFitSplit(); else dock.style.width=igDockWidth()+'px';
  // the canvas flexes — re-measure and re-settle once the width transition lands
  setTimeout(()=>{ if(igMapUp()) rebuildIntelGraph(); },280);
}
function igMiniCard(id, extra){
  const c=getContract(id); if(!c) return '';
  return `
  <button data-ig-card="${c.id}" class="w-full text-left flex items-center gap-2 rounded-xl border border-brand-100 bg-white hover:border-brand-300 hover:shadow-sm px-2.5 py-2 transition">
    ${extra||''}<span class="h-6 w-6 shrink-0 grid place-items-center rounded-lg bg-brand-50 text-brand-500">${icon(cIcon(c),'w-3 h-3')}</span>
    <span class="min-w-0 flex-1">
      <span class="block truncate text-[12px] font-medium text-brand-900">${igEsc(c.name)}</span>
      <span class="block text-[10px] font-mono text-ink/45">${(window.contractRef?contractRef(c):c.id)}${isMonetary(c)&&c.value?' · '+(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):''} · ${statusLabel(c.status)}</span>
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
      <div class="min-w-0"><div class="ig-card-name text-[12.5px] font-600 text-brand-900 truncate">${igEsc(c.name)}</div>
      <div class="text-[10px] font-mono text-ink/45">${(window.contractRef?contractRef(c):c.id)}</div></div>
    </div>
    ${row('Type',igEsc(cKind(c)))}
    ${row('Counterparty',igEsc(c.counterparty||'—'))}
    ${row('Value',isMonetary(c)&&c.value?(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):'Non-monetary')}
    ${row('Status',statusLabel(c.status))}
    ${row('Expiry',eff?(eff+(d!=null?(d>=0?` · ${i18t('int_in_days',{n:d})}`:` · ${i18t('int_lapsed')}`):'')):'—')}
    ${row('Group',igEsc(groupLabelOf(c,intel.groupBy,intel.groups)))}
    ${igFactRowsHtml(c)}
    ${igDependentsHtml(c.id)}
    ${''/* THREE DOORS (Young ruled 26 Sep 2026): Analyze contract leads, because
           reading is what this panel is for; Open workspace is the door to
           work; Compare is untouched. The fill moved from Open workspace to
           Analyze — one filled button per card. */}
    <div class="mt-2 flex items-center gap-1.5" style="flex-wrap:wrap">
      <button data-ig-analyze="${c.id}" class="ui-btn ui-btn-sm ui-btn-primary" style="flex:1 1 auto" title="${i18t('int_analyze_title')}">${icon('readpaper','w-3.5 h-3.5')}${i18t('int_analyze')}</button>
      <button data-ig-ws="${c.id}" class="ui-btn ui-btn-sm" style="flex:1 1 auto">${i18t('int_open_workspace')}${icon('chevR','w-3.5 h-3.5')}</button>
      <button data-ig-cmp="${c.id}" class="ui-btn ui-btn-sm${intel.compareSel.includes(c.id)?' ui-btn-accent':''}" aria-pressed="${intel.compareSel.includes(c.id)?'true':'false'}" title="${i18t('int_stage_for_compare')}">${intel.compareSel.includes(c.id)?`${icon('check2')}Comparing`:`${icon('plus')}Compare`}</button>
    </div>
  </div>`;
}
/* A map answer's set as a file: reference, name, counterparty, stage, value
   (in the contract's own currency, and only where money may be seen). Built
   here from the record; nothing is sent anywhere. */
function igExportCsv(ids){
  const moneyOk=(typeof canViewValues!=='function')||canViewValues();
  const DQ=String.fromCharCode(34);
  const q=v=>{ const t=String(v==null?'':v); return (t.indexOf(DQ)>=0||t.indexOf(',')>=0||t.indexOf('\n')>=0)?DQ+t.split(DQ).join(DQ+DQ)+DQ:t; };
  const head=['Reference','Name','Counterparty','Status'].concat(moneyOk?['Value','Currency']:[]);
  const rows=ids.map(id=>getContract(id)).filter(Boolean).map(c=>[(window.contractRef?contractRef(c):c.id), c.name, c.counterparty||'', statusLabel(c.status)]
    .concat(moneyOk?[(typeof isMonetary==='function'&&!isMonetary(c))||!(Number(c.value||0)>0)?'':Number(c.value), (typeof contractCurrency==='function')?contractCurrency(c):'']:[]));
  return [head].concat(rows).map(r=>r.map(q).join(',')).join('\n');
}
function igExportList(ids){
  try{ const blob=new Blob([igExportCsv(ids)],{ type:'text/csv;charset=utf-8' }), a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='explorer-'+((typeof todayISO==='function')?todayISO():'list')+'.csv';
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },0);
  }catch(_){ if(typeof toast==='function') toast(i18t('int_export_failed'),'err'); }
}
function igMsgHTML(m,i){
  if(m.role==='user')
    return `<div class="ai-msg flex justify-end"><div class="ai-bub max-w-[85%] rounded-2xl rounded-br-md bg-brand-900 text-white px-3.5 py-2 text-[13px]">${igEsc(m.text)}</div></div>`;
  // Q&A answers stay text-only — the matching contracts are still highlighted on
  // the graph (igPaintIds), but we no longer append a card list under the answer.
  const body = m.ranked ? m.ranked.map((r,i)=>igRankCard(r,i)).join('')
    : m.explainId ? igExplainCard(m.explainId)
    : (m.compare && typeof aiCompareTable==='function' ? aiCompareTable(m.compare) : '');
  /* AN ANSWER ABOUT THE PAPER CARRIES ITS PASSAGES AS PRESSES (26 Sep 2026):
     one chip per verbatim quote the server kept, numbered by its pin on the
     paper; an answer that rests on no passage says so under its text, so a
     silence is never mistaken for a jump that did not happen. */
  const cites=(m.paperId&&Array.isArray(m.quotes))?igCitesHtml(m,i):'';
  return `<div class="ai-msg flex gap-2"${Number.isInteger(i)?` data-ig-turn="${i}"`:''}>
    <div class="h-6 w-6 shrink-0 grid place-items-center rounded-lg bg-gold-500/15 text-gold-600 mt-0.5">${icon('sparkle','w-3 h-3')}</div>
    <div class="min-w-0 flex-1 space-y-1.5">
      ${m.text?`<div class="ai-bub rounded-2xl rounded-tl-md border px-3.5 py-2 text-[13px] leading-relaxed ${m.err?'bg-rose-50 border-rose-200 text-rose-800':'bg-canvas border-brand-100 text-brand-900'}">${igSafeHtml(m.text)}${cites}</div>`:''}
      ${''/* THE ANSWER IS A WORKLIST DOOR (the brain drawing, 28 Sep 2026): the
             set a map answer drew opens on the Contracts page as that list
             (regShowOnly, the one named-set door), or leaves as a file. */}
      ${''/* ASK BACK (the view recipe, 28 Sep 2026): when a request could mean
             more than one thing, or cannot be done as asked, the answer carries
             the two or three things it could mean, as presses. */}
      ${''/* THE BOARD'S PRESSES (work order Part 5): a big build offered as a list
             with ticks, and Undo for an answer that changed the board */}
      ${(Number.isInteger(i)&&m.preview&&typeof window.hbPreviewHtml==='function')?hbPreviewHtml(m.preview):''}
      ${''/* a choice sits right under the sentence that offers it; then how the
             question was read, with the next questions; then Undo (Part 4) */}
      ${(Number.isInteger(i)&&Array.isArray(m.choices)&&m.choices.length)?`<div class="igd-choices" style="display:flex;gap:6px;flex-wrap:wrap">${m.choices.map((c,j)=>`<button type="button" class="ui-btn ui-btn-sm" data-ig-choice="${i}:${j}">${igEsc(c.label)}</button>`).join('')}</div>`:''}
      ${(Number.isInteger(i)&&m.reading&&typeof window.hbReadingHtml==='function')?hbReadingHtml(m.reading,hbReadingLive(i)):''}
      ${(Number.isInteger(i)&&m.undo&&typeof window.hbUndoHtml==='function')?hbUndoHtml(m.undo):''}
      ${(Number.isInteger(i)&&m.boardReply&&typeof window.hbMarksHtml==='function')?hbMarksHtml(i,m):''}
      ${(Number.isInteger(i)&&m.deeper&&!m.err&&typeof window.hbDeeperHtml==='function')?hbDeeperHtml(m.deeper):''}
      ${(Number.isInteger(i)&&Array.isArray(m.listIds)&&m.listIds.length)?`<div class="igd-list" style="display:flex;gap:12px;flex-wrap:wrap;padding-left:2px"><button type="button" class="ui-link" data-ig-list="${i}">${i18t('int_open_list',{ n:m.listIds.length })}</button><button type="button" class="ui-link" data-ig-export="${i}">${i18t('int_export_list')}</button></div>`:''}
      ${body}
    </div>
  </div>`;
}
/* the line over the ask box, on Home's board only (Part 10) */
const IG_PRE_MS = 250;
let _igPreT = null;
function igPreOn(){ return !!(window.state && state.view==='dashboard' && typeof window.hbFace==='function' && hbFace()==='board' && typeof window.hbAskReadingOf==='function'); }
function igPrePaint(){
  const el=document.getElementById('igd-pre'), inp=document.getElementById('igd-input'); if(!el||!inp) return;
  let t=''; try{ t=hbAskPreviewText(hbAskReadingOf(inp.value)); }catch(_){ t=''; }
  el.textContent=t; el.title=t;
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
  /* ---- WHAT THE READER IS TYPING SURVIVES A REPAINT (26 Sep 2026, the
     overnight clean-up) ---- The dock is rebuilt when an answer lands, and the
     box was rebuilt empty with it — so a question typed while the last answer
     was still coming was lost twice over: pressing Enter emptied the box and
     asked nothing (intelAsk refuses while busy), and the repaint then took
     what was left. The words and the caret are carried across. */
  const _was=document.getElementById('igd-input');
  const _keep=_was?_was.value:'', _focus=!!(_was&&document.activeElement===_was);
  const msgs=intel.history.map(igMsgHTML).join('');
  const typing=intel.busy?`
    <div class="ai-msg flex gap-2">
      <div class="h-6 w-6 shrink-0 grid place-items-center rounded-lg bg-gold-500/15 text-gold-600 mt-0.5">${icon('sparkle','w-3 h-3')}</div>
      <div class="rounded-2xl rounded-tl-md bg-canvas border border-brand-100 px-3.5 py-2.5 typing"><span></span><span></span><span></span></div>
    </div>`:'';
  dock.innerHTML=`
    <div class="flex items-center gap-2 px-3.5 py-3 border-b border-hair shrink-0">
      <span class="text-gold-500">${icon('sparkle','w-4 h-4')}</span>
      <span class="ig-dock-title font-display font-700 text-[13px] text-ink flex-1">${i18t('int_intelligence_panel')}</span>
      ${(()=>{ const b=(typeof copilotBrainInfo==='function')?copilotBrainInfo():{live:false,get label(){ return i18t('int_basic_mode'); },hint:''};
        return b.live
          ?`<span title="${igEsc(b.hint)}" class="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-600 text-white" style="background:var(--color-accent-800,#2c455d)">✦ ${igEsc(b.label)}</span>`
          :`<span title="${igEsc(b.hint)}" class="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-600" style="background:var(--st-amber-bg);color:var(--st-amber-fg)">○ Basic mode</span>`; })()}
      ${intel.history.length?`<button id="igd-history-clear" title="${i18t('int_clear_conversation')}" class="ui-btn ui-btn-plain ui-btn-sm ui-btn-icon" aria-label="${i18t('int_clear_conversation')}">${icon('trash','w-3.5 h-3.5')}</button>`:''}
      <button id="igd-collapse" title="${i18t('int_collapse_panel')}" aria-label="${i18t('int_collapse_panel')}" class="ui-btn ui-btn-plain ui-btn-sm ui-btn-icon">${icon('chevR')}</button>
    </div>
    ${intel.lenses.length?`
    <div class="px-3.5 py-2 border-b border-hair shrink-0 flex flex-wrap items-center gap-1.5">
      ${intel.lenses.map(l=>`
        <span data-lens-hover="${l.id}" class="ig-lens inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-mono cursor-pointer ${l.on?'border-brand-500 bg-brand-50 text-brand-700':'border-line bg-white text-ink/40'}">
          <button data-lens-toggle="${l.id}" title="${l.on?'Lens on — click to ignore':'Lens off — click to apply'}">${igEsc(l.label)} · ${l.ids.length}</button>
          <button data-lens-x="${l.id}" title="${i18t('int_remove_lens')}" aria-label="${i18t('int_remove_lens')}" class="hover:text-rose-600" style="display:inline-grid;place-items:center">${icon('x','w-3 h-3')}</button>
        </span>`).join('')}
      <button id="igd-clear" class="text-[10.5px] font-600 text-brand-600 hover:text-brand-800 ml-auto">${i18t('int_clear_all')}</button>
    </div>`:''}
    <div id="igd-feed" class="flex-1 min-h-0 overflow-y-auto scroll-thin px-3.5 py-3 space-y-3" style="background:transparent">
      ${msgs||`<div class="ig-welcome text-[12.5px] text-ink/50 leading-relaxed pt-2">${i18t('int_notebook_welcome')}</div>`}
      ${typing}
    </div>
    ${''/* SAVED VIEWS — the reader's own recipes, one press each (the view
           recipe, 28 Sep 2026). Drawn only when there is one. */}
    ${(()=>{ const v=igViewsRead(); return v.length?`<div class="px-3.5 pb-1.5 shrink-0 flex flex-wrap items-center gap-1.5" data-ig-views><span class="text-[10.5px] uppercase tracking-wider text-ink/40">${i18t('int_saved_views')}</span>${v.slice(-4).reverse().map(x=>`<button type="button" data-ig-saved="${igEsc(x.name)}" title="${igEsc(x.name)}" class="text-[10.5px] rounded-full border border-brand-100 bg-canvas hover:bg-brand-50 px-2.5 py-1 text-brand-700 transition text-left" style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${igEsc(x.name)}</button>`).join('')}</div>`:''; })()}
    ${!intel.history.length?`
    <div class="px-3.5 pb-2 shrink-0 flex flex-wrap gap-1.5">
      ${((state.view==='dashboard'&&typeof hbSuggestions==='function'&&hbSuggestions())||IG_SUGGESTIONS.slice(0,3)).map(s=>`<button data-igsug="${igEsc(s)}" class="text-[10.5px] rounded-full border border-brand-100 bg-canvas hover:bg-brand-50 hover:border-brand-300 px-2.5 py-1 text-brand-700 transition text-left">${igEsc(s)}</button>`).join('')}
    </div>`:''}
    ${intel.compareSel.length?`
    <div class="px-3.5 py-2 border-t border-hair shrink-0 flex items-center gap-2 bg-brand-50/40">
      <span class="text-[11px] text-brand-800/70 flex-1 min-w-0 truncate">${i18t('int_comparing')} <b class="text-brand-900">${intel.compareSel.length}</b>: ${intel.compareSel.map(id=>igEsc(getContract(id)?.name||(window.contractRef?contractRef(getContract(id)||{id}):id))).join(', ')}</span>
      <button id="igd-cmp-clear" class="text-[10.5px] font-600 text-ink/50 hover:text-ink">${i18t('int_clear')}</button>
      <button id="igd-cmp-run" class="ui-btn ui-btn-sm${intel.compareSel.length<2?'':' ui-btn-primary'}" title="${intel.compareSel.length<2?'Tap “+ Compare” on one more node first':'Run the side-by-side comparison'}">${intel.compareSel.length<2?'Pick 1 more…':'Compare '+intel.compareSel.length}</button>
    </div>`:''}
    <div class="p-3 border-t border-hair shrink-0 relative">
      ${''/* THE BOX SAYS WHICH CONTRACT IT ASKS ABOUT (26 Sep 2026): the reader's
             own switch, read back on the control that carries it — never a
             line above it. The cost of a question rides the hover. */}
      ${''/* A BOX THAT WRAPS (Young, 28 Sep 2026: "the question field in copilot
             does not allow for wrap text"): the one composer on the product that
             was a single-line <input>, so a question the strip wrote ran off its
             right edge. It is now the chat-field every other composer is — it
             grows with its words up to its cap, Enter asks, Shift+Enter breaks
             the line — and Ask sits at its foot, where a growing box keeps it. */}
      ${igPreOn()?`<div id="igd-pre" class="hb-pre" aria-live="polite"></div>`:''}
      <textarea id="igd-input" rows="1" placeholder="${igEsc(igAskPlaceholder())}" title="${igEsc(igAskCost())}" class="chat-field w-full rounded-xl border border-inputln bg-white pl-3.5 pr-16 py-2.5 text-[13px] outline-none focus:border-brand-600 focus:ring-[3px] focus:ring-[rgba(11,122,95,.1)] transition" style="display:block"></textarea>
      <button id="igd-go" class="ui-btn ui-btn-sm ui-btn-primary absolute" style="right:18px;bottom:20px">${i18t('int_ask')}</button>
    </div>`;
  const feed=document.getElementById('igd-feed'); feed.scrollTop=feed.scrollHeight;
  // charts in dock answers come back to life after every repaint
  if(typeof aiHydrateCharts==='function'){
    const blocks=intel.history.flatMap(m=>(m&&m.blocks)||[]);
    if(blocks.length) aiHydrateCharts(blocks);
  }
  // wiring
  document.getElementById('igd-collapse').addEventListener('click',()=>{ intel.dockOpen=false; renderIntelDock(); igSyncDockWidth(); });
  /* The » widen button went on 27 Sep 2026 — the divider beside the panel is
     the one way to set its width (igWireSplit). */
  if(_keep){ const n=document.getElementById('igd-input'); if(n){ n.value=_keep; if(_focus){ try{ n.focus(); }catch(_){ } } } }
  if(window.chatFieldWire) chatFieldWire(dock);
  /* A question is only taken out of the box when it is really asked: while an
     answer is still coming it stays where it was typed (see above). */
  const go=()=>{ const inp=document.getElementById('igd-input'); const v=inp.value;
    if(!String(v||'').trim()||intel.busy) return;
    inp.value=''; if(window.chatFieldGrow) chatFieldGrow(inp); intelAsk(v); };
  document.getElementById('igd-go').addEventListener('click',go);
  document.getElementById('igd-input').addEventListener('keydown',e=>{
    if(window.chatFieldSubmits ? chatFieldSubmits(e) : (e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),true))) go(); });
  /* SEE IT WHILE YOU TYPE (Part 10): after a short pause, the board's ONE
     reading of the words in the box, said on the line above it. Costs nothing,
     writes nothing; the line's room is always there, so nothing moves. */
  if(igPreOn()){ const inp=document.getElementById('igd-input');
    inp.addEventListener('input',()=>{ clearTimeout(_igPreT); _igPreT=setTimeout(igPrePaint,IG_PRE_MS); });
    if(_keep) igPrePaint(); }
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
  /* Analyze contract — the card's first door (26 Sep 2026) — and the passages
     under an answer, each a press that puts those words in front of the
     reader. */
  dock.querySelectorAll('[data-ig-analyze]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); igAnalyze(b.getAttribute('data-ig-analyze')); }));
  dock.querySelectorAll('[data-ig-choice]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation();
    const [t,k]=String(b.getAttribute('data-ig-choice')||'').split(':').map(Number); const m=intel.history[t], c=m&&m.choices&&m.choices[k];
    if(!c) return; intel.history.push({ role:'user', text:c.label });
    /* a choice on Home's board is that card's recipe, pressed through the board's one applier (work order Part 6) */
    if(Array.isArray(c.board)&&typeof window.hbChoicePress==='function'){ const out=hbChoicePress(c); if(out) intel.history.push(Object.assign({ role:'assistant', text:out.html }, out.undo?{ undo:out.undo }:{})); renderIntelDock(); return; }
    igRecipeRun({ acts:c.acts }); renderIntelDock(); updateIntelNote(); }));
  dock.querySelectorAll('[data-ig-saved]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation();
    const name=b.getAttribute('data-ig-saved'); intel.history.push({ role:'user', text:name }); igRecipeRun({ acts:[{ open:name }] }); renderIntelDock(); updateIntelNote(); }));
  dock.querySelectorAll('[data-ig-list]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation();
    const m=intel.history[Number(b.getAttribute('data-ig-list'))]; if(!m||!m.listIds||typeof regShowOnly!=='function') return;
    regShowOnly(m.listIds.filter(id=>getContract(id)), m.listTitle||i18t(IG_TAB_LABEL.map)); }));
  dock.querySelectorAll('[data-ig-export]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation();
    const m=intel.history[Number(b.getAttribute('data-ig-export'))]; if(m&&m.listIds) igExportList(m.listIds); }));
  dock.querySelectorAll('[data-ig-cite]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation();
    const [t,k]=String(b.getAttribute('data-ig-cite')||'').split(':').map(Number); igLight(t,k); }));
  /* "See the list" — the register's ONE door onto a named set, carrying the
     chip that says what the list is and the way back. Never a second list
     drawn in the dock. */
  dock.querySelectorAll('[data-ig-deps]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation();
    const id=b.getAttribute('data-ig-deps'); const d=graphDependents(id);
    if(!d.contracts.length||typeof regShowOnly!=='function') return;
    regShowOnly(d.contracts.map(x=>x.id), i18t('int_dep_list_label',{id:(window.contractRef?contractRef(getContract(id)||{id}):id)})); }));
  // node-driven comparison: stage/unstage a contract, run or clear the tray
  dock.querySelectorAll('[data-ig-cmp]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); intelToggleCompare(b.getAttribute('data-ig-cmp')); }));
  document.getElementById('igd-cmp-clear')?.addEventListener('click',()=>{ intel.compareSel=[]; igPaintIds(null); renderIntelDock(); });
  document.getElementById('igd-cmp-run')?.addEventListener('click',()=>intelRunCompare());
  // clear the dock conversation (lenses are separate and survive on purpose)
  document.getElementById('igd-history-clear')?.addEventListener('click',()=>{
    // cleared immediately — no confirm prompt (lenses are separate and survive)
    /* AND THE ANALYSIS GOES WITH THE CONVERSATION (26 Sep 2026): the paper,
       its pins and the strip are the conversation's — the bin is the one act
       that ends them, so no second control was added for it. */
    intel.history=[]; intel.compareSel=[]; intel.paper=null; igPaintPaper(); igPaintIds(null); renderIntelDock();
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
  const recLinks=buildGraphEdges(state.contracts).filter(e=>e.kind!=='party');
  recLinks.forEach(r=>{
    const a=getContract(r.from), b=getContract(r.to);
    if(!a||!b) return;
    if(ownIds.has(a.id)&&!ownIds.has(b.id)&&!linked.includes(b)) linked.push(b);
    if(ownIds.has(b.id)&&!ownIds.has(a.id)&&!linked.includes(a)) linked.push(a);
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
  recLinks.forEach(r=>{
    if(nodes.some(n=>n.id===r.from)&&nodes.some(n=>n.id===r.to)) edges.push({from:r.from,to:r.to,label:r.label});
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
      <button id="pm-close" class="ui-btn ui-btn-plain ui-btn-icon">${icon('x')}</button>
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

/* ============================================================
   ANALYZE CONTRACT — THE PAPER IN THE GRAPH'S COLUMN
   (Young ruled 26 Sep 2026: "Build the all in one option")
   ============================================================
   The card's first door puts one contract's paper where the nodes were, and
   the panel's questions go with that contract's wording. An answer's verbatim
   passages come back as presses; each leaves a numbered pin in the paper's
   margin and lights its words; the X-ray map runs down the paper's side; and
   Focus folds the page's head away so the paper takes the column's full
   height. A Graph | Paper switch on the strip goes back and forth without
   losing anything — the nodes are COVERED, never rebuilt, and the paper is
   HIDDEN, never torn down.

   WHAT IS BORROWED, so nothing here is a second reading:
     docSheetHtml     the working copy's ONE builder (contract.js), asked for a
                      read-only copy with its own canvas id;
     pagesWatch       the page-maker the Document tab uses, same options;
     scrollToQuote    the risk scan's own "take me to these words", asked to
                      HOLD its mark (js/ai.js) — the pin is that mark;
     docXrayRows      the X-ray's own clause map over this canvas, the
                      answers' clauses joining it in steel;
     contractPlainText this page's own reader of the wording it sends.
   NO ROUTE, NO STORE, NO FIELD, NO WRITE: intel.paper lives for the sitting,
   the record is never touched (f392 greps this block for the funnel's names),
   and the wording travels only as the question's own message. */
const IG_PAPER_RULE='Answer from THE WORDING below (and THE NEGOTIATION RECORD after it, where one is sent) and from nothing else about this contract. In deliver_answer, cite this contract once per passage your answer rests on, with "quote" carrying that ONE continuous passage copied character for character from the wording — never joined, never paraphrased, at least a full clause or sentence. Where the answer rests on a duty (a payment, a notice, a delivery), quote the sentence that creates it. Name the article or clause each point comes from. If the wording says nothing on the point, say so and quote nothing.';
const IG_QUOTE_LABEL_WORDS=7;
function igPaperUp(){ return !!(intel.paper&&intel.paper.mode==='paper'&&getContract(intel.paper.id)); }
function igPaperText(c){ return (typeof contractPlainText==='function')?contractPlainText(c):''; }
function igPaperWords(c){ return igPaperText(c).split(/\s+/).filter(Boolean).length; }
/* ---- WHAT CHANGED TRAVELS WITH THE PAPER (Young asked 30 Sep 2026: "I want
   to be able to ask copilot in explorer page to summarize changes while the
   paper is open ... with no limitations") ----
   The paper is the agreed wording only, so a question about what changed had
   nothing to answer from: the rule said "the wording and nothing else". The
   negotiation's own record now rides the same message — for every clause a
   change touched, its wording WHEN THE NEGOTIATION STARTED (the first round's
   baseline; a closed round moves the live baseline, so the original is the
   first round's copy), then every change on it oldest first, whole: who, when,
   the status now, the proposed wording, the reason asked and the answer given.
   Every status is sent (agreed, waiting, rejected, parked, replaced), each
   saying whether it is on the paper. NOTHING IS CLIPPED OR COUNTED OUT here;
   the one ceiling is the document's own (aiDocChars on the route), and a cut
   there is a fact the answer states.
   READ RAW, like the ladder: c.changes and c.negotiation.rounds, never
   negoChanges/negoInit, which would create a negotiation to answer a read. */
const IG_PAPER_CHANGES_RULE='THE NEGOTIATION RECORD after the wording is the story of this contract: for every clause a change touched, its wording when the negotiation started, then every change proposed on it, oldest first, with who proposed it, when, its status now and any reason given. THE WORDING is the paper as the reader sees it now and carries only the agreed changes. When asked what changed, answer from both, completely: every change in the record, never a sample. Say of each one whether it is agreed and on the paper, waiting for an answer, rejected, or replaced by a later proposal, and never present wording that is not agreed as if it were in the contract. Name each clause by its heading. Wording that is not on the paper (what a clause said before, or what was proposed and not agreed) is quoted inside the answer text and labelled as such, never as a citation: a citation quote comes from THE WORDING only, because it is lit on the paper.';
const IG_CHANGE_SAYS={
  accepted:'AGREED, on the paper now (unless a later agreed change on the same clause replaced it)',
  pending:'WAITING FOR AN ANSWER, not on the paper',
  rejected:'REJECTED, not on the paper',
  countered:'PARKED under the counter-proposal {x}, not on the paper',
  superseded:'REPLACED by the later proposal {x}, not on the paper',
};
function igPaperChanges(c){
  const none={ text:'', count:0 };
  if(!c) return none;
  const n=(c.negotiation&&typeof c.negotiation==='object')?c.negotiation:null;
  const rounds=(n&&Array.isArray(n.rounds))?n.rounds:[];
  const all=[];
  rounds.forEach(r=>((r&&Array.isArray(r.changes))?r.changes:[]).forEach(ch=>{ if(ch) all.push({ ch, round:ch.roundN||(r&&r.n)||null }); }));
  (Array.isArray(c.changes)?c.changes:[]).forEach(ch=>{ if(ch) all.push({ ch, round:ch.roundN||(n&&n.round)||null }); });
  if(!all.length) return none;
  const flat=s=>String(s==null?'':s).replace(/\s+/g,' ').trim();
  const say=s=>`"${flat(s)}"`;
  const day=s=>String(s||'').slice(0,10);
  /* The original: the first round's baseline, else the live one. */
  const base=String((rounds[0]&&rounds[0].baselineBody)||(n&&n.baselineBody)||'');
  let segs=[], front='';
  try{ if(base&&typeof clauseSegment==='function') segs=clauseSegment(base)||[]; }catch(_){ segs=[]; }
  try{ if(base&&typeof clauseFrontSplit==='function'&&typeof richToText==='function') front=richToText(clauseFrontSplit(base).front||''); }catch(_){ front=''; }
  const isFront=id=>(typeof negoIsFrontId==='function')?negoIsFrontId(id):id==='front';
  const shown=s=>(typeof clauseNameShown==='function')?clauseNameShown(s):flat(s);
  const groups=new Map();
  all.forEach(x=>{ const k=String(x.ch.clauseId||''); if(!groups.has(k)) groups.set(k,[]); groups.get(k).push(x); });
  const us=(typeof contractParty==='function'&&contractParty(c))||window.FIRST_PARTY||'us';
  const them=c.counterparty||'the other side';
  const sideOf=s=>s==='owner'?`our side, ${us}`:s==='counterparty'?`their side, ${them}`:(s||'side not recorded');
  const out=[`=== THE NEGOTIATION RECORD OF ${(window.contractRef?contractRef(c):c.id)} ===`,
    `${all.length} proposed change${all.length===1?'':'s'} across ${groups.size} clause${groups.size===1?'':'s'}, oldest first. The negotiation is in round ${(n&&n.round)||1}.`];
  groups.forEach((list,k)=>{
    const seg=segs.find(s=>s&&s.clauseId===k);
    const first=list[0].ch;
    const label=isFront(k)?'The opening, before the first clause'
      :shown(first.clauseLabel||(seg&&seg.headingText)||list.map(x=>x.ch.headingText).find(Boolean)||k);
    out.push('', `--- ${label} ---`);
    const orig=isFront(k)?front:(seg?[seg.headingText,seg.text].filter(Boolean).join(' '):'');
    if(flat(orig)) out.push(`Wording when the negotiation started: ${say(orig)}`);
    else if(list.every(x=>x.ch.changeType==='insertClause')) out.push('Not in the contract when the negotiation started: it was proposed as a new clause.');
    else if(flat(first.oldText)) out.push(`Wording before the first change on it: ${say(first.oldText)}`);
    list.forEach((x,i)=>{
      const ch=x.ch;
      const kind=ch.changeType==='insertClause'?'add a new clause':ch.changeType==='deleteClause'?'remove the clause':'change the wording';
      out.push(`${i+1}. ${ch.id||'change'}${x.round?` (round ${x.round})`:''}: proposed to ${kind} by ${flat(ch.author)||'someone not recorded'} (${sideOf(ch.authorSide)})${day(ch.createdAt)?` on ${day(ch.createdAt)}`:''}.`);
      let st=(IG_CHANGE_SAYS[ch.status]||flat(ch.status)||'status not recorded')
        .replace('{x}',flat(ch.status==='countered'?ch.counteredBy:ch.supersededBy)||'that followed it');
      if((ch.status==='accepted'||ch.status==='rejected')&&ch.resolvedBy) st+=`, decided by ${flat(ch.resolvedBy)}${day(ch.resolvedAt)?` on ${day(ch.resolvedAt)}`:''}`;
      if(ch.withdrawn) st+=', and the side that asked has since let it go';
      out.push(`   Status: ${st}.`);
      if(ch.headingText) out.push(`   Heading proposed: ${say(ch.headingText)}`);
      if(ch.formattingOnly) out.push('   Formatting only: no words changed.');
      else if(ch.changeType!=='deleteClause'&&flat(ch.newText)) out.push(`   Proposed wording: ${say(ch.newText)}`);
      if(ch.changeType==='deleteClause'&&flat(ch.oldText)) out.push(`   Wording it proposed to remove: ${say(ch.oldText)}`);
      const why=(typeof negoReasonOf==='function')?negoReasonOf(ch):ch.why;
      if(flat(why)) out.push(`   Why it was asked: ${say(why)}`);
      if(flat(ch.reply)) out.push(`   Said with the decision: ${say(ch.reply)}`);
    });
  });
  return { text:out.join('\n'), count:all.length };
}
/* What a question on the open paper sends, counted: the wording and, where
   there is one, the record. The ask box's hover says it (Copilot's place: the
   cost is visible before the press). */
function igPaperCost(c){
  const story=igPaperChanges(c);
  return { words:igPaperWords(c)+(story.text?story.text.split(/\s+/).filter(Boolean).length:0), changes:story.count };
}
function igAskPlaceholder(){
  const c=igPaperUp()?getContract(intel.paper.id):null;
  if(!c && state.view==='dashboard' && typeof window.hbPlaceholder==='function'){ const h=hbPlaceholder(); if(h) return h; }
  return c?i18t('int_ask_contract',{ref:(window.contractRef?contractRef(c):c.id)}):i18t('int_ask_portfolio');
}
function igAskCost(){
  const c=igPaperUp()?getContract(intel.paper.id):null;
  if(!c) return '';
  const k=Number(intel.paper.changes||0);
  return k>0
    ? i18t('int_ask_contract_cost_changes',{ref:(window.contractRef?contractRef(c):c.id), k:k.toLocaleString(), n:Number(intel.paper.words||0).toLocaleString()})
    : i18t('int_ask_contract_cost',{ref:(window.contractRef?contractRef(c):c.id), n:Number(intel.paper.words||0).toLocaleString()});
}
/* The first door. A second Analyze on the same contract only puts the paper
   back up; on another contract it starts a fresh paper — the pins are the
   paper's own and go with it (said in the summary, not hidden). */
async function igAnalyze(id){
  const c=getContract(id); if(!c) return;
  /* ---- THE WHOLE RECORD FIRST (26 Sep 2026, the overnight clean-up) ----
     The book in memory is the LIGHT list, and the server's HEAVY strip takes
     an upload's extracted text (and a sealed record's execution copy) off
     every row of it. So a contract nobody had opened in this sitting drew an
     empty paper, the ask box said "(0 words)", and every question came back
     "This contract has no wording to read yet". intelTemplateAsk already
     loads the whole record before it reads one; so does this. A failure
     leaves what the light row has, which is what this did before. */
  if(c._light&&!c._loaded&&typeof ensureFull==='function'){
    try{ await ensureFull(c); }catch(_){ /* the light row stands */ }
    const host=document.getElementById('ig-paper');
    if(host&&host.dataset.for===c.id) delete host.dataset.for;
    if(intel.paper&&intel.paper.id===id) Object.assign(intel.paper,igPaperCost(c));
  }
  if(!intel.paper||intel.paper.id!==id) intel.paper={ id, mode:'paper', focus:false, pins:[], seq:0, on:null, ...igPaperCost(c) };
  else intel.paper.mode='paper';
  if(!intel.dockOpen){ intel.dockOpen=true; igSyncDockWidth(); }
  igPaintPaper(); renderIntelDock(); igPaintIds([id]);
}
function igQuoteLabel(text){
  const w=String(text||'').replace(/\s+/g,' ').trim().split(' ');
  return w.length>IG_QUOTE_LABEL_WORDS?w.slice(0,IG_QUOTE_LABEL_WORDS).join(' ')+'…':w.join(' ');
}
/* A passage that is an obligation's own recorded wording takes the amber pin —
   amber is this product's word for work owed. Read off the record, never
   guessed: an obligation with no quote lights nothing amber. */
function igQuoteIsObligation(c,text){
  const norm=s=>(typeof quoteNorm==='function')?quoteNorm(s):String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
  const nq=norm(text); if(nq.length<12) return false;
  return ((c&&c.obligations)||[]).some(o=>{ if(!o||!o.quote) return false; const oq=norm(o.quote); return oq.length>=12&&(nq.includes(oq)||oq.includes(nq)); });
}
function igPinAdd(turn,k,qq){
  const p=intel.paper; if(!p) return null;
  let pin=p.pins.find(x=>x.turn===turn&&x.k===k);
  if(pin) return pin;
  pin={ n:++p.seq, turn, k, text:qq.text, ob:!!qq.ob, lost:false };
  p.pins.push(pin);
  return pin;
}
/* WHAT THE SERVER KEPT IS WHAT LANDS: normalizeDeliver has already dropped any
   quote that is not in the wording the model was shown, so every quote here
   is verbatim; the browser then finds it on the painted paper or marks the pin
   `lost` and says so on the chip's hover. Only this contract's citations count. */
/* A pin is lit on the paper, so a passage that is only in the negotiation
   record (what a clause used to say, what was proposed and not agreed) takes
   no pin: the answer quotes it in its own words, labelled, and a chip for it
   would point at words the paper does not carry. Dropped ONLY when it is found
   in the record and not in the wording; a quote found in neither is left to
   the pin's own "could not find it", as before. */
function igQuoteOnPaper(c){
  const story=igPaperChanges(c).text;
  if(!story) return ()=>true;
  const norm=s=>(typeof quoteNorm==='function')?quoteNorm(s):String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
  const paper=norm(igPaperText(c)), rec=norm(story);
  return t=>{ const nt=norm(t); return !(rec.includes(nt)&&!paper.includes(nt)); };
}
function igPinsMint(c,res,turn){
  const p=intel.paper; if(!p||!c||p.id!==c.id) return;
  const m=intel.history[turn]; if(!m||m.role!=='assistant') return;
  const seen=new Set();
  const quotes=((res&&Array.isArray(res.citations))?res.citations:[])
    .filter(x=>x&&String(x.id)===String(c.id)&&typeof x.quote==='string'&&x.quote.trim().length>=12)
    .map(x=>x.quote.trim()).filter(t=>{ if(seen.has(t)) return false; seen.add(t); return true; })
    .filter(igQuoteOnPaper(c));
  m.paperId=c.id;
  /* The server's own notice ("one quoted excerpt could not be matched…") is
     already printed under the answer; the "nothing to show" line is for an
     answer that quoted nothing, so one fact is never said twice. */
  m.noticed=!!(res&&res.notice);
  m.quotes=quotes.map(text=>({ text, ob:igQuoteIsObligation(c,text) }));
  m.quotes.forEach((qq,k)=>igPinAdd(turn,k,qq));
  if(m.quotes.length) igLight(turn,0); else igPaintPaper();
}
function igCitesHtml(m,i){
  const p=intel.paper;
  if(!m.quotes.length) return m.noticed?'':`<div class="ig-nothing">${igEsc(i18t('int_paper_nothing'))}</div>`;
  return `<div class="ig-cites">${m.quotes.map((qq,k)=>{
    const pin=(p&&p.id===m.paperId)?p.pins.find(x=>x.turn===i&&x.k===k):null;
    const on=!!(p&&p.on&&p.on.turn===i&&p.on.k===k);
    const title=pin&&pin.lost?i18t('int_cite_lost'):i18t('int_cite_show');
    return `<button type="button" class="ig-cite${qq.ob?' ob':''}${on?' is-on':''}" data-ig-cite="${i}:${k}" title="${igEsc(title)}">${pin?`<span class="ig-cite-n">${pin.n}</span>`:''}<span class="w">${igEsc(igQuoteLabel(qq.text))}</span></button>`;
  }).join('')}</div>`;
}
/* A press on a passage — the chip under an answer, or the answer landing —
   puts the paper up if it is not, pins the words and lands the reader on them. */
function igLight(turn,k,o){
  const p=intel.paper; if(!p) return;
  const m=intel.history[turn]; const qq=m&&Array.isArray(m.quotes)?m.quotes[k]:null; if(!qq) return;
  if(p.mode!=='paper') p.mode='paper';
  const pin=igPinAdd(turn,k,qq);
  p.on={turn,k};
  igPaintPaper();
  document.querySelectorAll('#ig-dock .ig-cite.is-on').forEach(b=>b.classList.remove('is-on'));
  const chip=document.querySelector(`#ig-dock .ig-cite[data-ig-cite="${turn}:${k}"]`); if(chip) chip.classList.add('is-on');
  if(o&&o.scroll===false) return;
  const canvas=document.getElementById('ig-canvas'), sc=document.getElementById('ig-paper-scroll');
  const first=canvas&&pin?canvas.querySelector(`span.ig-mark[data-ig-pin="${pin.n}"]`):null;
  if(first&&sc){ const r=first.getBoundingClientRect(), sr=sc.getBoundingClientRect();
    sc.scrollTo({ top:Math.max(0,sc.scrollTop+(r.top-sr.top)-sc.clientHeight*0.35), behavior:'smooth' }); }
}
/* ---- the strip ---- */
function igStripHtml(c,p){
  const up=p.mode==='paper';
  const ref=(window.contractRef?contractRef(c):c.id);
  const dot=((typeof STATUS_META==='object'&&STATUS_META&&STATUS_META[c.status])||{}).dot||'var(--st-gray-dot)';
  const st=(typeof statusLabel==='function')?statusLabel(c.status):(c.status||'');
  const n=p.pins.length;
  return `<div class="ig-sw" role="group" aria-label="${igEsc(i18t('int_paper_switch'))}">
      <button type="button" data-ig-mode="graph" aria-pressed="${up?'false':'true'}">${igEsc(i18t('int_paper_graph'))}</button>
      <button type="button" data-ig-mode="paper" aria-pressed="${up?'true':'false'}">${igEsc(i18t('int_paper_paper'))}</button>
    </div>
    <span class="ig-strip-ref" title="${igEsc(c.name)}"><span class="ig-strip-dot" style="background:${dot}"></span><b>${igEsc(ref)}</b><span class="q"> · </span>${igEsc(c.name)}<span class="q"> · ${igEsc(c.counterparty||'—')} · ${igEsc(st)}</span></span>
    <span class="ig-strip-sp"></span>
    ${up&&n?`<span class="ig-strip-pins">${igEsc(i18tn('int_pins',n,{n}))}</span><button type="button" class="ui-link" data-ig-pins-clear title="${igEsc(i18t('int_pins_clear_title'))}">${igEsc(i18t('int_pins_clear'))}</button>`:''}
    ${up?`<button type="button" class="ui-btn ui-btn-sm" data-ig-focus aria-pressed="${p.focus?'true':'false'}" title="${igEsc(i18t(p.focus?'int_focus_exit_title':'int_focus_title'))}">${icon(p.focus?'x':'scan','w-3.5 h-3.5')}${igEsc(i18t(p.focus?'int_focus_exit':'int_focus'))}</button>`:''}
    <button type="button" class="ui-btn ui-btn-sm" data-ig-ws="${c.id}">${igEsc(i18t('int_open_workspace'))}${icon('chevR','w-3.5 h-3.5')}</button>`;
}
function igStripWire(){
  const strip=document.getElementById('ig-strip'); if(!strip||strip.dataset.igBound) return;
  strip.dataset.igBound='1';
  strip.addEventListener('click',e=>{
    const p=intel.paper; if(!p) return;
    const mode=e.target.closest('[data-ig-mode]');
    if(mode){ p.mode=mode.getAttribute('data-ig-mode')==='paper'?'paper':'graph'; if(p.mode!=='paper') p.focus=false; igPaintPaper(); renderIntelDock(); return; }
    if(e.target.closest('[data-ig-pins-clear]')){ p.pins=[]; p.on=null; igPaintPaper(); renderIntelDock(); return; }
    if(e.target.closest('[data-ig-focus]')){ p.focus=!p.focus; igPaintPaper(); return; }
    const ws=e.target.closest('[data-ig-ws]'); if(ws){ openWorkspace(ws.getAttribute('data-ig-ws')); }
  });
}
/* ---- the paper ---- */
function igPaperHtml(c){
  let sheet='';
  if(typeof docSheetHtml==='function') sheet=docSheetHtml(c,{ copy:'work', canvasId:'ig-canvas', readOnly:true });
  else {
    const body=(typeof docBody==='function')?docBody(c):'';
    sheet=`<div class="blueprint pg-sheet pg-work" data-copy="work" style="padding:34px var(--s-10) 44px;max-width:var(--doc-sheet-max,860px);margin:0 auto;border-radius:0"><article id="ig-canvas" class="doc-surface" style="background:transparent">${(typeof readOnlyDocHtml==='function')?readOnlyDocHtml(body):body}</article></div>`;
  }
  return `<div class="ig-paper-wrap">
    <div id="ig-spine" class="doc-xr-spine ig-spine" role="group" aria-label="${igEsc(i18t('xr_spine_label'))}" hidden></div>
    <div id="ig-paper-scroll" class="ig-paper-scroll scroll-thin">${sheet}</div>
  </div>`;
}
function igPaperPaginate(c){
  const host=document.getElementById('ig-paper'); const sheet=host&&host.querySelector('.pg-sheet');
  if(!sheet||!window.pagesWatch||sheet._pgRO) return;
  try{ pagesWatch(sheet,{ mode:'work', gap:window.PG_GAP, corners:true,
    name:window.pagesLetterheadName?pagesLetterheadName(c):'', ref:(window.contractRef?contractRef(c):c.id)||'' }); }catch(_){ }
}
/* THE ONE PAINTER: strip, paper, pins, map, focus. Called after every render
   of the graph tab and after every act on the paper. A missing host (another
   tab, a stage) is a no-op; a paper whose contract has gone is put away. */
function igPaintPaper(){
  const strip=document.getElementById('ig-strip'), host=document.getElementById('ig-paper'), page=document.getElementById('ig-page');
  if(!strip||!host) return;
  const p=intel.paper; const c=p?getContract(p.id):null;
  if(!c){
    intel.paper=null;
    strip.hidden=true; strip.innerHTML='';
    host.hidden=true; host.innerHTML=''; delete host.dataset.for;
    if(page) page.classList.remove('ig-focus');
    return;
  }
  strip.hidden=false; strip.innerHTML=igStripHtml(c,p); igStripWire();
  const up=p.mode==='paper';
  const focus=!!(up&&p.focus);
  if(page) page.classList.toggle('ig-focus',focus);
  /* WRITTEN ON THE ELEMENT: the head strip states display:flex inline, which
     no sheet rule can outrank, so Focus folds it where its own declaration
     lives and puts the markup's own value back — never !important. */
  /* on Home the head row is Home's own (#hb-head, 3 Oct 2026): Focus folds it the same way */
  const head=document.getElementById('ig-head')||document.getElementById('hb-head'); if(head) head.style.display=focus?'none':'flex';
  if(!up){ host.hidden=true; return; }
  if(host.dataset.for!==c.id){ host.innerHTML=igPaperHtml(c); host.dataset.for=c.id; igPaperWire(host); }
  host.hidden=false;
  igPaperPaginate(c);
  igPinsPaint();
  igStrandPaint(c);
}
function igPaperWire(host){
  if(host.dataset.igBound) return; host.dataset.igBound='1';
  /* A pin in the margin finds its answer in the panel. */
  host.addEventListener('click',e=>{
    const b=e.target.closest('button[data-ig-pin]'); if(!b) return;
    const p=intel.paper; if(!p) return;
    const pin=p.pins.find(x=>String(x.n)===b.getAttribute('data-ig-pin')); if(!pin) return;
    p.on={turn:pin.turn,k:pin.k};
    igPinsPaint();
    document.querySelectorAll('#ig-dock .ig-cite.is-on').forEach(x=>x.classList.remove('is-on'));
    const chip=document.querySelector(`#ig-dock .ig-cite[data-ig-cite="${pin.turn}:${pin.k}"]`); if(chip) chip.classList.add('is-on');
    const turn=document.querySelector(`#igd-feed [data-ig-turn="${pin.turn}"]`);
    if(turn){ turn.scrollIntoView({block:'center',behavior:'smooth'}); turn.classList.add('ig-turn-on'); setTimeout(()=>turn.classList.remove('ig-turn-on'),1400); }
  });
}
/* Every pin's words lit on the paper, its number in the margin. Repainted whole
   at every act: the marks are the risk scan's own held in place, and the walk
   that places them reads the live text, so a re-walk after a re-layout lands
   where the words now are. */
const IG_PIN_COPIES_MAX=6;   // copies of one repeated passage lit per pin — a cap on drawing, never on finding the first
function igPinsPaint(){
  const p=intel.paper; const canvas=document.getElementById('ig-canvas'); if(!p||!canvas) return;
  canvas.querySelectorAll('button.ig-pin').forEach(el=>el.remove());
  canvas.querySelectorAll('.ig-pinhost').forEach(el=>el.classList.remove('ig-pinhost'));
  canvas.querySelectorAll('span.ig-mark').forEach(mark=>{ const par=mark.parentNode; if(!par) return;
    while(mark.firstChild) par.insertBefore(mark.firstChild,mark); par.removeChild(mark); });
  canvas.normalize();
  if(typeof scrollToQuote!=='function') return;
  p.pins.forEach(pin=>{
    pin.lost=!scrollToQuote(pin.text,{ root:canvas, hold:true, cls:'ig-mark'+(pin.ob?' ob':''), pin:pin.n, scroll:false });
    if(pin.lost) return;
    /* WORDS THE CONTRACT REPEATS ARE LIT WHEREVER THEY STAND (the owner's list,
       27 Sep 2026): the answer does not say which copy it read, and pinning the
       first alone claimed it did. Every copy is lit; the number sits on the first. */
    for(let k=1;k<IG_PIN_COPIES_MAX;k++){
      if(!scrollToQuote(pin.text,{ root:canvas, hold:true, cls:'ig-mark'+(pin.ob?' ob':''), pin:pin.n, scroll:false, nth:k })) break;
    }
    const first=canvas.querySelector(`span.ig-mark[data-ig-pin="${pin.n}"]`); if(!first) return;
    const block=first.closest('p,li,h1,h2,h3,h4,h5,h6,td,div')||first.parentElement;
    if(!block||!canvas.contains(block)||block===canvas) return;
    block.classList.add('ig-pinhost');
    const b=document.createElement('button'); b.type='button'; b.className='ig-pin'+(pin.ob?' ob':'');
    b.setAttribute('data-ig-pin',String(pin.n)); b.title=i18t('int_pin_find'); b.textContent=String(pin.n);
    block.appendChild(b);
  });
  if(p.on){ const pin=p.pins.find(x=>x.turn===p.on.turn&&x.k===p.on.k);
    if(pin) canvas.querySelectorAll(`span.ig-mark[data-ig-pin="${pin.n}"]`).forEach(x=>x.classList.add('is-on')); }
}
/* ---- the map ---- */
let _igStrandRows=[];
function igStrandPaint(c){
  const sp=document.getElementById('ig-spine'), canvas=document.getElementById('ig-canvas'), sc=document.getElementById('ig-paper-scroll');
  if(!sp||!canvas) return;
  if(typeof docXrayRows!=='function'||typeof docXraySpineHtml!=='function'||typeof docXraySpineRows!=='function'){ sp.hidden=true; return; }
  let rows=[]; try{ rows=docXrayRows(c,canvas)||[]; }catch(_){ rows=[]; }
  /* THE ANSWERS' CLAUSES JOIN THE MAP in steel: a pinned passage marks the
     clause it sits in; the scan's and the playbook's marks keep their own
     tones and outrank it (worst tone on top is the X-ray's own rule). */
  canvas.querySelectorAll('span.ig-mark[data-ig-pin]').forEach(mk=>{
    let row=null;
    for(const r of rows){ const el=r.el; if(!el) continue;
      if(el===mk||el.contains(mk)){ row=r; break; }
      if(el.compareDocumentPosition(mk)&Node.DOCUMENT_POSITION_FOLLOWING) row=r; else break; }
    if(row){ row.asked=true; if(!row.tone) row.tone='steel'; }
  });
  const marked=docXraySpineRows(rows);
  sp.hidden=!marked.length;
  if(!marked.length){ sp.innerHTML=''; _igStrandRows=[]; return; }
  /* The strip's width is the Document tab's own number, written on the
     element as that tab writes it (the sheet's rule states none). */
  sp.style.width=(Number(window.DOC_XRAY_SPINE_W)||28)+'px';
  sp.innerHTML=docXraySpineHtml(rows,{ numbers:true });
  sp.querySelectorAll('.doc-xr-seg.is-on').forEach(b=>{ b.classList.remove('is-on'); b.setAttribute('aria-pressed','false'); });
  _igStrandRows=rows.map(x=>x.el);
  _igStrandData=rows;
  igStrandFollow();
  if(sc&&!sc.dataset.igFollowBound){ sc.dataset.igFollowBound='1'; let raf=0;
    sc.addEventListener('scroll',()=>{ igStrandTip(null); if(raf) return; raf=requestAnimationFrame(()=>{ raf=0; igStrandFollow(); }); },{passive:true}); }
  if(!sp.dataset.igBound){ sp.dataset.igBound='1';
    sp.addEventListener('click',e=>{ const b=e.target.closest('[data-xr-seg]'); if(!b) return;
      const i=Number(b.getAttribute('data-xr-seg'));
      const el=_igStrandRows[i]; const s=document.getElementById('ig-paper-scroll');
      if(el&&s){ const r=el.getBoundingClientRect(), sr=s.getBoundingClientRect(); s.scrollTo({ top:Math.max(0,s.scrollTop+(r.top-sr.top)-16), behavior:'smooth' }); }
      igStrandTip(null);
      igStrandPress(sp, b, i); });
    /* THE HOVER CARD: which clause, how serious, and why — the reason this
       page never said anywhere before. Keyboard focus shows it too. */
    const tipFor=e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-xr-seg]'); igStrandTip(b||null); };
    sp.addEventListener('mouseover',tipFor);
    sp.addEventListener('focusin',tipFor);
    sp.addEventListener('mouseleave',()=>igStrandTip(null));
    sp.addEventListener('focusout',()=>igStrandTip(null));
    sp.addEventListener('scroll',()=>igStrandTip(null),{passive:true}); }
}
/* ---- ASK (Young picked it over Signpost and Remove, 28 Sep 2026) ----
   *"implement ASK"*: a block on Explorer's strip carries its clause number,
   says on the hover what it is and why it is flagged, and a press takes the
   paper to the clause, lights it for a moment and puts a question about it in
   Copilot's box beside the paper — NOTHING IS SENT AND NOTHING IS SPENT until
   the reader presses Ask, the one door the box already has, with its cost on
   the box's own hover as before.

   The question NAMES THE CLAUSE AND ITS FLAG IN ITS OWN WORDS rather than a
   label above the box (the 26 Sep ruling: the box says what it asks about on
   the control itself, never a line above it), and it carries the flag because
   the model reads the wording, not our scan, playbook or brief.

   IT NEVER OVERWRITES WHAT THE READER TYPED: the box is filled only when it is
   empty or still holds the strip's own last question. */
let _igStrandData=[], _igStrandLastAsk='';
const IG_GRADE_RANK=['ruby','amber','steel'];
function igStrandTopMark(row){
  const ms=((row&&row.marks)||[]).filter(Boolean).slice();
  const rank=g=>{ const i=IG_GRADE_RANK.indexOf(g); return i<0?IG_GRADE_RANK.length:i; };
  ms.sort((a,b)=>rank(a.grade)-rank(b.grade));
  return ms[0]||null;
}
const igStrandPoint = m => m ? String(m.lead||m.say||'').trim().replace(/[.\s]+$/,'') : '';
function igStrandQuestion(row){
  /* A CLAUSE WITH NO NAME OF ITS OWN IS CITED BY ITS NUMBER ALONE — never
     "4.2 This clause", which is the panel's placeholder, not the paper's. */
  const clause=(row&&!row.name&&row.cite)?String(row.cite).replace(/\.$/,'')
    :(typeof docXrayLabel==='function')?docXrayLabel(row):String((row&&row.name)||'');
  const m=igStrandTopMark(row), point=igStrandPoint(m);
  return (m&&point)?i18t('int_strip_q',{ clause, tag:m.tag||'', point }):i18t('int_strip_q_bare',{ clause });
}
function igStrandPress(sp, b, i){
  sp.querySelectorAll('.doc-xr-seg.is-on').forEach(x=>{ x.classList.remove('is-on'); x.setAttribute('aria-pressed','false'); });
  b.classList.add('is-on'); b.setAttribute('aria-pressed','true');
  const el=_igStrandRows[i];
  if(el&&el.classList){ el.classList.remove('ig-flash'); void el.offsetWidth; el.classList.add('ig-flash');
    clearTimeout(el._igFlash); el._igFlash=setTimeout(()=>el.classList.remove('ig-flash'),1700); }
  const row=_igStrandData[i]; if(!row) return;
  if(!intel.dockOpen){ intel.dockOpen=true; renderIntelDock(); igSyncDockWidth(); }
  const inp=document.getElementById('igd-input'); if(!inp) return;
  const had=String(inp.value||'');
  if(had.trim() && had!==_igStrandLastAsk) return;
  const q=igStrandQuestion(row);
  inp.value=q; _igStrandLastAsk=q;
  if(window.chatFieldGrow) chatFieldGrow(inp);
  try{ inp.focus({ preventScroll:true }); inp.setSelectionRange(q.length,q.length); }catch(_){}
}
function igStrandTip(b){
  const wrap=document.querySelector('#ig-paper .ig-paper-wrap');
  let tip=document.getElementById('ig-spine-tip');
  if(!b||!wrap){ if(tip) tip.hidden=true; return; }
  const row=_igStrandData[Number(b.getAttribute('data-xr-seg'))]; if(!row){ if(tip) tip.hidden=true; return; }
  if(!tip||tip.parentNode!==wrap){ if(tip) tip.remove(); tip=document.createElement('div'); tip.id='ig-spine-tip'; tip.className='ig-spine-tip'; tip.setAttribute('role','tooltip'); wrap.appendChild(tip); }
  const g=IG_GRADE_RANK.includes(row.tone)?row.tone:'steel';
  const ms=((row.marks)||[]).filter(Boolean);
  const lines=ms.slice(0,2).map(m=>`<span class="ig-tip-m"><b>${igEsc(m.tag||'')}</b> ${igEsc(igStrandPoint(m))}</span>`).join('');
  tip.innerHTML=`<span class="ig-tip-h">${igEsc(typeof docXrayLabel==='function'?docXrayLabel(row):(row.name||''))}</span>`
    +`<span class="ig-tip-g is-${g}">${igEsc(i18t('int_grade_'+g))}</span>`
    +(lines||(row.asked?`<span class="ig-tip-m">${igEsc(i18t('int_strip_asked'))}</span>`:''))
    +(ms.length>2?`<span class="ig-tip-m ig-tip-more">${igEsc(i18tn('int_strip_more',ms.length-2,{ n:ms.length-2 }))}</span>`:'')
    +`<span class="ig-tip-go">${igEsc(i18t('int_strip_go'))}</span>`;
  tip.hidden=false;
  const sp=b.closest('.ig-spine'); const wr=wrap.getBoundingClientRect(), br=b.getBoundingClientRect();
  tip.style.left=((sp?sp.getBoundingClientRect().right:br.right)-wr.left+8)+'px';
  const top=Math.max(4, Math.min(wrap.clientHeight-tip.offsetHeight-4, br.top-wr.top-4));
  tip.style.top=top+'px';
}
function igStrandFollow(){
  const sp=document.getElementById('ig-spine'), sc=document.getElementById('ig-paper-scroll');
  if(!sp||sp.hidden||!sc||!_igStrandRows.length) return;
  const top=sc.getBoundingClientRect().top+24;
  let here=0;
  _igStrandRows.forEach((el,i)=>{ try{ if(el&&el.getBoundingClientRect().top<=top) here=i; }catch(_){} });
  sp.querySelectorAll('.doc-xr-seg.is-here').forEach(b=>b.classList.remove('is-here'));
  let seg=null;
  sp.querySelectorAll('[data-xr-seg]').forEach(b=>{ if(Number(b.getAttribute('data-xr-seg'))<=here) seg=b; });
  if(!seg) return;
  seg.classList.add('is-here');
  const a=seg.offsetTop, b=a+seg.offsetHeight;
  if(a<sp.scrollTop+8) sp.scrollTop=Math.max(0,a-8);
  else if(b>sp.scrollTop+sp.clientHeight-8) sp.scrollTop=b-sp.clientHeight+8;
}
/* ---- the question, with the wording ---- */
async function igPaperAsk(q){
  const p=intel.paper; const c=p?getContract(p.id):null;
  if(!c) return intelChatAsk(q);
  /* No engine: intelChatAsk carries the one nudge this page gives for that. */
  if(!(typeof copilotAvailable==='function'&&copilotAvailable())) return intelChatAsk(q);
  /* The whole record, for the reason igAnalyze gives. */
  if(c._light&&!c._loaded&&typeof ensureFull==='function'){ try{ await ensureFull(c); }catch(_){ } }
  const ref=(window.contractRef?contractRef(c):c.id);
  const wording=igPaperText(c);
  if(!wording){ intel.history.push({role:'assistant', err:true, text:igEsc(i18t('int_paper_no_wording'))}); return; }
  /* The history as the panel keeps it; the LAST turn — the question — goes
     out with the wording behind it and the context saying so (wholeDoc lifts
     that one message's cap to the document ceiling). The history itself keeps
     only the questions, so a long sitting does not resend the contract eight
     times over. */
  const msgs=intelChatMessages();
  const last=(msgs.length&&msgs[msgs.length-1].role==='user')?msgs.pop():{ role:'user', content:q };
  /* The record rides AFTER the wording, under its own rule, only where a
     negotiation has something in it; a contract with no changes sends exactly
     what it sent before. The cost on the box is re-counted here, because the
     paper redraws as changes are agreed. */
  const story=igPaperChanges(c);
  p.words=igPaperWords(c)+(story.text?story.text.split(/\s+/).filter(Boolean).length:0); p.changes=story.count;
  msgs.push({ role:'user', content:`${last.content}\n\n${IG_PAPER_RULE}${story.text?`\n\n${IG_PAPER_CHANGES_RULE}`:''}\n\n=== THE WORDING OF ${ref} (${c.name}) ===\n${wording}${story.text?`\n\n${story.text}`:''}` });
  try{
    const res=await copilotAsk(msgs, { view:'intel', activeContractId:c.id, activeContractName:c.name, ...(c.contractNo?{activeContractNo:c.contractNo}:{}), wholeDoc:true }, null, IG_QUIET);
    intelPushChatResult(res);
    igPinsMint(c,res,intel.history.length-1);
  }catch(e){
    intel.history.push({role:'assistant', err:true, text:'Copilot error: '+igEsc(e.message||String(e))});
  }
}
/* Escape leaves Focus, and only Focus: with nothing over the page and the
   reader on this page. Armed once, at load. */
if(typeof document!=='undefined'&&!document._igPaperKeys){
  document._igPaperKeys=true;
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape') return;
    const p=intel.paper; if(!p||!p.focus) return;
    if(!igMapUp()) return;
    if(document.querySelector('[data-top-overlay]')) return;
    const mr=document.getElementById('modal-root'); if(mr&&mr.children.length) return;
    p.focus=false; igPaintPaper();
  });
}

Object.assign(window,{IG_DOCK_W0,IG_DOCK_MIN,IG_LEFT_MIN,IG_DOCK_FOLDED,IG_SPLIT_KEY,igDockClamp,igFitSplit,igWireSplit,igSplitSettle,IG_PAPER_RULE,IG_PAPER_CHANGES_RULE,IG_CHANGE_SAYS,igPaperChanges,igPaperCost,igQuoteOnPaper,igPaperUp,igPaperText,igPaperWords,igAskPlaceholder,igAskCost,igAnalyze,igQuoteLabel,igQuoteIsObligation,igPinAdd,igPinsMint,igCitesHtml,igLight,igStripHtml,igStripWire,igPaperHtml,igPaperPaginate,igPaintPaper,igPaperWire,igPinsPaint,igStrandPaint,igStrandFollow,igStrandQuestion,igStrandPress,igStrandTip,igStrandTopMark,igPaperAsk});
Object.assign(window,{IG,IG_SUGGESTIONS,IG_TEMPLATE_RE,INTEL_CAP,KIND_TAG,REL_SEEDS,GRAPH_EDGE_KINDS,buildGraphEdges,graphDependents,graphDependentsAll,graphLiveContract,igDependentsHtml,graphNodeFacts,graphNodeFactLine,GRAPH_NODE_FACTS_MAX,graphPartyStats,graphPartyStatsAll,graphPartyLines,GRAPH_ONTIME_MIN,graphDecisionOf,graphDecisionOrder,graphCliffCrowded,graphCliffAt,igApplyCliff,GRAPH_CLIFF_QUARTERS,GRAPH_CLIFF_MAX_DAYS,graphStreamFlow,graphStreamLines,graphLinkWidth,GRAPH_GROUPINGS,GRAPH_GROUP_KEYS,graphGroupingOf,graphGroupingWord,GRAPH_GROUP_CUES,graphGroupCue,GRAPH_ASK_CAP,graphCopilotCard,graphNextDue,GRAPH_WHERE_KEYS,graphWhereIds,graphCrowdedQuarters,graphLensesNow,graphAskScreen,intelGraphApply,graphSaysMore,GRAPH_CTX_FACTS_MAX,graphCliffQuarters,graphCopilotContext,igPaintGroupSelect,GRAPH_LINK_W_MIN,GRAPH_LINK_W_MAX,igFactRowsHtml,igHoverShow,igHoverHide,SEV_WEIGHT,STATUS_BAR,STATUS_DOT,addLens,applyTemplateResult,buildGraph,buildGraphModel,closePartyModal,contractPlainText,daysUntil,graphInterpret,groupLabelOf,igApplyView,igDockWidth,igFitView,igClamp,igEsc,igExplain,igExplainCard,igMiniCard,igMsgHTML,igPaint,igPaintIds,igRankCard,igRender,igSyncDockWidth,igTick,igToWorld,intel,intelActive,intelAsk,intelAskReady,intelChatAsk,intelChatMessages,intelPushChatResult,intelAIExplain,intelToggleCompare,intelRunCompare,intelGraphAsk,intelRAF,intelTemplateAsk,intelUI,layoutGraph,makeIntelGraph,openPartyModal,parseHorizonDays,IG_TABS,IG_TAB_LABEL,obMonthLabel,intelFrictionStats,intelFrictionHtml,EXPOSURE_KINDS,EXPOSURE_NOTICE_DAYS,exposureLive,exposureData,exposureHtml,exposureWire,intelObligationsData,intelObligationsHtml,intelPayTermsHtml,intelGoTab,ptRepaint,ptWire,rebuildIntelGraph,renderIntel,renderIntelDock,renderIntelLegend,riskScore,scanPortfolio,templateShortlist,updateIntelNote,valueBand});
Object.assign(window,{igSafeHtml,IG_UNSAFE_TAGS});
Object.assign(window,{IGB_VIEWS,IGB_STATUS_COL,IGB_PALETTE,IGB_FOLD_SMALL,IGB_FOLD_MANY,IGB_ZOOM_MIN,IGB_ZOOM_MAX,IGB_SIZE_KEYS,igbCam,igbLayout,igbColours,igbSizes,igbProjector,igbMix,igbHeart,igbFloorOf,igbCortex,igbTissue,igbMoneyOf,igbShade,igbPlace,igFoldHub,igFoldAll,igPaintFoldAll,igSetView,igSetZoom,igFaceAgain,igTurnBy,igShowEverything,GRAPH_OUTLIER_MIN,GRAPH_OUTLIER_X,GRAPH_OUTLIER_PAY_GAP,GRAPH_WALK_MAX,graphOutliers,graphWalkIds,igColourKeyOf,igSizeKeyOf,intelMapLocal,igExportCsv,igExportList,IGB_FACT_TONE,igbCardTone});
Object.assign(window,{igMapUp,igPageUp,IG_PRE_MS,igPreOn,igPrePaint});
Object.assign(window,{IG_FOLD_BUBBLE,igHubBubbles,IG_BUNDLES_MAX,igBundleSets,igBundleOf,IG_EDGE_PARTY_KEYS,igEdgeNamesShow,igbDrawBundles,igLandingSet,igLookActs,IG_CLAIM_RE,IG_RECIPE_V,IG_WHOSE_RE,IG_EDGE_RE,igSpanWords,igDecideText,igNamesRule,igNameShows,igHubNamed,igBubbleRadius,igLookRead,igDotScaleClamp,IG_DOT_SCALE_MIN,IG_DOT_SCALE_MAX,graphPartyLabel,igTapCoarse,IG_TAP_R_TOUCH,IG_TAP_SLOP_TOUCH,IG_RECIPE_ROLES,IG_ROLE_FIELD,IG_TIME_KEYS,IG_UNDO_MAX,IG_VIEWS_KEY,IG_NEAREST,IG_FACT_WORDS,IG_STATUS_WORDS,IG_TOP_BY,IGB_NV,igRecipeNow,igRecipeSet,intelPlace,intelPlacePut,igbSpinning,igSetSpin,IGB_SPIN_KEY,igLeftover,IG_CP_STOP,IGB_SWAY,IGB_SWAY_S,igNoteMeasure,igRecipePush,igRecipeUndo,igRecipeSays,igFactFind,igFactAnywhere,igFactOrder,igConditions,igIdsWhere,igTopIds,igRecipeParse,igRecipeRun,igRoleSet,igRoleSays,igChoiceButtons,igViewsRead,igViewsWrite,igViewSave,igViewFind,igViewName,igbAxes,igbTimeOf,igbBuckets,igHomeValue});

/* The Reminder Line (28 Sep 2026): the one reminder predicate, its first
   milestone, and the tab's press wiring. */
Object.assign(window,{obReminderOf,OB_FIRST_DAYS,intelObligationsWire});
