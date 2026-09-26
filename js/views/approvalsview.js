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
   NO SECOND WAY TO APPROVE OR SIGN. Approving is the approval gate on the
   contract's Signing tab and signing is that tab's Sign button, and both
   stay exactly where they are: every verb on this page OPENS that tab
   (openWorkspace + roomGoTab 'sign') and does nothing else. approveContract,
   rejectApprovalStep and signDocument are deliberately not called from this
   file — f344 greps for them. The page spends nothing and writes nothing.
   ============================================================ */
let _apTab='approvals';
const AP_TABS=['approvals','signatures'];
function apTab(){ return AP_TABS.includes(_apTab)?_apTab:AP_TABS[0]; }
function apSetTab(k){ _apTab=AP_TABS.includes(k)?k:AP_TABS[0]; }

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
function apApprovalRows(){
  const D=(typeof hmDashSlices==='function')?hmDashSlices():{};
  return (D.myApprovals||[]).map(x=>{
    const sa=x.mine?apSaWaiting(x.c):null;
    const req=sa&&sa.req;
    const next=x.st&&x.st.next;
    const asked=req?Date.parse(req.askedAt||''):NaN;
    return {
      c:x.c, mine:!!x.mine, own:!!x.own, st:x.st,
      idle:Number.isFinite(asked)?Math.max(0,Math.floor((Date.now()-asked)/86400000)):(x.idle||0),
      rule:req?(typeof saStepName==='function'?saStepName(sa.need):apRuleText(x.st)):apRuleText(x.st),
      ruleSub:req?i18t('sa_pg_rule_sub'):'',
      who:req?((req.askedBy&&req.askedBy.name)||''):((typeof contractOwnerName==='function')?(contractOwnerName(x.c)||''):''),
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
      kv(i18t('ap_pg_waiting'),apWaitingText(r.idle),r.idle>=3?'late':'')}</dl>${
      r.ruleSub?`<p class="ins-note" style="margin-top:8px">${esc(r.ruleSub)}</p>`:''}`,'ins-lead');
  }
  /* WHAT STANDS BETWEEN THIS READER AND SIGNING, borrowed from the Signing
     tab's own list (signReadiness) — the first three holds, then a count. A
     light record says so rather than guessing (`light`, the list's own rule). */
  if(r.kind==='ready') return insSecHtml(i18t('ins_sg_sec'),'',`<p class="ins-note">${esc(i18t('ap_pg_ready_sign',{who:r.by||r.c.counterparty||''}))}</p>`,'ins-lead');
  let holds=[];
  try{ if(typeof signReadiness==='function') holds=(signReadiness(r.c,{light:!!r.c._light}).holds||[]); }catch(_){ holds=[]; }
  const say=h=>String(h.short||h.label||h.title||'').trim();
  const list=holds.map(say).filter(Boolean);
  return insSecHtml(i18t('ins_sg_sec'),'',`<p class="ins-note">${esc(i18tn('ap_pg_to_settle',r.n,{n:r.n}))}</p>${
    list.length?`<ul class="ins-log ins-holds">${list.slice(0,3).map(t=>`<li><span class="t" title="${esc(t)}">${esc(t)}</span></li>`).join('')}</ul>${
      list.length>3?`<p class="ins-note">${esc(i18tn('ins_more_asks',list.length-3,{n:list.length-3}))}</p>`:''}`:''}`,'ins-lead');
}
function apInsActs(tab, r){
  if(!r) return [];
  const lead=tab==='approvals'
    ? { k:'gate', kind:'accent', label:r.mine?i18t('ap_pg_open_gate'):i18t('ap_pg_open'), title:i18t('ap_pg_gate_title'), run:c=>apOpenSigning(c.id) }
    : { k:'sign', kind:'accent', label:i18t('ap_pg_open_signing'), title:i18t('ap_pg_sign_title'), run:c=>apOpenSigning(c.id) };
  return [lead, { k:'open', label:i18t('ins_open_contract'), run:c=>selectContract(c.id) }];
}
function apInsPaint(tab, rows){
  const tb=document.querySelector('.ap-table tbody');
  const seat=apInsSeat(tab);
  const idOf=tr=>tr.getAttribute('data-ap-row');
  const id=insPick(seat, tb?[...tb.querySelectorAll('[data-ap-row]')].map(idOf):[]);
  if(tb) insMarkRow(tb,'[data-ap-row]',idOf,id);
  const paint=pid=>{
    const r=rows.find(x=>x.c.id===pid)||null;
    insPaintPanel({ seat, c:r?r.c:null, acts:apInsActs(tab,r), lead:apLeadHtml(tab,r), moveSuffix:false,
      order:['lead','facts','reads','latest'],
      empty:tab==='approvals'?i18t('ap_pg_none_approvals'):i18t('ap_pg_none_sign') });
  };
  paint(id);
  if(tb) insListWire(tb,{ rowSel:'[data-ap-row]', idOf,
    onSelect:pid=>{ insSelect(seat,pid); insMarkRow(tb,'[data-ap-row]',idOf,pid); paint(pid); },
    onOpen:pid=>apOpenSigning(pid) });
}
function renderApprovalsPage(){
  const tab=apTab();
  const ap=apApprovalRows(), sg=apSignatureRows();
  const money=!(typeof canViewValues==='function'&&!canViewValues());
  /* WHICH SHAPE — asked once, recorded on the page (data-ins) so a width
     that crosses the line repaints it. */
  const INS=(typeof insFits==='function')&&insFits()&&typeof insPaintPanel==='function';
  const apHead=[{t:'MK'},{t:i18t('reg_col_title')},{t:i18t('ap_pg_rule')},{t:i18t('ap_pg_asked_by')},{t:i18t('ap_pg_waiting')},...(money?[{t:i18t('reg_col_value'),right:true}]:[]),{t:''}];
  const apRowsHtml=ap.map(r=>`<tr data-ap-row="${esc(r.c.id)}">
      <td class="mono">${esc(window.contractRef?contractRef(r.c):r.c.id)}</td>
      <td><span class="ap-name">${esc(r.c.name||'')}</span><span class="ap-sub">${esc(r.c.counterparty||'')}</span></td>
      <td>${esc(r.rule)}${r.mine?(r.ruleSub?`<span class="ap-sub">${esc(r.ruleSub)}</span>`:''):`<span class="ap-sub">${esc(r.notAsked?i18t('sa_pg_not_asked'):i18t('ap_pg_waiting_on',{who:r.waitsOn||'—'}))}</span>`}</td>
      <td>${esc(r.who||'—')}</td>
      <td class="${r.idle>=3?'late':''}">${esc(apWaitingText(r.idle))}</td>
      ${money?`<td class="r mono">${apValueCell(r.c)}</td>`:''}
      <td class="r"><button type="button" class="ui-btn ui-btn-sm ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_gate_title'))}">${esc(r.mine?i18t('ap_pg_open_gate'):i18t('ap_pg_open'))}</button></td>
    </tr>`);
  const sgHead=[{t:'MK'},{t:i18t('reg_col_title')},{t:i18t('ap_pg_what_waits')},...(money?[{t:i18t('reg_col_value'),right:true}]:[]),{t:''}];
  const sgRowsHtml=sg.map(r=>`<tr data-ap-row="${esc(r.c.id)}">
      <td class="mono">${esc(window.contractRef?contractRef(r.c):r.c.id)}</td>
      <td><span class="ap-name">${esc(r.c.name||'')}</span><span class="ap-sub">${esc(r.c.counterparty||'')}</span></td>
      <td>${r.kind==='sign'?esc(i18tn('ap_pg_to_settle',r.n,{n:r.n})):esc(i18t('ap_pg_ready_sign',{who:r.by||r.c.counterparty||''}))}</td>
      ${money?`<td class="r mono">${apValueCell(r.c)}</td>`:''}
      <td class="r"><button type="button" class="ui-btn ui-btn-sm ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_sign_title'))}">${esc(i18t('ap_pg_open_signing'))}</button></td>
    </tr>`);
  /* ---- THE INSPECTOR'S LIST: four columns, the verbs in the panel ----
     The reference, the counterparty over the agreement (the register's own
     identity cell, so the three lists read alike), what waits, and the value.
     The row's Open button moves to the panel — it is the panel's lead act —
     and nothing a person could press is lost. */
  const ident=c=>`<td><span class="ap-name">${esc(c.counterparty||'—')}</span><span class="ap-sub">${esc(c.name||'')}</span></td>`;
  const insHead=[{t:i18t('reg_col_ref'),w:84},{t:i18t('reg_col_party')},{t:tab==='approvals'?i18t('ins_col_approval'):i18t('ap_pg_what_waits'),w:250},...(money?[{t:i18t('reg_col_value'),right:true,w:124}]:[])];
  const insAp=ap.map(r=>{
    const waits=r.mine?(r.ruleSub||''):(r.notAsked?i18t('sa_pg_not_asked'):i18t('ap_pg_waiting_on',{who:r.waitsOn||'—'}));
    return `<tr data-ap-row="${esc(r.c.id)}" tabindex="-1">
      <td class="mono">${esc(window.contractRef?contractRef(r.c):r.c.id)}</td>${ident(r.c)}
      <td><span class="ap-name">${esc(r.rule)}</span><span class="ap-sub${r.idle>=3?' late':''}">${esc([waits,apWaitingText(r.idle)].filter(Boolean).join(' · '))}</span></td>
      ${money?`<td class="r mono">${apValueCell(r.c)}</td>`:''}
    </tr>`; });
  const insSg=sg.map(r=>`<tr data-ap-row="${esc(r.c.id)}" tabindex="-1">
      <td class="mono">${esc(window.contractRef?contractRef(r.c):r.c.id)}</td>${ident(r.c)}
      <td>${r.kind==='sign'?esc(i18tn('ap_pg_to_settle',r.n,{n:r.n})):esc(i18t('ap_pg_ready_sign',{who:r.by||r.c.counterparty||''}))}</td>
      ${money?`<td class="r mono">${apValueCell(r.c)}</td>`:''}
    </tr>`);
  const insTable=(rows,empty)=>rows.length
    ? `<table class="ap-table ap-ins"><colgroup>${insHead.map(h=>`<col${h.w?` style="width:${h.w}px"`:''}>`).join('')}</colgroup><thead><tr>${insHead.map(h=>`<th${h.right?' class="r"':''}>${esc(h.t)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`
    : `<div class="ap-empty">${esc(empty)}</div>`;
  const n=tab==='approvals'?ap.length:sg.length;
  const tabBtn=(k,label,count)=>`<button type="button" class="st-tab${tab===k?' on':''}" data-ap-tab="${k}" role="tab" aria-selected="${tab===k?'true':'false'}">${esc(label)}${count?` <span class="ap-n">${count}</span>`:''}</button>`;
  const body=INS
    ? (tab==='approvals'?insTable(insAp,i18t('ap_pg_none_approvals')):insTable(insSg,i18t('ap_pg_none_sign')))
    : (tab==='approvals'?apTableHtml(apHead,apRowsHtml,i18t('ap_pg_none_approvals')):apTableHtml(sgHead,sgRowsHtml,i18t('ap_pg_none_sign')));
  const card=`<section class="ap-card">
      ${body}
      <div class="ap-foot">
        <span>${esc(i18tn('ap_pg_foot',n,{n}))}</span>
        ${(typeof isAdmin==='function'&&isAdmin()&&typeof openSettingsAt==='function')?`<button type="button" class="ui-btn ui-btn-plain" data-ap-rules>${esc(i18t('ap_pg_rules'))}${(typeof icon==='function')?icon('chevR','w-3.5 h-3.5'):''}</button>`:''}
      </div>
    </section>`;
  document.getElementById('content').innerHTML=`
  <div class="view-enter ap-page${INS?' is-ins':''}" data-ins-page="approvals" data-ins="${INS?'1':'0'}">
    <div class="st-tabs" role="tablist">
      ${tabBtn('approvals',i18t('ap_pg_tab_approvals'),ap.length)}
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
    document.querySelectorAll('[data-ap-row]').forEach(tr=>tr.addEventListener('click',()=>apOpenSigning(tr.getAttribute('data-ap-row'))));
  }
  setActiveNav('approvals');
}
Object.assign(window,{AP_TABS,apTab,apSetTab,apSaWaiting,apApprovalRows,apSignatureRows,approvalsDoorCount,renderApprovalsPage,apOpenSigning,
  apInsSeat,apLeadHtml,apInsActs,apInsPaint});
