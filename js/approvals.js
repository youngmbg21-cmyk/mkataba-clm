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
// The internal-then-counterparty gate: every internal signer must be done
// before a counterparty signer's link goes live.
function internalAllSigned(c){ const p=signerPlan(c).filter(s=>s.party==='internal'); return p.length===0 || p.every(s=>s.signed); }
function signersRemaining(c){ return signerPlan(c).filter(s=>!s.signed).length; }
// Everyone who should receive the executed copy: unique emails across the plan
// and the recorded signatures, plus an optional workspace records mailbox.
function distributionRecipients(c){
  const seen=new Set(), out=[];
  const add=(name,email,role,party)=>{ const e=String(email||'').trim().toLowerCase();
    if(!/.+@.+\..+/.test(e)||seen.has(e)) return; seen.add(e); out.push({name:name||e,email:e,role:role||'',party:party||''}); };
  signerPlan(c).forEach(s=>add(s.name,s.email,s.role,s.party));
  (c.signatures||[]).forEach(s=>add(s.name,s.email,s.role||s.title,s.party));
  const cc=(state.settings&&state.settings.recordsMailbox)||'';
  if(cc) add('Records archive',cc,'','cc');
  return out;
}
function openSignerPlanEditor(c){
  const plan=(c.signerPlan||[]).slice();
  const members=(getUsers()||[]).filter(u=>u.role!=='viewer');
  // People directory (imported contacts + team members) → drives name auto-fill.
  const people=(typeof orgDirectory==='function')?orgDirectory():[];
  const dirList=`<datalist id="sp-dir-names">${people.map(p=>`<option value="${(p.name||p.email||'').replace(/"/g,'&quot;')}">${[p.title,p.email].filter(Boolean).join(' · ').replace(/"/g,'&quot;')}</option>`).join('')}</datalist>`;
  const IN='rounded-lg border border-inputln bg-white px-2 py-1.5 text-[12px]';
  const memberOpts=s=>`<option value="">— pick member —</option>`+members.map(u=>`<option value="${u.id}" ${s.memberId===u.id?'selected':''}>${(u.name||u.email).replace(/</g,'&lt;')}</option>`).join('');
  const row=(s,i)=>`<div class="rounded-xl border border-line bg-slate-50/60 p-2.5 mb-2" data-sp-row="${i}">
      <div class="flex items-center gap-2 mb-1.5">
        <span class="h-5 w-5 grid place-items-center rounded-full bg-brand-600 text-white text-[10px] font-700">${i+1}</span>
        <select data-sp-party="${i}" class="${IN}">
          <option value="internal" ${s.party==='internal'?'selected':''}>Internal</option>
          <option value="counterparty" ${s.party==='counterparty'?'selected':''}>Counterparty</option></select>
        <span data-sp-member-wrap="${i}" class="${s.party==='counterparty'?'hidden':''}">
          <select data-sp-member="${i}" class="${IN}">${memberOpts(s)}</select></span>
        <div class="ml-auto flex items-center gap-1">
          <button data-sp-up="${i}" ${i===0?'disabled':''} class="text-ink/40 hover:text-ink/70 text-[12px] disabled:opacity-30">↑</button>
          <button data-sp-down="${i}" class="text-ink/40 hover:text-ink/70 text-[12px]">↓</button>
          <button data-sp-del="${i}" class="text-rose-500 hover:text-rose-700 text-[11px] font-600 ml-1">✕</button></div>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <input data-sp-name="${i}" list="sp-dir-names" value="${(s.name||'').replace(/"/g,'&quot;')}" placeholder="Name" class="${IN}"/>
        <input data-sp-role="${i}" value="${(s.role||'').replace(/"/g,'&quot;')}" placeholder="Title (e.g. CFO)" class="${IN}"/>
        <input data-sp-email="${i}" value="${(s.email||'').replace(/"/g,'&quot;')}" placeholder="Email" class="${IN}"/>
      </div></div>`;
  openModal(`<div class="p-6" style="max-width:560px">
    <h3 class="font-serif font-600 text-lg text-ink mb-1">Signing route</h3>
    <p class="text-xs text-ink/60 mb-3">Signers execute <b>in order</b>. Internal members sign in-app (bind each to a team member); counterparty signers each get their own secure link, which stays dormant until every internal signature is in. Each signer freely chooses how they sign (draw / type / upload). The seal is applied when the last signature lands.</p>
    ${dirList}
    <div id="sp-rows">${plan.map(row).join('')||'<div class="text-[12px] text-ink/50 mb-2">No signers yet — add the people who must sign, in order.</div>'}</div>
    <button id="sp-add" class="text-[12px] font-600 text-brand-600 hover:text-brand-800 mb-4">+ Add signer</button>
    ${people.length?`<p class="text-[11px] text-ink/45 mb-3">Tip: start typing a name — titles &amp; emails auto-fill from your directory.</p>`:''}
    <div class="flex justify-end gap-2"><button id="sp-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">Cancel</button>
      <button id="sp-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">Save route</button></div>
  </div>`);
  const rerow=()=>{ document.getElementById('sp-rows').innerHTML=plan.map(row).join('')||''; wire(); };
  const readRow=idx=>{ const g=sel=>document.querySelector(`[data-sp-${sel}="${idx}"]`);
    return { party:g('party').value, name:g('name').value.trim(), role:g('role').value.trim(), email:g('email').value.trim(),
      memberId:g('member')?g('member').value:'' }; };
  const syncPlanFromDom=()=>{ document.querySelectorAll('[data-sp-row]').forEach(r=>{ const i=Number(r.getAttribute('data-sp-row')); Object.assign(plan[i], readRow(i)); }); };
  const wire=()=>{
    document.querySelectorAll('[data-sp-del]').forEach(b=>b.addEventListener('click',()=>{ syncPlanFromDom(); plan.splice(Number(b.getAttribute('data-sp-del')),1); rerow(); }));
    document.querySelectorAll('[data-sp-up]').forEach(b=>b.addEventListener('click',()=>{ syncPlanFromDom(); const i=Number(b.getAttribute('data-sp-up')); if(i>0){ [plan[i-1],plan[i]]=[plan[i],plan[i-1]]; rerow(); } }));
    document.querySelectorAll('[data-sp-down]').forEach(b=>b.addEventListener('click',()=>{ syncPlanFromDom(); const i=Number(b.getAttribute('data-sp-down')); if(i<plan.length-1){ [plan[i+1],plan[i]]=[plan[i],plan[i+1]]; rerow(); } }));
    document.querySelectorAll('[data-sp-party]').forEach(sel=>sel.addEventListener('change',()=>{ syncPlanFromDom(); rerow(); }));
    document.querySelectorAll('[data-sp-member]').forEach(sel=>sel.addEventListener('change',()=>{
      syncPlanFromDom();                       // capture any typed values first
      const i=Number(sel.getAttribute('data-sp-member')), u=userById(sel.value);
      if(u){ plan[i].memberId=u.id; plan[i].name=u.name; plan[i].email=u.email;
        if(!plan[i].role){ const p=(typeof directoryLookup==='function')&&(directoryLookup(u.email)||directoryLookup(u.name)); plan[i].role=(p&&p.title)||ROLE_LABEL[u.role]||''; } }
      else { plan[i].memberId=''; }
      rerow(); }));
    // Auto-populate: typing or selecting a directory name fills the empty Title
    // and Email fields for that signer (never overwrites values already entered).
    document.querySelectorAll('[data-sp-name]').forEach(inp=>inp.addEventListener('change',()=>{
      const i=Number(inp.getAttribute('data-sp-name'));
      const p=(typeof directoryLookup==='function')&&directoryLookup(inp.value);
      if(!p) return;
      const roleEl=document.querySelector(`[data-sp-role="${i}"]`), emailEl=document.querySelector(`[data-sp-email="${i}"]`);
      if(p.title && roleEl && !roleEl.value.trim()) roleEl.value=p.title;
      if(p.email && emailEl && !emailEl.value.trim()) emailEl.value=p.email;
    }));
  };
  document.getElementById('sp-add').addEventListener('click',()=>{ syncPlanFromDom(); plan.push({party:'internal',name:'',role:'',email:'',memberId:''}); rerow(); });
  wire();
  document.getElementById('sp-cancel').addEventListener('click',closeModal);
  document.getElementById('sp-save').addEventListener('click',()=>{
    syncPlanFromDom();
    const out=[]; plan.forEach(s=>{ if(!s.name) return;
      const prior=(c.signerPlan||[]).find(p=>p.id===s.id);
      out.push({ id:s.id||'sg_'+Math.random().toString(36).slice(2,7), party:s.party, name:s.name, role:s.role||'',
        email:s.email, memberId:s.party==='internal'?(s.memberId||''):'', order:out.length+1,
        signed:prior?!!prior.signed:false, at:prior?prior.at:null, by:prior?prior.by:null, signature:prior?prior.signature:null }); });
    c.signerPlan=out; logAudit(c,'Signing route',`Set ${out.length} signer(s) in order`); persist(c); closeModal(); renderWorkspace();
    toast('Signing route saved');
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
    const sorted=plan.slice().sort((a,b)=>a.order-b.order);
    const ns=nextSigner(c);
    const signedCount=sorted.filter(s=>s.signed).length;
    const ord=n=>{ const t=['th','st','nd','rd'], v=n%100; return n+(t[(v-20)%10]||t[v]||t[0]); };
    const node=(state,label)=>`<span class="h-7 w-7 grid place-items-center rounded-full text-[11px] font-700 z-10 shrink-0 border-2 ${
      state==='done'?'bg-brand-600 border-brand-600 text-white':
      state==='cur'?'bg-white border-gold-500 text-gold-600 ring-4 ring-gold-100':
      'bg-white border-slate-300 text-ink/40'}">${label}</span>`;
    html+=`<div class="rounded-xl border border-line bg-white p-3 mb-2">
      <div class="flex items-center gap-2 mb-2"><span class="text-[11px] font-600 text-ink">Signature progress</span>
        <span class="text-[9.5px] font-mono px-1.5 py-0.5 rounded-full ${signedCount===sorted.length?'bg-brand-50 text-brand-600':'bg-gold-50 text-gold-700'}">${signedCount} of ${sorted.length} signed</span>
        ${canEdit()&&c.status!=='Signed'?`<button id="sp-edit" class="ml-auto text-[10px] font-600 text-brand-600 hover:text-brand-800">edit route</button>`:''}</div>
      <div class="relative">
        ${sorted.map((s,i)=>{ const isCur=ns&&ns.id===s.id; const st=s.signed?'done':isCur?'cur':'wait';
          const gated=!s.signed&&s.party==='counterparty'&&!internalAllSigned(c);
          const meta=s.signed
            ? `${ord(s.order)} · ${s.at?fmtDT(s.at):''}${s.signature&&s.signature.form?' · '+s.signature.form+' signature':''}`
            : isCur ? `${ord(s.order)} · their turn now`
            : gated ? `${ord(s.order)} · link opens once internal signing is complete`
            : `${ord(s.order)} · waiting`;
          return `<div class="flex gap-3 ${i<sorted.length-1?'pb-3':''} relative">
            ${i<sorted.length-1?`<span class="absolute left-[13px] top-7 bottom-0 w-0.5 ${s.signed?'bg-brand-500':'bg-slate-200'}"></span>`:''}
            ${node(st, s.signed?'✓':String(s.order))}
            <div class="min-w-0 pt-0.5">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[12.5px] font-600 ${s.signed?'text-ink':'text-ink/70'}">${(s.name||'').replace(/</g,'&lt;')}</span>
                ${s.role?`<span class="text-[10.5px] text-ink/50">· ${s.role.replace(/</g,'&lt;')}</span>`:''}
                <span class="text-[8.5px] font-mono px-1 py-px rounded ${s.party==='counterparty'?'bg-gold-50 text-gold-700':'bg-brand-50 text-brand-600'}">${s.party}</span>
                ${isCur?`<span class="text-[8.5px] font-mono px-1 py-px rounded bg-gold-100 text-gold-700">SIGNING NOW</span>`:''}
              </div>
              <div class="text-[10px] font-mono text-ink/45 mt-0.5">${meta}</div>
            </div></div>`; }).join('')}
      </div>
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

Object.assign(window,{approvalRules,saveApprovalRules,contractForeignLaw,contractHasDeviation,ruleMatches,approverLabelOf,userCanApprove,buildApprovalChain,approvalState,approveContract,rejectApprovalStep,signerPlan,nextSigner,allSigned,internalAllSigned,signersRemaining,distributionRecipients,openSignerPlanEditor,approvalPanelHtml,wireApprovalPanel,loadEngagement});
