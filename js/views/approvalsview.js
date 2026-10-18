// HaTi — extracted module. Globals are window-attached on purpose: the app is
// written against a single global scope (inline onclick handlers, cross-module
// calls); modules give file isolation for editing, not scope isolation.
/* ============================================================
   VIEW: APPROVALS & SIGNING — a sidebar door onto two lists that already
   exist (the redesign order's step 10, 20 Sep 2026; the owner-approved
   reference draws it as "Approvals & signing" under Work).

   IT READS, IT NEVER DECIDES. Every row is BORROWED:
     · hmDashSlices().myApprovals — the contracts whose approval chain is open
       and waits on this reader (mine) or was raised by them (own); the same
       reading Home's Pending approvals tile, the bell and the phone count.
     · hmMySignings(cs) — the contracts where the next signer is this member,
       with signReadiness's own "N to settle"; the same reading Home's
       decision rows quote.
     · readyToSignItems(cs) — the counterparty's ready-to-sign signal, the
       same list Home's green rows draw.
   NO SECOND WAY TO APPROVE OR SIGN. Signing is the Signing tab's Sign
   button and stays there. APPROVING MOVED ONE DOOR NEARER (4 Oct 2026, the
   process review): an approval this reader may decide carries Approve and
   Refuse here, and both press approvalDecideAsk (js/approvals.js) — the
   room's own verbs, the room's own reasons and the server's own wall, asked
   from where the ask is listed, as the phone already did. Nothing in this
   file writes: approveContract, rejectApprovalStep and signDocument are
   still not called from it (f344, f466). Opening the Signing tab stays.
   ============================================================ */
let _apTab='approvals';
const AP_TABS=['approvals','signatures'];
function apTab(){ return AP_TABS.includes(_apTab)?_apTab:AP_TABS[0]; }
function apSetTab(k){ _apTab=AP_TABS.includes(k)?k:AP_TABS[0]; }

/* ---- LATE PAST A WEEK, NOT AT THREE DAYS (SAP benchmark, owner-approved
   9 Oct 2026) ---- red is spent on the asks that are really overdue. */
const AP_LATE_DAYS=7;
function apLate(r){ return !!r && !r.done && (Number(r.idle)||0)>=AP_LATE_DAYS; }
/* ---- WHAT YOU JUST APPROVED STAYS IN ITS PLACE (the same order) ----
   Per sitting, nothing stored: the row says Approved and the panel carries
   Undo while approvalUndoable says it may. A row back on the live list
   (undone, or asked again) is the list's own again. */
const _apDone=new Map();
function apRowsShown(ap){
  const out=ap.slice();
  for(const [id,d] of [..._apDone]){
    if(out.some(r=>r.c.id===id)){ _apDone.delete(id); continue; }
    const c=(state.contracts||[]).find(x=>x.id===id);
    if(!c){ _apDone.delete(id); continue; }
    out.splice(Math.min(d.idx,out.length),0,Object.assign({},d.row,{ c, done:d }));
  }
  return out;
}
/* The idle count in the reader's own words: today / N days. */
function apWaitingText(days){
  const d=Math.max(0,Number(days)||0);
  return d===0?i18t('home_today'):i18tn('ap_pg_days',d,{n:d});
}
function apRuleText(st){
  if(!st) return '—';
  const step=st.next||(st.chain||[])[0];
  return step?(step.name||(window.approverLabelOf?approverLabelOf(step.approver):'')||'—'):'—';
}
/* ---- THE ROWS, off the readings named above ---- */
/* ---- A PERSONAL APPROVAL IS A REQUEST, AND THE ROW SAYS WHOSE (23 Sep 2026) ----
   Where the thing waiting on this reader is an approval somebody ASKED for,
   "asked by" is the person who asked and "waiting" is counted from the ask —
   both off the request's own record, never re-derived. Everything else is the
   chain's row exactly as it was. */
function apSaWaiting(c){
  const me=(typeof currentUser==='function')?currentUser():null;
  try{ return (typeof signApprovalWaitsOn==='function')?(signApprovalWaitsOn(c,me)[0]||null):null; }catch(_){ return null; }
}
/* ---- WHO ASKED, AND SINCE WHEN — OFF THE ONE ASK RECORD (4 Oct 2026) ----
   js/asks.js keeps one row per question, whatever its kind: a named
   person's request is its own row, and a rule step's question is opened by
   the server the day the step falls due. So "asked by" and "waiting" are read
   off that row for both kinds; a rule step whose question was never recorded
   (it fell due before the record existed) keeps the contract's own idle
   count, and a question the rule asks names the contract's owner as before. */
function apAskOf(c, req, next){
  try{
    if(req && typeof askById==='function') return askById(c, req.id);
    if(next && !next.sa && typeof askOpenFor==='function') return askOpenFor(c, 'rule', next.ruleId);
  }catch(_){}
  return null;
}
function apApprovalRows(){
  const D=(typeof hmDashSlices==='function')?hmDashSlices():{};
  return (D.myApprovals||[]).map(x=>{
    const sa=x.mine?apSaWaiting(x.c):null;
    const req=sa&&sa.req;
    const next=x.st&&x.st.next;
    const ask=apAskOf(x.c, req, next);
    const asked=Date.parse((ask&&ask.at)||(req&&req.askedAt)||'');
    const owner=(typeof contractOwnerName==='function')?(contractOwnerName(x.c)||''):'';
    return {
      c:x.c, mine:!!x.mine, own:!!x.own, st:x.st,
      idle:Number.isFinite(asked)?Math.max(0,Math.floor((Date.now()-asked)/86400000)):(x.idle||0),
      rule:req?(typeof saStepName==='function'?saStepName(sa.need):apRuleText(x.st)):apRuleText(x.st),
      ruleSub:req?i18t('sa_pg_rule_sub'):'',
      who:(ask&&ask.by&&ask.by.name)||(req?((req.askedBy&&req.askedBy.name)||''):owner),
      waitsOn:(x.st&&x.st.approverLabel)||'',
      /* An approval nobody has sent is not "waiting on" its approver — it is
         the lead's move, and the row says so. */
      notAsked:!!(next&&next.sa&&next.status==='unasked'),
    };
  });
}
function apSignatureRows(){
  const cs=(state.contracts||[]).filter(c=>!c.archived);
  const mine=(typeof hmMySignings==='function')?hmMySignings(cs):[];
  const ready=(typeof readyToSignItems==='function')?readyToSignItems(cs):[];
  return [
    ...mine.map(x=>({ c:x.c, kind:'sign', n:x.n })),
    ...ready.filter(r=>!mine.some(m=>m.c.id===r.c.id)).map(r=>({ c:r.c, kind:'ready', by:r.sig&&r.sig.by })),
  ];
}
/* THE DOOR COUNT IS THE ROWS ON THE PAGE, so the number on the sidebar
   matches the list behind it — the standing rule. Signatures the other side
   is ready for are counted too: they wait on somebody here to issue the link. */
function approvalsDoorCount(){
  try{ return apApprovalRows().filter(r=>r.mine).length + apSignatureRows().length; }catch(_){ return 0; }
}

function apValueCell(c){
  if(typeof canViewValues==='function'&&!canViewValues()) return '';
  if(typeof isMonetary==='function'&&!isMonetary(c)) return '—';
  return c.value?(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):'—';
}
function apOpenSigning(id){
  const c=(state.contracts||[]).find(x=>x.id===id); if(!c) return;
  /* SIGNING IS BESIDE THE PAPER (the one-page Home plan, stage 5): Jambo's
     Before you sign face on Home; the phone keeps its own screens */
  if(window.roomTabHome&&roomTabHome(c,'sign')) return;
  openWorkspace(id);
  /* the head is built by the render; the tab is pressed after it lands */
  setTimeout(()=>{ try{ roomGoTab(c,'sign'); }catch(_){} },80);
}
/* (apTableHtml went with the two tabs: the one list draws its own table, round 15) */
/* ═══ THE LIST INSPECTOR ON THIS PAGE (Young asked for it 26 Sep 2026, with
   the Contracts and Negotiations lists) ═════════════════════════════════════
   The same shape as those two pages: a narrower list, one contract's facts in
   a panel beside it, a press to select and a second press — the panel's own
   button, Enter, a double-click — to open. js/views/inspector.js draws the
   panel and owns the keys; this page hands it the contract, its own section
   and its own verbs.
   IT STILL DECIDES NOTHING. The panel's lead act is this page's own verb —
   apOpenSigning, the Signing tab where the gate and the Sign button are — and
   "Open contract" is the register's own open. approveContract,
   rejectApprovalStep and signDocument are still not called from this file. */
function apInsSeat(tab){ return tab==='signatures'?'signatures':'approvals'; }
function apLeadHtml(tab, r){
  if(!r) return '';
  const kv=(label,val,cls)=>`<div><dt>${esc(label)}</dt><dd${cls?` class="${cls}"`:''}${val?` title="${esc(val)}"`:''}>${val?esc(val):'—'}</dd></div>`;
  if(tab==='approvals'){
    const waits=r.notAsked?i18t('sa_pg_not_asked'):(r.waitsOn||'');
    return insSecHtml(i18t('ins_ap_sec'),'',`<dl class="ins-kv">${
      kv(i18t('ap_pg_rule'),r.rule&&r.rule!=='—'?r.rule:'')}${
      kv(i18t('ins_ap_waits'),waits)}${
      kv(i18t('ap_pg_asked_by'),r.who||'')}${
      kv(i18t('ap_pg_waiting'),apWaitingText(r.idle),apLate(r)?'late':'')}</dl>${
      r.ruleSub?`<p class="ins-note" style="margin-top:8px">${esc(r.ruleSub)}</p>`:''}`,'ins-lead');
  }
  /* WHAT STANDS BETWEEN THIS READER AND SIGNING, borrowed from the Signing
     tab's own list (signReadiness) — the first three holds, then a count. A
     light record says so rather than guessing (`light`, the list's own rule). */
  if(r.kind==='ready') return insSecHtml(i18t('ins_sg_sec'),'',`<p class="ins-note">${esc(i18t('ap_pg_ready_sign',{who:r.by||r.c.counterparty||''}))}</p>`,'ins-lead');
  let holds=[];
  try{ if(typeof window.signReadinessFor==='function') holds=(window.signReadinessFor(r.c).holds||[]); else if(typeof signReadiness==='function') holds=(signReadiness(r.c,{light:!!r.c._light}).holds||[]); }catch(_){ holds=[]; }
  const say=h=>String(h.short||h.label||h.title||'').trim();
  const list=holds.map(say).filter(Boolean);
  return insSecHtml(i18t('ins_sg_sec'),'',`<p class="ins-note">${esc(r.n?i18tn('ap_pg_to_settle',r.n,{n:r.n}):i18t('ap_pg_ready_to_sign'))}</p>${
    list.length?`<ul class="ins-log ins-holds">${list.slice(0,3).map(t=>`<li><span class="t" title="${esc(t)}">${esc(t)}</span></li>`).join('')}</ul>${
      list.length>3?`<p class="ins-note">${esc(i18tn('ins_more_asks',list.length-3,{n:list.length-3}))}</p>`:''}`:''}`,'ins-lead');
}
/* MAY THIS READER DECIDE IT FROM HERE — the one reading, borrowed. Only on
   the reader's own rows: a row raised BY them is theirs to watch. */
function apMayDecide(r){
  if(!r||!r.mine||typeof approvalDecidableNow!=='function') return null;
  try{ return approvalDecidableNow(r.c); }catch(_){ return null; }
}
/* Approve or Refuse, then the list is read again — the row leaves the page
   when the decision is made, which is the confirmation (with the act's own
   toast). Nothing is pressed for the reader beyond the act they chose. */
async function apDecide(id, verdict){
  const c=(state.contracts||[]).find(x=>x.id===id); if(!c) return;
  if(typeof approvalDecideAsk!=='function'){ apOpenSigning(id); return; }
  const before=apApprovalRows(), idx=before.findIndex(r=>r.c.id===id);
  let ruleId=null;
  try{ const d=approvalDecidableNow(c); if(d&&d.kind==='rule'){ const nx=approvalState(c).next; ruleId=nx?nx.ruleId:null; } }catch(_){}
  const ok=await approvalDecideAsk(c, verdict);
  if(ok && verdict==='approved' && idx>=0) _apDone.set(id,{ row:before[idx], idx, ruleId });
  if(ok && state.view==='approvals'){
    try{ if(typeof updateSidebarCounts==='function') updateSidebarCounts(); }catch(_){}
    renderApprovalsPage();
  }
}
/* Undo goes through the room's own writer (approvalUndo, js/approvals.js). */
async function apUndo(id){
  const d=_apDone.get(id), c=(state.contracts||[]).find(x=>x.id===id);
  if(!d||!c||typeof approvalUndo!=='function') return;
  const ok=await approvalUndo(c, d.ruleId);
  if(ok) _apDone.delete(id);
  if(state.view==='approvals'){
    try{ if(typeof updateSidebarCounts==='function') updateSidebarCounts(); }catch(_){}
    renderApprovalsPage();
  }
}
function apMayUndo(r){
  return !!(r&&r.done&&r.done.ruleId!=null&&typeof approvalUndoable==='function'&&approvalUndoable(r.c, r.done.ruleId));
}
function apInsActs(tab, r){
  if(!r) return [];
  /* The buttons are the decision and the Signing tab; under them the three
     doors every list draws (owner, 12 Oct 2026: Document · Negotiation ·
     Workspace, replacing the sub line's "Open contract" link). None filled:
     this page's filled button is its own verb. */
  const open=insDoorActs(r.c);
  if(tab==='approvals' && r.done) return [
    ...(apMayUndo(r)?[{ k:'undo', label:i18t('ap_pg_undo'), title:i18t('ap_pg_undo_title'), run:c=>apUndo(c.id) }]:[]),
    { k:'gate', label:i18t('ap_pg_open_signing'), title:i18t('ap_pg_gate_title'), run:c=>apOpenSigning(c.id) },
    ...open,
  ];
  if(tab==='approvals' && apMayDecide(r)) return [
    { k:'approve', kind:'accent', label:i18t('ap_pg_approve'), title:i18t('ap_pg_approve_title'), run:c=>apDecide(c.id,'approved') },
    { k:'refuse', label:i18t('ap_pg_refuse'), title:i18t('ap_pg_refuse_title'), run:c=>apDecide(c.id,'refused') },
    { k:'gate', label:i18t('ap_pg_open_signing'), title:i18t('ap_pg_gate_title'), run:c=>apOpenSigning(c.id) },
    ...open,
  ];
  const lead=tab==='approvals'
    ? { k:'gate', kind:'accent', label:r.mine?i18t('ap_pg_open_gate'):i18t('ap_pg_open'), title:i18t('ap_pg_gate_title'), run:c=>apOpenSigning(c.id) }
    : { k:'sign', kind:'accent', label:i18t('ap_pg_open_signing'), title:i18t('ap_pg_sign_title'), run:c=>apOpenSigning(c.id) };
  return [lead, ...open];
}
function apApprovedPillHtml(){
  return `<span class="reg-stg" style="color:var(--st-green-fg);background:var(--st-green-bg)"><i style="background:var(--st-green-dot)"></i>${esc(i18t('ap_pg_approved'))}</span>`;
}
function apDoneLineHtml(){
  return `<p class="ins-need-line is-green" data-ap-done-line><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><use href="#i-check"/></svg><span><b>${esc(i18t('ap_pg_done_line'))}</b></span></p>`;
}
/* The counterparty's initials beside its name, as on every list (regAvatarHtml). */
function apAvHtml(name){ return (typeof window.regAvatarHtml==='function')?window.regAvatarHtml(name||'—'):''; }
/* ═══ ONE WORKLIST (round 15 of the redesign: the owner picked "One worklist",
   17 Oct 2026) ═══════════════════════════════════════════════════════════════
   Approvals and signatures are one list, grouped by who owes the next step —
   "Yours to answer" (an approval asked of you, one you have still to send, a
   signature that is yours, a ready-to-sign signal for somebody here to act
   on), then "Waiting on others" (approvals you raised that wait on their
   approver). The two tabs went with it; a Kind column says which each row is.
   EVERY ROW IS STILL BORROWED (apApprovalRows, apSignatureRows) and the page
   still decides nothing: the verbs are the panel's, as they were per tab.
   The selection keeps the one seat the doors use ('approvals'), so a door
   that opens this page on a row still lands on it. */
function apWorkRows(){
  const live=apApprovalRows(), ap=apRowsShown(live), sg=apSignatureRows();
  const rows=[...ap.map(r=>Object.assign({},r,{ type:'approval' })), ...sg.map(r=>Object.assign({},r,{ type:'signature' }))];
  const yours=rows.filter(r=>r.type==='signature'||r.mine||r.done||(r.own&&r.notAsked));
  const others=rows.filter(r=>!yours.includes(r));
  return { yours, others, rows:[...yours, ...others], live, sg };
}
/* the seat a row's panel is drawn for: an approval's or a signature's */
function apRowTab(r){ return r&&r.type==='signature'?'signatures':'approvals'; }
/* WHY IT WAITS — the rule, or what stands before the signature */
function apWhyHtml(r){
  if(r.type==='signature'){
    const t=r.kind==='sign'?(r.n?i18tn('ap_pg_to_settle',r.n,{n:r.n}):i18t('ap_pg_ready_to_sign')):i18t('ap_pg_ready_sign',{who:r.by||r.c.counterparty||''});
    return `<span class="ap-name" title="${esc(t)}">${esc(t)}</span>`;
  }
  const sub=r.mine?(r.ruleSub||''):'';
  return `<span class="ap-name" title="${esc(r.rule)}">${esc(r.rule)}</span>${sub?`<span class="ap-sub">${esc(sub)}</span>`:''}`;
}
/* WHOSE TURN — you, or who the approval waits on */
function apTurnText(r){
  if(r.type==='signature') return i18t(r.kind==='sign'?'ap_wl_you_sign':'ap_wl_you');
  if(r.done) return i18t('ap_pg_approved');
  if(r.mine) return i18t('ap_wl_you');
  if(r.notAsked) return i18t('ap_wl_you_send');
  return r.waitsOn||'—';
}
function apKindHtml(r){
  return `<span class="ap-kind${r.type==='signature'?' is-sig':''}">${esc(i18t(r.type==='signature'?'ap_wl_kind_sig':'ap_wl_kind_appr'))}</span>`;
}
function apInsPaint(rows){
  const tb=document.querySelector('.ap-table tbody');
  const seat='approvals';
  const idOf=tr=>tr.getAttribute('data-ap-row');
  const id=insPick(seat, tb?[...tb.querySelectorAll('[data-ap-row]')].map(idOf):[]);
  if(tb) insMarkRow(tb,'[data-ap-row]',idOf,id);
  const paint=pid=>{
    const r=rows.find(x=>x.c.id===pid)||null;
    const tab=apRowTab(r);
    /* THE CHECKLIST LEAVES OUT WHAT THIS PANEL ALREADY SAYS (27 Sep 2026):
       on a signature's panel the lead section is "what stands before signing",
       so a "Your signature" row above it would print it twice. AND ON AN
       APPROVAL'S (owner's yes, 18 Oct 2026, round 15's open question): the
       amber "Your approval is asked for." line went — the list's first group,
       "Yours to answer", and the panel's Approve button already say it. */
    const done=!!(r&&r.done);
    const skip=tab==='signatures'?['sign']:['approval'];
    insPaintPanel({ seat, c:r?r.c:null, acts:apInsActs(tab,r), lead:apLeadHtml(tab,r), moveSuffix:false,
      statusBeside:true,
      statusHtml:done?apApprovedPillHtml():null,
      needsHtml:!r?null:done?apDoneLineHtml():(typeof insNeedsLineHtml==='function'?insNeedsLineHtml(r.c, skip):null),
      needsSkip:skip,
      order:['lead','facts','reads'],
      factKeys:['value','owner','stream','ends'],
      empty:i18t('ap_wl_none') });
  };
  paint(id);
  if(tb) insListWire(tb,{ rowSel:'[data-ap-row]', idOf,
    onSelect:pid=>{ insSelect(seat,pid); insMarkRow(tb,'[data-ap-row]',idOf,pid); paint(pid); },
    onOpen:pid=>apOpenSigning(pid) });
}
function renderApprovalsPage(){
  const W=apWorkRows();
  const money=!(typeof canViewValues==='function'&&!canViewValues());
  /* WHICH SHAPE — asked once, recorded on the page (data-ins) so a width
     that crosses the line repaints it. */
  const INS=(typeof insFits==='function')&&insFits()&&typeof insPaintPanel==='function';
  const ident=c=>`<td><div class="ap-id">${apAvHtml(c.counterparty)}<div><span class="ap-name">${esc(c.counterparty||'—')}</span><span class="ap-sub">${esc(c.name||'')}</span></div></div></td>`;
  const head=[{t:i18t('reg_col_ref'),w:84},{t:i18t('reg_col_party')},{t:i18t('ap_wl_kind'),w:96},{t:i18t('ap_wl_why'),w:170},{t:i18t('ap_wl_turn'),w:112},{t:i18t('ap_pg_waiting'),w:88},
    ...(money?[{t:i18t('reg_col_value'),right:true,w:100}]:[]),...(INS?[]:[{t:'',w:220}])];
  const acts=r=>{
    if(r.type==='signature') return `<button type="button" class="ui-btn ui-btn-sm ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_sign_title'))}">${esc(i18t('ap_pg_open_signing'))}</button>`;
    if(r.done) return `<span class="ap-acts">${apMayUndo(r)?`<button type="button" class="ui-btn ui-btn-sm" data-ap-undo="${esc(r.c.id)}" title="${esc(i18t('ap_pg_undo_title'))}">${esc(i18t('ap_pg_undo'))}</button>`:''}<button type="button" class="ui-btn ui-btn-sm ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_gate_title'))}">${esc(i18t('ap_pg_open'))}</button></span>`;
    if(apMayDecide(r)) return `<span class="ap-acts"><button type="button" class="ui-btn ui-btn-sm ui-btn-accent" data-ap-approve="${esc(r.c.id)}" title="${esc(i18t('ap_pg_approve_title'))}">${esc(i18t('ap_pg_approve'))}</button><button type="button" class="ui-btn ui-btn-sm" data-ap-refuse="${esc(r.c.id)}" title="${esc(i18t('ap_pg_refuse_title'))}">${esc(i18t('ap_pg_refuse'))}</button><button type="button" class="ui-btn ui-btn-sm ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_gate_title'))}">${esc(i18t('ap_pg_open'))}</button></span>`;
    return `<button type="button" class="ui-btn ui-btn-sm ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_gate_title'))}">${esc(r.mine?i18t('ap_pg_open_gate'):i18t('ap_pg_open'))}</button>`;
  };
  const row=r=>`<tr data-ap-row="${esc(r.c.id)}" data-ap-kind="${r.type}"${INS?' tabindex="-1"':''}>
      <td class="mono">${window.refHtml?refHtml(r.c):esc(r.c.id)}</td>${ident(r.c)}
      <td>${apKindHtml(r)}</td>
      <td>${apWhyHtml(r)}</td>
      <td class="ap-turn" title="${esc(apTurnText(r))}">${esc(apTurnText(r))}</td>
      <td class="${r.done?'done':apLate(r)?'late':''}">${esc(r.done?i18t('ap_pg_approved'):r.type==='signature'?'—':apWaitingText(r.idle))}</td>
      ${money?`<td class="r mono">${apValueCell(r.c)}</td>`:''}
      ${INS?'':`<td class="r">${acts(r)}</td>`}
    </tr>`;
  const cols=head.length;
  const band=(k,label,list)=>list.length?`<tr class="ap-grp is-${k}"><td colspan="${cols}"><i aria-hidden="true"></i><b>${esc(label)}</b><span class="n">${list.length}</span></td></tr>${list.map(row).join('')}`:'';
  const n=W.rows.length;
  const table=n
    ? `<table class="ap-table${INS?' ap-ins':''}"><colgroup>${head.map(h=>`<col${h.w?` style="width:${h.w}px"`:''}>`).join('')}</colgroup><thead><tr>${head.map(h=>`<th${h.right?' class="r"':''}>${esc(h.t)}</th>`).join('')}</tr></thead><tbody>${
        band('yours',i18t('ap_wl_yours'),W.yours)}${band('others',i18t('ap_wl_others'),W.others)}</tbody></table>`
    : `<div class="ap-empty">${esc(i18t('ap_wl_none'))}</div>`;
  const facts=[W.yours.length?i18tn('ap_wl_n_yours',W.yours.length,{n:W.yours.length}):'', W.others.length?i18tn('ap_wl_n_others',W.others.length,{n:W.others.length}):''].filter(Boolean).join(' · ');
  const rules=(typeof isAdmin==='function'&&isAdmin()&&typeof openSettingsAt==='function')
    ? `<button type="button" class="ui-btn ui-btn-sm ap-rules" data-ap-rules>${esc(i18t('ap_pg_rules'))}</button>` : '';
  const card=`<section class="ap-card">
      <div class="ap-card-h"><h2 class="ap-card-t">${esc(i18t('ap_wl_title'))} <span class="ap-card-n">(${n.toLocaleString(typeof jxLocale==='function'?jxLocale():undefined)})</span></h2><span class="ap-card-m">${esc(i18tn('ap_pg_late_after',AP_LATE_DAYS,{n:AP_LATE_DAYS}))}</span></div>
      ${table}
    </section>`;
  document.getElementById('content').innerHTML=`
  <div class="view-enter sap-page ap-page${INS?' is-ins':''}" data-ins-page="approvals" data-ins="${INS?'1':'0'}">
    <div class="sap-band ap-band"><span class="ap-facts" data-ap-facts>${esc(facts||i18t('ap_wl_none'))}</span><span class="ap-band-sp"></span>${rules}</div>
    ${INS?`<div class="ap-body is-ins">${card}<aside id="ins-panel" class="ins-panel" aria-label="${esc(i18t('ins_panel_label'))}"></aside></div>`:card}
  </div>`;
  document.querySelector('[data-ap-rules]')?.addEventListener('click',()=>openSettingsAt('platform','approvals'));
  if(INS){
    apInsPaint(W.rows);
    if(typeof insWatchWidth==='function') insWatchWidth();
  } else {
    document.querySelectorAll('[data-ap-open]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); apOpenSigning(b.getAttribute('data-ap-open')); }));
    document.querySelectorAll('[data-ap-approve]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); apDecide(b.getAttribute('data-ap-approve'),'approved'); }));
    document.querySelectorAll('[data-ap-refuse]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); apDecide(b.getAttribute('data-ap-refuse'),'refused'); }));
    document.querySelectorAll('[data-ap-undo]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); apUndo(b.getAttribute('data-ap-undo')); }));
    document.querySelectorAll('[data-ap-row]').forEach(tr=>tr.addEventListener('click',()=>apOpenSigning(tr.getAttribute('data-ap-row'))));
  }
  setActiveNav('approvals');
}
Object.assign(window,{AP_TABS,apTab,apSetTab,apWorkRows,apRowTab,apWhyHtml,apTurnText,apKindHtml,apSaWaiting,apApprovalRows,apSignatureRows,approvalsDoorCount,renderApprovalsPage,apOpenSigning,
  apInsSeat,apLeadHtml,apInsActs,apInsPaint,apMayDecide,apDecide,
  AP_LATE_DAYS,apLate,apRowsShown,apUndo,apMayUndo,apApprovedPillHtml,apDoneLineHtml});
