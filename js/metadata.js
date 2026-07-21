// HaTi — E1 metadata extraction ("file it for me"). Globals are
// window-attached (see components.js) so cross-module calls keep working.

/* Canonical metadata field set. Each contract may carry c.metadata with these
   keys and c.metadata.confidence[field] in {high,medium,low}. */
const META_FIELDS = [
  { k:'counterparty',     label:'Counterparty',   type:'text' },
  { k:'contractType',     label:'Contract type',  type:'text' },
  { k:'effectiveDate',    label:'Effective date', type:'date' },
  { k:'expiryDate',       label:'Expiry date',    type:'date' },
  { k:'value',            label:'Value',          type:'num'  },
  { k:'currency',         label:'Currency',       type:'text' },
  { k:'renewalType',      label:'Renewal',        type:'select', opts:['auto-renew','fixed','evergreen','unknown'] },
  { k:'noticePeriodDays', label:'Notice (days)',  type:'num'  },
  { k:'governingLaw',     label:'Governing law',  type:'text' },
  { k:'paymentTerms',     label:'Payment terms',  type:'text' },
];
const RENEWAL_LABEL = { 'auto-renew':'Auto-renew', fixed:'Fixed term', evergreen:'Evergreen', unknown:'Unknown', '':'—' };

/* ---- heuristic fallback: no API key, extract what regex reliably can ---- */
function heuristicExtract(text){
  const t = String(text||''); const conf = {};
  const set = (o,k,v,c)=>{ if(v!=null && v!==''){ o[k]=v; conf[k]=c; } };
  const m = {};
  // dates: dd/mm/yyyy, d Month yyyy, yyyy-mm-dd
  const dates = [];
  const push = iso => { if(iso && !dates.includes(iso)) dates.push(iso); };
  const MON = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
  (t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/g)||[]).forEach(push);
  (t.match(/\b(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})\b/g)||[]).forEach(s=>{ const [d,mo,y]=s.split(/[\/.]/); push(`${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`); });
  (t.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\b/g)||[]).forEach(s=>{ const p=s.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/); const mo=MON[p[2].slice(0,3).toLowerCase()]; if(mo) push(`${p[3]}-${String(mo).padStart(2,'0')}-${String(p[1]).padStart(2,'0')}`); });
  dates.sort();
  if(dates.length){ set(m,'effectiveDate',dates[0],'low'); if(dates.length>1) set(m,'expiryDate',dates[dates.length-1],'low'); }
  // value: KES / Kshs / USD amounts
  const val = t.match(/\b(?:KES|Kshs?|USD|US\$|\$)\s*([\d,]+(?:\.\d+)?)\s*(million|m|bn|billion)?/i);
  if(val){ let n=Number(val[1].replace(/,/g,'')); const u=(val[2]||'').toLowerCase(); if(u==='million'||u==='m') n*=1e6; if(u==='bn'||u==='billion') n*=1e9; set(m,'value',n,'low'); const cur=/usd|\$/i.test(val[0])?'USD':'KES'; set(m,'currency',cur,'low'); }
  // governing law
  const gl = t.match(/govern(?:ed|ing)[^.]*\blaws?\s+of\s+([A-Z][A-Za-z &]+?)[.,\n)]/i);
  if(gl) set(m,'governingLaw',gl[1].trim().replace(/\s+the\s+$/i,''),'low');
  // payment terms
  const pay = t.match(/\bwithin\s+(\d{1,3})\s+days\b[^.]*\b(?:invoice|payment|delivery)\b/i) || t.match(/\b(?:net|payment terms?)\s*[:\-]?\s*(\d{1,3})\s*days\b/i);
  if(pay) set(m,'paymentTerms',pay[1]+' days','low');
  // notice period
  const notice = t.match(/\b(\d{1,3})\s+(?:days|months?)['’]?\s+(?:written\s+)?notice\b/i);
  if(notice){ let d=Number(notice[1]); if(/month/i.test(notice[0])) d*=30; set(m,'noticePeriodDays',d,'low'); }
  // renewal
  if(/automatically\s+renew|auto-?renew/i.test(t)) set(m,'renewalType','auto-renew','low');
  else if(/evergreen|continue\s+(?:indefinitely|until\s+terminated)/i.test(t)) set(m,'renewalType','evergreen','low');
  else if(/fixed\s+term|expires?\s+on|term\s+of\s+\d/i.test(t)) set(m,'renewalType','fixed','low');
  m.confidence = conf;
  return m;
}

/* ---- run extraction: server AI if configured, else heuristic ---- */
async function extractMetadata(text, seed){
  let meta = null;
  if(API_MODE() && state.aiConfigured){
    try{ const r=await api('ai/extract','POST',{ text:String(text||'').slice(0,24000) }); meta=r.metadata; meta._source='ai'; }
    catch(e){ /* fall through to heuristic */ }
  }
  if(!meta){ meta=heuristicExtract(text); meta._source='heuristic'; }
  // seed with what the uploader already typed (higher trust than a low-conf guess)
  if(seed){ meta.confidence=meta.confidence||{};
    if(seed.counterparty){ meta.counterparty=seed.counterparty; meta.confidence.counterparty='high'; }
    if(seed.value){ meta.value=seed.value; meta.confidence.value='high'; if(!meta.currency) meta.currency='KES'; }
    if(seed.expiry){ meta.expiryDate=seed.expiry; meta.confidence.expiryDate='high'; }
  }
  return meta;
}

/* ---- review-and-confirm panel: the human always confirms before save ---- */
function openMetaReview(meta, onConfirm, opts={}){
  const c = meta.confidence||{};
  const badge = lvl => lvl==='low' ? `<span class="ml-1.5 text-[9px] font-mono uppercase tracking-wide text-amber bg-gold-500/12 rounded px-1 py-0.5">low</span>`
    : lvl==='medium' ? `<span class="ml-1.5 text-[9px] font-mono uppercase tracking-wide text-brand-600 bg-brand-50 rounded px-1 py-0.5">med</span>` : '';
  const src = meta._source==='ai' ? 'AI-extracted' : 'Pattern-matched (no AI key)';
  const field = f => {
    const v = meta[f.k]!=null ? meta[f.k] : '';
    const low = c[f.k]==='low';
    const ring = low ? 'border-gold-400 bg-gold-500/5' : 'border-inputln bg-white';
    if(f.type==='select'){
      return `<label class="block"><span class="text-[11px] font-600 text-ink/70">${f.label}${badge(c[f.k])}</span>
        <select data-mf="${f.k}" class="mt-1 w-full rounded-lg border ${ring} px-2.5 py-2 text-sm outline-none focus:border-brand-500">
          ${f.opts.map(o=>`<option value="${o}" ${v===o?'selected':''}>${RENEWAL_LABEL[o]||o}</option>`).join('')}</select></label>`;
    }
    const it = f.type==='date'?'date':(f.type==='num'?'number':'text');
    return `<label class="block"><span class="text-[11px] font-600 text-ink/70">${f.label}${badge(c[f.k])}</span>
      <input data-mf="${f.k}" type="${it}" value="${String(v).replace(/"/g,'&quot;')}" class="mt-1 w-full rounded-lg border ${ring} px-2.5 py-2 text-sm outline-none focus:border-brand-500"/></label>`;
  };
  openModal(`
    <div class="p-6 max-w-lg">
      <div class="flex items-center gap-2 mb-1"><span class="text-gold-600">${icon('sparkle','w-4 h-4')}</span>
        <h3 class="font-serif font-600 text-lg text-ink">Review extracted details</h3></div>
      <p class="text-xs text-ink/60 mb-4">${src}. Check each field — <span class="text-amber font-600">low-confidence</span> fields are highlighted. Nothing is saved until you confirm.</p>
      <div class="grid grid-cols-2 gap-3">${META_FIELDS.map(field).join('')}</div>
      <div class="flex justify-end gap-2 mt-5">
        <button id="mr-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">Cancel</button>
        <button id="mr-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${opts.saveLabel||'Confirm & save'}</button>
      </div>
    </div>`);
  document.getElementById('mr-cancel').addEventListener('click',()=>{ closeModal(); if(opts.onCancel) opts.onCancel(); });
  document.getElementById('mr-save').addEventListener('click',()=>{
    const out={ confidence:{} };
    document.querySelectorAll('[data-mf]').forEach(el=>{ const k=el.getAttribute('data-mf'); let v=el.value;
      const f=META_FIELDS.find(x=>x.k===k); if(f.type==='num') v=v===''?0:Number(v);
      out[k]=v; out.confidence[k]= (c[k]&&el.value===String(meta[k]!=null?meta[k]:''))?c[k]:'high'; });
    out.confirmedAt=nowISO(); out.confirmedBy=currentUser()?.name||'';
    closeModal(); onConfirm(out);
  });
}

/* ---- backfill: extract metadata for existing uploads, one at a time,
   each queued for human review before it is written. ---- */
async function runMetaBackfill(){
  const todo = state.contracts.filter(c=>isUpload(c) && !(c.metadata&&c.metadata.confirmedAt));
  if(!todo.length){ toast('Every uploaded contract already has confirmed details'); return; }
  const lbl=document.getElementById('meta-backfill-lbl');
  let done=0;
  const next=async()=>{
    if(!todo.length){ if(lbl) lbl.textContent='Extract metadata for existing contracts'; toast(`Filed ${done} contract${done===1?'':'s'}`); return; }
    const c=todo.shift();
    if(lbl) lbl.textContent=`Reading ${c.name}… (${todo.length} left)`;
    try{ await ensureFull(c); }catch(e){}
    const text=(c.upload&&c.upload.extractedText)||contractPlainText(c);
    if(!text || text.length<200){ done+=0; return next(); }   // nothing to read; skip silently
    const meta=await extractMetadata(text, {counterparty:c.counterparty, value:c.value, expiry:c.expiry});
    openMetaReview(meta, m=>{ applyMetadata(c, m); persist(c); done++; next(); },
      { saveLabel:'Save & next', onCancel:next });
  };
  next();
}

Object.assign(window,{META_FIELDS,RENEWAL_LABEL,heuristicExtract,extractMetadata,openMetaReview,runMetaBackfill});
