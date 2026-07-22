// HaTi — Templates page + Playbook page (both own nav items).
// Globals window-attached like every other view module.
//
// Templates: the built-in HaTi generators (TEMPLATES), the workspace's own
// custom templates (uploaded documents or contracts saved as templates,
// persisted in state.settings.customTemplates through saveSettings so they
// work in both local and server mode), and the bundled HaTi sample PDFs.
// Playbook: the clause library + per-type playbook that previously lived in
// a Settings card, promoted to a full page, plus a portfolio deviations list.

/* ============================================================ CUSTOM TEMPLATES */
function customTemplates(){ return (state.settings&&state.settings.customTemplates)||[]; }
function saveCustomTemplates(list){ state.settings=state.settings||{}; state.settings.customTemplates=list; saveSettings(); }
const tplCanManage=()=>canEdit();   // Admin + Legal (viewers read-only)
const _tplEsc=s=>String(s||'').replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));

// The bundled sample documents (see sample-contracts/) — importable as templates.
const HATI_SAMPLES=[
  {file:'01_Naivas_Supplier_Agreement.pdf',        name:'Naivas Supplier Agreement',            folder:'sales'},
  {file:'02_KCB_Overdraft_Facility_Letter.pdf',    name:'KCB Overdraft Facility Letter',        folder:'corp'},
  {file:'03_Britam_Head_Office_Lease.pdf',         name:'Britam Head Office Lease',             folder:'corp'},
  {file:'04_Givaudan_Flavour_Supply_Terms.pdf',    name:'Givaudan Flavour Supply Terms',        folder:'proc'},
  {file:'05_Siginon_Warehousing_3PL_Agreement.pdf',name:'Siginon Warehousing & 3PL Agreement',  folder:'dist'},
];

/* Create a working draft whose document body IS the template's text. It flows
   through versioning / compare / share / sealing via the existing
   redlineText (working-text) mechanism — no new document pipeline. */
function createFromCustomTemplate(tid){
  if(!canEdit()){ toast('Viewers cannot create contracts','err'); return; }
  const t=customTemplates().find(x=>x.id===tid);
  if(!t){ toast('Template not found','err'); return; }
  const u=currentUser();
  const c={ id:nextId(), name:t.name+' (Draft)', counterparty:'', value:0, status:'Draft',
    template:null, folder:FOLDERS[t.folder]?t.folder:'corp', valueType:'estimated',
    lastAction:todayStr(), hash:null, signedAt:null, signatory:u?.name||'Authorized signatory',
    compliance:{iprs:false,pki:false},
    comments:[{author:'System',role:'Automation',side:'internal',text:`New draft created from your template “${t.name}”. Edit the document text, set the counterparty and value, then share for review.`,ts:fmtDT(nowISO())}],
    fields:{}, scan:null, expiry:null,
    redlineText:t.text,
    versions:[{n:1, at:nowISO(), by:u?.name||'System', label:`Template “${t.name}”`, text:t.text}],
    audit:[{at:nowISO(),user:u?.name||'System',action:'Created',detail:`Created from custom template “${t.name}”`}],
    signatures:[] };
  c._loaded=true; c._light=false; c._v=0;
  state.contracts.unshift(c);
  state.activeId=c.id; state.selId=c.id;
  persist(c);
  toast(`Draft created from “${t.name}”`);
  setView('workspace');
}

function saveTemplateRecord(name, folder, text, source){
  const list=customTemplates().slice();
  list.push({ id:'tpl_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),
    name, folder:FOLDERS[folder]?folder:'corp', text, source:source||'upload',
    by:currentUser()?.name||'—', at:nowISO(), chars:text.length });
  saveCustomTemplates(list);
}

/* "Save as template" from a contract's workspace — reuse paper you like. */
function saveContractAsTemplate(c){
  if(!tplCanManage()){ toast('Viewers cannot save templates','err'); return; }
  const text=docPlainText(c);
  if(!text||text.length<40){ toast('This document has no reusable text yet','err'); return; }
  const defName=c.name.replace(/\s*\(Draft\)\s*$/,'').replace(/\s*—.*$/,'').trim()||c.name;
  const opts=Object.values(FOLDERS).map(f=>`<option value="${f.id}" ${c.folder===f.id?'selected':''}>${f.name}</option>`).join('');
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="color:var(--color-accent)">${icon('copy','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Save as template</h3></div>
      <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.5">Saves this document's current text (${text.length.toLocaleString()} characters) as a reusable template. It will appear under <b>My templates</b> and in the New-contract menu.</p>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Template name</span>
        <input id="tpl-name" value="${defName.replace(/"/g,'&quot;')}" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none"/></label>
      <label style="display:block;margin-bottom:14px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Value stream</span>
        <select id="tpl-folder" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 8px;font:inherit;font-size:13px">${opts}</select></label>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button id="tpl-cancel" class="ui-btn">Cancel</button>
        <button id="tpl-save" class="ui-btn ui-btn-primary">Save template</button>
      </div>
    </div>`);
  document.getElementById('tpl-cancel').addEventListener('click',closeModal);
  document.getElementById('tpl-save').addEventListener('click',()=>{
    const name=document.getElementById('tpl-name').value.trim();
    if(!name){ toast('Give the template a name','err'); return; }
    saveTemplateRecord(name, document.getElementById('tpl-folder').value, text, 'contract:'+c.id);
    logAudit(c,'Template','Saved as reusable template “'+name+'”'); persist(c);
    closeModal(); toast(`Template “${name}” saved`);
    if(state.view==='templates') renderTemplatesPage();
  });
}

/* Upload a document (PDF / text / Word-extracted) as a reusable template. */
function openUploadTemplateModal(){
  if(!tplCanManage()){ toast('Viewers cannot add templates','err'); return; }
  const opts=Object.values(FOLDERS).map(f=>`<option value="${f.id}">${f.name}</option>`).join('');
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="color:var(--color-accent)">${icon('upload','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Upload a template</h3></div>
      <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.5">Upload your company's standard contract (PDF or text). HaTi extracts the text so new drafts can start from your own paper.</p>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Template name</span>
        <input id="ut-name" placeholder="e.g. Standard Distribution Agreement" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none"/></label>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Value stream</span>
        <select id="ut-folder" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 8px;font:inherit;font-size:13px">${opts}</select></label>
      <label style="display:block;margin-bottom:6px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Document file</span>
        <input id="ut-file" type="file" accept=".pdf,.txt,.md,.doc,.docx,text/plain,application/pdf" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:7px 10px;font:inherit;font-size:12px"/></label>
      <div id="ut-status" style="font-size:11px;color:var(--color-neutral-600);min-height:16px;margin-bottom:10px"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button id="ut-cancel" class="ui-btn">Cancel</button>
        <button id="ut-save" class="ui-btn ui-btn-primary">Extract &amp; save</button>
      </div>
    </div>`);
  document.getElementById('ut-cancel').addEventListener('click',closeModal);
  document.getElementById('ut-save').addEventListener('click',async()=>{
    const name=document.getElementById('ut-name').value.trim();
    const file=document.getElementById('ut-file').files[0];
    const st=document.getElementById('ut-status');
    if(!name){ toast('Give the template a name','err'); return; }
    if(!file){ toast('Choose a file','err'); return; }
    if(file.size>UPLOAD_MAX){ toast('File is over the 4 MB limit','err'); return; }
    st.textContent='Reading file…';
    try{
      const dataUrl=await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
      st.textContent='Extracting text…';
      const text=await extractDocText(dataUrl, file.type||'');
      if(!text||text.length<40){ st.innerHTML='<span style="color:#8f322b">Could not extract readable text from this file — image-only PDFs and Word files need conversion first.</span>'; return; }
      saveTemplateRecord(name, document.getElementById('ut-folder').value, text, 'upload:'+file.name);
      closeModal(); toast(`Template “${name}” saved — ${text.length.toLocaleString()} characters extracted`);
      if(state.view==='templates') renderTemplatesPage();
    }catch(e){ st.innerHTML='<span style="color:#8f322b">Extraction failed: '+_tplEsc(e.message)+'</span>'; }
  });
}

/* Import one of the bundled HaTi sample PDFs as a custom template. */
async function importHatiSample(i, btn){
  if(!tplCanManage()){ toast('Viewers cannot add templates','err'); return; }
  const s=HATI_SAMPLES[i]; if(!s) return;
  if(btn){ btn.disabled=true; btn.textContent='Importing…'; }
  try{
    const r=await fetch('sample-contracts/'+s.file);
    if(!r.ok) throw new Error('file not found ('+r.status+')');
    const blob=await r.blob();
    const dataUrl=await new Promise((res,rej)=>{ const rd=new FileReader(); rd.onload=()=>res(rd.result); rd.onerror=rej; rd.readAsDataURL(blob); });
    const text=await extractDocText(dataUrl,'application/pdf');
    if(!text||text.length<40) throw new Error('no readable text in this PDF');
    saveTemplateRecord(s.name, s.folder, text, 'sample:'+s.file);
    toast(`Sample “${s.name}” imported to My templates`);
    renderTemplatesPage();
  }catch(e){ toast('Import failed: '+e.message,'err'); if(btn){ btn.disabled=false; btn.textContent='Import as template'; } }
}

function openTemplatePreview(tpl){
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:4px">
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">${_tplEsc(tpl.name)}</h3>
        <span style="font-size:11px;color:var(--color-neutral-600)">${FOLDERS[tpl.folder]?.name||''}</span>
      </div>
      <p style="font-size:11px;color:var(--color-neutral-600);margin:0 0 10px">${tpl.chars?tpl.chars.toLocaleString()+' characters · ':''}added ${tpl.at?fmtDT(tpl.at):''} by ${_tplEsc(tpl.by||'—')}</p>
      <div class="scroll-thin" style="border:1px solid var(--color-divider);border-radius:5px;background:var(--color-bg);padding:14px 16px;font-size:12.5px;line-height:1.8;max-height:55vh;overflow-y:auto;white-space:pre-wrap">${_tplEsc(tpl.text)}</div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
        ${canEdit()?`<button id="tp-use" class="ui-btn ui-btn-primary">Use template</button>`:''}
        <button id="tp-close" class="ui-btn">Close</button>
      </div>
    </div>`, {maxWidth:'820px'});
  document.getElementById('tp-close').addEventListener('click',closeModal);
  document.getElementById('tp-use')?.addEventListener('click',()=>{ closeModal(); createFromCustomTemplate(tpl.id); });
}

/* ============================================================ TEMPLATES PAGE */
function renderTemplatesPage(){
  const CARD='background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:10px';
  const H4='font-family:var(--font-heading);font-weight:600;font-size:15px;margin:0';
  const my=customTemplates();
  const canManage=tplCanManage();
  // tone icon-tile per value stream (tile-bg / tile-fg tokens)
  const TPL_TONE={proc:'steel',mfg:'amber',dist:'emerald',sales:'steel',mktg:'amber',corp:'ruby'};
  const tplTile=folder=>{ const t=TPL_TONE[folder]||'steel'; return `background:var(--tile-${t}-bg);color:var(--tile-${t}-fg)`; };

  const myCards=my.map(t=>`
    <div class="lift" style="${CARD};padding:14px;display:flex;flex-direction:column;gap:6px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:5px;${tplTile(t.folder)}">${icon('copy','w-3.5 h-3.5')}</span>
        <span style="min-width:0;flex:1">
          <span style="display:block;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_tplEsc(t.name)}</span>
          <span style="display:block;font-size:10px;color:var(--color-neutral-600)">${FOLDERS[t.folder]?.name||'—'} · ${(t.chars||t.text.length).toLocaleString()} chars</span>
        </span>
      </div>
      <div style="font-size:10px;color:var(--color-neutral-500)">${t.source&&t.source.startsWith('contract:')?'From contract '+t.source.slice(9):t.source&&t.source.startsWith('sample:')?'HaTi sample':'Uploaded'} · ${t.at?fmtDT(t.at):''}</div>
      <div style="display:flex;gap:6px;margin-top:2px">
        ${canManage?`<button data-tpl-use="${t.id}" class="ui-btn ui-btn-primary" style="font-size:11.5px;padding:4px 10px;flex:1">Use</button>`:''}
        <button data-tpl-prev="${t.id}" class="ui-btn" style="font-size:11.5px;padding:4px 10px">Preview</button>
        ${canManage?`<button data-tpl-del="${t.id}" class="ui-btn" style="font-size:11.5px;padding:4px 8px;border-color:#e6c9c1;color:#8f322b">${icon('trash','w-3 h-3')}</button>`:''}
      </div>
    </div>`).join('');

  const builtinCards=Object.values(TEMPLATES).map(t=>`
    <div class="lift" style="${CARD};padding:14px;display:flex;flex-direction:column;gap:6px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:5px;${tplTile(t.folder)}">${icon(t.ic,'w-3.5 h-3.5')}</span>
        <span style="min-width:0;flex:1">
          <span style="display:block;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name}</span>
          <span style="display:block;font-size:10px;color:var(--color-neutral-600)">${FOLDERS[t.folder].name} · Template ${t.id}</span>
        </span>
      </div>
      <div style="font-size:10.5px;color:var(--color-neutral-600);line-height:1.45;flex:1">${t.blurb||''}</div>
      ${canManage?`<button data-tpl-builtin="${t.id}" class="ui-btn ui-btn-primary" style="font-size:11.5px;padding:4px 10px;margin-top:2px">Use template</button>`:''}
    </div>`).join('');

  const already=new Set(my.filter(t=>t.source&&t.source.startsWith('sample:')).map(t=>t.source.slice(7)));
  const sampleRows=HATI_SAMPLES.map((s,i)=>`
    <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid rgba(29,31,32,.06)">
      <span style="color:var(--color-neutral-500)">${icon('file','w-4 h-4')}</span>
      <span style="min-width:0;flex:1">
        <span style="display:block;font-size:12px;font-weight:500">${s.name}</span>
        <span style="display:block;font-size:10px;color:var(--color-neutral-600);font-family:var(--font-mono)">${s.file} · ${FOLDERS[s.folder].name}</span>
      </span>
      ${already.has(s.file)
        ?`<span class="badge" style="background:#e8f4ee;color:#1e6b4d"><span class="dot" style="background:#2e8763"></span>Imported</span>`
        :canManage?`<button data-sample-imp="${i}" class="ui-btn" style="font-size:11px;padding:4px 10px;flex:none">Import as template</button>`:''}
    </div>`).join('');

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:16px 18px 28px;display:flex;flex-direction:column;gap:18px">

    <section style="${CARD};padding:16px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:${my.length?'12px':'6px'}">
        <h4 style="${H4}">My templates</h4>
        <span style="font-size:10.5px;color:var(--color-neutral-600)">${my.length} saved</span>
        <span style="flex:1"></span>
        ${canManage?`<button id="tpl-upload" class="ui-btn ui-btn-primary" style="font-size:12px;padding:5px 12px">${icon('upload','w-3.5 h-3.5')} Upload a template</button>`:''}
      </div>
      ${my.length
        ?`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px">${myCards}</div>`
        :`<p style="font-size:12px;color:var(--color-neutral-600);margin:0;line-height:1.6">No custom templates yet. <b>Upload</b> your company's standard paper here, <b>import</b> a HaTi sample below, or open any contract and use <b>Save as template</b> in its workspace toolbar. Saved templates appear in the + New contract menu.</p>`}
    </section>

    <section style="${CARD};padding:16px">
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:12px">
        <h4 style="${H4}">HaTi standard templates</h4>
        <span style="font-size:10.5px;color:var(--color-neutral-600)">${Object.keys(TEMPLATES).length} generators · guided fields, Kenyan practice defaults</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px">${builtinCards}</div>
    </section>

    <section style="${CARD}">
      <div style="display:flex;align-items:baseline;gap:10px;padding:13px 16px;border-bottom:1px solid var(--color-divider)">
        <h4 style="${H4}">HaTi sample documents</h4>
        <span style="font-size:10.5px;color:var(--color-neutral-600)">real-world Kenyan examples — import one to start your library</span>
      </div>
      ${sampleRows}
    </section>
  </div>`;

  document.getElementById('tpl-upload')?.addEventListener('click',openUploadTemplateModal);
  document.querySelectorAll('[data-tpl-use]').forEach(b=>b.addEventListener('click',()=>createFromCustomTemplate(b.getAttribute('data-tpl-use'))));
  document.querySelectorAll('[data-tpl-prev]').forEach(b=>b.addEventListener('click',()=>{ const t=customTemplates().find(x=>x.id===b.getAttribute('data-tpl-prev')); if(t) openTemplatePreview(t); }));
  document.querySelectorAll('[data-tpl-del]').forEach(b=>b.addEventListener('click',async()=>{
    const t=customTemplates().find(x=>x.id===b.getAttribute('data-tpl-del')); if(!t) return;
    if(!await confirmDialog({title:`Delete template “${t.name}”?`, message:'Existing contracts created from it are not affected.', confirmLabel:'Delete template', danger:true})) return;
    saveCustomTemplates(customTemplates().filter(x=>x.id!==t.id)); toast('Template deleted'); renderTemplatesPage();
  }));
  document.querySelectorAll('[data-tpl-builtin]').forEach(b=>b.addEventListener('click',()=>createFromTemplate(b.getAttribute('data-tpl-builtin'))));
  document.querySelectorAll('[data-sample-imp]').forEach(b=>b.addEventListener('click',()=>importHatiSample(Number(b.getAttribute('data-sample-imp')), b)));
  setActiveNav('templates');
}

/* ============================================================ PLAYBOOK PAGE */
function renderPlaybookPage(){
  const CARD='background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:10px';
  const H4='font-family:var(--font-heading);font-weight:600;font-size:15px;margin:0';
  const canEditLib=isAdmin()||currentUser()?.role==='legal';

  // portfolio deviations (from the existing playbook review results)
  const devRows=state.contracts
    .map(c=>({c, s:(window.deviationSummary?deviationSummary(c):null)}))
    .filter(x=>x.s&&(x.s.dev+x.s.miss)>0)
    .sort((a,b)=>(b.s.dev+b.s.miss)-(a.s.dev+a.s.miss)).slice(0,8);
  const devHtml=devRows.length?devRows.map(x=>`
    <button data-dev-open="${x.c.id}" style="display:flex;align-items:center;gap:8px;width:100%;padding:6px 2px;border:0;border-bottom:1px solid rgba(29,31,32,.06);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit" onmouseover="this.style.background='rgba(29,31,32,.04)'" onmouseout="this.style.background='none'">
      <span style="flex:1;min-width:0">
        <span style="display:block;font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${x.c.name}</span>
        <span style="display:block;font-size:10px;color:var(--color-neutral-600)">${x.c.id} · ${x.c.counterparty||'—'}</span>
      </span>
      <span class="badge" style="background:#fbf4e3;color:#7d5a14;flex:none">${x.s.dev+x.s.miss} deviation${x.s.dev+x.s.miss===1?'':'s'}</span>
    </button>`).join('')
    :`<p style="font-size:11.5px;color:var(--color-neutral-600);margin:0;line-height:1.6">No playbook deviations recorded yet. Run the <b>AI review</b> from a contract's workspace — deviations from these positions will be listed here.</p>`;

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:16px 18px 28px">
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:18px;align-items:start">

      <section style="${CARD};padding:16px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <h4 style="${H4}">Clause library</h4>
          <span style="font-size:10.5px;color:var(--color-neutral-600)">preferred &amp; fallback wording · ${canEditLib?'Admin / Legal can edit':'read-only for your role'}</span>
          <span style="flex:1"></span>
          ${canEditLib?`<button id="cl-add" class="ui-btn ui-btn-primary" style="font-size:12px;padding:5px 12px">${icon('plus','w-3.5 h-3.5')} Add clause</button>`:''}
        </div>
        <p style="font-size:11.5px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">Your standard clauses — the wording HaTi drafts with and the AI review checks incoming paper against.</p>
        <div id="clause-lib" style="display:flex;flex-direction:column;gap:8px"></div>
      </section>

      <div style="display:flex;flex-direction:column;gap:18px">
        <section style="${CARD};padding:16px">
          <h4 style="${H4};margin-bottom:8px">Negotiation playbook</h4>
          <p style="font-size:11.5px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">Positions per contract type. Red = required / forbidden, steel = preferred, amber = numeric range.</p>
          <div id="playbook-view"></div>
        </section>
        <section style="${CARD};padding:16px">
          <h4 style="${H4};margin-bottom:8px">Portfolio deviations</h4>
          ${devHtml}
        </section>
      </div>
    </div>
  </div>`;

  renderClauseLibrary();   // fills #clause-lib and #playbook-view, wires edit/add/remove
  document.querySelectorAll('[data-dev-open]').forEach(b=>b.addEventListener('click',()=>openWorkspace(b.getAttribute('data-dev-open'))));
  setActiveNav('playbook');
}

Object.assign(window,{HATI_SAMPLES,createFromCustomTemplate,customTemplates,importHatiSample,openTemplatePreview,openUploadTemplateModal,renderPlaybookPage,renderTemplatesPage,saveContractAsTemplate,saveCustomTemplates,saveTemplateRecord});
