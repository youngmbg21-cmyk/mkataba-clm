// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   ADVICE DESK — shared core (catalog · rates · ETA · storage)
   Customers submit contract advice / review / drafting requests
   against a PUBLISHED rate card, and follow them on a transparent
   pipeline with an estimated-feedback date. This module owns the
   service catalog, the fee/turnaround maths and the dual-mode
   storage seam (server API when present, localStorage otherwise) —
   the internal board and the public portal both render from here.
   ============================================================ */

/* The contract-support catalog. Labels/blurbs live client-side only;
   the DEFAULT numbers are mirrored in server/server.js (ADVICE_DEFAULT_RATES)
   so the server can quote without trusting the browser — keep both in sync. */
const ADVICE_SERVICES = {
  review:      { id:'review',      name:'Contract Review & Risk Report', ic:'scan',   blurb:'Clause-by-clause review of a contract you received, with a plain-language risk report and recommended redlines.' },
  draft:       { id:'draft',       name:'Contract Drafting',             ic:'pencil', blurb:'A new contract drafted from your instructions, ready to negotiate and sign.' },
  advice:      { id:'advice',      name:'Contract Advice Session',       ic:'msg',    blurb:'A focused written opinion on a specific contract question — obligations, termination, renewal, disputes.' },
  negotiation: { id:'negotiation', name:'Negotiation & Redline Support', ic:'users',  blurb:'Counsel works the counterparty’s markup with you — positions, counter-redlines and settlement wording.' },
  compliance:  { id:'compliance',  name:'Regulatory & Compliance Check', ic:'shield', blurb:'A contract or template checked against Kenyan regulatory requirements for your sector.' },
};
const ADVICE_DEFAULT_RATES = {
  review:      { rate:8500,  hoursMin:3, hoursMax:6, days:3 },
  draft:       { rate:9500,  hoursMin:4, hoursMax:8, days:5 },
  advice:      { rate:7500,  hoursMin:1, hoursMax:2, days:2 },
  negotiation: { rate:10500, hoursMin:3, hoursMax:6, days:4 },
  compliance:  { rate:9000,  hoursMin:2, hoursMax:4, days:4 },
};

/* Pipeline stages — same treatment as the contract queue. Submitted →
   Delivered is the promise a customer can watch; Closed is the exit lane. */
const ADVICE_STAGES = [
  { k:'Submitted',   label:'Submitted',   color:'#98989b', desc:'Received — awaiting triage by the legal team' },
  { k:'Scoping',     label:'Scoping',     color:'#b8862b', desc:'Counsel is confirming scope and the fee estimate' },
  { k:'In Progress', label:'In Progress', color:'#5980a6', desc:'Counsel is working on the matter' },
  { k:'Delivered',   label:'Delivered',   color:'#2e8763', desc:'Feedback delivered to the customer' },
  { k:'Closed',      label:'Closed',      color:'#b0453c', desc:'Withdrawn or declined' },
];
const adviceStage = k => ADVICE_STAGES.find(s=>s.k===k) || ADVICE_STAGES[0];
const ADVICE_ACTIVE = ['Submitted','Scoping','In Progress'];
const adviceStageChip = k => { const s=adviceStage(k);
  return `<span class="badge" style="background:color-mix(in srgb,${s.color} 14%,#fff);color:${s.color}"><span class="dot" style="background:${s.color}"></span>${s.label}</span>`; };

/* ---------- rates: published defaults + workspace overrides ----------
   Overrides live in the ordinary settings object (settings.adviceRates),
   so the existing admin-gated settings save covers editing, and the
   server can serve them to the public portal without auth. */
window.ADVICE_RATE_OVERRIDES = null;   // set by the portal from GET api/advice/rates
function adviceRateFor(sid){
  const over = ADVICE_RATE_OVERRIDES || (state.settings && state.settings.adviceRates) || {};
  const o = over[sid] || {};
  const d = ADVICE_DEFAULT_RATES[sid] || { rate:8000, hoursMin:1, hoursMax:3, days:3 };
  const num = (v,fb) => (Number.isFinite(Number(v)) && Number(v)>0) ? Number(v) : fb;
  return { rate:num(o.rate,d.rate), hoursMin:num(o.hoursMin,d.hoursMin),
    hoursMax:num(o.hoursMax,d.hoursMax), days:num(o.days,d.days) };
}
const adviceUrgencyRate = (rate,u) => u==='priority' ? Math.round(rate*1.25) : rate;
const adviceUrgencyDays = (days,u) => u==='priority' ? Math.max(1, Math.ceil(days/2)) : days;
function adviceQuote(sid, urgency){
  const r=adviceRateFor(sid);
  const rate=adviceUrgencyRate(r.rate, urgency);
  return { rate, hoursMin:r.hoursMin, hoursMax:r.hoursMax,
    feeMin:rate*r.hoursMin, feeMax:rate*r.hoursMax,
    days:adviceUrgencyDays(r.days, urgency) };
}

/* ---------- ETA: business days + a visible queue-load factor ----------
   The promise is transparent: base turnaround for the service, halved for
   priority, plus one business day per 3 requests already active in the
   pipeline (capped) — the same number the intake page shows the customer. */
function addBusinessDays(fromIso, days){
  const d=new Date(fromIso);
  let n=0;
  while(n<days){ d.setDate(d.getDate()+1); const w=d.getDay(); if(w!==0&&w!==6) n++; }
  return d.toISOString();
}
const adviceLoadDays = active => Math.min(5, Math.floor(Number(active||0)/3));
function adviceEta(sid, urgency, activeCount, fromIso){
  const q=adviceQuote(sid, urgency);
  return addBusinessDays(fromIso||nowISO(), q.days + adviceLoadDays(activeCount));
}
const fmtDay = iso => { const t=Date.parse(iso); return isNaN(t)?'—':new Date(t).toLocaleDateString('en-KE',{day:'2-digit',month:'short',year:'numeric'}); };
const adviceDaysLeft = eta => { const t=Date.parse(eta); return isNaN(t)?null:Math.ceil((t-Date.now())/86400000); };

/* ---------- storage (dual-mode, mirrors the contract seam) ---------- */
LS.advice='hati.v1.advice';
state.advice = state.advice || [];
window.adviceUid = 100;
function hydrateAdvice(){
  if(API_MODE()) return;                       // server owns the list in API mode
  const d=lsGet(LS.advice);
  if(d && Array.isArray(d.requests)){ state.advice=d.requests; adviceUid=d.uid||adviceUid; return; }
  // First run on a demo workspace: seed a few requests so the pipeline reads
  // at a glance (only when the sample portfolio itself was loaded).
  const sampled=(state.contracts||[]).some(c=>(c.audit&&c.audit[0]&&c.audit[0].detail)==='Seeded as sample data');
  state.advice = sampled ? adviceSeed() : [];
  persistAdvice();
}
function persistAdvice(){ if(!API_MODE()) lsSet(LS.advice,{ uid:adviceUid, requests:state.advice }); }
const nextAdviceId = () => 'AR-' + (++adviceUid);
function adviceSeed(){
  const day=86400000, at=off=>new Date(Date.now()-off*day).toISOString();
  const mkReq=(service,status,name,company,contractName,offDays,urgency)=>{
    const submittedAt=at(offDays);
    const q=adviceQuote(service,urgency);
    const hist=[{at:submittedAt,to:'Submitted'}];
    const order=['Submitted','Scoping','In Progress','Delivered'];
    for(let i=1;i<=order.indexOf(status);i++) hist.push({at:at(offDays-i),to:order[i],by:'Wanjiku Kamau'});
    return { id:nextAdviceId(), token:generatePseudo('adv'+adviceUid).slice(0,24),
      service, status, urgency, name, email:name.toLowerCase().replace(/[^a-z]+/g,'.')+'@example.co.ke',
      company, contractName, description:'Seeded as sample data',
      submittedAt, eta:adviceEta(service,urgency,2,submittedAt),
      quote:q, assignee:null, notes:[], history:hist };
  };
  return [
    mkReq('review','Submitted','Grace Njeri','Tamu Beverages Ltd','Distribution Agreement — Coast Region',1,'standard'),
    mkReq('draft','Scoping','Daniel Odhiambo','Kilifi Agro Exporters','Avocado Off-take Agreement',3,'priority'),
    mkReq('negotiation','In Progress','Amina Yusuf','Savannah Retail Group','Modern Trade Listing — markup round 2',5,'standard'),
    mkReq('advice','Delivered','Peter Mwangi','Mwangi & Sons Hardware','Supplier credit terms question',9,'standard'),
  ];
}

/* ---------- request lifecycle (API mode defers to the server) ---------- */
async function loadAdviceRequests(){
  if(!API_MODE()) { hydrateAdvice(); return state.advice; }
  const r=await api('advice/requests');
  state.advice=r.requests||[];
  return state.advice;
}
const adviceActiveCount = () => (state.advice||[]).filter(r=>ADVICE_ACTIVE.includes(r.status)).length;
const getAdviceRequest = id => (state.advice||[]).find(r=>r.id===id);

/* Create a request. `p` = {service, urgency, name, email, company, contractName,
   description}. Static mode computes the quote/ETA locally; API mode lets the
   server compute both (the browser is not trusted with pricing). */
async function createAdviceRequest(p){
  if(API_MODE()){
    const r=await api('advice/requests','POST',p);
    return r.request;
  }
  hydrateAdvice();
  const q=adviceQuote(p.service, p.urgency);
  const submittedAt=nowISO();
  const req={ id:nextAdviceId(), token:generatePseudo('adv'+adviceUid+submittedAt).slice(0,24),
    service:p.service, status:'Submitted', urgency:p.urgency||'standard',
    name:p.name, email:p.email, company:p.company||'', contractName:p.contractName||'',
    description:p.description||'',
    submittedAt, eta:adviceEta(p.service, p.urgency, adviceActiveCount(), submittedAt),
    quote:q, assignee:null, notes:[], history:[{at:submittedAt,to:'Submitted'}] };
  state.advice.unshift(req);
  persistAdvice();
  return req;
}
/* Patch a request (status move, assignment, note). History is appended on a
   status change so the customer-facing timeline stays truthful. */
async function updateAdviceRequest(id, patch){
  if(API_MODE()){
    const r=await api('advice/requests/'+id,'PUT',patch);
    const i=state.advice.findIndex(x=>x.id===id);
    if(i>=0) state.advice[i]=r.request; else state.advice.unshift(r.request);
    return r.request;
  }
  const req=getAdviceRequest(id); if(!req) throw new Error('Request not found');
  const by=currentUser()?.name||'System';
  if(patch.status && patch.status!==req.status){
    req.history=req.history||[];
    req.history.push({at:nowISO(), to:patch.status, by});
    req.status=patch.status;
  }
  if(patch.assignee!==undefined) req.assignee=patch.assignee||null;
  if(patch.note){ req.notes=req.notes||[]; req.notes.push({at:nowISO(), by, text:patch.note}); }
  persistAdvice();
  return req;
}

/* Public links for the portal (share-link convention: t: prefixes a server token). */
const adviceIntakeLink = () => location.origin+location.pathname+'#advice=new';
const adviceTrackLink = r => location.origin+location.pathname+'#advice='+(API_MODE()?'t:':'')+r.token;

Object.assign(window,{ADVICE_DEFAULT_RATES,ADVICE_SERVICES,ADVICE_STAGES,ADVICE_ACTIVE,addBusinessDays,adviceActiveCount,adviceDaysLeft,adviceEta,adviceIntakeLink,adviceLoadDays,adviceQuote,adviceRateFor,adviceSeed,adviceStage,adviceStageChip,adviceTrackLink,adviceUrgencyDays,adviceUrgencyRate,createAdviceRequest,fmtDay,getAdviceRequest,hydrateAdvice,loadAdviceRequests,nextAdviceId,persistAdvice,updateAdviceRequest});
