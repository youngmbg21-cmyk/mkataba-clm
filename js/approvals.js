// HaTi — E5 approval workflows + multi-signer. Globals window-attached.
// Generalises the single spend-threshold gate into rule-based, sequential
// approval chains, and adds ordered multi-signer signing + engagement
// tracking. Backward compatible: a legacy settings.approval threshold is
// migrated into a default rule.

/* ---- rules (E5-T1) ----
   rule = { id, name, cond, approver:{kind:'role'|'member', role|name}, order }
   cond = { type:'value'|'folder'|'kind'|'foreignLaw'|'deviation', op?, value? } */
function approvalRules(){
  const s=state.settings||{};
  if(Array.isArray(s.approvalRules)) return s.approvalRules;
  // migrate the legacy spend gate into a single default rule
  const legacy=s.approval||{}; const threshold=Number(legacy.threshold!=null?legacy.threshold:5000000);
  const rules=[];
  if(threshold>0) rules.push({ id:'r-spend', name:`Value ≥ ${fmtKESshort(threshold)}`, order:1,
    cond:{type:'value',op:'>=',value:threshold}, approver:{kind:'role', role:legacy.approverRole==='legal'?'legal':'admin'} });
  return rules;
}
function saveApprovalRules(rules){ state.settings=state.settings||{}; state.settings.approvalRules=rules; delete state.settings.approval; saveSettings(); }

function contractForeignLaw(c){
  const fromScan=(c.scan&&(c.scan.findings||[]).some(f=>f.id==='t-law'&&!(c.scan.dismissed||[]).includes('t-law')));
  const fromPb=(c.playbook&&(c.playbook.verdicts||[]).some(v=>v.category==='Governing law'&&v.status==='deviation'));
  return !!(fromScan||fromPb);
}
function contractHasDeviation(c){ const sm=window.deviationSummary?deviationSummary(c):null; return !!(sm&&(sm.dev>0||sm.miss>0)); }

function ruleMatches(rule, c){
  const cond=rule.cond||{};
  switch(cond.type){
    case 'value': { const v=Number(c.value||0); return cond.op==='>='? v>=Number(cond.value) : v<=Number(cond.value); }
    case 'folder': return c.folder===cond.value;
    case 'kind': return (cKind(c)||'').toLowerCase().includes(String(cond.value||'').toLowerCase());
    case 'foreignLaw': return contractForeignLaw(c);
    case 'deviation': return contractHasDeviation(c);
    default: return false;
  }
}
function approverLabelOf(a){ return a.kind==='member' ? a.name : (a.role==='legal'?'a Legal approver':a.role==='admin'?'an Admin':`a ${a.role}`); }
function userCanApprove(a, u){
  if(!u) return false;
  if(a.kind==='member') return a.name===u.name;
  if(a.role==='admin') return u.role==='admin';
  if(a.role==='legal') return u.role==='legal'||u.role==='admin';   // admin can act for legal
  return u.role===a.role;
}

/* Build (or refresh) the ordered approval chain for a contract. */
function buildApprovalChain(c){
  const matched=approvalRules().filter(r=>ruleMatches(r,c)).sort((a,b)=>(a.order||99)-(b.order||99));
  // preserve prior approvals for rules that still match
  const prior=(c.approvalChain||[]);
  return matched.map(r=>{ const was=prior.find(p=>p.ruleId===r.id);
    return { ruleId:r.id, name:r.name, approver:r.approver, order:r.order||99,
      status: was&&was.status==='approved'?'approved':'pending', by:was?.by||null, at:was?.at||null, comment:was?.comment||null }; });
}
function approvalState(c){
  // legacy single-approval contracts still resolve (c.approval) if no chain rules
  const chain=buildApprovalChain(c);
  if(!chain.length){
    // no rules match -> not required (but honour a legacy manual approval)
    return { required:false, ok:true, chain:[], next:null, canApproveNext:false };
  }
  // sequential: the next pending step whose predecessors are all approved
  let next=null;
  for(const step of chain){ if(step.status!=='approved'){ next=step; break; } }
  const ok=chain.every(s=>s.status==='approved');
  const me=currentUser();
  const canApproveNext = !!next && userCanApprove(next.approver, me);
  return { required:true, ok, chain, next, canApproveNext, approverLabel: next?approverLabelOf(next.approver):'' };
}
function approveContract(c, comment){
  const st=approvalState(c);
  if(!st.required){ return; }
  if(!st.next){ toast('Approval chain already complete'); return; }
  if(!st.canApproveNext){ toast(`This step needs ${approverLabelOf(st.next.approver)}`,'err'); return; }
  const u=currentUser();
  c.approvalChain=st.chain.map(s=> s.ruleId===st.next.ruleId ? {...s, status:'approved', by:u.name, at:nowISO(), comment:comment||null} : s);
  logAudit(c,'Approved',`Step "${st.next.name}" approved by ${u.name} (${ROLE_LABEL[u.role]})`);
  persist(c); renderSignButton(c); renderAuditSection(c);
  const done=approvalState(c).ok;
  toast(done?'All approvals complete — signing unlocked':'Step approved — next approver notified');
}
function rejectApprovalStep(c){
  const st=approvalState(c); if(!st.next) return;
  const u=currentUser(); if(!st.canApproveNext){ toast(`This step needs ${approverLabelOf(st.next.approver)}`,'err'); return; }
  c.approvalChain=st.chain.map(s=> s.ruleId===st.next.ruleId ? {...s, status:'rejected', by:u.name, at:nowISO()} : s);
  if(c.status!=='Signed') c.status='Under Review';
  logAudit(c,'Approval rejected',`Step "${st.next.name}" rejected by ${u.name}`);
  persist(c); renderSignButton(c); renderAuditSection(c);
  toast('Approval step rejected');
}

/* ---- multi-signer (E5-T3) ----
   c.signerPlan = [{ id, party:'internal'|'counterparty', name, email, order, signed, at }]
   Seal is applied when the final signature lands (handled in contract.js). */
function signerPlan(c){ return c.signerPlan||[]; }
function nextSigner(c){ return signerPlan(c).slice().sort((a,b)=>a.order-b.order).find(s=>!s.signed)||null; }
function allSigned(c){ const p=signerPlan(c); return p.length>0 && p.every(s=>s.signed); }
function openSignerPlanEditor(c){
  const plan=(c.signerPlan||[]).slice();
  const row=(s,i)=>`<div class="flex items-center gap-2 mb-2" data-sp-row="${i}">
      <select data-sp-party="${i}" class="rounded-lg border border-inputln bg-white px-2 py-1.5 text-[12px]">
        <option value="internal" ${s.party==='internal'?'selected':''}>Internal</option>
        <option value="counterparty" ${s.party==='counterparty'?'selected':''}>Counterparty</option></select>
      <input data-sp-name="${i}" value="${(s.name||'').replace(/"/g,'&quot;')}" placeholder="Name" class="flex-1 rounded-lg border border-inputln bg-white px-2 py-1.5 text-[12px]"/>
      <input data-sp-email="${i}" value="${(s.email||'').replace(/"/g,'&quot;')}" placeholder="Email" class="flex-1 rounded-lg border border-inputln bg-white px-2 py-1.5 text-[12px]"/>
      <button data-sp-del="${i}" class="text-rose-500 hover:text-rose-700 text-[11px] font-600">✕</button></div>`;
  openModal(`<div class="p-6">
    <h3 class="font-serif font-600 text-lg text-ink mb-1">Signing order</h3>
    <p class="text-xs text-ink/60 mb-3">Add signers in order. Internal members sign in-app; counterparty signers each get their own secure link. The seal is applied when the last signature lands.</p>
    <div id="sp-rows">${plan.map(row).join('')||''}</div>
    <button id="sp-add" class="text-[12px] font-600 text-brand-600 hover:text-brand-800 mb-4">+ Add signer</button>
    <div class="flex justify-end gap-2"><button id="sp-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">Cancel</button>
      <button id="sp-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">Save order</button></div>
  </div>`);
  const rerow=()=>{ document.getElementById('sp-rows').innerHTML=plan.map(row).join(''); wire(); };
  const wire=()=>{ document.querySelectorAll('[data-sp-del]').forEach(b=>b.addEventListener('click',()=>{ plan.splice(Number(b.getAttribute('data-sp-del')),1); rerow(); })); };
  document.getElementById('sp-add').addEventListener('click',()=>{ plan.push({party:'internal',name:'',email:''}); rerow(); });
  wire();
  document.getElementById('sp-cancel').addEventListener('click',closeModal);
  document.getElementById('sp-save').addEventListener('click',()=>{
    const out=[]; document.querySelectorAll('[data-sp-row]').forEach((r,i)=>{ const idx=r.getAttribute('data-sp-row');
      const name=document.querySelector(`[data-sp-name="${idx}"]`).value.trim(); if(!name) return;
      out.push({ id:'sg_'+Math.random().toString(36).slice(2,7), party:document.querySelector(`[data-sp-party="${idx}"]`).value,
        name, email:document.querySelector(`[data-sp-email="${idx}"]`).value.trim(), order:out.length+1, signed:false }); });
    c.signerPlan=out; logAudit(c,'Signing order',`Set ${out.length} signer(s)`); persist(c); closeModal(); renderWorkspace();
    toast('Signing order saved');
  });
}

/* ---- approval + signer status panel (rendered in the sign area) ---- */
function approvalPanelHtml(c){
  const st=approvalState(c);
  if(!st.required && !signerPlan(c).length) return '';
  const stepChip=s=>s.status==='approved'?'text-brand-600':s.status==='rejected'?'text-rose-600':'text-ink/50';
  let html='';
  if(st.required){
    html+=`<div class="rounded-xl border border-line bg-white p-3 mb-2">
      <div class="text-[11px] font-600 text-ink mb-1.5">Approval chain</div>
      ${st.chain.map((s,i)=>`<div class="flex items-center gap-2 text-[11.5px] py-0.5">
        <span class="h-4 w-4 grid place-items-center rounded-full text-[8px] font-700 ${s.status==='approved'?'bg-brand-600 text-white':s.status==='rejected'?'bg-rose-500 text-white':'bg-slate-200 text-ink/60'}">${i+1}</span>
        <span class="${stepChip(s)}">${s.name}</span>
        <span class="ml-auto text-[10px] text-ink/50">${s.status==='approved'?`✓ ${s.by}`:s.status==='rejected'?`✕ ${s.by}`:'needs '+approverLabelOf(s.approver)}</span>
      </div>`).join('')}
      ${st.next&&st.canApproveNext?`<div class="flex gap-2 mt-2">
        <button id="ap-approve" class="rounded-lg bg-brand-900 text-white px-3 py-1.5 text-[11px] font-600 hover:bg-brand-800">Approve “${st.next.name}”</button>
        <button id="ap-reject" class="rounded-lg border border-rose-200 text-rose-600 px-3 py-1.5 text-[11px] font-600 hover:bg-rose-50">Reject</button></div>`
        :st.next?`<div class="mt-1.5 text-[10px] text-ink/55">Waiting on ${approverLabelOf(st.next.approver)}.</div>`:''}
    </div>`;
  }
  const plan=signerPlan(c);
  if(plan.length){
    html+=`<div class="rounded-xl border border-line bg-white p-3 mb-2">
      <div class="flex items-center gap-2 mb-1.5"><span class="text-[11px] font-600 text-ink">Signing order</span>
        ${canEdit()&&c.status!=='Signed'?`<button id="sp-edit" class="ml-auto text-[10px] font-600 text-brand-600 hover:text-brand-800">edit</button>`:''}</div>
      ${plan.slice().sort((a,b)=>a.order-b.order).map(s=>`<div class="flex items-center gap-2 text-[11.5px] py-0.5">
        <span class="h-4 w-4 grid place-items-center rounded-full text-[8px] font-700 ${s.signed?'bg-brand-600 text-white':'bg-slate-200 text-ink/60'}">${s.order}</span>
        <span class="${s.signed?'text-brand-600':'text-ink/60'}">${s.name}</span>
        <span class="text-[9px] font-mono text-ink/40">${s.party}</span>
        <span class="ml-auto text-[10px] text-ink/50">${s.signed?`✓ ${s.at?fmtDT(s.at):''}`:'pending'}</span>
      </div>`).join('')}
    </div>`;
  }
  return html;
}
function wireApprovalPanel(c){
  document.getElementById('ap-approve')?.addEventListener('click',()=>approveContract(c));
  document.getElementById('ap-reject')?.addEventListener('click',()=>rejectApprovalStep(c));
  document.getElementById('sp-edit')?.addEventListener('click',()=>openSignerPlanEditor(c));
}

/* ---- engagement timeline (E5-T4): show share-link opens ---- */
async function loadEngagement(c){
  const host=document.getElementById('engagement-section'); if(!host) return;
  if(!API_MODE()){ host.innerHTML=''; return; }
  let events=[];
  try{ const r=await api('contracts/'+c.id+'/engagement'); events=r.events||[]; }catch(e){ host.innerHTML=''; return; }
  if(!events.length){ host.innerHTML=''; return; }
  host.innerHTML=`<div class="px-5 py-4">
    <div class="flex items-center gap-2 mb-3"><span class="text-brand-500">${icon('history')}</span>
      <h3 class="text-sm font-display font-600 text-ink">Counterparty activity</h3>
      <span class="ml-auto text-[10px] font-mono text-ink/60">${events.length} open${events.length===1?'':'s'}</span></div>
    <div class="space-y-1">${events.slice(0,20).map(e=>`<div class="flex items-center gap-2 text-[11px] text-ink/65">
      <span class="h-1.5 w-1.5 rounded-full bg-brand-400"></span><span>Opened</span>
      <span class="ml-auto font-mono text-ink/45">${fmtDT(e.at)}${e.ip?' · '+e.ip:''}</span></div>`).join('')}</div></div>`;
}

Object.assign(window,{approvalRules,saveApprovalRules,contractForeignLaw,contractHasDeviation,ruleMatches,approverLabelOf,userCanApprove,buildApprovalChain,approvalState,approveContract,rejectApprovalStep,signerPlan,nextSigner,allSigned,openSignerPlanEditor,approvalPanelHtml,wireApprovalPanel,loadEngagement});
