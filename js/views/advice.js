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
const esc = s => String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
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
  const etaCol = done ? 'var(--color-neutral-500)' : left!=null&&left<0 ? '#b0453c' : left!=null&&left<=1 ? '#7d5a14' : 'var(--color-neutral-600)';
  const q=r.quote||{};
  const fee=q.rate?`${fmtKESshort(q.rate*q.hoursMin)}–${fmtKESshort(q.rate*q.hoursMax)}`:'—';
  const ini=(r.assignee||'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  return `
    <div data-adv-card="${r.id}" ${drag?'draggable="true"':''} class="q-card" style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:5px;box-shadow:var(--shadow-sm);padding:11px 12px;cursor:${drag?'grab':'pointer'};display:flex;flex-direction:column;gap:5px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
        <span style="font-family:var(--font-mono);font-size:10.5px;color:var(--color-neutral-600)">${r.id}</span>
        <span style="display:flex;align-items:center;gap:4px;flex:none">
          ${r.urgency==='priority'?`<span style="background:#fbf4e3;color:#7d5a14;font-size:9.5px;font-weight:600;letter-spacing:.03em;padding:2px 8px;border-radius:999px">Priority</span>`:''}
          <span style="font-size:9.5px;font-weight:600;letter-spacing:.03em;padding:2px 8px;border-radius:999px;font-variant-numeric:tabular-nums;background:color-mix(in srgb,${etaCol} 12%,#fff);color:${etaCol}">${etaTxt}</span>
        </span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:500;line-height:1.3"><span style="display:inline-flex;color:var(--color-accent-700);flex:none">${icon(svc.ic,'w-3.5 h-3.5')}</span><span style="min-width:0">${esc(svc.name)}</span></div>
      <div style="font-size:11px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.name)}${r.company?' · '+esc(r.company):''}</div>
      ${r.contractName?`<div style="font-size:10.5px;color:var(--color-neutral-500);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.contractName)}</div>`:''}
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;border-top:1px solid rgba(29,31,32,.07);padding-top:5px;margin-top:1px">
        <span style="font-size:11px;font-weight:500;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--color-text)">${fee}</span>
        ${ini?`<span title="${esc(r.assignee)}" style="width:20px;height:20px;border-radius:50%;background:var(--color-accent-200);color:var(--color-accent-800);display:inline-grid;place-items:center;font-size:8.5px;font-weight:700;font-family:var(--font-mono);flex:none">${ini}</span>`
            :`<span style="font-size:10px;color:var(--color-neutral-400)">unassigned</span>`}
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
  const kpi=(label,val,col)=>`<div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:6px;padding:8px 14px;min-width:0">
      <div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-600)">${label}</div>
      <div style="font-size:17px;font-weight:600;font-variant-numeric:tabular-nums;color:${col||'var(--color-text)'}">${val}</div></div>`;

  const groups=ADVICE_STAGES.map(col=>({col, list:rs.filter(r=>r.status===col.k)}));
  const columnsHtml=groups.map(g=>`
    <div style="min-width:0;display:flex;flex-direction:column;min-height:0">
      <div style="display:flex;align-items:center;gap:6px;padding:0 2px 8px;min-width:0;flex:none">
        <span style="width:9px;height:9px;border-radius:50%;background:${g.col.color};flex:none;display:inline-block"></span>
        <span style="font-family:var(--font-mono);font-weight:600;font-size:12px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap">${g.col.label}</span>
        <span style="font-size:10.5px;background:rgba(89,128,166,.1);padding:1px 8px;border-radius:999px;color:var(--color-neutral-700);flex:none;font-variant-numeric:tabular-nums">${g.list.length}</span>
      </div>
      <div data-adv-drop="${g.col.k}" class="pipe-col scroll-thin" style="background:rgba(89,128,166,.05);border:1px solid var(--color-divider);border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:8px;flex:1;min-height:0;overflow-y:auto">
        ${g.list.map(adviceCard).join('')||`<div style="border:1px dashed var(--color-divider);border-radius:4px;padding:22px 10px;text-align:center;font-size:11px;color:var(--color-neutral-500)">Nothing here</div>`}
      </div>
    </div>`).join('');

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="height:calc(100vh - 52px);box-sizing:border-box;padding:14px 16px 18px;display:flex;flex-direction:column;gap:12px">
    <style>
      .q-card{transition:border-color .12s ease,box-shadow .12s ease}
      .q-card:hover{border-color:var(--color-accent)!important;box-shadow:var(--shadow-md)!important}
    </style>
    <div style="display:flex;align-items:stretch;gap:10px;flex:none;flex-wrap:wrap">
      ${kpi('Active requests',active.length)}
      ${kpi('Due in 48h',dueSoon,dueSoon?'#7d5a14':undefined)}
      ${kpi('Overdue',overdue,overdue?'#b0453c':undefined)}
      ${kpi('Delivered · 30d',delivered30,'#1e6b4d')}
      ${kpi('Projected fees · active',fmtKESshort(projected))}
      <span style="flex:1"></span>
      <div style="display:flex;align-items:center;gap:8px;flex:none">
        <button id="adv-rates" class="ui-btn">${icon('coins','w-3.5 h-3.5')} Rate card</button>
        <button id="adv-link" class="ui-btn">${icon('share','w-3.5 h-3.5')} Intake link</button>
        ${canEdit()?`<button id="adv-new" class="ui-btn ui-btn-primary">${icon('plus','w-3.5 h-3.5')} New request</button>`:''}
      </div>
    </div>
    <div style="flex:1;min-height:0;display:grid;grid-template-columns:repeat(5,minmax(190px,1fr));gap:12px">${columnsHtml}</div>
  </div>`;
  wireAdviceBoard();
  setActiveNav('advice');
  refreshAdviceBoard();
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
    updateSidebarCounts();
  }catch(e){ /* transient — next visit retries */ }
  finally{ adviceRefreshing=false; }
}

async function adviceMove(id, target){
  const r=getAdviceRequest(id); if(!r) return;
  if(!canEdit()){ toast('Viewers cannot move requests','err'); return; }
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
    col.addEventListener('dragover',e=>{ if(!adviceDrag) return; e.preventDefault(); col.style.borderColor='var(--color-accent)'; col.style.background='rgba(89,128,166,.08)'; });
    col.addEventListener('dragleave',()=>pipeColReset(col));
    col.addEventListener('drop',e=>{ e.preventDefault(); pipeColReset(col); const id=adviceDrag; adviceDrag=null; if(id) adviceMove(id, col.getAttribute('data-adv-drop')); });
  });
  document.getElementById('adv-rates')?.addEventListener('click',openRateCardModal);
  document.getElementById('adv-new')?.addEventListener('click',openAdviceIntakeModal);
  document.getElementById('adv-link')?.addEventListener('click',async()=>{
    const link=adviceIntakeLink();
    try{ await navigator.clipboard.writeText(link); toast('Public intake link copied — share it with customers'); }
    catch(e){ openModal(`<div style="padding:22px 24px"><h2 style="font-family:var(--font-heading);font-weight:600;font-size:17px;margin:0 0 8px">Public intake link</h2><textarea readonly rows="2" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:10px;font-size:11px;font-family:var(--font-mono);word-break:break-all">${link}</textarea><div style="margin-top:12px;text-align:right"><button class="ui-btn" onclick="closeModal()">Close</button></div></div>`); }
  });
}

/* ---------- request detail modal ---------- */
function openAdviceModal(id){
  const r=getAdviceRequest(id); if(!r) return;
  const svc=ADVICE_SERVICES[r.service]||{name:r.service,ic:'msg'};
  const q=r.quote||{};
  const row=(k,v)=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px solid rgba(29,31,32,.06);font-size:12px"><span style="color:var(--color-neutral-600);flex:none">${k}</span><span style="font-weight:500;text-align:right;min-width:0">${v}</span></div>`;
  const hist=(r.history||[]).slice().reverse().map(h=>`
    <div style="display:flex;gap:8px;padding:4px 0;font-size:11px;border-bottom:1px solid rgba(29,31,32,.05)">
      <span style="width:8px;height:8px;border-radius:50%;background:${adviceStage(h.to).color};flex:none;margin-top:3px"></span>
      <span style="min-width:0;flex:1"><strong>${adviceStage(h.to).label}</strong>${h.by?` <span style="color:var(--color-neutral-600)">— ${esc(h.by)}</span>`:''}
        <span style="display:block;font-size:10px;color:var(--color-neutral-500);font-family:var(--font-mono)">${fmtDT(h.at)}</span></span>
    </div>`).join('');
  const notes=(r.notes||[]).slice().reverse().map(n=>`
    <div style="border:1px solid var(--color-divider);border-radius:5px;background:var(--color-bg);padding:8px 10px;margin-bottom:6px">
      <div style="font-size:11.5px;line-height:1.5">${esc(n.text)}</div>
      <div style="font-size:10px;color:var(--color-neutral-500);font-family:var(--font-mono);margin-top:2px">${esc(n.by)} · ${fmtDT(n.at)}</div>
    </div>`).join('')||`<div style="font-size:11px;color:var(--color-neutral-500)">No internal notes yet.</div>`;
  const members=getUsers().filter(u=>u.role!=='viewer');
  const selStyle='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:6px 9px;font:inherit;font-size:12px;color:inherit;outline:none';
  openModal(`
    <div style="padding:22px 24px">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:2px">
        <span style="width:32px;height:32px;flex:none;display:grid;place-items:center;border-radius:6px;background:var(--color-accent-100);color:var(--color-accent-800)">${icon(svc.ic,'w-4 h-4')}</span>
        <div style="min-width:0">
          <h2 style="font-family:var(--font-heading);font-weight:600;font-size:17px;margin:0;line-height:1.25">${esc(svc.name)}</h2>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--color-neutral-600)">${r.id} · submitted ${fmtDT(r.submittedAt)}</div>
        </div>
        <span style="margin-left:auto;flex:none">${adviceStageChip(r.status)}</span>
      </div>
      <div style="margin-top:12px">
        ${row('Customer', esc(r.name)+(r.company?' · '+esc(r.company):''))}
        ${row('Email', esc(r.email||'—'))}
        ${r.contractName?row('Contract', esc(r.contractName)):''}
        ${row('Urgency', r.urgency==='priority'?'Priority (+25% rate, half turnaround)':'Standard')}
        ${row('Rate', q.rate?fmtKES(q.rate)+' / hr':'—')}
        ${row('Estimate', q.rate?`${q.hoursMin}–${q.hoursMax} hrs ≈ ${fmtKESshort(q.rate*q.hoursMin)}–${fmtKESshort(q.rate*q.hoursMax)}`:'—')}
        ${row('Feedback due', `<span style="font-family:var(--font-mono)">${fmtDay(r.eta)}</span>`)}
      </div>
      ${r.description&&r.description!=='Seeded as sample data'?`<div style="margin-top:10px;border:1px solid var(--color-divider);border-radius:5px;background:var(--color-bg);padding:9px 11px;font-size:12px;line-height:1.55;white-space:pre-wrap">${esc(r.description)}</div>`:''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px">
        <div>
          <h6 style="margin:0 0 6px;font-size:10px;color:var(--color-neutral-600);letter-spacing:.08em;text-transform:uppercase">Pipeline history</h6>
          <div class="scroll-thin" style="max-height:150px;overflow-y:auto">${hist}</div>
        </div>
        <div>
          <h6 style="margin:0 0 6px;font-size:10px;color:var(--color-neutral-600);letter-spacing:.08em;text-transform:uppercase">Internal notes</h6>
          <div class="scroll-thin" style="max-height:150px;overflow-y:auto">${notes}</div>
        </div>
      </div>
      ${canEdit()?`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px">
        <label style="display:block"><span style="display:block;font-size:10.5px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono)">Assigned counsel</span>
          <select id="adv-assignee" style="${selStyle}"><option value="">Unassigned</option>
            ${members.map(u=>`<option value="${esc(u.name)}" ${r.assignee===u.name?'selected':''}>${esc(u.name)} (${ROLE_LABEL[u.role]})</option>`).join('')}</select></label>
        <label style="display:block"><span style="display:block;font-size:10.5px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono)">Stage</span>
          <select id="adv-status" style="${selStyle}">${ADVICE_STAGES.map(s=>`<option value="${s.k}" ${r.status===s.k?'selected':''}>${s.label}</option>`).join('')}</select></label>
      </div>
      <label style="display:block;margin-top:10px"><span style="display:block;font-size:10.5px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono)">Add internal note</span>
        <textarea id="adv-note" rows="2" placeholder="Scope confirmed with customer…" style="${selStyle}"></textarea></label>`:''}
      <div style="margin-top:14px;display:flex;align-items:center;gap:8px">
        <button id="adv-copy-track" class="ui-btn">${icon('copy','w-3.5 h-3.5')} Customer tracking link</button>
        <span style="flex:1"></span>
        <button class="ui-btn" onclick="closeModal()">Close</button>
        ${canEdit()?`<button id="adv-save" class="ui-btn ui-btn-primary">Save</button>`:''}
      </div>
    </div>`,{maxWidth:'40rem'});
  document.getElementById('adv-copy-track').addEventListener('click',async()=>{
    try{ await navigator.clipboard.writeText(adviceTrackLink(r)); toast('Tracking link copied — send it to '+r.name); }catch(e){ toast('Could not copy','err'); }
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
  const inp=(id,v)=>`<input id="${id}" type="number" min="1" value="${v}" ${editable?'':'disabled'} style="width:100%;border:1px solid var(--color-divider);background:${editable?'var(--color-surface)':'var(--color-bg)'};border-radius:4px;padding:5px 7px;font-family:var(--font-mono);font-size:11.5px;color:inherit;outline:none"/>`;
  const rows=Object.values(ADVICE_SERVICES).map(s=>{
    const r=adviceRateFor(s.id);
    return `<tr style="border-bottom:1px solid var(--color-divider)">
      <td style="padding:8px 10px 8px 0;min-width:0"><span style="display:flex;align-items:center;gap:7px"><span style="display:inline-flex;color:var(--color-accent-700)">${icon(s.ic,'w-3.5 h-3.5')}</span><span style="font-size:12px;font-weight:500">${s.name}</span></span></td>
      <td style="padding:8px 6px;width:92px">${inp('rt-rate-'+s.id,r.rate)}</td>
      <td style="padding:8px 6px;width:64px">${inp('rt-min-'+s.id,r.hoursMin)}</td>
      <td style="padding:8px 6px;width:64px">${inp('rt-max-'+s.id,r.hoursMax)}</td>
      <td style="padding:8px 0 8px 6px;width:64px">${inp('rt-days-'+s.id,r.days)}</td>
    </tr>`;
  }).join('');
  openModal(`
    <div style="padding:22px 24px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="display:inline-flex;color:var(--color-accent)">${icon('coins')}</span>
        <h2 style="font-family:var(--font-heading);font-weight:600;font-size:18px;margin:0">Published rate card</h2></div>
      <p style="font-size:12px;color:var(--color-neutral-700);margin:0 0 12px;line-height:1.55">These hourly rates and turnaround targets are shown to customers on the public intake page. ${editable?'Changes publish immediately.':'Only an admin can change them.'}</p>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="text-align:left;border-bottom:1px solid var(--color-divider);color:var(--color-neutral-600);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase">
          <th style="padding:6px 10px 6px 0;font-weight:600">Service</th><th style="padding:6px;font-weight:600">KES / hr</th><th style="padding:6px;font-weight:600">Hrs min</th><th style="padding:6px;font-weight:600">Hrs max</th><th style="padding:6px 0 6px 6px;font-weight:600">Days</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="font-size:10.5px;color:var(--color-neutral-500);margin:10px 0 0;line-height:1.5">Priority requests are quoted at +25% with the turnaround halved. "Days" is business days to feedback before queue load.</p>
      <div style="margin-top:14px;display:flex;justify-content:flex-end;gap:8px">
        <button class="ui-btn" onclick="closeModal()">${editable?'Cancel':'Close'}</button>
        ${editable?`<button id="rt-save" class="ui-btn ui-btn-primary">Publish rates</button>`:''}
      </div>
    </div>`,{maxWidth:'36rem'});
  document.getElementById('rt-save')?.addEventListener('click',async()=>{
    const out={};
    for(const s of Object.values(ADVICE_SERVICES)){
      const g=f=>Number(document.getElementById('rt-'+f+'-'+s.id).value);
      const o={ rate:g('rate'), hoursMin:g('min'), hoursMax:g('max'), days:g('days') };
      if(Object.values(o).some(v=>!Number.isFinite(v)||v<1)){ toast('Every value must be a positive number','err'); return; }
      if(o.hoursMax<o.hoursMin){ toast(`${s.name}: max hours must be ≥ min hours`,'err'); return; }
      out[s.id]=o;
    }
    state.settings.adviceRates=out;
    await saveSettings();
    closeModal(); toast('Rate card published');
    if(state.view==='advice') renderAdviceDesk();
  });
}

/* ---------- internal intake (log a request on a customer's behalf) ---------- */
function openAdviceIntakeModal(){
  const inputStyle='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:12.5px;color:inherit;outline:none';
  const field=(id,label,ph,type='text')=>`<label style="display:block;margin-bottom:10px"><span style="display:block;font-size:10.5px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono)">${label}</span><input id="${id}" type="${type}" placeholder="${ph}" style="${inputStyle}"/></label>`;
  openModal(`
    <div style="padding:22px 24px">
      <h2 style="font-family:var(--font-heading);font-weight:600;font-size:18px;margin:0 0 4px">Log an advice request</h2>
      <p style="font-size:12px;color:var(--color-neutral-700);margin:0 0 14px;line-height:1.5">For requests that arrive by phone or email — the customer still gets a tracking link.</p>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:10.5px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono)">Service</span>
        <select id="ai-service" style="${inputStyle}">${Object.values(ADVICE_SERVICES).map(s=>{const r=adviceRateFor(s.id);return `<option value="${s.id}">${s.name} — ${fmtKES(r.rate)}/hr</option>`;}).join('')}</select></label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${field('ai-name','Customer name *','e.g. Grace Njeri')}
        ${field('ai-email','Customer email *','grace@company.co.ke','email')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${field('ai-company','Company','e.g. Tamu Beverages Ltd')}
        ${field('ai-contract','Contract concerned','e.g. Distribution Agreement')}
      </div>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:10.5px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono)">What do they need? *</span>
        <textarea id="ai-desc" rows="3" style="${inputStyle}"></textarea></label>
      <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--color-neutral-700);margin-bottom:4px"><input id="ai-priority" type="checkbox" style="width:15px;height:15px;accent-color:var(--color-accent)"/> Priority (+25% rate, half turnaround)</label>
      <div style="margin-top:12px;display:flex;justify-content:flex-end;gap:8px">
        <button class="ui-btn" onclick="closeModal()">Cancel</button>
        <button id="ai-go" class="ui-btn ui-btn-primary">Create request</button>
      </div>
    </div>`,{maxWidth:'34rem'});
  document.getElementById('ai-go').addEventListener('click',async()=>{
    const p={ service:document.getElementById('ai-service').value,
      urgency:document.getElementById('ai-priority').checked?'priority':'standard',
      name:fval('ai-name'), email:fval('ai-email'), company:fval('ai-company'),
      contractName:fval('ai-contract'), description:fval('ai-desc') };
    if(!p.name||!p.email||!p.description){ toast('Name, email and a description are required','err'); return; }
    try{
      const r=await createAdviceRequest(p);
      closeModal(); renderAdviceDesk(); updateSidebarCounts();
      toast(`${r.id} created — feedback due ${fmtDay(r.eta)}`);
    }catch(e){ toast(e.message,'err'); }
  });
}

Object.assign(window,{adviceCard,adviceMove,openAdviceIntakeModal,openAdviceModal,openRateCardModal,refreshAdviceBoard,renderAdviceDesk,wireAdviceBoard});
