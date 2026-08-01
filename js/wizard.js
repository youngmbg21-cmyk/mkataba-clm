// HaTi — E6 template variables + guided creation wizard. Globals window-attached.

/* ---- template variables (E6-T3) ----
   Each template exposes a small set of named variables with Kenyan-sensible
   defaults. `field` maps to a docBody field id (c.fields[id]); the special
   keys counterparty/value/effDate/expiry write to the contract directly. */
const TEMPLATE_PRIMARY = {
  RM:{field:'material', label:'Material supplied', ph:'e.g. refined sugar', def:''},
  PK:{field:'packType', label:'Packaging type', ph:'e.g. PET bottles & preforms', def:''},
  CM:{field:'product', label:'Product manufactured', ph:'e.g. powdered beverages', def:''},
  EQ:{field:'equipment', label:'Equipment', ph:'e.g. filling line', def:''},
  WH:{field:'site', label:'Warehouse / site', ph:'e.g. Nairobi DC', def:''},
  FF:{field:'region', label:'Distribution region', ph:'e.g. a named region or county', def:''},
  DA:{field:'territory', label:'Distributor territory', ph:'e.g. Coast region', def:''},
  RL:{field:'channel', label:'Retail channel', ph:'e.g. modern trade', def:''},
  MK:{field:'services', label:'Services', ph:'e.g. media & activation', def:''},
  ND:{field:null, label:null},
  LE:{field:'premises', label:'Premises', ph:'e.g. Industrial Area depot', def:''},
  PS:{field:'services', label:'Services', ph:'e.g. audit & advisory', def:''},
};
/* The wizard now reads the SAME field schema custom templates use
   (templateFields → js/templatefields.js), so one shape drives the wizard, the
   preview and bulk creation. Kept as templateVars() because callers use it. */
function templateVars(tid){
  const t=TEMPLATES[tid]; if(!t) return [];
  return templateFields(t).map(f=>({ ...f,
    def: f.key==='effDate' && !f.def ? new Date().toISOString().slice(0,10) : (f.def||'') }));
}

/* ---- role gating (E6-T4): which templates each role may self-serve ---- */
function templateRoles(){ return (state.settings&&state.settings.templateRoles)||{}; }
function templateAllowedForRole(tid, role){
  if(role==='viewer') return false;               // viewers never create
  if(role==='admin') return true;
  const cfg=templateRoles()[tid];
  if(!cfg) return true;                            // default: open to legal too
  return cfg.includes(role);
}
function myCreatableTemplates(){
  const role=currentUser()?.role||'viewer';
  return Object.values(TEMPLATES).filter(t=>templateAllowedForRole(t.id, role));
}

/* ---- guided creation wizard ---- */
function openWizard(preTid){
  if(!canEdit()){ toast('Viewers cannot create contracts','err'); return; }
  const tmpls=myCreatableTemplates();
  if(!tmpls.length){ toast('No templates are open to your role','err'); return; }
  let tid=preTid&&tmpls.some(t=>t.id===preTid)?preTid:null;
  const renderStep=()=>{
    if(!tid){
      openModal(`<div style="padding:22px 24px;">
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:18px;color:var(--color-text);margin:0 0 3px;">New contract from a template</h3>
        <p style="font-size:12px;color:var(--color-neutral-600);margin:0 0 16px;line-height:1.5;">Pick a template, answer a few details, and HaTi drafts it for you.</p>
        <div class="scroll-thin" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;max-height:55vh;overflow-y:auto;">
          ${tmpls.map(t=>`<button data-wz-tid="${t.id}" style="text-align:left;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:12px;cursor:pointer;transition:border-color .15s,box-shadow .15s;" onmouseover="this.style.borderColor='var(--color-accent)';this.style.boxShadow='var(--shadow-sm)'" onmouseout="this.style.borderColor='var(--color-divider)';this.style.boxShadow='none'">
            <span style="display:flex;align-items:center;gap:8px;"><span style="width:28px;height:28px;display:grid;place-items:center;border-radius:4px;background:var(--color-accent-100);color:var(--color-accent);flex:none;">${icon(t.ic||'file','w-3.5 h-3.5')}</span>
            <span style="font-size:13px;font-weight:600;color:var(--color-text);font-family:var(--font-mono);">${t.kind}</span></span>
            <span style="display:block;margin-top:5px;font-size:11px;color:var(--color-neutral-600);line-height:1.4;">${t.blurb||''}</span></button>`).join('')}
        </div></div>`);
      document.querySelectorAll('[data-wz-tid]').forEach(b=>b.addEventListener('click',()=>{ tid=b.getAttribute('data-wz-tid'); renderStep(); }));
      return;
    }
    const t=TEMPLATES[tid], vars=templateVars(tid);
    const input=v=>{ const id='wz-'+String(v.key).replace(/[:]/g,'_');
      const lbl=`<span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.02em;">${v.label}${v.required?' <span style="color:#8f322b">*</span>':''}${v.maps?`<span style="font-weight:400;color:var(--color-neutral-500);text-transform:none;letter-spacing:0"> → ${tplMapLabel(v.maps)}</span>`:''}</span>`;
      if(v.type==='select') return `<label style="display:block;">${lbl}
        <select id="${id}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 11px;font-size:13px;color:var(--color-text);outline:none;">
          ${(v.opts||[]).map(o=>`<option value="${String(o).replace(/"/g,'&quot;')}" ${v.def===o?'selected':''}>${o}</option>`).join('')}</select></label>`;
      const it=v.type==='date'?'date':(v.type==='num'?'number':'text');
      return `<label style="display:block;">${lbl}
        <input id="${id}" type="${it}" value="${String(v.def||'').replace(/"/g,'&quot;')}" placeholder="${v.ph||''}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 11px;font-size:13px;font-family:var(--font-body);color:var(--color-text);outline:none;"/></label>`; };
    openModal(`<div style="padding:22px 24px;">
      <button id="wz-back" style="font-size:11px;color:var(--color-accent-700);font-weight:600;font-family:var(--font-mono);background:none;border:0;cursor:pointer;margin-bottom:8px;padding:0;">← templates</button>
      <h3 style="font-family:var(--font-heading);font-weight:600;font-size:18px;color:var(--color-text);margin:0 0 3px;">${t.kind}</h3>
      <p style="font-size:12px;color:var(--color-neutral-600);margin:0 0 16px;line-height:1.5;">${t.blurb||''}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">${vars.map(input).join('')}
        ${''/* ASKED HERE, WHERE YOU ARE ALREADY NAMING THEM, AND NOWHERE ELSE.
               The templates carry the counterparty's NAME; nothing carried the
               address, so it was collected later — by a strip in the
               negotiation room, and again by the share dialog when you pressed
               Send. Three times for one fact, in one sitting. Once it is on the
               contract the strip never appears and the send goes straight out. */}
        <label style="display:block;">
          <span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.02em;">Their email<span style="font-weight:400;color:var(--color-neutral-500);text-transform:none;letter-spacing:0"> → so you can send it to them</span></span>
          <input id="wz-cpemail" type="email" placeholder="them@company.co.ke" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 11px;font-size:13px;font-family:var(--font-body);color:var(--color-text);outline:none;"/></label>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;">
        <button id="wz-cancel" class="ui-btn">Cancel</button>
        <button id="wz-create" class="ui-btn ui-btn-primary">Create draft</button>
      </div></div>`);
    document.getElementById('wz-back').addEventListener('click',()=>{ tid=null; renderStep(); });
    document.getElementById('wz-cancel').addEventListener('click',closeModal);
    document.getElementById('wz-create').addEventListener('click',()=>createFromWizard(tid, vars));
  };
  renderStep();
}
function createFromWizard(tid, vars){
  const t=TEMPLATES[tid], u=currentUser();
  const val=k=>{ const el=document.getElementById('wz-'+String(k).replace(/[:]/g,'_')); return el?el.value.trim():''; };
  // validate before creating anything — the same rules bulk creation uses
  const values={}; const errs=[];
  for(const f of vars){ const raw=val(f.key); const e=validateField(f, raw); if(e) errs.push(e); else values[f.key]=raw; }
  // A contract whose term runs backwards is a typo, not an agreement: it lands
  // in the register already expired, distorts "expiring < 90 days" and the
  // Calendar, and schedules its renewal reminder in the past.
  const dEff=values.effDate||values.effectiveDate||values.start;
  const dExp=values.expiry||values.expiryDate||values.end;
  if(dEff && dExp && String(dExp) < String(dEff))
    errs.push(`The expiry date (${dExp}) is before the effective date (${dEff}) — check the term.`);
  // A counterparty name is a party to an agreement, not a paragraph. It also
  // becomes the contract name, which every list truncates.
  if((values.counterparty||'').length>120)
    errs.push('The counterparty name is longer than 120 characters — use the registered name.');
  /* Optional, and checked only if given: somebody drafting for their own file
     may not know the address yet, and refusing to create the contract over it
     would be worse than asking again later. */
  const cpEmail=val('cpemail');
  if(cpEmail && !/.+@.+\..+/.test(cpEmail))
    errs.push(`"${cpEmail}" is not an email address — leave it blank if you do not have it yet.`);
  /* U-10: show ALL the problems at once, not just the first. The full list is
     already collected here; toasting errs[0] alone forced a fix-resubmit-discover
     loop through fields the user could have corrected in one pass. */
  if(errs.length){ toast(errs.length===1?errs[0]:`${errs.length} things need fixing:\n• ${errs.join('\n• ')}`,'err'); return; }
  const cp=values.counterparty||'';
  /* THE NAME THEY TYPED IS THE COUNTERPARTY, not just a word in the title.
     This wrote `counterparty:''` and folded `cp` into the display name only,
     so a contract drafted for Kabras was titled "…— Kabras" while the field
     the register filters on, the reports total by, and the signing readiness
     check reads ("Complete: counterparty name") stayed empty. The operator
     then re-typed, in the workspace, a fact they had already given the wizard.
     Uploads have always recorded it (js/views/contract.js); the two
     template-born paths now agree with them. */
  const c={ id:nextId(), name:t.name+(cp?' — '+cp:' (Draft)'), counterparty:cp,
    value: 0, status:'Draft', template:tid, folder:t.folder,
    lastAction:todayStr(), hash:null, signedAt:null, signatory:u?.name||'Authorized signatory', compliance:{iprs:false,pki:false},
    comments:[{author:'System',role:'Automation',side:'internal',text:`Drafted via the guided wizard from Template ${tid} (${t.kind}). What you typed is filed as contract data — the register, filters and reports pick it up without re-keying.`,ts:fmtDT(nowISO())}],
    fields:{}, scan:null, expiry:null, valueType:t.valueType,
    audit:[{at:nowISO(),user:u?.name||'System',action:'Created',detail:`Guided creation from Template ${tid} (${t.kind})`}],
    signatures:[],
    /* N3-T1: born from a template, so this contract NUMBERS LIVE — a deleted
       clause closes the run up automatically at the next round boundary
       (negoAdvanceRound → negoRenumberApply). Set only here and at the custom
       template path; absence means literal numbering, so every existing
       contract and every upload is excluded by construction. */
    numbering:'live' };
  // the blanks ARE the database: every value lands on the contract AND in
  // c.metadata, with no separate data-entry step
  if(cpEmail) c.counterpartyEmail=cpEmail;
  applyTemplateValues(c, vars, values);
  if(t.valueType==='none'){ c.value=0; c.valueType='none'; }
  c._loaded=true; c._light=false; c._v=0;
  state.contracts.unshift(c); state.activeId=c.id;
  persist(c); closeModal();
  toast(`Draft created — ${t.kind}`);
  setView('workspace'); renderSideFolders&&renderSideFolders();
}

Object.assign(window,{TEMPLATE_PRIMARY,templateVars,templateRoles,templateAllowedForRole,myCreatableTemplates,openWizard,createFromWizard});
