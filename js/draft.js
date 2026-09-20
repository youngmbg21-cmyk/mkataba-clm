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
/* ---- THE COMPANY'S OWN STANDARD IS LOOKED AT FIRST (Young ruled it
   20 Sep 2026) ----
   *"the pull should generate from the company Standard contracts. If there is
   no relevant contract then you can manually select from the other options or
   describe that you want the contract from HaTi contracts or other buckets."*

   THREE BUCKETS, IN ONE ORDER, and the order is a FACT off the record rather
   than a judgement the model makes: paper this workspace has approved and
   published outranks paper somebody saved, which outranks the paper HaTi
   ships. `DRAFT_BUCKETS` is the one statement of it — the list this file
   builds in, the word the offer card prints, and the ranking the route is
   told — so a fourth bucket is a line added here and nowhere else.

   IT IS A PREFERENCE AND NOT A WALL, because the owner named both escapes:
   *Pick one myself* is on the same screen and always was, and a sentence that
   names a bucket ("use the HaTi template") is honoured — see the route. */
const DRAFT_BUCKETS = [
  { kind:'lib',     rank:1, en:'company standard', get label(){ return i18t('dr_from_lib'); } },
  { kind:'mine',    rank:2, en:'saved template',   get label(){ return i18t('dr_from_mine'); } },
  { kind:'builtin', rank:3, en:'HaTi template',    get label(){ return i18t('dr_from_builtin'); } },
];
const draftBucket = kind => DRAFT_BUCKETS.find(b => b.kind === kind) || null;
const draftBucketLabel = kind => { const b = draftBucket(kind); return b ? b.label : ''; };
const draftBucketRank = kind => { const b = draftBucket(kind); return b ? b.rank : 99; };

function draftCandidates(){
  const out=[];
  const push=(kind,id,name,blurb,fields)=>{ const k=String(id||''); if(!k||!name) return;
    out.push({ kind, id:k, name:String(name), blurb:String(blurb||''),
      fields:(fields||[]).filter(f=>f&&f.key).map(f=>({ key:String(f.key), label:String(f.label||f.key),
        /* AN OPTION IS A {v,l} PAIR HERE TOO. `f.opts.map(String)` sent the
           model "[object Object]" three times over for "Which side are we
           on?", so it could not answer that question at all. Asked through
           `fieldOpt`, the product's ONE reading of an option, and BOTH halves
           travel: the model matches on the words a person reads and answers
           with the value the box stores. */
        type:String(f.type||'text'), required:!!f.required,
        ...(Array.isArray(f.opts)&&f.opts.length?{opts:f.opts.map(o=>(typeof fieldOpt==='function')
          ? fieldOpt(o) : { v:String(o), l:String(o) })}:{}) })) }); };
  /* The built-in papers, gated by the same role rule the picker uses. */
  if(typeof myCreatableTemplates==='function')
    for(const t of myCreatableTemplates()) push('builtin', t.id, t.kind||t.name, t.blurb, (typeof templateFields==='function')?templateFields(t):[]);
  /* This workspace's own saved templates, and its published company
     standards. Both are editor-only doors, exactly as they are in the picker. */
  const mayEdit = (typeof canEdit!=='function') || canEdit();
  if(mayEdit && typeof customTemplates==='function')
    for(const t of customTemplates()) push('mine', t.id, t.name, t.description||t.blurb, (typeof templateFields==='function')?templateFields(t):[]);
  /* ---- A COMPANY STANDARD ASKS THE ESSENTIALS, AND IT USED TO ARRIVE WITH
     NO QUESTIONS AT ALL ---- an empty `fields` made the standards the least
     described paper on the list, so a model asked to fill boxes had nothing
     to fill and every reason to pick something else. Its questions are the
     ones its own door asks — `openContractEssentials` — so those are what
     travel, from `essentialFields()`, the same reading that draws them. */
  if(mayEdit && typeof tplLibPublished==='function')
    for(const t of tplLibPublished()) push('lib', t.id, t.name, t.description,
      (typeof essentialFields==='function') ? essentialFields() : []);
  /* Standards first, saved next, HaTi's own last — stable within a bucket, so
     the picker's own order survives inside each one. */
  return out.map((c,i)=>({c,i}))
    .sort((a,b)=> (draftBucketRank(a.c.kind)-draftBucketRank(b.c.kind)) || (a.i-b.i))
    .map(x=>x.c);
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
    ${''/* THE SHELF HINT RIDES THE BOX, not a third sentence on the lead: the
           pop-up diet's own answer for machinery, and this is the one control
           where knowing you may name a shelf changes what you type. */}
    <textarea id="dr-say" rows="3" maxlength="${DRAFT_SENTENCE_MAX}" placeholder="${esc(i18t('dr_ph'))}" title="${esc(i18t('dr_shelf_hint'))}" style="${TA}"></textarea>
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
    const r=await api('ai/draft','POST',{ sentence, candidates:cands.map(c=>({ id:c.id, name:c.name, blurb:c.blurb, fields:c.fields, kind:c.kind })) });
    const pick=cands.find(c=>c.id===(r&&r.templateId));
    if(!pick){ draftNothingFits(out, sentence, String((r&&r.why)||''), String((r&&r.closestName)||'')); return; }
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
/* ---- "NOTHING FITS" IS AN ANSWER, AND IT HAS TWO DOORS (upgrade 4) ----
   Built to the drawing, 18 Sep 2026. The refusal itself is unchanged and still
   leads, and it still mints nothing. What is added under it:

   THE REASON THE MODEL GAVE, where it gave one. The route already returns
   `why` beside the pick, and on a no-pick it is the one thing that tells a
   reader whether to rephrase or to stop trying — "nothing fits" alone cannot.
   Printed as the model's words, escaped, and simply absent where it said
   nothing: an absence is stated, never invented.

   SEND THIS AS A REQUEST. Requests already takes the ask as its own record and
   grants nothing by taking it, and the reader has already written what they
   need — so the form opens with those very words in it, through
   openIntakeForm, the door every other caller opens. Under it, what actually
   happens next: who has been picking requests up and how long they usually
   take, both read off the record by intakeAnswerLine, which REFUSES rather
   than averages two requests into a promise. The list is fetched quietly
   first, because this dialog is reachable without ever having opened Requests.

   WRITE A TEMPLATE FROM THIS, and only where this reader may make new paper —
   mayMakeNewPaper, the product's ONE reading of that grant, which is off by
   default, so for most people this door is simply not drawn and Requests is
   the whole answer. It presses the Templates page's own create door; nothing
   is minted by this dialog. */
async function draftNothingFits(out, sentence, why, closest){
  draftSay(out, i18t('dr_nothing_fits'));
  const p=out.querySelector('#dr-note'); if(!p) return;
  const esc=s2=>String(s2==null?'':s2).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  const said=String(why||'').trim(), near=String(closest||'').trim();
  if(said||near){
    const q=document.createElement('p');
    q.id='dr-why';
    q.style.cssText='margin:7px 0 0;font-size:var(--t-meta);color:var(--color-neutral-700);line-height:1.55';
    /* THE NEAREST IS NAMED AND NOT OFFERED — it is a span, never a press. */
    q.textContent=(near?i18t('dr_closest_is',{name:near})+' ':'')+said;
    p.insertAdjacentElement('afterend', q);
  }
  const row=document.createElement('div');
  row.id='dr-doors';
  row.style.cssText='display:flex;gap:9px;flex-wrap:wrap;margin-top:11px';
  (out.querySelector('#dr-why')||p).insertAdjacentElement('afterend', row);

  if(typeof openIntakeForm==='function'){
    const b=document.createElement('button');
    b.type='button'; b.id='dr-ask-team'; b.className='ui-btn';
    b.style.cssText='font-size:var(--t-meta);padding:5px 11px';
    b.textContent=i18t('dr_send_as_request');
    b.addEventListener('click',()=>{ closeModal(); openIntakeForm({ need:String(sentence||'') }); });
    row.appendChild(b);
  }
  /* THE SECOND DOOR IS NOT FOR MOST PEOPLE, and that is the governance rule
     working rather than a gap: writing new paper is the grant that is off by
     default. Drawn only where pressing it would do something. */
  if(typeof mayMakeNewPaper==='function' && mayMakeNewPaper() && typeof tplLibCreateModal==='function'){
    const t=document.createElement('button');
    t.type='button'; t.id='dr-write-template'; t.className='ui-btn';
    t.style.cssText='font-size:var(--t-meta);padding:5px 11px';
    t.textContent=i18t('dr_write_template');
    t.addEventListener('click',()=>{ closeModal(); tplLibCreateModal(); });
    row.appendChild(t);
  }
  /* WHAT HAPPENS NEXT, where the record can say. Quietly loaded and quietly
     skipped: a refusal must never fail over a second fetch. */
  if(typeof intakeAnswerLine!=='function') return;
  try{ if(typeof loadIntake==='function') await loadIntake(); }catch(_){}
  let line=null; try{ line=intakeAnswerLine(); }catch(_){ line=null; }
  if(!line || !document.getElementById('dr-doors')) return;
  const n=document.createElement('p');
  n.id='dr-answers';
  n.style.cssText='margin:7px 0 0;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.5';
  n.textContent=line;
  row.insertAdjacentElement('afterend', n);
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
    ${''/* WHICH SHELF IT CAME OFF. A fact read off the record, not the model's
           word for it, and it belongs beside the name because the whole point
           of the ruling is that the reader can see whether they were given
           the company's own paper. One line on a card that already exists —
           never a band. */}
    ${draftBucketLabel(pick.kind)?`<span id="dr-from" style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);margin-top:2px">${esc(draftBucketLabel(pick.kind))}</span>`:''}
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

Object.assign(window,{DRAFT_BUCKETS,draftBucket,draftBucketLabel,draftBucketRank,draftCandidates,draftApplyPrefill,draftPrefillFor,draftFilledLabels,draftAiReady,openDraftFromSentence,draftRead,draftOffer,draftNothingFits,draftHandOff,DRAFT_SENTENCE_MAX});
