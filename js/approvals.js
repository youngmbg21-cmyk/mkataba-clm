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
    /* W2-1: an approval threshold is written in the workspace currency, so the
       contract converts before it is compared. A currency with no rate on file
       cannot be compared — and an approval rule is a SAFETY net, so the
       unknown case ENGAGES the rule (a human looks) rather than skipping it. */
    case 'value': {
      const h=(typeof fxHome==='function')?fxHome(c):{v:Number(c.value||0),missing:false};
      if(h.missing) return true;
      const v=h.v; return cond.op==='>='? v>=Number(cond.value) : v<=Number(cond.value); }
    case 'folder': return c.folder===cond.value;
    case 'kind': return (cKind(c)||'').toLowerCase().includes(String(cond.value||'').toLowerCase());
    case 'foreignLaw': return contractForeignLaw(c);
    case 'deviation': return contractHasDeviation(c);
    default: return false;
  }
}
function approverLabelOf(a){ return a.kind==='member' ? a.name
  : (a.role==='legal'?i18t('ap_a_legal_approver'):a.role==='admin'?i18t('ap_an_admin'):i18t('ap_a_role',{role:a.role})); }
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
/* ============================================================
   OVERSEEN BY — a per-person approver
   ============================================================
   A member can be given somebody who signs off THEIR contracts. It hangs on
   the contract's OWNER (js/core.js), which is why it could not be built until
   a contract knew whose it was: keying it off the reader would make the
   approval panel say different things to different people, and a panel that
   disagrees with itself is the fault this rulebook opens with.

   It arrives the way every enforcement in this product arrives — behind a
   switch that is OFF by default, so nothing changes on deploy.

   A CONTRACT WITH NO OWNER GETS NO OVERSEER STEP. Imported back-catalogue
   paper has no owner and never will; making it unapprovable would strand it.
   The ordinary rules still apply to it, unchanged. */
function overseerCfg(){
  const s=(state.settings&&state.settings.overseer)||{};
  return { on: !!s.on };
}
function saveOverseerCfg(cfg){
  state.settings=state.settings||{};
  state.settings.overseer={ on: !!(cfg&&cfg.on) };
  if(typeof saveSettings==='function') saveSettings();
  return overseerCfg();
}
const overseerEnforced = () => overseerCfg().on;
/* Who oversees this contract's owner, resolved to a live member. Returns null
   wherever any link in that chain is missing — no owner, no overseer named,
   or an overseer whose account has gone. */
function overseerFor(c){
  if(!overseerEnforced()) return null;
  const owner=(typeof contractOwnerName==='function')?contractOwnerName(c):null;
  if(!owner) return null;
  const users=((typeof getUsers==='function'?getUsers():[])||[]);
  const raiser=(c&&c.owner&&c.owner.id)
    ? users.find(u=>u&&String(u.id)===String(c.owner.id))
    : users.find(u=>u&&u.name===owner);
  if(!raiser||!raiser.overseerId) return null;
  const over=users.find(u=>u&&String(u.id)===String(raiser.overseerId));
  if(!over||over.id===raiser.id) return null;      // nobody oversees themselves
  return { raiser, over };
}
function buildApprovalChain(c){
  const matched=approvalRules().filter(r=>ruleMatches(r,c)).sort((a,b)=>(a.order||99)-(b.order||99));
  // preserve prior decisions for rules that still match
  const prior=(c.approvalChain||[]);
  const chain=matched.map(r=>{ const was=prior.find(p=>p.ruleId===r.id);
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
  /* ---- THE PERSONAL APPROVAL JOINS THE SAME CHAIN, LAST (23 Sep 2026) ----
     It used to be one step whose decision lived on this chain, keyed off the
     contract's owner, and granted by whoever pressed Approve while it was
     "next". Scenario 2 made it a thing somebody ASKS for and a named person
     DECIDES, so its decision now lives on its own record — `c.signApprovals`,
     read by js/signapproval.js on both hosts — and this chain only DRAWS it.
     One step per approver. approvalState, the gate card, the refusal and the
     dashboard count all inherit it, and nothing grows a second gate.

     A DECISION PRESSED ONTO THIS CHAIN UNDER THE OLD MODEL IS NOT HONOURED.
     The old step had no request and no named decider, so an approval recorded
     there cannot say who gave it or of what; the contract is sent for
     approval once more. Said to the owner in plain words.

     ONCE SIGNING HAS STARTED the approval has done its work: a need nobody
     approved (a route begun before the rule existed) is not drawn at all, so a
     route in progress is never stopped half way by a step it never had. */
  let sa=null; try{ sa=signApprovalStateOf(c); }catch(_){ sa=null; }
  if(sa) sa.rows.forEach((r,i)=>{
    if(sa.started && r.status!=='approved') return;
    chain.push(saChainStep(r,i));
  });
  return chain;
}
const OVERSEER_STEP_ID='__overseer__';
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
  /* A PERSONAL APPROVAL IS DECIDED BY ITS NAMED PEOPLE, AND ONLY ONCE IT IS
     ASKED. userCanApprove answers "is this the person named", which is not
     the whole question for that step: an unasked request is the lead's move,
     not the approver's, and the person who asked may never answer their own
     question. saMayDecide is the ONE reading of that, on both hosts. */
  const canApproveNext = !!next && (next.sa
    ? (next.status==='pending' && !!(typeof saMayDecide==='function' && saMayDecide(next.req, me)))
    : userCanApprove(next.approver, me));
  const rejected=chain.filter(s=>s.status==='rejected');
  const stale=chain.filter(s=>s.status==='stale');
  return { required:true, ok, chain, next, canApproveNext, rejected, stale,
    approverLabel: next?approverLabelOf(next.approver):'' };
}
/* ---- ONE VERB, WHATEVER IS WAITING ON THIS READER ----
   Approve means "decide what is in front of me". A RULE step this reader may
   approve comes first, because the rule chain is sequential and that is its
   own ruling; otherwise a PERSONAL approval asked of this reader is decided on
   its own record, in any order — it is one named person's yes, and holding it
   behind somebody else's step would email an approver who then cannot act.
   The phone, the gate card and the Approvals page all press this, so none of
   them needs to know which kind of step it is. */
function approveContract(c, comment){
  const st=approvalState(c);
  if(!st.required){ return; }
  if(st.next && !st.next.sa && st.canApproveNext){
    const u=currentUser();
    const stamp=approvalStamp(c);
    const was=st.next.status;
    /* The personal steps are DRAWN on this chain and never stored on it —
       their decisions live on c.signApprovals. */
    c.approvalChain=st.chain.filter(s=>!s.sa).map(s=> s.ruleId===st.next.ruleId
      ? {...s, status:'approved', by:u.name, at:nowISO(), comment:comment||null, stamp, drift:undefined}
      : s);
    logAudit(c,'Approved',`Step "${st.next.name}" approved by ${u.name} (${ROLE_LABEL[u.role]})`
      +` — for ${fmtMoneyShort(stamp.value)} and the wording as it stands`
      +(was==='stale'?' · re-approved after the contract changed':was==='rejected'?' · previously refused':''));
    persist(c); renderSignButton(c); renderAuditSection(c);
    const done=approvalState(c).ok;
    toast(done?'All approvals complete — signing unlocked':'Step approved — next approver notified');
    return;
  }
  const mine=signApprovalDecidable(c);
  if(mine.length) return signApprovalDecide(c, mine[0].req.id, 'approved', comment);
  if(!st.next){ toast(i18t('ap_chain_complete')); return; }
  toast(`This step needs ${approverLabelOf(st.next.approver)}`,'err');
}
function rejectApprovalStep(c, comment){
  const st=approvalState(c); if(!st.required) return;
  if(st.next && !st.next.sa && st.canApproveNext){
    const u=currentUser();
    c.approvalChain=st.chain.filter(s=>!s.sa).map(s=> s.ruleId===st.next.ruleId
      ? {...s, status:'rejected', by:u.name, at:nowISO(), comment:comment||s.comment||null} : s);
    if(c.status!=='Signed') c.status='Under Review';
    logAudit(c,'Approval rejected',`Step "${st.next.name}" rejected by ${u.name}`
      +(comment?` — “${String(comment).slice(0,500)}”`:'')
      +' — the contract goes back to its owner to revise and resubmit');
    persist(c); renderSignButton(c); renderAuditSection(c);
    toast(i18t('ap_step_rejected'));
    return;
  }
  const mine=signApprovalDecidable(c);
  if(mine.length) return signApprovalDecide(c, mine[0].req.id, 'refused', comment);
  if(!st.next) return;
  toast(`This step needs ${approverLabelOf(st.next.approver)}`,'err');
}
/* THE WAY OUT OF A REFUSAL.

   A rejection with no verb after it is a dead end: the contract sits refused,
   the owner revises the clause the approver objected to, and there is nothing
   on the screen that puts it back in front of them. The audit trail records
   both the refusal and the resubmission, so "approved on the third ask" stays
   readable afterwards — which is the reason this is a verb and not a quiet
   reset of the status.

   RULE STEPS ONLY. A personal approval is sent again the way it was sent the
   first time — through the one request dialog — because a new request is a
   new question with its own stamp, not an old answer wiped. */
function resubmitApproval(c, note){
  const st=approvalState(c);
  if(!st.required) return false;
  const back=st.chain.filter(s=>!s.sa && (s.status==='rejected'||s.status==='stale'));
  /* 'warn', never bare: a bare toast prints nothing, so this refusal — the one
     the greyed button above makes unreachable through the interface — said
     nothing at all to anybody who reached it another way. */
  if(!back.length){ toast(i18t('ap_nothing_resubmit'),'warn'); return false; }
  if(!canEdit()){ toast(i18t('ap_viewers_no_resubmit'),'err'); return false; }
  const u=currentUser();
  c.approvalChain=st.chain.filter(s=>!s.sa).map(s=> (s.status==='rejected'||s.status==='stale')
    ? {...s, status:'pending', by:null, at:null, comment:null, stamp:null, drift:undefined} : s);
  logAudit(c,'Approval resubmitted',
    `${back.map(s=>`"${s.name}"`).join(', ')} sent back for approval by ${(u&&u.name)||'System'}`
    +(note?` — “${String(note).slice(0,500)}”`:'')
    +` · now waiting on ${back.map(s=>approverLabelOf(s.approver)).join(', ')}`);
  persist(c); renderSignButton(c); renderAuditSection(c);
  toast(`Sent back for approval — waiting on ${approverLabelOf(back[0].approver)}`);
  return true;
}

/* ============================================================
   APPROVAL BEFORE SIGNING — the screen's half (Young ruled 23 Sep 2026)
   ============================================================
   js/signapproval.js is the reading, shared with the server. This is what a
   person presses: send for approval, decide, withdraw, remind. Every write
   lands on `c.signApprovals` through persist() and is guarded as a
   DIFFERENCE by PUT /api/contracts/:id; every email goes through
   POST /api/contracts/:id/sign-approval-notify, which looks the address up
   itself and reports what really happened.

   WHERE THE RULE IS READ FROM. A colleague's rule is an admin-only fact about
   them, so in server mode a reader who is not an admin cannot see who else on
   this contract is marked. The server reads it with the whole roster and
   hands the answer down as `_signNeeds` — transport, never record, stripped
   on save. An admin and local mode read the roster fresh, and the reader's
   OWN rule is always read fresh, so a lead who has just added themselves to
   the signing route sees their own approval at once. */
function signApprovalLegacyOn(){ try{ return !!overseerCfg().on; }catch(_){ return false; } }
function signApprovalNeeds(c){
  if(!c || typeof saNeeds!=='function') return [];
  let users=[]; try{ users=(typeof getUsers==='function'?getUsers():[])||[]; }catch(_){ users=[]; }
  const local=saNeeds(c, users, signApprovalLegacyOn());
  const me=(typeof currentUser==='function')?currentUser():null;
  const remote=(typeof API_MODE==='function')&&API_MODE();
  if(!remote || (me&&me.role==='admin') || !Array.isArray(c._signNeeds)) return local;
  const out=c._signNeeds.map(n=>({ ...n, people:(n.people||[]).map(p=>({ ...p, why:(p.why||[]).slice() })) }));
  local.forEach(n=>{ if(!out.some(x=>String(x.key)===String(n.key))) out.push(n); });
  return out;
}
function signApprovalStateOf(c){
  if(typeof saState!=='function') return { rows:[], ok:true, started:false, open:[] };
  const st=saState(c, signApprovalNeeds(c), { nowMs:Date.now() });
  /* A READER WHO CANNOT SEE THE MONEY cannot measure whether an approval
     still describes the contract — the figures it was stamped with are the
     ones hidden from them. The server measured it with the whole record and
     sent each need's standing as `_signState`; that answer is used as it
     came, and the wall asks the same thing again at the signature. */
  if(c && c._valuesHidden && Array.isArray(c._signState)){
    const by=new Map(c._signState.map(x=>[String(x.key), x]));
    st.rows.forEach(r=>{ const t=by.get(String(r.need.key)); if(!t) return;
      r.status=t.status; r.drift=(t.drift||[]).slice(); r.expired=!!t.expired;
      r.waited=t.waited||0; r.escalated=!!t.escalated; });
    st.ok=!st.rows.length || st.started || st.rows.every(r=>r.status==='approved');
    st.open=st.started?[]:st.rows.filter(r=>r.status!=='approved');
  }
  return st;
}
function saStepName(n){
  const ppl=(n&&n.people)||[];
  const who=ppl.map(p=>p.name).filter(Boolean).join(i18t('sa_and'));
  return ppl.some(p=>(p.why||[]).includes('lead')) ? i18t('ov_step_name',{who}) : i18t('sa_step_signs',{who});
}
/* An old figure is printed in the contract's own currency, the one
   fmtMoneyOf prints the new figure in — two spellings of one amount side by
   side is the kind of thing a reader stops trusting. */
function saMoney(c, n){
  if(n==null) return i18t('sa_no_money');
  let cur=''; try{ cur=(typeof contractCurrency==='function')?contractCurrency(c):''; }catch(_){ cur=''; }
  let loc; try{ loc=(typeof jxLocale==='function')?jxLocale():undefined; }catch(_){ loc=undefined; }
  return `${cur?cur+' ':''}${Number(n||0).toLocaleString(loc)}`;
}
/* WHAT MOVED, in the words a person uses, from the keys the reading gives. */
function saDriftWords(c, r){
  if(!r) return [];
  if(r.expired) return [i18t('sa_mv_expired',{n:SA_UNUSED_DAYS})];
  const was=(r.req&&r.req.shows)||{};
  return (r.drift||[]).map(k=>k==='value'
    ? i18t('sa_mv_value',{from:saMoney(c,was.value), to:saMoney(c,c.valueType==='none'?null:Number(c.value||0))})
    : i18t('sa_mv_'+k));
}
const SA_CHAIN_STATUS={ unasked:'unasked', pending:'pending', approved:'approved', refused:'rejected', lapsed:'stale' };
function saChainStep(r,i){
  const n=r.need, req=r.req||null;
  return { ruleId:OVERSEER_STEP_ID, sa:true, key:n.key, need:n, req, name:saStepName(n),
    approver: n.approverId ? { kind:'member', name:n.approverName, id:n.approverId } : { kind:'role', role:'admin' },
    order:9999+i, status:SA_CHAIN_STATUS[r.status]||'unasked', saStatus:r.status,
    by:req&&req.decidedBy?req.decidedBy.name:null, at:req?req.decidedAt:null,
    comment:req?req.decision:null, drift:undefined, driftKeys:(r.drift||[]).slice(), expired:!!r.expired,
    waited:r.waited||0, escalated:!!r.escalated };
}
/* The pending requests THIS reader may decide, in any capacity. The card on
   the Signing tab offers them; approveContract presses them. */
function signApprovalDecidable(c, u){
  const me=u||((typeof currentUser==='function')?currentUser():null);
  if(!me) return [];
  return signApprovalStateOf(c).rows.filter(r=>r.status==='pending' && r.req && saMayDecide(r.req, me))
    .map(r=>({ ...r, as:saMayDecide(r.req, me) }));
}
/* The ones that WAIT ON this reader — what their queue, their bell and their
   phone count. The approver from the moment it is asked; the backup and the
   admins only once it has waited SA_ESCALATE_WORKDAYS, or at once where the
   approver has left and there is nobody else. They MAY decide earlier from
   the contract itself; this is only about whose list it is on. */
function signApprovalWaitsOn(c, u){
  return signApprovalDecidable(c, u).filter(r=>r.as==='approver' || r.escalated || !r.need.approverId);
}
/* ---- MAY IT BE SENT FOR APPROVAL NOW ----
   Only once the paper is final: an approval covers the wording that will be
   signed, so asking while the negotiation is still moving asks a colleague to
   approve something that is about to change. The owner's words for the
   screen: "nothing new appears until the deal is agreed". */
/* signBlockers is the ONE list of what holds a signature, and it is asked
   here rather than restated — with `noSa`, because that list asks THIS file
   for its own rows and would otherwise ask itself. */
const SA_PAPER_KEYS=['negotiation','fields','placeholders','blanks','counterparty','value','hold'];
function signApprovalPaperHolds(c){
  let bl=[]; try{ bl=(typeof signBlockers==='function')?signBlockers(c,{ noSa:true }):[]; }catch(_){ bl=[]; }
  return bl.filter(b=>b && SA_PAPER_KEYS.includes(b.key));
}
function signApprovalRequestable(c, u, state){
  const me=u||((typeof currentUser==='function')?currentUser():null);
  const st=state||signApprovalStateOf(c);
  const rows=st.started?[]:st.rows.filter(r=>r.status==='unasked'||r.status==='refused'||r.status==='lapsed');
  if(!rows.length) return { ok:false, rows:[], why:i18t('sa_nothing_to_ask') };
  if(!me || (typeof canEdit==='function' && !canEdit())) return { ok:false, rows, why:i18t('sa_viewer_no') };
  if(rows.some(r=>String(r.need.approverId)===String(me.id)||String(r.need.backupId)===String(me.id)))
    return { ok:false, rows, why:i18t('sa_you_approve_it') };
  if(signApprovalPaperHolds(c).length) return { ok:false, rows, why:i18t('sa_not_final'), waiting:true };
  return { ok:true, rows, why:'' };
}
/* The round the approver is shown, read RAW: negoRound initialises a
   negotiation and READING MUST NOT WRITE. */
function signApprovalRound(c){
  const n=c&&c.negotiation&&c.negotiation.round;
  return (typeof n==='number'&&n>=1)?n:null;
}
function saFmtDay(iso){
  const d=String(iso||'').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  try{ return (typeof regDotDate==='function')?regDotDate(d):d; }catch(_){ return d; }
}
function saWhen(iso){
  const t=Date.parse(iso||'');
  if(!Number.isFinite(t)) return '';
  try{ return (typeof fmtDT==='function')?fmtDT(iso):saFmtDay(iso); }catch(_){ return saFmtDay(iso); }
}
/* One line saying what an approval is OF: the round, the money, the dates. */
function saShowsLine(c, shows){
  const s=shows||{};
  const bits=[];
  bits.push(s.round?i18t('sa_v_round',{n:s.round}):i18t('sa_v_now'));
  bits.push(s.value==null?i18t('sa_no_money'):saMoney(c,s.value));
  if(s.start||s.end) bits.push([saFmtDay(s.start),saFmtDay(s.end)].filter(Boolean).join(' – '));
  return bits.join(' · ');
}

/* ---- THE EMAIL, AND WHAT IT REALLY DID ----
   The address is the server's to find: it takes the request's id and reads
   the approver off the STORED contract, so the record has to be on the
   server first. The answer is sendEmail's own — sent, in the outbox because
   no provider is set, or refused with the provider's reason — and it is
   filed on the request, so it outlives the toast. Local mode has no server
   and says so rather than pretending. */
async function signApprovalNotify(c, kind, req){
  if(!(typeof API_MODE==='function' && API_MODE())) return { local:true, emailSent:false };
  try{ if(typeof flushSaves==='function') await flushSaves(); }catch(_){}
  try{
    return await api('contracts/'+c.id+'/sign-approval-notify','POST',{ kind, reqId:req.id }, { quiet:true });
  }catch(e){ return { emailSent:false, emailError:(e&&e.message)||'', failed:true }; }
}
function saNoticeOf(out){
  if(!out) return null;
  return { at:nowISO(), emailed:!!out.emailSent, local:!!out.local,
    outbox:!!out.outbox, error:out.emailSent?null:(out.emailError||null), to:out.name||null };
}
function saDeliveryWords(notice){
  if(!notice) return '';
  if(notice.emailed) return i18t('sa_d_emailed');
  if(notice.local) return i18t('sa_d_local');
  if(notice.outbox) return i18t('sa_d_outbox');
  return i18t('sa_d_failed');
}

/* ---- SEND FOR APPROVAL ----
   One request per approver the rule names, each carrying the stamp of
   exactly what is put in front of them and an optional note. The note goes
   in the email and on the card; it never travels to the other side. */
async function signApprovalRequest(c, note){
  const me=(typeof currentUser==='function')?currentUser():null;
  if(!c||!me) return false;
  const can=signApprovalRequestable(c, me);
  if(!can.ok){ toast(can.why,'warn'); return false; }
  const at=nowISO();
  const text=String(note||'').trim().slice(0,SA_NOTE_MAX);
  const stamp=saStamp(c), shows=saShows(c, signApprovalRound(c));
  const list=Array.isArray(c.signApprovals)?c.signApprovals.slice():[];
  const made=can.rows.map(r=>{
    const n=r.need;
    const req={ id:'sa_'+Math.random().toString(36).slice(2,10), key:String(n.key),
      approverId:n.approverId||'', approverName:n.approverName||'', backupId:n.backupId||'', backupName:n.backupName||'',
      people:(n.people||[]).map(p=>({ id:String(p.id), name:String(p.name||''), why:(p.why||[]).slice() })),
      status:'pending', askedBy:{ id:String(me.id), name:me.name||'' }, askedAt:at, note:text, stamp, shows,
      decidedBy:null, decidedAt:null, as:null, decision:null, notice:null, reminded:[] };
    list.push(req);
    return req;
  });
  c.signApprovals=list.slice(-SA_KEEP);
  made.forEach(req=>logAudit(c,'Approval requested',
    `${me.name} asked ${req.approverName||'an admin'} to approve before anyone signs — for `
    +`${saShowsLine(c,req.shows)}, the wording as it stands`+(text?` — “${text}”`:'')));
  persist(c);
  let first=null;
  for(const req of made){
    const out=await signApprovalNotify(c,'ask',req);
    const notice=saNoticeOf(out);
    const live=(c.signApprovals||[]).find(x=>x&&x.id===req.id);
    if(live) live.notice=notice;
    if(!first) first={ req, notice };
  }
  persist(c);
  const who=made.map(r=>r.approverName||i18t('sa_admins')).join(i18t('sa_and'));
  const n=first&&first.notice;
  /* THREE HONEST ANSWERS: it went; email is off here, so the message sits
     in the outbox (not a failure, and not "sent" either); or the provider
     refused it. */
  toast(n&&n.emailed?i18t('sa_asked_toast',{who})
    :n&&n.local?i18t('sa_asked_toast_local',{who})
    :n&&n.outbox?i18t('sa_asked_toast_outbox',{who})
    :i18t('sa_asked_toast_nomail',{who}), n&&n.emailed?'ok':'warn');
  saRepaint(c);
  return true;
}
/* ---- APPROVE OR REFUSE ----
   The capacity is saMayDecide's, the same function the server asks. A
   refusal always carries its reason, because the reason is what goes back to
   the person who asked; an admin deciding in somebody else's place says why
   either way. A request whose contract has moved since it was asked has
   lapsed and is not decided — it is sent again, with the new stamp. */
async function signApprovalDecide(c, reqId, verdict, note){
  const me=(typeof currentUser==='function')?currentUser():null;
  const st=signApprovalStateOf(c);
  const row=st.rows.find(r=>r.req&&r.req.id===reqId);
  if(!row||!me){ toast(i18t('sa_gone'),'warn'); return false; }
  const as=saMayDecide(row.req, me);
  if(!as){ toast(i18t('sa_decide_not_you',{who:row.req.approverName||i18t('sa_admins')}),'warn'); return false; }
  if(row.status==='lapsed'){ toast(i18t('sa_decide_changed'),'warn'); return false; }
  if(row.status!=='pending'){ toast(i18t('sa_gone'),'warn'); return false; }
  const text=String(note||'').trim().slice(0,SA_NOTE_MAX);
  const asker=(row.req.askedBy&&row.req.askedBy.name)||'';
  if(verdict==='refused' && !text){ toast(i18t('sa_refuse_needs_why',{who:asker}),'warn'); return false; }
  if(as==='admin' && !text){ toast(i18t('sa_admin_needs_why',{who:row.req.approverName||i18t('sa_admins')}),'warn'); return false; }
  const live=(c.signApprovals||[]).find(x=>x&&x.id===reqId);
  if(!live){ toast(i18t('sa_gone'),'warn'); return false; }
  live.status=verdict==='approved'?'approved':'refused';
  live.decidedBy={ id:String(me.id), name:me.name||'', role:me.role||'' };
  live.decidedAt=nowISO(); live.as=as; live.decision=text||null;
  const cap=as==='backup'?` as the backup for ${row.req.approverName}`:as==='admin'?` as an admin, in ${row.req.approverName||'the approver'}’s place`:'';
  if(verdict==='approved') logAudit(c,'Approved',
    `Signing approved by ${me.name}${cap} — for ${saShowsLine(c,live.shows)}, the wording as it stands`+(text?` — “${text}”`:''));
  else logAudit(c,'Approval rejected',
    `Signing approval refused by ${me.name}${cap} — “${text}” — it goes back to ${asker||'whoever asked'} to revise and send again`);
  persist(c);
  const out=await signApprovalNotify(c,'decided',live);
  toast(verdict==='approved'?i18t('sa_approved_toast',{who:asker}):i18t('sa_refused_toast',{who:asker}),'ok');
  if(out && !out.local && !out.emailSent) toast(i18t(out.outbox?'sa_told_outbox':'sa_told_nomail',{who:asker}),'warn');
  saRepaint(c);
  return true;
}
/* Withdrawn by the person who asked, or an admin — a question taken back
   leaves the contract unasked, exactly as before it was sent. */
function signApprovalWithdraw(c, reqId){
  const me=(typeof currentUser==='function')?currentUser():null;
  const live=(c&&c.signApprovals||[]).find(x=>x&&x.id===reqId);
  if(!live||live.status!=='pending'||!me){ toast(i18t('sa_gone'),'warn'); return false; }
  if(!(String((live.askedBy||{}).id)===String(me.id) || me.role==='admin')){ toast(i18t('sa_withdraw_not_you'),'warn'); return false; }
  live.status='withdrawn';
  logAudit(c,'Approval withdrawn',`${me.name} withdrew the request asking ${live.approverName||'an admin'} to approve before signing`);
  persist(c);
  toast(i18t('sa_withdrawn_toast'),'ok');
  saRepaint(c);
  return true;
}
/* A deliberate nudge, with a visible result, never a silent retry. The server
   holds it to once a day for one request, so a button cannot become a way of
   flooding somebody's inbox. */
async function signApprovalRemind(c, reqId){
  const live=(c&&c.signApprovals||[]).find(x=>x&&x.id===reqId);
  if(!live||live.status!=='pending'){ toast(i18t('sa_gone'),'warn'); return false; }
  const out=await signApprovalNotify(c,'remind',live);
  if(out&&out.emailSent){
    live.reminded=(Array.isArray(live.reminded)?live.reminded:[]).concat([{ at:nowISO(), by:((currentUser()||{}).name)||'' }]).slice(-10);
    persist(c);
    toast(i18t('sa_reminded_toast',{who:live.approverName||i18t('sa_admins')}),'ok');
  } else toast((out&&out.error)||i18t('sa_remind_nomail'),'warn');
  saRepaint(c);
  return !!(out&&out.emailSent);
}
function saRepaint(c){
  try{ if(typeof renderSignButton==='function') renderSignButton(c); }catch(_){}
  try{ if(typeof renderAuditSection==='function') renderAuditSection(c); }catch(_){}
  try{ if(typeof updateAlertBadge==='function') updateAlertBadge(); }catch(_){}
}

/* ---- THE ROWS "BEFORE YOU SIGN" DRAWS ----
   One row per need, in the people stage. signBlockers carries the ones that
   HOLD (so the button and the refusal read the same sentence); an approved
   one is settled and folds away with the rest. `rowKey` keeps two approvers
   on two rows. */
function signApprovalRows(c){
  const st=signApprovalStateOf(c);
  if(st.started || !st.rows.length) return [];
  const can=signApprovalRequestable(c, null, st);
  return st.rows.map(r=>({ kind:'signapproval', rowKey:'sa:'+r.need.key, status:r.status,
    need:r.need, req:r.req, driftWords:saDriftWords(c,r), expired:!!r.expired,
    waited:r.waited||0, escalated:!!r.escalated,
    askable:can.ok && can.rows.some(x=>x.need.key===r.need.key),
    waiting:!!can.waiting && (r.status==='unasked'||r.status==='refused'||r.status==='lapsed'),
    holds:r.status!=='approved', settled:r.status==='approved' }));
}
function signApprovalBlockLabel(c, r){
  const appr=r.need.approverName||i18t('sa_admins');
  const people=(r.need.people||[]).map(p=>p.name).filter(Boolean).join(i18t('sa_and'));
  if(r.status==='pending') return i18t('sa_block_pending',{approver:appr});
  if(r.status==='refused') return i18t('sa_block_refused',{approver:appr, why:(r.req&&r.req.decision)||''});
  if(r.status==='lapsed') return i18t('sa_block_lapsed',{approver:appr});
  return i18t('sa_block',{people, approver:appr});
}
function signApprovalSettledRows(c){
  return signApprovalRows(c).filter(r=>r.settled).map(r=>({ ...r, key:r.rowKey, stage:'people', holds:false }));
}
/* The one sentence the share dialog and the route's own send button say when
   a signing link is asked for before the approval is in. Null where nothing
   is holding. */
function signApprovalHoldsLinks(c){
  const rows=signApprovalRows(c).filter(r=>r.holds);
  return rows.length ? signApprovalBlockLabel(c, rows[0]) : null;
}

/* ---- THE REQUEST, ON ONE SCREEN ----
   Who approves and who steps in, exactly what they approve, and a note.
   It opens only where the request can be sent; where it cannot, the press
   that would have opened it says why instead. */
function openSignApprovalDialog(c){
  const can=signApprovalRequestable(c);
  if(!can.ok){ toast(can.why,'warn'); return false; }
  const e=s=>String(s==null?'':s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const shows=saShows(c, signApprovalRound(c));
  const users=(typeof getUsers==='function'?getUsers():[])||[];
  const titleOf=id=>{ const u=users.find(x=>String(x.id)===String(id)); return (u&&u.title)||''; };
  const person=(name,sub)=>`<div class="sa-who"><span class="sa-av" aria-hidden="true">${e(String(name||'?').split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase())}</span><span><span class="sa-who-t">${e(name)}</span>${sub?`<span class="sa-who-s">${e(sub)}</span>`:''}</span></div>`;
  const first=can.rows[0].need;
  const apName=first.approverName||i18t('sa_admins');
  const needs=can.rows.map(r=>{ const n=r.need;
    return `<div class="sa-pair">
      <div><span class="sa-lbl">${e(i18t('sa_dlg_approver'))}</span>${n.approverId?person(n.approverName,titleOf(n.approverId)):`<div class="sa-who-s">${e(i18t('sa_dlg_admins'))}</div>`}</div>
      <div><span class="sa-lbl">${e(i18t('sa_dlg_backup'))}</span>${n.backupId?person(n.backupName,titleOf(n.backupId)):`<div class="sa-who-s">${e(i18t('sa_dlg_no_backup'))}</div>`}</div>
    </div>`; }).join('');
  const kv=(k,v)=>`<span class="sa-k">${e(k)}</span><span class="sa-v">${e(v)}</span>`;
  const cp=(typeof signerPlan==='function'?signerPlan(c):[]).filter(s=>s&&s.party==='counterparty'&&!s.signed)[0];
  /* Our own side is named from the workspace where the record names no
     entity of ours — the paper does the same (contractParty). */
  const partiesShown=(shows.parties||[]).slice();
  try{ const ours=(typeof contractParty==='function')?contractParty(c):''; if(ours && !partiesShown.includes(ours)) partiesShown.unshift(ours); }catch(_){}
  openModal(`<div class="sa-dlg">
    <h3 class="sa-h">${e(i18t('sa_dlg_title'))}</h3>
    <div class="sa-sub">${e([(window.contractRef?contractRef(c):c.id),c.name,c.counterparty].filter(Boolean).join(' · '))}</div>
    ${needs}
    <div class="sa-box">
      <div class="sa-boxh">${e(i18t('sa_dlg_exactly',{who:apName}))}</div>
      <div class="sa-kv">
        ${kv(i18t('sa_dlg_version'), shows.round?i18t('sa_v_round_today',{n:shows.round}):i18t('sa_v_now_today'))}
        ${kv(i18t('sa_dlg_value'), shows.value==null?i18t('sa_no_money'):saMoney(c,shows.value))}
        ${(shows.start||shows.end)?kv(i18t('sa_dlg_dates'), [saFmtDay(shows.start),saFmtDay(shows.end)].filter(Boolean).join(' – ')):''}
        ${partiesShown.length?kv(i18t('sa_dlg_parties'), partiesShown.join(' · ')):''}
        ${shows.signers.length?kv(i18t('sa_dlg_signers'), shows.signers.join(i18t('sa_then'))):''}
      </div>
      <div class="sa-note">${e(i18t('sa_dlg_also'))}</div>
    </div>
    <label class="sa-lbl" for="sa-ask-note">${e(i18t('sa_dlg_note',{who:apName}))}</label>
    <textarea id="sa-ask-note" class="sa-inp" maxlength="${SA_NOTE_MAX}" rows="3"></textarea>
    <div class="sa-foot">
      <span class="sa-foot-note">${e(cp?i18t('sa_dlg_foot_cp',{who:cp.name}):i18t('sa_dlg_foot'))}</span>
      <button type="button" class="ui-btn" id="sa-ask-cancel">${e(i18t('act_cancel'))}</button>
      <button type="button" class="ui-btn ui-btn-primary" id="sa-ask-go">${e(i18t('sa_dlg_go'))}</button>
    </div>
  </div>`, { maxWidth: DLG_W.m });
  document.getElementById('sa-ask-cancel')?.addEventListener('click',()=>closeModal());
  document.getElementById('sa-ask-go')?.addEventListener('click',async ev=>{
    const b=ev.currentTarget; b.disabled=true;
    const note=(document.getElementById('sa-ask-note')||{}).value||'';
    closeModal();
    await signApprovalRequest(c, note);
  });
  return true;
}
/* ---- REFUSING, IN ITS OWN SMALL WINDOW ----
   The reason is required and says where it goes. */
async function openSignApprovalRefuse(c, reqId){
  const row=signApprovalDecidable(c).find(r=>r.req.id===reqId);
  if(!row){ toast(i18t('sa_gone'),'warn'); return false; }
  const asker=(row.req.askedBy&&row.req.askedBy.name)||'';
  if(typeof window.promptDialog!=='function') return false;
  const why=await window.promptDialog({ title:i18t('sa_refuse_title',{who:asker}),
    message:i18t('sa_refuse_note',{who:asker}), label:i18t('sa_refuse_label'),
    confirmLabel:i18t('sa_refuse_go'), multiline:true });
  if(why==null) return false;
  if(!String(why).trim()){ toast(i18t('sa_refuse_needs_why',{who:asker}),'warn'); return false; }
  return signApprovalDecide(c, reqId, 'refused', why);
}

/* ---- THE APPROVER'S CARD, AT THE TOP OF THE SIGNING COLUMN ----
   Drawn only for somebody who may decide a request that is really waiting:
   the approver, the backup or an admin. Everything on it is borrowed — the
   request's own stamp and note, the readiness list's count, the brief's own
   "what moved" reading — so it adds no new judgement, only the two verbs. */
function signApprovalAskCardHtml(c){
  const mine=signApprovalDecidable(c);
  if(!mine.length) return '';
  const r=mine[0], req=r.req;
  const e=s=>String(s==null?'':s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const asker=(req.askedBy&&req.askedBy.name)||'';
  const lead=r.as==='approver'?i18t('sa_card_asks',{who:asker})
    :r.as==='backup'?i18t('sa_card_asks_backup',{who:asker, approver:req.approverName})
    :i18t('sa_card_asks_admin',{who:asker, approver:req.approverName||i18t('sa_admins')});
  let open=0; try{ open=(typeof signReadiness==='function'?signReadiness(c).holds:[]).filter(x=>x.kind!=='signapproval').length; }catch(_){ open=0; }
  let readers=[]; try{
    const key=(typeof briefReadKey==='function')?briefReadKey(c):'';
    readers=key?Object.values(c.briefRead||{}).filter(x=>x&&x.key===key&&x.by).map(x=>x.by):[];
  }catch(_){ readers=[]; }
  const checks=(open?i18tn('sa_card_checks_open',open,{n:open}):i18t('sa_card_checks_clear'))
    +(readers.length?' · '+i18t('sa_card_brief_read',{who:readers.join(', ')}):'');
  let moved=null; try{ moved=(typeof briefMoved==='function')?briefMoved(c):null; }catch(_){ moved=null; }
  const briefBtn=(c._brief&&!c._brief.truncated)?`<button type="button" class="ui-btn ui-btn-plain" data-kt-brief="open">${e(i18t('br_open'))}</button>`:'';
  return `<section class="sa-card" id="sa-card" data-sa-req="${e(req.id)}">
    <div class="sa-card-h"><span class="sa-card-t">${e(i18t('sa_card_head'))}</span><span class="sa-card-when">${e(saWhen(req.askedAt))}</span></div>
    <div class="sa-card-b">
      <p class="sa-card-lead">${e(lead)}</p>
      ${req.note?`<p class="sa-quote">“${e(req.note)}”</p>`:''}
      <div class="sa-kv">
        <span class="sa-k">${e(i18t('sa_card_you_approve'))}</span><span class="sa-v">${e(saShowsLine(c,req.shows))}</span>
        <span class="sa-k">${e(i18t('sa_card_checks'))}</span><span class="sa-v">${e(checks)}</span>
      </div>
      ${moved&&moved.rows.length?`<div class="sa-moved"><span class="sa-lbl">${e(i18t('sa_card_moved'))}</span>${
        moved.rows.map(x=>`<div class="sa-mv"><b>${e(x.clause)}</b> — ${e(x.said||i18t('br_moved_nosay'))}</div>`).join('')}${
        moved.over?`<div class="sa-mv sa-mv-more">${e(i18t('br_moved_more',{n:moved.over}))}</div>`:''}</div>`:''}
      <label class="sa-lbl" for="sa-dec-note">${e(i18t(r.as==='admin'?'sa_card_note_admin':'sa_card_note'))}</label>
      <textarea id="sa-dec-note" class="sa-inp" rows="2" maxlength="${SA_NOTE_MAX}"></textarea>
      <div class="sa-acts">
        <button type="button" class="ui-btn ui-btn-primary" data-sa-approve="${e(req.id)}">${e(i18t('sa_card_approve'))}</button>
        <button type="button" class="ui-btn sa-refuse" data-sa-refuse="${e(req.id)}">${e(i18t('sa_card_refuse'))}</button>
        ${briefBtn}
      </div>
    </div>
  </section>`;
}
function wireSignApprovalCard(c, after){
  const host=document.getElementById('sa-card'); if(!host) return;
  const again=()=>{ if(typeof after==='function') after(); };
  host.querySelector('[data-sa-approve]')?.addEventListener('click',async ev=>{
    const b=ev.currentTarget; b.disabled=true;
    const note=(document.getElementById('sa-dec-note')||{}).value||'';
    const ok=await signApprovalDecide(c, b.getAttribute('data-sa-approve'), 'approved', note);
    if(!ok) b.disabled=false;
    again();
  });
  host.querySelector('[data-sa-refuse]')?.addEventListener('click',async ev=>{
    const ok=await openSignApprovalRefuse(c, ev.currentTarget.getAttribute('data-sa-refuse'));
    if(ok) again();
  });
}

/* ---- multi-signer (E5-T3) ----
   c.signerPlan = [{ id, party:'internal'|'counterparty', name, email, order, signed, at }]
   Seal is applied when the final signature lands (handled in contract.js). */
function signerPlan(c){ return c.signerPlan||[]; }
/* ---- HAS THE SIGNING ACTUALLY BEEN STARTED? ----
   Asked for directly (Young, 11 Aug 2026): "I do not want a contract signed
   without the owner knowing the process of signing has started, which will
   start by assigning signers. I also want this to act as the ability to give
   someone a contract to read [without] them in turn signing a contract that
   they were not supposed to sign."

   So naming the signers IS the act that opens signing. Until it happens a link
   can be read, answered and argued with, and nothing on it can be signed.

   IT ASKS FOR A COUNTERPARTY ROW, not merely a non-empty route, and the
   difference is the second half of the request. A signing link is a thing you
   send to the OTHER SIDE; a route naming only our own people has not said who
   over there may sign, and an unbound link on it would let whoever holds the
   URL sign as nobody in particular. That is precisely the reader who was never
   meant to sign.

   SIGNED ROWS COUNT. The question is whether a route was ever set, not whether
   it is still open — a finished route is refused further along, by the turn
   check and by "this contract is already executed", each with its own sentence.

   THREE DOORS ASK IT and all three must, because each closes a different gap:
   the share dialog (so a dead link is never made), the counterparty's page (so
   a link made before this rule existed says why in words) and the server (so
   the answer does not depend on either page being ours).

   BOTH SIDES, NOT JUST THEIRS (tightened 11 Aug 2026, asked for directly: "it
   should ask for the owners and the counterparties that will sign the contract
   before you send, otherwise the contract can't be sent for signing"). It began
   by asking only for a counterparty row, on the argument that a signing link is
   a thing you send to the other side. True, and not enough: an agreement is
   signed by two parties, and a route naming only theirs describes a document
   that executes with one signature on it. Naming both is what makes the route
   a plan rather than an address. */
function signingRouteOpen(c){
  const p = signerPlan(c);
  return p.some(s => s && s.party === 'counterparty')
      && p.some(s => s && s.party !== 'counterparty');
}
/* Which side is still missing, for a screen that has to say so rather than
   just refuse. Returns 'ours', 'theirs', 'both' or null. */
function signingRouteMissing(c){
  const p = signerPlan(c);
  const ours = p.some(s => s && s.party !== 'counterparty');
  const theirs = p.some(s => s && s.party === 'counterparty');
  return (ours && theirs) ? null : (!ours && !theirs) ? 'both' : ours ? 'theirs' : 'ours';
}
/* ---- ONCE ONE PERSON HAS SIGNED, THE ROUTE IS SHUT ----
   Second half of the same instruction: "once one person has signed, there can
   be no option to add other signers, and the process would have to start all
   over again if you want to add signers."

   The reason is the one the whole signing model rests on. A signature is given
   to a SPECIFIC arrangement — this wording, these parties, in this order. Add a
   third signatory afterwards and the person who already signed has signed
   something nobody showed them: a different agreement, with a party they never
   saw, executed under their name. So the route freezes at the first mark, and
   the only way to change it is to take the marks off and begin again, which is
   a decision somebody makes out loud rather than a side effect of editing.

   IT READS BOTH STORES, because a signature reaches the record two ways: an
   internal signer stamps their own row, and a counterparty's arrives on their
   share and is written into c.signatures when the owner's browser applies it.
   Asking only the plan would leave the route editable for as long as nobody
   happened to have the tab open. */
function signingLocked(c){
  return signerPlan(c).some(s => s && s.signed)
    || (Array.isArray(c && c.signatures) ? c.signatures : []).length > 0;
}
/* Start the signing again: every mark taken off, every row re-issued.
   THE IDS ARE MINTED FRESH on purpose — a signing link already in somebody's
   inbox is bound to a row id, and the server refuses a link whose row it can no
   longer find ("this link no longer belongs to it"). New ids therefore retire
   every outstanding signing link without a second mechanism to keep in step. */
function signingRestart(c){
  const was = signerPlan(c).length, marks = (c.signatures || []).length;
  const before = signerPlan(c).map(s => String(s.id));
  c.signerPlan = signerPlan(c).map((s, i) => ({
    ...s, id: 'sg_' + Math.random().toString(36).slice(2, 7), order: i + 1,
    signed: false, at: null, by: null, signature: null }));
  c.signatures = [];
  /* ---- THE PLACES ON THE PAPER COME WITH IT (audit, 30 Aug 2026) ----
     This minted fresh row ids and never touched c.signSpots, so every placed
     mark became nobody's: the reader could no longer fill one, the refusal
     that stops a signature with places outstanding SILENTLY DISARMED, and any
     signature already drawn stayed on the contract as an unnamed "theirs"
     mark — the document showing a signature this very line says was discarded.

     The plan is rewritten one-for-one by index, so old row i IS new row i and
     the remap is exact rather than a guess. WHERE people sign is unchanged;
     WHAT they signed is discarded, which is what the audit line already says
     and what restarting means. */
  const remap = {};
  before.forEach((id, i) => { if(c.signerPlan[i]) remap[id] = c.signerPlan[i].id; });
  if(Array.isArray(c.signSpots) && c.signSpots.length){
    c.signSpots = c.signSpots.map(s => {
      const next = { ...s, signerId: remap[String(s.signerId)] || s.signerId };
      delete next.image; delete next.form; delete next.at; delete next.by;
      return next;
    });
  }
  /* The intent to sign was given against the arrangement being discarded. */
  if (c.compliance) c.compliance.consent = false;
  logAudit(c, 'Signing restarted',
    `Signing started again — ${marks} signature(s) discarded, ${was} signer(s) re-issued. `
    + 'Any signing link already sent no longer works.');
  return c;
}
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
    /* An automatic send that the provider refused: sent_at was honestly NOT
       stamped, and the reason is on the share. Say "failed", not "held" —
       their turn is live and their inbox has nothing. */
    if(links.some(x=>x.sendError)) return 'failed';
    return 'held';
  }
  /* SIGN-purpose links from before auto-binding existed (and hand-shared
     signing links) carry no signer binding — but a live SIGNING link
     addressed to this signer's own email is still their turn reaching them,
     and the panel credits it. Deliberately narrow: a review or view-only
     copy once sent to the same address is NOT their signing turn, and
     counting it was how a row read SENT with no signing link ever sent
     (Young's report, 02 Aug 2026). */
  const em=String(s.email||'').trim().toLowerCase();
  const loose=em?all.filter(x=>!x.signerId && x.purpose==='sign'
    && String(x.recipientEmail||'').trim().toLowerCase()===em):[];
  if(loose.length) return loose.some(x=>x.firstOpenedAt)?'opened':'sent';
  return 'unsent';
}
/* ---- THE SAME QUESTION, ASKED OF AN INTERNAL ROW ----
   signerLinkState above answers "where has their LINK got to", and a link is
   something only a counterparty row has. An internal signer signs in the app as
   themselves, so what there is to know about them is narrower: have they been
   told it is their turn, and did that email actually go.

   That was invisible until now — the nudge was fire-and-forget, nothing was
   recorded and nothing was shown, so an owner could not tell a colleague who
   had been asked and was ignoring it from one who had never been written to.
   The server records every notice (signer_notices) and hands them back with the
   shares the card already fetches, so this reads the same one cache.

     'signed'      — their mark is on the record
     'notified'    — the turn email went
     'notify-failed' — it was attempted and the provider refused it
     'no-address'  — nowhere to write: they cannot be told at all
     'waiting'     — not their turn yet, so there is nothing to have sent
     'untold'      — it IS their turn and nothing has gone out
     'unknown'     — static mode, where notices are not tracked */
function signerNotices(c){
  const all=(typeof cachedSignerNotices==='function'?cachedSignerNotices(c):[])||[];
  return all;
}
function signerNoticeState(c, s){
  if(!s || s.party==='counterparty') return 'link';
  if(s.signed) return 'signed';
  if(!(typeof API_MODE==='function' && API_MODE())) return 'unknown';
  const mine=signerNotices(c).filter(n=>n && String(n.signerId||'')===String(s.id));
  if(mine.length) return mine.some(n=>n.sent) ? 'notified' : 'notify-failed';
  const ns=nextSigner(c);
  if(!ns || String(ns.id)!==String(s.id)) return 'waiting';
  /* NOWHERE TO WRITE IS A FACT, NOT A SILENT NO-OP. Both send paths used to do
     nothing at all when an internal row carried no address, so the owner was
     told nothing and the signer was told nothing. The address is resolved
     server-side from the member record first and the route row second, so the
     browser answers this the same way: a row bound to a member can always be
     reached, whatever the route says. */
  const member=(s.memberId && typeof userById==='function') ? userById(s.memberId) : null;
  const reachable=(member && /.+@.+\..+/.test(String(member.email||'')))
    || /.+@.+\..+/.test(String(s.email||''));
  return reachable ? 'untold' : 'no-address';
}
/* ============================================================================
   THE SIGNING ROUTE RUNS IN STEPS  (Young ruled it 22 Sep 2026)

   A route has always been a strict queue: one signer, then the next, then the
   next. That is one step per row, and it is still exactly what a route with
   nothing stored means — `signStepOf` derives the step from `order`, so every
   route on file keeps the turn order it has always had, to the row.

   WHAT IS NEW is that two rows may share a step. Everybody in a step signs in
   ANY ORDER; the next step's links do not exist until every row in the step
   before has signed. That is the shape a guarantee needs: the customer and
   the provider execute the agreement, and only then does the guarantor sign
   the thing they are guaranteeing.

   `step` is an ordinary field on a row and is ABSENT on every row on file.
   Nothing here writes it but `saveSignerPlan`, which is still the one
   authority on the route.
   ========================================================================== */
/* A row's step. ABSENT IS THE OLD READING: its own place in the queue, so a
   five-row route with nothing stored is five steps of one, which is what it
   has always been. A stored step is bounded at 1 — a zero or a negative would
   sort ahead of the first step and open a link nobody released. */
function signStepOf(s){
  if(!s) return 1;
  const n = Number(s.step);
  if(Number.isFinite(n) && n >= 1) return Math.floor(n);
  const o = Number(s.order);
  return (Number.isFinite(o) && o >= 1) ? Math.floor(o) : 1;
}
/* The route as steps: an ordered list of `{n, rows}`, the step numbers
   RENUMBERED from 1 with no gaps, because a route whose steps read 1, 2, 5 is
   a route a reader has to work out. The stored numbers are only ever an
   ORDER; this is what every screen draws and what every guard asks. */
function signSteps(c){
  const plan = signerPlan(c).slice().sort((a,b)=>(a.order||0)-(b.order||0));
  const by = new Map();
  plan.forEach(s => { const k = signStepOf(s);
    if(!by.has(k)) by.set(k, []); by.get(k).push(s); });
  return [...by.keys()].sort((a,b)=>a-b).map((k, i) => ({ n: i+1, rows: by.get(k) }));
}
/* Which renumbered step a row is in, or 0 where it is not on the route. */
function signStepIndex(c, s){
  const id = String((s && s.id) || '');
  const st = signSteps(c).find(x => x.rows.some(r => String(r.id) === id));
  return st ? st.n : 0;
}
/* Is every row in this step signed? An empty step is not complete — it is a
   step somebody has not named anybody in, and treating it as done would
   release the next one over an unnamed signature. */
function signStepDone(c, n){
  const st = signSteps(c).find(x => x.n === n);
  return !!st && st.rows.length > 0 && st.rows.every(r => r.signed);
}
/* HAS SIGNING REACHED THIS STEP? Every earlier step complete, and no more.
   This is the one reading the browser draws and the server enforces. */
function signStepOpen(c, n){
  const steps = signSteps(c);
  for(const st of steps){ if(st.n >= n) break; if(!st.rows.every(r => r.signed)) return false; }
  return steps.some(st => st.n === n);
}
/* MAY THIS ROW SIGN NOW? True where its step is open and it has not signed.
   On a route with nothing stored this is exactly `nextSigner === s`, which is
   what it has always meant. */
function signRowOpen(c, s){
  if(!s || s.signed) return false;
  return signStepOpen(c, signStepIndex(c, s));
}
/* The step the route is waiting on — the first with anything unsigned in it.
   0 once everything is signed. */
function signStepNow(c){
  const st = signSteps(c).find(x => !x.rows.every(r => r.signed));
  return st ? st.n : 0;
}
/* ---- WHOSE TURN IT IS, WIDENED FROM ONE TO A STEP ----
   `nextSigner` answers ONE row because four readings and a notice are built on
   "the next person". With one row per step that is the same row it always
   answered. With two rows in a step it answers the first unsigned one, and
   `signOpenRows` is what a screen asks when it needs all of them. */
function nextSigner(c){
  const open = signOpenRows(c);
  if(open.length) return open[0];
  return signerPlan(c).slice().sort((a,b)=>a.order-b.order).find(s=>!s.signed)||null;
}
/* Everybody whose turn it is right now. One name on an ordinary route. */
function signOpenRows(c){
  const n = signStepNow(c);
  if(!n) return [];
  const st = signSteps(c).find(x => x.n === n);
  return st ? st.rows.filter(r => !r.signed) : [];
}
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
   executed outside HaTi carries the paper, which is already both.

   ---- A SIGNING ROUTE IS THE ANSWER, NOT A CLUE TOWARDS IT ----
   Field report (Young, 02 Aug 2026): a contract signed right through its route
   sat sealed, locked and captioned "Executed & sealed" with a "Partially
   signed" chip beside it, and no copy ever reached anybody.

   Two authorities were deciding "is this done" and they were reading different
   records. Sealing asks the ROUTE (allSigned) — every named signer has signed,
   so the wording stops moving and finalizeExecution runs. This asked the change
   set of SIGNATURES instead, classified them by their `party` field, and
   inferred that a counterparty still owed one from nothing more than
   c.counterparty holding a name. A route whose rows are all internal — the
   owner and a colleague, two directors, a witness — completes, seals the
   document and locks it, while this went on reporting a missing signature that
   nobody was ever going to add. Terminal: no later signature can arrive to
   settle it, distributeExecuted refuses to send a half-signed copy, and the
   contract can never leave that state.

   The route is the owner's explicit statement of who must sign — the editor's
   own words are "signers execute in order" and "counterparty signers each get
   their own secure link", so a counterparty who has to sign belongs ON it. When
   there is a route, it answers this question, exactly as it already answers
   when to seal. Where there is NO route the inference below is untouched: that
   is the single-signer path, where the owner signs, the contract seals, and the
   counterparty's mark lands afterwards through their share link — the flow f135
   exists to protect. */
function executionParties(c){
  const sigs=Array.isArray(c&&c.signatures)?c.signatures:[];
  const isTheirs=s=>!!s&&(s.party==='counterparty'||s.party==='external');
  const theirs=sigs.filter(isTheirs), ours=sigs.filter(s=>s&&!isTheirs(s));
  const offPlatform=!!(window.isExternallyExecuted&&isExternallyExecuted(c));
  const expectsCounterparty=!!String((c&&c.counterparty)||'').trim();
  const nameOf=list=>String((list[0]&&(list[0].name||list[0].email))||'').trim();
  const plan=signerPlan(c);
  const routed=plan.length>0, routeDone=routed&&plan.every(s=>s&&s.signed);
  return { ours:ours.length, theirs:theirs.length, routed, routeDone,
    /* The PARTY, not the workspace — this name goes on the executed copy and
       into the "only X has signed" notice. See contractParty in js/core.js. */
    ourName:nameOf(ours)||(window.contractParty?contractParty(c):'')||(window.FIRST_PARTY||'this workspace'),
    theirName:nameOf(theirs)||String((c&&c.counterparty)||'the counterparty'),
    fully: offPlatform || (routed ? routeDone
      : (ours.length>0 && (theirs.length>0 || !expectsCounterparty))) };
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
/* opts.onDone — WHERE TO GO BACK TO. The editor closed straight onto the
   workspace, which is right when it was opened from the Signing tab and wrong
   when it was opened from inside the share dialog: assigning a signer there is
   a detour on the way to sending, and dumping the sender out of the dialog
   makes them start the send again. The caller says where it came from; with no
   caller saying, the old behaviour stands exactly as it was. Cancel goes back
   the same way — a reader who changed nothing should certainly not lose more
   than one who changed something. */
/* ---- WHAT STANDS WHERE THE EDITOR WOULD BE, ONCE SOMEBODY HAS SIGNED ----
   Not a disabled form. It says who has signed and what that costs to undo, and
   offers the one way forward. The restart is deliberately the SECONDARY control
   and Close is the primary: the common reason for opening this screen after a
   signature is to look, not to tear it up. */
function openSigningLockedNotice(c, opts){
  const back = opts && typeof opts.onDone === 'function' ? opts.onDone : null;
  const done=signerPlan(c).filter(s=>s&&s.signed);
  const marks=(c.signatures||[]).length;
  const who=done.length
    ? done.map(s=>esc(s.name||'—')).join(', ')
    : esc(((c.signatures||[])[0]||{}).name || i18t('ap_someone'));
  const admin=(typeof isAdmin==='function') && isAdmin();
  openModal(`<div class="p-6">
    <h3 class="font-serif font-600 text-lg text-ink mb-1">${i18t('ap_signing_route')}</h3>
    <div style="border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-radius:var(--radius);padding:11px 13px;margin:10px 0 var(--s-3)">
      <div style="display:flex;align-items:center;gap:6px;font-size:var(--t-body);font-weight:var(--w-title);color:var(--st-amber-fg);margin-bottom:5px">${icon('alert','w-3.5 h-3.5')} ${i18t('ap_route_locked')}</div>
      <p style="margin:0;font-size:var(--t-meta);line-height:1.6;color:var(--st-amber-fg)">${
        esc(i18tn('ap_route_locked_why',Math.max(1,done.length||marks),{ who }))}</p>
    </div>
    <p class="text-xs text-ink/65 mb-1" style="line-height:1.6">${esc(i18t('ap_route_locked_restart'))}</p>
    <ul class="text-xs text-ink/60 mb-4" style="line-height:1.6;padding-left:18px;margin-top:var(--s-1);list-style:disc">
      <li>${esc(i18tn('ap_restart_loses_marks',Math.max(1,marks||done.length),{n:Math.max(1,marks||done.length)}))}</li>
      <li>${esc(i18t('ap_restart_kills_links'))}</li>
      <li>${esc(i18t('ap_restart_keeps_wording'))}</li>
    </ul>
    <div class="flex justify-end gap-2">
      ${admin?`<button id="sp-restart" class="ui-btn ui-btn-danger">${i18t('ap_start_signing_again')}</button>`
        :`<span class="text-[11px] text-ink/50 self-center">${esc(i18t('ap_restart_admin_only'))}</span>`}
      <button id="sp-shut" class="ui-btn ui-btn-primary">${i18t('act_close')}</button>
    </div></div>`);
  document.getElementById('sp-shut').addEventListener('click',()=>{ closeModal(); if(back) back(); });
  document.getElementById('sp-restart')?.addEventListener('click',async()=>{
    /* Typed, not clicked. Discarding a signature somebody has given is the most
       expensive undo in the product, and it is the one place a second press of
       the same button would be too cheap a way to reach it. */
    const ok=await confirmDialog({
      get title(){ return i18t('ap_start_signing_again'); },
      message:i18tn('ap_restart_confirm',Math.max(1,marks||done.length),
        { n:Math.max(1,marks||done.length), who }),
      get confirmLabel(){ return i18t('ap_restart_confirm_btn'); },
      get cancelLabel(){ return i18t('act_cancel'); } });
    if(!ok) return;
    signingRestart(c); persist(c); closeModal();
    toast(i18t('ap_restart_done'));
    if(back) back(); else if(window.renderWorkspace) renderWorkspace();
  });
}
/* ---- SAVING A SIGNING ROUTE: ONE AUTHORITY, TWO EDITORS (23 Aug 2026) ----
   The phone gained a signer picker of its own, and the one thing it must NOT
   gain is a second copy of what saving a route means. This is that meaning,
   lifted out of the desktop editor's Save handler byte for byte and now asked
   by both: the row shape (ids minted, order renumbered, every signature fact
   carried over from the prior row), the refusal — A ROUTE WITH ONE SIDE ON IT
   IS NOT A ROUTE, named by the side that is missing rather than restated as a
   rule — the audit line, and the persist.

   RETURNS the reason it refused, or null when it saved. The CALLER decides how
   to say it, because a toast is right on the desktop and a sheet's own error
   line is right on a phone; what neither may decide is WHETHER.

   It is deliberately not asked to check signingLocked: both editors refuse
   before they open, which is where a locked route belongs — a form drawn and
   then refused on Save is a form that wasted the reader's typing. */
function saveSignerPlan(c, rows){
  const out=[];
  (rows||[]).forEach(s=>{ if(!s || !s.name) return;
    const prior=(c.signerPlan||[]).find(p=>p.id===s.id);
    /* `step` and `partyId` are ADDITIVE and absent on every row on file. A
       row that names neither reads exactly as it read yesterday: its own step
       in the queue, and the first outside party (or ours) for its side. */
    const step=Number(s.step);
    out.push({ id:s.id||'sg_'+Math.random().toString(36).slice(2,7), party:s.party, name:s.name, role:s.role||'',
      email:s.email, memberId:s.party==='internal'?(s.memberId||''):'', order:out.length+1,
      ...(Number.isFinite(step)&&step>=1?{step:Math.floor(step)}:{}),
      ...(s.partyId?{partyId:String(s.partyId)}:{}),
      signed:prior?!!prior.signed:false, at:prior?prior.at:null, by:prior?prior.by:null, signature:prior?prior.signature:null }); });
  const ourN=out.filter(s=>s.party!=='counterparty').length;
  const theirN=out.filter(s=>s.party==='counterparty').length;
  if(!ourN || !theirN){
    return i18t(!ourN&&!theirN?'ap_need_both_sides'
      :!ourN?'ap_need_our_side':'ap_need_their_side',
      { them:c.counterparty||i18t('ct_a_counterparty') });
  }
  c.signerPlan=out;
  logAudit(c,'Signing route',`Set ${out.length} signer(s) in order`);
  persist(c);
  return null;
}

function openSignerPlanEditor(c, opts){
  const back = opts && typeof opts.onDone === 'function' ? opts.onDone : null;
  /* ---- SHUT ONCE ANYBODY HAS SIGNED ----
     See signingLocked. The editor is not disabled field by field — it is not
     drawn at all, and what stands in its place says who has signed and offers
     the one way forward. A greyed-out form invites the reader to work out which
     control is the one that still does something. */
  if(signingLocked(c)){ openSigningLockedNotice(c, opts); return; }
  /* ---- THE ANSWER ALREADY IN THE BOX (Young ruled 21 Sep 2026) ----
     Where somebody has named the people on this contract, an EMPTY plan opens
     on them rather than on nothing — the same idiom a template's own filing
     uses on the stream picker. A PLAN THAT EXISTS IS NEVER TOUCHED: somebody
     arranged it, and an order is a decision. saveSignerPlan below stays the
     one authority on naming signers; this only fills the form. */
  const plan=(c.signerPlan||[]).slice();
  if(!plan.length && typeof participantSignerRows==='function'){
    try{ participantSignerRows(c).forEach(r=>plan.push({ ...r,
      id:'sg_'+Math.random().toString(36).slice(2,7), order:plan.length+1, signed:false })); }catch(_){}
  }
  /* ---- IT OPENS ON THE QUESTION IT IS ASKING ----
     "It should ask for the owners and the counterparties that will sign."
     An empty editor asked for neither: it showed one link reading "Add signer"
     over an empty list, and every route began by working out that a route has
     two sides. It now opens with a slot for each, filled in as far as the
     record can fill them — the person doing this is usually one of the two
     names, and the other is on the contract. Both are ordinary rows: editable,
     removable, and reorderable exactly like any other. */
  if(!plan.length){
    const me=(typeof currentUser==='function' && currentUser())||null;
    const them=(typeof counterpartyContact==='function'?counterpartyContact(c):null)||{};
    plan.push({ party:'internal', name:me?me.name:'', email:me?me.email:'',
      role:(me&&typeof signerTitle==='function'?signerTitle(me):'')||'',
      memberId:me?me.id:'' });
    plan.push({ party:'counterparty', name:them.name||c.counterparty||'',
      email:them.email||c.counterpartyEmail||'', role:'', memberId:'' });
  }
  const members=(getUsers()||[]).filter(u=>u.role!=='viewer');
  // People directory (imported contacts + team members) → drives name auto-fill.
  const people=(typeof orgDirectory==='function')?orgDirectory():[];
  const dirList=`<datalist id="sp-dir-names">${people.map(p=>`<option value="${(p.name||p.email||'').replace(/"/g,'&quot;')}">${[p.title,p.email].filter(Boolean).join(' · ').replace(/"/g,'&quot;')}</option>`).join('')}</datalist>`;
  /* ONE BOX HEIGHT (the Compact ladder, 26 Sep 2026): the row's selects and
     the step number are text boxes, so they sit on the field rung beside the
     22px move buttons instead of their own 32-33px. */
  const IN='rounded-lg border border-inputln bg-white ui-fld';
  const memberOpts=s=>`<option value="">${i18t('ap_pick_member')}</option>`+members.map(u=>`<option value="${u.id}" ${s.memberId===u.id?'selected':''}>${(u.name||u.email).replace(/</g,'&lt;')}</option>`).join('');
  const esc1=v=>String(v==null?'':v).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  /* WHICH COMPANY THIS PERSON SIGNS FOR. Drawn only where there is more than
     one outside party to choose between — on an ordinary contract the row's
     own "counterparty" already names the one there is, and a picker with a
     single option is a control that decides nothing. */
  const partyOpts=(s,i)=>{
    if(typeof partiesMulti!=='function' || !partiesMulti(c) || s.party!=='counterparty') return '';
    const rows=partiesTheirs(c);
    const cur=String(s.partyId||'');
    return `<select data-sp-partyid="${i}" class="${IN}">${
      rows.map(p=>`<option value="${esc1(p.id)}"${p.id===cur?' selected':''}>${esc1(p.name)}</option>`).join('')}</select>`;
  };
  const row=(s,i)=>`<div class="rounded-xl border border-line bg-slate-50/60 p-2.5 mb-2" data-sp-row="${i}">
      <div class="flex items-center gap-2 mb-1.5">
        <span class="h-5 w-5 grid place-items-center rounded-full bg-brand-600 text-white text-[10px] font-700">${i+1}</span>
        <select data-sp-party="${i}" class="${IN}">
          <option value="internal" ${s.party==='internal'?'selected':''}>${i18t('ap_internal')}</option>
          <option value="counterparty" ${s.party==='counterparty'?'selected':''}>${i18t('ap_counterparty')}</option></select>
        <span data-sp-member-wrap="${i}" class="${s.party==='counterparty'?'hidden':''}">
          <select data-sp-member="${i}" class="${IN}">${memberOpts(s)}</select></span>
        ${''/* ---- WHICH STEP, AND WHICH PARTY (22 Sep 2026) ----
               The step box is an ordinary number: two rows given the same
               number sign in any order, and the next step opens when they are
               both done. It DEFAULTS TO THE ROW'S OWN PLACE, so a route
               arranged without touching it is the strict queue it has always
               been. The party picker is drawn only on a contract with more
               than one outside party, where "counterparty" no longer names
               one company. */}
        <label class="flex items-center gap-1 text-[10px] text-ink/50">${esc1(i18t('py_step_n',{n:''}).trim())}
          <input data-sp-step="${i}" type="number" min="1" max="20" value="${
            (typeof signStepOf==='function')?signStepOf({step:s.step,order:i+1}):(i+1)}"
            class="${IN}" style="width:52px;text-align:center"/></label>
        ${partyOpts(s,i)}
        <div class="ml-auto flex items-center gap-1">
          <button data-sp-up="${i}" ${i===0?'disabled':''} class="ui-btn ui-btn-plain ui-btn-sm ui-btn-icon" title="${i18t('tb_move_up')}" aria-label="${i18t('tb_move_up')}">${icon('chevU')}</button>
          <button data-sp-down="${i}" class="ui-btn ui-btn-plain ui-btn-sm ui-btn-icon" title="${i18t('tb_move_down')}" aria-label="${i18t('tb_move_down')}">${icon('chevD')}</button>
          <button data-sp-del="${i}" class="ui-btn ui-btn-plain ui-btn-sm ui-btn-icon ui-btn-danger ml-1" title="${i18t('act_remove')}" aria-label="${i18t('act_remove')}">${icon('x')}</button></div>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <input data-sp-name="${i}" list="sp-dir-names" value="${(s.name||'').replace(/"/g,'&quot;')}" placeholder="${i18t('ap_name')}" class="${IN}"/>
        <input data-sp-role="${i}" value="${(s.role||'').replace(/"/g,'&quot;')}" placeholder="${i18t('ap_title_eg')}" class="${IN}"/>
        <input data-sp-email="${i}" value="${(s.email||'').replace(/"/g,'&quot;')}" placeholder="${i18t('ap_email')}" class="${IN}"/>
      </div></div>`;
  openModal(`<div class="p-6">
    <h3 class="font-serif font-600 text-lg text-ink mb-1">${i18t('ap_signing_route')}</h3>
    <p class="text-xs text-ink/60 mb-3">${i18t('ap_route_line')}</p>
    ${dirList}
    <div id="sp-rows">${plan.map(row).join('')||`<div class="text-[12px] text-ink/50 mb-2">${i18t('ap_no_signers')}</div>`}</div>
    <button id="sp-add" class="ui-link mb-2">${(typeof window!=='undefined'&&window.plusLed?window.plusLed(i18t('ap_add_signer')):i18t('ap_add_signer'))}</button>
    ${''/* ---- BOTH SIDES, COUNTED WHILE YOU TYPE ----
           The rule is that a route names somebody on each side, and a rule a
           form only mentions when it refuses is a rule the form is keeping to
           itself. This says where the route stands after every keystroke, so
           the refusal below is a confirmation rather than a surprise. */}
    <div id="sp-tally" class="mb-4 text-[11.5px] leading-relaxed"></div>
    <div class="flex justify-end gap-2"><button id="sp-cancel" class="ui-btn">${i18t('act_cancel')}</button>
      <button id="sp-save" class="ui-btn ui-btn-primary">${i18t('ap_save_route')}</button></div>
  </div>`, { maxWidth: DLG_W.l });
  /* Named rows only, on both counts: a blank row is discarded on save (see
     `if(!s.name) return` below), so counting it here would promise a route the
     save is about to refuse. */
  const tally=()=>{
    const el=document.getElementById('sp-tally'); if(!el) return;
    const named=p=>plan.filter(s=>s && String(s.name||'').trim() && (p==='counterparty'
      ? s.party==='counterparty' : s.party!=='counterparty')).length;
    const ours=named('internal'), theirs=named('counterparty');
    const ok=ours>0 && theirs>0;
    const line=(n,label)=>`<span style="color:${n?'var(--st-green-fg)':'var(--st-amber-fg)'};font-weight:var(--w-strong)">${n?'✓':'○'} ${esc(label)}</span>`;
    el.innerHTML=`${line(ours,i18tn('ap_our_side_n',ours,{n:ours}))} &nbsp;·&nbsp; ${
      line(theirs,i18tn('ap_their_side_n',theirs,{n:theirs}))}`
      + (ok?'':`<div style="color:var(--color-neutral-600);margin-top:3px">${esc(i18t('ap_both_sides_needed'))}</div>`);
  };
  const rerow=()=>{ document.getElementById('sp-rows').innerHTML=plan.map(row).join('')||''; wire(); tally(); };
  const readRow=idx=>{ const g=sel=>document.querySelector(`[data-sp-${sel}="${idx}"]`);
    const step=g('step')?Number(g('step').value):NaN;
    return { party:g('party').value, name:g('name').value.trim(), role:g('role').value.trim(), email:g('email').value.trim(),
      memberId:g('member')?g('member').value:'',
      ...(Number.isFinite(step)&&step>=1?{step:Math.floor(step)}:{}),
      ...(g('partyid')?{partyId:g('partyid').value}:{}) }; };
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
  /* The tally follows typing, not just structural changes — a name typed into
     an existing row is the commonest way a side stops being empty. */
  document.getElementById('sp-rows')?.addEventListener('input',()=>{ syncPlanFromDom(); tally(); });
  wire(); tally();
  document.getElementById('sp-cancel').addEventListener('click',()=>{ closeModal(); if(back) back(); });
  document.getElementById('sp-save').addEventListener('click',()=>{
    syncPlanFromDom();
    /* The rule lives in saveSignerPlan and is shared with the phone's picker.
       This decides only HOW to say a refusal — a toast, here. */
    const why=saveSignerPlan(c, plan);
    if(why){ toast(why,'err'); return; }
    closeModal();
    if(back) back(); else renderWorkspace();
    toast(i18t('ap_route_saved'),'ok');
  });
}

/* ---- approval + signer status panel (rendered in the sign area) ---- */
/* ---- TWO CARDS, AND THE SIGNING TAB PLACES THEM SEPARATELY ----
   These were one string: the approval chain and the signing route, stacked,
   dropped into whatever slot asked for them. The Signing tab puts the chain and
   the route side by side in its right-hand column, so each half is now its own
   function and approvalPanelHtml is the two of them together — which is what
   every other caller still gets. */
function approvalPanelHtml(c){
  return approvalChainHtml(c) + signerRouteHtml(c);
}
/* opts.bare — drawn INSIDE a host card that supplies its own frame and title
   (the Signing tab's "Approval gate"). Without it this box nests inside that
   one and the reader gets two borders and two headings for one thing. */
const esc1x=s=>String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
/* ---- THE RECEIPT, NOT THE REASSURANCE (upgrade 6, 18 Sep 2026) ----
   The artifact's own words: "because each line is a rule that was actually
   checked, it is a receipt rather than a reassurance." So this is not a
   sentence saying nothing is owed — it is ONE LINE PER RULE, read off the
   rules this workspace really has, in their own order, each saying what that
   rule asked and what this contract answered.

   IT BORROWS THE ONE READING. `ruleMatches` is what buildApprovalChain asks,
   and it is asked here too: a rule is on this list precisely because that
   function said no. A second copy of "does this rule bite" is how a card
   comes to disagree with the gate twelve pixels above it.

   THE LINE IS KEYED ON THE CONDITION TYPE, never on the rule's NAME — a name
   is typed by an admin and can say anything, and `condLabel` is the settings
   page's own printer for an editor, not a finding. A condition type this
   product does not know prints the rule's name rather than a guess.

   AND IT IS NOT PERMISSION TO SIGN. "Before you sign" still holds whatever it
   holds; this card answers one question — whose sign-off is owed — and its
   answer here is nobody's. */
const APPROVAL_CLEAR_SAYS = {
  value: (cond, c) => {
    /* An NDA carries no money at all, which is a different and better answer
       than "under the threshold". isMonetary is the ONE reading of that. */
    if(typeof isMonetary==='function' && !isMonetary(c)) return i18t('ap_clr_no_money');
    const amt=(typeof fmtMoneyShort==='function')?fmtMoneyShort(cond.value):String(cond.value);
    return (cond.op==='<=') ? i18t('ap_clr_value_over',{amount:amt}) : i18t('ap_clr_value_under',{amount:amt});
  },
  folder: cond => i18t('ap_clr_not_stream',{name:((typeof FOLDERS!=='undefined'&&FOLDERS[cond.value])||{}).name||cond.value}),
  kind: cond => i18t('ap_clr_not_kind',{value:cond.value}),
  /* The market is the workspace's own, named — "foreign law" with no home
     named is a fact a reader cannot check. */
  foreignLaw: () => i18t('ap_clr_home_law',{law:(typeof jxAdjective==='function')?jxAdjective():''}),
  deviation: () => i18t('ap_clr_no_departure'),
};
function approvalClearRows(c){
  const rows=[];
  let rules=[]; try{ rules=approvalRules()||[]; }catch(_){ rules=[]; }
  for(const r of rules.slice().sort((a,b)=>(a.order||99)-(b.order||99))){
    if(!r || !r.cond) continue;
    let bit=false; try{ bit=ruleMatches(r,c); }catch(_){ bit=false; }
    if(bit) continue;                       // it bit — the chain names it, not this card
    const say=APPROVAL_CLEAR_SAYS[r.cond.type];
    let line=''; try{ line=say?String(say(r.cond,c)||''):''; }catch(_){ line=''; }
    rows.push({ k:String(r.cond.type||''), said: line || String(r.name||'') });
  }
  /* THE OVERSEER IS A RULE TOO, and its absence is the same kind of fact: no
     colleague is set to oversee whoever raised this. Only said where the
     product has somebody to have named. */
  /* Read off the SAME needs the chain draws (23 Sep 2026): nobody on this
     contract is marked as needing a named approval before signing. */
  let needs=[]; try{ needs=signApprovalNeeds(c); }catch(_){ needs=[]; }
  if(!needs.length) rows.push({ k:'overseer', said:i18t('ap_clr_no_overseer') });
  /* AND THE READER'S OWN SIGNING LIMIT, which is checked in the same breath
     and holds nothing here. Only where a limit was actually answered — an
     unanswered cap is not a limit this contract is inside of. */
  try{
    const me=(typeof currentUser==='function')?currentUser():null;
    if(me && me.role!=='admin' && typeof signCapEnforced==='function' && signCapEnforced()){
      const cap=signCapOf(me);
      if(cap.answered && cap.limit!=null && !(typeof signCapBlocker==='function' && signCapBlocker(c,me)))
        rows.push({ k:'cap', said:i18t('ap_clr_in_cap',{
          amount:(typeof fmtMoneyShort==='function')?fmtMoneyShort(cap.limit):String(cap.limit) }) });
    }
  }catch(_){}
  return rows;
}
function approvalClearHtml(c){
  const esc1c=s=>String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  const rows=approvalClearRows(c);
  /* A WORKSPACE WITH NO RULES AT ALL still gets the headline and the lead —
     "nobody's sign-off is owed" is true — but no ticks, because there was
     nothing to check and a receipt for nothing is the reassurance this was
     built to replace. */
  const list=rows.length?`<ul class="ap-clear-list" style="list-style:none;margin:6px 0 0;padding:0">${
    rows.map(r=>`<li data-ap-clr="${esc1c(r.k)}" style="display:flex;gap:6px;align-items:flex-start;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.5;margin-top:2px"><span aria-hidden="true" style="color:var(--st-green-fg)">\u2713</span><span>${
      esc1c(r.said)}</span></li>`).join('')}</ul>`:'';
  return `<div class="ap-clear" style="margin:0;font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.5">${
    esc1c(i18t('ap_none_needed'))}<span style="display:block;color:var(--color-neutral-500);font-size:var(--t-label);margin-top:3px">${
    esc1c(i18t(rows.length?'ap_none_needed_checked':'ap_none_needed_why'))}</span>${list}</div>`;
}
function approvalChainHtml(c, opts){
  const bare=!!(opts&&opts.bare);
  const st=approvalState(c);
  /* ---- SAY OUT LOUD WHEN NOTHING IS IN THE WAY (upgrade 6, 18 Sep 2026) ----
     HaTi already works out whether a contract needs anybody's sign-off: the
     value, the value stream, the kind of paper, foreign law, whether the
     wording departs from the standards, and the reader's own signing limit.
     When one of those bit, this card appeared and named who has to approve.
     When NONE of them bit, the card was not drawn at all — so the person
     holding an ordinary contract that genuinely needs no sign-off was never
     told that, and sent it to legal anyway to be safe. That is the delay the
     whole playbook exists to remove, put back by silence.

     ONE MORE BRANCH ON THIS CARD, not a new band: the same card, in its other
     state, one line. It is OPT-IN (`opts.clear`) so every older caller is
     byte-identical, and the Signing tab asks for it only while the contract is
     still open — on a sealed record there is nothing left to decide and the
     sentence would be furniture. It names where the rules live, because an
     assurance a reader cannot check is worth less than the silence it
     replaced. */
  if(!st.required) return (opts&&opts.clear) ? approvalClearHtml(c) : '';
  const stepChip=s=>s.status==='approved'?'text-brand-600':s.status==='rejected'?'text-rose-600':s.status==='stale'?'text-gold-700':'text-ink/50';
  const esc1=s=>String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  /* A PERSONAL APPROVAL SAYS WHERE ITS OWN REQUEST STANDS — not asked yet,
     asked, needs you, approved, refused, lapsed. Its reason and its verbs
     are on the readiness list and on the approver's own card; this row is
     the record. */
  const me=(typeof currentUser==='function')?currentUser():null;
  const saRight=s=>s.status==='approved'?`✓ ${esc1(i18t('sa_gate_approved',{when:saWhen(s.at)}))}`
    :s.status==='rejected'?esc1(i18t('sa_gate_refused',{when:saWhen(s.at)}))
    :s.status==='stale'?esc1(i18t(s.expired?'sa_gate_expired':'sa_gate_lapsed'))
    :s.status==='pending'?esc1((s.req&&typeof saMayDecide==='function'&&saMayDecide(s.req,me))
      ? i18t('sa_gate_needs_you') : i18t('sa_gate_pending',{when:saWhen(s.req&&s.req.askedAt)}))
    :esc1(i18t('sa_gate_unasked'));
  const stepRight=s=>s.sa?saRight(s)
    :s.status==='approved'?`✓ ${esc1(s.by)}`
    :s.status==='rejected'?`✕ refused by ${esc1(s.by)}`
    :s.status==='stale'?`↻ re-approval needed`
    :'needs '+approverLabelOf(s.approver);
  const stepName=s=>s.sa?`${esc1(s.name)} <span class="text-ink/50">· ${esc1(i18t('sa_gate_approves',{who:approverLabelOf(s.approver)}))}</span>`:esc1(s.name);
  let html='';
  {
    /* THE REFUSAL, AND THE WAY OUT OF IT — both on the panel the owner reads.
       A rejected step used to be erased before it could be drawn (see
       buildApprovalChain); now that it survives, the owner is told what was
       refused, by whom and why, and given the one control that moves it on. */
    const blocked=(st.rejected||[]).concat(st.stale||[]).filter(x=>!x.sa);
    const owner=canEdit()&&c.status!=='Signed'&&blocked.length;
    html+=`<div class="${bare?'':'rounded-xl border '+(st.rejected&&st.rejected.length?'border-rose-200':'border-line')+' bg-white p-3 mb-2'}">
      ${bare?'':`<div class="text-[11px] font-600 text-ink mb-1.5">${i18t('ap_approval_chain')}</div>`}
      ${st.chain.map((s,i)=>`<div class="flex items-center gap-2 text-[11.5px] py-0.5">
        <span class="h-4 w-4 grid place-items-center rounded-full text-[8px] font-700 ${s.status==='approved'?'bg-brand-600 text-white':s.status==='rejected'?'bg-rose-500 text-white':s.status==='stale'?'bg-gold-500 text-white':'bg-slate-200 text-ink/60'}">${i+1}</span>
        <span class="${stepChip(s)}">${stepName(s)}</span>
        <span class="ml-auto text-[10px] text-ink/50">${stepRight(s)}</span>
      </div>`).join('')}
      ${(st.rejected||[]).filter(s=>!s.sa).map(s=>`<div class="mt-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700 leading-relaxed">
        <b>${esc1(s.by)||'An approver'} refused “${esc1(s.name)}”.</b>${s.comment?` “${esc1(s.comment)}”`:''}
        <span class="block text-rose-700/80 mt-0.5">${i18t('ap_nothing_until_settled')}</span>
      </div>`).join('')}
      ${(st.stale||[]).filter(s=>!s.sa).map(s=>`<div class="mt-1.5 rounded-lg border border-gold-500/30 bg-gold-500/10 px-2.5 py-2 text-[11px] text-gold-700 leading-relaxed">
        <b>“${esc1(s.name)}” needs approving again.</b> ${esc1(s.by)||'It'} approved it, and since then ${esc1((s.drift||[]).join(' and '))}.
        <span class="block text-gold-700/80 mt-0.5">${i18t('ap_signoff_covers')}</span>
      </div>`).join('')}
      ${st.next&&st.canApproveNext&&!st.next.sa?`<div class="flex gap-2 mt-2">
        <button id="ap-approve" class="ui-btn ui-btn-sm ui-btn-primary">${st.next.status==='pending'?'Approve':'Approve again'} “${esc1(st.next.name)}”</button>
        <button id="ap-reject" class="ui-btn ui-btn-sm ui-btn-danger">${i18t('ve_reject')}</button></div>`
        :(st.next&&!st.next.sa)?`<div class="mt-1.5 text-[10px] text-ink/55">${i18t('ap_waiting_on',{who:approverLabelOf(st.next.approver)})}</div>`:''}
      ${''/* ---- GREY WHEN THERE IS NOTHING TO SEND BACK ----
             This drew for the owner whatever the chain said, and the act behind
             it refuses unless some step is rejected or stale — the same set the
             two blocks directly above are built from. So on a chain that is
             simply waiting on the next approver, the owner was offered a button
             whose only outcome was a refusal. ONE reading (the chain's own
             rejected/stale steps) now decides both, and the reason is on hover
             because a dimmed control that cannot explain itself is a wall. */}
      ${owner?(()=>{ const back=(st.chain||[]).filter(x=>!x.sa&&(x.status==='rejected'||x.status==='stale'));
        const why=back.length?'':i18t('ap_nothing_resubmit');
        return `<button id="ap-resubmit"${why?' disabled aria-disabled="true"':''} title="${esc1(why)}"
          class="ui-btn ui-btn-sm mt-2 w-full${why?' opacity-50 cursor-not-allowed':''}">${i18t('ap_revise_send_back')}</button>`; })():''}
    </div>`;
  }
  return html;
}
/* ---- THE SIGNING ROUTE ----
   Who signs, in what order, and where each of them has got to. Drawn whenever
   a route exists; the Signing tab draws its own head above it and offers the
   editor whether or not one has been set yet, because "add another signer" is
   the one thing this card could never do from inside itself. */
function signerRouteHtml(c, opts){
  const bare=!!(opts&&opts.bare);
  const esc1=s=>String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  let html='';
  const plan=signerPlan(c);
  if(plan.length){
    const sorted=plan.slice().sort((a,b)=>a.order-b.order);
    const ns=nextSigner(c);
    const signedCount=sorted.filter(s=>s.signed).length;
    const ord=n=>{ const t=['th','st','nd','rd'], v=n%100; return n+(t[(v-20)%10]||t[v]||t[0]); };
    /* ---- THE STEPS, DRAWN ONLY WHERE THERE ARE ANY ----
       A route whose every step holds one row is the strict queue this card has
       always drawn, and it draws NO headings — so nothing on file moved. The
       headings appear the moment two rows share a step, which is the only time
       a reader needs to be told that two people may sign in any order. */
    const steps=(typeof signSteps==='function')?signSteps(c):[];
    const stepped=steps.some(x=>x.rows.length>1);
    const firstOf=new Map();
    if(stepped) steps.forEach(x=>{ if(x.rows[0]) firstOf.set(String(x.rows[0].id), x); });
    const stepLead=(s)=>{
      if(!stepped) return '';
      const x=firstOf.get(String(s.id)); if(!x) return '';
      const done=x.rows.filter(r=>r.signed).length;
      const open=(typeof signStepOpen==='function')?signStepOpen(c,x.n):true;
      return `<div class="ap-stepb${open?'':' is-dim'}"><span>${esc1(x.n===1
          ? i18t('py_step_any_order',{n:x.n})
          : i18t('py_step_released',{n:x.n,prev:x.n-1}))}</span><span class="ap-stepn">${
          esc1(i18t('py_step_count',{done,total:x.rows.length}))}</span></div>`;
    };
    /* WHICH COMPANY THIS PERSON SIGNS FOR. Drawn only on a contract with more
       than one outside party: on an ordinary one the row's own `party` tag
       already says which side, and the name would be the contract's own
       counterparty printed on every row. */
    const manyParties=(typeof partiesMulti==='function')?partiesMulti(c):false;
    /* NOBODY SIGNS BEFORE THE APPROVAL (23 Sep 2026): every unsigned row
       WAITS while a personal approval is outstanding, and says so on its own
       line — an inline state, not a band. The counterparty's own send is
       greyed with the same sentence, because the server refuses the link. */
    let saHold=null; try{ saHold=signApprovalHoldsLinks(c); }catch(_){ saHold=null; }
    /* A FILE THEY SIGN (26 Sep 2026): the route is who signs, and nothing
       more — nobody's turn comes in HaTi, no link goes out, nobody is told it
       is their turn. Our signatory is told to expect the document when it is
       handed over. */
    const theySign=!!(typeof signRouteOf==='function'&&signRouteOf(c)==='outside');
    const orgOf=s=>{ if(!manyParties) return '';
      try{ const p=partyOfSigner(c,s); return p&&p.name?p.name:''; }catch(_){ return ''; } };
    const node=(state,label)=>`<span class="h-7 w-7 grid place-items-center rounded-full text-[11px] font-700 z-10 shrink-0 border-2 ${
      state==='done'?'bg-brand-600 border-brand-600 text-white':
      state==='cur'?'bg-white border-gold-500 text-gold-600 ring-4 ring-gold-100':
      'bg-white border-slate-300 text-ink/40'}">${label}</span>`;
    html+=`<div class="${bare?'':'rounded-xl border border-line bg-white p-3 mb-2'}">
      ${bare?'':`<div class="flex items-center gap-2 mb-2"><span class="text-[11px] font-600 text-ink">${i18t('ap_signature_progress')}</span>
        <span class="text-[9.5px] font-mono px-1.5 py-0.5 rounded-full ${signedCount===sorted.length?'bg-brand-50 text-brand-600':'bg-gold-50 text-gold-700'}">${i18t('ap_n_signed',{done:signedCount,total:sorted.length})}</span>
        ${canEdit()&&c.status!=='Signed'?`<button id="sp-edit" type="button" class="ui-link" style="margin-left:auto">edit route</button>`:''}</div>`}
      <div class="relative">
        ${sorted.map((s,i)=>{
          /* ---- WHOSE TURN IS A STEP, NOT A ROW (22 Sep 2026) ----
             On a route where no row names a step each step holds one row, so
             signRowOpen answers exactly `ns && ns.id===s.id` and this card is
             byte-identical. Where two parties share a step BOTH read as their
             turn, which is what signing in any order means. */
          const isCur=(typeof signRowOpen==='function')?signRowOpen(c,s):(ns&&ns.id===s.id);
          const st=s.signed?'done':(isCur&&!theySign)?'cur':'wait';
          const stepHead=stepLead(s,i);
          /* Behind an unsigned INTERNAL step, by ORDER — not the old blanket
             "any internal unsigned", which mislabelled a counterparty-FIRST
             route as gated when it was simply never sent. */
          const gated=!s.signed&&s.party==='counterparty'
            &&sorted.some(x=>x.party==='internal'&&!x.signed
              &&((typeof signStepOf==='function')
                ? signStepOf(x)<signStepOf(s) : (x.order||0)<(s.order||0)));
          /* The journey of THEIR link, not the route's opinion of whose turn
             it is: not sent → sent → opened → signed. "SIGNING NOW" only
             appears once the contract is genuinely in front of them. */
          const ls=signerLinkState(c,s);
          /* ---- AN INTERNAL ROW SAYS THE SAME THING ABOUT ITSELF ----
             Their turn email was fire-and-forget: nothing recorded, nothing
             shown, so this row read "their turn now" whether they had been
             written to, written to unsuccessfully, or never written to at all.
             It now answers the internal version of the counterparty row's own
             question, and offers the same deliberate resend beside it. */
          const nst=(s.party!=='counterparty') ? signerNoticeState(c,s) : 'link';
          const notice=mine=>({
            notified:`${ord(mine.order)} · their turn now — told by email`,
            'notify-failed':`${ord(mine.order)} · their turn now — the email did not go, resend it below`,
            'no-address':`${ord(mine.order)} · their turn now — no email address on file, so they cannot be told`,
            untold:`${ord(mine.order)} · their turn now — not told yet`,
          })[nst]||null;
          const meta=s.signed
            ? `${ord(s.order)} · ${s.at?fmtDT(s.at):''}${s.signature&&s.signature.form?' · '+s.signature.form+' signature':''}`
            : theySign ? `${ord(s.order)} · ${i18t(s.party==='counterparty'?'ho_row_theirs':'ho_row_ours')}`
            : saHold ? `${ord(s.order)} · ${i18t('sa_route_waits')}`
            : notice(s) ? notice(s)
            : ls==='opened' ? `${ord(s.order)} · contract opened — awaiting their signature`
            : ls==='sent' ? `${ord(s.order)} · contract sent — not opened yet`
            : ls==='failed' ? `${ord(s.order)} · the automatic email did not go — resend it below`
            : ls==='held' ? `${ord(s.order)} · link ready — it goes out when their turn arrives`
            : gated ? `${ord(s.order)} · link opens once internal signing is complete`
            : ls==='unsent' ? (isCur
                ? `${ord(s.order)} · not sent yet — send the contract to start their turn`
                : `${ord(s.order)} · waiting — link not issued yet`)
            : isCur ? `${ord(s.order)} · their turn now`
            : `${ord(s.order)} · waiting`;
          const tag=(cls,txt)=>`<span class="text-[8.5px] font-mono px-1 py-px rounded ${cls}">${txt}</span>`;
          /* WHILE THE APPROVAL HOLDS, NOBODY'S TURN HAS COME: no "signing now",
             no "not sent yet", no stale email verdict — the meta line says the
             row waits, and that is the whole of it. */
          const badge=s.signed ? ''
            : (saHold||theySign) ? ''
            : nst==='notified' ? tag('bg-gold-100 text-gold-700','TOLD')
            : nst==='notify-failed' ? tag('bg-rose-50 text-rose-600','EMAIL FAILED')
            : nst==='no-address' ? tag('bg-rose-50 text-rose-600','NO ADDRESS')
            : nst==='untold' ? tag('bg-gold-100 text-gold-700','SIGNING NOW')
            : ls==='opened' ? tag('bg-gold-100 text-gold-700','OPENED')
            : ls==='sent' ? tag('bg-gold-100 text-gold-700','SENT')
            : ls==='failed' ? tag('bg-rose-50 text-rose-600','SEND FAILED')
            : ls==='held' ? tag('bg-slate-100 text-ink/50','LINK READY')
            : (ls==='unsent'&&isCur&&!gated) ? tag('bg-rose-50 text-rose-600','NOT SENT YET')
            : (ls==='unknown'||ls==='internal')&&isCur ? tag('bg-gold-100 text-gold-700','SIGNING NOW') : '';
          return stepHead+`<div class="flex gap-3 ${i<sorted.length-1?'pb-3':''} relative">
            ${i<sorted.length-1?`<span class="absolute left-[13px] top-7 bottom-0 w-0.5 ${s.signed?'bg-brand-500':'bg-slate-200'}"></span>`:''}
            ${node(st, s.signed?'✓':String(s.order))}
            <div class="min-w-0 pt-0.5">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[12.5px] font-600 ${s.signed?'text-ink':'text-ink/70'}">${(s.name||'').replace(/</g,'&lt;')}</span>
                ${s.role?`<span class="text-[10.5px] text-ink/50">· ${s.role.replace(/</g,'&lt;')}</span>`:''}
                ${orgOf(s)?`<span class="text-[10.5px] text-ink/60">· ${esc1(orgOf(s))}</span>`:''}
                <span class="text-[8.5px] font-mono px-1 py-px rounded ${s.party==='counterparty'?'bg-gold-50 text-gold-700':'bg-brand-50 text-brand-600'}">${s.party}</span>
                ${badge}
              </div>
              <div class="text-[10px] font-mono text-ink/45 mt-0.5">${meta}</div>
              ${(!s.signed&&!theySign&&s.party==='counterparty'&&(ls==='unsent'||ls==='failed')&&!gated&&canEdit())
                ? `<button data-sp-send="${String(s.id).replace(/"/g,'&quot;')}"${saHold?` disabled aria-disabled="true" title="${esc1(saHold)}"`:''} class="ui-btn ui-btn-sm mt-1${saHold?' opacity-50 cursor-not-allowed':''}">${ls==='failed'?'Resend their signing link':'Email their signing link'}</button>`
                : ''}
              ${''/* THE INTERNAL ROW'S OWN DOOR. A resend is a deliberate act
                     with a visible result, never a silent retry — so it is
                     offered on exactly the three states where pressing it does
                     something: told (say it again), the email failed, and never
                     told. Not on 'no-address', where the fix is the route or the
                     team record and the row says so. */}
              ${(!s.signed&&!theySign&&s.party!=='counterparty'&&canEdit()&&!saHold
                 &&['notified','notify-failed','untold'].includes(nst))
                ? `<button data-sp-notify="${String(s.id).replace(/"/g,'&quot;')}" class="ui-btn ui-btn-sm mt-1">${
                    nst==='untold'?'Tell them it is their turn'
                    : nst==='notify-failed'?'Try the email again'
                    : 'Remind them'}</button>`
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
      why=await window.promptDialog({ get title(){ return i18t('ap_reject_step_q'); },
        message:'The contract goes back to its owner. Say what has to change and they can revise it and send it back.',
        get label(){ return i18t('ap_why_refusing'); }, placeholder:'e.g. the liability cap is below our floor', optional:true });
      if(why===null) return;                 // dismissed — nothing was refused
    }
    rejectApprovalStep(c, String(why||'').trim()||null);
  });
  document.getElementById('ap-resubmit')?.addEventListener('click',async()=>{
    let note='';
    if(typeof window.promptDialog==='function'){
      note=await window.promptDialog({ get title(){ return i18t('ap_send_back_q'); },
        message:'This puts the contract back in front of the approver who refused it, with your note.',
        get label(){ return i18t('ap_what_changed'); }, placeholder:`e.g. cap raised to ${jxCurrency()} 10M as asked`, optional:true });
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
    if(out&&out.heldForApproval){
      toast(out.heldForApproval,'warn');
    } else if(out&&out.links){
      const first=out.links.find(x=>!x.heldForTurn);
      toast(first&&first.emailSent
        ? `${first.signer.name} has been emailed their signing link`
        : first
        ? `Signing link ready for ${first.signer.name}${first.emailConfigured===false?' — email is not configured, copy it from the Shares panel':''}`
        : 'Signing links issued — each is released when its turn arrives');
    } else if(out&&out.missingEmails){
      toast(`The signing route has no email address for ${out.missingEmails.map(s=>s.name).join(', ')} — add it via edit route`,'err');
    } else {
      toast(i18t('ap_links_failed'),'err');
    }
    try{
      if(typeof renderSignButton==='function') renderSignButton(c);
      if(typeof renderAuditSection==='function') renderAuditSection(c);
      if(typeof renderSharesSection==='function') renderSharesSection(c);
    }catch(_){}
  }));
  /* ---- AND THE INTERNAL ROW'S "TELL THEM" ----
     It names a ROW and nothing else: the address is the server's to resolve
     from the member record and the stored route, which is what stopped that
     route being an open relay. `force` is what makes this a resend rather than
     a duplicate of the automatic one-per-turn send, and the toast reports what
     actually happened — including the two honest failures (the provider refused
     it, or email is not configured here at all). */
  document.querySelectorAll('[data-sp-notify]').forEach(b=>b.addEventListener('click',async()=>{
    const id=b.getAttribute('data-sp-notify');
    const was=b.textContent; b.disabled=true; b.textContent='Sending…';
    try{
      const r=await api('contracts/'+c.id+'/notify-signer','POST',{ signerId:id, force:true });
      const who=(r&&r.signer)||'They';
      toast(r&&r.ok ? `${who} has been emailed — the link opens this contract on its Signing tab`
        : `${who} could not be emailed${r&&r.emailConfigured===false
            ? ' — email is not configured on this server (Team & Settings → Email)'
            : (r&&r.detail?' — '+r.detail:'')}`, r&&r.ok?undefined:'err');
    }catch(e){ toast((e&&e.message)||'The notice could not be sent','err'); }
    b.disabled=false; b.textContent=was;
    try{ if(typeof renderSharesSection==='function') await renderSharesSection(c); }catch(_){}
    try{ if(typeof renderSignButton==='function') renderSignButton(c); }catch(_){}
  }));
}

/* THE ENGAGEMENT CARD (loadEngagement) IS GONE.

   It drew /api/contracts/:id/engagement as a list of "Opened" rows headed by
   a count. That endpoint's rows are written by the share GET the counterparty's
   page POLLS — every 10s while they read, every 45s while they do not — so the
   count measured how long a tab was left open and was read as how often the
   contract was studied. See the note where the card used to sit, in
   js/views/contract.js.

   Nothing server-side changed: every open is still logged with its time and IP,
   and the endpoint still answers. The Shares panel remains the honest answer to
   "have they seen it" — it reads shares.first_opened_at, which is stamped once
   on the first real open and never re-counted. */

Object.assign(window,{signStepOf,signSteps,signStepIndex,signStepDone,signStepOpen,signRowOpen,signStepNow,signOpenRows,overseerCfg,saveOverseerCfg,overseerEnforced,overseerFor,OVERSEER_STEP_ID,approvalStamp,approvalDrift,resubmitApproval,approvalRules,saveApprovalRules,contractForeignLaw,contractHasDeviation,ruleMatches,approverLabelOf,userCanApprove,buildApprovalChain,approvalState,approveContract,rejectApprovalStep,signerPlan,signingRouteOpen,signingRouteMissing,signingLocked,signingRestart,openSigningLockedNotice,nextSigner,allSigned,internalAllSigned,signersRemaining,signerLinkState,signerNotices,signerNoticeState,distributionRecipients,executionParties,bothPartiesSigned,openSignerPlanEditor,saveSignerPlan,approvalPanelHtml,approvalChainHtml,APPROVAL_CLEAR_SAYS,approvalClearRows,approvalClearHtml,signerRouteHtml,wireApprovalPanel,
  signApprovalLegacyOn,signApprovalNeeds,signApprovalStateOf,saStepName,saMoney,saDriftWords,SA_CHAIN_STATUS,saChainStep,
  signApprovalDecidable,signApprovalWaitsOn,SA_PAPER_KEYS,signApprovalPaperHolds,signApprovalRequestable,signApprovalRound,
  saFmtDay,saWhen,saShowsLine,signApprovalNotify,saNoticeOf,saDeliveryWords,signApprovalRequest,signApprovalDecide,
  signApprovalWithdraw,signApprovalRemind,saRepaint,signApprovalRows,signApprovalBlockLabel,signApprovalSettledRows,
  signApprovalHoldsLinks,openSignApprovalDialog,openSignApprovalRefuse,signApprovalAskCardHtml,wireSignApprovalCard});

/* ============================================================
   HOW MUCH MAY THIS PERSON SIGN FOR
   ============================================================
   A per-member signing limit, in the workspace's own currency. It is new
   machinery and it arrives the way every enforcement in this product arrives:
   WARN BEFORE ENFORCE. The cap is recorded, printed and read back in plain
   English from the day it ships, and it stops nothing at all until an admin
   turns on a workspace switch that is OFF by default. A rule that started
   refusing signatures the morning after a deploy would be an outage, not a
   control.

   THREE STATES, ONE READING, and the third is what makes the other two mean
   something. `signCap` on the member record is:
     · null / absent  — NOT ANSWERED. Nobody has said anything about this
       person. Blocks nothing, and is the state every existing member is in
       the moment this ships.
     · 'none'         — ANSWERED, and the answer is no limit. The string is
       deliberate and it is this codebase's own idiom: TEMPLATES.ND carries
       valueType:'none' for exactly the same reason — "the question was asked
       and the answer is nothing" is a different fact from "nobody asked".
     · a number       — the ceiling, in the workspace currency.
   Collapsing the first two (the way folderAccess collapses "no entry" into
   "every stream") was considered and refused: an absent folder entry is a
   GRANT and reads the same to everybody, while an absent cap is somebody
   nobody has thought about, and the completeness chip exists to say so.

   AN ADMIN IS NEVER CAPPED. Not because an admin's signature is worth more,
   but because the switch and the caps are both an admin's to set: a workspace
   whose only admin had capped themselves below their own paper would have
   locked its own front door, and the way back in would be the very screen the
   cap is refusing them. Said out loud rather than left to be discovered. */
function signCapCfg(){
  const s=(state.settings&&state.settings.signCap)||{};
  return { on: !!s.on };
}
function saveSignCapCfg(cfg){
  state.settings=state.settings||{};
  state.settings.signCap={ on: !!(cfg&&cfg.on) };
  if(typeof saveSettings==='function') saveSettings();
  return signCapCfg();
}
const signCapEnforced = () => signCapCfg().on;
/* THE ONE READING. `answered` is whether anybody has decided; `limit` is null
   when the decision was "no limit". Everything — the drawer, the roster row,
   the ladder, the completeness chip, the blocker and the server's own copy —
   asks this and never the raw field. */
function signCapOf(u){
  const raw=u&&u.signCap;
  if(raw===undefined||raw===null||raw==='') return { answered:false, limit:null };
  if(raw==='none') return { answered:true, limit:null };
  const n=Number(raw);
  if(!Number.isFinite(n)||n<0) return { answered:false, limit:null };
  return { answered:true, limit:n };
}
/* What the roster row and the ladder print. One sentence, three shapes, and
   the unanswered one says so rather than reading as "no limit". */
function signCapText(u){
  const cap=signCapOf(u);
  if(u&&u.role==='viewer') return i18t('sc_viewer_never');
  if(!cap.answered) return i18t('sc_not_set');
  if(cap.limit==null) return i18t('sc_no_limit');
  return i18t('sc_up_to',{amount:(typeof fmtMoneyShort==='function')?fmtMoneyShort(cap.limit):String(cap.limit)});
}
/* The live sentence at the foot of the drawer's Signing section: what was just
   configured, read back in the words the rest of the product uses. */
function signCapSentence(u, cap, enforced){
  const who=(u&&u.name)||i18t('sc_this_person');
  if(u&&u.role==='admin') return i18t('sc_says_admin',{who});
  if(u&&u.role==='viewer') return i18t('sc_says_viewer',{who});
  if(!cap.answered) return i18t('sc_says_unset',{who});
  if(cap.limit==null) return i18t('sc_says_none',{who});
  const amount=(typeof fmtMoneyShort==='function')?fmtMoneyShort(cap.limit):String(cap.limit);
  return enforced ? i18t('sc_says_limit_on',{who,amount}) : i18t('sc_says_limit_off',{who,amount});
}
/* THE BLOCKER, and it joins the ONE list of signing blockers rather than
   becoming a second gate somewhere else — the same list the button reads to
   disable itself and the refusal reads to say why. Returns null wherever the
   rule does not apply, which is every case until an admin turns it on. */
function signCapBlocker(c, u){
  if(!c) return null;
  if(!signCapEnforced()) return null;
  const me=u||((typeof currentUser==='function')?currentUser():null);
  if(!me || me.role==='admin') return null;
  const cap=signCapOf(me);
  if(!cap.answered || cap.limit==null) return null;
  /* Money only where money passes. An NDA carries none and isMonetary is the
     one answer to that question in this product. */
  if(typeof isMonetary==='function' && !isMonetary(c)) return null;
  /* ---- COMPARE LIKE WITH LIKE (W2-1) ----
     A signing limit is written in the workspace currency. Measuring a USD
     contract's raw number against a KES ceiling is a silent lie in whichever
     direction the rates happen to run, so the contract is CONVERTED first —
     and where the currency has no rate on file the comparison cannot be made
     at all, which is a refusal in words rather than a guess: on a signature,
     erring toward asking a human is the only safe direction. */
  const money=n=>(typeof fmtMoneyShort==='function')?fmtMoneyShort(n):String(n);
  const h=(typeof fxHome==='function')?fxHome(c):{v:Number(c.value||0),missing:false,code:''};
  if(h.missing) return { key:'signcap',
    label:i18t('sc_block_norate',{code:h.code}), short:i18t('sc_block_norate_short',{code:h.code}) };
  const v=h.v;
  if(!(v>cap.limit)) return null;
  return { key:'signcap',
    label:i18t(h.converted?'sc_block_fx':'sc_block',
      {amount:money(v),cap:money(cap.limit),code:h.code,raw:`${h.code} ${Number(c.value||0).toLocaleString()}`}),
    short:i18t('sc_block_short',{cap:money(cap.limit)}) };
}
/* WHO CAN SIGN WHAT TODAY — a read-only ladder, ordered by how much authority
   each person holds, drawn beside the approval rules because it answers the
   other half of the same question. */
function signCapLadder(){
  const users=(typeof getUsers==='function'?getUsers():[])||[];
  /* FOUR BANDS AND A SORT INSIDE ONE OF THEM. A single number cannot express
     this: "no limit" outranks any figure, and an admin outranks even that, so
     comparing a ceiling against a sentinel is how the largest cap ends up above
     the person who has none. */
  const band=u=>{
    if(u.role==='admin') return 0;                  // never capped
    if(u.role==='viewer') return 4;                 // never signs
    const cap=signCapOf(u);
    if(!cap.answered) return 3;                     // nobody has said
    return cap.limit==null ? 1 : 2;                 // no limit, then a ceiling
  };
  const within=u=>{ const cap=signCapOf(u); return cap.limit==null?0:-cap.limit; };
  return users.slice().sort((a,b)=>band(a)-band(b)||within(a)-within(b)
      ||String(a.name||'').localeCompare(String(b.name||'')))
    .map(u=>({ id:u.id, name:u.name||u.email, role:u.role, text:signCapText(u),
      answered:signCapOf(u).answered, mayEverSign:u.role!=='viewer' }));
}
/* Everyone who may ever sign has been thought about. Read by the go-live
   checklist and by the People tab's completeness chip. */
function signCapUnanswered(){
  return ((typeof getUsers==='function'?getUsers():[])||[])
    .filter(u=>u.role!=='viewer'&&u.role!=='admin'&&!signCapOf(u).answered);
}
Object.assign(window,{signCapCfg,saveSignCapCfg,signCapEnforced,signCapOf,signCapText,
  signCapSentence,signCapBlocker,signCapLadder,signCapUnanswered});

/* ============================================================
   WHICH FOLDERS MAY THIS PERSON SIGN IN
   ============================================================
   A SEPARATE list from folder ACCESS, deliberately and on the owner's
   instruction: seeing a stream and being allowed to put your name at the
   bottom of its paper are different rights, and overloading one map with two
   meanings is how a reader who was only ever meant to look ends up able to
   execute. Its own key, its own route, its own guard.

   ABSENT MEANS EVERY FOLDER THEY CAN ALREADY SEE — this list only ever
   NARROWS, never widens: somebody restricted to Procurement on folderAccess
   cannot sign a Marketing contract by having Marketing on this list, because
   the contract is not theirs to open in the first place. And like every
   enforcement in this product it arrives behind a switch that is OFF by
   default, so nothing locks on deploy. */
function signFolderCfg(){
  const s = (state.settings && state.settings.signFolders) || {};
  return { on: !!s.on };
}
function saveSignFolderCfg(cfg){
  state.settings = state.settings || {};
  const cur = state.settings.signFolders || {};
  state.settings.signFolders = { ...cur, on: !!(cfg && cfg.on) };
  if (typeof saveSettings === 'function') saveSettings();
  return signFolderCfg();
}
const signFolderEnforced = () => signFolderCfg().on;
/* THE ONE READING. '*' means "not narrowed"; an array is the narrowing. An
   empty array is never stored — the two stores read it differently, which is
   the lesson folderAccess already taught this codebase. */
function signFolderAccess(u){
  const who = u || ((typeof currentUser === 'function') ? currentUser() : null);
  if (!who) return '*';
  if (who.role === 'admin') return '*';
  const map = ((state.settings || {}).signFolders || {}).by || {};
  const v = map[who.id];
  if (v == null || v === '*' || (Array.isArray(v) && !v.length)) return '*';
  return v;
}
const maySignFolder = (fid, u) => { const a = signFolderAccess(u); return a === '*' || a.indexOf(fid) >= 0; };
/* THE WRITER, shaped exactly like settingsWriteFolderAccess and for the same
   reason: one place decides the payload, and an empty pick is refused rather
   than sent. */
async function saveSignFolders(userId, folders){
  if (Array.isArray(folders) && !folders.length) throw new Error(i18t('set_pick_one_stream'));
  state.settings = state.settings || {};
  const cfg = state.settings.signFolders || {};
  cfg.by = cfg.by || {};
  if (folders == null) delete cfg.by[userId]; else cfg.by[userId] = folders;
  state.settings.signFolders = cfg;
  if (window.API_MODE && window.API_MODE()) await api('settings/sign-folders', 'PUT', { userId, folders });
  else await saveSettings();
}
/* The blocker, joining the ONE list of signing blockers beside the cap. */
function signFolderBlocker(c, u){
  if (!c || !signFolderEnforced()) return null;
  const who = u || ((typeof currentUser === 'function') ? currentUser() : null);
  if (!who || who.role === 'admin') return null;
  if (maySignFolder(c.folder, who)) return null;
  const name = (typeof FOLDERS === 'object' && FOLDERS[c.folder] && FOLDERS[c.folder].name) || c.folder || '';
  return { key: 'signfolder',
    label: i18t('sf_block', { folder: name }),
    short: i18t('sf_block_short') };
}
/* What the drawer and the ladder print. */
function signFolderText(u){
  if (u && u.role === 'admin') return i18t('sf_every');
  const a = signFolderAccess(u);
  if (a === '*') return i18t('sf_every_they_see');
  return i18t('sf_only_n', { n: a.length, total: Object.keys(typeof FOLDERS === 'object' ? FOLDERS : {}).length });
}
Object.assign(window,{signFolderCfg,saveSignFolderCfg,signFolderEnforced,signFolderAccess,
  maySignFolder,saveSignFolders,signFolderBlocker,signFolderText});
