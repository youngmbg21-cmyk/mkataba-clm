// HaTi — Templates page + the "Our standards" page (view-playbook).
// Globals window-attached like every other view module.
//
// Templates: the built-in HaTi generators (TEMPLATES), the workspace's own
// custom templates (uploaded documents or contracts saved as templates,
// persisted in state.settings.customTemplates through saveSettings so they
// work in both local and server mode), and the bundled HaTi sample PDFs.
// Our standards: the clause library + per-type playbook plus a portfolio
// deviations list. It keeps its route (view-playbook) and now has its own
// sidebar door under Administration. It used to be reached only through the
// Templates page — but setting the rules a company holds paper to is
// governance, done rarely and by an admin, and it does not belong inside the
// screen people open to draft from. The two views still share this file
// because they share the template model, not because they share a door.

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
  if(!canEdit()){ toast(i18t('lib_viewers_no_create'),'err'); return; }
  const t=customTemplates().find(x=>x.id===tid);
  if(!t){ toast(i18t('lib_template_not_found'),'err'); return; }
  // A template with blanks goes through the same guided fill as the built-ins,
  // so the contract arrives with structured data rather than raw text.
  const fs=templateFields(t);
  if(fs.length){ openTemplateFillModal(t); return; }
  /* A template with NO blanks used to create silently — same gap the company
     standard path had. The wording needs nothing filled in, but the contract
     record underneath it still does, so the essentials are asked here too.
     Skip creates exactly what pressing Use created before. */
  if(typeof openContractEssentials==='function'){
    openContractEssentials({
      title: t.name, blurb: 'This template needs nothing filled into its wording.',
      onCreate: v => buildFromCustomTemplate(t, {}, { counterpartyEmail: v.cpemail||'', essentials: v }),
      onSkip: () => buildFromCustomTemplate(t, {}),
    });
    return;
  }
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
  // The mapped counterparty field is the counterparty — recorded, not only
  // spelled into the title. See js/wizard.js for the fault this closes.
  const c={ id:nextId(), name:t.name+(cp?' — '+cp:' (Draft)'), counterparty:cp,
    /* Our own entity on this agreement. Blank is not an error — contractParty
       falls back to the workspace, which is what the paper said before this
       question existed. */
    party:String((opts&&opts.party)||'').trim()||undefined,
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
    templateVersion:templateVersionNo(t),
    // N3-T1: template-born, so it numbers live (see js/wizard.js for the rule).
    numbering:'live' };
  if(fs.length) applyTemplateValues(c, fs, values);
  /* The essentials, when this template had no blanks of its own to carry them.
     Same mapping, applied after so a template field always wins over the
     generic question if a template happened to ask both. */
  if(opts && opts.essentials && typeof applyContractEssentials==='function')
    applyContractEssentials(c, opts.essentials);
  // v1 is captured through captureVersion so it carries the text projection and
  // the canonical form, exactly like every later version
  if(window.captureVersion) captureVersion(c, `Template “${t.name}”`, u?.name||'System');
  c._loaded=true; c._light=false; c._v=0;
  if(window.contractOwnerStamp) contractOwnerStamp(c);
  state.contracts.unshift(c);
  /* A NEW DRAFT OPENS ON KEY TERMS, not on its document — see
     wsTabDefaults. Registered at every creation site because there is no
     single funnel for creating a contract. */
  if(window.roomOpenOnTerms) roomOpenOnTerms(c.id);
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
    /* The arrow says where the answer is filed, and stands down when that is
       the same word as the label — see the note in js/wizard.js. */
    const _map=f.maps?String(tplMapLabel(f.maps)||''):'';
    const _mapNote=(_map && _map.trim().toLowerCase()!==String(f.label||'').trim().toLowerCase())
      ? `<span style="font-weight:400;color:var(--color-neutral-500)"> → ${_tplEsc(_map)}</span>` : '';
    const lbl=`<span style="display:block;font-size:12px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px">${_tplEsc(f.label)}${f.required?' <span style="color:var(--st-ruby-fg)">*</span>':''}${_mapNote}</span>`;
    const st='width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 11px;font:inherit;font-size:14px;outline:none';
    if(f.type==='select') return `<label style="display:block">${lbl}<select id="${id}" style="${st}">${(f.opts||[]).map(o=>`<option value="${_tplEsc(o).replace(/"/g,'&quot;')}" ${f.def===o?'selected':''}>${_tplEsc(o)}</option>`).join('')}</select></label>`;
    const it=f.type==='date'?'date':(f.type==='num'?'number':'text');
    return `<label style="display:block">${lbl}<input id="${id}" type="${it}" value="${String(f.def||'').replace(/"/g,'&quot;')}" placeholder="${_tplEsc(f.ph||'')}" style="${st}"/></label>`; };
  openModal(`<div style="padding:20px 22px">
    <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0 0 3px">${_tplEsc(t.name)}</h3>
    <p style="font-size:13px;color:var(--color-neutral-600);margin:0 0 14px;line-height:1.55">Fill in the blanks. Everything you type is filed as contract data as well as printed into the document — the register, filters, folder routing and reports pick it up with no second data-entry step.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      ${''/* OUR SIDE, ASKED HERE TOO. A customer's own template may carry a
             blank of its own mapped to `party`, in which case that one wins —
             this answer is set on the record first and applyTemplateValues
             runs after it. Where the template has no such blank, this is the
             only place the entity can be named, and without it every contract
             made from a saved template goes on naming the workspace. */}
      <label style="display:block">
        <span style="display:block;font-size:12px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px">${i18t('tf_our_party')}<span style="font-weight:400;color:var(--color-neutral-500)"> → ${_tplEsc(i18t('tf_our_party_hint'))}</span></span>
        <input id="tf-party" type="text" value="${_tplEsc((typeof FIRST_PARTY!=='undefined'&&FIRST_PARTY)||'').replace(/"/g,'&quot;')}" placeholder="${_tplEsc(i18t('tf_our_party_ph'))}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 11px;font:inherit;font-size:14px;outline:none"/></label>
      ${fs.map(inp).join('')}
      ${''/* THE SAME QUESTION THE BUILT-IN TEMPLATES ASK, because this is the
             same act. Saved templates create contracts through their own fill
             form, so adding the address to the guided wizard alone left every
             contract made from "Counterparty Templates" back where it started: asked in
             the negotiation room, and again by the share dialog. */}
      <label style="display:block">
        <span style="display:block;font-size:12px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px">${i18t('lib_their_email')}<span style="font-weight:400;color:var(--color-neutral-500)"> ${i18t('lib_so_you_can_send')}</span></span>
        <input id="tf-cpemail" type="email" placeholder="${(typeof jxEg==='function'&&jxEg('theirEmail'))||'them@company.co.ke'}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 11px;font:inherit;font-size:14px;outline:none"/></label>
    </div>
    <div id="tf-err" style="font-size:12px;color:var(--st-ruby-fg);min-height:15px;margin-top:8px"></div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
      <button id="tf-cancel" class="ui-btn">${i18t('act_cancel')}</button>
      <span style="flex:1"></span>
      <button id="tf-skip" class="ui-btn" title="${esc(i18t('lib_create_now_fill_later'))}">${i18t('lib_skip_for_now')}</button>
      <button id="tf-create" class="ui-btn ui-btn-primary">${i18t('lib_create_draft')}</button>
    </div></div>`, {maxWidth:'620px'});
  document.getElementById('tf-cancel').addEventListener('click',closeModal);
  /* Same contract, blanks left blank — an unfilled placeholder is a designed
     state in the document, not a broken one. */
  document.getElementById('tf-skip').addEventListener('click',()=>{ closeModal(); buildFromCustomTemplate(t, {}); });
  document.getElementById('tf-create').addEventListener('click',()=>{
    const values={}, errs=[];
    for(const f of fs){ const el=document.getElementById('tf-'+f.key); const raw=el?el.value.trim():'';
      const e=validateField(f, raw); if(e) errs.push(e); else values[f.key]=raw; }
    const cpEmail=(document.getElementById('tf-cpemail')||{}).value||'';
    if(cpEmail.trim() && !/.+@.+\..+/.test(cpEmail.trim()))
      errs.push(`"${cpEmail.trim()}" is not an email address — leave it blank if you do not have it yet.`);
    if(errs.length){ document.getElementById('tf-err').textContent=errs[0]; return; }
    const party=((document.getElementById('tf-party')||{}).value||'').trim();
    closeModal(); buildFromCustomTemplate(t, values, { counterpartyEmail:cpEmail.trim(), party });
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
  if(!tplCanManage()){ toast(i18t('lib_viewers_no_save'),'err'); return; }
  const text=docPlainText(c);
  if(!text||text.length<40){ toast(i18t('lb_no_reusable_text'),'err'); return; }
  // a formatted contract is saved as a formatted template — reusing your own
  // paper should not strip the headings and clause numbering off it
  const rich=!!(window.isRich && isRich(c.format) && c.redlineText);
  const saveBody=rich?sanitizeRich(c.redlineText):text;
  const defName=c.name.replace(/\s*\(Draft\)\s*$/,'').replace(/\s*—.*$/,'').trim()||c.name;
  const opts=folderOptionsHtml(c.folder, false);
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="color:var(--color-accent)">${icon('copy','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">${i18t('lib_save_as_template')}</h3></div>
      <p style="font-size:13px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.5">Saves this document's current text (${text.length.toLocaleString()} characters${rich?', with its formatting':''}) as a reusable template. It will appear under <b>${i18t('lib_cp_templates')}</b> ${i18t('lib_and_in_new_menu')}</p>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">${i18t('lib_template_name')}</span>
        <input id="tpl-name" value="${defName.replace(/"/g,'&quot;')}" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);padding:7px 10px;font:inherit;font-size:14px;outline:none"/></label>
      <label style="display:block;margin-bottom:14px"><span style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">${i18t('lib_value_stream')}</span>
        <select id="tpl-folder" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 8px;font:inherit;font-size:14px">${opts}</select></label>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button id="tpl-cancel" class="ui-btn">${i18t('act_cancel')}</button>
        <button id="tpl-save" class="ui-btn ui-btn-primary">${i18t('lib_save_template')}</button>
      </div>
    </div>`);
  document.getElementById('tpl-cancel').addEventListener('click',closeModal);
  bindFolderSelect(document.getElementById('tpl-folder'));
  document.getElementById('tpl-save').addEventListener('click',()=>{
    const name=document.getElementById('tpl-name').value.trim();
    if(!name){ toast(i18t('lb_give_template_name'),'err'); return; }
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
  if(!tplCanManage()){ toast(i18t('lb_viewers_no_add'),'err'); return; }
  const opts=folderOptionsHtml(null, false);
  let tab=(mode==='upload')?'upload':'paste';
  let pasted=null;          // { html, format, via, plain }
  let report=null;          // pasteConversionReport(...)
  let editor=null;

  const FLD='width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);padding:7px 10px;font:inherit;font-size:14px;outline:none';
  const tabBtn=(k,label,sub)=>`<button data-ct-tab="${k}" style="flex:1;text-align:left;padding:9px 12px;font:inherit;cursor:pointer;border:1px solid ${tab===k?'var(--color-accent)':'var(--color-divider)'};background:${tab===k?'var(--color-accent-100)':'var(--color-surface)'};border-radius:var(--radius)">
      <span style="display:block;font-size:14px;font-weight:600;color:${tab===k?'var(--color-accent-800)':'var(--color-neutral-800)'}">${label}</span>
      <span style="display:block;font-size:12px;color:var(--color-neutral-600);margin-top:1px">${sub}</span></button>`;

  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="color:var(--color-accent)">${icon('copy','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">${i18t('lib_create_template')}</h3></div>
      <p style="font-size:13px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.5">${i18t('lib_bring_standard_paper')}</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px" id="ct-tabs">
        ${tabBtn('paste','Paste the document','From Word or Google Docs — keeps the formatting')}
        ${tabBtn('upload','Upload a file','A PDF or text file you already have')}
      </div>

      <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:10px;margin-bottom:12px">
        <label style="display:block"><span style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">${i18t('lib_template_name')}</span>
          <input id="ct-name" placeholder="e.g. Standard Distribution Agreement" style="${FLD}"/></label>
        <label style="display:block"><span style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">${i18t('lib_value_stream')}</span>
          <select id="ct-folder" style="${FLD};background:var(--color-surface)">${opts}</select></label>
      </div>

      <!-- Both panes share one grid cell, so the modal is as tall as the
           taller pane whichever tab is showing — switching tabs must never
           resize the panel, because a centred modal that resizes also moves. -->
      <div id="ct-panes" style="display:grid">
      <div id="ct-pane-paste" style="grid-area:1/1">
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">
          <span style="font-size:12px;font-weight:600">${i18t('lib_paste_contract_here')}</span>
          <span style="flex:1"></span>
          <button id="ct-preview" class="ui-btn" style="font-size:12px;padding:3px 9px">${i18t('lib_preview')}</button>
          <button id="ct-clear" class="ui-btn" style="font-size:12px;padding:3px 9px">Clear</button>
        </div>
        <div id="ct-editor" class="scroll-thin doc-surface" style="height:270px;font-size:14px"
             data-placeholder="${i18t('lb_open_in_word')}"></div>
        <div id="ct-previewpane" class="scroll-thin doc-surface" style="display:none;height:270px;overflow-y:auto;border:1px solid var(--color-accent-300);background:var(--color-bg);border-radius:0;padding:14px 18px"></div>
        <p style="font-size:12px;color:var(--color-neutral-600);margin:6px 0 0;line-height:1.5">${RICH_EDITOR_NOTE}</p>
        <div id="ct-report" style="font-size:12px;margin-top:7px;min-height:16px;line-height:1.5"></div>
      </div>

      <div id="ct-pane-upload" style="grid-area:1/1;visibility:hidden;pointer-events:none">
        <p style="font-size:13px;color:var(--color-neutral-600);margin:0 0 8px;line-height:1.5">${i18t('lib_pdf_or_text')} <b>${i18t('lib_rebuilds_structure')}</b> — headings, bold, italics, numbered clauses and indentation — from the type sizes and positions the PDF states. That recovers most of a document but not all of it: <b>${i18t('lib_pasting_more_faithful')}</b>${i18t('lib_because_clipboard')}</p>
        <label style="display:block;margin-bottom:6px"><span style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">${i18t('lib_document_file')}</span>
          <input id="ct-file" type="file" accept=".pdf,.docx,.txt,.md,text/plain,application/pdf" style="${FLD};font-size:13px"/></label>
      </div>
      </div>

      <div id="ct-status" style="font-size:12px;color:var(--color-neutral-600);min-height:16px;margin:10px 0"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button id="ct-cancel" class="ui-btn">${i18t('act_cancel')}</button>
        <button id="ct-save" class="ui-btn ui-btn-primary">${i18t('lib_save_template')}</button>
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
    /* visibility, not display: the hidden pane keeps its place in the shared
       grid cell, so the modal's height — and therefore its centred position —
       is identical on both tabs. */
    const pp=document.getElementById('ct-pane-paste'), pu=document.getElementById('ct-pane-upload');
    pp.style.visibility = tab==='paste'?'':'hidden';  pp.style.pointerEvents = tab==='paste'?'':'none';
    pu.style.visibility = tab==='upload'?'':'hidden'; pu.style.pointerEvents = tab==='upload'?'':'none';
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
      const kept=[ heads?i18tn('lib_kept_headings',heads,{n:heads}):'',
                   lists?i18tn('lib_kept_lists',lists,{n:lists}):'',
                   tables?i18tn('lib_kept_tables',tables,{n:tables}):'' ].filter(Boolean).join(' · ');
      if(report.ok){
        /* ONE SENTENCE WITH NAMED HOLES. It used to be six fragments glued
           together — half translated, half not — which is a shape no
           translator can put right, because word order is not the same in
           both languages. */
        rep(`<span style="color:var(--color-neutral-700)">${i18t('lib_paste_report',{
          n: t.length.toLocaleString(),
          kept: kept?i18t('lib_paste_kept',{what:kept}):'',
          via: res.via==='text'?i18t('lib_paste_via_text'):'',
          preview: i18t('lib_preview') })}</span>`);
      } else {
        rep(`<span style="display:block;border:1px solid var(--st-ruby-line);background:rgba(176,69,60,.06);border-radius:var(--radius);padding:8px 10px;color:var(--st-ruby-fg)">
          <b>${i18t('lib_did_not_come_across')}</b> ${_tplEsc(report.reason)}
          Paste it again, or <button type="button" id="ct-fallback" style="border:0;background:none;padding:0;font:inherit;font-weight:600;color:var(--st-ruby-fg);text-decoration:underline;cursor:pointer">${i18t('lib_use_plain_text')}</button> ${i18t('lib_lose_formatting')}</span>`);
        document.getElementById('ct-fallback')?.addEventListener('click',()=>{
          editor.set(textToRich(res.plain||''));
          pasted={ ...res, via:'text' };
          report={ ok:true, reason:'' };
          rep(`<span style="color:var(--color-neutral-700)">${i18t('lib_using_plain_text')}</span>`);
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
    if(!richToText(html).trim()){ st(`<span style="color:var(--st-ruby-fg)">${i18t('lib_nothing_to_preview')}</span>`); return; }
    pv.innerHTML=renderDocHtml(html, RICH_FORMAT);
    previewing=true; pv.style.display=''; host.style.display='none'; pvBtn.textContent='Back to editing'; st('');
  });

  /* ---- save ---- */
  document.getElementById('ct-save').addEventListener('click',async()=>{
    const name=document.getElementById('ct-name').value.trim();
    const folder=document.getElementById('ct-folder').value;
    if(!name){ toast(i18t('lb_give_template_name'),'err'); return; }

    if(tab==='paste'){
      const html=editor.get();
      const text=richToText(html);
      if(!text.trim()){ st(`<span style="color:var(--st-ruby-fg)">${i18t('lib_paste_first')}</span>`); return; }
      if(text.length<40){ st(`<span style="color:var(--st-ruby-fg)">${i18t('lib_too_short')}</span>`); return; }
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
    if(!file){ st(`<span style="color:var(--st-ruby-fg)">${i18t('lib_choose_file')}</span>`); return; }
    if(file.size>uploadMax()){ toast(uploadTooBigMsg(file),'err'); return; }
    st('Reading file…');
    try{
      const dataUrl=await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
      // Legacy .doc is refused on the bytes, not the extension — nothing is saved.
      const wordKind=detectWordFile(dataUrl, file.type||'', file.name);
      if(wordKind==='doc'){
        st(`<span style="color:var(--st-ruby-fg)">${_tplEsc(WORD_REFUSAL)} ${i18t('lib_open_in_word_paste')} ${i18t('lib_use_other_tab')}</span>`); return; }
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
        try{ await ocrRelease(); }catch(e){}   // one file, one document — see the upload path
      }
      if(!text||text.length<40){ st('<span style="color:var(--st-ruby-fg)">Could not extract readable text from this file — try a text-based PDF, re-scan it at a higher resolution, or paste the document instead.</span>'); return; }
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
    }catch(e){ st(`<span style="color:var(--st-ruby-fg)">${i18t('lib_extraction_failed',{err:_tplEsc(e.message)})}</span>`); }
  });

  paint();
}
/* Kept as the old name so nothing that calls it breaks; it now opens the
   Create-template modal on its file tab. */
const openUploadTemplateModal = () => openCreateTemplateModal('upload');

/* Import one of the bundled HaTi sample PDFs as a custom template. */
async function importHatiSample(i, btn){
  if(!tplCanManage()){ toast(i18t('lb_viewers_no_add'),'err'); return; }
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
    toast(`Sample “${s.name}” imported to Counterparty Templates`);
    renderTemplatesPage();
  }catch(e){ toast(i18t('lb_import_failed')+e.message,'err'); if(btn){ btn.disabled=false; btn.textContent='Import as template'; } }
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
  if(!tplCanManage()){ toast(i18t('lb_viewers_no_edit'),'err'); return; }
  const rec=customTemplates().find(x=>x.id===tid);
  if(!rec){ toast(i18t('lib_template_not_found'),'err'); return; }
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
    const st='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:4px 7px;font:inherit;font-size:13px;outline:none';
    const rows=fields.map((f,i)=>`
      <div data-fld="${i}" style="display:grid;grid-template-columns:1.3fr .9fr 1.2fr auto auto;gap:6px;align-items:center;padding:4px 0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent)">
        <input data-f="label" value="${String(f.label||'').replace(/"/g,'&quot;')}" placeholder="${i18t('lb_label')}" style="${st}"/>
        <select data-f="type" style="${st}">${TPL_FIELD_TYPES.map(x=>`<option value="${x.k}" ${f.type===x.k?'selected':''}>${x.label}</option>`).join('')}</select>
        <select data-f="maps" style="${st}">${TPL_MAPS.map(x=>`<option value="${x.k}" ${(f.maps||'')===x.k?'selected':''}>${x.label}</option>`).join('')}</select>
        <label style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--color-neutral-600);white-space:nowrap"><input data-f="required" type="checkbox" ${f.required?'checked':''} style="accent-color:var(--color-accent)"/>req</label>
        <button data-del="${i}" title="${i18t('lb_remove_blank')}" style="border:1px solid var(--st-ruby-line);background:none;color:var(--st-ruby-fg);border-radius:var(--radius);font:inherit;font-size:12px;padding:2px 7px;cursor:pointer">×</button>
        ${f.type==='select'?`<input data-f="opts" value="${String((f.opts||[]).join(', ')).replace(/"/g,'&quot;')}" placeholder="${i18t('lb_choices_comma')}" style="${st};grid-column:1 / -1"/>`:''}
        <div style="grid-column:1 / -1;font-size:12px;color:var(--color-neutral-500);font-family:var(--font-mono)">{{${f.key}}}${orphanFields.includes(f)?` <span style="color:var(--st-ruby-fg)">${i18t('lib_blank_unused')}</span>`:''}</div>
      </div>`).join('');
    const host=document.getElementById('be-fields');
    if(host){
      host.innerHTML=rows||`<div style="font-size:13px;color:var(--color-neutral-600);padding:6px 0">${i18t('lib_no_blanks_yet')} <b>${i18t('lib_make_this_blank')}</b>.</div>`;
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
      ? `<span style="color:var(--st-ruby-fg)">${orphanBlanks.length} placeholder${orphanBlanks.length===1?'':'s'} in the body (${orphanBlanks.map(k=>'{{'+k+'}}').join(', ')}) ${orphanBlanks.length===1?'has':'have'} no field — add or remove them before saving.</span>`
      : `<span style="color:var(--color-neutral-600)">${fields.length} blank${fields.length===1?'':'s'} · they become the contract's structured data when someone fills this template in.</span>`;
  };

  openModal(`<div style="padding:20px 22px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="color:var(--color-accent)">${icon('copy','w-4 h-4')}</span>
      <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Blanks in “${_tplEsc(rec.name)}”</h3></div>
    <p style="font-size:13px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.55">The blanks in a template are the database. Anything you mark here becomes a guided field when someone creates a contract, and its value is filed as contract data — so the register, filters, folder routing and reports get structured information with no separate data entry.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
      <button id="be-make" class="ui-btn ui-btn-primary" style="font-size:13px;padding:5px 11px">${i18t('lib_make_selection_blank')}</button>
      <button id="be-detect" class="ui-btn" style="font-size:13px;padding:5px 11px">${i18t('lib_detect_brackets')}</button>
      ${(API_MODE()&&state.aiConfigured)?`<button id="be-suggest" class="ui-btn" style="font-size:13px;padding:5px 11px">${icon('sparkle','w-3.5 h-3.5')} Suggest blanks</button>`:''}
    </div>
    <div id="be-fields" class="scroll-thin" style="max-height:190px;overflow-y:auto;border:1px solid var(--color-divider);border-radius:var(--radius);padding:6px 9px;margin-bottom:8px"></div>
    <div id="be-warn" style="font-size:12px;margin-bottom:8px;min-height:14px"></div>
    <label style="display:block;margin-bottom:12px"><span style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">Template body — select text, then “Make selection a blank”${rich?` <span style="font-weight:400;color:var(--color-neutral-500)">${i18t('lib_formatted_template')}</span>`:''}</span>
      ${rich
        ? `<div id="be-body" class="scroll-thin doc-surface" style="width:100%;height:210px;overflow-y:auto;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:0;padding:9px 13px"></div>`
        : `<textarea id="be-body" class="scroll-thin" style="width:100%;height:210px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);padding:9px 11px;font:inherit;font-size:13px;line-height:1.6;font-family:var(--font-mono);outline:none;resize:vertical"></textarea>`}</label>
    <div id="be-status" style="font-size:12px;color:var(--color-neutral-600);min-height:15px;margin-bottom:8px"></div>
    <div style="display:flex;justify-content:flex-end;gap:8px">
      <button id="be-cancel" class="ui-btn">${i18t('act_cancel')}</button>
      <button id="be-save" class="ui-btn ui-btn-primary">${i18t('lib_save_blanks')}</button>
    </div></div>`, {maxWidth:'760px',
    /* Escape and the scrim ask the SAME question Cancel does. Without this they
       walked straight past the guard below and took every unsaved blank with
       them. */
    onBeforeClose:async()=>!dirty || await confirmDialog({ title:'Discard these changes?',
      message:'The blanks you added, renamed or removed since opening this editor will be lost. The template itself is unchanged.',
      confirmLabel:'Discard changes', cancelLabel:'Keep editing', danger:true })});
  draw();

  const bodyEl=document.getElementById('be-body');
  if(!rich) bodyEl.addEventListener('input',()=>{ body=bodyEl.value; dirty=true; draw(); });
  const status=m=>{ const el=document.getElementById('be-status'); if(el) el.innerHTML=m||''; };

  // ---- 1. manual (the reliable path — no key, no network)
  document.getElementById('be-make').addEventListener('click',async()=>{
    const picked=rich?_richSelection(bodyEl):null;
    const sel=(rich ? (picked?picked.text:'') : bodyEl.value.slice(bodyEl.selectionStart,bodyEl.selectionEnd)).trim();
    if(!sel){ status(`<span style="color:var(--st-ruby-fg)">${i18t('lib_select_text_first')}</span>`); return; }
    if(sel.length>200){ status(`<span style="color:var(--st-ruby-fg)">${i18t('lib_selection_too_long')}</span>`); return; }
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
      if(next==null){ status(`<span style="color:var(--st-ruby-fg)">${i18t('lib_selection_spans')}</span>`); return; }
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
      status(`<b>${added}</b> suggestion${added===1?'':'s'} added${missed?`, ${missed} skipped (the text no longer matched)`:''}. <b>${i18t('lib_review_and_edit')}</b> — nothing is saved until you press Save blanks.${r.note?`<br><span style="color:var(--color-neutral-500)">${_tplEsc(r.note)}</span>`:''}`);
    }catch(err){ status(`<span style="color:var(--st-ruby-fg)">${_tplEsc(err.message)}</span>`); }
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
    if(orphan.length){ status(`<span style="color:var(--st-ruby-fg)">${i18t('lib_orphan_placeholders',{keys:orphan.map(k=>'{{'+k+'}}').join(', ')})}</span>`); return; }
    const bad=fields.find(f=>!String(f.label||'').trim());
    if(bad){ status(`<span style="color:var(--st-ruby-fg)">${i18t('lib_every_blank_label')}</span>`); return; }
    const badSel=fields.find(f=>f.type==='select'&&!(f.opts||[]).length);
    if(badSel){ status(`<span style="color:var(--st-ruby-fg)">${i18t('lib_choice_no_choices',{label:_tplEsc(badSel.label)})}</span>`); return; }
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
  if(!tplCanManage()){ toast(i18t('lb_viewers_no_edit'),'err'); return; }
  const rec=customTemplates().find(x=>x.id===tid);
  if(!rec){ toast(i18t('lib_template_not_found'),'err'); return; }

  // work on a copy — nothing is written until Save
  let name=rec.name, folder=rec.folder;
  let body=templateBody(rec);
  let format=templateFormat(rec);
  let fields=(rec.fields||[]).map(f=>({...f}));
  let editor=null, dirty=false, previewing=false;
  const usage=templateUsage(tid);
  const startedRich=isRich(format);
  const bodyText=()=> isRich(format) ? richToText(body) : body;

  const FLD='width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);padding:7px 10px;font:inherit;font-size:14px;outline:none';
  openModal(`<div style="padding:20px 22px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
      <span style="color:var(--color-accent)">${icon('pencil','w-4 h-4')}</span>
      <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">${i18t('lib_edit_template')}</h3>
      <span style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--color-accent-700);border:1px solid var(--color-accent-300);background:var(--color-accent-100);border-radius:var(--radius);padding:1px 6px">v${templateVersionNo(rec)}</span>
      <span style="flex:1"></span>
      <button id="te-versions" class="ui-btn" style="font-size:12px;padding:3px 9px;white-space:nowrap">${icon('history','w-3.5 h-3.5')} Versions (${templateVersions(rec).length+1})</button>
    </div>
    <p style="font-size:13px;color:var(--color-neutral-600);margin:0 0 4px;line-height:1.5">
      ${_tplEsc(templateUsageLabel(usage))} · saving creates <b>v${templateVersionNo(rec)+1}</b>.</p>
    <div style="display:flex;gap:7px;align-items:flex-start;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);padding:7px 10px;margin:0 0 12px;font-size:12px;line-height:1.5;color:var(--color-neutral-700)">
      <span style="flex:none;margin-top:1px;color:var(--color-accent)">${icon('shield','w-3.5 h-3.5')}</span>
      <span><b>${i18t('lib_existing_unaffected')}</b> A contract copies the wording when it is created; it does not follow the template afterwards. Changes here apply to the next draft you generate.</span>
    </div>

    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:10px;margin-bottom:12px">
      <label style="display:block"><span style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">${i18t('lib_template_name')}</span>
        <input id="te-name" value="${String(name).replace(/"/g,'&quot;')}" style="${FLD}"/></label>
      <label style="display:block"><span style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">${i18t('lib_value_stream')}</span>
        <select id="te-folder" style="${FLD};background:var(--color-surface)">${folderOptionsHtml(folder,false)}</select></label>
    </div>

    <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">
      <span style="font-size:12px;font-weight:600">${i18t('lib_document')}</span>
      <span style="font-size:12px;color:var(--color-neutral-600)">${startedRich?'formatted — paste over it to replace, or edit in place':'plain text — paste formatted paper here to upgrade it'}</span>
      <span style="flex:1"></span>
      <button id="te-blank" class="ui-btn" style="font-size:12px;padding:3px 9px">${i18t('lib_make_selection_blank')}</button>
      <button id="te-preview" class="ui-btn" style="font-size:12px;padding:3px 9px">${i18t('lib_preview')}</button>
    </div>
    <div id="te-body" class="scroll-thin doc-surface" style="height:230px;font-size:14px"
         data-placeholder="${i18t('lb_paste_or_type')}"></div>
    <div id="te-previewpane" class="scroll-thin doc-surface" style="display:none;height:230px;overflow-y:auto;border:1px solid var(--color-accent-300);background:var(--color-bg);border-radius:0;padding:14px 18px"></div>
    <p style="font-size:12px;color:var(--color-neutral-600);margin:6px 0 0;line-height:1.5">${RICH_EDITOR_NOTE}</p>

    <div style="display:flex;align-items:baseline;gap:8px;margin:12px 0 4px">
      <span style="font-size:12px;font-weight:600">${i18t('lib_blanks')}</span>
      <span style="font-size:12px;color:var(--color-neutral-600)">${i18t('lib_blanks_become_fields')}</span>
    </div>
    <div id="te-fields" class="scroll-thin" style="max-height:150px;overflow-y:auto;border:1px solid var(--color-divider);border-radius:var(--radius);padding:6px 9px"></div>
    <div id="te-warn" style="font-size:12px;margin:7px 0;min-height:15px;line-height:1.5"></div>

    <label style="display:block;margin-bottom:12px"><span style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">${i18t('lib_what_changed')} <span style="font-weight:400;color:var(--color-neutral-500)">(recorded against v${templateVersionNo(rec)+1})</span></span>
      <input id="te-note" placeholder="${esc(i18t('lib_ph_version_note'))}" style="${FLD}"/></label>

    <div id="te-status" style="font-size:12px;min-height:16px;margin-bottom:8px"></div>
    <div style="display:flex;justify-content:space-between;gap:8px">
      <button id="te-delete" class="ui-btn" style="border-color:var(--st-ruby-line);color:var(--st-ruby-fg)">${i18t('lib_delete_template')}</button>
      <span style="display:flex;gap:8px">
        <button id="te-cancel" class="ui-btn">${i18t('act_cancel')}</button>
        <button id="te-save" class="ui-btn ui-btn-primary" style="white-space:nowrap">${icon('check2','w-3.5 h-3.5')} Save as v${templateVersionNo(rec)+1}</button>
      </span>
    </div></div>`, {maxWidth:'880px',
    /* Same as the blanks editor above: the quiet ways out ask the same question
       the Cancel button asks, or ten minutes of editing goes without a word. */
    onBeforeClose:async()=>!dirty || await confirmDialog({ title:'Discard these changes?',
      message:'The edits you have made since opening this editor will be lost.',
      confirmLabel:'Discard changes', cancelLabel:'Keep editing', danger:true })});

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
        ? `<span style="color:var(--color-neutral-700)">Pasted ${richToText(body).length.toLocaleString()} characters.${res.via==='text'?' The source offered no formatting, so this came in as plain text.':''} <b>${i18t('lib_preview')}</b> before saving.</span>`
        : `<span style="color:var(--st-ruby-fg)"><b>${i18t('lib_did_not_come_across')}</b> ${_tplEsc(r.reason)} ${i18t('lib_undo_and_paste')}</span>`);
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
    const stl='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:4px 7px;font:inherit;font-size:13px;outline:none';
    const host2=document.getElementById('te-fields'); if(!host2) return;
    host2.innerHTML=fields.length?fields.map((f,i)=>`
      <div data-fld="${i}" style="display:grid;grid-template-columns:1.3fr .9fr 1.2fr auto auto;gap:6px;align-items:center;padding:4px 0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent)">
        <input data-f="label" value="${String(f.label||'').replace(/"/g,'&quot;')}" placeholder="${i18t('lb_label')}" style="${stl}"/>
        <select data-f="type" style="${stl}">${TPL_FIELD_TYPES.map(x=>`<option value="${x.k}" ${f.type===x.k?'selected':''}>${x.label}</option>`).join('')}</select>
        <select data-f="maps" style="${stl}">${TPL_MAPS.map(x=>`<option value="${x.k}" ${(f.maps||'')===x.k?'selected':''}>${x.label}</option>`).join('')}</select>
        <label style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--color-neutral-600);white-space:nowrap"><input data-f="required" type="checkbox" ${f.required?'checked':''} style="accent-color:var(--color-accent)"/>req</label>
        <button data-del="${i}" title="${i18t('lb_remove_blank')}" style="border:1px solid var(--st-ruby-line);background:none;color:var(--st-ruby-fg);border-radius:var(--radius);font:inherit;font-size:12px;padding:2px 7px;cursor:pointer">×</button>
        ${f.type==='select'?`<input data-f="opts" value="${String((f.opts||[]).join(', ')).replace(/"/g,'&quot;')}" placeholder="${i18t('lb_choices_comma')}" style="${stl};grid-column:1 / -1"/>`:''}
        <div style="grid-column:1 / -1;font-size:12px;color:var(--color-neutral-500);font-family:var(--font-mono)">{{${f.key}}}${orphanFields.includes(f)?` <span style="color:var(--st-ruby-fg)">${i18t('lib_not_used_above')}</span>`:''}</div>
      </div>`).join('')
      :`<div style="font-size:13px;color:var(--color-neutral-600);padding:6px 0">${i18t('lib_no_blanks_press')} <b>${i18t('lib_make_selection_blank')}</b>.</div>`;
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
      if(orphanBlanks.length) bits.push(`<span style="display:block;color:var(--st-ruby-fg)"><b>${orphanBlanks.length} placeholder${orphanBlanks.length===1?'':'s'}</b> in the document with no matching blank: ${orphanBlanks.map(k=>`{{${k}}} — ${act('mk',k,'create the blank')} or ${act('rm',k,'remove it from the document')}`).join('; ')}. Saving is blocked until this is resolved: an unmatched placeholder prints as literal braces in every contract.</span>`);
      if(orphanFields.length) bits.push(`<span style="display:block;color:var(--st-amber-fg);margin-top:3px"><b>${orphanFields.length} blank${orphanFields.length===1?'':'s'}</b> no longer used in the document: ${orphanFields.map(f=>`${_tplEsc(f.label||f.key)} — ${act('del',f.key,'remove the blank')} or ${act('ins',f.key,'put {{'+f.key+'}} back at the end')}`).join('; ')}. Left as-is ${orphanFields.length===1?'it':'they'} will still be asked for, and the answer will go nowhere.</span>`);
      warn.innerHTML = bits.length?bits.join('')
        : `<span style="color:var(--color-neutral-600)">${i18tn('lib_blanks_present',fields.length,{n:fields.length})}</span>`;
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
    if(!sel){ st(`<span style="color:var(--st-ruby-fg)">${i18t('lib_select_value_first')}</span>`); return; }
    if(sel.length>200){ st(`<span style="color:var(--st-ruby-fg)">${i18t('lib_selection_too_long')}</span>`); return; }
    const label=await promptDialog({
      title:'Name this blank',
      message:`“${sel.length<=60?sel:sel.slice(0,60)+'…'}” becomes a fill-in field. The name is what the person using this template sees when they are asked for it.`,
      label:'Blank name', placeholder:'e.g. Distributor name',
      value: sel.length<=40?sel:'', confirmLabel:'Add blank' });
    if(label==null) return;
    const lbl=String(label).trim()||sel.slice(0,40);
    const key=tplKeyFrom(lbl, fields);
    const next=_richReplaceRange(host, picked, '{{'+key+'}}');
    if(next==null){ st(`<span style="color:var(--st-ruby-fg)">${i18t('lib_selection_spans')}</span>`); return; }
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
    if(!nm){ st(`<span style="color:var(--st-ruby-fg)">${i18t('lib_needs_name')}</span>`); return; }
    if(previewing) pvBtn.click();
    if(isRich(format)) body=unmarkPlaceholders(editor.get());
    const text=bodyText();
    if(!text.trim()){ st(`<span style="color:var(--st-ruby-fg)">${i18t('lib_doc_not_empty')}</span>`); return; }

    // the blank/body sync warnings are BLOCKING in one direction and advisory in
    // the other: a placeholder with no field would render as literal braces in
    // a real contract, which is a broken document; a field with no placeholder
    // just asks a pointless question, which the user may well intend mid-edit.
    const used=usedIn();
    const orphanBlanks=used.filter(k=>!fields.some(f=>f.key===k));
    if(orphanBlanks.length){ st(`<span style="color:var(--st-ruby-fg)">The document uses ${orphanBlanks.map(k=>'{{'+k+'}}').join(', ')} with no matching blank. Add the blank or remove the placeholder — otherwise it prints as literal braces in every contract made from this template.</span>`); return; }
    const orphanFields=fields.filter(f=>!used.includes(f.key));
    if(orphanFields.length && !await confirmDialog({
      title:`Save with ${orphanFields.length} unused blank${orphanFields.length===1?'':'s'}?`,
      message:`${orphanFields.map(f=>f.label||f.key).join(', ')} ${orphanFields.length===1?'is':'are'} no longer used anywhere in the document. `+
        `${orphanFields.length===1?'It':'They'} will still be asked for when someone uses this template, and the answer will not appear in the contract.`,
      confirmLabel:'Save anyway', cancelLabel:'Go back and fix it' })) return;
    const bad=fields.find(f=>!String(f.label||'').trim());
    if(bad){ st(`<span style="color:var(--st-ruby-fg)">${i18t('lib_every_blank_label')}</span>`); return; }
    const badSel=fields.find(f=>f.type==='select'&&!(f.opts||[]).length);
    if(badSel){ st(`<span style="color:var(--st-ruby-fg)">${i18t('lib_choice_no_choices',{label:_tplEsc(badSel.label)})}</span>`); return; }

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
  if(!rec){ toast(i18t('lib_template_not_found'),'err'); return; }
  const prior=templateVersions(rec);
  const current={ n:templateVersionNo(rec), at:rec.versionAt||rec.at, by:rec.versionBy||rec.by,
    note:rec.versionNote||'Original', name:rec.name, folder:rec.folder,
    body:templateBody(rec), format:templateFormat(rec), fields:rec.fields||[] };
  const all=prior.concat([current]).slice().reverse();
  const canManage=tplCanManage();

  openModal(`<div style="padding:20px 22px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
      <span style="color:var(--color-accent)">${icon('history','w-4 h-4')}</span>
      <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">${i18t('lib_versions_of',{name:_tplEsc(rec.name)})}</h3>
    </div>
    <p style="font-size:13px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.5">${i18t('lib_every_save_kept')} <b>new</b> ${i18t('lib_history_intact')} <b>${i18t('lib_no_contract_changes')}</b>${i18t('lib_copies_wording')}</p>
    <div class="scroll-thin" style="max-height:52vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px">
      ${all.map(v=>`
        <div style="display:flex;align-items:center;gap:9px;border:1px solid ${v.n===current.n?'var(--color-accent-300)':'var(--color-divider)'};background:${v.n===current.n?'var(--color-accent-100)':'var(--color-surface)'};border-radius:var(--radius);padding:8px 11px">
          <span style="font-family:var(--font-mono);font-weight:600;font-size:13px;color:var(--color-accent-700);flex:none">v${v.n}</span>
          <span style="min-width:0;flex:1">
            <span style="display:block;font-size:13px;color:var(--color-neutral-800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_tplEsc(v.note||'Saved')}${v.name!==rec.name?` <span style="color:var(--color-neutral-500)">· named “${_tplEsc(v.name)}”</span>`:''}</span>
            <span style="display:block;font-size:12px;color:var(--color-neutral-500);font-family:var(--font-mono)">${v.by?_tplEsc(v.by)+' · ':''}${v.at?fmtDT(v.at):''} · ${(v.fields||[]).length} blank${(v.fields||[]).length===1?'':'s'} · ${(v.format==='rich'?'formatted':'plain text')}</span>
          </span>
          ${v.n===current.n?`<span class="badge" style="flex:none;background:var(--color-accent-200);color:var(--color-accent-800)">current</span>`
            :`<button data-tv-view="${v.n}" class="ui-btn" style="flex:none;font-size:12px;padding:3px 9px">${i18t('lib_view')}</button>
              ${canManage?`<button data-tv-revert="${v.n}" class="ui-btn" style="flex:none;font-size:12px;padding:3px 9px">${i18t('lib_revert_to_this')}</button>`:''}`}
        </div>`).join('')}
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
      ${canManage?`<button id="tv-edit" class="ui-btn">${i18t('lib_back_to_editing')}</button>`:''}
      <button id="tv-close" class="ui-btn ui-btn-primary">${i18t('act_close')}</button>
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
  if(!tplCanManage()){ toast(i18t('lb_viewers_no_delete'),'err'); return; }
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
  if(!tplCanManage()){ toast(i18t('lb_viewers_no_add'),'err'); return; }
  const t=TEMPLATES[bid]; if(!t){ toast(i18t('lib_template_not_found'),'err'); return; }
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
  if(!text || text.length<40){ toast(i18t('lb_could_not_convert'),'err'); return; }
  // keep only the blanks the rendered document actually uses
  const used=bodyPlaceholders(body);
  const keep=fields.filter(f=>used.includes(f.key));
  const rec=saveTemplateRecord(`${t.name} (copy)`, t.folder, body, 'builtin:'+bid,
    { format:RICH_FORMAT, fields:keep, body, chars:text.length,
      version:1, versionAt:nowISO(), versionBy:u?.name||'—',
      versionNote:`Duplicated from the HaTi built-in “${t.name}”`, versions:[] });
  toast(`Copied “${t.name}” into Counterparty Templates — edit it freely, the built-in is unchanged`);
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
  if(!canEdit()){ toast(i18t('lib_viewers_no_create'),'err'); return; }
  const fs=templateFields(t);
  if(!fs.length){ toast(i18t('lb_no_blanks_add_first'),'err'); return; }
  openModal(`<div style="padding:20px 22px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="color:var(--color-accent)">${icon('list','w-4 h-4')}</span>
      <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Create in bulk — ${_tplEsc(t.name||t.kind)}</h3></div>
    <p style="font-size:13px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.55">For high-volume, low-variation paper — distributor agreements, employment letters. Download the sheet, fill one row per contract, upload it back. <b>${i18t('lib_every_row_checked')}</b>${i18t('lib_bad_cell_note')} Up to ${TPL_BULK_MAX} rows.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <button id="bk-csv" class="ui-btn" style="font-size:13px;padding:5px 11px">${icon('download','w-3.5 h-3.5')} ${i18tn('lib_download_csv',fs.length,{n:fs.length})}</button>
      <label class="ui-btn" style="font-size:13px;padding:5px 11px;cursor:pointer">${icon('upload','w-3.5 h-3.5')} Upload the filled sheet
        <input id="bk-file" type="file" accept=".csv" style="display:none"/></label>
    </div>
    <div id="bk-out" style="font-size:13px;color:var(--color-neutral-700);min-height:20px"></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
      <button id="bk-cancel" class="ui-btn">${i18t('act_close')}</button>
      <button id="bk-go" class="ui-btn ui-btn-primary" disabled style="opacity:.5">${i18t('lib_create_drafts')}</button>
    </div></div>`, {maxWidth:'700px'});

  let ready=null;
  const out=document.getElementById('bk-out');
  const go=document.getElementById('bk-go');
  document.getElementById('bk-cancel').addEventListener('click',closeModal);
  document.getElementById('bk-csv').addEventListener('click',()=>{
    downloadFile(`hati-bulk-${String(t.name||t.kind||'template').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)}.csv`, bulkTemplateCsv(t), 'text/csv');
    toast(i18t('lb_sheet_downloaded'));
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
        out.innerHTML=`<div style="border:1px solid var(--st-ruby-line);background:var(--st-ruby-bg);border-radius:var(--radius);padding:9px 11px">
          <div style="font-weight:600;color:var(--st-ruby-fg);margin-bottom:5px">${r.errors.length} problem${r.errors.length===1?'':'s'} found — <b>${i18t('lib_nothing_created')}</b>.</div>
          <div class="scroll-thin" style="max-height:200px;overflow-y:auto">
          ${Object.keys(byRow).sort((a,b)=>a-b).map(rn=>`<div style="padding:2px 0;color:var(--st-ruby-fg)">
            ${rn==='0'?`<b>${i18t('lib_sheet')}</b>`:`<b>Row ${rn}</b>`} — ${byRow[rn].map(er=>`${er.cell?`<i>${_tplEsc(er.cell)}</i>: `:''}${_tplEsc(er.msg)}`).join('; ')}</div>`).join('')}
          </div>
          <div style="margin-top:6px;color:var(--color-neutral-700)">${i18t('lib_fix_and_reupload')}</div></div>`;
        return;
      }
      ready=r.rows;
      out.innerHTML=`<div style="border:1px solid var(--color-divider);background:var(--color-accent-100);border-radius:var(--radius);padding:9px 11px;color:var(--color-accent-800)">
        <b>${r.rows.length} row${r.rows.length===1?'':'s'} checked, every cell valid.</b> ${i18t('lib_press')} <b>${i18t('lib_create_drafts')}</b> to file them all in one pass.
        <div style="margin-top:5px;color:var(--color-neutral-700);font-size:12px">First few: ${r.rows.slice(0,3).map(x=>_tplEsc(x.name)).join(' · ')}${r.rows.length>3?` … and ${r.rows.length-3} more`:''}</div></div>`;
      go.disabled=false; go.style.opacity='1';
    }catch(err){ out.innerHTML=`<span style="color:var(--st-ruby-fg)">${i18t('lib_bad_csv',{err:_tplEsc(err.message)})}</span>`; }
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
    : `<div style="font-size:14px;line-height:1.65;white-space:pre-wrap">${_tplEsc(body)}</div>`;
}
function openTemplatePreview(tpl){
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:4px">
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">${_tplEsc(tpl.name)}</h3>
        <span style="font-size:12px;color:var(--color-neutral-600)">${FOLDERS[tpl.folder]?.name||''}</span>
      </div>
      <p style="font-size:12px;color:var(--color-neutral-600);margin:0 0 10px">${tpl.chars?tpl.chars.toLocaleString()+' characters · ':''}added ${tpl.at?fmtDT(tpl.at):''} by ${_tplEsc(tpl.by||'—')}${templateFields(tpl).length?` · <b>${templateFields(tpl).length} blank${templateFields(tpl).length===1?'':'s'}</b>`:' · no blanks yet'}</p>
      ${templateFields(tpl).length?`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">${templateFields(tpl).map(f=>`<span style="font-size:12px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);padding:2px 7px;color:var(--color-neutral-700)"><b style="font-family:var(--font-mono)">${_tplEsc(f.key)}</b> ${_tplEsc(f.label)}${f.maps?` <span style="color:var(--color-accent-700)">→ ${_tplEsc(tplMapLabel(f.maps))}</span>`:''}</span>`).join('')}</div>`:''}
      <div class="scroll-thin doc-surface" style="border:1px solid var(--color-divider);border-radius:0;background:var(--color-bg);padding:14px 16px;max-height:55vh;overflow-y:auto">${_tplPreviewHtml(tpl)}</div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
        ${canEdit()?`<button id="tp-blanks" class="ui-btn">${templateFields(tpl).length?'Edit blanks':'Add blanks'}</button>`:''}
        ${canEdit()?`<button id="tp-use" class="ui-btn ui-btn-primary">${i18t('lib_use_template')}</button>`:''}
        <button id="tp-close" class="ui-btn">${i18t('act_close')}</button>
      </div>
    </div>`, {maxWidth:'820px'});
  document.getElementById('tp-close').addEventListener('click',closeModal);
  document.getElementById('tp-use')?.addEventListener('click',()=>{ closeModal(); createFromCustomTemplate(tpl.id); });
  document.getElementById('tp-blanks')?.addEventListener('click',()=>{ closeModal(); openBlanksEditor(tpl.id); });
}

/* ============================================================ TEMPLATES PAGE */
/* ============================================================ THE LIBRARY PAGE
   (redesign to the approved comp): a quiet rail on the left — what KIND of
   paper and which value stream — and one dense table on the right that holds
   every template the workspace can draft from. The rail used to end with a
   door to Our standards; that page has its own nav item now.
   A table, not a card wall: past a dozen templates the facts a chooser needs
   (origin, version, how often it is used) read faster as columns, and the
   page stays the same height at 200 templates as at 12. Every verb the old
   card grid offered is still here — Use, Open, bulk creation, blanks,
   versions, delete — the rarer ones behind one … menu per row. */
let _tplPage={ group:'all', stream:null, q:'', showAll:false };
/* ONE NUMBER, BOTH TABS: how many templates either tab shows before it says
   how many more there are. Written twice, the overview would offer "see all
   12 more" over a list that had already shown eight of them. */
const TPL_PAGE_CAP=8;
/* The window the overview's "most used" bars measure, and the floor under a
   deviation rate. Three is PRECEDENT_MIN's own reasoning: a rate off one
   contract is not a rate, it is that contract. */
const TPL_RECENT_DAYS=90;
const TPL_DEV_MIN=3;
/* A value stream's own name runs long — "Corporate & Compliance", "Sales &
   Route-to-Market" — and both the rail and the overview's meta line print it
   inside a narrow column. The rail has shortened it this way since it was
   built; the card asks the same function rather than carrying a second copy,
   so the two can never disagree about what a stream is called. */
const tplShortStream=n=>String(n||'').split(' & ')[0].split(' — ')[0];
/* GETTERS: this table is read on every paint, and a plain object built once
   at module load would freeze whatever language the page started in. */
const TPL_GROUP_LABEL={ get all(){ return i18t('lib_grp_all'); }, get company(){ return i18t('lib_grp_company'); },
  get cp(){ return i18t('lib_grp_cp'); }, get builtin(){ return i18t('lib_grp_builtin'); }, get sample(){ return i18t('lib_grp_sample'); } };
function tplPageRows(){
  const rows=[];
  const lib=(typeof tplLibAll==='function')?tplLibAll():{list:[],canManage:false};
  for(const t of lib.list){
    const draft=t.status!=='published';
    rows.push({ kind:'company', id:t.id, name:t.name, draft,
      sub:`${(typeof TPLLIB_CATEGORIES!=='undefined'&&TPLLIB_CATEGORIES[t.category])||'Company paper'}${draft?' · not published':''}`,
      stream:null, get origin(){ return i18t('lib_grp_company'); },
      category:(typeof TPLLIB_CATEGORIES!=='undefined'&&TPLLIB_CATEGORIES[t.category])||null,
      version:t.publishedVersion?('v'+t.publishedVersion):null,
      /* A DATE IS LABELLED WITH WHAT IT IS. The overview prints it beside the
         version, and "12 Aug 2026" on its own is a fact nobody can read —
         published, last used and added are three different claims. */
      used:Number(t.contractsCreated)||0, at:t.lastUsedAt||'', atKind:'used' });
  }
  for(const t of customTemplates()){
    rows.push({ kind:'cp', id:t.id, name:t.name,
      sub:`${FOLDERS[t.folder]?.name||'—'} · ${_tplSourceLabel(t)}${isRich(templateFormat(t))?' · formatted':''}`,
      stream:t.folder, origin:'Counterparty paper', version:'v'+templateVersionNo(t),
      category:tplShortStream(FOLDERS[t.folder]?.name)||null,
      used:templateUsage(t.id).count, at:t.at||'', atKind:'added' });
  }
  const myRole=currentUser()?.role||'viewer';
  for(const t of Object.values(TEMPLATES)){
    if(tplCanManage()&&!templateAllowedForRole(t.id,myRole)) continue;
    rows.push({ kind:'builtin', id:t.id, name:t.name, sub:t.blurb||'', stream:t.folder,
      origin:'HaTi standard', version:t.id, mono:true, category:tplShortStream(FOLDERS[t.folder]?.name)||null,
      used:(typeof builtinUsageCount==='function')?builtinUsageCount(t.id):0, at:'' });
  }
  const already=new Set(customTemplates().filter(t=>t.source&&t.source.startsWith('sample:')).map(t=>t.source.slice(7)));
  HATI_SAMPLES.forEach((s,i)=>rows.push({ kind:'sample', id:'smp'+i, i, name:s.name,
    sub:`${FOLDERS[s.folder]?.name||''} · ${s.file}`, stream:s.folder, origin:'Sample',
    category:tplShortStream(FOLDERS[s.folder]?.name)||null,
    version:null, used:null, imported:already.has(s.file), at:'' }));
  /* Company paper leads (the whole point of publishing it), then the paper
     you brought in, then HaTi's own, then samples — most-used first inside
     each group. */
  const ORD={company:0,cp:1,builtin:2,sample:3};
  rows.sort((a,b)=>(ORD[a.kind]-ORD[b.kind])||((b.used||0)-(a.used||0))||String(a.name).localeCompare(String(b.name)));
  return rows;
}
function tplPageFiltered(rows){
  const q=_tplPage.q.trim().toLowerCase();
  return rows.filter(r=>(_tplPage.group==='all'||r.kind===_tplPage.group)
    &&(!_tplPage.stream||r.stream===_tplPage.stream)
    &&(!q||`${r.name} ${r.sub} ${r.origin}`.toLowerCase().includes(q)));
}
function tplPageRowHtml(r){
  const canManage=tplCanManage();
  const RULE='border-bottom:1px solid var(--color-divider)';
  const stripe=r.kind==='company'
    ?(r.draft?'var(--st-amber-dot)':'var(--st-green-dot)')
    :(r.stream?folderColor(r.stream):'var(--color-neutral-300)');
  const version=r.version==null?`<span style="color:var(--color-neutral-400)">—</span>`
    :r.mono?`<span style="font-family:var(--font-mono);font-size:12px;color:var(--color-neutral-500)">${_tplEsc(r.version)}</span>`
    :`<span style="font-weight:700;color:var(--color-accent-700)">${_tplEsc(r.version)}</span>`;
  const B='class="ui-btn" style="font-size:13px;padding:4px 12px"';
  const P='class="ui-btn ui-btn-primary" style="font-size:13px;padding:4px 12px"';
  let acts='';
  if(r.kind==='company') acts=r.draft
    ?`<button data-tpllib-open="${_tplEsc(r.id)}" ${B}>${i18t('lib_continue_editing')}</button>`
    :`${canManage?`<button data-tpllib-use="${_tplEsc(r.id)}" ${P}>${i18t('lib_use')}</button>`:''}<button data-tpllib-open="${_tplEsc(r.id)}" ${B}>${i18t('act_open')}</button>`;
  else if(r.kind==='cp') acts=`${canManage?`<button data-tpl-use="${_tplEsc(r.id)}" ${P}>${i18t('lib_use')}</button>`:''}<button data-tpl-prev="${_tplEsc(r.id)}" ${B}>${i18t('act_open')}</button>${canManage?`<button data-tpl-more="${_tplEsc(r.id)}" class="ui-btn" style="font-size:13px;padding:4px 9px" title="${i18t('lb_edit_blanks_bulk')}">⋯</button>`:''}`;
  else if(r.kind==='builtin') acts=`${canManage?`<button data-tpl-builtin="${_tplEsc(r.id)}" ${P}>${i18t('lib_use')}</button><button data-tpl-bulk-b="${_tplEsc(r.id)}" ${B}>${i18t('lib_bulk')}</button>`:''}`;
  else acts=r.imported
    ?`<span class="badge" style="background:var(--st-green-bg);color:var(--st-green-fg)"><span class="dot" style="background:var(--st-green-dot)"></span>${i18t('lib_imported')}</span>`
    :(canManage?`<button data-sample-imp="${r.i}" ${B}>${i18t('lib_import_as_template')}</button>`:'');
  return `<tr>
    <td style="padding:10px 8px 10px 14px;${RULE}">
      <div style="display:flex;gap:11px;align-items:flex-start">
        <span style="flex:none;width:4px;height:30px;border-radius:var(--radius);background:${stripe};margin-top:2px"></span>
        <div style="min-width:0">
          <div style="display:flex;align-items:center;gap:8px;min-width:0">
            <span style="font-size:14px;font-weight:700;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_tplEsc(r.name)}</span>
            ${r.draft?`<span style="flex:none;font-size:10px;font-weight:700;padding:1px 7px;border-radius:var(--radius);background:var(--st-amber-bg);color:var(--st-amber-fg)">Draft</span>`:''}
          </div>
          <div style="font-size:12px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px">${_tplEsc(r.sub)}</div>
        </div>
      </div></td>
    <td style="padding:10px 8px;${RULE};font-size:13px;color:var(--color-neutral-600);white-space:nowrap">${_tplEsc(r.origin)}</td>
    <td style="padding:10px 8px;${RULE};font-size:13px;font-variant-numeric:tabular-nums">${version}</td>
    <td style="padding:10px 8px;${RULE};font-size:13px;font-variant-numeric:tabular-nums;color:var(--color-neutral-700)">${r.used==null?'—':r.used}</td>
    <td style="padding:10px 14px 10px 8px;${RULE};text-align:right;white-space:nowrap"><div style="display:inline-flex;gap:6px">${acts}</div></td>
  </tr>`;
}
function tplPagePaintRows(){
  const host=document.getElementById('tpl-rows'); if(!host) return;
  const all=tplPageRows();
  const rows=tplPageFiltered(all);
  const searching=!!_tplPage.q.trim()||_tplPage.group!=='all'||!!_tplPage.stream;
  const CAP=TPL_PAGE_CAP;
  const shown=(_tplPage.showAll||searching)?rows:rows.slice(0,CAP);
  const hidden=rows.length-shown.length;
  const th=t=>`<th style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-500);text-align:left;padding:7px 8px;border-bottom:1px solid var(--color-divider)">${t}</th>`;
  const hiddenKinds=hidden>0?Object.entries(rows.slice(CAP).reduce((m,r)=>{m[r.kind]=(m[r.kind]||0)+1;return m;},{}))
    /* Keyed on the KIND, not on the label's words — comparing the label to
       "Samples" stops being true the moment the label can be translated. */
    .map(([k,n])=>k==='sample'?i18tn('lib_sample_doc',n,{n}):`${n} ${TPL_GROUP_LABEL[k]}`).join(', '):'';
  const count=document.getElementById('tpl-count');
  if(count) count.textContent=i18tn('lib_count',rows.length,{n:rows.length});
  host.innerHTML=rows.length?`
    <div class="table-scroll"><table style="border-collapse:collapse;width:100%">
      <tr>${th(i18t('lib_col_template'))}${th(i18t('lib_col_origin'))}${th(i18t('lib_col_version'))}${th(i18t('lib_col_used'))}<th style="border-bottom:1px solid var(--color-divider)"></th></tr>
      ${shown.map(tplPageRowHtml).join('')}
    </table></div>
    ${hidden>0?`<div style="display:flex;align-items:center;padding:11px 14px;font-size:13px;color:var(--color-neutral-600)">
      ${i18t('lib_more_kinds',{n:hidden,kinds:hiddenKinds})}<span style="flex:1"></span>
      <button id="tpl-showall" style="border:0;background:none;cursor:pointer;font:inherit;font-size:13px;font-weight:700;color:var(--color-accent-700)">${i18t('lib_show_all')}</button></div>`:''}`
    :`<div style="padding:28px 14px;text-align:center;font-size:13px;color:var(--color-neutral-600)">${i18t('lib_nothing_matches')}</div>`;
  // row verbs (rebound on every paint — the rows are rebuilt wholesale)
  host.querySelectorAll('[data-tpllib-use]').forEach(b=>b.addEventListener('click',()=>tplLibNewContract(b.getAttribute('data-tpllib-use'))));
  host.querySelectorAll('[data-tpllib-open]').forEach(b=>b.addEventListener('click',()=>openTemplateLibDetail(b.getAttribute('data-tpllib-open'))));
  host.querySelectorAll('[data-tpl-use]').forEach(b=>b.addEventListener('click',()=>createFromCustomTemplate(b.getAttribute('data-tpl-use'))));
  host.querySelectorAll('[data-tpl-prev]').forEach(b=>b.addEventListener('click',()=>{ const t=customTemplates().find(x=>x.id===b.getAttribute('data-tpl-prev')); if(t) openTemplatePreview(t); }));
  host.querySelectorAll('[data-tpl-more]').forEach(b=>b.addEventListener('click',()=>tplRowMoreMenu(b.getAttribute('data-tpl-more'))));
  host.querySelectorAll('[data-tpl-builtin]').forEach(b=>b.addEventListener('click',()=>openWizard(b.getAttribute('data-tpl-builtin'))));
  host.querySelectorAll('[data-tpl-bulk-b]').forEach(b=>b.addEventListener('click',()=>{ const t=TEMPLATES[b.getAttribute('data-tpl-bulk-b')];
    if(!t) return;
    if(!templateAllowedForRole(t.id, currentUser()?.role||'viewer')){ toast(i18t('lb_not_open_to_role'),'err'); return; }
    openBulkCreateModal(t); }));
  host.querySelectorAll('[data-sample-imp]').forEach(b=>b.addEventListener('click',()=>importHatiSample(Number(b.getAttribute('data-sample-imp')), b)));
  document.getElementById('tpl-showall')?.addEventListener('click',()=>{ _tplPage.showAll=true; tplPagePaintRows(); });
}
/* The rarer verbs on a counterparty template, one … away: everything the old
   card offered, none of it stealing a column from every row. */
function tplRowMoreMenu(tid){
  const t=customTemplates().find(x=>x.id===tid); if(!t) return;
  const item=(id,label,sub)=>`<button id="${id}" style="display:block;width:100%;text-align:left;border:0;background:none;cursor:pointer;font:inherit;padding:9px 12px;border-radius:var(--radius)" onmouseover="this.style.background='color-mix(in srgb,var(--color-text) 5%,transparent)'" onmouseout="this.style.background='none'">
    <span style="display:block;font-size:14px;font-weight:600">${label}</span><span style="display:block;font-size:12px;color:var(--color-neutral-600)">${sub}</span></button>`;
  openModal(`<div style="padding:16px 14px;min-width:280px">
    <div style="font-size:14px;font-weight:700;padding:0 12px 8px">${_tplEsc(t.name)}</div>
    ${item('tm-edit','Edit the wording','Every save becomes a new version')}
    ${item('tm-blanks',templateFields(t).length?`Blanks (${templateFields(t).length})`:'Add blanks','The guided fields a drafter completes')}
    ${templateFields(t).length?item('tm-bulk','Create in bulk','Many contracts from one CSV of answers'):''}
    ${item('tm-vers',`Version history (${templateVersions(t).length+1})`,'What changed, when, by whom')}
    ${item('tm-del','Delete template','Usage is shown before anything is removed')}
    <div style="display:flex;justify-content:flex-end;padding:8px 12px 0"><button id="tm-close" class="ui-btn" style="font-size:13px">${i18t('act_close')}</button></div>
  </div>`);
  document.getElementById('tm-close')?.addEventListener('click',closeModal);
  document.getElementById('tm-edit')?.addEventListener('click',()=>{ closeModal(); openTemplateEditor(tid); });
  document.getElementById('tm-blanks')?.addEventListener('click',()=>{ closeModal(); openBlanksEditor(tid); });
  document.getElementById('tm-bulk')?.addEventListener('click',()=>{ closeModal(); openBulkCreateModal(t); });
  document.getElementById('tm-vers')?.addEventListener('click',()=>{ closeModal(); openTemplateVersions(tid); });
  document.getElementById('tm-del')?.addEventListener('click',()=>{ closeModal(); deleteTemplateGuarded(tid); });
}
/* "+ New template" holds both kinds of paper a workspace creates — a company
   standard (published, versioned, permissioned) and a counterparty's own
   template. One button, one honest question, no third screen. */
function tplNewMenu(){
  const lib=(typeof tplLibAll==='function')?tplLibAll():{canManage:false};
  const companyOk=API_MODE()&&lib.canManage;
  if(!companyOk){ openCreateTemplateModal('paste'); return; }
  const opt=(id,label,sub)=>`<button id="${id}" style="display:block;width:100%;text-align:left;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:13px 15px;cursor:pointer;font:inherit;margin-bottom:8px">
    <span style="display:block;font-size:14px;font-weight:700">${label}</span><span style="display:block;font-size:12px;color:var(--color-neutral-600);margin-top:2px;line-height:1.45">${sub}</span></button>`;
  openModal(`<div style="padding:20px 22px;max-width:380px">
    <h3 style="font-family:var(--font-heading);font-weight:600;font-size:17px;margin:0 0 10px">${i18t('lib_what_kind')}</h3>
    ${opt('tn-company',i18t('lib_grp_company'),i18t('lib_published_whole_team'))}
    ${opt('tn-cp','Counterparty paper','Their template, saved so the negotiation runs through HaTi.')}
    <div style="display:flex;justify-content:flex-end"><button id="tn-close" class="ui-btn" style="font-size:13px">${i18t('act_cancel')}</button></div>
  </div>`);
  document.getElementById('tn-close')?.addEventListener('click',closeModal);
  document.getElementById('tn-company')?.addEventListener('click',()=>{ closeModal(); tplLibCreateModal(); });
  document.getElementById('tn-cp')?.addEventListener('click',()=>{ closeModal(); openCreateTemplateModal('paste'); });
}
/* ==================================================== TEMPLATES OVERVIEW ====
   THE PAGE IS TWO TABS (owner-asked 25 Aug 2026, off the demo): "Templates
   overview" is the demo's own card wall, "Templates" is the table this page
   has always been, and the two are asked to work together rather than sit
   side by side.

   THE OVERVIEW IS A SIGNPOST, NOT A SECOND LIBRARY. It answers three
   questions the table cannot — how often is this paper actually used, how
   often does what comes off it end up off-standard, and which templates want
   somebody's attention — and every card, every attention row and the "see
   all" is a DOOR into the table, narrowed to what was pressed. No verb lives
   here that does not live there: Use, Open, blanks, bulk, versions and delete
   are the table's, so there is one place a template is acted on.

   COUNTING IS NOT DRAWING (the Insights panels' own rule): tplOverviewData
   counts and returns plain data, tplOverviewHtml draws that data and computes
   nothing. It counts the SAME population tplPageRows builds, so the two tabs
   can never disagree about what the workspace holds. */

/* Which contracts came from this template. ONE READING PER KIND, each
   borrowed from the function that already owned it — templateUsage for the
   workspace's own paper (company and counterparty alike; both are keyed on
   templateId/templateRef) and builtinUsageRows for HaTi's own. A second
   filter written here is how two screens come to disagree about which
   contracts came from one template. A sample has none until it is imported,
   at which point it IS a counterparty template and answers as one. */
function tplRowContracts(r){
  if(!r) return [];
  if(r.kind==='sample') return [];
  if(r.kind==='builtin') return (typeof builtinUsageRows==='function')?builtinUsageRows(r.id):[];
  return (typeof templateUsage==='function')?templateUsage(r.id).rows:[];
}

function tplOverviewData(){
  const rows=tplPageRows();
  const cut=Date.now()-TPL_RECENT_DAYS*86400000;
  /* Read through window and inside a try: this page renders in stages that do
     not load reports.js or playbook.js, and a bare cross-module read throws
     rather than falling through. */
  const raisedAt=c=>{ try{ return window.repRaisedAt?repRaisedAt(c):null; }catch(_){ return null; } };
  const devOf=c=>{ try{ return window.deviationSummary?deviationSummary(c):null; }catch(_){ return null; } };
  const cards=rows.map(r=>{
    const cs=tplRowContracts(r);
    /* A RATE MAY ONLY COUNT PAPER A PLAYBOOK HAS ACTUALLY READ. A contract
       nobody has checked is not an aligned one, and counting it as one
       flatters every template on this page. So the denominator is what was
       CHECKED, and what was not is stated on the card rather than trimmed
       away — the fxMissing rule, on standards instead of money. */
    const scanned=cs.filter(c=>c&&c.playbook);
    const off=scanned.filter(c=>{ const s=devOf(c); return !!(s&&(s.dev+s.miss)>0); });
    const recent=cs.filter(c=>{ const t=raisedAt(c); return t!=null&&t>=cut; }).length;
    return { kind:r.kind, id:r.id, i:r.i, name:r.name, draft:!!r.draft, imported:!!r.imported,
      stream:r.stream||null, origin:r.origin, category:r.category||null,
      version:r.version||null, mono:!!r.mono, at:r.at||'', atKind:r.atKind||null,
      used:r.used==null?null:r.used,
      scanned:scanned.length, off:off.length, unscanned:cs.length-scanned.length,
      rate:scanned.length?(off.length/scanned.length):null,
      recent };
  });
  /* WHAT WANTS SOMEBODY, WORST FIRST. Three rules and no more: a template
     whose paper keeps coming back off-standard is costing money, a draft is
     work somebody started and nobody can use, and the workspace's own paper
     that nothing has been drafted from was made for a reason nobody acted on.
     A built-in or a sample nobody has used is not a finding — HaTi shipped
     it, nobody in this workspace chose it. */
  const attention=[];
  for(const c of cards){
    if(c.scanned>=TPL_DEV_MIN&&c.rate!=null&&c.rate>=0.5)
      attention.push({ id:c.id, kind:c.kind, name:c.name, rank:0,
        why:i18t('lib_ov_why_deviates',{pct:Math.round(c.rate*100)}) });
    else if(c.kind==='company'&&c.draft)
      attention.push({ id:c.id, kind:c.kind, name:c.name, rank:1, why:i18t('lib_ov_why_draft') });
    else if((c.kind==='company'||c.kind==='cp')&&!c.draft&&c.used===0)
      attention.push({ id:c.id, kind:c.kind, name:c.name, rank:2, why:i18t('lib_ov_why_unused') });
  }
  attention.sort((a,b)=>a.rank-b.rank||String(a.name).localeCompare(String(b.name)));
  /* THE WALL IS ORDERED BY THE FIGURE ON THE CARD. The table leads with the
     workspace's own paper, which is right for a library; this is a reading of
     ACTIVITY, and a first screen of eight templates nothing has come off is
     not one. Ties keep the table's own order, so the two never shuffle
     against each other without reason. Same population, different question. */
  cards.sort((a,b)=>((b.used||0)-(a.used||0)));
  const mostUsed=cards.filter(c=>c.recent>0)
    .sort((a,b)=>b.recent-a.recent||String(a.name).localeCompare(String(b.name)))
    .slice(0,5);
  const peak=mostUsed.length?mostUsed[0].recent:0;
  return { cards, attention, attentionShown:attention.slice(0,5),
    attentionMore:Math.max(0,attention.length-5),
    mostUsed, peak, days:TPL_RECENT_DAYS,
    total:cards.length,
    checked:cards.reduce((n,c)=>n+c.scanned,0),
    unchecked:cards.reduce((n,c)=>n+c.unscanned,0),
    /* In server mode the browser holds a working set; templateUsage already
       answers whether that is the whole book, and a rate measured over half a
       portfolio must say so rather than read as the portfolio's. */
    complete:(typeof templateUsage==='function')?templateUsage('__none__').complete:true };
}

function tplOverviewHtml(d){
  /* ---- THE CARD IS THE DEMO'S CARD (owner-asked 25 Aug 2026, off a picture
     of one) ----
     A 3px tone bar ACROSS THE TOP rather than a stripe down the left; the
     state as a small uppercase badge at the top right; the name, then
     category · version · date; a hairline; then the two figures under quiet
     sentence-case labels; then one line qualifying them.

     WHAT THE COLOUR SAYS, and each carrier answers ONE question. The BAR is
     what kind of paper this is and what state it is in — company paper green
     when published and amber while it is a draft, everything else the value
     stream's own colour, which is exactly what the left stripe carried before
     it moved. The RATE'S INK is how the paper is doing, and its ruby is the
     SAME threshold that puts a template in Needs attention, so a red figure
     and a row in that panel can never mean different things. The count beside
     it stays the primary ink: it is a fact about volume, not a verdict. */
  const CARD='background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius);box-shadow:var(--shadow-sm)';
  const day=v=>{ const t=Date.parse(v||''); return isNaN(t)?null:new Date(t).toLocaleDateString(langLocale(),{day:'numeric',month:'short',year:'numeric'}); };
  /* THE TONE BAR — the left stripe's own reading, moved to the demo's place. */
  const topTone=c=>c.kind==='company'
    ?(c.draft?'var(--st-amber-dot)':'var(--st-green-dot)')
    :(c.stream?folderColor(c.stream):'var(--color-neutral-300)');
  const badge=c=>{
    const chip=(w,bg,fg)=>`<span class="tpl-ov-badge" style="background:${bg};color:${fg}">${_tplEsc(w)}</span>`;
    if(c.kind==='company') return c.draft
      ? chip(i18t('lib_ov_draft'),'var(--st-amber-bg)','var(--st-amber-fg)')
      : chip(i18t('tl_published'),'var(--st-green-bg)','var(--st-green-fg)');
    if(c.kind==='sample'&&c.imported) return chip(i18t('lib_imported'),'var(--st-green-bg)','var(--st-green-fg)');
    return chip(c.origin,'var(--color-neutral-100)','var(--color-neutral-600)');
  };
  const dated=c=>{
    const s2=day(c.at); if(!s2) return null;
    return c.atKind==='added'?i18t('lib_ov_added',{d:s2}):i18t('lib_ov_last_used',{d:s2});
  };
  const note=c=>{
    /* NOTHING DRAFTED IS A DIFFERENT FACT FROM NOTHING CHECKED, and reading
       the first as the second puts a checking gap on a template that has
       simply never been used. */
    if(c.rate==null) return (c.used===0||(c.used==null&&c.unscanned===0))
      ? i18t('lib_ov_why_unused') : i18t('lib_ov_not_checked');
    /* "0 of the 3 contracts checked did not follow Our standards" is accurate
       and reads like a near miss. Paper that all came back clean is good news
       and says so. */
    const first=c.off===0
      ? i18tn('lib_ov_all_clear',c.scanned,{n:c.scanned})
      : i18tn('lib_ov_off_standard',c.scanned,{off:c.off,n:c.scanned});
    return c.unscanned>0?`${first} ${i18tn('lib_ov_unchecked',c.unscanned,{n:c.unscanned})}`:first;
  };
  /* RUBY IS THE ATTENTION RULE'S OWN THRESHOLD — a red figure on the card and
     a row in Needs attention are the same finding, or the page argues with
     itself. Amber is a rate worth noticing that has not earned the alarm;
     green is the demo's own answer for a low one. */
  const rateInk=c=>{
    if(c.rate==null) return 'var(--color-neutral-400)';
    if(c.scanned>=TPL_DEV_MIN&&c.rate>=0.5) return 'var(--st-ruby-fg)';
    if(c.rate>=0.25) return 'var(--st-amber-fg)';
    return 'var(--st-green-fg)';
  };
  /* The two panels' own signposts stay small uppercase caps: a caption OVER a
     list is a signpost, and the demo's sentence-case labels are labels ON a
     figure. Different jobs, different dress. */
  const HEAD='font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-600)';
  /* ---- THE CARD CAME DOWN A RUNG (owner-asked 25 Aug 2026, off a screenshot
     with the two figures ringed: "all the fonts need to be reduced by one size
     and the ones highlighted (numbers) should be reduced by 2 sizes") ----
     One step down this product's own ladder (10, 11, 12, 13, 14, 15, 17, 19,
     22): name 15 to 14, every piece of small text 13 to 12, and the two
     figures TWO steps, 19 to 15. THE BADGE IS THE ONE THING THAT DID NOT MOVE
     and it is said out loud: 10px is the ladder's floor, and a smaller one
     would be the only sub-10px type anywhere in this product. */
  const LBL='font-size:12px;font-weight:400;color:var(--color-neutral-600);line-height:1.45';
  const FIG='font-size:15px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.3;margin-top:1px';
  const cardHtml=c=>{
    const sub=[c.category,c.version&&!c.mono?c.version:null,dated(c)].filter(Boolean).join(' · ');
    return `<button data-tpl-ov-card="${_tplEsc(c.id)}" data-tpl-ov-name="${_tplEsc(c.name)}" title="${i18t('lib_ov_open_in_list')}"
      style="${CARD};display:flex;flex-direction:column;align-items:stretch;width:100%;text-align:left;font:inherit;color:inherit;cursor:pointer;padding:0;overflow:hidden"
      onmouseover="this.style.borderColor='var(--accent-solid)'" onmouseout="this.style.borderColor='var(--color-divider)'">
      <span style="display:block;height:3px;background:${topTone(c)}"></span>
      ${''/* THE BADGE FLOATS, which is what the demo draws and what gives a
            long name its second line whole: in a flex row the badge takes a
            column and every line of the name is short, so "Freight &
            Distribution Agreement" ran out of room on a card with an inch of
            white beside it. Floated, only the FIRST line is narrowed. It also
            rules out -webkit-line-clamp, which makes its own formatting
            context and would ignore the float — so the name is capped by
            reserving two lines rather than by clamping, and a name long
            enough to need a third gets one. */}
      <span style="display:block;padding:13px 14px 0">
        ${badge(c)}
        <span class="tpl-ov-name" style="display:block;font-size:14px;font-weight:700;color:var(--color-text)">${_tplEsc(c.name)}</span>
        <span style="display:block;${LBL};margin-top:3px;clear:both;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_tplEsc(sub||'—')}</span>
      </span>
      <span style="display:flex;gap:18px;margin:11px 14px 0;padding-top:11px;border-top:1px solid var(--color-divider)">
        <span style="flex:1;min-width:0">
          <span style="display:block;${LBL}" title="${i18t('lib_ov_used_title')}">${i18t('lib_ov_used')}</span>
          <span style="display:block;${FIG};color:var(--color-text)">${c.used==null?'—':c.used}</span>
        </span>
        <span style="flex:1;min-width:0">
          ${''/* A LABEL THAT NEEDS EXPLAINING SAYS SO ON ITS OWN HOVER.
                "Deviation rate" is the product's word and the figure under it
                is worked out from a SAMPLE, which is the half a reader cannot
                see; the line at the foot of the card states the sample and
                this states the metric. */}
          <span style="display:block;${LBL}" title="${i18t('lib_ov_dev_rate_title')}">${i18t('lib_ov_dev_rate')}</span>
          <span style="display:block;${FIG};color:${rateInk(c)}">${c.rate==null?'—':Math.round(c.rate*100)+'%'}</span>
        </span>
      </span>
      <span class="tpl-ov-note" style="display:block;padding:9px 14px 13px;${LBL}">${_tplEsc(note(c))}</span>
    </button>`;
  };
  const shown=d.cards.slice(0,TPL_PAGE_CAP);
  const more=d.cards.length-shown.length;
  const attRow=a=>`<button data-tpl-ov-card="${_tplEsc(a.id)}" data-tpl-ov-name="${_tplEsc(a.name)}"
    style="display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--color-divider);background:none;cursor:pointer;font:inherit;color:inherit;padding:8px 2px"
    onmouseover="this.style.background='color-mix(in srgb,var(--color-text) 5%,transparent)'" onmouseout="this.style.background='none'">
    <span style="display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_tplEsc(a.name)}</span>
    <span style="display:block;font-size:12px;color:var(--color-neutral-600);line-height:1.45">${_tplEsc(a.why)}</span></button>`;
  const barRow=c=>{
    const w=d.peak?Math.max(6,Math.round(c.recent/d.peak*100)):0;
    return `<button data-tpl-ov-card="${_tplEsc(c.id)}" data-tpl-ov-name="${_tplEsc(c.name)}"
      style="display:block;width:100%;text-align:left;border:0;background:none;cursor:pointer;font:inherit;color:inherit;padding:6px 2px">
      <span style="display:flex;align-items:baseline;gap:8px">
        <span style="flex:1;min-width:0;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_tplEsc(c.name)}</span>
        <span style="flex:none;font-size:13px;font-weight:700;font-variant-numeric:tabular-nums">${c.recent}</span>
      </span>
      <span style="display:block;height:6px;margin-top:4px;background:var(--color-neutral-100)">
        <span style="display:block;height:6px;width:${w}%;background:var(--accent-solid)"></span></span></button>`;
  };
  const EMPTY='font-size:13px;line-height:1.6;color:var(--color-neutral-600);margin:0';
  return `
  <div class="tpl-ov" style="display:grid;gap:16px;align-items:start">
    <div>
      <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:10px">
        <span style="font-size:13px;color:var(--color-neutral-600)">${i18tn('lib_ov_head',d.total,{n:d.total})}</span>
        <span style="font-size:13px;color:var(--color-neutral-600)">·</span>
        <span style="font-size:13px;color:var(--color-neutral-600)">${i18t('lib_ov_coverage',{checked:d.checked,open:d.unchecked})}</span>
      </div>
      <div class="tpl-ov-cards" style="display:grid;gap:12px">${shown.map(cardHtml).join('')}</div>
      ${more>0?`<div style="display:flex;align-items:center;gap:10px;margin-top:12px">
        <span style="font-size:13px;color:var(--color-neutral-600)">${i18tn('lib_ov_more',more,{n:more})}</span>
        <button id="tpl-ov-all" style="border:0;background:none;cursor:pointer;font:inherit;font-size:13px;font-weight:700;color:var(--accent-ink)">${i18tn('lib_ov_see_all',d.total,{n:d.total})}</button>
      </div>`:''}
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <section id="tpl-ov-attention" style="${CARD};padding:14px">
        <div style="${HEAD};margin-bottom:8px">${i18t('lib_ov_attention')}</div>
        ${d.attentionShown.length?d.attentionShown.map(attRow).join(''):`<p style="${EMPTY}">${i18t('lib_ov_attention_none')}</p>`}
        ${d.attentionMore>0?`<p style="${EMPTY};margin-top:8px">${i18tn('lib_ov_more',d.attentionMore,{n:d.attentionMore})}</p>`:''}
      </section>
      <section id="tpl-ov-mostused" style="${CARD};padding:14px">
        <div style="${HEAD};margin-bottom:8px">${i18t('lib_ov_most_used',{n:d.days})}</div>
        ${d.mostUsed.length?d.mostUsed.map(barRow).join(''):`<p style="${EMPTY}">${i18t('lib_ov_most_used_none',{n:d.days})}</p>`}
      </section>
    </div>
  </div>`;
}

/* THE TAB IS PER SITTING, IN MEMORY — the Settings page's own rule: a stored
   tab lands a reader somewhere unrelated a week later. */
const TPL_PAGE_TABS=['overview','list'];
let _tplPageTab=null;
function tplPageTab(){ return TPL_PAGE_TABS.includes(_tplPageTab)?_tplPageTab:'overview'; }
/* A tab press is CLASS AND HIDDEN FLIPS, never a re-render: the table holds a
   search box the reader may be typing into, and both doors below (a card, the
   "see all") set that box before switching. */
function tplPageSetTab(k){
  if(!TPL_PAGE_TABS.includes(k)) return;
  _tplPageTab=k;
  document.querySelectorAll('[data-tpl-tab]').forEach(t=>{
    const on=t.getAttribute('data-tpl-tab')===k;
    t.classList.toggle('on',on); t.setAttribute('aria-selected',on?'true':'false');
  });
  document.querySelectorAll('[data-tpl-sec]').forEach(s=>{ s.hidden=s.getAttribute('data-tpl-sec')!==k; });
}
/* THE TWO TABS WORK TOGETHER HERE. A card, an attention row and a bar all
   land on the same door: switch to the table, narrowed to that template.
   THE NARROWING SAYS SO AND OFFERS THE WAY BACK by construction — it is the
   table's own search box, filled with the name in plain sight, and emptying
   it is the way back. */
function tplGoList(name){
  _tplPage.q=String(name||''); _tplPage.group='all'; _tplPage.stream=null; _tplPage.showAll=false;
  tplPageSetTab('list');
  const box=document.getElementById('tpl-search');
  if(box) box.value=_tplPage.q;
  tplPagePaintRows();
  try{ box?.focus(); }catch(_){}
}

function renderTemplatesPage(){
  const rows=tplPageRows();
  const counts=rows.reduce((m,r)=>{m[r.kind]=(m[r.kind]||0)+1;return m;},{});
  const total=rows.length;
  const lib=(typeof tplLibAll==='function')?tplLibAll():{canManage:false,loaded:true};
  const canManage=tplCanManage();
  const tab=tplPageTab();
  const ov=tplOverviewData();
  const railIt=(key,label,n)=>`<button data-tpl-group="${key}" style="display:flex;align-items:center;gap:8px;width:100%;border:0;background:${_tplPage.group===key?'var(--color-accent-100)':'none'};color:${_tplPage.group===key?'var(--color-accent-800)':'var(--color-neutral-700)'};font:inherit;font-size:14px;font-weight:600;padding:7px 11px;border-radius:var(--radius);cursor:pointer;text-align:left">
    <span style="flex:1">${label}</span><span style="font-family:var(--font-mono);font-size:12px;color:${_tplPage.group===key?'var(--color-accent-700)':'var(--color-neutral-500)'}">${n}</span></button>`;
  const streamIt=f=>`<button data-tpl-stream="${f.id}" style="display:flex;align-items:center;gap:9px;width:100%;border:0;background:${_tplPage.stream===f.id?'var(--color-accent-100)':'none'};color:var(--color-neutral-700);font:inherit;font-size:13px;font-weight:600;padding:6px 11px;border-radius:var(--radius);cursor:pointer;text-align:left">
    <span style="flex:none;width:8px;height:14px;border-radius:var(--radius);background:${folderColor(f.id)}"></span><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_tplEsc(tplShortStream(f.name))}</span></button>`;
  const HEAD='font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;color:var(--color-neutral-500);text-transform:uppercase;padding:0 11px;margin:0 0 6px';
  /* NO SENTENCE UNDER THE TITLE and none under the tabs (owner-asked 25 Aug
     2026, "remove these explanations below the headers in all pages where the
     explanation is there"). This page owns its own header, so the sweep that
     emptied the shell's subtitle never reached it; a tab row with a .st-tabsub
     under it would put the same sentence back one line lower. */
  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:var(--page-pad)">
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:10px">
      ${''/* THE TITLE'S INK SITS WHERE EVERY OTHER PAGE'S DOES. The row is
            centre-aligned for the acts beside it, and a 20px title centred
            against a 28px button lands 3px lower than the shared header's —
            MEASURED, and it is exactly the spread the owner reported on
            25 Aug. Home answers this the same way, by taking one element out
            of the row's alignment rather than by moving the row. */}
      <h1 style="margin:0;align-self:flex-start;font-family:var(--font-heading);font-size:20px;font-weight:700;letter-spacing:-.01em;color:var(--color-text);line-height:1.2">${i18t('nav_templates')}</h1>
      <span style="flex:1"></span>
      ${canManage?`<button id="tpl-convert" class="ui-btn ui-btn-secondary" style="font-size:13px;padding:6px 13px">${i18t('lib_convert_document')}</button>
      <button id="tpl-new" class="ui-btn ui-btn-primary" style="font-size:13px;padding:6px 14px">${i18t('lib_new_template')}</button>`:''}
    </div>
    <div class="st-tabs" role="tablist" style="margin-bottom:14px">
      <button class="st-tab${tab==='overview'?' on':''}" data-tpl-tab="overview" role="tab" aria-selected="${tab==='overview'?'true':'false'}">${i18t('lib_tab_overview')}</button>
      <button class="st-tab${tab==='list'?' on':''}" data-tpl-tab="list" role="tab" aria-selected="${tab==='list'?'true':'false'}">${i18t('nav_templates')}</button>
    </div>

    <section data-tpl-sec="overview" ${tab==='overview'?'':'hidden'}>${tplOverviewHtml(ov)}</section>

    <section data-tpl-sec="list" ${tab==='list'?'':'hidden'}>
    <div class="tpl-cols" style="display:grid;gap:16px;align-items:start">
      <div>
        <div style="${HEAD}">${i18t('lib_library')}</div>
        ${railIt('all',TPL_GROUP_LABEL.all,total)}
        ${railIt('company',TPL_GROUP_LABEL.company,counts.company||0)}
        ${railIt('cp',TPL_GROUP_LABEL.cp,counts.cp||0)}
        ${railIt('builtin',TPL_GROUP_LABEL.builtin,counts.builtin||0)}
        ${railIt('sample',TPL_GROUP_LABEL.sample,counts.sample||0)}
        <div style="${HEAD};margin-top:16px">${i18t('lib_value_stream')}</div>
        ${Object.values(FOLDERS).map(streamIt).join('')}
        <!-- Our standards used to hang off this rail, because the clause
             library and playbook had no door of their own. They have one now,
             under Administration, and a governance screen with two homes is
             the fault WO N1 removed — so the rail no longer carries it. -->
      </div>
      <div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius);box-shadow:var(--shadow-sm);overflow:hidden">
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid var(--color-divider)">
          <input id="tpl-search" type="search" placeholder="${i18t('lb_search_templates')}" autocomplete="off" value="${_tplEsc(_tplPage.q)}"
            style="flex:none;width:min(320px,50%);border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);padding:7px 12px;font:inherit;font-size:13px;color:inherit;outline:none"/>
          <span id="tpl-count" style="font-size:12px;color:var(--color-neutral-500)"></span>
        </div>
        <div id="tpl-rows" style="overflow-x:auto"></div>
      </div>
    </div>
    </section>
  </div>`;
  tplPagePaintRows();
  document.querySelectorAll('[data-tpl-tab]').forEach(b=>b.addEventListener('click',()=>tplPageSetTab(b.getAttribute('data-tpl-tab'))));
  /* Every door on the overview lands on the same one: the table, narrowed to
     the template that was pressed. A card, an attention row and a bar are
     three drawings of one act, so they share one handler and one selector. */
  document.querySelectorAll('[data-tpl-ov-card]').forEach(b=>b.addEventListener('click',()=>tplGoList(b.getAttribute('data-tpl-ov-name'))));
  document.getElementById('tpl-ov-all')?.addEventListener('click',()=>{
    _tplPage.q=''; _tplPage.group='all'; _tplPage.stream=null; _tplPage.showAll=true;
    tplPageSetTab('list');
    const box=document.getElementById('tpl-search'); if(box) box.value='';
    tplPagePaintRows();
  });
  document.querySelectorAll('[data-tpl-group]').forEach(b=>b.addEventListener('click',()=>{
    _tplPage.group=b.getAttribute('data-tpl-group'); _tplPage.showAll=false; renderTemplatesPage(); }));
  document.querySelectorAll('[data-tpl-stream]').forEach(b=>b.addEventListener('click',()=>{
    const v=b.getAttribute('data-tpl-stream');
    _tplPage.stream=_tplPage.stream===v?null:v; renderTemplatesPage(); }));
  document.getElementById('tpl-search')?.addEventListener('input',e=>{ _tplPage.q=e.target.value; tplPagePaintRows(); });
  document.getElementById('tpl-new')?.addEventListener('click',tplNewMenu);
  document.getElementById('tpl-convert')?.addEventListener('click',()=>{
    const lib2=(typeof tplLibAll==='function')?tplLibAll():{canManage:false};
    if(API_MODE()&&lib2.canManage&&typeof tplLibUploadModal==='function') tplLibUploadModal();
    else openCreateTemplateModal('upload');
  });
  /* Company templates come from the server cache; the first visit renders
     before it is warm, so refresh and repaint the rows when the list moves. */
  /* ---- A FAILED FETCH MUST NOT ASK FOR ANOTHER RENDER ----
     This read `changed || !lib.loaded`, and a failed load never sets `loaded`
     — so one bad response re-rendered the page, which re-fetched, which failed,
     for ever, as fast as the round trip allowed. tplLibRefresh answers `null`
     on a failure now, which is neither "changed" nor "still not loaded": the
     page stops, and SAYS SO rather than looping in silence. */
  if(API_MODE()&&typeof tplLibRefresh==='function')
    tplLibRefresh().then(changed=>{
      if(state.view!=='templates') return;
      if(changed===null){ if(window.toast) toast(i18t('lb_templates_load_failed'),'warn'); return; }
      if(changed||!lib.loaded) renderTemplatesPage();
    });
  setActiveNav('templates');
}

/* ============================================================ PLAYBOOK PAGE */
/* ---- THE CARDS LIVE UNDER TABS (owner-asked 20 Aug 2026, "like in the
   settings page"). Clause library · Negotiation playbook · Deviations —
   wearing the Settings page's OWN tab classes (.st-tabs/.st-tab/.st-tabsub),
   one class defined once, so the two pages cannot drift apart.
   ALL THREE SECTIONS STAY IN THE DOM and the inactive ones are [hidden]:
   renderClauseLibrary fills #clause-lib AND #playbook-view by id on every
   paint, so removing a tab's markup would crash the fill — and every id any
   door or test reaches for stays reachable. The chosen tab is per sitting,
   in memory (the Settings page's own rule: a stored tab lands a reader
   somewhere unrelated a week later). */
const PB_PAGE_TABS=['clauses','playbook','deviations'];
const PB_TAB_LABEL={clauses:'lib_clause_library',playbook:'lib_negotiation_playbook',deviations:'lib_portfolio_deviations'};
const PB_TAB_SUB={clauses:'lib_clause_library_sub',playbook:'lib_playbook_sub',deviations:'lib_deviations_sub'};
let _pbPageTab=null;
function pbPageTab(){ return PB_PAGE_TABS.includes(_pbPageTab)?_pbPageTab:'clauses'; }
function renderPlaybookPage(){
  const CARD='background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:var(--radius)';
  const canEditLib=isAdmin()||currentUser()?.role==='legal';

  // portfolio deviations (from the existing playbook review results)
  const devRows=state.contracts
    .map(c=>({c, s:(window.deviationSummary?deviationSummary(c):null)}))
    .filter(x=>x.s&&(x.s.dev+x.s.miss)>0)
    .sort((a,b)=>(b.s.dev+b.s.miss)-(a.s.dev+a.s.miss)).slice(0,8);
  const devHtml=devRows.length?devRows.map(x=>`
    <button data-dev-open="${x.c.id}" style="display:flex;align-items:center;gap:8px;width:100%;padding:6px 2px;border:0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 7%,transparent);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit" onmouseover="this.style.background='color-mix(in srgb,var(--color-text) 5%,transparent)'" onmouseout="this.style.background='none'">
      <span style="flex:1;min-width:0">
        <span style="display:block;font-size:13px;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${x.c.name}</span>
        <span style="display:block;font-size:12px;color:var(--color-neutral-600)">${x.c.id} · ${x.c.counterparty||'—'}</span>
      </span>
      <span class="badge" style="background:var(--st-amber-bg);color:var(--st-amber-fg);flex:none">${x.s.dev+x.s.miss} deviation${x.s.dev+x.s.miss===1?'':'s'}</span>
    </button>`).join('')
    :`<p style="font-size:13px;color:var(--color-neutral-600);margin:0;line-height:1.6">${i18t('lib_no_deviations')} <b>${i18t('lib_copilot_review')}</b> ${i18t('lib_from_workspace')}</p>`;

  const tab=pbPageTab();
  const tabRow=`<div class="st-tabs" role="tablist">${PB_PAGE_TABS.map(k=>
    `<button class="st-tab${k===tab?' on':''}" data-pb-tab="${k}" role="tab" aria-selected="${k===tab?'true':'false'}">${esc(i18t(PB_TAB_LABEL[k]))}</button>`).join('')}</div>`;

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:var(--page-pad)">
    ${tabRow}
    <p id="pb-tabsub" class="st-tabsub">${esc(i18t(PB_TAB_SUB[tab]))}</p>

    ${''/* The card headings retired with the tabs — a card titled with the
          word on the pressed tab twelve pixels above is the same word twice.
          The meta line and the controls stay: they carry what the tab
          cannot (who may edit, and the Add clause door). */}
    <section data-pb-sec="clauses" ${tab==='clauses'?'':'hidden'} style="${CARD};padding:16px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <span style="font-size:12px;color:var(--color-neutral-600)">${i18t('lib_fallback_wording')} · ${canEditLib?i18t('lib_admin_legal_edit'):i18t('lib_read_only_role')}</span>
        <span style="flex:1"></span>
        ${canEditLib?`<button id="cl-add" class="ui-btn ui-btn-primary" style="font-size:13px;padding:5px 12px">${icon('plus','w-3.5 h-3.5')} ${i18t('lib_add_clause')}</button>`:''}
      </div>
      <div id="clause-lib" style="display:flex;flex-direction:column;gap:8px"></div>
      <!-- W3-2: what the workspace's own settled rounds say the fallback
           should be. Empty (and undrawn) until there is real history. -->
      <div id="precedent-panel" class="empty:hidden" style="margin-top:10px"></div>
    </section>

    <section data-pb-sec="playbook" ${tab==='playbook'?'':'hidden'} style="${CARD};padding:16px">
      <div id="playbook-view"></div>
    </section>

    <section data-pb-sec="deviations" ${tab==='deviations'?'':'hidden'} style="${CARD};padding:16px">
      ${devHtml}
    </section>
  </div>`;

  renderClauseLibrary();   // fills #clause-lib and #playbook-view, wires edit/add/remove
  document.querySelectorAll('[data-dev-open]').forEach(b=>b.addEventListener('click',()=>openWorkspace(b.getAttribute('data-dev-open'))));
  /* A tab press is CLASS AND HIDDEN FLIPS, never a re-render: the clause
     library holds open editors and scroll the reader is in the middle of,
     and the settings page's own rule is that a selection must not rebuild
     the screen under the reader. */
  document.querySelectorAll('[data-pb-tab]').forEach(b=>b.addEventListener('click',()=>{
    const k=b.getAttribute('data-pb-tab'); if(!PB_PAGE_TABS.includes(k)) return;
    _pbPageTab=k;
    document.querySelectorAll('[data-pb-tab]').forEach(t=>{
      const on=t.getAttribute('data-pb-tab')===k;
      t.classList.toggle('on',on); t.setAttribute('aria-selected',on?'true':'false');
    });
    document.querySelectorAll('[data-pb-sec]').forEach(s=>{ s.hidden=s.getAttribute('data-pb-sec')!==k; });
    const sub=document.getElementById('pb-tabsub'); if(sub) sub.textContent=i18t(PB_TAB_SUB[k]);
  }));
  setActiveNav('playbook');
}

Object.assign(window,{HATI_SAMPLES,openBlanksEditor,_tplPreviewHtml,_tplSourceLabel,_richSelection,_richReplaceRange,
  templateVersionNo,templateVersions,templateUsage,templateUsageLabel,saveTemplateVersion,
  openTemplateEditor,openTemplateVersions,deleteTemplateGuarded,duplicateBuiltinTemplate,openBulkCreateModal,openTemplateFillModal,buildFromCustomTemplate,updateTemplateRecord,createFromCustomTemplate,customTemplates,importHatiSample,openTemplatePreview,openCreateTemplateModal,openUploadTemplateModal,renderPlaybookPage,renderTemplatesPage,tplOverviewData,tplOverviewHtml,tplRowContracts,tplPageTab,tplPageSetTab,tplGoList,TPL_PAGE_TABS,saveContractAsTemplate,saveCustomTemplates,saveTemplateRecord});
