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
/* `prefill` is an optional {fieldKey: value} map — see openWizard. It reaches
   BOTH branches below, because a saved template with no blanks still asks the
   contract essentials and those are answers too. */
function createFromCustomTemplate(tid, prefill){
  if(!canEdit()){ toast(i18t('lib_viewers_no_create'),'err'); return; }
  const t=customTemplates().find(x=>x.id===tid);
  if(!t){ toast(i18t('lib_template_not_found'),'err'); return; }
  // A template with blanks goes through the same guided fill as the built-ins,
  // so the contract arrives with structured data rather than raw text.
  const fs=templateFields(t);
  if(fs.length){ openTemplateFillModal(t, prefill); return; }
  /* A template with NO blanks used to create silently — same gap the company
     standard path had. The wording needs nothing filled in, but the contract
     record underneath it still does, so the essentials are asked here too.
     Skip creates exactly what pressing Use created before. */
  if(typeof openContractEssentials==='function'){
    openContractEssentials({
      title: t.name, blurb: 'This template needs nothing filled into its wording.', values: prefill,
      folder: t.folder || '',
      /* THE PAPER FOR THE PANE (18 Sep 2026). Built by the same call
         buildFromCustomTemplate makes below — a template with no blanks fills
         with nothing, so this IS the wording the press is about to create. */
      format: templateFormat(t),
      paper: () => fillTemplateBody(templateBody(t), {}, templateFormat(t)),
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
    /* The reader's own answer where the door asked for one, else the
       template's filing, else Other — the order this door has always had with
       one rung added on top (18 Sep 2026). */
    template:null, source:'template',
    folder:(opts&&FOLDERS[opts.folder]) ? opts.folder : (FOLDERS[t.folder]?t.folder:'corp'),
    valueType:'estimated',
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
  /* AND COPILOT READS IT (Young ruled 17 Sep 2026) — registered at every
     creation site beside roomOpenOnTerms, because there is no single funnel
     for creating a contract. See contractArrived. */
  if(window.contractArrived) contractArrived(c);
  state.activeId=c.id; state.selId=c.id;
  persist(c);
  toast(`Draft created from “${t.name}”`);
  setView('workspace');
  return c;
}
/* Guided fill for a custom template — the same shape as the built-in wizard. */
function openTemplateFillModal(t, prefill){
  const fs=(prefill && typeof draftApplyPrefill==='function')
    ? draftApplyPrefill(templateFields(t), prefill) : templateFields(t);
  const inp=f=>{ const id='tf-'+f.key;
    /* The arrow says where the answer is filed, and stands down when that is
       the same word as the label — see the note in js/wizard.js. */
    const _map=f.maps?String(tplMapLabel(f.maps)||''):'';
    /* Where the answer is filed rides on the hover, not after the label (the
       pop-up diet, 13 Sep 2026): a label is a label. */
    const _mapNote='';
    const _mapTitle=(_map && _map.trim().toLowerCase()!==String(f.label||'').trim().toLowerCase()) ? ` title="${_tplEsc(_map).replace(/"/g,'&quot;')}"` : '';
    const lbl=`<span${_mapTitle} style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1)">${_tplEsc(f.label)}${f.required?' <span style="color:var(--st-ruby-fg)">*</span>':''}${_mapNote}</span>`;
    const st='width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 11px;font:inherit;font-size:var(--t-body);outline:none';
    if(f.type==='select') return `<label style="display:block">${lbl}<select id="${id}" style="${st}">${(f.opts||[]).map(o=>`<option value="${_tplEsc(o).replace(/"/g,'&quot;')}" ${f.def===o?'selected':''}>${_tplEsc(o)}</option>`).join('')}</select></label>`;
    const it=f.type==='date'?'date':(f.type==='num'?'number':'text');
    return `<label style="display:block">${lbl}<input id="${id}" type="${it}" value="${String(f.def||'').replace(/"/g,'&quot;')}" placeholder="${_tplEsc(f.ph||'')}" style="${st}"/></label>`; };
  /* ---- THE PAPER BESIDE THE QUESTIONS (upgrade 2, 18 Sep 2026) ----
     The boxes do not change — same questions, same order, same required stars,
     same three acts. They move into the left half of a wider frame and the
     agreement they are going into draws in the right half, from the SAME
     function that draws it after Create. Under FILL_PREVIEW_MIN_W the dialog
     is byte-identical to what it was: a preview that squeezes the questions is
     worse than no preview. */
  const _pv = (typeof fillPreviewFits==='function') && fillPreviewFits();
  openModal(`<div style="padding:20px 22px">
    <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-page);margin:0 0 3px">${_tplEsc(t.name)}</h3>
    <div id="tf-cols" style="display:grid;grid-template-columns:${_pv?'minmax(0,1fr) minmax(0,1fr)':'minmax(0,1fr)'};gap:var(--s-4);align-items:start">
    <div class="field-grid" style="${(typeof FIELD_GRID_CSS==='string'?FIELD_GRID_CSS:'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--s-3)')}">
      ${''/* OUR SIDE, ASKED HERE TOO. A customer's own template may carry a
             blank of its own mapped to `party`, in which case that one wins —
             this answer is set on the record first and applyTemplateValues
             runs after it. Where the template has no such blank, this is the
             only place the entity can be named, and without it every contract
             made from a saved template goes on naming the workspace. */}
      <label style="display:block">
        <span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1)">${i18t('tf_our_party')}</span>
        <input id="tf-party" type="text" value="${_tplEsc((typeof FIRST_PARTY!=='undefined'&&FIRST_PARTY)||'').replace(/"/g,'&quot;')}" placeholder="${_tplEsc(i18t('tf_our_party_ph'))}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 11px;font:inherit;font-size:var(--t-body);outline:none"/></label>
      ${fs.map(inp).join('')}
      ${''/* THE SAME QUESTION THE BUILT-IN TEMPLATES ASK, because this is the
             same act. Saved templates create contracts through their own fill
             form, so adding the address to the guided wizard alone left every
             contract made from "Counterparty Templates" back where it started: asked in
             the negotiation room, and again by the share dialog. */}
      <label style="display:block">
        <span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1)">${i18t('lib_their_email')}</span>
        <input id="tf-cpemail" type="email" placeholder="${(typeof jxEg==='function'&&jxEg('theirEmail'))||'them@company.co.ke'}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 11px;font:inherit;font-size:var(--t-body);outline:none"/></label>
      ${''/* WHERE IT IS FILED (Young ruled 18 Sep 2026). Hand-written beside
             the other two record facts for the same reason they are: a saved
             template carries its own blanks and none of them is this, so this
             is the only place the stream can be named on this door. The
             template's own filing is the answer already in the box. */}
      <label style="display:block">
        <span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1)">${i18t('tl_stream')}</span>
        <select id="tf-folder" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 11px;font:inherit;font-size:var(--t-body);outline:none">${
          (typeof folderOptionsHtml==='function') ? folderOptionsHtml(t.folder||null, false) : ''}</select></label>
    </div>
    ${_pv?fillPreviewPaneHtml(fs.filter(f=>!String(f.def||'').trim()).length):''}
    </div>
    <div id="tf-err" style="font-size:var(--t-label);color:var(--st-ruby-fg);min-height:15px;margin-top:var(--s-2)"></div>
    <div style="display:flex;align-items:center;gap:var(--s-2);margin-top:var(--s-2)">
      <button id="tf-cancel" class="ui-btn">${i18t('act_cancel')}</button>
      <span style="flex:1"></span>
      <button id="tf-skip" class="ui-btn" title="${esc(i18t('lib_create_now_fill_later'))}">${i18t('lib_skip_for_now')}</button>
      <button id="tf-create" class="ui-btn ui-btn-primary">${i18t('lib_create_draft')}</button>
    </div></div>`, {maxWidth:_pv?'1040px':'620px'});
  if(typeof bindFolderSelect==='function') bindFolderSelect(document.getElementById('tf-folder'));
  /* THE ANSWERS AS THEY STAND, read exactly as the Create press reads them, so
     the preview cannot draw a contract the press would not make. */
  if(_pv && typeof fillPreviewWire==='function'){
    const readNow=()=>{ const values={};
      for(const f of fs){ const el=document.getElementById('tf-'+f.key); if(el) values[f.key]=String(el.value||'').trim(); }
      return { t, values, party:((document.getElementById('tf-party')||{}).value||'') }; };
    fillPreviewWire(document.getElementById('tf-cols'), 'saved', readNow);
  }
  const tfFolder=()=>((document.getElementById('tf-folder')||{}).value||'');
  document.getElementById('tf-cancel').addEventListener('click',closeModal);
  /* Same contract, blanks left blank — an unfilled placeholder is a designed
     state in the document, not a broken one. */
  document.getElementById('tf-skip').addEventListener('click',()=>{ const fo=tfFolder(); closeModal(); buildFromCustomTemplate(t, {}, { folder:fo }); });
  document.getElementById('tf-create').addEventListener('click',()=>{
    const values={}, errs=[];
    for(const f of fs){ const el=document.getElementById('tf-'+f.key); const raw=el?el.value.trim():'';
      const e=validateField(f, raw); if(e) errs.push(e); else values[f.key]=raw; }
    const cpEmail=(document.getElementById('tf-cpemail')||{}).value||'';
    if(cpEmail.trim() && !/.+@.+\..+/.test(cpEmail.trim()))
      errs.push(`"${cpEmail.trim()}" is not an email address — leave it blank if you do not have it yet.`);
    if(errs.length){ document.getElementById('tf-err').textContent=errs[0]; return; }
    const party=((document.getElementById('tf-party')||{}).value||'').trim();
    const folder=tfFolder();
    closeModal(); buildFromCustomTemplate(t, values, { counterpartyEmail:cpEmail.trim(), party, folder });
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
      <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:6px"><span style="color:var(--color-accent)">${icon('copy','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-page);margin:0">${i18t('lib_save_as_template')}</h3></div>
      <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 var(--s-3);line-height:1.5">Saves this document's current text (${text.length.toLocaleString()} characters${rich?', with its formatting':''}) as a reusable template. It will appear under <b>${i18t('lib_cp_templates')}</b> ${i18t('lib_and_in_new_menu')}</p>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('lib_template_name')}</span>
        <input id="tpl-name" value="${defName.replace(/"/g,'&quot;')}" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);padding:7px 10px;font:inherit;font-size:var(--t-body);outline:none"/></label>
      <label style="display:block;margin-bottom:14px"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('lib_value_stream')}</span>
        <select id="tpl-folder" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px var(--s-2);font:inherit;font-size:var(--t-body)">${opts}</select></label>
      <div style="display:flex;justify-content:flex-end;gap:var(--s-2)">
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

  /* READS THE ONE PAIR (25 Aug 2026) — see HATI_FLD in core.js. */
  const FLD=window.HATI_FLD;
  const tabBtn=(k,label,sub)=>`<button data-ct-tab="${k}" style="flex:1;text-align:left;padding:9px var(--s-3);font:inherit;cursor:pointer;border:1px solid ${tab===k?'var(--color-accent)':'var(--color-divider)'};background:${tab===k?'var(--color-accent-100)':'var(--color-surface)'};border-radius:var(--radius)">
      <span style="display:block;font-size:var(--t-body);font-weight:var(--w-strong);color:${tab===k?'var(--color-accent-800)':'var(--color-neutral-800)'}">${label}</span>
      <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);margin-top:1px">${sub}</span></button>`;

  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:6px"><span style="color:var(--color-accent)">${icon('copy','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-page);margin:0">${i18t('lib_create_template')}</h3></div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px" id="ct-tabs">
        ${tabBtn('paste','Paste the document','From Word or Google Docs — keeps the formatting')}
        ${tabBtn('upload','Upload a file','A PDF or text file you already have')}
      </div>

      <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:10px;margin-bottom:var(--s-3)">
        <label style="display:block"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('lib_template_name')}</span>
          <input id="ct-name" placeholder="e.g. Standard Distribution Agreement" style="${FLD}"/></label>
        <label style="display:block"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('lib_value_stream')}</span>
          <select id="ct-folder" style="${FLD};background:var(--color-surface)">${opts}</select></label>
      </div>

      <!-- Both panes share one grid cell, so the modal is as tall as the
           taller pane whichever tab is showing — switching tabs must never
           resize the panel, because a centred modal that resizes also moves. -->
      <div id="ct-panes" style="display:grid">
      <div id="ct-pane-paste" style="grid-area:1/1">
        <div style="display:flex;align-items:baseline;gap:var(--s-2);margin-bottom:var(--s-1)">
          <span style="font-size:var(--t-label);font-weight:var(--w-strong)">${i18t('lib_paste_contract_here')}</span>
          <span style="flex:1"></span>
          <button id="ct-preview" class="ui-btn" style="font-size:var(--t-label);padding:3px 9px">${i18t('lib_preview')}</button>
          <button id="ct-clear" class="ui-btn" style="font-size:var(--t-label);padding:3px 9px">Clear</button>
        </div>
        <div id="ct-editor" class="scroll-thin doc-surface" style="height:270px;font-size:var(--t-body)"
             data-placeholder="${i18t('lb_open_in_word')}"></div>
        <div id="ct-previewpane" class="scroll-thin doc-surface" style="display:none;height:270px;overflow-y:auto;border:1px solid var(--color-accent-300);background:var(--color-bg);border-radius:0;padding:14px 18px"></div>
        <p style="font-size:var(--t-label);color:var(--color-neutral-600);margin:6px 0 0;line-height:1.5">${RICH_EDITOR_NOTE}</p>
        <div id="ct-report" style="font-size:var(--t-label);margin-top:7px;min-height:16px;line-height:1.5"></div>
      </div>

      <div id="ct-pane-upload" style="grid-area:1/1;visibility:hidden;pointer-events:none">
        <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 var(--s-2);line-height:1.5">${i18t('lib_pdf_or_text')} <b>${i18t('lib_rebuilds_structure')}</b> — headings, bold, italics, numbered clauses and indentation — from the type sizes and positions the PDF states. That recovers most of a document but not all of it: <b>${i18t('lib_pasting_more_faithful')}</b>${i18t('lib_because_clipboard')}</p>
        <label style="display:block;margin-bottom:6px"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('lib_document_file')}</span>
          <input id="ct-file" type="file" accept=".pdf,.docx,.txt,.md,text/plain,application/pdf" style="${FLD};font-size:var(--t-meta)"/></label>
      </div>
      </div>

      <div id="ct-status" style="font-size:var(--t-label);color:var(--color-neutral-600);min-height:16px;margin:10px 0"></div>
      <div style="display:flex;justify-content:flex-end;gap:var(--s-2)">
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
        rep(`<span style="display:block;border:1px solid var(--st-ruby-line);background:rgba(176,69,60,.06);border-radius:var(--radius);padding:var(--s-2) 10px;color:var(--st-ruby-fg)">
          <b>${i18t('lib_did_not_come_across')}</b> ${_tplEsc(report.reason)}
          Paste it again, or <button type="button" id="ct-fallback" style="border:0;background:none;padding:0;font:inherit;font-weight:var(--w-strong);color:var(--st-ruby-fg);text-decoration:underline;cursor:pointer">${i18t('lib_use_plain_text')}</button> ${i18t('lib_lose_formatting')}</span>`);
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
    const st='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:var(--s-1) 7px;font:inherit;font-size:var(--t-meta);outline:none';
    const rows=fields.map((f,i)=>`
      <div data-fld="${i}" style="display:grid;grid-template-columns:1.3fr .9fr 1.2fr auto auto;gap:6px;align-items:center;padding:var(--s-1) 0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent)">
        <input data-f="label" value="${String(f.label||'').replace(/"/g,'&quot;')}" placeholder="${i18t('lb_label')}" style="${st}"/>
        <select data-f="type" style="${st}">${TPL_FIELD_TYPES.map(x=>`<option value="${x.k}" ${f.type===x.k?'selected':''}>${x.label}</option>`).join('')}</select>
        <select data-f="maps" style="${st}">${TPL_MAPS.map(x=>`<option value="${x.k}" ${(f.maps||'')===x.k?'selected':''}>${x.label}</option>`).join('')}</select>
        <label style="display:inline-flex;align-items:center;gap:var(--s-1);font-size:var(--t-label);color:var(--color-neutral-600);white-space:nowrap"><input data-f="required" type="checkbox" ${f.required?'checked':''} style="accent-color:var(--color-accent)"/>req</label>
        <button data-del="${i}" title="${i18t('lb_remove_blank')}" style="border:1px solid var(--st-ruby-line);background:none;color:var(--st-ruby-fg);border-radius:var(--radius);font:inherit;font-size:var(--t-label);padding:2px 7px;cursor:pointer">×</button>
        ${f.type==='select'?`<input data-f="opts" value="${String((f.opts||[]).join(', ')).replace(/"/g,'&quot;')}" placeholder="${i18t('lb_choices_comma')}" style="${st};grid-column:1 / -1"/>`:''}
        <div style="grid-column:1 / -1;font-size:var(--t-label);color:var(--color-neutral-500);font-family:var(--font-mono)">{{${f.key}}}${orphanFields.includes(f)?` <span style="color:var(--st-ruby-fg)">${i18t('lib_blank_unused')}</span>`:''}</div>
      </div>`).join('');
    const host=document.getElementById('be-fields');
    if(host){
      host.innerHTML=rows||`<div style="font-size:var(--t-meta);color:var(--color-neutral-600);padding:6px 0">${i18t('lib_no_blanks_yet')} <b>${i18t('lib_make_this_blank')}</b>.</div>`;
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
    <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:var(--s-1)"><span style="color:var(--color-accent)">${icon('copy','w-4 h-4')}</span>
      <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-page);margin:0">Blanks in “${_tplEsc(rec.name)}”</h3></div>
    <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 var(--s-3);line-height:1.55">The blanks in a template are the database. Anything you mark here becomes a guided field when someone creates a contract, and its value is filed as contract data — so the register, filters, folder routing and reports get structured information with no separate data entry.</p>
    <div style="display:flex;gap:var(--s-2);flex-wrap:wrap;margin-bottom:10px">
      <button id="be-make" class="ui-btn ui-btn-primary" style="font-size:var(--t-meta);padding:5px 11px">${i18t('lib_make_selection_blank')}</button>
      <button id="be-detect" class="ui-btn" style="font-size:var(--t-meta);padding:5px 11px">${i18t('lib_detect_brackets')}</button>
      ${(API_MODE()&&state.aiConfigured)?`<button id="be-suggest" class="ui-btn" style="font-size:var(--t-meta);padding:5px 11px">${icon('sparkle','w-3.5 h-3.5')} Suggest blanks</button>`:''}
    </div>
    <div id="be-fields" class="scroll-thin" style="max-height:190px;overflow-y:auto;border:1px solid var(--color-divider);border-radius:var(--radius);padding:6px 9px;margin-bottom:var(--s-2)"></div>
    <div id="be-warn" style="font-size:var(--t-label);margin-bottom:var(--s-2);min-height:14px"></div>
    <label style="display:block;margin-bottom:var(--s-3)"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">Template body — select text, then “Make selection a blank”${rich?` <span style="font-weight:var(--w-body);color:var(--color-neutral-500)">${i18t('lib_formatted_template')}</span>`:''}</span>
      ${rich
        ? `<div id="be-body" class="scroll-thin doc-surface" style="width:100%;height:210px;overflow-y:auto;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:0;padding:9px 13px"></div>`
        : `<textarea id="be-body" class="scroll-thin" style="width:100%;height:210px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);padding:9px 11px;font:inherit;font-size:var(--t-meta);line-height:1.6;font-family:var(--font-mono);outline:none;resize:vertical"></textarea>`}</label>
    <div id="be-status" style="font-size:var(--t-label);color:var(--color-neutral-600);min-height:15px;margin-bottom:var(--s-2)"></div>
    <div style="display:flex;justify-content:flex-end;gap:var(--s-2)">
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

  /* READS THE ONE PAIR (25 Aug 2026) — see HATI_FLD in core.js. */
  const FLD=window.HATI_FLD;
  openModal(`<div style="padding:20px 22px">
    <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:3px">
      <span style="color:var(--color-accent)">${icon('pencil','w-4 h-4')}</span>
      <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-page);margin:0">${i18t('lib_edit_template')}</h3>
      <span style="font-family:var(--font-mono);font-size:var(--t-label);font-weight:var(--w-strong);color:var(--st-steel-fg);border:1px solid var(--st-steel-line);background:var(--st-steel-bg);border-radius:var(--radius);padding:1px 6px">v${templateVersionNo(rec)}</span>
      <span style="flex:1"></span>
      <button id="te-versions" class="ui-btn" style="font-size:var(--t-label);padding:3px 9px;white-space:nowrap">${icon('history','w-3.5 h-3.5')} Versions (${templateVersions(rec).length+1})</button>
    </div>
    <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 var(--s-1);line-height:1.5">
      ${_tplEsc(templateUsageLabel(usage))} · saving creates <b>v${templateVersionNo(rec)+1}</b>.</p>
    <div style="display:flex;gap:7px;align-items:flex-start;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);padding:7px 10px;margin:0 0 var(--s-3);font-size:var(--t-label);line-height:1.5;color:var(--color-neutral-700)">
      <span style="flex:none;margin-top:1px;color:var(--color-accent)">${icon('shield','w-3.5 h-3.5')}</span>
      <span><b>${i18t('lib_existing_unaffected')}</b> A contract copies the wording when it is created; it does not follow the template afterwards. Changes here apply to the next draft you generate.</span>
    </div>

    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:10px;margin-bottom:var(--s-3)">
      <label style="display:block"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('lib_template_name')}</span>
        <input id="te-name" value="${String(name).replace(/"/g,'&quot;')}" style="${FLD}"/></label>
      <label style="display:block"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('lib_value_stream')}</span>
        <select id="te-folder" style="${FLD};background:var(--color-surface)">${folderOptionsHtml(folder,false)}</select></label>
    </div>

    <div style="display:flex;align-items:baseline;gap:var(--s-2);margin-bottom:var(--s-1)">
      <span style="font-size:var(--t-label);font-weight:var(--w-strong)">${i18t('lib_document')}</span>
      <span style="font-size:var(--t-label);color:var(--color-neutral-600)">${startedRich?'formatted — paste over it to replace, or edit in place':'plain text — paste formatted paper here to upgrade it'}</span>
      <span style="flex:1"></span>
      <button id="te-blank" class="ui-btn" style="font-size:var(--t-label);padding:3px 9px">${i18t('lib_make_selection_blank')}</button>
      <button id="te-preview" class="ui-btn" style="font-size:var(--t-label);padding:3px 9px">${i18t('lib_preview')}</button>
    </div>
    <div id="te-body" class="scroll-thin doc-surface" style="height:230px;font-size:var(--t-body)"
         data-placeholder="${i18t('lb_paste_or_type')}"></div>
    <div id="te-previewpane" class="scroll-thin doc-surface" style="display:none;height:230px;overflow-y:auto;border:1px solid var(--color-accent-300);background:var(--color-bg);border-radius:0;padding:14px 18px"></div>
    <p style="font-size:var(--t-label);color:var(--color-neutral-600);margin:6px 0 0;line-height:1.5">${RICH_EDITOR_NOTE}</p>

    <div style="display:flex;align-items:baseline;gap:var(--s-2);margin:var(--s-3) 0 var(--s-1)">
      <span style="font-size:var(--t-label);font-weight:var(--w-strong)">${i18t('lib_blanks')}</span>
      <span style="font-size:var(--t-label);color:var(--color-neutral-600)">${i18t('lib_blanks_become_fields')}</span>
    </div>
    <div id="te-fields" class="scroll-thin" style="max-height:150px;overflow-y:auto;border:1px solid var(--color-divider);border-radius:var(--radius);padding:6px 9px"></div>
    <div id="te-warn" style="font-size:var(--t-label);margin:7px 0;min-height:15px;line-height:1.5"></div>

    <label style="display:block;margin-bottom:var(--s-3)"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('lib_what_changed')} <span style="font-weight:var(--w-body);color:var(--color-neutral-500)">(recorded against v${templateVersionNo(rec)+1})</span></span>
      <input id="te-note" placeholder="${esc(i18t('lib_ph_version_note'))}" style="${FLD}"/></label>

    <div id="te-status" style="font-size:var(--t-label);min-height:16px;margin-bottom:var(--s-2)"></div>
    <div style="display:flex;justify-content:space-between;gap:var(--s-2)">
      <button id="te-delete" class="ui-btn" style="border-color:var(--st-ruby-line);color:var(--st-ruby-fg)">${i18t('lib_delete_template')}</button>
      <span style="display:flex;gap:var(--s-2)">
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
    const stl='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:var(--s-1) 7px;font:inherit;font-size:var(--t-meta);outline:none';
    const host2=document.getElementById('te-fields'); if(!host2) return;
    host2.innerHTML=fields.length?fields.map((f,i)=>`
      <div data-fld="${i}" style="display:grid;grid-template-columns:1.3fr .9fr 1.2fr auto auto;gap:6px;align-items:center;padding:var(--s-1) 0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent)">
        <input data-f="label" value="${String(f.label||'').replace(/"/g,'&quot;')}" placeholder="${i18t('lb_label')}" style="${stl}"/>
        <select data-f="type" style="${stl}">${TPL_FIELD_TYPES.map(x=>`<option value="${x.k}" ${f.type===x.k?'selected':''}>${x.label}</option>`).join('')}</select>
        <select data-f="maps" style="${stl}">${TPL_MAPS.map(x=>`<option value="${x.k}" ${(f.maps||'')===x.k?'selected':''}>${x.label}</option>`).join('')}</select>
        <label style="display:inline-flex;align-items:center;gap:var(--s-1);font-size:var(--t-label);color:var(--color-neutral-600);white-space:nowrap"><input data-f="required" type="checkbox" ${f.required?'checked':''} style="accent-color:var(--color-accent)"/>req</label>
        <button data-del="${i}" title="${i18t('lb_remove_blank')}" style="border:1px solid var(--st-ruby-line);background:none;color:var(--st-ruby-fg);border-radius:var(--radius);font:inherit;font-size:var(--t-label);padding:2px 7px;cursor:pointer">×</button>
        ${f.type==='select'?`<input data-f="opts" value="${String((f.opts||[]).join(', ')).replace(/"/g,'&quot;')}" placeholder="${i18t('lb_choices_comma')}" style="${stl};grid-column:1 / -1"/>`:''}
        <div style="grid-column:1 / -1;font-size:var(--t-label);color:var(--color-neutral-500);font-family:var(--font-mono)">{{${f.key}}}${orphanFields.includes(f)?` <span style="color:var(--st-ruby-fg)">${i18t('lib_not_used_above')}</span>`:''}</div>
      </div>`).join('')
      :`<div style="font-size:var(--t-meta);color:var(--color-neutral-600);padding:6px 0">${i18t('lib_no_blanks_press')} <b>${i18t('lib_make_selection_blank')}</b>.</div>`;
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
      const act=(a,k,label)=>`<button type="button" data-fix="${a}" data-k="${k}" style="border:0;background:none;padding:0;font:inherit;font-size:inherit;font-weight:var(--w-strong);color:inherit;text-decoration:underline;cursor:pointer">${label}</button>`;
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
    <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:3px">
      <span style="color:var(--color-accent)">${icon('history','w-4 h-4')}</span>
      <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-page);margin:0">${i18t('lib_versions_of',{name:_tplEsc(rec.name)})}</h3>
    </div>
    <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 var(--s-3);line-height:1.5">${i18t('lib_every_save_kept')} <b>new</b> ${i18t('lib_history_intact')} <b>${i18t('lib_no_contract_changes')}</b>${i18t('lib_copies_wording')}</p>
    <div class="scroll-thin" style="max-height:52vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px">
      ${all.map(v=>`
        <div style="display:flex;align-items:center;gap:9px;border:1px solid ${v.n===current.n?'var(--color-accent-300)':'var(--color-divider)'};background:${v.n===current.n?'var(--color-accent-100)':'var(--color-surface)'};border-radius:var(--radius);padding:var(--s-2) 11px">
          <span style="font-family:var(--font-mono);font-weight:var(--w-strong);font-size:var(--t-meta);color:var(--accent-ink-700);flex:none">v${v.n}</span>
          <span style="min-width:0;flex:1">
            <span style="display:block;font-size:var(--t-meta);color:var(--color-neutral-800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_tplEsc(v.note||'Saved')}${v.name!==rec.name?` <span style="color:var(--color-neutral-500)">· named “${_tplEsc(v.name)}”</span>`:''}</span>
            <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-500);font-family:var(--font-mono)">${v.by?_tplEsc(v.by)+' · ':''}${v.at?fmtDT(v.at):''} · ${(v.fields||[]).length} blank${(v.fields||[]).length===1?'':'s'} · ${(v.format==='rich'?'formatted':'plain text')}</span>
          </span>
          ${v.n===current.n?`<span class="badge" style="flex:none;background:var(--st-steel-bg);color:var(--st-steel-fg)">current</span>`
            :`<button data-tv-view="${v.n}" class="ui-btn" style="flex:none;font-size:var(--t-label);padding:3px 9px">${i18t('lib_view')}</button>
              ${canManage?`<button data-tv-revert="${v.n}" class="ui-btn" style="flex:none;font-size:var(--t-label);padding:3px 9px">${i18t('lib_revert_to_this')}</button>`:''}`}
        </div>`).join('')}
    </div>
    <div style="display:flex;justify-content:flex-end;gap:var(--s-2);margin-top:14px">
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
/* ════ MAKE IT OURS — HaTi'S PAPER BECOMES YOUR OWN (Young asked 18 Sep 2026)
   ═══════════════════════════════════════════════════════════════════════════
   THIS REPLACES duplicateBuiltinTemplate, WHICH WAS WRONG THREE WAYS and had
   no caller anywhere in the product, so twelve drafted agreements sat on the
   list with no way to start from them. Wiring the old one up would have been
   worse than leaving it: it filed the copy under COUNTERPARTY PAPER (labelling
   your own standard as the other side's), it created the settings-blob kind of
   template, which has NO draft state and no publish step — so there was no
   "before it is published" to work in — and it opened the pop-up editor, which
   has no Copilot. The owner's ask was precisely "edit it with Copilot before
   it is published"; the old step could not do any of those three things.

   THE RIGHT ROAD ALREADY EXISTS AND IS PROVEN: it is the one
   `save a contract as a standard` takes — copy the wording into a NEW DRAFT
   COMPANY STANDARD and open the builder, published nowhere. This walks it from
   a built-in instead of from a signed contract.

   NO NEW SERVER ROUTE, and no new permission. POST /api/templates mints the
   template and its v1 draft; PUT …/versions/:vid writes the wording. Both
   already carry `paperMaker`, so who may write new paper is unchanged.

   THE BUILT-IN IS UNTOUCHED. It is rendered through a throwaway contract that
   is never saved, never given an id and never reaches state — the same probe
   the old function used, which was the one part of it that was right. */
function tplBuiltinBlocks(html){
  /* The server stores a block's content as a STRING (it String()s whatever
     arrives), so blocks are plain text — exactly as tplTextBlocks and
     tplRichBlocks do it for save-as-template. Sending an object here would
     store the characters "[object Object]" and look fine until somebody read
     the template. */
  const holder=document.createElement('div');
  holder.innerHTML=html;
  const out=[];
  const walk=el=>{
    for(const node of Array.from(el.children||[])){
      const tag=(node.tagName||'').toLowerCase();
      const text=(node.textContent||'').replace(/\s+/g,' ').trim();
      if(/^h[1-6]$/.test(tag)){ if(text) out.push({ blockType:'heading', content:text }); }
      else if(tag==='p'||tag==='li'||tag==='blockquote'||tag==='pre'){
        if(!text) continue;
        /* A paragraph carrying a blank is a field_group; the builder's own
           reading of what a drafter fills in. */
        out.push({ blockType:/\{\{[^}]+\}\}/.test(text)?'field_group':'fixed_text', content:text });
      }
      else walk(node);
    }
  };
  walk(holder);
  return out;
}
/* The rendered built-in, with its fill-in boxes turned into the blanks they
   stand for. Lifted from the retired function, which got this part right. */
function tplBuiltinDraftBody(bid){
  const t=TEMPLATES[bid]; if(!t) return null;
  const fields=templateFields(t).map(f=>({...f}));
  const probe=migrateContract({ id:'TPL-PREVIEW', name:t.name, template:bid, counterparty:'',
    value:0, valueType:t.valueType, folder:t.folder, status:'Draft', fields:{} });
  const holder=document.createElement('div');
  holder.innerHTML=docBody(probe);
  holder.querySelectorAll('.seal-in,[data-anchor="sig"]').forEach(el=>el.remove());
  holder.querySelectorAll('input,textarea').forEach(inp=>{
    const key=inp.getAttribute('data-field')||inp.getAttribute('data-sync')||'';
    const known=fields.find(f=>f.key===key);
    const span=document.createElement('span');
    span.textContent = known ? `{{${known.key}}}` : (key?`{{${key}}}`:'_____________');
    if(key && !known) fields.push({ key, label:key.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()),
      type:'text', maps:'', required:false, def:'', opts:[] });
    inp.replaceWith(span);
  });
  const html=holder.innerHTML;
  const used=bodyPlaceholders(html);
  return { name:t.name, folder:t.folder, html,
    blocks:tplBuiltinBlocks(html),
    fields:fields.filter(f=>used.includes(f.key)) };
}
async function tplMakeItOurs(bid){
  if(typeof window.newPaperBlock==='function' && window.newPaperBlock()) return;
  if(!tplCanManage()){ toast(i18t('lb_viewers_no_add'),'err'); return; }
  if(!API_MODE()){ toast(i18t('tl_needs_server'),'warn'); return; }
  const built=tplBuiltinDraftBody(bid);
  if(!built||built.blocks.length<2){ toast(i18t('lb_could_not_convert'),'err'); return; }
  try{
    const d=await api('templates','POST',{ name:built.name, category:'other',
      folder:built.folder||'', origin:'built_in_hati',
      description:i18t('lib_ours_desc',{name:built.name}) });
    const tid=d.template.id;
    /* POST answers with the template only, so the draft it just minted is
       read back rather than guessed at. */
    const det=await api('templates/'+tid);
    const draft=(det.versions||[]).find(v=>v.status==='draft');
    if(!draft) throw new Error(i18t('tl_edit_failed'));
    await api(`templates/${tid}/versions/${draft.id}`,'PUT',{
      blocks:built.blocks.map((b,i)=>({ ...b, orderIndex:i })),
      fields:built.fields.map((f,i)=>({ fieldKey:f.key, label:f.label||f.key, orderIndex:i,
        fieldType:'short_text', control:'free', required:!!f.required })),
    });
    if(typeof tplLibRefresh==='function') await tplLibRefresh();
    toast(i18t('lib_ours_made',{name:built.name}),'ok');
    if(window.openTemplateBuilder) openTemplateBuilder(tid,draft.id);
    else if(window.openTemplateLibDetail) openTemplateLibDetail(tid);
  }catch(e){ toast((e&&e.message)||i18t('tl_edit_failed'),'err'); }
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
    <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:var(--s-1)"><span style="color:var(--color-accent)">${icon('list','w-4 h-4')}</span>
      <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-page);margin:0">Create in bulk — ${_tplEsc(t.name||t.kind)}</h3></div>
    <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 var(--s-3);line-height:1.55">${i18t('lib_bulk_line', { n:TPL_BULK_MAX })}</p>
    <div style="display:flex;gap:var(--s-2);flex-wrap:wrap;margin-bottom:var(--s-3)">
      <button id="bk-csv" class="ui-btn" style="font-size:var(--t-meta);padding:5px 11px">${icon('download','w-3.5 h-3.5')} ${i18tn('lib_download_csv',fs.length,{n:fs.length})}</button>
      <label class="ui-btn" style="font-size:var(--t-meta);padding:5px 11px;cursor:pointer">${icon('upload','w-3.5 h-3.5')} Upload the filled sheet
        <input id="bk-file" type="file" accept=".csv" style="display:none"/></label>
    </div>
    <div id="bk-out" style="font-size:var(--t-meta);color:var(--color-neutral-700);min-height:20px"></div>
    <div style="display:flex;justify-content:flex-end;gap:var(--s-2);margin-top:14px">
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
          <div style="font-weight:var(--w-strong);color:var(--st-ruby-fg);margin-bottom:5px">${r.errors.length} problem${r.errors.length===1?'':'s'} found — <b>${i18t('lib_nothing_created')}</b>.</div>
          <div class="scroll-thin" style="max-height:200px;overflow-y:auto">
          ${Object.keys(byRow).sort((a,b)=>a-b).map(rn=>`<div style="padding:2px 0;color:var(--st-ruby-fg)">
            ${rn==='0'?`<b>${i18t('lib_sheet')}</b>`:`<b>Row ${rn}</b>`} — ${byRow[rn].map(er=>`${er.cell?`<i>${_tplEsc(er.cell)}</i>: `:''}${_tplEsc(er.msg)}`).join('; ')}</div>`).join('')}
          </div>
          <div style="margin-top:6px;color:var(--color-neutral-700)">${i18t('lib_fix_and_reupload')}</div></div>`;
        return;
      }
      ready=r.rows;
      out.innerHTML=`<div style="border:1px solid var(--color-divider);background:var(--st-steel-bg);border-radius:var(--radius);padding:9px 11px;color:var(--st-steel-fg)">
        <b>${r.rows.length} row${r.rows.length===1?'':'s'} checked, every cell valid.</b> ${i18t('lib_press')} <b>${i18t('lib_create_drafts')}</b> to file them all in one pass.
        <div style="margin-top:5px;color:var(--color-neutral-700);font-size:var(--t-label)">First few: ${r.rows.slice(0,3).map(x=>_tplEsc(x.name)).join(' · ')}${r.rows.length>3?` … and ${r.rows.length-3} more`:''}</div></div>`;
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
    : `<div style="font-size:var(--t-body);line-height:1.65;white-space:pre-wrap">${_tplEsc(body)}</div>`;
}
function openTemplatePreview(tpl){
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:var(--s-1)">
        <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-page);margin:0">${_tplEsc(tpl.name)}</h3>
        <span style="font-size:var(--t-label);color:var(--color-neutral-600)">${FOLDERS[tpl.folder]?.name||''}</span>
      </div>
      <p style="font-size:var(--t-label);color:var(--color-neutral-600);margin:0 0 10px">${tpl.chars?tpl.chars.toLocaleString()+' characters · ':''}added ${tpl.at?fmtDT(tpl.at):''} by ${_tplEsc(tpl.by||'—')}${templateFields(tpl).length?` · <b>${templateFields(tpl).length} blank${templateFields(tpl).length===1?'':'s'}</b>`:' · no blanks yet'}</p>
      ${templateFields(tpl).length?`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">${templateFields(tpl).map(f=>`<span style="font-size:var(--t-label);border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);padding:2px 7px;color:var(--color-neutral-700)"><b style="font-family:var(--font-mono)">${_tplEsc(f.key)}</b> ${_tplEsc(f.label)}${f.maps?` <span style="color:var(--accent-ink-700)">→ ${_tplEsc(tplMapLabel(f.maps))}</span>`:''}</span>`).join('')}</div>`:''}
      <div class="scroll-thin doc-surface" style="border:1px solid var(--color-divider);border-radius:0;background:var(--color-bg);padding:14px var(--s-4);max-height:55vh;overflow-y:auto">${_tplPreviewHtml(tpl)}</div>
      <div style="display:flex;justify-content:flex-end;gap:var(--s-2);margin-top:14px">
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
/* The pile a reader arrives on is what they can USE. 'all' put the whole
   filing cabinet in front of somebody looking for one piece of paper. */
let _tplPage={ group:'ready', stream:null, q:'', showAll:false };
/* ONE NUMBER, BOTH TABS: how many templates either tab shows before it says
   how many more there are. Written twice, the overview would offer "see all
   12 more" over a list that had already shown eight of them. */
const TPL_PAGE_CAP=8;
/* ---- THE OVERVIEW WALL NO LONGER CAPS ANYTHING (owner-asked 29 Aug 2026) ----
   TPL_OV_MAX and _tplOvFit measured how many of forty-seven TEMPLATE cards fit
   the reader's screen. The wall draws CATEGORY cards now — five libraries and
   one per value stream — a bounded handful that always draws in full, so there
   is nothing to withhold and nothing to measure. Both are STALE, along with
   _tplOvCols and tplOvSlice; flag any mention. TPL_PAGE_CAP above still governs
   the TABLE, which is what it was written for.
   rowsThatFit is untouched and still fills Home's decisions list. */
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
/* ════ THE RAIL IS WHAT YOU WANT TO DO (Young confirmed 18 Sep 2026) ═══════
   The rail used to be HaTi's own filing cabinet — Company standard,
   Counterparty paper, HaTi standard, Samples — which asks the reader to know
   how this product files things before it will show them anything. The piles
   above it are the questions somebody actually arrives with: what can I use,
   what have we started and not finished, what is going wrong.

   THE ORIGIN ROWS STAY, one group lower. They are a real second question
   ("show me only their paper"), and the overview's own cards narrow by them
   through tplGoBucket — deleting them would break four doors to gain nothing.
   ONE KEY holds either kind, so tplGoBucket is untouched. */
const TPL_PILES=['ready','writing','attention'];
/* Ready = paper you can draft a contract from right now. Writing = your own
   unfinished drafts. A sample is neither until it is imported, at which point
   it IS a counterparty template and answers as one. */
function tplRowPile(r){
  if(!r) return 'all';
  if(r.kind==='company') return r.draft?'writing':'ready';
  if(r.kind==='sample') return 'sample';
  return 'ready';
}
const tplRowWants=r=>!!(r&&_tplAttn[r.kind+':'+r.id]);
function tplPageFiltered(rows){
  const q=_tplPage.q.trim().toLowerCase();
  const g=_tplPage.group;
  const inGroup=r=>g==='all'||(g==='attention'?tplRowWants(r)
    :TPL_PILES.includes(g)?tplRowPile(r)===g
    :r.kind===g);
  return rows.filter(r=>inGroup(r)
    &&(!_tplPage.stream||r.stream===_tplPage.stream)
    &&(!q||`${r.name} ${r.sub} ${r.origin}`.toLowerCase().includes(q)));
}
/* Counted ONCE per render in renderTemplatesPage and read by the row builder —
   the Insights panels' own rule, counting is not drawing. A repaint on a search
   keystroke reuses it rather than walking every contract again. */
let _tplAttn={};
function tplPageRowHtml(r){
  const canManage=tplCanManage();
  const RULE='border-bottom:1px solid var(--color-divider)';
  const stripe=r.kind==='company'
    ?(r.draft?'var(--st-amber-dot)':'var(--st-green-dot)')
    :(r.stream?folderColor(r.stream):'var(--color-neutral-300)');
  const version=r.version==null?`<span style="color:var(--color-neutral-400)">—</span>`
    :r.mono?`<span style="font-family:var(--font-mono);font-size:var(--t-label);color:var(--color-neutral-500)">${_tplEsc(r.version)}</span>`
    :`<span style="font-weight:var(--w-title);color:var(--accent-ink-700)">${_tplEsc(r.version)}</span>`;
  const B='class="ui-btn" style="font-size:var(--t-meta);padding:var(--s-1) var(--s-3)"';
  const P='class="ui-btn ui-btn-primary" style="font-size:var(--t-meta);padding:var(--s-1) var(--s-3)"';
  /* ════ EVERY VERB IS VISIBLE AT REST (Young ruled it 19 Sep 2026) ══════════
     *"I do not want to have to hover over a contract in order to see the other
     choices I have as far as buttons."*

     THIS REVERSES 18 SEP'S "TWO VERBS AT REST, THE REST ON DEMAND" and the
     reasoning is kept beside it because it is the half that was wrong. That
     rule quietened the page by making the second and third verbs fade in on
     hover — thirty-seven rows times three buttons is ninety-nine controls —
     and traded away the thing a table is for: **a button you cannot see is a
     button you do not know exists**, and finding out cost a sweep of the mouse
     down the page. The page is quietened the other way instead: the rarer acts
     live behind the dots (see tplRowMoreMenu) and ONE verb per row is filled,
     so the row is scanned by weight rather than by count.

     `.tpl-rest` is STALE — its rule is gone from index.html and nothing here
     emits it.

     EDIT IS ONE PRESS AND ONE WORD. A draft's "Continue editing" and a live
     standard's "Edit" are the same act through the same door (tplLibEdit);
     the only difference is that a live one has its draft minted on the way. */
  let acts='';
  const dots=`<button data-tpl-dots="${_tplEsc(r.kind)}:${_tplEsc(r.id)}" class="ui-btn" style="font-size:var(--t-meta);padding:var(--s-1) 9px" aria-label="${_tplEsc(i18t('lib_more_for',{name:r.name}))}">⋯</button>`;
  if(r.kind==='company') acts=r.draft
    ?`<button data-tpllib-edit="${_tplEsc(r.id)}" ${P}>${i18t('lib_continue_editing')}</button>${dots}`
    :`${canManage?`<button data-tpllib-use="${_tplEsc(r.id)}" ${P}>${i18t('lib_use')}</button>`:''}${canManage?`<button data-tpllib-edit="${_tplEsc(r.id)}" ${B}>${i18t('act_edit')}</button>`:''}${dots}`;
  else if(r.kind==='cp') acts=`${canManage?`<button data-tpl-use="${_tplEsc(r.id)}" ${P}>${i18t('lib_use')}</button>`:''}<button data-tpl-prev="${_tplEsc(r.id)}" ${B}>${i18t('act_open')}</button>${canManage?dots:''}`;
  else if(r.kind==='builtin') acts=`${canManage?`<button data-tpl-builtin="${_tplEsc(r.id)}" ${P}>${i18t('lib_use')}</button>`:''}${canManage?`<button data-tpl-ours="${_tplEsc(r.id)}" ${B}>${i18t('lib_make_ours')}</button>`:''}${canManage?dots:''}`;
  else acts=r.imported
    ?`<span class="badge" style="background:var(--st-green-bg);color:var(--st-green-fg)"><span class="dot" style="background:var(--st-green-dot)"></span>${i18t('lib_imported')}</span>`
    :(canManage?`<button data-sample-imp="${r.i}" ${B}>${i18t('lib_import_as_template')}</button>`:'');
  return `<tr>
    <td style="padding:10px var(--s-2) 10px 14px;${RULE}">
      <div style="display:flex;gap:11px;align-items:flex-start">
        <span style="flex:none;width:4px;height:30px;border-radius:var(--radius);background:${stripe};margin-top:2px"></span>
        <div style="min-width:0">
          <div style="display:flex;align-items:center;gap:var(--s-2);min-width:0">
            <span style="font-size:var(--t-body);font-weight:var(--w-title);color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_tplEsc(r.name)}</span>
            ${r.draft?`<span style="flex:none;font-size:var(--t-figure);font-weight:var(--w-title);padding:1px 7px;border-radius:var(--radius);background:var(--st-amber-bg);color:var(--st-amber-fg)">Draft</span>`:''}
          </div>
          <div style="font-size:var(--t-label);color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px">${_tplEsc(r.sub)}</div>
          ${''/* ---- THE PROBLEM IS PRINTED ON THE THING THAT HAS IT (18 Sep 2026) ----
                It was a name in a panel on the OTHER tab: you read it there,
                then came here and found the row again. The reason is BORROWED
                from tplOverviewData — counted once per render into _tplAttn,
                never recomputed per row — so the two tabs cannot disagree
                about which template is in trouble or why. */}
          ${_tplAttn[r.kind+':'+r.id]?`<div style="font-size:var(--t-label);color:var(--st-ruby-fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">${_tplEsc(_tplAttn[r.kind+':'+r.id])}</div>`:''}
        </div>
      </div></td>
    <td style="padding:10px var(--s-2);${RULE};font-size:var(--t-meta);color:var(--color-neutral-600);white-space:nowrap">${_tplEsc(r.origin)}</td>
    <td style="padding:10px var(--s-2);${RULE};font-size:var(--t-meta);font-variant-numeric:tabular-nums">${version}</td>
    <td style="padding:10px var(--s-2);${RULE};font-size:var(--t-meta);font-variant-numeric:tabular-nums;color:var(--color-neutral-700)">${r.used==null?'—':r.used}</td>
    <td style="padding:10px 14px 10px var(--s-2);${RULE};white-space:nowrap"><div class="tpl-acts">${acts}</div></td>
  </tr>`;
}
/* ════ A FILTER REPAINTS THE ROWS, NOT THE PAGE (Young ruled it 19 Sep 2026)
   *"When I click across the different options it seems like it is clunky and
   there are delays in navigation."*

   MEASURED on one press of one rail row: the table the reader was looking at
   is **a different node** afterwards, and so are the rail, the counts, the
   search box and the whole OTHER TAB — invisible, behind `hidden`, and rebuilt
   anyway. The work itself is 4–10ms; what it costs is the page: a text
   selection, a focused control and the identity of every row go with it.

   AND A CORRECTION TO THIS NOTE'S FIRST DRAFT, because it claimed more than
   it had measured. It read "scroll 420 before, 0 after — the reader is thrown
   to the top". Driven properly across four presses, before and after, the
   scroll lands on the same number BOTH WAYS: the browser clamps it to
   whatever the new page can hold, and the handler's own `showAll=false`
   (untouched here, it predates this) is what makes the page shorter. One
   configuration happened to clamp to zero and the note generalised from it.
   The rebuild is the real fault and is what this fixes; the clamp is the
   same either way and is not claimed.

   This is THE CONTRACTS PAGE'S OWN RULE, which Templates never got: *a press
   that NAVIGATES may land at the top; a press that FILTERS, PAGES, SORTS or
   TOGGLES may not rebuild what the reader is looking at.*

   THE COUNTS ARE NOT REPAINTED, and that is not an omission. Every rail figure
   is a total over the whole book — `pile.ready` counts every ready template,
   not the filtered ones — so a filter cannot move one. If a rail count ever
   becomes a reading of the FILTERED set, it joins this funnel.

   ONE FUNNEL, so a third filter added later cannot go back to rebuilding. */
function tplPageRefilter(){
  const lit=(sel,attr,val)=>document.querySelectorAll(sel).forEach(b=>
    b.classList.toggle('on',b.getAttribute(attr)===val));
  lit('[data-tpl-group]','data-tpl-group',_tplPage.group);
  lit('[data-tpl-stream]','data-tpl-stream',_tplPage.stream);
  tplPagePaintRows();
}
function tplPagePaintRows(){
  const host=document.getElementById('tpl-rows'); if(!host) return;
  const all=tplPageRows();
  const rows=tplPageFiltered(all);
  const searching=!!_tplPage.q.trim()||_tplPage.group!=='all'||!!_tplPage.stream;
  const CAP=TPL_PAGE_CAP;
  const shown=(_tplPage.showAll||searching)?rows:rows.slice(0,CAP);
  const hidden=rows.length-shown.length;
  /* ---- THE HEAD OF A COUNT COLUMN SITS OVER ITS DIGITS (19 Sep 2026) ----
     Version and Used are counts and their cells already state
     `tabular-nums`; the heads did not, so the column read ragged even when
     every number under it was right. `num` is passed by the two count
     columns and by nothing else — a label over words stays a label. */
  const th=(t,num)=>`<th style="font-size:var(--t-figure);font-weight:var(--w-title);letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-500);text-align:left;padding:7px var(--s-2);border-bottom:1px solid var(--color-divider)${num?';font-variant-numeric:tabular-nums':''}">${t}</th>`;
  const hiddenKinds=hidden>0?Object.entries(rows.slice(CAP).reduce((m,r)=>{m[r.kind]=(m[r.kind]||0)+1;return m;},{}))
    /* Keyed on the KIND, not on the label's words — comparing the label to
       "Samples" stops being true the moment the label can be translated. */
    .map(([k,n])=>k==='sample'?i18tn('lib_sample_doc',n,{n}):`${n} ${TPL_GROUP_LABEL[k]}`).join(', '):'';
  const count=document.getElementById('tpl-count');
  if(count) count.textContent=i18tn('lib_count',rows.length,{n:rows.length});
  host.innerHTML=rows.length?`
    <div class="table-scroll"><table style="border-collapse:collapse;width:100%">
      <tr>${th(i18t('lib_col_template'))}${th(i18t('lib_col_origin'))}${th(i18t('lib_col_version'),1)}${th(i18t('lib_col_used'),1)}<th style="border-bottom:1px solid var(--color-divider)"></th></tr>
      ${shown.map(tplPageRowHtml).join('')}
    </table></div>
    ${hidden>0?`<div style="display:flex;align-items:center;padding:11px 14px;font-size:var(--t-meta);color:var(--color-neutral-600)">
      ${i18t('lib_more_kinds',{n:hidden,kinds:hiddenKinds})}<span style="flex:1"></span>
      <button id="tpl-showall" style="border:0;background:none;cursor:pointer;font:inherit;font-size:var(--t-meta);font-weight:var(--w-title);color:var(--accent-ink-700)">${i18t('lib_show_all')}</button></div>`:''}`
    :`<div style="padding:28px 14px;text-align:center;font-size:var(--t-meta);color:var(--color-neutral-600)">${i18t('lib_nothing_matches')}</div>`;
  // row verbs (rebound on every paint — the rows are rebuilt wholesale)
  host.querySelectorAll('[data-tpllib-use]').forEach(b=>b.addEventListener('click',()=>tplLibNewContract(b.getAttribute('data-tpllib-use'))));
  host.querySelectorAll('[data-tpllib-open]').forEach(b=>b.addEventListener('click',()=>openTemplateLibDetail(b.getAttribute('data-tpllib-open'))));
  host.querySelectorAll('[data-tpllib-edit]').forEach(b=>b.addEventListener('click',()=>{
    if(typeof tplLibEdit==='function') tplLibEdit(b.getAttribute('data-tpllib-edit'));
    else openTemplateLibDetail(b.getAttribute('data-tpllib-edit'));
  }));
  host.querySelectorAll('[data-tpl-use]').forEach(b=>b.addEventListener('click',()=>createFromCustomTemplate(b.getAttribute('data-tpl-use'))));
  host.querySelectorAll('[data-tpl-prev]').forEach(b=>b.addEventListener('click',()=>{ const t=customTemplates().find(x=>x.id===b.getAttribute('data-tpl-prev')); if(t) openTemplatePreview(t); }));
  host.querySelectorAll('[data-tpl-dots]').forEach(b=>b.addEventListener('click',()=>tplRowMoreMenu(b.getAttribute('data-tpl-dots'))));
  host.querySelectorAll('[data-tpl-ours]').forEach(b=>b.addEventListener('click',()=>tplMakeItOurs(b.getAttribute('data-tpl-ours'))));
  host.querySelectorAll('[data-tpl-builtin]').forEach(b=>b.addEventListener('click',()=>openWizard(b.getAttribute('data-tpl-builtin'))));
  host.querySelectorAll('[data-sample-imp]').forEach(b=>b.addEventListener('click',()=>importHatiSample(Number(b.getAttribute('data-sample-imp')), b)));
  document.getElementById('tpl-showall')?.addEventListener('click',()=>{ _tplPage.showAll=true; tplPagePaintRows(); });
}
/* The rarer verbs on a counterparty template, one … away: everything the old
   card offered, none of it stealing a column from every row. */
/* ════ ONE MENU, THE SAME ORDER ON EVERY KIND (18 Sep 2026) ════════════════
   Only the other side's paper had a ⋯ before, so the rarer acts existed for
   one kind of template and simply did not for the other three. The menu is
   built once now, and a row is drawn ONLY where it can actually work — a
   built-in has no version history of yours to show — but the order and the
   words never move, so the dots are never a surprise.

   A COMPANY STANDARD'S RARER ACTS LIVE ON ITS OWN PAGE, not in a second copy
   of them here: versions, rename and the shelf are what that page is for, and
   two places to archive a template is how two screens come to disagree. */
function tplRowMoreMenu(ref){
  const cut=String(ref||'').indexOf(':');
  const kind=cut<0?'':String(ref).slice(0,cut), tid=cut<0?String(ref||''):String(ref).slice(cut+1);
  const cp=kind==='cp'?customTemplates().find(x=>x.id===tid):null;
  const lib=kind==='company'?(((typeof tplLibAll==='function')?tplLibAll():{list:[]}).list||[]).find(x=>x.id===tid):null;
  const built=kind==='builtin'?TEMPLATES[tid]:null;
  if(!cp&&!lib&&!built) return;
  const name=(cp&&cp.name)||(lib&&lib.name)||(built&&built.name)||'';
  /* ════ A MENU LOOKS LIKE A MENU (Young ruled it 19 Sep 2026) ═════════════
     *"This pop up does not look like they are buttons or selections it looks
     like a written paper."* MEASURED on the real menu: every row drew
     `border: 0px none` on a transparent ground, 54px tall, in a 490px-wide
     frame — a bold line with a full sentence under it, nine times over. Set
     nine of those in a column and the eye reads PROSE, because nothing about
     them is shaped like a control.

     THREE THINGS CARRY IT NOW and none is new to the product: a SYMBOL from
     the shell's own sprite, ONE short verb, and a count where there is one.
     The sentences are not deleted — they move to `title`, which is where a
     menu's explanation belongs: there when you want it, silent when you do
     not. The destructive row sits under a divider in ruby.

     THE COUNT RIDES THE ROW, NOT THE VERB (`lib_m_versions (4)` was the verb
     and its count welded into one translated string). `<i>` is the count's
     own slot, so a row with none is the same shape as a row with one.

     WIDTH IS PART OF IT: `DLG_W.s` (400) rather than the 490 measured, because
     a menu as wide as a paragraph reads as a paragraph. */
  const sym=n=>`<svg class="tpl-m-i" viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const item=(id,ic,label,sub,n,danger)=>`<button id="${id}" type="button" title="${_tplEsc(sub||'')}"${danger?' style="color:var(--st-ruby-fg)"':''} class="tpl-m-row">
    ${sym(ic)}<b>${label}</b>${n==null?'':`<i>${n}</i>`}</button>`;
  /* ---- EVERY ROW'S ACT IS NAMED ONCE (19 Sep 2026) ----
     The listeners below used to be the only statement of what a row does, so
     the single-row shortcut further down would have needed a second copy of
     each — and two statements of one act is how they drift. `ACT` names them,
     the wiring presses them, and the shortcut runs the same function. */
  const ACT={
    'tm-vers':   ()=>{ closeModal(); openTemplateLibDetail(tid); },
    'tm-meta':   ()=>{ closeModal(); openTemplateLibDetail(tid); },
    'tm-shelf':  ()=>{ closeModal(); openTemplateLibDetail(tid); },
    'tm-vers-cp':()=>{ closeModal(); openTemplateVersions(tid); },
    'tm-edit':   ()=>{ closeModal(); openTemplateEditor(tid); },
    'tm-blanks': ()=>{ closeModal(); openBlanksEditor(tid); },
    'tm-bulk':   ()=>{ closeModal(); openBulkCreateModal(cp); },
    'tm-bulk-b': ()=>{ closeModal();
      if(!templateAllowedForRole(built.id,currentUser()?.role||'viewer')){ toast(i18t('lb_not_open_to_role'),'err'); return; }
      openBulkCreateModal(built); },
    'tm-del':    ()=>{ closeModal(); deleteTemplateGuarded(tid); },
  };
  const rows=[]; const ids=[];
  const push=(id,html)=>{ rows.push(html); ids.push(id); };
  if(lib) push('tm-vers',item('tm-vers','clock',i18t('lib_m_versions'),i18t('lib_m_versions_sub')));
  if(cp) push('tm-vers-cp',item('tm-vers-cp','clock',i18t('lib_m_versions'),i18t('lib_m_versions_sub'),templateVersions(cp).length+1));
  if(cp) push('tm-edit',item('tm-edit','edit',i18t('lib_m_edit'),i18t('lib_m_edit_sub')));
  if(cp) push('tm-blanks',item('tm-blanks','file',templateFields(cp).length?i18t('lib_m_blanks'):i18t('lib_m_blanks_add'),i18t('lib_m_blanks_sub'),templateFields(cp).length||null));
  if(lib) push('tm-meta',item('tm-meta','edit',i18t('lib_m_rename'),i18t('lib_m_rename_sub')));
  if(cp&&templateFields(cp).length) push('tm-bulk',item('tm-bulk','grid',i18t('lib_m_bulk'),i18t('lib_m_bulk_sub')));
  if(built) push('tm-bulk-b',item('tm-bulk-b','grid',i18t('lib_m_bulk'),i18t('lib_m_bulk_sub')));
  if(lib) push('tm-shelf',item('tm-shelf','import',i18t('lib_m_shelf'),i18t('lib_m_shelf_sub')));
  const sep=`<div class="tpl-m-sep"></div>`;
  if(cp) push('tm-del',sep+item('tm-del','bin',i18t('lib_m_delete'),i18t('lib_m_delete_sub'),null,1));
  const only=(rows.length===1)?ACT[ids[0]]:null;
  /* ════ A POP-UP WITH ONE ROW IN IT IS A BUTTON WEARING A COSTUME ════════
     (Young reported it 19 Sep 2026, off a built-in template's menu.) Every
     other row here is drawn only where it can work — a built-in has no version
     history of yours, no wording of yours to edit, no blanks and nothing to
     delete — so on that kind exactly ONE survives, and the reader pays two
     presses and a dialog to reach a single act.
     So where the menu would offer one thing, it offers it. No dialog, no
     Close, no second click: the row's own handler is run directly. The menu is
     unchanged for every kind that really has a choice to make. */
  if(rows.length===1 && only){ only(); return; }
  /* ════ AND IT WEARS THE HOUSE STYLE (the same report) ═══════════════════
     "Pop ups in the templates page are very bland. Add colouring or lines
     inside them." The heading was a line of text over a list, on a white
     ground, with nothing separating the two — while the send screen, the
     Before-you-sign card and the settings drawers all give a dialog head a
     rule under it and its subject a chip. This page never got that pass.
     NOTHING NEW IS INVENTED: an accent rule under the head (the product's own
     2px accent rule, the register's and the room's), and the template's
     category and value stream as the SAME chips its card on the page behind
     already wears — so the pop-up and the page it came from agree. */
  const t=cp||lib||built||{};
  const fold=(t.folder&&typeof FOLDERS!=='undefined')?FOLDERS[t.folder]:null;
  let catName=''; try{ catName=(typeof tplCategoryName==='function')?tplCategoryName(t.category):''; }catch(_){}
  /* THE STREAM CARRIES ITS OWN COLOUR — FOLDERS' `color` is this product's one
     source of truth for it, the same value the card's edge stripe, the map and
     the reports all read. The category is a filing fact and takes the neutral
     steel tone, because giving it a colour of its own would put two competing
     accents on one line. */
  const chips=(catName?`<span class="tpl-m-chip">${_tplEsc(catName)}</span>`:'')
    +(fold?`<span class="tpl-m-chip is-stream" style="--tpl-m-dot:${fold.color}">${_tplEsc(fold.name)}</span>`:'');
  openModal(`<div style="padding:var(--s-3) var(--s-2) var(--s-2)">
    <div class="tpl-m-head">
      <div class="tpl-m-name">${_tplEsc(name)}</div>
      ${chips?`<div class="tpl-m-chips">${chips}</div>`:''}
    </div>
    <div class="tpl-m-list">${rows.join('')}</div>
    <div style="display:flex;justify-content:flex-end;padding:var(--s-2) 10px 0"><button id="tm-close" class="ui-btn" style="font-size:var(--t-meta)">${i18t('act_close')}</button></div>
  </div>`,{maxWidth:DLG_W.s});
  document.getElementById('tm-close')?.addEventListener('click',closeModal);
  ids.forEach(id=>document.getElementById(id)?.addEventListener('click',ACT[id]));
}
/* ════ ONE BUTTON, ONE QUESTION, FIVE ANSWERS (Young confirmed 18 Sep 2026) ══
   The page carried TWO buttons at the top — "Convert a document" and
   "+ Build new template" — with three routes behind them, each landing
   somewhere different, and the second opened a dialog asking what KIND of
   paper this was before anybody had seen a word of it.

   THE HONEST QUESTION IS WHERE THE WORDS COME FROM. That is the only thing a
   person knows at this moment, and it decides everything else: a document you
   have, wording you paste, a contract already signed, one of HaTi's twelve, or
   nothing at all. The kind question disappears because the answer to this one
   settles it — a pasted counterparty draft is their paper, a blank page is
   ours — and the name is editable in the builder's own header afterwards.

   NOTHING NEW IS MINTED HERE. Every row presses a door that already existed
   and is already guarded; this is one screen in front of five of them. */
const TPL_SOURCES = [
  { k:'doc',    ic:'upload', get t(){ return i18t('lib_src_doc'); },    get d(){ return i18t('lib_src_doc_sub'); } },
  { k:'paste',  ic:'copy',   get t(){ return i18t('lib_src_paste'); },  get d(){ return i18t('lib_src_paste_sub'); } },
  { k:'signed', ic:'doc',    get t(){ return i18t('lib_src_signed'); }, get d(){ return i18t('lib_src_signed_sub'); } },
  { k:'hati',   ic:'copy',   get t(){ return i18t('lib_src_hati'); },   get d(){ return i18t('lib_src_hati_sub'); } },
  { k:'blank',  ic:'plus',   get t(){ return i18t('lib_src_blank'); },  get d(){ return i18t('lib_src_blank_sub'); } },
];
function tplNewMenu(){
  const lib=(typeof tplLibAll==='function')?tplLibAll():{canManage:false};
  const companyOk=API_MODE()&&lib.canManage;
  const npBlocked=(typeof newPaperBlocked==='function')&&newPaperBlocked();
  /* ---- ONLY THE DOORS THAT WRITE OUR OWN PAPER ARE GATED ----
     The first draft of this refused a source whenever `!companyOk`, which
     OVER-REFUSED: pasting or converting the other side's wording is importing,
     not writing, and openCreateTemplateModal takes it whatever the new-paper
     grant says. The rule names writing our own paper, so it is asked of the
     three doors that mint a company standard — blank, one of HaTi's, and a
     converted document — and of nothing else. `signed` is not here either:
     save-as-template carries templateManager, not paperMaker.
     Found by f331 (5), which exists to hold exactly this line. */
  const NEW_PAPER=['blank','hati','doc'];
  const row=(sc)=>{
    /* A source is drawn DEAD where its door cannot work, with the reason on
       it — never hidden, or the reader wonders what they are not being shown. */
    const off=NEW_PAPER.includes(sc.k)&&npBlocked;
    const why=off?i18t('np_refused_ask'):'';
    return `<button data-tpl-src="${sc.k}" class="tn-tile"${off?` disabled title="${_tplEsc(why)}"`:''}
      style="display:flex;gap:12px;width:100%;text-align:left;padding:13px 14px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;color:var(--color-text);cursor:${off?'not-allowed':'pointer'};opacity:${off?'.55':'1'};margin-bottom:8px">
      <span style="flex:none;width:30px;height:30px;border-radius:var(--radius);display:grid;place-items:center;background:var(--st-steel-bg);color:var(--st-steel-fg)">${icon(sc.ic,'w-4 h-4')}</span>
      <span style="flex:1;min-width:0">
        <span style="display:block;font-size:var(--t-body);font-weight:var(--w-title)">${_tplEsc(sc.t)}</span>
        <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.5">${_tplEsc(off?why:sc.d)}</span>
      </span></button>`;
  };
  openModal(`<div style="padding:24px">
    <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-section);margin:0 0 var(--s-1)">${i18t('lib_src_title')}</h3>
    <p style="margin:0 0 16px;font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.55">${i18t('lib_src_lead')}</p>
    ${TPL_SOURCES.map(row).join('')}
    <div style="display:flex;justify-content:flex-end;margin-top:14px"><button id="tn-close" class="ui-btn">${i18t('act_cancel')}</button></div>
  </div>`,{label:i18t('lib_src_title')});
  document.getElementById('tn-close')?.addEventListener('click',closeModal);
  document.querySelectorAll('[data-tpl-src]').forEach(b=>b.addEventListener('click',()=>{
    const k=b.getAttribute('data-tpl-src'); closeModal();
    if(k==='doc') return (companyOk&&typeof tplLibUploadModal==='function')?tplLibUploadModal():openCreateTemplateModal('upload');
    if(k==='paste') return openCreateTemplateModal('paste');
    if(k==='signed') return tplPickContract();
    if(k==='hati') return tplPickBuiltin();
    if(k==='blank') return companyOk?tplLibCreateModal():openCreateTemplateModal('paste');
  }));
}
/* The two pickers the sources need. Both read populations that already exist
   and press acts that already exist. */
function tplPickBuiltin(){
  const rows=Object.values(TEMPLATES).filter(t=>templateAllowedForRole(t.id,currentUser()?.role||'viewer'));
  tplPickList(i18t('lib_src_hati'),i18t('lib_pick_hati_lead'),
    rows.map(t=>({ id:t.id, name:t.name, sub:`${FOLDERS[t.folder]?.name||''}` })),
    id=>tplMakeItOurs(id));
}
function tplPickContract(){
  /* Newest first, and a contract with no wording is not offered — the act
     behind this refuses it anyway, and a door that lands on a refusal looks
     exactly like a broken one. */
  const rows=(state.contracts||[]).filter(c=>c&&(c.redlineText||(c.upload&&c.upload.extractedText)))
    .slice(0,40).map(c=>({ id:c.id, name:c.name||c.id, sub:`${c.id}${c.counterparty?' · '+c.counterparty:''}${c.status?' · '+c.status:''}` }));
  if(!rows.length){ toast(i18t('lib_pick_none'),'warn'); return; }
  tplPickList(i18t('lib_src_signed'),i18t('lib_pick_contract_lead'),rows,id=>{
    const c=(state.contracts||[]).find(x=>x.id===id); if(!c) return;
    if(typeof saveContractToLibrary==='function') saveContractToLibrary(c);
    else saveContractAsTemplate(c);
  });
}
function tplPickList(title,lead,rows,pick){
  openModal(`<div style="padding:24px">
    <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-section);margin:0 0 var(--s-1)">${_tplEsc(title)}</h3>
    <p style="margin:0 0 14px;font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.55">${_tplEsc(lead)}</p>
    <div style="max-height:320px;overflow:auto">${rows.map(r=>`<button data-tpl-pick="${_tplEsc(r.id)}"
      style="display:block;width:100%;text-align:left;padding:10px 12px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;color:inherit;cursor:pointer;margin-bottom:6px">
      <span style="display:block;font-size:var(--t-body);font-weight:var(--w-strong)">${_tplEsc(r.name)}</span>
      <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600)">${_tplEsc(r.sub)}</span></button>`).join('')}</div>
    <div style="display:flex;justify-content:flex-end;margin-top:14px"><button id="tp-close" class="ui-btn">${i18t('act_cancel')}</button></div>
  </div>`);
  document.getElementById('tp-close')?.addEventListener('click',closeModal);
  document.querySelectorAll('[data-tpl-pick]').forEach(b=>b.addEventListener('click',()=>{
    const id=b.getAttribute('data-tpl-pick'); closeModal(); pick(id); }));
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

/* ---- THE CARDS ARE THE CATEGORIES (owner-asked 29 Aug 2026) ----
   *"The cards should represent the categories in the attached so that you have
   a card for all templates and the respective metrics. You have a card for
   standard contracts, a card for warehousing etc."*

   THIS REVERSES THE MORNING'S FIRST ANSWER IN PLACE. That one read "segmented
   by library" as the template cards GROUPED under library headings; the owner's
   own picture is the table's rail, and what it asks for is a card PER BUCKET —
   one for the whole book, one per library, one per value stream — each carrying
   that bucket's metrics. So the wall stops being a card per template.

   THE BUCKETS ARE THE TABLE'S RAIL, exactly: the five library rows in the rail's
   own order, then every value stream it lists, in its order. A second
   vocabulary here is how the two tabs come to disagree about what a category
   is, and the rail is the thing the owner pointed at.

   A LIBRARY CARD AND THE 'ALL' CARD OVERLAP ON PURPOSE — All templates is the
   sum of the four beneath it, which is what the rail already shows and what a
   reader expects from a row called "All templates".

   THE LABEL IS READ AT DRAW TIME, never stored: TPL_GROUP_LABEL is a getter
   table for exactly this reason, and a stream's name comes off FOLDERS the same
   way, so a language change moves both. */
const TPL_OV_LIBS=['all','company','cp','builtin','sample'];
/* ONE ROLL-UP, and every bucket is measured the same way. The honesty rules are
   the template card's own, unchanged: the deviation rate's denominator is what
   a playbook has actually READ, and what it has not is stated rather than
   quietly folded in. Summing the rate itself would average an average; summing
   the two COUNTS and dividing once is the same arithmetic the single card does. */
function tplOvRoll(list){
  const cards=list||[];
  const scanned=cards.reduce((n,c)=>n+(c.scanned||0),0);
  const off=cards.reduce((n,c)=>n+(c.off||0),0);
  return { templates:cards.length,
    used:cards.reduce((n,c)=>n+(c.used||0),0),
    scanned, off,
    unscanned:cards.reduce((n,c)=>n+(c.unscanned||0),0),
    rate:scanned?(off/scanned):null };
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
    /* ---- A DRAFT IS WORK IN PROGRESS, NOT A FAULT (18 Sep 2026) ----
       This used to raise a row for every unfinished draft, which made the
       alarm list mostly somebody's own unfinished homework — measured on the
       owner's workspace, 19 of 37 templates were "wanting attention" and the
       reason on most of them was simply that nobody had published them yet.
       Drafts have their own pile in the rail now ("Being written"), so this
       list can mean what its name says: something is going wrong.
       `lib_ov_why_draft` stays in both books, inert, for the same reason
       retired sentences always do. */
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
  /* COUNTING IS NOT DRAWING (the Insights panels' own rule): the roll-up is
     taken here, off the one population, and tplOverviewHtml draws it and works
     nothing out.

     EVERY VALUE STREAM THE WORKSPACE LISTS GETS A CARD, including one holding
     nothing — the rail draws all of them and "have we any warehousing paper?"
     is answered better by a card saying none than by an absence the reader has
     to notice. It says so in its own words, through the same note the single
     card uses.

     THE WORKSPACE'S OWN PUBLISHED PAPER CARRIES NO STREAM (tplPageRows leaves
     it null and gives it a CATEGORY instead), so it lands in no stream card —
     which is exactly how the table's own stream filter behaves, and the two
     agreeing is the property that matters. */
  const bucket=(sec,key,id,tone,own)=>({ sec, key, id, tone, ...tplOvRoll(own) });
  /* A LIBRARY CARD WEARS ITS SHELF'S COLOUR (Young asked it of the artifact,
     20 Sep 2026: "Add color to the top of ... your Library cards in the
     templates tab", and the redesign order builds to that artifact). The
     stream cards have always carried the stream's own colour on the same 3px
     bar; the shelves take the product's own tones — the accent for the
     company's paper, amber for the other side's, steel for HaTi's, the
     Marketing stream's violet for the samples, the page ink for the whole
     shelf — read from tokens where a token exists. Reverses the 29 Aug "none
     on a library card" on the owner's later word. */
  const LIB_TONE={ company:'var(--accent-solid)', cp:'var(--st-amber-dot)', builtin:'var(--st-steel-dot)',
    sample:(typeof FOLDERS==='object'&&FOLDERS&&FOLDERS.mktg&&FOLDERS.mktg.color)||'var(--color-neutral-500)', all:'var(--color-text)' };
  const buckets=[
    ...TPL_OV_LIBS.map(k=>bucket('library', k, k, LIB_TONE[k]||null,
      k==='all' ? cards : cards.filter(c=>c.kind===k))),
    ...(typeof FOLDERS==='object' && FOLDERS ? Object.values(FOLDERS) : [])
      .map(f=>bucket('stream', 'stream:'+f.id, f.id,
        (typeof folderColor==='function')?folderColor(f.id):null,
        cards.filter(c=>c.stream===f.id))),
  ];
  return { cards, buckets, attention, attentionShown:attention.slice(0,5),
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

/* ════ HOW THE PAPER IS DOING (Young ruled it 19 Sep 2026) ═════════════
   *"You also have not implemented how the paper is doing tab which was part of
   my request."*

   ── AND IT HAS NO CALLER SINCE 19 SEP 2026 (Young: *"delete the templates
   overview page"*, option (a) of three). The tab went because the book's own
   glance already opens with this card's headline — *Came back changed* — and
   two tabs leading with one number is the fault this product keeps paying
   for. The four readings under that headline went with it, and the one the
   owner was told he was losing by name is *the clause they argue about most*,
   which nothing else in the product says.

   IT IS KEPT WHOLE AND UNREFERENCED, the way tplOverviewHtml beside it is
   kept: every reading deleted outright in this codebase is a reading somebody
   rebuilds from scratch a month later, worse. Two lines put it back — a tab
   button and a section — and `lib_tab_overview` is STALE ON THE FACE but
   live in both books for exactly that. Nothing here reads a route, so an
   unreferenced reading costs nothing but the lines it is written on.

   WHAT WAS THERE WAS A CATALOGUE. The wall counted what the workspace OWNS —
   one card per bucket, "All templates · Used 4 · Deviation rate —" — which
   answers "what have we got", a question the table beside it already answers
   better. It never said whether any of it WORKS.

   THE QUESTION HAS ONE HONEST ANSWER: **when we send our own paper out, how
   much of it comes back changed?** Every figure below is already on the
   record — a contract checked against Our standards records whether it
   followed them — so this READS and never measures: no route, no model, no
   spend, nothing written. COUNTING IS NOT DRAWING: everything is worked out
   here and tplHealthHtml draws it and computes nothing.

   THREE REFUSALS, each deliberate and each the reason a dashboard stays
   trustworthy:

     · **NO SCORE.** Not a rating out of ten, not a letter grade. A number a
       lawyer cannot re-derive from their own contracts is worse than a count
       they can press, and the moment it disagrees with their instinct they
       stop believing the whole page.
     · **NOTHING IS HIDDEN FOR THIN EVIDENCE.** A template with two contracts
       is SHOWN and says it has two, rather than being dropped for failing a
       floor — an absence a reader has to notice is worse than a stated one.
       `TPL_DEV_MIN` still governs what counts as an ALARM (it is the
       attention list's own floor), never what is drawn.
     · **NEVER-CHECKED IS NEVER COUNTED AS CLEAN.** It is its own grey band
       and its own tile. This is `fxMissing`'s rule applied to standards: what
       was left out is counted and SAID. Folding unread paper into the good
       half is how a dashboard starts lying, and it would flatter every
       template on the page. */
const TPL_HEALTH_ROWS = 8;
function tplHealthData(){
  const ov = tplOverviewData();
  /* OUR PAPER IS PAPER WE HAVE SENT. A sample has never left the building and
     a template nothing was drafted from cannot have come back at all, so
     neither is evidence either way — they are not counted, and the templates
     with nothing drafted from them are named in their own count so the
     absence is stated rather than silently dropped. */
  const live = ov.cards.filter(c => c.kind !== 'sample');
  const sent = live.filter(c => (c.used || 0) > 0);
  const idle = live.length - sent.length;
  /* ---- THE LIGHT LIST, ON THIS PAGE (found by driving it, 19 Sep 2026) ----
     `used` is the SERVER's count and `scanned + unscanned` is what this
     browser is actually holding, and in server mode those are different
     numbers: a template can read 38 drafted with none of the 38 loaded. A row
     built off `used` alone then drew an empty track and said "0 drafted, not
     checked", which is a sentence about the working set dressed as a fact
     about the book.

     So a row is only REPORTED ON where something is readable, and the rest
     are counted into `offBook` and SAID rather than dropped — the fxMissing
     rule again. tplOverviewData already carries `complete` for exactly this
     reason; this is the same honesty one level up. */
  const seenOf = c => c.scanned + c.unscanned;
  const readable = sent.filter(c => seenOf(c) > 0);
  const offBook = sent.length - readable.length;
  let checked = 0, changed = 0, unchecked = 0;
  for (const c of readable) { checked += c.scanned; changed += c.off; unchecked += c.unscanned; }
  /* WORST FIRST, AND "WORST" IS THE COUNT, NOT THE RATE. One contract out of
     one is a 100% rate and one argument; nine out of forty is 22% and nine.
     The rate rides each row so a reader can see both. */
  const rows = readable.slice().sort((a, b) =>
    (b.off - a.off) || ((b.rate || 0) - (a.rate || 0)) || String(a.name).localeCompare(String(b.name)));
  const top = rows.filter(r => r.off > 0);
  /* HOW FEW TEMPLATES ACCOUNT FOR HALF THE ARGUMENT. Walked rather than
     assumed: take them worst-first until their share passes half. Zero
     changes means zero templates, not "all of them". */
  let acc = 0, few = 0;
  for (const r of top) { if (acc * 2 >= changed) break; acc += r.off; few++; }
  const clean = readable.filter(c => c.scanned > 0 && c.off === 0);
  /* THE CLAUSE THEY ARGUE ABOUT MOST. A verdict carries its own `category`
     (see the playbook's positions), so this is a tally of what the standards
     check itself already decided — nothing is re-read and no wording is
     looked at. Counted per CONTRACT, so one contract arguing a category twice
     is one argument about it. */
  const byClause = new Map();
  const seenTpl = new Map();
  for (const r of ov.cards) {
    if (r.kind === 'sample') continue;
    let cs = [];
    try { cs = tplRowContracts(r) || []; } catch (_) { cs = []; }
    for (const c of cs) {
      const vs = c && c.playbook && Array.isArray(c.playbook.verdicts) ? c.playbook.verdicts : null;
      if (!vs) continue;
      const hit = new Set();
      for (const v of vs) {
        if (!v || (v.status !== 'deviation' && v.status !== 'missing')) continue;
        const k = String(v.category || '').trim(); if (!k) continue;
        hit.add(k);
      }
      for (const k of hit) {
        byClause.set(k, (byClause.get(k) || 0) + 1);
        if (!seenTpl.has(k)) seenTpl.set(k, new Set());
        seenTpl.get(k).add(r.kind + ':' + r.id);
      }
    }
  }
  const clauses = [...byClause.entries()]
    .map(([name, n]) => ({ name, n, tpls: (seenTpl.get(name) || new Set()).size }))
    .sort((a, b) => b.n - a.n || String(a.name).localeCompare(String(b.name)))
    .slice(0, TPL_HEALTH_ROWS);
  return {
    checked, changed, unchecked, idle,
    rate: checked ? changed / checked : null,
    few, fewShare: changed ? acc / changed : null,
    clean: clean.length,
    rows: rows.slice(0, TPL_HEALTH_ROWS),
    more: Math.max(0, rows.length - TPL_HEALTH_ROWS),
    clauses,
    sent: sent.length, readable: readable.length, offBook,
    complete: ov.complete !== false,
  };
}

/* Draws what tplHealthData worked out, and works out nothing itself. */
function tplHealthHtml(d){
  const CARD = 'background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)';
  const pct = v => v == null ? '—' : Math.round(v * 100) + '%';
  const tile = (tone, fig, figTone, cap, sub) => `<div style="${CARD};padding:13px 15px;border-top:3px solid ${tone}">
    <div style="font-size:26px;font-weight:var(--w-title);letter-spacing:-.02em;line-height:1.1;font-variant-numeric:tabular-nums${figTone ? ';color:' + figTone : ''}">${fig}</div>
    <div style="font-size:var(--t-label);color:var(--color-neutral-600);margin-top:3px">${cap}</div>
    <div style="font-size:var(--t-figure);color:var(--color-neutral-500);margin-top:6px;font-family:var(--font-mono)">${sub}</div></div>`;
  /* THE HEADLINE TAKES ITS INK FROM THE ATTENTION LIST'S OWN THRESHOLD, so a
     ruby figure here and a row in Needs attention can never mean different
     things. Nothing checked at all is not a good score — it is no score, and
     it draws in the plain shade with the reason under it. */
  const headTone = d.rate == null ? 'var(--color-divider)'
    : d.rate >= 0.5 ? 'var(--st-ruby-dot)' : d.rate > 0 ? 'var(--st-amber-dot)' : 'var(--st-green-dot)';
  const headInk = d.rate == null ? null
    : d.rate >= 0.5 ? 'var(--st-ruby-fg)' : d.rate > 0 ? null : 'var(--st-green-fg)';
  const tiles = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:var(--s-3)">
    ${tile(headTone, pct(d.rate), headInk, i18t('lib_h_rate_cap'),
        d.checked ? i18tn('lib_h_rate_sub', d.checked, { n: d.changed, of: d.checked }) : i18t('lib_h_rate_none'))}
    ${tile('var(--st-amber-dot)', d.few, null, i18tn('lib_h_few_cap', d.few, {}),
        d.fewShare == null ? i18t('lib_h_few_none') : i18t('lib_h_few_sub', { pct: Math.round(d.fewShare * 100) }))}
    ${tile('var(--st-green-dot)', d.clean, d.clean ? 'var(--st-green-fg)' : null, i18tn('lib_h_clean_cap', d.clean, {}), i18t('lib_h_clean_sub'))}
    ${tile('var(--color-divider)', d.unchecked, null, i18t('lib_h_unread_cap'), i18t('lib_h_unread_sub'))}
  </div>`;
  /* THE TRACK IS THE ROW'S OWN POPULATION, in three parts that always sum to
     it: came back changed, accepted as written, never checked. A zero part
     draws nothing rather than a hairline nobody can see. */
  const track = r => {
    const total = r.scanned + r.unscanned;
    const w = n => total ? (n / total * 100) : 0;
    const seg = (n, col) => n > 0 ? `<i style="display:block;height:100%;width:${w(n)}%;background:${col}"></i>` : '';
    return `<div style="height:7px;background:var(--color-neutral-200);border-radius:4px;overflow:hidden;display:flex">
      ${seg(r.off, 'var(--st-ruby-dot)')}${seg(r.scanned - r.off, 'var(--st-green-dot)')}${seg(r.unscanned, 'var(--color-neutral-300)')}</div>`;
  };
  const verdict = r => r.scanned === 0
    ? `<span style="color:var(--color-neutral-500)">${i18tn('lib_h_v_unread', r.unscanned, { n: r.unscanned })}</span>`
    : r.off === 0
      ? `<span style="color:var(--st-green-fg)">${i18t('lib_h_v_clean', { n: r.scanned })}</span>`
      : `<span style="color:${r.rate >= 0.5 ? 'var(--st-ruby-fg)' : 'var(--color-text)'};font-weight:${r.rate >= 0.5 ? 'var(--w-strong)' : 'var(--w-body)'}">${i18t('lib_h_v_changed', { n: r.off, of: r.scanned })}</span>`;
  const row = r => `<button data-tpl-ov-card="1" data-tpl-ov-name="${_tplEsc(r.name)}" class="tpl-h-row">
    <span class="tpl-h-nm"><b>${_tplEsc(r.name)}</b><small>${_tplEsc(r.origin)}${r.version ? ' · ' + _tplEsc(r.version) : ''}</small></span>
    <span>${track(r)}</span>
    <span class="tpl-h-v">${verdict(r)}</span></button>`;
  const HEAD = `display:flex;align-items:baseline;gap:var(--s-2);padding:10px 14px;border-bottom:1px solid var(--color-divider)`;
  const arg = d.rows.length ? `<div style="${CARD};overflow:hidden">
    <div style="${HEAD}"><b style="font-size:var(--t-card);font-weight:var(--w-strong)">${i18t('lib_h_where')}</b>
      <span style="margin-left:auto;font-size:var(--t-label);color:var(--color-neutral-500);font-family:var(--font-mono)">${i18t('lib_h_worst_first')}</span></div>
    ${d.rows.map(row).join('')}
    <div style="display:flex;gap:var(--s-4);flex-wrap:wrap;padding:9px 14px;border-top:1px solid var(--color-divider);font-size:var(--t-figure);color:var(--color-neutral-600);font-family:var(--font-mono)">
      <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px;background:var(--st-ruby-dot)"></i>${i18t('lib_h_lg_changed')}</span>
      <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px;background:var(--st-green-dot)"></i>${i18t('lib_h_lg_kept')}</span>
      <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px;background:var(--color-neutral-300)"></i>${i18t('lib_h_lg_unread')}</span>
      ${d.more ? `<span style="margin-left:auto">${i18t('lib_h_more', { n: d.more })}</span>` : ''}
    </div></div>` : `<div style="${CARD};padding:24px 14px;text-align:center;font-size:var(--t-meta);color:var(--color-neutral-600)">${i18t('lib_h_nothing_sent')}</div>`;
  const clauses = d.clauses.length ? `<div style="${CARD};overflow:hidden">
    <div style="${HEAD}"><b style="font-size:var(--t-card);font-weight:var(--w-strong)">${i18t('lib_h_clauses')}</b>
      <span style="margin-left:auto;font-size:var(--t-label);color:var(--color-neutral-500);font-family:var(--font-mono)">${i18t('lib_h_clauses_sub')}</span></div>
    ${d.clauses.map(c => `<div class="tpl-h-row tpl-h-flat">
      <span class="tpl-h-nm"><b>${_tplEsc(c.name)}</b><small>${i18tn('lib_h_cl_tpls', c.tpls, { n: c.tpls })}</small></span>
      <span></span>
      <span class="tpl-h-v"><span style="color:var(--color-text)">${i18tn('lib_h_cl_times', c.n, { n: c.n })}</span></span></div>`).join('')}
  </div>` : '';
  /* TWO ABSENCES, TWO SENTENCES. Nothing drafted from it is a fact about the
     template; nothing of its paper loaded here is a fact about this browser.
     Reading one as the other is how a working set starts reporting as a book. */
  const lines = [
    d.idle ? i18tn('lib_h_idle', d.idle, { n: d.idle }) : '',
    d.offBook ? i18tn('lib_h_offbook', d.offBook, { n: d.offBook }) : '',
  ].filter(Boolean);
  const note = lines.length
    ? `<p style="margin:0;font-size:var(--t-label);color:var(--color-neutral-600)">${lines.join(' ')}</p>` : '';
  return `<div style="display:grid;gap:var(--s-4)">${tiles}${arg}${clauses}${note}</div>`;
}

/* ════ ONE CARD BUILDER, TWO SCREENS (19 Sep 2026) ════════════════════
   These were closures inside tplOverviewHtml. The book (tplBookHtml) draws
   the same buckets in a different arrangement, and a second copy of this
   markup is exactly how two screens come to disagree about what a bucket's
   figures are — THE CLOTHES FOLLOW THE BUILDER. Lifted whole, not rewritten:
   every declaration and every note below is the wall's own. */
const TPL_OV_CARD='background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg,var(--radius));box-shadow:var(--shadow-sm)';
const TPL_OV_HEAD='font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-600)';
const TPL_OV_LBL='font-size:var(--t-label);font-weight:var(--w-body);color:var(--color-neutral-600);line-height:1.45';
const TPL_OV_FIG='font-size:var(--t-card);font-weight:var(--w-title);font-variant-numeric:tabular-nums;line-height:1.3;margin-top:1px';

/* RUBY IS THE ATTENTION RULE'S OWN THRESHOLD — a red figure on the card and
   a row in Needs attention are the same finding, or the page argues with
   itself. Amber is a rate worth noticing that has not earned the alarm;
   green is the demo's own answer for a low one. */
function tplOvRateInk(c){
  if(c.rate==null) return 'var(--color-neutral-400)';
  if(c.scanned>=TPL_DEV_MIN&&c.rate>=0.5) return 'var(--st-ruby-fg)';
  if(c.rate>=0.25) return 'var(--st-amber-fg)';
  return 'var(--st-green-fg)';
}
function bucketStreamName(b){
  return tplShortStream((typeof FOLDERS==='object'&&FOLDERS&&FOLDERS[b.id]||{}).name)||b.id;
}
function tplOvBucketLabel(b){
  return b.sec==='stream' ? bucketStreamName(b) : (TPL_GROUP_LABEL[b.key]||b.key);
}
/* AND A BUCKET WITH NOTHING IN IT SAYS THAT rather than "nothing has been
   drafted from it", which is a checking gap reported on paper that does not
   exist. */
function tplOvBucketNote(b){
  if(b.templates===0) return i18t('lib_ov_bucket_empty');
  if(b.rate==null) return b.used===0
    ? i18t('lib_ov_bucket_unused') : i18t('lib_ov_bucket_not_checked');
  const first=b.off===0
    ? i18tn('lib_ov_all_clear',b.scanned,{n:b.scanned})
    : i18tn('lib_ov_off_standard',b.scanned,{off:b.off,n:b.scanned});
  return b.unscanned>0?`${first} ${i18tn('lib_ov_unchecked',b.unscanned,{n:b.unscanned})}`:first;
}

/* ---- THE CARD IS A CATEGORY (owner-asked 29 Aug 2026) ----
   The 3px tone bar, the name with its count at the right, a hairline, the two
   figures under quiet labels, the line that qualifies them.

   THE TONE BAR IS THE STREAM'S OWN COLOUR and a library card carries none:
   only the value streams wear a swatch there, which is the owner's own
   picture. A bar that said nothing on five cards would be a mark for a fact
   the section heading already carries.

   THERE IS NO META LINE. The section above the card says whether this is a
   library or a value stream, and the count is on the name's own line, so a
   third line would be one of those facts printed twice. */
function tplOvCardHtml(b){
  return `<button class="tpl-ov-card" data-tpl-ov-bucket="${_tplEsc(b.key)}"
      title="${_tplEsc(i18t('lib_ov_open_in_list'))}"
      style="${TPL_OV_CARD};display:flex;flex-direction:column;align-items:stretch;width:100%;text-align:left;font:inherit;color:inherit;cursor:pointer;padding:0;overflow:hidden"
      onmouseover="this.style.borderColor='var(--accent-solid)'" onmouseout="this.style.borderColor='var(--color-divider)'">
      <span style="display:block;height:3px;background:${b.tone||'transparent'}"></span>
      <span style="display:block;padding:13px 14px 0">
        <span class="tpl-ov-count" style="float:right;margin-left:10px;${TPL_OV_FIG};color:var(--color-neutral-500)"
          title="${_tplEsc(i18tn('lib_ov_head',b.templates,{n:b.templates}))}">${b.templates}</span>
        <span class="tpl-ov-name" style="display:block;font-size:var(--t-body);font-weight:var(--w-title);color:var(--color-text)">${_tplEsc(tplOvBucketLabel(b))}</span>
      </span>
      <span style="display:flex;gap:18px;margin:11px 14px 0;padding-top:11px;border-top:1px solid var(--color-divider);clear:both">
        <span style="flex:1;min-width:0">
          <span style="display:block;${TPL_OV_LBL}" title="${i18t('lib_ov_used_title')}">${i18t('lib_ov_used')}</span>
          <span style="display:block;${TPL_OV_FIG};color:var(--color-text)">${b.used}</span>
        </span>
        <span style="flex:1;min-width:0">
          ${''/* A LABEL THAT NEEDS EXPLAINING SAYS SO ON ITS OWN HOVER. */}
          <span style="display:block;${TPL_OV_LBL}" title="${i18t('lib_ov_dev_rate_title')}">${i18t('lib_ov_dev_rate')}</span>
          <span style="display:block;${TPL_OV_FIG};color:${tplOvRateInk(b)}">${b.rate==null?'—':Math.round(b.rate*100)+'%'}</span>
        </span>
      </span>
      <span class="tpl-ov-note" style="display:block;padding:9px 14px 13px;${TPL_OV_LBL}">${_tplEsc(tplOvBucketNote(b))}</span>
    </button>`;
}
function tplOvAttRowHtml(a){
  return `<button data-tpl-ov-card="${_tplEsc(a.id)}" data-tpl-ov-name="${_tplEsc(a.name)}"
    style="display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--color-divider);background:none;cursor:pointer;font:inherit;color:inherit;padding:var(--s-2) 2px"
    onmouseover="this.style.background='color-mix(in srgb,var(--color-text) 5%,transparent)'" onmouseout="this.style.background='none'">
    <span style="display:block;font-size:var(--t-meta);font-weight:var(--w-strong);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_tplEsc(a.name)}</span>
    <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.45">${_tplEsc(a.why)}</span></button>`;
}
function tplOvBarRowHtml(c, peak){
  const w=peak?Math.max(6,Math.round(c.recent/peak*100)):0;
  return `<button data-tpl-ov-card="${_tplEsc(c.id)}" data-tpl-ov-name="${_tplEsc(c.name)}"
      style="display:block;width:100%;text-align:left;border:0;background:none;cursor:pointer;font:inherit;color:inherit;padding:6px 2px">
      <span style="display:flex;align-items:baseline;gap:var(--s-2)">
        <span style="flex:1;min-width:0;font-size:var(--t-meta);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_tplEsc(c.name)}</span>
        <span style="flex:none;font-size:var(--t-meta);font-weight:var(--w-title);font-variant-numeric:tabular-nums">${c.recent}</span>
      </span>
      <span style="display:block;height:6px;margin-top:var(--s-1);background:var(--color-neutral-100)">
        <span style="display:block;height:6px;width:${w}%;background:var(--accent-solid)"></span></span></button>`;
}
/* THE TWO PANELS, built once. The wall stacks them in its right-hand column
   and the book lays them side by side; what they SAY is the same reading. */
function tplOvPanelsHtml(d){
  const EMPTY='font-size:var(--t-meta);line-height:1.6;color:var(--color-neutral-600);margin:0';
  return `<div class="tpl-ov-panels" style="display:grid;gap:var(--s-3)">
    <section id="tpl-ov-attention" style="${TPL_OV_CARD};padding:14px">
      <div style="${TPL_OV_HEAD};margin-bottom:var(--s-2)">${i18t('lib_ov_attention')}</div>
      ${d.attentionShown.length?d.attentionShown.map(tplOvAttRowHtml).join(''):`<p style="${EMPTY}">${i18t('lib_ov_attention_none')}</p>`}
      ${d.attentionMore>0?`<p style="${EMPTY};margin-top:var(--s-2)">${i18tn('lib_ov_more',d.attentionMore,{n:d.attentionMore})}</p>`:''}
    </section>
    <section id="tpl-ov-mostused" style="${TPL_OV_CARD};padding:14px">
      <div style="${TPL_OV_HEAD};margin-bottom:var(--s-2)">${i18t('lib_ov_most_used',{n:d.days})}</div>
      ${d.mostUsed.length?d.mostUsed.map(c=>tplOvBarRowHtml(c,d.peak)).join(''):`<p style="${EMPTY}">${i18t('lib_ov_most_used_none',{n:d.days})}</p>`}
    </section>
  </div>`;
}

/* ════ THE BOOK — the card wall, in HaTi's own grammar (Young ruled it
   ════ 19 Sep 2026, off "The Template Book" artifact) ═══════════════════
   The overview tab answers *how is the paper doing*. This answers the other
   question the old wall was always really answering — **what have we got** —
   and it answers it in the product's own section grammar rather than as
   eleven cards in one undifferentiated run.

   THE GRAMMAR IS js/section.js AND NOT A SECOND COPY OF IT. CLAUDE.md says
   that grammar is the contract room's first tab and nothing else, and that a
   second screen takes it ONLY on the owner's word. This is that word. What
   comes with it is the whole rule set: name the group, a shut group still
   answers, open what is acted on.

   THREE THINGS FROM THE ARTIFACT WERE NOT BUILT, and each is a question this
   codebase already has an answer to:
     · A BADGE ON EACH LIBRARY CARD saying "Ours" / "Theirs" / "Built in". The
       section above the card already says which library this is and the card
       is already named "Company standard" — the badge is that fact a third
       time, twelve pixels away.
     · A DRAWER ON PRESSING A CARD, showing the figures and then a door onto
       the list. Every figure in it is already ON the card, and the door is
       the card's own. A second door onto an act that has one is the refusal
       this product paid for most often.
     · A META LINE under the name. The 29 Aug note on the card says why there
       is none and it is still true.

   COUNTING IS NOT DRAWING: every figure here is tplOverviewData's, read and
   never recomputed. */
const TPL_BOOK_SECS = ['library', 'stream', 'wants'];
function tplBookHtml(d){
  /* THE GLANCE — three figures, no card and no band.
     These are facts about the page the reader is already on, so the cheapest
     channel that carries them is the page itself: a label over a value, HaTi's
     own shape, with an em-dash where there is nothing to say.

     AND THE CAVEAT SITS UNDER THE FIGURE IT QUALIFIES. The old wall printed it
     as a line at the foot of the whole page, where it explained a number the
     reader had stopped looking at. It is not a band and must not become one:
     a strip across the page is an alarm, and this is a footnote. */
  const pct = v => v == null ? '—' : Math.round(v * 100) + '%';
  const rate = d.checked ? (d.cards.reduce((n, c) => n + c.off, 0) / d.checked) : null;
  const ink = rate == null ? 'var(--color-neutral-400)'
    : (d.checked >= TPL_DEV_MIN && rate >= 0.5) ? 'var(--st-ruby-fg)'
    : rate >= 0.25 ? 'var(--st-amber-fg)' : 'var(--st-green-fg)';
  const fig = (label, value, unit, tone, note) => `<div class="tpl-gl">
    <p class="tpl-gl-l">${label}</p>
    <p class="tpl-gl-v"${tone ? ` style="color:${tone}"` : ''}>${value}${
      unit ? `<small>${unit}</small>` : ''}</p>${
      note ? `<p class="tpl-gl-n">${note}</p>` : ''}</div>`;
  const glance = `<div class="tpl-glance">
    ${fig(i18t('lib_bk_have'), d.total, i18tn('lib_bk_u_tpl', d.total), null, '')}
    ${fig(i18t('lib_bk_drafted'), d.cards.reduce((n, c) => n + (c.used || 0), 0),
       i18t('lib_bk_u_contracts'), null, '')}
    ${fig(i18t('lib_bk_changed'), pct(rate), rate == null ? '' : '', ink,
       d.checked ? i18t('lib_bk_over', { checked: d.checked, open: d.unchecked })
                 : i18t('lib_bk_over_none'))}
  </div>`;

  /* The wall's own cards, cut by section. One builder, two callers — the
     buckets already carry which section they belong to. */
  const wall = sec => `<div class="tpl-ov-cards" style="display:grid;gap:var(--s-3)">${
    d.buckets.filter(b => b.sec === sec).map(tplOvCardHtml).join('')}</div>`;

  const secs = [];
  /* RULE 1 · NAME THE GROUP. RULE 3 · OPEN WHAT IS ACTED ON, reference opens
     shut — the library is what a reader came for and the streams are the
     same templates cut a second way, so the second one rests closed. */
  secs.push(sectionHtml({
    key: 'tpl.book.library', title: i18t('lib_bk_library'), flat: true,
    summary: i18t('lib_bk_library_sum', { n: TPL_OV_LIBS.length, t: d.total }),
    body: wall('library'),
  }));
  /* RULE 2 · A SHUT GROUP STILL ANSWERS. The head names the worst stream and
     its figure, so a reader who never opens it has still been told. */
  /* A SHUT SECTION'S SUMMARY MAY ONLY NAME A WORST WHERE THE SAMPLE EARNS IT.
     `TPL_DEV_MIN` is the attention list's own floor, and without it a stream
     with ONE contract checked and that one changed is announced on the head
     as the worst in the book at 100% — a headline over a sample of one.
     Below the floor the head counts the streams and says nothing else. */
  const streams = d.buckets.filter(b =>
    b.sec === 'stream' && b.rate != null && b.scanned >= TPL_DEV_MIN);
  const worst = streams.slice().sort((a, b) => b.rate - a.rate)[0];
  secs.push(sectionHtml({
    key: 'tpl.book.stream', title: i18t('lib_bk_streams'), flat: true, open: false,
    summary: worst
      ? i18t('lib_bk_streams_sum', { n: d.buckets.filter(b => b.sec === 'stream').length,
          name: bucketStreamName(worst), pct: Math.round(worst.rate * 100) })
      : i18tn('lib_bk_streams_plain', d.buckets.filter(b => b.sec === 'stream').length,
          { n: d.buckets.filter(b => b.sec === 'stream').length }),
    body: wall('stream'),
  }));
  secs.push(sectionHtml({
    key: 'tpl.book.wants', title: i18t('lib_bk_wants'), flat: true,
    summary: i18tn('lib_bk_wants_sum', d.attention.length, { n: d.attention.length }),
    body: tplOvPanelsHtml(d),
  }));
  return `<div class="tpl-book">${glance}${secs.join('')}</div>`;
}

/* A SECTION PRESS REPAINTS THE BOOK AND NOTHING ELSE — yesterday's lesson in
   its own costume: a press that FOLDS may not rebuild the page the reader is
   looking at. The section element itself survives, because sectionWire's one
   listener is bound to it and rebuilding it would take the listener with it. */
function tplBookRepaint(){
  const host=document.querySelector('[data-tpl-sec="book"]');
  if(!host) return;
  host.innerHTML=tplBookHtml(tplOverviewData());
}

function tplOverviewHtml(d){
  /* ---- THE CARD, THE ROWS AND THE PANELS ARE LIFTED (19 Sep 2026) ----
     Everything this function used to build inline now lives above it at
     module scope, because the book tab draws the same buckets and two copies
     of that markup is how two screens come to disagree. The arrangement below
     is this wall's own and is unchanged: the two rail captions, one grid so
     every card is one width, and the two panels in a right-hand column. */
  const HEAD=TPL_OV_HEAD;
  /* ---- TWO SECTIONS, THE RAIL'S OWN ----
     Library first, then Value stream, under the rail's own two captions and
     read through the same keys, so the wall and the rail cannot come to call a
     category by different names. The heading spans the wall (grid-column:1/-1)
     so ONE grid governs every card's width — a grid per section would draw
     wider cards in the shorter one.

     NOTHING IS WITHHELD AND THERE IS NO "N MORE". This wall is a bounded
     handful of summary cards rather than a card per template, so the fit that
     used to decide how many of 47 to show has nothing to decide — see the
     note at tplOvFit, which is why it now stands down. */
  const SECTIONS=[['library','lib_library'],['stream','lib_value_stream']];
  const bandHtml=key=>`<div class="tpl-ov-band" style="grid-column:1/-1;display:flex;align-items:baseline;gap:var(--s-2);margin:var(--s-2) 0 0">
    <span style="${HEAD}">${i18t(key)}</span></div>`;
  const buckets=Array.isArray(d.buckets)?d.buckets:[];
  const wall=SECTIONS.map(([sec,key])=>{
    const own=buckets.filter(b=>b.sec===sec);
    return own.length ? bandHtml(key)+own.map(tplOvCardHtml).join('') : '';
  }).join('');
  return `
  <div class="tpl-ov" style="display:grid;gap:var(--s-4);align-items:start">
    <div>
      <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:10px">
        <span style="font-size:var(--t-meta);color:var(--color-neutral-600)">${i18tn('lib_ov_head',d.total,{n:d.total})}</span>
        <span style="font-size:var(--t-meta);color:var(--color-neutral-600)">·</span>
        <span style="font-size:var(--t-meta);color:var(--color-neutral-600)">${i18t('lib_ov_coverage',{checked:d.checked,open:d.unchecked})}</span>
      </div>
      <div class="tpl-ov-cards" id="tpl-ov-cards" style="display:grid;gap:var(--s-3)">${wall}</div>
    </div>
    ${tplOvPanelsHtml(d)}
  </div>`;
}

/* THE TAB IS PER SITTING, IN MEMORY — the Settings page's own rule: a stored
   tab lands a reader somewhere unrelated a week later. */
/* THE BOOK JOINS THE ROW (Young ruled it 19 Sep 2026, off "The Template Book"
   artifact), AND THE OVERVIEW LEAVES IT THE SAME DAY (Young: *"delete the
   templates overview page"*). TWO TABS, TWO QUESTIONS: the book answers WHAT
   HAVE WE GOT, the list is the list. */
const TPL_PAGE_TABS=['book','list'];
let _tplPageTab=null;
/* ---- THE LANDING IS THE FIRST TAB, WHICH IS THE BOOK (Young ruled it
   20 Sep 2026: *"when you Navigate to the templates page, you should First
   Land in the first tab which in this case its The Book"*) ----

   THIS REVERSES 18 SEP 2026, whose reasoning is kept below because it is what
   makes the reversal safe rather than a swing back: it says the overview
   "carries 44 pressable things and not ONE of them is a verb", and landing a
   reader on a screen that cannot act is the cost. THE SCREEN THAT ARGUMENT WAS
   ABOUT NO LONGER EXISTS — the overview tab was deleted on 19 Sep and the BOOK
   replaced it, and the book's cards are doors: each one presses `tplGoBucket`,
   which lands on the table already narrowed to that bucket. The tab a reader
   arrives on now answers "what have we got" AND carries the way to the verbs.

   IT READS `TPL_PAGE_TABS[0]`, NEVER THE WORD 'book'. The owner's ruling is
   "the first tab", so the fallback is the list's own first entry — reorder the
   row and the landing follows it, with no second place to remember.

   It read: THE LANDING IS THE LIBRARY (Young confirmed 18 Sep 2026). THIS
   REVERSES 25 AUG 2026, which asked for "Templates overview" to be the first
   tab. Both tabs stay and the overview keeps everything it reads; what changes
   is which one you arrive on. MEASURED on the running page: the overview
   carries 44 pressable things and not ONE of them is a verb — Use, Open, Edit,
   blanks, bulk, versions and delete all live on the other tab, by its own
   design ("the overview acts on nothing"). Landing a reader on the one screen
   in the section that cannot do anything is the cost this reverses. */
function tplPageTab(){ return TPL_PAGE_TABS.includes(_tplPageTab)?_tplPageTab:TPL_PAGE_TABS[0]; }
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

/* ---- AND A CATEGORY CARD LANDS ON ITS OWN NARROWING ----
   (owner-asked 29 Aug 2026, with the card wall.) The template cards narrowed
   the table by NAME through the search box; a CATEGORY narrows it by the
   table's own two filters — the library rail and the stream rail — which is
   what those cards are made of.

   THE NARROWING SAYS SO AND OFFERS THE WAY BACK BY CONSTRUCTION, exactly as
   the search box did: the rail draws the pressed row lit, and "All templates"
   at the top of it is the way back. The search box is CLEARED, so the two
   narrowings can never stack into a list nobody can explain.

   ONE KEY, PARSED ONCE: 'stream:<id>' is a stream and anything else is a
   library, which is the shape the data hands over. An unknown key falls
   through to the whole book rather than to an empty table — a door that lands
   on nothing looks exactly like a broken one. */
function tplGoBucket(key){
  const k=String(key||'');
  const stream=k.startsWith('stream:')?k.slice(7):null;
  _tplPage.q='';
  _tplPage.stream=stream;
  _tplPage.group=stream?'all':(['all','company','cp','builtin','sample'].includes(k)?k:'all');
  _tplPage.showAll=false;
  tplPageSetTab('list');
  const box=document.getElementById('tpl-search'); if(box) box.value='';
  /* THE RAIL IS WHAT SAYS WHICH NARROWING IS ON, so it is repainted with the
     rows. renderTemplatesPage rebuilds the page and re-reads _tplPage, which
     is what lights the pressed rail row. */
  renderTemplatesPage();
}

/* ---- THE FIT STANDS DOWN, AS A STUB RATHER THAN A DELETION ----
   It measured how many template cards fitted and redrew the wall to fill the
   screen. The wall is category cards now and every one of them draws, always,
   which fills the screen better than any slice of them did. It is left as a
   named no-op because it is published on window and called from
   renderTemplatesPage — this file's own convention, so a third caller cannot
   bring a cap back through a door nobody remembered. */
function tplOvFit(){}
function renderTemplatesPage(){
  const rows=tplPageRows();
  const counts=rows.reduce((m,r)=>{m[r.kind]=(m[r.kind]||0)+1;return m;},{});
  const total=rows.length;
  const lib=(typeof tplLibAll==='function')?tplLibAll():{canManage:false,loaded:true};
  const canManage=tplCanManage();
  const tab=tplPageTab();
  const ov=tplOverviewData();
  _tplAttn=Object.fromEntries((ov.attention||[]).map(a=>[a.kind+':'+a.id,a.why]));
  /* Counted off the SAME rows the table draws, so a pile's number and its
     list can never disagree. */
  const pile={ ready:0, writing:0, attention:0 };
  for(const r of rows){ const k=tplRowPile(r); if(k in pile) pile[k]++; if(tplRowWants(r)) pile.attention++; }
  /* The count takes its own ink where the pile means something is owed —
     amber for work started, ruby for something going wrong — and the plain
     label shade everywhere else. A live pile keeps the accent, as it did. */
  /* ════ WHICH ROW IS LIT IS A CLASS, NEVER AN INLINE COLOUR (19 Sep 2026)
     It was three inline declarations computed at BUILD time from
     `_tplPage.group`, which is why pressing a filter had to rebuild the whole
     page to restyle one button — see tplPageRefilter. As a class the lit
     state is a flip, and `.on` can then be moved by a painter that touches
     nothing else. The tone a count takes when its pile is NOT live is still
     the caller's (amber for work started, ruby for something wrong), so it
     rides as a custom property the class can override. */
  const railIt=(key,label,n,tone)=>`<button data-tpl-group="${key}" class="tpl-rail${_tplPage.group===key?' on':''}"${tone&&n?` style="--tpl-rail-n:${tone}"`:''}>
    <span style="flex:1">${label}</span><span class="tpl-rail-n">${n}</span></button>`;
  const streamIt=f=>`<button data-tpl-stream="${f.id}" class="tpl-rail tpl-rail-s${_tplPage.stream===f.id?' on':''}">
    <span style="flex:none;width:8px;height:14px;border-radius:var(--radius);background:${folderColor(f.id)}"></span><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_tplEsc(tplShortStream(f.name))}</span></button>`;
  const HEAD='font-family:var(--font-mono);font-size:var(--t-figure);letter-spacing:.12em;color:var(--color-neutral-500);text-transform:uppercase;padding:0 11px;margin:0 0 6px';
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
      <h1 style="margin:0;align-self:flex-start;font-family:var(--font-heading);font-size:20px;font-weight:var(--w-title);letter-spacing:-.01em;color:var(--color-text);line-height:1.2">${i18t('nav_templates')}</h1>
      <span style="flex:1"></span>
      ${''/* ONE BUTTON. "Convert a document" was a sibling of "+ New template"
             and is not a sibling act — it is one of five ways to answer the
             same question, which the one door now asks. `lib_convert_document`
             is STALE on this page and stays in both books, inert. */}
      ${canManage?`<button id="tpl-new" class="ui-btn ui-btn-primary" style="font-size:var(--t-meta);padding:6px 14px"${
        ((typeof newPaperBlocked==='function'&&newPaperBlocked())?` disabled title="${esc(i18t('np_refused'))+' '+esc(i18t('np_refused_ask'))}"`:'')
      }>${i18t('lib_new_template')}</button>`:''}
    </div>
    <div class="st-tabs" role="tablist" style="margin-bottom:14px">
      ${''/* "Templates overview" was HERE and is gone (19 Sep 2026). See the
             note on tplHealthData: the card it drew is kept, unreferenced. */}
      <button class="st-tab${tab==='book'?' on':''}" data-tpl-tab="book" role="tab" aria-selected="${tab==='book'?'true':'false'}">${i18t('lib_tab_book')}</button>
      <button class="st-tab${tab==='list'?' on':''}" data-tpl-tab="list" role="tab" aria-selected="${tab==='list'?'true':'false'}">${i18t('nav_templates')}</button>
    </div>

    ${''/* TWO SECTIONS, NOT THREE. The health card (tplHealthHtml) and the
           card wall (tplOverviewHtml) are both still built and both have no
           caller — see the note above tplHealthData for why neither was
           deleted. */}

    ${''/* THE BOOK. ONE READING: `ov` is tplOverviewData's answer, already
           taken above for the attention list the table's rows print, and
           read here rather than asked for a second time. */}
    <section data-tpl-sec="book" ${tab==='book'?'':'hidden'}>${tplBookHtml(ov)}</section>

    <section data-tpl-sec="list" ${tab==='list'?'':'hidden'}>
    <div class="tpl-cols" style="display:grid;gap:var(--s-4);align-items:start">
      <div>
        <div style="${HEAD}">${i18t('lib_show_me')}</div>
        ${railIt('ready',i18t('lib_pile_ready'),pile.ready)}
        ${railIt('writing',i18t('lib_pile_writing'),pile.writing,'var(--st-amber-fg)')}
        ${railIt('attention',i18t('lib_pile_attention'),pile.attention,'var(--st-ruby-fg)')}
        ${railIt('all',TPL_GROUP_LABEL.all,total)}
        <div style="${HEAD};margin-top:var(--s-4)">${i18t('lib_where_from')}</div>
        ${railIt('company',TPL_GROUP_LABEL.company,counts.company||0)}
        ${railIt('cp',TPL_GROUP_LABEL.cp,counts.cp||0)}
        ${railIt('builtin',TPL_GROUP_LABEL.builtin,counts.builtin||0)}
        ${railIt('sample',TPL_GROUP_LABEL.sample,counts.sample||0)}
        <div style="${HEAD};margin-top:var(--s-4)">${i18t('lib_value_stream')}</div>
        ${Object.values(FOLDERS).map(streamIt).join('')}
        <!-- Our standards used to hang off this rail, because the clause
             library and playbook had no door of their own. They have one now,
             under Administration, and a governance screen with two homes is
             the fault WO N1 removed — so the rail no longer carries it. -->
      </div>
      <div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);overflow:hidden">
        <div style="display:flex;align-items:center;gap:var(--s-3);padding:var(--s-3) 14px;border-bottom:1px solid var(--color-divider)">
          <input id="tpl-search" type="search" placeholder="${i18t('lb_search_templates')}" autocomplete="off" value="${_tplEsc(_tplPage.q)}"
            style="flex:none;width:min(320px,50%);border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);padding:7px var(--s-3);font:inherit;font-size:var(--t-meta);color:inherit;outline:none"/>
          <span id="tpl-count" style="font-size:var(--t-label);color:var(--color-neutral-500)"></span>
        </div>
        <div id="tpl-rows" style="overflow-x:auto"></div>
      </div>
    </div>
    </section>
  </div>`;
  tplPagePaintRows();
  tplOvFit();
  /* THE SECTION GRAMMAR'S ONE LISTENER, bound to the book's own host so a
     press on a section head repaints THIS page and nothing else. The grammar
     does not guess at a painter; the caller hands it one. */
  sectionWire(document.querySelector('[data-tpl-sec="book"]'), tplBookRepaint);
  document.querySelectorAll('[data-tpl-tab]').forEach(b=>b.addEventListener('click',()=>tplPageSetTab(b.getAttribute('data-tpl-tab'))));
  /* Every door on the overview lands on the same one: the table, narrowed to
     the template that was pressed. A card, an attention row and a bar are
     three drawings of one act, so they share one handler and one selector. */
  document.querySelectorAll('[data-tpl-ov-card]').forEach(b=>b.addEventListener('click',()=>tplGoList(b.getAttribute('data-tpl-ov-name'))));
  /* THE WALL'S CARDS ARE CATEGORIES and narrow by the table's own rails; the
     two panels beside them still name single templates and still narrow by
     name. Two doors because they are two acts, not because they drifted. */
  document.querySelectorAll('[data-tpl-ov-bucket]').forEach(b=>b.addEventListener('click',
    ()=>tplGoBucket(b.getAttribute('data-tpl-ov-bucket'))));
  document.getElementById('tpl-ov-all')?.addEventListener('click',()=>{
    _tplPage.q=''; _tplPage.group='all'; _tplPage.stream=null; _tplPage.showAll=true;
    tplPageSetTab('list');
    const box=document.getElementById('tpl-search'); if(box) box.value='';
    tplPagePaintRows();
  });
  document.querySelectorAll('[data-tpl-group]').forEach(b=>b.addEventListener('click',()=>{
    _tplPage.group=b.getAttribute('data-tpl-group'); _tplPage.showAll=false; tplPageRefilter(); }));
  document.querySelectorAll('[data-tpl-stream]').forEach(b=>b.addEventListener('click',()=>{
    const v=b.getAttribute('data-tpl-stream');
    _tplPage.stream=_tplPage.stream===v?null:v; tplPageRefilter(); }));
  document.getElementById('tpl-search')?.addEventListener('input',e=>{ _tplPage.q=e.target.value; tplPagePaintRows(); });
  document.getElementById('tpl-new')?.addEventListener('click',tplNewMenu);
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
  const CARD='background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:var(--radius-lg)';
  const canEditLib=isAdmin()||currentUser()?.role==='legal';

  // portfolio deviations (from the existing playbook review results)
  const devRows=state.contracts
    .map(c=>({c, s:(window.deviationSummary?deviationSummary(c):null)}))
    .filter(x=>x.s&&(x.s.dev+x.s.miss)>0)
    .sort((a,b)=>(b.s.dev+b.s.miss)-(a.s.dev+a.s.miss)).slice(0,8);
  const devHtml=devRows.length?devRows.map(x=>`
    <button data-dev-open="${x.c.id}" style="display:flex;align-items:center;gap:var(--s-2);width:100%;padding:6px 2px;border:0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 7%,transparent);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit" onmouseover="this.style.background='color-mix(in srgb,var(--color-text) 5%,transparent)'" onmouseout="this.style.background='none'">
      <span style="flex:1;min-width:0">
        <span style="display:block;font-size:var(--t-meta);font-weight:var(--w-body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${x.c.name}</span>
        <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600)">${x.c.id} · ${x.c.counterparty||'—'}</span>
      </span>
      <span class="badge" style="background:var(--st-amber-bg);color:var(--st-amber-fg);flex:none">${x.s.dev+x.s.miss} deviation${x.s.dev+x.s.miss===1?'':'s'}</span>
    </button>`).join('')
    :`<p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0;line-height:1.6">${i18t('lib_no_deviations')} <b>${i18t('lib_copilot_review')}</b> ${i18t('lib_from_workspace')}</p>`;

  const tab=pbPageTab();
  /* PINNED, LIKE TEAM & SETTINGS (Young ruled 18 Sep 2026: "Similar to the team
     and settings page, the page should scroll behind the tab line"). The class
     is the opt-in and the rule is in index.html; the Templates page's own
     .st-tabs row is deliberately NOT opted in — it was not asked for. */
  const tabRow=`<div class="st-tabs st-tabs-pin" role="tablist">${PB_PAGE_TABS.map(k=>
    `<button class="st-tab${k===tab?' on':''}" data-pb-tab="${k}" role="tab" aria-selected="${k===tab?'true':'false'}">${esc(i18t(PB_TAB_LABEL[k]))}</button>`).join('')}</div>`;

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:var(--page-pad)">
    ${''/* THE STANDARDS PAGE'S OWN CLOTHES, WRITTEN IN THE PAGE. It is
          thrown away the moment the reader leaves, so it cannot quietly
          repaint a screen that has not asked for it — the register's own
          precedent, painting its own element for its own reason. */}
    <style>
      .std-row{border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-surface);padding:8px 10px}
      .std-row.is-open{border-color:color-mix(in srgb,var(--accent-solid) 34%,transparent)}
      .std-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .std-cat{font-size:var(--t-micro);font-weight:var(--w-title);text-transform:uppercase;letter-spacing:.09em;color:var(--color-neutral-600);flex:none}
      .std-name{font-size:var(--t-meta);font-weight:var(--w-title);color:var(--color-text);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .std-chip{font-size:var(--t-micro);font-weight:var(--w-title);padding:1px 7px;border-radius:var(--radius);white-space:nowrap;flex:none}
      .std-chip-none{color:var(--color-neutral-600);border:1px solid var(--color-divider)}
      .std-open{font-size:var(--t-label);font-weight:var(--w-title);color:var(--accent-ink);background:none;border:0;padding:2px 4px;cursor:pointer;font-family:inherit;flex:none}
      .std-open:hover{text-decoration:underline}
      ${''/* ONE LINE, CLIPPED BY WIDTH — owner's ruling 2. Never a character
            count: a cut counted in characters ends mid-word at whatever the
            column happens to be, and reads as a broken product rather than
            as a sentence that continues. */}
      .std-clip{margin:4px 0 0;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .std-body{margin:9px 0 2px;display:flex;flex-direction:column;gap:9px}
      .std-lab{margin:0 0 3px;font-size:var(--t-micro);font-weight:var(--w-title);text-transform:uppercase;letter-spacing:.09em;color:var(--color-neutral-600)}
      .std-quote{font-size:var(--t-label);line-height:1.6;color:var(--color-text);border-left:2px solid var(--color-divider);padding:2px 0 2px 10px;white-space:pre-wrap}
      .std-none{margin:0;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.6}
      .std-hist{margin:0;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.6}
      .std-acts{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid var(--color-divider);padding-top:8px}
      .std-acts button{font-size:var(--t-label);font-weight:var(--w-title);color:var(--accent-ink);background:none;border:0;padding:0;cursor:pointer;font-family:inherit}
      .std-acts button:hover{text-decoration:underline}
      .std-acts button.warn{color:var(--danger)}
    </style>
    ${tabRow}
    <p id="pb-tabsub" class="st-tabsub">${esc(i18t(PB_TAB_SUB[tab]))}</p>

    ${''/* The card headings retired with the tabs — a card titled with the
          word on the pressed tab twelve pixels above is the same word twice.
          The meta line and the controls stay: they carry what the tab
          cannot (who may edit, and the Add clause door). */}
    <section data-pb-sec="clauses" ${tab==='clauses'?'':'hidden'} style="${CARD};padding:var(--s-4)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <span style="font-size:var(--t-label);color:var(--color-neutral-600)">${i18t('lib_fallback_wording')} · ${canEditLib?i18t('lib_admin_legal_edit'):i18t('lib_read_only_role')}</span>
        <span style="flex:1"></span>
        ${canEditLib?`<button id="cl-add" class="ui-btn ui-btn-primary" style="font-size:var(--t-meta);padding:5px var(--s-3)">${icon('plus','w-3.5 h-3.5')} ${i18t('lib_add_clause')}</button>`:''}
      </div>
      <!-- idea 21: what your own signed contracts say, offered only where
           this workspace has never saved a standard of its own. It LEADS,
           because on that workspace it is the thing worth doing first. -->
      <div id="standards-draft" class="empty:hidden" style="margin-bottom:10px"></div>
      <div id="clause-lib" style="display:flex;flex-direction:column;gap:var(--s-2)"></div>
      <!-- W3-2: what the workspace's own settled rounds say the fallback
           should be. Empty (and undrawn) until there is real history. -->
      <div id="precedent-panel" class="empty:hidden" style="margin-top:10px"></div>
    </section>

    <section data-pb-sec="playbook" ${tab==='playbook'?'':'hidden'} style="${CARD};padding:var(--s-4)">
      <div id="playbook-view"></div>
    </section>

    <section data-pb-sec="deviations" ${tab==='deviations'?'':'hidden'} style="${CARD};padding:var(--s-4)">
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
    /* AND IT LANDS AT THE TOP OF THE TAB IT OPENED. Until the row was pinned
       this came for free: reaching a tab meant already being at the top. Now a
       tab can be pressed from the bottom of a long clause library, and a press
       that NAVIGATES may land at the top — this is three different lists.
       stLandTop is the settings page's own reading (js/views/settings.js),
       asked through window because that module is not on every stage. */
    if(typeof stLandTop==='function') stLandTop();
  }));
  setActiveNav('playbook');
}

Object.assign(window,{tplOvFit,HATI_SAMPLES,openBlanksEditor,_tplPreviewHtml,_tplSourceLabel,_richSelection,_richReplaceRange,
  templateVersionNo,templateVersions,templateUsage,templateUsageLabel,saveTemplateVersion,
  openTemplateEditor,openTemplateVersions,deleteTemplateGuarded,tplMakeItOurs,tplBuiltinDraftBody,openBulkCreateModal,openTemplateFillModal,buildFromCustomTemplate,updateTemplateRecord,createFromCustomTemplate,customTemplates,importHatiSample,openTemplatePreview,openCreateTemplateModal,openUploadTemplateModal,renderPlaybookPage,renderTemplatesPage,tplOverviewData,tplOverviewHtml,tplHealthData,tplHealthHtml,TPL_HEALTH_ROWS,tplPageRefilter,tplRowContracts,tplBookHtml,tplBookRepaint,TPL_BOOK_SECS,tplOvCardHtml,tplOvPanelsHtml,tplOvRateInk,bucketStreamName,tplPageTab,tplPageSetTab,tplGoList,tplGoBucket,tplOvRoll,TPL_PAGE_TABS,tplRowPile,tplRowWants,TPL_PILES,tplRowMoreMenu,tplPageRowHtml,tplPageFiltered,saveContractAsTemplate,saveCustomTemplates,saveTemplateRecord});
