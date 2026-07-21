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
  FF:{field:'region', label:'Distribution region', ph:'e.g. Western Kenya', def:''},
  DA:{field:'territory', label:'Distributor territory', ph:'e.g. Coast region', def:''},
  RL:{field:'channel', label:'Retail channel', ph:'e.g. modern trade', def:''},
  MK:{field:'services', label:'Services', ph:'e.g. media & activation', def:''},
  ND:{field:null, label:null},
  LE:{field:'premises', label:'Premises', ph:'e.g. Industrial Area depot', def:''},
  PS:{field:'services', label:'Services', ph:'e.g. audit & advisory', def:''},
};
function templateVars(tid){
  const t=TEMPLATES[tid]; if(!t) return [];
  const vars=[ {key:'counterparty', label:'Counterparty', type:'text', ph:'Full registered name', def:''} ];
  if(t.valueType!=='none') vars.push({key:'value', label:'Contract value (KES)', type:'num', ph:'0', def:''});
  vars.push({key:'effDate', label:'Start date', type:'date', def:new Date().toISOString().slice(0,10)});
  vars.push({key:'expiry', label:'End / expiry date', type:'date', def:''});
  const prim=TEMPLATE_PRIMARY[tid];
  if(prim&&prim.field) vars.push({key:'field:'+prim.field, label:prim.label, type:'text', ph:prim.ph, def:prim.def});
  vars.push({key:'field:payDays', label:'Payment terms (days)', type:'num', ph:'30', def:'30'});
  return vars;
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
      openModal(`<div class="p-6">
        <h3 class="font-serif font-600 text-lg text-ink mb-1">New contract from a template</h3>
        <p class="text-xs text-ink/60 mb-4">Pick a template, answer a few details, and HaTi drafts it for you.</p>
        <div class="grid sm:grid-cols-2 gap-2 max-h-[55vh] overflow-y-auto scroll-thin">
          ${tmpls.map(t=>`<button data-wz-tid="${t.id}" class="text-left rounded-xl border border-line bg-white hover:border-brand-300 hover:shadow-sm p-3 transition">
            <span class="flex items-center gap-2"><span class="h-7 w-7 grid place-items-center rounded-lg bg-brand-50 text-brand-500">${icon(t.ic||'file','w-3.5 h-3.5')}</span>
            <span class="text-[13px] font-600 text-ink">${t.kind}</span></span>
            <span class="block mt-1 text-[11px] text-ink/60">${t.blurb||''}</span></button>`).join('')}
        </div></div>`);
      document.querySelectorAll('[data-wz-tid]').forEach(b=>b.addEventListener('click',()=>{ tid=b.getAttribute('data-wz-tid'); renderStep(); }));
      return;
    }
    const t=TEMPLATES[tid], vars=templateVars(tid);
    const input=v=>{ const id='wz-'+v.key.replace(/[:]/g,'_'); const it=v.type==='date'?'date':(v.type==='num'?'number':'text');
      return `<label class="block"><span class="text-[11px] font-600 text-ink/70">${v.label}</span>
        <input id="${id}" type="${it}" value="${v.def||''}" placeholder="${v.ph||''}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"/></label>`; };
    openModal(`<div class="p-6">
      <button id="wz-back" class="text-[11px] text-brand-600 hover:text-brand-800 font-600 mb-2">← templates</button>
      <h3 class="font-serif font-600 text-lg text-ink mb-1">${t.kind}</h3>
      <p class="text-xs text-ink/60 mb-4">${t.blurb||''}</p>
      <div class="grid grid-cols-2 gap-3">${vars.map(input).join('')}</div>
      <div class="flex justify-end gap-2 mt-5">
        <button id="wz-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">Cancel</button>
        <button id="wz-create" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">Create draft</button>
      </div></div>`);
    document.getElementById('wz-back').addEventListener('click',()=>{ tid=null; renderStep(); });
    document.getElementById('wz-cancel').addEventListener('click',closeModal);
    document.getElementById('wz-create').addEventListener('click',()=>createFromWizard(tid, vars));
  };
  renderStep();
}
function createFromWizard(tid, vars){
  const t=TEMPLATES[tid], u=currentUser();
  const val=k=>{ const el=document.getElementById('wz-'+k.replace(/[:]/g,'_')); return el?el.value.trim():''; };
  const c={ id:nextId(), name:t.name+(val('counterparty')?' — '+val('counterparty'):' (Draft)'), counterparty:val('counterparty'),
    value: t.valueType!=='none'?Number(val('value')||0):0, status:'Draft', template:tid, folder:t.folder,
    lastAction:todayStr(), hash:null, signedAt:null, signatory:u?.name||'Authorized signatory', compliance:{iprs:false,pki:false},
    comments:[{author:'System',role:'Automation',side:'internal',text:`Drafted via the guided wizard from Template ${tid} (${t.kind}).`,ts:fmtDT(nowISO())}],
    fields:{}, scan:null, expiry:val('expiry')||null, valueType:t.valueType,
    audit:[{at:nowISO(),user:u?.name||'System',action:'Created',detail:`Guided creation from Template ${tid} (${t.kind})`}],
    signatures:[] };
  vars.forEach(v=>{ if(v.key.startsWith('field:')){ const fid=v.key.slice(6); const raw=val(v.key); if(raw) c.fields[fid]=raw; }
    else if(v.key==='effDate'){ const d=val('effDate'); if(d) c.fields.effDate=d; } });
  c._loaded=true; c._light=false; c._v=0;
  state.contracts.unshift(c); state.activeId=c.id;
  persist(c); closeModal();
  toast(`Draft created — ${t.kind}`);
  setView('workspace'); renderSideFolders&&renderSideFolders();
}

Object.assign(window,{TEMPLATE_PRIMARY,templateVars,templateRoles,templateAllowedForRole,myCreatableTemplates,openWizard,createFromWizard});
