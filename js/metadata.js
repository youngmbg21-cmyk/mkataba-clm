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
  // flatten the source document's line wrapping — these patterns read across
  // clauses ("…laws of the\nRepublic of Kenya") and would otherwise stop at a break
  const t = String(text||'').replace(/\s+/g,' '); const conf = {};
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

/* ---- what actually gets sent for extraction ----
   A blind head-slice sent the first eight to twelve pages of a long agreement
   and nothing else — but renewal, termination, notice and expiry clauses
   usually sit at the BACK, so exactly the fields the reminder system depends on
   were the ones most likely to be missing or wrong.

   Instead we assemble: the front (parties, recitals, definitions, commercial
   terms), the back (signature blocks, schedules, execution dates), and a window
   around every mention of the term-critical vocabulary — merged where they
   overlap, joined in original document order, with explicit markers so the
   model knows text was elided and does not infer anything from the gaps. */
const AI_PAYLOAD_MAX = () => Number((state.aiCfg&&state.aiCfg.limits&&state.aiCfg.limits.maxChars)||60000);
const EXTRACT_FRONT = 15000, EXTRACT_BACK = 10000, EXTRACT_WINDOW = 1500;
/* Lower `prio` = kept longer. When the budget runs out the lowest-priority
   windows are dropped first — definitions before termination, as it should be:
   a missing definition costs a label, a missing termination clause costs the
   renewal reminder. */
const EXTRACT_TERMS = [
  { prio:1, re:/renew|terminat|expir|notice|term of this agreement|duration/gi },
  { prio:2, re:/govern|jurisdiction|payment|invoice|price|escalat/gi },
  { prio:3, re:/stamp duty|force majeure|liabilit|indemnit/gi },
  { prio:4, re:/assign|confidential/gi },
];
const _clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
/* Merge overlapping / touching spans and return them in document order. */
function _mergeSpans(spans){
  const s=spans.slice().sort((a,b)=>a.start-b.start);
  const out=[];
  for(const sp of s){
    const last=out[out.length-1];
    if(last && sp.start<=last.end) last.end=Math.max(last.end, sp.end);
    else out.push({ start:sp.start, end:sp.end });
  }
  return out;
}
const _spanLen = spans => spans.reduce((a,s)=>a+(s.end-s.start),0);

function buildExtractionPayload(text, opts={}){
  const t = String(text||'');
  const cap = Math.max(2000, Number(opts.maxChars||AI_PAYLOAD_MAX()));
  if(t.length<=cap) return { text:t, sections:1, omitted:0, full:true };

  // The anchors are never dropped. If they alone exceed the budget, split it
  // 60/40 between them rather than losing the back of the document entirely.
  let front=EXTRACT_FRONT, back=EXTRACT_BACK;
  if(front+back>cap){ front=Math.floor(cap*0.6); back=cap-front; }
  let accepted=[{ start:0, end:Math.min(front,t.length) },
                { start:Math.max(0,t.length-back), end:t.length }];
  accepted=_mergeSpans(accepted);

  // Candidate windows around every term-critical mention, in priority order.
  const cands=[];
  for(const { prio, re } of EXTRACT_TERMS){
    re.lastIndex=0; let m;
    while((m=re.exec(t))){
      cands.push({ prio, order:m.index,
        start:_clamp(m.index-EXTRACT_WINDOW,0,t.length),
        end:_clamp(m.index+m[0].length+EXTRACT_WINDOW,0,t.length) });
      if(re.lastIndex===m.index) re.lastIndex++;   // zero-width guard
    }
  }
  cands.sort((a,b)=> a.prio-b.prio || a.order-b.order);

  // Greedily take windows while they fit. A window that does not fit is skipped
  // rather than ending the loop — a later, smaller one may still fit, and the
  // priority order is preserved either way.
  let dropped=0;
  for(const c of cands){
    const trial=_mergeSpans(accepted.concat([{start:c.start,end:c.end}]));
    if(_spanLen(trial)<=cap) accepted=trial; else dropped++;
  }

  // Join in original document order, naming every gap so the model knows text
  // was elided and does not read meaning into the join.
  const parts=[]; let cursor=0, omitted=0;
  for(const s of accepted){
    if(s.start>cursor){ const gap=s.start-cursor; omitted+=gap;
      parts.push(`\n\n[... ${gap.toLocaleString('en-KE')} characters omitted ...]\n\n`); }
    parts.push(t.slice(s.start,s.end));
    cursor=s.end;
  }
  if(cursor<t.length){ const gap=t.length-cursor; omitted+=gap;
    parts.push(`\n\n[... ${gap.toLocaleString('en-KE')} characters omitted ...]`); }
  return { text:parts.join(''), sections:accepted.length, omitted, dropped, full:false, sourceChars:t.length };
}

/* ---- thorough mode ----
   Off by default. When on, the WHOLE document is read in overlapping 30,000-
   character windows, one deep-tier extraction per window, merged field by
   field. It multiplies cost, which the settings UI and the pre-flight estimate
   both say plainly. */
const THOROUGH_CHUNK = 30000, THOROUGH_OVERLAP = 3000;
function thoroughChunks(text){
  const t=String(text||'');
  if(t.length<=THOROUGH_CHUNK) return [t];
  const out=[]; let i=0;
  while(i<t.length){
    out.push(t.slice(i, i+THOROUGH_CHUNK));
    if(i+THOROUGH_CHUNK>=t.length) break;
    i += THOROUGH_CHUNK-THOROUGH_OVERLAP;
  }
  return out;
}
const CONF_RANK={ high:3, medium:2, low:1 };
/* Later chunks win a tie for the fields that live at the back of an agreement;
   earlier chunks win for the fields that are settled on page one. Anything not
   listed defaults to earlier-wins, which is the safer bet for identity fields. */
const LATE_WINS = new Set(['expiryDate','renewalType','noticePeriodDays']);
function mergeThorough(results){
  const out={ confidence:{}, sourceSpans:{} };
  const best={};
  results.forEach((meta,i)=>{
    if(!meta) return;
    for(const f of META_FIELDS){
      const k=f.k, v=meta[k];
      if(v==null || v==='' || (f.type==='num' && !(Number(v)>0))) continue;
      const rank=CONF_RANK[(meta.confidence||{})[k]]||1;
      const cur=best[k];
      if(!cur){ best[k]={ v, rank, i, span:(meta.sourceSpans||{})[k], conf:(meta.confidence||{})[k]||'low' }; continue; }
      if(rank>cur.rank){ best[k]={ v, rank, i, span:(meta.sourceSpans||{})[k], conf:(meta.confidence||{})[k]||'low' }; continue; }
      if(rank===cur.rank && LATE_WINS.has(k) && i>cur.i)
        best[k]={ v, rank, i, span:(meta.sourceSpans||{})[k], conf:(meta.confidence||{})[k]||'low' };
      // ties on every other field keep the earlier chunk's answer
    }
  });
  for(const [k,b] of Object.entries(best)){
    out[k]=b.v; out.confidence[k]=b.conf;
    if(b.span) out.sourceSpans[k]=b.span;
  }
  out._thorough={ chunks:results.length, read:results.filter(Boolean).length };
  return out;
}

/* ---- the single server-Copilot extraction call ----
   One place that decides what text is sent (buildExtractionPayload, not a blind
   head-slice) and which budget it draws on. Throws on failure so the caller can
   distinguish a spend ceiling from a transport error. */
async function aiExtractMetadata(text, opts={}){
  const thorough = opts.thorough!=null ? !!opts.thorough
    : !!(state.aiCfg&&state.aiCfg.limits&&state.aiCfg.limits.thoroughExtract);
  const t = String(text||'');

  if(thorough && t.length>THOROUGH_CHUNK){
    // one deep-tier call per overlapping window, merged field by field
    const chunks = thoroughChunks(t);
    const results = [];
    for(let i=0;i<chunks.length;i++){
      if(typeof opts.onChunk==='function') opts.onChunk(i, chunks.length);
      try{
        const r = await api('ai/extract','POST',
          { text: chunks[i], allowance: !!opts.allowance, thorough: true, part: i+1, parts: chunks.length });
        const m = r.metadata || {};
        if(r.sourceSpans) m.sourceSpans = r.sourceSpans;
        results.push(m);
      }catch(e){
        // a budget ceiling mid-way still leaves everything read so far usable
        if(!results.length) throw e;
        results.push(null);
        break;
      }
    }
    const merged = mergeThorough(results);
    merged._payload = { chars:t.length, sections:chunks.length, omitted:0, thorough:true };
    return merged;
  }

  // one Copilot call per contract — a 25-file batch has to get through the 15-minute
  // light-tier limit of 40 calls
  const payload = buildExtractionPayload(t);
  const r = await api('ai/extract','POST', { text: payload.text, allowance: !!opts.allowance });
  const meta = r.metadata || {};
  if(r.sourceSpans) meta.sourceSpans = r.sourceSpans;
  meta._payload = { chars: payload.text.length, sections: payload.sections,
    omitted: payload.omitted, sourceChars: payload.sourceChars||t.length };
  // which interface language the model was asked to write in (B7/step 5)
  meta._lang = (typeof getLang==='function'?getLang():'en');
  return meta;
}

/* ---- run extraction: server Copilot if configured, else heuristic ---- */
async function extractMetadata(text, seed, opts={}){
  let meta = null;
  if(API_MODE() && state.aiConfigured){
    try{ meta=await aiExtractMetadata(text, opts); meta._source='ai'; }
    catch(e){ /* fall through to heuristic — the 429 toast has already fired */ }
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
  const p = meta._payload;
  // Say how much of the document was actually read — "Copilot-extracted" over the
  // first eight pages is a materially different claim from over all of it.
  const coverage = !p ? ''
    : p.thorough ? ` · whole document read in ${p.sections} overlapping section${p.sections===1?'':'s'} (thorough mode)`
    : p.omitted ? ` · read the front, the back and ${p.sections-2>0?p.sections-2:0} clause window${p.sections-2===1?'':'s'} of a ${Number(p.sourceChars||0).toLocaleString('en-KE')}-character document`
    : ` · read the whole ${Number(p.chars||0).toLocaleString('en-KE')}-character document`;
  const src = (meta._source==='ai' ? 'Copilot-extracted' : 'Pattern-matched (no Copilot key)') + coverage;
  /* The phrase each value came from, shown under the field. This is what turns
     the confirm step from a leap of faith into a glance — the same
     verbatim-quoting pattern the clause review already uses. */
  const spans = meta.sourceSpans||{};
  const esc = s => String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  const spanLine = k => { const q=spans[k]; if(!q) return '';
    const t=String(q).replace(/\s+/g,' ').trim().slice(0,180);
    if(!t) return '';
    return `<span style="display:block;margin-top:3px;font-size:10.5px;line-height:1.45;color:var(--color-neutral-600)">found: <i>“${esc(t)}”</i></span>`; };
  const field = f => {
    const v = meta[f.k]!=null ? meta[f.k] : '';
    const low = c[f.k]==='low';
    const ring = low ? 'border-gold-400 bg-gold-500/5' : 'border-inputln bg-white';
    if(f.type==='select'){
      return `<label class="block"><span class="text-[11px] font-600 text-ink/70">${f.label}${badge(c[f.k])}</span>
        <select data-mf="${f.k}" class="mt-1 w-full rounded-lg border ${ring} px-2.5 py-2 text-sm outline-none focus:border-brand-500">
          ${f.opts.map(o=>`<option value="${o}" ${v===o?'selected':''}>${RENEWAL_LABEL[o]||o}</option>`).join('')}</select>${spanLine(f.k)}</label>`;
    }
    const it = f.type==='date'?'date':(f.type==='num'?'number':'text');
    return `<label class="block"><span class="text-[11px] font-600 text-ink/70">${f.label}${badge(c[f.k])}</span>
      <input data-mf="${f.k}" type="${it}" value="${String(v).replace(/"/g,'&quot;')}" class="mt-1 w-full rounded-lg border ${ring} px-2.5 py-2 text-sm outline-none focus:border-brand-500"/>${spanLine(f.k)}</label>`;
  };
  openModal(`
    <div class="p-6 max-w-lg">
      <div class="flex items-center gap-2 mb-1"><span class="text-gold-600">${icon('sparkle','w-4 h-4')}</span>
        <h3 class="font-serif font-600 text-lg text-ink">Review extracted details</h3></div>
      <p class="text-xs text-ink/60 mb-4">${src}. Check each field — <span class="text-amber font-600">low-confidence</span> fields are highlighted. Nothing is saved until you confirm.</p>
      ${opts.ocrNotice?`<div style="display:flex;align-items:flex-start;gap:8px;border:1px solid #f0e3c2;background:#fbf4e3;color:#7d5a14;border-radius:5px;padding:8px 11px;font-size:11.5px;line-height:1.55;margin:-8px 0 14px">
        <span style="flex:none;margin-top:1px">${icon('scan','w-3.5 h-3.5')}</span>
        <span>${String(opts.ocrNotice).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))} Every field below is capped at <b>medium</b> confidence until you confirm it.</span></div>`:''}
      <div class="grid grid-cols-2 gap-3">${META_FIELDS.map(field).join('')}</div>
      <div class="flex justify-end gap-2 mt-5">
        <button id="mr-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">Cancel</button>
        <button id="mr-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${opts.saveLabel||'Confirm & save'}</button>
      </div>
    </div>`);
  // A scrim click closes the modal (openModal wiring) without telling the
  // caller — for an upload that silently discarded the whole contract. Treat
  // it exactly like Cancel so the pending save still completes.
  let settled=false;
  document.getElementById('modal-scrim').addEventListener('click',()=>{ if(!settled){ settled=true; if(opts.onCancel) opts.onCancel(); } });
  document.getElementById('mr-cancel').addEventListener('click',()=>{ settled=true; closeModal(); if(opts.onCancel) opts.onCancel(); });
  document.getElementById('mr-save').addEventListener('click',()=>{
    settled=true;
    const out={ confidence:{} };
    document.querySelectorAll('[data-mf]').forEach(el=>{ const k=el.getAttribute('data-mf'); let v=el.value;
      const f=META_FIELDS.find(x=>x.k===k); if(f.type==='num') v=v===''?0:Number(v);
      out[k]=v; out.confidence[k]= (c[k]&&el.value===String(meta[k]!=null?meta[k]:''))?c[k]:'high'; });
    // keep the evidence with the record — a reviewer later can see what phrase
    // each value was read from, and how much of the document was read
    if(meta.sourceSpans) out.sourceSpans=meta.sourceSpans;
    if(meta._payload) out._payload=meta._payload;
    if(meta._thorough) out._thorough=meta._thorough;
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

Object.assign(window,{META_FIELDS,RENEWAL_LABEL,heuristicExtract,buildExtractionPayload,thoroughChunks,mergeThorough,THOROUGH_CHUNK,EXTRACT_TERMS,aiExtractMetadata,extractMetadata,openMetaReview,runMetaBackfill});
