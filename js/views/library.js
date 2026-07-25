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
  // A template with blanks goes through the same guided fill as the built-ins,
  // so the contract arrives with structured data rather than raw text.
  const fs=templateFields(t);
  if(fs.length){ openTemplateFillModal(t); return; }
  buildFromCustomTemplate(t, {});
}
/* The actual creation, shared by the guided fill and the no-blanks path. */
function buildFromCustomTemplate(t, values){
  const u=currentUser();
  const fs=templateFields(t);
  const body=fillTemplateBody(templateBody(t), values);
  const cp=(()=>{ const f=fs.find(x=>x.maps==='counterparty'); return f?String(values[f.key]||''):''; })();
  const c={ id:nextId(), name:t.name+(cp?' — '+cp:' (Draft)'), counterparty:'', value:0, status:'Draft',
    template:null, source:'template', folder:FOLDERS[t.folder]?t.folder:'corp', valueType:'estimated',
    lastAction:todayStr(), hash:null, signedAt:null, signatory:u?.name||'Authorized signatory',
    compliance:{iprs:false,pki:false},
    comments:[{author:'System',role:'Automation',side:'internal',
      text:`New draft created from your template “${t.name}”.${fs.length?' The details you filled in are already filed as contract data — the register, filters and reports pick them up without re-keying.':' Edit the document text, set the counterparty and value, then share for review.'}`,ts:fmtDT(nowISO())}],
    fields:{}, scan:null, expiry:null,
    redlineText:body,
    versions:[{n:1, at:nowISO(), by:u?.name||'System', label:`Template “${t.name}”`, text:body}],
    audit:[{at:nowISO(),user:u?.name||'System',action:'Created',detail:`Created from custom template “${t.name}”${fs.length?` · ${fs.length} field${fs.length===1?'':'s'} filled`:''}`}],
    signatures:[], templateRef:t.id };
  if(fs.length) applyTemplateValues(c, fs, values);
  c._loaded=true; c._light=false; c._v=0;
  state.contracts.unshift(c);
  state.activeId=c.id; state.selId=c.id;
  persist(c);
  toast(`Draft created from “${t.name}”`);
  setView('workspace');
  return c;
}
/* Guided fill for a custom template — the same shape as the built-in wizard. */
function openTemplateFillModal(t){
  const fs=templateFields(t);
  const inp=f=>{ const id='tf-'+f.key;
    const lbl=`<span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px">${_tplEsc(f.label)}${f.required?' <span style="color:#8f322b">*</span>':''}${f.maps?`<span style="font-weight:400;color:var(--color-neutral-500)"> → ${_tplEsc(tplMapLabel(f.maps))}</span>`:''}</span>`;
    const st='width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 11px;font:inherit;font-size:13px;outline:none';
    if(f.type==='select') return `<label style="display:block">${lbl}<select id="${id}" style="${st}">${(f.opts||[]).map(o=>`<option value="${_tplEsc(o).replace(/"/g,'&quot;')}" ${f.def===o?'selected':''}>${_tplEsc(o)}</option>`).join('')}</select></label>`;
    const it=f.type==='date'?'date':(f.type==='num'?'number':'text');
    return `<label style="display:block">${lbl}<input id="${id}" type="${it}" value="${String(f.def||'').replace(/"/g,'&quot;')}" placeholder="${_tplEsc(f.ph||'')}" style="${st}"/></label>`; };
  openModal(`<div style="padding:20px 22px">
    <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0 0 3px">${_tplEsc(t.name)}</h3>
    <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 14px;line-height:1.55">Fill in the blanks. Everything you type is filed as contract data as well as printed into the document — the register, filters, folder routing and reports pick it up with no second data-entry step.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${fs.map(inp).join('')}</div>
    <div id="tf-err" style="font-size:11px;color:#8f322b;min-height:15px;margin-top:8px"></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
      <button id="tf-cancel" class="ui-btn">Cancel</button>
      <button id="tf-create" class="ui-btn ui-btn-primary">Create draft</button>
    </div></div>`, {maxWidth:'620px'});
  document.getElementById('tf-cancel').addEventListener('click',closeModal);
  document.getElementById('tf-create').addEventListener('click',()=>{
    const values={}, errs=[];
    for(const f of fs){ const el=document.getElementById('tf-'+f.key); const raw=el?el.value.trim():'';
      const e=validateField(f, raw); if(e) errs.push(e); else values[f.key]=raw; }
    if(errs.length){ document.getElementById('tf-err').textContent=errs[0]; return; }
    closeModal(); buildFromCustomTemplate(t, values);
  });
}

function saveTemplateRecord(name, folder, text, source, extra){
  const list=customTemplates().slice();
  const rec={ id:'tpl_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),
    name, folder:FOLDERS[folder]?folder:'corp', text, source:source||'upload',
    by:currentUser()?.name||'—', at:nowISO(), chars:text.length,
    // the blanks and the body they live in — `body` is the text with {{key}}
    // placeholders, `text` stays the original for reference
    fields:[], body:text };
  if(extra) Object.assign(rec, extra);
  list.push(rec);
  saveCustomTemplates(list);
  return rec;
}
function updateTemplateRecord(id, patch){
  const list=customTemplates().map(t=>t.id===id?{...t,...patch}:t);
  saveCustomTemplates(list);
  return list.find(t=>t.id===id);
}

/* "Save as template" from a contract's workspace — reuse paper you like. */
function saveContractAsTemplate(c){
  if(!tplCanManage()){ toast('Viewers cannot save templates','err'); return; }
  const text=docPlainText(c);
  if(!text||text.length<40){ toast('This document has no reusable text yet','err'); return; }
  const defName=c.name.replace(/\s*\(Draft\)\s*$/,'').replace(/\s*—.*$/,'').trim()||c.name;
  const opts=folderOptionsHtml(c.folder, false);
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
  bindFolderSelect(document.getElementById('tpl-folder'));
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
  const opts=folderOptionsHtml(null, false);
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="color:var(--color-accent)">${icon('upload','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Upload a template</h3></div>
      <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.5">Upload your company's standard contract (PDF or text — Word files must be saved as PDF first). HaTi extracts the text so new drafts can start from your own paper.</p>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Template name</span>
        <input id="ut-name" placeholder="e.g. Standard Distribution Agreement" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none"/></label>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Value stream</span>
        <select id="ut-folder" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 8px;font:inherit;font-size:13px">${opts}</select></label>
      <label style="display:block;margin-bottom:6px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Document file</span>
        <input id="ut-file" type="file" accept=".pdf,.txt,.md,text/plain,application/pdf" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:7px 10px;font:inherit;font-size:12px"/></label>
      <div id="ut-status" style="font-size:11px;color:var(--color-neutral-600);min-height:16px;margin-bottom:10px"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button id="ut-cancel" class="ui-btn">Cancel</button>
        <button id="ut-save" class="ui-btn ui-btn-primary">Extract &amp; save</button>
      </div>
    </div>`);
  document.getElementById('ut-cancel').addEventListener('click',closeModal);
  bindFolderSelect(document.getElementById('ut-folder'));
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
      // Word is refused on the bytes, not the extension — nothing is saved.
      if(detectWordFile(dataUrl, file.type||'', file.name)){
        st.innerHTML=`<span style="color:#8f322b">${_tplEsc(WORD_REFUSAL)}</span>`; return; }
      st.textContent='Extracting text…';
      let text=await extractDocText(dataUrl, file.type||'');
      // a scanned standard-form contract is still a usable template once read
      if(ocrNeeded(file.type||'', text)){
        st.textContent='This looks like a scan — reading it with OCR…';
        const ocr=await ocrDocument(dataUrl, file.type||'', {
          onProgress:(done,total,tier)=>{ st.textContent=`Reading page ${Math.min(done+1,total)} of ${total}${tier==='local'?' (offline recogniser)':''}…`; } });
        if(ocr.text) text=ocr.text;
      }
      if(!text||text.length<40){ st.innerHTML='<span style="color:#8f322b">Could not extract readable text from this file — try a text-based PDF, or re-scan it at a higher resolution.</span>'; return; }
      // auto-detect blanks the paper already carries — [BRACKETS], {{curly}} or
      // a labelled run of underscores. Pure regex, so it works in static mode.
      const found=detectBlanks(text);
      let extra=null;
      if(found.length && confirm(`This template already marks ${found.length} blank${found.length===1?'':'s'} ([BRACKETS], {{curly}} or ____). Turn them into fill-in fields now? You can edit them afterwards.`)){
        const r=convertDetectedBlanks(text, found);
        extra={ fields:r.fields, body:r.body };
      }
      const rec=saveTemplateRecord(name, document.getElementById('ut-folder').value, text, 'upload:'+file.name, extra);
      closeModal();
      toast(`Template “${name}” saved — ${text.length.toLocaleString()} characters${extra?`, ${extra.fields.length} blank${extra.fields.length===1?'':'s'} detected`:''}`);
      if(state.view==='templates') renderTemplatesPage();
      // straight into the editor so the blanks are reviewed while it is fresh
      if(extra) setTimeout(()=>openBlanksEditor(rec.id), 120);
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

/* ============================================================ BLANKS EDITOR
   Three ways to create the blanks in a customer's own template, in order of
   reliability: manual selection (always works, no key, no network), AI-assisted
   ("Suggest blanks" — the human reviews and edits before anything is saved),
   and auto-detect of [SQUARE BRACKETS] / {{curly}} / underscore runs on import. */
function openBlanksEditor(tid){
  if(!tplCanManage()){ toast('Viewers cannot edit templates','err'); return; }
  const rec=customTemplates().find(x=>x.id===tid);
  if(!rec){ toast('Template not found','err'); return; }
  // work on a copy — nothing is written until Save
  let body=templateBody(rec);
  let fields=(rec.fields||[]).map(f=>({ ...f }));
  let dirty=false;

  const draw=()=>{
    const used=bodyPlaceholders(body);
    const orphanFields=fields.filter(f=>!used.includes(f.key));
    const orphanBlanks=used.filter(k=>!fields.some(f=>f.key===k));
    const st='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:4px 7px;font:inherit;font-size:11.5px;outline:none';
    const rows=fields.map((f,i)=>`
      <div data-fld="${i}" style="display:grid;grid-template-columns:1.3fr .9fr 1.2fr auto auto;gap:6px;align-items:center;padding:4px 0;border-bottom:1px solid rgba(29,31,32,.05)">
        <input data-f="label" value="${String(f.label||'').replace(/"/g,'&quot;')}" placeholder="Label" style="${st}"/>
        <select data-f="type" style="${st}">${TPL_FIELD_TYPES.map(x=>`<option value="${x.k}" ${f.type===x.k?'selected':''}>${x.label}</option>`).join('')}</select>
        <select data-f="maps" style="${st}">${TPL_MAPS.map(x=>`<option value="${x.k}" ${(f.maps||'')===x.k?'selected':''}>${x.label}</option>`).join('')}</select>
        <label style="display:inline-flex;align-items:center;gap:4px;font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap"><input data-f="required" type="checkbox" ${f.required?'checked':''} style="accent-color:var(--color-accent)"/>req</label>
        <button data-del="${i}" title="Remove this blank" style="border:1px solid #e6c9c1;background:none;color:#8f322b;border-radius:4px;font:inherit;font-size:11px;padding:2px 7px;cursor:pointer">×</button>
        ${f.type==='select'?`<input data-f="opts" value="${String((f.opts||[]).join(', ')).replace(/"/g,'&quot;')}" placeholder="Choices, comma separated" style="${st};grid-column:1 / -1"/>`:''}
        <div style="grid-column:1 / -1;font-size:10px;color:var(--color-neutral-500);font-family:var(--font-mono)">{{${f.key}}}${orphanFields.includes(f)?' <span style="color:#8f322b">— this blank is not used anywhere in the body</span>':''}</div>
      </div>`).join('');
    const host=document.getElementById('be-fields');
    if(host){
      host.innerHTML=rows||`<div style="font-size:11.5px;color:var(--color-neutral-600);padding:6px 0">No blanks yet. Select some text in the document below and click <b>Make this a blank</b>.</div>`;
      host.querySelectorAll('[data-fld]').forEach(row=>{
        const i=Number(row.getAttribute('data-fld'));
        row.querySelectorAll('[data-f]').forEach(el=>el.addEventListener('change',()=>{
          const k=el.getAttribute('data-f');
          if(k==='required') fields[i].required=el.checked;
          else if(k==='opts') fields[i].opts=el.value.split(',').map(s=>s.trim()).filter(Boolean);
          else fields[i][k]=el.value;
          dirty=true; if(k==='type') draw();
        }));
        row.querySelector('[data-del]')?.addEventListener('click',()=>{
          const f=fields[i];
          body=body.split('{{'+f.key+'}}').join(f.label||'_____');
          fields.splice(i,1); dirty=true; draw();
        });
      });
    }
    const pv=document.getElementById('be-body');
    if(pv && document.activeElement!==pv) pv.value=body;
    const warn=document.getElementById('be-warn');
    if(warn) warn.innerHTML = orphanBlanks.length
      ? `<span style="color:#8f322b">${orphanBlanks.length} placeholder${orphanBlanks.length===1?'':'s'} in the body (${orphanBlanks.map(k=>'{{'+k+'}}').join(', ')}) ${orphanBlanks.length===1?'has':'have'} no field — add or remove them before saving.</span>`
      : `<span style="color:var(--color-neutral-600)">${fields.length} blank${fields.length===1?'':'s'} · they become the contract's structured data when someone fills this template in.</span>`;
  };

  openModal(`<div style="padding:20px 22px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="color:var(--color-accent)">${icon('copy','w-4 h-4')}</span>
      <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Blanks in “${_tplEsc(rec.name)}”</h3></div>
    <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.55">The blanks in a template are the database. Anything you mark here becomes a guided field when someone creates a contract, and its value is filed as contract data — so the register, filters, folder routing and reports get structured information with no separate data entry.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
      <button id="be-make" class="ui-btn ui-btn-primary" style="font-size:11.5px;padding:5px 11px">Make selection a blank</button>
      <button id="be-detect" class="ui-btn" style="font-size:11.5px;padding:5px 11px">Detect [BRACKETS] &amp; ____</button>
      ${(API_MODE()&&state.aiConfigured)?`<button id="be-suggest" class="ui-btn" style="font-size:11.5px;padding:5px 11px">${icon('sparkle','w-3.5 h-3.5')} Suggest blanks</button>`:''}
    </div>
    <div id="be-fields" class="scroll-thin" style="max-height:190px;overflow-y:auto;border:1px solid var(--color-divider);border-radius:5px;padding:6px 9px;margin-bottom:8px"></div>
    <div id="be-warn" style="font-size:10.5px;margin-bottom:8px;min-height:14px"></div>
    <label style="display:block;margin-bottom:12px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Template body — select text, then “Make selection a blank”</span>
      <textarea id="be-body" class="scroll-thin" style="width:100%;height:210px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:9px 11px;font:inherit;font-size:12px;line-height:1.6;font-family:var(--font-mono);outline:none;resize:vertical"></textarea></label>
    <div id="be-status" style="font-size:11px;color:var(--color-neutral-600);min-height:15px;margin-bottom:8px"></div>
    <div style="display:flex;justify-content:flex-end;gap:8px">
      <button id="be-cancel" class="ui-btn">Cancel</button>
      <button id="be-save" class="ui-btn ui-btn-primary">Save blanks</button>
    </div></div>`, {maxWidth:'760px'});
  draw();

  const bodyEl=document.getElementById('be-body');
  bodyEl.addEventListener('input',()=>{ body=bodyEl.value; dirty=true; draw(); });
  const status=m=>{ const el=document.getElementById('be-status'); if(el) el.innerHTML=m||''; };

  // ---- 1. manual (the reliable path — no key, no network)
  document.getElementById('be-make').addEventListener('click',()=>{
    const s=bodyEl.selectionStart, e=bodyEl.selectionEnd;
    const sel=bodyEl.value.slice(s,e).trim();
    if(!sel){ status('<span style="color:#8f322b">Select the text in the document that should become a blank first.</span>'); return; }
    if(sel.length>200){ status('<span style="color:#8f322b">That selection is too long for a blank — pick the value, not the whole clause.</span>'); return; }
    const label=prompt('Name this blank (what a person filling it in will see):', sel.length<=40?sel:'');
    if(label==null) return;
    const lbl=String(label).trim() || sel.slice(0,40);
    const key=tplKeyFrom(lbl, fields);
    const shape=guessFieldShape(lbl);
    fields.push({ key, label:lbl, type:shape.type, maps:shape.maps, required:!!shape.maps, def:'', opts:[] });
    body=bodyEl.value.slice(0,s)+'{{'+key+'}}'+bodyEl.value.slice(e);
    dirty=true; draw(); status(`Added <b>{{${key}}}</b>.`);
  });

  // ---- 3. auto-detect markers already in the paper
  document.getElementById('be-detect').addEventListener('click',()=>{
    const found=detectBlanks(body).filter(d=>!/\{\{/.test(d.raw)||!fields.some(f=>'{{'+f.key+'}}'===d.raw));
    if(!found.length){ status('No [BRACKETS], {{curly}} markers or underscore runs found in this template.'); return; }
    if(!confirm(`Found ${found.length} existing blank marker${found.length===1?'':'s'}. Convert them into fields?`)) return;
    const r=convertDetectedBlanks(body, found);
    // keep any fields already defined, append the new ones with unique keys
    for(const nf of r.fields){ if(!fields.some(f=>f.key===nf.key)) fields.push(nf); }
    body=r.body; dirty=true; draw();
    status(`Converted <b>${r.converted}</b> marker${r.converted===1?'':'s'} into blanks. Check the types and mappings above.`);
  });

  // ---- 2. AI-assisted — reviewed and editable before anything is saved
  document.getElementById('be-suggest')?.addEventListener('click',async(e)=>{
    const btn=e.currentTarget; btn.disabled=true; const was=btn.innerHTML;
    btn.innerHTML='Thinking…'; status('Asking the AI engine for suggestions — nothing is saved until you review them.');
    try{
      const r=await api('ai/blanks','POST',{ text: body.slice(0, 60000) });
      let added=0, missed=0;
      for(const f of (r.fields||[])){
        if(!f.find || !body.includes(f.find)){ missed++; continue; }
        const key=tplKeyOk(f.key)&&!fields.some(x=>x.key===f.key) ? f.key : tplKeyFrom(f.label||f.key, fields);
        fields.push({ key, label:String(f.label||key), type:TPL_FIELD_TYPES.some(t=>t.k===f.type)?f.type:'text',
          maps:TPL_MAPS.some(m=>m.k===(f.maps||''))?(f.maps||''):'',
          required:!!f.required, def:'', opts:Array.isArray(f.opts)?f.opts:[] });
        body=body.split(f.find).join('{{'+key+'}}');
        added++;
      }
      dirty=true; draw();
      status(`<b>${added}</b> suggestion${added===1?'':'s'} added${missed?`, ${missed} skipped (the text no longer matched)`:''}. <b>Review and edit them</b> — nothing is saved until you press Save blanks.${r.note?`<br><span style="color:var(--color-neutral-500)">${_tplEsc(r.note)}</span>`:''}`);
    }catch(err){ status(`<span style="color:#8f322b">${_tplEsc(err.message)}</span>`); }
    btn.disabled=false; btn.innerHTML=was;
  });

  document.getElementById('be-cancel').addEventListener('click',()=>{
    if(dirty && !confirm('Discard the changes to these blanks?')) return;
    closeModal();
  });
  document.getElementById('be-save').addEventListener('click',()=>{
    const used=bodyPlaceholders(body);
    const orphan=used.filter(k=>!fields.some(f=>f.key===k));
    if(orphan.length){ status(`<span style="color:#8f322b">The body uses ${orphan.map(k=>'{{'+k+'}}').join(', ')} with no matching field. Add the field or remove the placeholder.</span>`); return; }
    const bad=fields.find(f=>!String(f.label||'').trim());
    if(bad){ status('<span style="color:#8f322b">Every blank needs a label.</span>'); return; }
    const badSel=fields.find(f=>f.type==='select'&&!(f.opts||[]).length);
    if(badSel){ status(`<span style="color:#8f322b">“${_tplEsc(badSel.label)}” is a choice list with no choices.</span>`); return; }
    updateTemplateRecord(tid, { fields, body, chars:body.length });
    closeModal(); toast(`${fields.length} blank${fields.length===1?'':'s'} saved on “${rec.name}”`);
    if(state.view==='templates') renderTemplatesPage();
  });
}

/* ============================================================ BULK CREATION
   Download a CSV with one column per blank, fill it in, upload it. Every row is
   validated BEFORE anything is created — half a batch of employment letters is
   worse than none, because the half-done state is invisible in the register. */
function openBulkCreateModal(t){
  if(!canEdit()){ toast('Viewers cannot create contracts','err'); return; }
  const fs=templateFields(t);
  if(!fs.length){ toast('This template has no blanks yet — add some first','err'); return; }
  openModal(`<div style="padding:20px 22px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="color:var(--color-accent)">${icon('list','w-4 h-4')}</span>
      <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Create in bulk — ${_tplEsc(t.name||t.kind)}</h3></div>
    <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.55">For high-volume, low-variation paper — distributor agreements, employment letters. Download the sheet, fill one row per contract, upload it back. <b>Every row is checked before anything is created</b>, so a bad cell stops the whole run rather than leaving half a batch in the register. Up to ${TPL_BULK_MAX} rows.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <button id="bk-csv" class="ui-btn" style="font-size:11.5px;padding:5px 11px">${icon('download','w-3.5 h-3.5')} Download the CSV (${fs.length} column${fs.length===1?'':'s'})</button>
      <label class="ui-btn" style="font-size:11.5px;padding:5px 11px;cursor:pointer">${icon('upload','w-3.5 h-3.5')} Upload the filled sheet
        <input id="bk-file" type="file" accept=".csv" style="display:none"/></label>
    </div>
    <div id="bk-out" style="font-size:11.5px;color:var(--color-neutral-700);min-height:20px"></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
      <button id="bk-cancel" class="ui-btn">Close</button>
      <button id="bk-go" class="ui-btn ui-btn-primary" disabled style="opacity:.5">Create drafts</button>
    </div></div>`, {maxWidth:'700px'});

  let ready=null;
  const out=document.getElementById('bk-out');
  const go=document.getElementById('bk-go');
  document.getElementById('bk-cancel').addEventListener('click',closeModal);
  document.getElementById('bk-csv').addEventListener('click',()=>{
    downloadFile(`hati-bulk-${String(t.name||t.kind||'template').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)}.csv`, bulkTemplateCsv(t), 'text/csv');
    toast('Sheet downloaded — one column per blank, with an example row you can delete or overwrite');
  });
  document.getElementById('bk-file').addEventListener('change',async e=>{
    const f=e.target.files&&e.target.files[0]; if(!f) return;
    ready=null; go.disabled=true; go.style.opacity='.5';
    out.innerHTML='Checking every row…';
    try{
      const r=parseBulkCsv(t, await f.text());
      if(r.errors.length){
        const byRow={};
        r.errors.forEach(er=>{ (byRow[er.row]=byRow[er.row]||[]).push(er); });
        out.innerHTML=`<div style="border:1px solid #e6c9c1;background:#fdf4f2;border-radius:5px;padding:9px 11px">
          <div style="font-weight:600;color:#8f322b;margin-bottom:5px">${r.errors.length} problem${r.errors.length===1?'':'s'} found — <b>nothing has been created</b>.</div>
          <div class="scroll-thin" style="max-height:200px;overflow-y:auto">
          ${Object.keys(byRow).sort((a,b)=>a-b).map(rn=>`<div style="padding:2px 0;color:#8f322b">
            ${rn==='0'?'<b>Sheet</b>':`<b>Row ${rn}</b>`} — ${byRow[rn].map(er=>`${er.cell?`<i>${_tplEsc(er.cell)}</i>: `:''}${_tplEsc(er.msg)}`).join('; ')}</div>`).join('')}
          </div>
          <div style="margin-top:6px;color:var(--color-neutral-700)">Fix them in the spreadsheet and upload it again.</div></div>`;
        return;
      }
      ready=r.rows;
      out.innerHTML=`<div style="border:1px solid var(--color-divider);background:var(--color-accent-100);border-radius:5px;padding:9px 11px;color:var(--color-accent-800)">
        <b>${r.rows.length} row${r.rows.length===1?'':'s'} checked, every cell valid.</b> Press <b>Create drafts</b> to file them all in one pass.
        <div style="margin-top:5px;color:var(--color-neutral-700);font-size:11px">First few: ${r.rows.slice(0,3).map(x=>_tplEsc(x.name)).join(' · ')}${r.rows.length>3?` … and ${r.rows.length-3} more`:''}</div></div>`;
      go.disabled=false; go.style.opacity='1';
    }catch(err){ out.innerHTML=`<span style="color:#8f322b">Could not read that CSV: ${_tplEsc(err.message)}</span>`; }
  });
  go.addEventListener('click',()=>{
    if(!ready||!ready.length) return;
    go.disabled=true; go.textContent='Creating…';
    const made=createBulkFromTemplate(t, ready);
    closeModal();
    toast(`${made.length} draft${made.length===1?'':'s'} created from “${t.name||t.kind}”`);
    updateSidebarCounts(); setView('register');
  });
}

function openTemplatePreview(tpl){
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:4px">
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">${_tplEsc(tpl.name)}</h3>
        <span style="font-size:11px;color:var(--color-neutral-600)">${FOLDERS[tpl.folder]?.name||''}</span>
      </div>
      <p style="font-size:11px;color:var(--color-neutral-600);margin:0 0 10px">${tpl.chars?tpl.chars.toLocaleString()+' characters · ':''}added ${tpl.at?fmtDT(tpl.at):''} by ${_tplEsc(tpl.by||'—')}${templateFields(tpl).length?` · <b>${templateFields(tpl).length} blank${templateFields(tpl).length===1?'':'s'}</b>`:' · no blanks yet'}</p>
      ${templateFields(tpl).length?`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">${templateFields(tpl).map(f=>`<span style="font-size:10.5px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:3px;padding:2px 7px;color:var(--color-neutral-700)"><b style="font-family:var(--font-mono)">${_tplEsc(f.key)}</b> ${_tplEsc(f.label)}${f.maps?` <span style="color:var(--color-accent-700)">→ ${_tplEsc(tplMapLabel(f.maps))}</span>`:''}</span>`).join('')}</div>`:''}
      <div class="scroll-thin" style="border:1px solid var(--color-divider);border-radius:5px;background:var(--color-bg);padding:14px 16px;max-height:55vh;overflow-y:auto">${window.documentTextHtml?documentTextHtml(templateBody(tpl)):`<div style="font-size:12.5px;line-height:1.65;white-space:pre-wrap">${_tplEsc(templateBody(tpl))}</div>`}</div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
        ${canEdit()?`<button id="tp-blanks" class="ui-btn">${templateFields(tpl).length?'Edit blanks':'Add blanks'}</button>`:''}
        ${canEdit()?`<button id="tp-use" class="ui-btn ui-btn-primary">Use template</button>`:''}
        <button id="tp-close" class="ui-btn">Close</button>
      </div>
    </div>`, {maxWidth:'820px'});
  document.getElementById('tp-close').addEventListener('click',closeModal);
  document.getElementById('tp-use')?.addEventListener('click',()=>{ closeModal(); createFromCustomTemplate(tpl.id); });
  document.getElementById('tp-blanks')?.addEventListener('click',()=>{ closeModal(); openBlanksEditor(tpl.id); });
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
    <div class="lift" style="${CARD};border-left:4px solid ${folderColor(t.folder)};padding:14px;display:flex;flex-direction:column;gap:6px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:5px;${tplTile(t.folder)}">${icon('copy','w-3.5 h-3.5')}</span>
        <span style="min-width:0;flex:1">
          <span style="display:block;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_tplEsc(t.name)}</span>
          <span style="display:block;font-size:10px;color:var(--color-neutral-600)">${FOLDERS[t.folder]?.name||'—'} · ${(t.chars||t.text.length).toLocaleString()} chars</span>
        </span>
      </div>
      <div style="font-size:10px;color:var(--color-neutral-500)">${t.source&&t.source.startsWith('contract:')?'From contract '+t.source.slice(9):t.source&&t.source.startsWith('sample:')?'HaTi sample':'Uploaded'} · ${t.at?fmtDT(t.at):''}</div>
      <div style="display:flex;gap:6px;margin-top:2px;flex-wrap:wrap">
        ${canManage?`<button data-tpl-use="${t.id}" class="ui-btn ui-btn-primary" style="font-size:11.5px;padding:4px 10px;flex:1">Use</button>`:''}
        <button data-tpl-prev="${t.id}" class="ui-btn" style="font-size:11.5px;padding:4px 10px">Preview</button>
        ${canManage?`<button data-tpl-del="${t.id}" class="ui-btn" style="font-size:11.5px;padding:4px 8px;border-color:#e6c9c1;color:#8f322b">${icon('trash','w-3 h-3')}</button>`:''}
      </div>
      ${canManage?`<div style="display:flex;gap:6px">
        <button data-tpl-blanks="${t.id}" class="ui-btn" style="font-size:11px;padding:3.5px 9px;flex:1">${templateFields(t).length?`${templateFields(t).length} blank${templateFields(t).length===1?'':'s'}`:'Add blanks'}</button>
        ${templateFields(t).length?`<button data-tpl-bulk="${t.id}" class="ui-btn" style="font-size:11px;padding:3.5px 9px;flex:1">Create in bulk</button>`:''}
      </div>`:''}
    </div>`).join('');

  const myRole=currentUser()?.role||'viewer';
  const builtinCards=Object.values(TEMPLATES).filter(t=>!canManage||templateAllowedForRole(t.id,myRole)).map(t=>`
    <div class="lift" style="${CARD};border-left:4px solid ${folderColor(t.folder)};padding:14px;display:flex;flex-direction:column;gap:6px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:5px;${tplTile(t.folder)}">${icon(t.ic,'w-3.5 h-3.5')}</span>
        <span style="min-width:0;flex:1">
          <span style="display:block;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name}</span>
          <span style="display:block;font-size:10px;color:var(--color-neutral-600)">${FOLDERS[t.folder].name} · Template ${t.id}</span>
        </span>
      </div>
      <div style="font-size:10.5px;color:var(--color-neutral-600);line-height:1.45;flex:1">${t.blurb||''}</div>
      ${canManage?`<div style="display:flex;gap:6px;margin-top:2px">
        <button data-tpl-builtin="${t.id}" class="ui-btn ui-btn-primary" style="font-size:11.5px;padding:4px 10px;flex:1">Use template</button>
        <button data-tpl-bulk-b="${t.id}" class="ui-btn" style="font-size:11px;padding:4px 9px">Bulk</button>
      </div>`:''}
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

    <div>${folderLegendHtml()}</div>

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
  document.querySelectorAll('[data-tpl-builtin]').forEach(b=>b.addEventListener('click',()=>openWizard(b.getAttribute('data-tpl-builtin'))));
  document.querySelectorAll('[data-tpl-blanks]').forEach(b=>b.addEventListener('click',()=>openBlanksEditor(b.getAttribute('data-tpl-blanks'))));
  document.querySelectorAll('[data-tpl-bulk]').forEach(b=>b.addEventListener('click',()=>{ const t=customTemplates().find(x=>x.id===b.getAttribute('data-tpl-bulk')); if(t) openBulkCreateModal(t); }));
  document.querySelectorAll('[data-tpl-bulk-b]').forEach(b=>b.addEventListener('click',()=>{ const t=TEMPLATES[b.getAttribute('data-tpl-bulk-b')];
    if(!t) return;
    if(!templateAllowedForRole(t.id, currentUser()?.role||'viewer')){ toast('That template is not open to your role','err'); return; }
    openBulkCreateModal(t); }));
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

Object.assign(window,{HATI_SAMPLES,openBlanksEditor,openBulkCreateModal,openTemplateFillModal,buildFromCustomTemplate,updateTemplateRecord,createFromCustomTemplate,customTemplates,importHatiSample,openTemplatePreview,openUploadTemplateModal,renderPlaybookPage,renderTemplatesPage,saveContractAsTemplate,saveCustomTemplates,saveTemplateRecord});
