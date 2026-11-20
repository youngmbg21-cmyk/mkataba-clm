// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   VIEW: ADVICE DESK (internal pipeline board)
   The legal team's Kanban over customer advice/review/drafting
   requests. Same safe-drag treatment as the contract queue:
   viewers cannot drag, Closed asks for confirmation, every move
   lands on the request's history (which the customer's tracking
   page renders — the board IS the transparency promise).
   ============================================================ */
/* Quotes too (the owner's list, 27 Sep 2026): this page writes names into
   attributes, and a name holding a quote mark closed the attribute early. */
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
window.adviceDrag=null;

function adviceCard(r){
  const drag=canEdit();
  const svc=ADVICE_SERVICES[r.service]||{name:r.service,ic:'msg'};
  const left=adviceDaysLeft(r.eta);
  const done=r.status==='Delivered'||r.status==='Closed';
  const etaTxt = done ? (r.status==='Delivered'?'delivered':'closed')
    : left==null ? '—'
    : left<0 ? `${-left}d overdue`
    : left===0 ? 'due today' : `${left}d left`;
  const etaCol = done ? 'var(--color-neutral-500)' : left!=null&&left<0 ? 'var(--st-ruby-dot)' : left!=null&&left<=1 ? 'var(--st-amber-fg)' : 'var(--color-neutral-600)';
  const q=r.quote||{};
  const fee=q.rate?`${fmtMoneyShort(q.rate*q.hoursMin)}–${fmtMoneyShort(q.rate*q.hoursMax)}`:'—';
  const ini=(r.assignee||'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  return `
    <div data-adv-card="${r.id}" ${drag?'draggable="true"':''} class="q-card" style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);padding:11px var(--s-3);cursor:${drag?'grab':'pointer'};display:flex;flex-direction:column;gap:5px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
        <span style="font-family:var(--font-mono);font-size:var(--t-label);color:var(--color-neutral-600)">${r.id}</span>
        <span style="display:flex;align-items:center;gap:var(--s-1);flex:none">
          ${r.urgency==='priority'?`<span style="background:var(--st-amber-bg);color:var(--st-amber-fg);font-size:var(--t-label);font-weight:var(--w-strong);letter-spacing:.03em;padding:2px var(--s-2);border-radius:var(--radius)">${i18t('adv_priority')}</span>`:''}
          <span style="font-size:var(--t-label);font-weight:var(--w-strong);letter-spacing:.03em;padding:2px var(--s-2);border-radius:var(--radius);font-variant-numeric:tabular-nums;background:color-mix(in srgb,${etaCol} 12%,#fff);color:${etaCol}">${etaTxt}</span>
        </span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:var(--t-body);font-weight:var(--w-body);line-height:1.3"><span style="display:inline-flex;color:var(--accent-ink-700);flex:none">${icon(svc.ic,'w-3.5 h-3.5')}</span><span style="min-width:0">${esc(svc.name)}</span></div>
      <div style="font-size:var(--t-label);color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.name)}${r.company?' · '+esc(r.company):''}</div>
      ${r.contractName?`<div style="font-size:var(--t-label);color:var(--color-neutral-500);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.contractName)}</div>`:''}
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;border-top:1px solid color-mix(in srgb,var(--color-text) 8%,transparent);padding-top:5px;margin-top:1px">
        <span style="font-size:var(--t-label);font-weight:var(--w-body);font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--color-text)">${fee}</span>
        ${ini?`<span title="${esc(r.assignee)}" style="width:20px;height:20px;border-radius:50%;background:transparent;border:1px solid var(--rule-strong);color:var(--color-neutral-600);display:inline-grid;place-items:center;font-size:var(--t-figure);font-weight:var(--w-title);font-family:var(--font-mono);flex:none">${ini}</span>`
            :`<span style="font-size:var(--t-label);color:var(--color-neutral-400)">unassigned</span>`}
      </div>
    </div>`;
}

function renderAdviceDesk(){
  const rs=state.advice||[];
  const active=rs.filter(r=>ADVICE_ACTIVE.includes(r.status));
  const overdue=active.filter(r=>{const d=adviceDaysLeft(r.eta); return d!=null&&d<0;}).length;
  const dueSoon=active.filter(r=>{const d=adviceDaysLeft(r.eta); return d!=null&&d>=0&&d<=2;}).length;
  const delivered30=rs.filter(r=>r.status==='Delivered'&&(Date.now()-Date.parse((r.history||[]).find(h=>h.to==='Delivered')?.at||r.submittedAt))<30*86400000).length;
  const projected=active.reduce((s,r)=>s+((r.quote?.rate||0)*(((r.quote?.hoursMin||0)+(r.quote?.hoursMax||0))/2)),0);
  const kpi=(label,val,col)=>`<div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius);padding:var(--s-2) 14px;min-width:0">
      <div style="font-size:var(--t-micro);color:var(--color-neutral-600)">${label}</div>
      <div style="font-size:var(--t-section);font-weight:var(--w-strong);font-variant-numeric:tabular-nums;color:${col||'var(--color-text)'}">${val}</div></div>`;

  const groups=ADVICE_STAGES.map(col=>({col, list:rs.filter(r=>r.status===col.k)}));
  const columnsHtml=groups.map(g=>`
    <div style="min-width:0;display:flex;flex-direction:column;min-height:0">
      <div style="display:flex;align-items:center;gap:6px;padding:0 2px var(--s-2);min-width:0;flex:none">
        <span style="width:9px;height:9px;border-radius:50%;background:${g.col.color};flex:none;display:inline-block"></span>
        <span style="font-family:var(--font-mono);font-weight:var(--w-title);font-size:var(--t-meta);white-space:nowrap">${g.col.label}</span>
        <span style="font-size:var(--t-label);background:color-mix(in srgb,var(--color-accent) 11%,transparent);padding:1px var(--s-2);border-radius:var(--radius);color:var(--color-neutral-700);flex:none;font-variant-numeric:tabular-nums">${g.list.length}</span>
      </div>
      <div data-adv-drop="${g.col.k}" class="pipe-col scroll-thin" style="background:color-mix(in srgb,var(--color-accent) 6%,transparent);border:1px solid var(--color-divider);border-radius:var(--radius);padding:var(--s-2);display:flex;flex-direction:column;gap:var(--s-2);flex:1;min-height:0;overflow-y:auto">
        ${g.list.map(adviceCard).join('')||`<div style="border:1px dashed var(--color-divider);border-radius:var(--radius);padding:22px 10px;text-align:center;font-size:var(--t-label);color:var(--color-neutral-500)">${i18t('adv_nothing_here')}</div>`}
      </div>
    </div>`).join('');

  /* ---- THE ADVICE TAB OF REQUESTS (the process review, gap F, 4 Oct 2026) ----
     This board has no rail door of its own any more: it is the second tab of
     the Requests page (rqKindTabsHtml, js/views/intake.js), drawn here under
     its own view id so every link to it still lands. The board below is
     exactly what it was; only the frame follows the Requests page, so the
     tab row sits where it sits on the Contracts tab and a press between the
     two moves nothing but the page under the row. That page draws at the
     top of the page area where the inspector fits and below the page's own
     top padding where it does not — so this frame reads the same width line
     (insFits) and is repainted when a resize crosses it (INS_PAGE_REPAINT).
     THE TAB ROW IS THE HEAD CARD'S LOWER HALF where the inspector page is
     (19 Oct 2026, .ph-foot), as on Requests; the plain page keeps its own. */
  const fits=(typeof window.insFits==='function')&&!!insFits();
  document.getElementById('content').innerHTML=`
  <div class="view-enter sap-page" data-ins-page="advice" data-ins="${fits?'1':'0'}" style="height:var(--view-h);box-sizing:border-box;padding:${fits?'0':'var(--page-pad-t)'} var(--page-pad-x) var(--s-4);display:flex;flex-direction:column;gap:var(--s-3)">
    ${''/* the Requests page's one tab row, on the same white band (SAP benchmark, batch 2) */}
    <div class="sap-band${fits?' ph-foot':''}">${typeof window.rqKindTabsHtml==='function'?rqKindTabsHtml('advice'):''}</div>
    <style>
      .q-card{transition:border-color var(--dur-1) ease,box-shadow var(--dur-1) ease}
      .q-card:hover{border-color:var(--color-accent)!important;box-shadow:var(--shadow-md)!important}
    </style>
    <div style="display:flex;align-items:stretch;gap:10px;flex:none;flex-wrap:wrap">
      ${kpi(i18t('adv_active_requests'),active.length)}
      ${kpi(i18t('adv_due_48h'),dueSoon,dueSoon?'var(--st-amber-fg)':undefined)}
      ${kpi('Overdue',overdue,overdue?'var(--st-ruby-dot)':undefined)}
      ${kpi('Delivered · 30d',delivered30,'var(--st-green-fg)')}
      ${kpi(i18t('adv_projected_fees'),fmtMoneyShort(projected))}
      <span style="flex:1"></span>
      <div style="display:flex;align-items:center;gap:var(--s-2);flex:none">
        <button id="adv-rates" class="ui-btn">${icon('coins','w-3.5 h-3.5')} Rate card</button>
        <button id="adv-link" class="ui-btn">${icon('share','w-3.5 h-3.5')} ${i18t('adv_intake_link')}</button>
        ${canEdit()?`<button id="adv-new" class="ui-btn ui-btn-primary">${icon('plus','w-3.5 h-3.5')} ${i18t('adv_new_request')}</button>`:''}
      </div>
    </div>
    <div class="board-cols board-5" style="flex:1;min-height:0;display:grid;gap:var(--s-3)">${columnsHtml}</div>
  </div>`;
  wireAdviceBoard();
  if(typeof window.rqKindTabsWire==='function') rqKindTabsWire(document.getElementById('content'));
  if(typeof window.insWatchWidth==='function') insWatchWidth();
  adviceHeadPaint();
  /* ONE DOOR: the rail lights Requests on this tab (NAV_HOME_FOR maps the
     view; this names the door outright, as Our standards does). */
  setActiveNav('intake');
  refreshAdviceBoard();
}
/* ---- THE HEAD HOLDS ITS LINE (gap F, 4 Oct 2026) ----
   Where the inspector fits, the Contracts tab of Requests carries a facts
   line under the page's name (ikPaintHead). This tab says nothing there —
   the board's own tiles are its facts, and saying them twice is noise — but
   the line's ROOM is held, so the tab row under the head does not jump a
   line when the reader presses between the two tabs. Held only where the
   Contracts tab draws one: its narrow page draws none, so neither does this.
   Painted by the header (PAGE_HEAD_PAINT) and again on every board paint,
   because a resize across the width line repaints the board, not the head. */
function adviceHeadPaint(){
  if(typeof document==='undefined') return;
  const f=document.getElementById('page-head-facts'); if(!f) return;
  f.textContent='';
  /* NO HELD LINE since 9 Oct 2026 (SAP benchmark, batch 2): the Requests
     page prints no facts under its name any more, so the Advice tab holds no
     empty line for one either — the one tab row stays where it is. */
  f.classList.remove('is-held');
}
// Pull the latest list from the server (API mode) and repaint once, without
// looping: only re-render when something actually changed.
let adviceRefreshing=false;
async function refreshAdviceBoard(){
  if(!API_MODE()||adviceRefreshing) return;
  adviceRefreshing=true;
  try{
    const before=JSON.stringify((state.advice||[]).map(r=>[r.id,r.status,r.assignee,(r.notes||[]).length]));
    await loadAdviceRequests();
    const after=JSON.stringify((state.advice||[]).map(r=>[r.id,r.status,r.assignee,(r.notes||[]).length]));
    if(before!==after && state.view==='advice') renderAdviceDesk();
    /* Requests' Advice tab reads the same book: drawn again where it is the page on screen (#762: its count stood still) */
    if(before!==after && state.view==='intake' && typeof window.renderIntake==='function') try{ window.renderIntake({ rows:true }); }catch(_){ }
    updateSidebarCounts();
  }catch(e){ /* transient — next visit retries */ }
  finally{ adviceRefreshing=false; }
}

async function adviceMove(id, target){
  const r=getAdviceRequest(id); if(!r) return;
  if(!canEdit()){ toast(i18t('adv_viewers_no_move'),'err'); return; }
  if(r.status===target) return;
  if(target==='Closed' && !await confirmDialog({title:`Close ${r.id}?`, message:'This closes the request without delivering — the customer’s tracking page will show it as closed.', confirmLabel:'Close request', danger:true})) return;
  try{
    await updateAdviceRequest(id,{status:target});
    toast(`${r.id} moved to ${adviceStage(target).label}`, target==='Closed'?'err':'ok');
  }catch(e){ toast(e.message,'err'); }
  renderAdviceDesk(); updateSidebarCounts();
}
function wireAdviceBoard(){
  document.querySelectorAll('[data-adv-card]').forEach(el=>{
    const id=el.getAttribute('data-adv-card');
    el.addEventListener('click',()=>{ if(!adviceDrag) openAdviceModal(id); });
    el.addEventListener('dragstart',e=>{ adviceDrag=id; el.style.opacity='.4'; try{e.dataTransfer.effectAllowed='move';}catch(_){} });
    el.addEventListener('dragend',()=>{ el.style.opacity=''; adviceDrag=null; });
  });
  document.querySelectorAll('[data-adv-drop]').forEach(col=>{
    col.addEventListener('dragover',e=>{ if(!adviceDrag) return; e.preventDefault(); col.style.borderColor='var(--color-accent)'; col.style.background='color-mix(in srgb,var(--color-accent) 9%,transparent)'; });
    col.addEventListener('dragleave',()=>pipeColReset(col));
    col.addEventListener('drop',e=>{ e.preventDefault(); pipeColReset(col); const id=adviceDrag; adviceDrag=null; if(id) adviceMove(id, col.getAttribute('data-adv-drop')); });
  });
  document.getElementById('adv-rates')?.addEventListener('click',openRateCardModal);
  document.getElementById('adv-new')?.addEventListener('click',openAdviceIntakeModal);
  document.getElementById('adv-link')?.addEventListener('click',async()=>{
    const link=adviceIntakeLink();
    try{ await navigator.clipboard.writeText(link); toast(i18t('adv_intake_copied'),'ok'); }
    catch(e){ openModal(`<div style="padding:22px var(--s-6)"><h2 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-section);margin:0 0 var(--s-2)">${i18t('adv_public_intake')}</h2><textarea readonly rows="2" style="width:100%;border:var(--fld-edge);border-bottom:var(--fld-under);background:var(--fld-bg);border-radius:var(--fld-r);padding:10px;font-size:var(--t-label);font-family:var(--font-mono);word-break:break-all">${link}</textarea><div style="margin-top:var(--s-3);text-align:right"><button class="ui-btn" onclick="closeModal()">${i18t('act_close')}</button></div></div>`); }
  });
}

/* ---------- request detail modal ---------- */
function openAdviceModal(id){
  const r=getAdviceRequest(id); if(!r) return;
  const svc=ADVICE_SERVICES[r.service]||{name:r.service,ic:'msg'};
  const q=r.quote||{};
  /* THE ONE EDIT POP-UP IN STEPS (lgp; owner, 19 Nov 2026: "Fix all batches"): 1 the request read as lines, 2 its
     history and notes, 3 (an editor's) who has it, its stage and a note. All in the one form, so Save reads every
     field wherever the reader stands; every id and act is the one this window always had. */
  const row=(k,v)=>`<div class="lgp-row"><span class="lgp-k">${k}</span><span class="lgp-v"><span class="lgp-in is-read">${v}</span></span></div>`;
  const line='display:flex;gap:var(--s-2);padding:var(--s-2) 0;border-bottom:1px solid var(--color-divider);font-size:var(--t-meta)';
  const hist=(r.history||[]).slice().reverse().map(h=>`
    <div style="${line}">
      <span style="width:8px;height:8px;border-radius:50%;background:${adviceStage(h.to).color};flex:none;margin-top:5px"></span>
      <span style="min-width:0;flex:1"><strong>${adviceStage(h.to).label}</strong>${h.by?` <span style="color:var(--color-quiet)">— ${esc(h.by)}</span>`:''}
        <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-400)">${fmtDT(h.at)}</span></span>
    </div>`).join('');
  const notes=(r.notes||[]).slice().reverse().map(n=>`
    <div style="${line};display:block">
      <div style="line-height:1.5">${esc(n.text)}</div>
      <div style="font-size:var(--t-label);color:var(--color-neutral-400);margin-top:2px">${esc(n.by)} · ${fmtDT(n.at)}</div>
    </div>`).join('')||`<p class="lgp-none">${i18t('adv_no_notes')}</p>`;
  const members=getUsers().filter(u=>u.role!=='viewer');
  const ADV_STEPS=[i18t('adv_step_request'), i18t('adv_step_trail'), ...(canEdit()?[i18t('adv_step_update')]:[])];
  lgpOpen({ stepped:true, id:'adv-form', focus:false, title:svc.name,
    steps:{ at:1, names:ADV_STEPS },
    subHtml:`${r.id} · submitted ${fmtDT(r.submittedAt)} · ${adviceStageChip(r.status)}`,
    html:`<div data-lgp-step="1">
        ${row('Customer', esc(r.name)+(r.company?' · '+esc(r.company):''))}
        ${row('Email', esc(r.email||'—'))}
        ${r.contractName?row('Contract', esc(r.contractName)):''}
        ${row('Urgency', r.urgency==='priority'?'Priority (+25% rate, half turnaround)':'Standard')}
        ${row('Rate', q.rate?fmtMoney(q.rate)+' / hr':'—')}
        ${row('Estimate', q.rate?`${q.hoursMin}–${q.hoursMax} hrs ≈ ${fmtMoneyShort(q.rate*q.hoursMin)}–${fmtMoneyShort(q.rate*q.hoursMax)}`:'—')}
        ${row('Feedback due', fmtDay(r.eta))}
        ${r.description&&r.description!=='Seeded as sample data'?`<p class="lgp-quote" style="white-space:pre-wrap;color:var(--color-text)">${esc(r.description)}</p>`:''}
      </div>
      <div data-lgp-step="2" hidden>
        <p class="lgp-small">${i18t('adv_pipeline_history')}</p>
        <div class="lgp-list">${hist}</div>
        <p class="lgp-small">${i18t('adv_internal_notes')}</p>
        <div class="lgp-list">${notes}</div>
      </div>
      ${canEdit()?`<div data-lgp-step="3" hidden>
        ${lgpRowHtml({ k:i18t('adv_assigned_counsel'), id:'adv-assignee', type:'select', value:r.assignee||'',
          opts:[{ v:'', t:i18t('adv_unassigned') }, ...members.map(u=>({ v:u.name, t:`${u.name} (${roleName(u.role)})` }))] })}
        ${lgpRowHtml({ k:i18t('adv_stage'), id:'adv-status', type:'select', value:r.status, opts:ADVICE_STAGES.map(st=>({ v:st.k, t:st.label })) })}
        ${lgpRowHtml({ k:i18t('adv_add_note'), id:'adv-note', type:'area', ph:'Scope confirmed with customer…' })}
      </div>`:''}`,
    leftHtml:`<button type="button" id="adv-copy-track" class="lgp-left">Customer tracking link</button>`,
    nextAttr:'id="adv-next"', backAttr:'id="adv-back"',
    primary:canEdit()?{ label:i18t('act_save'), attr:'id="adv-save"' }:null,
    cancelLabel:i18t('act_close') });
  const advForm=()=>document.getElementById('adv-form');
  const advGo=n=>lgpStepGo(advForm(), n, ADV_STEPS);
  document.getElementById('adv-next')?.addEventListener('click',()=>advGo(Number(advForm()?.getAttribute('data-lgp-at')||1)+1));
  document.getElementById('adv-back')?.addEventListener('click',()=>advGo(Number(advForm()?.getAttribute('data-lgp-at')||1)-1));
  advGo(1);
  document.getElementById('adv-copy-track').addEventListener('click',async()=>{
    try{ await navigator.clipboard.writeText(adviceTrackLink(r)); toast(i18t('adv_track_copied',{who:r.name}),'ok'); }catch(e){ toast(i18t('adv_could_not_copy'),'err'); }
  });
  document.getElementById('adv-save')?.addEventListener('click',async()=>{
    const patch={};
    const st=document.getElementById('adv-status').value;
    const as=document.getElementById('adv-assignee').value;
    const note=fval('adv-note');
    if(st!==r.status) patch.status=st;
    if((r.assignee||'')!==as) patch.assignee=as;
    if(note) patch.note=note;
    if(!Object.keys(patch).length){ closeModal(); return; }
    if(patch.status==='Closed' && !await confirmDialog({title:`Close ${r.id}?`, message:'This closes the request without delivering — the customer’s tracking page will show it as closed.', confirmLabel:'Close request', danger:true})) return;
    try{ await updateAdviceRequest(r.id, patch); toast(`${r.id} updated`); }
    catch(e){ toast(e.message,'err'); }
    closeModal(); renderAdviceDesk(); updateSidebarCounts();
  });
}

/* ---------- rate card (published fees; admin edits, everyone reads) ---------- */
function openRateCardModal(){
  const editable=isAdmin();
  /* THE ONE EDIT POP-UP (lgp; owner, 19 Nov 2026: "Fix all batches"): a service a line, its name beside its four
     numbers, the columns named once above them; every id and the publish exactly as they were. */
  const inp=(id,v)=>`<input id="${id}" class="lgp-in" type="number" min="1" value="${v}" ${editable?'':'disabled'} style="flex:1;min-width:0;font-family:var(--font-mono)"/>`;
  const cols='display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--s-2);flex:1;min-width:0';
  const rows=Object.values(ADVICE_SERVICES).map(s=>{
    const r=adviceRateFor(s.id);
    return `<div class="lgp-row"><span class="lgp-k" style="color:var(--color-text)">${s.name}</span><span class="lgp-v"><span style="${cols}">
      ${inp('rt-rate-'+s.id,r.rate)}${inp('rt-min-'+s.id,r.hoursMin)}${inp('rt-max-'+s.id,r.hoursMax)}${inp('rt-days-'+s.id,r.days)}</span></span></div>`;
  }).join('');
  lgpOpen({ id:'rt-form', focus:false, title:i18t('adv_published_rates'),
    sub:`These hourly rates and turnaround targets are shown to customers on the public intake page. ${editable?'Changes publish immediately.':'Only an admin can change them.'}`,
    html:`<div class="lgp-row" style="min-height:34px"><span class="lgp-k">${i18t('adv_service')}</span><span class="lgp-v"><span style="${cols};font-size:var(--t-label);color:var(--color-quiet)">
        <span>${jxCurrency()} / hr</span><span>${i18t('adv_hrs_min')}</span><span>${i18t('adv_hrs_max')}</span><span>${i18t('adv_days')}</span></span></span></div>
      ${rows}
      <p class="lgp-small">${i18t('adv_rate_note')}</p>`,
    primary:editable?{ label:i18t('adv_publish_rates'), attr:'id="rt-save"' }:null,
    cancelLabel:editable?i18t('act_cancel'):i18t('act_close') });
  document.getElementById('rt-save')?.addEventListener('click',async()=>{
    const out={};
    for(const s of Object.values(ADVICE_SERVICES)){
      const g=f=>Number(document.getElementById('rt-'+f+'-'+s.id).value);
      const o={ rate:g('rate'), hoursMin:g('min'), hoursMax:g('max'), days:g('days') };
      if(Object.values(o).some(v=>!Number.isFinite(v)||v<1)){ toast(i18t('adv_positive_number'),'err'); return; }
      if(o.hoursMax<o.hoursMin){ toast(`${s.name}: max hours must be ≥ min hours`,'err'); return; }
      out[s.id]=o;
    }
    state.settings.adviceRates=out;
    await saveSettings();
    closeModal(); toast(i18t('adv_rates_published'));
    if(state.view==='advice') renderAdviceDesk();
  });
}

/* ---------- internal intake (log a request on a customer's behalf) ---------- */
function openAdviceIntakeModal(){
  /* THE ONE EDIT POP-UP (lgp; owner, 19 Nov 2026: "Fix all batches"): seven lines, the label beside the words; every
     id, the required three and the create exactly as they were. */
  lgpOpen({ id:'ai-form', focus:'#ai-name', title:i18t('adv_log_request'), sub:i18t('adv_log_sub'),
    rows:[
      { k:i18t('adv_service'), id:'ai-service', type:'select', opts:Object.values(ADVICE_SERVICES).map(s=>{ const r=adviceRateFor(s.id); return { v:s.id, t:`${s.name} — ${fmtMoney(r.rate)}/hr` }; }) },
      { k:'Customer name *', id:'ai-name', ph:'e.g. Grace Njeri' },
      { k:'Customer email *', id:'ai-email', type:'email', ph:'grace@company.co.ke' },
      { k:'Company', id:'ai-company', ph:'e.g. Tamu Beverages Ltd' },
      { k:'Contract concerned', id:'ai-contract', ph:'e.g. Distribution Agreement' },
      { k:i18t('adv_what_need'), id:'ai-desc', type:'area' } ],
    html:`<label class="lgp-tick"><input id="ai-priority" type="checkbox"/><span class="lgp-tl">${i18t('adv_priority_option')}</span></label>`,
    primary:{ label:i18t('adv_create_request'), attr:'id="ai-go"' },
    cancelAttr:'data-lgp-close data-dlg-cancel', cancelLabel:i18t('act_cancel') });
  document.getElementById('ai-go').addEventListener('click',async()=>{
    const p={ service:document.getElementById('ai-service').value,
      urgency:document.getElementById('ai-priority').checked?'priority':'standard',
      name:fval('ai-name'), email:fval('ai-email'), company:fval('ai-company'),
      contractName:fval('ai-contract'), description:fval('ai-desc') };
    if(!p.name||!p.email||!p.description){ toast(i18t('adv_name_email_required'),'err'); return; }
    try{
      const r=await createAdviceRequest(p);
      closeModal(); renderAdviceDesk(); updateSidebarCounts();
      toast(`${r.id} created — feedback due ${fmtDay(r.eta)}`);
    }catch(e){ toast(e.message,'err'); }
  });
}

Object.assign(window,{adviceCard,adviceHeadPaint,adviceMove,openAdviceIntakeModal,openAdviceModal,openRateCardModal,refreshAdviceBoard,renderAdviceDesk,wireAdviceBoard});
