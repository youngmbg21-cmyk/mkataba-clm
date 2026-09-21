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
function apApprovalRows(){
  const D=(typeof hmDashSlices==='function')?hmDashSlices():{};
  return (D.myApprovals||[]).map(x=>({
    c:x.c, mine:!!x.mine, own:!!x.own, idle:x.idle||0, st:x.st,
    rule:apRuleText(x.st),
    who:(typeof contractOwnerName==='function')?(contractOwnerName(x.c)||''):'',
    waitsOn:(x.st&&x.st.approverLabel)||'',
  }));
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
function renderApprovalsPage(){
  const tab=apTab();
  const ap=apApprovalRows(), sg=apSignatureRows();
  const money=!(typeof canViewValues==='function'&&!canViewValues());
  const apHead=[{t:'MK'},{t:i18t('reg_col_title')},{t:i18t('ap_pg_rule')},{t:i18t('ap_pg_asked_by')},{t:i18t('ap_pg_waiting')},...(money?[{t:i18t('reg_col_value'),right:true}]:[]),{t:''}];
  const apRowsHtml=ap.map(r=>`<tr data-ap-row="${esc(r.c.id)}">
      <td class="mono">${esc(r.c.id)}</td>
      <td><span class="ap-name">${esc(r.c.name||'')}</span><span class="ap-sub">${esc(r.c.counterparty||'')}</span></td>
      <td>${esc(r.rule)}${r.mine?'':`<span class="ap-sub">${esc(i18t('ap_pg_waiting_on',{who:r.waitsOn||'—'}))}</span>`}</td>
      <td>${esc(r.who||'—')}</td>
      <td class="${r.idle>=3?'late':''}">${esc(apWaitingText(r.idle))}</td>
      ${money?`<td class="r mono">${apValueCell(r.c)}</td>`:''}
      <td class="r"><button type="button" class="ui-btn ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_gate_title'))}">${esc(r.mine?i18t('ap_pg_open_gate'):i18t('ap_pg_open'))}</button></td>
    </tr>`);
  const sgHead=[{t:'MK'},{t:i18t('reg_col_title')},{t:i18t('ap_pg_what_waits')},...(money?[{t:i18t('reg_col_value'),right:true}]:[]),{t:''}];
  const sgRowsHtml=sg.map(r=>`<tr data-ap-row="${esc(r.c.id)}">
      <td class="mono">${esc(r.c.id)}</td>
      <td><span class="ap-name">${esc(r.c.name||'')}</span><span class="ap-sub">${esc(r.c.counterparty||'')}</span></td>
      <td>${r.kind==='sign'?esc(i18tn('ap_pg_to_settle',r.n,{n:r.n})):esc(i18t('ap_pg_ready_sign',{who:r.by||r.c.counterparty||''}))}</td>
      ${money?`<td class="r mono">${apValueCell(r.c)}</td>`:''}
      <td class="r"><button type="button" class="ui-btn ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_sign_title'))}">${esc(i18t('ap_pg_open_signing'))}</button></td>
    </tr>`);
  const n=tab==='approvals'?ap.length:sg.length;
  const tabBtn=(k,label,count)=>`<button type="button" class="st-tab${tab===k?' on':''}" data-ap-tab="${k}" role="tab" aria-selected="${tab===k?'true':'false'}">${esc(label)}${count?` <span class="ap-n">${count}</span>`:''}</button>`;
  document.getElementById('content').innerHTML=`
  <div class="view-enter ap-page">
    <div class="st-tabs" role="tablist">
      ${tabBtn('approvals',i18t('ap_pg_tab_approvals'),ap.length)}
      ${tabBtn('signatures',i18t('ap_pg_tab_signatures'),sg.length)}
    </div>
    <section class="ap-card">
      ${tab==='approvals'?apTableHtml(apHead,apRowsHtml,i18t('ap_pg_none_approvals')):apTableHtml(sgHead,sgRowsHtml,i18t('ap_pg_none_sign'))}
      <div class="ap-foot">
        <span>${esc(i18tn('ap_pg_foot',n,{n}))}</span>
        ${(typeof isAdmin==='function'&&isAdmin()&&typeof openSettingsAt==='function')?`<button type="button" class="ui-btn ui-btn-plain" data-ap-rules>${esc(i18t('ap_pg_rules'))} ↗</button>`:''}
      </div>
    </section>
  </div>`;
  document.querySelectorAll('[data-ap-tab]').forEach(b=>b.addEventListener('click',()=>{ apSetTab(b.getAttribute('data-ap-tab')); renderApprovalsPage(); }));
  document.querySelectorAll('[data-ap-open]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); apOpenSigning(b.getAttribute('data-ap-open')); }));
  document.querySelectorAll('[data-ap-row]').forEach(tr=>tr.addEventListener('click',()=>apOpenSigning(tr.getAttribute('data-ap-row'))));
  document.querySelector('[data-ap-rules]')?.addEventListener('click',()=>openSettingsAt('platform','approvals'));
  setActiveNav('approvals');
}
Object.assign(window,{AP_TABS,apTab,apSetTab,apApprovalRows,apSignatureRows,approvalsDoorCount,renderApprovalsPage,apOpenSigning});
