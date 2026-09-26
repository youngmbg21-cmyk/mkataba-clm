/* ═══════════════════════════════════════════════════════════════════════════
   THE COHORT ACT — "Do this to these 14" (S13 + S14, HaTi's Next Fifteen)
   ═══════════════════════════════════════════════════════════════════════════

   ONE ACT ABOVE THE CONTRACTS TABLE, AND IT IS NOT DRAWN UNLESS THE TABLE IS
   NARROWED. That condition is the whole design. "These 14" means something
   only when the reader has just said which fourteen; with no filter in force
   the same button would be an offer to act on the entire book, which is the
   one proposal in the fifteen that could damage a customer's relationships in
   an afternoon. So `regNarrowed()` — the register's OWN reading of "is
   anything narrowing this list", the same one the Clear button and the empty
   state ask — decides whether the button exists at all.

   WAVES AND A STOP, FROM THE FIRST LINE. `cohortRun` walks the set a few at a
   time and asks `_cohortStop` between every one, so the Stop button is not
   decoration: it takes effect on the next contract, always. Nothing here runs
   without a confirm that names the count, and nothing here reports a number it
   did not actually achieve — every run ends with a report of what was done,
   what was refused and why.

   THE FOUR ROWS, AND WHAT EACH ONE REALLY DOES:

     · DRAFT AN AMENDMENT TO ALL N — mints one amendment draft per contract
       through `createAmendment`, family.js's own door, carrying the wording
       typed once. THE ARTIFACT'S LABEL SAYS "Send an amendment to all 14" AND
       THIS ONE SAYS "Draft". That is a deliberate departure and it is the
       house rule that forces it: "SENT" MUST MEAN SENT. A bulk act that
       created fourteen drafts and called itself Send would be a lie on the
       one screen where the reader cannot check. Each draft opens on its own
       contract and is sent from there, by a person, through the one send door
       that already asks the review gate, the desk and the signing route.

     · ASK ALL N FOR A DOCUMENT — records the requirement on each contract as
       an ordinary required-document obligation (the S8 shape) and then chases
       it where the record holds somewhere to write. Two existing acts, run in
       a wave; both walls kept (`obligationAlreadyOn` refuses a duplicate,
       "nowhere to write" is reported as a fact rather than swallowed).

     · BUILD A DILIGENCE PACK FROM THESE N — a deterministic standalone
       document, no model, no route, no spend. Every value in it is already on
       the record.

     · EXPORT THE LIST — a PROXY onto `regExportCsv`, the act that already
       exists. Not a second exporter.

   NOTHING HERE WRITES A FIELD OF ITS OWN. The amendment is a contract, the
   document ask is an obligation, the pack is a page. A cohort act that
   invented a "campaign" record would be a fifth thing to keep in step with
   the four it is made of. */

/* HOW MANY AT ONCE. Small on purpose: each step persists a contract, and in
   server mode that is a PUT. Four keeps the stop responsive and the server
   unbothered. */
const COHORT_WAVE = 4;
/* THE MENU'S OWN ROWS, in the artifact's order. `k` is stable English and is
   what the handler switches on; the label is a getter so the dictionary
   answers in the reader's language at DRAW time, never at load. */
const COHORT_ACTS = [
  { k:'amend',  lead:true,  get label(){ return i18tn('co_h_amend', _cohortN(), {n:_cohortN()}); } },
  { k:'askdoc', lead:false, get label(){ return i18tn('co_h_askdoc', _cohortN(), {n:_cohortN()}); } },
  { k:'pack',   lead:false, get label(){ return i18tn('co_h_pack',  _cohortN(), {n:_cohortN()}); } },
  { k:'export', lead:false, get label(){ return i18t('co_h_export'); } },
];

let _cohortStop = false;
let _cohortBusy = false;
function cohortBusy(){ return _cohortBusy; }

/* ---- WHICH CONTRACTS "THESE" MEANS ----
   The register's own filtered set and nothing else, so the number on the
   button and the rows on the table can never disagree. Read through a guard:
   this file loads on stages that do not carry the register. */
function cohortSet(){
  try{
    if(typeof regScope==='function' && regScope()==='negotiations') return [];
    if(typeof regNarrowed!=='function' || !regNarrowed()) return [];
    if(typeof regFiltered!=='function') return [];
    return (regFiltered()||[]).filter(Boolean);
  }catch(_){ return []; }
}
function _cohortN(){ try{ return cohortSet().length; }catch(_){ return 0; } }
const _coEsc = s => String(s==null?'':s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

/* ---- THE BUTTON AND ITS MENU ----
   Drawn into a SLOT the page header leaves for it, because the header is built
   once per view change and this control has to appear and disappear as the
   reader narrows the table. The register paints the slot on every repaint —
   the room's own rule for anything that changes under a head built once. */
function cohortButtonHtml(){
  const n = _cohortN();
  if(!n) return '';
  if(typeof canEdit==='function' && !canEdit()) return '';
  return `<span style="position:relative;display:inline-flex">
    <button id="reg-cohort" type="button" class="ui-btn" aria-haspopup="true" aria-expanded="false"
      title="${_coEsc(i18t('co_h_title'))}">${_coEsc(i18tn('co_h_button',n,{n}))}${(typeof icon==='function')?icon('chevD','w-3.5 h-3.5'):''}</button>
    <div id="reg-cohort-menu" role="menu" hidden
      style="display:none;position:absolute;right:0;top:calc(100% + 6px);z-index:40;min-width:270px;
        background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);
        border-radius:var(--radius);padding:var(--s-1);flex-direction:column;text-align:left">
      ${COHORT_ACTS.map(a=>`<button type="button" role="menuitem" data-cohort="${a.k}"
        style="display:block;width:100%;text-align:left;font:inherit;font-size:var(--t-meta);
          ${a.lead?'font-weight:var(--w-strong);background:var(--st-steel-bg);':'background:none;'}
          border:0;border-radius:var(--radius);padding:8px 10px;cursor:pointer;color:var(--color-text)"
        >${_coEsc(a.label)}</button>`).join('')}
    </div>
  </span>`;
}
function cohortCloseMenu(){
  const m=document.getElementById('reg-cohort-menu'); if(!m) return;
  m.style.display='none'; m.hidden=true;
  document.getElementById('reg-cohort')?.setAttribute('aria-expanded','false');
}
/* ONE DELEGATED LISTENER, ARMED AT MODULE LOAD. The button is repainted on
   every filter press, so a listener bound to the element would have to be
   rebound each time and a missed rebind is a live-looking dead control — the
   fault this codebase has paid for three times. */
function cohortWire(){
  if(typeof document==='undefined' || document._cohortBound) return;
  document._cohortBound = true;
  document.addEventListener('click', e=>{
    const t = e.target && e.target.closest ? e.target : null;
    if(!t) return;
    const btn = t.closest('#reg-cohort');
    if(btn){
      e.stopPropagation();
      const m=document.getElementById('reg-cohort-menu'); if(!m) return;
      const open = m.style.display==='flex';
      if(open){ cohortCloseMenu(); return; }
      m.style.display='flex'; m.hidden=false; btn.setAttribute('aria-expanded','true');
      return;
    }
    const row = t.closest('[data-cohort]');
    if(row){ e.stopPropagation(); const k=row.getAttribute('data-cohort'); cohortCloseMenu(); cohortAct(k); return; }
    if(!t.closest('#reg-cohort-menu')) cohortCloseMenu();
  });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') cohortCloseMenu(); });
}

/* ---- THE RUNNER ----
   Walks the set in waves, asks the stop between every contract, and hands back
   a report. `step(c)` answers `{ok:true}` / `{ok:false, why}` — a refusal is
   counted and NAMED, never swallowed, because a cohort act that quietly did
   eleven of fourteen is worse than one that did none. */
async function cohortRun(list, step, opts){
  const o = opts||{};
  const total = list.length;
  _cohortStop = false; _cohortBusy = true;
  const rep = { done:0, skipped:0, why:{}, stopped:false, total };
  const say = n => { if(typeof o.onProgress==='function') o.onProgress(n, total); };
  try{
    for(let i=0;i<list.length;i+=COHORT_WAVE){
      const wave = list.slice(i, i+COHORT_WAVE);
      for(const c of wave){
        if(_cohortStop){ rep.stopped = true; break; }
        let r = null;
        try{ r = await step(c); }
        catch(err){ r = { ok:false, why:String((err&&err.message)||err||'') }; }
        if(r && r.ok) rep.done++;
        else { rep.skipped++; const w=(r&&r.why)||i18t('co_h_why_unknown'); rep.why[w]=(rep.why[w]||0)+1; }
        say(rep.done + rep.skipped);
      }
      if(rep.stopped) break;
      /* Let the browser paint the progress between waves. */
      await new Promise(r=>setTimeout(r,0));
    }
  } finally { _cohortBusy = false; }
  return rep;
}
function cohortStop(){ _cohortStop = true; }

/* THE PROGRESS WINDOW. One dialog, a count, and a Stop that is a real press.
   It replaces its own body with the report when the run ends, so the reader
   never has to go looking for what happened. */
function cohortProgressOpen(title){
  openModal(`<div class="p-6">
      <h3 style="margin:0 0 var(--s-3);font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-section)">${_coEsc(title)}</h3>
      <p id="co-h-count" style="margin:0 0 var(--s-4);font-size:var(--t-body);color:var(--color-neutral-700)">&nbsp;</p>
      <div id="co-h-foot" style="display:flex;justify-content:flex-end;gap:var(--s-2)">
        <button id="co-h-stop" class="ui-btn">${_coEsc(i18t('co_h_stop'))}</button>
      </div>
    </div>`, { label:title, maxWidth:DLG_W.m });
  document.getElementById('co-h-stop')?.addEventListener('click',()=>{
    cohortStop();
    const b=document.getElementById('co-h-stop'); if(b){ b.disabled=true; b.textContent=i18t('co_h_stopping'); }
  });
  return (n,total)=>{
    const el=document.getElementById('co-h-count');
    if(el) el.textContent = i18t('co_h_progress',{n,total});
  };
}
/* THE REPORT IS THE SAME WINDOW, REWRITTEN. Every refusal is printed with its
   count; "stopped" is said out loud rather than left to be inferred from a
   number that is short. */
function cohortReport(title, rep, extra){
  const lines = Object.keys(rep.why||{}).map(w=>`<li style="margin:2px 0">${_coEsc(w)} &mdash; ${rep.why[w]}</li>`).join('');
  const body = `<div class="p-6">
      <h3 style="margin:0 0 var(--s-3);font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-section)">${_coEsc(title)}</h3>
      <p style="margin:0 0 var(--s-2);font-size:var(--t-body);color:var(--color-text)">${_coEsc(i18t('co_h_done',{n:rep.done,total:rep.total}))}</p>
      ${rep.stopped?`<p style="margin:0 0 var(--s-2);font-size:var(--t-meta);color:var(--st-amber-fg)">${_coEsc(i18t('co_h_was_stopped'))}</p>`:''}
      ${extra?`<p style="margin:0 0 var(--s-2);font-size:var(--t-meta);color:var(--color-neutral-700)">${_coEsc(extra)}</p>`:''}
      ${lines?`<p style="margin:var(--s-3) 0 4px;font-size:var(--t-label);font-weight:var(--w-strong);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500)">${_coEsc(i18t('co_h_not_done'))}</p>
        <ul style="margin:0;padding-left:18px;font-size:var(--t-meta);color:var(--color-neutral-700)">${lines}</ul>`:''}
      <div style="display:flex;justify-content:flex-end;margin-top:var(--s-4)">
        <button id="co-h-close" class="ui-btn ui-btn-primary">${_coEsc(i18t('act_done'))}</button>
      </div>
    </div>`;
  const host=document.querySelector('#modal-root .modal-in') || document.querySelector('#modal-root');
  if(host) host.innerHTML = body; else openModal(body,{label:title,maxWidth:DLG_W.m});
  document.getElementById('co-h-close')?.addEventListener('click',closeModal);
}

/* ---- THE DOOR ---- */
function cohortAct(k){
  if(_cohortBusy){ toast(i18t('co_h_busy'),'warn'); return; }
  const list = cohortSet();
  if(!list.length){ toast(i18t('co_h_empty'),'warn'); return; }
  if(k==='export'){ if(typeof regExportCsv==='function') regExportCsv(); return; }
  if(k==='pack'){ cohortPack(list); return; }
  if(typeof canEdit==='function' && !canEdit()){ toast(i18t('co_h_viewers'),'err'); return; }
  if(k==='amend')  return cohortAmendAsk(list);
  if(k==='askdoc') return cohortAskDocAsk(list);
}

/* ---- DRAFT AN AMENDMENT TO ALL N ----
   The wording is typed ONCE and written into every draft. A child agreement
   cannot itself be amended and a sealed record cannot grow one, so both are
   refused BY NAME in the report rather than skipped in silence. */
function cohortAmendAsk(list){
  const n = list.length;
  openModal(`<div class="p-6">
      <h3 style="margin:0 0 var(--s-2);font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-section)">${_coEsc(i18tn('co_h_amend',n,{n}))}</h3>
      <p style="margin:0 0 var(--s-4);font-size:var(--t-meta);color:var(--color-neutral-700);line-height:1.55">${_coEsc(i18tn('co_h_amend_sub',n,{n}))}</p>
      <label class="block mb-3"><span style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-600)">${_coEsc(i18t('co_h_amend_says'))}</span>
        <textarea id="co-h-says" rows="4" placeholder="${_coEsc(i18t('co_h_amend_ph'))}"
          style="margin-top:5px;width:100%;box-sizing:border-box;font:inherit;font-size:var(--t-body);border:1px solid var(--field-line);border-radius:var(--radius);background:var(--color-surface);color:inherit;padding:9px 11px;resize:vertical"></textarea></label>
      <div style="display:flex;justify-content:flex-end;gap:var(--s-2)">
        <button id="co-h-cancel" class="ui-btn">${_coEsc(i18t('act_cancel'))}</button>
        <button id="co-h-go" class="ui-btn ui-btn-primary">${_coEsc(i18tn('co_h_amend_go',n,{n}))}</button>
      </div>
    </div>`, { label:i18tn('co_h_amend',n,{n}), maxWidth:DLG_W.l });
  document.getElementById('co-h-cancel')?.addEventListener('click',closeModal);
  document.getElementById('co-h-go')?.addEventListener('click',async ()=>{
    const says=(document.getElementById('co-h-says')?.value||'').trim();
    if(!says){ toast(i18t('co_h_amend_need'),'err'); return; }
    await cohortAmendRun(list, says);
  });
}
async function cohortAmendRun(list, says){
  const title = i18tn('co_h_amend', list.length, {n:list.length});
  const onProgress = cohortProgressOpen(title);
  const rep = await cohortRun(list, async c=>{
    if(c.parentId) return { ok:false, why:i18t('co_h_why_child') };
    if(typeof negoWordingFrozen==='function'){
      /* A sealed agreement is amended, not edited — so this one is allowed.
         The refusal that matters is the one createAmendment itself gives. */
    }
    const r = createAmendment(c, { relation:'amendment', says, note:i18t('co_h_amend_note') });
    if(r && r.error) return { ok:false, why:String(r.error) };
    return { ok:true };
  }, { onProgress });
  try{ if(typeof flushSaves==='function') await flushSaves(); }catch(_){}
  cohortReport(title, rep, i18t('co_h_amend_after'));
  if(typeof regRepaint==='function') regRepaint();
}

/* ---- ASK ALL N FOR A DOCUMENT ----
   Records the requirement, then chases where there is somewhere to write. The
   two counts are reported apart, because "recorded on 14" and "emailed to 9"
   are different facts and rolling them into one number would be a claim about
   delivery that is not true. */
function cohortAskDocAsk(list){
  const n = list.length;
  openModal(`<div class="p-6">
      <h3 style="margin:0 0 var(--s-2);font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-section)">${_coEsc(i18tn('co_h_askdoc',n,{n}))}</h3>
      <p style="margin:0 0 var(--s-4);font-size:var(--t-meta);color:var(--color-neutral-700);line-height:1.55">${_coEsc(i18tn('co_h_askdoc_sub',n,{n}))}</p>
      <label class="block mb-3"><span style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-600)">${_coEsc(i18t('co_h_askdoc_what'))}</span>
        <input id="co-h-doc" type="text" placeholder="${_coEsc(i18t('co_h_askdoc_ph'))}"
          style="margin-top:5px;width:100%;box-sizing:border-box;font:inherit;border:1px solid var(--field-line);border-radius:var(--radius);background:var(--color-surface);color:inherit;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)"/></label>
      <label class="block mb-3"><span style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-600)">${_coEsc(i18t('co_h_askdoc_by'))}</span>
        <input id="co-h-due" type="date"
          style="margin-top:5px;width:100%;box-sizing:border-box;font:inherit;border:1px solid var(--field-line);border-radius:var(--radius);background:var(--color-surface);color:inherit;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)"/></label>
      <div style="display:flex;justify-content:flex-end;gap:var(--s-2)">
        <button id="co-h-cancel" class="ui-btn">${_coEsc(i18t('act_cancel'))}</button>
        <button id="co-h-go" class="ui-btn ui-btn-primary">${_coEsc(i18tn('co_h_askdoc_go',n,{n}))}</button>
      </div>
    </div>`, { label:i18tn('co_h_askdoc',n,{n}), maxWidth:DLG_W.l });
  document.getElementById('co-h-cancel')?.addEventListener('click',closeModal);
  document.getElementById('co-h-go')?.addEventListener('click',async ()=>{
    const desc=(document.getElementById('co-h-doc')?.value||'').trim();
    const due=(document.getElementById('co-h-due')?.value||'').trim();
    if(!desc){ toast(i18t('co_h_askdoc_need'),'err'); return; }
    await cohortAskDocRun(list, desc, due);
  });
}
async function cohortAskDocRun(list, desc, due){
  const title = i18tn('co_h_askdoc', list.length, {n:list.length});
  const onProgress = cohortProgressOpen(title);
  let mailed = 0, nowhere = 0;
  const rep = await cohortRun(list, async c=>{
    const r = (typeof obligationRequireDoc==='function')
      ? obligationRequireDoc(c, { desc, due })
      : { ok:false, why:i18t('co_h_why_unknown') };
    if(!r.ok) return r;
    /* THE CHASE IS QUIET BUT NOT SILENT — its answer is counted here and
       printed in the report, which is the same fact in one place instead of
       fourteen toasts. */
    try{
      const m = await obligationChase(c.id, r.o.id, { confirm:false, quiet:true });
      if(m && (m.sent || m.outbox)) mailed++;
      else nowhere++;
    }catch(_){ nowhere++; }
    return { ok:true };
  }, { onProgress });
  try{ if(typeof flushSaves==='function') await flushSaves(); }catch(_){}
  cohortReport(title, rep, i18t('co_h_askdoc_mail',{ sent:mailed, none:nowhere }));
  if(typeof obligationSurfacesChanged==='function') obligationSurfacesChanged();
  if(typeof regRepaint==='function') regRepaint();
}

/* ═══ THE DILIGENCE PACK (S14) ═════════════════════════════════════════════
   A STANDALONE DOCUMENT CARRIES NO `:root` — it opens in its own tab, so every
   colour and size here is a literal and a `var()` would resolve to nothing.
   DETERMINISTIC: no model writes a word of it, and it spends nothing. Every
   figure is already on the record and is BORROWED from the reading that owns
   it, so the pack and the screens cannot disagree.
   MONEY OBEYS `canViewValues` — a reader who is not shown figures gets a pack
   with no figures in it, not a pack of dashes. */
function cohortPackRow(c){
  const g = (n,f) => { try{ return (typeof window[n]==='function') ? window[n](c) : f; }catch(_){ return f; } };
  const money = (typeof canViewValues!=='function') || canViewValues();
  const docs = (typeof contractDocuments==='function') ? contractDocuments(c) : [];
  const obs = (c.obligations||[]).filter(Boolean);
  const open = obs.filter(o=>{ try{ return obState(o)!=='done'; }catch(_){ return o.status!=='done'; } });
  const overdue = obs.filter(o=>{ try{ return obState(o)==='overdue'; }catch(_){ return false; } });
  /* READS `c.changes` RAW. negoOpenPoints would initialise a negotiation on a
     contract that has never had one — READING MUST NOT WRITE. */
  const openAsks = (c.changes||[]).filter(ch=>ch && !['accepted','rejected','withdrawn','superseded'].includes(ch.status)).length;
  let assur = '';
  try{ const a = (typeof contractAssurance==='function') ? contractAssurance(c) : null; assur = (a && (a.label || a.rung)) || ''; }catch(_){ assur=''; }
  return {
    id: c.id, ref: (window.contractRef?contractRef(c):c.id), name: c.name||'', who: c.counterparty||'',
    stream: (typeof regStreamName==='function') ? regStreamName(c) : (c.folder||''),
    status: c.status||'',
    value: money ? (typeof fmtMoneyOf==='function' ? fmtMoneyOf(c, c.value||0) : String(c.value||0)) : '',
    signed: (typeof contractSignedLabel==='function') ? (contractSignedLabel(c)||'') : '',
    expiry: _coDay(g('effectiveExpiry','')),
    party: (typeof contractParty==='function') ? (contractParty(c)||'') : '',
    assurance: assur,
    docs: docs.map(o=>({ desc:o.desc||'', state:(typeof obligationDocState==='function')?obligationDocState(o):'held',
      file:(o.doc&&o.doc.file)||'', until:(o.doc&&o.doc.until)||'' })),
    open: open.length, overdue: overdue.length, asks: openAsks,
  };
}
/* A day written the way the product writes one. fmtDocDate reads a fixed month
   list, so a pack opened in a second tab does not change wording with the
   reader's language mid-sentence; the raw ISO is the fallback, never a guess. */
function _coDay(d){
  const s0 = String(d||'').slice(0,10); if(!s0) return '';
  try{ return (typeof fmtDocDate==='function' ? (fmtDocDate(s0)||s0) : s0); }catch(_){ return s0; }
}
function cohortPackData(list){
  const rows = list.map(cohortPackRow);
  let total = null, left = 0, code = '';
  try{
    if((typeof canViewValues!=='function' || canViewValues()) && typeof fxHome==='function'){
      let sum = 0;
      /* SUM WHAT HAS A FIGURE WE CAN STAND BEHIND. `converted:false` with
         `missing:false` is a contract ALREADY in the workspace's own currency
         — a real number, not a failure — so the test is `!missing`. Counting
         only the converted ones read every home-currency agreement as zero,
         which is how this line first printed "0 KES" over sixty-two million. */
      list.forEach(c=>{ const h = fxHome(c); if(h && !h.missing) sum += (h.v||0); });
      total = sum;
      code = (typeof fxHomeCode==='function' ? fxHomeCode() : '') || '';
      /* fxMissing answers a MAP of currency code -> how many, not a count. */
      if(typeof fxMissing==='function'){
        const m = fxMissing(list) || {};
        left = Object.keys(m).reduce((n,k)=>n+(m[k]||0),0);
      }
    }
  }catch(_){ total=null; }
  return { rows, total, left, code, when:_coDay((typeof isoDay==='function'?isoDay(new Date()):new Date().toISOString().slice(0,10))) };
}
const COHORT_PACK_TONE = { lapsed:'#b0453c', missing:'#b0453c', soon:'#9a6b12', held:'#3f6f5e' };
function cohortPackHtml(d){
  const e = _coEsc;
  const docLine = r => r.docs.length
    ? r.docs.map(x=>`<span style="display:inline-block;margin:0 10px 3px 0;color:${COHORT_PACK_TONE[x.state]||'#4a5a57'}">${e(x.desc)}${x.until?` &middot; ${e(x.until)}`:''}${x.state==='missing'?' &middot; never supplied':''}${x.state==='lapsed'?' &middot; lapsed':''}</span>`).join('')
    : '<span style="color:#8a9794">None recorded</span>';
  const body = d.rows.map(r=>`
    <section style="page-break-inside:avoid;border:1px solid #e2e6e5;border-radius:2px;padding:16px 18px;margin:0 0 14px">
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:baseline;margin-bottom:8px">
        <h2 style="margin:0;font-size:15px;font-weight:700;color:#1B2A28">${e(r.ref||r.id)} &nbsp;${e(r.name)}</h2>
        <span style="font-size:12px;color:#5F6D6B">${e(r.status)}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;color:#1B2A28">
        <tr><td style="width:150px;padding:2px 0;color:#5F6D6B">Counterparty</td><td>${e(r.who)||'&mdash;'}</td>
            <td style="width:150px;padding:2px 0;color:#5F6D6B">Our entity</td><td>${e(r.party)||'&mdash;'}</td></tr>
        <tr><td style="padding:2px 0;color:#5F6D6B">Value stream</td><td>${e(r.stream)||'&mdash;'}</td>
            <td style="padding:2px 0;color:#5F6D6B">Value</td><td>${e(r.value)||'&mdash;'}</td></tr>
        <tr><td style="padding:2px 0;color:#5F6D6B">Signed</td><td>${e(r.signed)||'&mdash;'}</td>
            <td style="padding:2px 0;color:#5F6D6B">Expires</td><td>${e(r.expiry)||'&mdash;'}</td></tr>
        <tr><td style="padding:2px 0;color:#5F6D6B">Signature proven by</td><td>${e(r.assurance)||'&mdash;'}</td>
            <td style="padding:2px 0;color:#5F6D6B">Outstanding</td><td>${r.open} obligation${r.open===1?'':'s'}${r.overdue?` &middot; <b style="color:#b0453c">${r.overdue} overdue</b>`:''}${r.asks?` &middot; ${r.asks} open point${r.asks===1?'':'s'}`:''}</td></tr>
      </table>
      <p style="margin:9px 0 0;font-size:12px;line-height:1.6"><span style="color:#5F6D6B">Documents they must hold &nbsp;</span>${docLine(r)}</p>
    </section>`).join('');
  const num = n => { try{ return Number(n).toLocaleString(typeof jxLocale==='function'?jxLocale():undefined); }catch(_){ return String(n); } };
  const totalLine = (d.total!=null)
    ? `<p style="margin:4px 0 0;font-size:13px;color:#1B2A28">On paper: <b>${d.code?e(d.code)+' ':''}${e(num(d.total))}</b>${d.left?` <span style="color:#9a6b12">&middot; ${d.left} left out, no rate on file</span>`:''}</p>`
    : '';
  return `<!doctype html><html><head><meta charset="utf-8"><title>Diligence pack</title>
  <style>@media print{ body{background:#fff} .noprint{display:none} }</style></head>
  <body style="margin:0;background:#f4f6f5;font:13px 'Geist','IBM Plex Sans',-apple-system,Segoe UI,Arial,sans-serif;color:#1B2A28">
    <div style="max-width:940px;margin:0 auto;padding:28px 24px 60px">
      <header style="margin:0 0 18px">
        <h1 style="margin:0;font-size:22px;font-weight:700">Diligence pack</h1>
        <p style="margin:4px 0 0;font-size:13px;color:#5F6D6B">${d.rows.length} agreement${d.rows.length===1?'':'s'} &middot; ${e(d.when)}</p>
        ${totalLine}
        <p style="margin:8px 0 0;font-size:12px;color:#5F6D6B;line-height:1.6">Every line here is read off the record. Nothing was written by a model, and nothing in this pack is an opinion.</p>
        <button class="noprint" onclick="window.print()" style="margin-top:12px;font:inherit;font-size:12px;border:1px solid #3f6f5e;background:#fff;color:#3f6f5e;border-radius:2px;padding:6px 12px;cursor:pointer">Print</button>
      </header>
      ${body}
    </div></body></html>`;
}
function cohortPack(list){
  let w=null; try{ w=window.open('','_blank'); }catch(_){ w=null; }
  if(!w){ toast(i18t('co_h_popup'),'err'); return false; }
  let html='';
  try{ html = cohortPackHtml(cohortPackData(list)); }
  catch(e){ html = `<!doctype html><body style="font:15px Arial;padding:40px;color:#374151">${_coEsc(i18t('co_h_pack_failed'))}</body>`; }
  try{ w.document.open(); w.document.write(html); w.document.close(); }catch(_){}
  return true;
}

/* A name this module defines and another reaches through `window` is
   unreachable unless it is on this list — f232 sweeps for it. */
Object.assign(window,{COHORT_WAVE,COHORT_ACTS,COHORT_PACK_TONE,cohortSet,cohortBusy,cohortButtonHtml,
  cohortCloseMenu,cohortWire,cohortRun,cohortStop,cohortAct,cohortAmendAsk,cohortAmendRun,
  cohortAskDocAsk,cohortAskDocRun,cohortPack,cohortPackData,cohortPackHtml,cohortPackRow,
  cohortProgressOpen,cohortReport,_coDay});
try{ cohortWire(); }catch(_){}
