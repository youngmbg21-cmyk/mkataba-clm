// HaTi — W-1: draft from a sentence. Globals window-attached.

/* ---------------------------------------------------------------------------
   TYPE WHAT YOU NEED, AND IT FINDS THE PAPER YOU ALREADY HAVE.

   "Two-year supply agreement with Nandi Dairy, 45-day payment, 90 days'
   notice" — and back comes the template this workspace already holds that
   fits, with that template's own questions answered from the sentence, in
   boxes a person then confirms.

   IT IS AN OPTION AND NEVER THE DEFAULT (owner-asked). "Draft from a
   template" is untouched and behaves exactly as it did; this is a fourth row
   in the same menu, so nobody who knows which template they want ever meets
   it.

   THREE RULES DECIDE WHAT THIS IS ALLOWED TO DO, and each is a refusal:

   1. IT PICKS FROM YOUR OWN PAPER AND WRITES NO WORDING. Every candidate is a
      template the ordinary picker already offers — the built-ins, this
      workspace's saved templates, its published company standards — read from
      the SAME three sources that picker reads, so the two doors can never
      offer different paper. A model drafting clauses from scratch walks
      around the playbook, the clause library and every guard this product
      has, and nothing here asks it to.

   2. IT MINTS NOTHING. The last thing it does is press a door that already
      exists — the wizard's own answer step, the saved-template fill, the
      company standard's essentials — so the contract is created by the same
      function, with the same validation and the same audit line, as one
      drafted by hand. f270 greps this file for a creation of its own.

   3. NOTHING ARRIVES UNSEEN. Every value Copilot reads lands in an editable
      box on a screen the reader has to press Create on. A field the chosen
      template does not declare is dropped here as well as at the route
      (draftApplyPrefill) — the browser's half of one wall.

   AND WHERE IT CANNOT RUN IT SAYS SO. No Copilot key, a refusal, nothing that
   fits: each says which, on the same screen, with the ordinary picker one
   press away. A door that opens on silence is worse than a door that is not
   drawn. */

/* One reading of "what paper can this person start from", normalised for the
   model: id, what it is called, what it is for, and the questions it asks.
   Read through `typeof`, so a stage carrying only the built-ins offers only
   those rather than throwing. */
function draftCandidates(){
  const out=[];
  const push=(kind,id,name,blurb,fields)=>{ const k=String(id||''); if(!k||!name) return;
    out.push({ kind, id:k, name:String(name), blurb:String(blurb||''),
      fields:(fields||[]).filter(f=>f&&f.key).map(f=>({ key:String(f.key), label:String(f.label||f.key),
        type:String(f.type||'text'), required:!!f.required, ...(Array.isArray(f.opts)&&f.opts.length?{opts:f.opts.map(String)}:{}) })) }); };
  /* The built-in papers, gated by the same role rule the picker uses. */
  if(typeof myCreatableTemplates==='function')
    for(const t of myCreatableTemplates()) push('builtin', t.id, t.kind||t.name, t.blurb, (typeof templateFields==='function')?templateFields(t):[]);
  /* This workspace's own saved templates, and its published company
     standards. Both are editor-only doors, exactly as they are in the picker. */
  const mayEdit = (typeof canEdit!=='function') || canEdit();
  if(mayEdit && typeof customTemplates==='function')
    for(const t of customTemplates()) push('mine', t.id, t.name, t.description||t.blurb, (typeof templateFields==='function')?templateFields(t):[]);
  if(mayEdit && typeof tplLibPublished==='function')
    for(const t of tplLibPublished()) push('lib', t.id, t.name, t.description, []);
  return out;
}

/* THE WALL, ON THIS SIDE. A value may only reach a box the chosen template
   actually declares: anything else is dropped rather than carried. Returns a
   COPY of the field list with `def` moved, because these lists are read from
   live getters (a built-in's value label names the workspace currency) and
   writing through them would freeze what the next reader sees. */
function draftApplyPrefill(fields, prefill){
  const p=prefill||{};
  return (fields||[]).map(f=>{
    const has=Object.prototype.hasOwnProperty.call(p, f.key);
    const v=has?String(p[f.key]==null?'':p[f.key]):'';
    if(!has || !v) return f;
    /* Copied by DESCRIPTOR, never spread — `label` and `def` are getters on
       the built-ins, and {...f} reads them once and freezes the answer. This
       is the getter trap THE MAP names four times over. */
    const c=Object.defineProperties({}, Object.getOwnPropertyDescriptors(f));
    Object.defineProperty(c,'def',{ value:v, enumerable:true, configurable:true, writable:true });
    return c;
  });
}
/* The same rule as a plain map, for the two doors that take values rather
   than fields (the company standard's essentials form). */
function draftPrefillFor(fields, prefill){
  const keys=new Set((fields||[]).map(f=>f&&f.key));
  const out={};
  for(const k of Object.keys(prefill||{})) if(keys.has(k) && String(prefill[k]||'').trim()) out[k]=String(prefill[k]).trim();
  return out;
}

/* Which of the questions were answered, named rather than valued: the VALUES
   are one press away in boxes that can be corrected, and printing them here
   as well would be the same fact twice with the second copy uneditable. */
function draftFilledLabels(fields, prefill){
  const p=prefill||{};
  return (fields||[]).filter(f=>f&&Object.prototype.hasOwnProperty.call(p,f.key)&&String(p[f.key]||'').trim())
    .map(f=>String(f.label||f.key));
}

const DRAFT_SENTENCE_MAX = 2000;
/* Copilot is reachable when there is a server to ask and a key on it. Asked
   the way every other Copilot door asks it, so this row is dead in exactly
   the places the others are. */
const draftAiReady = () => !!(typeof API_MODE==='function' && API_MODE() && typeof state!=='undefined' && state && state.aiConfigured);

function openDraftFromSentence(){
  if(typeof canEdit==='function' && !canEdit()){ toast(i18t('wz_viewers_no_create'),'err'); return; }
  const cands=draftCandidates();
  if(!cands.length){ toast(i18t('wz_no_templates_role'),'err'); return; }
  /* Quotes as well, because one of these lands in an ATTRIBUTE. */
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const ready=draftAiReady();
  const TA='width:100%;min-height:96px;border:1px solid var(--color-divider);background:var(--color-surface);'
    +'border-radius:var(--radius);padding:10px 12px;font:inherit;font-size:var(--t-body);color:inherit;outline:none;resize:vertical';
  openModal(`<div style="padding:20px 22px">
    <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-page);margin:0 0 3px">${i18t('dr_title')}</h3>
    <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 var(--s-3);line-height:1.55">${i18t('dr_lead')}</p>
    <textarea id="dr-say" rows="3" maxlength="${DRAFT_SENTENCE_MAX}" placeholder="${esc(i18t('dr_ph'))}" style="${TA}"></textarea>
    <p style="font-size:var(--t-label);color:var(--color-neutral-600);margin:6px 0 0;line-height:1.5">${i18t('dr_example')}</p>
    ${ready?'':`<p id="dr-nokey" style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:10px 0 0;line-height:1.55">${i18t('dr_no_ai')}</p>`}
    <div id="dr-out" style="margin-top:12px"></div>
    <div style="display:flex;align-items:center;gap:var(--s-2);margin-top:var(--s-4)">
      <button id="dr-cancel" class="ui-btn">${i18t('act_cancel')}</button>
      <span style="flex:1"></span>
      <button id="dr-pick" class="ui-btn">${i18t('dr_pick_myself')}</button>
      ${ready?`<button id="dr-read" class="ui-btn ui-btn-primary">${i18t('dr_read_it')}</button>`:''}
    </div></div>`, { maxWidth:'620px' });
  const say=document.getElementById('dr-say');
  if(say) say.focus();
  document.getElementById('dr-cancel').addEventListener('click', closeModal);
  /* THE WAY BACK IS THE ORDINARY PICKER, on the same screen — the standing
     rule that a refusal carries its remedy. It is the door that already
     exists, opened with nothing chosen, not a second copy of it. */
  document.getElementById('dr-pick').addEventListener('click',()=>{ closeModal(); if(typeof openWizard==='function') openWizard(); });
  const read=document.getElementById('dr-read');
  if(read) read.addEventListener('click',()=>draftRead(cands));
  if(say && read) say.addEventListener('keydown',e=>{ if(e.key==='Enter' && (e.metaKey||e.ctrlKey)) read.click(); });
}

/* One press, one call, one spend. */
async function draftRead(cands){
  const say=document.getElementById('dr-say'), btn=document.getElementById('dr-read'), out=document.getElementById('dr-out');
  if(!say||!btn||!out) return;
  const sentence=String(say.value||'').trim();
  if(!sentence){ draftSay(out, i18t('dr_say_something')); say.focus(); return; }
  const was=btn.textContent;
  btn.disabled=true; btn.textContent=i18t('ct_working'); out.innerHTML='';
  try{
    const r=await api('ai/draft','POST',{ sentence, candidates:cands.map(c=>({ id:c.id, name:c.name, blurb:c.blurb, fields:c.fields })) });
    const pick=cands.find(c=>c.id===(r&&r.templateId));
    if(!pick){ draftSay(out, i18t('dr_nothing_fits')); return; }
    /* Keys the chosen template does not ask for are dropped HERE as well as
       at the route: two halves of one wall, so neither host has to trust the
       other about what this template's questions are. */
    const keys=new Set(pick.fields.map(f=>f.key));
    const prefill={};
    for(const f of (Array.isArray(r.fields)?r.fields:[]))
      if(f && keys.has(f.key) && String(f.value||'').trim()) prefill[f.key]=String(f.value).trim();
    draftOffer(pick, prefill, String((r&&r.why)||''));
  }catch(e){
    /* A refusal SAYS which — no key, a provider that said no, a rate limit —
       where the reader is looking, and leaves the sentence they typed alone. */
    draftSay(out, (e&&e.message)?String(e.message):i18t('dr_failed'));
  }finally{ btn.disabled=false; btn.textContent=was; }
}
function draftSay(out, msg){
  const esc=s=>String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  out.innerHTML=`<p id="dr-note" style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0;line-height:1.55">${esc(msg)}</p>`;
}
/* What it found, and the one press that takes it. */
function draftOffer(pick, prefill, why){
  const out=document.getElementById('dr-out'); if(!out) return;
  const esc=s=>String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  const filled=draftFilledLabels(pick.fields, prefill);
  out.innerHTML=`<div id="dr-found" style="border:1px solid var(--color-divider);border-radius:var(--radius);padding:12px 14px;background:var(--color-surface)">
    <span style="display:block;font-family:var(--font-mono);font-size:var(--t-micro);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500);margin-bottom:5px">${i18t('dr_suggests')}</span>
    <span id="dr-name" style="display:block;font-size:var(--t-body);font-weight:var(--w-strong);color:var(--color-text)">${esc(pick.name)}</span>
    ${why?`<p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:5px 0 0;line-height:1.55">${esc(why)}</p>`:''}
    ${''/* NAMED, NOT VALUED. The values are one press away in boxes that can be
           corrected; printed here as well they would be the same fact twice,
           and the uneditable copy is the one that reads as decided. */}
    ${filled.length?`<p id="dr-filled" style="font-size:var(--t-label);color:var(--color-neutral-600);margin:8px 0 0;line-height:1.5">${
      esc(i18tn('dr_also_filled', filled.length, { list: filled.join(', ') }))}</p>`
      :`<p id="dr-filled" style="font-size:var(--t-label);color:var(--color-neutral-600);margin:8px 0 0;line-height:1.5">${i18t('dr_filled_none')}</p>`}
    <div style="margin-top:10px"><button id="dr-go" class="ui-btn ui-btn-primary">${i18t('dr_use_it')}</button></div>
  </div>`;
  document.getElementById('dr-go').addEventListener('click',()=>draftHandOff(pick, prefill));
}

/* THE HAND-OFF, AND THE WHOLE POINT OF IT: three doors that already exist,
   each opened pre-filled. Nothing is created here — every one of these ends
   at the same Create button a person reaches by hand. */
function draftHandOff(pick, prefill){
  closeModal();
  if(pick.kind==='builtin'){ if(typeof openWizard==='function') openWizard(pick.id, prefill); return; }
  if(pick.kind==='mine'){ if(typeof createFromCustomTemplate==='function') createFromCustomTemplate(pick.id, prefill); return; }
  if(typeof tplLibNewContract==='function') tplLibNewContract(pick.id, prefill);
}

Object.assign(window,{draftCandidates,draftApplyPrefill,draftPrefillFor,draftFilledLabels,draftAiReady,openDraftFromSentence,draftRead,draftOffer,draftHandOff,DRAFT_SENTENCE_MAX});
