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
function saveCustomTemplates(list){
  state.settings=state.settings||{}; state.settings.customTemplates=list;
  // Templates are managed by Admin AND Legal, but PUT /api/settings is
  // admin-only — a Legal user saving one used to get "Settings save failed"
  // and lose the change. Template writes go through their own endpoint.
  if(typeof API_MODE==='function' && API_MODE()){
    return api('settings/templates','PUT',{customTemplates:list})
      .catch(e=>toast('Template save failed: '+e.message,'err'));
  }
  return saveSettings();
}
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
function buildFromCustomTemplate(t, values, opts){
  const u=currentUser();
  const fs=templateFields(t);
  const tFmt=templateFormat(t);
  const body=fillTemplateBody(templateBody(t), values, tFmt);
  const cp=(()=>{ const f=fs.find(x=>x.maps==='counterparty'); return f?String(values[f.key]||''):''; })();
  const cpEmail=String((opts&&opts.counterpartyEmail)||'').trim();
  const c={ id:nextId(), name:t.name+(cp?' — '+cp:' (Draft)'), counterparty:'',
    counterpartyEmail:cpEmail||undefined, value:0, status:'Draft',
    template:null, source:'template', folder:FOLDERS[t.folder]?t.folder:'corp', valueType:'estimated',
    lastAction:todayStr(), hash:null, signedAt:null, signatory:u?.name||'Authorized signatory',
    compliance:{iprs:false,pki:false},
    comments:[{author:'System',role:'Automation',side:'internal',
      text:`New draft created from your template “${t.name}”.${fs.length?' The details you filled in are already filed as contract data — the register, filters and reports pick them up without re-keying.':' Edit the document text, set the counterparty and value, then share for review.'}`,ts:fmtDT(nowISO())}],
    fields:{}, scan:null, expiry:null,
    redlineText:body, format:tFmt,
    versions:[],
    audit:[{at:nowISO(),user:u?.name||'System',action:'Created',detail:`Created from custom template “${t.name}” v${templateVersionNo(t)}${fs.length?` · ${fs.length} field${fs.length===1?'':'s'} filled`:''}`}],
    signatures:[],
    // PROVENANCE: which template, and which VERSION of it, this draft came from.
    // The template can be edited afterwards — this contract will not change —
    // so recording the version is the only way to answer "which wording is
    // this?" once the template has moved on.
    templateRef:t.id, templateId:t.id, templateName:t.name,
    templateVersion:templateVersionNo(t) };
  if(fs.length) applyTemplateValues(c, fs, values);
  // v1 is captured through captureVersion so it carries the text projection and
  // the canonical form, exactly like every later version
  if(window.captureVersion) captureVersion(c, `Template “${t.name}”`, u?.name||'System');
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
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${fs.map(inp).join('')}
      ${''/* THE SAME QUESTION THE BUILT-IN TEMPLATES ASK, because this is the
             same act. Saved templates create contracts through their own fill
             form, so adding the address to the guided wizard alone left every
             contract made from "My templates" back where it started: asked in
             the negotiation room, and again by the share dialog. */}
      <label style="display:block">
        <span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px">Their email<span style="font-weight:400;color:var(--color-neutral-500)"> → so you can send it to them</span></span>
        <input id="tf-cpemail" type="email" placeholder="them@company.co.ke" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 11px;font:inherit;font-size:13px;outline:none"/></label>
    </div>
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
    const cpEmail=(document.getElementById('tf-cpemail')||{}).value||'';
    if(cpEmail.trim() && !/.+@.+\..+/.test(cpEmail.trim()))
      errs.push(`"${cpEmail.trim()}" is not an email address — leave it blank if you do not have it yet.`);
    if(errs.length){ document.getElementById('tf-err').textContent=errs[0]; return; }
    closeModal(); buildFromCustomTemplate(t, values, { counterpartyEmail:cpEmail.trim() });
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
  // a formatted contract is saved as a formatted template — reusing your own
  // paper should not strip the headings and clause numbering off it
  const rich=!!(window.isRich && isRich(c.format) && c.redlineText);
  const saveBody=rich?sanitizeRich(c.redlineText):text;
  const defName=c.name.replace(/\s*\(Draft\)\s*$/,'').replace(/\s*—.*$/,'').trim()||c.name;
  const opts=folderOptionsHtml(c.folder, false);
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="color:var(--color-accent)">${icon('copy','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Save as template</h3></div>
      <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.5">Saves this document's current text (${text.length.toLocaleString()} characters${rich?', with its formatting':''}) as a reusable template. It will appear under <b>My templates</b> and in the New-contract menu.</p>
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
    saveTemplateRecord(name, document.getElementById('tpl-folder').value, saveBody, 'contract:'+c.id,
      rich?{ format:RICH_FORMAT, chars:text.length }:null);
    logAudit(c,'Template','Saved as reusable template “'+name+'”'); persist(c);
    closeModal(); toast(`Template “${name}” saved`);
    if(state.view==='templates') renderTemplatesPage();
  });
}

/* ============================================================ CREATE TEMPLATE
   Paste is the primary route, and deliberately so: almost nobody's standard
   contract exists as a PDF they can conveniently upload. It exists in Word,
   open on their screen, and the fastest honest route into HaTi is Ctrl+A,
   Ctrl+C, Ctrl+V. Uploading a file is the secondary route, for paper that
   really does arrive as a PDF.

   The paste box is a contenteditable, not a textarea — a textarea can only
   ever hold plain text, which is the exact loss this is meant to prevent. */
function openCreateTemplateModal(mode){
  if(!tplCanManage()){ toast('Viewers cannot add templates','err'); return; }
  const opts=folderOptionsHtml(null, false);
  let tab=(mode==='upload')?'upload':'paste';
  let pasted=null;          // { html, format, via, plain }
  let report=null;          // pasteConversionReport(...)
  let editor=null;

  const FLD='width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none';
  const tabBtn=(k,label,sub)=>`<button data-ct-tab="${k}" style="flex:1;text-align:left;padding:9px 12px;font:inherit;cursor:pointer;border:1px solid ${tab===k?'var(--color-accent)':'var(--color-divider)'};background:${tab===k?'var(--color-accent-100)':'var(--color-surface)'};border-radius:5px">
      <span style="display:block;font-size:12.5px;font-weight:600;color:${tab===k?'var(--color-accent-800)':'var(--color-neutral-800)'}">${label}</span>
      <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);margin-top:1px">${sub}</span></button>`;

  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="color:var(--color-accent)">${icon('copy','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Create template</h3></div>
      <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.5">Bring your company's standard paper into HaTi so new drafts start from your own wording.</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px" id="ct-tabs">
        ${tabBtn('paste','Paste the document','From Word or Google Docs — keeps the formatting')}
        ${tabBtn('upload','Upload a file','A PDF or text file you already have')}
      </div>

      <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:10px;margin-bottom:12px">
        <label style="display:block"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Template name</span>
          <input id="ct-name" placeholder="e.g. Standard Distribution Agreement" style="${FLD}"/></label>
        <label style="display:block"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Value stream</span>
          <select id="ct-folder" style="${FLD};background:var(--color-surface)">${opts}</select></label>
      </div>

      <div id="ct-pane-paste">
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">
          <span style="font-size:11px;font-weight:600">Paste the contract here</span>
          <span style="flex:1"></span>
          <button id="ct-preview" class="ui-btn" style="font-size:11px;padding:3px 9px">Preview</button>
          <button id="ct-clear" class="ui-btn" style="font-size:11px;padding:3px 9px">Clear</button>
        </div>
        <div id="ct-editor" class="scroll-thin doc-surface" style="height:270px;font-size:12.5px"
             data-placeholder="Open your contract in Word or Google Docs, select all (Ctrl+A), copy (Ctrl+C), then paste here (Ctrl+V)."></div>
        <div id="ct-previewpane" class="scroll-thin doc-surface" style="display:none;height:270px;overflow-y:auto;border:1px solid var(--color-accent-300);background:var(--color-bg);border-radius:5px;padding:14px 18px"></div>
        <p style="font-size:10.5px;color:var(--color-neutral-600);margin:6px 0 0;line-height:1.5">${RICH_EDITOR_NOTE}</p>
        <div id="ct-report" style="font-size:11px;margin-top:7px;min-height:16px;line-height:1.5"></div>
      </div>

      <div id="ct-pane-upload" style="display:none">
        <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 8px;line-height:1.5">PDF or text (Word files must be saved as PDF first). HaTi reads the file and <b>rebuilds its structure</b> — headings, bold, italics, numbered clauses and indentation — from the type sizes and positions the PDF states. That recovers most of a document but not all of it: <b>pasting is still more faithful</b>, because the clipboard carries the structure outright instead of leaving it to be inferred.</p>
        <label style="display:block;margin-bottom:6px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Document file</span>
          <input id="ct-file" type="file" accept=".pdf,.docx,.txt,.md,text/plain,application/pdf" style="${FLD};font-size:12px"/></label>
      </div>

      <div id="ct-status" style="font-size:11px;color:var(--color-neutral-600);min-height:16px;margin:10px 0"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button id="ct-cancel" class="ui-btn">Cancel</button>
        <button id="ct-save" class="ui-btn ui-btn-primary">Save template</button>
      </div>
    </div>`, {maxWidth:'820px'});

  const st=m=>{ const el=document.getElementById('ct-status'); if(el) el.innerHTML=m||''; };
  const rep=m=>{ const el=document.getElementById('ct-report'); if(el) el.innerHTML=m||''; };
  bindFolderSelect(document.getElementById('ct-folder'));
  document.getElementById('ct-cancel').addEventListener('click',closeModal);

  const paint=()=>{
    document.querySelectorAll('[data-ct-tab]').forEach(b=>{
      const on=b.getAttribute('data-ct-tab')===tab;
      b.style.borderColor=on?'var(--color-accent)':'var(--color-divider)';
      b.style.background=on?'var(--color-accent-100)':'var(--color-surface)';
      b.querySelector('span').style.color=on?'var(--color-accent-800)':'var(--color-neutral-800)';
    });
    document.getElementById('ct-pane-paste').style.display = tab==='paste'?'':'none';
    document.getElementById('ct-pane-upload').style.display= tab==='upload'?'':'none';
    st('');
  };
  document.getElementById('ct-tabs').addEventListener('click',e=>{
    const b=e.target.closest('[data-ct-tab]'); if(!b) return;
    tab=b.getAttribute('data-ct-tab'); paint();
  });

  /* ---- the paste surface ---- */
  const host=document.getElementById('ct-editor');
  const markEmpty=()=>host.setAttribute('data-empty', (host.textContent||'').trim()?'0':'1');
  editor=richEditor(host, {
    onChange:markEmpty,
    onPaste:res=>{
      pasted=res;
      report=pasteConversionReport(editor.get(), res.plain||'');
      const t=richToText(editor.get());
      const lists=(editor.get().match(/<(ol|ul)\b/g)||[]).length;
      const heads=(editor.get().match(/<h[1-4]\b/g)||[]).length;
      const tables=(editor.get().match(/<table\b/g)||[]).length;
      const kept=[ heads?`${heads} heading${heads===1?'':'s'}`:'',
                   lists?`${lists} list${lists===1?'':'s'}`:'',
                   tables?`${tables} table${tables===1?'':'s'}`:'' ].filter(Boolean).join(' · ');
      if(report.ok){
        rep(`<span style="color:var(--color-neutral-700)">Converted <b>${t.length.toLocaleString()}</b> characters${kept?` — ${kept} kept`:''}${res.via==='text'?' · pasted as plain text (the source offered no formatting)':''}. <b>Preview</b> it before saving.</span>`);
      } else {
        rep(`<span style="display:block;border:1px solid #e6c9c1;background:rgba(176,69,60,.06);border-radius:4px;padding:8px 10px;color:#8f322b">
          <b>That did not come across properly.</b> ${_tplEsc(report.reason)}
          Paste it again, or <button type="button" id="ct-fallback" style="border:0;background:none;padding:0;font:inherit;font-weight:600;color:#8f322b;text-decoration:underline;cursor:pointer">use the plain-text version instead</button> — you will lose the formatting but keep every word.</span>`);
        document.getElementById('ct-fallback')?.addEventListener('click',()=>{
          editor.set(textToRich(res.plain||''));
          pasted={ ...res, via:'text' };
          report={ ok:true, reason:'' };
          rep('<span style="color:var(--color-neutral-700)">Using the plain-text version — every word is there, the formatting is not.</span>');
        });
      }
      markEmpty();
    },
  });
  markEmpty();
  setTimeout(()=>editor.focus(),60);

  document.getElementById('ct-clear').addEventListener('click',()=>{ editor.set(''); pasted=null; report=null; rep(''); markEmpty(); editor.focus(); });
  /* Preview is a toggle over the same pane, not a second modal — reopening a
     modal would throw the editor and everything pasted into it away. It uses
     renderDocHtml, the same renderer the workspace and the counterparty portal
     use, so what is previewed is what everyone downstream will see. */
  let previewing=false;
  const pv=document.getElementById('ct-previewpane'), pvBtn=document.getElementById('ct-preview');
  pvBtn.addEventListener('click',()=>{
    if(previewing){ previewing=false; pv.style.display='none'; host.style.display=''; pvBtn.textContent='Preview'; editor.focus(); return; }
    const html=editor.get();
    if(!richToText(html).trim()){ st('<span style="color:#8f322b">Nothing to preview yet.</span>'); return; }
    pv.innerHTML=renderDocHtml(html, RICH_FORMAT);
    previewing=true; pv.style.display=''; host.style.display='none'; pvBtn.textContent='Back to editing'; st('');
  });

  /* ---- save ---- */
  document.getElementById('ct-save').addEventListener('click',async()=>{
    const name=document.getElementById('ct-name').value.trim();
    const folder=document.getElementById('ct-folder').value;
    if(!name){ toast('Give the template a name','err'); return; }

    if(tab==='paste'){
      const html=editor.get();
      const text=richToText(html);
      if(!text.trim()){ st('<span style="color:#8f322b">Paste the contract into the box first.</span>'); return; }
      if(text.length<40){ st('<span style="color:#8f322b">That is too short to be a template — paste the whole document.</span>'); return; }
      if(report && !report.ok && !await confirmDialog({
        title:'The conversion looks incomplete',
        message:`${report.reason} Saving now stores it as it appears in the box above.`,
        confirmLabel:'Save anyway', cancelLabel:'Go back and re-paste' })) return;
      const found=detectBlanks(text);
      let extra={ format:RICH_FORMAT, chars:text.length };
      if(found.length && await confirmDialog({
        title:`Turn ${found.length} marked blank${found.length===1?'':'s'} into fill-in fields?`,
        message:`This template already marks ${found.length===1?'a blank':'blanks'} the usual ways — [BRACKETS], {{curly}} or a run of underscores: ${found.slice(0,4).map(d=>d.label).join(', ')}${found.length>4?`, and ${found.length-4} more`:''}. Converting them now means whoever uses this template is asked for each one, and the answers are filed as contract data. You can edit them afterwards either way.`,
        confirmLabel:'Convert them', cancelLabel:'Not now' })){
        // the markers are literal text, so they substitute inside the markup
        const r=convertDetectedBlanks(html, found.filter(d=>html.includes(d.raw)));
        extra={ ...extra, fields:r.fields, body:r.body };
      }
      const rec=saveTemplateRecord(name, folder, html, 'paste', extra);
      closeModal();
      toast(`Template “${name}” saved — ${text.length.toLocaleString()} characters, formatting kept${extra.fields?`, ${extra.fields.length} blank${extra.fields.length===1?'':'s'} detected`:''}`);
      if(state.view==='templates') renderTemplatesPage();
      updateSidebarCounts();
      if(extra.fields) setTimeout(()=>openBlanksEditor(rec.id), 120);
      return;
    }

    /* ---- the secondary route: a file ---- */
    const file=document.getElementById('ct-file').files[0];
    if(!file){ st('<span style="color:#8f322b">Choose a file.</span>'); return; }
    if(file.size>uploadMax()){ toast(uploadTooBigMsg(file),'err'); return; }
    st('Reading file…');
    try{
      const dataUrl=await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
      // Legacy .doc is refused on the bytes, not the extension — nothing is saved.
      const wordKind=detectWordFile(dataUrl, file.type||'', file.name);
      if(wordKind==='doc'){
        st(`<span style="color:#8f322b">${_tplEsc(WORD_REFUSAL)} Or open it in Word and <b>paste it</b> using the other tab — that keeps the formatting too.</span>`); return; }
      st('Reading the document and rebuilding its structure…');
      // Recover the document's SHAPE, not just its words — headings, bold,
      // italics, clause numbering and indentation are all stated by the PDF and
      // were previously thrown away, which is why an uploaded template used to
      // arrive as a wall of flat text next to a pasted one. Falls back to plain
      // text whenever the reconstruction is not confidently better.
      // A .docx reads as structured plain text (js/docx.js); the paste tab is
      // still the route that keeps Word's rich formatting.
      let rich = wordKind==='docx'
        ? { html:'', text:(await extractWordText(dataUrl)).text, format:TEXT_FORMAT, summary:null }
        : await extractDocRich(dataUrl, file.type||'');
      let text = rich.text;
      // a scanned standard-form contract is still a usable template once read
      if(ocrNeeded(file.type||'', text)){
        st('This looks like a scan — reading it with OCR…');
        const ocr=await ocrDocument(dataUrl, file.type||'', {
          onProgress:(done,total,tier)=>{ st(`Reading page ${Math.min(done+1,total)} of ${total}${tier==='local'?' (offline recogniser)':''}…`); } });
        // OCR returns words with no type information, so a scan is plain text
        if(ocr.text){ text=ocr.text; rich={ html:'', text, format:TEXT_FORMAT, summary:null }; }
      }
      if(!text||text.length<40){ st('<span style="color:#8f322b">Could not extract readable text from this file — try a text-based PDF, re-scan it at a higher resolution, or paste the document instead.</span>'); return; }
      const isRichBody = isRich(rich.format) && !!rich.html;
      const body = isRichBody ? rich.html : text;
      const found=detectBlanks(text).filter(d=>body.includes(d.raw));
      let extra = isRichBody ? { format:RICH_FORMAT, body, chars:text.length } : null;
      if(found.length && await confirmDialog({
        title:`Turn ${found.length} marked blank${found.length===1?'':'s'} into fill-in fields?`,
        message:`This template already marks ${found.length===1?'a blank':'blanks'} the usual ways — [BRACKETS], {{curly}} or a run of underscores: ${found.slice(0,4).map(d=>d.label).join(', ')}${found.length>4?`, and ${found.length-4} more`:''}. Converting them now means whoever uses this template is asked for each one, and the answers are filed as contract data. You can edit them afterwards either way.`,
        confirmLabel:'Convert them', cancelLabel:'Not now' })){
        const r=convertDetectedBlanks(body, found);
        extra={ ...(extra||{}), fields:r.fields, body:r.body };
      }
      const rec=saveTemplateRecord(name, folder, body, 'upload:'+file.name, extra);
      closeModal();
      toast(`Template “${name}” saved — ${text.length.toLocaleString()} characters${isRichBody&&rich.summary&&rich.summary.label?`, structure recovered (${rich.summary.label})`:''}${extra&&extra.fields?`, ${extra.fields.length} blank${extra.fields.length===1?'':'s'} detected`:''}`);
      if(state.view==='templates') renderTemplatesPage();
      updateSidebarCounts();
      if(extra&&extra.fields) setTimeout(()=>openBlanksEditor(rec.id), 120);
    }catch(e){ st('<span style="color:#8f322b">Extraction failed: '+_tplEsc(e.message)+'</span>'); }
  });

  paint();
}
/* Kept as the old name so nothing that calls it breaks; it now opens the
   Create-template modal on its file tab. */
const openUploadTemplateModal = () => openCreateTemplateModal('upload');

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
   reliability: manual selection (always works, no key, no network), Copilot-assisted
   ("Suggest blanks" — the human reviews and edits before anything is saved),
   and auto-detect of [SQUARE BRACKETS] / {{curly}} / underscore runs on import. */
/* The user's current selection, if it lies inside `host`. Returns the Range and
   its text, or null. */
function _richSelection(host){
  const s=window.getSelection && window.getSelection();
  if(!s || !s.rangeCount || s.isCollapsed) return null;
  const r=s.getRangeAt(0);
  if(!host.contains(r.commonAncestorContainer)) return null;
  // CLONE it. getRangeAt returns the selection's own live range, and the very
  // next thing the caller does is open a dialog to name the blank — which takes
  // focus and collapses the selection, taking the range's boundaries with it.
  // A cloned range keeps pointing at the nodes the user actually chose.
  return { range:r.cloneRange(), text:r.toString() };
}
/* Replace a selected range with literal text and return the re-sanitised body.
   Returns null when the range crosses block structure — deleting across a table
   row or two clauses would silently rewrite the document's shape, which is
   never what "make this a blank" means. */
function _richReplaceRange(host, picked, text){
  if(!picked) return null;
  const r=picked.range;
  // the range must live inside ONE block — a selection that swallows a whole
  // clause or a table row would rewrite the document's shape, not fill a gap
  const frag=r.cloneContents();
  if(frag.querySelector && frag.querySelector('p,h1,h2,h3,h4,li,tr,td,th,table,ul,ol,pre,blockquote')) return null;
  try{
    r.deleteContents();
    r.insertNode(document.createTextNode(text));
  }catch(e){ return null; }
  // host holds a rendered .hati-doc wrapper; take its inside, drop the
  // display-only placeholder marking, and sanitise before it becomes storage
  const inner=host.firstElementChild && host.firstElementChild.classList.contains('hati-doc')
    ? host.firstElementChild.innerHTML : host.innerHTML;
  return unmarkPlaceholders(inner);
}

function openBlanksEditor(tid){
  if(!tplCanManage()){ toast('Viewers cannot edit templates','err'); return; }
  const rec=customTemplates().find(x=>x.id===tid);
  if(!rec){ toast('Template not found','err'); return; }
  // work on a copy — nothing is written until Save
  let body=templateBody(rec);
  let fields=(rec.fields||[]).map(f=>({ ...f }));
  let dirty=false;
  // A rich template is NOT edited as raw HTML in a textarea — that would show
  // the customer their own contract as markup and destroy it on the first
  // keystroke. It is shown as the document it is, and a blank is made from the
  // live selection inside it. Free-text editing of a rich body belongs to the
  // template editor, not here.
  const rich=!!(window.isRich && isRich(templateFormat(rec)));
  /* The text a marker-detector or the Copilot should read — the projection for rich
     bodies, so it sees clause numbers and no tags. */
  const bodyText=()=> rich ? richToText(body) : body;

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
    if(pv){
      if(rich) pv.innerHTML=renderDocHtml(markPlaceholders(body, Object.fromEntries(fields.map(f=>[f.key,'{{'+f.key+'}}']))), RICH_FORMAT);
      else if(document.activeElement!==pv) pv.value=body;
    }
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
    <label style="display:block;margin-bottom:12px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Template body — select text, then “Make selection a blank”${rich?` <span style="font-weight:400;color:var(--color-neutral-500)">· formatted template: shown as the document it is, so marking a blank keeps the formatting intact</span>`:''}</span>
      ${rich
        ? `<div id="be-body" class="scroll-thin doc-surface" style="width:100%;height:210px;overflow-y:auto;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:9px 13px"></div>`
        : `<textarea id="be-body" class="scroll-thin" style="width:100%;height:210px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:9px 11px;font:inherit;font-size:12px;line-height:1.6;font-family:var(--font-mono);outline:none;resize:vertical"></textarea>`}</label>
    <div id="be-status" style="font-size:11px;color:var(--color-neutral-600);min-height:15px;margin-bottom:8px"></div>
    <div style="display:flex;justify-content:flex-end;gap:8px">
      <button id="be-cancel" class="ui-btn">Cancel</button>
      <button id="be-save" class="ui-btn ui-btn-primary">Save blanks</button>
    </div></div>`, {maxWidth:'760px'});
  draw();

  const bodyEl=document.getElementById('be-body');
  if(!rich) bodyEl.addEventListener('input',()=>{ body=bodyEl.value; dirty=true; draw(); });
  const status=m=>{ const el=document.getElementById('be-status'); if(el) el.innerHTML=m||''; };

  // ---- 1. manual (the reliable path — no key, no network)
  document.getElementById('be-make').addEventListener('click',async()=>{
    const picked=rich?_richSelection(bodyEl):null;
    const sel=(rich ? (picked?picked.text:'') : bodyEl.value.slice(bodyEl.selectionStart,bodyEl.selectionEnd)).trim();
    if(!sel){ status('<span style="color:#8f322b">Select the text in the document that should become a blank first.</span>'); return; }
    if(sel.length>200){ status('<span style="color:#8f322b">That selection is too long for a blank — pick the value, not the whole clause.</span>'); return; }
    const label=await promptDialog({
      title:'Name this blank',
      message:`“${sel.length<=60?sel:sel.slice(0,60)+'…'}” becomes a fill-in field. The name is what the person using this template sees when they are asked for it.`,
      label:'Blank name', placeholder:'e.g. Distributor name',
      value: sel.length<=40?sel:'', confirmLabel:'Add blank' });
    if(label==null) return;
    const lbl=String(label).trim() || sel.slice(0,40);
    const key=tplKeyFrom(lbl, fields);
    const shape=guessFieldShape(lbl);
    if(rich){
      // Replace the selected RANGE with the placeholder text, in the live
      // document, then re-serialise through the sanitiser. The surrounding
      // formatting is untouched because only the range's contents move.
      const next=_richReplaceRange(bodyEl, picked, '{{'+key+'}}');
      if(next==null){ status('<span style="color:#8f322b">That selection spans the document structure (a table row, or two clauses at once). Select the value on its own.</span>'); return; }
      body=next;
    } else {
      body=bodyEl.value.slice(0,bodyEl.selectionStart)+'{{'+key+'}}'+bodyEl.value.slice(bodyEl.selectionEnd);
    }
    fields.push({ key, label:lbl, type:shape.type, maps:shape.maps, required:!!shape.maps, def:'', opts:[] });
    dirty=true; draw(); status(`Added <b>{{${key}}}</b>.`);
  });

  // ---- 3. auto-detect markers already in the paper
  document.getElementById('be-detect').addEventListener('click',async()=>{
    // detect against the READABLE text (no tags), then rewrite the markers in
    // the body — each marker is literal text, so it substitutes either way
    const found=detectBlanks(bodyText()).filter(d=>(!/\{\{/.test(d.raw)||!fields.some(f=>'{{'+f.key+'}}'===d.raw))&&body.includes(d.raw));
    if(!found.length){ status('No [BRACKETS], {{curly}} markers or underscore runs found in this template.'); return; }
    if(!await confirmDialog({
      title:`Convert ${found.length} marker${found.length===1?'':'s'} into blanks?`,
      message:`Found ${found.slice(0,5).map(d=>d.label).join(', ')}${found.length>5?`, and ${found.length-5} more`:''}. Each becomes a fill-in field you can rename, retype and map to contract data. Nothing is saved until you press Save blanks.`,
      confirmLabel:'Convert them' })) return;
    const r=convertDetectedBlanks(body, found);
    // keep any fields already defined, append the new ones with unique keys
    for(const nf of r.fields){ if(!fields.some(f=>f.key===nf.key)) fields.push(nf); }
    body=r.body; dirty=true; draw();
    status(`Converted <b>${r.converted}</b> marker${r.converted===1?'':'s'} into blanks. Check the types and mappings above.`);
  });

  // ---- 2. Copilot-assisted — reviewed and editable before anything is saved
  document.getElementById('be-suggest')?.addEventListener('click',async(e)=>{
    const btn=e.currentTarget; btn.disabled=true; const was=btn.innerHTML;
    btn.innerHTML='Thinking…'; status('Asking the Copilot engine for suggestions — nothing is saved until you review them.');
    try{
      // the model reads the document, never the markup
      const r=await api('ai/blanks','POST',{ text: bodyText().slice(0, 60000) });
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

  document.getElementById('be-cancel').addEventListener('click',async()=>{
    if(dirty && !await confirmDialog({ title:'Discard these changes?',
      message:'The blanks you added, renamed or removed since opening this editor will be lost. The template itself is unchanged.',
      confirmLabel:'Discard changes', cancelLabel:'Keep editing', danger:true })) return;
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
    updateTemplateRecord(tid, { fields, body, chars:bodyText().length });
    closeModal(); toast(`${fields.length} blank${fields.length===1?'':'s'} saved on “${rec.name}”`);
    if(state.view==='templates') renderTemplatesPage();
  });
}

/* ============================================================ TEMPLATE EDITING
   A template you cannot change is a template you stop trusting: the moment the
   standard paper moves on, every draft generated from it is subtly wrong and
   the only recourse is to delete it and re-import. So a template is editable in
   place — name, value stream, body and blanks on one screen — and every save is
   a VERSION, with who, when and a note.

   The rule that makes editing safe to offer at all: **editing a template never
   touches a contract already created from it.** A contract's body is copied at
   creation, not referenced. That is stated on the editor, on the version list
   and in the audit entry, because a user who is not certain of it will not use
   the feature. */

const templateVersionNo = t => Number((t&&t.version)||1);
const templateVersions  = t => (t&&Array.isArray(t.versions)) ? t.versions : [];

/* How many contracts came from this template — and whether that number is the
   whole truth. In server mode the client holds a working set, which for a very
   large portfolio is capped, so the count is reported as a floor rather than
   quietly presented as complete. */
function templateUsage(tid){
  const rows=(state.contracts||[]).filter(c=>c.templateId===tid || c.templateRef===tid);
  const complete=!state.truncated;
  return { count:rows.length, complete, loaded:(state.contracts||[]).length,
    total:(state.serverStats&&state.serverStats.total)||state.totalCount||(state.contracts||[]).length,
    rows };
}
function templateUsageLabel(u){
  if(!u.count) return u.complete ? 'not used yet' : 'not used by any contract loaded here';
  const n=`${u.count} contract${u.count===1?'':'s'}`;
  return u.complete ? `used by ${n}` : `used by at least ${n} (${u.loaded.toLocaleString()} of ${u.total.toLocaleString()} loaded)`;
}

/* Save a new version of a template. The PREVIOUS state is pushed onto the
   version list — history is only ever appended to, never rewritten, so a revert
   is itself a new version rather than an erasure. */
function saveTemplateVersion(tid, patch, note){
  const t=customTemplates().find(x=>x.id===tid);
  if(!t) return null;
  const u=currentUser();
  const prior={ n:templateVersionNo(t), at:t.versionAt||t.at||nowISO(), by:t.versionBy||t.by||'—',
    note:t.versionNote||'Original', name:t.name, folder:t.folder,
    body:templateBody(t), format:templateFormat(t), fields:(t.fields||[]).map(f=>({...f})) };
  const versions=templateVersions(t).concat([prior]);
  const next={ ...t, ...patch,
    versions, version:prior.n+1, versionAt:nowISO(), versionBy:u?.name||'—',
    versionNote:String(note||'').trim()||'Edited' };
  return updateTemplateRecord(tid, next);
}

/* ---------- the one screen ---------- */
function openTemplateEditor(tid){
  if(!tplCanManage()){ toast('Viewers cannot edit templates','err'); return; }
  const rec=customTemplates().find(x=>x.id===tid);
  if(!rec){ toast('Template not found','err'); return; }

  // work on a copy — nothing is written until Save
  let name=rec.name, folder=rec.folder;
  let body=templateBody(rec);
  let format=templateFormat(rec);
  let fields=(rec.fields||[]).map(f=>({...f}));
  let editor=null, dirty=false, previewing=false;
  const usage=templateUsage(tid);
  const startedRich=isRich(format);
  const bodyText=()=> isRich(format) ? richToText(body) : body;

  const FLD='width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none';
  openModal(`<div style="padding:20px 22px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
      <span style="color:var(--color-accent)">${icon('pencil','w-4 h-4')}</span>
      <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Edit template</h3>
      <span style="font-family:var(--font-mono);font-size:11px;font-weight:600;color:var(--color-accent-700);border:1px solid var(--color-accent-300);background:var(--color-accent-100);border-radius:3px;padding:1px 6px">v${templateVersionNo(rec)}</span>
      <span style="flex:1"></span>
      <button id="te-versions" class="ui-btn" style="font-size:11px;padding:3px 9px;white-space:nowrap">${icon('history','w-3.5 h-3.5')} Versions (${templateVersions(rec).length+1})</button>
    </div>
    <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 4px;line-height:1.5">
      ${_tplEsc(templateUsageLabel(usage))} · saving creates <b>v${templateVersionNo(rec)+1}</b>.</p>
    <div style="display:flex;gap:7px;align-items:flex-start;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:7px 10px;margin:0 0 12px;font-size:11px;line-height:1.5;color:var(--color-neutral-700)">
      <span style="flex:none;margin-top:1px;color:var(--color-accent)">${icon('shield','w-3.5 h-3.5')}</span>
      <span><b>Contracts already created from this template are not affected.</b> A contract copies the wording when it is created; it does not follow the template afterwards. Changes here apply to the next draft you generate.</span>
    </div>

    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:10px;margin-bottom:12px">
      <label style="display:block"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Template name</span>
        <input id="te-name" value="${String(name).replace(/"/g,'&quot;')}" style="${FLD}"/></label>
      <label style="display:block"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Value stream</span>
        <select id="te-folder" style="${FLD};background:var(--color-surface)">${folderOptionsHtml(folder,false)}</select></label>
    </div>

    <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">
      <span style="font-size:11px;font-weight:600">Document</span>
      <span style="font-size:10.5px;color:var(--color-neutral-600)">${startedRich?'formatted — paste over it to replace, or edit in place':'plain text — paste formatted paper here to upgrade it'}</span>
      <span style="flex:1"></span>
      <button id="te-blank" class="ui-btn" style="font-size:11px;padding:3px 9px">Make selection a blank</button>
      <button id="te-preview" class="ui-btn" style="font-size:11px;padding:3px 9px">Preview</button>
    </div>
    <div id="te-body" class="scroll-thin doc-surface" style="height:230px;font-size:12.5px"
         data-placeholder="Paste the contract here, or type it."></div>
    <div id="te-previewpane" class="scroll-thin doc-surface" style="display:none;height:230px;overflow-y:auto;border:1px solid var(--color-accent-300);background:var(--color-bg);border-radius:5px;padding:14px 18px"></div>
    <p style="font-size:10.5px;color:var(--color-neutral-600);margin:6px 0 0;line-height:1.5">${RICH_EDITOR_NOTE}</p>

    <div style="display:flex;align-items:baseline;gap:8px;margin:12px 0 4px">
      <span style="font-size:11px;font-weight:600">Blanks</span>
      <span style="font-size:10.5px;color:var(--color-neutral-600)">these become the guided fields, and the contract data, when someone uses this template</span>
    </div>
    <div id="te-fields" class="scroll-thin" style="max-height:150px;overflow-y:auto;border:1px solid var(--color-divider);border-radius:5px;padding:6px 9px"></div>
    <div id="te-warn" style="font-size:10.5px;margin:7px 0;min-height:15px;line-height:1.5"></div>

    <label style="display:block;margin-bottom:12px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">What changed? <span style="font-weight:400;color:var(--color-neutral-500)">(recorded against v${templateVersionNo(rec)+1})</span></span>
      <input id="te-note" placeholder="e.g. New payment terms per the 2026 policy" style="${FLD}"/></label>

    <div id="te-status" style="font-size:11px;min-height:16px;margin-bottom:8px"></div>
    <div style="display:flex;justify-content:space-between;gap:8px">
      <button id="te-delete" class="ui-btn" style="border-color:#e6c9c1;color:#8f322b">Delete template</button>
      <span style="display:flex;gap:8px">
        <button id="te-cancel" class="ui-btn">Cancel</button>
        <button id="te-save" class="ui-btn ui-btn-primary" style="white-space:nowrap">${icon('check2','w-3.5 h-3.5')} Save as v${templateVersionNo(rec)+1}</button>
      </span>
    </div></div>`, {maxWidth:'880px'});

  const st=m=>{ const el=document.getElementById('te-status'); if(el) el.innerHTML=m||''; };
  bindFolderSelect(document.getElementById('te-folder'));

  /* ---- the document, in a real rich editor (reuses the paste conversion) ---- */
  const host=document.getElementById('te-body');
  const markEmpty=()=>host.setAttribute('data-empty',(host.textContent||'').trim()?'0':'1');
  editor=richEditor(host, {
    html: isRich(format) ? markPlaceholders(body, {}) : textToRich(body),
    onChange:()=>{ dirty=true; body=editor.get(); format=RICH_FORMAT; markEmpty(); drawFields(); },
    onPaste:res=>{
      // a paste replaces the document, so the format follows it
      format=RICH_FORMAT; dirty=true; body=editor.get();
      const r=pasteConversionReport(body, res.plain||'');
      st(r.ok
        ? `<span style="color:var(--color-neutral-700)">Pasted ${richToText(body).length.toLocaleString()} characters.${res.via==='text'?' The source offered no formatting, so this came in as plain text.':''} <b>Preview</b> before saving.</span>`
        : `<span style="color:#8f322b"><b>That did not come across properly.</b> ${_tplEsc(r.reason)} Undo (Ctrl+Z) and paste again, or use the plain-text version.</span>`);
      markEmpty(); drawFields();
    },
  });
  // opening a plain-text template in the rich editor does NOT itself change the
  // record — format only moves to 'rich' once the user actually edits or pastes
  format=templateFormat(rec);
  body=templateBody(rec);
  markEmpty();

  /* ---- blanks, kept in sync with the body ---- */
  const usedIn=()=> bodyPlaceholders(isRich(format)?body:body);
  function drawFields(){
    const used=usedIn();
    const orphanFields=fields.filter(f=>!used.includes(f.key));      // a field with no blank
    const orphanBlanks=used.filter(k=>!fields.some(f=>f.key===k));   // a blank with no field
    const stl='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:4px 7px;font:inherit;font-size:11.5px;outline:none';
    const host2=document.getElementById('te-fields'); if(!host2) return;
    host2.innerHTML=fields.length?fields.map((f,i)=>`
      <div data-fld="${i}" style="display:grid;grid-template-columns:1.3fr .9fr 1.2fr auto auto;gap:6px;align-items:center;padding:4px 0;border-bottom:1px solid rgba(29,31,32,.05)">
        <input data-f="label" value="${String(f.label||'').replace(/"/g,'&quot;')}" placeholder="Label" style="${stl}"/>
        <select data-f="type" style="${stl}">${TPL_FIELD_TYPES.map(x=>`<option value="${x.k}" ${f.type===x.k?'selected':''}>${x.label}</option>`).join('')}</select>
        <select data-f="maps" style="${stl}">${TPL_MAPS.map(x=>`<option value="${x.k}" ${(f.maps||'')===x.k?'selected':''}>${x.label}</option>`).join('')}</select>
        <label style="display:inline-flex;align-items:center;gap:4px;font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap"><input data-f="required" type="checkbox" ${f.required?'checked':''} style="accent-color:var(--color-accent)"/>req</label>
        <button data-del="${i}" title="Remove this blank" style="border:1px solid #e6c9c1;background:none;color:#8f322b;border-radius:4px;font:inherit;font-size:11px;padding:2px 7px;cursor:pointer">×</button>
        ${f.type==='select'?`<input data-f="opts" value="${String((f.opts||[]).join(', ')).replace(/"/g,'&quot;')}" placeholder="Choices, comma separated" style="${stl};grid-column:1 / -1"/>`:''}
        <div style="grid-column:1 / -1;font-size:10px;color:var(--color-neutral-500);font-family:var(--font-mono)">{{${f.key}}}${orphanFields.includes(f)?' <span style="color:#8f322b">— not used anywhere in the document above</span>':''}</div>
      </div>`).join('')
      :`<div style="font-size:11.5px;color:var(--color-neutral-600);padding:6px 0">No blanks. Select a value in the document above and press <b>Make selection a blank</b>.</div>`;
    host2.querySelectorAll('[data-fld]').forEach(row=>{
      const i=Number(row.getAttribute('data-fld'));
      row.querySelectorAll('[data-f]').forEach(el=>el.addEventListener('change',()=>{
        const k=el.getAttribute('data-f');
        if(k==='required') fields[i].required=el.checked;
        else if(k==='opts') fields[i].opts=el.value.split(',').map(s=>s.trim()).filter(Boolean);
        else fields[i][k]=el.value;
        dirty=true; if(k==='type') drawFields();
      }));
      row.querySelector('[data-del]')?.addEventListener('click',()=>{
        // removing a field puts its LABEL back into the document, so the
        // sentence still reads as a sentence rather than losing a word
        const f=fields[i];
        body=body.split('{{'+f.key+'}}').join(f.label||'_____');
        editor.set(isRich(format)?markPlaceholders(body,{}):textToRich(body));
        body=isRich(format)?editor.get():body;
        fields.splice(i,1); dirty=true; drawFields();
      });
    });
    // The warnings OFFER THE REMEDY rather than just reporting the problem —
    // the person is mid-edit, and telling them something is wrong without a way
    // to fix it just makes them cancel.
    const warn=document.getElementById('te-warn');
    if(warn){
      const act=(a,k,label)=>`<button type="button" data-fix="${a}" data-k="${k}" style="border:0;background:none;padding:0;font:inherit;font-size:inherit;font-weight:600;color:inherit;text-decoration:underline;cursor:pointer">${label}</button>`;
      const bits=[];
      if(orphanBlanks.length) bits.push(`<span style="display:block;color:#8f322b"><b>${orphanBlanks.length} placeholder${orphanBlanks.length===1?'':'s'}</b> in the document with no matching blank: ${orphanBlanks.map(k=>`{{${k}}} — ${act('mk',k,'create the blank')} or ${act('rm',k,'remove it from the document')}`).join('; ')}. Saving is blocked until this is resolved: an unmatched placeholder prints as literal braces in every contract.</span>`);
      if(orphanFields.length) bits.push(`<span style="display:block;color:#7d5a14;margin-top:3px"><b>${orphanFields.length} blank${orphanFields.length===1?'':'s'}</b> no longer used in the document: ${orphanFields.map(f=>`${_tplEsc(f.label||f.key)} — ${act('del',f.key,'remove the blank')} or ${act('ins',f.key,'put {{'+f.key+'}} back at the end')}`).join('; ')}. Left as-is ${orphanFields.length===1?'it':'they'} will still be asked for, and the answer will go nowhere.</span>`);
      warn.innerHTML = bits.length?bits.join('')
        : `<span style="color:var(--color-neutral-600)">${fields.length} blank${fields.length===1?'':'s'}, all present in the document.</span>`;
      warn.querySelectorAll('[data-fix]').forEach(b=>b.addEventListener('click',()=>{
        const k=b.getAttribute('data-k');
        switch(b.getAttribute('data-fix')){
          case 'mk': {                                   // placeholder → give it a blank
            const shape=guessFieldShape(k);
            fields.push({ key:k, label:k.replace(/_/g,' ').replace(/^./,x=>x.toUpperCase()),
              type:shape.type, maps:shape.maps, required:!!shape.maps, def:'', opts:[] });
            break; }
          case 'rm': {                                   // placeholder → take it out of the document
            setBody(body.split('{{'+k+'}}').join(''));
            break; }
          case 'del': {                                  // unused blank → drop it
            const i=fields.findIndex(f=>f.key===k); if(i>=0) fields.splice(i,1);
            break; }
          case 'ins': {                                  // unused blank → put it back in the document
            const f=fields.find(x=>x.key===k);
            setBody(isRich(format) ? body+`<p>${_tplEsc(f?f.label:k)}: {{${k}}}</p>`
                                   : body+`\n\n${f?f.label:k}: {{${k}}}`);
            break; }
        }
        dirty=true; drawFields();
      }));
    }
  }
  /* Write a new body into the editor and keep every copy of it in step. */
  function setBody(next){
    body=next;
    editor.set(isRich(format) ? markPlaceholders(body,{}) : textToRich(body));
    if(isRich(format)) body=unmarkPlaceholders(editor.get());
  }
  drawFields();

  document.getElementById('te-blank').addEventListener('click',async()=>{
    const picked=_richSelection(host);
    const sel=(picked?picked.text:'').trim();
    if(!sel){ st('<span style="color:#8f322b">Select the value in the document that should become a blank first.</span>'); return; }
    if(sel.length>200){ st('<span style="color:#8f322b">That selection is too long for a blank — pick the value, not the whole clause.</span>'); return; }
    const label=await promptDialog({
      title:'Name this blank',
      message:`“${sel.length<=60?sel:sel.slice(0,60)+'…'}” becomes a fill-in field. The name is what the person using this template sees when they are asked for it.`,
      label:'Blank name', placeholder:'e.g. Distributor name',
      value: sel.length<=40?sel:'', confirmLabel:'Add blank' });
    if(label==null) return;
    const lbl=String(label).trim()||sel.slice(0,40);
    const key=tplKeyFrom(lbl, fields);
    const next=_richReplaceRange(host, picked, '{{'+key+'}}');
    if(next==null){ st('<span style="color:#8f322b">That selection spans the document structure (a table row, or two clauses at once). Select the value on its own.</span>'); return; }
    body=next; format=RICH_FORMAT;
    const shape=guessFieldShape(lbl);
    fields.push({ key, label:lbl, type:shape.type, maps:shape.maps, required:!!shape.maps, def:'', opts:[] });
    editor.set(markPlaceholders(body,{}));
    body=unmarkPlaceholders(editor.get());
    dirty=true; drawFields(); st(`Added <b>{{${key}}}</b>.`);
  });

  const pv=document.getElementById('te-previewpane'), pvBtn=document.getElementById('te-preview');
  pvBtn.addEventListener('click',()=>{
    if(previewing){ previewing=false; pv.style.display='none'; host.style.display=''; pvBtn.textContent='Preview'; editor.focus(); return; }
    const shown=isRich(format)?markPlaceholders(body, Object.fromEntries(fields.map(f=>[f.key,f.label||f.key]))):body;
    pv.innerHTML=isRich(format)?renderDocHtml(shown,RICH_FORMAT):documentTextHtml(body);
    previewing=true; pv.style.display=''; host.style.display='none'; pvBtn.textContent='Back to editing'; st('');
  });

  document.getElementById('te-versions').addEventListener('click',async()=>{
    if(dirty && !await confirmDialog({ title:'Leave the editor?',
      message:'You have unsaved changes to this template. Opening the version history will discard them.',
      confirmLabel:'Discard and view versions', cancelLabel:'Keep editing', danger:true })) return;
    closeModal(); openTemplateVersions(tid);
  });
  document.getElementById('te-cancel').addEventListener('click',async()=>{
    if(dirty && !await confirmDialog({ title:'Discard these changes?',
      message:`The edits you have made since opening this editor will be lost. “${rec.name}” stays at v${templateVersionNo(rec)}.`,
      confirmLabel:'Discard changes', cancelLabel:'Keep editing', danger:true })) return;
    closeModal();
  });
  document.getElementById('te-delete').addEventListener('click',()=>{ closeModal(); deleteTemplateGuarded(tid); });

  document.getElementById('te-save').addEventListener('click',async()=>{
    const nm=document.getElementById('te-name').value.trim();
    if(!nm){ st('<span style="color:#8f322b">The template needs a name.</span>'); return; }
    if(previewing) pvBtn.click();
    if(isRich(format)) body=unmarkPlaceholders(editor.get());
    const text=bodyText();
    if(!text.trim()){ st('<span style="color:#8f322b">The document cannot be empty.</span>'); return; }

    // the blank/body sync warnings are BLOCKING in one direction and advisory in
    // the other: a placeholder with no field would render as literal braces in
    // a real contract, which is a broken document; a field with no placeholder
    // just asks a pointless question, which the user may well intend mid-edit.
    const used=usedIn();
    const orphanBlanks=used.filter(k=>!fields.some(f=>f.key===k));
    if(orphanBlanks.length){ st(`<span style="color:#8f322b">The document uses ${orphanBlanks.map(k=>'{{'+k+'}}').join(', ')} with no matching blank. Add the blank or remove the placeholder — otherwise it prints as literal braces in every contract made from this template.</span>`); return; }
    const orphanFields=fields.filter(f=>!used.includes(f.key));
    if(orphanFields.length && !await confirmDialog({
      title:`Save with ${orphanFields.length} unused blank${orphanFields.length===1?'':'s'}?`,
      message:`${orphanFields.map(f=>f.label||f.key).join(', ')} ${orphanFields.length===1?'is':'are'} no longer used anywhere in the document. `+
        `${orphanFields.length===1?'It':'They'} will still be asked for when someone uses this template, and the answer will not appear in the contract.`,
      confirmLabel:'Save anyway', cancelLabel:'Go back and fix it' })) return;
    const bad=fields.find(f=>!String(f.label||'').trim());
    if(bad){ st('<span style="color:#8f322b">Every blank needs a label.</span>'); return; }
    const badSel=fields.find(f=>f.type==='select'&&!(f.opts||[]).length);
    if(badSel){ st(`<span style="color:#8f322b">“${_tplEsc(badSel.label)}” is a choice list with no choices.</span>`); return; }

    const note=document.getElementById('te-note').value.trim();
    const next=saveTemplateVersion(tid, {
      name:nm, folder:document.getElementById('te-folder').value,
      body, text:body, format:docFormat(format), fields, chars:text.length,
    }, note);
    closeModal();
    toast(`“${nm}” saved as v${templateVersionNo(next)} — contracts already created from it are unchanged`);
    if(state.view==='templates') renderTemplatesPage();
    updateSidebarCounts();
  });
}

/* ---------- version history, with revert ---------- */
function openTemplateVersions(tid){
  const rec=customTemplates().find(x=>x.id===tid);
  if(!rec){ toast('Template not found','err'); return; }
  const prior=templateVersions(rec);
  const current={ n:templateVersionNo(rec), at:rec.versionAt||rec.at, by:rec.versionBy||rec.by,
    note:rec.versionNote||'Original', name:rec.name, folder:rec.folder,
    body:templateBody(rec), format:templateFormat(rec), fields:rec.fields||[] };
  const all=prior.concat([current]).slice().reverse();
  const canManage=tplCanManage();

  openModal(`<div style="padding:20px 22px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
      <span style="color:var(--color-accent)">${icon('history','w-4 h-4')}</span>
      <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Versions of “${_tplEsc(rec.name)}”</h3>
    </div>
    <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.5">Every save is kept. Reverting does not erase anything — it copies an earlier version forward as a <b>new</b> version, so the history stays intact. <b>No contract changes either way</b>: a contract copies its wording at creation.</p>
    <div class="scroll-thin" style="max-height:52vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px">
      ${all.map(v=>`
        <div style="display:flex;align-items:center;gap:9px;border:1px solid ${v.n===current.n?'var(--color-accent-300)':'var(--color-divider)'};background:${v.n===current.n?'var(--color-accent-100)':'var(--color-surface)'};border-radius:5px;padding:8px 11px">
          <span style="font-family:var(--font-mono);font-weight:600;font-size:12px;color:var(--color-accent-700);flex:none">v${v.n}</span>
          <span style="min-width:0;flex:1">
            <span style="display:block;font-size:12px;color:var(--color-neutral-800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_tplEsc(v.note||'Saved')}${v.name!==rec.name?` <span style="color:var(--color-neutral-500)">· named “${_tplEsc(v.name)}”</span>`:''}</span>
            <span style="display:block;font-size:10px;color:var(--color-neutral-500);font-family:var(--font-mono)">${v.by?_tplEsc(v.by)+' · ':''}${v.at?fmtDT(v.at):''} · ${(v.fields||[]).length} blank${(v.fields||[]).length===1?'':'s'} · ${(v.format==='rich'?'formatted':'plain text')}</span>
          </span>
          ${v.n===current.n?`<span class="badge" style="flex:none;background:var(--color-accent-200);color:var(--color-accent-800)">current</span>`
            :`<button data-tv-view="${v.n}" class="ui-btn" style="flex:none;font-size:11px;padding:3px 9px">View</button>
              ${canManage?`<button data-tv-revert="${v.n}" class="ui-btn" style="flex:none;font-size:11px;padding:3px 9px">Revert to this</button>`:''}`}
        </div>`).join('')}
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
      ${canManage?`<button id="tv-edit" class="ui-btn">Back to editing</button>`:''}
      <button id="tv-close" class="ui-btn ui-btn-primary">Close</button>
    </div></div>`, {maxWidth:'760px'});

  document.getElementById('tv-close').addEventListener('click',closeModal);
  document.getElementById('tv-edit')?.addEventListener('click',()=>{ closeModal(); openTemplateEditor(tid); });
  document.querySelectorAll('[data-tv-view]').forEach(b=>b.addEventListener('click',()=>{
    const v=all.find(x=>String(x.n)===b.getAttribute('data-tv-view')); if(!v) return;
    openTemplatePreview({ ...v, id:rec.id, name:`${v.name} — v${v.n}`, at:v.at, by:v.by, chars:(v.format==='rich'?richToText(v.body):v.body).length, _readonly:true });
  }));
  document.querySelectorAll('[data-tv-revert]').forEach(b=>b.addEventListener('click',async()=>{
    const v=all.find(x=>String(x.n)===b.getAttribute('data-tv-revert')); if(!v) return;
    const u=templateUsage(tid);
    if(!await confirmDialog({ title:`Revert “${rec.name}” to v${v.n}?`,
      message:`This copies v${v.n}'s wording, blanks, name and value stream forward as v${templateVersionNo(rec)+1}. Nothing is erased — v${templateVersionNo(rec)} stays in the history.\n\nThe ${u.count?templateUsageLabel(u).replace(/^used by /,''):'contracts'} already created from this template are not affected.`,
      confirmLabel:`Revert to v${v.n}` })) return;
    const text=(v.format==='rich'?richToText(v.body):v.body);
    const next=saveTemplateVersion(tid, { name:v.name, folder:v.folder, body:v.body, text:v.body,
      format:v.format, fields:(v.fields||[]).map(f=>({...f})), chars:text.length }, `Reverted to v${v.n}`);
    closeModal();
    toast(`Reverted to v${v.n} — saved as v${templateVersionNo(next)}`);
    if(state.view==='templates') renderTemplatesPage();
  }));
}

/* ---------- deletion, with the count in front of the decision ---------- */
async function deleteTemplateGuarded(tid){
  if(!tplCanManage()){ toast('Viewers cannot delete templates','err'); return; }
  const t=customTemplates().find(x=>x.id===tid); if(!t) return;
  const u=templateUsage(tid);
  const vn=templateVersionNo(t);
  const msg = u.count
    ? `This template has been used to create ${u.complete?'':'at least '}${u.count} contract${u.count===1?'':'s'}.\n\n`+
      `Those contracts keep their wording and are not affected — a contract copies its text at creation. But the template itself, and all ${vn} version${vn===1?'':'s'} of its history, are gone for good, and you will not be able to generate another draft from it.`
    : `No contract has been created from this template${u.complete?'':' among those loaded here'}. All ${vn} version${vn===1?'':'s'} of its history are deleted with it.`;
  if(!await confirmDialog({ title:`Delete template “${t.name}”?`, message:msg,
    confirmLabel:'Delete template', danger:true })) return;
  saveCustomTemplates(customTemplates().filter(x=>x.id!==tid));
  toast(`Template “${t.name}” deleted`);
  renderTemplatesPage(); updateSidebarCounts();
}

/* ---------- "Duplicate & edit" for a built-in ----------
   The twelve built-ins are GENERATORS, not stored text — they are rendered
   from code, so they cannot be edited in place without becoming something
   else. Duplicating one renders it once, converts its fill-in inputs back into
   {{blanks}}, and hands over an ordinary editable template that carries the
   built-in's own field schema. The built-in itself is untouched. */
function duplicateBuiltinTemplate(bid){
  if(!tplCanManage()){ toast('Viewers cannot add templates','err'); return; }
  const t=TEMPLATES[bid]; if(!t){ toast('Template not found','err'); return; }
  const u=currentUser();
  const fields=templateFields(t).map(f=>({...f}));
  // a throwaway contract, rendered exactly as the generator would render it
  const probe=migrateContract({ id:'TPL-PREVIEW', name:t.name, template:bid, counterparty:'',
    value:0, valueType:t.valueType, folder:t.folder, status:'Draft', fields:{} });
  const holder=document.createElement('div');
  holder.innerHTML=docBody(probe);
  holder.querySelectorAll('.seal-in,[data-anchor="sig"]').forEach(el=>el.remove());
  // every fill-in input becomes the blank it stands for
  holder.querySelectorAll('input,textarea').forEach(inp=>{
    const key=inp.getAttribute('data-field')||inp.getAttribute('data-sync')||'';
    const known=fields.find(f=>f.key===key);
    const span=document.createElement('span');
    span.textContent = known ? `{{${known.key}}}` : (key?`{{${key}}}`:'_____________');
    if(key && !known) fields.push({ key, label:key.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()),
      type:'text', maps:'', required:false, def:'', opts:[] });
    inp.replaceWith(span);
  });
  const body=sanitizeRich(holder.innerHTML);
  const text=richToText(body);
  if(!text || text.length<40){ toast('That template could not be converted into an editable copy','err'); return; }
  // keep only the blanks the rendered document actually uses
  const used=bodyPlaceholders(body);
  const keep=fields.filter(f=>used.includes(f.key));
  const rec=saveTemplateRecord(`${t.name} (copy)`, t.folder, body, 'builtin:'+bid,
    { format:RICH_FORMAT, fields:keep, body, chars:text.length,
      version:1, versionAt:nowISO(), versionBy:u?.name||'—',
      versionNote:`Duplicated from the HaTi built-in “${t.name}”`, versions:[] });
  toast(`Copied “${t.name}” into My templates — edit it freely, the built-in is unchanged`);
  if(state.view==='templates') renderTemplatesPage();
  updateSidebarCounts();
  setTimeout(()=>openTemplateEditor(rec.id), 120);
  return rec;
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

/* A template's body, rendered. Rich bodies go through the sanitiser again here
   (defence in depth) and have their {{blanks}} marked so they read as gaps in
   a document rather than as literal braces. */
const _tplSourceLabel = t => {
  const src=String(t.source||'');
  if(src.startsWith('contract:')) return 'From contract '+src.slice(9);
  if(src.startsWith('sample:'))   return 'HaTi sample';
  if(src.startsWith('builtin:'))  return 'Copy of HaTi '+src.slice(8);
  if(src.startsWith('upload:'))   return 'Uploaded';
  if(src==='paste')               return 'Pasted';
  return 'Uploaded';
};
function _tplPreviewHtml(tpl){
  const body=templateBody(tpl), fmt=templateFormat(tpl);
  if(window.isRich && isRich(fmt)){
    const labels={}; templateFields(tpl).forEach(f=>{ labels[f.key]=f.label||f.key; });
    return renderDocHtml(markPlaceholders(body, labels), RICH_FORMAT);
  }
  return window.documentTextHtml ? documentTextHtml(body)
    : `<div style="font-size:12.5px;line-height:1.65;white-space:pre-wrap">${_tplEsc(body)}</div>`;
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
      <div class="scroll-thin doc-surface" style="border:1px solid var(--color-divider);border-radius:5px;background:var(--color-bg);padding:14px 16px;max-height:55vh;overflow-y:auto">${_tplPreviewHtml(tpl)}</div>
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
  const CARD='background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px';
  const H4='font-family:var(--font-heading);font-weight:600;font-size:15px;margin:0';
  const my=customTemplates();
  const canManage=tplCanManage();
  // tone icon-tile per value stream (tile-bg / tile-fg tokens)
  const TPL_TONE={proc:'steel',mfg:'amber',dist:'emerald',sales:'steel',mktg:'amber',corp:'ruby'};
  const tplTile=folder=>{ const t=TPL_TONE[folder]||'steel'; return `background:var(--tile-${t}-bg);color:var(--tile-${t}-fg)`; };

  const myCards=my.map(t=>`
    <div class="lift" style="${CARD};border-left:4px solid ${folderColor(t.folder)};padding:18px;display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:32px;height:32px;flex:none;display:grid;place-items:center;border-radius:10px;${tplTile(t.folder)}">${icon('copy','w-3.5 h-3.5')}</span>
        <span style="min-width:0;flex:1">
          <span style="display:block;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_tplEsc(t.name)}</span>
          <span style="display:block;font-size:10px;color:var(--color-neutral-600)">${FOLDERS[t.folder]?.name||'—'} · ${(t.chars||t.text.length).toLocaleString()} chars</span>
        </span>
      </div>
      <div style="font-size:10px;color:var(--color-neutral-500)">${_tplSourceLabel(t)} · ${t.at?fmtDT(t.at):''}</div>
      <div style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--color-neutral-600)">
        <span style="font-family:var(--font-mono);font-weight:600;color:var(--color-accent-700)">v${templateVersionNo(t)}</span>
        <span>·</span><span>${_tplEsc(templateUsageLabel(templateUsage(t.id)))}</span>
        ${isRich(templateFormat(t))?`<span>·</span><span title="Keeps headings, emphasis and clause numbering">formatted</span>`:''}
      </div>
      <div style="display:flex;gap:6px;margin-top:2px;flex-wrap:wrap">
        ${canManage?`<button data-tpl-use="${t.id}" class="ui-btn ui-btn-primary" style="font-size:11.5px;padding:4px 10px;flex:1">Use</button>`:''}
        ${canManage?`<button data-tpl-edit="${t.id}" class="ui-btn" style="font-size:11.5px;padding:4px 10px">Edit</button>`:''}
        <button data-tpl-prev="${t.id}" class="ui-btn" style="font-size:11.5px;padding:4px 10px">Preview</button>
        <button data-tpl-vers="${t.id}" class="ui-btn" style="font-size:11.5px;padding:4px 9px" title="Version history — ${templateVersions(t).length+1} version${templateVersions(t).length?'s':''}">${icon('history','w-3 h-3')}</button>
        ${canManage?`<button data-tpl-del="${t.id}" class="ui-btn" style="font-size:11.5px;padding:4px 8px;border-color:#e6c9c1;color:#8f322b" title="Delete template">${icon('trash','w-3 h-3')}</button>`:''}
      </div>
      ${canManage?`<div style="display:flex;gap:6px">
        <button data-tpl-blanks="${t.id}" class="ui-btn" style="font-size:11px;padding:3.5px 9px;flex:1">${templateFields(t).length?`${templateFields(t).length} blank${templateFields(t).length===1?'':'s'}`:'Add blanks'}</button>
        ${templateFields(t).length?`<button data-tpl-bulk="${t.id}" class="ui-btn" style="font-size:11px;padding:3.5px 9px;flex:1">Create in bulk</button>`:''}
      </div>`:''}
    </div>`).join('');

  const myRole=currentUser()?.role||'viewer';
  const builtinCards=Object.values(TEMPLATES).filter(t=>!canManage||templateAllowedForRole(t.id,myRole)).map(t=>`
    <div class="lift" style="${CARD};border-left:4px solid ${folderColor(t.folder)};padding:18px;display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:32px;height:32px;flex:none;display:grid;place-items:center;border-radius:10px;${tplTile(t.folder)}">${icon(t.ic,'w-3.5 h-3.5')}</span>
        <span style="min-width:0;flex:1">
          <span style="display:block;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name}</span>
          <span style="display:block;font-size:10px;color:var(--color-neutral-600)">${FOLDERS[t.folder].name} · Template ${t.id}</span>
        </span>
      </div>
      <div style="font-size:10.5px;color:var(--color-neutral-600);line-height:1.45;flex:1">${t.blurb||''}</div>
      ${canManage?`<div style="display:flex;gap:6px;margin-top:2px">
        <button data-tpl-builtin="${t.id}" class="ui-btn ui-btn-primary" style="font-size:11.5px;padding:4px 10px;flex:1">Use template</button>
        <button data-tpl-bulk-b="${t.id}" class="ui-btn" style="font-size:11px;padding:4px 9px">Bulk</button>
      </div>
      <button data-tpl-dup="${t.id}" class="ui-btn" style="font-size:11px;padding:3.5px 9px;width:100%" title="HaTi's own templates are generated from code, so they cannot be edited in place. This makes an editable copy in My templates.">Duplicate &amp; edit</button>`:''}
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

    <!-- Company standard templates (the versioned library) render here — one
         page for every kind of paper, not a second screen to know about. -->
    <div id="tpl-company-section"></div>

    <section style="${CARD};padding:16px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:${my.length?'12px':'6px'}">
        <h4 style="${H4}">My templates</h4>
        <span style="font-size:10.5px;color:var(--color-neutral-600)">${my.length} saved</span>
        <span style="flex:1"></span>
        ${canManage?`<button id="tpl-upload" class="ui-btn ui-btn-primary" style="font-size:12px;padding:5px 12px">${icon('plus','w-3.5 h-3.5')} Create template</button>`:''}
      </div>
      ${my.length
        ?`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px">${myCards}</div>`
        :`<p style="font-size:12px;color:var(--color-neutral-600);margin:0;line-height:1.6">No custom templates yet. <b>Create</b> one by pasting your company's standard paper straight out of Word, <b>import</b> a HaTi sample below, or open any contract and use <b>Save as template</b> in its workspace toolbar. Saved templates appear in the + New contract menu.</p>`}
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

  document.getElementById('tpl-upload')?.addEventListener('click',()=>openCreateTemplateModal('paste'));
  document.querySelectorAll('[data-tpl-use]').forEach(b=>b.addEventListener('click',()=>createFromCustomTemplate(b.getAttribute('data-tpl-use'))));
  document.querySelectorAll('[data-tpl-prev]').forEach(b=>b.addEventListener('click',()=>{ const t=customTemplates().find(x=>x.id===b.getAttribute('data-tpl-prev')); if(t) openTemplatePreview(t); }));
  document.querySelectorAll('[data-tpl-edit]').forEach(b=>b.addEventListener('click',()=>openTemplateEditor(b.getAttribute('data-tpl-edit'))));
  document.querySelectorAll('[data-tpl-vers]').forEach(b=>b.addEventListener('click',()=>openTemplateVersions(b.getAttribute('data-tpl-vers'))));
  document.querySelectorAll('[data-tpl-dup]').forEach(b=>b.addEventListener('click',()=>duplicateBuiltinTemplate(b.getAttribute('data-tpl-dup'))));
  // deletion puts the usage count in front of the decision rather than after it
  document.querySelectorAll('[data-tpl-del]').forEach(b=>b.addEventListener('click',()=>deleteTemplateGuarded(b.getAttribute('data-tpl-del'))));
  document.querySelectorAll('[data-tpl-builtin]').forEach(b=>b.addEventListener('click',()=>openWizard(b.getAttribute('data-tpl-builtin'))));
  document.querySelectorAll('[data-tpl-blanks]').forEach(b=>b.addEventListener('click',()=>openBlanksEditor(b.getAttribute('data-tpl-blanks'))));
  document.querySelectorAll('[data-tpl-bulk]').forEach(b=>b.addEventListener('click',()=>{ const t=customTemplates().find(x=>x.id===b.getAttribute('data-tpl-bulk')); if(t) openBulkCreateModal(t); }));
  document.querySelectorAll('[data-tpl-bulk-b]').forEach(b=>b.addEventListener('click',()=>{ const t=TEMPLATES[b.getAttribute('data-tpl-bulk-b')];
    if(!t) return;
    if(!templateAllowedForRole(t.id, currentUser()?.role||'viewer')){ toast('That template is not open to your role','err'); return; }
    openBulkCreateModal(t); }));
  document.querySelectorAll('[data-sample-imp]').forEach(b=>b.addEventListener('click',()=>importHatiSample(Number(b.getAttribute('data-sample-imp')), b)));
  if(window.renderCompanyTemplatesSection) renderCompanyTemplatesSection();
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
    :`<p style="font-size:11.5px;color:var(--color-neutral-600);margin:0;line-height:1.6">No playbook deviations recorded yet. Run the <b>Copilot review</b> from a contract's workspace — deviations from these positions will be listed here.</p>`;

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
        <p style="font-size:11.5px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">Your standard clauses — the wording HaTi drafts with and the Copilot review checks incoming paper against.</p>
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

Object.assign(window,{HATI_SAMPLES,openBlanksEditor,_tplPreviewHtml,_tplSourceLabel,_richSelection,_richReplaceRange,
  templateVersionNo,templateVersions,templateUsage,templateUsageLabel,saveTemplateVersion,
  openTemplateEditor,openTemplateVersions,deleteTemplateGuarded,duplicateBuiltinTemplate,openBulkCreateModal,openTemplateFillModal,buildFromCustomTemplate,updateTemplateRecord,createFromCustomTemplate,customTemplates,importHatiSample,openTemplatePreview,openCreateTemplateModal,openUploadTemplateModal,renderPlaybookPage,renderTemplatesPage,saveContractAsTemplate,saveCustomTemplates,saveTemplateRecord});
