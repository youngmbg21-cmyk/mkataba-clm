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
  {k:'Draft',        label:'Drafting',  color:'var(--st-gray-dot)'},
  {k:'Under Review', label:'In Review', color:'var(--st-amber-dot)'},
  {k:'Signed',       label:'Executed',  color:'var(--st-green-dot)'},
  {k:'Declined',     label:'Closed',    color:'var(--st-ruby-dot)'},
];
const PIPE_CAP=60;
// A single queue card. Click to open the workspace — cards are not draggable,
// so a stage can't be changed from the board (see the header note).
function pipeCard(c){
  const r = contractRisk(c);
  const rp = riskPal(r);
  const stream = streamLabel(c);
  const val = !isMonetary(c) ? 'n/m' : (c.value ? (window.fmtMoneyShortOf ? fmtMoneyShortOf(c) : (window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value))) : '—');
  return `
    <div data-card="${c.id}" class="q-card" style="background:var(--color-surface);border:1px solid var(--color-divider);border-left:4px solid ${folderColor(c)};border-radius:0;box-shadow:var(--shadow-sm);padding:11px 12px;cursor:pointer;display:flex;flex-direction:column;gap:5px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
        <span style="font-family:var(--font-mono);font-size:12px;color:var(--color-neutral-600)">${c.id}</span>
        <span style="background:${rp.bg};color:${rp.fg};font-size:12px;font-weight:600;letter-spacing:.03em;padding:2px 8px;border-radius:0;font-variant-numeric:tabular-nums;flex:none">R ${r}</span>
      </div>
      <div style="font-size:14px;font-weight:400;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${cPrimary(c)}</div>
      <div style="font-size:12px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${cSecondary(c)}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;border-top:1px solid color-mix(in srgb,var(--color-text) 8%,transparent);padding-top:5px;margin-top:1px">
        <span style="font-size:12px;color:var(--color-neutral-600);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${stream}</span>
        <span style="font-size:12px;font-weight:400;font-variant-numeric:tabular-nums;white-space:nowrap;flex:none;color:${isMonetary(c)?'var(--color-text)':'var(--color-neutral-500)'}">${val}</span>
      </div>
    </div>`;
}
function pipeColumnInner(col, list){
  const shown=list.slice(0,PIPE_CAP);
  const more=list.length>PIPE_CAP?`<button data-pipe-more="${col.k}" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:6px 9px;font:inherit;font-size:12px;font-weight:400;color:var(--color-accent-700);cursor:pointer">+${list.length-PIPE_CAP} more in Register →</button>`:'';
  const empty=list.length?'':`<div style="border:1px dashed var(--color-divider);border-radius:0;padding:22px 10px;text-align:center;font-size:12px;color:var(--color-neutral-500)">${i18t('queue_nothing_here')}</div>`;
  return shown.map(pipeCard).join('')+empty+more;
}
function renderPipeline(){
  const cs=state.contracts;
  const valOf=arr=>arr.reduce((s,c)=>s+(window.fxHomeValue?fxHomeValue(c):Number(c.value||0)),0);
  const groups=PIPE_COLS.map(col=>{ const list=cs.filter(c=>c.status===col.k); return {col, list, val:valOf(list)}; });

  const columnsHtml=groups.map(g=>`
    <div style="min-width:0;display:flex;flex-direction:column;min-height:0">
      <div style="display:flex;align-items:center;gap:6px;padding:0 2px 8px;min-width:0;flex:none">
        <span style="width:9px;height:9px;border-radius:50%;background:${g.col.color};flex:none;display:inline-block"></span>
        <span style="font-family:var(--font-mono);font-weight:700;font-size:14px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap">${g.col.label}</span>
        <span style="font-size:12px;background:color-mix(in srgb,var(--color-accent) 11%,transparent);padding:1px 8px;border-radius:0;color:var(--color-neutral-700);flex:none;font-variant-numeric:tabular-nums">${g.list.length}</span>
        <span style="flex:1;min-width:4px"></span>
        <span style="font-size:12px;color:var(--color-neutral-600);white-space:nowrap;flex:none;font-variant-numeric:tabular-nums">${fmtMoneyShort(g.val)}</span>
      </div>
      <div class="pipe-col scroll-thin" style="background:color-mix(in srgb,var(--color-accent) 6%,transparent);border:1px solid var(--color-divider);border-radius:0;padding:8px;display:flex;flex-direction:column;gap:8px;flex:1;min-height:0;overflow-y:auto">
        ${pipeColumnInner(g.col, g.list)}
      </div>
    </div>`).join('');

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="height:var(--view-h);box-sizing:border-box;padding:14px 16px 18px;display:flex;flex-direction:column">
    <style>
      .q-card{transition:border-color .12s ease,box-shadow .12s ease}
      /* keep the category stripe (border-left) on hover — only the other three sides + shadow react */
      .q-card:hover{border-top-color:var(--color-accent)!important;border-right-color:var(--color-accent)!important;border-bottom-color:var(--color-accent)!important;box-shadow:var(--shadow-md)!important}
    </style>
    <div style="flex:none;margin-bottom:10px">${folderLegendHtml()}</div>
    <div class="board-cols board-4" style="flex:1;min-height:0;display:grid;gap:12px">${columnsHtml}</div>
  </div>`;

  wirePipeline();
  setActiveNav('pipeline');
}
// Restore a drop column to its resting look after a drag feedback state.
// (Kept for the Advice Desk board in advice.js, which still uses drag; the
// contract pipeline below no longer drags.)
function pipeColReset(col){ col.style.borderColor='var(--color-divider)'; col.style.background='color-mix(in srgb,var(--color-accent) 6%,transparent)'; }
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
