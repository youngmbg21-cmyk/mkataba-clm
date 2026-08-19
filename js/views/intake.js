/* ============================================================
   THE INTAKE FRONT DOOR (W2-2, WORKORDER-gap-map.md)
   ============================================================
   The screen a colleague who may NOT draft uses to ask for a contract, and
   the queue the people who may draft work from. One view, two faces,
   decided by the reader's role — the same shape the Advice Desk already
   uses for outside customers, pointed inward.

   WHY IT IS A REQUEST AND NOT A DRAFT. The obvious build is "let a viewer
   create a Draft contract"; it is wrong twice. It would put unapproved
   paper in the register, in the counts and in everybody's lists, and it
   would hand the right to write contracts to people the workspace
   deliberately did not give it to. A request is its own record: it appears
   in no contract list, it grants nothing, and when it is declined nothing
   is left behind to tidy up.

   ASKING NEVER GRANTS EDIT RIGHTS. That is the whole feature — reach
   without permission creep — and it is why every act that produces actual
   paper still runs through canEdit and the ordinary creation path.

   THE AI IS A SUGGESTION AT THE EDITOR'S ELBOW, never an author: it reads
   the request and names the template it thinks fits, and the editor presses
   the button that creates the draft. Nothing is created without a person. */

const INTAKE_STATUS = {
  open:      { get label(){ return i18t('ik_st_open'); },      tone:'amber' },
  accepted:  { get label(){ return i18t('ik_st_accepted'); },  tone:'steel' },
  done:      { get label(){ return i18t('ik_st_done'); },      tone:'green' },
  declined:  { get label(){ return i18t('ik_st_declined'); },  tone:'ruby'  },
  withdrawn: { get label(){ return i18t('ik_st_withdrawn'); }, tone:'steel' },
};
const IK_LIVE = ['open','accepted'];
let _intake = { list:[], loaded:false };

function intakeMine(){ const me=currentUser(); return (_intake.list||[]).filter(r=>me&&r.by&&r.by.id===me.id); }
function intakeQueue(){ return (_intake.list||[]).filter(r=>IK_LIVE.includes(r.status)); }
/* ONE COUNT, and it answers for the reader's chair: an editor is told what
   is waiting to be picked up, everybody else what they themselves are still
   waiting on. A badge that counted somebody else's work would be noise. */
function intakeCount(){
  if(typeof canEdit==='function'&&canEdit()) return intakeQueue().length;
  return intakeMine().filter(r=>IK_LIVE.includes(r.status)).length;
}
async function loadIntake(){
  if(!(typeof API_MODE==='function'&&API_MODE())) return;
  try{ const r=await api('intake'); _intake.list=(r&&r.requests)||[]; _intake.loaded=true; }
  catch(e){ _intake.loaded=true; }
}

function ikChip(status){
  const s=INTAKE_STATUS[status]||INTAKE_STATUS.open;
  return `<span class="pill-x" style="background:var(--st-${s.tone}-bg);color:var(--st-${s.tone}-fg)">${esc(s.label)}</span>`;
}
function ikRowHtml(r, opts={}){
  const when=(()=>{ try{ return new Date(r.createdAt).toLocaleDateString(langLocale(),{day:'numeric',month:'short'}); }catch(_){ return ''; } })();
  const may=(typeof canEdit==='function'&&canEdit());
  const me=currentUser();
  const isMine=!!(me&&r.by&&r.by.id===me.id);
  const acts=[];
  if(may&&r.status==='open') acts.push(`<button class="ui-btn" data-ik-draft="${esc(r.id)}" style="font-size:11px;padding:4px 10px">${i18t('ik_act_draft')}</button>`);
  if(may&&r.status==='open') acts.push(`<button class="ui-btn" data-ik-decline="${esc(r.id)}" style="font-size:11px;padding:4px 10px">${i18t('ik_act_decline')}</button>`);
  if(r.contractId) acts.push(`<button class="ui-btn" data-ik-open="${esc(r.contractId)}" style="font-size:11px;padding:4px 10px">${i18t('ik_act_open')}</button>`);
  if(isMine&&IK_LIVE.includes(r.status)) acts.push(`<button class="ui-btn" data-ik-withdraw="${esc(r.id)}" style="font-size:11px;padding:4px 10px">${i18t('ik_act_withdraw')}</button>`);
  return `<article class="ik-row" style="border:1px solid var(--color-divider);border-radius:8px;background:var(--color-surface);padding:12px 14px;display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;align-items:baseline;gap:9px;flex-wrap:wrap">
      <span style="font-family:var(--font-mono);font-size:10.5px;color:var(--color-neutral-500)">${esc(r.id)}</span>
      <span style="font-size:13.5px;font-weight:600;flex:1;min-width:0">${esc(r.title)}</span>
      ${ikChip(r.status)}
    </div>
    <p style="margin:0;font-size:12px;line-height:1.55;color:var(--color-neutral-700);white-space:pre-wrap">${esc(r.need)}</p>
    <div style="font-size:11px;color:var(--color-neutral-600)">
      ${esc(i18t('ik_asked_by',{name:(r.by&&r.by.name)||'—',date:when}))}${r.counterparty?' · '+esc(r.counterparty):''}${r.folder&&FOLDERS[r.folder]?' · '+esc(FOLDERS[r.folder].name):''}
      ${r.note?`<div style="margin-top:3px;font-style:italic">${esc(r.note)}</div>`:''}
    </div>
    ${acts.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:2px">${acts.join('')}</div>`:''}
  </article>`;
}

/* ---- THE ASK. Plain words, one line and a paragraph: a form that demanded
   contract type, value and dates would be the enterprise intake form this
   product exists to avoid, and the person filling it in does not know those
   answers — that is WHY they are asking. Two optional facts (who it is with,
   which stream) because they are the two the requester always does know. */
function openIntakeForm(){
  const streams=(typeof visibleFolders==='function')?visibleFolders():Object.values(FOLDERS||{});
  const FLD='width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:5px;padding:8px 10px;font:inherit;font-size:13px;outline:none';
  const LBL='display:block;font-size:11px;font-weight:600;margin-bottom:4px';
  openModal(`<div style="padding:20px 22px;max-width:520px">
    <h3 style="font-family:var(--font-heading);font-weight:600;font-size:18px;margin:0 0 4px">${i18t('ik_ask_title')}</h3>
    <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 14px;line-height:1.55">${i18t('ik_ask_sub')}</p>
    <label style="display:block;margin-bottom:10px"><span style="${LBL}">${i18t('ik_f_title')}</span>
      <input id="ik-title" style="${FLD}" placeholder="${esc(i18t('ik_f_title_ph'))}" maxlength="200"/></label>
    <label style="display:block;margin-bottom:10px"><span style="${LBL}">${i18t('ik_f_need')}</span>
      <textarea id="ik-need" rows="5" style="${FLD};resize:vertical" placeholder="${esc(i18t('ik_f_need_ph'))}" maxlength="4000"></textarea></label>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <label style="flex:1;min-width:170px"><span style="${LBL}">${i18t('ik_f_who')}</span>
        <input id="ik-cp" style="${FLD}" maxlength="200"/></label>
      <label style="flex:1;min-width:170px"><span style="${LBL}">${i18t('ik_f_stream')}</span>
        <select id="ik-folder" style="${FLD}">
          <option value="">${esc(i18t('ik_f_stream_unsure'))}</option>
          ${streams.map(f=>`<option value="${esc(f.id)}">${esc(f.name)}</option>`).join('')}
        </select></label>
    </div>
    <p id="ik-err" style="font-size:11.5px;color:var(--st-ruby-fg);min-height:16px;margin:8px 0 0"></p>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
      <button id="ik-cancel" class="ui-btn" style="font-size:12px;padding:7px 14px">${i18t('act_cancel')}</button>
      <button id="ik-send" class="ui-btn ui-btn-primary" style="font-size:12px;padding:7px 14px">${i18t('ik_send')}</button>
    </div>
  </div>`,{maxWidth:'560px'});
  document.getElementById('ik-cancel')?.addEventListener('click',()=>closeModal());
  document.getElementById('ik-send')?.addEventListener('click',async()=>{
    const g=id=>(document.getElementById(id)||{value:''}).value.trim();
    const err=document.getElementById('ik-err');
    if(!g('ik-title')||!g('ik-need')){ if(err) err.textContent=i18t('ik_need_both'); return; }
    const btn=document.getElementById('ik-send'); if(btn) btn.disabled=true;
    try{
      await api('intake','POST',{ title:g('ik-title'), need:g('ik-need'),
        counterparty:g('ik-cp'), folder:g('ik-folder') });
      closeModal();
      await loadIntake();
      toast(i18t('ik_sent'),'ok');
      if(state.view==='intake') renderIntake();
      if(window.updateSidebarCounts) updateSidebarCounts();
    }catch(e){ if(err) err.textContent=(e&&e.message)||i18t('ik_failed'); if(btn) btn.disabled=false; }
  });
}

/* ---- TURNING A REQUEST INTO PAPER. The AI reads the request and names the
   template it thinks fits; the EDITOR presses the button. Where Copilot is
   not connected the picker still opens on the full list, so the door works
   without it — the AI shortens the choice, it does not own it. */
async function intakeSuggestTemplate(r){
  const cands=Object.entries(TEMPLATES||{}).map(([id,t])=>({ id, name:t.name, kind:t.kind,
    folder:(FOLDERS[t.folder]||{}).name||'', blurb:t.blurb||'' }));
  if(!cands.length) return null;
  if(!(typeof API_MODE==='function'&&API_MODE())||!state.aiConfigured) return null;
  try{
    const res=await api('ai/template','POST',{ query:`${r.title}\n\n${r.need}`, candidates:cands });
    const top=(res&&Array.isArray(res.ranked)&&res.ranked[0])||null;
    return top&&top.id&&TEMPLATES[top.id] ? { id:top.id, why:top.why||res.answer||'' } : null;
  }catch(_){ return null; }
}
async function intakeDraft(id){
  if(!canEdit()){ toast(i18t('ap_viewers_no_create'),'err'); return; }
  const r=(_intake.list||[]).find(x=>x.id===id); if(!r) return;
  const btnBusy=document.querySelector(`[data-ik-draft="${CSS.escape(id)}"]`);
  if(btnBusy){ btnBusy.disabled=true; btnBusy.textContent=i18t('ct_working'); }
  const pick=await intakeSuggestTemplate(r);
  const ids=Object.keys(TEMPLATES||{});
  const FLD='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:8px 10px;font:inherit;font-size:13px';
  openModal(`<div style="padding:20px 22px;max-width:520px">
    <h3 style="font-family:var(--font-heading);font-weight:600;font-size:18px;margin:0 0 4px">${i18t('ik_draft_title')}</h3>
    <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.55">${esc(r.title)}</p>
    ${pick?`<p style="font-size:12px;line-height:1.55;margin:0 0 10px;padding:9px 11px;background:var(--st-green-bg);color:var(--st-green-fg);border-radius:6px">
      ${esc(i18t('ik_suggested',{name:TEMPLATES[pick.id].name}))}${pick.why?' '+esc(pick.why):''}</p>`
      :`<p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 10px">${esc(i18t('ik_no_suggestion'))}</p>`}
    <label style="display:block;margin-bottom:12px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">${i18t('ik_pick_template')}</span>
      <select id="ik-tpl" style="${FLD}">
        ${ids.map(t=>`<option value="${esc(t)}"${pick&&pick.id===t?' selected':''}>${esc(TEMPLATES[t].name)}</option>`).join('')}
      </select></label>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button id="ik-d-cancel" class="ui-btn" style="font-size:12px;padding:7px 14px">${i18t('act_cancel')}</button>
      <button id="ik-d-go" class="ui-btn ui-btn-primary" style="font-size:12px;padding:7px 14px">${i18t('ik_create_draft')}</button>
    </div>
  </div>`,{maxWidth:'560px'});
  const restore=()=>{ const b=document.querySelector(`[data-ik-draft="${CSS.escape(id)}"]`); if(b){ b.disabled=false; b.textContent=i18t('ik_act_draft'); } };
  document.getElementById('ik-d-cancel')?.addEventListener('click',()=>{ closeModal(); restore(); });
  document.getElementById('ik-d-go')?.addEventListener('click',async()=>{
    const tid=(document.getElementById('ik-tpl')||{}).value;
    if(!tid||!TEMPLATES[tid]) return;
    closeModal();
    /* THE ORDINARY CREATION PATH, with the request's own facts carried in.
       createFromTemplate is the door every other template-made contract goes
       through — it stamps the owner, registers the open-on-Key-terms intent
       and files the audit line — so a requested contract is in no way a
       different kind of record from a drafted one. */
    createFromTemplate(tid);
    const c=getContract(state.activeId);
    if(c){
      if(r.counterparty&&!c.counterparty) c.counterparty=r.counterparty;
      if(r.folder&&FOLDERS[r.folder]) c.folder=r.folder;
      logAudit(c,'Requested',`Raised from request ${r.id} by ${(r.by&&r.by.name)||'a colleague'}: ${r.title}`);
      c.intakeRequestId=r.id;
      persist(c);
      try{
        await api('intake/'+encodeURIComponent(r.id),'PATCH',{ status:'done', contractId:c.id });
        await loadIntake();
        if(window.updateSidebarCounts) updateSidebarCounts();
      }catch(_){ /* the draft exists either way; the queue catches up on reload */ }
      toast(i18t('ik_drafted',{id:c.id}),'ok');
    }
  });
}
async function intakeSetStatus(id,status,opts={}){
  const r=(_intake.list||[]).find(x=>x.id===id); if(!r) return;
  let note='';
  if(status==='declined'){
    /* THE DIALOG SAYS WHERE THE WORDS GO, and only where that is true: the
       route emails the requester their reason, so the person typing it
       should know — but a workspace with no mail provider, or one whose
       provider is refusing, must not be promised a delivery. Same rule as
       everywhere else in this product: "sent" has to mean sent. */
    const mails = typeof API_MODE==='function' && API_MODE()
      && !(typeof emailOff==='function' && emailOff())
      && !(typeof emailFailing==='function' && emailFailing());
    const said=await promptDialog({ title:i18t('ik_decline_title'),
      message:i18t('ik_decline_msg')+(mails?' '+i18t('ik_decline_emails'):''),
      confirmLabel:i18t('ik_act_decline'), cancelLabel:i18t('act_cancel') });
    if(said==null) return;
    note=String(said||'').trim();
  } else if(status==='withdrawn'){
    if(!await confirmDialog({ title:i18t('ik_withdraw_title'), message:i18t('ik_withdraw_msg'),
      confirmLabel:i18t('ik_act_withdraw') })) return;
  }
  try{
    await api('intake/'+encodeURIComponent(id),'PATCH',{ status, note });
    await loadIntake();
    renderIntake();
    if(window.updateSidebarCounts) updateSidebarCounts();
    toast(status==='declined'?i18t('ik_declined_toast'):i18t('ik_withdrawn_toast'),'ok');
  }catch(e){ toast((e&&e.message)||i18t('ik_failed'),'err'); }
}

function renderIntake(){
  const host=document.getElementById('content'); if(!host) return;
  const may=(typeof canEdit==='function'&&canEdit());
  const mine=intakeMine(), queue=intakeQueue();
  const empty=t=>`<p style="font-size:12.5px;color:var(--color-neutral-600);line-height:1.6;margin:0">${esc(t)}</p>`;
  host.innerHTML=`
    ${''/* ---- THE PAGE HAS A MARGIN (owner-reported 19 Aug 2026, off a
           screenshot with the left edge ringed: "space is needed between the
           content and the edge of the page to look more professional") ----
           This drew at padding:0, so the heading, the lead and every row sat
           flush against the sidebar. 16px 18px 28px is this product's own page
           measure — the same one Templates, Reports and the template library
           use — rather than a number picked for this screen. */}
    <div class="view-enter" style="padding:16px 18px 28px;display:flex;flex-direction:column;gap:22px;max-width:894px">
      <section style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap">
        <div style="flex:1;min-width:220px">
          <p style="font-size:12.5px;color:var(--color-neutral-600);line-height:1.6;margin:0">${esc(may?i18t('ik_lead_editor'):i18t('ik_lead_asker'))}</p>
        </div>
        <button id="ik-new" class="ui-btn ui-btn-primary" style="font-size:12.5px;padding:8px 15px;flex:none">${i18t('ik_ask_btn')}</button>
      </section>
      ${may?`<section>
        <h3 style="font-size:13px;font-weight:700;font-family:var(--font-heading);margin:0 0 9px">${i18t('ik_queue_head',{n:queue.length})}</h3>
        <div style="display:flex;flex-direction:column;gap:9px">${queue.length?queue.map(r=>ikRowHtml(r)).join(''):empty(i18t('ik_queue_empty'))}</div>
      </section>`:''}
      <section>
        <h3 style="font-size:13px;font-weight:700;font-family:var(--font-heading);margin:0 0 9px">${i18t('ik_mine_head')}</h3>
        <div style="display:flex;flex-direction:column;gap:9px">${mine.length?mine.map(r=>ikRowHtml(r)).join(''):empty(i18t('ik_mine_empty'))}</div>
      </section>
    </div>`;
  host.querySelector('#ik-new')?.addEventListener('click',()=>openIntakeForm());
  host.querySelectorAll('[data-ik-draft]').forEach(b=>b.addEventListener('click',()=>intakeDraft(b.getAttribute('data-ik-draft'))));
  host.querySelectorAll('[data-ik-decline]').forEach(b=>b.addEventListener('click',()=>intakeSetStatus(b.getAttribute('data-ik-decline'),'declined')));
  host.querySelectorAll('[data-ik-withdraw]').forEach(b=>b.addEventListener('click',()=>intakeSetStatus(b.getAttribute('data-ik-withdraw'),'withdrawn')));
  host.querySelectorAll('[data-ik-open]').forEach(b=>b.addEventListener('click',()=>openWorkspace(b.getAttribute('data-ik-open'))));
  if(typeof setActiveNav==='function') setActiveNav('intake');
  /* The list is fetched once per sitting and repainted here when it lands —
     the same shape the Advice Desk uses, and the reason the empty state is a
     real sentence rather than a spinner. */
  if(!_intake.loaded) loadIntake().then(()=>{ if(state.view==='intake') renderIntake(); });
}

Object.assign(window,{INTAKE_STATUS,IK_LIVE,intakeMine,intakeQueue,intakeCount,loadIntake,
  openIntakeForm,intakeDraft,intakeSetStatus,renderIntake,ikRowHtml,intakeSuggestTemplate,
  _intakeState:_intake});
