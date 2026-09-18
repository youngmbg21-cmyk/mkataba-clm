/* ============================================================
   ASK YOUR OWN LAWYER ABOUT TWO CLAUSES (upgrade 9, 18 Sep 2026)
   ============================================================
   The owner with no lawyer on staff wants his own advocate to rule on the
   liability cap and the data-protection wording — two clauses out of forty
   pages — without paying for a seat and without that advocate being able to
   touch anything else. The in-house lawyer wants the mirror of it: hand
   routine NDAs to the commercial team without handing over the redlining
   hands. It is the same missing role, asked for from two directions.

   IT IS A NARROWING OF MACHINERY THAT EXISTS, not a new subsystem. HaTi
   already has link purposes, a payload built by ALLOW-LIST rather than copied,
   a notes system with rooms, and a server that serves exactly what the row's
   purpose allows. A fifth purpose is one word on three lists and one guard.

   IT IS ITS OWN DOOR, AND THAT IS DELIBERATE. The send dialog's purpose row
   asks what THIS ROUND is for, and every answer on it goes to the
   counterparty. An adviser is a different person being asked a different
   question, and the screen has to ask which clauses — so it is an act of its
   own, on the More menu beside the memo, and it mints its share through the
   SAME route the round send uses.

   THE NARROWING IS IN THE PAYLOAD, never on their page: shareAdviceBody
   (js/core.js) emits the chosen clauses and the full wording is dropped in the
   same breath, so what an adviser is never sent is what they can never read.
   The server refuses a signature, a proposal and a template answer on this
   purpose (refuseIfAdvice); notes are the one thing it lets through, because a
   note is the whole product of the link.
   ============================================================ */

/* The clauses this contract can be asked about. clauseSegment is the product's
   ONE splitter — no second reading of what a clause is. */
function adviserClauses(c){
  if(typeof clauseSegment!=='function') return [];
  let body='';
  try{ body=(typeof docBody==='function'?docBody(c):'')||c.redlineText||''; }catch(_){ body=c.redlineText||''; }
  if(!body) return [];
  try{ return (clauseSegment(body)||[]).filter(cl=>cl&&cl.id); }catch(_){ return []; }
}
const ADVISER_MAX = 12;     /* a few clauses is the feature; the whole contract is the other link */

function adviserClauseRowHtml(cl, i){
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const name=(typeof clauseNameShown==='function')?clauseNameShown(cl):((cl&&cl.label)||('Clause '+(i+1)));
  return `<label style="display:flex;gap:9px;align-items:flex-start;padding:7px 0;border-top:1px solid var(--color-divider)">
    <input type="checkbox" class="asl-cl" value="${esc(cl.id)}" style="margin-top:3px"/>
    <span style="font-size:var(--t-meta);line-height:1.45">${esc(name)}</span></label>`;
}

async function openAdviserLink(c){
  if(!c) return;
  const cls=adviserClauses(c);
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const FLD=window.HATI_FLD, LBL=window.HATI_LBL;
  if(!cls.length){ toast(i18t('asl_no_clauses'),'warn'); return; }
  openModal(`<div style="padding:24px">
    <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:18px;margin:0 0 4px">${i18t('asl_title')}</h3>
    <p style="margin:0 0 14px;font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.5">${i18t('asl_lead')}</p>
    <label style="display:block;margin-bottom:10px"><span style="${LBL}">${i18t('asl_who')}</span>
      <input id="asl-name" style="${FLD}" maxlength="120"/></label>
    <label style="display:block;margin-bottom:10px"><span style="${LBL}">${i18t('asl_email')}</span>
      <input id="asl-email" type="email" style="${FLD}" maxlength="200"/></label>
    <div style="margin-bottom:10px"><span style="${LBL}">${i18t('asl_which')}</span>
      <div id="asl-list" style="max-height:220px;overflow:auto;border:1px solid var(--color-divider);border-radius:var(--radius);padding:0 11px">
        ${cls.map(adviserClauseRowHtml).join('')}</div>
      <span id="asl-count" style="display:block;margin-top:5px;font-size:var(--t-label);color:var(--color-neutral-600)">${i18t('asl_pick_some')}</span></div>
    <label style="display:block;margin-bottom:14px"><span style="${LBL}">${i18t('asl_ask')}</span>
      <textarea id="asl-msg" rows="3" style="${FLD};resize:vertical" maxlength="1000"></textarea></label>
    <p id="asl-err" style="margin:0 0 10px;font-size:var(--t-meta);color:var(--danger)"></p>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button id="asl-cancel" class="ui-btn">${i18t('act_cancel')}</button>
      <button id="asl-send" class="ui-btn ui-btn-primary">${i18t('asl_send')}</button>
    </div></div>`, { maxWidth:(window.DLG_W&&DLG_W.l)||'640px' });

  const picked=()=>Array.from(document.querySelectorAll('.asl-cl')).filter(b=>b.checked).map(b=>b.value);
  const paint=()=>{ const n=picked().length; const el=document.getElementById('asl-count');
    if(el) el.textContent=n?i18tn('asl_n_picked',n,{n}):i18t('asl_pick_some'); };
  document.getElementById('asl-list')?.addEventListener('change',paint);
  document.getElementById('asl-cancel')?.addEventListener('click',closeModal);
  document.getElementById('asl-send')?.addEventListener('click',async()=>{
    const err=document.getElementById('asl-err');
    const name=String(document.getElementById('asl-name')?.value||'').trim();
    const email=String(document.getElementById('asl-email')?.value||'').trim();
    const ids=picked();
    if(!email||(window.validEmail&&!validEmail(email))){ if(err) err.textContent=i18t('asl_needs_email'); return; }
    if(!ids.length){ if(err) err.textContent=i18t('asl_needs_clause'); return; }
    if(ids.length>ADVISER_MAX){ if(err) err.textContent=i18tn('asl_too_many',ADVISER_MAX,{n:ADVISER_MAX}); return; }
    const btn=document.getElementById('asl-send'); const was=btn.textContent;
    btn.disabled=true; btn.textContent=i18t('ct_working');
    try{
      const payload=buildSharePayload(c, null, currentUser(), { purpose:'advise', adviseOn:ids });
      payload.purpose='advise';
      await api('shares','POST',{ payload, channel:'email', message:String(document.getElementById('asl-msg')?.value||'').trim(),
        recipient:{ name, email }, expiryDays:30, durable:false, purpose:'advise' });
      logAudit(c,'Shared',`Sent ${ids.length} clause(s) to ${name||email} for advice`);
      persist(c);
      closeModal();
      toast(i18t('asl_sent'),'ok');
    }catch(e){ if(err) err.textContent=(e&&e.message)?String(e.message):i18t('asl_failed');
      btn.disabled=false; btn.textContent=was; }
  });
}

Object.assign(window,{ adviserClauses, adviserClauseRowHtml, openAdviserLink, ADVISER_MAX });
