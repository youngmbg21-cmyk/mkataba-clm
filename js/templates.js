// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* Folders follow the FMCG value stream, from raw materials to market.
   Each carries a distinct `color` — the single source of truth for the
   category colour used by card edge-stripes, the map and reports. */
const FOLDERS = {
  proc:  { id:'proc',  name:'Procurement & Raw Materials', ic:'leaf',      color:'#2e9f80', desc:'Ingredient, commodity and packaging supply into the plants.' },
  mfg:   { id:'mfg',   name:'Manufacturing & Production',  ic:'factory',   color:'#b45309', desc:'Co-packing, tolling and plant equipment agreements.' },
  dist:  { id:'dist',  name:'Warehousing & Distribution',  ic:'truck',     color:'#0369a1', desc:'3PL warehousing, cold chain and primary distribution.' },
  sales: { id:'sales', name:'Sales & Route-to-Market',     ic:'store',     color:'#b8862b', desc:'Distributor, modern-trade and e-commerce supply deals.' },
  mktg:  { id:'mktg',  name:'Marketing & Brand',           ic:'megaphone', color:'#7c3aed', desc:'Agency, media, activation and sponsorship contracts.' },
  corp:  { id:'corp',  name:'Corporate & Compliance',      ic:'briefcase', color:'#2e8763', desc:'NDAs, leases, audit, legal and IT / professional services.' },
};

/* ---- Custom value streams ("folders") ----------------------------------
   Users can create their own named folders when filing contracts. They are
   persisted to localStorage and merged into FOLDERS on load, so every
   dropdown, filter chip, card stripe, map cluster and report grouping picks
   them up automatically (they all read from FOLDERS). templates.js loads
   before core.js, so this uses localStorage directly rather than lsGet. */
const FOLDER_LS = 'hati.v1.folders';
// palette cycled for new custom folders, kept distinct from the six built-ins
const CUSTOM_FOLDER_COLORS = ['#c2410c','#0e7490','#be123c','#4d7c0f','#1d4ed8','#9333ea','#0f766e','#a16207','#b91c1c','#0891b2'];
function loadCustomFolders(){
  let saved=null; try{ saved=JSON.parse(localStorage.getItem(FOLDER_LS)); }catch(e){}
  if(Array.isArray(saved)) saved.forEach(f=>{
    if(f && f.id && !FOLDERS[f.id]) FOLDERS[f.id]={ id:f.id, name:f.name, ic:f.ic||'folder', color:f.color||'#5980a6', desc:f.desc||'Custom value stream.', custom:true };
  });
}
function saveCustomFolders(){
  const custom=Object.values(FOLDERS).filter(f=>f.custom).map(f=>({ id:f.id, name:f.name, ic:f.ic, color:f.color, desc:f.desc }));
  try{ localStorage.setItem(FOLDER_LS, JSON.stringify(custom)); }catch(e){}
}
function slugifyFolder(name){
  const base='cf_'+String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24);
  let id=(base==='cf_'?'cf_stream':base), n=2; while(FOLDERS[id]){ id=base+'-'+n; n++; } return id;
}
function addCustomFolder(name){
  name=String(name||'').trim(); if(!name) return null;
  // reuse an existing folder with the same name (case-insensitive) rather than duplicate
  const existing=Object.values(FOLDERS).find(f=>f.name.toLowerCase()===name.toLowerCase());
  if(existing) return existing;
  const used=Object.values(FOLDERS).map(f=>(f.color||'').toLowerCase());
  const color=CUSTOM_FOLDER_COLORS.find(c=>!used.includes(c.toLowerCase())) || CUSTOM_FOLDER_COLORS[Object.keys(FOLDERS).length%CUSTOM_FOLDER_COLORS.length];
  const id=slugifyFolder(name);
  FOLDERS[id]={ id, name, ic:'folder', color, desc:'Custom value stream.', custom:true };
  saveCustomFolders();
  return FOLDERS[id];
}
// category colour for a contract (or folder id); falls back to a neutral hairline
function folderColor(idOrContract){
  const id=(idOrContract && typeof idOrContract==='object') ? idOrContract.folder : idOrContract;
  return (FOLDERS[id] && FOLDERS[id].color) || 'var(--color-divider)';
}
/* Legend that explains the card / row edge-stripe colours. Each entry mirrors
   the stripe (a short vertical bar) next to its stream name, so the colour code
   is self-documenting on any striped view. Custom streams are included too. */
function folderLegendHtml(opts={}){
  const short = f => (typeof STREAM_SHORT!=='undefined' && STREAM_SHORT[f.id]) || f.name;
  const items = Object.values(FOLDERS).map(f=>`<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:var(--color-neutral-700);white-space:nowrap"><span style="width:4px;height:12px;border-radius:2px;background:${f.color};flex:none"></span>${short(f)}</span>`).join('');
  return `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;${opts.style||''}">
    <span style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500)">Value streams</span>
    ${items}
  </div>`;
}
// <option> list for any "file under" select — includes a create sentinel
function folderOptionsHtml(selectedId, includeAuto){
  return (includeAuto?`<option value="auto" ${selectedId==='auto'?'selected':''}>Auto — route by contract type</option>`:'')
    + Object.values(FOLDERS).map(f=>`<option value="${f.id}" ${selectedId===f.id?'selected':''}>${f.name}</option>`).join('')
    + `<option value="__new__">＋ Create new stream…</option>`;
}
function rebuildFolderSelect(sel, selectedId){
  if(!sel) return;
  const includeAuto=!!sel.querySelector('option[value="auto"]');
  sel.innerHTML=folderOptionsHtml(selectedId, includeAuto);
  sel.value=selectedId;
}
/* Styled "new stream" prompt — a self-contained body overlay (like
   confirmDialog) so it stacks ABOVE an open modal instead of clobbering it.
   Resolves to the created folder object, or null if cancelled. */
function promptNewFolder(){
  return new Promise(resolve=>{
    const prev=document.getElementById('newfolder-overlay'); if(prev) prev.remove();
    const ov=document.createElement('div'); ov.id='newfolder-overlay';
    ov.style.cssText='position:fixed;inset:0;z-index:95;display:grid;place-items:center;padding:16px';
    ov.innerHTML=`
      <div id="nf-scrim" style="position:absolute;inset:0;background:color-mix(in srgb,#2b2b2d 50%,transparent)"></div>
      <div class="modal-in" role="dialog" aria-modal="true" style="position:relative;width:100%;max-width:26rem;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:7px;padding:22px 24px">
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:16px;margin:0 0 4px">New value stream</h3>
        <p style="font-size:12px;color:var(--color-neutral-600);margin:0 0 14px;line-height:1.5">Create a custom folder to file contracts under. It becomes available everywhere streams are used — dropdowns, filters, the map and reports.</p>
        <input id="nf-name" placeholder="e.g. Legal &amp; Regulatory" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:9px 11px;font:inherit;font-size:13px;outline:none" />
        <div id="nf-err" style="font-size:11px;color:#b0453c;margin-top:6px;display:none">Please enter a name.</div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
          <button id="nf-cancel" class="ui-btn" style="font-size:12px">Cancel</button>
          <button id="nf-save" class="ui-btn ui-btn-primary" style="font-size:12px">Create stream</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const input=ov.querySelector('#nf-name'); setTimeout(()=>input.focus(),30);
    const done=v=>{ ov.remove(); resolve(v); };
    const save=()=>{ const name=input.value.trim(); if(!name){ ov.querySelector('#nf-err').style.display='block'; return; } done(addCustomFolder(name)); };
    ov.querySelector('#nf-save').addEventListener('click',save);
    ov.querySelector('#nf-cancel').addEventListener('click',()=>done(null));
    ov.querySelector('#nf-scrim').addEventListener('click',()=>done(null));
    input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); save(); } else if(e.key==='Escape') done(null); });
  });
}
/* Wire a "file under" <select> so choosing "＋ Create new stream…" opens the
   prompt, adds the folder and re-selects it — works in views and inside modals. */
function bindFolderSelect(sel, onPick){
  if(!sel || sel.dataset.folderBound) return; sel.dataset.folderBound='1';
  let last=sel.value;
  sel.addEventListener('change', async ()=>{
    if(sel.value==='__new__'){
      const f=await promptNewFolder();
      if(f){ rebuildFolderSelect(sel, f.id); last=f.id; if(onPick) onPick(f.id); }
      else sel.value=last;
      return;
    }
    last=sel.value; if(onPick) onPick(sel.value);
  });
}
loadCustomFolders();
const TEMPLATES = {
  RM:{ id:'RM', name:'Raw Material Supply Agreement', kind:'Raw Material Supply', ic:'leaf', folder:'proc', valueType:'estimated', blurb:'Commodity & ingredient supply into the plants.' },
  PK:{ id:'PK', name:'Packaging Supply Agreement', kind:'Packaging Supply', ic:'box', folder:'proc', valueType:'estimated', blurb:'Bottles, cartons, films and labels.' },
  CM:{ id:'CM', name:'Contract Manufacturing (Co-Packing)', kind:'Contract Manufacturing', ic:'factory', folder:'mfg', valueType:'estimated', blurb:'Outsourced production & tolling.' },
  EQ:{ id:'EQ', name:'Equipment Lease & Maintenance', kind:'Equipment Lease', ic:'wrench', folder:'mfg', valueType:'fixed', blurb:'Plant machinery lease and servicing.' },
  WH:{ id:'WH', name:'Warehousing & Cold-Chain Agreement', kind:'Warehousing', ic:'box', folder:'dist', valueType:'fixed', blurb:'3PL storage and temperature-controlled space.' },
  FF:{ id:'FF', name:'Freight & Distribution Agreement', kind:'Distribution Logistics', ic:'truck', folder:'dist', valueType:'estimated', blurb:'Primary and last-mile distribution.' },
  DA:{ id:'DA', name:'Distributor Agreement', kind:'Distributor', ic:'cart', folder:'sales', valueType:'estimated', blurb:'Regional route-to-market distributor terms.' },
  RL:{ id:'RL', name:'Retail Listing & Supply Agreement', kind:'Retail Listing', ic:'store', folder:'sales', valueType:'estimated', blurb:'Modern-trade supermarket listing & supply.' },
  MK:{ id:'MK', name:'Marketing & Trade Promotion Services', kind:'Marketing Services', ic:'megaphone', folder:'mktg', valueType:'fixed', blurb:'Agency, media and activation services.' },
  ND:{ id:'ND', name:'Mutual Non-Disclosure Agreement', kind:'NDA', ic:'shield', folder:'corp', valueType:'none', blurb:'Confidentiality for NPD & vendor onboarding.' },
  LE:{ id:'LE', name:'Commercial Property Lease', kind:'Lease', ic:'building', folder:'corp', valueType:'fixed', blurb:'Office, depot and premises leases.' },
  PS:{ id:'PS', name:'Professional Services Agreement', kind:'Professional Services', ic:'briefcase', folder:'corp', valueType:'fixed', blurb:'Audit, legal and advisory retainers.' },
};
Object.assign(window,{FOLDERS,TEMPLATES,addCustomFolder,folderColor,folderLegendHtml,folderOptionsHtml,rebuildFolderSelect,promptNewFolder,bindFolderSelect,saveCustomFolders});
