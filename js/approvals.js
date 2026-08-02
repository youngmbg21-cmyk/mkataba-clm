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
  if(threshold>0) rules.push({ id:'r-spend', name:`Value ≥ ${fmtMoneyShort(threshold)}`, order:1,
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

/* ---- WHAT WAS ACTUALLY APPROVED ----

   An approval is a person saying yes to a specific contract: this amount, this
   wording. The chain stored only that they had said yes, so the yes outlived
   everything it was given for. An approver signed off KES 6,000,000 on Tuesday;
   on Wednesday somebody typed 60,000,000 into the key-terms panel; the rule
   ("value ≥ 5M") still matched, the step was still marked approved, and the
   Sign button stayed unlocked. Nothing anywhere said the number had moved.

   Nor was this a view the code did not hold elsewhere: resolveRound in
   js/versioning.js voids the whole chain when a negotiation round changes the
   value, with the comment "value changed — prior approvals are void". Only that
   one path did it. Every other way the value moves — the key-terms field, the
   document-synced input, a metadata fill — left the sign-off standing.

   So an approval now carries a stamp of what it was given for, and a step whose
   stamp no longer matches is STALE: not rejected, not approved, and not
   silently re-issued. It needs looking at again by the person who gave it.

   The stamp is deliberately cheap and synchronous — this runs on every repaint
   of the signing panel — and covers the two things a rule can be about: the
   amount, and the words. `null` for a record that was approved before stamps
   existed, which is treated as "we cannot know" and left alone rather than
   invalidated retroactively. */
function approvalStamp(c){
  const doc=String((c&&c.redlineText)||'')+'\u0000'+JSON.stringify((c&&c.fields)||{})
    +'\u0000'+String((c&&c.upload&&c.upload.fileHash)||'');
  let h=0; for(let i=0;i<doc.length;i++) h=(h*31+doc.charCodeAt(i))>>>0;
  return { value:Number((c&&c.value)||0), doc:h.toString(16) };
}
/* What moved since this step was approved, in the words a person would use.
   Empty means nothing did. An unstamped approval reports nothing moved, because
   it cannot tell — see above. */
function approvalDrift(step, c){
  const was=step&&step.stamp, now=approvalStamp(c);
  if(!was) return [];
  const out=[];
  if(Number(was.value||0)!==now.value)
    out.push(`the value changed from ${fmtMoneyShort(was.value||0)} to ${fmtMoneyShort(now.value)}`);
  if(String(was.doc||'')!==now.doc) out.push('the wording changed');
  return out;
}

/* Build (or refresh) the ordered approval chain for a contract. */
function buildApprovalChain(c){
  const matched=approvalRules().filter(r=>ruleMatches(r,c)).sort((a,b)=>(a.order||99)-(b.order||99));
  // preserve prior decisions for rules that still match
  const prior=(c.approvalChain||[]);
  return matched.map(r=>{ const was=prior.find(p=>p.ruleId===r.id);
    /* A REJECTION HAD TO BE PRESERVED TOO, and was not.

       This kept only 'approved' and rebuilt everything else as 'pending'. But
       approvalState — the only reader of the chain — calls this function every
       time, so the 'rejected' status rejectApprovalStep had just written was
       erased on the very next read. The panel's rose-coloured rejected step
       could not be reached by any route; an approver pressed Reject, the audit
       trail recorded it, and the screen went back to "needs an Admin" as though
       nobody had ruled at all. The owner was never shown a refusal, so there
       was nothing to answer and nothing to resubmit. */
    const kept=was&&(was.status==='approved'||was.status==='rejected')?was.status:'pending';
    const step={ ruleId:r.id, name:r.name, approver:r.approver, order:r.order||99,
      status:kept, by:was?.by||null, at:was?.at||null, comment:was?.comment||null,
      stamp:was?.stamp||null };
    if(kept==='approved'){
      const drift=approvalDrift(step, c);
      if(drift.length){ step.status='stale'; step.drift=drift; }
    }
    return step; });
}
function approvalState(c){
  // legacy single-approval contracts still resolve (c.approval) if no chain rules
  const chain=buildApprovalChain(c);
  if(!chain.length){
    // no rules match -> not required (but honour a legacy manual approval)
    return { required:false, ok:true, chain:[], next:null, canApproveNext:false,
      rejected:[], stale:[] };
  }
  // sequential: the next step that is not a live approval — pending, refused,
  // or approved over a contract that has since moved
  let next=null;
  for(const step of chain){ if(step.status!=='approved'){ next=step; break; } }
  const ok=chain.every(s=>s.status==='approved');
  const me=currentUser();
  const canApproveNext = !!next && userCanApprove(next.approver, me);
  const rejected=chain.filter(s=>s.status==='rejected');
  const stale=chain.filter(s=>s.status==='stale');
  return { required:true, ok, chain, next, canApproveNext, rejected, stale,
    approverLabel: next?approverLabelOf(next.approver):'' };
}
function approveContract(c, comment){
  const st=approvalState(c);
  if(!st.required){ return; }
  if(!st.next){ toast('Approval chain already complete'); return; }
  if(!st.canApproveNext){ toast(`This step needs ${approverLabelOf(st.next.approver)}`,'err'); return; }
  const u=currentUser();
  const stamp=approvalStamp(c);
  const was=st.next.status;
  c.approvalChain=st.chain.map(s=> s.ruleId===st.next.ruleId
    ? {...s, status:'approved', by:u.name, at:nowISO(), comment:comment||null, stamp, drift:undefined}
    : s);
  logAudit(c,'Approved',`Step "${st.next.name}" approved by ${u.name} (${ROLE_LABEL[u.role]})`
    +` — for ${fmtMoneyShort(stamp.value)} and the wording as it stands`
    +(was==='stale'?' · re-approved after the contract changed':was==='rejected'?' · previously refused':''));
  persist(c); renderSignButton(c); renderAuditSection(c);
  const done=approvalState(c).ok;
  toast(done?'All approvals complete — signing unlocked':'Step approved — next approver notified');
}
function rejectApprovalStep(c, comment){
  const st=approvalState(c); if(!st.next) return;
  const u=currentUser(); if(!st.canApproveNext){ toast(`This step needs ${approverLabelOf(st.next.approver)}`,'err'); return; }
  c.approvalChain=st.chain.map(s=> s.ruleId===st.next.ruleId
    ? {...s, status:'rejected', by:u.name, at:nowISO(), comment:comment||s.comment||null} : s);
  if(c.status!=='Signed') c.status='Under Review';
  logAudit(c,'Approval rejected',`Step "${st.next.name}" rejected by ${u.name}`
    +(comment?` — “${String(comment).slice(0,500)}”`:'')
    +' — the contract goes back to its owner to revise and resubmit');
  persist(c); renderSignButton(c); renderAuditSection(c);
  toast('Approval step rejected');
}
/* THE WAY OUT OF A REFUSAL.

   A rejection with no verb after it is a dead end: the contract sits refused,
   the owner revises the clause the approver objected to, and there is nothing
   on the screen that puts it back in front of them. The audit trail records
   both the refusal and the resubmission, so "approved on the third ask" stays
   readable afterwards — which is the reason this is a verb and not a quiet
   reset of the status. */
function resubmitApproval(c, note){
  const st=approvalState(c);
  if(!st.required) return false;
  const back=st.chain.filter(s=>s.status==='rejected'||s.status==='stale');
  if(!back.length){ toast('Nothing is waiting to be resubmitted'); return false; }
  if(!canEdit()){ toast('Viewers cannot resubmit for approval','err'); return false; }
  const u=currentUser();
  c.approvalChain=st.chain.map(s=> (s.status==='rejected'||s.status==='stale')
    ? {...s, status:'pending', by:null, at:null, comment:null, stamp:null, drift:undefined} : s);
  logAudit(c,'Approval resubmitted',
    `${back.map(s=>`"${s.name}"`).join(', ')} sent back for approval by ${(u&&u.name)||'System'}`
    +(note?` — “${String(note).slice(0,500)}”`:'')
    +` · now waiting on ${back.map(s=>approverLabelOf(s.approver)).join(', ')}`);
  persist(c); renderSignButton(c); renderAuditSection(c);
  toast(`Sent back for approval — waiting on ${approverLabelOf(back[0].approver)}`);
  return true;
}

/* ---- multi-signer (E5-T3) ----
   c.signerPlan = [{ id, party:'internal'|'counterparty', name, email, order, signed, at }]
   Seal is applied when the final signature lands (handled in contract.js). */
function signerPlan(c){ return c.signerPlan||[]; }
/* What has ACTUALLY happened to a counterparty signer's turn, read from their
   bound link rather than from route order. The panel used to stamp "SIGNING
   NOW" on whoever was next in the plan — before any link existed, before
   anything was sent — announcing a turn nobody had been told about. The
   server already records the whole journey on the bound share (created /
   turn email sent / first opened / signed); this reads it from the same
   per-contract cache the shares panel fills.
     'signed'  — their mark is on the record
     'opened'  — they opened their link, signature pending
     'sent'    — their link went out, not opened yet
     'held'    — link created, held until their turn arrives
     'unsent'  — no link exists: the contract has not been sent to them
     'internal'— not a counterparty row (internal signers sign in-app)
     'unknown' — static mode: links are not tracked, keep the legacy wording */
function signerLinkState(c, s){
  if(s.signed) return 'signed';
  if(s.party!=='counterparty') return 'internal';
  if(!(typeof API_MODE==='function' && API_MODE())) return 'unknown';
  const all=((typeof cachedShares==='function'?cachedShares(c):[])||[]).filter(x=>x&&!x.revokedAt);
  const links=all.filter(x=>String(x.signerId||'')===String(s.id));
  if(links.length){
    if(links.some(x=>x.firstOpenedAt)) return 'opened';
    if(links.some(x=>x.sentAt)) return 'sent';
    return 'held';
  }
  /* Links from before auto-binding existed (and hand-shared ones) carry no
     signer binding — but a live link addressed to this signer's own email is
     still the contract reaching them, and the panel must credit it rather
     than keep saying "not sent". An unbound share exists because somebody
     pressed send, so its existence IS the sent moment. */
  const em=String(s.email||'').trim().toLowerCase();
  const loose=em?all.filter(x=>!x.signerId && String(x.recipientEmail||'').trim().toLowerCase()===em):[];
  if(loose.length) return loose.some(x=>x.firstOpenedAt)?'opened':'sent';
  return 'unsent';
}
function nextSigner(c){ return signerPlan(c).slice().sort((a,b)=>a.order-b.order).find(s=>!s.signed)||null; }
function allSigned(c){ const p=signerPlan(c); return p.length>0 && p.every(s=>s.signed); }
// The internal-then-counterparty gate: every internal signer must be done
// before a counterparty signer's link goes live.
function internalAllSigned(c){ const p=signerPlan(c).filter(s=>s.party==='internal'); return p.length===0 || p.every(s=>s.signed); }
function signersRemaining(c){ return signerPlan(c).filter(s=>!s.signed).length; }
/* ---- who has actually signed, as against what the seal says ----
   Sealing is a fact about the DOCUMENT — the wording has stopped moving — and
   a single-signer route seals on the first signature, correctly. Execution is a
   fact about the PARTIES, and the two are not the same: a contract can be
   sealed, frozen and fingerprinted with only one side's mark on it.

   Everything that speaks about the parties — the copy that goes out, the notice
   that announces it — reads this rather than c.status. The server computes the
   same thing from the stored record (signedParties) so a stale page cannot talk
   the server into sending a copy of a half-signed contract.

   A contract with no counterparty named has one side to hear from. One filed as
   executed outside HaTi carries the paper, which is already both. */
function executionParties(c){
  const sigs=Array.isArray(c&&c.signatures)?c.signatures:[];
  const isTheirs=s=>!!s&&(s.party==='counterparty'||s.party==='external');
  const theirs=sigs.filter(isTheirs), ours=sigs.filter(s=>s&&!isTheirs(s));
  const offPlatform=!!(window.isExternallyExecuted&&isExternallyExecuted(c));
  const expectsCounterparty=!!String((c&&c.counterparty)||'').trim();
  const nameOf=list=>String((list[0]&&(list[0].name||list[0].email))||'').trim();
  return { ours:ours.length, theirs:theirs.length,
    ourName:nameOf(ours)||(window.FIRST_PARTY||'this workspace'),
    theirName:nameOf(theirs)||String((c&&c.counterparty)||'the counterparty'),
    fully: offPlatform || (ours.length>0 && (theirs.length>0 || !expectsCounterparty)) };
}
const bothPartiesSigned = c => executionParties(c).fully;

// Everyone who should receive the executed copy: unique emails across the plan
// and the recorded signatures, plus an optional workspace records mailbox.
function distributionRecipients(c){
  const seen=new Set(), out=[];
  const add=(name,email,role,party)=>{ const e=String(email||'').trim().toLowerCase();
    if(!/.+@.+\..+/.test(e)||seen.has(e)) return; seen.add(e); out.push({name:name||e,email:e,role:role||'',party:party||''}); };
  signerPlan(c).forEach(s=>add(s.name,s.email,s.role,s.party));
  (c.signatures||[]).forEach(s=>add(s.name,s.email,(typeof signatureCapacity==='function'?signatureCapacity(s):(s.title||s.role)),s.party));
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
        // This field is labelled "Title (e.g. CFO)" — it is the capacity the
        // person signs in. It used to fall back to their Admin/Legal/Viewer
        // permission level, which is how "Admin" ended up on signature blocks.
        if(!plan[i].role) plan[i].role=(typeof signerTitle==='function'?signerTitle(u):'')||''; }
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
  const stepChip=s=>s.status==='approved'?'text-brand-600':s.status==='rejected'?'text-rose-600':s.status==='stale'?'text-gold-700':'text-ink/50';
  const esc1=s=>String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  const stepRight=s=>s.status==='approved'?`✓ ${esc1(s.by)}`
    :s.status==='rejected'?`✕ refused by ${esc1(s.by)}`
    :s.status==='stale'?`↻ re-approval needed`
    :'needs '+approverLabelOf(s.approver);
  let html='';
  if(st.required){
    /* THE REFUSAL, AND THE WAY OUT OF IT — both on the panel the owner reads.
       A rejected step used to be erased before it could be drawn (see
       buildApprovalChain); now that it survives, the owner is told what was
       refused, by whom and why, and given the one control that moves it on. */
    const blocked=(st.rejected||[]).concat(st.stale||[]);
    const owner=canEdit()&&c.status!=='Signed'&&blocked.length;
    html+=`<div class="rounded-xl border ${st.rejected&&st.rejected.length?'border-rose-200':'border-line'} bg-white p-3 mb-2">
      <div class="text-[11px] font-600 text-ink mb-1.5">Approval chain</div>
      ${st.chain.map((s,i)=>`<div class="flex items-center gap-2 text-[11.5px] py-0.5">
        <span class="h-4 w-4 grid place-items-center rounded-full text-[8px] font-700 ${s.status==='approved'?'bg-brand-600 text-white':s.status==='rejected'?'bg-rose-500 text-white':s.status==='stale'?'bg-gold-500 text-white':'bg-slate-200 text-ink/60'}">${i+1}</span>
        <span class="${stepChip(s)}">${esc1(s.name)}</span>
        <span class="ml-auto text-[10px] text-ink/50">${stepRight(s)}</span>
      </div>`).join('')}
      ${(st.rejected||[]).map(s=>`<div class="mt-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700 leading-relaxed">
        <b>${esc1(s.by)||'An approver'} refused “${esc1(s.name)}”.</b>${s.comment?` “${esc1(s.comment)}”`:''}
        <span class="block text-rose-700/80 mt-0.5">Nothing can be sent for signature until this is settled. Revise the contract, then send it back for approval.</span>
      </div>`).join('')}
      ${(st.stale||[]).map(s=>`<div class="mt-1.5 rounded-lg border border-gold-500/30 bg-gold-500/10 px-2.5 py-2 text-[11px] text-gold-700 leading-relaxed">
        <b>“${esc1(s.name)}” needs approving again.</b> ${esc1(s.by)||'It'} approved it, and since then ${esc1((s.drift||[]).join(' and '))}.
        <span class="block text-gold-700/80 mt-0.5">A sign-off covers the contract it was given for, not the one it became.</span>
      </div>`).join('')}
      ${st.next&&st.canApproveNext?`<div class="flex gap-2 mt-2">
        <button id="ap-approve" class="rounded-lg bg-brand-900 text-white px-3 py-1.5 text-[11px] font-600 hover:bg-brand-800">${st.next.status==='pending'?'Approve':'Approve again'} “${esc1(st.next.name)}”</button>
        <button id="ap-reject" class="rounded-lg border border-rose-200 text-rose-600 px-3 py-1.5 text-[11px] font-600 hover:bg-rose-50">Reject</button></div>`
        :st.next?`<div class="mt-1.5 text-[10px] text-ink/55">Waiting on ${approverLabelOf(st.next.approver)}.</div>`:''}
      ${owner?`<button id="ap-resubmit" class="mt-2 w-full rounded-lg border border-brand-200 text-brand-700 px-3 py-1.5 text-[11px] font-600 hover:bg-brand-50">Revise &amp; send back for approval</button>`:''}
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
          /* Behind an unsigned INTERNAL step, by ORDER — not the old blanket
             "any internal unsigned", which mislabelled a counterparty-FIRST
             route as gated when it was simply never sent. */
          const gated=!s.signed&&s.party==='counterparty'
            &&sorted.some(x=>x.party==='internal'&&!x.signed&&(x.order||0)<(s.order||0));
          /* The journey of THEIR link, not the route's opinion of whose turn
             it is: not sent → sent → opened → signed. "SIGNING NOW" only
             appears once the contract is genuinely in front of them. */
          const ls=signerLinkState(c,s);
          const meta=s.signed
            ? `${ord(s.order)} · ${s.at?fmtDT(s.at):''}${s.signature&&s.signature.form?' · '+s.signature.form+' signature':''}`
            : ls==='opened' ? `${ord(s.order)} · contract opened — awaiting their signature`
            : ls==='sent' ? `${ord(s.order)} · contract sent — not opened yet`
            : ls==='held' ? `${ord(s.order)} · link ready — it goes out when their turn arrives`
            : gated ? `${ord(s.order)} · link opens once internal signing is complete`
            : ls==='unsent' ? (isCur
                ? `${ord(s.order)} · not sent yet — send the contract to start their turn`
                : `${ord(s.order)} · waiting — link not issued yet`)
            : isCur ? `${ord(s.order)} · their turn now`
            : `${ord(s.order)} · waiting`;
          const tag=(cls,txt)=>`<span class="text-[8.5px] font-mono px-1 py-px rounded ${cls}">${txt}</span>`;
          const badge=s.signed ? ''
            : ls==='opened' ? tag('bg-gold-100 text-gold-700','OPENED')
            : ls==='sent' ? tag('bg-gold-100 text-gold-700','SENT')
            : ls==='held' ? tag('bg-slate-100 text-ink/50','LINK READY')
            : (ls==='unsent'&&isCur&&!gated) ? tag('bg-rose-50 text-rose-600','NOT SENT YET')
            : (ls==='unknown'||ls==='internal')&&isCur ? tag('bg-gold-100 text-gold-700','SIGNING NOW') : '';
          return `<div class="flex gap-3 ${i<sorted.length-1?'pb-3':''} relative">
            ${i<sorted.length-1?`<span class="absolute left-[13px] top-7 bottom-0 w-0.5 ${s.signed?'bg-brand-500':'bg-slate-200'}"></span>`:''}
            ${node(st, s.signed?'✓':String(s.order))}
            <div class="min-w-0 pt-0.5">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[12.5px] font-600 ${s.signed?'text-ink':'text-ink/70'}">${(s.name||'').replace(/</g,'&lt;')}</span>
                ${s.role?`<span class="text-[10.5px] text-ink/50">· ${s.role.replace(/</g,'&lt;')}</span>`:''}
                <span class="text-[8.5px] font-mono px-1 py-px rounded ${s.party==='counterparty'?'bg-gold-50 text-gold-700':'bg-brand-50 text-brand-600'}">${s.party}</span>
                ${badge}
              </div>
              <div class="text-[10px] font-mono text-ink/45 mt-0.5">${meta}</div>
              ${(!s.signed&&s.party==='counterparty'&&ls==='unsent'&&!gated&&canEdit())
                ? `<button data-sp-send="${String(s.id).replace(/"/g,'&quot;')}" class="mt-1 rounded-lg border border-brand-200 text-brand-700 px-2 py-1 text-[10px] font-600 hover:bg-brand-50">Email their signing link</button>`
                : ''}
            </div></div>`; }).join('')}
      </div>
    </div>`;
  }
  return html;
}
function wireApprovalPanel(c){
  document.getElementById('ap-approve')?.addEventListener('click',()=>approveContract(c));
  /* A refusal with no reason on it is the thing that pushes the argument into
     email — the same reasoning js/versioning.js gives for the reply that
     travels with a rejected round. Asked here, once, and shown to the owner on
     the panel above. */
  document.getElementById('ap-reject')?.addEventListener('click',async()=>{
    let why='';
    if(typeof window.promptDialog==='function'){
      why=await window.promptDialog({ title:'Reject this approval step?',
        message:'The contract goes back to its owner. Say what has to change and they can revise it and send it back.',
        label:'Why are you refusing?', placeholder:'e.g. the liability cap is below our floor', optional:true });
      if(why===null) return;                 // dismissed — nothing was refused
    }
    rejectApprovalStep(c, String(why||'').trim()||null);
  });
  document.getElementById('ap-resubmit')?.addEventListener('click',async()=>{
    let note='';
    if(typeof window.promptDialog==='function'){
      note=await window.promptDialog({ title:'Send back for approval?',
        message:'This puts the contract back in front of the approver who refused it, with your note.',
        label:'What changed?', placeholder:`e.g. cap raised to ${jxCurrency()} 10M as asked`, optional:true });
      if(note===null) return;
    }
    resubmitApproval(c, String(note||'').trim()||null);
  });
  document.getElementById('sp-edit')?.addEventListener('click',()=>openSignerPlanEditor(c));
  /* The NOT-SENT row's own send: issue the route's bound links right here, so
     a counterparty-first route (which has no auto-issue moment) has a correct
     door — and the panel's call to action does the thing it names. */
  document.querySelectorAll('[data-sp-send]').forEach(b=>b.addEventListener('click',async()=>{
    b.disabled=true; b.textContent='Sending…';
    let out=null;
    try{ out=window.issueSigningRouteLinks?await issueSigningRouteLinks(c):null; }catch(e){ out=null; }
    if(out&&out.links){
      const first=out.links.find(x=>!x.heldForTurn);
      toast(first&&first.emailSent
        ? `${first.signer.name} has been emailed their signing link`
        : first
        ? `Signing link ready for ${first.signer.name}${first.emailConfigured===false?' — email is not configured, copy it from the Shares panel':''}`
        : 'Signing links issued — each is released when its turn arrives');
    } else if(out&&out.missingEmails){
      toast(`The signing route has no email address for ${out.missingEmails.map(s=>s.name).join(', ')} — add it via edit route`,'err');
    } else {
      toast('Could not issue the signing links — check the route and try again','err');
    }
    try{
      if(typeof renderSignButton==='function') renderSignButton(c);
      if(typeof renderAuditSection==='function') renderAuditSection(c);
      if(typeof renderSharesSection==='function') renderSharesSection(c);
    }catch(_){}
  }));
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
    ${''/* The list scrolls inside its card instead of running down the page —
          52 opens is a fact worth keeping, not a wall worth scrolling past.
          All fetched rows render (the server caps at 100); the box shows the
          first handful and the wheel does the rest. */}
    <div class="space-y-1 scroll-thin" style="max-height:190px;overflow-y:auto;padding-right:6px">${events.map(e=>`<div class="flex items-center gap-2 text-[11px] text-ink/65">
      <span class="h-1.5 w-1.5 rounded-full bg-brand-400" style="flex:none"></span><span>Opened</span>
      <span class="ml-auto font-mono text-ink/45">${fmtDT(e.at)}${e.ip?' · '+e.ip:''}</span></div>`).join('')}</div></div>`;
}

Object.assign(window,{approvalStamp,approvalDrift,resubmitApproval,approvalRules,saveApprovalRules,contractForeignLaw,contractHasDeviation,ruleMatches,approverLabelOf,userCanApprove,buildApprovalChain,approvalState,approveContract,rejectApprovalStep,signerPlan,nextSigner,allSigned,internalAllSigned,signersRemaining,signerLinkState,distributionRecipients,executionParties,bothPartiesSigned,openSignerPlanEditor,approvalPanelHtml,wireApprovalPanel,loadEngagement});
