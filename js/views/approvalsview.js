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
    ...mine.map(x=>({ c:x.c, kind:'sign', n:x.n, idle:apSignIdle(x.c) })),
    ...ready.filter(r=>!mine.some(m=>m.c.id===r.c.id)).map(r=>({ c:r.c, kind:'ready', by:r.sig&&r.sig.by, idle:apSignIdle(r.c) })),
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
function apOpenSigning(id, land){
  const c=(state.contracts||[]).find(x=>x.id===id); if(!c) return;
  /* SIGNING IS BESIDE THE PAPER (the one-page Home plan, stage 5): Jambo's
     Before you sign face on Home; the phone keeps its own screens — and the
     door lands on what it opened for (LAND ON IT): the approval's card or
     the Sign button, or the road's stop where a colleague signs ('road') */
  if(window.roomTabHome&&roomTabHome(c,'sign')){ if(typeof jlLand==='function') jlLand(land==='road'?'road':'sign'); return; }
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
/* SINCE IT WAS ASKED, READ FROM THE APPROVAL'S OWN WORDING HASH (round 15,
   "Since last look"): a named approval's stamp (saDrift), or the stamp the
   rule step's question was opened with (asks.js, askRuleFor) against the
   record now (approvalStamp). 'same', 'wording', 'value', 'terms' — or
   'unknown' for a question opened before it carried one. Reads, writes nothing. */
function apSinceLook(r){
  if(!r||r.type!=='approval') return 'unknown';
  const c=r.c;
  try{
    if(r.st&&r.st.next&&r.st.next.sa){
      const req=(typeof apSaWaiting==='function'&&apSaWaiting(c)||{}).req;
      if(req&&req.stamp&&typeof saDrift==='function'){ const d=saDrift(req.stamp, c);
        return !d.length?'same':d.includes('wording')?'wording':d.includes('value')||d.includes('currency')?'value':'terms'; }
    }
    const ask=apAskOf(c, null, r.st&&r.st.next);
    const was=ask&&ask.stamp;
    if(!was||typeof approvalStamp!=='function') return 'unknown';
    const now=approvalStamp(c);
    if(String(was.doc||'')!==String(now.doc||'')) return 'wording';
    if(was.value!==''&&was.value!=null&&Number(was.value)!==Number(now.value)) return 'value';
    const moved=Object.keys(was.fields||{}).some(k=>String((now.fields||{})[k]==null?'':now.fields[k])!==String(was.fields[k]));
    return moved?'terms':'same';
  }catch(_){ return 'unknown'; }
}
const AP_SINCE_WORDS={ same:'jl_ap_since_same', wording:'jl_ap_since_wording', value:'jl_ap_since_value', terms:'jl_ap_since_terms', unknown:'jl_ap_since_unknown' };
/* "Erik Ström · 3 days ago" */
function apAskedByText(r){
  const ago=r.idle==null?'':(Number(r.idle)===0?i18t('home_today'):i18tn('jl_days_ago',Number(r.idle),{n:Number(r.idle)}));
  return [r.who||'', ago].filter(Boolean).join(' \u00b7 ');
}
/* "Erik's contracts need Jonas's yes before anyone signs" / "Over SEK 2 M: Sara approves before anyone signs" */
function apWhySentence(r){
  if(r.ruleSub){
    const sa=(typeof apSaWaiting==='function')?apSaWaiting(r.c):null;
    const whose=String((typeof contractOwnerName==='function'?contractOwnerName(r.c):'')||'').split(/\s+/)[0];
    const who=String((sa&&sa.req&&sa.req.approverName)||r.waitsOn||'').split(/\s+/)[0];
    if(whose&&who) return apApproverMe(r)?i18t('jl_ap_why_sa_you',{whose}):i18t('jl_ap_why_sa',{whose,who});
  }
  if(r.waitsOn&&apApproverMe(r)) return i18t('jl_ap_why_rule_you',{rule:r.rule});
  return r.waitsOn?i18t('jl_ap_why_rule',{rule:r.rule,who:apWaitsShort(r)}):r.rule;
}
/* JAMBO'S PANEL ON THIS PAGE (round 15, "One worklist" as drawn): the facts
   as rows — Why it waits · Asked by · Value · Since last look — then "Your
   answer, for Jonas" with its own buttons and the sentence saying how it is
   recorded. A signature's panel says what stands before it and who signs. */
function apLeadJlHtml(tab, r, acts){
  if(!r) return '';
  const money=!(typeof canViewValues==='function'&&!canViewValues());
  const val=money?apValueCell(r.c):'';
  if(tab==='approvals'){
    const since=apSinceLook(r);
    const rows=[{ k:'why', label:i18t('ap_wl_why'), v:esc(apWhySentence(r)) },
      { k:'asked', label:i18t('ap_pg_asked_by'), v:esc(apAskedByText(r)) },
      ...(money?[{ k:'value', label:i18t('ins_f_value'), v:esc(val) }]:[]),
      ...(!r.mine?[{ k:'waits', label:i18t('ins_ap_waits'), v:esc(r.notAsked?i18t('sa_pg_not_asked'):(r.waitsOn||'')) }]:[]),
      { k:'since', label:i18t('jl_ap_since'), v:esc(i18t(AP_SINCE_WORDS[since]||AP_SINCE_WORDS.unknown)), tone:since==='same'||since==='unknown'?'':'amber' }];
    let answer='';
    const body=(acts||[]).filter(a=>a&&a.inBody);
    if(body.length){
      const fw=apForWho(r);
      const head=fw?i18t('jl_ap_answer_for',{who:String(fw.name).split(/\s+/)[0]}):i18t('jl_ap_answer');
      const first=body.filter(a=>a.k!=='gate'), gate=body.filter(a=>a.k==='gate');
      let rec='';
      if(fw){
        const me=(typeof currentUser==='function'&&currentUser())||{};
        const aw=(typeof jlAwayOf==='function')?jlAwayOf(fw.id):null;
        const as=(typeof awayByLabel==='function')?awayByLabel(me.name||'', fw):String(me.name||'');
        rec=`<p class="ins-note jl-rec">${esc(i18t(aw&&aw.to?'jl_ap_recorded':'jl_ap_recorded_short',{as,who:String(fw.name).split(/\s+/)[0],day:aw&&aw.to?jlDayWord(aw.to):''}))}</p>`;
      }
      answer=`<section class="ins-sec jl-answer" data-jl-answer><h3>${esc(head)}</h3><div class="ins-acts">${first.map(insActBtnHtml).join('')}</div>${
        gate.length?`<div class="ins-acts">${gate.map(insActBtnHtml).join('')}</div>`:''}${rec}</section>`;
    }
    /* WHAT YOU ARE APPROVING stands above Why it waits (Discover stage 8) */
    return apWhatHtml(r.c)+(typeof insRowsHtml==='function'?insRowsHtml(rows):'')+answer;
  }
  const [a,b]=apWhyLines(r);
  const signs=r.kind==='other'?String((r.signer&&r.signer.name)||''):r.kind==='sign'?i18t('ap_wl_you_sign'):'';
  const aw=r.kind==='other'&&typeof jlAwayOf==='function'&&r.signer?jlAwayOf(r.signer.memberId):null;
  const rows=[{ k:'why', label:i18t('ap_wl_why'), v:esc([a,b].filter(Boolean).join(' \u00b7 ')) },
    ...(signs?[{ k:'signs', label:i18t('jl_ap_signs_h'), v:esc(signs)+(aw&&aw.to?`<span class="sub">${esc(i18t('jl_ap_back_sub',{day:jlDayWord(apDayAfter(aw.to))}))}</span>`:'') }]:[]),
    ...(money?[{ k:'value', label:i18t('ins_f_value'), v:esc(val) }]:[])];
  let holds=[];
  try{ if(r.kind!=='ready'){ if(typeof window.signReadinessFor==='function') holds=(window.signReadinessFor(r.c).holds||[]); else if(typeof signReadiness==='function') holds=(signReadiness(r.c,{light:!!r.c._light}).holds||[]); } }catch(_){ holds=[]; }
  const list=holds.map(h=>String(h.short||h.label||h.title||'').trim()).filter(Boolean);
  return (typeof insRowsHtml==='function'?insRowsHtml(rows):'')+apSignRuleHtml(r, acts)+(list.length?insSecHtml(i18t('ins_sg_sec'),'',`<ul class="ins-log ins-holds">${list.slice(0,3).map(t=>`<li><span class="t" title="${esc(t)}">${esc(t)}</span></li>`).join('')}</ul>${
    list.length>3?`<p class="ins-note">${esc(i18tn('ins_more_asks',list.length-3,{n:list.length-3}))}</p>`:''}`,'ins-lead'):'');
}
/* ---- WHAT YOU ARE APPROVING (Discover stage 8, owner 25 Oct 2026) ----
   One card for an approver who is not a lawyer, drawn where an approval is
   decided (this panel, above Why it waits; the Before-you-sign rule stop). A
   READING of what HaTi already keeps — never a write, nothing invented:
     the money and when it ends (only where the reader may see values);
     up to three departures from our standards, each with its sentence (the
       standards check, c.playbook — or "not checked yet" said);
     what we asked for and what we gave (the settled changes, counted);
     if you do nothing (only from what is true: nothing is signed without it);
     and the plain-English brief, kept (free) or asked on a press (one call,
       said) — any approver of this contract may press (the server's
       briefAsker). Approve and Refuse do not move. */
const AP_WHAT_DEPARTURES = 3;
function apWhatParts(c){
  const out = { money:'', ends:'', dep:[], depMore:0, depUnread:false, asked:null, brief:'', briefKept:false };
  if(!c) return out;
  if(!(typeof canViewValues==='function'&&!canViewValues())){
    let cur=''; try{ cur=(typeof contractCurrency==='function')?contractCurrency(c):''; }catch(_){ cur=''; }
    if(Number(c.value)>0&&typeof fmtMoneyShortIn==='function') out.money=fmtMoneyShortIn(Number(c.value),cur);
  }
  if(/^\d{4}-\d{2}-\d{2}/.test(String(c.expiry||''))) out.ends=String(c.expiry).slice(0,10);
  const V=(c.playbook&&Array.isArray(c.playbook.verdicts))?c.playbook.verdicts:null;
  if(V){
    const off=V.filter(v=>v&&(v.status==='deviation'||v.status==='missing'));
    off.sort((a,b)=>(b.escalate?1:0)-(a.escalate?1:0));
    out.dep=off.slice(0,AP_WHAT_DEPARTURES); out.depMore=Math.max(0,off.length-AP_WHAT_DEPARTURES);
  } else out.depUnread=true;
  const ch=Array.isArray(c.changes)?c.changes.filter(x=>x&&!x.withdrawn):[];
  if(ch.length){
    const ours=ch.filter(x=>x.authorSide!=='counterparty'), theirs=ch.filter(x=>x.authorSide==='counterparty');
    const got=ours.filter(x=>x.status==='accepted').length, lost=ours.filter(x=>x.status==='rejected');
    out.asked={ ours:ours.length, got, lostN:lost.length, lost:lost.map(x=>String((typeof clauseNameShown==='function'?clauseNameShown(x.clauseLabel||''):x.clauseLabel)||'').trim()).filter(Boolean).slice(0,2),
      gave:theirs.filter(x=>x.status==='accepted').length, theirs:theirs.length };
  }
  const bd=(c._brief&&c._brief.data)||(c._briefLite&&c._briefLite.data)||null;
  const ov=String((bd&&bd.overview)||'').replace(/\s+/g,' ').trim();
  /* a brief kept with no summary in it is still kept: said so, never offered again for another call */
  if(bd){ out.briefKept=true; out.brief=ov?ov.split(/(?<=[.!?])\s+/).slice(0,2).join(' '):i18t('apw_brief_empty'); }
  return out;
}
let _apWhatBusy=null;
function apWhatHtml(c){
  if(!c) return '';
  const P=apWhatParts(c);
  const row=(k,h,body)=>body?`<div class="ap-what-r" data-ap-what="${k}"><b>${esc(h)}</b><div>${body}</div></div>`:'';
  const money=P.money?esc(P.ends?i18t('apw_money_ends',{money:P.money,day:P.ends}):P.money):(P.ends?esc(i18t('apw_ends',{day:P.ends})):'');
  const dep=P.depUnread?esc(i18t('apw_dep_unread'))
    :!P.dep.length?esc(i18t('apw_dep_none'))
    :`<ul class="ap-what-dep">${P.dep.map(v=>`<li><span>${esc(v.category||'')}: ${esc(i18t(v.status==='missing'?'apw_dep_missing':'apw_dep_off'))}</span>${v.quote?`<q>${esc(String(v.quote).slice(0,220))}</q>`:''}</li>`).join('')}</ul>${P.depMore?`<small>${esc(i18tn('apw_dep_more',P.depMore,{n:P.depMore}))}</small>`:''}`;
  const A=P.asked;
  const asked=A?esc([A.ours?i18t('apw_asked_ours',{n:A.ours,got:A.got}):'',A.lost.length?i18t('apw_asked_lost',{what:A.lost.join(', ')}):'',A.theirs?i18t('apw_asked_gave',{n:A.theirs,gave:A.gave}):''].filter(Boolean).join(' ')):'';
  const busy=_apWhatBusy===String(c.id);
  /* HIS WORDS IN HIS CARD (the owner picked "Jambo's card", 26 Oct 2026): the
     plain-words reading ran as a paragraph among the facts and was missed. One
     builder dresses it here and on the party's panel; the facts stay plain
     rows under it, so the card is the only one on the panel and carries. */
  const brief=P.briefKept
    ? jamboSayCardHtml({ who:i18t('apw_k_plain'), text:P.brief, attrs:' data-ap-what-say' })
    : jamboSayAskHtml({ attrs:' data-ap-what-say',
        body:`<p>${esc(i18t('apw_brief_none'))}</p>`,
        foot:`<button type="button" class="ui-btn ui-btn-sm" data-ap-what-brief="${esc(c.id)}"${busy?' disabled':''}>${esc(i18t(busy?'apw_brief_busy':'apw_brief_ask'))}</button><small>${esc(i18t('apw_brief_cost'))}</small>` });
  return `<section class="ins-sec ap-what" data-ap-what-for="${esc(c.id)}"><h3>${esc(i18t('apw_h'))}</h3>
    ${brief}${row('money',i18t('apw_k_money'),money)}${row('dep',i18t('apw_k_dep'),dep)}${row('asked',i18t('apw_k_asked'),asked)}${row('nothing',i18t('apw_k_nothing'),esc(i18t('apw_nothing')))}</section>`;
}
/* THE BRIEF'S ONE DOOR (runContractBrief, js/ai.js): this page spends nothing of its own; the press goes through
   the one writer every other brief goes through, and the server's briefAsker lets an approver of THIS contract ask */
async function apWhatBrief(id){
  const c=(typeof getContract==='function')?getContract(id):null; if(!c||_apWhatBusy||typeof runContractBrief!=='function') return;
  _apWhatBusy=String(id); apWhatRepaint(c);
  try{
    const r=await runContractBrief(c,{ quiet:true });
    if(r&&r.error){ if(typeof toast==='function') toast(i18t('apw_brief_err',{msg:r.error}),'err'); }
    else if(r&&typeof toast==='function') toast(i18t('apw_brief_done'),'ok');
  }finally{ _apWhatBusy=null; apWhatRepaint(c); }
}
function apWhatRepaint(c){
  document.querySelectorAll(`[data-ap-what-for="${CSS.escape(String(c.id))}"]`).forEach(el=>{
    const t=document.createElement('div'); t.innerHTML=apWhatHtml(c); const n=t.firstElementChild; if(n) el.replaceWith(n); });
}
if(typeof document!=='undefined'&&!document._apWhatWired){
  document._apWhatWired=true;
  document.addEventListener('click',e=>{ const b=e.target&&e.target.closest?e.target.closest('[data-ap-what-brief]'):null; if(!b) return; e.preventDefault(); apWhatBrief(b.getAttribute('data-ap-what-brief')); });
}
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
  /* THE APPROVAL'S PANEL DRAWS NO DOORS (round 15 as drawn, owner's "build
     all the gaps", 18 Oct 2026 — the picked drawing over the 12 Oct "two doors
     on every list panel"): the head goes straight into Why it waits; "Open
     Before you sign" is its way to the paper. A signature's panel keeps them. */
  const open=tab==='approvals'?[]:insDoorActs(r.c);
  if(tab==='approvals' && r.done) return [
    ...(apMayUndo(r)?[{ k:'undo', label:i18t('ap_pg_undo'), title:i18t('ap_pg_undo_title'), run:c=>apUndo(c.id) }]:[]),
    { k:'gate', label:i18t('ap_pg_open_signing'), title:i18t('ap_pg_gate_title'), run:c=>apOpenSigning(c.id) },
    ...open,
  ];
  if(tab==='approvals' && apMayDecide(r)){
    /* "Approve for Jonas · Refuse… · Open Before you sign" (round 15): the
       same answers, the button saying whom it is for; drawn in the panel's
       "Your answer" section (inBody), the doors stay in its head */
    const fw=apForWho(r), first=fw?String(fw.name).split(/\s+/)[0]:'';
    return [
      { k:'approve', kind:'accent', inBody:true, label:fw?i18t('jl_ap_approve_for',{who:first}):i18t('ap_pg_approve'), title:i18t('ap_pg_approve_title'), run:c=>apDecide(c.id,'approved') },
      { k:'refuse', inBody:true, label:i18t('jl_ap_refuse'), title:i18t('ap_pg_refuse_title'), run:c=>apDecide(c.id,'refused') },
      { k:'gate', inBody:true, label:i18t('ap_pg_open_signing'), title:i18t('ap_pg_gate_title'), run:c=>apOpenSigning(c.id) },
      ...open,
    ];
  }
  const lead=tab==='approvals'
    ? { k:'gate', kind:'accent', label:r.mine?i18t('ap_pg_open_gate'):i18t('ap_pg_open'), title:i18t('ap_pg_gate_title'), run:c=>apOpenSigning(c.id) }
    : { k:'sign', kind:'accent', label:i18t('ap_pg_open_signing'), title:i18t('ap_pg_sign_title'), run:c=>apOpenSigning(c.id, r.kind==='other'?'road':'sign') };
  /* a colleague's signature while they are away: the door rides Jambo's
     sentence about the rule (apSignRuleHtml), not the head */
  if(tab!=='approvals'&&apSignAway(r)) lead.inBody=true;
  return [lead, ...open];
}
/* A SIGNER WHO IS AWAY (round 15's notes; rule 7b, JAMBO GUIDES THROUGH THE
   RULES): only they can sign — a stand-in answers approvals and reviews,
   never a signature (awayCovers) — so Jambo says the rule and the proper
   step if it cannot wait: another signer named on Before you sign, before
   anyone has signed (signingLocked); his sentence carries that door. */
function apSignAway(r){
  if(!r||r.kind!=='other'||!r.signer||typeof jlAwayOf!=='function') return null;
  const aw=jlAwayOf(r.signer.memberId);
  return aw&&aw.to?aw:null;
}
function apSignRuleHtml(r, acts){
  const aw=apSignAway(r); if(!aw) return '';
  const who=String((r.signer&&r.signer.name)||'').split(/\s+/)[0]||String((r.signer&&r.signer.name)||'');
  let shut=false; try{ shut=(typeof signingLocked==='function')&&!!signingLocked(r.c); }catch(_){ shut=false; }
  const door=(acts||[]).filter(a=>a&&a.inBody&&a.k==='sign');
  return `<section class="ins-sec jl-answer jl-sign-rule" data-jl-sign-rule><h3>${esc(i18t('jl_ap_sign_rule_h'))}</h3><p class="ins-note jl-rec">${
    esc(i18t(shut?'jl_ap_sign_rule_shut':'jl_ap_sign_rule',{who,day:jlDayWord(apDayAfter(aw.to))}))}</p>${
    door.length?`<div class="ins-acts">${door.map(insActBtnHtml).join('')}</div>`:''}</section>`;
}
function apApprovedPillHtml(){
  return `<span class="reg-stg" style="color:var(--st-green-fg)"><i style="background:var(--st-green-dot)"></i>${esc(i18t('ap_pg_approved'))}</span>`;
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
/* SIGNATURES THAT WAIT ON A COLLEAGUE (round 15, "One worklist" as drawn:
   "Sara signs", "Jonas signs · back Friday" under Waiting on others): the
   reader's own contracts — owned, or led at the desk — whose approvals are
   done and whose next signer is somebody else on our side. Nothing here
   counts on the door: the door counts what is yours (approvalsDoorCount). */
function apOtherSignRows(){
  const me=(typeof currentUser==='function')?currentUser():null; if(!me) return [];
  const cs=(state.contracts||[]).filter(c=>c&&!c.archived&&!c._codeNamed&&c.status!=='Signed'&&c.status!=='Declined'
    &&!(window.signRouteOf&&signRouteOf(c)==='outside'));
  const mineOwn=c=>{ try{ if(c.owner&&c.owner.id!=null&&String(c.owner.id)===String(me.id)) return true;
    const l=(typeof deskLead==='function')?deskLead(c):null; return !!(l&&l.id!=null&&String(l.id)===String(me.id)); }catch(_){ return false; } };
  const out=[];
  cs.forEach(c=>{
    if(!mineOwn(c)||typeof nextSigner!=='function') return;
    let ns=null; try{ ns=nextSigner(c); }catch(_){ ns=null; }
    if(!ns||ns.party==='counterparty'||ns.signed) return;
    if((ns.memberId&&String(ns.memberId)===String(me.id))||(ns.email&&me.email&&String(ns.email).toLowerCase()===String(me.email).toLowerCase())) return;
    let st=null; try{ st=(typeof approvalState==='function')?approvalState(c):null; }catch(_){ st=null; }
    if(st&&st.required&&st.next) return;                       /* an approval still waits: its own row says so */
    let n=0; try{ n=(window.signReadinessFor?signReadinessFor(c):signReadiness(c,{ light:!!(c._light&&!c._loaded) })).n||0; }catch(_){ n=0; }
    out.push({ c, kind:'other', n, signer:ns, idle:apSignIdle(c, st) });
  });
  return out;
}
/* HOW LONG A SIGNATURE HAS WAITED (round 15 draws "Sara signs · 1 day",
   "4 days"): since the last yes or the last signature on the record, else
   since the last thing the trail holds (the light list carries it as
   _lastAuditAt) — the one reading for every signature row, the reader's own
   too. Nothing on the record at all is said as none (null → "—"), never
   guessed. */
function apSignIdle(c, st0){
  if(!c) return null;
  let st=st0; if(st===undefined){ try{ st=(typeof approvalState==='function')?approvalState(c):null; }catch(_){ st=null; } }
  const at=x=>{ const t=Date.parse(x); return Number.isFinite(t)?t:null; };
  const yes=[...((st&&st.chain)||[]).filter(x=>x&&x.status==='approved'&&x.at).map(x=>x.at),
    ...((c.signatures||[]).filter(x=>x&&x.at).map(x=>x.at))].map(at).filter(t=>t!=null);
  let since=yes.length?Math.max(...yes):null;
  if(since==null){
    const trail=Array.isArray(c.audit)?c.audit:[];
    const last=trail.length?trail[trail.length-1]:null;
    since=at(c._lastAuditAt)??at(last&&last.at);
  }
  return since==null?null:Math.max(0,Math.floor((Date.now()-since)/86400000));
}
function apWorkRows(){
  const live=apApprovalRows(), ap=apRowsShown(live), sg=apSignatureRows();
  const rows=[...ap.map(r=>Object.assign({},r,{ type:'approval' })), ...sg.map(r=>Object.assign({},r,{ type:'signature' }))];
  const yours=rows.filter(r=>r.type==='signature'||r.mine||r.done||(r.own&&r.notAsked));
  const taken=new Set(rows.map(r=>r.c.id));
  const others=[...rows.filter(r=>!yours.includes(r)),
    ...apOtherSignRows().filter(r=>!taken.has(r.c.id)).map(r=>Object.assign({},r,{ type:'signature' }))];
  apSortRows(yours); apSortRows(others);
  return { yours, others, rows:[...yours, ...others], live, sg };
}
/* THE LIST'S SORT (round 15 drew it on the card's head; Part 8 moved it to
   the right end of the list head's chip row): within each group, the longest
   wait first (the drawing's order), or by value, or by reference. Kept
   across a refresh with the rest of the list's spot (apPlace). */
let _apSort='wait';
const AP_SORTS=['wait','value','ref'];
const AP_SORT_WORDS={ wait:'jl_ap_sort_wait', value:'jl_ap_sort_value', ref:'jl_ap_sort_ref' };
function apSortRows(list){
  const k=AP_SORTS.includes(_apSort)?_apSort:'wait';
  const val=r=>{ try{ return (typeof fxHomeValue==='function')?Number(fxHomeValue(r.c))||0:Number(r.c.value)||0; }catch(_){ return 0; } };
  const ref=r=>String((window.contractRef?contractRef(r.c):r.c.id)||'');
  const by={ wait:(a,b)=>(Number(b.idle)||0)-(Number(a.idle)||0), value:(a,b)=>val(b)-val(a), ref:(a,b)=>ref(a).localeCompare(ref(b)) }[k];
  if(by) list.sort(by);
  return list;
}
/* ═══ THE LIST HEAD, THE LEGORA WAY (Part 8: the owner picked "The Legora
   way" for every list page, 21 Oct 2026, and answered "tabs only" for this
   page: ONE plain table, no group headings) ═══════════════════════════════
   The page's head is the shared one (js/views/listhead.js): a box to search
   or ask in, the views as tabs, "+ Filter", the sort at the chip row's end,
   and under the list "1–n of n". THE TABS DO WHAT THE GROUP ROWS DID: All ·
   Yours to answer · Waiting on others, each counted from the ONE reading
   (apWorkRows) with every other cut held; under All the rows that wait on
   the reader come first (apWorkRows' own order). The filters are read off
   the rows on the list — Kind, Stream, Whose turn — and one is offered only
   where its values split the rows. The page keeps its spot across a refresh
   (apPlace / apPlacePut, PLACE_PARTS.approvals). */
const AP_VIEWS=[['all','reg_tab_all'],['yours','ap_wl_yours'],['others','ap_wl_others']];
const AP_F_DEF={ kind:'all', stream:'all', turn:'all' };
let _apView='all', _apF=Object.assign({},AP_F_DEF), _apQ='';
/* the list at rest: All, no filter, no words */
function apListAtRest(){
  _apView='all'; _apF=Object.assign({},AP_F_DEF); _apQ='';
  if(typeof lhBoxSet==='function') lhBoxSet('approvals','');
}
/* THE WHOLE LIST, READ ONCE PER TURN: the head's tabs and filters and the
   rows under them read the same answer; a paint of the page reads it fresh */
let _apBookMemo=null;
function apBook(){
  if(!_apBookMemo){ _apBookMemo=apWorkRows(); Promise.resolve().then(()=>{ _apBookMemo=null; }); }
  return _apBookMemo;
}
const apKindOf=r=>r&&r.type==='signature'?'signature':'approval';
const apStreamOf=r=>String((r&&r.c&&r.c.folder)||'');
function apStreamName(id){
  const f=(typeof FOLDERS!=='undefined'&&FOLDERS)?FOLDERS[id]:null;
  return (typeof STREAM_SHORT!=='undefined'&&STREAM_SHORT&&STREAM_SHORT[id])||(f&&f.name)||String(id||'—');
}
/* the words a row carries on the screen: its reference, the party, the
   agreement, why it waits, whose turn and its kind */
function apRowWords(r){
  const ref=(typeof contractRef==='function')?contractRef(r.c):r.c.id;
  let why=[]; try{ why=apWhyLines(r); }catch(_){ why=[]; }
  return [ref, r.c.id, r.c.counterparty, r.c.name, ...why, apTurnText(r), i18t(apKindOf(r)==='signature'?'ap_wl_kind_sig':'ap_wl_kind_appr')]
    .filter(Boolean).join(' ').toLowerCase();
}
/* WHOSE TURN AS A CODE — the filter's value, kept across a refresh: never the
   translated, day-dependent words apTurnText says ("You", "Anna signs · back
   Friday"), which a language switch or the next day would stop matching (the
   language rule). One branch per branch of apTurnText, so the rows it groups
   are the rows its words group. */
function apTurnKey(r){
  if(!r) return '';
  const idOf=(id,name)=>String(id!=null&&id!==''?id:(name||''));
  if(r.type==='signature'){
    if(r.kind==='other'){ const s=r.signer||{}; return 'signs:'+idOf(s.memberId, s.name); }
    return r.kind==='sign'?'you-sign':'you';
  }
  if(r.done) return 'approved';
  if(r.mine){ const fw=typeof apForWho==='function'?apForWho(r):null; return fw?'you-for:'+idOf(fw.id, fw.name):'you'; }
  if(r.notAsked) return 'you-send';
  let a=null; try{ a=r.st&&r.st.next&&r.st.next.approver; }catch(_){ a=null; }
  if(a&&a.kind==='member') return 'waits:m:'+idOf(a.id, a.name);
  if(a&&a.role) return 'waits:r:'+String(a.role);
  return 'waits:'+String(r.waitsOn||'');
}
/* ONE READING OF WHAT THE LIST SHOWS: the whole list (W), and a pass that
   cuts it by a view, the filters and the words — every tab's number and
   every filter's count is this pass with one part swapped */
function apListNow(){
  const W=apBook();
  const yours=new Set(W.yours);
  /* Whose turn is matched by its CODE (apTurnKey); its words are the label only */
  const turnWords=new Map();
  const meta=new Map(W.rows.map(r=>{ const turn=apTurnKey(r); if(!turnWords.has(turn)) turnWords.set(turn, apTurnText(r));
    return [r,{ kind:apKindOf(r), stream:apStreamOf(r), turn, words:null }]; }));
  const hit=(r,q)=>{ const w=String(q||'').trim().toLowerCase(); if(!w) return true;
    const m=meta.get(r); if(m.words==null) m.words=apRowWords(r);
    return w.split(/\s+/).every(t=>m.words.includes(t)); };
  const pass=(r,o)=>{ const f=o.f||AP_F_DEF, m=meta.get(r);
    if(o.view==='yours'&&!yours.has(r)) return false;
    if(o.view==='others'&&yours.has(r)) return false;
    for(const k of Object.keys(AP_F_DEF)) if(f[k]!=='all'&&m[k]!==f[k]) return false;
    return hit(r,o.q); };
  const now={ view:_apView, f:_apF, q:_apQ };
  return { W, meta, turnWords, pass, now, rows:W.rows.filter(r=>pass(r,now)) };
}
/* THE TABS: the rows each press shows, every other cut held. All carries
   what the card's head used to say: what the list holds, and that a wait
   turns late after seven days. */
function apTabs(L0){
  const L=L0||apListNow();
  const late=i18tn('jl_ap_late_after',AP_LATE_DAYS,{n:AP_LATE_DAYS});
  return AP_VIEWS.map(([k,key])=>({ k, label:i18t(key), keep:k==='all',
    n:L.W.rows.filter(r=>L.pass(r,Object.assign({},L.now,{ view:k }))).length,
    title:k==='all'?`${i18t('ap_wl_title')} \u00b7 ${late}`:'' }));
}
/* THE FILTERS, read off the rows the list holds with every other cut held:
   a value that leaves nothing is not offered, and a filter whose rows all
   carry one value (it would narrow nothing) is not offered until chosen */
function apFilters(L0){
  const L=L0||apListNow();
  const label={ kind:i18t('ap_wl_kind'), stream:i18t('reg_chip_stream'), turn:i18t('ap_wl_turn') };
  const word={ kind:v=>i18t(v==='signature'?'ap_wl_kind_sig':'ap_wl_kind_appr'), stream:apStreamName, turn:v=>L.turnWords.get(v)||v };
  return Object.keys(AP_F_DEF).map(k=>{
    const rest=L.W.rows.filter(r=>L.pass(r,Object.assign({},L.now,{ f:Object.assign({},L.now.f,{ [k]:'all' }) })));
    const n=new Map(); rest.forEach(r=>{ const v=L.meta.get(r)[k]; if(v) n.set(v,(n.get(v)||0)+1); });
    const cur=_apF[k], applied=cur!=='all';
    /* a chosen value the list no longer holds keeps its own words on its chip */
    if(applied&&!n.has(cur)) n.set(cur,0);
    const opts=(!applied&&n.size<2)?[]:[...n].map(([v,c])=>[v,word[k](v),c]);
    return { k, label:label[k], cur, def:'all', opts };
  });
}
function apSortHtml(){
  const sortOpts=AP_SORTS.map(k=>`<option value="${k}"${(_apSort===k)?' selected':''}>${esc(i18t(AP_SORT_WORDS[k]))}</option>`).join('');
  return (typeof regSortIconHtml==='function')?regSortIconHtml(sortOpts,'ap-sort'):'';
}
/* the page's spec for the shared head, registered at its own render time */
function apHeadRegister(){
  if(typeof lhRegister!=='function') return null;
  const keep=()=>{ if(typeof placeSave==='function') placeSave(); };
  return lhRegister('approvals',{
    noun:'approvals',
    total:()=>apBook().rows.length,
    q:()=>_apQ,
    setQuery:w=>{ _apQ=String(w==null?'':w); apPaintList(); keep(); },
    boxId:'ap-q',
    tabAttr:'data-ap-view',
    tabsLabel:i18t('ap_wl_title'),
    tabs:()=>apTabs(),
    tabNow:()=>_apView,
    tab:k=>{ _apView=AP_VIEWS.some(v=>v[0]===k)?k:'all'; renderApprovalsPage(); keep(); },
    filters:()=>apFilters(),
    apply:patch=>{ Object.keys(patch||{}).forEach(k=>{ if(k in AP_F_DEF) _apF[k]=String(patch[k]==null?'all':patch[k])||'all'; }); renderApprovalsPage(); keep(); },
    right:()=>apSortHtml(),
  });
}
/* A REFRESH LANDS AT THE SAME SPOT (the owner's rule; PLACE_PARTS.approvals):
   the tab, the filters, the words and the sort. The chosen row stays per
   sitting, as before (two people's screens never open on one contract). */
function apPlace(){ return { view:_apView, f:Object.assign({},_apF), q:_apQ, sort:_apSort }; }
function apPlacePut(p){
  if(!p||typeof p!=='object') return;
  _apView=AP_VIEWS.some(v=>v[0]===p.view)?p.view:'all';
  _apF=Object.assign({},AP_F_DEF);
  if(p.f&&typeof p.f==='object') Object.keys(AP_F_DEF).forEach(k=>{ if(p.f[k]!=null&&p.f[k]!=='') _apF[k]=String(p.f[k]); });
  _apQ=p.q?String(p.q):'';
  _apSort=AP_SORTS.includes(p.sort)?p.sort:'wait';
}
/* LAND ON IT: a door that names one row (the directory's "waiting on",
   Home's sign door, Settings' stand-in) arrives on it drawn — a tab, a
   filter or words that would hide it are put back at rest first; a row the
   list does not hold changes nothing */
function apShowRow(id){
  const q=String(id==null?'':id); if(!q) return false;
  let L=null; try{ L=apListNow(); }catch(_){ return false; }
  if(!L.W.rows.some(r=>String(r.c.id)===q)||L.rows.some(r=>String(r.c.id)===q)) return false;
  apListAtRest();
  return true;
}
/* the seat a row's panel is drawn for: an approval's or a signature's */
function apRowTab(r){ return r&&r.type==='signature'?'signatures':'approvals'; }
/* WHY IT WAITS — the rule, or what stands before the signature */
/* WHY IT WAITS, IN TWO LINES (round 15 as drawn): "Jonas's yes before
   signing / Erik's contracts need it", "Over SEK 2 M / Sara approves",
   "Ready to sign / nothing in the way", "Erik approved 14 Oct / ready to sign" */
function apWhyLines(r){
  if(r.type==='signature'){
    if(r.kind==='ready') return [i18t('ap_pg_ready_sign',{who:r.by||r.c.counterparty||''}), ''];
    let st=null; try{ st=(typeof approvalState==='function')?approvalState(r.c):null; }catch(_){ st=null; }
    const yes=((st&&st.chain)||[]).filter(x=>x&&x.status==='approved'&&x.at).sort((a,b)=>String(a.at).localeCompare(String(b.at))).pop();
    const ready=r.n?i18tn('jl_ap_settle',r.n,{n:r.n}):i18t('jl_ap_ready');
    if(yes&&yes.by) return [i18t('jl_ap_approved_on',{who:String(yes.by).split(/\s+/)[0],day:(typeof regDotDate==='function'?regDotDate(String(yes.at).slice(0,10)):String(yes.at).slice(0,10))}), r.n?ready:i18t('jl_ap_ready_l2')];
    return [r.n?ready:i18t('jl_ap_ready_l1'), r.n?'':i18t('jl_ap_nothing')];
  }
  if(r.ruleSub){
    const whose=(typeof contractOwnerName==='function')?(contractOwnerName(r.c)||''):'';
    return [r.rule, whose?i18t('jl_ap_whose',{who:String(whose).split(/\s+/)[0]}):r.ruleSub];
  }
  return [r.rule, !r.waitsOn?'':apApproverMe(r)?i18t('jl_ap_you_approve'):i18t('jl_ap_approves',{who:apWaitsShort(r)})];
}
/* WHO IT WAITS ON, AS THE LIST SAYS IT (round 15: "Sara approves", Whose turn
   "Sara" — the first name, as "Sara signs"): a named colleague by their first
   name, a role ("an admin", "the legal approver") whole */
/* THE READER IS "YOU" WHEREVER THE PAGE NAMES THEM (round 15: Whose turn
   "You", Lead "You"): the next step's named approver, or a named approval's,
   is the person reading — never said in the third person */
function apApproverMe(r){
  const me=(typeof currentUser==='function')?currentUser():null; if(!me||!r) return false;
  try{ const a=r.st&&r.st.next&&r.st.next.approver; if(a&&a.kind==='member'&&a.id!=null&&String(a.id)===String(me.id)) return true; }catch(_){}
  try{ if(r.ruleSub){ const sa=apSaWaiting(r.c); const id=sa&&sa.req&&sa.req.approverId; if(id&&String(id)===String(me.id)) return true; } }catch(_){}
  return false;
}
function apWaitsShort(r){
  const w=String((r&&r.waitsOn)||'');
  let member=false; try{ const nx=r&&r.st&&r.st.next; member=!!(nx&&nx.approver&&nx.approver.kind==='member'); }catch(_){ member=false; }
  return member?(w.split(/\s+/)[0]||w):w;
}
function apWhyHtml(r){
  const [a,b]=apWhyLines(r);
  return `<span class="ap-name" title="${esc(a)}">${esc(a)}</span>${b?`<span class="ap-sub" title="${esc(b)}">${esc(b)}</span>`:''}`;
}
/* WHOM THE READER ANSWERS FOR (round 15: "You · for Jonas", "Approve for
   Jonas"): the colleague they stand in for on this approval today — the
   rule's named member, or a named approval's approver or backup — or null
   where they answer as themself. When You're Away's own readings. */
function apForWho(r){
  if(!r||r.type!=='approval'||!r.mine||r.done) return null;
  const me=(typeof currentUser==='function')?currentUser():null; if(!me) return null;
  let d=null; try{ d=(typeof approvalDecidableNow==='function')?approvalDecidableNow(r.c):null; }catch(_){ d=null; }
  if(!d) return null;
  try{
    if(d.kind==='rule') return (typeof approverForOf==='function')?approverForOf(d.step.approver, me):null;
    const req=d.row&&d.row.req;
    if(req&&typeof saMayDecide==='function'&&saMayDecide(req, me)==='deputy'&&typeof awayForOf==='function')
      return awayForOf(me, req.approverId)||awayForOf(me, req.backupId);
  }catch(_){}
  return null;
}
/* WHOSE TURN — you, or who the approval waits on */
function apTurnText(r){
  if(r.type==='signature'){
    if(r.kind==='other'){ const nm=String((r.signer&&r.signer.name)||'').split(/\s+/)[0]||'\u2014';
      const aw=(typeof jlAwayOf==='function'&&r.signer)?jlAwayOf(r.signer.memberId):null;
      return i18t('jl_ap_signs',{who:nm})+(aw&&aw.to?' \u00b7 '+i18t('jl_ap_back',{day:jlDayWord(apDayAfter(aw.to))}):''); }
    return i18t(r.kind==='sign'?'ap_wl_you_sign':'ap_wl_you');
  }
  if(r.done) return i18t('ap_pg_approved');
  if(r.mine){ const fw=typeof apForWho==='function'?apForWho(r):null; return fw?i18t('jl_ap_you_for',{who:String(fw.name).split(/\s+/)[0]}):i18t('ap_wl_you'); }
  if(r.notAsked) return i18t('ap_wl_you_send');
  return apWaitsShort(r)||'—';
}
/* back the day after the last day away */
function apDayAfter(iso){ const d=new Date(String(iso).slice(0,10)+'T12:00:00'); if(isNaN(d)) return String(iso||''); d.setDate(d.getDate()+1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
/* the turn as drawn: "You" and a small "for Jonas" beside it */
function apTurnHtml(r){
  const t=apTurnText(r);
  const fw=r.type==='approval'&&r.mine&&!r.done?apForWho(r):null;
  if(!fw) return esc(t);
  return `${esc(i18t('ap_wl_you'))} <span class="ap-for" title="${esc(t)}">${typeof icon==='function'?icon('user','ap-for-ic'):''}${esc(i18t('jl_for',{who:String(fw.name).split(/\s+/)[0]}))}</span>`;
}
/* which of Kind · Why it waits · Whose turn say the same in every row on screen (two rows or more) */
function apSameCols(rows){
  const L=rows||[];
  if(L.length<2) return { kind:false, why:false, turn:false };
  const one=f=>new Set(L.map(f)).size===1;
  return { kind:one(r=>r.type), why:one(r=>apWhyLines(r).join(' \u00b7 ')), turn:one(r=>apTurnText(r)) };
}
/* the one line above the table that says, once, what every row shares: "All 16 wait on you. Each: an
   approval · Value ≥ KES 5M · an Admin approves." Nothing is drawn when no column stepped out. */
function apSameLineHtml(rows, same){
  const L=rows||[], r=L[0];
  if(!r||!(same.kind||same.why||same.turn)) return '';
  const lead=same.turn?(L.every(x=>x.mine&&!x.done)?i18t('ap_same_you',{n:L.length}):i18t('ap_same_turn',{n:L.length,turn:apTurnText(r)})):i18t('ap_same_all',{n:L.length});
  const each=[same.kind?i18t(r.type==='signature'?'ap_wl_kind_sig':'ap_wl_kind_appr'):'',same.why?apWhyLines(r).filter(Boolean).join(' \u00b7 '):''].filter(Boolean).join(' \u00b7 ');
  return `<div class="ap-same" data-ap-same><b>${esc(lead)}</b>${each?` ${esc(i18t('ap_same_each',{what:each}))}`:''}</div>`;
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
  /* words typed in the head's box redraw the rows only (the page's panel
     stands): a panel already painted on the chosen row is left as it is,
     his conversation too; a page drawn afresh brings a fresh panel */
  const host=document.getElementById('ins-panel');
  const same=!!(host&&host._ins&&(host.getAttribute('data-ins-id')||'')===String(id||''));
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
    const acts=apInsActs(tab,r);
    const fw=r?apForWho(r):null;
    /* JAMBO'S PANEL (round 15, "One worklist" as drawn): "Approval" or
       "Signature", the stand-in's "for Jonas" beside the party, the facts as
       rows and "Your answer"; anything else owed is the Needs you section */
    insPaintPanel({ seat, c:r?r.c:null, acts, lead:apLeadJlHtml(tab,r,acts), moveSuffix:false,
      statusBeside:true,
      statusHtml:done?apApprovedPillHtml():fw?apForPillHtml(fw):null,
      needsHtml:!r?null:done?apDoneLineHtml():null,
      needsSkip:skip,
      order:['lead','reads'],
      empty:i18t('ap_wl_none'),
      jlWord:i18t(tab==='signatures'?'jl_w_signature':'jl_w_approval'),
      jlHome:i18t('nav_approvals'),
      jlPh:i18t('jl_ph_list'),
      jlSay:()=>apSay(rows) });
  };
  if(!same) paint(id);
  if(tb) insListWire(tb,{ rowSel:'[data-ap-row]', idOf,
    onSelect:pid=>{ insSelect(seat,pid); insMarkRow(tb,'[data-ap-row]',idOf,pid); paint(pid); },
    onOpen:pid=>apOpenSigning(pid) });
}
/* "for Jonas" — a stand-in's answer says whom it is for (the pill beside the party) */
function apForPillHtml(fw){
  return `<span class="reg-stg ap-for-pill" title="${esc(i18t('jl_for',{who:fw.name}))}">${typeof icon==='function'?icon('user','ap-for-ic'):''}${esc(i18t('jl_for',{who:String(fw.name).split(/\s+/)[0]}))}</span>`;
}
/* THE PAGE IN JAMBO'S WORDS (nothing chosen): counted from the list itself,
   no AI — how many wait and on whom, the late ones, whom the reader stands
   in for. Chips: the first of yours (it chooses that row), Approval rules. */
function apSay(rows){
  const W=apWorkRows();
  const n=W.rows.length;
  if(!n) return { lines:[esc(i18t('ap_wl_none'))] };
  const parts=[W.yours.length?i18tn('ap_wl_n_yours',W.yours.length,{n:W.yours.length}):'', W.others.length?i18tn('ap_wl_n_others',W.others.length,{n:W.others.length}):''].filter(Boolean);
  const lines=[`<b>${esc(i18tn('jl_ap_say',n,{n}))}</b>${parts.length?esc(': '+parts.join(i18t('jl_and'))):''}.`];
  const late=W.rows.filter(apLate).length;
  if(late) lines.push(esc(i18tn('jl_ap_late',late,{n:late,d:AP_LATE_DAYS})));
  const cov=(typeof state!=='undefined'&&state&&state.away&&Array.isArray(state.away.covering))?state.away.covering:[];
  const today=(typeof todayISO==='function')?todayISO():'';
  cov.filter(x=>x&&(!today||(x.from<=today&&today<=x.to))).forEach(x=>{
    lines.push(esc(i18t('jl_ap_cover',{who:String(x.userName||'').split(/\s+/)[0],day:jlDayWord(x.to)}))); });
  const chips=[];
  const first=W.yours[0]||null;
  if(first) chips.push({ label:i18t('jl_ap_chip_first'), verb:i18t('jov_ask_take_v'), rest:i18t('jov_ask_ap_first_r'), run:()=>{
    /* LAND ON IT: a tab, a filter or words that hide the row are put at rest first */
    if(apShowRow(first.c.id)){ if(typeof insSelect==='function') insSelect('approvals', first.c.id); renderApprovalsPage(); }
    const tb=document.querySelector('.ap-table tbody'); const L=tb&&tb._insList;
    const row=tb&&[...tb.querySelectorAll('[data-ap-row]')].find(x=>x.getAttribute('data-ap-row')===String(first.c.id));
    if(L&&row) L.onSelect(String(first.c.id), row);
    if(typeof jlLand==='function') jlLand('row', first.c.id); } });
  if(typeof isAdmin==='function'&&isAdmin()&&typeof openSettingsAt==='function') chips.push({ label:i18t('jl_ap_chip_rules'), verb:i18t('jov_ask_open_v'), rest:i18t('jov_ask_rules_r'), run:()=>openSettingsAt('platform','approvals') });
  /* THE OVERVIEW'S FACTS (The Legora Way, owner 26 Oct 2026): each a reading this page already makes (apWorkRows,
     apLate, state.away.covering), its link the page's own door; "Decided this month" has no reading and is left out */
  const refOf=r=>(window.contractRef?contractRef(r.c):r.c.id);
  const firstTwo=L=>L.slice(0,2).map(refOf).join(', ')+(L.length>2?' '+i18tn('jov_more',L.length-2,{n:L.length-2}):'');
  const facts=[];
  if(W.yours.length) facts.push({ k:i18t('jov_ap_yours'), v:i18tn('jov_n_then',W.yours.length,{n:W.yours.length,list:firstTwo(W.yours)}), link:first?i18t('jov_ln_take'):'', run:chips[0]&&chips[0].run });
  if(W.others.length){ const who=[...new Set(W.others.map(apWaitsShort).filter(Boolean))].slice(0,3).join(', ');
    facts.push({ k:i18t('jov_ap_others'), v:i18tn('jov_n_then',W.others.length,{n:W.others.length,list:who||firstTwo(W.others)}), link:i18t('jov_ln_show'), run:()=>{ _apView='others'; renderApprovalsPage(); } }); }
  if(late){ const lr=W.rows.filter(apLate)[0];
    facts.push({ k:i18t('jov_ap_late'), v:lr?i18tn('jov_ap_late_v',late,{n:late,d:AP_LATE_DAYS,ref:refOf(lr)}):i18tn('jl_ap_late',late,{n:late,d:AP_LATE_DAYS}), need:true }); }
  cov.filter(x=>x&&(!today||(x.from<=today&&today<=x.to))).forEach(x=>{
    facts.push({ k:i18t('jov_ap_cover'), v:i18t('jl_ap_cover',{who:String(x.userName||'').split(/\s+/)[0],day:jlDayWord(x.to)}) }); });
  return { lines, chips, head:{ html:lines[0] }, facts };
}
/* THE PAGE HEAD AS DRAWN (round 15): the two counts on the title's line, and
   Approval rules at its end — an admin's door to Settings */
function apPaintHead(){
  const W=apWorkRows();
  const facts=[W.yours.length?i18tn('ap_wl_n_yours',W.yours.length,{n:W.yours.length}):'', W.others.length?i18tn('ap_wl_n_others',W.others.length,{n:W.others.length}):''].filter(Boolean).join(' \u00b7 ');
  const f=document.getElementById('page-head-facts'); if(f){ f.setAttribute('data-ap-facts',''); f.textContent=facts||i18t('ap_wl_none'); }
  const a=document.getElementById('page-head-acts');
  if(a){
    /* EVERYONE SEES IT (round 15 draws it for an Editor): an admin goes to
       the rules themselves; anyone else hears them from Jambo (apRulesSay) */
    const admin=(typeof isAdmin==='function'&&isAdmin()&&typeof openSettingsAt==='function');
    a.innerHTML=`<button type="button" class="ui-btn ap-rules" data-ap-rules>${esc(i18t('ap_pg_rules'))}</button>`;
    const b=a.querySelector('[data-ap-rules]'); if(b) b.addEventListener('click',()=>{ if(admin) openSettingsAt('platform','approvals'); else apRulesSay(); });
  }
}
/* "APPROVAL RULES" FOR SOMEBODY WHO IS NOT AN ADMIN: the rules are the
   company's and an admin sets them, so Jambo says them where the reader
   looks — each rule and who gives its yes, "you" where it is the reader —
   and his answer carries the rule's own door, Ask an admin (aiRuleDoorHtml,
   rule 7b). Read from the rules the browser already holds (approvalRules);
   nothing is spent, nothing changes. */
function apRulesSay(){
  let rules=[]; try{ rules=((typeof approvalRules==='function')?approvalRules():[])||[]; }catch(_){ rules=[]; }
  rules=rules.slice().sort((x,y)=>(x.order||99)-(y.order||99));
  const me=(typeof currentUser==='function')?currentUser():null;
  const line=r=>{ const ap=r.approver||{};
    if(ap.kind==='member'&&me&&ap.id!=null&&String(ap.id)===String(me.id)) return i18t('jl_ap_why_rule_you',{rule:r.name||''});
    let who=''; try{ who=(typeof approverLabelOf==='function')?approverLabelOf(ap):(ap.name||''); }catch(_){ who=ap.name||''; }
    return i18t('jl_ap_why_rule',{rule:r.name||'',who}); };
  const head=rules.length?i18tn('jl_ap_rules_say',rules.length,{n:rules.length}):i18t('jl_ap_rules_none');
  const door=(typeof aiRuleDoorHtml==='function')?aiRuleDoorHtml({ kind:'ask_admin', rule:'approvals' }, i18t('ap_pg_rules')):'';
  const html=`<div>${esc(head)}</div>${rules.length?`<ul class="jl-rules">${rules.map(r=>`<li>${esc(line(r))}</li>`).join('')}</ul>`:''}${door}`;
  if(typeof aiPush!=='function'||typeof renderAIFeed!=='function') return false;
  const here=(typeof jlOnScreen==='function')&&jlOnScreen();
  if(here&&typeof jlToWords==='function') jlToWords();
  aiPush('assistant',{ text:html });
  if(!here&&typeof openAI==='function') openAI(); else renderAIFeed();
  return true;
}
/* THE PAGE (Part 8, the list head the Legora way): the shared head's card
   (renderPageHeader: the name, the counts, Approval rules) with the list head
   as its lower half — the box, the tabs, "+ Filter" and the sort — then the
   list's card and Jambo's panel beside it. ONE PLAIN TABLE (the owner's
   "tabs only"): the group rows went; the tabs say who owes the next step.
   Words typed in the box repaint the list's card alone ({ listOnly:true }),
   so the head, its box and the caret stay where they are. */
function renderApprovalsPage(o){
  const listOnly=!!(o&&o.listOnly);
  if(!listOnly) _apBookMemo=null;
  apHeadRegister();
  let L=apListNow();
  /* a kept Whose turn no row of the book carries any more (answered since,
     or kept as words before it was a code) goes back to rest */
  if(_apF.turn!=='all'&&L.W.rows.length&&!L.turnWords.has(_apF.turn)){ _apF.turn='all'; L=apListNow(); }
  /* the rows on screen: the list cut by its tab, its filters and the words;
     under All the ones that wait on the reader first (apWorkRows' order) */
  const W={ rows:L.rows, all:L.W };
  const money=!(typeof canViewValues==='function'&&!canViewValues());
  /* WHICH SHAPE — asked once, recorded on the page (data-ins) so a width
     that crosses the line repaints it. */
  const INS=(typeof insFits==='function')&&insFits()&&typeof insPaintPanel==='function';
  /* the row as the list language draws it: whose turn as the mark, "party · agreement", and the grey line —
     the reference, the kind where its column stepped out, who asked and how long ago */
  const apMark=r=>(typeof listMarkHtml!=='function')?apAvHtml(r.c.counterparty)
    : r.done?listMarkHtml('green','done'):apLate(r)?listMarkHtml('ruby','late',i18t('jl_late')):r.mine?listMarkHtml('amber','part',apTurnText(r)):listMarkHtml('steel','wait',apTurnText(r));
  /* ROOM TO SPREAD (owner, 28 Oct 2026): where the list has the room, the reference and who asked are
     columns of their own (SP, listSpread below) and the days stay with Waiting, which already says them */
  let SP=false;
  const identSub=(c,r,sameKind)=>[SP?'':(window.refHtml?refHtml(c):esc(c.id)), r&&sameKind&&r.type==='signature'?esc(i18t('ap_wl_kind_sig')):'', !SP&&r&&r.who?esc(i18t('ap_row_asked_by',{ who:r.who })):'', !SP&&r&&r.idle!=null?esc(Number(r.idle)===0?i18t('home_today'):i18tn('jl_days_ago',Number(r.idle),{n:Number(r.idle)})):''].filter(Boolean).join(' \u00b7 ');
  const ident=(c,r,sameKind)=>{ const sub=identSub(c,r,sameKind);
    return `<td><div class="ap-id">${r?apMark(r):apAvHtml(c.counterparty)}<div><span class="ap-name" title="${esc((c.counterparty||'—')+' · '+(c.name||''))}">${esc(c.counterparty||'—')}<span class="ls-sep"> · </span>${esc(c.name||'')}</span>${sub?`<span class="ap-sub" title="${esc(sub.replace(/<[^>]*>/g,''))}">${sub}</span>`:''}</div></div></td>`; };
  /* the rule, a soft chip, and who decides under it (apWhyLines); a signature's sentence as it was */
  const apRuleHtml=r=>{
    if(r.type==='signature'||typeof listChipHtml!=='function') return apWhyHtml(r);
    const [a,b]=apWhyLines(r);
    return `${a?listChipHtml('steel',a):''}${b?`<span class="ap-sub" title="${esc(b)}">${esc(b)}</span>`:''}`;
  };
  const apWaitHtml=r=>{
    if(r.done) return esc(i18t('ap_pg_approved'));
    if(r.idle==null) return '—';
    const late=apLate(r), t=apWaitingText(r.idle);
    /* as drawn: the days, and "late" on the grey line under them once it is */
    return typeof listWordHtml==='function'?listWordHtml(late?'ruby':'amber', t, late?i18t('ap_row_late'):''):esc(t);
  };
  /* the drawing's room (round 15): Whose turn wide enough for "You · for
     Jonas" and "Jonas signs · back Friday", Waiting for "9 days · late" */
  /* widths measured on the words they hold (18 Oct 2026): "Signature" in its
     pill, "Jonas signs · back Wednesday", "100 days · late" — the party keeps
     the rest, 190px or more at 1366 beside Jambo's panel */
  /* 1366 beside Jambo's panel (check A1 #2): Ref gives the party 4px, and a
     party's name takes a second line rather than be cut */
  /* Value 112 so a sum is never cut (Round 1, 24 Oct 2026); the 24 come out of Why, whose words wrap */
  /* A COLUMN THAT SAYS THE SAME IN EVERY ROW STEPS OUT (Round 2, owner's yes 24 Oct 2026): Kind, Why it
     waits and Whose turn are asked of the rows on screen; where two or more rows all say one thing, the
     column goes and the fact is said once, in one line above the table (apSameLineHtml) */
  /* THE LIST LANGUAGE (owner's yes, 27 Oct 2026: the line above the table may go, "replaced by the rule chip
     on each row"): Why it waits never steps out — each row carries its rule; Kind and Whose turn still step
     out where every row says the same, the kind then said in the row's grey line and the turn by its mark.
     The reference rides the grey line, and Our standards is said in words beside the rule. */
  const same=Object.assign({}, apSameCols(W.rows), { why:false });
  /* THE LIST'S COLUMNS, ONE RULE (owner, 28 Oct 2026, listCols): the party and the wait always stand; where
     the room is short Our standards steps aside first, then Kind, Rule, Value, Whose turn; the grey line's
     Ref and Asked by are columns only where there is room for them too; a reader's own widths are kept */
  const DEFS=[{k:'name',t:i18t('reg_col_party')},
    {k:'ref',t:i18t('reg_col_ref'),w:100,spread:1},{k:'asker',t:i18t('ap_col_asked_by'),w:160,spread:1},
    ...(same.kind?[]:[{k:'kind',t:i18t('ap_wl_kind'),w:100,rank:2}]),{k:'rule',t:i18t('ap_col_rule'),w:136,rank:3},
    ...(same.turn?[]:[{k:'turn',t:i18t('ap_wl_turn'),w:188,rank:5}]),{k:'std',t:i18t('reg_col_standards'),w:124,rank:1},
    {k:'wait',t:i18t('ap_pg_waiting'),w:120},...(money?[{k:'value',t:i18t('reg_col_value'),right:true,w:112,rank:4}]:[]),
    ...(INS?[]:[{k:'acts',t:'',w:220}])];
  const FIT=(typeof listCols==='function')?listCols('approvals',DEFS,()=>apPaintList()):{ cols:DEFS.filter(d=>!d.spread), has:k=>DEFS.some(d=>d.k===k&&!d.spread), spread:false };
  SP=FIT.spread;
  const head=FIT.cols;
  const acts=r=>{
    if(r.type==='signature') return `<button type="button" class="ui-btn ui-btn-sm ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_sign_title'))}">${esc(i18t('ap_pg_open_signing'))}</button>`;
    if(r.done) return `<span class="ap-acts">${apMayUndo(r)?`<button type="button" class="ui-btn ui-btn-sm" data-ap-undo="${esc(r.c.id)}" title="${esc(i18t('ap_pg_undo_title'))}">${esc(i18t('ap_pg_undo'))}</button>`:''}<button type="button" class="ui-btn ui-btn-sm ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_gate_title'))}">${esc(i18t('ap_pg_open'))}</button></span>`;
    if(apMayDecide(r)) return `<span class="ap-acts"><button type="button" class="ui-btn ui-btn-sm ui-btn-accent" data-ap-approve="${esc(r.c.id)}" title="${esc(i18t('ap_pg_approve_title'))}">${esc(i18t('ap_pg_approve'))}</button><button type="button" class="ui-btn ui-btn-sm" data-ap-refuse="${esc(r.c.id)}" title="${esc(i18t('ap_pg_refuse_title'))}">${esc(i18t('ap_pg_refuse'))}</button><button type="button" class="ui-btn ui-btn-sm ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_gate_title'))}">${esc(i18t('ap_pg_open'))}</button></span>`;
    return `<button type="button" class="ui-btn ui-btn-sm ap-go" data-ap-open="${esc(r.c.id)}" title="${esc(i18t('ap_pg_gate_title'))}">${esc(r.mine?i18t('ap_pg_open_gate'):i18t('ap_pg_open'))}</button>`;
  };
  const cell={
    ref:r=>`<td class="ap-ref">${window.refHtml?refHtml(r.c):esc(r.c.id)}</td>`,
    asker:r=>`<td class="ap-asker"${r.who?` title="${esc(r.who)}"`:''}>${r.who?esc(r.who):'<span class="quiet">\u2014</span>'}</td>`,
    kind:r=>`<td>${apKindHtml(r)}</td>`,
    rule:r=>`<td class="ap-rule">${apRuleHtml(r)}</td>`,
    turn:r=>`<td class="ap-turn" title="${esc(apTurnText(r))}">${apTurnHtml(r)}</td>`,
    std:r=>`<td class="ap-std">${typeof stdRowWordsHtml==='function'?stdRowWordsHtml(r.c):''}</td>`,
    wait:r=>`<td class="ap-wait${r.done?' done':apLate(r)?' late':''}"${apLate(r)&&!r.done?` title="${esc(i18t('jl_late'))}"`:''}>${apWaitHtml(r)}</td>`,
    value:r=>`<td class="r mono ap-val">${apValueCell(r.c)}</td>`,
    acts:r=>`<td class="r">${acts(r)}</td>`,
  };
  const row=r=>`<tr data-ap-row="${esc(r.c.id)}" data-ap-kind="${r.type}"${INS?' tabindex="-1"':''}>
      ${ident(r.c,r,same.kind)}
      ${head.slice(1).map(h=>cell[h.k](r)).join('')}
    </tr>`;
  const n=W.rows.length, total=W.all.rows.length;
  const table=n
    ? `<table class="ap-table${INS?' ap-ins':''}" data-list-seat="approvals"><colgroup>${head.map(c=>typeof listColTag==='function'?listColTag(c):`<col${c.w?` style="width:${c.w}px"`:''}>`).join('')}</colgroup><thead><tr>${head.map(h=>`<th${h.right?' class="r"':''}>${esc(h.t)}${h.k!=='acts'&&typeof listGripHtml==='function'?listGripHtml('approvals',h.k):''}</th>`).join('')}</tr></thead><tbody>${
        W.rows.map(row).join('')}</tbody></table>`
    : `<div class="ap-empty">${esc(i18t(total?'ap_wl_none_match':'ap_wl_none'))}</div>`;
  /* THE FOOT (Part 8): "1–n of n" — every row is drawn, nothing more to show */
  const foot=n&&typeof lhFootHtml==='function'?lhFootHtml('approvals',n,n,0,{ cls:'ap-foot ap-wl-foot' }):'';
  const page=document.querySelector('#content .ap-page[data-ins-page="approvals"]');
  const sec=document.getElementById('ap-scroll');
  if(listOnly&&page&&sec&&page.getAttribute('data-ins')===(INS?'1':'0')){
    sec.innerHTML=`${table}${foot}`;
    apListWire(INS, W);
    return;
  }
  const card=`<section class="ap-card" id="ap-scroll">${table}${foot}</section>`;
  document.getElementById('content').innerHTML=`
  <div class="view-enter sap-page ap-page${INS?' is-ins':''}" data-ins-page="approvals" data-ins="${INS?'1':'0'}">
    ${typeof lhHtml==='function'?lhHtml('approvals',{ frame:'foot' }):''}
    ${INS?`<div class="ap-body is-ins">${card}<aside id="ins-panel" class="ins-panel" aria-label="${esc(i18t('ins_panel_label'))}"></aside></div>`:card}
  </div>`;
  apPaintHead();
  apListWire(INS, W);
  if(INS&&typeof insWatchWidth==='function') insWatchWidth();
  setActiveNav('approvals');
}
/* the words in the box narrow the rows: the list's card alone is drawn again */
function apPaintList(){ return renderApprovalsPage({ listOnly:true }); }
/* the list's presses: beside the panel a press selects and a second opens
   (apInsPaint); below the line each row's own buttons */
function apListWire(INS, W){
  if(INS){ apInsPaint(W.rows); return; }
  document.querySelectorAll('[data-ap-open]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); apOpenSigning(b.getAttribute('data-ap-open')); }));
  document.querySelectorAll('[data-ap-approve]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); apDecide(b.getAttribute('data-ap-approve'),'approved'); }));
  document.querySelectorAll('[data-ap-refuse]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); apDecide(b.getAttribute('data-ap-refuse'),'refused'); }));
  document.querySelectorAll('[data-ap-undo]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); apUndo(b.getAttribute('data-ap-undo')); }));
  document.querySelectorAll('[data-ap-row]').forEach(tr=>tr.addEventListener('click',()=>apOpenSigning(tr.getAttribute('data-ap-row'))));
}
/* THE SORT, AT THE CHIP ROW'S END: one listener on the document, bound once
   (the head keeps the page's own parts standing through a recount; the old
   listener on the select itself is gone) */
if(typeof document!=='undefined'&&document.addEventListener&&typeof window!=='undefined'&&!window._apSortWired){
  window._apSortWired=true;
  document.addEventListener('change',e=>{
    const s=e.target; if(!s||s.id!=='ap-sort') return;
    _apSort=AP_SORTS.includes(s.value)?s.value:'wait';
    renderApprovalsPage();
    if(typeof placeSave==='function') placeSave();
  });
}
Object.assign(window,{AP_TABS,apTab,apSetTab,apWorkRows,apRowTab,apWhyHtml,apWaitsShort,apTurnText,apKindHtml,
  apOtherSignRows,apSignIdle,apRulesSay,apApproverMe,apSignAway,apSignRuleHtml,AP_SORTS,AP_SORT_WORDS,AP_SINCE_WORDS,apSortRows,apWhyLines,apForWho,apDayAfter,apTurnHtml,apSinceLook,apAskedByText,apWhySentence,apLeadJlHtml,apForPillHtml,apSay,apPaintHead,apSaWaiting,apApprovalRows,apSignatureRows,approvalsDoorCount,renderApprovalsPage,apOpenSigning,
  apInsSeat,apLeadHtml,apInsActs,apInsPaint,apMayDecide,apDecide,apWhatHtml,apWhatParts,apWhatBrief,
  AP_LATE_DAYS,apLate,apRowsShown,apUndo,apMayUndo,apApprovedPillHtml,apDoneLineHtml,
  AP_VIEWS,AP_F_DEF,apListAtRest,apBook,apStreamName,apRowWords,apListNow,apTabs,apFilters,apSortHtml,apHeadRegister,apPlace,apPlacePut,apShowRow,apPaintList,apListWire});
