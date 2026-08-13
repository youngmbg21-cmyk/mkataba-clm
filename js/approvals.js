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
  if(!st.next){ toast(i18t('ap_chain_complete')); return; }
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
  toast(i18t('ap_step_rejected'));
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
  if(!back.length){ toast(i18t('ap_nothing_resubmit')); return false; }
  if(!canEdit()){ toast(i18t('ap_viewers_no_resubmit'),'err'); return false; }
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
  c.signerPlan = signerPlan(c).map((s, i) => ({
    ...s, id: 'sg_' + Math.random().toString(36).slice(2, 7), order: i + 1,
    signed: false, at: null, by: null, signature: null }));
  c.signatures = [];
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
  openModal(`<div class="p-6" style="max-width:520px">
    <h3 class="font-serif font-600 text-lg text-ink mb-1">${i18t('ap_signing_route')}</h3>
    <div style="border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-radius:8px;padding:11px 13px;margin:10px 0 12px">
      <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--st-amber-fg);margin-bottom:5px">${icon('alert','w-3.5 h-3.5')} ${i18t('ap_route_locked')}</div>
      <p style="margin:0;font-size:11.5px;line-height:1.6;color:var(--st-amber-fg)">${
        esc(i18tn('ap_route_locked_why',Math.max(1,done.length||marks),{ who }))}</p>
    </div>
    <p class="text-xs text-ink/65 mb-1" style="line-height:1.6">${esc(i18t('ap_route_locked_restart'))}</p>
    <ul class="text-xs text-ink/60 mb-4" style="line-height:1.6;padding-left:18px;margin-top:4px;list-style:disc">
      <li>${esc(i18tn('ap_restart_loses_marks',Math.max(1,marks||done.length),{n:Math.max(1,marks||done.length)}))}</li>
      <li>${esc(i18t('ap_restart_kills_links'))}</li>
      <li>${esc(i18t('ap_restart_keeps_wording'))}</li>
    </ul>
    <div class="flex justify-end gap-2">
      ${admin?`<button id="sp-restart" class="rounded-lg border px-4 py-2 text-sm font-600" style="color:var(--st-ruby-dot);border-color:color-mix(in srgb,var(--st-ruby-dot) 40%,transparent)">${i18t('ap_start_signing_again')}</button>`
        :`<span class="text-[11px] text-ink/50 self-center">${esc(i18t('ap_restart_admin_only'))}</span>`}
      <button id="sp-shut" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${i18t('act_close')}</button>
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
function openSignerPlanEditor(c, opts){
  const back = opts && typeof opts.onDone === 'function' ? opts.onDone : null;
  /* ---- SHUT ONCE ANYBODY HAS SIGNED ----
     See signingLocked. The editor is not disabled field by field — it is not
     drawn at all, and what stands in its place says who has signed and offers
     the one way forward. A greyed-out form invites the reader to work out which
     control is the one that still does something. */
  if(signingLocked(c)){ openSigningLockedNotice(c, opts); return; }
  const plan=(c.signerPlan||[]).slice();
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
  const IN='rounded-lg border border-inputln bg-white px-2 py-1.5 text-[12px]';
  const memberOpts=s=>`<option value="">${i18t('ap_pick_member')}</option>`+members.map(u=>`<option value="${u.id}" ${s.memberId===u.id?'selected':''}>${(u.name||u.email).replace(/</g,'&lt;')}</option>`).join('');
  const row=(s,i)=>`<div class="rounded-xl border border-line bg-slate-50/60 p-2.5 mb-2" data-sp-row="${i}">
      <div class="flex items-center gap-2 mb-1.5">
        <span class="h-5 w-5 grid place-items-center rounded-full bg-brand-600 text-white text-[10px] font-700">${i+1}</span>
        <select data-sp-party="${i}" class="${IN}">
          <option value="internal" ${s.party==='internal'?'selected':''}>${i18t('ap_internal')}</option>
          <option value="counterparty" ${s.party==='counterparty'?'selected':''}>${i18t('ap_counterparty')}</option></select>
        <span data-sp-member-wrap="${i}" class="${s.party==='counterparty'?'hidden':''}">
          <select data-sp-member="${i}" class="${IN}">${memberOpts(s)}</select></span>
        <div class="ml-auto flex items-center gap-1">
          <button data-sp-up="${i}" ${i===0?'disabled':''} class="text-ink/40 hover:text-ink/70 text-[12px] disabled:opacity-30">↑</button>
          <button data-sp-down="${i}" class="text-ink/40 hover:text-ink/70 text-[12px]">↓</button>
          <button data-sp-del="${i}" class="text-rose-500 hover:text-rose-700 text-[11px] font-600 ml-1">✕</button></div>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <input data-sp-name="${i}" list="sp-dir-names" value="${(s.name||'').replace(/"/g,'&quot;')}" placeholder="${i18t('ap_name')}" class="${IN}"/>
        <input data-sp-role="${i}" value="${(s.role||'').replace(/"/g,'&quot;')}" placeholder="${i18t('ap_title_eg')}" class="${IN}"/>
        <input data-sp-email="${i}" value="${(s.email||'').replace(/"/g,'&quot;')}" placeholder="${i18t('ap_email')}" class="${IN}"/>
      </div></div>`;
  openModal(`<div class="p-6" style="max-width:560px">
    <h3 class="font-serif font-600 text-lg text-ink mb-1">${i18t('ap_signing_route')}</h3>
    <p class="text-xs text-ink/60 mb-3">${i18t('ap_signers_execute')} <b>in order</b>. Internal members sign in-app (bind each to a team member); counterparty signers each get their own secure link, which stays dormant until every internal signature is in. Each signer freely chooses how they sign (draw / type / upload). The seal is applied when the last signature lands.</p>
    ${dirList}
    <div id="sp-rows">${plan.map(row).join('')||`<div class="text-[12px] text-ink/50 mb-2">${i18t('ap_no_signers')}</div>`}</div>
    <button id="sp-add" class="text-[12px] font-600 text-brand-600 hover:text-brand-800 mb-2">${i18t('ap_add_signer')}</button>
    ${''/* ---- BOTH SIDES, COUNTED WHILE YOU TYPE ----
           The rule is that a route names somebody on each side, and a rule a
           form only mentions when it refuses is a rule the form is keeping to
           itself. This says where the route stands after every keystroke, so
           the refusal below is a confirmation rather than a surprise. */}
    <div id="sp-tally" class="mb-4 text-[11.5px] leading-relaxed"></div>
    ${people.length?`<p class="text-[11px] text-ink/45 mb-3">${i18t('ap_tip_autofill')}</p>`:''}
    <div class="flex justify-end gap-2"><button id="sp-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${i18t('act_cancel')}</button>
      <button id="sp-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${i18t('ap_save_route')}</button></div>
  </div>`);
  /* Named rows only, on both counts: a blank row is discarded on save (see
     `if(!s.name) return` below), so counting it here would promise a route the
     save is about to refuse. */
  const tally=()=>{
    const el=document.getElementById('sp-tally'); if(!el) return;
    const named=p=>plan.filter(s=>s && String(s.name||'').trim() && (p==='counterparty'
      ? s.party==='counterparty' : s.party!=='counterparty')).length;
    const ours=named('internal'), theirs=named('counterparty');
    const ok=ours>0 && theirs>0;
    const line=(n,label)=>`<span style="color:${n?'var(--st-green-fg)':'var(--st-amber-fg)'};font-weight:600">${n?'✓':'○'} ${esc(label)}</span>`;
    el.innerHTML=`${line(ours,i18tn('ap_our_side_n',ours,{n:ours}))} &nbsp;·&nbsp; ${
      line(theirs,i18tn('ap_their_side_n',theirs,{n:theirs}))}`
      + (ok?'':`<div style="color:var(--color-neutral-600);margin-top:3px">${esc(i18t('ap_both_sides_needed'))}</div>`);
  };
  const rerow=()=>{ document.getElementById('sp-rows').innerHTML=plan.map(row).join('')||''; wire(); tally(); };
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
  /* The tally follows typing, not just structural changes — a name typed into
     an existing row is the commonest way a side stops being empty. */
  document.getElementById('sp-rows')?.addEventListener('input',()=>{ syncPlanFromDom(); tally(); });
  wire(); tally();
  document.getElementById('sp-cancel').addEventListener('click',()=>{ closeModal(); if(back) back(); });
  document.getElementById('sp-save').addEventListener('click',()=>{
    syncPlanFromDom();
    const out=[]; plan.forEach(s=>{ if(!s.name) return;
      const prior=(c.signerPlan||[]).find(p=>p.id===s.id);
      out.push({ id:s.id||'sg_'+Math.random().toString(36).slice(2,7), party:s.party, name:s.name, role:s.role||'',
        email:s.email, memberId:s.party==='internal'?(s.memberId||''):'', order:out.length+1,
        signed:prior?!!prior.signed:false, at:prior?prior.at:null, by:prior?prior.by:null, signature:prior?prior.signature:null }); });
    /* ---- A ROUTE WITH ONE SIDE ON IT IS NOT A ROUTE ----
       Refused here as well as counted above, because the tally is a reading of
       the form and this is a reading of what is about to be SAVED — blank rows
       have been dropped by now, and a row whose name was deleted counts in
       neither place. It names the missing side rather than restating the rule:
       "one more thing to do" is not an instruction. */
    const ourN=out.filter(s=>s.party!=='counterparty').length;
    const theirN=out.filter(s=>s.party==='counterparty').length;
    if(!ourN || !theirN){
      toast(i18t(!ourN&&!theirN?'ap_need_both_sides'
        :!ourN?'ap_need_our_side':'ap_need_their_side',
        { them:c.counterparty||i18t('ct_a_counterparty') }),'err');
      return;
    }
    c.signerPlan=out; logAudit(c,'Signing route',`Set ${out.length} signer(s) in order`); persist(c); closeModal();
    if(back) back(); else renderWorkspace();
    toast(i18t('ap_route_saved'));
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
function approvalChainHtml(c, opts){
  const bare=!!(opts&&opts.bare);
  const st=approvalState(c);
  if(!st.required) return '';
  const stepChip=s=>s.status==='approved'?'text-brand-600':s.status==='rejected'?'text-rose-600':s.status==='stale'?'text-gold-700':'text-ink/50';
  const esc1=s=>String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  const stepRight=s=>s.status==='approved'?`✓ ${esc1(s.by)}`
    :s.status==='rejected'?`✕ refused by ${esc1(s.by)}`
    :s.status==='stale'?`↻ re-approval needed`
    :'needs '+approverLabelOf(s.approver);
  let html='';
  {
    /* THE REFUSAL, AND THE WAY OUT OF IT — both on the panel the owner reads.
       A rejected step used to be erased before it could be drawn (see
       buildApprovalChain); now that it survives, the owner is told what was
       refused, by whom and why, and given the one control that moves it on. */
    const blocked=(st.rejected||[]).concat(st.stale||[]);
    const owner=canEdit()&&c.status!=='Signed'&&blocked.length;
    html+=`<div class="${bare?'':'rounded-xl border '+(st.rejected&&st.rejected.length?'border-rose-200':'border-line')+' bg-white p-3 mb-2'}">
      ${bare?'':`<div class="text-[11px] font-600 text-ink mb-1.5">${i18t('ap_approval_chain')}</div>`}
      ${st.chain.map((s,i)=>`<div class="flex items-center gap-2 text-[11.5px] py-0.5">
        <span class="h-4 w-4 grid place-items-center rounded-full text-[8px] font-700 ${s.status==='approved'?'bg-brand-600 text-white':s.status==='rejected'?'bg-rose-500 text-white':s.status==='stale'?'bg-gold-500 text-white':'bg-slate-200 text-ink/60'}">${i+1}</span>
        <span class="${stepChip(s)}">${esc1(s.name)}</span>
        <span class="ml-auto text-[10px] text-ink/50">${stepRight(s)}</span>
      </div>`).join('')}
      ${(st.rejected||[]).map(s=>`<div class="mt-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700 leading-relaxed">
        <b>${esc1(s.by)||'An approver'} refused “${esc1(s.name)}”.</b>${s.comment?` “${esc1(s.comment)}”`:''}
        <span class="block text-rose-700/80 mt-0.5">${i18t('ap_nothing_until_settled')}</span>
      </div>`).join('')}
      ${(st.stale||[]).map(s=>`<div class="mt-1.5 rounded-lg border border-gold-500/30 bg-gold-500/10 px-2.5 py-2 text-[11px] text-gold-700 leading-relaxed">
        <b>“${esc1(s.name)}” needs approving again.</b> ${esc1(s.by)||'It'} approved it, and since then ${esc1((s.drift||[]).join(' and '))}.
        <span class="block text-gold-700/80 mt-0.5">${i18t('ap_signoff_covers')}</span>
      </div>`).join('')}
      ${st.next&&st.canApproveNext?`<div class="flex gap-2 mt-2">
        <button id="ap-approve" class="rounded-lg bg-brand-900 text-white px-3 py-1.5 text-[11px] font-600 hover:bg-brand-800">${st.next.status==='pending'?'Approve':'Approve again'} “${esc1(st.next.name)}”</button>
        <button id="ap-reject" class="rounded-lg border border-rose-200 text-rose-600 px-3 py-1.5 text-[11px] font-600 hover:bg-rose-50">${i18t('ve_reject')}</button></div>`
        :st.next?`<div class="mt-1.5 text-[10px] text-ink/55">${i18t('ap_waiting_on',{who:approverLabelOf(st.next.approver)})}</div>`:''}
      ${owner?`<button id="ap-resubmit" class="mt-2 w-full rounded-lg border border-brand-200 text-brand-700 px-3 py-1.5 text-[11px] font-600 hover:bg-brand-50">${i18t('ap_revise_send_back')}</button>`:''}
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
    const node=(state,label)=>`<span class="h-7 w-7 grid place-items-center rounded-full text-[11px] font-700 z-10 shrink-0 border-2 ${
      state==='done'?'bg-brand-600 border-brand-600 text-white':
      state==='cur'?'bg-white border-gold-500 text-gold-600 ring-4 ring-gold-100':
      'bg-white border-slate-300 text-ink/40'}">${label}</span>`;
    html+=`<div class="${bare?'':'rounded-xl border border-line bg-white p-3 mb-2'}">
      ${bare?'':`<div class="flex items-center gap-2 mb-2"><span class="text-[11px] font-600 text-ink">${i18t('ap_signature_progress')}</span>
        <span class="text-[9.5px] font-mono px-1.5 py-0.5 rounded-full ${signedCount===sorted.length?'bg-brand-50 text-brand-600':'bg-gold-50 text-gold-700'}">${i18t('ap_n_signed',{done:signedCount,total:sorted.length})}</span>
        ${canEdit()&&c.status!=='Signed'?`<button id="sp-edit" class="ml-auto text-[10px] font-600 text-brand-600 hover:text-brand-800">edit route</button>`:''}</div>`}
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
          const badge=s.signed ? ''
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
              ${(!s.signed&&s.party==='counterparty'&&(ls==='unsent'||ls==='failed')&&!gated&&canEdit())
                ? `<button data-sp-send="${String(s.id).replace(/"/g,'&quot;')}" class="mt-1 rounded-lg border border-brand-200 text-brand-700 px-2 py-1 text-[10px] font-600 hover:bg-brand-50">${ls==='failed'?'Resend their signing link':'Email their signing link'}</button>`
                : ''}
              ${''/* THE INTERNAL ROW'S OWN DOOR. A resend is a deliberate act
                     with a visible result, never a silent retry — so it is
                     offered on exactly the three states where pressing it does
                     something: told (say it again), the email failed, and never
                     told. Not on 'no-address', where the fix is the route or the
                     team record and the row says so. */}
              ${(!s.signed&&s.party!=='counterparty'&&canEdit()
                 &&['notified','notify-failed','untold'].includes(nst))
                ? `<button data-sp-notify="${String(s.id).replace(/"/g,'&quot;')}" class="mt-1 rounded-lg border border-brand-200 text-brand-700 px-2 py-1 text-[10px] font-600 hover:bg-brand-50">${
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

Object.assign(window,{approvalStamp,approvalDrift,resubmitApproval,approvalRules,saveApprovalRules,contractForeignLaw,contractHasDeviation,ruleMatches,approverLabelOf,userCanApprove,buildApprovalChain,approvalState,approveContract,rejectApprovalStep,signerPlan,signingRouteOpen,signingRouteMissing,signingLocked,signingRestart,openSigningLockedNotice,nextSigner,allSigned,internalAllSigned,signersRemaining,signerLinkState,signerNotices,signerNoticeState,distributionRecipients,executionParties,bothPartiesSigned,openSignerPlanEditor,approvalPanelHtml,approvalChainHtml,signerRouteHtml,wireApprovalPanel});

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
  const v=Number(c.value||0);
  if(!(v>cap.limit)) return null;
  const money=n=>(typeof fmtMoneyShort==='function')?fmtMoneyShort(n):String(n);
  return { key:'signcap',
    label:i18t('sc_block',{amount:money(v),cap:money(cap.limit)}),
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
