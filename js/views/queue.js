// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   VIEW: PIPELINE / MY QUEUE (read-only Kanban board)
   Restyled to the Industry design system (blueprint cards on a light
   ground). The global shell owns the view title/subtitle; this module
   renders only the board body into #content.
   Cards are NOT draggable: a contract's stage is a consequence of real
   actions (sending for review, signing, declining) taken in its
   workspace, never something you set by dropping a card in a column —
   that would let the board assert a status the contract hasn't actually
   reached. Clicking a card opens its workspace, where those actions live.
   ============================================================ */
const PIPE_COLS=[
  {k:'Draft',        label:'Drafting',  color:'#98989b'},
  {k:'Under Review', label:'In Review', color:'#b8862b'},
  {k:'Signed',       label:'Executed',  color:'#2e8763'},
  {k:'Declined',     label:'Closed',    color:'#b0453c'},
];
const PIPE_CAP=60;
// A single queue card. Click to open the workspace — cards are not draggable,
// so a stage can't be changed from the board (see the header note).
function pipeCard(c){
  const r = contractRisk(c);
  const rp = riskPal(r);
  const stream = streamLabel(c);
  const val = !isMonetary(c) ? 'n/m' : (c.value ? fmtKESshort(c.value) : '—');
  return `
    <div data-card="${c.id}" class="q-card" style="background:var(--color-surface);border:1px solid var(--color-divider);border-left:4px solid ${folderColor(c)};border-radius:5px;box-shadow:var(--shadow-sm);padding:11px 12px;cursor:pointer;display:flex;flex-direction:column;gap:5px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
        <span style="font-family:var(--font-mono);font-size:10.5px;color:var(--color-neutral-600)">${c.id}</span>
        <span style="background:${rp.bg};color:${rp.fg};font-size:9.5px;font-weight:600;letter-spacing:.03em;padding:2px 8px;border-radius:999px;font-variant-numeric:tabular-nums;flex:none">R ${r}</span>
      </div>
      <div style="font-size:12.5px;font-weight:500;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${cPrimary(c)}</div>
      <div style="font-size:11px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${cSecondary(c)}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;border-top:1px solid rgba(29,31,32,.07);padding-top:5px;margin-top:1px">
        <span style="font-size:10px;color:var(--color-neutral-600);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${stream}</span>
        <span style="font-size:11px;font-weight:500;font-variant-numeric:tabular-nums;white-space:nowrap;flex:none;color:${isMonetary(c)?'var(--color-text)':'var(--color-neutral-500)'}">${val}</span>
      </div>
    </div>`;
}
function pipeColumnInner(col, list){
  const shown=list.slice(0,PIPE_CAP);
  const more=list.length>PIPE_CAP?`<button data-pipe-more="${col.k}" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:6px 9px;font:inherit;font-size:11px;font-weight:500;color:var(--color-accent-700);cursor:pointer">+${list.length-PIPE_CAP} more in Register →</button>`:'';
  const empty=list.length?'':`<div style="border:1px dashed var(--color-divider);border-radius:4px;padding:22px 10px;text-align:center;font-size:11px;color:var(--color-neutral-500)">Nothing here</div>`;
  return shown.map(pipeCard).join('')+empty+more;
}
function renderPipeline(){
  const cs=state.contracts;
  const valOf=arr=>arr.reduce((s,c)=>s+Number(c.value||0),0);
  const groups=PIPE_COLS.map(col=>{ const list=cs.filter(c=>c.status===col.k); return {col, list, val:valOf(list)}; });

  const columnsHtml=groups.map(g=>`
    <div style="min-width:0;display:flex;flex-direction:column;min-height:0">
      <div style="display:flex;align-items:center;gap:6px;padding:0 2px 8px;min-width:0;flex:none">
        <span style="width:9px;height:9px;border-radius:50%;background:${g.col.color};flex:none;display:inline-block"></span>
        <span style="font-family:var(--font-mono);font-weight:600;font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap">${g.col.label}</span>
        <span style="font-size:10.5px;background:rgba(89,128,166,.1);padding:1px 8px;border-radius:999px;color:var(--color-neutral-700);flex:none;font-variant-numeric:tabular-nums">${g.list.length}</span>
        <span style="flex:1;min-width:4px"></span>
        <span style="font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap;flex:none;font-variant-numeric:tabular-nums">${fmtKESshort(g.val)}</span>
      </div>
      <div class="pipe-col scroll-thin" style="background:rgba(89,128,166,.05);border:1px solid var(--color-divider);border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:8px;flex:1;min-height:0;overflow-y:auto">
        ${pipeColumnInner(g.col, g.list)}
      </div>
    </div>`).join('');

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="height:calc(100vh - 52px);box-sizing:border-box;padding:14px 16px 18px;display:flex;flex-direction:column">
    <style>
      .q-card{transition:border-color .12s ease,box-shadow .12s ease}
      /* keep the category stripe (border-left) on hover — only the other three sides + shadow react */
      .q-card:hover{border-top-color:var(--color-accent)!important;border-right-color:var(--color-accent)!important;border-bottom-color:var(--color-accent)!important;box-shadow:var(--shadow-md)!important}
    </style>
    <div style="flex:none;margin-bottom:10px">${folderLegendHtml()}</div>
    <div style="flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,minmax(200px,1fr));gap:12px">${columnsHtml}</div>
  </div>`;

  wirePipeline();
  setActiveNav('pipeline');
}
// Restore a drop column to its resting look after a drag feedback state.
// (Kept for the Advice Desk board in advice.js, which still uses drag; the
// contract pipeline below no longer drags.)
function pipeColReset(col){ col.style.borderColor='var(--color-divider)'; col.style.background='rgba(89,128,166,.05)'; }
function wirePipeline(){
  // Cards only open the workspace — no dragging, so the board can never set a
  // stage the contract hasn't actually reached through a real action.
  document.querySelectorAll('[data-card]').forEach(el=>{
    const id=el.getAttribute('data-card');
    el.addEventListener('click',()=>selectContract(id));
  });
  document.querySelectorAll('[data-pipe-more]').forEach(el=>el.addEventListener('click',()=>{ regState().stage=el.getAttribute('data-pipe-more'); regState().type='all'; regState().sel={}; setView('register'); }));
}

Object.assign(window,{PIPE_CAP,PIPE_COLS,pipeCard,pipeColumnInner,pipeColReset,renderPipeline,wirePipeline});
