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
  openWorkspace(id);
  /* the head is built by the render; the tab is pressed after it lands */
  setTimeout(()=>{ try{ roomGoTab(c,'sign'); }catch(_){} },80);
}
function apTableHtml(head, rows, empty){
  if(!rows.length) return `<div class="ap-empty">${esc(empty)}</div>`;
  return `<table class="ap-table"><thead><tr>${head.map(h=>`<th${h.right?' class="r"':''}>${esc(h.t)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
}
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
  /* "Open contract" is a link on the head's sub line (SAP benchmark, 9 Oct
     2026); the buttons are the decision and the Signing tab. */
  const open={ k:'open', inSub:true, label:i18t('ins_open_contract'), run:c=>selectContract(c.id) };
  if(tab==='approvals' && r.done) return [
    ...(apMayUndo(r)?[{ k:'undo', label:i18t('ap_pg_undo'), title:i18t('ap_pg_undo_title'), run:c=>apUndo(c.id) }]:[]),
    { k:'gate', label:i18t('ap_pg_open_signing'), title:i18t('ap_pg_gate_title'), run:c=>apOpenSigning(c.id) },
    open,
  ];
  if(tab==='approvals' && apMayDecide(r)) return [
    { k:'approve', kind:'accent', label:i18t('ap_pg_approve'), title:i18t('ap_pg_approve_title'), run:c=>apDecide(c.id,'approved') },
    { k:'refuse', label:i18t('ap_pg_refuse'), title:i18t('ap_pg_refuse_title'), run:c=>apDecide(c.id,'refused') },
    { k:'gate', label:i18t('ap_pg_open_signing'), title:i18t('ap_pg_gate_title'), run:c=>apOpenSigning(c.id) },
    open,
  ];
  const lead=tab==='approvals'
    ? { k:'gate', kind:'accent', label:r.mine?i18t('ap_pg_open_gate'):i18t('ap_pg_open'), title:i18t('ap_pg_gate_title'), run:c=>apOpenSigning(c.id) }
    : { k:'sign', kind:'accent', label:i18t('ap_pg_open_signing'), title:i18t('ap_pg_sign_title'), run:c=>apOpenSigning(c.id) };
  return [lead, open];
}
function apApprovedPillHtml(){
  return `<span class="reg-stg" style="color:var(--st-green-fg);background:var(--st-green-bg)"><i style="background:var(--st-green-dot)"></i>${esc(i18t('ap_pg_approved'))}</span>`;
}
function apDoneLineHtml(){
  return `<p class="ins-need-line is-green" data-ap-done-line><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><use href="#i-check"/></svg><span><b>${esc(i18t('ap_pg_done_line'))}</b></span></p>`;
}
/* The counterparty's initials beside its name, as on every list (regAvatarHtml). */
function apAvHtml(name){ return (typeof window.regAvatarHtml==='function')?window.regAvatarHtml(name||'—'):''; }
function apInsPaint(tab, rows){
  const tb=document.querySelector('.ap-table tbody');
  const seat=apInsSeat(tab);
  const idOf=tr=>tr.getAttribute('data-ap-row');
  const id=insPick(seat, tb?[...tb.querySelectorAll('[data-ap-row]')].map(idOf):[]);
  if(tb) insMarkRow(tb,'[data-ap-row]',idOf,id);
  const paint=pid=>{
    const r=rows.find(x=>x.c.id===pid)||null;
    /* THE CHECKLIST LEAVES OUT WHAT THIS PANEL ALREADY SAYS (27 Sep 2026):
       on the signatures tab the lead section is "what stands before signing",
       so a "Your signature" row above it would print it twice. */
    /* THE STAGE BESIDE THE NAME, ONE LINE FOR WHAT IS ASKED (SAP benchmark,
       owner-approved 9 Oct 2026): the checklist's buttons were a second
       door onto the Approve right under them. */
    const done=!!(r&&r.done);
    insPaintPanel({ seat, c:r?r.c:null, acts:apInsActs(tab,r), lead:apLeadHtml(tab,r), moveSuffix:false,
      statusBeside:true,
      statusHtml:done?apApprovedPillHtml():null,
      needsHtml:!r?null:done?apDoneLineHtml():(typeof insNeedsLineHtml==='function'?insNeedsLineHtml(r.c, tab==='signatures'?['sign']:[]):null),
      needsSkip:tab==='signatures'?['sign']:[],
      order:['lead','facts','reads'],
      factKeys:['value','owner','stream','ends'],
      empty:tab==='approvals'?i18t('ap_pg_none_approvals'):i18t('ap_pg_none_sign') });
  };
  paint(id);
  if(tb) insListWire(tb,{ rowSel:'[data-ap-row]', idOf,
    onSelect:pid=>{ insSelect(seat,pid); insMarkRow(tb,'[data-ap-row]',idOf,pid); paint(pid); },
    onOpen:pid=>apOpenSigning(pid) });
}
function renderApprovalsPage(){
  const tab=apTab();
  const live=apApprovalRows(), ap=apRowsShown(live), sg=apSignatureRows();
  const money=!(typeof canViewValues==='function'&&!canViewValues());
  /* WHICH SHAPE — asked once, recorded on the page (data-ins) so a width
     that crosses the line repaints it. */
  const INS=(typeof insFits==='function')&&insFits()&&typeof insPaintPanel==='function';
  const apHead=[{t:'MK'},{t:i18t('reg_col_title')},{t:i18t('ap_pg_rule')},{t:i18t('ap_pg_asked_by')},{t:i18t('ap_pg_waiting')},...(money?[{t:i18t('reg_col_value'),right:true}]:[]),{t:''}];
  const apRowsHtml=ap.map(r=>`<tr data-ap-row="${esc(r.c.id)}">
      <td class="mono">${window.refHtml?refHtml(r.c):esc(r.c.id)}</td>
      <td><div class="ap-id">${apAvHtml(r.c.counterparty)}<div><span class="ap-name">${esc(r.c.name||'')}</span><span class="ap-sub">${esc(r.c.counterparty||'')}</span></div></div></td>
      <td>${esc(r.rule)}${r.mine?(r.ruleSub?`<span class="ap-sub">${esc(r.ruleSub)}</span>`:''):`<span class="ap-sub">${esc(r.notAsked?i18t('sa_pg_not_asked'):i18t('ap_pg_waiting_on',{who:r.waitsOn||'—'}))}</span>`}</td>
      <td>${esc(r.who||'—')}</td>
      <td class="${r.done?'done':apLate(r)?'late':''}">${esc(r.done?i18t('ap_pg_approved'):apWaitingText(r.idle))}</td>
      ${money?`<td class="r mono">${apValueCell(r.c)}</td>`:''}
      <td class="r">${r.done?`<span class="ap-acts">${apMayUndo(r)?`<button type="button" class="ui-btn ui-btn-sm" data-ap-undo="${esc(r.c.id)}" title="${esc(i18t('ap_pg_undo_title'))}">${esc(i18t('ap_pg_undo'))}</button>`:''}<button type="button" class="ui-btn ui-btn-sm ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_gate_title'))}">${esc(i18t('ap_pg_open'))}</button></span>`
        :apMayDecide(r)?`<span class="ap-acts"><button type="button" class="ui-btn ui-btn-sm ui-btn-accent" data-ap-approve="${esc(r.c.id)}" title="${esc(i18t('ap_pg_approve_title'))}">${esc(i18t('ap_pg_approve'))}</button><button type="button" class="ui-btn ui-btn-sm" data-ap-refuse="${esc(r.c.id)}" title="${esc(i18t('ap_pg_refuse_title'))}">${esc(i18t('ap_pg_refuse'))}</button><button type="button" class="ui-btn ui-btn-sm ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_gate_title'))}">${esc(i18t('ap_pg_open'))}</button></span>`
        :`<button type="button" class="ui-btn ui-btn-sm ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_gate_title'))}">${esc(r.mine?i18t('ap_pg_open_gate'):i18t('ap_pg_open'))}</button>`}</td>
    </tr>`);
  const sgHead=[{t:'MK'},{t:i18t('reg_col_title')},{t:i18t('ap_pg_what_waits')},...(money?[{t:i18t('reg_col_value'),right:true}]:[]),{t:''}];
  const sgRowsHtml=sg.map(r=>`<tr data-ap-row="${esc(r.c.id)}">
      <td class="mono">${window.refHtml?refHtml(r.c):esc(r.c.id)}</td>
      <td><div class="ap-id">${apAvHtml(r.c.counterparty)}<div><span class="ap-name">${esc(r.c.name||'')}</span><span class="ap-sub">${esc(r.c.counterparty||'')}</span></div></div></td>
      <td>${r.kind==='sign'?esc(r.n?i18tn('ap_pg_to_settle',r.n,{n:r.n}):i18t('ap_pg_ready_to_sign')):esc(i18t('ap_pg_ready_sign',{who:r.by||r.c.counterparty||''}))}</td>
      ${money?`<td class="r mono">${apValueCell(r.c)}</td>`:''}
      <td class="r"><button type="button" class="ui-btn ui-btn-sm ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_sign_title'))}">${esc(i18t('ap_pg_open_signing'))}</button></td>
    </tr>`);
  /* ---- THE INSPECTOR'S LIST: four columns, the verbs in the panel ----
     The reference, the counterparty over the agreement (the register's own
     identity cell, so the three lists read alike), what waits, and the value.
     The row's Open button moves to the panel — it is the panel's lead act —
     and nothing a person could press is lost. */
  const ident=c=>`<td><div class="ap-id">${apAvHtml(c.counterparty)}<div><span class="ap-name">${esc(c.counterparty||'—')}</span><span class="ap-sub">${esc(c.name||'')}</span></div></div></td>`;
  /* THE DRAWING'S COLUMNS (SAP benchmark, 9 Oct 2026): the rule and the wait
     each have their own column on the approvals tab. */
  const insHead=tab==='approvals'
    ? [{t:i18t('reg_col_ref'),w:84},{t:i18t('reg_col_party')},{t:i18t('ap_pg_rule'),w:200},{t:i18t('ap_pg_waiting'),w:110},...(money?[{t:i18t('reg_col_value'),right:true,w:124}]:[])]
    : [{t:i18t('reg_col_ref'),w:84},{t:i18t('reg_col_party')},{t:i18t('ap_pg_what_waits'),w:250},...(money?[{t:i18t('reg_col_value'),right:true,w:124}]:[])];
  const insAp=ap.map(r=>{
    const waits=r.mine?(r.ruleSub||''):(r.notAsked?i18t('sa_pg_not_asked'):i18t('ap_pg_waiting_on',{who:r.waitsOn||'—'}));
    return `<tr data-ap-row="${esc(r.c.id)}" tabindex="-1">
      <td class="mono">${window.refHtml?refHtml(r.c):esc(r.c.id)}</td>${ident(r.c)}
      <td><span class="ap-name">${esc(r.rule)}</span>${waits?`<span class="ap-sub">${esc(waits)}</span>`:''}</td>
      <td class="${r.done?'done':apLate(r)?'late':''}">${esc(r.done?i18t('ap_pg_approved'):apWaitingText(r.idle))}</td>
      ${money?`<td class="r mono">${apValueCell(r.c)}</td>`:''}
    </tr>`; });
  const insSg=sg.map(r=>`<tr data-ap-row="${esc(r.c.id)}" tabindex="-1">
      <td class="mono">${window.refHtml?refHtml(r.c):esc(r.c.id)}</td>${ident(r.c)}
      <td>${r.kind==='sign'?esc(r.n?i18tn('ap_pg_to_settle',r.n,{n:r.n}):i18t('ap_pg_ready_to_sign')):esc(i18t('ap_pg_ready_sign',{who:r.by||r.c.counterparty||''}))}</td>
      ${money?`<td class="r mono">${apValueCell(r.c)}</td>`:''}
    </tr>`);
  const insTable=(rows,empty)=>rows.length
    ? `<table class="ap-table ap-ins"><colgroup>${insHead.map(h=>`<col${h.w?` style="width:${h.w}px"`:''}>`).join('')}</colgroup><thead><tr>${insHead.map(h=>`<th${h.right?' class="r"':''}>${esc(h.t)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`
    : `<div class="ap-empty">${esc(empty)}</div>`;
  const n=tab==='approvals'?live.length:sg.length;
  /* THE TABLE SAYS WHAT IT IS AND HOW MANY (SAP benchmark, owner-approved
     9 Oct 2026). "Your" only where every row waits on this reader — a row
     the reader raised waits on somebody else. */
  const allMine=live.every(r=>r.mine);
  const cardTitle=tab==='approvals'?i18t(allMine?'ap_pg_title_mine':'ap_pg_title_all'):i18t('ap_pg_title_sign');
  const tabBtn=(k,label,count)=>`<button type="button" class="st-tab${tab===k?' on':''}" data-ap-tab="${k}" role="tab" aria-selected="${tab===k?'true':'false'}">${esc(label)}${count?` <span class="ap-n">${count}</span>`:''}</button>`;
  const body=INS
    ? (tab==='approvals'?insTable(insAp,i18t('ap_pg_none_approvals')):insTable(insSg,i18t('ap_pg_none_sign')))
    : (tab==='approvals'?apTableHtml(apHead,apRowsHtml,i18t('ap_pg_none_approvals')):apTableHtml(sgHead,sgRowsHtml,i18t('ap_pg_none_sign')));
  const card=`<section class="ap-card">
      <div class="ap-card-h"><h2 class="ap-card-t">${esc(cardTitle)} <span class="ap-card-n">(${n.toLocaleString(typeof jxLocale==='function'?jxLocale():undefined)})</span></h2>${
        tab==='approvals'?`<span class="ap-card-m">${esc(i18tn('ap_pg_late_after',AP_LATE_DAYS,{n:AP_LATE_DAYS}))}</span>`:''}</div>
      ${body}
      ${(typeof isAdmin==='function'&&isAdmin()&&typeof openSettingsAt==='function')?`<div class="ap-foot"><button type="button" class="ui-btn ui-btn-plain" data-ap-rules>${esc(i18t('ap_pg_rules'))}${(typeof icon==='function')?icon('chevR','w-3.5 h-3.5'):''}</button></div>`:''}
    </section>`;
  document.getElementById('content').innerHTML=`
  <div class="view-enter sap-page ap-page${INS?' is-ins':''}" data-ins-page="approvals" data-ins="${INS?'1':'0'}">
    <div class="st-tabs sap-band" role="tablist">
      ${tabBtn('approvals',i18t('ap_pg_tab_approvals'),live.length)}
      ${tabBtn('signatures',i18t('ap_pg_tab_signatures'),sg.length)}
    </div>
    ${INS?`<div class="ap-body is-ins">${card}<aside id="ins-panel" class="ins-panel" aria-label="${esc(i18t('ins_panel_label'))}"></aside></div>`:card}
  </div>`;
  document.querySelectorAll('[data-ap-tab]').forEach(b=>b.addEventListener('click',()=>{ apSetTab(b.getAttribute('data-ap-tab')); renderApprovalsPage(); }));
  document.querySelector('[data-ap-rules]')?.addEventListener('click',()=>openSettingsAt('platform','approvals'));
  if(INS){
    apInsPaint(tab, tab==='approvals'?ap:sg);
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
Object.assign(window,{AP_TABS,apTab,apSetTab,apSaWaiting,apApprovalRows,apSignatureRows,approvalsDoorCount,renderApprovalsPage,apOpenSigning,
  apInsSeat,apLeadHtml,apInsActs,apInsPaint,apMayDecide,apDecide,
  AP_LATE_DAYS,apLate,apRowsShown,apUndo,apMayUndo,apApprovedPillHtml,apDoneLineHtml});
